import { DiceData, GridPos, DiceFaces } from '@/types';
import { createRandomFaces, createFacesWithTop } from './DiceRotation';

let nextDiceId = 1;

/** サイコロデータを生成 */
export function createDice(pos: GridPos, topValue?: number): DiceData {
  const faces: DiceFaces = topValue !== undefined
    ? createFacesWithTop(topValue)
    : createRandomFaces();

  return {
    id: nextDiceId++,
    pos: { ...pos },
    faces,
    clearing: false,
    clearProgress: 0,
    moving: false,
    moveFrom: null,
    moveProgress: 0,
  };
}

/** サイコロの上面の値を取得 */
export function getTopFace(dice: DiceData): number {
  return dice.faces.top;
}

/** IDカウンターをリセット（ゲームリスタート時） */
export function resetDiceIdCounter(): void {
  nextDiceId = 1;
}
