import { GridPos } from '@/types';

/** 2つのグリッド座標が同じか */
export function samePos(a: GridPos, b: GridPos): boolean {
  return a.x === b.x && a.z === b.z;
}

/** グリッド座標を文字列キーに変換 */
export function posKey(p: GridPos): string {
  return `${p.x},${p.z}`;
}

/** 範囲内かチェック */
export function inBounds(pos: GridPos, width: number, depth: number): boolean {
  return pos.x >= 0 && pos.x < width && pos.z >= 0 && pos.z < depth;
}

/** ランダム整数 [min, max] */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** イージング: ease-out cubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** イージング: ease-in-out */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 線形補間 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
