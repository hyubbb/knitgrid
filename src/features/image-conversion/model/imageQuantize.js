import * as iq from 'image-q';
import { createGrid } from '../../../entities/grid/model/gridModel.js';
import { clampNumber } from '../../../shared/lib/number.js';
import {
  IMAGE_EXTRACT_COLOR_LIMIT,
  extractDominantImageColors,
  createPaletteFromImageColors,
  getMappablePalette,
  mapImageColorToPalette,
  getColorBucketKey
} from './imagePalette.js';
import {
  drawImageToAnalysisCanvas,
  applyGrayscaleToImageData,
  pointContainerToCellColors
} from './imageSampling.js';

export const IMAGE_PALETTE_MODES = [
  {
    id: 'extract',
    label: '이미지 색상 자동 추출',
    description: '원본에서 주요 색상을 뽑아 팔레트와 코드로 만듭니다.'
  },
  {
    id: 'match',
    label: '현재 팔레트에 맞춤',
    description: '이미 만든 팔레트 안에서 가장 가까운 색으로 변환합니다.'
  }
];

// 사용자가 미리보기에서 지정할 수 있는 색상 수 범위. 하한 2(1색은 도안이 아님), 상한 10.
export const IMAGE_COLOR_COUNT_MIN = 2;
export const IMAGE_COLOR_COUNT_MAX = 10;
export const IMAGE_COLOR_COUNT_WARN = 6; // 초과 시 실 관리 난이도 안내
export const clampImageColorCount = (value) =>
  clampNumber(Math.round(value), IMAGE_COLOR_COUNT_MIN, IMAGE_COLOR_COUNT_MAX);
export const IMAGE_COLOR_WARNING_DISTANCE = 24;

export const IMAGE_CANDIDATE_CONFIGS = [
  {
    id: 'crisp',
    label: '선명',
    tag: '윤곽 우선',
    colors: 6,
    colorDistanceFormula: 'cie94-textiles',
    paletteQuantization: 'wuquant',
    imageQuantization: 'nearest',
    sampleOffset: 0,
    artifactFilter: true
  },
  {
    id: 'soft',
    label: '부드러움',
    tag: '노이즈 완화',
    colors: 5,
    colorDistanceFormula: 'euclidean-bt709-noalpha',
    paletteQuantization: 'rgbquant',
    imageQuantization: 'nearest',
    sampleOffset: 1,
    artifactFilter: true
  },
  {
    id: 'dither',
    label: '디더링',
    tag: '그라데이션 보존',
    colors: 6,
    colorDistanceFormula: 'cie94-textiles',
    paletteQuantization: 'wuquant',
    imageQuantization: 'floyd-steinberg',
    sampleOffset: 2,
    artifactFilter: false
  },
  {
    id: 'simple',
    label: '단순화',
    tag: '색상 적게',
    colors: 3,
    colorDistanceFormula: 'pngquant',
    paletteQuantization: 'wuquant',
    imageQuantization: 'nearest',
    sampleOffset: 3,
    artifactFilter: true
  }
];

export const buildPaletteFromCellColors = (cellColors, config) =>
  extractDominantImageColors(
    cellColors.filter(Boolean).map((hex) => ({ hex, weight: 1 })),
    { limit: config.colors || IMAGE_EXTRACT_COLOR_LIMIT }
  );

export const buildGridFromCellColors = ({ cellColors, rows, cols, paletteItems, note }) => {
  const nextGrid = createGrid(rows, cols);
  cellColors.forEach((hex, index) => {
    if (!hex) return;
    const match = mapImageColorToPalette(hex, paletteItems);
    const item = match.item;
    const row = Math.floor(index / cols);
    const col = index % cols;
    nextGrid[row][col] = {
      active: true,
      color: item.color,
      symbol: item.code,
      label: item.name,
      note,
      paletteId: item.id
    };
  });
  return nextGrid;
};

export const scoreImageCandidate = ({ cellColors, paletteItems, colorWarnings }) => {
  const activeCount = cellColors.filter(Boolean).length;
  const usedKeys = new Set(cellColors.filter(Boolean).map(getColorBucketKey));
  const warningPenalty = colorWarnings.reduce((sum, warning) => sum + warning.count, 0);
  const palettePenalty = Math.max(0, paletteItems.length - 6) * 12;
  return Math.max(1, Math.round(100 - warningPenalty / Math.max(1, activeCount) * 100 - palettePenalty + usedKeys.size * 2));
};

