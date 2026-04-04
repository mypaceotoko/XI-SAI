import { ScoreData, ClearGroup } from '@/types';

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
          padding: 16px;
        }
        .hud-stats {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .hud-stat {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 8px 16px;
          backdrop-filter: blur(4px);
        }
        .hud-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .hud-value {
          font-size: 24px;
          font-weight: bold;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }
        .hud-value.score { color: #ffdd44; }
        .hud-value.combo { color: #ff6644; }
        .hud-value.chain { color: #44ddff; }
        .hud-value.cleared { color: #44ff88; }
        #notification {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 36px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 0 20px rgba(255, 255, 100, 0.8);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        #notification.visible {
          opacity: 1;
        }
        #notification.happy-one {
          color: #ff4444;
          text-shadow: 0 0 30px rgba(255, 50, 50, 0.9);
          font-size: 42px;
        }
      </style>
      <div class="hud-stats">
        <div class="hud-stat">
          <div class="hud-label">Score</div>
          <div class="hud-value score" id="hud-score">0</div>
        </div>
        <div class="hud-stat">
          <div class="hud-label">Combo</div>
          <div class="hud-value combo" id="hud-combo">0</div>
        </div>
        <div class="hud-stat">
          <div class="hud-label">Chain</div>
          <div class="hud-value chain" id="hud-chain">0</div>
        </div>
        <div class="hud-stat">
          <div class="hud-label">Cleared</div>
          <div class="hud-value cleared" id="hud-cleared">0</div>
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
