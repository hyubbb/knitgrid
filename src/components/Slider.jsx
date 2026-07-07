/**
 * 아이콘 + range + 값 표시 슬라이더. .zoom-control 류 스타일.
 * @param {object} props
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} props.value
 * @param {(value:number) => void} props.onChange - 숫자 값을 넘김
 * @param {React.ComponentType<{size?:number}>} [props.leftIcon]
 * @param {React.ComponentType<{size?:number}>} [props.rightIcon]
 * @param {React.ReactNode} [props.valueLabel] - 우측 값 표시(예: '120%')
 * @param {number} [props.iconSize=15]
 * @param {string} [props.className='zoom-control']
 * @param {number} [props.step=5] - 아이콘 클릭 시 증감 폭
 */
export function Slider({ min, max, value, onChange, leftIcon: Left, rightIcon: Right, valueLabel, iconSize = 15, className = 'zoom-control', step = 5 }) {
  const nudge = (delta) => onChange(Math.min(max, Math.max(min, value + delta)));
  return (
    <div className={className}>
      {Left ? (
        <button type="button" className="slider-icon-button" onClick={() => nudge(-step)} disabled={value <= min} aria-label="값 줄이기">
          <Left size={iconSize} />
        </button>
      ) : null}
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {Right ? (
        <button type="button" className="slider-icon-button" onClick={() => nudge(step)} disabled={value >= max} aria-label="값 늘리기">
          <Right size={iconSize} />
        </button>
      ) : null}
      {valueLabel != null ? <b>{valueLabel}</b> : null}
    </div>
  );
}
