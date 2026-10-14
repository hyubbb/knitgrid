import { ArrowLeft, ArrowRight, Eye, Settings2, X } from "lucide-react";
import { Panel } from "../../../../components/index.js";
import { InspectorGaugePanel } from "./inspector/InspectorGaugePanel.jsx";
import { InspectorPalettePanel } from "./inspector/InspectorPalettePanel.jsx";
import { InspectorProgressPanel } from "./inspector/InspectorProgressPanel.jsx";
import { InspectorSetupPanel } from "./inspector/InspectorSetupPanel.jsx";
import { InspectorViewControls } from "./inspector/InspectorViewControls.jsx";
import { InspectorViewPanel } from "./inspector/InspectorViewPanel.jsx";
import { InspectorWrittenPanel } from "./inspector/InspectorWrittenPanel.jsx";

export function EditorInspector({ editor, onMobileClose }) {
  const { isInspectorCollapsed, setIsInspectorCollapsed, mode } = editor;
  const isEditMode = mode === "edit";
  const isPreviewMode = mode === "preview";
  const isProgressMode = mode === "progress";
  const drawerTitle = isEditMode
    ? "편집 설정"
    : isPreviewMode
      ? "미리보기 설정"
      : "진행 보기 설정";

  return (
    <aside
      className={`inspector ${isInspectorCollapsed ? "collapsed" : ""}`}
      aria-label="격자 설정 사이드메뉴"
    >
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
          <div className="inspector-header">
            <Settings2 size={16} />
            <strong>{drawerTitle}</strong>
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
          </div>
          <InspectorPalettePanel editor={editor} editable={isEditMode} />
          {isEditMode ? <InspectorSetupPanel editor={editor} /> : null}
          {isEditMode ? (
            <Panel
              className="setup-panel"
              icon={Eye}
              title="격자 표시 설정"
              defaultOpen={false}
            >
              <InspectorViewControls editor={editor} showDisplayMode={false} />
            </Panel>
          ) : null}
          {isPreviewMode ? (
            <InspectorViewPanel editor={editor} title="미리보기 설정" />
          ) : null}
          {isProgressMode ? (
            <InspectorViewPanel editor={editor} title="진행 보기 설정" />
          ) : null}
          {isEditMode || isPreviewMode ? (
            <InspectorGaugePanel editor={editor} editable={isEditMode} />
          ) : null}
          {isEditMode || isPreviewMode ? (
            <InspectorWrittenPanel editor={editor} />
          ) : null}
          {isProgressMode ? <InspectorProgressPanel editor={editor} /> : null}
        </>
      )}
    </aside>
  );
}
