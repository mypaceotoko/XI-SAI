import * as THREE from 'three';
import { DiceData } from '@/types';
import { lerp, easeOutCubic } from '@/utils';

const DICE_SIZE = 0.9;
const DICE_GEOMETRY = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);

// 出目ごとのサイコロ本体色（XIのようにカラフル）
const DICE_BODY_COLORS: Record<number, number> = {
  1: 0xdddddd, // 白/灰
  2: 0x4488cc, // 青
  3: 0x44aa44, // 緑
  4: 0xcccc44, // 黄
  5: 0xaa44aa, // 紫
  6: 0xcc6633, // 橙
};

// ドットの色
const DOT_COLOR = '#111111';

/** 出目テクスチャをCanvasで生成（出目ごとに背景色が異なる） */
function createDiceTexture(value: number, bodyColor: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 背景色（サイコロ本体の色）
  const color = '#' + bodyColor.toString(16).padStart(6, '0');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // 少しグラデーション感を出す
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 枠線
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  // ドット配置
  ctx.fillStyle = DOT_COLOR;
  const dotR = 10;
  const positions = getDotPositions(value, size);

  // 1の目は赤いドット
  if (value === 1) {
    ctx.fillStyle = '#cc2222';
    dotR; // 1のドットは大きめ
    for (const [cx, cy] of positions) {
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (const [cx, cy] of positions) {
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/** 出目ドットの位置パターン */
function getDotPositions(value: number, size: number): [number, number][] {
  const c = size / 2;
  const o = size * 0.28;
  const positions: Record<number, [number, number][]> = {
    1: [[c, c]],
    2: [[c - o, c - o], [c + o, c + o]],
    3: [[c - o, c - o], [c, c], [c + o, c + o]],
    4: [[c - o, c - o], [c + o, c - o], [c - o, c + o], [c + o, c + o]],
    5: [[c - o, c - o], [c + o, c - o], [c, c], [c - o, c + o], [c + o, c + o]],
    6: [[c - o, c - o], [c + o, c - o], [c - o, c], [c + o, c], [c - o, c + o], [c + o, c + o]],
  };
  return positions[value] || [[c, c]];
}

// テクスチャキャッシュ: key = `${value}_${bodyColor}`
const textureCache = new Map<string, THREE.CanvasTexture>();

function getTexture(value: number, bodyColor: number): THREE.CanvasTexture {
  const key = `${value}_${bodyColor}`;
  if (!textureCache.has(key)) {
    textureCache.set(key, createDiceTexture(value, bodyColor));
  }
  return textureCache.get(key)!;
}

/** サイコロの6面マテリアルを生成（上面の出目で色を決定） */
function createDiceMaterials(dice: DiceData): THREE.MeshStandardMaterial[] {
  // 上面の値でサイコロ全体の色を決定
  const topValue = dice.faces.top;
  const bodyColor = DICE_BODY_COLORS[topValue] || 0x888888;

  // Three.js BoxGeometry の面順: +X, -X, +Y, -Y, +Z, -Z
  // = east, west, top, bottom, south, north
  const { east, west, top, bottom, south, north } = dice.faces;
  const order = [east, west, top, bottom, south, north];

  return order.map(value => {
    return new THREE.MeshStandardMaterial({
      map: getTexture(value, bodyColor),
      roughness: 0.4,
      metalness: 0.05,
    });
  });
}

/** サイコロMeshを作成 */
export function createDiceMesh(dice: DiceData): THREE.Mesh {
  const materials = createDiceMaterials(dice);
  const mesh = new THREE.Mesh(DICE_GEOMETRY, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.diceId = dice.id;
  updateDiceMeshPosition(mesh, dice);
  return mesh;
}

/** サイコロMeshの位置を更新 */
export function updateDiceMeshPosition(mesh: THREE.Mesh, dice: DiceData): void {
  if (dice.moving && dice.moveFrom) {
    const rawT = dice.moveProgress;          // 0→1 線形
    const t    = easeOutCubic(rawT);         // イージング（位置用）

    const dx = dice.pos.x - dice.moveFrom.x; // +1=east, -1=west
    const dz = dice.pos.z - dice.moveFrom.z; // +1=south, -1=north

    // ─── 回転アニメーション ───────────────────────────────────────
    // テクスチャはロール開始時点ですでにポスト状態に更新済み。
    // そのため「逆回転」方式を採用:
    //   t=0 → angle=π/2 でプリ状態の面が視覚的に上を向く
    //   t=1 → angle=0  でポスト状態の面が正しく上を向く
    // この方式なら補正なしでテクスチャが自然に見える。
    const angle = (1 - rawT) * Math.PI / 2;
    mesh.rotation.x = -dz * angle;  // south(+z): −angle  north(−z): +angle
    mesh.rotation.z =  dx * angle;  // east(+x):  +angle  west(−x): −angle
    mesh.rotation.y = 0;

    // ─── アーク高さ（物理ベース） ─────────────────────────────────
    // サイコロは先端エッジを軸に90°転がる。
    // 中心はエッジからの距離 r = DICE_SIZE*√2/2 の円弧を描く。
    // 逆回転なので角度は π/4 → 3π/4 と変化 → sin は 0.5 → 1.0 → 0.5 の弧。
    const r = DICE_SIZE * Math.SQRT2 / 2; // ≈ 0.636
    const y = r * Math.sin(Math.PI / 4 + rawT * Math.PI / 2);

    mesh.position.set(
      lerp(dice.moveFrom.x, dice.pos.x, t),
      y,
      lerp(dice.moveFrom.z, dice.pos.z, t),
    );
  } else {
    mesh.position.set(dice.pos.x, DICE_SIZE / 2, dice.pos.z);
    mesh.rotation.set(0, 0, 0);
  }
}

/** 消去アニメーション更新 */
export function updateDiceClearAnimation(mesh: THREE.Mesh, dice: DiceData): void {
  if (!dice.clearing) return;

  const t = dice.clearProgress;

  // フェーズ1 (0~0.3): 点滅・発光
  // フェーズ2 (0.3~1.0): 沈み込み・縮小
  const scale = t < 0.3
    ? 1 + Math.sin(t / 0.3 * Math.PI * 3) * 0.1
    : Math.max(0, 1 - (t - 0.3) / 0.7);
  const y = t > 0.3
    ? (DICE_SIZE / 2) * Math.max(0, 1 - (t - 0.3) / 0.7 * 1.5)
    : DICE_SIZE / 2;

  mesh.scale.setScalar(scale);
  mesh.position.y = Math.max(-0.2, y);

  // 発光エフェクト
  const materials = mesh.material as THREE.MeshStandardMaterial[];
  if (Array.isArray(materials)) {
    const emissiveIntensity = t < 0.3
      ? Math.abs(Math.sin(t / 0.3 * Math.PI * 3)) * 2
      : Math.max(0, 1 - (t - 0.3) / 0.7);
    materials.forEach(m => {
      m.emissive = new THREE.Color(0xffffaa);
      m.emissiveIntensity = emissiveIntensity;
      if (t > 0.5) {
        m.transparent = true;
        m.opacity = Math.max(0, 1 - (t - 0.5) / 0.5);
      }
    });
  }
}

/** サイコロMeshのマテリアルを更新（転がった後） */
export function updateDiceMaterials(mesh: THREE.Mesh, dice: DiceData): void {
  const newMaterials = createDiceMaterials(dice);
  const oldMaterials = mesh.material as THREE.MeshStandardMaterial[];
  if (Array.isArray(oldMaterials)) {
    oldMaterials.forEach(m => m.dispose());
  }
  mesh.material = newMaterials;
}
