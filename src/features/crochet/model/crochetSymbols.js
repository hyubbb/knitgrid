// 코바늘 기호(JIS/국내 표준 표기) 정의와 순수 도형 생성기
// 좌표계: 기호의 기준점(0,0)은 코의 밑동(아래 중앙), 위쪽이 -y (SVG 좌표)
// 도형 원시값: { t: 'line'|'path'|'ellipse'|'circle', ..., fill?: boolean }

export const STITCH_TYPES = {
  magic: { id: 'magic', label: '매직링', height: 0, width: 24, counts: false, groupable: false },
  start: { id: 'start', label: '시작', height: 12, width: 14, counts: false, groupable: false },
  end: { id: 'end', label: '종료', height: 12, width: 14, counts: false, groupable: false },
  slip: { id: 'slip', label: '빼뜨기', height: 7, width: 10, counts: false, groupable: false },
  ch: { id: 'ch', label: '사슬뜨기', height: 9, width: 18, counts: true, groupable: false },
  sc: { id: 'sc', label: '짧은뜨기', height: 14, width: 16, counts: true, groupable: true },
  hdc: { id: 'hdc', label: '긴뜨기', height: 26, width: 16, counts: true, groupable: true },
  dc: { id: 'dc', label: '한길 긴뜨기', height: 36, width: 16, counts: true, groupable: true },
  tr: { id: 'tr', label: '두길 긴뜨기', height: 46, width: 16, counts: true, groupable: true },
  dtr: { id: 'dtr', label: '세길 긴뜨기', height: 56, width: 16, counts: true, groupable: true },
  bobble: { id: 'bobble', label: '구슬뜨기', height: 36, width: 20, counts: true, groupable: false },
  popcorn: { id: 'popcorn', label: '팝콘뜨기', height: 36, width: 26, counts: true, groupable: false },
  picot: { id: 'picot', label: '피코뜨기', height: 16, width: 18, counts: false, groupable: false },
  fpdc: { id: 'fpdc', label: '앞걸어 한길 긴뜨기', height: 36, width: 16, counts: true, groupable: false },
  bpdc: { id: 'bpdc', label: '뒤걸어 한길 긴뜨기', height: 36, width: 16, counts: true, groupable: false }
};

export const STITCH_CATEGORIES = [
  { id: 'basic', label: '기본', types: ['magic', 'start', 'end', 'slip', 'ch', 'sc'] },
  { id: 'tall', label: '긴뜨기', types: ['hdc', 'dc', 'tr', 'dtr'] },
  { id: 'cluster', label: '구슬·팝콘', types: ['bobble', 'popcorn'] },
  { id: 'etc', label: '기타', types: ['picot', 'fpdc', 'bpdc'] }
];

export const STITCH_TYPE_IDS = Object.keys(STITCH_TYPES);

export const STROKE_WIDTH = 1.6;

export const getStitchType = (type) => STITCH_TYPES[type] ?? STITCH_TYPES.sc;

// 긴뜨기 계열 기둥의 사선 위치(기둥 길이 대비 비율)
const STEM_SLASHES = {
  hdc: [],
  dc: [0.5],
  tr: [0.4, 0.6],
  dtr: [0.32, 0.5, 0.68],
  fpdc: [0.5],
  bpdc: [0.5]
};

const round2 = (value) => Math.round(value * 100) / 100;
const pt = (x, y) => ({ x, y });
const add = (a, b) => pt(a.x + b.x, a.y + b.y);
const sub = (a, b) => pt(a.x - b.x, a.y - b.y);
const mul = (a, k) => pt(a.x * k, a.y * k);
const lerp = (a, b, t) => pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const len = (a) => Math.hypot(a.x, a.y);
const line = (a, b) => ({ t: 'line', x1: round2(a.x), y1: round2(a.y), x2: round2(b.x), y2: round2(b.y) });

/** rotation(도, 0=위, 시계방향)을 위쪽 단위벡터로 */
export const directionFromRotation = (rotation) => {
  const rad = ((rotation || 0) * Math.PI) / 180;
  return pt(Math.sin(rad), -Math.cos(rad));
};

/**
 * 기둥 하나(밑동 P → 머리 Q)를 기호 종류에 맞게 그린다. 단독 기호와 모아/늘려뜨기 묶음이 공유한다.
 * @param {string} type
 * @param {{x:number,y:number}} P
 * @param {{x:number,y:number}} Q
 * @param {{crossbar?:boolean, shared?:'top'|'base'|null}} [opts]
 */
