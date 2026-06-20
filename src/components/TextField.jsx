/**
 * 라벨 + 텍스트 input. 라벨 텍스트가 없으면 aria-label만 적용(brand의 프로젝트 이름처럼).
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} props.value
 * @param {(value:string) => void} props.onChange
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
export function TextField({ label, value, onChange, ariaLabel, className, ...rest }) {
  const input = (
    <input value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel ?? label} className={label ? undefined : className} {...rest} />
  );
  if (!label) return input;
  return (
    <label className={className}>
      {label}
      {input}
    </label>
  );
}
