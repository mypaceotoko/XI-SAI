import { CharacterId, CHARACTER_LIST } from './CharacterDef';

const S = 128; // canvas size

/**
 * 全キャラクターのプレビュー画像（dataURL）を Canvas 2D で生成。
 * WebGL コンテキストを追加消費しないため安全。
 */
let cache: Record<CharacterId, string> | null = null;

export function generateCharacterPreviews(): Record<CharacterId, string> {
  if (cache) return cache;
  const result = {} as Record<CharacterId, string>;
  for (const c of CHARACTER_LIST) {
    result[c.id] = drawPreview(c.id);
  }
  cache = result;
  return result;
}

function makeCtx(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width  = S;
  canvas.height = S;
  return canvas.getContext('2d')!;
}

function drawPreview(id: CharacterId): string {
  switch (id) {
    case 'bird':   return drawBird();
    case 'ball':   return drawBall();
    case 'insect': return drawInsect();
    case 'tank':   return drawTank();
  }
}

// ── レッドボール ─────────────────────────────────────────────────

function drawBall(): string {
  const ctx = makeCtx();
  const cx = 64, cy = 68, r = 46;

  // 本体グラデーション
  const g = ctx.createRadialGradient(cx - 14, cy - 14, 4, cx, cy, r);
  g.addColorStop(0, '#ff8888');
  g.addColorStop(1, '#bb1111');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // 光沢
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 16, 12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fill();

  // 白目
  for (const [ex, ey] of [[50, 62], [78, 62]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }
  // 瞳
  for (const [px, py] of [[52, 64], [80, 64]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; ctx.fill();
  }

  return ctx.canvas.toDataURL();
}

// ── グリーンアイ ─────────────────────────────────────────────────

function drawInsect(): string {
  const ctx = makeCtx();

  // 脚（胴体より先に描く）
  ctx.strokeStyle = '#338822'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (const [ax, ay, bx, by] of [
    [42, 72, 22, 78], [42, 82, 20, 90], [42, 92, 22, 102],
    [86, 72, 106, 78], [86, 82, 108, 90], [86, 92, 106, 102],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }

  // 胴体（縦長楕円）
  ctx.save();
  ctx.translate(64, 82);
  const bg = ctx.createRadialGradient(-6, -10, 2, 0, 0, 28);
  bg.addColorStop(0, '#88dd55');
  bg.addColorStop(1, '#336622');
  ctx.scale(1, 1.5);
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();
  ctx.restore();

  // 斑点
  ctx.fillStyle = '#226611';
  for (const [x, y, r] of [[54, 84, 3.5], [72, 90, 3], [62, 97, 3]] as [number, number, number][]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // 頭
  const hg = ctx.createRadialGradient(58, 44, 3, 64, 50, 22);
  hg.addColorStop(0, '#aaee66'); hg.addColorStop(1, '#44aa33');
  ctx.beginPath(); ctx.arc(64, 52, 22, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.fill();

  // 大きな一つ目（白目）
  ctx.beginPath(); ctx.arc(64, 52, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
  // 虹彩
  ctx.beginPath(); ctx.arc(64, 52, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#44cc22'; ctx.fill();
  // 瞳
  ctx.beginPath(); ctx.arc(65, 53, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#111'; ctx.fill();
  // ハイライト
  ctx.beginPath(); ctx.arc(61, 48, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();

  // 触覚
  ctx.strokeStyle = '#336622'; ctx.lineWidth = 2.5;
  for (const [sx, sy, ex, ey] of [
    [57, 32, 44, 12], [71, 32, 84, 12],
  ] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx < 64 ? sx - 4 : sx + 4, 22, ex, ey);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#336622'; ctx.fill();
  }

  return ctx.canvas.toDataURL();
}

// ── タンクヘッド ─────────────────────────────────────────────────

function drawTank(): string {
  const ctx = makeCtx();

  // キャタピラ（左右）
  ctx.fillStyle = '#3a3a50';
  ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(18, 90, 30, 26, 6); ctx.fill();
  ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(80, 90, 30, 26, 6); ctx.fill();

  // ホイール
  ctx.fillStyle = '#555570';
  for (const [x, y] of [[26, 103], [44, 103], [84, 103], [102, 103]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  }

  // 胴体
  ctx.fillStyle = '#505065';
  ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(32, 88, 64, 16, 4); ctx.fill();

  // 腕（左右）
  ctx.fillStyle = '#c09070';
  ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(16, 68, 15, 20, 5); ctx.fill();
  ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(97, 68, 15, 20, 5); ctx.fill();

  // こぶし
  for (const [x, y] of [[24, 89], [104, 89]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#c09070'; ctx.fill();
  }

  // 頭（大きな楕円）
  const hg = ctx.createRadialGradient(54, 46, 4, 64, 58, 40);
  hg.addColorStop(0, '#e8bfa0'); hg.addColorStop(1, '#b08060');
  ctx.beginPath(); ctx.ellipse(64, 58, 38, 34, 0, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.fill();

  // 光沢
  ctx.beginPath(); ctx.ellipse(50, 42, 12, 8, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();

  // 白目
  for (const [ex, ey] of [[50, 56], [78, 56]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(ex, ey, 9.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 1, ey + 1, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#222'; ctx.fill();
  }

  // 口（暗いくぼみ）
  ctx.beginPath(); ctx.ellipse(64, 74, 14, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#661111'; ctx.fill();

  // 舌
  ctx.beginPath(); ctx.ellipse(64, 77, 9, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ee2222'; ctx.fill();

  // よだれ
  ctx.strokeStyle = 'rgba(160,210,210,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(67, 81); ctx.lineTo(69, 90); ctx.stroke();

  return ctx.canvas.toDataURL();
}

// ── バードレイザー（左向きプロファイル） ─────────────────────────

function drawBird(): string {
  const ctx = makeCtx(); // 128 × 128

  // ─── 尾羽（最背面、右下へ長くカール） ───────────────────────
  // 参照画像: 尾は体の右下から始まり大きくS字を描く
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // 最外層（暗緑・極太）
  ctx.strokeStyle = '#0d6630'; ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(96, 82);
  ctx.bezierCurveTo(104, 100, 110, 118, 98, 128);
  ctx.stroke();

  // 中層（鮮やか緑）
  ctx.strokeStyle = '#22bb44'; ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(97, 82);
  ctx.bezierCurveTo(106, 102, 112, 120, 100, 128);
  ctx.stroke();

  // 内層（明るい緑）
  ctx.strokeStyle = '#44dd66'; ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(98, 83);
  ctx.bezierCurveTo(108, 104, 114, 122, 102, 128);
  ctx.stroke();

  // 黄緑アクセント
  ctx.strokeStyle = '#99ff44'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(99, 84);
  ctx.bezierCurveTo(110, 106, 116, 124, 104, 128);
  ctx.stroke();

  // ─── 翼（青〜紺グラデ、体の右後ろに広がる） ─────────────────
  const wg = ctx.createLinearGradient(72, 50, 128, 92);
  wg.addColorStop(0, '#7788ff');
  wg.addColorStop(0.45, '#3355dd');
  wg.addColorStop(1, '#0e1d88');
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.moveTo(73, 55);
  ctx.bezierCurveTo(96, 46, 126, 54, 124, 84);
  ctx.bezierCurveTo(120, 103, 94, 106, 76, 96);
  ctx.bezierCurveTo(68, 87, 67, 68, 73, 55);
  ctx.fill();

  // 翼の羽毛ライン
  ctx.strokeStyle = 'rgba(90,110,230,0.55)'; ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    ctx.beginPath();
    ctx.moveTo(74 + t * 44, 56 + t * 30);
    ctx.lineTo(76 + t * 38, 94 + t * 10);
    ctx.stroke();
  }
  // 翼端の暗い羽毛
  ctx.strokeStyle = '#0a1060'; ctx.lineWidth = 2.2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(116 + i * 1.5, 58 + i * 5);
    ctx.lineTo(122 + i * 1, 70 + i * 6);
    ctx.stroke();
  }

  // ─── 体（ティール、左向き卵型） ──────────────────────────────
  const bodg = ctx.createRadialGradient(78, 70, 5, 80, 73, 28);
  bodg.addColorStop(0, '#66ddd0');
  bodg.addColorStop(0.5, '#229999');
  bodg.addColorStop(1, '#0d5555');
  ctx.fillStyle = bodg;
  ctx.beginPath();
  ctx.ellipse(80, 74, 26, 30, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // ─── 胸（クリーム→錆赤、体の左前面） ────────────────────────
  const chg = ctx.createLinearGradient(58, 54, 62, 88);
  chg.addColorStop(0, '#e8e4d4');     // クリーム/白
  chg.addColorStop(0.28, '#cc7755'); // 錆オレンジ
  chg.addColorStop(0.65, '#aa4422'); // 錆赤
  chg.addColorStop(1, 'rgba(120,40,20,0)');
  ctx.fillStyle = chg;
  ctx.beginPath();
  ctx.ellipse(64, 72, 18, 24, -0.18, 0, Math.PI * 2);
  ctx.fill();

  // ─── 足・爪（2本脚、湾曲した鋭い爪） ────────────────────────
  ctx.strokeStyle = '#2e2e3e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  // 前足（左に向いた爪）
  const f1x = 64, f1y = 96;
  for (const [tx, ty] of [[48,112],[55,116],[64,115],[72,110]] as [number,number][]) {
    ctx.beginPath();
    ctx.moveTo(f1x, f1y);
    ctx.quadraticCurveTo(f1x + (tx-f1x)*0.4, f1y+8, tx, ty);
    ctx.stroke();
  }
  // 後足（やや後ろ）
  ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 2.2;
  const f2x = 76, f2y = 98;
  for (const [tx, ty] of [[65,110],[74,116],[84,112],[90,106]] as [number,number][]) {
    ctx.beginPath();
    ctx.moveTo(f2x, f2y);
    ctx.quadraticCurveTo(f2x+(tx-f2x)*0.4, f2y+6, tx, ty);
    ctx.stroke();
  }

  // ─── 頭部（左向きプロファイル楕円） ─────────────────────────
  const hdg = ctx.createRadialGradient(57, 36, 4, 61, 40, 24);
  hdg.addColorStop(0, '#88eecc');
  hdg.addColorStop(0.45, '#33aaaa');
  hdg.addColorStop(1, '#0f5560');
  ctx.fillStyle = hdg;
  ctx.beginPath();
  ctx.ellipse(61, 41, 23, 22, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // ─── ヘアクレスト（黒い大きなポンパドール、右後ろへ流れる） ──
  // 参照画像: 頭頂から右へ大きくうねる黒髪の束
  ctx.lineCap = 'round';
  const crests: [number,number,number,number,number,number,number][] = [
    // [startX, startY, ctrlX, ctrlY, endX, endY, lineWidth]
    [64, 22, 88,  4, 106,  3, 7.5],
    [62, 23, 85,  8, 101,  7, 6.0],
    [61, 25, 82, 12,  97, 12, 5.0],
    [60, 27, 78, 16,  92, 17, 4.2],
    [59, 29, 74, 20,  87, 22, 3.5],
    [58, 31, 70, 24,  82, 27, 2.8],
  ];
  for (let i = 0; i < crests.length; i++) {
    const [sx, sy, cx, cy, ex, ey, lw] = crests[i];
    ctx.strokeStyle = i < 3 ? '#101018' : '#1c1c26';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  // 根元のふんわりボリューム感
  const hairBase = ctx.createRadialGradient(64, 28, 0, 66, 30, 14);
  hairBase.addColorStop(0, 'rgba(22,22,34,0.85)');
  hairBase.addColorStop(1, 'rgba(14,14,24,0)');
  ctx.fillStyle = hairBase;
  ctx.beginPath();
  ctx.ellipse(66, 29, 14, 10, 0.35, 0, Math.PI * 2);
  ctx.fill();

  // ─── くちばし（左向き、口を開けて歯が見える） ────────────────
  // 上あご
  ctx.fillStyle = '#bbbbbb';
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(20, 45);   // 先端
  ctx.lineTo(21, 49);
  ctx.lineTo(39, 47);
  ctx.closePath(); ctx.fill();
  // 上あご上面（ハイライト）
  ctx.fillStyle = '#d0d0d0';
  ctx.beginPath();
  ctx.moveTo(40, 40); ctx.lineTo(20, 45); ctx.lineTo(24, 43); ctx.lineTo(40, 38);
  ctx.closePath(); ctx.fill();
  // 下あご
  ctx.fillStyle = '#a0a0a0';
  ctx.beginPath();
  ctx.moveTo(39, 48); ctx.lineTo(22, 50); ctx.lineTo(24, 56); ctx.lineTo(38, 55);
  ctx.closePath(); ctx.fill();
  // 口内（暗い赤）
  ctx.fillStyle = '#661111';
  ctx.beginPath();
  ctx.moveTo(40, 40); ctx.lineTo(20, 46); ctx.lineTo(39, 48);
  ctx.closePath(); ctx.fill();
  // 上歯（三角形）
  ctx.fillStyle = '#e8e8c8';
  for (let i = 0; i < 4; i++) {
    const tx = 38.5 - i * 4;
    ctx.beginPath();
    ctx.moveTo(tx, 47); ctx.lineTo(tx - 1.5, 52); ctx.lineTo(tx - 3, 47);
    ctx.fill();
  }
  // 下歯（短め）
  ctx.fillStyle = '#ddddbc';
  for (let i = 0; i < 3; i++) {
    const tx = 37 - i * 4;
    ctx.beginPath();
    ctx.moveTo(tx, 49); ctx.lineTo(tx - 1.2, 53); ctx.lineTo(tx - 2.4, 49);
    ctx.fill();
  }

  // ─── 目（左横顔→片目のみ見える、大きな黄色い目） ────────────
  const EX = 50, EY = 36, ER = 11;
  // 暗い眼窩（ソケット）
  ctx.fillStyle = '#162218';
  ctx.beginPath(); ctx.arc(EX, EY, ER + 2.5, 0, Math.PI * 2); ctx.fill();
  // 黄色い虹彩
  const eyeGrad = ctx.createRadialGradient(EX-2, EY-2, 1, EX, EY, ER);
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
  ctx.beginPath(); ctx.arc(EX - 3.5, EY - 3.5, 3, 0, Math.PI * 2); ctx.fill();
  // 副ハイライト
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.arc(EX + 3, EY - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();

  return ctx.canvas.toDataURL();
}
