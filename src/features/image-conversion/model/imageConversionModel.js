import * as iq from 'image-q';
import { createGrid } from '../../../entities/grid/model/gridModel.js';
import { INITIAL_PALETTE, isPaletteVisible } from '../../../entities/palette/model/paletteModel.js';
import { clampFiniteNumber, clampNumber, normalizeHex } from '../../../shared/lib/number.js';

export const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return [255, 255, 255];
  return normalized.match(/\w\w/g).map((x) => parseInt(x, 16));
};

export const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((value) => clampNumber(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

export const rgbToHsl = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;

  if (max === min) return { hue: 0, saturation: 0, lightness };

  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
  let hue = 0;
  if (max === rn) hue = (gn - bn) / delta + (gn < bn ? 6 : 0);
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;

  return { hue: hue * 60, saturation, lightness };
};

export const srgbToLinear = (value) => {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

export const rgbToLab = (r, g, b) => {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
  const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) / 1.00000;
  const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
  const convert = (value) => (value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116);
  const fx = convert(x);
  const fy = convert(y);
  const fz = convert(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export const getPerceptualColorDistance = (sourceHex, targetHex) => {
  const source = rgbToLab(...hexToRgb(sourceHex));
  const target = rgbToLab(...hexToRgb(targetHex));
  return Math.sqrt(source.reduce((sum, value, index) => sum + (value - target[index]) ** 2, 0));
};

export const mapImageColorToPalette = (color, paletteItems) => {
  const candidates = paletteItems.length ? paletteItems : INITIAL_PALETTE;
  let best = candidates[0];
  let bestDistance = Infinity;
  candidates.forEach((item) => {
    const distance = getPerceptualColorDistance(color, item.color);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  });
  return { item: best, distance: bestDistance };
};

export const nearestPalette = (hex, palette) => mapImageColorToPalette(hex, palette).item;

export const luminance = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const INITIAL_IMAGE_OPTIONS = {
  fit: 'cover',
  alignX: 'center',
  alignY: 'center',
  matchImageAspect: false,
  matchPixelGrid: false,
  pixelArt: false,
  // '현재 격자 유지'에서 변환 대상 칸 수(null이면 현재 격자 크기 사용)
  targetRows: null,
  targetCols: null,
  crop: {
    enabled: false,
    x: 0,
    y: 0,
    width: 1,
    height: 1
  }
};

export const normalizeCrop = (crop = INITIAL_IMAGE_OPTIONS.crop) => {
  const width = clampFiniteNumber(crop.width, 0.05, 1);
  const height = clampFiniteNumber(crop.height, 0.05, 1);
  return {
    enabled: crop.enabled === true,
    x: clampFiniteNumber(crop.x, 0, 1 - width),
    y: clampFiniteNumber(crop.y, 0, 1 - height),
    width,
    height
  };
};

export const INITIAL_CROP_SELECTION = {
  unit: '%',
  x: 0,
  y: 0,
  width: 100,
  height: 100
};

export const normalizePercentCrop = (crop = INITIAL_CROP_SELECTION) => {
  const width = clampFiniteNumber(crop.width, 1, 100);
  const height = clampFiniteNumber(crop.height, 1, 100);
  return {
    unit: '%',
    x: clampFiniteNumber(crop.x, 0, 100 - width),
    y: clampFiniteNumber(crop.y, 0, 100 - height),
    width,
    height
  };
};

export const convertPercentCropToImageCrop = (crop) => {
  const normalized = normalizePercentCrop(crop);
  return normalizeCrop({
    enabled: true,
    x: normalized.x / 100,
    y: normalized.y / 100,
    width: normalized.width / 100,
    height: normalized.height / 100
  });
};

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

export const IMAGE_SAMPLE_SCALE = 6;
export const IMAGE_EXTRACT_COLOR_LIMIT = 6;
// 사용자가 미리보기에서 지정할 수 있는 색상 수 범위. 하한 2(1색은 도안이 아님), 상한 8.
export const IMAGE_COLOR_COUNT_MIN = 2;
export const IMAGE_COLOR_COUNT_MAX = 8;
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

export const getImageColorName = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  const { hue, saturation, lightness } = rgbToHsl(r, g, b);
  if (saturation < 0.12) {
    if (lightness > 0.88) return '아이보리';
    if (lightness < 0.22) return '검정';
    return '회색';
  }
  if (hue < 18 || hue >= 342) return '빨강';
  if (hue < 48) return '주황';
  if (hue < 70) return '노랑';
  if (hue < 170) return '초록';
  if (hue < 250) return '파랑';
  if (hue < 300) return '보라';
  return '분홍';
};

export const shouldIgnoreImageArtifactPixel = ({ r, g, b, a }) => {
  if (a < 32) return true;
  const brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max ? (max - min) / max : 0;
  if (brightness < 0.34) return true;
  if (saturation < 0.1 && brightness > 0.34 && brightness < 0.86) return true;
  return false;
};

export const getColorBucketKey = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  const { hue, saturation, lightness } = rgbToHsl(r, g, b);
  if (saturation < 0.12) {
    if (lightness > 0.86) return 'neutral-light';
    if (lightness < 0.24) return 'neutral-dark';
    return `neutral-${Math.round(lightness * 5)}`;
  }
  return [
    Math.round(hue / 16),
    Math.round(saturation * 4),
    Math.round(lightness * 5)
  ].join(':');
};

export const extractDominantImageColors = (samples, options = {}) => {
  const limit = options.limit ?? IMAGE_EXTRACT_COLOR_LIMIT;
  const buckets = new Map();

  samples.forEach((sample) => {
    if (!sample?.hex) return;
    const key = getColorBucketKey(sample.hex);
    const current = buckets.get(key) || {
      count: 0,
      r: 0,
      g: 0,
      b: 0
    };
    const weight = sample.weight || 1;
    const [r, g, b] = hexToRgb(sample.hex);
    current.count += weight;
    current.r += r * weight;
    current.g += g * weight;
    current.b += b * weight;
    buckets.set(key, current);
  });

  return [...buckets.values()]
    .filter((bucket) => bucket.count > 0)
    .map((bucket) => ({
      hex: rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
      count: bucket.count
    }))
    .sort((a, b) => b.count - a.count)
    .reduce((items, color) => {
      const duplicate = items.some((item) => getPerceptualColorDistance(item.hex, color.hex) < 9);
      return duplicate || items.length >= limit ? items : [...items, color];
    }, []);
};

export const createPaletteFromImageColors = (colors) => {
  const sourceColors = colors.length
    ? colors
    : [{ hex: '#fbfaf7', count: 1 }];

  return sourceColors.map((color, index) => ({
    id: `img-${index + 1}-${color.hex.replace('#', '')}`,
    code: `IMG${index + 1}`,
    name: getImageColorName(color.hex),
    color: color.hex,
    visible: true
  }));
};

export const getMappablePalette = (paletteItems) => {
  const visibleItems = paletteItems.filter(isPaletteVisible);
  return visibleItems.length ? visibleItems : paletteItems;
};

export const getCellSampleColor = (pixels, canvasWidth, row, col, options = {}) => {
  const sampleOffset = options.sampleOffset || 0;
  const xStart = col * IMAGE_SAMPLE_SCALE;
  const yStart = row * IMAGE_SAMPLE_SCALE;
  const inset = IMAGE_SAMPLE_SCALE > 2 ? 1 : 0;
  const offsetX = sampleOffset % 2;
  const offsetY = Math.floor(sampleOffset / 2) % 2;

  // 차트/픽셀아트: 셀 안에서 가장 많은(최빈) 색으로 스냅. 격자선·경계의 소수 픽셀을 무시해
  // 하드엣지를 보존한다(평균처럼 중간색으로 뭉개지지 않음). 아티팩트 필터는 쓰지 않는다.
  if (options.pixelArt) {
    const buckets = new Map();
    let best = null;
    for (let y = yStart + inset + offsetY; y < yStart + IMAGE_SAMPLE_SCALE - inset; y += 1) {
      for (let x = xStart + inset + offsetX; x < xStart + IMAGE_SAMPLE_SCALE - inset; x += 1) {
        const index = (y * canvasWidth + x) * 4;
        if (pixels[index + 3] < 32) continue;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
        bucket.count += 1;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        buckets.set(key, bucket);
        if (!best || bucket.count > best.count) best = bucket;
      }
    }
    if (!best) return null;
    return rgbToHex(best.r / best.count, best.g / best.count, best.b / best.count);
  }

  let totalWeight = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let y = yStart + inset + offsetY; y < yStart + IMAGE_SAMPLE_SCALE - inset; y += 1) {
    for (let x = xStart + inset + offsetX; x < xStart + IMAGE_SAMPLE_SCALE - inset; x += 1) {
      const index = (y * canvasWidth + x) * 4;
      const pixel = {
        r: pixels[index],
        g: pixels[index + 1],
        b: pixels[index + 2],
        a: pixels[index + 3]
      };
      if (pixel.a < 32) continue;
      const weight = options.artifactFilter && shouldIgnoreImageArtifactPixel(pixel) ? 0.35 : 1;
      totalWeight += weight;
      totalR += pixel.r * weight;
      totalG += pixel.g * weight;
      totalB += pixel.b * weight;
    }
  }

  if (!totalWeight) return null;
  return rgbToHex(totalR / totalWeight, totalG / totalWeight, totalB / totalWeight);
};

