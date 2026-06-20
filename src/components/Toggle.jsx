/**
 * 눌림 상태를 가진 토글 버튼. 클래스는 호출자가 className으로 지정(.palette-visibility-toggle 등).
 * @param {object} props
 * @param {boolean} props.pressed
 * @param {(next:boolean) => void} props.onChange
 * @param {React.ComponentType<{size?:number}>} [props.icon] - pressed 무관 단일 아이콘
 * @param {React.ComponentType<{size?:number}>} [props.iconOn] - pressed=true일 때
 * @param {React.ComponentType<{size?:number}>} [props.iconOff] - pressed=false일 때
 * @param {number} [props.iconSize=13]
 * @param {string} [props.pressedClassName] - pressed일 때 추가 클래스(예: '', 'is-hidden')
 * @param {string} [props.className]
 * @param {string} [props.label] - aria-label
 * @param {React.ReactNode} [props.children]
 */
export function Toggle({ pressed, onChange, icon: Icon, iconOn: On, iconOff: Off, iconSize = 13, pressedClassName, className = '', label, children, ...rest }) {
  const Chosen = pressed ? (On ?? Icon) : (Off ?? Icon);
  const classes = [className, pressed && pressedClassName ? pressedClassName : ''].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} aria-pressed={pressed} aria-label={label} onClick={() => onChange(!pressed)} {...rest}>
      {Chosen ? <Chosen size={iconSize} /> : null}
      {children}
    </button>
  );
}
