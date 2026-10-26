import { StitchGlyph } from "../StitchGlyph.jsx";

// 진행 모드: 현재 행을 색상 run 단위로 요약한 가로 스트립. 현재 코가 속한 run을 강조.
// 대바늘 도안이면(analysis.stitchRuns) 색 대신 기법 순서를 보여준다.
export function ProgressRowStrip({ analysis, progressRow, progressStitch }) {
  const { runs, arrow, totalStitches, stitchRuns } = analysis;
  const unit = stitchRuns ? "단" : "행";
  return (
    <div className='progress-strip' aria-label={`${progressRow}${unit} 코 구성`}>
      <div className='progress-strip-lead'>
        <strong>
          {progressRow}
          {unit}
        </strong>
        <span
          className='progress-strip-arrow'
          title={analysis.ltr ? "왼쪽→오른쪽" : "오른쪽→왼쪽"}
        >
          {arrow}
        </span>
        <span className='progress-strip-count'>
          {progressStitch} / {totalStitches}코
        </span>
      </div>
      <div className='progress-strip-runs'>
        {stitchRuns?.map((run, index) => {
          const active =
            progressStitch >= run.startOrdinal &&
            progressStitch <= run.endOrdinal;
          return (
            <span
              key={index}
              className={`progress-strip-run ${active ? "active" : ""}`}
              title={`${run.label} ${run.count} (${run.startOrdinal}~${run.endOrdinal}번째 칸)`}
            >
              <StitchGlyph id={run.id} size={14} />
              <span className='progress-strip-label'>{run.label}</span>
              {run.count > 1 ? (
                <span className='progress-strip-mult'>×{run.count}</span>
              ) : null}
            </span>
          );
        })}
        {stitchRuns ? null : runs.map((run, index) => {
          const active =
            progressStitch >= run.startOrdinal &&
            progressStitch <= run.endOrdinal;
          return (
            <span
              key={index}
              className={`progress-strip-run ${run.empty ? "empty" : ""} ${active ? "active" : ""}`}
              title={`${run.empty ? "빈칸" : `${run.code} ${run.name}`.trim()} ${run.count}코 (${run.startOrdinal}~${run.endOrdinal})`}
            >
              {run.empty ? null : (
                <span
                  className='progress-strip-swatch'
                  style={{ background: run.color }}
                />
              )}
              <span className='progress-strip-label'>
                {run.empty ? "빈칸" : run.code || run.name || "색상"}
              </span>
              <span className='progress-strip-mult'>×{run.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
