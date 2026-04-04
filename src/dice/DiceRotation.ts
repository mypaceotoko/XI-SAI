import { DiceFaces, Direction } from '@/types';

/**
 * サイコロの回転ロジック
 * 標準サイコロ: 対面の和が7 (1-6, 2-5, 3-4)
 */

/** 標準的な初期状態のサイコロ面を生成 */
export function createDefaultFaces(): DiceFaces {
  return {
    top: 1,
    bottom: 6,
    north: 2,
    south: 5,
    east: 3,
    west: 4,
  };
}

/** 指定した上面の値を持つランダムなサイコロ面を生成 */
export function createFacesWithTop(topValue: number): DiceFaces {
  // まずデフォルト状態から始めて、目的の上面になるまで回転
  let faces = createDefaultFaces();

  // 上面を目的の値にする回転シーケンスを探す
  const rotations: Direction[] = ['north', 'south', 'east', 'west'];
  for (let i = 0; i < 4; i++) {
    if (faces.top === topValue) return faces;
    faces = rollDice(faces, 'north');
  }
  for (let i = 0; i < 4; i++) {
    if (faces.top === topValue) return faces;
    faces = rollDice(faces, 'east');
  }

  // ランダムに回転を加えて上面は維持
  const randomRotCount = Math.floor(Math.random() * 4);
  for (let i = 0; i < randomRotCount; i++) {
    // 上面を維持する回転(時計回り)
    faces = spinClockwise(faces);
  }

  return faces;
}

/** ランダムな上面のサイコロを生成 */
export function createRandomFaces(): DiceFaces {
  const topValue = Math.floor(Math.random() * 6) + 1;
  return createFacesWithTop(topValue);
}

/**
 * サイコロを指定方向に転がした時の新しい面を計算
 * 方向はサイコロが転がっていく方向
 */
export function rollDice(faces: DiceFaces, direction: Direction): DiceFaces {
  const { top, bottom, north, south, east, west } = faces;

  switch (direction) {
    case 'north': // 北(Z-)方向に転がる
      return { top: south, bottom: north, north: top, south: bottom, east, west };
    case 'south': // 南(Z+)方向に転がる
      return { top: north, bottom: south, north: bottom, south: top, east, west };
    case 'east': // 東(X+)方向に転がる
      return { top: west, bottom: east, north, south, east: top, west: bottom };
    case 'west': // 西(X-)方向に転がる
      return { top: east, bottom: west, north, south, east: bottom, west: top };
  }
}

/** 上面を軸に時計回りに回転(上面・底面は変わらない) */
function spinClockwise(faces: DiceFaces): DiceFaces {
  return {
    top: faces.top,
    bottom: faces.bottom,
    north: faces.west,
    east: faces.north,
    south: faces.east,
    west: faces.south,
  };
}
