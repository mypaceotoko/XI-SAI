import { Direction } from '@/types';

type PadCallback = (direction: Direction) => void;

/**
 * スマホ用仮想パッド
 */
export class VirtualPad {
  private container: HTMLElement;
  private callback: PadCallback | null = null;
  private enabled = true;

  constructor(parentEl: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'virtual-pad';
    this.container.innerHTML = `
      <style>
        #virtual-pad {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: none;
          pointer-events: auto;
        }
        @media (max-width: 768px), (hover: none) {
          #virtual-pad { display: block; }
        }
        /* 横画面: 右寄せ */
        @media (max-height: 500px) {
          #virtual-pad {
            left: auto;
            right: 10px;
            bottom: 8px;
            transform: none;
          }
        }
        .vpad-grid {
          display: grid;
          grid-template-columns: 50px 50px 50px;
          grid-template-rows: 50px 50px 50px;
          gap: 3px;
        }
        @media (max-height: 500px) {
          .vpad-grid {
            grid-template-columns: 44px 44px 44px;
            grid-template-rows: 44px 44px 44px;
            gap: 2px;
          }
        }
        .vpad-btn {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          color: #fff;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .vpad-btn:active {
          background: rgba(0, 255, 170, 0.3);
        }
        .vpad-empty {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="vpad-grid">
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="north">▲</div>
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="west">◀</div>
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="east">▶</div>
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="south">▼</div>
        <div class="vpad-empty"></div>
      </div>
    `;
    parentEl.appendChild(this.container);

    // タッチ/クリックイベント
    this.container.querySelectorAll('.vpad-btn').forEach(btn => {
      const dir = btn.getAttribute('data-dir') as Direction;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.enabled && dir) this.callback?.(dir);
      });
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.enabled && dir) this.callback?.(dir);
      });
    });
  }

  /** コールバック設定 */
  setCallback(cb: PadCallback): void {
    this.callback = cb;
  }

  /** 有効/無効切り替え */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** クリーンアップ */
  dispose(): void {
    this.container.remove();
  }
}
