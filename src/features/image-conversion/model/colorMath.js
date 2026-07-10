import { clampNumber, normalizeHex } from '../../../shared/lib/number.js';

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

export const luminance = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
