import * as THREE from 'three';
import { PlayerData } from '@/types';
import { lerp, easeOutCubic } from '@/utils';
import { CharacterId } from '@/characters/CharacterDef';
import { buildCharacterMesh } from '@/characters/CharacterMesh';

const DICE_HEIGHT = 0.9;

/**
 * プレイヤーの3D描画
 */
export class PlayerRenderer {
  private mesh: THREE.Group;
  private scene: THREE.Scene;
  private bobPhase = 0;

  constructor(scene: THREE.Scene, characterId: CharacterId = 'ball') {
    this.scene = scene;
    this.mesh = buildCharacterMesh(characterId);
    this.scene.add(this.mesh);
  }

  /** キャラクター切り替え */
  setCharacter(id: CharacterId): void {
    this.scene.remove(this.mesh);
    this.mesh = buildCharacterMesh(id);
    this.scene.add(this.mesh);
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

    const PLAYER_R = this.mesh.children.length > 0
      ? 0.35
      : 0.35;

    let baseY: number;
    if (player.level === 'on_dice') {
      baseY = DICE_HEIGHT + PLAYER_R;
    } else {
      baseY = PLAYER_R;
    }

    if (player.moving && player.moveFrom) {
      const t = easeOutCubic(player.moveProgress);
      if (player.moveType === 'climb') {
        const groundY = PLAYER_R;
        const diceY   = DICE_HEIGHT + PLAYER_R;
        baseY = lerp(groundY, diceY, t);
        baseY += Math.sin(t * Math.PI) * 0.3;
      } else if (player.moveType === 'descend') {
        const diceY   = DICE_HEIGHT + PLAYER_R;
        const groundY = PLAYER_R;
        baseY = lerp(diceY, groundY, t);
      } else if (player.moveType === 'ride_roll') {
        const r = DICE_HEIGHT * Math.SQRT2 / 2;
        const diceArcY = r * Math.sin(Math.PI / 4 + player.moveProgress * Math.PI / 2);
        baseY = diceArcY + DICE_HEIGHT / 2 + PLAYER_R;
      }
    }

    const bobY = Math.sin(this.bobPhase) * 0.03;
    this.mesh.position.set(x, baseY + bobY, z);

    const dirAngles: Record<string, number> = {
      north: 0,
      east:  -Math.PI / 2,
      south: Math.PI,
      west:  Math.PI / 2,
    };
    const targetAngle  = dirAngles[player.direction] ?? 0;
    const currentAngle = this.mesh.rotation.y;
    let diff = targetAngle - currentAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.mesh.rotation.y += diff * 0.25;
  }

  /** クリーンアップ */
  dispose(): void {
    this.scene.remove(this.mesh);
  }
}
