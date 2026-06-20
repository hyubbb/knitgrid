/**
 * 진행 행 칩 버튼. done/current 상태를 클래스로 표시.
 * @param {object} props
 * @param {React.ReactNode} props.label
 * @param {boolean} [props.done]
 * @param {boolean} [props.current]
 * @param {() => void} props.onClick
 */
export function Chip({ label, done, current, onClick }) {
  const classes = [done ? 'done' : '', current ? 'current' : ''].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} onClick={onClick}>
      {label}
    </button>
  );
}
