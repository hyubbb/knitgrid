import { NumberField } from 'knitgrid';

export const GridSize = () => (
  <div className="two-cols">
    <NumberField label="가로" min={1} max={200} value={48} onChange={() => {}} />
    <NumberField label="세로" min={1} max={200} value={64} onChange={() => {}} />
  </div>
);
