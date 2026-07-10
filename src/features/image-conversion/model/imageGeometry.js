import { clampFiniteNumber, clampNumber } from '../../../shared/lib/number.js';

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
