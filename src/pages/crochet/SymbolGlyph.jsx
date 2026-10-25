import { getStitchLocalBox, getStitchPrimitives, STITCH_TYPE_IDS, STROKE_WIDTH } from '../../features/crochet/model/crochetSymbols.js';

// 기호별 도형은 고정이므로 한 번만 계산
const PRIMITIVES = Object.fromEntries(STITCH_TYPE_IDS.map((type) => [type, getStitchPrimitives(type)]));

export const primitivesOf = (type) => PRIMITIVES[type] ?? PRIMITIVES.sc;

/** 원시 도형 배열 → SVG 요소 */
export function SymbolGlyph({ primitives, color = 'currentColor', strokeWidth = STROKE_WIDTH, className, opacity }) {
  return (
    <g
      className={className}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={opacity}
    >
      {primitives.map((p, index) => {
        const fill = p.fill ? color : 'none';
        if (p.t === 'line') return <line key={index} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />;
        if (p.t === 'path') return <path key={index} d={p.d} fill={fill} />;
        if (p.t === 'circle') return <circle key={index} cx={p.cx} cy={p.cy} r={p.r} fill={fill} />;
        if (p.t === 'ellipse') {
          return (
            <ellipse
              key={index}
              cx={p.cx}
              cy={p.cy}
              rx={p.rx}
              ry={p.ry}
              fill={fill}
              transform={p.rot ? `rotate(${p.rot} ${p.cx} ${p.cy})` : undefined}
            />
          );
        }
        return null;
      })}
    </g>
  );
}

/** 기호 미리보기 아이콘 (라이브러리·메뉴용) */
export function SymbolIcon({ type, size = 28 }) {
  const box = getStitchLocalBox(type);
  const pad = 4;
  const side = Math.max(box.width, box.height) + pad * 2;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return (
    <svg
      className="ce-symbol-icon"
      width={size}
      height={size}
      viewBox={`${cx - side / 2} ${cy - side / 2} ${side} ${side}`}
      aria-hidden="true"
    >
      <SymbolGlyph primitives={primitivesOf(type)} strokeWidth={side / 22} />
    </svg>
  );
}
