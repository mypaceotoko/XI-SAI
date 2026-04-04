/**
 * SE・BGM管理
 * Web Audio APIを使って音を生成（外部ファイル不要）
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  /** ミュート切り替え */
  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /** サイコロ移動音 */
  playMove(): void {
    if (this.muted) return;
    this.playTone(220, 0.05, 'square', 0.15);
  }

  /** サイコロ押し音 */
  playPush(): void {
    if (this.muted) return;
    this.playTone(330, 0.08, 'sawtooth', 0.12);
  }

  /** 消去音 */
  playClear(chainCount: number): void {
    if (this.muted) return;
    // 連鎖に応じてピッチを上げる
    const baseFreq = 440 + chainCount * 80;
    this.playTone(baseFreq, 0.15, 'sine', 0.2);
    // 和音
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.12, 'sine', 0.15), 50);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.1, 'sine', 0.1), 100);
  }

  /** Happy One 音 */
  playHappyOne(): void {
    if (this.muted) return;
    this.playTone(880, 0.2, 'sine', 0.25);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.2), 200);
  }

  /** コンボ音 */
  playCombo(combo: number): void {
    if (this.muted) return;
    const freq = 600 + combo * 50;
    this.playTone(freq, 0.1, 'triangle', 0.15);
  }

  /** ゲームオーバー音 */
  playGameOver(): void {
    if (this.muted) return;
    this.playTone(200, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.15), 200);
    setTimeout(() => this.playTone(100, 0.5, 'sawtooth', 0.1), 400);
  }

  /** 汎用トーン再生 */
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
}
