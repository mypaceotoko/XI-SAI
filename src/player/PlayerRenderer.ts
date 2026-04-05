import * as THREE from 'three';
import { PlayerData } from '@/types';
import { lerp, easeOutCubic } from '@/utils';

const PLAYER_SIZE = 0.35;
const DICE_HEIGHT = 0.9; // サイコロの高さと一致させる

/**
 * プレイヤーの3D描画
 * サイコロの上に乗るキャラクター
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

    // 体（丸っこいキャラクター）
    const bodyGeometry = new THREE.SphereGeometry(PLAYER_SIZE, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x331111,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    // 目（2つの小さな球体）
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.08, -0.28);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.08, -0.28);
    group.add(rightEye);

    // 瞳
    const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.1, 0.08, -0.34);
    group.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.1, 0.08, -0.34);
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

    // 高さ計算: サイコロの上 or 地面
    let baseY: number;
    if (player.level === 'on_dice') {
      baseY = DICE_HEIGHT + PLAYER_SIZE;
    } else {
      baseY = PLAYER_SIZE;
    }

    // 移動中の高さ遷移
    if (player.moving && player.moveFrom) {
      const t = easeOutCubic(player.moveProgress);
      if (player.moveType === 'climb') {
        // 地面→サイコロ上: 上に登るアニメーション
        const groundY = PLAYER_SIZE;
        const diceY = DICE_HEIGHT + PLAYER_SIZE;
        baseY = lerp(groundY, diceY, t);
        // 途中でジャンプ感を出す
        baseY += Math.sin(t * Math.PI) * 0.3;
      } else if (player.moveType === 'descend') {
        // サイコロ上→地面: 降りるアニメーション
        const diceY = DICE_HEIGHT + PLAYER_SIZE;
        const groundY = PLAYER_SIZE;
        baseY = lerp(diceY, groundY, t);
      } else if (player.moveType === 'ride_roll') {
        // サイコロに乗って転がる: サイコロの円弧に追従
        const r = DICE_HEIGHT * Math.SQRT2 / 2;
        const diceArcY = r * Math.sin(Math.PI / 4 + player.moveProgress * Math.PI / 2);
        baseY = diceArcY + DICE_HEIGHT / 2 + PLAYER_SIZE;
      }
    }

    // ボブ（上下の揺れ）
    const bobY = Math.sin(this.bobPhase) * 0.03;
    this.mesh.position.set(x, baseY + bobY, z);

    // 向きに応じて回転
    const dirAngles: Record<string, number> = {
      north: 0,
      east: -Math.PI / 2,
      south: Math.PI,
      west: Math.PI / 2,
    };
    const targetAngle = dirAngles[player.direction] ?? 0;
    const currentAngle = this.mesh.rotation.y;
    let diff = targetAngle - currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.mesh.rotation.y += diff * 0.25;
  }

  /** クリーンアップ */
  dispose(): void {
    this.scene.remove(this.mesh);
  }
}
