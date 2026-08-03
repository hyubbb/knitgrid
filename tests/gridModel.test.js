import assert from 'node:assert/strict';
import test from 'node:test';
import { createGrid, scaleGridUp, scaleGridDown, clearGridRegion, moveGridRegion, copyGridRegion, pasteGridRegion, removeGridRowRange, removeGridColRange } from '../src/entities/grid/model/gridModel.js';

test('removeGridRowRange/ColRange remove the whole selected span', () => {
  const grid = createGrid(5, 5);
  grid[0][0] = { ...grid[0][0], active: true, paletteId: 'top' };
  grid[4][4] = { ...grid[4][4], active: true, paletteId: 'bottom' };

  // 1~3행 제거 → 5행 → 2행, top(0행)과 bottom(4→1행) 보존
  const rowsRemoved = removeGridRowRange(grid, 1, 3);
  assert.equal(rowsRemoved.length, 2);
  assert.equal(rowsRemoved[0][0].paletteId, 'top');
  assert.equal(rowsRemoved[1][4].paletteId, 'bottom');

  // 1~3열 제거 → 5열 → 2열
  const colsRemoved = removeGridColRange(grid, 1, 3);
  assert.equal(colsRemoved[0].length, 2);
  assert.equal(colsRemoved[0][0].paletteId, 'top');
  assert.equal(colsRemoved[4][1].paletteId, 'bottom');
});

const paint = (grid, r, c, id) => {
  grid[r][c] = { active: true, color: '#123456', symbol: id, label: id, note: '', paletteId: id };
};

test('scaleGridUp splits each cell into a 2x2 block', () => {
  const grid = createGrid(2, 2);
  paint(grid, 0, 1, 'a');

  const scaled = scaleGridUp(grid);

  assert.equal(scaled.length, 4);
  assert.equal(scaled[0].length, 4);
  // (0,1) 원본 칸 → (0..1, 2..3) 블록 전체가 같은 색
  for (const [r, c] of [[0, 2], [0, 3], [1, 2], [1, 3]]) {
    assert.equal(scaled[r][c].paletteId, 'a', `(${r},${c})`);
  }
  assert.equal(scaled[0][0].active, false);
  assert.equal(scaled[2][2].active, false);
});

test('scaleGridDown takes the top-left cell of each block and handles odd sizes', () => {
  const grid = createGrid(4, 4);
  paint(grid, 0, 0, 'a'); // 블록(0,0)의 좌상단
  paint(grid, 1, 1, 'b'); // 같은 블록의 비대표 칸 → 무시됨

  const scaled = scaleGridDown(grid);
  assert.equal(scaled.length, 2);
  assert.equal(scaled[0].length, 2);
  assert.equal(scaled[0][0].paletteId, 'a');
  assert.equal(scaled[0][1].active, false);

  // 홀수 크기: 5 → ceil(5/2) = 3, 마지막 블록 좌상단은 (4,4)
  const odd = createGrid(5, 5);
  paint(odd, 4, 4, 'edge');
  const oddScaled = scaleGridDown(odd);
  assert.equal(oddScaled.length, 3);
  assert.equal(oddScaled[2][2].paletteId, 'edge');
});

test('scaleGridUp then scaleGridDown restores the original pattern', () => {
  const grid = createGrid(3, 3);
  paint(grid, 1, 2, 'x');
  const roundTrip = scaleGridDown(scaleGridUp(grid));
  assert.equal(roundTrip[1][2].paletteId, 'x');
  assert.equal(roundTrip.length, 3);
  assert.equal(roundTrip.flat().filter((cell) => cell.active).length, 1);
});

test('clearGridRegion empties only the region', () => {
  const grid = createGrid(3, 3);
  paint(grid, 0, 0, 'keep');
  paint(grid, 1, 1, 'gone');
  paint(grid, 2, 2, 'gone');

  const next = clearGridRegion(grid, { r0: 1, c0: 1, r1: 2, c1: 2 });
  assert.equal(next[0][0].paletteId, 'keep');
  assert.equal(next[1][1].active, false);
  assert.equal(next[2][2].active, false);
});

test('moveGridRegion cuts, pastes at delta, overwrites destination, clips at edges', () => {
  const grid = createGrid(3, 4);
  paint(grid, 0, 0, 'a');
  paint(grid, 0, 1, 'b');
  paint(grid, 2, 3, 'dest'); // 이동 목적지에 있던 칸 → 덮어써짐 대상 아님(다른 위치)

  // (0,0)-(0,1) 영역을 아래로 2, 오른쪽으로 2 → (2,2)-(2,3)
  const next = moveGridRegion(grid, { r0: 0, c0: 0, r1: 0, c1: 1 }, 2, 2);
  assert.equal(next[0][0].active, false); // 원위치 빔
  assert.equal(next[0][1].active, false);
  assert.equal(next[2][2].paletteId, 'a');
  assert.equal(next[2][3].paletteId, 'b'); // 목적지의 기존 칸 덮어씀

  // 격자 밖으로 이동 → 클리핑(내용 소실, 에러 없음)
  const clipped = moveGridRegion(grid, { r0: 0, c0: 0, r1: 0, c1: 1 }, -1, 0);
  assert.equal(clipped[0][0].active, false);
  assert.equal(clipped.flat().filter((cell) => cell.paletteId === 'a').length, 0);
});

test('copyGridRegion snapshots the region without touching the grid', () => {
  const grid = createGrid(3, 3);
  paint(grid, 1, 1, 'a');
  paint(grid, 2, 2, 'b');

  const cells = copyGridRegion(grid, { r0: 1, c0: 1, r1: 2, c1: 2 });
  assert.equal(cells.length, 2);
  assert.equal(cells[0].length, 2);
  assert.equal(cells[0][0].paletteId, 'a');
  assert.equal(cells[1][1].paletteId, 'b');
  assert.equal(cells[0][1].active, false);

  // 복사본이어야 한다 — 원본 격자를 바꿔도 클립보드는 그대로
  grid[1][1].paletteId = 'mutated';
  assert.equal(cells[0][0].paletteId, 'a');
});

test('pasteGridRegion overwrites at target and clips at edges', () => {
  const grid = createGrid(3, 3);
  paint(grid, 0, 0, 'src');
  const cells = copyGridRegion(grid, { r0: 0, c0: 0, r1: 0, c1: 1 }); // [src, 빈칸]
  paint(grid, 2, 1, 'dest');
  paint(grid, 2, 2, 'dest2');

  const next = pasteGridRegion(grid, cells, 2, 1);
  assert.equal(next[2][1].paletteId, 'src'); // 목적지 덮어씀
  assert.equal(next[2][2].active, false); // 클립보드의 빈 칸도 그대로 붙음
  assert.equal(next[0][0].paletteId, 'src'); // 원본 위치는 유지(복사이므로)

  // 격자 밖으로 나가는 부분은 클리핑, 에러 없음
  const clipped = pasteGridRegion(grid, cells, 2, 2);
  assert.equal(clipped[2][2].paletteId, 'src');
});
