/**
 * 색상 스와치 버튼. 배경색을 표시하고 클릭 가능.
 * @param {object} props
 * @param {string} props.color
 * @param {string} [props.code]
 * @param {boolean} [props.active]
 * @param {string} [props.title]
 * @param {(event:React.MouseEvent) => void} [props.onClick]
 * @param {string} [props.className]
 */
export function Swatch({ color, code, active, title, onClick, className = '', ...rest }) {
  const classes = ['palette-swatch', active ? 'active' : '', className].filter(Boolean).join(' ');
  return <button className={classes} style={{ background: color }} title={title} onClick={onClick} {...rest} />;
}
