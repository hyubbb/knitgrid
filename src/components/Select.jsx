/**
 * 라벨 + 네이티브 select. options로 렌더하거나 children으로 <option>을 직접 줄 수 있다.
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.value
 * @param {(value:string) => void} props.onChange
 * @param {Array<{value:string,label:string}>} [props.options]
 * @param {React.ReactNode} [props.children] - options 대신 직접 <option> 주입
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function Select({ label, value, onChange, options, children, ariaLabel, className, ...rest }) {
  const select = (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel ?? label} className={label ? undefined : className} {...rest}>
      {options ? options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>) : children}
    </select>
  );
  if (!label) return select;
  return (
    <label className={className}>
      {label}
      {select}
    </label>
  );
}
