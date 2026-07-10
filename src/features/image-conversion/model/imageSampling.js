import { rgbToHex } from './colorMath.js';
import { normalizeCrop, getImagePlacement } from './imageGeometry.js';

export const IMAGE_SAMPLE_SCALE = 6;

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
