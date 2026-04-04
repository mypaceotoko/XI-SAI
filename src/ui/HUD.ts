import { ScoreData } from '@/types';

/**
 * HUD (ヘッドアップディスプレイ)
 * スコア、コンボ、連鎖数などを画面上に表示する
 */
export class HUD {
  private container: HTMLElement;
  private scoreEl!: HTMLElement;
  private comboEl!: HTMLElement;
  private chainEl!: HTMLElement;
  private clearedEl!: HTMLElement;
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
        .hud-value.score { color: #ffdd44; }
        .hud-value.combo { color: #ff6644; }
        .hud-value.chain { color: #44ddff; }
        .hud-value.cleared { color: #44ff88; }

        /* スマホ縦画面 */
        @media (max-width: 600px) {
          #hud { padding: 4px 6px; }
          .hud-bar { gap: 4px; }
          .hud-stat { padding: 2px 6px; border-radius: 4px; gap: 4px; }
          .hud-label { font-size: 8px; }
          .hud-value { font-size: 12px; }
        }

        /* スマホ横画面 */
        @media (max-height: 500px) {
          #hud { padding: 2px 6px; }
          .hud-stat { padding: 2px 6px; }
          .hud-label { font-size: 8px; }
          .hud-value { font-size: 11px; }
        }

        #notification {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 28px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 0 16px rgba(255, 255, 100, 0.8), 0 2px 4px rgba(0,0,0,0.5);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          white-space: nowrap;
        }
        #notification.visible { opacity: 1; }
        #notification.happy-one {
          color: #ff4444;
          text-shadow: 0 0 24px rgba(255, 50, 50, 0.9), 0 2px 4px rgba(0,0,0,0.5);
          font-size: 32px;
        }
        @media (max-width: 600px) {
          #notification { font-size: 22px; top: 35%; }
          #notification.happy-one { font-size: 26px; }
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
      </div>
      <div id="notification"></div>
    `;
    parentEl.appendChild(this.container);

    this.scoreEl = this.container.querySelector('#hud-score')!;
    this.comboEl = this.container.querySelector('#hud-combo')!;
    this.chainEl = this.container.querySelector('#hud-chain')!;
    this.clearedEl = this.container.querySelector('#hud-cleared')!;
    this.notificationEl = this.container.querySelector('#notification')!;
  }

  /** スコア表示を更新 */
  updateScore(data: ScoreData): void {
    this.scoreEl.textContent = data.score.toLocaleString();
    this.comboEl.textContent = data.combo.toString();
    this.chainEl.textContent = data.chainCount.toString();
    this.clearedEl.textContent = data.totalCleared.toString();
  }

  /** 通知メッセージを表示 */
  showNotification(text: string, isHappyOne = false, duration = 1500): void {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }

    this.notificationEl.textContent = text;
    this.notificationEl.className = 'visible' + (isHappyOne ? ' happy-one' : '');

    this.notificationTimer = window.setTimeout(() => {
      this.notificationEl.className = '';
    }, duration);
  }

  /** クリーンアップ */
  dispose(): void {
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.container.remove();
  }
}
