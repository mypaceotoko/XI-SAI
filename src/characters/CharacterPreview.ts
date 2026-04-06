import * as THREE from 'three';
import { CharacterId, CHARACTER_LIST } from './CharacterDef';
import { buildCharacterMesh } from './CharacterMesh';

const PREVIEW_SIZE = 128;

/**
 * 全キャラクターのプレビュー画像（dataURL）を生成して返す。
 * 初回呼び出し時のみレンダリングし、以後はキャッシュを返す。
 */
let cache: Record<CharacterId, string> | null = null;

export function generateCharacterPreviews(): Record<CharacterId, string> {
  if (cache) return cache;

  const canvas = document.createElement('canvas');
  canvas.width = PREVIEW_SIZE;
  canvas.height = PREVIEW_SIZE;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(PREVIEW_SIZE, PREVIEW_SIZE);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const dirLight = new THREE.DirectionalLight(0xfff0dd, 3.5);
  dirLight.position.set(2, 4, 2);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x6699cc, 1.2);
  rimLight.position.set(-2, 1, -2);
  scene.add(rimLight);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 20);
  camera.position.set(0.85, 0.80, 1.10);
  camera.lookAt(0, 0.06, 0);

  const result = {} as Record<CharacterId, string>;
  let prevMesh: THREE.Group | null = null;

  for (const charDef of CHARACTER_LIST) {
    if (prevMesh) scene.remove(prevMesh);
    prevMesh = buildCharacterMesh(charDef.id);
    scene.add(prevMesh);

    renderer.render(scene, camera);
    result[charDef.id] = canvas.toDataURL('image/png');
  }

  renderer.dispose();
  cache = result;
  return result;
}
