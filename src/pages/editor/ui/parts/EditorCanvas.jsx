import { Slider, Toolbar } from '../../../../components/index.js';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  X,
  Eye,
  Hand,
  Maximize2,
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  clampFiniteNumber,
  luminance,
  resolveCellDisplay
} from '../../../../app/model/knitgridModel.js';

const CANVAS_BASE_CELL_SIZE = 24;
const CANVAS_MIN_ZOOM = 4;
const CANVAS_MAX_ZOOM = 132;
const CHART_FIXED_WIDTH = 76;
const CHART_FIXED_HEIGHT = 64;
const FULLSCREEN_MAX_CELL_SIZE = 34;
const FULLSCREEN_MIN_CELL_SIZE = 2;

export function EditorCanvas({ editor }) {
  const {
    rows,
    cols,
    grid,
    palette,
    mode,
    displayMode,
    zoom,
    setZoom,
    guideEvery,
    rowDirection,
    gridScrollRef,
    appliedSourceImage,
    appliedSourceSizeChanged,
    showAppliedSourceOverlay,
    setShowAppliedSourceOverlay,
    appliedSourceOverlayOpacity,
    setAppliedSourceOverlayOpacity,
    isAdjustingAppliedSourceOverlay,
    setIsAdjustingAppliedSourceOverlay,
    appliedSourceOverlayMoveStep,
    setAppliedSourceOverlayMoveStep,
    appliedSourceOverlayTransform,
    appliedSourceTransformCss,
    guideLineColor,
    gridLineColor,
    updateAppliedSourceOverlayTransform,
    moveAppliedSourceOverlay,
    resetAppliedSourceOverlayTransform,
    clearAppliedSourceImage,
    handleAppliedSourceOverlayPointerDown,
    handleAppliedSourceOverlayPointerMove,
    handleAppliedSourceOverlayPointerUp,
    showOppositeHeaders,
    completedRows,
    progressRow,
    progressMarks,
    progressStitch,
    currentRowAnalysis,
    insertAnchorCell,
    rowNumber,
    colNumber,
    handlePointerDown,
    handlePointerEnter
  } = editor;
  const canEditSourceOverlay = mode === 'edit';
  const canFitWholePreview = mode === 'preview';
  const { w: cellWScale, h: cellHScale } = editor.cellAspectScale;
  // 종횡비가 켜지면 확대되는 축을 기준으로 기준 셀을 줄여 전체보기가 화면에 담기도록 한다.
  const cellAspectMaxScale = Math.max(cellWScale, cellHScale);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [fullscreenCellSize, setFullscreenCellSize] = useState(() => getFullscreenPreviewCellSize(rows, cols));
  const fullscreenCloseButtonRef = useRef(null);

  const openFullscreenPreview = () => {
    setFullscreenCellSize(getFullscreenPreviewCellSize(rows, cols, cellAspectMaxScale));
    setIsFullscreenPreviewOpen(true);
  };

  useEffect(() => {
    if (!isFullscreenPreviewOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const updateFullscreenCellSize = () => setFullscreenCellSize(getFullscreenPreviewCellSize(rows, cols, cellAspectMaxScale));
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsFullscreenPreviewOpen(false);
    };
    const focusFrame = requestAnimationFrame(() => fullscreenCloseButtonRef.current?.focus());

    document.body.style.overflow = 'hidden';
    updateFullscreenCellSize();
    window.addEventListener('resize', updateFullscreenCellSize);
    window.addEventListener('keydown', closeOnEscape);
    window.visualViewport?.addEventListener('resize', updateFullscreenCellSize);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', updateFullscreenCellSize);
      window.removeEventListener('keydown', closeOnEscape);
      window.visualViewport?.removeEventListener('resize', updateFullscreenCellSize);
    };
  }, [isFullscreenPreviewOpen, rows, cols, cellAspectMaxScale]);

  return (
    <main className="workspace">
      <section className="canvas-panel">
        <Toolbar className="canvas-toolbar">
          <div>
            <strong>{cols} x {rows}</strong>
            <span>{guideEvery > 0 ? `${guideEvery}칸 보조선` : '보조선 없음'} · 최대 200 x 200</span>
          </div>
          <div className="canvas-zoom-actions">
            <Slider min={CANVAS_MIN_ZOOM} max={CANVAS_MAX_ZOOM} value={zoom} onChange={setZoom} leftIcon={ZoomOut} rightIcon={ZoomIn} valueLabel={`${zoom}%`} />
            {canFitWholePreview ? (
              <button
                className="canvas-fit-button"
                type="button"
                onClick={openFullscreenPreview}
                title="전체 화면에서 도안 보기"
                aria-label="미리보기 전체보기"
              >
                <Maximize2 size={14} />
                전체보기
              </button>
            ) : null}
          </div>
          <div className="source-overlay-control">
            <button
              className={showAppliedSourceOverlay ? 'active' : ''}
              onClick={() => {
                setShowAppliedSourceOverlay((value) => {
                  if (value) setIsAdjustingAppliedSourceOverlay(false);
                  return !value;
                });
              }}
              disabled={!appliedSourceImage}
              title={appliedSourceImage ? `${appliedSourceImage.name} 원본 보기` : '적용된 원본 이미지 없음'}
            >
              <Eye size={14} />
              원본 보기
            </button>
            {canEditSourceOverlay ? (
              <button
                className={isAdjustingAppliedSourceOverlay ? 'active' : ''}
                onClick={() => setIsAdjustingAppliedSourceOverlay((value) => !value)}
                disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                title="원본 위치와 크기 조정"
              >
                <Hand size={14} />
                원본 조정
              </button>
            ) : null}
            <label>
              <span>투명도</span>
              <input
                type="range"
                min="15"
                max="85"
                value={appliedSourceOverlayOpacity}
                disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                onChange={(event) => setAppliedSourceOverlayOpacity(Number(event.target.value))}
                aria-label="편집 화면 원본 투명도"
              />
            </label>
            {canEditSourceOverlay ? (
              <>
                <div className="source-overlay-scale-mode" aria-label="원본 크기 조정 방식">
                  <button
                    className={appliedSourceOverlayTransform.scaleMode === 'uniform' ? 'active' : ''}
                    onClick={() => updateAppliedSourceOverlayTransform({ scaleMode: 'uniform' })}
                    disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                  >
                    균일
                  </button>
                  <button
                    className={appliedSourceOverlayTransform.scaleMode === 'free' ? 'active' : ''}
                    onClick={() => updateAppliedSourceOverlayTransform({ scaleMode: 'free' })}
                    disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                  >
                    가로/세로
                  </button>
                </div>
                {appliedSourceOverlayTransform.scaleMode === 'uniform' ? (
                  <label>
                    <span>크기</span>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="1"
                      value={appliedSourceOverlayTransform.scale}
                      disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                      onChange={(event) => updateAppliedSourceOverlayTransform({ scale: event.target.value })}
                      aria-label="원본 균일 크기"
                    />
                  </label>
                ) : (
                  <>
                    <label>
                      <span>가로</span>
                      <input
                        type="range"
                        min="50"
                        max="250"
                        step="1"
                        value={appliedSourceOverlayTransform.scaleX}
                        disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                        onChange={(event) => updateAppliedSourceOverlayTransform({ scaleX: event.target.value })}
                        aria-label="원본 가로 크기"
                      />
                    </label>
                    <label>
                      <span>세로</span>
                      <input
                        type="range"
                        min="50"
                        max="250"
                        step="1"
                        value={appliedSourceOverlayTransform.scaleY}
                        disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                        onChange={(event) => updateAppliedSourceOverlayTransform({ scaleY: event.target.value })}
                        aria-label="원본 세로 크기"
                      />
                    </label>
                  </>
                )}
                <div className="source-overlay-stepper">
                  <label>
                    <span>이동</span>
                    <input
                      type="number"
                      min="0.1"
                      max="200"
                      step="0.1"
                      value={appliedSourceOverlayMoveStep}
                      disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                      onChange={(event) => setAppliedSourceOverlayMoveStep(clampFiniteNumber(event.target.value, 0.1, 200))}
                      aria-label="원본 이동 칸 수"
                    />
                  </label>
                  <div className="source-overlay-move-pad" aria-label="원본 이동">
                    <button onClick={() => moveAppliedSourceOverlay(0, -1)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 위로 이동" aria-label="원본 위로 이동">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => moveAppliedSourceOverlay(-1, 0)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 왼쪽으로 이동" aria-label="원본 왼쪽으로 이동">
                      <ArrowLeft size={13} />
                    </button>
                    <button onClick={() => moveAppliedSourceOverlay(1, 0)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 오른쪽으로 이동" aria-label="원본 오른쪽으로 이동">
                      <ArrowRight size={13} />
                    </button>
                    <button onClick={() => moveAppliedSourceOverlay(0, 1)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 아래로 이동" aria-label="원본 아래로 이동">
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
                <button
                  className="icon-only reset"
                  onClick={resetAppliedSourceOverlayTransform}
                  disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                  title="정렬 초기화"
                  aria-label="정렬 초기화"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  className="icon-only"
                  onClick={clearAppliedSourceImage}
                  disabled={!appliedSourceImage}
                  title="원본 제거"
                  aria-label="원본 제거"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : null}
          </div>
        </Toolbar>
        {appliedSourceImage && appliedSourceSizeChanged ? (
          <div className="source-overlay-note">
            원본은 {appliedSourceImage.cols} x {appliedSourceImage.rows}칸 적용 당시 기준입니다.
          </div>
        ) : null}

        {mode === 'progress' && currentRowAnalysis ? (
          <ProgressRowStrip analysis={currentRowAnalysis} progressRow={progressRow} progressStitch={progressStitch} />
        ) : null}

        <div ref={gridScrollRef} className={`grid-scroll mode-${mode}`}>
          <ChartGrid
            editor={editor}
            cellSize={Math.round((zoom / 100) * CANVAS_BASE_CELL_SIZE)}
            canEditSourceOverlay={canEditSourceOverlay}
            cellWScale={cellWScale}
            cellHScale={cellHScale}
          />
        </div>
      </section>
      {isFullscreenPreviewOpen ? (
        <div
          className="preview-fullscreen-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-fullscreen-title"
        >
          <div className="preview-fullscreen-modal">
            <header className="preview-fullscreen-header">
              <div>
                <strong id="preview-fullscreen-title">전체보기</strong>
                <span>{cols} x {rows} 도안을 화면에 맞춰 표시합니다.</span>
              </div>
              <button
                ref={fullscreenCloseButtonRef}
                type="button"
                onClick={() => setIsFullscreenPreviewOpen(false)}
                aria-label="전체보기 닫기"
                title="닫기"
              >
                <X size={18} />
              </button>
            </header>
            <div className="preview-fullscreen-stage">
              <ChartGrid
                editor={editor}
                cellSize={fullscreenCellSize}
                canEditSourceOverlay={false}
                includeSourceOverlay={false}
                cellWScale={cellWScale}
                cellHScale={cellHScale}
                readOnly
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getFullscreenPreviewCellSize(rows, cols, maxScale = 1) {
  if (typeof window === 'undefined' || rows <= 0 || cols <= 0) return 8;

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const compactViewport = viewportWidth < 520;
  const overlayPaddingX = compactViewport ? 24 : 48;
  const overlayReservedHeight = compactViewport ? 92 : 112;
  const availableWidth = Math.max(1, viewportWidth - overlayPaddingX - CHART_FIXED_WIDTH);
  const availableHeight = Math.max(1, viewportHeight - overlayReservedHeight - CHART_FIXED_HEIGHT);
  // 종횡비 확대분(maxScale)을 미리 나눠 확대된 축도 화면 안에 들어오게 한다.
  const scaledCols = cols * maxScale;
  const scaledRows = rows * maxScale;
  const fitCellSize = Math.floor(Math.min(availableWidth / scaledCols, availableHeight / scaledRows));

  return Math.min(FULLSCREEN_MAX_CELL_SIZE, Math.max(FULLSCREEN_MIN_CELL_SIZE, fitCellSize));
}

function ChartGrid({
  editor,
  cellSize,
  canEditSourceOverlay,
  includeSourceOverlay = true,
  cellWScale = 1,
  cellHScale = 1,
  readOnly = false
}) {
  const {
    rows,
    cols,
    grid,
    palette,
    mode,
    displayMode,
    guideEvery,
    rowDirection,
    appliedSourceImage,
    showAppliedSourceOverlay,
    appliedSourceOverlayOpacity,
    appliedSourceOverlayTransform,
    appliedSourceTransformCss,
    handleAppliedSourceOverlayPointerDown,
    handleAppliedSourceOverlayPointerMove,
    handleAppliedSourceOverlayPointerUp,
    showOppositeHeaders,
    completedRows,
    progressRow,
    progressMarks,
    progressStitchCell,
    insertAnchorCell,
    rowNumber,
    colNumber,
    handlePointerDown,
    handlePointerEnter,
    guideLineColor,
    gridLineColor,
    isAdjustingAppliedSourceOverlay
  } = editor;
  const CellElement = readOnly ? 'div' : 'button';
  const showSourceOverlay = includeSourceOverlay && appliedSourceImage && showAppliedSourceOverlay;

  return (
    <div
      className={`chart-grid mode-${mode}`}
      style={{
        '--rows': rows,
        '--cols': cols,
        '--cell': `${cellSize}px`,
        '--cell-w': `${cellSize * cellWScale}px`,
        '--cell-h': `${cellSize * cellHScale}px`,
        '--guide-color': guideLineColor,
        '--grid-line': gridLineColor || undefined
      }}
    >
      {showSourceOverlay ? (
        <div
          className={`applied-source-overlay ${canEditSourceOverlay && isAdjustingAppliedSourceOverlay ? 'adjusting' : ''}`}
          aria-hidden="true"
          style={{
            opacity: appliedSourceOverlayOpacity / 100,
            transform: appliedSourceTransformCss
          }}
          onPointerDown={handleAppliedSourceOverlayPointerDown}
          onPointerMove={handleAppliedSourceOverlayPointerMove}
          onPointerUp={handleAppliedSourceOverlayPointerUp}
          onPointerCancel={handleAppliedSourceOverlayPointerUp}
        >
          <img
            src={appliedSourceImage.src}
            alt=""
            style={{
              objectFit: appliedSourceImage.imageOptions.fit === 'stretch' ? 'fill' : appliedSourceImage.imageOptions.fit,
              objectPosition: `${appliedSourceImage.imageOptions.alignX === 'left' ? 0 : appliedSourceImage.imageOptions.alignX === 'right' ? 100 : 50}% ${appliedSourceImage.imageOptions.alignY === 'top' ? 0 : appliedSourceImage.imageOptions.alignY === 'bottom' ? 100 : 50}%`
            }}
          />
        </div>
      ) : null}
      <div className="corner top-left" />
      <HeaderRow cols={cols} colNumber={colNumber} area="top" />
      <div className="corner top-right" />
      <HeaderColumn rows={rows} rowNumber={rowNumber} area="left" completedRows={completedRows} showCompleted={mode === 'progress'} />
      <div className="cells" style={{ gridTemplateColumns: `repeat(${cols}, var(--cell-w, var(--cell)))` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const actualRowNumber = rowNumber(r);
            const guideRow = guideEvery > 0 && (rowDirection === 'bottom-up'
              ? r < rows - 1 && (rows - 1 - r) % guideEvery === 0
              : (r + 1) % guideEvery === 0);
            const guideCol = guideEvery > 0 && (c + 1) % guideEvery === 0;
            const progress = mode === 'progress' && actualRowNumber === progressRow;
            const completed = mode === 'progress' && completedRows.has(actualRowNumber);
            const progressMark = mode === 'progress' && progressMarks.has(`${r}:${c}`);
            const stitchHere = mode === 'progress' && progressStitchCell && progressStitchCell.row === r && progressStitchCell.col === c;
            const display = resolveCellDisplay(cell, palette);
            const shouldShowCell = cell.active && display.visible;
            const isInsertAnchor = mode === 'edit' && insertAnchorCell.row === r && insertAnchorCell.col === c;
            const cellProps = readOnly
              ? { role: 'gridcell' }
              : {
                  onPointerDown: () => handlePointerDown(r, c),
                  onPointerEnter: () => handlePointerEnter(r, c)
                };

            return (
              <CellElement
                key={`${r}-${c}`}
                className={`cell ${cell.active ? 'filled' : ''} ${isInsertAnchor ? 'insert-anchor' : ''} ${!display.visible ? 'palette-hidden' : ''} ${guideRow ? 'guide-row' : ''} ${guideCol ? 'guide-col' : ''} ${progress ? 'progress-row' : ''} ${completed ? 'completed-row' : ''} ${progressMark ? 'progress-note' : ''} ${stitchHere ? 'progress-stitch' : ''}`}
                style={{ background: shouldShowCell && displayMode !== 'code' ? display.color : '#fff' }}
                title={`${actualRowNumber}행 ${colNumber(c)}열 ${shouldShowCell ? display.symbol || '빈 칸' : `${display.symbol || '색상'} 숨김`}`}
                {...cellProps}
              >
                {shouldShowCell && displayMode !== 'color' ? (
                  <span style={{ color: displayMode === 'code' || luminance(display.color) > 0.55 ? '#172033' : '#fff' }}>
                    {display.symbol}
                  </span>
                ) : null}
              </CellElement>
            );
          })
        )}
      </div>
      {showOppositeHeaders ? <HeaderColumn rows={rows} rowNumber={rowNumber} area="right" completedRows={completedRows} showCompleted={mode === 'progress'} /> : <div />}
      {showOppositeHeaders ? <div className="corner bottom-left" /> : <div />}
      {showOppositeHeaders ? <HeaderRow cols={cols} colNumber={colNumber} area="bottom" /> : <div />}
      {showOppositeHeaders ? <div className="corner bottom-right" /> : <div />}
    </div>
  );
}

function HeaderRow({ cols, colNumber, area }) {
  return (
    <div className={`header-row ${area}`} style={{ gridTemplateColumns: `repeat(${cols}, var(--cell-w, var(--cell)))` }}>
      {Array.from({ length: cols }, (_, index) => (
        <div key={index}>{colNumber(index)}</div>
      ))}
    </div>
  );
}

// 진행 모드: 현재 행을 색상 run 단위로 요약한 가로 스트립. 현재 코가 속한 run을 강조.
function ProgressRowStrip({ analysis, progressRow, progressStitch }) {
  const { runs, arrow, totalStitches } = analysis;
  return (
    <div className="progress-strip" aria-label={`${progressRow}행 코 구성`}>
      <div className="progress-strip-lead">
        <strong>{progressRow}행</strong>
        <span className="progress-strip-arrow" title={analysis.ltr ? '왼쪽→오른쪽' : '오른쪽→왼쪽'}>{arrow}</span>
        <span className="progress-strip-count">{progressStitch} / {totalStitches}코</span>
      </div>
      <div className="progress-strip-runs">
        {runs.map((run, index) => {
          const active = progressStitch >= run.startOrdinal && progressStitch <= run.endOrdinal;
          return (
            <span
              key={index}
              className={`progress-strip-run ${run.empty ? 'empty' : ''} ${active ? 'active' : ''}`}
              title={`${run.empty ? '빈칸' : `${run.code} ${run.name}`.trim()} ${run.count}코 (${run.startOrdinal}~${run.endOrdinal})`}
            >
              {run.empty ? null : <span className="progress-strip-swatch" style={{ background: run.color }} />}
              <span className="progress-strip-label">{run.empty ? '빈칸' : run.code || run.name || '색상'}</span>
              <span className="progress-strip-mult">×{run.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HeaderColumn({ rows, rowNumber, area, completedRows, showCompleted }) {
  return (
    <div className={`header-column ${area}`}>
      {Array.from({ length: rows }, (_, index) => {
        const number = rowNumber(index);
        return (
          <div key={index} className={showCompleted && completedRows.has(number) ? 'done' : ''}>
            {number}
          </div>
        );
      })}
    </div>
  );
}