export const drawImageToAnalysisCanvas = ({ image, rows, cols, imageOptions }) => {
  const canvas = document.createElement('canvas');
  canvas.width = cols * IMAGE_SAMPLE_SCALE;
  canvas.height = rows * IMAGE_SAMPLE_SCALE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  // 차트/픽셀아트 모드에서는 nearest(스무딩 OFF)로 그려 하드엣지·격자선이 뭉개지지 않게 한다.
  ctx.imageSmoothingEnabled = !imageOptions.pixelArt;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const crop = normalizeCrop(imageOptions.crop);
  const source = crop.enabled
    ? {
        x: crop.x * image.naturalWidth,
        y: crop.y * image.naturalHeight,
        width: crop.width * image.naturalWidth,
        height: crop.height * image.naturalHeight
      }
    : {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight
      };
  const placement = getImagePlacement({
    imageWidth: source.width,
    imageHeight: source.height,
    targetWidth: canvas.width,
    targetHeight: canvas.height,
    ...imageOptions
  });
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    placement.dx,
    placement.dy,
    placement.width,
    placement.height
  );
  return {
    canvas,
    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
  };
};

// 채도를 제거해 무채색(흑백)으로 만든다. 이후 양자화하면 검정~흰색 계조만 남는다.
// BT.709 luma로 r=g=b 대입. imageData를 제자리에서 수정한다.
export const applyGrayscaleToImageData = (imageData) => {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
    data[i] = luma;
    data[i + 1] = luma;
    data[i + 2] = luma;
  }
  return imageData;
};

