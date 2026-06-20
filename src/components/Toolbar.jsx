/**
 * 가로 액션 바 컨테이너. 자식을 그대로 배치한다(스타일은 className에서).
 * @param {object} props
 * @param {string} props.className - 'command-group' | 'canvas-toolbar' 등
 * @param {React.ReactNode} props.children
 */
export function Toolbar({ className, children, ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
