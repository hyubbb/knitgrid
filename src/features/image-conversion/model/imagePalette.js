import { INITIAL_PALETTE, isPaletteVisible } from '../../../entities/palette/model/paletteModel.js';
import { hexToRgb, rgbToHex, rgbToHsl, getPerceptualColorDistance } from './colorMath.js';

export const IMAGE_EXTRACT_COLOR_LIMIT = 6;

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
