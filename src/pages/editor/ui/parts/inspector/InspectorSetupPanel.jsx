import {
  Button,
  MovePad,
  NumberField,
  Panel,
  PresetGrid,
  StepperControl
} from '../../../../../components/index.js';
import { Settings2, Sparkles } from 'lucide-react';
import { PRESETS, clampNumber } from '../../../../../app/model/knitgridModel.js';
import { InspectorViewControls } from './InspectorViewControls.jsx';

export function InspectorSetupPanel({ editor, action }) {
  const {
    rows,
    cols,
    draftRows,
    setDraftRows,
    draftCols,
    setDraftCols,
    requestGridResize,
    moveSteps,
    setMoveSteps,
    movePattern,
    paintedCellCount,
    insertAnchorCell,
    rowNumber,
    colNumber,
    insertRow,
    removeRow,
    insertCol,
    removeCol
  } = editor;

  return (
    <Panel className="setup-panel" icon={Settings2} title="격자 설정" action={action}>
      <PresetGrid presets={PRESETS} rows={rows} cols={cols} onSelect={requestGridResize} />
      <div className="two-cols">
        <NumberField label="가로" min={1} max={200} value={draftCols} onChange={(value) => setDraftCols(Math.min(200, value))} />
        <NumberField label="세로" min={1} max={200} value={draftRows} onChange={(value) => setDraftRows(Math.min(200, value))} />
      </div>
      <Button wide icon={Sparkles} onClick={() => requestGridResize(draftRows, draftCols)}>격자 크기 적용</Button>
      <div className="structure-panel">
        <div className="structure-title">
          <strong>도안 이동</strong>
          <label>
            <span>칸</span>
            <NumberField
              min={1}
              max={200}
              value={moveSteps}
              onChange={(value) => setMoveSteps(clampNumber(value, 1, 200))}
              ariaLabel="이동 칸 수"
            />
          </label>
        </div>
        <MovePad onMove={movePattern} centerLabel={`${paintedCellCount}칸`} disabled={!paintedCellCount} />
      </div>
      <div className="structure-panel">
        <div className="structure-title">
          <strong>행/열 추가</strong>
          <span>삽입 기준: {rowNumber(insertAnchorCell.row)}행 {colNumber(insertAnchorCell.col)}열</span>
        </div>
        <div className="insert-grid">
          <StepperControl label="위 행" onAdd={() => insertRow('above')} onRemove={() => removeRow('above')} addDisabled={rows >= 200} removeDisabled={rows <= 1 || insertAnchorCell.row === 0} addTitle="기준 위에 행 추가" removeTitle="기준 위 행 제거" />
          <StepperControl label="아래 행" onAdd={() => insertRow('below')} onRemove={() => removeRow('below')} addDisabled={rows >= 200} removeDisabled={rows <= 1 || insertAnchorCell.row >= rows - 1} addTitle="기준 아래에 행 추가" removeTitle="기준 아래 행 제거" />
          <StepperControl label="왼쪽 열" onAdd={() => insertCol('left')} onRemove={() => removeCol('left')} addDisabled={cols >= 200} removeDisabled={cols <= 1 || insertAnchorCell.col === 0} addTitle="기준 왼쪽에 열 추가" removeTitle="기준 왼쪽 열 제거" />
          <StepperControl label="오른쪽 열" onAdd={() => insertCol('right')} onRemove={() => removeCol('right')} addDisabled={cols >= 200} removeDisabled={cols <= 1 || insertAnchorCell.col >= cols - 1} addTitle="기준 오른쪽에 열 추가" removeTitle="기준 오른쪽 열 제거" />
        </div>
      </div>
      <InspectorViewControls editor={editor} showDisplayMode={false} />
    </Panel>
  );
}
