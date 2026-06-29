import { Chip, Panel } from '../../../../../components/index.js';
import { CheckSquare } from 'lucide-react';

export function InspectorProgressPanel({ editor }) {
  const {
    rows,
    numberStart,
    rowDirection,
    progressRow,
    setProgressRow,
    completedRows,
    toggleCompletedRow
  } = editor;

  return (
    <Panel className="progress-panel" icon={CheckSquare} title="진행 모드">
      <label>
        현재 행
        <input type="range" min={numberStart} max={rows + numberStart - 1} value={progressRow} onChange={(event) => setProgressRow(Number(event.target.value))} />
      </label>
      <div className="progress-readout">
        <strong>{progressRow}행</strong>
        <span>{completedRows.size}행 완료</span>
      </div>
      <div className="row-chips">
        {Array.from({ length: Math.min(rows, 36) }, (_, index) => {
          const row = rowDirection === 'bottom-up' ? index + numberStart : rows - index - 1 + numberStart;
          return (
            <Chip
              key={row}
              label={row}
              done={completedRows.has(row)}
              current={progressRow === row}
              onClick={() => {
                setProgressRow(row);
                toggleCompletedRow(row);
              }}
            />
          );
        })}
      </div>
    </Panel>
  );
}
