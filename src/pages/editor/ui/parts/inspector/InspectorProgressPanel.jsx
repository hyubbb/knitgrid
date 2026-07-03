import { Chip, Panel, Toggle } from '../../../../../components/index.js';
import { CheckSquare, Minus, Plus, MonitorSmartphone } from 'lucide-react';

export function InspectorProgressPanel({ editor }) {
  const {
    rows,
    numberStart,
    rowDirection,
    progressRow,
    handleProgressRowChange,
    completedRows,
    toggleCompletedRow,
    progressStitch,
    stitchForward,
    stitchBackward,
    progressAutoAdvance,
    setProgressAutoAdvance,
    currentRowAnalysis,
    wakeLockSupported,
    wakeLockEnabled,
    setWakeLockEnabled,
    wakeLockStatus
  } = editor;

  const totalStitches = currentRowAnalysis?.totalStitches ?? 0;
  const colors = currentRowAnalysis?.colors ?? [];

  return (
    <Panel className="progress-panel" icon={CheckSquare} title="진행 모드">
      <label>
        현재 행
        <input type="range" min={numberStart} max={rows + numberStart - 1} value={progressRow} onChange={(event) => handleProgressRowChange(Number(event.target.value))} />
      </label>
      <div className="progress-readout">
        <strong>{progressRow}행</strong>
        <span>{completedRows.size}행 완료</span>
      </div>

      <div className="stitch-counter">
        <div className="stitch-counter-head">
          <span>현재 코</span>
          <strong>{progressStitch} <em>/ {totalStitches}</em></strong>
        </div>
        <div className="stitch-counter-controls">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={stitchBackward} aria-label="이전 코" title="이전 코 (← 또는 Backspace)">
            <Minus size={16} />
          </button>
          <div className="stitch-counter-bar" aria-hidden="true">
            <span style={{ width: totalStitches ? `${(progressStitch / totalStitches) * 100}%` : '0%' }} />
          </div>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={stitchForward} aria-label="다음 코" title="다음 코 (Space 또는 →)">
            <Plus size={16} />
          </button>
        </div>
        <label className="check-row">
          <Toggle
            className="stitch-auto-toggle"
            pressed={progressAutoAdvance}
            onChange={setProgressAutoAdvance}
            onMouseDown={(event) => event.preventDefault()}
            label="행 끝에서 다음 행으로 자동 이동"
          >
            {progressAutoAdvance ? '자동 이동 ON' : '자동 이동 OFF'}
          </Toggle>
          <span>행 끝에 도달하면 다음 행 첫 코로 이동</span>
        </label>
        <p className="stitch-counter-hint">Space·→ 전진 · ←·Backspace 후퇴 (입력창 포커스 시 제외)</p>
      </div>

      {colors.length ? (
        <div className="progress-colors">
          <span className="progress-colors-title">이 행에 쓰는 색</span>
          <ul>
            {colors.map((color, index) => (
              <li key={index} className={color.empty ? 'empty' : ''}>
                {color.empty ? <span className="progress-colors-swatch empty" /> : <span className="progress-colors-swatch" style={{ background: color.color }} />}
                <span className="progress-colors-label">{color.empty ? '빈칸' : `${color.code} ${color.name}`.trim() || '색상'}</span>
                <span className="progress-colors-count">{color.count}코</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {wakeLockSupported ? (
        <label className="check-row wake-lock-row">
          <Toggle
            className="wake-lock-toggle"
            pressed={wakeLockEnabled}
            onChange={setWakeLockEnabled}
            onMouseDown={(event) => event.preventDefault()}
            icon={MonitorSmartphone}
            label="화면 꺼짐 방지"
          >
            {wakeLockEnabled ? (wakeLockStatus === 'active' ? '화면 유지 ON' : '켜는 중…') : '화면 유지 OFF'}
          </Toggle>
          <span>진행 중 화면이 꺼지지 않게 유지{wakeLockStatus === 'error' ? ' (요청 실패)' : ''}</span>
        </label>
      ) : (
        <p className="stitch-counter-hint wake-lock-unsupported">이 브라우저는 화면 꺼짐 방지를 지원하지 않습니다.</p>
      )}

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
                handleProgressRowChange(row);
                toggleCompletedRow(row);
              }}
            />
          );
        })}
      </div>
    </Panel>
  );
}
