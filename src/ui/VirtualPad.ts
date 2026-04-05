import { Direction } from '@/types';

type PadCallback = (input: Direction | 'descend') => void;

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
          grid-template-columns: 70px 70px 70px;
          grid-template-rows: 70px 70px 70px;
          gap: 4px;
        }
        @media (max-height: 500px) {
          .vpad-grid {
            grid-template-columns: 56px 56px 56px;
            grid-template-rows: 56px 56px 56px;
            gap: 3px;
          }
        }
        .vpad-btn {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          color: #fff;
          font-size: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }
        .vpad-btn:active {
          background: rgba(0, 255, 170, 0.3);
        }
        .vpad-btn--descend {
          background: rgba(255, 200, 50, 0.15);
          border-color: rgba(255, 200, 50, 0.35);
          font-size: 14px;
        }
        .vpad-btn--descend:active {
          background: rgba(255, 200, 50, 0.4);
        }
        .vpad-empty {
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
      </style>
      <div class="vpad-grid">
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="north">▲</div>
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="west">◀</div>
        <div class="vpad-btn vpad-btn--descend" data-dir="descend">↓<br>降</div>
        <div class="vpad-btn" data-dir="east">▶</div>
        <div class="vpad-empty"></div>
        <div class="vpad-btn" data-dir="south">▼</div>
        <div class="vpad-empty"></div>
      </div>
    `;
    parentEl.appendChild(this.container);

    // タッチ/クリックイベント
    this.container.querySelectorAll('.vpad-btn').forEach(btn => {
      const input = btn.getAttribute('data-dir') as Direction | 'descend';
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.enabled && input) this.callback?.(input);
      });
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.enabled && input) this.callback?.(input);
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
