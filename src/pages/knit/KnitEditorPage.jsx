import { useState } from 'react';
import { ArrowLeft, FileDown, FileText, ImageDown, Redo2, Save, Shirt, Undo2 } from 'lucide-react';
import { EditorCanvas } from '../editor/ui/parts/EditorCanvas.jsx';
import { InspectorGaugePanel } from '../editor/ui/parts/inspector/InspectorGaugePanel.jsx';
import { InspectorPalettePanel } from '../editor/ui/parts/inspector/InspectorPalettePanel.jsx';
import { InspectorProgressPanel } from '../editor/ui/parts/inspector/InspectorProgressPanel.jsx';
import { InspectorSetupPanel } from '../editor/ui/parts/inspector/InspectorSetupPanel.jsx';
import { KnitCountPanel, KnitLibraryPanel, KNIT_TOOLS } from './KnitPanels.jsx';
import { KnitWrittenModal } from './KnitWrittenModal.jsx';
import '../crochet/crochet.css';
import './knit.css';

const SAVE_LABELS = {
  unsaved: '저장 안 됨',
  dirty: '변경됨',
  saving: '저장 중…',
  saved: '저장됨',
  error: '저장 실패'
};

const MODES = [
  { id: 'edit', label: '편집' },
  { id: 'progress', label: '진행' }
];

/**
 * 대바늘 기호도안 화면. 코바늘 편집기와 같은 틀(상단 바 · 왼쪽 기호 · 가운데 캔버스 · 오른쪽 검사)을 쓰고,
 * 도안 데이터와 편집 동작은 격자 편집 훅(useKnitGridEditor)을 그대로 쓴다.
 */
export function KnitEditorPage({ editor }) {
  const {
    projectName,
    setProjectName,
    mode,
    setMode,
    history,
    future,
    undo,
    redo,
    displayMode,
    setDisplayMode,
    localSaveState,
    saveCurrentLocalProject,
    goToStartScreen,
    exportPng,
    exportPdf,
    exportKnitPng,
    tool,
    rows,
    cols,
    currentCell,
    rowNumber,
    knitRowIssues,
    handlePointerUp
  } = editor;
  const [patternOpen, setPatternOpen] = useState(false);
  const isFabricView = displayMode === 'knit';
  const saveState = SAVE_LABELS[localSaveState] ? localSaveState : 'unsaved';

  return (
    <div className="ce-page ke-page" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      <header className="ce-topbar">
        <button type="button" className="ce-back" onClick={goToStartScreen}>
          <ArrowLeft size={16} /> 내 작업
        </button>
        <div className="ce-title">
          <span className="ce-kind">대바늘 기호도안</span>
          <input
            className="ce-name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            aria-label="도안 이름"
            maxLength={60}
          />
        </div>
        <div className="ce-top-group" role="group" aria-label="실행 취소">
          <button type="button" className="ce-icon-btn" onClick={undo} disabled={!history.length} aria-label="실행 취소" title="실행 취소 (⌘Z)">
            <Undo2 size={16} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={redo} disabled={!future.length} aria-label="다시 실행" title="다시 실행 (⇧⌘Z)">
            <Redo2 size={16} />
          </button>
        </div>
        <div className="ce-top-group ke-modes" role="group" aria-label="작업 모드">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ce-top-btn ${mode === item.id ? 'is-active' : ''}`}
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`ce-top-btn ${isFabricView ? 'is-active' : ''}`}
          aria-pressed={isFabricView}
          onClick={() => setDisplayMode(isFabricView ? 'color-code' : 'knit')}
          title="메리야스로 떴을 때의 모습"
        >
          <Shirt size={16} /> {isFabricView ? '기호 보기' : '실물 보기'}
        </button>
        <div className="ce-top-spacer" />
        <button type="button" className="ce-top-btn" onClick={() => setPatternOpen(true)}>
          <FileText size={16} /> 서술도안
        </button>
        <button type="button" className="ce-top-btn" onClick={exportPng} title="기호 도안 PNG">
          <ImageDown size={16} /> PNG
        </button>
        <button type="button" className="ce-top-btn" onClick={exportPdf} title="기호 범례가 들어간 PDF">
          <FileDown size={16} /> PDF
        </button>
        <button type="button" className="ce-top-btn" onClick={exportKnitPng} title="실물 모습 PNG">
          <Shirt size={16} /> 실물 PNG
        </button>
        <span className={`ce-save-state state-${saveState === 'saved' ? 'saved' : saveState === 'error' ? 'error' : 'dirty'}`} role="status">
          {SAVE_LABELS[saveState]}
        </span>
        <button
          type="button"
          className="ce-top-btn primary"
          onClick={saveCurrentLocalProject}
          disabled={localSaveState === 'saving'}
        >
          <Save size={16} /> 로컬 저장
        </button>
      </header>

      <KnitLibraryPanel editor={editor} />

      <div className="ce-stage ke-stage">
        <EditorCanvas editor={editor} />
      </div>

      <aside className="ce-right ke-right" aria-label="코 수 검사와 설정">
        <KnitCountPanel editor={editor} />
        {mode === 'progress' ? <InspectorProgressPanel editor={editor} /> : null}
        {mode === 'edit' ? <InspectorSetupPanel editor={editor} /> : null}
        <InspectorPalettePanel editor={editor} editable={mode === 'edit'} />
        <InspectorGaugePanel editor={editor} editable={mode === 'edit'} />
      </aside>

      <footer className="ce-statusbar">
        <span>
          {cols}코 × {rows}단
        </span>
        {currentCell ? (
          <span>
            현재 {rowNumber(currentCell.row)}단 {currentCell.col + 1}번째 코
          </span>
        ) : null}
        <span>{knitRowIssues.size ? `코 수 오류 ${knitRowIssues.size}단` : '코 수 정상'}</span>
        <span className="ce-status-tool">{KNIT_TOOLS.find((item) => item.id === tool)?.label}</span>
      </footer>

      <KnitWrittenModal open={patternOpen} onClose={() => setPatternOpen(false)} editor={editor} />
    </div>
  );
}