export const pointContainerToCellColors = ({ pointContainer, rows, cols, config }) => {
  const pixels = pointContainer.toUint8Array();
  const width = pointContainer.getWidth();
  const colors = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      colors.push(getCellSampleColor(pixels, width, r, c, config));
    }
  }
  return colors;
};

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

// colorCount(2~8)가 있으면 프리셋의 고정 색상 수를 오버라이드한다. null이면 기존 동작 유지.
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

export const FIT_OPTIONS = [
  { id: 'cover', label: '채우기', description: '격자를 꽉 채우고 넘치는 부분은 잘립니다.' },
  { id: 'contain', label: '맞춰 넣기', description: '이미지 전체를 보존하고 남는 칸은 여백이 됩니다.' },
  { id: 'stretch', label: '늘려 맞춤', description: '잘림은 없지만 원본 비율이 왜곡될 수 있습니다.' }
];

export const HORIZONTAL_ALIGNMENTS = [
  { id: 'left', label: '좌측' },
  { id: 'center', label: '중앙' },
  { id: 'right', label: '우측' }
];

export const VERTICAL_ALIGNMENTS = [
  { id: 'top', label: '상단' },
  { id: 'center', label: '중앙' },
  { id: 'bottom', label: '하단' }
];

// 픽셀아트의 논리 픽셀 격자(칸 크기·위상·논리 칸 수)를 감지한다.
// 방식: 각 축에서 인접 라인 색 차이 합 → 경계 위치 → 간격 히스토그램의 최빈 주기.
// 신뢰 조건(간격의 80% 이상이 주기의 배수, 주기 ≥ 4px)을 못 채우면 null(일반 사진).
export const detectPixelGrid = (imageData) => {
  const { data, width, height } = imageData;
  const px = (x, y) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const analyzeAxis = (N, M, sample) => {
    const stride = Math.max(1, Math.floor(M / 400)); // 큰 이미지 비용 상한
    const diff = new Array(N - 1).fill(0);
    for (let i = 0; i < N - 1; i += 1) {
      let sum = 0;
      for (let j = 0; j < M; j += stride) {
        const a = sample(i, j);
        const b = sample(i + 1, j);
        sum += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
      }
      diff[i] = sum;
    }
    const max = Math.max(...diff);
    if (!max) return null;
    const threshold = max * 0.3;
    const bounds = [];
    let prev = -10;
    for (let i = 0; i < diff.length; i += 1) {
      if (diff[i] > threshold) {
        if (i - prev > 3) bounds.push(i);
        prev = i;
      }
    }
    if (bounds.length < 3) return null;

    const gaps = new Map();
    for (let i = 1; i < bounds.length; i += 1) {
      const gap = bounds[i] - bounds[i - 1];
      gaps.set(gap, (gaps.get(gap) || 0) + 1);
    }
    let size = 0;
    let best = 0;
    for (const [gap, count] of gaps) {
      if (count > best || (count === best && gap < size)) {
        best = count;
        size = gap;
      }
    }
    if (size < 4) return null;
    let aligned = 0;
    let total = 0;
    for (const [gap, count] of gaps) {
      total += count;
      const multiple = Math.round(gap / size);
      if (multiple >= 1 && Math.abs(gap - multiple * size) <= 1) aligned += count;
    }
    if (aligned / total < 0.8) return null;

    // diff[i]는 라인 i|i+1 사이 경계 → 셀 시작 = 경계 + 1
    const offset = (bounds[0] + 1) % size;
    const logical = Math.floor((N - offset) / size);
    if (logical < 2 || logical > 200) return null;
    return { size, offset, logical };
  };

  const vertical = analyzeAxis(width, height, (i, j) => px(i, j));
  const horizontal = analyzeAxis(height, width, (i, j) => px(j, i));
  if (!vertical || !horizontal) return null;
  return {
    cellWidth: vertical.size,
    cellHeight: horizontal.size,
    offsetX: vertical.offset,
    offsetY: horizontal.offset,
    logicalCols: vertical.logical,
    logicalRows: horizontal.logical
  };
};

