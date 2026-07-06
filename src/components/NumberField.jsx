import { parseNumericInput } from '../shared/lib/number.js';

/**
 * 라벨 + 숫자 input. onChange는 숫자를 넘긴다(빈 값은 NaN 방지를 위해 호출자가 처리).
 * @param {object} props
 * @param {string} [props.label]
 * @param {number} props.value
 * @param {(value:number) => void} props.onChange
 * @param {number} [props.min]
 * @param {number} [props.max]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function NumberField({ label, value, onChange, min, max, ariaLabel, className, ...rest }) {
  const input = (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      spellCheck={false}
      min={min}
      max={max}
      value={value}
      aria-label={ariaLabel ?? label}
      className={label ? undefined : className}
      onChange={(event) => onChange(parseNumericInput(event.target.value, value))}
      {...rest}
    />
  );
  if (!label) return input;
  return (
    <label className={className}>
      {label}
      {input}
    </label>
  );
}
