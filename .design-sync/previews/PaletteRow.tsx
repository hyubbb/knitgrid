import { PaletteRow } from 'knitgrid';

const palette = [
  { id: 'h7', code: 'H7', name: '검정', color: '#1d2329' },
  { id: 'e15', code: 'E15', name: '분홍', color: '#ef7897' },
  { id: 'b4', code: 'B4', name: '하늘', color: '#6fb7dc' }
];

const noop = () => {};
const handlers = {
  onActivate: noop,
  onToggleExpand: noop,
  onExpand: noop,
  onToggleVisibility: noop,
  onUpdate: noop,
  onMerge: noop,
  onDelete: noop,
  normalizeHex: (v: string) => v
};

export const List = () => (
  <div className="palette-list">
    <PaletteRow item={palette[0]} visible active={false} expanded={false} count={271} palette={palette} canDelete {...handlers} />
    <PaletteRow item={palette[1]} visible active expanded={false} count={64} palette={palette} canDelete {...handlers} />
    <PaletteRow item={palette[2]} visible={false} active={false} expanded={false} count={0} palette={palette} canDelete {...handlers} />
  </div>
);
