import { Slider, Toolbar } from "../../../../components/index.js";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ClipboardPaste,
  Copy,
  Scissors,
  X,
  Hand,
  Maximize2,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  CANVAS_MIN_ZOOM,
  CANVAS_MAX_ZOOM,
} from "../../../../app/model/knitgridModel.js";
import { ChartGrid } from "./canvas/ChartGrid.jsx";
import { ProgressRowStrip } from "./canvas/ProgressRowStrip.jsx";
import { SourceOverlayControls } from "./canvas/SourceOverlayControls.jsx";

const CANVAS_BASE_CELL_SIZE = 24;
const CHART_FIXED_WIDTH = 76;
const CHART_FIXED_HEIGHT = 64;
const FULLSCREEN_MAX_CELL_SIZE = 34;
const FULLSCREEN_MIN_CELL_SIZE = 2;
// 이 거리 이상 움직여야 '탭'이 아닌 '드래그 그리기'로 본다.
const TOUCH_DRAG_THRESHOLD = 6;

export function EditorCanvas({ editor }) {
  const {
    rows,
    cols,
    mode,
    tool,
    setTool,
    zoom,
    setZoom,
    canvasProjectRevision,
    guideEvery,
    appliedSourceImage,
    appliedSourceSizeChanged,
    setIsAdjustingAppliedSourceOverlay,
    completedRows,
    progressRow,
    progressStitch,
    currentRowAnalysis,
    gridSelection,
    deleteSelection,
    clearSelection,
    selectionClipboard,
    copySelection,
    cutSelection,
    pasteClipboard,
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp,
  } = editor;
  const canEditSourceOverlay = mode === "edit";
  const canFitWholePreview = mode === "preview";
  const isPanTool = tool === "pan";
  // 한 손가락 드래그가 '그리기'인 화면에서만 터치 제스처를 직접 다룬다(그 외엔 브라우저 기본 스크롤).
  const usesTouchDragPaint =
    !isPanTool && (mode === "edit" || mode === "progress");
  const { w: cellWScale, h: cellHScale } = editor.cellAspectScale;
  // 종횡비가 켜지면 확대되는 축을 기준으로 기준 셀을 줄여 전체보기가 화면에 담기도록 한다.
  const cellAspectMaxScale = Math.max(cellWScale, cellHScale);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [fullscreenCellSize, setFullscreenCellSize] = useState(() =>
    getFullscreenPreviewCellSize(rows, cols),
  );
  const gridScrollRef = useRef(null);
  const fullscreenCloseButtonRef = useRef(null);
  const panDragRef = useRef(null);
  // 터치 포인터 추적: 두 손가락 = 화면 이동, 한 손가락 = 그리기/선택
  const touchPointsRef = useRef(new Map());
  const touchPanRef = useRef(null);
  const touchPaintCellRef = useRef(null);
  const touchPendingPaintRef = useRef(null);
  const touchGestureRef = useRef(null);
  const previousToolRef = useRef(tool);
  const lastAutoFitRef = useRef(null);

  const fitToViewport = useCallback(() => {
    const container = gridScrollRef.current;
    const chart = container?.querySelector(".chart-grid");
    const cells = chart?.querySelector(".cells");
    if (
      !container ||
      !chart ||
      !cells ||
      !container.clientWidth ||
      !container.clientHeight
    )
      return false;

    const padding = getComputedStyle(container);
    const chartRect = chart.getBoundingClientRect();
    const cellsRect = cells.getBoundingClientRect();
    const availableWidth =
      container.clientWidth -
      parseFloat(padding.paddingLeft) -
      parseFloat(padding.paddingRight) -
      (chartRect.width - cellsRect.width);
    const availableHeight =
      container.clientHeight -
      parseFloat(padding.paddingTop) -
      parseFloat(padding.paddingBottom) -
      (chartRect.height - cellsRect.height);
    setZoom(
      getViewportFitZoom(
        availableWidth,
        availableHeight,
        rows,
        cols,
        cellWScale,
        cellHScale,
      ),
    );
    container.scrollLeft = 0;
    container.scrollTop = 0;
    return true;
  }, [rows, cols, cellWScale, cellHScale, setZoom]);

  useEffect(() => {
    const key = `${canvasProjectRevision}:${rows}:${cols}`;
    if (lastAutoFitRef.current === key) return undefined;
    const frame = requestAnimationFrame(() => {
      if (fitToViewport()) lastAutoFitRef.current = key;
    });
    return () => cancelAnimationFrame(frame);
  }, [canvasProjectRevision, rows, cols, fitToViewport]);

  const openFullscreenPreview = () => {
    setFullscreenCellSize(
      getFullscreenPreviewCellSize(rows, cols, cellAspectMaxScale),
    );
    setIsFullscreenPreviewOpen(true);
  };

  useEffect(() => {
    if (tool !== "pan") {
      previousToolRef.current = tool;
    }
  }, [tool]);

  const toggleCanvasPanMode = () => {
    if (isPanTool) {
      setTool(
        previousToolRef.current === "pan"
          ? "pen"
          : previousToolRef.current || "pen",
      );
      return;
    }

    previousToolRef.current = tool;
    setIsAdjustingAppliedSourceOverlay(false);
    setTool("pan");
  };

  useEffect(() => {
    if (!isFullscreenPreviewOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const updateFullscreenCellSize = () =>
      setFullscreenCellSize(
        getFullscreenPreviewCellSize(rows, cols, cellAspectMaxScale),
      );
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsFullscreenPreviewOpen(false);
    };
    const focusFrame = requestAnimationFrame(() =>
      fullscreenCloseButtonRef.current?.focus(),
    );

    document.body.style.overflow = "hidden";
    updateFullscreenCellSize();
    window.addEventListener("resize", updateFullscreenCellSize);
    window.addEventListener("keydown", closeOnEscape);
    window.visualViewport?.addEventListener("resize", updateFullscreenCellSize);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", updateFullscreenCellSize);
      window.removeEventListener("keydown", closeOnEscape);
      window.visualViewport?.removeEventListener(
        "resize",
        updateFullscreenCellSize,
      );
    };
  }, [isFullscreenPreviewOpen, rows, cols, cellAspectMaxScale]);

  useEffect(() => {
    if (!isPanTool) panDragRef.current = null;
    if (usesTouchDragPaint) return;
    // 그리기 화면을 벗어나면 진행 중이던 터치 제스처 상태를 남기지 않는다.
    touchPointsRef.current.clear();
    touchPanRef.current = null;
    touchPendingPaintRef.current = null;
    touchPaintCellRef.current = null;
    touchGestureRef.current = null;
  }, [isPanTool, usesTouchDragPaint]);

  const getTouchMidpoint = () => {
    const points = [...touchPointsRef.current.values()];
    if (!points.length) return { x: 0, y: 0 };
    const total = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 },
    );
    return { x: total.x / points.length, y: total.y / points.length };
  };

  const readCellPosition = (element) => {
    const cellElement = element?.closest?.(".cell[data-row]");
    if (!cellElement) return null;
    const row = Number(cellElement.dataset.row);
    const col = Number(cellElement.dataset.col);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
    return { row, col };
  };

  // 손가락 아래 셀을 찾아 드래그 그리기를 이어준다.
  // 터치는 pointerdown 대상에 암시적 포인터 캡처가 걸려 다른 셀의 pointerenter가 오지 않는다 → 좌표로 직접 찾는다.
  const paintTouchCellUnderPointer = (event) => {
    const position = readCellPosition(
      document.elementFromPoint(event.clientX, event.clientY),
    );
    if (!position) return;
    const last = touchPaintCellRef.current;
    if (last && last.row === position.row && last.col === position.col) return;
    touchPaintCellRef.current = position;
    handlePointerEnter(position.row, position.col);
  };

  // 첫 칸은 바로 칠하지 않고 예약만 한다 — 두 번째 손가락(화면 이동)이 곧 닿을 수 있기 때문.
  const commitPendingTouchPaint = () => {
    const pending = touchPendingPaintRef.current;
    if (!pending) return false;
    touchPendingPaintRef.current = null;
    touchPaintCellRef.current = { row: pending.row, col: pending.col };
    handlePointerDown(pending.row, pending.col);
    return true;
  };

  const handleGridPointerDownCapture = (event) => {
    const container = gridScrollRef.current;
    if (!container) return;

    if (event.pointerType === "touch") {
      // 화면 이동 도구·미리보기에서는 브라우저 기본 스크롤(touch-action)에 맡긴다.
      if (!usesTouchDragPaint) return;
      // 격자 밖(번호 여백·원본 오버레이)은 기본 동작 그대로 둔다.
      if (!event.target?.closest?.(".cells")) return;
      touchPointsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      // 셀이 pointerdown 즉시 칠하지 않도록 전파를 끊고, 칠하기 시점은 여기서 정한다.
      event.stopPropagation();

      if (touchPointsRef.current.size >= 2) {
        // 두 손가락 = 화면 이동: 예약된 첫 칸은 버리고 진행 중이던 스트로크는 끝낸다.
        touchPendingPaintRef.current = null;
        touchPaintCellRef.current = null;
        handlePointerUp();
        touchGestureRef.current = "pan";
        const midpoint = getTouchMidpoint();
        touchPanRef.current = {
          startX: midpoint.x,
          startY: midpoint.y,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop,
        };
        return;
      }

      // 화면 이동 제스처의 남은 손가락은 그리기로 넘기지 않는다.
      if (touchGestureRef.current === "pan") return;
      touchPaintCellRef.current = null;
      const position = readCellPosition(event.target);
      touchPendingPaintRef.current = position
        ? {
            pointerId: event.pointerId,
            row: position.row,
            col: position.col,
            startX: event.clientX,
            startY: event.clientY,
          }
        : null;
      return;
    }

    if (event.button !== 0) return;
    const target = event.target;
    // 번호 여백(헤더/모서리)에서 시작한 드래그는 도구와 무관하게 화면 이동. 그 외엔 화면 이동 도구일 때만.
    const onHeader = !!target?.closest(".header-row, .header-column, .corner");
    if (!isPanTool && !onHeader) return;
    if (
      !onHeader &&
      target?.closest(
        'button, input, select, textarea, a, [role="button"], [contenteditable="true"]',
      )
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    panDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    // 드래그하는 동안 전역 커서를 '쥔 손'으로 — 포인터 캡처 대상과 무관하게 명확히 표시
    document.body.style.cursor = "grabbing";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGridPointerMove = (event) => {
    const container = gridScrollRef.current;
    if (!container) return;

    if (event.pointerType === "touch") {
      if (!usesTouchDragPaint) return;
      if (!touchPointsRef.current.has(event.pointerId)) return;
      touchPointsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      const touchPan = touchPanRef.current;
      if (touchPan && touchPointsRef.current.size >= 2) {
        const midpoint = getTouchMidpoint();
        // 스크롤 위치를 직접 옮긴다(transform 이동은 스크롤 영역 밖으로 도안을 밀어내 되돌아올 수 없다).
        container.scrollLeft =
          touchPan.scrollLeft - (midpoint.x - touchPan.startX);
        container.scrollTop =
          touchPan.scrollTop - (midpoint.y - touchPan.startY);
        return;
      }
      // 두 손가락 제스처가 끝날 때까지는 남은 손가락으로 그리지 않는다.
      if (touchGestureRef.current === "pan") return;

      const pending = touchPendingPaintRef.current;
      if (pending) {
        if (pending.pointerId !== event.pointerId) return;
        // 손가락이 실제로 움직였을 때 비로소 스트로크를 시작한다(탭은 pointerup에서 처리).
        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;
        if (Math.hypot(dx, dy) < TOUCH_DRAG_THRESHOLD) return;
        commitPendingTouchPaint();
        return;
      }
      paintTouchCellUnderPointer(event);
      return;
    }

    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    container.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
    container.scrollTop = drag.scrollTop - (event.clientY - drag.startY);
  };

  const handleGridPointerUp = (event, canceled = false) => {
    if (event.pointerType === "touch") {
      touchPointsRef.current.delete(event.pointerId);
      if (touchPointsRef.current.size < 2) touchPanRef.current = null;

      const pending = touchPendingPaintRef.current;
      if (pending && pending.pointerId === event.pointerId) {
        touchPendingPaintRef.current = null;
        // 움직임 없이 뗀 손가락 = 탭 → 그 칸 하나만 칠한다.
        if (!canceled && touchGestureRef.current !== "pan") {
          handlePointerDown(pending.row, pending.col);
          handlePointerUp();
        }
      }

      if (touchPointsRef.current.size === 0) {
        touchGestureRef.current = null;
        touchPaintCellRef.current = null;
      }
      return;
    }

    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    panDragRef.current = null;
    document.body.style.cursor = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  return (
    <main className="workspace">
      <section className="canvas-panel">
        <Toolbar
          className={`canvas-toolbar ${isToolbarCollapsed ? "is-collapsed" : ""}`}
        >
          <div className="canvas-toolbar-summary">
            <div>
              <strong>
                {cols} x {rows}
              </strong>
              <span>
                {guideEvery > 0 ? `${guideEvery}칸 보조선` : "보조선 없음"} ·
                최대 200 x 200
              </span>
            </div>
            <button
              type="button"
              className="canvas-toolbar-toggle"
              onClick={() => setIsToolbarCollapsed((value) => !value)}
              aria-expanded={!isToolbarCollapsed}
              title={isToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
              aria-label={isToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="canvas-zoom-actions">
            <Slider
              min={CANVAS_MIN_ZOOM}
              max={CANVAS_MAX_ZOOM}
              value={zoom}
              onChange={setZoom}
              leftIcon={ZoomOut}
              rightIcon={ZoomIn}
              valueLabel={`${zoom}%`}
            />
            <button
              className="canvas-fit-button"
              type="button"
              onClick={fitToViewport}
              title="현재 화면에 도안 맞추기"
            >
              <Maximize2 size={14} />
              화면 맞춤
            </button>
            <button
              className="canvas-fit-button"
              type="button"
              onClick={() => setZoom(100)}
              title="기본 크기 100%로 보기"
            >
              100%
            </button>
            <button
              className={`canvas-pan-button ${isPanTool ? "active" : ""}`}
              type="button"
              onClick={toggleCanvasPanMode}
              aria-pressed={isPanTool}
              title="격자 화면 이동"
              aria-label={
                isPanTool ? "격자 화면 이동 끄기" : "격자 화면 이동 켜기"
              }
            >
              <Hand size={14} />
              화면 이동
            </button>
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
          <SourceOverlayControls
            editor={editor}
            canEditSourceOverlay={canEditSourceOverlay}
            isPanTool={isPanTool}
            previousToolRef={previousToolRef}
          />
          {mode === "edit" && gridSelection ? (
            <div className="source-overlay-control selection-actions">
              <span>
                선택 {gridSelection.c1 - gridSelection.c0 + 1} x{" "}
                {gridSelection.r1 - gridSelection.r0 + 1}칸 · 드래그·방향키로
                이동
              </span>
              <button onClick={copySelection} title="선택 영역 복사 (Ctrl/⌘+C)">
                <Copy size={14} />
                복사
              </button>
              <button
                onClick={cutSelection}
                title="선택 영역 잘라내기 (Ctrl/⌘+X)"
              >
                <Scissors size={14} />
                잘라내기
              </button>
              <button
                onClick={pasteClipboard}
                disabled={!selectionClipboard}
                title="선택 좌상단에 붙여넣기 (Ctrl/⌘+V)"
              >
                <ClipboardPaste size={14} />
                붙여넣기
              </button>
              <button
                onClick={deleteSelection}
                title="선택 영역 지우기 (Delete)"
              >
                <Trash2 size={14} />
                선택 지우기
              </button>
              <button onClick={clearSelection} title="선택 해제 (Esc)">
                해제
              </button>
            </div>
          ) : null}
        </Toolbar>
        {appliedSourceImage && appliedSourceSizeChanged ? (
          <div className="source-overlay-note">
            원본은 {appliedSourceImage.cols} x {appliedSourceImage.rows}칸 적용
            당시 기준입니다.
          </div>
        ) : null}

        {mode === "progress" && currentRowAnalysis ? (
          <ProgressRowStrip
            analysis={currentRowAnalysis}
            progressRow={progressRow}
            progressStitch={progressStitch}
          />
        ) : null}

        <div
          ref={gridScrollRef}
          className={`grid-scroll mode-${mode} ${isPanTool ? "tool-pan" : ""} ${usesTouchDragPaint ? "touch-paint" : ""}`}
          onPointerDownCapture={handleGridPointerDownCapture}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerCancel={(event) => handleGridPointerUp(event, true)}
        >
          <ChartGrid
            editor={editor}
            cellSize={Math.round((zoom / 100) * CANVAS_BASE_CELL_SIZE)}
            canEditSourceOverlay={canEditSourceOverlay}
            cellWScale={cellWScale}
            cellHScale={cellHScale}
            isPanTool={isPanTool}
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
                <span>
                  {cols} x {rows} 도안을 화면에 맞춰 표시합니다.
                </span>
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

function getViewportFitZoom(width, height, rows, cols, cellWScale, cellHScale) {
  // ChartGrid rounds the base cell size, so fit against that same rendered size.
  for (
    let candidate = CANVAS_MAX_ZOOM;
    candidate >= CANVAS_MIN_ZOOM;
    candidate -= 1
  ) {
    const cellSize = Math.round((candidate / 100) * CANVAS_BASE_CELL_SIZE);
    if (
      cols * cellSize * cellWScale <= width &&
      rows * cellSize * cellHScale <= height
    ) {
      return candidate;
    }
  }
  return CANVAS_MIN_ZOOM;
}

function getFullscreenPreviewCellSize(rows, cols, maxScale = 1) {
  if (typeof window === "undefined" || rows <= 0 || cols <= 0) return 8;

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const compactViewport = viewportWidth < 520;
  const overlayPaddingX = compactViewport ? 24 : 48;
  const overlayReservedHeight = compactViewport ? 92 : 112;
  const availableWidth = Math.max(
    1,
    viewportWidth - overlayPaddingX - CHART_FIXED_WIDTH,
  );
  const availableHeight = Math.max(
    1,
    viewportHeight - overlayReservedHeight - CHART_FIXED_HEIGHT,
  );
  // 종횡비 확대분(maxScale)을 미리 나눠 확대된 축도 화면 안에 들어오게 한다.
  const scaledCols = cols * maxScale;
  const scaledRows = rows * maxScale;
  const fitCellSize = Math.floor(
    Math.min(availableWidth / scaledCols, availableHeight / scaledRows),
  );

  return Math.min(
    FULLSCREEN_MAX_CELL_SIZE,
    Math.max(FULLSCREEN_MIN_CELL_SIZE, fitCellSize),
  );
}
