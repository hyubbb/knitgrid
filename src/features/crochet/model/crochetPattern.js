// 코바늘 서술도안 생성 — 차트 모델에서 단별 문장을 만든다 (순수 함수)
import { getStitchType } from './crochetSymbols.js';

const PREFIX_TYPES = new Set(['magic', 'start']);
const SUFFIX_TYPES = new Set(['end']);

/** 묶음 이름: 짧은뜨기 늘려뜨기 / 짧은뜨기 3코 늘려뜨기 / 한길 긴뜨기 2코 모아뜨기 */
export const groupLabel = (type, kind, size) => {
  const label = getStitchType(type).label;
  if (kind === 'inc') return size === 2 ? `${label} 늘려뜨기` : `${label} ${size}코 늘려뜨기`;
  return `${label} ${size}코 모아뜨기`;
};

/** 같은 이름이 이어지는 구간을 묶는다 */
export const runLength = (units) => {
  const runs = [];
  units.forEach((unit) => {
    const last = runs[runs.length - 1];
    if (last && last.name === unit.name) last.count += 1;
    else runs.push({ kind: 'run', name: unit.name, counts: unit.counts, count: 1 });
  });
  return runs;
};

const sameRun = (a, b) => a.name === b.name && a.count === b.count;

/** 반복 블록 탐지 (런 단위, 블록 길이 ≥ 2, 반복 ≥ 2) — 가장 많이 덮는 블록을 골라 좌우를 재귀 처리 */
export const compressRuns = (runs) => {
  if (runs.length < 4) return runs;
  let best = null;
  for (let period = 2; period <= Math.floor(runs.length / 2); period += 1) {
    for (let start = 0; start + period * 2 <= runs.length; start += 1) {
      let times = 1;
      while (start + period * (times + 1) <= runs.length) {
        let equal = true;
        for (let i = 0; i < period; i += 1) {
          if (!sameRun(runs[start + i], runs[start + period * times + i])) {
            equal = false;
            break;
          }
        }
        if (!equal) break;
        times += 1;
      }
      if (times >= 2) {
        const covered = period * times;
        if (!best || covered > best.covered) best = { start, period, times, covered };
      }
    }
  }
  if (!best) return runs;
  const { start, period, times } = best;
  return [
    ...compressRuns(runs.slice(0, start)),
    { kind: 'repeat', items: runs.slice(start, start + period), times },
    ...compressRuns(runs.slice(start + period * times))
  ];
};

