import { createGrid } from '../../../entities/grid/model/gridModel.js';
import { GALMURI_FONT_FAMILY } from '../../../shared/lib/fonts.js';
import { parseNumericInput } from '../../../shared/lib/number.js';

export const TEXT_MAX_CHARS = 80;
export const TEXT_MAX_LINES = 4;
export const TEXT_SAMPLE_SCALE = 8;
export const TEXT_GRID_MIN_SIZE = 8;
export const TEXT_GRID_MAX_SIZE = 200;

export const TEXT_FONT_OPTIONS = [
  {
    id: 'sans',
    label: '갈무리',
    family: GALMURI_FONT_FAMILY
  },
  {
    id: 'serif',
    label: '명조',
    family: 'Georgia, "AppleMyungjo", "Noto Serif KR", serif'
  },
  {
    id: 'mono',
    label: '모노',
    family: `${GALMURI_FONT_FAMILY}, "SFMono-Regular", "Cascadia Code", monospace`
  }
];

export const TEXT_WEIGHT_OPTIONS = [
  { id: '700', label: '굵게' },
  { id: '400', label: '보통' }
];

export const TEXT_ALIGN_OPTIONS = [
  { id: 'left', label: '좌' },
  { id: 'center', label: '중앙' },
  { id: 'right', label: '우' }
];

export const INITIAL_TEXT_OPTIONS = {
  text: '',
  fontFamily: 'sans',
  fontWeight: '700',
  align: 'center',
  paletteId: '',
  targetRows: 64,
  targetCols: 48,
  padding: 0.08,
  coverageThreshold: 0.18
};

export const sanitizeTextDraftValue = (value) => {
  const lines = String(value)
    .replace(/\r/g, '')
    .split('\n')
    .slice(0, TEXT_MAX_LINES);
  let remaining = TEXT_MAX_CHARS;
  return lines
    .map((line) => {
      const nextLine = line.slice(0, remaining);
      remaining -= nextLine.length;
      return nextLine;
    })
    .join('\n');
};

export const normalizeTextGridSize = (value, fallback) => {
  const nextValue = parseNumericInput(value, fallback);
  return Math.min(TEXT_GRID_MAX_SIZE, Math.max(TEXT_GRID_MIN_SIZE, Math.round(nextValue)));
};

export const normalizeTextOptions = (options = INITIAL_TEXT_OPTIONS) => ({
  ...INITIAL_TEXT_OPTIONS,
  ...options,
  text: sanitizeTextDraftValue(options.text ?? ''),
  fontFamily: TEXT_FONT_OPTIONS.some((item) => item.id === options.fontFamily) ? options.fontFamily : INITIAL_TEXT_OPTIONS.fontFamily,
  fontWeight: TEXT_WEIGHT_OPTIONS.some((item) => item.id === String(options.fontWeight)) ? String(options.fontWeight) : INITIAL_TEXT_OPTIONS.fontWeight,
  align: TEXT_ALIGN_OPTIONS.some((item) => item.id === options.align) ? options.align : INITIAL_TEXT_OPTIONS.align,
  targetRows: normalizeTextGridSize(options.targetRows, INITIAL_TEXT_OPTIONS.targetRows),
  targetCols: normalizeTextGridSize(options.targetCols, INITIAL_TEXT_OPTIONS.targetCols),
  padding: Number.isFinite(options.padding) ? Math.min(0.22, Math.max(0.02, options.padding)) : INITIAL_TEXT_OPTIONS.padding,
  coverageThreshold: Number.isFinite(options.coverageThreshold)
    ? Math.min(0.6, Math.max(0.04, options.coverageThreshold))
    : INITIAL_TEXT_OPTIONS.coverageThreshold
});

const getTextLines = (text) => sanitizeTextDraftValue(text)
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const getFontFamily = (fontFamily) =>
  TEXT_FONT_OPTIONS.find((item) => item.id === fontFamily)?.family ?? TEXT_FONT_OPTIONS[0].family;

