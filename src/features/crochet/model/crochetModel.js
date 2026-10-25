// 코바늘 기호도안 차트 모델 — 순수 함수만 (React/DOM 없음)
// chart = { stitches: Stitch[], rounds: Round[], groups: Group[] }
// stitch = { id, type, x, y, rotation, roundId, role? }  role: 'standing'(기둥코) | 'join'(단 끝 빼뜨기)
// round  = { id, name, color, visible }
// group  = { id, kind: 'dec'|'inc', stitchIds }

import { directionFromRotation, getStitchCenter, getStitchType, getStitchWorldBounds, STITCH_TYPES } from './crochetSymbols.js';

export const GRID_SIZE = 10;
export const ROUND_COLORS = ['#3b5bdb', '#e5484d', '#2e9e5b', '#c2820c', '#8e4ec6', '#0e8a96', '#d6409f', '#495057'];

let idCounter = 0;
const idSeed = Math.random().toString(36).slice(2, 6);
export const createId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idSeed}${Date.now().toString(36)}${idCounter.toString(36)}`;
};

export const roundColorAt = (index) => ROUND_COLORS[((index % ROUND_COLORS.length) + ROUND_COLORS.length) % ROUND_COLORS.length];

export const createRound = (index, overrides = {}) => ({
  id: createId('rd'),
  name: `단 ${index + 1}`,
  color: roundColorAt(index),
  visible: true,
  ...overrides
});

export const createEmptyChart = () => ({ stitches: [], rounds: [createRound(0)], groups: [] });

/** 저장된 데이터를 안전한 차트로 정리 */
export const normalizeChart = (data) => {
  const rounds = Array.isArray(data?.rounds) && data.rounds.length
    ? data.rounds.map((r, i) => ({ id: r.id || createId('rd'), name: r.name || `단 ${i + 1}`, color: r.color || roundColorAt(i), visible: r.visible !== false }))
    : [createRound(0)];
  const roundIds = new Set(rounds.map((r) => r.id));
  const stitches = (Array.isArray(data?.stitches) ? data.stitches : [])
    .filter((s) => s && STITCH_TYPES[s.type])
    .map((s) => ({
      id: s.id || createId('st'),
      type: s.type,
      x: Number(s.x) || 0,
      y: Number(s.y) || 0,
      rotation: Number(s.rotation) || 0,
      roundId: roundIds.has(s.roundId) ? s.roundId : rounds[0].id,
      ...(s.role ? { role: s.role } : {})
    }));
  const chart = { stitches, rounds, groups: Array.isArray(data?.groups) ? data.groups : [] };
  return cleanGroups(chart);
};

export const snapPoint = (point, grid = GRID_SIZE) => ({
  x: Math.round(point.x / grid) * grid,
  y: Math.round(point.y / grid) * grid
});

export const normalizeAngle = (deg) => {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
};

const round2 = (value) => Math.round(value * 100) / 100;

// ── 그룹 정리 ────────────────────────────────────────────────

/** 없는 코를 가리키거나 조건을 잃은 묶음을 제거 */
export const cleanGroups = (chart) => {
  const byId = new Map(chart.stitches.map((s) => [s.id, s]));
  const used = new Set();
  const groups = [];
  chart.groups.forEach((g) => {
    const ids = (g.stitchIds || []).filter((id) => byId.has(id) && !used.has(id));
    if (ids.length < 2) return;
    const type = byId.get(ids[0]).type;
    if (!getStitchType(type).groupable || ids.some((id) => byId.get(id).type !== type)) return;
    ids.forEach((id) => used.add(id));
    groups.push({ ...g, stitchIds: ids });
  });
  return { ...chart, groups };
};

export const getGroupOf = (chart, stitchId) => chart.groups.find((g) => g.stitchIds.includes(stitchId)) ?? null;

/** 묶음 생성 가능 여부 — 불가하면 한국어 사유 문자열, 가능하면 null */
export const validateGroup = (chart, ids) => {
  const unique = [...new Set(ids)];
  if (unique.length < 2) return '2코 이상 선택해야 합니다.';
  if (unique.length > 5) return '최대 5코까지 묶을 수 있습니다.';
  const byId = new Map(chart.stitches.map((s) => [s.id, s]));
  const members = unique.map((id) => byId.get(id));
  if (members.some((s) => !s)) return '선택한 코를 찾을 수 없습니다.';
  const type = members[0].type;
  if (members.some((s) => s.type !== type)) return '같은 기호끼리만 묶을 수 있습니다.';
  if (!getStitchType(type).groupable) return `${getStitchType(type).label}는 모아뜨기/늘려뜨기로 묶을 수 없습니다.`;
  return null;
};

/** 선택한 코를 모아뜨기(dec)/늘려뜨기(inc)로 묶는다 */
export const createGroup = (chart, ids, kind) => {
  const error = validateGroup(chart, ids);
  if (error) return { ok: false, error, chart };
  const unique = [...new Set(ids)];
  // 배치 순서대로 정렬해 두면 서술도안 순서가 안정적이다
  const order = new Map(chart.stitches.map((s, i) => [s.id, i]));
  unique.sort((a, b) => order.get(a) - order.get(b));
  const stripped = chart.groups
    .map((g) => ({ ...g, stitchIds: g.stitchIds.filter((id) => !unique.includes(id)) }))
    .filter((g) => g.stitchIds.length >= 2);
  const group = { id: createId('gp'), kind: kind === 'inc' ? 'inc' : 'dec', stitchIds: unique };
  return { ok: true, error: null, chart: { ...chart, groups: [...stripped, group] }, group };
};

export const ungroupStitches = (chart, ids) => {
  const set = new Set(ids);
  return { ...chart, groups: chart.groups.filter((g) => !g.stitchIds.some((id) => set.has(id))) };
};

// ── 코 편집 ─────────────────────────────────────────────────

export const makeStitch = (type, x, y, rotation, roundId, extra = {}) => ({
  id: createId('st'),
  type,
  x: round2(x),
  y: round2(y),
  rotation: round2(normalizeAngle(rotation || 0)),
  roundId,
  ...extra
});

export const addStitches = (chart, stitches) => ({ ...chart, stitches: [...chart.stitches, ...stitches] });

export const moveStitches = (chart, ids, dx, dy) => {
  const set = new Set(ids);
  return {
    ...chart,
    stitches: chart.stitches.map((s) => (set.has(s.id) ? { ...s, x: round2(s.x + dx), y: round2(s.y + dy) } : s))
  };
};

export const deleteStitches = (chart, ids) => {
  const set = new Set(ids);
  return cleanGroups({ ...chart, stitches: chart.stitches.filter((s) => !set.has(s.id)) });
};

export const selectionPivot = (stitches) => {
  if (!stitches.length) return { x: 0, y: 0 };
  return {
    x: stitches.reduce((sum, s) => sum + s.x, 0) / stitches.length,
    y: stitches.reduce((sum, s) => sum + s.y, 0) / stitches.length
  };
};

/** 선택 영역을 중심 기준으로 회전 (위치 + 기호 방향) */
export const rotateStitches = (chart, ids, deg, pivot = null) => {
  const set = new Set(ids);
  const targets = chart.stitches.filter((s) => set.has(s.id));
  const c = pivot ?? selectionPivot(targets);
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    ...chart,
    stitches: chart.stitches.map((s) => {
      if (!set.has(s.id)) return s;
      const dx = s.x - c.x;
      const dy = s.y - c.y;
      return {
        ...s,
        x: round2(c.x + dx * cos - dy * sin),
        y: round2(c.y + dx * sin + dy * cos),
        rotation: round2(normalizeAngle((s.rotation || 0) + deg))
      };
    })
  };
};

/** 방사 정렬: 선택 영역 중심에서 바깥을 향하도록 각 코의 방향을 맞춘다 */
export const alignRadial = (chart, ids, center = null) => {
  const set = new Set(ids);
  const targets = chart.stitches.filter((s) => set.has(s.id));
  if (targets.length < 2 && !center) return chart;
  const c = center ?? selectionPivot(targets);
  return {
    ...chart,
    stitches: chart.stitches.map((s) => {
      if (!set.has(s.id)) return s;
      const dx = s.x - c.x;
      const dy = s.y - c.y;
      if (Math.hypot(dx, dy) < 0.5) return s;
      return { ...s, rotation: round2(normalizeAngle((Math.atan2(dx, -dy) * 180) / Math.PI)) };
    })
  };
};

/** 방향 초기화 (모두 위쪽) */
export const resetRotation = (chart, ids) => {
  const set = new Set(ids);
  return { ...chart, stitches: chart.stitches.map((s) => (set.has(s.id) ? { ...s, rotation: 0 } : s)) };
};

/** 정렬: 'left'|'right'|'top'|'bottom'|'centerX'|'centerY' (밑동 기준) */
export const alignStitches = (chart, ids, mode) => {
  const set = new Set(ids);
  const targets = chart.stitches.filter((s) => set.has(s.id));
  if (targets.length < 2) return chart;
  const xs = targets.map((s) => s.x);
  const ys = targets.map((s) => s.y);
  const value = {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
    centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
    centerY: (Math.min(...ys) + Math.max(...ys)) / 2
  }[mode];
  const axis = mode === 'left' || mode === 'right' || mode === 'centerX' ? 'x' : 'y';
  return { ...chart, stitches: chart.stitches.map((s) => (set.has(s.id) ? { ...s, [axis]: round2(value) } : s)) };
};

/** 고르게 분포: 'x' | 'y' 축으로 처음·끝 사이를 같은 간격으로 */
export const distributeStitches = (chart, ids, axis) => {
  const set = new Set(ids);
  const targets = chart.stitches.filter((s) => set.has(s.id)).sort((a, b) => a[axis] - b[axis]);
  if (targets.length < 3) return chart;
  const first = targets[0][axis];
  const step = (targets[targets.length - 1][axis] - first) / (targets.length - 1);
  const next = new Map(targets.map((s, i) => [s.id, round2(first + step * i)]));
  return { ...chart, stitches: chart.stitches.map((s) => (next.has(s.id) ? { ...s, [axis]: next.get(s.id) } : s)) };
};

/** 기호 바꾸기 — 위치는 유지, 조건을 잃은 묶음은 해제 */
export const changeStitchType = (chart, ids, type) => {
  if (!STITCH_TYPES[type]) return chart;
  const set = new Set(ids);
  return cleanGroups({ ...chart, stitches: chart.stitches.map((s) => (set.has(s.id) ? { ...s, type } : s)) });
};

export const assignRound = (chart, ids, roundId) => {
  if (!chart.rounds.some((r) => r.id === roundId)) return chart;
  const set = new Set(ids);
  return { ...chart, stitches: chart.stitches.map((s) => (set.has(s.id) ? { ...s, roundId } : s)) };
};

/** 코 묶음을 복사본으로 만든다 (선택 안에 온전히 포함된 묶음도 함께 복사) */
export const cloneStitchSet = (stitches, groups, dx, dy, roundResolver = (id) => id) => {
  const idMap = new Map();
  const clones = stitches.map((s) => {
    const copy = { ...s, id: createId('st'), x: round2(s.x + dx), y: round2(s.y + dy), roundId: roundResolver(s.roundId) };
    idMap.set(s.id, copy.id);
    return copy;
  });
  const clonedGroups = groups
    .filter((g) => g.stitchIds.every((id) => idMap.has(id)))
    .map((g) => ({ ...g, id: createId('gp'), stitchIds: g.stitchIds.map((id) => idMap.get(id)) }));
  return { stitches: clones, groups: clonedGroups };
};

export const duplicateStitches = (chart, ids, dx = GRID_SIZE * 2, dy = GRID_SIZE * 2) => {
  const set = new Set(ids);
  const source = chart.stitches.filter((s) => set.has(s.id));
  const { stitches, groups } = cloneStitchSet(source, chart.groups, dx, dy);
  return {
    chart: { ...chart, stitches: [...chart.stitches, ...stitches], groups: [...chart.groups, ...groups] },
    newIds: stitches.map((s) => s.id)
  };
};

/** 범위(사각형) 안에 시각적 중심이 들어오는 코 id */
export const stitchesInRect = (stitches, rect) => {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  return stitches
    .filter((s) => {
      const c = getStitchCenter(s);
      return c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY;
    })
    .map((s) => s.id);
};

export const getChartBounds = (stitches) => {
  if (!stitches.length) return null;
  const boxes = stitches.map(getStitchWorldBounds);
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxX: Math.max(...boxes.map((b) => b.maxX)),
    maxY: Math.max(...boxes.map((b) => b.maxY))
  };
};

// ── 단(레이어) ──────────────────────────────────────────────

export const addRound = (chart, overrides = {}) => {
  const round = createRound(chart.rounds.length, overrides);
  return { chart: { ...chart, rounds: [...chart.rounds, round] }, round };
};

export const updateRound = (chart, roundId, patch) => ({
  ...chart,
  rounds: chart.rounds.map((r) => (r.id === roundId ? { ...r, ...patch } : r))
});

/** 단 삭제 — 그 단의 코도 함께 삭제. 마지막 한 단은 지우지 않는다. */
export const deleteRound = (chart, roundId) => {
  if (chart.rounds.length <= 1) return chart;
  const removed = chart.stitches.filter((s) => s.roundId === roundId).map((s) => s.id);
  const next = deleteStitches(chart, removed);
  return { ...next, rounds: next.rounds.filter((r) => r.id !== roundId) };
};

export const moveRound = (chart, roundId, delta) => {
  const index = chart.rounds.findIndex((r) => r.id === roundId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= chart.rounds.length) return chart;
  const rounds = [...chart.rounds];
  [rounds[index], rounds[target]] = [rounds[target], rounds[index]];
  return { ...chart, rounds };
};

export const countRoundStitches = (chart) => {
  const counts = new Map(chart.rounds.map((r) => [r.id, 0]));
  chart.stitches.forEach((s) => counts.set(s.roundId, (counts.get(s.roundId) ?? 0) + 1));
  return counts;
};

// ── 줄 배치 ─────────────────────────────────────────────────

/**
 * A→B 선을 따라 기호 폭 간격으로 코를 고르게 배치한다.
 * 개수 = round(길이 / 기호 폭) + 1, 기호는 선에 수직(왼→오 드래그면 똑바로 선다).
 */
export const layoutAlongLine = (type, a, b) => {
  const spec = getStitchType(type);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const spacing = Math.max(spec.width, 6);
  const count = Math.max(1, Math.round(length / spacing) + 1);
  const rotation = length < 0.5 ? 0 : (Math.atan2(dy, dx) * 180) / Math.PI;
  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    positions.push({ x: round2(a.x + dx * t), y: round2(a.y + dy * t), rotation: round2(normalizeAngle(rotation)) });
  }
  return { count, rotation: normalizeAngle(rotation), positions };
};

// ── 원형(방사) 생성기 ───────────────────────────────────────

/** 매 단 n코씩 늘리는 단 목록 (예: 6 → 12 → 18 …) */
export const buildIncreaseRounds = ({ start = 6, increase = 6, roundCount = 5, type = 'sc' } = {}) =>
  Array.from({ length: Math.max(1, roundCount) }, (_, i) => ({ count: start + increase * i, type }));

/** 앞 단 m코 → 이번 단 n코의 구성 단위 목록 ('single' | 'inc' | 'dec') */
export const planRoundUnits = (prevCount, count) => {
  if (!prevCount || count === prevCount || count > prevCount * 2 || count * 2 < prevCount) {
    return Array.from({ length: count }, () => 'single');
  }
  if (count > prevCount) {
    // 앞 단 m개 자리 중 inc개 자리에 늘려뜨기 — [짧은뜨기 k, 늘려뜨기 1] 순서가 되도록 뒤쪽에 배치
    const inc = count - prevCount;
    return Array.from({ length: prevCount }, (_, j) => (Math.floor(((j + 1) * inc) / prevCount) > Math.floor((j * inc) / prevCount) ? 'inc' : 'single'));
  }
  const dec = prevCount - count;
  return Array.from({ length: count }, (_, j) => (Math.floor(((j + 1) * dec) / count) > Math.floor((j * dec) / count) ? 'dec' : 'single'));
};

const STANDING_CHAINS = { sc: 1, hdc: 2, dc: 3, tr: 4, dtr: 5, bobble: 3, popcorn: 3, fpdc: 3, bpdc: 3, ch: 0, slip: 0 };

/**
 * 원형 도안 생성. 각 코는 중심에서 바깥을 향하고(반시계 방향 진행), 단마다 새 레이어를 만든다.
 * @param {{center:{x,y}, magicRing?:boolean, rounds:Array<{count:number,type:string}>, startIndex?:number, standing?:boolean}} options
 * @returns {{stitches, rounds, groups}}
 */
export const generateRoundChart = ({ center = { x: 0, y: 0 }, magicRing = true, rounds = [], startIndex = 0, standing = false } = {}) => {
  const stitches = [];
  const groups = [];
  const layers = [];
  let radius = magicRing ? 14 : 10;
  let prevCount = 0;
  let prevHeight = 0;

  rounds.forEach((spec, k) => {
    const type = STITCH_TYPES[spec.type] ? spec.type : 'sc';
    const typeSpec = getStitchType(type);
    const count = Math.max(1, Math.round(spec.count));
    const layer = createRound(startIndex + k);
    layers.push(layer);

    if (k === 0 && magicRing) stitches.push(makeStitch('magic', center.x, center.y, 0, layer.id));

    const units = k === 0 ? Array.from({ length: count }, () => 'single') : planRoundUnits(prevCount, count);
    const symbolCount = units.reduce((sum, u) => sum + (u === 'single' ? 1 : 2), 0);
    if (k > 0) radius += prevHeight + 5;
    // 둘레가 기호 폭을 담을 수 있도록 반지름 보정
    radius = Math.max(radius, (symbolCount * typeSpec.width * 0.82) / (2 * Math.PI));

    const step = 360 / symbolCount;
    const place = (index) => {
      // 반시계 방향(기호도안을 읽는 방향)으로 진행, 첫 코는 위쪽에서 반 칸 지나서
      const theta = normalizeAngle(-(index + 0.5) * step);
      const rad = (theta * Math.PI) / 180;
      return makeStitch(type, center.x + radius * Math.sin(rad), center.y - radius * Math.cos(rad), theta, layer.id);
    };

    if (standing) {
      // 기둥코(사슬)를 시작점에 바깥 방향으로 쌓는다
      const chains = STANDING_CHAINS[type] ?? 1;
      const dir = directionFromRotation(0);
      for (let i = 0; i < chains; i += 1) {
        const r = radius + 8 + i * 13;
        // rotation 90이면 타원 중심이 +x로 4.5 밀리므로 보정
        stitches.push(makeStitch('ch', center.x + dir.x * r - 4.5, center.y + dir.y * r, 90, layer.id, { role: 'standing' }));
      }
    }

    let index = 0;
    units.forEach((unit) => {
      if (unit === 'single') {
        stitches.push(place(index));
        index += 1;
        return;
      }
      const pair = [place(index), place(index + 1)];
      index += 2;
      stitches.push(...pair);
      groups.push({ id: createId('gp'), kind: unit, stitchIds: pair.map((s) => s.id) });
    });

    if (standing) {
      // 단 끝 빼뜨기: 기둥코 꼭대기 옆
      const top = radius + typeSpec.height * 0.9;
      stitches.push(makeStitch('slip', center.x + 5, center.y - top, 0, layer.id, { role: 'join' }));
    }

    prevCount = count;
    prevHeight = typeSpec.height;
  });

  return { stitches, rounds: layers, groups };
};

/** 생성 결과를 차트에 합친다. 기존 단이 모두 비어 있으면 대체한다. */
export const mergeGeneratedChart = (chart, generated) => {
  const allEmpty = chart.stitches.length === 0;
  const base = allEmpty ? { ...chart, rounds: [] } : chart;
  return {
    ...base,
    stitches: [...base.stitches, ...generated.stitches],
    rounds: [...base.rounds, ...generated.rounds],
    groups: [...base.groups, ...generated.groups]
  };
};
