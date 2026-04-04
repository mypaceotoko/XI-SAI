import { BoardConfig, DiceData, GridPos, Direction, DIR_VECTORS } from '@/types';
import { createDice, getTopFace } from '@/dice/Dice';
import { rollDice } from '@/dice/DiceRotation';
import { posKey, inBounds, randInt } from '@/utils';

/**
 * 盤面ロジック
 * XIスタイル: サイコロで埋め尽くされたグリッドがフィールド
 * プレイヤーはサイコロの上に乗って移動する
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

  /** 盤面を初期化: ほぼ全面をサイコロで埋める */
  init(): GridPos[] {
    this.diceMap.clear();
    this.diceById.clear();
    this.frameCount = 0;

    // 全マスの座標リスト
    const allPositions: GridPos[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        allPositions.push({ x, z });
      }
    }

    // シャッフルして、一部を空きマスにする
    const shuffled = [...allPositions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 空きマスを選定
    const emptyCount = Math.min(this.config.initialEmptyCount, allPositions.length - 1);
    const emptySet = new Set<string>();
    for (let i = 0; i < emptyCount; i++) {
      emptySet.add(posKey(shuffled[i]));
    }

    // サイコロを配置
    for (const pos of allPositions) {
      if (emptySet.has(posKey(pos))) continue;
      const topValue = randInt(1, 6);
      const dice = createDice(pos, topValue);
      this.addDice(dice);
    }

    // 空きマスリストを返す（プレイヤー初期位置決定用）
    return shuffled.slice(0, emptyCount);
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

  /**
   * サイコロを転がす（プレイヤーが乗って移動する時）
   * サイコロが指定方向に1マス転がる
   * @returns 成功したらtrue
   */
  rollDiceToDirection(diceId: number, direction: Direction): boolean {
    const dice = this.diceById.get(diceId);
    if (!dice || dice.clearing || dice.moving) return false;

    const dv = DIR_VECTORS[direction];
    const newPos: GridPos = { x: dice.pos.x + dv.x, z: dice.pos.z + dv.z };

    // 移動先が盤面外またはサイコロがある場合は転がせない
    if (!this.isInBounds(newPos) || this.getDiceAt(newPos)) {
      return false;
    }

    // 盤面マップを更新
    this.diceMap.delete(posKey(dice.pos));
    const oldPos = { ...dice.pos };
    dice.pos = { ...newPos };
    dice.moveFrom = oldPos;
    dice.moving = true;
    dice.moveProgress = 0;
    this.diceMap.set(posKey(dice.pos), dice);

    // 面の回転を計算
    dice.faces = rollDice(dice.faces, direction);

    return true;
  }

  /** 新しいサイコロを空きマスに追加 */
  addNewDiceAtEmpty(): DiceData | null {
    // 空きマスを探す
    const emptyPositions: GridPos[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const pos = { x, z };
        if (this.isEmpty(pos)) {
          emptyPositions.push(pos);
        }
      }
    }

    if (emptyPositions.length === 0) return null;

    // ランダムな空きマスに配置
    const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const topValue = randInt(1, 6);
    const dice = createDice(pos, topValue);
    this.addDice(dice);
    return dice;
  }

  /** フレーム更新 */
  update(playerPos: GridPos): DiceData | null {
    this.frameCount++;
    let newDice: DiceData | null = null;

    // 一定間隔で新しいサイコロを追加（プレイヤー位置は避ける）
    if (this.config.newDiceInterval > 0 && this.frameCount % this.config.newDiceInterval === 0) {
      newDice = this.addNewDiceAtEmptyAvoidingPos(playerPos);
    }

    // 移動アニメーション更新
    for (const dice of this.getAllDice()) {
      if (dice.moving) {
        dice.moveProgress += 0.12;
        if (dice.moveProgress >= 1) {
          dice.moveProgress = 1;
          dice.moving = false;
          dice.moveFrom = null;
        }
      }
    }

    return newDice;
  }

  /** プレイヤー位置を避けて新サイコロを追加 */
  private addNewDiceAtEmptyAvoidingPos(avoidPos: GridPos): DiceData | null {
    const emptyPositions: GridPos[] = [];
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const pos = { x, z };
        if (this.isEmpty(pos) && !(pos.x === avoidPos.x && pos.z === avoidPos.z)) {
          emptyPositions.push(pos);
        }
      }
    }

    if (emptyPositions.length === 0) return null;

    const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const topValue = randInt(1, 6);
    const dice = createDice(pos, topValue);
    this.addDice(dice);
    return dice;
  }

  /** 空きマスの数を取得 */
  getEmptyCount(excludePos?: GridPos): number {
    let count = 0;
    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        if (this.isEmpty({ x, z })) {
          if (excludePos && x === excludePos.x && z === excludePos.z) continue;
          count++;
        }
      }
    }
    return count;
  }

  /** ゲームオーバー判定：空きマスがプレイヤー位置の1つだけで、消去可能なものもない */
  isGameOver(playerPos: GridPos): boolean {
    return this.getEmptyCount(playerPos) === 0;
  }

  /** 消去中のサイコロがあるか */
  hasClearingDice(): boolean {
    return this.getAllDice().some(d => d.clearing);
  }
}
