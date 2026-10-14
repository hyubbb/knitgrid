import { Cell } from "./Cell.jsx";
import { HeaderRow, HeaderColumn } from "./GridHeaders.jsx";

export function ChartGrid({
  editor,
  cellSize,
  canEditSourceOverlay,
  includeSourceOverlay = true,
  cellWScale = 1,
  cellHScale = 1,
  isPanTool = false,
  readOnly = false,
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
    isAdjustingAppliedSourceOverlay,
    selectionRect,
  } = editor;
  const showSourceOverlay =
    includeSourceOverlay && appliedSourceImage && showAppliedSourceOverlay;

  return (
    <div
      className={`chart-grid mode-${mode}`}
      style={{
        "--rows": rows,
        "--cols": cols,
        "--cell": `${cellSize}px`,
        "--cell-w": `${cellSize * cellWScale}px`,
        "--cell-h": `${cellSize * cellHScale}px`,
        "--guide-color": guideLineColor,
        "--grid-line": gridLineColor || undefined,
      }}
    >
      {showSourceOverlay ? (
        <div
          className={`applied-source-overlay ${canEditSourceOverlay && isAdjustingAppliedSourceOverlay ? "adjusting" : ""}`}
          aria-hidden="true"
          style={{
            opacity: appliedSourceOverlayOpacity / 100,
            transform: appliedSourceTransformCss,
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
              objectFit:
                appliedSourceImage.imageOptions.fit === "stretch"
                  ? "fill"
                  : appliedSourceImage.imageOptions.fit,
              objectPosition: `${appliedSourceImage.imageOptions.alignX === "left" ? 0 : appliedSourceImage.imageOptions.alignX === "right" ? 100 : 50}% ${appliedSourceImage.imageOptions.alignY === "top" ? 0 : appliedSourceImage.imageOptions.alignY === "bottom" ? 100 : 50}%`,
            }}
          />
        </div>
      ) : null}
      <div className="corner top-left" />
      <HeaderRow
        cols={cols}
        colNumber={colNumber}
        area="top"
        cellWidth={cellSize * cellWScale}
      />
      <div className="corner top-right" />
      <HeaderColumn
        rows={rows}
        rowNumber={rowNumber}
        area="left"
        cellHeight={cellSize * cellHScale}
        completedRows={completedRows}
        showCompleted={mode === "progress"}
      />
      <div
        className="cells"
        style={{
          gridTemplateColumns: `repeat(${cols}, var(--cell-w, var(--cell)))`,
        }}
      >
        {grid.map((row, r) => {
          const rowLabel = rowNumber(r);
          const guideRow =
            guideEvery > 0 &&
            (rowDirection === "bottom-up"
              ? r < rows - 1 && (rows - 1 - r) % guideEvery === 0
              : (r + 1) % guideEvery === 0);
          const progress = mode === "progress" && rowLabel === progressRow;
          const completed = mode === "progress" && completedRows.has(rowLabel);
          return row.map((cell, c) => {
            const guideCol = guideEvery > 0 && (c + 1) % guideEvery === 0;
            const progressMark =
              mode === "progress" && progressMarks.has(`${r}:${c}`);
            const stitchHere =
              mode === "progress" &&
              !!progressStitchCell &&
              progressStitchCell.row === r &&
              progressStitchCell.col === c;
            const isInsertAnchor =
              mode === "edit" &&
              insertAnchorCell.row === r &&
              insertAnchorCell.col === c;
            const selected =
              mode === "edit" &&
              !!selectionRect &&
              r >= selectionRect.r0 &&
              r <= selectionRect.r1 &&
              c >= selectionRect.c0 &&
              c <= selectionRect.c1;

            return (
              <Cell
                key={`${r}-${c}`}
                r={r}
                c={c}
                cell={cell}
                palette={palette}
                displayMode={displayMode}
                guideRow={guideRow}
                guideCol={guideCol}
                progress={progress}
                completed={completed}
                progressMark={progressMark}
                stitchHere={stitchHere}
                isInsertAnchor={isInsertAnchor}
                selected={selected}
                readOnly={readOnly}
                isPanTool={isPanTool}
                onPointerDown={handlePointerDown}
                onPointerEnter={handlePointerEnter}
                rowLabel={rowLabel}
                colLabel={colNumber(c)}
              />
            );
          });
        })}
      </div>
      {showOppositeHeaders ? (
        <HeaderColumn
          rows={rows}
          rowNumber={rowNumber}
          area="right"
          cellHeight={cellSize * cellHScale}
          completedRows={completedRows}
          showCompleted={mode === "progress"}
        />
      ) : (
        <div />
      )}
      {showOppositeHeaders ? <div className="corner bottom-left" /> : <div />}
      {showOppositeHeaders ? (
        <HeaderRow
          cols={cols}
          colNumber={colNumber}
          area="bottom"
          cellWidth={cellSize * cellWScale}
        />
      ) : (
        <div />
      )}
      {showOppositeHeaders ? <div className="corner bottom-right" /> : <div />}
    </div>
  );
}
