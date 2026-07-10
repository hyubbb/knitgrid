import { Slider, Toolbar } from "../../../../components/index.js";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
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

export function EditorCanvas({ editor }) {
  const {
    rows,
    cols,
    mode,
    tool,
    setTool,
    zoom,
    setZoom,
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
  } = editor;
  const canEditSourceOverlay = mode === "edit";
  const canFitWholePreview = mode === "preview";
  const isPanTool = tool === "pan";
  const { w: cellWScale, h: cellHScale } = editor.cellAspectScale;
  // 종횡비가 켜지면 확대되는 축을 기준으로 기준 셀을 줄여 전체보기가 화면에 담기도록 한다.
  const cellAspectMaxScale = Math.max(cellWScale, cellHScale);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [fullscreenCellSize, setFullscreenCellSize] = useState(() =>
    getFullscreenPreviewCellSize(rows, cols),
  );
  const [gridPan, setGridPan] = useState({ x: 0, y: 0 });
  const fullscreenCloseButtonRef = useRef(null);
  const panDragRef = useRef(null);
  const previousToolRef = useRef(tool);

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
  }, [isPanTool]);

  const handleGridPointerDownCapture = (event) => {
    if (!isPanTool || event.button !== 0) return;
    const target = event.target;
    if (
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
      panX: gridPan.x,
      panY: gridPan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGridPointerMove = (event) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setGridPan({
      x: drag.panX + (event.clientX - drag.startX),
      y: drag.panY + (event.clientY - drag.startY),
    });
  };

  const handleGridPointerUp = (event) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    panDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  return (
    <main className='workspace'>
      <section className='canvas-panel'>
        <Toolbar className={`canvas-toolbar ${isToolbarCollapsed ? "is-collapsed" : ""}`}>
          <div className='canvas-toolbar-summary'>
            <div>
              <strong>
                {cols} x {rows}
              </strong>
              <span>
                {guideEvery > 0 ? `${guideEvery}칸 보조선` : "보조선 없음"} · 최대
                200 x 200
              </span>
            </div>
            <button
              type='button'
              className='canvas-toolbar-toggle'
              onClick={() => setIsToolbarCollapsed((value) => !value)}
              aria-expanded={!isToolbarCollapsed}
              title={isToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
              aria-label={isToolbarCollapsed ? "도구 펼치기" : "도구 접기"}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div className='canvas-zoom-actions'>
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
              className={`canvas-pan-button ${isPanTool ? "active" : ""}`}
              type='button'
              onClick={toggleCanvasPanMode}
              aria-pressed={isPanTool}
              title='격자 화면 이동'
              aria-label={
                isPanTool ? "격자 화면 이동 끄기" : "격자 화면 이동 켜기"
              }
            >
              <Hand size={14} />
              화면 이동
            </button>
            {canFitWholePreview ? (
              <button
                className='canvas-fit-button'
                type='button'
                onClick={openFullscreenPreview}
                title='전체 화면에서 도안 보기'
                aria-label='미리보기 전체보기'
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
          {mode === 'edit' && gridSelection ? (
            <div className='source-overlay-control selection-actions'>
              <span>
                선택 {gridSelection.c1 - gridSelection.c0 + 1} x {gridSelection.r1 - gridSelection.r0 + 1}칸 · 드래그·방향키로 이동
              </span>
              <button onClick={deleteSelection} title='선택 영역 지우기 (Delete)'>
                <Trash2 size={14} />
                선택 지우기
              </button>
              <button onClick={clearSelection} title='선택 해제 (Esc)'>
                해제
              </button>
            </div>
          ) : null}
        </Toolbar>
        {appliedSourceImage && appliedSourceSizeChanged ? (
          <div className='source-overlay-note'>
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
          className={`grid-scroll mode-${mode} ${isPanTool ? "tool-pan" : ""}`}
          onPointerDownCapture={handleGridPointerDownCapture}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerCancel={handleGridPointerUp}
        >
          <ChartGrid
            editor={editor}
            cellSize={Math.round((zoom / 100) * CANVAS_BASE_CELL_SIZE)}
            canEditSourceOverlay={canEditSourceOverlay}
            cellWScale={cellWScale}
            cellHScale={cellHScale}
            panOffset={gridPan}
            isPanTool={isPanTool}
          />
        </div>
      </section>
      {isFullscreenPreviewOpen ? (
        <div
          className='preview-fullscreen-backdrop'
          role='dialog'
          aria-modal='true'
          aria-labelledby='preview-fullscreen-title'
        >
          <div className='preview-fullscreen-modal'>
            <header className='preview-fullscreen-header'>
              <div>
                <strong id='preview-fullscreen-title'>전체보기</strong>
                <span>
                  {cols} x {rows} 도안을 화면에 맞춰 표시합니다.
                </span>
              </div>
              <button
                ref={fullscreenCloseButtonRef}
                type='button'
                onClick={() => setIsFullscreenPreviewOpen(false)}
                aria-label='전체보기 닫기'
                title='닫기'
              >
                <X size={18} />
              </button>
            </header>
            <div className='preview-fullscreen-stage'>
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
