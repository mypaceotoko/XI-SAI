/**
 * SE・BGM管理
 * Web Audio API を使ってすべてを合成（外部ファイル不要）
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private seMuted = false;
  private bgmMuted = false;

  // ── BGM スケジューラー ──────────────────────────────────────
  private bgmPlaying = false;
  private bgmSchedulerTimer: number | null = null;
  private bgmNoteIndex = 0;
  private bgmNextNoteTime = 0;
  private bgmMasterGain: GainNode | null = null;

  // A マイナーペンタトニック：120BPM、8分音符 = 0.25s
  private readonly BGM_T8 = 0.25; // 8th note duration (s)
  private readonly BGM_VOL = 0.18;

  // [melodyFreq, bassFreq, durIn8ths]  0 = rest
  private readonly BGM_PATTERN: [number, number, number][] = [
    [330, 110, 1], [0,   0,   1], [262, 0,   1], [0,   0,   1],
    [220, 110, 1], [262, 0,   1], [330, 0,   1], [0,   0,   1],
    [392, 98,  1], [0,   0,   1], [330, 0,   1], [0,   0,   1],
    [220, 110, 2], [0,   0,   1], [0,   0,   1], [0,   0,   1],
    [330, 110, 1], [0,   0,   1], [392, 0,   1], [440, 0,   1],
    [392, 98,  1], [330, 0,   1], [262, 0,   1], [0,   0,   1],
    [294, 110, 1], [262, 0,   1], [247, 0,   1], [0,   0,   1],
    [220, 110, 2], [0,   0,   1], [0,   0,   1], [0,   0,   1],
  ];

  // ── 内部ユーティリティ ──────────────────────────────────────

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  /** iOS / Chrome の autoplay 制限解除（最初のユーザー操作時に呼ぶ） */
  resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ── SE ─────────────────────────────────────────────────────

  toggleSEMute(): boolean {
    this.seMuted = !this.seMuted;
    return this.seMuted;
  }

  isSEMuted(): boolean { return this.seMuted; }

  playMove(): void {
    if (this.seMuted) return;
    this.playTone(220, 0.05, 'square', 0.15);
  }

  playPush(): void {
    if (this.seMuted) return;
    this.playTone(330, 0.08, 'sawtooth', 0.12);
  }

  playClear(chainCount: number): void {
    if (this.seMuted) return;
    const baseFreq = 440 + chainCount * 80;
    this.playTone(baseFreq, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.12, 'sine', 0.15), 50);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 'sine', 0.1), 100);
  }

  playHappyOne(): void {
    if (this.seMuted) return;
    this.playTone(880, 0.2, 'sine', 0.25);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.2), 200);
  }

  playCombo(combo: number): void {
    if (this.seMuted) return;
    const freq = 600 + combo * 50;
    this.playTone(freq, 0.1, 'triangle', 0.15);
  }

  playGameOver(): void {
    if (this.seMuted) return;
    this.playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.15), 200);
    setTimeout(() => this.playTone(100, 0.5, 'sawtooth', 0.1), 400);
  }

  playGameClear(): void {
    if (this.seMuted) return;
    const notes = [440, 550, 660, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sine', 0.2), i * 120);
    });
  }

  // ── BGM ────────────────────────────────────────────────────

  /** BGMミュート切り替え */
  toggleBGMMute(): boolean {
    this.bgmMuted = !this.bgmMuted;
    if (this.bgmMasterGain) {
      this.bgmMasterGain.gain.setTargetAtTime(
        this.bgmMuted ? 0 : this.BGM_VOL,
        this.getContext().currentTime,
        0.1,
      );
    }
    return this.bgmMuted;
  }

  isBGMMuted(): boolean { return this.bgmMuted; }

  /** BGM開始（最初のユーザー操作後に呼ぶ） */
  startBGM(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.bgmNoteIndex = 0;

    const ctx = this.getContext();
    // マスターゲイン（ミュート用）
    this.bgmMasterGain = ctx.createGain();
    this.bgmMasterGain.gain.setValueAtTime(
      this.bgmMuted ? 0 : this.BGM_VOL,
      ctx.currentTime,
    );
    this.bgmMasterGain.connect(ctx.destination);

    this.bgmNextNoteTime = ctx.currentTime + 0.1;
    this.runBGMScheduler();
  }

  /** BGM停止 */
  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmSchedulerTimer !== null) {
      clearTimeout(this.bgmSchedulerTimer);
      this.bgmSchedulerTimer = null;
    }
    if (this.bgmMasterGain) {
      this.bgmMasterGain.gain.setTargetAtTime(0, this.getContext().currentTime, 0.05);
      this.bgmMasterGain = null;
    }
  }

  /**
   * ルックアヘッドスケジューラー
   * 200ms 先まで音符を予約し、50ms ごとに再実行する。
   * これにより Web Audio の精密タイミングとブラウザの遅延を両立する。
   */
  private runBGMScheduler(): void {
    if (!this.bgmPlaying || !this.bgmMasterGain) return;

    const ctx = this.getContext();
    const LOOKAHEAD = 0.2; // 先読み時間(s)

    while (this.bgmNextNoteTime < ctx.currentTime + LOOKAHEAD) {
      const step = this.BGM_PATTERN[this.bgmNoteIndex];
      const [melFreq, bassFreq, dur] = step;
      const noteDur = dur * this.BGM_T8;

      if (melFreq > 0 && this.bgmMasterGain) {
        this.scheduleBGMNote(melFreq, this.bgmNextNoteTime, noteDur * 0.85, 'triangle', 0.6);
      }
      if (bassFreq > 0 && this.bgmMasterGain) {
        this.scheduleBGMNote(bassFreq * 0.5, this.bgmNextNoteTime, noteDur * 1.2, 'sine', 0.5);
      }

      this.bgmNextNoteTime += noteDur;
      this.bgmNoteIndex = (this.bgmNoteIndex + 1) % this.BGM_PATTERN.length;
    }

    this.bgmSchedulerTimer = window.setTimeout(() => this.runBGMScheduler(), 50);
  }

  private scheduleBGMNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    relVol: number,  // relative volume 0-1, multiplied by master
  ): void {
    if (!this.bgmMasterGain) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // ADSR envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(relVol, startTime + 0.02); // attack
      gain.gain.setValueAtTime(relVol * 0.7, startTime + 0.05);    // decay
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // release

      osc.connect(gain);
      gain.connect(this.bgmMasterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // AudioContext not available
    }
  }

  // ── 汎用トーン ──────────────────────────────────────────────

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio API not available
    }
  }

  /** レガシー互換: toggleMute は SE ミュートに委譲 */
  toggleMute(): boolean { return this.toggleSEMute(); }
}
