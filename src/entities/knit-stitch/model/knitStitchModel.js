// 대바늘 기법 기호 라이브러리(JIS/한국 차트 표기 기준). 순수 함수만 둔다.
// consumes: 아랫단에서 가져오는 코 수, produces: 이 단에 만들어지는 코 수.
// span: 차지하는 칸 수(교차뜨기만 2 이상).

export const KNIT_STITCH_CATEGORIES = [
  { id: 'basic', label: '기본' },
  { id: 'dec', label: '줄이기' },
  { id: 'inc', label: '늘리기' },
  { id: 'twist', label: '돌려뜨기·기타' },
  { id: 'cable', label: '교차뜨기' }
];

export const KNIT_STITCHES = [
  { id: 'k', name: '겉뜨기', short: '겉', category: 'basic', consumes: 1, produces: 1, span: 1, ws: 'p' },
  { id: 'p', name: '안뜨기', short: '안', category: 'basic', consumes: 1, produces: 1, span: 1, ws: 'k' },
  { id: 'sl', name: '걸러뜨기', short: '걸러', category: 'basic', consumes: 1, produces: 1, span: 1 },
  { id: 'ns', name: '무코', short: '무코', category: 'basic', consumes: 0, produces: 0, span: 1 },
  { id: 'k2tog', name: '왼코 겹치기', short: '왼코겹', category: 'dec', consumes: 2, produces: 1, span: 1 },
  { id: 'ssk', name: '오른코 겹치기', short: '오른코겹', category: 'dec', consumes: 2, produces: 1, span: 1 },
  { id: 'p2tog', name: '안뜨기 왼코 겹치기', short: '안왼코겹', category: 'dec', consumes: 2, produces: 1, span: 1 },
  { id: 'cdd', name: '중심 3코 모아뜨기', short: '중심3모아', category: 'dec', consumes: 3, produces: 1, span: 1 },
  { id: 'k3tog', name: '왼코 3코 모아뜨기', short: '왼3모아', category: 'dec', consumes: 3, produces: 1, span: 1 },
  { id: 'sk2p', name: '오른코 3코 모아뜨기', short: '오른3모아', category: 'dec', consumes: 3, produces: 1, span: 1 },
  { id: 'yo', name: '걸기코', short: '걸기', category: 'inc', consumes: 0, produces: 1, span: 1 },
  { id: 'm1l', name: '왼코 늘리기', short: '왼늘', category: 'inc', consumes: 0, produces: 1, span: 1 },
  { id: 'm1r', name: '오른코 늘리기', short: '오른늘', category: 'inc', consumes: 0, produces: 1, span: 1 },
  { id: 'ktbl', name: '돌려뜨기', short: '돌려', category: 'twist', consumes: 1, produces: 1, span: 1, ws: 'ptbl' },
  { id: 'ptbl', name: '돌려 안뜨기', short: '돌려안', category: 'twist', consumes: 1, produces: 1, span: 1, ws: 'ktbl' },
  { id: 'bobble', name: '방울뜨기', short: '방울', category: 'twist', consumes: 1, produces: 1, span: 1 },
  { id: 'c1-1r', name: '1×1 오른코 교차뜨기', short: '1×1오른교차', category: 'cable', consumes: 2, produces: 2, span: 2 },
  { id: 'c1-1l', name: '1×1 왼코 교차뜨기', short: '1×1왼교차', category: 'cable', consumes: 2, produces: 2, span: 2 },
  { id: 'c2-2r', name: '2×2 오른코 교차뜨기', short: '2×2오른교차', category: 'cable', consumes: 4, produces: 4, span: 4 },
  { id: 'c2-2l', name: '2×2 왼코 교차뜨기', short: '2×2왼교차', category: 'cable', consumes: 4, produces: 4, span: 4 },
  { id: 'c3-3r', name: '3×3 오른코 교차뜨기', short: '3×3오른교차', category: 'cable', consumes: 6, produces: 6, span: 6 },
  { id: 'c3-3l', name: '3×3 왼코 교차뜨기', short: '3×3왼교차', category: 'cable', consumes: 6, produces: 6, span: 6 }
];

const STITCH_MAP = new Map(KNIT_STITCHES.map((stitch) => [stitch.id, stitch]));

