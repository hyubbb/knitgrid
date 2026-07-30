import { memo } from "react";
import { luminance, resolveCellDisplay } from "../../../../../app/model/knitgridModel.js";

// grid/palette가 안 바뀌면 무관한 상태 변화(줌·저장 상태 등)에 리렌더를 스킵한다.
// 콜백(onPointerDown/Enter)은 훅에서 useCallback으로 안정화돼 있어야 얕은 비교가 통과한다.
export const Cell = memo(function Cell({
  r,
  c,
  cell,
  palette,
  displayMode,
  guideRow,
  guideCol,
  progress,
  completed,
  progressMark,
  stitchHere,
  isInsertAnchor,
  selected,
  readOnly,
  isPanTool,
  onPointerDown,
  onPointerEnter,
  rowLabel,
  colLabel,
}) {
  const display = resolveCellDisplay(cell, palette);
  const shouldShowCell = cell.active && display.visible;
  const CellElement = readOnly || isPanTool ? "div" : "button";
  const interactive = !(readOnly || isPanTool);

  return (
    <CellElement
      className={`cell ${cell.active ? "filled" : ""} ${isInsertAnchor ? "insert-anchor" : ""} ${selected ? "region-selected" : ""} ${!display.visible ? "palette-hidden" : ""} ${guideRow ? "guide-row" : ""} ${guideCol ? "guide-col" : ""} ${progress ? "progress-row" : ""} ${completed ? "completed-row" : ""} ${progressMark ? "progress-note" : ""} ${stitchHere ? "progress-stitch" : ""}`}
      data-row={r}
      data-col={c}
      style={{
        background:
          shouldShowCell && displayMode !== "code" ? display.color : "#fff",
      }}
      title={`${rowLabel}행 ${colLabel}열 ${shouldShowCell ? display.symbol || "빈 칸" : `${display.symbol || "색상"} 숨김`}`}
      {...(interactive
        ? {
            onPointerDown: () => onPointerDown(r, c),
            onPointerEnter: () => onPointerEnter(r, c),
          }
        : { role: "gridcell" })}
    >
      {shouldShowCell && displayMode !== "color" ? (
        <span
          style={{
            color:
              displayMode === "code" || luminance(display.color) > 0.55
                ? "#172033"
                : "#fff",
          }}
        >
          {display.symbol}
        </span>
      ) : null}
    </CellElement>
  );
});