export const createPreviewSignature = (grid) =>
  grid
    .flat()
    .filter((cell) => cell.active)
    .slice(0, 160)
    .map((cell) => cell.paletteId || cell.color)
    .join('|');

export const summarizeColorWarnings = (cellColors, targetPalette) => {
  const buckets = new Map();
  cellColors.forEach((color) => {
    if (!color) return;
    const match = mapImageColorToPalette(color, targetPalette);
    if (match.distance < IMAGE_COLOR_WARNING_DISTANCE) return;
    const key = `${getColorBucketKey(color)}:${match.item.id}`;
    const current = buckets.get(key) || {
      sourceHex: color,
      targetHex: match.item.color,
      targetCode: match.item.code,
      distance: match.distance,
      count: 0
    };
    current.count += 1;
    if (match.distance > current.distance) {
      current.sourceHex = color;
      current.distance = match.distance;
    }
    buckets.set(key, current);
  });

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
};

export const buildImageCandidateWithImageQ = ({ imageData, rows, cols, basePalette, paletteMode, config, seed }) => {
  const source = iq.utils.PointContainer.fromImageData(imageData);
  let quantized = source;

  try {
    const quantizedPalette = iq.buildPaletteSync([source], {
      colorDistanceFormula: config.colorDistanceFormula,
      paletteQuantization: config.paletteQuantization,
      colors: config.colors
    });
    quantized = iq.applyPaletteSync(source, quantizedPalette, {
      colorDistanceFormula: config.colorDistanceFormula,
      imageQuantization: config.imageQuantization
    });
  } catch {
    quantized = source;
  }

  const cellColors = pointContainerToCellColors({
    pointContainer: quantized,
    rows,
    cols,
    config: {
      ...config,
      sampleOffset: (config.sampleOffset + seed) % 4
    }
  });
  const extractedColors = buildPaletteFromCellColors(cellColors, config);
  const conversionPalette = paletteMode === 'extract'
    ? createPaletteFromImageColors(extractedColors)
    : basePalette;
  const targetPalette = paletteMode === 'extract'
    ? conversionPalette
    : getMappablePalette(basePalette);
  const colorWarnings = paletteMode === 'match'
    ? summarizeColorWarnings(cellColors, targetPalette)
    : [];
  const nextGrid = buildGridFromCellColors({
    cellColors,
    rows,
    cols,
    paletteItems: targetPalette,
    note: `${config.label} 이미지 변환 초안`
  });

  return {
    id: `${config.id}-${seed}`,
    label: config.label,
    tag: config.tag,
    grid: nextGrid,
    palette: conversionPalette,
    extractedColors,
    colorWarnings,
    score: scoreImageCandidate({ cellColors, paletteItems: conversionPalette, colorWarnings }),
    signature: createPreviewSignature(nextGrid)
  };
};

// colorCount(2~10)가 있으면 프리셋의 고정 색상 수를 오버라이드한다. null이면 기존 동작 유지.
const withColorCount = (config, colorCount) =>
  colorCount ? { ...config, colors: clampImageColorCount(colorCount) } : config;

export const buildConvertedImageGrid = ({ image, rows, cols, basePalette, paletteMode, imageOptions, colorCount = null, grayscale = false }) => {
  const { imageData } = drawImageToAnalysisCanvas({ image, rows, cols, imageOptions });
  if (grayscale) applyGrayscaleToImageData(imageData);
  return buildImageCandidateWithImageQ({
    imageData,
    rows,
    cols,
    basePalette,
    paletteMode,
    config: { ...withColorCount(IMAGE_CANDIDATE_CONFIGS[0], colorCount), pixelArt: Boolean(imageOptions.pixelArt) },
    seed: 0
  });
};

export const buildImageConversionCandidates = async ({ image, rows, cols, basePalette, paletteMode, imageOptions, seed, colorCount = null, grayscale = false }) => {
  const { imageData } = drawImageToAnalysisCanvas({ image, rows, cols, imageOptions });
  if (grayscale) applyGrayscaleToImageData(imageData);
  const candidates = [];
  for (const config of IMAGE_CANDIDATE_CONFIGS) {
    candidates.push(buildImageCandidateWithImageQ({
      imageData,
      rows,
      cols,
      basePalette,
      paletteMode,
      config: { ...withColorCount(config, colorCount), pixelArt: Boolean(imageOptions.pixelArt) },
      seed
    }));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  return candidates;
};
