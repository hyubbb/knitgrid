/**
 * 기본 버튼. 기존 시맨틱 클래스(.primary/.danger/.wide/.active)를 변형으로 노출.
 * @param {object} props
 * @param {'default'|'primary'|'danger'} [props.variant='default']
 * @param {React.ComponentType<{size?:number}>} [props.icon] - lucide 아이콘 컴포넌트
 * @param {number} [props.iconSize=16]
 * @param {boolean} [props.wide] - .wide (전체 너비)
 * @param {boolean} [props.active] - .active
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
export function Button({ variant = 'default', icon: Icon, iconSize = 16, wide, active, className = '', children, ...rest }) {
  const classes = [variant !== 'default' ? variant : '', wide ? 'wide' : '', active ? 'active' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={classes || undefined} {...rest}>
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
    </button>
  );
}

/**
 * 아이콘 전용 버튼. 접근성을 위해 label 필수(→ aria-label + title).
 * @param {object} props
 * @param {React.ComponentType<{size?:number}>} props.icon
 * @param {string} props.label
 * @param {number} [props.size=15]
 * @param {boolean} [props.active]
 * @param {string} [props.className]
 */
export function IconButton({ icon: Icon, label, size = 15, active, className = '', ...rest }) {
  const classes = [active ? 'active' : '', className].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} aria-label={label} title={rest.title ?? label} {...rest}>
      <Icon size={size} />
    </button>
  );
}
