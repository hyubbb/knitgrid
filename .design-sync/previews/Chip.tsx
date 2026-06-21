import { Chip } from 'knitgrid';

export const RowChips = () => (
  <div className="row-chips">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
      <Chip key={n} label={n} done={n <= 3} current={n === 4} onClick={() => {}} />
    ))}
  </div>
);
