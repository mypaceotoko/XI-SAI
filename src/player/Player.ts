import { PlayerData, Direction, GridPos, DIR_VECTORS } from '@/types';
import { Board } from '@/board/Board';

/**
 * プレイヤーロジック
 */
export class Player {
  data: PlayerData;
  private board: Board;

  constructor(board: Board, startPos: GridPos) {
    this.board = board;
    this.data = {
      pos: { ...startPos },
      moving: false,
      moveFrom: null,
      moveProgress: 0,
      direction: 'north',
    };
  }

  /** プレイヤーを指定方向に移動 */
  move(direction: Direction): boolean {
    if (this.data.moving) return false;

    this.data.direction = direction;
    const dv = DIR_VECTORS[direction];
    const targetPos: GridPos = {
      x: this.data.pos.x + dv.x,
      z: this.data.pos.z + dv.z,
    };

    // 盤面外なら移動不可
    if (!this.board.isInBounds(targetPos)) return false;

    // 移動先にサイコロがある場合 → サイコロを押す
    const diceAtTarget = this.board.getDiceAt(targetPos);
    if (diceAtTarget) {
      const pushed = this.board.pushDice(diceAtTarget.id, direction);
      if (!pushed) return false; // サイコロが押せなかった

      // 押した後にプレイヤーも移動
      this.startMove(targetPos);
      return true;
    }

    // 空いていれば移動
    this.startMove(targetPos);
    return true;
  }

  private startMove(targetPos: GridPos): void {
    this.data.moveFrom = { ...this.data.pos };
    this.data.pos = { ...targetPos };
    this.data.moving = true;
    this.data.moveProgress = 0;
  }

  /** フレーム更新 */
  update(): void {
    if (this.data.moving) {
      this.data.moveProgress += 0.15;
      if (this.data.moveProgress >= 1) {
        this.data.moveProgress = 1;
        this.data.moving = false;
        this.data.moveFrom = null;
      }
    }
  }

  /** 位置をリセット */
  resetPosition(pos: GridPos): void {
    this.data.pos = { ...pos };
    this.data.moving = false;
    this.data.moveFrom = null;
    this.data.moveProgress = 0;
  }

  /** プレイヤーがアニメーション中でない */
  isIdle(): boolean {
    return !this.data.moving;
  }
}
