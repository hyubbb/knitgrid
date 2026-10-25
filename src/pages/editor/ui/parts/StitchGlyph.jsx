import { getKnitStitch, getStitchGlyph } from "../../../../app/model/knitgridModel.js";

/**
 * 대바늘 기법 기호(SVG). span 칸 폭만큼 가로로 늘어난다.
 * halo 선은 교차뜨기에서 위로 지나가는 선 아래를 배경색으로 끊어준다.
 */
export function StitchGlyph({ id, ink = "currentColor", halo = "#fff", className = "", size }) {
  const stitch = getKnitStitch(id);
  const parts = getStitchGlyph(stitch.id);
  const width = 100 * stitch.span;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio='none'
      width={size ? size * stitch.span : undefined}
      height={size}
      // 교차뜨기는 오른쪽 칸들까지 걸쳐 그린다.
      style={size ? undefined : { width: `${stitch.span * 100}%` }}
      aria-hidden='true'
    >
      {parts.map((part, index) =>
        part.fill ? (
          <path key={index} d={part.d} fill={ink} />
        ) : (
          <path
            key={index}
            d={part.d}
            fill='none'
            stroke={part.halo ? halo : ink}
            strokeWidth={part.halo ? 22 : 8}
            strokeLinecap='round'
            strokeLinejoin='round'
            vectorEffect={size ? undefined : "non-scaling-stroke"}
            style={size ? undefined : { strokeWidth: part.halo ? "calc(var(--cell) * 0.2)" : "calc(var(--cell) * 0.075)" }}
          />
        ),
      )}
    </svg>
  );
}
