import { ToolRail } from '../../../../components/index.js';
import { Copy, RotateCcw } from 'lucide-react';
import { TOOLS } from '../../../../app/model/knitgridModel.js';

export function EditorToolRail({ editor }) {
  const {
    tool,
    setTool,
    mirrorGrid,
    rotateGrid,
    copyRepeat
  } = editor;

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
    </ToolRail>
  );
}