// 기호가 없는 칸('')은 겉뜨기로 취급한다(차트의 빈 칸 = 겉뜨기 관례).
export const getKnitStitch = (id) => STITCH_MAP.get(id || 'k') ?? STITCH_MAP.get('k');

// 교차뜨기의 1번째 칸 이외(stitchPart > 0)는 첫 칸에 포함된다.
const isLeadCell = (cell) => !(cell?.stitchPart > 0);

/**
 * 한 칸 기호를 그리는 선 목록. viewBox = 0 0 (100*span) 100.
 * { d, fill } — fill이 true면 채우기, 아니면 선(stroke)으로 그린다.
 */
export const getStitchGlyph = (id) => {
  const stitch = getKnitStitch(id);
  const line = (d) => ({ d });
  switch (stitch.id) {
    case 'k':
      return [line('M50 18 V82')];
    case 'p':
      return [line('M18 50 H82')];
    case 'sl':
      return [line('M28 22 L50 80 L72 22')];
    case 'ns':
      return [];
    case 'k2tog': // 人: 왼쪽 코가 위
      return [line('M52 16 L22 84'), line('M40 44 L78 84')];
    case 'ssk': // 入: 오른쪽 코가 위
      return [line('M48 16 L78 84'), line('M60 44 L22 84')];
    case 'p2tog':
      return [line('M24 14 H76'), line('M52 28 L24 86'), line('M42 52 L76 86')];
    case 'cdd':
      return [line('M50 16 V84'), line('M50 16 L20 84'), line('M50 16 L80 84')];
    case 'k3tog':
      return [line('M54 16 L20 84'), line('M42 42 L56 84'), line('M33 62 L84 84')];
    case 'sk2p':
      return [line('M46 16 L80 84'), line('M58 42 L44 84'), line('M67 62 L16 84')];
    case 'yo':
      return [line('M24 50 A26 26 0 1 0 76 50 A26 26 0 1 0 24 50 Z')];
    case 'm1l':
      return [line('M56 16 V84'), line('M56 58 L26 32')];
    case 'm1r':
      return [line('M44 16 V84'), line('M44 58 L74 32')];
    case 'ktbl':
      return [line('M36 84 C36 52 64 50 64 32 C64 16 36 16 36 32 C36 50 64 52 64 84')];
    case 'ptbl':
      return [line('M22 12 H78'), line('M38 86 C38 58 62 56 62 40 C62 26 38 26 38 40 C38 56 62 58 62 86')];
    case 'bobble':
      return [{ d: 'M50 20 C74 20 76 80 50 80 C24 80 26 20 50 20 Z', fill: true }];
    default:
      return getCableGlyph(stitch);
  }
};

// 교차뜨기: 한쪽 묶음이 다른 묶음 위로 지나간다. 오른코 교차 = 오른쪽 묶음이 위.
const getCableGlyph = (stitch) => {
  const half = stitch.span / 2;
  const rightOnTop = stitch.id.endsWith('r');
  // 아래·위는 세로로 곧게, 가운데는 S자로 건너간다.
  const strand = (fromIndex, toIndex) => {
    const x0 = fromIndex * 100 + 50;
    const x1 = toIndex * 100 + 50;
    return `M${x0} 90 V76 C${x0} 50 ${x1} 50 ${x1} 24 V10`;
  };
  const leftGroup = [];
  const rightGroup = [];
  for (let i = 0; i < half; i += 1) {
    leftGroup.push(strand(i, i + half));
    rightGroup.push(strand(i + half, i));
  }
  const under = rightOnTop ? leftGroup : rightGroup;
  const over = rightOnTop ? rightGroup : leftGroup;
  // 위로 지나가는 선은 흰 테두리(halo)로 아래 선을 끊어 보이게 한다.
  return [
    ...under.map((d) => ({ d })),
    ...over.map((d) => ({ d, halo: true })),
    ...over.map((d) => ({ d }))
  ];
};

