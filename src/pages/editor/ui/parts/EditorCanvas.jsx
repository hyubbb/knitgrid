import { Slider, Toolbar } from '../../../../components/index.js';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Eye,
  Hand,
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
    insertAnchorCell,
    rowNumber,
    colNumber,
    handlePointerDown,
    handlePointerEnter
  } = editor;

  return (
    <main className="workspace">
      <section className="canvas-panel">
        <Toolbar className="canvas-toolbar">
          <div>
            <strong>{cols} x {rows}</strong>
            <span>{guideEvery > 0 ? `${guideEvery}칸 보조선` : '보조선 없음'} · 최대 200 x 200</span>
          </div>
          <Slider min={46} max={132} value={zoom} onChange={setZoom} leftIcon={ZoomOut} rightIcon={ZoomIn} valueLabel={`${zoom}%`} />
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
            <button
              className={isAdjustingAppliedSourceOverlay ? 'active' : ''}
              onClick={() => setIsAdjustingAppliedSourceOverlay((value) => !value)}
              disabled={!appliedSourceImage || !showAppliedSourceOverlay}
              title="원본 위치와 크기 조정"
            >
              <Hand size={14} />
              원본 조정
            </button>
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
          </div>
        </Toolbar>
        {appliedSourceImage && appliedSourceSizeChanged ? (
          <div className="source-overlay-note">
            원본은 {appliedSourceImage.cols} x {appliedSourceImage.rows}칸 적용 당시 기준입니다.
          </div>
        ) : null}

        <div ref={gridScrollRef} className={`grid-scroll mode-${mode}`}>
          <div
            className="chart-grid"
            style={{
              '--rows': rows,
              '--cols': cols,
              '--cell': `${Math.round((zoom / 100) * 24)}px`,
              '--guide-color': guideLineColor,
              '--grid-line': gridLineColor || undefined
            }}
          >
            {appliedSourceImage && showAppliedSourceOverlay ? (
              <div
                className={`applied-source-overlay ${isAdjustingAppliedSourceOverlay ? 'adjusting' : ''}`}
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
            <HeaderColumn rows={rows} rowNumber={rowNumber} area="left" completedRows={completedRows} />
            <div className="cells" style={{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }}>
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const actualRowNumber = rowNumber(r);
                  const guideRow = guideEvery > 0 && (rowDirection === 'bottom-up'
                    ? r < rows - 1 && (rows - 1 - r) % guideEvery === 0
                    : (r + 1) % guideEvery === 0);
                  const guideCol = guideEvery > 0 && (c + 1) % guideEvery === 0;
                  const progress = mode === 'progress' && actualRowNumber === progressRow;
                  const completed = mode === 'progress' && completedRows.has(actualRowNumber);
                  const display = resolveCellDisplay(cell, palette);
                  const shouldShowCell = cell.active && display.visible;
                  const isInsertAnchor = insertAnchorCell.row === r && insertAnchorCell.col === c;
                  return (
                    <button
                      key={`${r}-${c}`}
                      className={`cell ${cell.active ? 'filled' : ''} ${isInsertAnchor ? 'insert-anchor' : ''} ${!display.visible ? 'palette-hidden' : ''} ${guideRow ? 'guide-row' : ''} ${guideCol ? 'guide-col' : ''} ${progress ? 'progress-row' : ''} ${completed ? 'completed-row' : ''}`}
                      style={{ background: shouldShowCell && displayMode !== 'code' ? display.color : '#fff' }}
                      onPointerDown={() => handlePointerDown(r, c)}
                      onPointerEnter={() => handlePointerEnter(r, c)}
                      title={`${actualRowNumber}행 ${colNumber(c)}열 ${shouldShowCell ? display.symbol || '빈 칸' : `${display.symbol || '색상'} 숨김`}`}
                    >
                      {shouldShowCell && displayMode !== 'color' ? (
                        <span style={{ color: displayMode === 'code' || luminance(display.color) > 0.55 ? '#172033' : '#fff' }}>
                          {display.symbol}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            {showOppositeHeaders ? <HeaderColumn rows={rows} rowNumber={rowNumber} area="right" completedRows={completedRows} /> : <div />}
            {showOppositeHeaders ? <div className="corner bottom-left" /> : <div />}
            {showOppositeHeaders ? <HeaderRow cols={cols} colNumber={colNumber} area="bottom" /> : <div />}
            {showOppositeHeaders ? <div className="corner bottom-right" /> : <div />}
          </div>
        </div>
      </section>
    </main>
  );
}

function HeaderRow({ cols, colNumber, area }) {
  return (
    <div className={`header-row ${area}`} style={{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }}>
      {Array.from({ length: cols }, (_, index) => (
        <div key={index}>{colNumber(index)}</div>
      ))}
    </div>
  );
}

function HeaderColumn({ rows, rowNumber, area, completedRows }) {
  return (
    <div className={`header-column ${area}`}>
      {Array.from({ length: rows }, (_, index) => {
        const number = rowNumber(index);
        return (
          <div key={index} className={completedRows.has(number) ? 'done' : ''}>
            {number}
          </div>
        );
      })}
    </div>
  );
}
