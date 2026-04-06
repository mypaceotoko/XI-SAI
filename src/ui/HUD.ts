import { ScoreData, GameMode } from '@/types';

/**
 * HUD (ヘッドアップディスプレイ)
 * スコア・コンボ・タイマー・モードラベルなどを表示する
 */
export class HUD {
  private container: HTMLElement;
  private scoreEl!: HTMLElement;
  private comboEl!: HTMLElement;
  private chainEl!: HTMLElement;
  private clearedEl!: HTMLElement;
  private timerEl!: HTMLElement;
  private timerBarEl!: HTMLElement;
  private modeEl!: HTMLElement;
  private notificationEl!: HTMLElement;
  private notificationTimer: number | null = null;

  constructor(parentEl: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.innerHTML = `
      <style>
        #hud {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          pointer-events: none;
          z-index: 10;
          padding: 6px 8px;
        }
        .hud-bar {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
          justify-content: flex-start;
          align-items: center;
        }
        .hud-stat {
          background: rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          padding: 3px 8px;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 6px;
          line-height: 1;
        }
        .hud-label {
          font-size: 9px;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .hud-value {
          font-size: 15px;
          font-weight: bold;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }
        .hud-value.score   { color: #ffdd44; }
        .hud-value.combo   { color: #ff6644; }
        .hud-value.chain   { color: #44ddff; }
        .hud-value.cleared { color: #44ff88; }

        /* モードラベル */
        #hud-mode {
          background: rgba(0,170,119,0.25);
          border: 1px solid rgba(0,255,170,0.3);
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: bold;
          color: #00ffaa;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        #hud-mode:empty { display: none; }

        /* タイマー（タイムアタック用） */
        #hud-timer-wrap {
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          padding: 3px 10px;
        }
        #hud-timer-wrap.visible { display: flex; }
        #hud-timer {
          font-size: 18px;
          font-weight: 900;
          color: #44ddff;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        #hud-timer.urgent { color: #ff4444; animation: timer-pulse 0.5s infinite alternate; }
        @keyframes timer-pulse { from { opacity: 1; } to { opacity: 0.4; } }
        #hud-timer-bar-bg {
          width: 60px;
          height: 3px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
          overflow: hidden;
        }
        #hud-timer-bar {
          height: 100%;
          background: #44ddff;
          border-radius: 2px;
          transition: width 0.5s linear, background 0.5s;
        }

        /* スマホ縦画面 */
        @media (max-width: 600px) {
          #hud { padding: 4px 6px; }
          .hud-bar { gap: 4px; }
          .hud-stat { padding: 2px 6px; border-radius: 4px; gap: 4px; }
          .hud-label { font-size: 8px; }
          .hud-value { font-size: 12px; }
          #hud-timer { font-size: 15px; }
          #hud-timer-bar-bg { width: 44px; }
        }

        @media (max-height: 500px) {
          #hud { padding: 2px 6px; }
          .hud-stat { padding: 2px 6px; }
          .hud-label { font-size: 8px; }
          .hud-value { font-size: 11px; }
        }

        /* 通知（コンボ・チェーンなど） */
        #notification {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) scale(1);
          font-size: 32px;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 0 20px rgba(255, 220, 50, 0.9), 0 2px 6px rgba(0,0,0,0.6);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          letter-spacing: 1px;
        }
        #notification.pop {
          animation: notif-pop 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        #notification.combo-big {
          font-size: 48px;
          text-shadow: 0 0 30px rgba(255, 100, 50, 0.95), 0 2px 8px rgba(0,0,0,0.7);
          color: #ff8844;
        }
        @keyframes notif-pop {
          0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.5); }
          15%  { opacity: 1;   transform: translate(-50%, -50%) scale(1.2); }
          30%  { opacity: 1;   transform: translate(-50%, -50%) scale(1.0); }
          70%  { opacity: 1;   transform: translate(-50%, -50%) scale(1.0); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(0.85); }
        }
        @media (max-width: 600px) {
          #notification { font-size: 24px; top: 35%; }
          #notification.combo-big { font-size: 36px; }
        }
      </style>
      <div class="hud-bar">
        <div class="hud-stat">
          <span class="hud-label">SCR</span>
          <span class="hud-value score" id="hud-score">0</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">CMB</span>
          <span class="hud-value combo" id="hud-combo">0</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">CHN</span>
          <span class="hud-value chain" id="hud-chain">0</span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">CLR</span>
          <span class="hud-value cleared" id="hud-cleared">0</span>
        </div>
        <div id="hud-mode"></div>
        <div id="hud-timer-wrap">
          <span id="hud-timer">60</span>
          <div id="hud-timer-bar-bg">
            <div id="hud-timer-bar" style="width:100%"></div>
          </div>
        </div>
      </div>
      <div id="notification"></div>
    `;
    parentEl.appendChild(this.container);

    this.scoreEl   = this.container.querySelector('#hud-score')!;
    this.comboEl   = this.container.querySelector('#hud-combo')!;
    this.chainEl   = this.container.querySelector('#hud-chain')!;
    this.clearedEl = this.container.querySelector('#hud-cleared')!;
    this.timerEl      = this.container.querySelector('#hud-timer')!;
    this.timerBarEl   = this.container.querySelector('#hud-timer-bar')!;
    this.modeEl       = this.container.querySelector('#hud-mode')!;
    this.notificationEl = this.container.querySelector('#notification')!;
  }

  /** スコア表示を更新 */
  updateScore(data: ScoreData): void {
    this.scoreEl.textContent   = data.score.toLocaleString();
    this.comboEl.textContent   = data.combo.toString();
    this.chainEl.textContent   = data.chainCount.toString();
    this.clearedEl.textContent = data.totalCleared.toString();
  }

  /** モードラベル表示 */
  showMode(mode: GameMode | null): void {
    const labels: Record<GameMode, string> = {
      endless:    'ENDLESS',
      timeattack: 'TIME ATTACK',
      combo:      'COMBO CHALLENGE',
    };
    this.modeEl.textContent = mode ? labels[mode] : '';
  }

  /** タイマー表示（timeattack用） */
  showTimer(remaining: number, total: number): void {
    const wrap = this.container.querySelector('#hud-timer-wrap')!;
    wrap.classList.add('visible');

    const secs = Math.ceil(remaining);
    this.timerEl.textContent = secs.toString();
    this.timerEl.classList.toggle('urgent', remaining <= 10);

    const pct = Math.max(0, remaining / total) * 100;
    this.timerBarEl.style.width = `${pct}%`;
    this.timerBarEl.style.background = remaining <= 10 ? '#ff4444' : '#44ddff';
  }

  /** タイマー非表示 */
  hideTimer(): void {
    const wrap = this.container.querySelector('#hud-timer-wrap')!;
    wrap.classList.remove('visible');
  }

  /** 通知メッセージを表示（コンボはアニメーション強め） */
  showNotification(text: string, isCombo = false, duration = 1600): void {
    if (this.notificationTimer !== null) {
      clearTimeout(this.notificationTimer);
    }
    // アニメーションリセット
    this.notificationEl.classList.remove('pop', 'combo-big');
    void this.notificationEl.offsetWidth; // reflow

    this.notificationEl.textContent = text;
    this.notificationEl.classList.add('pop');
    if (isCombo) this.notificationEl.classList.add('combo-big');

    this.notificationTimer = window.setTimeout(() => {
      this.notificationEl.classList.remove('pop', 'combo-big');
    }, duration);
  }

  /** クリーンアップ */
  dispose(): void {
    if (this.notificationTimer !== null) clearTimeout(this.notificationTimer);
    this.container.remove();
  }
}
