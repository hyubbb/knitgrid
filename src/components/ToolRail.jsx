/**
 * 세로 아이콘 도구 레일. items를 선택 가능한 도구 버튼으로 렌더하고, children으로 추가 액션 버튼을 받는다.
 * @param {object} props
 * @param {Array<{id:string,label:string,icon:React.ComponentType<{size?:number}>}>} props.items
 * @param {string} props.value - 활성 도구 id
 * @param {(id:string) => void} props.onSelect
 * @param {number} [props.iconSize=20]
 * @param {string} [props.ariaLabel]
 * @param {React.ReactNode} [props.children] - 추가 버튼(회전/반복 등)
 */
export function ToolRail({ items, value, onSelect, iconSize = 20, ariaLabel, children }) {
  return (
    <aside className="tool-rail" aria-label={ariaLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        const shortcut = item.shortcut?.toUpperCase();
        return (
          <button
            key={item.id}
            className={value === item.id ? 'active' : ''}
            onClick={() => onSelect(item.id)}
            title={shortcut ? `${item.label} (${shortcut})` : item.label}
            aria-keyshortcuts={shortcut}
          >
            <Icon size={iconSize} />
            <span>{item.label}</span>
            {shortcut ? <kbd aria-hidden="true">{shortcut}</kbd> : null}
          </button>
        );
      })}
      {children}
    </aside>
  );
}
