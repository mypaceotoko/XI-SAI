/**
 * メニュー画面（タイトル、ゲームオーバー、ポーズ）
 */
export class Menu {
  private container: HTMLElement;
  private parentEl: HTMLElement;
  private onStart: (() => void) | null = null;
  private onRestart: (() => void) | null = null;
  private onResume: (() => void) | null = null;

  constructor(parentEl: HTMLElement) {
    this.parentEl = parentEl;
    this.container = document.createElement('div');
    this.container.id = 'menu-overlay';
    this.container.innerHTML = `
      <style>
        #menu-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 100;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        #menu-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .menu-title {
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, #00ffaa, #44aaff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }
        .menu-subtitle {
          font-size: 16px;
          color: #888;
          margin-bottom: 32px;
        }
        .menu-content {
          text-align: center;
        }
        .menu-score {
          font-size: 24px;
          color: #ffdd44;
          margin-bottom: 8px;
        }
        .menu-btn {
          display: inline-block;
          margin: 8px;
          padding: 12px 32px;
          font-size: 18px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #00aa77, #0077aa);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.2s;
          /* pointer-events は親 (#menu-overlay) から継承させる。
             overlay が非表示時は none、表示時は auto になる */
        }
        .menu-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(0, 170, 119, 0.5);
        }
        .menu-btn:active {
          transform: scale(0.95);
        }
        .menu-controls {
          margin-top: 24px;
          font-size: 13px;
          color: #666;
          line-height: 1.8;
        }
        .menu-controls kbd {
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
          font-family: monospace;
        }
      </style>
      <div class="menu-content" id="menu-content"></div>
    `;
    parentEl.appendChild(this.container);
  }

  /** コールバック設定 */
  setCallbacks(
    onStart: () => void,
    onRestart: () => void,
    onResume: () => void,
  ): void {
    this.onStart = onStart;
    this.onRestart = onRestart;
    this.onResume = onResume;
  }

  /**
   * ボタンにタッチ/クリックハンドラを設定する。
   * touchend で preventDefault を呼ぶことで合成 click イベントの二重発火を防ぐ。
   */
  private bindBtn(selector: string, handler: () => void): void {
    const btn = this.container.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handler();
    }, { passive: false } as EventListenerOptions);
    btn.addEventListener('click', handler);
  }

  /** タイトル画面表示 */
  showTitle(): void {
    const content = this.container.querySelector('#menu-content')!;
    content.innerHTML = `
      <div class="menu-title">Dice Souls</div>
      <div class="menu-subtitle">3D Dice Puzzle Game</div>
      <button class="menu-btn" id="btn-start">START</button>
      <div class="menu-controls">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> Move<br>
        <kbd>R</kbd> Restart &nbsp; <kbd>Esc</kbd> Pause
      </div>
    `;
    this.bindBtn('#btn-start', () => this.onStart?.());
    this.show();
  }

  /** ゲームオーバー画面表示 */
  showGameOver(score: number, maxCombo: number, totalCleared: number): void {
    const content = this.container.querySelector('#menu-content')!;
    content.innerHTML = `
      <div class="menu-title" style="font-size: 36px;">GAME OVER</div>
      <div class="menu-score">Score: ${score.toLocaleString()}</div>
      <div class="menu-subtitle">Max Combo: ${maxCombo} | Cleared: ${totalCleared}</div>
      <button class="menu-btn" id="btn-retry">RETRY</button>
    `;
    this.bindBtn('#btn-retry', () => this.onRestart?.());
    this.show();
  }

  /** ポーズ画面表示 */
  showPause(): void {
    const content = this.container.querySelector('#menu-content')!;
    content.innerHTML = `
      <div class="menu-title" style="font-size: 36px;">PAUSED</div>
      <button class="menu-btn" id="btn-resume">RESUME</button>
      <button class="menu-btn" id="btn-restart">RESTART</button>
    `;
    this.bindBtn('#btn-resume', () => this.onResume?.());
    this.bindBtn('#btn-restart', () => this.onRestart?.());
    this.show();
  }

  /** メニュー表示 */
  show(): void {
    this.container.classList.add('visible');
  }

  /** メニュー非表示 */
  hide(): void {
    this.container.classList.remove('visible');
  }

  /** クリーンアップ */
  dispose(): void {
    this.container.remove();
  }
}
