import { ArrowLeft, ArrowRight, Settings2, X } from 'lucide-react';
import { InspectorGaugePanel } from './inspector/InspectorGaugePanel.jsx';
import { InspectorPalettePanel } from './inspector/InspectorPalettePanel.jsx';
import { InspectorProgressPanel } from './inspector/InspectorProgressPanel.jsx';
import { InspectorSetupPanel } from './inspector/InspectorSetupPanel.jsx';
import { InspectorViewPanel } from './inspector/InspectorViewPanel.jsx';
import { InspectorWrittenPanel } from './inspector/InspectorWrittenPanel.jsx';

export function EditorInspector({ editor, onMobileClose }) {
  const {
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    mode
  } = editor;
  const isEditMode = mode === 'edit';
  const isPreviewMode = mode === 'preview';
  const isProgressMode = mode === 'progress';
  const collapseAction = (
    <>
      <button
        type="button"
        className="icon-toggle desktop-inspector-collapse"
        onClick={() => setIsInspectorCollapsed(true)}
        title="오른쪽 설정 접기"
        aria-label="오른쪽 설정 접기"
      >
        <ArrowRight size={15} />
      </button>
      <button
        type="button"
        className="icon-toggle mobile-inspector-close"
        onClick={onMobileClose}
        title="설정 닫기"
        aria-label="설정 닫기"
      >
        <X size={15} />
      </button>
    </>
  );

  return (
    <aside className={`inspector ${isInspectorCollapsed ? 'collapsed' : ''}`} aria-label="격자 설정 사이드메뉴">
      {isInspectorCollapsed ? (
        <button
          className="inspector-expand"
          onClick={() => setIsInspectorCollapsed(false)}
          title="격자 설정 펼치기"
          aria-label="격자 설정 펼치기"
        >
          <Settings2 size={17} />
          <ArrowLeft size={16} />
        </button>
      ) : (
        <>
          {isEditMode ? <InspectorSetupPanel editor={editor} action={collapseAction} /> : null}
          {isPreviewMode ? <InspectorViewPanel editor={editor} title="미리보기 설정" action={collapseAction} /> : null}
          {isProgressMode ? <InspectorViewPanel editor={editor} title="진행 보기 설정" action={collapseAction} /> : null}
          {isEditMode || isPreviewMode ? <InspectorGaugePanel editor={editor} editable={isEditMode} /> : null}
          {isEditMode || isPreviewMode ? <InspectorWrittenPanel editor={editor} /> : null}
          <InspectorPalettePanel editor={editor} editable={isEditMode} />
          {isProgressMode ? <InspectorProgressPanel editor={editor} /> : null}
        </>
      )}
    </aside>
  );
}
