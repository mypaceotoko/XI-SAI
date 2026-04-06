import * as THREE from 'three';
import { CharacterId } from './CharacterDef';

/** キャラクターの Three.js メッシュを生成 */
export function buildCharacterMesh(id: CharacterId): THREE.Group {
  switch (id) {
    case 'ball':   return buildBallMesh();
    case 'insect': return buildInsectMesh();
    case 'tank':   return buildTankMesh();
    case 'bird':   return buildBirdMesh();
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

// ── バードレイザー（2D スプライト） ──────────────────────────────

function buildBirdMesh(): THREE.Group {
  const group = new THREE.Group();

  // ── 地面影（楕円のプレーン） ──────────────────────────────────
  const shadowGeo = new THREE.PlaneGeometry(0.55, 0.22);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.30,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.33; // グループ中心より下（地面レベル）
  group.add(shadow);

  // ── ソフトグロー（後ろに透明なオーラ） ───────────────────────
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 64;
  const gc = glowCanvas.getContext('2d')!;
  const glowGrad = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
  glowGrad.addColorStop(0,   'rgba(0, 220, 160, 0.28)');
  glowGrad.addColorStop(0.5, 'rgba(0, 180, 120, 0.12)');
  glowGrad.addColorStop(1,   'rgba(0, 150, 100, 0)');
  gc.fillStyle = glowGrad;
  gc.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex, transparent: true, depthWrite: false, opacity: 0.85,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(1.1, 1.6, 1);
  glow.position.y = 0.18;
  group.add(glow);

  // ── メインスプライト（Canvas 2D で描画 → PNG ロードで差し替え） ──
  const birdCanvas = drawBirdCanvasInGame();
  const birdTex = new THREE.CanvasTexture(birdCanvas);

  const birdMat = new THREE.SpriteMaterial({
    map: birdTex,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(birdMat);
  // canvas が 256x384 (比率 2:3) → scale.x : scale.y = 2 : 3
  sprite.scale.set(0.68, 1.02, 1);
  sprite.position.y = 0.16;
  group.add(sprite);

  // PNG が存在すれば差し替え（透過 PNG を想定）
  const baseUrl = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  const loader = new THREE.TextureLoader();
  loader.load(
    `${baseUrl}characters/character-d.png`,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      birdMat.map = tex;
      birdMat.needsUpdate = true;
      // PNG のアスペクト比に合わせてスケール調整
      const img = tex.image as HTMLImageElement;
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalHeight / img.naturalWidth;
        sprite.scale.set(0.68, 0.68 * ratio, 1);
      }
    },
    undefined,
    () => { /* 読み込み失敗 → canvas texture のまま */ },
  );

  return group;
}

/** ゲーム内スプライト用の Bird Canvas（256×384, 2:3比率） */
function drawBirdCanvasInGame(): HTMLCanvasElement {
  const W = 256, H = 384;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  paintBird(ctx, W, H);
  return c;
}

/** Bird の Canvas 2D 描画（W×H に正規化した座標で描く） */
function paintBird(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const s = W / 128; // スケール係数（128基準）

  // ── 長い尾羽（最背面） ──────────────────────────────────────
  // S字カーブ: 体下部から左下へ大きくカール
  ctx.save();
  ctx.strokeStyle = '#1a9944';
  ctx.lineWidth = 14 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(72 * s, 205 * s);
  ctx.bezierCurveTo(40 * s, 240 * s, 20 * s, 280 * s, 30 * s, 330 * s);
  ctx.bezierCurveTo(38 * s, 360 * s, 70 * s, 370 * s, 60 * s, 350 * s);
  ctx.strokeStyle = '#22bb55';
  ctx.stroke();

  // 外側の尾羽（より明るい緑）
  ctx.strokeStyle = '#44ee77';
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(78 * s, 208 * s);
  ctx.bezierCurveTo(50 * s, 248 * s, 28 * s, 290 * s, 42 * s, 335 * s);
  ctx.bezierCurveTo(50 * s, 358 * s, 80 * s, 362 * s, 68 * s, 345 * s);
  ctx.stroke();

  // 黄緑のアクセント羽
  ctx.strokeStyle = '#99ff44';
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  ctx.moveTo(82 * s, 210 * s);
  ctx.bezierCurveTo(55 * s, 255 * s, 35 * s, 300 * s, 52 * s, 340 * s);
  ctx.stroke();
  ctx.restore();

  // ── 翼（青紫〜紺のグラデーション） ─────────────────────────
  ctx.save();
  const wingGrad = ctx.createLinearGradient(80 * s, 100 * s, 120 * s, 200 * s);
  wingGrad.addColorStop(0, '#5566ee');
  wingGrad.addColorStop(0.4, '#3344cc');
  wingGrad.addColorStop(1, '#112288');
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(78 * s, 110 * s);
  ctx.bezierCurveTo(110 * s, 100 * s, 128 * s, 130 * s, 120 * s, 175 * s);
  ctx.bezierCurveTo(115 * s, 210 * s, 90 * s, 220 * s, 75 * s, 205 * s);
  ctx.closePath();
  ctx.fill();

  // 翼の羽毛ライン
  ctx.strokeStyle = 'rgba(100,130,255,0.6)';
  ctx.lineWidth = 1.5 * s;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    ctx.beginPath();
    ctx.moveTo((80 + t * 38) * s, (115 + t * 60) * s);
    ctx.lineTo((75 + t * 18) * s, (185 + t * 20) * s);
    ctx.stroke();
  }
  ctx.restore();

  // ── 体（ティール楕円） ──────────────────────────────────────
  ctx.save();
  const bodyGrad = ctx.createRadialGradient(64 * s, 165 * s, 5 * s, 68 * s, 160 * s, 42 * s);
  bodyGrad.addColorStop(0, '#55ddcc');
  bodyGrad.addColorStop(0.5, '#22aa99');
  bodyGrad.addColorStop(1, '#116655');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(66 * s, 165 * s, 38 * s, 50 * s, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 胸（赤橙パッチ） ────────────────────────────────────────
  ctx.save();
  const chestGrad = ctx.createRadialGradient(58 * s, 158 * s, 2 * s, 60 * s, 162 * s, 26 * s);
  chestGrad.addColorStop(0, '#ff8844');
  chestGrad.addColorStop(0.6, '#cc4422');
  chestGrad.addColorStop(1, 'rgba(150,40,20,0)');
  ctx.fillStyle = chestGrad;
  ctx.beginPath();
  ctx.ellipse(58 * s, 160 * s, 24 * s, 30 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 足・爪 ─────────────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = '#444455';
  ctx.lineWidth = 3.5 * s;
  ctx.lineCap = 'round';
  // 左足
  ctx.beginPath(); ctx.moveTo(58 * s, 210 * s); ctx.lineTo(44 * s, 240 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44 * s, 240 * s); ctx.lineTo(32 * s, 252 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44 * s, 240 * s); ctx.lineTo(46 * s, 255 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44 * s, 240 * s); ctx.lineTo(55 * s, 250 * s); ctx.stroke();
  // 右足
  ctx.beginPath(); ctx.moveTo(72 * s, 210 * s); ctx.lineTo(82 * s, 238 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(82 * s, 238 * s); ctx.lineTo(75 * s, 252 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(82 * s, 238 * s); ctx.lineTo(88 * s, 252 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(82 * s, 238 * s); ctx.lineTo(96 * s, 248 * s); ctx.stroke();
  ctx.restore();

  // ── 頭部 ────────────────────────────────────────────────────
  ctx.save();
  const headGrad = ctx.createRadialGradient(60 * s, 100 * s, 4 * s, 64 * s, 108 * s, 36 * s);
  headGrad.addColorStop(0, '#66eedd');
  headGrad.addColorStop(0.5, '#22aaaa');
  headGrad.addColorStop(1, '#116666');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(63 * s, 110 * s, 32 * s, 36 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── ヘアクレスト（黒い逆立った毛） ─────────────────────────
  ctx.save();
  const hairColors = ['#1a1a2a', '#2a2a3a', '#111118'];
  const hairStrands = [
    { x1: 68, y1: 76, x2: 80, y2: 30, cx: 90, cy: 48 },
    { x1: 64, y1: 74, x2: 70, y2: 22, cx: 82, cy: 42 },
    { x1: 60, y1: 75, x2: 60, y2: 18, cx: 72, cy: 38 },
    { x1: 58, y1: 78, x2: 50, y2: 24, cx: 62, cy: 40 },
    { x1: 55, y1: 80, x2: 44, y2: 32, cx: 54, cy: 48 },
  ];
  for (let i = 0; i < hairStrands.length; i++) {
    const h = hairStrands[i];
    ctx.strokeStyle = hairColors[i % hairColors.length];
    ctx.lineWidth = (4 - i * 0.4) * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(h.x1 * s, h.y1 * s);
    ctx.quadraticCurveTo(h.cx * s, h.cy * s, h.x2 * s, h.y2 * s);
    ctx.stroke();
  }
  ctx.restore();

  // ── くちばし（開いた状態） ────────────────────────────────
  ctx.save();
  // 上あご
  ctx.fillStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.moveTo(34 * s, 112 * s);
  ctx.lineTo(50 * s, 108 * s);
  ctx.lineTo(50 * s, 116 * s);
  ctx.lineTo(36 * s, 118 * s);
  ctx.closePath();
  ctx.fill();
  // 下あご
  ctx.fillStyle = '#999999';
  ctx.beginPath();
  ctx.moveTo(36 * s, 118 * s);
  ctx.lineTo(50 * s, 116 * s);
  ctx.lineTo(48 * s, 124 * s);
  ctx.lineTo(38 * s, 126 * s);
  ctx.closePath();
  ctx.fill();
  // 口内（暗い）
  ctx.fillStyle = '#551111';
  ctx.beginPath();
  ctx.moveTo(50 * s, 108 * s);
  ctx.lineTo(50 * s, 124 * s);
  ctx.lineTo(38 * s, 128 * s);
  ctx.lineTo(36 * s, 118 * s);
  ctx.closePath();
  ctx.fill();
  // 歯
  ctx.fillStyle = '#eeeecc';
  ctx.lineWidth = 0;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((50 - i * 2.5) * s, 109 * s);
    ctx.lineTo((49 - i * 2.5) * s, 114 * s);
    ctx.lineTo((48 - i * 2.5) * s, 109 * s);
    ctx.fill();
  }
  ctx.restore();

  // ── 目（黄色、大きい） ─────────────────────────────────────
  ctx.save();
  // 外縁（くぼみ）
  ctx.fillStyle = '#223322';
  ctx.beginPath();
  ctx.arc(58 * s, 104 * s, 17 * s, 0, Math.PI * 2);
  ctx.fill();
  // 黄色虹彩
  const eyeGrad = ctx.createRadialGradient(57 * s, 103 * s, 1 * s, 58 * s, 104 * s, 14 * s);
  eyeGrad.addColorStop(0, '#ffff44');
  eyeGrad.addColorStop(0.6, '#ddaa00');
  eyeGrad.addColorStop(1, '#886600');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(58 * s, 104 * s, 14 * s, 0, Math.PI * 2);
  ctx.fill();
  // 黒瞳
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(58 * s, 105 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();
  // ハイライト
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(54 * s, 100 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 全体に微光沢オーバーレイ ─────────────────────────────
  ctx.save();
  const shimmer = ctx.createLinearGradient(40 * s, 85 * s, 80 * s, 200 * s);
  shimmer.addColorStop(0, 'rgba(180,255,240,0.12)');
  shimmer.addColorStop(0.5, 'rgba(120,220,200,0.05)');
  shimmer.addColorStop(1, 'rgba(80,180,150,0)');
  ctx.fillStyle = shimmer;
  ctx.beginPath();
  ctx.ellipse(63 * s, 110 * s, 30 * s, 34 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