export const buildStemPrimitives = (type, P, Q, opts = {}) => {
  const { crossbar = true, shared = null } = opts;
  const v = sub(Q, P);
  const length = len(v) || 1;
  const u = mul(v, 1 / length);
  const n = pt(-u.y, u.x); // 진행 방향의 오른쪽 법선
  const out = [];

  if (type === 'sc') {
    // 짧은뜨기: × 표시. 묶음일 때는 공유점까지 연결선을 긋는다.
    const C = lerp(P, Q, 0.5);
    const a = mul(add(u, n), 3.6);
    const b = mul(sub(u, n), 3.6);
    out.push(line(sub(C, a), add(C, a)), line(sub(C, b), add(C, b)));
    if (shared === 'top') out.push(line(add(C, mul(u, 3.6)), Q));
    if (shared === 'base') out.push(line(P, sub(C, mul(u, 3.6))));
    return out;
  }

  const slashes = STEM_SLASHES[type] ?? [];
  let stemStart = P;
  if (type === 'fpdc' || type === 'bpdc') {
    // 앞걸어/뒤걸어: 기둥 밑동에 갈고리 (앞=오른쪽, 뒤=왼쪽으로 휨)
    const side = type === 'fpdc' ? 1 : -1;
    stemStart = add(P, mul(u, 6));
    const hookEnd = add(P, mul(n, 5 * side));
    out.push({ t: 'path', d: `M ${round2(stemStart.x)} ${round2(stemStart.y)} Q ${round2(P.x)} ${round2(P.y)} ${round2(hookEnd.x)} ${round2(hookEnd.y)}` });
  }
  out.push(line(stemStart, Q));
  if (crossbar) out.push(line(add(Q, mul(n, -6)), add(Q, mul(n, 6))));
  slashes.forEach((f) => {
    const C = lerp(P, Q, f);
    out.push(line(sub(sub(C, mul(n, 4)), mul(u, 3)), add(add(C, mul(n, 4)), mul(u, 3))));
  });
  return out;
};

const ellipse = (cx, cy, rx, ry, rot = 0, fill = false) => ({ t: 'ellipse', cx, cy, rx, ry, rot, fill });

/** 단독 기호의 원시 도형 (로컬 좌표, 밑동 기준) */
export const getStitchPrimitives = (type) => {
  const spec = getStitchType(type);
  const h = spec.height;
  switch (spec.id) {
    case 'magic':
      return [{ t: 'circle', cx: 0, cy: 0, r: 10 }];
    case 'start':
      return [{ t: 'path', d: 'M -6 0 L 6 0 L 0 -12 Z' }];
    case 'end':
      return [{ t: 'path', d: 'M -6 0 L 6 0 L 0 -12 Z', fill: true }];
    case 'slip':
      return [{ t: 'circle', cx: 0, cy: -3.5, r: 3, fill: true }];
    case 'ch':
      return [ellipse(0, -4.5, 8, 4)];
    case 'picot':
      return [
        { t: 'circle', cx: 0, cy: -2, r: 2.2, fill: true },
        ellipse(-4.6, -7.5, 3.4, 2, -60),
        ellipse(0, -13, 3.4, 2, 0),
        ellipse(4.6, -7.5, 3.4, 2, 60)
      ];
    case 'bobble': {
      // 구슬뜨기(한길 긴뜨기 3코): 밑동·머리가 한 점에서 만나는 렌즈 모양 기둥 3개
      const out = [
        { t: 'path', d: `M 0 0 Q -10 ${-h / 2} 0 ${-h}` },
        { t: 'path', d: `M 0 0 Q 10 ${-h / 2} 0 ${-h}` },
        line(pt(0, 0), pt(0, -h)),
        line(pt(-6, -h), pt(6, -h))
      ];
      [-5, 0, 5].forEach((x) => out.push(line(pt(x - 3, -h / 2 + 2.5), pt(x + 3, -h / 2 - 2.5))));
      return out;
    }
    case 'popcorn': {
      // 팝콘뜨기(한길 긴뜨기 5코): 한 밑동에서 부채꼴로 퍼진 기둥 5개 + 머리를 묶는 타원
      const top = -h + 6;
      const out = [];
      [-10, -5, 0, 5, 10].forEach((x) => {
        out.push(line(pt(0, 0), pt(x, top)));
        const C = lerp(pt(0, 0), pt(x, top), 0.55);
        out.push(line(pt(C.x - 2.5, C.y + 2), pt(C.x + 2.5, C.y - 2)));
      });
      out.push(ellipse(0, top - 1, 12.5, 4.5));
      return out;
    }
    default:
      return buildStemPrimitives(spec.id, pt(0, 0), pt(0, -h));
  }
};

/** 기호의 대략적 히트/경계 박스 (로컬 좌표) */
export const getStitchLocalBox = (type) => {
  const spec = getStitchType(type);
  if (spec.id === 'magic') return { x: -12, y: -12, width: 24, height: 24 };
  const w = Math.max(spec.width, 12);
  return { x: -w / 2, y: -Math.max(spec.height, 8) - 2, width: w, height: Math.max(spec.height, 8) + 4 };
};

