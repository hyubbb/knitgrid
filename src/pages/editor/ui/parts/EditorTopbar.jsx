import { Button, FileButton, IconButton, SegmentedControl, TextField, Toolbar, Badge } from '../../../../components/index.js';
import {
  Download,
  Eye,
  FileImage,
  FileText,
  Grid3X3,
  ImagePlus,
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
    prepareImageDraft,
    exportPng,
    exportPdf,
    saveProject
  } = editor;

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Grid3X3 size={18} />
        </div>
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
        <Button icon={Plus} onClick={requestNewProject}>새 작업</Button>
        <Button icon={FileText} onClick={openLocalProjectsModal}>내 작업</Button>
        <Button variant="primary" icon={Save} onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>
          로컬 저장
        </Button>
        <IconButton icon={Undo2} label="되돌리기" size={16} onClick={undo} disabled={!history.length} title="되돌리기" />
        <IconButton icon={Redo2} label="다시 실행" size={16} onClick={redo} disabled={!future.length} title="다시 실행" />
        <FileButton
          icon={ImagePlus}
          accept="image/png,image/jpeg,image/webp"
          title="이미지 업로드"
          onFiles={(files) => prepareImageDraft({ target: { files } })}
        >
          업로드
        </FileButton>
        <Button icon={FileImage} onClick={exportPng}>PNG</Button>
        <Button icon={FileText} onClick={exportPdf}>PDF</Button>
        <Button icon={Download} onClick={saveProject}>JSON</Button>
      </Toolbar>
    </header>
  );
}
