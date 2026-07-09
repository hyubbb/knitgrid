import { clonePalette, INITIAL_PALETTE } from '../../palette/model/paletteModel.js';
import { clampNumber } from '../../../shared/lib/number.js';

export const cloneGrid = (grid) => grid.map((row) => row.map((cell) => ({ ...cell })));

export const makeSnapshot = (grid, palette, activePaletteId, meta = {}) => ({
  grid: cloneGrid(grid),
  palette: clonePalette(palette),
  activePaletteId,
  rows: meta.rows ?? grid.length,
  cols: meta.cols ?? grid[0]?.length ?? 0,
  currentCell: meta.currentCell ? { ...meta.currentCell } : null,
  insertAnchorCell: meta.insertAnchorCell ? { ...meta.insertAnchorCell } : null,
  progressRow: meta.progressRow ?? null,
  completedRows: meta.completedRows ? [...meta.completedRows] : null
});

export const makeCell = () => ({
  active: false,
  color: '#ffffff',
  symbol: '',
  label: '',
  note: '',
  paletteId: ''
});

export const createGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, makeCell));

export const clampCellToGrid = (cell, nextRows, nextCols) => ({
  row: clampNumber(cell.row, 0, Math.max(0, nextRows - 1)),
  col: clampNumber(cell.col, 0, Math.max(0, nextCols - 1))
});

export const hasPaintedCells = (grid) => grid.some((row) => row.some((cell) => cell.active));

// 정렬(start/center/end)로부터 유지 영역의 기본 offset(0~delta)을 계산
export const alignOffset = (currentSize, nextSize, alignment) => {
  const delta = Math.abs(currentSize - nextSize);
  return alignment === 'end' ? delta : alignment === 'center' ? Math.floor(delta / 2) : 0;
};

// offsetOverride가 주어지면 정렬 대신 그 offset(칸 단위)을 delta 범위로 clamp해서 사용
const getAlignedResizeWindow = (currentSize, nextSize, alignment, offsetOverride) => {
  const delta = Math.abs(currentSize - nextSize);
  const offset = clampNumber(offsetOverride ?? alignOffset(currentSize, nextSize, alignment), 0, delta);
  return currentSize > nextSize
    ? { sourceStart: offset, targetStart: 0 }
    : { sourceStart: 0, targetStart: offset };
};

export const resizeGridKeepingContentAligned = (grid, nextRows, nextCols, options = {}) => {
  const currentRows = grid.length;
  const currentCols = grid[0]?.length ?? 0;
  const vertical = getAlignedResizeWindow(currentRows, nextRows, options.alignY ?? 'center', options.offsetY);
  const horizontal = getAlignedResizeWindow(currentCols, nextCols, options.alignX ?? 'center', options.offsetX);

  return Array.from({ length: nextRows }, (_, rowIndex) =>
    Array.from({ length: nextCols }, (_, colIndex) => {
      const sourceRow = rowIndex - vertical.targetStart + vertical.sourceStart;
      const sourceCol = colIndex - horizontal.targetStart + horizontal.sourceStart;
      return grid[sourceRow]?.[sourceCol] ? { ...grid[sourceRow][sourceCol] } : makeCell();
    })
  );
};

// 좌상단 고정 리사이즈 = 양축 'start' 정렬과 동일
export const resizeGridKeepingContent = (grid, nextRows, nextCols) =>
  resizeGridKeepingContentAligned(grid, nextRows, nextCols, { alignX: 'start', alignY: 'start' });

export const moveGridContent = (grid, rowDelta, colDelta) => {
  const nextRows = grid.length;
  const nextCols = grid[0]?.length ?? 0;
  const next = createGrid(nextRows, nextCols);
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell.active) return;
      const targetRow = rowIndex + rowDelta;
      const targetCol = colIndex + colDelta;
      if (targetRow < 0 || targetRow >= nextRows || targetCol < 0 || targetCol >= nextCols) return;
      next[targetRow][targetCol] = { ...cell };
    });
  });
  return next;
};

// 도안 정수 배율 확대: 각 칸이 factor x factor 블록으로 갈라진다(nearest-neighbor).
export const scaleGridUp = (grid, factor = 2) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return Array.from({ length: rows * factor }, (_, r) =>
    Array.from({ length: cols * factor }, (_, c) => ({ ...grid[Math.floor(r / factor)][Math.floor(c / factor)] }))
  );
};

// 도안 축소: factor x factor 블록의 좌상단 칸으로 대표. 홀수 크기는 ceil로 가장자리 보존.
export const scaleGridDown = (grid, factor = 2) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  return Array.from({ length: Math.max(1, Math.ceil(rows / factor)) }, (_, r) =>
    Array.from({ length: Math.max(1, Math.ceil(cols / factor)) }, (_, c) => ({ ...grid[r * factor][c * factor] }))
  );
};

const inRegion = (sel, r, c) => r >= sel.r0 && r <= sel.r1 && c >= sel.c0 && c <= sel.c1;

