import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildKnitStitches,
  getDefaultKnitCellScale,
  shadeColor,
  KNIT_BASE_COLOR
} from '../src/features/knit-preview/model/knitLayout.js';

const palette = [
  { id: 'a', code: 'A', name: '빨강', color: '#ff0000', visible: true },
  { id: 'b', code: 'B', name: '파랑', color: '#0000ff', visible: false }
];
const cell = (paletteId, active = true) => ({ active, color: '#123456', symbol: '', label: '', note: '', paletteId });

test('buildKnitStitches draws bottom row first, left to right', () => {
  const grid = [[cell('a'), cell('a')], [cell('a'), cell('a')]];
  const order = buildKnitStitches({ grid, palette }).map(({ row, col }) => `${row}:${col}`);
  assert.deepEqual(order, ['1:0', '1:1', '0:0', '0:1']);
});

test('buildKnitStitches uses palette color for painted cells', () => {
  const [stitch] = buildKnitStitches({ grid: [[cell('a')]], palette });
  assert.equal(stitch.color, '#ff0000');
});

test('buildKnitStitches fills empty and hidden cells with the base color', () => {
  const grid = [[cell('', false), cell('b')]];
  const colors = buildKnitStitches({ grid, palette }).map((s) => s.color);
  assert.deepEqual(colors, [KNIT_BASE_COLOR, KNIT_BASE_COLOR]);
  const custom = buildKnitStitches({ grid, palette, baseColor: '#222222' }).map((s) => s.color);
  assert.deepEqual(custom, ['#222222', '#222222']);
});

test('buildKnitStitches maps stitch symbols to fabric looks', () => {
  const grid = [[{ ...cell('a'), stitch: 'p' }, { ...cell('a'), stitch: 'yo' }, { ...cell('a'), stitch: 'ns' }, cell('a')]];
  assert.deepEqual(buildKnitStitches({ grid, palette }).map((s) => s.look), ['purl', 'hole', 'none', 'knit']);
});

test('getDefaultKnitCellScale is wider than tall and keeps area', () => {
  const { w, h } = getDefaultKnitCellScale();
  assert.ok(Math.abs(h / w - 0.75) < 1e-9);
  assert.ok(Math.abs(w * h - 1) < 1e-9);
});

test('shadeColor lightens, darkens and passes through', () => {
  assert.equal(shadeColor('#808080', 0), '#808080');
  assert.equal(shadeColor('#808080', 1), '#ffffff');
  assert.equal(shadeColor('#808080', -1), '#000000');
  assert.equal(shadeColor('#fff', -0.5), '#808080');
  assert.equal(shadeColor('not-a-color', 0.3), 'not-a-color');
});
