import assert from 'node:assert/strict';
import test from 'node:test';
import {
  alignRadial,
  buildIncreaseRounds,
  changeStitchType,
  createEmptyChart,
  createGroup,
  deleteStitches,
  duplicateStitches,
  generateRoundChart,
  layoutAlongLine,
  makeStitch,
  planRoundUnits,
  rotateStitches,
  stitchesInRect,
  ungroupStitches,
  validateGroup
} from '../src/features/crochet/model/crochetModel.js';
import { getGroupPrimitives, getStitchPrimitives, getStitchTop, STITCH_CATEGORIES, STITCH_TYPES } from '../src/features/crochet/model/crochetSymbols.js';

const near = (actual, expected, eps = 0.05) => assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≈ ${expected}`);

const chartWith = (stitches) => {
  const chart = createEmptyChart();
  const roundId = chart.rounds[0].id;
  return { ...chart, stitches: stitches.map(([type, x, y, rot = 0]) => makeStitch(type, x, y, rot, roundId)) };
};

test('모든 기호 종류가 도형을 만들고 분류에 포함된다', () => {
  const listed = STITCH_CATEGORIES.flatMap((c) => c.types);
  assert.deepEqual([...listed].sort(), Object.keys(STITCH_TYPES).sort());
  listed.forEach((type) => assert.ok(getStitchPrimitives(type).length > 0, type));
});

test('한길 긴뜨기는 사선 1개, 두길은 2개, 세길은 3개 (기둥+가로선 외)', () => {
  // 기둥 1 + 가로선 1 + 사선 n
  assert.equal(getStitchPrimitives('hdc').length, 2);
  assert.equal(getStitchPrimitives('dc').length, 3);
  assert.equal(getStitchPrimitives('tr').length, 4);
  assert.equal(getStitchPrimitives('dtr').length, 5);
});

test('코 높이: 사슬·짧은뜨기 < 긴뜨기 < 한길 < 두길 < 세길', () => {
  const h = (t) => STITCH_TYPES[t].height;
  assert.ok(h('ch') < h('hdc') && h('sc') < h('hdc'));
  assert.ok(h('hdc') < h('dc') && h('dc') < h('tr') && h('tr') < h('dtr'));
  assert.ok(h('dc') >= h('sc') * 2.4);
});

test('회전된 코의 머리는 방향을 따라간다', () => {
  const top = getStitchTop({ type: 'dc', x: 0, y: 0, rotation: 90 });
  near(top.x, 36);
  near(top.y, 0);
});

test('매 단 6코씩 늘리기 목록', () => {
  assert.deepEqual(buildIncreaseRounds({ start: 6, increase: 6, roundCount: 4 }).map((r) => r.count), [6, 12, 18, 24]);
});

test('planRoundUnits: 늘리기·줄이기 분배', () => {
  assert.deepEqual(planRoundUnits(6, 12), Array(6).fill('inc'));
  assert.deepEqual(planRoundUnits(12, 18), Array(6).fill(['single', 'inc']).flat());
  assert.deepEqual(planRoundUnits(18, 24), Array(6).fill(['single', 'single', 'inc']).flat());
  const dec = planRoundUnits(18, 12);
  assert.equal(dec.length, 12);
  assert.equal(dec.filter((u) => u === 'dec').length, 6);
  assert.deepEqual(planRoundUnits(6, 6), Array(6).fill('single'));
});

test('원형 생성: 6 → 12 → 18, 단마다 레이어, 늘려뜨기 묶음 자동 생성', () => {
  const result = generateRoundChart({ center: { x: 0, y: 0 }, magicRing: true, rounds: buildIncreaseRounds({ roundCount: 3 }) });
  assert.equal(result.rounds.length, 3);
  assert.deepEqual(result.rounds.map((r) => r.name), ['단 1', '단 2', '단 3']);
  const inRound = (i) => result.stitches.filter((s) => s.roundId === result.rounds[i].id);
  assert.equal(inRound(0).filter((s) => s.type === 'magic').length, 1);
  assert.equal(inRound(0).filter((s) => s.type === 'sc').length, 6);
  assert.equal(inRound(1).length, 12);
  assert.equal(inRound(2).length, 18);
  // 2단: 6개 늘려뜨기 묶음, 3단: 6개
  const groupsIn = (i) => result.groups.filter((g) => inRound(i).some((s) => s.id === g.stitchIds[0]));
  assert.equal(groupsIn(1).length, 6);
  assert.equal(groupsIn(2).length, 6);
  assert.ok(result.groups.every((g) => g.kind === 'inc' && g.stitchIds.length === 2));
});

test('원형 생성: 코는 중심에서 같은 반지름, 바깥을 향한다', () => {
  const center = { x: 100, y: 50 };
  const result = generateRoundChart({ center, magicRing: true, rounds: [{ count: 6, type: 'sc' }, { count: 12, type: 'dc' }] });
  const round2 = result.stitches.filter((s) => s.roundId === result.rounds[1].id);
  const radii = round2.map((s) => Math.hypot(s.x - center.x, s.y - center.y));
  radii.forEach((r) => near(r, radii[0], 0.1));
  round2.forEach((s) => {
    // 방향 벡터와 중심→밑동 벡터가 같은 방향
    const rad = (s.rotation * Math.PI) / 180;
    const dir = { x: Math.sin(rad), y: -Math.cos(rad) };
    const out = { x: (s.x - center.x) / radii[0], y: (s.y - center.y) / radii[0] };
    near(dir.x * out.x + dir.y * out.y, 1, 0.01);
  });
  // 바깥 단 반지름이 안쪽 단보다 크고, 안쪽 코 높이만큼은 떨어진다
  const round1 = result.stitches.filter((s) => s.roundId === result.rounds[0].id && s.type === 'sc');
  const r1 = Math.hypot(round1[0].x - center.x, round1[0].y - center.y);
  assert.ok(radii[0] >= r1 + STITCH_TYPES.sc.height);
});

test('원형 생성: 줄이기 단은 모아뜨기 묶음', () => {
  const result = generateRoundChart({ rounds: [{ count: 6, type: 'sc' }, { count: 12, type: 'sc' }, { count: 6, type: 'sc' }] });
  const last = result.rounds[2].id;
  const decs = result.groups.filter((g) => g.kind === 'dec');
  assert.equal(decs.length, 6);
  assert.equal(result.stitches.filter((s) => s.roundId === last).length, 12);
});

test('원형 생성: 기둥코와 빼뜨기 옵션', () => {
  const result = generateRoundChart({ rounds: [{ count: 6, type: 'dc' }], standing: true, magicRing: true });
  assert.equal(result.stitches.filter((s) => s.role === 'standing').length, 3);
  assert.equal(result.stitches.filter((s) => s.role === 'join' && s.type === 'slip').length, 1);
});

test('줄 배치: 기호 폭 간격으로 개수가 정해지고 선에 수직', () => {
  const layout = layoutAlongLine('sc', { x: 0, y: 0 }, { x: 160, y: 0 });
  assert.equal(layout.count, 11);
  assert.equal(layout.positions[0].x, 0);
  assert.equal(layout.positions[10].x, 160);
  assert.equal(layout.rotation, 0);
  const vertical = layoutAlongLine('ch', { x: 0, y: 0 }, { x: 0, y: 90 });
  assert.equal(vertical.count, 6);
  assert.equal(vertical.rotation, 90);
  assert.equal(layoutAlongLine('sc', { x: 0, y: 0 }, { x: 0, y: 0 }).count, 1);
});

test('묶음 검증: 개수·종류 조건', () => {
  const chart = chartWith([['sc', 0, 0], ['sc', 20, 0], ['dc', 40, 0], ['ch', 60, 0], ['ch', 80, 0], ['sc', 100, 0], ['sc', 120, 0], ['sc', 140, 0], ['sc', 160, 0]]);
  const ids = chart.stitches.map((s) => s.id);
  assert.equal(validateGroup(chart, [ids[0]]), '2코 이상 선택해야 합니다.');
  assert.equal(validateGroup(chart, [ids[0], ids[2]]), '같은 기호끼리만 묶을 수 있습니다.');
  assert.match(validateGroup(chart, [ids[3], ids[4]]), /묶을 수 없습니다/);
  assert.equal(validateGroup(chart, [ids[0], ids[1], ids[5], ids[6], ids[7], ids[8]]), '최대 5코까지 묶을 수 있습니다.');
  assert.equal(validateGroup(chart, [ids[0], ids[1]]), null);
});

test('모아뜨기: 머리가 한 점으로 모이고 밑동은 유지', () => {
  const chart = chartWith([['dc', 0, 0], ['dc', 20, 0], ['dc', 40, 0]]);
  const ids = chart.stitches.map((s) => s.id);
  const { ok, chart: next, group } = createGroup(chart, ids, 'dec');
  assert.ok(ok);
  assert.equal(next.groups.length, 1);
  const byId = new Map(next.stitches.map((s) => [s.id, s]));
  const lines = getGroupPrimitives(group, byId).filter((p) => p.t === 'line');
  // 기둥 3개가 모두 (20, -36)에서 끝난다
  const stems = lines.filter((l) => l.x2 === 20 && l.y2 === -36);
  assert.equal(stems.length, 3);
  assert.deepEqual(stems.map((l) => l.x1).sort((a, b) => a - b), [0, 20, 40]);
});

test('늘려뜨기: 밑동이 한 점으로 모인다', () => {
  const chart = chartWith([['sc', 0, 0], ['sc', 20, 0]]);
  const { chart: next, group } = createGroup(chart, chart.stitches.map((s) => s.id), 'inc');
  const byId = new Map(next.stitches.map((s) => [s.id, s]));
  // 두 연결선이 같은 점(밑동 사이, 살짝 아래)에서 출발해 서로 다른 × 로 간다
  const connectors = getGroupPrimitives(group, byId).filter((p) => p.t === 'line' && p.x1 === 10 && p.y1 === 3);
  assert.equal(connectors.length, 2);
  assert.ok(connectors[0].x2 < 10 && connectors[1].x2 > 10);
});

test('다시 묶으면 이전 묶음에서 빠지고, 해제·삭제·기호 바꾸기 시 묶음 정리', () => {
  const chart = chartWith([['sc', 0, 0], ['sc', 20, 0], ['sc', 40, 0]]);
  const [a, b, c] = chart.stitches.map((s) => s.id);
  let next = createGroup(chart, [a, b], 'inc').chart;
  next = createGroup(next, [b, c], 'dec').chart;
  assert.equal(next.groups.length, 1);
  assert.deepEqual(next.groups[0].stitchIds, [b, c]);
  assert.equal(ungroupStitches(next, [c]).groups.length, 0);
  assert.equal(deleteStitches(next, [b]).groups.length, 0);
  assert.equal(changeStitchType(next, [b], 'ch').groups.length, 0);
  assert.equal(changeStitchType(next, [b, c], 'dc').groups.length, 1);
});

test('회전: 15° 단위로 위치와 방향이 함께 돈다', () => {
  const chart = chartWith([['sc', -10, 0], ['sc', 10, 0]]);
  const next = rotateStitches(chart, chart.stitches.map((s) => s.id), 90);
  near(next.stitches[0].x, 0);
  near(next.stitches[0].y, -10);
  assert.equal(next.stitches[0].rotation, 90);
  const neg = rotateStitches(chart, [chart.stitches[0].id], -15);
  assert.equal(neg.stitches[0].rotation, 345);
});

test('방사 정렬: 중심에서 바깥을 향한다', () => {
  const chart = chartWith([['sc', 0, -20], ['sc', 20, 0], ['sc', 0, 20], ['sc', -20, 0]]);
  const next = alignRadial(chart, chart.stitches.map((s) => s.id));
  assert.deepEqual(next.stitches.map((s) => s.rotation), [0, 90, 180, 270]);
});

test('복제: 새 id, 이동, 포함된 묶음도 복제', () => {
  const base = chartWith([['sc', 0, 0], ['sc', 20, 0]]);
  const grouped = createGroup(base, base.stitches.map((s) => s.id), 'inc').chart;
  const { chart, newIds } = duplicateStitches(grouped, grouped.stitches.map((s) => s.id), 20, 20);
  assert.equal(chart.stitches.length, 4);
  assert.equal(newIds.length, 2);
  assert.equal(chart.groups.length, 2);
  assert.equal(chart.stitches[2].x, 20);
  assert.equal(chart.stitches[2].y, 20);
});

test('범위 선택: 기호 중심 기준', () => {
  const chart = chartWith([['dc', 0, 0], ['dc', 100, 0]]);
  assert.deepEqual(stitchesInRect(chart.stitches, { x1: -10, y1: -30, x2: 10, y2: -5 }), [chart.stitches[0].id]);
});