// 선택 영역의 칸만 빈 칸으로.
export const clearGridRegion = (grid, sel) =>
  grid.map((row, r) => row.map((cell, c) => (inRegion(sel, r, c) ? makeCell() : { ...cell })));

// 선택 영역을 잘라내 delta 위치에 붙여넣는다. 원위치는 빈 칸, 목적지는 덮어씀, 격자 밖은 클리핑.
export const moveGridRegion = (grid, sel, dRow, dCol) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next = grid.map((row, r) => row.map((cell, c) => (inRegion(sel, r, c) ? makeCell() : { ...cell })));
  for (let r = sel.r0; r <= sel.r1; r += 1) {
    for (let c = sel.c0; c <= sel.c1; c += 1) {
      const tr = r + dRow;
      const tc = c + dCol;
      if (tr < 0 || tr >= rows || tc < 0 || tc >= cols) continue;
      next[tr][tc] = { ...grid[r][c] };
    }
  }
  return next;
};

export const insertGridRow = (grid, index) => {
  const cols = grid[0]?.length ?? 0;
  const safeIndex = clampNumber(index, 0, grid.length);
  return [
    ...grid.slice(0, safeIndex).map((row) => row.map((cell) => ({ ...cell }))),
    Array.from({ length: cols }, makeCell),
    ...grid.slice(safeIndex).map((row) => row.map((cell) => ({ ...cell })))
  ];
};

export const insertGridCol = (grid, index) => {
  const safeIndex = clampNumber(index, 0, grid[0]?.length ?? 0);
  return grid.map((row) => [
    ...row.slice(0, safeIndex).map((cell) => ({ ...cell })),
    makeCell(),
    ...row.slice(safeIndex).map((cell) => ({ ...cell }))
  ]);
};

// 선택 영역용: 행/열 범위를 통째로 제거(최소 1행/1열은 남긴다는 보장은 호출부 책임)
export const removeGridRowRange = (grid, start, end) =>
  grid
    .filter((_, rowIndex) => rowIndex < start || rowIndex > end)
    .map((row) => row.map((cell) => ({ ...cell })));

export const removeGridColRange = (grid, start, end) =>
  grid.map((row) =>
    row
      .filter((_, colIndex) => colIndex < start || colIndex > end)
      .map((cell) => ({ ...cell }))
  );

export const removeGridRow = (grid, index) => {
  const safeIndex = clampNumber(index, 0, grid.length - 1);
  return grid
    .filter((_, rowIndex) => rowIndex !== safeIndex)
    .map((row) => row.map((cell) => ({ ...cell })));
};

export const removeGridCol = (grid, index) => {
  const safeIndex = clampNumber(index, 0, (grid[0]?.length ?? 1) - 1);
  return grid.map((row) =>
    row
      .filter((_, colIndex) => colIndex !== safeIndex)
      .map((cell) => ({ ...cell }))
  );
};

export const adjustCellAfterRowRemoval = (cell, rowIndex, nextRows) =>
  clampCellToGrid(
    {
      row: cell.row > rowIndex ? cell.row - 1 : cell.row,
      col: cell.col
    },
    nextRows,
    Number.MAX_SAFE_INTEGER
  );

export const adjustCellAfterColRemoval = (cell, colIndex, nextCols) =>
  clampCellToGrid(
    {
      row: cell.row,
      col: cell.col > colIndex ? cell.col - 1 : cell.col
    },
    Number.MAX_SAFE_INTEGER,
    nextCols
  );

export const seedGrid = (rows = 64, cols = 48) => {
  const grid = createGrid(rows, cols);
  const paint = (r, c, palette) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      grid[r][c] = {
        active: true,
        color: palette.color,
        symbol: palette.code,
        label: palette.name,
        note: '',
        paletteId: palette.id
      };
    }
  };

  const black = INITIAL_PALETTE[0];
  const white = INITIAL_PALETTE[1];
  const pink = INITIAL_PALETTE[2];
  const blue = INITIAL_PALETTE[3];
  const green = INITIAL_PALETTE[4];
  const midR = Math.floor(rows / 2) - 7;
  const midC = Math.floor(cols / 2) - 8;

  for (let r = 0; r < 15; r += 1) {
    for (let c = 0; c < 17; c += 1) {
      const edge = r === 0 || r === 14 || c === 0 || c === 16;
      const stripe = (r + c) % 5 === 0;
      if (edge) paint(midR + r, midC + c, black);
      if (r > 3 && r < 11 && c > 4 && c < 12) paint(midR + r, midC + c, pink);
      if (stripe && r > 1 && r < 13 && c > 1 && c < 15) paint(midR + r, midC + c, blue);
      if ((r === 6 || r === 7 || r === 8) && c > 6 && c < 10) paint(midR + r, midC + c, white);
    }
  }

  for (let r = rows - 16; r < rows - 8; r += 1) {
    for (let c = 6; c < cols - 6; c += 6) {
      paint(r, c, green);
      paint(r + 1, c + 1, green);
      paint(r + 2, c + 2, green);
    }
  }

  return grid;
};
