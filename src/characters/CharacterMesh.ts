import * as THREE from 'three';
import { CharacterId } from './CharacterDef';

/** キャラクターの Three.js メッシュを生成 */
export function buildCharacterMesh(id: CharacterId): THREE.Group {
  switch (id) {
    case 'ball':   return buildBallMesh();
    case 'insect': return buildInsectMesh();
    case 'tank':   return buildTankMesh();
  }
}

// ── レッドボール ─────────────────────────────────────────────────

function buildBallMesh(): THREE.Group {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x331111,
    emissiveIntensity: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
  });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.1, 0.08, -0.28);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.1, 0.08, -0.28);
  group.add(rightEye);

  const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.position.set(-0.1, 0.08, -0.34);
  group.add(leftPupil);
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rightPupil.position.set(0.1, 0.08, -0.34);
  group.add(rightPupil);

  return group;
}

// ── グリーンアイ（一つ目昆虫） ───────────────────────────────────

function buildInsectMesh(): THREE.Group {
  const group = new THREE.Group();

  // 胴体（縦長シリンダー）
  const bodyGeo = new THREE.CylinderGeometry(0.13, 0.20, 0.42, 8);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x44aa33,
    roughness: 0.55,
    metalness: 0.05,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = -0.07;
  body.castShadow = true;
  group.add(body);

  // 緑の斑点
  const spotMat = new THREE.MeshStandardMaterial({ color: 0x226611 });
  const spotData: [number, number, number][] = [[-0.09, 0.0, -0.17], [0.10, 0.06, -0.16], [-0.04, -0.10, -0.18]];
  for (const [sx, sy, sz] of spotData) {
    const spotGeo = new THREE.SphereGeometry(0.032, 5, 5);
    const spot = new THREE.Mesh(spotGeo, spotMat);
    spot.position.set(sx, sy, sz);
    group.add(spot);
  }

  // 頭部
  const headGeo = new THREE.SphereGeometry(0.17, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x55cc44,
    roughness: 0.45,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.24;
  group.add(head);

  // 大きな一つ目（前面中央）
  const eyeGeo = new THREE.SphereGeometry(0.10, 10, 10);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xeeffcc,
    emissiveIntensity: 0.25,
  });
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.set(0, 0.26, -0.14);
  group.add(eye);

  // 瞳
  const pupilGeo = new THREE.SphereGeometry(0.058, 9, 9);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111100 });
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  pupil.position.set(0, 0.26, -0.21);
  group.add(pupil);

  // ハイライト
  const hlGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
  const hl = new THREE.Mesh(hlGeo, hlMat);
  hl.position.set(-0.025, 0.29, -0.23);
  group.add(hl);

  // 触覚
  const antMat = new THREE.MeshStandardMaterial({ color: 0x226611 });
  for (const side of [-1, 1]) {
    const antGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.26, 5);
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(side * 0.1, 0.40, -0.04);
    ant.rotation.z = side * 0.45;
    ant.rotation.x = -0.25;
    group.add(ant);
    // 触覚の先端球
    const tipGeo = new THREE.SphereGeometry(0.028, 6, 6);
    const tip = new THREE.Mesh(tipGeo, antMat);
    tip.position.set(side * 0.17, 0.52, -0.10);
    group.add(tip);
  }

  // 脚（左右各3本）
  const legMat = new THREE.MeshStandardMaterial({ color: 0x338822 });
  const legYPositions = [0.0, -0.08, -0.18];
  for (const side of [-1, 1]) {
    for (let i = 0; i < legYPositions.length; i++) {
      const legGeo = new THREE.CylinderGeometry(0.016, 0.010, 0.25, 5);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(side * 0.24, legYPositions[i] - 0.07, 0.02 * i);
      // 水平に近い角度で斜め下に
      leg.rotation.z = side * (Math.PI / 2 - 0.25);
      group.add(leg);
    }
  }

  return group;
}

// ── タンクヘッド ─────────────────────────────────────────────────

function buildTankMesh(): THREE.Group {
  const group = new THREE.Group();

  // キャタピラ左右
  const trackMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a50,
    roughness: 0.85,
    metalness: 0.45,
  });
  for (const side of [-1, 1]) {
    const trackGeo = new THREE.BoxGeometry(0.17, 0.19, 0.48);
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(side * 0.24, -0.23, 0);
    track.castShadow = true;
    group.add(track);

    // ホイール
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x555570, metalness: 0.65, roughness: 0.4 });
    for (const zOff of [-0.16, 0, 0.16]) {
      const wheelGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.055, 8);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(side * 0.24, -0.23, zOff);
      wheel.rotation.z = Math.PI / 2;
      group.add(wheel);
    }
  }

  // 胴体（トラックをつなぐ）
  const torsoGeo = new THREE.BoxGeometry(0.38, 0.13, 0.42);
  const torsoMat = new THREE.MeshStandardMaterial({ color: 0x50506a, roughness: 0.7, metalness: 0.3 });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = -0.14;
  group.add(torso);

  // 大きな丸い頭
  const headGeo = new THREE.SphereGeometry(0.27, 14, 14);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xd4a98a,
    roughness: 0.62,
    metalness: 0.0,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 0.11;
  head.scale.set(1, 0.88, 1);
  head.castShadow = true;
  group.add(head);

  // 目
  const eyeGeo = new THREE.SphereGeometry(0.068, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.11, 0.20, -0.22);
    group.add(eye);

    const pupilGeo = new THREE.SphereGeometry(0.036, 7, 7);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(side * 0.11, 0.20, -0.27);
    group.add(pupil);
  }

  // 口（暗い球でくぼみを表現）
  const mouthGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x661111 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, 0.00, -0.27);
  mouth.scale.set(1.4, 0.65, 0.6);
  group.add(mouth);

  // 舌
  const tongueGeo = new THREE.SphereGeometry(0.055, 6, 6);
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xee2222 });
  const tongue = new THREE.Mesh(tongueGeo, tongueMat);
  tongue.position.set(0, -0.07, -0.27);
  tongue.scale.set(1.1, 0.5, 0.85);
  group.add(tongue);

  // よだれ
  const droolGeo = new THREE.CylinderGeometry(0.012, 0.006, 0.10, 4);
  const droolMat = new THREE.MeshStandardMaterial({ color: 0xaadddd, transparent: true, opacity: 0.72 });
  const drool = new THREE.Mesh(droolGeo, droolMat);
  drool.position.set(0.03, -0.12, -0.27);
  group.add(drool);

  // 短い腕
  const armMat = new THREE.MeshStandardMaterial({ color: 0xc09070 });
  for (const side of [-1, 1]) {
    const armGeo = new THREE.CylinderGeometry(0.048, 0.038, 0.16, 6);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(side * 0.32, 0.05, -0.10);
    arm.rotation.z = side * 0.55;
    arm.rotation.x = 0.3;
    group.add(arm);

    const fistGeo = new THREE.SphereGeometry(0.058, 6, 6);
    const fist = new THREE.Mesh(fistGeo, armMat);
    fist.position.set(side * 0.38, -0.03, -0.12);
    group.add(fist);
  }

  return group;
}
