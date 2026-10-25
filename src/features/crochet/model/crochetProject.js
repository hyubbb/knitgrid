// 코바늘 기호도안 프로젝트 레코드 (IndexedDB 저장 형식)
import { normalizeChart } from './crochetModel.js';
import { renderChartSvg, svgToDataUrl } from './crochetRender.js';

export const CROCHET_PROJECT_VERSION = 1;
export const DEFAULT_CROCHET_NAME = '이름 없는 코바늘 도안';

export const createCrochetProjectId = () => `crochet-${Date.now()}`;

export const isCrochetProject = (record) => record?.kind === 'crochet';

export const createCrochetThumbnail = (data) => {
  const chart = normalizeChart(data);
  const { svg } = renderChartSvg(chart, { padding: 12, maxSize: 160, strokeWidth: 2 });
  return svgToDataUrl(svg);
};

export const createCrochetProjectRecord = (id, data, existing = null) => {
  const now = new Date().toISOString();
  const stitches = Array.isArray(data?.stitches) ? data.stitches : [];
  const rounds = Array.isArray(data?.rounds) ? data.rounds : [];
  return {
    id,
    kind: 'crochet',
    name: data?.projectName || DEFAULT_CROCHET_NAME,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    projectData: { version: CROCHET_PROJECT_VERSION, ...data },
    summary: { stitchCount: stitches.length, roundCount: rounds.length },
    thumbnail: createCrochetThumbnail(data)
  };
};

/** 저장 레코드 → 편집기 상태 */
export const readCrochetProject = (record) => ({
  projectName: record?.projectData?.projectName || record?.name || DEFAULT_CROCHET_NAME,
  chart: normalizeChart(record?.projectData ?? {})
});