/** 칸 하나에 기호를 놓는다. 교차뜨기처럼 여러 칸짜리는 오른쪽으로 이어 붙이고, 걸쳐 있던 기존 교차뜨기는 정리한다. */
export const placeKnitStitch = (grid, row, col, stitchId) => {
  const stitch = getKnitStitch(stitchId);
  const rowCells = grid[row];
  if (!rowCells) return grid;
  const cols = rowCells.length;
  const start = Math.max(0, Math.min(col, cols - stitch.span));
  if (cols < stitch.span) return grid;

  const next = grid.map((cells, index) => (index === row ? cells.map((cell) => ({ ...cell })) : cells));
  const cells = next[row];
  clearSpans(cells, start, start + stitch.span - 1);
  for (let offset = 0; offset < stitch.span; offset += 1) {
    const cell = cells[start + offset];
    cell.stitch = stitch.id;
    if (stitch.span > 1) cell.stitchPart = offset;
    else delete cell.stitchPart;
  }
  return next;
};

// [from, to] 구간에 걸친 여러 칸 기호를 통째로 겉뜨기로 되돌린다(구간을 넘어선 부분 포함).
const clearSpans = (cells, from, to) => {
  for (let c = from; c <= to; c += 1) {
    const cell = cells[c];
    const stitch = getKnitStitch(cell.stitch);
    if (stitch.span <= 1) continue;
    const lead = c - (cell.stitchPart || 0);
    for (let k = lead; k < lead + stitch.span && k < cells.length; k += 1) {
      cells[k].stitch = '';
      delete cells[k].stitchPart;
    }
  }
};

/** 선택 영역의 각 칸 기호를 지운다(겉뜨기로). */
export const clearKnitStitches = (grid, selection) =>
  mapSelectionRows(grid, selection, (cells, c0, c1) => {
    clearSpans(cells, c0, c1);
    for (let c = c0; c <= c1; c += 1) {
      cells[c].stitch = '';
      delete cells[c].stitchPart;
    }
  });

const normalizeSelection = ({ r0, c0, r1, c1 }) => ({
  r0: Math.min(r0, r1),
  r1: Math.max(r0, r1),
  c0: Math.min(c0, c1),
  c1: Math.max(c0, c1)
});

const mapSelectionRows = (grid, selection, mutate) => {
  const { r0, r1, c0, c1 } = normalizeSelection(selection);
  return grid.map((cells, row) => {
    if (row < r0 || row > r1) return cells;
    const copy = cells.map((cell) => ({ ...cell }));
    mutate(copy, c0, Math.min(c1, copy.length - 1), row);
    return copy;
  });
};

/** 선택 영역의 각 행에 기호 순서(sequence)를 반복해서 채운다. 예: 고무뜨기 ['k','p']. */
export const fillKnitSequence = (grid, selection, sequence, { rowShift = 0 } = {}) =>
  mapSelectionRows(grid, selection, (cells, c0, c1, row) => {
    clearSpans(cells, c0, c1);
    const rowOffset = rowShift ? (row * rowShift) % sequence.length : 0;
    for (let c = c0; c <= c1; c += 1) {
      cells[c].stitch = sequence[(c - c0 + rowOffset) % sequence.length];
      delete cells[c].stitchPart;
    }
  });

/** 선택 영역의 겉뜨기↔안뜨기(돌려뜨기 포함)를 뒤집는다. */
export const invertKnitStitches = (grid, selection) =>
  mapSelectionRows(grid, selection, (cells, c0, c1) => {
    for (let c = c0; c <= c1; c += 1) {
      const stitch = getKnitStitch(cells[c].stitch);
      if (stitch.ws) cells[c].stitch = stitch.ws;
    }
  });

/**
 * 선택한 가로 칸 수/모양에 맞는 "뜨개 이해" 변환 목록.
 * 각 항목: { id, label, hint, cells: [stitchId...] } — 선택 칸에 왼쪽부터 그대로 놓는다.
 */
