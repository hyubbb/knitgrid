/**
 * 세그먼트/탭 컨트롤. items를 버튼 목록으로 렌더하고 active를 표시.
 * 컨테이너 클래스(예: 'mode-tabs', 'display-tabs')를 className으로 받아 기존 스타일을 입는다.
 * @param {object} props
 * @param {Array<{id:string,label:string,icon?:React.ComponentType<{size?:number}>}>} props.items
 * @param {string} props.value - 현재 선택된 id
 * @param {(id:string) => void} props.onChange
 * @param {number} [props.iconSize=15]
 * @param {string} props.className - 컨테이너 클래스 (필수: 시각 스타일이 여기서 옴)
 * @param {string} [props.ariaLabel]
 * @param {string} [props.as='nav'] - 컨테이너 태그. 원본 마크업과 동일하게: mode-tabs='nav', display-tabs='div'
 */
export function SegmentedControl({ items, value, onChange, iconSize = 15, className, ariaLabel, as: Tag = 'nav' }) {
  return (
    <Tag className={className} aria-label={ariaLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={value === item.id ? 'active' : ''} onClick={() => onChange(item.id)}>
            {Icon ? <Icon size={iconSize} /> : null}
            {item.label}
          </button>
        );
      })}
    </Tag>
  );
}