const measureTextBlock = (ctx, lines, fontSize, options) => {
  ctx.font = `${options.fontWeight} ${fontSize}px ${getFontFamily(options.fontFamily)}`;
  const lineHeight = fontSize * 1.14;
  return {
    width: Math.max(...lines.map((line) => ctx.measureText(line).width)),
    height: lines.length * lineHeight,
    lineHeight
  };
};

const resolveFontSize = (ctx, lines, bounds, options) => {
  let low = 4;
  let high = Math.max(8, bounds.height);
  let resolved = low;
  for (let index = 0; index < 12; index += 1) {
    const size = (low + high) / 2;
    const measured = measureTextBlock(ctx, lines, size, options);
    if (measured.width <= bounds.width && measured.height <= bounds.height) {
      resolved = size;
      low = size;
    } else {
      high = size;
    }
  }
  return resolved;
};

const getTextCanvasBounds = (canvas, options) => {
  const padding = Math.round(Math.min(canvas.width, canvas.height) * options.padding);
  return {
    x: padding,
    y: padding,
    width: Math.max(1, canvas.width - padding * 2),
    height: Math.max(1, canvas.height - padding * 2)
  };
};

const createTextCanvas = ({ rows, cols, options }) => {
  const canvas = document.createElement('canvas');
  canvas.width = cols * TEXT_SAMPLE_SCALE;
  canvas.height = rows * TEXT_SAMPLE_SCALE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const lines = getTextLines(options.text);
  if (!ctx || !lines.length) return { canvas, lines, fontSize: 0 };

  const bounds = getTextCanvasBounds(canvas, options);
  const fontSize = resolveFontSize(ctx, lines, bounds, options);
  const measured = measureTextBlock(ctx, lines, fontSize, options);
  const textAlign = options.align;
  const x = textAlign === 'left'
    ? bounds.x
    : textAlign === 'right'
      ? bounds.x + bounds.width
      : bounds.x + bounds.width / 2;
  const y = bounds.y + Math.max(0, (bounds.height - measured.height) / 2);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';
  ctx.font = `${options.fontWeight} ${fontSize}px ${getFontFamily(options.fontFamily)}`;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * measured.lineHeight);
  });

  return { canvas, lines, fontSize };
};

export const buildTextPatternDraft = ({ rows, cols, paletteItem, options }) => {
  const normalizedOptions = normalizeTextOptions(options);
  const nextGrid = createGrid(rows, cols);
  if (!paletteItem) {
    return { grid: nextGrid, paintedCellCount: 0, lines: [], fontSize: 0 };
  }

  const { canvas, lines, fontSize } = createTextCanvas({ rows, cols, options: normalizedOptions });
  if (!lines.length) {
    return { grid: nextGrid, paintedCellCount: 0, lines, fontSize };
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let paintedCellCount = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let alphaTotal = 0;
      for (let y = 0; y < TEXT_SAMPLE_SCALE; y += 1) {
        for (let x = 0; x < TEXT_SAMPLE_SCALE; x += 1) {
          const pixelX = col * TEXT_SAMPLE_SCALE + x;
          const pixelY = row * TEXT_SAMPLE_SCALE + y;
          alphaTotal += imageData[(pixelY * canvas.width + pixelX) * 4 + 3] / 255;
        }
      }
      const coverage = alphaTotal / (TEXT_SAMPLE_SCALE * TEXT_SAMPLE_SCALE);
      if (coverage >= normalizedOptions.coverageThreshold) {
        nextGrid[row][col] = {
          active: true,
          color: paletteItem.color,
          symbol: paletteItem.code,
          label: paletteItem.name,
          note: '텍스트 변환 초안',
          paletteId: paletteItem.id
        };
        paintedCellCount += 1;
      }
    }
  }

  return { grid: nextGrid, paintedCellCount, lines, fontSize };
};
