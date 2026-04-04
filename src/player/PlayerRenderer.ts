import * as THREE from 'three';
import { PlayerData } from '@/types';
import { lerp, easeOutCubic } from '@/utils';

const PLAYER_SIZE = 0.4;

/**
 * プレイヤーの3D描画
 */
export class PlayerRenderer {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  private bobPhase = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mesh = this.createPlayerMesh();
    this.scene.add(this.mesh);
  }

  private createPlayerMesh(): THREE.Group {
    const group = new THREE.Group();

    // 体（球体）
    const bodyGeometry = new THREE.SphereGeometry(PLAYER_SIZE, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0x003322,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    // 目（2つの小さな球体）
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 0.1, -0.32);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 0.1, -0.32);
    group.add(rightEye);

    // 瞳
    const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.12, 0.1, -0.38);
    group.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.12, 0.1, -0.38);
    group.add(rightPupil);

    return group;
  }

  /** フレーム更新 */
  update(player: PlayerData): void {
    this.bobPhase += 0.08;

    let x: number, z: number;

    if (player.moving && player.moveFrom) {
      const t = easeOutCubic(player.moveProgress);
      x = lerp(player.moveFrom.x, player.pos.x, t);
      z = lerp(player.moveFrom.z, player.pos.z, t);
    } else {
      x = player.pos.x;
      z = player.pos.z;
    }

    // ボブ（上下の揺れ）
    const bobY = Math.sin(this.bobPhase) * 0.05;
    this.mesh.position.set(x, 0.95 + PLAYER_SIZE + bobY, z);

    // 向きに応じて回転
    const dirAngles: Record<string, number> = {
      north: 0,
      east: -Math.PI / 2,
      south: Math.PI,
      west: Math.PI / 2,
    };
    const targetAngle = dirAngles[player.direction] ?? 0;
    // 滑らかに回転
    const currentAngle = this.mesh.rotation.y;
    let diff = targetAngle - currentAngle;
    // -PI ~ PI に正規化
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.mesh.rotation.y += diff * 0.2;
  }

  /** クリーンアップ */
  dispose(): void {
    this.scene.remove(this.mesh);
  }
}
