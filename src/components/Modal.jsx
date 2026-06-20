import { X } from 'lucide-react';

/**
 * 모달 셸: 백드롭 + image-modal 박스 + 헤더(제목/부제/닫기) + 본문(children) + 액션 슬롯.
 * 내용 구조는 모달마다 다르므로 children/actions 슬롯으로 주입한다.
 * @param {object} props
 * @param {boolean} props.open - false면 아무것도 렌더하지 않음
 * @param {string} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {() => void} props.onClose
 * @param {string} [props.variant] - 'resize-modal' | 'crop-modal' | 'local-project-modal' 등 → image-modal에 덧붙임
 * @param {string} [props.bodyClassName] - 본문 래퍼 클래스(예: 'resize-modal-body', 'crop-modal-body'); 없으면 'image-modal-body'
 * @param {React.ReactNode} [props.actions] - image-modal-actions 내용
 * @param {string} [props.titleId]
 * @param {string} [props.closeLabel='닫기']
 * @param {React.ReactNode} props.children
 */
export function Modal({ open, title, subtitle, onClose, variant = '', bodyClassName = 'image-modal-body', actions, titleId, closeLabel = '닫기', children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`image-modal ${variant}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="image-modal-header">
          <div>
            <strong id={titleId}>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          <button onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
        {actions ? <div className="image-modal-actions">{actions}</div> : null}
      </section>
    </div>
  );
}
