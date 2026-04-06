import * as THREE from 'three';
import { CharacterId } from './CharacterDef';

/** キャラクターの Three.js メッシュを生成 */
export function buildCharacterMesh(id: CharacterId): THREE.Group {
  switch (id) {
    case 'ball':   return buildBallMesh();
    case 'insect': return buildInsectMesh();
    case 'tank':   return buildTankMesh();
    case 'bird':   return buildBirdMesh();
    case 'mypace': return buildMypaceMesh();
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

// ── マイペース男（チビキャラ 3D モデル） ─────────────────────────

function buildMypaceMesh(): THREE.Group {
  const group = new THREE.Group();

  // ── 黄色い星（背景スプライト、常にカメラを向く） ─────────────────
  const starCanvas = document.createElement('canvas');
  starCanvas.width = starCanvas.height = 256;
  const sc = starCanvas.getContext('2d')!;

  const drawStar5 = (cx: number, cy: number, oR: number, iR: number) => {
    sc.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI / 5) - Math.PI / 2;
      const r = i % 2 === 0 ? oR : iR;
      const x = cx + Math.cos(angle) * r; const y = cy + Math.sin(angle) * r;
      if (i === 0) sc.moveTo(x, y); else sc.lineTo(x, y);
    }
    sc.closePath();
  };
  // 塗りつぶし星
  drawStar5(128, 128, 110, 46);
  const starGrad = sc.createRadialGradient(110, 104, 10, 128, 128, 110);
  starGrad.addColorStop(0, '#ffee55');
  starGrad.addColorStop(1, '#ddaa00');
  sc.fillStyle = starGrad;
  sc.fill();
  // アウトライン星（輪郭）
  sc.lineJoin = 'round';
  drawStar5(128, 128, 104, 43);
  sc.strokeStyle = 'rgba(255,255,200,0.75)';
  sc.lineWidth = 8;
  sc.stroke();

  const starTex = new THREE.CanvasTexture(starCanvas);
  const starMat = new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false });
  const starSprite = new THREE.Sprite(starMat);
  starSprite.renderOrder = -1;
  starSprite.scale.set(1.35, 1.35, 1);
  starSprite.position.y = 0.18;
  group.add(starSprite);

  const skinMat   = new THREE.MeshStandardMaterial({ color: 0xdda870, roughness: 0.72 });
  const blackMat  = new THREE.MeshStandardMaterial({ color: 0x0e0e14, roughness: 0.65 });
  const whiteMat  = new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0xbbbbbb, emissiveIntensity: 0.12 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x13131e, roughness: 0.70 });
  const glassMat  = new THREE.MeshStandardMaterial({ color: 0x040408, roughness: 0.06, metalness: 0.62 });
  const smileMat  = new THREE.MeshStandardMaterial({ color: 0x441111, roughness: 0.8 });

  // ── 大きな丸い頭 ──────────────────────────────────────────────
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
  head.position.y = 0.30;
  head.castShadow = true;
  group.add(head);

  // 耳
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.056, 8, 8), skinMat);
    ear.position.set(side * 0.213, 0.30, 0.0);
    group.add(ear);
  }

  // ── スナップバックキャップ ────────────────────────────────────
  // ドーム（上半球）
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.245, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    blackMat,
  );
  capDome.position.y = 0.38;
  group.add(capDome);

  // キャップバンド（ドーム底のリング）
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.245, 0.245, 0.025, 14),
    new THREE.MeshStandardMaterial({ color: 0x1c1c26, roughness: 0.6 }),
  );
  band.position.y = 0.382;
  group.add(band);

  // ブリム（つば - 前方に突き出す）
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.024, 0.20), blackMat);
  brim.position.set(0, 0.38, -0.20);
  group.add(brim);

  // キャップの白ロゴ（正面の小さな丸）
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.044, 12), whiteMat);
  logo.position.set(0, 0.42, -0.245);
  logo.rotation.x = -0.28;
  group.add(logo);

  // ── 黒いサングラス ────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.090, 0.053, 0.018), glassMat);
    lens.position.set(side * 0.080, 0.30, -0.222);
    group.add(lens);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.016), glassMat);
  bridge.position.set(0, 0.30, -0.222);
  group.add(bridge);

  // ── 笑顔（トーラス弧） ────────────────────────────────────────
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.054, 0.010, 5, 10, Math.PI * 0.75),
    smileMat,
  );
  smile.position.set(0, 0.18, -0.22);
  smile.rotation.z = Math.PI; // 上向きに反転してスマイル形状に
  group.add(smile);

  // ── 体（黒ジャケット） ────────────────────────────────────────
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.20, 0.26), jacketMat);
  torso.position.y = 0.02;
  torso.castShadow = true;
  group.add(torso);

  // 白シャツのぞき（中央のストライプ）
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.090, 0.12, 0.010), whiteMat);
  shirt.position.set(0, 0.06, -0.131);
  group.add(shirt);

  // ── 大きな丸い手 ──────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.083, 10, 10), skinMat);
    hand.position.set(side * 0.265, 0.00, -0.04);
    group.add(hand);
  }

  // ── 短い脚 ───────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.13, 0.075), blackMat);
    leg.position.set(side * 0.090, -0.155, 0.0);
    leg.castShadow = true;
    group.add(leg);
  }

  // ── 大きな丸い靴 ─────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.083, 10, 8), blackMat);
    shoe.position.set(side * 0.090, -0.295, -0.032);
    shoe.scale.set(1.10, 0.54, 1.42);
    shoe.castShadow = true;
    group.add(shoe);
  }

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

