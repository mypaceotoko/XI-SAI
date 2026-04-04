import { DiceData, GridPos, DIR_VECTORS, ClearGroup } from '@/types';
import { Board } from '@/board/Board';
import { getTopFace } from '@/dice/Dice';
import { posKey } from '@/utils';

/**
 * 消去判定ロジック
 * BFSで同じ出目の連結グループを探し、条件を満たすか判定する
 */

/** 同じ出目で隣接する連結グループを全て検出 */
export function findConnectedGroups(board: Board): Map<number, number[]> {
  const activeDice = board.getActiveDice();
  const visited = new Set<number>();
  const groups = new Map<number, number[]>(); // faceValue => diceIds[][]
  let groupIndex = 0;

  for (const dice of activeDice) {
    if (visited.has(dice.id)) continue;

    const faceValue = getTopFace(dice);
    const group: number[] = [];

    // BFS
    const queue: DiceData[] = [dice];
    visited.add(dice.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current.id);

      // 4方向の隣接チェック
      for (const dir of Object.values(DIR_VECTORS)) {
        const neighborPos: GridPos = {
          x: current.pos.x + dir.x,
          z: current.pos.z + dir.z,
        };
        const neighbor = board.getDiceAt(neighborPos);
        if (neighbor && !visited.has(neighbor.id) && !neighbor.clearing) {
          if (getTopFace(neighbor) === faceValue) {
            visited.add(neighbor.id);
            queue.push(neighbor);
          }
        }
      }
    }

    if (group.length > 0) {
      groups.set(groupIndex++, group);
    }
  }

  return groups;
}

/** 消去条件を満たすグループを検出 */
export function findClearableGroups(board: Board): ClearGroup[] {
  const activeDice = board.getActiveDice();
  const visited = new Set<number>();
  const result: ClearGroup[] = [];

  for (const dice of activeDice) {
    if (visited.has(dice.id)) continue;

    const faceValue = getTopFace(dice);
    if (faceValue === 1) {
      // 1は単独では消えない（HappyOneで別処理）
      visited.add(dice.id);
      continue;
    }

    const group: number[] = [];

    // BFS
    const queue: DiceData[] = [dice];
    visited.add(dice.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current.id);

      for (const dir of Object.values(DIR_VECTORS)) {
        const neighborPos: GridPos = {
          x: current.pos.x + dir.x,
          z: current.pos.z + dir.z,
        };
        const neighbor = board.getDiceAt(neighborPos);
        if (neighbor && !visited.has(neighbor.id) && !neighbor.clearing) {
          if (getTopFace(neighbor) === faceValue) {
            visited.add(neighbor.id);
            queue.push(neighbor);
          }
        }
      }
    }

    // 消去条件: N の目は N個以上
    if (group.length >= faceValue) {
      result.push({
        diceIds: group,
        faceValue,
        isHappyOne: false,
      });
    }
  }

  return result;
}

/** 消去中のサイコロに隣接する1の目を検出（Happy One） */
export function findHappyOneCandidates(board: Board): ClearGroup[] {
  const clearingDice = board.getAllDice().filter(d => d.clearing);
  if (clearingDice.length === 0) return [];

  const result: ClearGroup[] = [];
  const foundIds = new Set<number>();

  // 消去中のサイコロの隣接マスをチェック
  for (const clearing of clearingDice) {
    for (const dir of Object.values(DIR_VECTORS)) {
      const neighborPos: GridPos = {
        x: clearing.pos.x + dir.x,
        z: clearing.pos.z + dir.z,
      };
      const neighbor = board.getDiceAt(neighborPos);
      if (neighbor && !neighbor.clearing && !foundIds.has(neighbor.id)) {
        if (getTopFace(neighbor) === 1) {
          foundIds.add(neighbor.id);
          result.push({
            diceIds: [neighbor.id],
            faceValue: 1,
            isHappyOne: true,
          });
        }
      }
    }
  }

  return result;
}
