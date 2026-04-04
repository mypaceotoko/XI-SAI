import * as THREE from 'three';
import { Board } from './Board';
import { DiceData } from '@/types';
import {
  createDiceMesh,
  updateDiceMeshPosition,
  updateDiceClearAnimation,
  updateDiceMaterials,
} from '@/dice/DiceRenderer';

/**
 * 盤面の3D描画を管理
 */
export class BoardRenderer {
  private scene: THREE.Scene;
  private board: Board;
  private diceMeshes: Map<number, THREE.Mesh> = new Map();
  private groundMesh!: THREE.Mesh;
  private gridLines!: THREE.Group;

  constructor(scene: THREE.Scene, board: Board) {
    this.scene = scene;
    this.board = board;
  }

  /** 盤面の3Dオブジェクトを初期化 */
  init(): void {
    this.createGround();
    this.createGridLines();
    this.syncAllDice();
  }

  /** 地面を作成 */
  private createGround(): void {
    const w = this.board.width;
    const d = this.board.depth;
    const geometry = new THREE.PlaneGeometry(w + 0.4, d + 0.4);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.groundMesh = new THREE.Mesh(geometry, material);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.set((w - 1) / 2, -0.01, (d - 1) / 2);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  /** グリッド線を作成 */
  private createGridLines(): void {
    this.gridLines = new THREE.Group();
    const w = this.board.width;
    const d = this.board.depth;
    const material = new THREE.LineBasicMaterial({ color: 0x333355, transparent: true, opacity: 0.5 });

    // 横線
    for (let z = 0; z <= d; z++) {
      const points = [
        new THREE.Vector3(-0.5, 0, z - 0.5),
        new THREE.Vector3(w - 0.5, 0, z - 0.5),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.gridLines.add(new THREE.Line(geometry, material));
    }

    // 縦線
    for (let x = 0; x <= w; x++) {
      const points = [
        new THREE.Vector3(x - 0.5, 0, -0.5),
        new THREE.Vector3(x - 0.5, 0, d - 0.5),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      this.gridLines.add(new THREE.Line(geometry, material));
    }

    this.scene.add(this.gridLines);
  }

  /** 全サイコロのMeshを同期 */
  syncAllDice(): void {
    const currentDice = this.board.getAllDice();
    const currentIds = new Set(currentDice.map(d => d.id));

    // 削除されたサイコロのMeshを除去
    for (const [id, mesh] of this.diceMeshes) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.diceMeshes.delete(id);
      }
    }

    // 新しいサイコロのMeshを追加
    for (const dice of currentDice) {
      if (!this.diceMeshes.has(dice.id)) {
        const mesh = createDiceMesh(dice);
        this.scene.add(mesh);
        this.diceMeshes.set(dice.id, mesh);
      }
    }
  }

  /** 新しいサイコロのMeshを追加 */
  addDiceMesh(dice: DiceData): void {
    if (this.diceMeshes.has(dice.id)) return;
    const mesh = createDiceMesh(dice);
    this.scene.add(mesh);
    this.diceMeshes.set(dice.id, mesh);
  }

  /** サイコロMeshを除去 */
  removeDiceMesh(id: number): void {
    const mesh = this.diceMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.diceMeshes.delete(id);
    }
  }

  /** サイコロの面テクスチャを更新（転がった後） */
  refreshDiceMaterial(dice: DiceData): void {
    const mesh = this.diceMeshes.get(dice.id);
    if (mesh) {
      updateDiceMaterials(mesh, dice);
    }
  }

  /** フレーム更新 */
  update(): void {
    for (const dice of this.board.getAllDice()) {
      const mesh = this.diceMeshes.get(dice.id);
      if (!mesh) continue;

      if (dice.clearing) {
        updateDiceClearAnimation(mesh, dice);
      } else {
        updateDiceMeshPosition(mesh, dice);
      }
    }
  }

  /** クリーンアップ */
  dispose(): void {
    for (const mesh of this.diceMeshes.values()) {
      this.scene.remove(mesh);
    }
    this.diceMeshes.clear();
    if (this.groundMesh) this.scene.remove(this.groundMesh);
    if (this.gridLines) this.scene.remove(this.gridLines);
  }
}
