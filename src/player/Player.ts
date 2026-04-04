import { PlayerData, Direction, GridPos, DIR_VECTORS } from '@/types';
import { Board } from '@/board/Board';

/**
 * プレイヤーロジック
 * XIスタイル: サイコロの上に乗って移動。
 * - サイコロの上にいる時、隣にサイコロがあればその上に乗り移る
 * - サイコロの上にいる時、隣が空きマスなら乗っているサイコロを転がして移動
 * - 地面にいる時、隣にサイコロがあればその上に登る
 * - 地面にいる時、隣が空きマスなら地面を歩く
 */
export class Player {
  data: PlayerData;
  private board: Board;

  constructor(board: Board, startPos: GridPos) {
    this.board = board;

    // 開始位置にサイコロがあるかで初期状態を決定
    const diceHere = board.getDiceAt(startPos);
    this.data = {
      pos: { ...startPos },
      level: diceHere ? 'on_dice' : 'ground',
      ridingDiceId: diceHere ? diceHere.id : null,
      moving: false,
      moveFrom: null,
      moveProgress: 0,
      direction: 'south',
      moveType: 'walk',
    };
  }

  /**
   * プレイヤーを指定方向に移動
   * @returns 移動の種類 or null（移動不可）
   */
  move(direction: Direction): 'walk' | 'ride_roll' | 'climb' | 'descend' | null {
    if (this.data.moving) return null;

    this.data.direction = direction;
    const dv = DIR_VECTORS[direction];
    const targetPos: GridPos = {
      x: this.data.pos.x + dv.x,
      z: this.data.pos.z + dv.z,
    };

    // 盤面外なら移動不可
    if (!this.board.isInBounds(targetPos)) return null;

    const diceAtTarget = this.board.getDiceAt(targetPos);

    if (this.data.level === 'on_dice') {
      // === サイコロの上にいる ===
      if (diceAtTarget && !diceAtTarget.clearing) {
        // 隣にサイコロがある → その上に乗り移る
        this.startMove(targetPos, 'walk');
        this.data.level = 'on_dice';
        this.data.ridingDiceId = diceAtTarget.id;
        return 'walk';
      } else if (!diceAtTarget) {
        // 隣が空き → 乗っているサイコロを転がす
        if (this.data.ridingDiceId !== null) {
          const rolled = this.board.rollDiceToDirection(this.data.ridingDiceId, direction);
          if (rolled) {
            this.startMove(targetPos, 'ride_roll');
            // サイコロと一緒に移動するので、ridingDiceIdはそのまま
            return 'ride_roll';
          }
        }
        // サイコロが転がせない場合は何もしない（自動で降りない）
        return null;
      }
    } else {
      // === 地面にいる ===
      if (diceAtTarget && !diceAtTarget.clearing) {
        // 隣にサイコロがある → その上に登る
        this.startMove(targetPos, 'climb');
        this.data.level = 'on_dice';
        this.data.ridingDiceId = diceAtTarget.id;
        return 'climb';
      } else if (!diceAtTarget) {
        // 隣が空き → 地面を歩く
        this.startMove(targetPos, 'walk');
        return 'walk';
      }
    }

    return null;
  }

  private startMove(targetPos: GridPos, moveType: PlayerData['moveType']): void {
    this.data.moveFrom = { ...this.data.pos };
    this.data.pos = { ...targetPos };
    this.data.moving = true;
    this.data.moveProgress = 0;
    this.data.moveType = moveType;
  }

  /** フレーム更新 */
  update(): void {
    if (this.data.moving) {
      this.data.moveProgress += 0.15;
      if (this.data.moveProgress >= 1) {
        this.data.moveProgress = 1;
        this.data.moving = false;
        this.data.moveFrom = null;

        // 移動完了後、現在位置のサイコロを確認
        this.syncRidingState();
      }
    }
  }

  /** 乗っているサイコロの状態を同期 */
  syncRidingState(): void {
    const diceHere = this.board.getDiceAt(this.data.pos);
    if (diceHere && !diceHere.clearing) {
      this.data.level = 'on_dice';
      this.data.ridingDiceId = diceHere.id;
    } else {
      this.data.level = 'ground';
      this.data.ridingDiceId = null;
    }
  }

  /**
   * サイコロから明示的に降りる（降りるボタン用）
   * 現在の向き方向に空きマスがある場合のみ成功
   */
  descend(): 'descend' | null {
    if (this.data.moving) return null;
    if (this.data.level !== 'on_dice') return null;

    const dv = DIR_VECTORS[this.data.direction];
    const targetPos: GridPos = {
      x: this.data.pos.x + dv.x,
      z: this.data.pos.z + dv.z,
    };

    if (!this.board.isInBounds(targetPos)) return null;
    if (this.board.getDiceAt(targetPos)) return null; // 隣にサイコロがあれば降りられない

    this.startMove(targetPos, 'descend');
    this.data.level = 'ground';
    this.data.ridingDiceId = null;
    return 'descend';
  }

  /** 位置をリセット */
  resetPosition(pos: GridPos): void {
    this.data.pos = { ...pos };
    this.data.moving = false;
    this.data.moveFrom = null;
    this.data.moveProgress = 0;
    this.syncRidingState();
  }

  /** プレイヤーがアニメーション中でない */
  isIdle(): boolean {
    return !this.data.moving;
  }
}
