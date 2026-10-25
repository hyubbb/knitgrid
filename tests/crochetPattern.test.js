import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIncreaseRounds, createEmptyChart, createGroup, generateRoundChart, makeStitch } from '../src/features/crochet/model/crochetModel.js';
import { buildWrittenPattern, compressUnits, formatCompressed, formatWrittenPattern, roundLabel } from '../src/features/crochet/model/crochetPattern.js';

const units = (names) => names.map((name) => ({ name, counts: true }));

test('반복 없는 런 압축', () => {
  assert.equal(formatCompressed(compressUnits(units(['사슬뜨기', '사슬뜨기', '사슬뜨기']))), '사슬뜨기 ×3');
  assert.equal(formatCompressed(compressUnits(units(['사슬뜨기', '짧은뜨기', '짧은뜨기']))), '사슬뜨기 1, 짧은뜨기 ×2');
});

test('전체 반복 단위 탐지', () => {
  const seq = Array(6).fill(['짧은뜨기', '짧은뜨기', '늘려']).flat();
  assert.equal(formatCompressed(compressUnits(units(seq))), '[짧은뜨기 2, 늘려 1] ×6');
});

test('원형 단은 시작점을 돌려 더 짧은 반복 단위를 찾는다', () => {
  const seq = Array(4).fill(['A', 'B', 'A']).flat(); // A B A A B A ... → [A 2, B 1] 형태
  assert.equal(formatCompressed(compressUnits(units(seq), { cyclic: true })), '[B 1, A 2] ×4');
  assert.equal(formatCompressed(compressUnits(units(seq))), '[A 1, B 1, A 1] ×4');
});

test('부분 반복: 앞뒤 구간 + 반복 블록', () => {
  const seq = ['사슬뜨기', 'A', 'B', 'A', 'B', 'A', 'B', '빼'];
  assert.equal(formatCompressed(compressUnits(units(seq))), '사슬뜨기 1, [A 1, B 1] ×3, 빼 1');
});

test('단 이름 표기', () => {
  assert.equal(roundLabel('단 2'), '2단');
  assert.equal(roundLabel('테두리'), '테두리');
});

test('원형 생성 차트의 서술도안: 6 → 12 → 18 → 24', () => {
  const generated = generateRoundChart({ magicRing: true, rounds: buildIncreaseRounds({ roundCount: 4 }) });
  const lines = buildWrittenPattern(generated).map((l) => l.line);
  assert.deepEqual(lines, [
    '1단: 매직링, 짧은뜨기 ×6 (6코)',
    '2단: 짧은뜨기 늘려뜨기 ×6 (12코)',
    '3단: [짧은뜨기 1, 짧은뜨기 늘려뜨기 1] ×6 (18코)',
    '4단: [짧은뜨기 2, 짧은뜨기 늘려뜨기 1] ×6 (24코)'
  ]);
});

test('줄이기 단: 모아뜨기 표기와 코 수', () => {
  const generated = generateRoundChart({ magicRing: false, rounds: [{ count: 6, type: 'sc' }, { count: 12, type: 'sc' }, { count: 6, type: 'sc' }] });
  const last = buildWrittenPattern(generated)[2];
  assert.equal(last.line, '3단: 짧은뜨기 2코 모아뜨기 ×6 (6코)');
});

test('기둥코·빼뜨기는 앞뒤에 붙고 코 수에서 빠진다', () => {
  const generated = generateRoundChart({ magicRing: true, standing: true, rounds: [{ count: 12, type: 'dc' }] });
  assert.equal(buildWrittenPattern(generated)[0].line, '1단: 매직링, 기둥코 사슬 ×3, 한길 긴뜨기 ×12, 빼뜨기 (12코)');
});

test('줄(평면) 단은 x 순서, 수동 묶음 이름', () => {
  const chart = createEmptyChart();
  const r = chart.rounds[0].id;
  // 일부러 뒤섞어 배치
  const stitches = [
    makeStitch('dc', 40, 0, 0, r),
    makeStitch('ch', 0, 0, 0, r),
    makeStitch('dc', 60, 0, 0, r),
    makeStitch('dc', 20, 0, 0, r),
    makeStitch('dc', 80, 0, 0, r)
  ];
  let next = { ...chart, stitches };
  next = createGroup(next, [stitches[2].id, stitches[4].id, stitches[0].id], 'dec').chart;
  const [line] = buildWrittenPattern(next);
  assert.equal(line.line, '1단: 사슬뜨기 1, 한길 긴뜨기 1, 한길 긴뜨기 3코 모아뜨기 1 (3코)');
});

test('빈 단은 건너뛰고 제목을 붙여 문자열로', () => {
  const chart = createEmptyChart();
  const r = chart.rounds[0].id;
  const next = { ...chart, stitches: [makeStitch('sc', 0, 0, 0, r)], rounds: [...chart.rounds, { id: 'x', name: '단 2', color: '#000', visible: true }] };
  assert.equal(formatWrittenPattern(next, '컵받침'), '■ 컵받침\n1단: 짧은뜨기 1 (1코)');
});
