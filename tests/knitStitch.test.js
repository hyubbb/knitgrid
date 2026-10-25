import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeKnitRows,
  applyKnitSelectionAction,
  buildKnitWrittenLines,
  clearKnitStitches,
  fillKnitSequence,
  getKnitSelectionActions,
  getKnitStitch,
  getStitchGlyph,
  invertKnitStitches,
  placeKnitStitch
} from '../src/entities/knit-stitch/model/knitStitchModel.js';

const row = (...ids) => ids.map((stitch) => ({ active: false, stitch }));
const ids = (cells) => cells.map((cell) => cell.stitch);

test('empty stitch is treated as knit', () => {
  assert.equal(getKnitStitch('').id, 'k');
  assert.equal(getKnitStitch(undefined).id, 'k');
});

test('placeKnitStitch fills a cable across its span and clamps to the row end', () => {
  const grid = [row('', '', '', '', '')];
  const next = placeKnitStitch(grid, 0, 3, 'c2-2r');
  assert.deepEqual(ids(next[0]), ['', 'c2-2r', 'c2-2r', 'c2-2r', 'c2-2r']);
  assert.deepEqual(next[0].slice(1).map((cell) => cell.stitchPart), [0, 1, 2, 3]);
  assert.deepEqual(ids(grid[0]), ['', '', '', '', ''], 'input is not mutated');
});

test('placing over part of a cable clears the whole cable', () => {
  let grid = placeKnitStitch([row('', '', '', '')], 0, 0, 'c2-2l');
  grid = placeKnitStitch(grid, 0, 2, 'p');
  assert.deepEqual(ids(grid[0]), ['', '', 'p', '']);
  assert.ok(grid[0].every((cell) => cell.stitchPart === undefined));
});

test('analyzeKnitRows flags a decrease row that is not followed by no-stitch cells', () => {
  // 행 2가 첫 단(4코), 행 1에서 왼코 겹치기 → 3코, 행 0이 4코를 가져가려 하면 오류
  const grid = [row('', '', '', ''), row('k2tog', 'ns', '', ''), row('', '', '', '')];
  const [top, middle, bottom] = analyzeKnitRows(grid);
  assert.deepEqual([bottom.consumes, bottom.produces, bottom.ok], [4, 4, true]);
  assert.deepEqual([middle.consumes, middle.produces, middle.ok], [4, 3, true]);
  assert.deepEqual([top.consumes, top.expected, top.ok], [4, 3, false]);
});

test('analyzeKnitRows counts a cable once', () => {
  const grid = [placeKnitStitch([row('', '', '', '')], 0, 0, 'c2-2r')[0], row('', '', '', '')];
  assert.equal(analyzeKnitRows(grid)[0].consumes, 4);
  assert.equal(analyzeKnitRows(grid)[0].ok, true);
});

test('selection actions depend on the selected width', () => {
  const two = getKnitSelectionActions({ r0: 0, r1: 0, c0: 3, c1: 2 }).map((a) => a.id);
  assert.ok(two.includes('k2tog') && two.includes('eyelet-r') && two.includes('c1-1r'));
  const three = getKnitSelectionActions({ r0: 1, r1: 1, c0: 0, c1: 2 }).map((a) => a.id);
  assert.ok(three.includes('cdd'));
  assert.equal(getKnitSelectionActions({ r0: 0, r1: 1, c0: 0, c1: 1 }).length, 0);
});

test('applyKnitSelectionAction keeps stitch count for an eyelet and reduces it for cdd', () => {
  const base = [row('', '', '', ''), row('', '', '', '')];
  const eyelet = getKnitSelectionActions({ r0: 0, r1: 0, c0: 1, c1: 2 }).find((a) => a.id === 'eyelet-r');
  const withEyelet = applyKnitSelectionAction(base, { r0: 0, r1: 0, c0: 1, c1: 2 }, eyelet);
  assert.deepEqual(ids(withEyelet[0]), ['', 'yo', 'k2tog', '']);
  assert.equal(analyzeKnitRows(withEyelet)[0].produces, 4);

  const cdd = getKnitSelectionActions({ r0: 0, r1: 0, c0: 0, c1: 2 }).find((a) => a.id === 'cdd');
  const withCdd = applyKnitSelectionAction(base, { r0: 0, r1: 0, c0: 0, c1: 2 }, cdd);
  assert.deepEqual(ids(withCdd[0]), ['ns', 'cdd', 'ns', '']);
  assert.equal(analyzeKnitRows(withCdd)[0].produces, 2);
});

test('fillKnitSequence makes ribbing and seed stitch', () => {
  const grid = [row('', '', '', ''), row('', '', '', '')];
  const rib = fillKnitSequence(grid, { r0: 0, r1: 1, c0: 0, c1: 3 }, ['k', 'p']);
  assert.deepEqual(ids(rib[0]), ['k', 'p', 'k', 'p']);
  assert.deepEqual(ids(rib[1]), ['k', 'p', 'k', 'p']);
  const seed = fillKnitSequence(grid, { r0: 0, r1: 1, c0: 0, c1: 3 }, ['k', 'p'], { rowShift: 1 });
  assert.deepEqual(ids(seed[0]), ['k', 'p', 'k', 'p']);
  assert.deepEqual(ids(seed[1]), ['p', 'k', 'p', 'k']);
});

test('invert and clear stitches', () => {
  const grid = [row('k', 'p', 'ktbl', 'yo')];
  assert.deepEqual(ids(invertKnitStitches(grid, { r0: 0, r1: 0, c0: 0, c1: 3 })[0]), ['p', 'k', 'ptbl', 'yo']);
  assert.deepEqual(ids(clearKnitStitches(grid, { r0: 0, r1: 0, c0: 1, c1: 2 })[0]), ['k', '', '', 'yo']);
});

test('buildKnitWrittenLines reads flat rows alternately and flips knit/purl on the wrong side', () => {
  const grid = [row('k', 'k', 'p', 'p'), row('k', 'k', 'p', 'p')];
  const lines = buildKnitWrittenLines({ grid, rows: 2 });
  // 1단 = 아래 행, 오른쪽→왼쪽: 안 2, 겉 2
  assert.equal(lines[0], '1단 (겉면 ←): 안 2, 겉 2 (4코)');
  // 2단 = 위 행, 왼쪽→오른쪽 + 안면: 겉→안, 안→겉
  assert.equal(lines[1], '2단 (안면 →): 안 2, 겉 2 (4코)');
});

test('buildKnitWrittenLines detects repeats and skips no-stitch cells', () => {
  const grid = [row('k', 'p', 'k', 'p', 'k', 'p'), row('ns', 'k2tog', 'yo', '', '', '')];
  const lines = buildKnitWrittenLines({ grid, rows: 2, knitMode: 'round' });
  assert.equal(lines[0], '1단 (←): 겉 3, 걸기, 왼코겹 (5코)');
  assert.equal(lines[1], '2단 (←): [안, 겉] ×3 (6코)');
});

test('every stitch has a glyph definition (except no-stitch)', () => {
  ['k', 'p', 'yo', 'k2tog', 'ssk', 'cdd', 'c2-2r', 'c3-3l', 'bobble'].forEach((id) => {
    assert.ok(getStitchGlyph(id).length > 0, id);
  });
  assert.deepEqual(getStitchGlyph('ns'), []);
});