export const getKnitSelectionActions = (selection) => {
  const { r0, r1, c0, c1 } = normalizeSelection(selection);
  const width = c1 - c0 + 1;
  const singleRow = r0 === r1;
  const actions = [];
  if (singleRow && width === 2) {
    actions.push(
      { id: 'k2tog', label: '왼코 겹치기로 (2→1)', hint: '무코 1칸이 생깁니다', cells: ['k2tog', 'ns'] },
      { id: 'ssk', label: '오른코 겹치기로 (2→1)', hint: '무코 1칸이 생깁니다', cells: ['ns', 'ssk'] },
      { id: 'p2tog', label: '안뜨기 왼코 겹치기로 (2→1)', hint: '무코 1칸이 생깁니다', cells: ['p2tog', 'ns'] },
      { id: 'eyelet-r', label: '구멍무늬: 걸기 + 왼코 겹치기', hint: '코 수 유지', cells: ['yo', 'k2tog'] },
      { id: 'eyelet-l', label: '구멍무늬: 오른코 겹치기 + 걸기', hint: '코 수 유지', cells: ['ssk', 'yo'] },
      { id: 'c1-1r', label: '1×1 오른코 교차뜨기', hint: '코 수 유지', cells: ['c1-1r'] },
      { id: 'c1-1l', label: '1×1 왼코 교차뜨기', hint: '코 수 유지', cells: ['c1-1l'] }
    );
  }
  if (singleRow && width === 3) {
    actions.push(
      { id: 'cdd', label: '중심 3코 모아뜨기로 (3→1)', hint: '무코 2칸이 생깁니다', cells: ['ns', 'cdd', 'ns'] },
      { id: 'k3tog', label: '왼코 3코 모아뜨기로 (3→1)', hint: '무코 2칸이 생깁니다', cells: ['k3tog', 'ns', 'ns'] },
      { id: 'sk2p', label: '오른코 3코 모아뜨기로 (3→1)', hint: '무코 2칸이 생깁니다', cells: ['ns', 'ns', 'sk2p'] },
      { id: 'lace-3', label: '구멍무늬: 걸기 + 중심 3코 모아뜨기 + 걸기', hint: '코 수 유지', cells: ['yo', 'cdd', 'yo'] }
    );
  }
  if (singleRow && width === 4) {
    actions.push(
      { id: 'c2-2r', label: '2×2 오른코 교차뜨기', hint: '코 수 유지', cells: ['c2-2r'] },
      { id: 'c2-2l', label: '2×2 왼코 교차뜨기', hint: '코 수 유지', cells: ['c2-2l'] }
    );
  }
  if (singleRow && width === 6) {
    actions.push(
      { id: 'c3-3r', label: '3×3 오른코 교차뜨기', hint: '코 수 유지', cells: ['c3-3r'] },
      { id: 'c3-3l', label: '3×3 왼코 교차뜨기', hint: '코 수 유지', cells: ['c3-3l'] }
    );
  }
  return actions;
};

// 선택 영역 채우기 무늬(여러 행에도 적용).
export const KNIT_FILL_PATTERNS = [
  { id: 'rib1', label: '1코 고무뜨기 (겉1 안1)', sequence: ['k', 'p'] },
  { id: 'rib2', label: '2코 고무뜨기 (겉2 안2)', sequence: ['k', 'k', 'p', 'p'] },
  { id: 'seed', label: '멍석뜨기', sequence: ['k', 'p'], rowShift: 1 },
  { id: 'garter', label: '전체 안뜨기', sequence: ['p'] },
  { id: 'stockinette', label: '전체 겉뜨기', sequence: ['k'] }
];

/** 변환 항목(action.cells)을 선택 행의 왼쪽 끝부터 놓는다. */
export const applyKnitSelectionAction = (grid, selection, action) => {
  const { r0, c0 } = normalizeSelection(selection);
  let next = grid;
  let col = c0;
  action.cells.forEach((id) => {
    next = placeKnitStitch(next, r0, col, id);
    col += getKnitStitch(id).span;
  });
  return next;
};

/**
 * 단별 코 수 검사. 아랫단이 만든 코 수(produces)와 윗단이 가져가는 코 수(consumes)가 같아야 한다.
 * 격자 행 0이 맨 위, 마지막 행이 첫 단(뜨기 시작)이다.
 * @returns {{ row, consumes, produces, expected, ok }[]} 격자 행 인덱스 순서
 */
export const analyzeKnitRows = (grid) => {
  const totals = grid.map((cells) => {
    let consumes = 0;
    let produces = 0;
    cells.forEach((cell) => {
      if (!isLeadCell(cell)) return;
      const stitch = getKnitStitch(cell.stitch);
      consumes += stitch.consumes;
      produces += stitch.produces;
    });
    return { consumes, produces };
  });
  return totals.map((total, row) => {
    const below = totals[row + 1];
    const expected = below ? below.produces : total.consumes;
    return { row, ...total, expected, ok: total.consumes === expected };
  });
};

export const hasKnitStitches = (grid) =>
  grid.some((cells) => cells.some((cell) => cell.stitch && cell.stitch !== 'k'));