/**
 * Bird の Canvas 2D 描画（左向きプロファイルビュー）
 * W=256, H=384 で呼ばれる (s=2, 128基準座標を2倍スケール)
 */
function paintBird(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const s = W / 128; // x/y スケール係数
  const p = (v: number) => v * s; // 座標変換

  // ── 尾羽（最背面、右下から大きくS字カール） ─────────────────
  // 参照画像: 体の右下から出て大きく右下へ伸びS字を描く
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // 尾の曲線定義（体の右下 → 右下へ → S字カール）
  const tailStart = { x: p(97), y: p(82) };
  const tailMid   = { x: p(115), y: p(130) };
  const tailEnd   = { x: p(105), y: H };       // キャンバス底まで伸びる

  // 最外層（暗緑）
  ctx.strokeStyle = '#0d6630'; ctx.lineWidth = p(18);
  ctx.beginPath();
  ctx.moveTo(tailStart.x, tailStart.y);
  ctx.bezierCurveTo(p(112), p(100), tailMid.x, tailMid.y, tailEnd.x, tailEnd.y);
  ctx.stroke();

  // 中層（鮮緑）
  ctx.strokeStyle = '#22bb44'; ctx.lineWidth = p(12);
  ctx.beginPath();
  ctx.moveTo(tailStart.x + p(1), tailStart.y);
  ctx.bezierCurveTo(p(114), p(102), p(117), p(132), p(107), H);
  ctx.stroke();

  // 内層（明るい緑）
  ctx.strokeStyle = '#44dd77'; ctx.lineWidth = p(7);
  ctx.beginPath();
  ctx.moveTo(tailStart.x + p(2), tailStart.y + p(1));
  ctx.bezierCurveTo(p(116), p(104), p(119), p(134), p(109), H);
  ctx.stroke();

  // 黄緑アクセント
  ctx.strokeStyle = '#99ff44'; ctx.lineWidth = p(3.5);
  ctx.beginPath();
  ctx.moveTo(tailStart.x + p(3), tailStart.y + p(2));
  ctx.bezierCurveTo(p(118), p(106), p(121), p(136), p(111), H);
  ctx.stroke();

  // サブ尾羽（少し外側に広がる）
  ctx.strokeStyle = '#1a9944'; ctx.lineWidth = p(9);
  ctx.beginPath();
  ctx.moveTo(p(95), p(85));
  ctx.bezierCurveTo(p(108), p(108), p(110), p(148), p(90), H);
  ctx.stroke();

  ctx.strokeStyle = '#33cc55'; ctx.lineWidth = p(5);
  ctx.beginPath();
  ctx.moveTo(p(94), p(86));
  ctx.bezierCurveTo(p(107), p(110), p(109), p(150), p(88), H);
  ctx.stroke();

  // ── 翼（青〜紺グラデ、体の右に大きく広がる） ────────────────
  const wg = ctx.createLinearGradient(p(72), p(50), p(128), p(96));
  wg.addColorStop(0, '#7788ff');
  wg.addColorStop(0.4, '#3355dd');
  wg.addColorStop(1, '#0e1d88');
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.moveTo(p(73), p(55));
  ctx.bezierCurveTo(p(98), p(46), p(128), p(54), p(126), p(86));
  ctx.bezierCurveTo(p(122), p(106), p(94), p(108), p(76), p(97));
  ctx.bezierCurveTo(p(68), p(87), p(67), p(68), p(73), p(55));
  ctx.fill();

  // 翼の羽毛ライン（細い横線）
  ctx.strokeStyle = 'rgba(90,115,230,0.55)'; ctx.lineWidth = p(1.2);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    ctx.beginPath();
    ctx.moveTo(p(74 + t * 46), p(56 + t * 32));
    ctx.lineTo(p(76 + t * 39), p(95 + t * 11));
    ctx.stroke();
  }
  // 翼端の暗い独立羽毛
  ctx.strokeStyle = '#0a1060'; ctx.lineWidth = p(2.8);
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(p(118 + i * 1.2), p(60 + i * 5));
    ctx.lineTo(p(124 + i * 0.8), p(74 + i * 6));
    ctx.stroke();
  }

  // ── 体（ティール、左向き卵型） ──────────────────────────────
  const bodg = ctx.createRadialGradient(p(78), p(70), p(5), p(80), p(73), p(30));
  bodg.addColorStop(0, '#66ddd0');
  bodg.addColorStop(0.45, '#229999');
  bodg.addColorStop(1, '#0d5555');
  ctx.fillStyle = bodg;
  ctx.beginPath();
  ctx.ellipse(p(80), p(74), p(27), p(31), -0.05, 0, Math.PI * 2);
  ctx.fill();

  // ── 胸（クリーム→錆赤、体の左前面） ─────────────────────────
  const chg = ctx.createLinearGradient(p(58), p(54), p(62), p(90));
  chg.addColorStop(0, '#ece8d6');
  chg.addColorStop(0.25, '#dd8855');
  chg.addColorStop(0.6, '#aa4422');
  chg.addColorStop(1, 'rgba(120,40,20,0)');
  ctx.fillStyle = chg;
  ctx.beginPath();
  ctx.ellipse(p(63), p(72), p(19), p(26), -0.18, 0, Math.PI * 2);
  ctx.fill();

  // ── 足・爪（2本脚、左前方に向いた鋭い爪） ───────────────────
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#282838'; ctx.lineWidth = p(4);
  // 前足
  const f1x = p(64), f1y = p(97);
  for (const [tx, ty] of [
    [p(46), p(114)], [p(54), p(118)], [p(63), p(117)], [p(72), p(111)],
  ] as [number,number][]) {
    ctx.beginPath(); ctx.moveTo(f1x, f1y);
    ctx.quadraticCurveTo(f1x + (tx-f1x)*0.35, f1y + p(10), tx, ty);
    ctx.stroke();
  }
  // 後足
  ctx.strokeStyle = '#38384a'; ctx.lineWidth = p(3);
  const f2x = p(77), f2y = p(99);
  for (const [tx, ty] of [
    [p(66), p(112)], [p(76), p(118)], [p(85), p(113)], [p(92), p(107)],
  ] as [number,number][]) {
    ctx.beginPath(); ctx.moveTo(f2x, f2y);
    ctx.quadraticCurveTo(f2x + (tx-f2x)*0.35, f2y + p(8), tx, ty);
    ctx.stroke();
  }

  // ── 頭部（左向きプロファイル楕円） ──────────────────────────
  const hdg = ctx.createRadialGradient(p(57), p(36), p(5), p(61), p(40), p(26));
  hdg.addColorStop(0, '#88eecc');
  hdg.addColorStop(0.4, '#33aaaa');
  hdg.addColorStop(1, '#0f5560');
  ctx.fillStyle = hdg;
  ctx.beginPath();
  ctx.ellipse(p(61), p(41), p(24), p(23), -0.08, 0, Math.PI * 2);
  ctx.fill();

  // ── ヘアクレスト（黒い大きなポンパドール） ────────────────────
  // 参照画像: 頭頂から右後方へ大きくうねる黒髪の束
  ctx.lineCap = 'round';
  const crests: [number,number,number,number,number,number,number][] = [
    [p(64), p(22), p(90),  p(4), p(108),  p(3), p(8)],
    [p(62), p(24), p(87),  p(8), p(103),  p(7), p(6.5)],
    [p(61), p(26), p(84), p(12), p(98),  p(12), p(5.5)],
    [p(60), p(28), p(80), p(16), p(93),  p(17), p(4.5)],
    [p(59), p(30), p(76), p(20), p(88),  p(22), p(3.8)],
    [p(58), p(32), p(72), p(24), p(83),  p(28), p(3.0)],
    [p(58), p(34), p(68), p(28), p(78),  p(33), p(2.2)],
  ];
  for (let i = 0; i < crests.length; i++) {
    const [sx, sy, cx, cy, ex, ey, lw] = crests[i];
    ctx.strokeStyle = i < 3 ? '#0c0c16' : '#1a1a26';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  // 根元のボリューム（ふんわりした暗い塊）
  const hb = ctx.createRadialGradient(p(64), p(28), 0, p(67), p(31), p(16));
  hb.addColorStop(0, 'rgba(18,18,28,0.90)');
  hb.addColorStop(1, 'rgba(12,12,20,0)');
  ctx.fillStyle = hb;
  ctx.beginPath();
  ctx.ellipse(p(67), p(30), p(15), p(11), 0.35, 0, Math.PI * 2);
  ctx.fill();

  // ── くちばし（左向き、口を開けて歯が見える） ─────────────────
  // 上あご
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(p(40), p(40));
  ctx.lineTo(p(19), p(45));
  ctx.lineTo(p(20), p(49));
  ctx.lineTo(p(39), p(47));
  ctx.closePath(); ctx.fill();
  // 上あご上面ハイライト
  ctx.fillStyle = '#dedede';
  ctx.beginPath();
  ctx.moveTo(p(40), p(40)); ctx.lineTo(p(19), p(45)); ctx.lineTo(p(24), p(43)); ctx.lineTo(p(40), p(38));
  ctx.closePath(); ctx.fill();
  // 下あご
  ctx.fillStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.moveTo(p(39), p(48)); ctx.lineTo(p(22), p(50)); ctx.lineTo(p(24), p(57)); ctx.lineTo(p(38), p(56));
  ctx.closePath(); ctx.fill();
  // 口内（暗い赤）
  ctx.fillStyle = '#661111';
  ctx.beginPath();
  ctx.moveTo(p(40), p(40)); ctx.lineTo(p(19), p(46)); ctx.lineTo(p(39), p(48));
  ctx.closePath(); ctx.fill();
  // 上歯
  ctx.fillStyle = '#e8e8c4';
  for (let i = 0; i < 5; i++) {
    const tx = p(38.5 - i * 4);
    ctx.beginPath();
    ctx.moveTo(tx, p(47)); ctx.lineTo(tx - p(1.5), p(53)); ctx.lineTo(tx - p(3), p(47));
    ctx.fill();
  }
  // 下歯
  ctx.fillStyle = '#ddddb8';
  for (let i = 0; i < 4; i++) {
    const tx = p(37 - i * 4);
    ctx.beginPath();
    ctx.moveTo(tx, p(49)); ctx.lineTo(tx - p(1.2), p(54)); ctx.lineTo(tx - p(2.4), p(49));
    ctx.fill();
  }

  // ── 目（左横顔→片目のみ、大きな黄色い目） ───────────────────
  const EX = p(50), EY = p(36), ER = p(12);
  // 暗い眼窩
  ctx.fillStyle = '#142016';
  ctx.beginPath(); ctx.arc(EX, EY, ER + p(2.5), 0, Math.PI * 2); ctx.fill();
  // 黄色い虹彩
  const eyeGrad = ctx.createRadialGradient(EX - p(2), EY - p(2), p(1), EX, EY, ER);
  eyeGrad.addColorStop(0, '#ffff55');
  eyeGrad.addColorStop(0.5, '#ccee00');
  eyeGrad.addColorStop(0.85, '#99aa00');
  eyeGrad.addColorStop(1, '#666600');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2); ctx.fill();
  // 黒い瞳孔
  ctx.fillStyle = '#060606';
  ctx.beginPath(); ctx.arc(EX, EY, ER * 0.4, 0, Math.PI * 2); ctx.fill();
  // 主ハイライト
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.arc(EX - p(3.5), EY - p(3.5), p(3), 0, Math.PI * 2); ctx.fill();
  // 副ハイライト
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.arc(EX + p(3), EY - p(1.5), p(1.5), 0, Math.PI * 2); ctx.fill();

  // ── 光沢オーバーレイ ─────────────────────────────────────────
  const shimmer = ctx.createLinearGradient(p(42), p(34), p(75), p(88));
  shimmer.addColorStop(0, 'rgba(200,255,245,0.14)');
  shimmer.addColorStop(0.5, 'rgba(140,230,210,0.06)');
  shimmer.addColorStop(1, 'rgba(80,180,160,0)');
  ctx.fillStyle = shimmer;
  ctx.beginPath();
  ctx.ellipse(p(61), p(41), p(22), p(21), -0.08, 0, Math.PI * 2);
  ctx.fill();
}
