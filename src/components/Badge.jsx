/**
 * 상태 핀/뱃지. state로 변형 클래스를 만든다(state-${state}).
 * @param {object} props
 * @param {string} [props.state] - 'saved' | 'saving' | 'error' 등 → state-${state}
 * @param {string} [props.baseClassName='local-save-state']
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 */
export function Badge({ state, baseClassName = 'local-save-state', title, children }) {
  const classes = [baseClassName, state ? `state-${state}` : ''].filter(Boolean).join(' ');
  return (
    <span className={classes} title={title}>
      {children}
    </span>
  );
}
