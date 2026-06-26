import { Button, IconButton, SegmentedControl, TextField, Toolbar, Badge, ThemeToggle } from '../../../../components/index.js';
import {
  Eye,
  FileText,
  Grid3X3,
  PenLine,
  Plus,
  Redo2,
  Rows3,
  Save,
  Undo2
} from 'lucide-react';

export function EditorTopbar({ editor }) {
  const {
    projectName,
    setProjectName,
    mode,
    setMode,
    localSaveState,
    localSaveMessage,
    localSaveStatusLabel,
    requestNewProject,
    openLocalProjectsModal,
    saveCurrentLocalProject,
    history,
    future,
    undo,
    redo,
    goToStartScreen
  } = editor;

  return (
    <header className="topbar">
      <div className="brand">
        <button
          type="button"
          className="brand-mark"
          onClick={goToStartScreen}
          title="내 도안 목록"
          aria-label="내 도안 목록으로 이동"
        >
          <Grid3X3 size={18} />
        </button>
        <div>
          <strong>KnitGrid</strong>
          <TextField value={projectName} onChange={setProjectName} ariaLabel="프로젝트 이름" />
        </div>
      </div>

      <SegmentedControl
        className="mode-tabs"
        ariaLabel="작업 모드"
        items={[
          { id: 'edit', label: '편집', icon: PenLine },
          { id: 'preview', label: '미리보기', icon: Eye },
          { id: 'progress', label: '진행', icon: Rows3 }
        ]}
        value={mode}
        onChange={setMode}
      />

      <Toolbar className="command-group">
        <Badge state={localSaveState} title={localSaveMessage || localSaveStatusLabel}>
          {localSaveStatusLabel}
        </Badge>
        <div className="command-history">
          <IconButton icon={Undo2} label="되돌리기" size={16} onClick={undo} disabled={!history.length} title="되돌리기" />
          <IconButton icon={Redo2} label="다시 실행" size={16} onClick={redo} disabled={!future.length} title="다시 실행" />
          <ThemeToggle />
        </div>
        <Button icon={Plus} onClick={requestNewProject}>새 작업</Button>
        <Button icon={FileText} onClick={openLocalProjectsModal}>내 작업</Button>
        <Button variant="primary" icon={Save} onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>
          로컬 저장
        </Button>
      </Toolbar>
    </header>
  );
}
