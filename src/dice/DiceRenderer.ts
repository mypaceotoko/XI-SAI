import * as THREE from 'three';
import { DiceData } from '@/types';
import { getTopFace } from './Dice';
import { lerp, easeOutCubic } from '@/utils';

const DICE_SIZE = 0.9;
const DICE_GEOMETRY = new THREE.BoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE);

// 出目ごとの色
const FACE_COLORS: Record<number, string> = {
  1: '#ff4444',
  2: '#44aaff',
  3: '#44dd44',
  4: '#dddd44',
  5: '#dd44dd',
  6: '#ff8844',
};

/** 出目のテクスチャをCanvasで生成 */
function createDiceTexture(value: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // 枠線
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  // ドットの配置パターン
  ctx.fillStyle = FACE_COLORS[value] || '#333333';
  const dotR = 12;
  const positions = getDotPositions(value, size);
  for (const [cx, cy] of positions) {
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fill();
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

// テクスチャキャッシュ
const textureCache = new Map<number, THREE.CanvasTexture>();

function getTexture(value: number): THREE.CanvasTexture {
  if (!textureCache.has(value)) {
    textureCache.set(value, createDiceTexture(value));
  }
  return textureCache.get(value)!;
}

/** サイコロの6面マテリアルを生成 */
function createDiceMaterials(dice: DiceData): THREE.MeshStandardMaterial[] {
  // Three.js BoxGeometry の面順: +X, -X, +Y, -Y, +Z, -Z
  // = east, west, top, bottom, south, north
  const { east, west, top, bottom, south, north } = dice.faces;
  const order = [east, west, top, bottom, south, north];

  return order.map(value => {
    return new THREE.MeshStandardMaterial({
      map: getTexture(value),
      roughness: 0.3,
      metalness: 0.1,
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
    const t = easeOutCubic(dice.moveProgress);
    mesh.position.set(
      lerp(dice.moveFrom.x, dice.pos.x, t),
      DICE_SIZE / 2,
      lerp(dice.moveFrom.z, dice.pos.z, t),
    );
  } else {
    mesh.position.set(dice.pos.x, DICE_SIZE / 2, dice.pos.z);
  }
}

/** 消去アニメーション更新 */
export function updateDiceClearAnimation(mesh: THREE.Mesh, dice: DiceData): void {
  if (!dice.clearing) return;

  const t = dice.clearProgress;
  // 発光 → 縮小 → 沈み込み
  const scale = t < 0.3 ? 1 + Math.sin(t / 0.3 * Math.PI) * 0.2 : Math.max(0, 1 - (t - 0.3) / 0.7);
  const y = t > 0.3 ? (DICE_SIZE / 2) * (1 - (t - 0.3) / 0.7) : DICE_SIZE / 2;

  mesh.scale.setScalar(scale);
  mesh.position.y = Math.max(0, y);

  // 発光エフェクト
  const materials = mesh.material as THREE.MeshStandardMaterial[];
  if (Array.isArray(materials)) {
    const emissiveIntensity = t < 0.3 ? Math.sin(t / 0.3 * Math.PI) * 2 : Math.max(0, 1 - (t - 0.3) / 0.7);
    materials.forEach(m => {
      m.emissive = new THREE.Color(0xffffff);
      m.emissiveIntensity = emissiveIntensity;
    });
  }
}

/** サイコロMeshのマテリアルを更新(面が変わった時) */
export function updateDiceMaterials(mesh: THREE.Mesh, dice: DiceData): void {
  const newMaterials = createDiceMaterials(dice);
  const oldMaterials = mesh.material as THREE.MeshStandardMaterial[];
  if (Array.isArray(oldMaterials)) {
    oldMaterials.forEach(m => {
      if (m.map) m.map.dispose();
      m.dispose();
    });
  }
  mesh.material = newMaterials;
}