// 같은 토큰 묶음 → "겉 3" / 반복 단위 → "[겉 2, 안 2] ×6".
const compressTokens = (tokens) => {
  const runs = [];
  tokens.forEach((token) => {
    const last = runs[runs.length - 1];
    if (last && last.token === token) last.count += 1;
    else runs.push({ token, count: 1 });
  });
  const formatRun = ({ token, count }) => (count > 1 ? `${token} ${count}` : token);
  // 전체가 같은 단위의 반복이면 묶어서 표기
  for (let size = 1; size <= runs.length / 2; size += 1) {
    if (runs.length % size !== 0 || size === runs.length) continue;
    const unit = runs.slice(0, size);
    const repeats = runs.length / size;
    const matches = runs.every((run, index) => {
      const ref = unit[index % size];
      return ref.token === run.token && ref.count === run.count;
    });
    if (matches && size > 1) return `[${unit.map(formatRun).join(', ')}] ×${repeats}`;
  }
  return runs.map(formatRun).join(', ');
};

/**
 * 대바늘 서술도안. 평면뜨기의 안면 단은 왼→오른쪽으로 읽고 겉↔안을 뒤집어 적는다.
 * @returns {string[]}
 */
export const buildKnitWrittenLines = ({
  grid,
  rows,
  rowDirection = 'bottom-up',
  numberStart = 1,
  knitMode = 'flat',
  startDirection = 'rtl'
}) => {
  if (!grid?.length) return [];
  const rowNumberOf = (rowIndex) =>
    rowDirection === 'bottom-up' ? rows - rowIndex - 1 + numberStart : rowIndex + numberStart;
  const order = grid.map((_, index) => index).sort((a, b) => rowNumberOf(a) - rowNumberOf(b));
  const analysis = analyzeKnitRows(grid);
  const startLtr = startDirection === 'ltr';

  return order.map((rowIndex, sequence) => {
    const wrongSide = knitMode === 'flat' && sequence % 2 === 1;
    const ltr = startLtr !== wrongSide;
    const cells = grid[rowIndex];
    const leads = cells
      .map((cell, col) => ({ cell, col }))
      .filter(({ cell }) => isLeadCell(cell));
    if (ltr) leads.sort((a, b) => a.col - b.col);
    else leads.sort((a, b) => b.col - a.col);
    const tokens = leads
      .map(({ cell }) => {
        let stitch = getKnitStitch(cell.stitch);
        if (stitch.id === 'ns') return null;
        if (wrongSide && stitch.ws) stitch = getKnitStitch(stitch.ws);
        return stitch.short;
      })
      .filter(Boolean);
    const { produces } = analysis[rowIndex];
    const side = knitMode === 'flat' ? (wrongSide ? '안면' : '겉면') : '';
    const arrow = ltr ? '→' : '←';
    const label = [side, arrow].filter(Boolean).join(' ');
    return `${rowNumberOf(rowIndex)}단 (${label}): ${compressTokens(tokens) || '-'} (${produces}코)`;
  });
};

/**
 * 진행 모드용: 한 단을 뜨는 순서(orderedCols)대로 기법을 묶는다.
 * 안면 단(wrongSide)은 서술도안과 같이 겉↔안을 바꿔 보여주고, 교차뜨기는 칸 수와 상관없이 1묶음이다.
 * @returns {{ id, label, count, startOrdinal, endOrdinal }[]} ordinal은 칸 순번(1부터)
 */
export const buildKnitProgressRuns = (rowCells, orderedCols, { wrongSide = false } = {}) => {
  const runs = [];
  orderedCols.forEach((col, index) => {
    const cell = rowCells[col];
    let stitch = getKnitStitch(cell?.stitch);
    if (wrongSide && stitch.ws) stitch = getKnitStitch(stitch.ws);
    const key = stitch.span > 1 ? `${stitch.id}@${col - (cell?.stitchPart || 0)}` : stitch.id;
    const last = runs[runs.length - 1];
    if (last && last.key === key) {
      if (stitch.span === 1) last.count += 1;
      last.endOrdinal = index + 1;
      return;
    }
    runs.push({ key, id: stitch.id, label: stitch.short, count: 1, startOrdinal: index + 1, endOrdinal: index + 1 });
  });
  return runs.map(({ key, ...rest }) => rest);
};
