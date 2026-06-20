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
 */
export function Slider({ min, max, value, onChange, leftIcon: Left, rightIcon: Right, valueLabel, iconSize = 15, className = 'zoom-control' }) {
  return (
    <div className={className}>
      {Left ? <Left size={iconSize} /> : null}
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {Right ? <Right size={iconSize} /> : null}
      {valueLabel != null ? <b>{valueLabel}</b> : null}
    </div>
  );
}
