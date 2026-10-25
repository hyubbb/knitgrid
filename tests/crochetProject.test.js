import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIncreaseRounds, generateRoundChart } from '../src/features/crochet/model/crochetModel.js';
import { createCrochetProjectId, createCrochetProjectRecord, isCrochetProject, readCrochetProject } from '../src/features/crochet/model/crochetProject.js';
import { renderChartSvg } from '../src/features/crochet/model/crochetRender.js';

const sample = () => {
  const chart = generateRoundChart({ rounds: buildIncreaseRounds({ roundCount: 2 }) });
  return { projectName: '컵받침', ...chart };
};

test('레코드 형식', () => {
  const record = createCrochetProjectRecord('crochet-1', sample());
  assert.equal(record.id, 'crochet-1');
  assert.equal(record.kind, 'crochet');
  assert.equal(record.name, '컵받침');
  assert.equal(record.projectData.version, 1);
  assert.equal(record.projectData.projectName, '컵받침');
  assert.deepEqual(record.summary, { stitchCount: 19, roundCount: 2 });
  assert.match(record.thumbnail, /^data:image\/svg\+xml,/);
  assert.ok(decodeURIComponent(record.thumbnail).includes('<svg'));
  assert.equal(record.createdAt, record.updatedAt);
});

test('기존 레코드의 createdAt 유지, 이름 기본값', () => {
  const existing = { createdAt: '2020-01-01T00:00:00.000Z' };
  const record = createCrochetProjectRecord('crochet-2', { stitches: [], rounds: [] }, existing);
  assert.equal(record.createdAt, existing.createdAt);
  assert.equal(record.name, '이름 없는 코바늘 도안');
});

test('isCrochetProject / id 형식', () => {
  assert.equal(isCrochetProject({ kind: 'crochet' }), true);
  assert.equal(isCrochetProject({ kind: 'grid' }), false);
  assert.equal(isCrochetProject(null), false);
  assert.match(createCrochetProjectId(), /^crochet-\d+$/);
});

test('레코드 → 편집 상태 복원', () => {
  const record = createCrochetProjectRecord('crochet-3', sample());
  const { projectName, chart } = readCrochetProject(record);
  assert.equal(projectName, '컵받침');
  assert.equal(chart.stitches.length, 19);
  assert.equal(chart.groups.length, 6);
});

test('SVG 렌더링: 숨긴 단은 그리지 않는다', () => {
  const data = sample();
  const full = renderChartSvg(data).svg;
  const hidden = renderChartSvg({ ...data, rounds: data.rounds.map((r, i) => ({ ...r, visible: i === 0 })) }).svg;
  assert.ok(full.length > hidden.length);
  assert.ok(!hidden.includes(data.rounds[1].color));
});
