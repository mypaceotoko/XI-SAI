import { BoardConfig, DiceData, GridPos, Direction, DIR_VECTORS } from '@/types';
import { createDice, getTopFace } from '@/dice/Dice';
import { rollDice } from '@/dice/DiceRotation';
import { samePos, posKey, inBounds, randInt } from '@/utils';

/**
 * 盤面ロジック
 * グリッドベースでサイコロの配置を管理する
 */
export class Board {
  readonly width: number;
  readonly depth: number;
  private diceMap: Map<string, DiceData> = new Map();
  private diceById: Map<number, DiceData> = new Map();
  private config: BoardConfig;
  private frameCount = 0;

  constructor(config: BoardConfig) {
    this.config = config;
    this.width = config.width;
    this.depth = config.depth;
  }

  /** 盤面を初期化 */
  init(): void {
    this.diceMap.clear();
    this.diceById.clear();
    this.frameCount = 0;

    // ランダムにサイコロを配置
    const positions: GridPos[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        positions.push({ x, z });
      }
    }

    // シャッフル
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // 初期配置（端は空けてプレイヤーの動けるスペースを確保）
    const count = Math.min(this.config.initialDiceCount, positions.length);
    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      // 1~6のランダムな上面
      const topValue = randInt(1, 6);
      const dice = createDice(pos, topValue);
      this.addDice(dice);
    }
  }

  /** サイコロを盤面に追加 */
  addDice(dice: DiceData): void {
    const key = posKey(dice.pos);
    this.diceMap.set(key, dice);
    this.diceById.set(dice.id, dice);
  }

  /** サイコロを盤面から除去 */
  removeDice(id: number): void {
    const dice = this.diceById.get(id);
    if (!dice) return;
    this.diceMap.delete(posKey(dice.pos));
    this.diceById.delete(id);
  }

  /** 位置にサイコロがあるか */
  getDiceAt(pos: GridPos): DiceData | undefined {
    return this.diceMap.get(posKey(pos));
  }

  /** IDでサイコロ取得 */
  getDiceById(id: number): DiceData | undefined {
    return this.diceById.get(id);
  }

  /** 全サイコロ取得 */
  getAllDice(): DiceData[] {
    return Array.from(this.diceById.values());
  }

  /** アクティブ（消去中でない）サイコロ取得 */
  getActiveDice(): DiceData[] {
    return this.getAllDice().filter(d => !d.clearing);
  }

  /** 位置が盤面内か */
  isInBounds(pos: GridPos): boolean {
    return inBounds(pos, this.width, this.depth);
  }

  /** 位置が空いているか（盤面内かつサイコロなし） */
  isEmpty(pos: GridPos): boolean {
    return this.isInBounds(pos) && !this.getDiceAt(pos);
  }

  /** サイコロを押す処理 */
  pushDice(diceId: number, direction: Direction): boolean {
    const dice = this.diceById.get(diceId);
    if (!dice || dice.clearing || dice.moving) return false;

    const dv = DIR_VECTORS[direction];
    const newPos: GridPos = { x: dice.pos.x + dv.x, z: dice.pos.z + dv.z };

    // 移動先が盤面外またはサイコロがある場合は押せない
    if (!this.isInBounds(newPos) || this.getDiceAt(newPos)) {
      return false;
    }

    // 盤面のマップを更新
    this.diceMap.delete(posKey(dice.pos));
    const oldPos = { ...dice.pos };
    dice.pos = { ...newPos };
    dice.moveFrom = oldPos;
    dice.moving = true;
    dice.moveProgress = 0;
    this.diceMap.set(posKey(dice.pos), dice);

    // サイコロを転がす（面の回転）
    dice.faces = rollDice(dice.faces, direction);

    return true;
  }

  /** 新しいサイコロを端から追加（ゲーム進行用） */
  addNewDiceFromEdge(): DiceData | null {
    // 端のマス（z=depth-1の行）で空いている場所を探す
    const edgePositions: GridPos[] = [];
    for (let x = 0; x < this.width; x++) {
      const pos = { x, z: this.depth - 1 };
      if (this.isEmpty(pos)) {
        edgePositions.push(pos);
      }
    }

    if (edgePositions.length === 0) return null;

    const pos = edgePositions[Math.floor(Math.random() * edgePositions.length)];
    const topValue = randInt(1, 6);
    const dice = createDice(pos, topValue);
    this.addDice(dice);
    return dice;
  }

  /** フレーム更新 */
  update(): DiceData | null {
    this.frameCount++;
    let newDice: DiceData | null = null;

    // 一定間隔で新しいサイコロを追加
    if (this.config.newDiceInterval > 0 && this.frameCount % this.config.newDiceInterval === 0) {
      newDice = this.addNewDiceFromEdge();
    }

    // 移動アニメーション更新
    for (const dice of this.getAllDice()) {
      if (dice.moving) {
        dice.moveProgress += 0.1;
        if (dice.moveProgress >= 1) {
          dice.moveProgress = 1;
          dice.moving = false;
          dice.moveFrom = null;
        }
      }
    }

    return newDice;
  }

  /** ゲームオーバー判定：盤面が満杯か */
  isBoardFull(): boolean {
    let count = 0;
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        if (this.getDiceAt({ x, z })) count++;
      }
    }
    return count >= this.width * this.depth - 1; // プレイヤー分1マス残す
  }

  /** 消去中のサイコロがあるか */
  hasClearingDice(): boolean {
    return this.getAllDice().some(d => d.clearing);
  }
}
