import { shadeColor } from './knitLayout.js';

// 코 다리가 윗단으로 겹쳐 올라가는 높이(셀 높이 대비).
export const KNIT_SPRITE_HEIGHT_RATIO = 1.4;
const MAX_CANVAS_SIDE = 16384;
const SPRITE_CACHE_LIMIT = 256;

const spriteCache = new Map();

// 브라우저 캔버스 한 변 최대 크기를 넘지 않도록 dpr을 낮춘다.
export const getSafeDpr = (width, height, preferred = globalThis.devicePixelRatio || 1) => {
  const longest = Math.max(1, width, height);
  return Math.max(0.25, Math.min(preferred, MAX_CANVAS_SIDE / longest));
};

// 한쪽 다리: 기울어진 잎사귀(타원). dir=-1 왼쪽, 1 오른쪽.
const drawLeg = (ctx, color, w, h, dir) => {
  const rx = w * 0.27;
  const ry = h * 0.43;
  ctx.save();
  ctx.translate(w * (0.5 + dir * 0.22), h * 0.5);
  ctx.rotate(dir * 0.5);

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);

  // 가로 음영: 바깥쪽 어둡게, 가운데 밝게.
  const across = ctx.createLinearGradient(dir * rx, 0, -dir * rx, 0);
  across.addColorStop(0, shadeColor(color, -0.38));
  across.addColorStop(0.45, shadeColor(color, 0.2));
  across.addColorStop(0.75, color);
  across.addColorStop(1, shadeColor(color, -0.28));
  ctx.fillStyle = across;
  ctx.fill();

  // 위쪽 끝은 윗단 코 아래로 들어가므로 그늘.
  const along = ctx.createLinearGradient(0, -ry, 0, -ry * 0.3);
  along.addColorStop(0, 'rgba(0,0,0,0.32)');
  along.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = along;
  ctx.fill();

  // 실 꼬임 결.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = shadeColor(color, -0.25);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.max(0.5, w * 0.025);
  for (let i = -3; i <= 3; i += 1) {
    const y = i * ry * 0.3;
    ctx.beginPath();
    ctx.moveTo(-rx, y + dir * rx * 1.1);
    ctx.lineTo(rx, y - dir * rx * 1.1);
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = shadeColor(color, -0.5);
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(0.5, w * 0.03);
  ctx.stroke();
  ctx.restore();
};

// 안뜨기 코: 가로로 누운 실 고리(물결) 두 줄.
const drawPurlBump = (ctx, color, w, h) => {
  const top = h - h / KNIT_SPRITE_HEIGHT_RATIO;
  const cellH = h / KNIT_SPRITE_HEIGHT_RATIO;
  [0.32, 0.72].forEach((ratio, index) => {
    const cy = top + cellH * ratio;
    const ry = cellH * 0.24;
    const grad = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
    grad.addColorStop(0, shadeColor(color, 0.22));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, shadeColor(color, -0.4));
    ctx.beginPath();
    ctx.ellipse(w * (index ? 0.42 : 0.58), cy, w * 0.5, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = shadeColor(color, -0.5);
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(0.5, w * 0.03);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
};

const getStitchSprite = (color, cellW, cellH, dpr, look = 'knit') => {
  const key = `${look}|${color}|${cellW}|${cellH}|${dpr}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  if (spriteCache.size >= SPRITE_CACHE_LIMIT) spriteCache.clear();

  const h = cellH * KNIT_SPRITE_HEIGHT_RATIO;
  const sprite = document.createElement('canvas');
  sprite.width = Math.max(1, Math.ceil(cellW * dpr));
  sprite.height = Math.max(1, Math.ceil(h * dpr));
  const ctx = sprite.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    if (look === 'purl') {
      drawPurlBump(ctx, color, cellW, h);
    } else {
      drawLeg(ctx, color, cellW, h, -1);
      drawLeg(ctx, color, cellW, h, 1);
    }
  }
  spriteCache.set(key, sprite);
  return sprite;
};

// 코머리 줄(시작/마감 가장자리).
const drawEdgeRow = (ctx, colors, y, cellW, cellH) => {
  colors.forEach((color, col) => {
    ctx.beginPath();
    ctx.ellipse(col * cellW + cellW / 2, y, cellW * 0.48, cellH * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadeColor(color, 0.05);
    ctx.fill();
    ctx.strokeStyle = shadeColor(color, -0.45);
    ctx.lineWidth = Math.max(0.5, cellW * 0.03);
    ctx.stroke();
  });
};

/**
 * stitches(아랫단→윗단 순서)를 메리야스 편물로 그린다.
 * 좌표는 CSS px 기준이며 originX/originY는 첫 칸의 좌상단 위치다.
 */
export const renderKnitFabric = (
  ctx,
  { stitches, rows, cols, cellW, cellH, dpr = 1, originX = 0, originY = 0, edges = true }
) => {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(originX, originY);

  // 다리 사이로 보이는 안쪽 그늘.
  stitches.forEach(({ row, col, color, look }) => {
    if (look === 'none') return;
    ctx.fillStyle = shadeColor(color, -0.6);
    ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
  });

  const spriteH = cellH * KNIT_SPRITE_HEIGHT_RATIO;
  stitches.forEach(({ row, col, color, look }) => {
    if (look === 'none') return;
    if (look === 'hole') {
      // 걸기코: 실이 둘러싼 구멍
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cellW * 0.36, cellH * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = shadeColor(color, 0.05);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy, cellW * 0.2, cellH * 0.26, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(20, 22, 28, 0.85)';
      ctx.fill();
      return;
    }
    const sprite = getStitchSprite(color, cellW, cellH, dpr, look);
    ctx.drawImage(sprite, col * cellW, (row + 1) * cellH - spriteH, cellW, spriteH);
  });

  if (edges && rows > 0 && cols > 0) {
    const topColors = new Array(cols);
    const bottomColors = new Array(cols);
    stitches.forEach(({ row, col, color }) => {
      if (row === 0) topColors[col] = color;
      if (row === rows - 1) bottomColors[col] = color;
    });
    drawEdgeRow(ctx, topColors, -cellH * 0.12, cellW, cellH);
    drawEdgeRow(ctx, bottomColors, rows * cellH + cellH * 0.08, cellW, cellH);
  }

  ctx.restore();
};
