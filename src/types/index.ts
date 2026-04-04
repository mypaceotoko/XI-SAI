// ゲーム全体の型定義

/** グリッド座標 */
export interface GridPos {
  x: number;
  z: number;
}

/** 方向 */
export type Direction = 'north' | 'south' | 'east' | 'west';

/** サイコロの6面の向き (top, bottom, north, south, east, west) */
export interface DiceFaces {
  top: number;
  bottom: number;
  north: number;
  south: number;
  east: number;
  west: number;
}

/** サイコロデータ */
export interface DiceData {
  id: number;
  pos: GridPos;
  faces: DiceFaces;
  /** 消去アニメーション中かどうか */
  clearing: boolean;
  /** 消去アニメーション進行度 0~1 */
  clearProgress: number;
  /** 移動アニメーション中の情報 */
  moving: boolean;
  moveFrom: GridPos | null;
  moveProgress: number;
}

/** プレイヤーデータ */
export interface PlayerData {
  pos: GridPos;
  moving: boolean;
  moveFrom: GridPos | null;
  moveProgress: number;
  direction: Direction;
}

/** ゲーム状態 */
export type GamePhase =
  | 'title'
  | 'playing'
  | 'clearing'   // 消去アニメーション中
  | 'chain'      // 連鎖チェック中
  | 'gameover'
  | 'paused';

/** スコア情報 */
export interface ScoreData {
  score: number;
  combo: number;
  chainCount: number;
  maxCombo: number;
  totalCleared: number;
}

/** 消去グループ */
export interface ClearGroup {
  diceIds: number[];
  faceValue: number;
  isHappyOne: boolean;
}

/** ボード設定 */
export interface BoardConfig {
  width: number;
  depth: number;
  initialDiceCount: number;
  newDiceInterval: number; // フレーム数ごとに新しいサイコロ追加
}

/** 方向ベクトルのマッピング */
export const DIR_VECTORS: Record<Direction, GridPos> = {
  north: { x: 0, z: -1 },
  south: { x: 0, z: 1 },
  east:  { x: 1, z: 0 },
  west:  { x: -1, z: 0 },
};

/** 反対方向 */
export const OPPOSITE_DIR: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};
