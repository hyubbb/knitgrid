import { ToolRail } from 'knitgrid';
import { MousePointer2, Hand, PenLine, Eraser, PaintBucket, Pipette } from 'lucide-react';

export const Tools = () => (
  <ToolRail
    ariaLabel="편집 도구"
    items={[
      { id: 'select', label: '선택', icon: MousePointer2 },
      { id: 'pan', label: '이동', icon: Hand },
      { id: 'pen', label: '펜', icon: PenLine },
      { id: 'eraser', label: '지우개', icon: Eraser },
      { id: 'fill', label: '채우기', icon: PaintBucket },
      { id: 'picker', label: '스포이드', icon: Pipette }
    ]}
    value="pen"
    onSelect={() => {}}
  />
);
