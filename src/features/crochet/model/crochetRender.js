// 차트 → 독립 SVG 문자열 (썸네일·PNG 내보내기 공용, 순수 함수)
import { getChartBounds } from './crochetModel.js';
import { getGroupPrimitives, getStitchPrimitives, primitivesToSvg, stitchTransform, STROKE_WIDTH } from './crochetSymbols.js';

const escapeXml = (value) => String(value).replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[ch]);

/** 보이는 단의 코만 골라 그릴 준비 */
export const collectVisible = (chart) => {
  const visibleRounds = new Map(chart.rounds.filter((r) => r.visible !== false).map((r) => [r.id, r]));
  const stitches = chart.stitches.filter((s) => visibleRounds.has(s.roundId));
  return { visibleRounds, stitches };
};

/**
 * @param {{stitches, rounds, groups}} chart
 * @param {{padding?:number, background?:string|null, scale?:number, maxSize?:number, strokeWidth?:number, title?:string}} [options]
 * @returns {{svg:string, width:number, height:number}}
 */
export const renderChartSvg = (chart, options = {}) => {
  const { padding = 24, background = '#ffffff', scale = 1, maxSize = 0, strokeWidth = STROKE_WIDTH, title = '' } = options;
  const { visibleRounds, stitches } = collectVisible(chart);
  const bounds = getChartBounds(stitches) ?? { minX: -40, minY: -40, maxX: 40, maxY: 40 };
  const vbX = bounds.minX - padding;
  const vbY = bounds.minY - padding;
  const vbW = bounds.maxX - bounds.minX + padding * 2;
  const vbH = bounds.maxY - bounds.minY + padding * 2;
  let k = scale;
  if (maxSize > 0) k = maxSize / Math.max(vbW, vbH);
  const width = Math.max(1, Math.round(vbW * k));
  const height = Math.max(1, Math.round(vbH * k));

  const byId = new Map(stitches.map((s) => [s.id, s]));
  const grouped = new Set();
  const parts = [];
  chart.groups.forEach((g) => {
    if (!g.stitchIds.every((id) => byId.has(id))) return;
    g.stitchIds.forEach((id) => grouped.add(id));
    const color = visibleRounds.get(byId.get(g.stitchIds[0]).roundId)?.color ?? '#222';
    parts.push(`<g>${primitivesToSvg(getGroupPrimitives(g, byId), color, strokeWidth)}</g>`);
  });
  stitches.forEach((s) => {
    if (grouped.has(s.id)) return;
    const color = visibleRounds.get(s.roundId)?.color ?? '#222';
    parts.push(`<g transform="${stitchTransform(s)}">${primitivesToSvg(getStitchPrimitives(s.type), color, strokeWidth)}</g>`);
  });

  const bg = background ? `<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${background}" />` : '';
  const titleTag = title ? `<title>${escapeXml(title)}</title>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">${titleTag}${bg}${parts.join('')}</svg>`;
  return { svg, width, height };
};

export const svgToDataUrl = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
