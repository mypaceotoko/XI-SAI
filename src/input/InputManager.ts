import { Direction } from '@/types';

type InputCallback = (action: InputAction) => void;

export type InputAction =
  | { type: 'move'; direction: Direction }
  | { type: 'action' }
  | { type: 'restart' }
  | { type: 'pause' };

/**
 * キーボード・タッチ入力管理
 */
export class InputManager {
  private callback: InputCallback | null = null;
  private pressedKeys = new Set<string>();
  private moveRepeatTimer: number | null = null;
  private lastDirection: Direction | null = null;
  private enabled = true;

  constructor() {
    this.setupKeyboard();
  }

  /** コールバック設定 */
  setCallback(cb: InputCallback): void {
    this.callback = cb;
  }

  /** 入力有効/無効切り替え */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (this.pressedKeys.has(e.code)) return; // リピート防止
      this.pressedKeys.add(e.code);

      const direction = this.keyToDirection(e.code);
      if (direction) {
        e.preventDefault();
        this.callback?.({ type: 'move', direction });
        this.lastDirection = direction;
        this.startMoveRepeat(direction);
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.callback?.({ type: 'action' });
          break;
        case 'KeyR':
          this.callback?.({ type: 'restart' });
          break;
        case 'Escape':
          this.callback?.({ type: 'pause' });
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.code);
      const direction = this.keyToDirection(e.code);
      if (direction && direction === this.lastDirection) {
        this.stopMoveRepeat();
      }
    });
  }

  private keyToDirection(code: string): Direction | null {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        return 'north';
      case 'KeyS':
      case 'ArrowDown':
        return 'south';
      case 'KeyD':
      case 'ArrowRight':
        return 'east';
      case 'KeyA':
      case 'ArrowLeft':
        return 'west';
      default:
        return null;
    }
  }

  /** キーを押し続けた時の移動リピート */
  private startMoveRepeat(direction: Direction): void {
    this.stopMoveRepeat();
    this.moveRepeatTimer = window.setInterval(() => {
      if (this.enabled && this.lastDirection === direction) {
        this.callback?.({ type: 'move', direction });
      }
    }, 180);
  }

  private stopMoveRepeat(): void {
    if (this.moveRepeatTimer !== null) {
      clearInterval(this.moveRepeatTimer);
      this.moveRepeatTimer = null;
    }
    this.lastDirection = null;
  }

  /** クリーンアップ */
  dispose(): void {
    this.stopMoveRepeat();
  }
}
