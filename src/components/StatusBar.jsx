/**
 * 하단 상태 바. 자식 span들을 그대로 배치.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function StatusBar({ children }) {
  return <footer className="statusbar">{children}</footer>;
}
