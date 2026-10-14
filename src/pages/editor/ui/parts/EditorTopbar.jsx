import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  DropdownMenu,
  IconButton,
  SegmentedControl,
  TextField,
  ThemeToggle,
  Toolbar,
} from "../../../../components/index.js";
import {
  ChevronDown,
  Eye,
  Download,
  FileImage,
  FileText,
  FolderOpen,
  Grid3X3,
  ImagePlus,
  Layers,
  Menu,
  MoreVertical,
  PenLine,
  Plus,
  Redo2,
  Rows3,
  Save,
  Type,
  Undo2,
} from "lucide-react";

const MODE_ITEMS = [
  { id: "edit", label: "편집", icon: PenLine },
  { id: "preview", label: "미리보기", icon: Eye },
  { id: "progress", label: "진행", icon: Rows3 },
];

export function EditorTopbar({ editor, mobileDrawer, onOpenMobileDrawer }) {
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
    goToStartScreen,
    fileInputRef,
    projectInputRef,
    referenceInputRef,
    openTextDraft,
    exportPng,
    exportPdf,
    saveProject,
  } = editor;
  const [mobileModeMenuOpen, setMobileModeMenuOpen] = useState(false);
  const mobileModeRef = useRef(null);
  const currentMode =
    MODE_ITEMS.find((item) => item.id === mode) ?? MODE_ITEMS[0];
  const CurrentModeIcon = currentMode.icon;

  useEffect(() => {
    if (!mobileModeMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!mobileModeRef.current?.contains(event.target))
        setMobileModeMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileModeMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileModeMenuOpen]);

  const selectMobileMode = (nextMode) => {
    setMode(nextMode);
    setMobileModeMenuOpen(false);
  };

  const fileMenuItems = [
    {
      id: "new-project",
      label: "새 작업",
      icon: Plus,
      onSelect: requestNewProject,
    },
    {
      id: "local-projects",
      label: "내 작업",
      icon: FileText,
      onSelect: openLocalProjectsModal,
    },
    {
      id: "image-draft",
      label: "이미지로 초안 생성",
      icon: ImagePlus,
      onSelect: () => fileInputRef.current?.click(),
    },
    {
      id: "reference-image",
      label: "레퍼런스 이미지 깔기(따라 그리기)",
      icon: Layers,
      onSelect: () => referenceInputRef.current?.click(),
    },
    {
      id: "text-draft",
      label: "텍스트로 초안 생성",
      icon: Type,
      onSelect: openTextDraft,
    },
    {
      id: "open-json",
      label: "프로젝트 JSON 열기",
      icon: FolderOpen,
      onSelect: () => projectInputRef.current?.click(),
    },
    {
      id: "export-png",
      label: "PNG 내보내기",
      icon: FileImage,
      onSelect: exportPng,
    },
    {
      id: "export-pdf",
      label: "PDF 내보내기",
      icon: FileText,
      onSelect: exportPdf,
    },
    {
      id: "export-json",
      label: "JSON 내보내기",
      icon: Download,
      onSelect: saveProject,
    },
  ];

  return (
    <header className="topbar">
      <div className="mobile-topbar-controls">
        <button
          type="button"
          className={mobileDrawer === "tools" ? "active" : ""}
          onClick={() => onOpenMobileDrawer("tools")}
          aria-label="왼쪽 도구 열기"
          title="도구 열기"
        >
          <Menu size={18} />
        </button>
        <div className="mobile-mode-picker" ref={mobileModeRef}>
          <button
            type="button"
            className="mobile-mode-trigger"
            onClick={() => setMobileModeMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={mobileModeMenuOpen}
            aria-label="작업 모드 선택"
          >
            <CurrentModeIcon size={16} />
            <span>{currentMode.label}</span>
            <ChevronDown size={15} />
          </button>
          {mobileModeMenuOpen ? (
            <div
              className="mobile-mode-menu"
              role="menu"
              aria-label="작업 모드"
            >
              {MODE_ITEMS.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={item.id === mode ? "active" : ""}
                    onClick={() => selectMobileMode(item.id)}
                  >
                    <ItemIcon size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={mobileDrawer === "inspector" ? "active" : ""}
          onClick={() => onOpenMobileDrawer("inspector")}
          aria-label="오른쪽 설정 열기"
          title="설정 열기"
        >
          <Menu size={18} />
        </button>
      </div>
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
          <TextField
            value={projectName}
            onChange={setProjectName}
            ariaLabel="프로젝트 이름"
          />
        </div>
      </div>

      <SegmentedControl
        className="mode-tabs"
        ariaLabel="작업 모드"
        items={MODE_ITEMS}
        value={mode}
        onChange={setMode}
      />

      <Toolbar className="command-group">
        <Badge
          state={localSaveState}
          title={localSaveMessage || localSaveStatusLabel}
        >
          {localSaveStatusLabel}
        </Badge>
        <div className="command-history">
          <IconButton
            icon={Undo2}
            label="되돌리기"
            size={16}
            onClick={undo}
            disabled={!history.length}
            title="되돌리기"
          />
          <IconButton
            icon={Redo2}
            label="다시 실행"
            size={16}
            onClick={redo}
            disabled={!future.length}
            title="다시 실행"
          />
          <ThemeToggle />
        </div>
        <Button
          variant="primary"
          icon={Save}
          onClick={saveCurrentLocalProject}
          disabled={localSaveState === "saving"}
        >
          로컬 저장
        </Button>
        <DropdownMenu
          label="더 보기: 새 작업, 내 작업, 가져오기 및 내보내기"
          icon={MoreVertical}
          items={fileMenuItems}
        />
      </Toolbar>

      <button
        type="button"
        className={`inspector-drawer-toggle ${mobileDrawer === "inspector" ? "active" : ""}`}
        onClick={() => onOpenMobileDrawer("inspector")}
        aria-label="설정 열기"
        title="설정 열기"
      >
        <Menu size={18} />
      </button>
    </header>
  );
}
