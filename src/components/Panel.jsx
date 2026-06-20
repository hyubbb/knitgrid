/**
 * 제목 달린 카드 패널. .panel + .panel-title 구조를 캡슐화.
 * @param {object} props
 * @param {string} props.title
 * @param {React.ComponentType<{size?:number}>} [props.icon]
 * @param {number} [props.iconSize=17]
 * @param {React.ReactNode} [props.action] - 헤더 우측 슬롯(예: '추가' 버튼)
 * @param {string} [props.titleId] - 제목 strong의 id
 * @param {string} [props.className] - .panel에 덧붙일 변형(예: 'setup-panel', 'progress-panel')
 * @param {React.ReactNode} props.children
 */
export function Panel({ title, icon: Icon, iconSize = 17, action, titleId, className = '', children }) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-title">
        {Icon ? <Icon size={iconSize} /> : null}
        <strong id={titleId}>{title}</strong>
        {action}
      </div>
      {children}
    </section>
  );
}