/** 이름 배열이 주기 p로 완전히 반복되는 가장 작은 p (없으면 0) */
const smallestPeriod = (names) => {
  const n = names.length;
  for (let p = 1; p <= n / 2; p += 1) {
    if (n % p !== 0) continue;
    let ok = true;
    for (let i = p; i < n; i += 1) {
      if (names[i] !== names[i - p]) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return 0;
};

/**
 * 단위 배열 → 압축 구조. cyclic=true면(원형 단) 시작점을 돌려서라도 전체 반복을 찾는다.
 * @returns {Array<{kind:'run',name,count,counts}|{kind:'repeat',items,times}>}
 */
export const compressUnits = (units, { cyclic = false } = {}) => {
  if (!units.length) return [];
  const p = smallestPeriod(units.map((u) => u.name));
  if (!p) return compressRuns(runLength(units));
  const times = units.length / p;
  if (p === 1) return [{ kind: 'run', name: units[0].name, counts: units[0].counts, count: units.length }];
  // 원형 단은 시작점을 돌려 반복 단위의 런 수가 가장 적은 표현을 고른다 (예: [짧은뜨기 2, 늘려뜨기 1])
  let best = runLength(units.slice(0, p));
  if (cyclic) {
    for (let r = 1; r < p; r += 1) {
      const rotated = [...units.slice(r), ...units.slice(0, r)];
      const block = runLength(rotated.slice(0, p));
      if (block.length < best.length) best = block;
    }
  }
  return [{ kind: 'repeat', items: best, times }];
};

const formatInnerRun = (run) => `${run.name} ${run.count}`;

const formatTopRun = (run) => {
  if (run.count > 1) return `${run.name} ×${run.count}`;
  return run.counts ? `${run.name} 1` : run.name;
};

export const formatCompressed = (items) =>
  items
    .map((item) => (item.kind === 'repeat' ? `[${item.items.map(formatInnerRun).join(', ')}] ×${item.times}` : formatTopRun(item)))
    .join(', ');

/** 단 이름 '단 3' → '3단' */
export const roundLabel = (name) => {
  const match = /^단\s*(\d+)$/.exec(String(name || '').trim());
  return match ? `${match[1]}단` : String(name || '단');
};

const angleOf = (s, c) => {
  // 반시계 방향 각도(위=0) — 원형 기호도안 읽는 방향
  const a = (Math.atan2(-(s.x - c.x), -(s.y - c.y)) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
};

const isRadial = (stitches) => {
  if (stitches.length < 3) return false;
  const rots = stitches.map((s) => ((s.rotation || 0) * Math.PI) / 180);
  // 방향 벡터 평균 길이가 짧으면 여러 방향으로 퍼져 있음 = 원형
  const mx = rots.reduce((sum, r) => sum + Math.sin(r), 0) / rots.length;
  const my = rots.reduce((sum, r) => sum + Math.cos(r), 0) / rots.length;
  return Math.hypot(mx, my) < 0.6;
};

/** 한 단의 코를 뜨는 순서로 정렬 */
export const orderRoundStitches = (stitches) => {
  const indexed = stitches.map((s, i) => ({ s, i }));
  const prefix = indexed.filter(({ s }) => PREFIX_TYPES.has(s.type) || s.role === 'standing');
  const suffix = indexed.filter(({ s }) => SUFFIX_TYPES.has(s.type) || s.role === 'join');
  const body = indexed.filter((entry) => !prefix.includes(entry) && !suffix.includes(entry));
  const bodyStitches = body.map(({ s }) => s);
  const radial = isRadial(bodyStitches);
  if (radial) {
    const c = {
      x: bodyStitches.reduce((sum, s) => sum + s.x, 0) / bodyStitches.length,
      y: bodyStitches.reduce((sum, s) => sum + s.y, 0) / bodyStitches.length
    };
    const a0 = angleOf(body[0].s, c);
    body.sort((p, q) => {
      const da = (angleOf(p.s, c) - a0 + 360) % 360;
      const db = (angleOf(q.s, c) - a0 + 360) % 360;
      return da - db || p.i - q.i;
    });
  } else if (bodyStitches.length) {
    // 줄: 평균 방향에 수직인 진행축(오른쪽)으로 투영해 정렬
    const r = ((bodyStitches[0].rotation || 0) * Math.PI) / 180;
    const ax = Math.cos(r);
    const ay = Math.sin(r);
    body.sort((p, q) => p.s.x * ax + p.s.y * ay - (q.s.x * ax + q.s.y * ay) || p.i - q.i);
  }
  return { radial, prefix: prefix.map((e) => e.s), body: body.map((e) => e.s), suffix: suffix.map((e) => e.s) };
};

const singleUnit = (s) => {
  const spec = getStitchType(s.type);
  if (s.role === 'standing') return { name: '기둥코 사슬', counts: true, stitches: 0 };
  return { name: spec.label, counts: spec.counts, stitches: spec.counts ? 1 : 0 };
};

/** 정렬된 코 → 단위(묶음은 하나) */
const toUnits = (ordered, groupOf) => {
  const seen = new Set();
  const units = [];
  ordered.forEach((s) => {
    const group = groupOf.get(s.id);
    if (!group) {
      units.push(singleUnit(s));
      return;
    }
    if (seen.has(group.id)) return;
    seen.add(group.id);
    const size = group.stitchIds.length;
    units.push({ name: groupLabel(s.type, group.kind, size), counts: true, stitches: group.kind === 'inc' ? size : 1 });
  });
  return units;
};

/**
 * 서술도안 생성
 * @returns {Array<{roundId, label, text, stitchCount, line}>}
 */
export const buildWrittenPattern = (chart) => {
  const groupOf = new Map();
  chart.groups.forEach((g) => g.stitchIds.forEach((id) => groupOf.set(id, g)));
  const lines = [];
  chart.rounds.forEach((round) => {
    const stitches = chart.stitches.filter((s) => s.roundId === round.id);
    if (!stitches.length) return;
    const { radial, prefix, body, suffix } = orderRoundStitches(stitches);
    const prefixUnits = toUnits(prefix, groupOf);
    const bodyUnits = toUnits(body, groupOf);
    const suffixUnits = toUnits(suffix, groupOf);
    const parts = [
      formatCompressed(runLength(prefixUnits)),
      formatCompressed(compressUnits(bodyUnits, { cyclic: radial })),
      formatCompressed(runLength(suffixUnits))
    ].filter(Boolean);
    const stitchCount = bodyUnits.reduce((sum, u) => sum + u.stitches, 0);
    const label = roundLabel(round.name);
    const text = parts.join(', ');
    lines.push({ roundId: round.id, label, text, stitchCount, line: `${label}: ${text} (${stitchCount}코)` });
  });
  return lines;
};

export const formatWrittenPattern = (chart, title = '') => {
  const lines = buildWrittenPattern(chart).map((l) => l.line);
  return [title ? `■ ${title}` : '', ...lines].filter(Boolean).join('\n');
};
