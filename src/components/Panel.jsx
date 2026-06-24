import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * 제목 달린 카드 패널. .panel + .panel-title 구조를 캡슐화하며, 헤더의 셰브론으로 본문을 접을 수 있다.
 * @param {object} props
 * @param {string} props.title
 * @param {React.ComponentType<{size?:number}>} [props.icon]
 * @param {number} [props.iconSize=17]
 * @param {React.ReactNode} [props.action] - 헤더 우측 슬롯(예: '추가' 버튼)
 * @param {string} [props.titleId] - 제목 strong의 id
 * @param {string} [props.className] - .panel에 덧붙일 변형(예: 'setup-panel', 'progress-panel')
 * @param {boolean} [props.collapsible=true] - 헤더 셰브론으로 접기 허용
 * @param {boolean} [props.defaultOpen=true] - 초기 펼침 상태
 * @param {React.ReactNode} props.children
 */
export function Panel({ title, icon: Icon, iconSize = 17, action, titleId, className = '', collapsible = true, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel ${className} ${open ? '' : 'is-collapsed'}`.replace(/\s+/g, ' ').trim()}>
      <div className="panel-title">
        {collapsible ? (
          <button
            type="button"
            className="panel-collapse"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            title={open ? `${title} 접기` : `${title} 펼치기`}
            aria-label={open ? `${title} 접기` : `${title} 펼치기`}
          >
            <ChevronDown size={16} />
          </button>
        ) : null}
        {Icon ? <Icon size={iconSize} /> : null}
        <strong id={titleId}>{title}</strong>
        {action}
      </div>
      {open ? children : null}
    </section>
  );
}
