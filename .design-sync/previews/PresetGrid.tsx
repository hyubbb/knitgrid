import { PresetGrid } from 'knitgrid';

export const Presets = () => (
  <PresetGrid
    presets={[
      { label: '16 x 16', rows: 16, cols: 16 },
      { label: '24 x 24', rows: 24, cols: 24 },
      { label: '32 x 32', rows: 32, cols: 32 },
      { label: '48 x 64', rows: 64, cols: 48 },
      { label: '96 x 120', rows: 120, cols: 96 }
    ]}
    rows={64}
    cols={48}
    onSelect={() => {}}
  />
);
