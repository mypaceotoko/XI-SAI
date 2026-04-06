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

// ── バードレイザー ────────────────────────────────────────────────

function drawBird(): string {
  const ctx = makeCtx(); // 128 × 128
  const W = S, H = S;

  // 尾羽（最背面、長いカール）
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#22bb55';
  ctx.beginPath();
  ctx.moveTo(68, 92);
  ctx.bezierCurveTo(40, 108, 18, 118, 22, 128);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#55ee88';
  ctx.beginPath();
  ctx.moveTo(72, 94);
  ctx.bezierCurveTo(48, 112, 26, 120, 30, 128);
  ctx.stroke();
  ctx.restore();

  // 翼（青紫）
  const wingGrad = ctx.createLinearGradient(74, 58, 112, 98);
  wingGrad.addColorStop(0, '#5566ee');
  wingGrad.addColorStop(1, '#1122aa');
  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(74, 62);
  ctx.bezierCurveTo(100, 56, 118, 72, 112, 100);
  ctx.bezierCurveTo(104, 114, 82, 112, 70, 100);
  ctx.closePath();
  ctx.fill();

  // 体（ティール楕円）
  const bodyGrad = ctx.createRadialGradient(60, 82, 4, 64, 84, 28);
  bodyGrad.addColorStop(0, '#55ddcc');
  bodyGrad.addColorStop(1, '#116655');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(63, 85, 24, 30, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // 胸（赤橙）
  const chestGrad = ctx.createRadialGradient(56, 80, 1, 57, 82, 16);
  chestGrad.addColorStop(0, '#ff8844');
  chestGrad.addColorStop(1, 'rgba(150,40,20,0)');
  ctx.fillStyle = chestGrad;
  ctx.beginPath();
  ctx.ellipse(56, 82, 15, 18, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 足
  ctx.strokeStyle = '#444455'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  const claws: [number, number, number, number][] = [
    [57, 108, 48, 120], [57, 108, 54, 122], [57, 108, 62, 120],
    [70, 108, 65, 120], [70, 108, 72, 122], [70, 108, 78, 118],
  ];
  for (const [ax, ay, bx, by] of claws) {
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }

  // 頭
  const headGrad = ctx.createRadialGradient(58, 50, 3, 62, 54, 24);
  headGrad.addColorStop(0, '#66eedd');
  headGrad.addColorStop(1, '#116666');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(61, 55, 22, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // ヘアクレスト（黒い逆立ち毛）
  const crestPoints: [number, number, number, number, number, number][] = [
    [66, 32, 78, 10, 82, 4],
    [63, 31, 72, 8,  74, 2],
    [60, 31, 64, 6,  64, 0],
    [57, 33, 55, 8,  52, 4],
  ];
  ctx.lineCap = 'round';
  for (let i = 0; i < crestPoints.length; i++) {
    const [x1, y1, cx, cy, x2, y2] = crestPoints[i];
    ctx.strokeStyle = i % 2 === 0 ? '#1a1a2a' : '#2a2a3e';
    ctx.lineWidth = 3.5 - i * 0.4;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
  }

  // くちばし
  ctx.fillStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.moveTo(38, 58); ctx.lineTo(52, 54); ctx.lineTo(52, 60); ctx.lineTo(40, 62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#888888';
  ctx.beginPath();
  ctx.moveTo(40, 62); ctx.lineTo(52, 60); ctx.lineTo(50, 66); ctx.lineTo(42, 68);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#551111';
  ctx.beginPath();
  ctx.moveTo(52, 54); ctx.lineTo(52, 66); ctx.lineTo(42, 70); ctx.lineTo(38, 62);
  ctx.closePath(); ctx.fill();

  // 黄色い目
  ctx.fillStyle = '#223322';
  ctx.beginPath(); ctx.arc(55, 50, 12, 0, Math.PI * 2); ctx.fill();
  const eyeG = ctx.createRadialGradient(54, 49, 1, 55, 50, 10);
  eyeG.addColorStop(0, '#ffff44');
  eyeG.addColorStop(0.7, '#ddaa00');
  eyeG.addColorStop(1, '#886600');
  ctx.fillStyle = eyeG;
  ctx.beginPath(); ctx.arc(55, 50, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(55, 51, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(52, 47, 2, 0, Math.PI * 2); ctx.fill();

  void W; void H;
  return ctx.canvas.toDataURL();
}