// 업로드 이미지 비율(크롭 반영)에 맞춰 격자 칸 수를 정한다.
// 긴 변에 현재 격자의 최대 칸 수(=규모 예산)를 배정하고 짧은 변은 비율대로. 최대 200칸.
export const getImageAspectGridSize = ({ imageWidth, imageHeight, rows, cols, crop }) => {
  const normalized = normalizeCrop(crop);
  const effWidth = (normalized.enabled ? normalized.width : 1) * imageWidth;
  const effHeight = (normalized.enabled ? normalized.height : 1) * imageHeight;
  if (!(effWidth > 0 && effHeight > 0)) return { rows, cols };
  const budget = Math.max(rows, cols);
  const longSide = Math.max(effWidth, effHeight);
  return {
    cols: clampNumber(Math.round(budget * (effWidth / longSide)), 1, 200),
    rows: clampNumber(Math.round(budget * (effHeight / longSide)), 1, 200)
  };
};

export const getImagePlacement = ({ imageWidth, imageHeight, targetWidth, targetHeight, fit, alignX, alignY }) => {
  if (fit === 'stretch') {
    return { dx: 0, dy: 0, width: targetWidth, height: targetHeight, scaleX: targetWidth / imageWidth, scaleY: targetHeight / imageHeight };
  }

  const scale = fit === 'contain'
    ? Math.min(targetWidth / imageWidth, targetHeight / imageHeight)
    : Math.max(targetWidth / imageWidth, targetHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const freeX = targetWidth - width;
  const freeY = targetHeight - height;
  const dx = alignX === 'left' ? 0 : alignX === 'right' ? freeX : freeX / 2;
  const dy = alignY === 'top' ? 0 : alignY === 'bottom' ? freeY : freeY / 2;

  return { dx, dy, width, height, scaleX: scale, scaleY: scale };
};
