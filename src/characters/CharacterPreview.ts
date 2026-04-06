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
