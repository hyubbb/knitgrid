import { SegmentedControl } from 'knitgrid';
import { PenLine, Eye, Rows3 } from 'lucide-react';

export const ModeTabs = () => (
  <SegmentedControl
    className="mode-tabs"
    ariaLabel="작업 모드"
    items={[
      { id: 'edit', label: 'Edit', icon: PenLine },
      { id: 'preview', label: 'Preview', icon: Eye },
      { id: 'progress', label: 'Progress', icon: Rows3 }
    ]}
    value="edit"
    onChange={() => {}}
  />
);

export const DisplayTabs = () => (
  <SegmentedControl
    as="div"
    className="display-tabs"
    items={[
      { id: 'color-code', label: '색상 + 코드' },
      { id: 'color', label: '색상만' },
      { id: 'code', label: '코드만' }
    ]}
    value="color-code"
    onChange={() => {}}
  />
);