const transformPoint = (p, stitch) => {
  const rad = ((stitch.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return pt(stitch.x + p.x * cos - p.y * sin, stitch.y + p.x * sin + p.y * cos);
};

/** 코의 머리(윗점) 월드 좌표 */
export const getStitchTop = (stitch) => {
  const h = getStitchType(stitch.type).height;
  return add(pt(stitch.x, stitch.y), mul(directionFromRotation(stitch.rotation), h));
};

/** 코의 시각적 중심 월드 좌표 (범위 선택 판정용) */
export const getStitchCenter = (stitch) => {
  const h = getStitchType(stitch.type).height;
  return add(pt(stitch.x, stitch.y), mul(directionFromRotation(stitch.rotation), h / 2));
};

/** 코의 월드 경계 박스 */
export const getStitchWorldBounds = (stitch) => {
  const box = getStitchLocalBox(stitch.type);
  const corners = [
    pt(box.x, box.y),
    pt(box.x + box.width, box.y),
    pt(box.x, box.y + box.height),
    pt(box.x + box.width, box.y + box.height)
  ].map((p) => transformPoint(p, stitch));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
};

/**
 * 모아뜨기/늘려뜨기 묶음의 도형 (월드 좌표)
 * dec(모아뜨기): 밑동은 퍼지고 머리가 한 점으로 모인다.
 * inc(늘려뜨기): 밑동이 한 점으로 모이고 머리는 퍼진다.
 */
export const getGroupPrimitives = (group, stitchesById) => {
  const members = group.stitchIds.map((id) => stitchesById.get(id)).filter(Boolean);
  if (members.length < 2) return [];
  const type = members[0].type;
  const bases = members.map((s) => pt(s.x, s.y));
  const tops = members.map(getStitchTop);
  const mean = (list) => pt(list.reduce((s, p) => s + p.x, 0) / list.length, list.reduce((s, p) => s + p.y, 0) / list.length);
  const out = [];
  if (type === 'sc') {
    // 짧은뜨기 묶음: × 는 각 코 자리에 두고, 모이는 점까지 연결선만 긋는다 (V / ∧ 모양)
    // 모이는 점을 바깥(모아뜨기)/안쪽(늘려뜨기)으로 조금 밀어 V·∧ 모양이 또렷하게
    const avg = mean(members.map((s) => directionFromRotation(s.rotation)));
    const ad = len(avg) > 0.01 ? mul(avg, 1 / len(avg)) : pt(0, -1);
    const shared = group.kind === 'dec' ? add(mean(tops), mul(ad, 3)) : sub(mean(bases), mul(ad, 3));
    members.forEach((s) => {
      const d = directionFromRotation(s.rotation);
      const n = pt(-d.y, d.x);
      const C = getStitchCenter(s);
      const a = mul(add(d, n), 3.6);
      const b = mul(sub(d, n), 3.6);
      out.push(line(sub(C, a), add(C, a)), line(sub(C, b), add(C, b)));
      if (group.kind === 'dec') out.push(line(add(C, mul(d, 3.6)), shared));
      else out.push(line(shared, sub(C, mul(d, 3.6))));
    });
    return out;
  }
  if (group.kind === 'dec') {
    const apex = mean(tops);
    members.forEach((s, i) => {
      out.push(...buildStemPrimitives(type, bases[i], apex, { crossbar: false, shared: 'top' }));
    });
    // 머리 가로선은 모인 점에 한 번만
    const avgDir = mean(members.map((s) => directionFromRotation(s.rotation)));
    const d = len(avgDir) > 0.01 ? mul(avgDir, 1 / len(avgDir)) : pt(0, -1);
    const n = pt(-d.y, d.x);
    out.push(line(add(apex, mul(n, -6)), add(apex, mul(n, 6))));
  } else {
    const root = mean(bases);
    members.forEach((s, i) => {
      out.push(...buildStemPrimitives(type, root, tops[i], { crossbar: true, shared: 'base' }));
    });
  }
  return out;
};

const fmt = (value) => String(round2(value));

/** 원시 도형 → SVG 마크업 문자열 (썸네일·PNG 내보내기용) */
export const primitivesToSvg = (primitives, color, strokeWidth = STROKE_WIDTH) =>
  primitives
    .map((p) => {
      const stroke = `stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;
      const fill = p.fill ? `fill="${color}"` : 'fill="none"';
      if (p.t === 'line') return `<line x1="${fmt(p.x1)}" y1="${fmt(p.y1)}" x2="${fmt(p.x2)}" y2="${fmt(p.y2)}" ${stroke} />`;
      if (p.t === 'path') return `<path d="${p.d}" ${fill} ${stroke} />`;
      if (p.t === 'circle') return `<circle cx="${fmt(p.cx)}" cy="${fmt(p.cy)}" r="${fmt(p.r)}" ${fill} ${stroke} />`;
      if (p.t === 'ellipse') {
        const rot = p.rot ? ` transform="rotate(${fmt(p.rot)} ${fmt(p.cx)} ${fmt(p.cy)})"` : '';
        return `<ellipse cx="${fmt(p.cx)}" cy="${fmt(p.cy)}" rx="${fmt(p.rx)}" ry="${fmt(p.ry)}"${rot} ${fill} ${stroke} />`;
      }
      return '';
    })
    .join('');

/** 코의 SVG transform 속성값 */
export const stitchTransform = (stitch) => `translate(${fmt(stitch.x)} ${fmt(stitch.y)}) rotate(${fmt(stitch.rotation || 0)})`;
