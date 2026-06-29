import { ToolRail } from '../../../../components/index.js';
import { Copy, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { TOOLS } from '../../../../app/model/knitgridModel.js';

export function EditorToolRail({ editor }) {
  const {
    tool,
    setTool,
    mirrorGrid,
    rotateGrid,
    copyRepeat,
    clearProgressMarks,
    progressMarks,
    mode
  } = editor;

  if (mode === 'preview') {
    return (
      <aside className="tool-rail mode-rail" aria-label="미리보기 모드">
        <div>
          <Eye size={20} aria-hidden="true" />
          <span>보기</span>
        </div>
      </aside>
    );
  }

  return (
    <ToolRail
      items={TOOLS}
      value={tool}
      onSelect={(id) => id === 'mirror' ? mirrorGrid() : setTool(id)}
      ariaLabel="편집 도구"
    >
      <button onClick={rotateGrid} title="회전">
        <RotateCcw size={20} />
        <span>회전</span>
      </button>
      <button onClick={copyRepeat} title="반복 복제">
        <Copy size={20} />
        <span>반복</span>
      </button>
      {mode === 'progress' ? (
        <button
          onClick={clearProgressMarks}
          disabled={!progressMarks.size}
          title="진행 체크 전체 지우기"
        >
          <Trash2 size={20} />
          <span>전체 지우기</span>
        </button>
      ) : null}
    </ToolRail>
  );
}
