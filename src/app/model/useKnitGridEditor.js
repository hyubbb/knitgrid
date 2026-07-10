import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { useTextDraftEditor } from './useTextDraftEditor.js';
import { useWakeLock } from './useWakeLock.js';
import {
  rowsAtom,
  colsAtom,
  draftRowsAtom,
  draftColsAtom,
  gridAtom,
  paletteAtom,
  activePaletteIdAtom,
  toolAtom,
  modeAtom,
  displayModeAtom,
  zoomAtom,
  guideEveryAtom,
  guideColorModeAtom,
  guideCustomColorAtom,
  gridLineColorModeAtom,
  gridLineCustomColorAtom,
  numberStartAtom,
  rowDirectionAtom,
  gaugeStitchesAtom,
  gaugeRowsAtom,
  cellAspectRatioAtom,
  writtenKnitModeAtom,
  writtenStartDirectionAtom,
  writtenIncludeInPdfAtom,
  showOppositeHeadersAtom,
  currentCellAtom,
  insertAnchorCellAtom,
  progressRowAtom,
  progressStitchAtom,
  progressAutoAdvanceAtom,
  wakeLockEnabledAtom,
  completedRowsAtom,
  progressMarksAtom,
  historyAtom,
  futureAtom,
  isDraggingAtom,
  gridSelectionAtom,
  projectNameAtom,
  cropDraftAtom,
  imageDraftAtom,
  imageOptionsAtom,
  imagePaletteModeAtom,
  imageColorCountAtom,
  imageGrayscaleAtom,
  imageCandidatesAtom,
  selectedImageCandidateIdAtom,
  imageCandidateSeedAtom,
  imageCandidateLoadingAtom,
  showOriginalOverlayAtom,
  originalOverlayOpacityAtom,
  appliedSourceImageAtom,
  showAppliedSourceOverlayAtom,
  appliedSourceOverlayOpacityAtom,
  isAdjustingAppliedSourceOverlayAtom,
  appliedSourceOverlayMoveStepAtom,
  appliedSourceOverlayTransformAtom,
  expandedPaletteIdAtom,
  paletteNoticeAtom,
  pendingResizeAtom,
  moveStepsAtom,
  isInspectorCollapsedAtom,
  currentLocalProjectIdAtom,
  localProjectsAtom,
  localProjectsOpenAtom,
  localSaveStateAtom,
  localSaveMessageAtom,
  pendingNewProjectAtom,
  startScreenDismissedAtom,
  routeProjectAtom
} from '../state/editorAtoms.js';
import {
  PRESETS,
  INITIAL_PALETTE,
  TOOLS,
  CANVAS_MIN_ZOOM,
  CANVAS_MAX_ZOOM,
  DISPLAY_MODES,
  PROJECT_DB_NAME,
  PROJECT_DB_VERSION,
  PROJECT_STORE_NAME,
  DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM,
  cloneGrid,
  clonePalette,
  normalizeHex,
  getPaletteItem,
  isPaletteVisible,
  normalizePaletteItems,
  openProjectDb,
  runProjectStore,
  listLocalProjects,
  saveLocalProject,
  loadLocalProject,
  deleteLocalProject,
  duplicateLocalProject,
  exportAllLocalProjects,
  importLocalProjects,
  countPaintedCells,
  createProjectThumbnail,
  createProjectRecord,
  formatProjectDate,
  resolveCellDisplay,
  syncCellsForPaletteChange,
  syncCellsForPaletteMerge,
  clearCellsForPalette,
  makeSnapshot,
  makeCell,
  createGrid,
  clampNumber,
  clampFiniteNumber,
  clampCellToGrid,
  hasPaintedCells,
  resizeGridKeepingContentAligned,
  moveGridContent,
  scaleGridUp,
  scaleGridDown,
  clearGridRegion,
  moveGridRegion,
  removeGridRowRange,
  removeGridColRange,
  insertGridRow,
  insertGridCol,
  removeGridRow,
  removeGridCol,
  adjustCellAfterRowRemoval,
  adjustCellAfterColRemoval,
  seedGrid,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  srgbToLinear,
  rgbToLab,
  getPerceptualColorDistance,
  mapImageColorToPalette,
  nearestPalette,
  luminance,
  INITIAL_IMAGE_OPTIONS,
  normalizeCrop,
  INITIAL_CROP_SELECTION,
  normalizePercentCrop,
  convertPercentCropToImageCrop,
  IMAGE_PALETTE_MODES,
  IMAGE_EXTRACT_COLOR_LIMIT,
  IMAGE_COLOR_WARNING_DISTANCE,
  IMAGE_CANDIDATE_CONFIGS,
  getImageColorName,
  getColorBucketKey,
  extractDominantImageColors,
  createPaletteFromImageColors,
  getMappablePalette,
  getCellSampleColor,
  drawImageToAnalysisCanvas,
  pointContainerToCellColors,
  buildPaletteFromCellColors,
  buildGridFromCellColors,
  scoreImageCandidate,
  createPreviewSignature,
  summarizeColorWarnings,
  buildImageCandidateWithImageQ,
  buildConvertedImageGrid,
  buildImageConversionCandidates,
  FIT_OPTIONS,
  HORIZONTAL_ALIGNMENTS,
  VERTICAL_ALIGNMENTS,
  getImagePlacement,
  getImageAspectGridSize,
  detectPixelGrid,
  analyzeProgressRow
} from './knitgridModel.js';
import { useExport } from './hooks/useExport.js';
import { useAppliedSourceOverlay } from './hooks/useAppliedSourceOverlay.js';

const progressMarkKey = (row, col) => `${row}:${col}`;
const TOOL_SHORTCUTS = new Map(TOOLS.flatMap((tool) => (tool.shortcut ? [[tool.shortcut, tool.id]] : [])));

const imageAlignmentToResizeAnchor = (alignment, startValue, endValue) => {
  if (alignment === startValue) return 'start';
  if (alignment === endValue) return 'end';
  return 'center';
};

export function useKnitGridEditor() {
  const [rows, setRows] = useAtom(rowsAtom);
  const [cols, setCols] = useAtom(colsAtom);
  const [draftRows, setDraftRows] = useAtom(draftRowsAtom);
  const [draftCols, setDraftCols] = useAtom(draftColsAtom);
  const [grid, setGrid] = useAtom(gridAtom);
  const [palette, setPalette] = useAtom(paletteAtom);
  const [activePaletteId, setActivePaletteId] = useAtom(activePaletteIdAtom);
  const [tool, setTool] = useAtom(toolAtom);
  const [mode, setMode] = useAtom(modeAtom);
  const [displayMode, setDisplayMode] = useAtom(displayModeAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const [guideEvery, setGuideEvery] = useAtom(guideEveryAtom);
  const [guideColorMode, setGuideColorMode] = useAtom(guideColorModeAtom);
  const [guideCustomColor, setGuideCustomColor] = useAtom(guideCustomColorAtom);
  const [gridLineColorMode, setGridLineColorMode] = useAtom(gridLineColorModeAtom);
  const [gridLineCustomColor, setGridLineCustomColor] = useAtom(gridLineCustomColorAtom);
  const [numberStart, setNumberStart] = useAtom(numberStartAtom);
  const [rowDirection, setRowDirection] = useAtom(rowDirectionAtom);
  const [gaugeStitches, setGaugeStitches] = useAtom(gaugeStitchesAtom);
  const [gaugeRows, setGaugeRows] = useAtom(gaugeRowsAtom);
  const [cellAspectRatio, setCellAspectRatio] = useAtom(cellAspectRatioAtom);
  const [writtenKnitMode, setWrittenKnitMode] = useAtom(writtenKnitModeAtom);
  const [writtenStartDirection, setWrittenStartDirection] = useAtom(writtenStartDirectionAtom);
  const [writtenIncludeInPdf, setWrittenIncludeInPdf] = useAtom(writtenIncludeInPdfAtom);
  const [showOppositeHeaders, setShowOppositeHeaders] = useAtom(showOppositeHeadersAtom);
  const [currentCell, setCurrentCell] = useAtom(currentCellAtom);
  const [insertAnchorCell, setInsertAnchorCell] = useAtom(insertAnchorCellAtom);
  const [progressRow, setProgressRow] = useAtom(progressRowAtom);
  const [progressStitch, setProgressStitch] = useAtom(progressStitchAtom);
  const [progressAutoAdvance, setProgressAutoAdvance] = useAtom(progressAutoAdvanceAtom);
  const [wakeLockEnabled, setWakeLockEnabled] = useAtom(wakeLockEnabledAtom);
  const [completedRows, setCompletedRows] = useAtom(completedRowsAtom);
  const [progressMarks, setProgressMarks] = useAtom(progressMarksAtom);
  const [history, setHistory] = useAtom(historyAtom);
  const [future, setFuture] = useAtom(futureAtom);
  const [isDragging, setIsDragging] = useAtom(isDraggingAtom);
  const [gridSelection, setGridSelection] = useAtom(gridSelectionAtom);
  // 이동 드래그 미리보기 델타 {dRow,dCol}. 커밋은 pointerup에서.
  const [selectionMoveDelta, setSelectionMoveDelta] = useState(null);
  const selectionDragRef = useRef(null);
  const [projectName, setProjectName] = useAtom(projectNameAtom);
  const [cropDraft, setCropDraft] = useAtom(cropDraftAtom);
  const [imageDraft, setImageDraft] = useAtom(imageDraftAtom);
  const [imageOptions, setImageOptions] = useAtom(imageOptionsAtom);
  const [imagePaletteMode, setImagePaletteMode] = useAtom(imagePaletteModeAtom);
  const [imageColorCount, setImageColorCount] = useAtom(imageColorCountAtom);
  const [imageGrayscale, setImageGrayscale] = useAtom(imageGrayscaleAtom);
  const [imageCandidates, setImageCandidates] = useAtom(imageCandidatesAtom);
  const [selectedImageCandidateId, setSelectedImageCandidateId] = useAtom(selectedImageCandidateIdAtom);
  const [imageCandidateSeed, setImageCandidateSeed] = useAtom(imageCandidateSeedAtom);
  const [imageCandidateLoading, setImageCandidateLoading] = useAtom(imageCandidateLoadingAtom);
  const [showOriginalOverlay, setShowOriginalOverlay] = useAtom(showOriginalOverlayAtom);
  const [originalOverlayOpacity, setOriginalOverlayOpacity] = useAtom(originalOverlayOpacityAtom);
  const [appliedSourceImage, setAppliedSourceImage] = useAtom(appliedSourceImageAtom);
  const [showAppliedSourceOverlay, setShowAppliedSourceOverlay] = useAtom(showAppliedSourceOverlayAtom);
  const [appliedSourceOverlayOpacity, setAppliedSourceOverlayOpacity] = useAtom(appliedSourceOverlayOpacityAtom);
  const [isAdjustingAppliedSourceOverlay, setIsAdjustingAppliedSourceOverlay] = useAtom(isAdjustingAppliedSourceOverlayAtom);
  const [appliedSourceOverlayMoveStep, setAppliedSourceOverlayMoveStep] = useAtom(appliedSourceOverlayMoveStepAtom);
  const [appliedSourceOverlayTransform, setAppliedSourceOverlayTransform] = useAtom(appliedSourceOverlayTransformAtom);
  const [expandedPaletteId, setExpandedPaletteId] = useAtom(expandedPaletteIdAtom);
  const [paletteNotice, setPaletteNotice] = useAtom(paletteNoticeAtom);
  const [pendingResize, setPendingResize] = useAtom(pendingResizeAtom);
  const [moveSteps, setMoveSteps] = useAtom(moveStepsAtom);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useAtom(isInspectorCollapsedAtom);
  const [currentLocalProjectId, setCurrentLocalProjectId] = useAtom(currentLocalProjectIdAtom);
  const [localProjects, setLocalProjects] = useAtom(localProjectsAtom);
  const [localProjectsOpen, setLocalProjectsOpen] = useAtom(localProjectsOpenAtom);
  const [localSaveState, setLocalSaveState] = useAtom(localSaveStateAtom);
  const [localSaveMessage, setLocalSaveMessage] = useAtom(localSaveMessageAtom);
  const [pendingNewProject, setPendingNewProject] = useAtom(pendingNewProjectAtom);
  const [startScreenDismissed, setStartScreenDismissed] = useAtom(startScreenDismissedAtom);
  const [routeProject, setRouteProject] = useAtom(routeProjectAtom);
  const fileInputRef = useRef(null);
  const referenceInputRef = useRef(null);
  const projectInputRef = useRef(null);
  const backupInputRef = useRef(null);

  // URL ?project= 동기화 (네이티브 History API). project: null=시작화면, 'new'=새 도안, id=로컬 도안
  const navigateToProject = useCallback((project, { replace = false } = {}) => {
    setRouteProject(project);
    const params = new URLSearchParams(window.location.search);
    if (project) params.set('project', project);
    else params.delete('project');
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
    const state = { project: project ?? null };
    if (replace) window.history.replaceState(state, '', url);
    else window.history.pushState(state, '', url);
  }, [setRouteProject]);

  const goToStartScreen = useCallback(() => navigateToProject(null), [navigateToProject]);
  const lastSavedSignatureRef = useRef('');

  const activePalette = useMemo(
    () => palette.find((item) => item.id === activePaletteId) ?? palette[0],
    [activePaletteId, palette]
  );

  const activeCounts = useMemo(() => {
    const counts = new Map();
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.active) {
          counts.set(cell.paletteId || cell.symbol, (counts.get(cell.paletteId || cell.symbol) || 0) + 1);
        }
      });
    });
    return counts;
  }, [grid]);

  // 업로드 이미지의 픽셀아트 논리 격자 감지 결과({cellWidth,offsetX,logicalCols,...} | null)
  const [detectedPixelGrid, setDetectedPixelGrid] = useState(null);
  useEffect(() => {
    if (!imageDraft) {
      setDetectedPixelGrid(null);
      return undefined;
    }
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      setDetectedPixelGrid(detectPixelGrid(ctx.getImageData(0, 0, canvas.width, canvas.height)));
    };
    image.onerror = () => {
      if (!cancelled) setDetectedPixelGrid(null);
    };
    image.src = imageDraft.src;
    return () => {
      cancelled = true;
    };
  }, [imageDraft]);

  const pixelGridActive = Boolean(imageOptions.matchPixelGrid && detectedPixelGrid && imageDraft);

  // '원본 픽셀 그대로': 크롭을 감지된 격자 위상에 스냅 + pixelArt(nearest·최빈색) 강제
  const effectiveImageOptions = useMemo(() => {
    if (!pixelGridActive) return imageOptions;
    const { cellWidth, cellHeight, offsetX, offsetY, logicalCols, logicalRows } = detectedPixelGrid;
    return {
      ...imageOptions,
      pixelArt: true,
      fit: 'stretch',
      crop: {
        enabled: true,
        x: offsetX / imageDraft.width,
        y: offsetY / imageDraft.height,
        width: (logicalCols * cellWidth) / imageDraft.width,
        height: (logicalRows * cellHeight) / imageDraft.height
      }
    };
  }, [pixelGridActive, imageOptions, detectedPixelGrid, imageDraft]);

  // 이미지 변환에 실제로 쓰는 격자 크기. '이미지 비율로 맞추기'/'원본 픽셀 그대로'가 켜지면 재계산.
  const imageConversionSize = useMemo(() => {
    if (pixelGridActive) {
      return { rows: detectedPixelGrid.logicalRows, cols: detectedPixelGrid.logicalCols };
    }
    if (!imageDraft) return { rows, cols };
    if (!imageOptions.matchImageAspect) {
      // '현재 격자 유지': 사용자가 모달에서 직접 지정한 대상 칸 수(없으면 현재 격자)
      return {
        rows: clampNumber(imageOptions.targetRows ?? rows, 1, 200),
        cols: clampNumber(imageOptions.targetCols ?? cols, 1, 200)
      };
    }
    return getImageAspectGridSize({
      imageWidth: imageDraft.width,
      imageHeight: imageDraft.height,
      rows,
      cols,
      crop: imageOptions.crop
    });
  }, [pixelGridActive, detectedPixelGrid, imageDraft, imageOptions, rows, cols]);

  const imageWarnings = useMemo(() => {
    if (!imageDraft) return [];
    if (pixelGridActive) {
      const { rows: tRows, cols: tCols } = imageConversionSize;
      return [`원본 픽셀 격자를 감지했습니다: 픽셀당 ${detectedPixelGrid.cellWidth}px → ${tCols} x ${tRows}칸으로 1:1 변환됩니다.`];
    }
    if (imageOptions.matchImageAspect) {
      const { rows: tRows, cols: tCols } = imageConversionSize;
      const warnings = [`격자를 이미지 비율에 맞춰 ${tCols} x ${tRows}칸으로 변환합니다. 잘리는 부분은 없습니다.`];
      if (imageDraft.width > tCols * 4 || imageDraft.height > tRows * 4) {
        warnings.push(`원본 ${imageDraft.width} x ${imageDraft.height}px을 ${tCols} x ${tRows}칸으로 줄입니다. 세부 묘사가 많이 뭉개질 수 있습니다.`);
      }
      return warnings;
    }
    const warnings = [];
    const imageRatio = imageDraft.width / imageDraft.height;
    const gridRatio = cols / rows;
    const ratioDelta = Math.abs(imageRatio - gridRatio) / gridRatio;
    const placement = getImagePlacement({
      imageWidth: imageDraft.width,
      imageHeight: imageDraft.height,
      targetWidth: cols,
      targetHeight: rows,
      ...imageOptions
    });
    const croppedX = Math.max(0, placement.width - cols);
    const croppedY = Math.max(0, placement.height - rows);

    if (imageDraft.width > cols * 4 || imageDraft.height > rows * 4) {
      warnings.push(`원본 ${imageDraft.width} x ${imageDraft.height}px을 ${cols} x ${rows}칸으로 줄입니다. 세부 묘사가 많이 뭉개질 수 있습니다.`);
    }

    if (ratioDelta > 0.12 && imageOptions.fit === 'cover') {
      warnings.push('이미지 비율과 격자 비율 차이가 커서 일부 영역이 잘립니다. 상단/중앙/하단 정렬을 확인하세요.');
    }

    if ((croppedX > 0.5 || croppedY > 0.5) && imageOptions.fit === 'cover') {
      const vertical = croppedY > 0.5 ? `${Math.round(croppedY)}칸 높이` : '';
      const horizontal = croppedX > 0.5 ? `${Math.round(croppedX)}칸 너비` : '';
      warnings.push(`현재 채우기 설정에서는 ${[horizontal, vertical].filter(Boolean).join(', ')} 정도가 격자 밖으로 넘어갑니다.`);
    }

    if (imageOptions.fit === 'stretch' && ratioDelta > 0.08) {
      warnings.push('늘려 맞춤은 잘림은 없지만 원본 형태가 가로/세로로 왜곡될 수 있습니다.');
    }

    if (imageOptions.fit === 'contain') {
      warnings.push('맞춰 넣기는 원본 전체를 보존하지만 남는 칸은 빈 배경으로 변환됩니다.');
    }

    return warnings;
  }, [cols, detectedPixelGrid, imageConversionSize, imageDraft, imageOptions, pixelGridActive, rows]);

  const imagePreviewCounts = useMemo(() => {
    const counts = new Map();
    const selectedCandidate = imageCandidates.find((candidate) => candidate.id === selectedImageCandidateId) ?? imageCandidates[0];
    selectedCandidate?.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.active) counts.set(cell.paletteId, (counts.get(cell.paletteId) || 0) + 1);
      });
    });
    return counts;
  }, [imageCandidates, selectedImageCandidateId]);

  const selectedImageCandidate = useMemo(
    () => imageCandidates.find((candidate) => candidate.id === selectedImageCandidateId) ?? imageCandidates[0] ?? null,
    [imageCandidates, selectedImageCandidateId]
  );

  const updateCropDraftSelection = useCallback((percentCrop) => {
    setCropDraft((previous) => {
      if (!previous) return previous;
      const cropSelection = normalizePercentCrop(percentCrop);
      return {
        ...previous,
        cropSelection,
        cropArea: convertPercentCropToImageCrop(cropSelection)
      };
    });
  }, []);

  const completeCropDraftSelection = useCallback((percentCrop) => {
    setCropDraft((previous) => {
      if (!previous) return previous;
      const cropSelection = normalizePercentCrop(percentCrop);
      return {
        ...previous,
        cropSelection,
        cropArea: convertPercentCropToImageCrop(cropSelection)
      };
    });
  }, []);

  const resetCropDraft = useCallback(() => {
    setCropDraft((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        cropSelection: INITIAL_CROP_SELECTION,
        cropArea: convertPercentCropToImageCrop(INITIAL_CROP_SELECTION)
      };
    });
  }, []);

  const appliedSourceSizeChanged = Boolean(
    appliedSourceImage && (appliedSourceImage.rows !== rows || appliedSourceImage.cols !== cols)
  );
  const guideLineColor = guideColorMode === 'white'
    ? '#ffffff'
    : guideColorMode === 'custom'
      ? normalizeHex(guideCustomColor) ?? '#111827'
      : '#111827';
  // 기본 격자 선 색상. ''(default)=테마 토큰(var(--kg-line)) 사용, 'transparent'=없음.
  const gridLineColor = gridLineColorMode === 'none'
    ? 'transparent'
    : gridLineColorMode === 'black'
      ? '#111827'
      : gridLineColorMode === 'white'
        ? '#ffffff'
        : gridLineColorMode === 'custom'
          ? normalizeHex(gridLineCustomColor) ?? '#c9ced6'
          : '';

  // 게이지: 10cm당 코수/단수가 모두 양수일 때만 유효.
  const hasGauge = gaugeStitches > 0 && gaugeRows > 0;
  // 현재 격자 기준 완성 예상 치수(cm). 코 1개 = 10/코수 cm, 단 1개 = 10/단수 cm.
  const finishedSize = hasGauge
    ? { widthCm: (cols * 10) / gaugeStitches, heightCm: (rows * 10) / gaugeRows }
    : null;
  // 실제 코 비율 렌더링 스케일. 셀 가로:세로 = (10/코수):(10/단수) → 가로/세로 = 단수/코수.
  // 넓이를 유지하도록 기하평균으로 정규화(면적 ≈ 기준 셀²)해 확대/축소 왜곡을 최소화한다.
  const cellAspectActive = hasGauge && cellAspectRatio;
  const cellAspectScale = useMemo(() => {
    if (!cellAspectActive) return { w: 1, h: 1 };
    const ratio = gaugeRows / gaugeStitches; // 가로/세로
    const root = Math.sqrt(ratio);
    return { w: root, h: 1 / root };
  }, [cellAspectActive, gaugeRows, gaugeStitches]);

  // 목표 치수(cm) → 필요한 격자 크기(코수 × 단수). 게이지 없으면 null.
  const computeGridSizeForDimensions = useCallback(
    (widthCm, heightCm) => {
      if (!hasGauge) return null;
      const nextCols = clampNumber(Math.round((Number(widthCm) * gaugeStitches) / 10), 1, 200);
      const nextRows = clampNumber(Math.round((Number(heightCm) * gaugeRows) / 10), 1, 200);
      if (!Number.isFinite(nextCols) || !Number.isFinite(nextRows)) return null;
      return { cols: nextCols, rows: nextRows };
    },
    [gaugeRows, gaugeStitches, hasGauge]
  );

  const {
    appliedSourceTransformCss,
    resetAppliedSourceOverlayTransform,
    updateAppliedSourceOverlayTransform,
    moveAppliedSourceOverlay,
    handleAppliedSourceOverlayPointerDown,
    handleAppliedSourceOverlayPointerMove,
    handleAppliedSourceOverlayPointerUp,
    clearAppliedSourceImage,
    replaceAppliedSourceImageFromDraft
  } = useAppliedSourceOverlay({
    appliedSourceOverlayTransform,
    setAppliedSourceOverlayTransform,
    appliedSourceOverlayMoveStep,
    setAppliedSourceOverlayMoveStep,
    isAdjustingAppliedSourceOverlay,
    setAppliedSourceImage,
    setShowAppliedSourceOverlay,
    setAppliedSourceOverlayOpacity,
    setIsAdjustingAppliedSourceOverlay
  });

  const serializeCurrentProject = useCallback(() => ({
    version: 2,
    projectName,
    rows,
    cols,
    palette,
    grid,
    activePaletteId,
    displayMode,
    guideColorMode,
    guideCustomColor,
    gridLineColorMode,
    gridLineCustomColor,
    rowDirection,
    numberStart,
    gaugeStitches: gaugeStitches || null,
    gaugeRows: gaugeRows || null,
    cellAspectRatio,
    // 진행 상태(현재 행/코, 완료 행, 진행 체크, 자동 이동)를 함께 저장한다.
    progress: {
      row: progressRow,
      stitch: progressStitch,
      autoAdvance: progressAutoAdvance,
      completedRows: [...completedRows].sort((a, b) => a - b),
      marks: [...progressMarks]
    }
  }), [activePaletteId, cellAspectRatio, cols, completedRows, displayMode, gaugeRows, gaugeStitches, grid, guideColorMode, guideCustomColor, gridLineColorMode, gridLineCustomColor, numberStart, palette, progressAutoAdvance, progressMarks, progressRow, progressStitch, projectName, rowDirection, rows]);

  const applyProjectData = useCallback((data, options = {}) => {
    const loadedPalette = normalizePaletteItems(data.palette);
    const nextRows = data.rows || 64;
    const nextCols = data.cols || 48;
    const loadedGrid = data.grid || createGrid(nextRows, nextCols);
    const loadedActivePaletteId = data.activePaletteId && getPaletteItem(loadedPalette, data.activePaletteId)
      ? data.activePaletteId
      : loadedPalette[0]?.id;

    setProjectName(data.projectName || '불러온 도안');
    setRows(nextRows);
    setCols(nextCols);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setPalette(loadedPalette);
    setGrid(loadedGrid.map((row) => row.map((cell) => {
      const display = resolveCellDisplay(cell, loadedPalette);
      return cell.paletteId && getPaletteItem(loadedPalette, cell.paletteId)
        ? { ...cell, color: display.color, symbol: display.symbol, label: display.label }
        : cell;
    })));
    setActivePaletteId(loadedActivePaletteId);
    setExpandedPaletteId('');
    setDisplayMode(data.displayMode || 'color');
    setGuideColorMode(data.guideColorMode || 'black');
    setGuideCustomColor(normalizeHex(data.guideCustomColor) || '#111827');
    setGridLineColorMode(data.gridLineColorMode || 'default');
    setGridLineCustomColor(normalizeHex(data.gridLineCustomColor) || '#c9ced6');
    setRowDirection(data.rowDirection || 'bottom-up');
    setNumberStart(data.numberStart || 1);
    // 게이지 필드가 없는 기존 프로젝트는 안전하게 미설정(0)/off 처리.
    setGaugeStitches(Math.max(0, Number(data.gaugeStitches) || 0));
    setGaugeRows(Math.max(0, Number(data.gaugeRows) || 0));
    setCellAspectRatio(Boolean(data.cellAspectRatio));
    setCurrentCell((cell) => clampCellToGrid(cell, nextRows, nextCols));
    setInsertAnchorCell((cell) => clampCellToGrid(cell, nextRows, nextCols));
    // 진행 상태 복원(게이지/서술형처럼 기존 프로젝트엔 없을 수 있어 안전한 기본값 사용).
    const nextNumberStart = data.numberStart || 1;
    const savedProgress = data.progress || {};
    setProgressRow(clampNumber(Number(savedProgress.row) || nextNumberStart, nextNumberStart, nextNumberStart + nextRows - 1));
    setProgressStitch(clampNumber(Number(savedProgress.stitch) || 1, 1, nextCols));
    setProgressAutoAdvance(savedProgress.autoAdvance !== false);
    setCompletedRows(new Set(Array.isArray(savedProgress.completedRows) ? savedProgress.completedRows : []));
    setProgressMarks(new Set(Array.isArray(savedProgress.marks) ? savedProgress.marks : []));
    setHistory([]);
    setFuture([]);
    setPaletteNotice('');
    clearAppliedSourceImage();
    setCurrentLocalProjectId(options.localId || '');
    setLocalSaveState(options.localId ? 'saved' : 'unsaved');
    setLocalSaveMessage(options.localId ? '저장됨' : '로컬에 저장되지 않음');
    lastSavedSignatureRef.current = options.localId ? JSON.stringify({ version: 2, ...data }) : '';
  }, [clearAppliedSourceImage]);

  const refreshLocalProjects = useCallback(async () => {
    try {
      setLocalProjects(await listLocalProjects());
    } catch (error) {
      setLocalSaveState('error');
      setLocalSaveMessage(error.message || '로컬 작업 목록을 불러오지 못했습니다.');
    }
  }, []);

  const saveCurrentLocalProject = useCallback(async () => {
    try {
      setLocalSaveState('saving');
      setLocalSaveMessage('저장 중');
      const data = serializeCurrentProject();
      const id = currentLocalProjectId || `kg-${Date.now()}`;
      const existing = currentLocalProjectId ? await loadLocalProject(currentLocalProjectId) : null;
      const record = createProjectRecord(id, data, existing);
      await saveLocalProject(record);
      lastSavedSignatureRef.current = JSON.stringify(record.projectData);
      setCurrentLocalProjectId(id);
      setLocalSaveState('saved');
      setLocalSaveMessage('저장됨');
      if (routeProject !== id) navigateToProject(id, { replace: true });
      await refreshLocalProjects();
      return record;
    } catch (error) {
      setLocalSaveState('error');
      setLocalSaveMessage(error.message || '저장 실패');
      return null;
    }
  }, [currentLocalProjectId, navigateToProject, refreshLocalProjects, routeProject, serializeCurrentProject]);

  const resetToNewProject = useCallback(() => {
    const nextRows = 64;
    const nextCols = 48;
    setProjectName('새 도안');
    setRows(nextRows);
    setCols(nextCols);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setPalette(normalizePaletteItems(INITIAL_PALETTE));
    setGrid(createGrid(nextRows, nextCols));
    setActivePaletteId('h7');
    setExpandedPaletteId('');
    setDisplayMode('color');
    setRowDirection('bottom-up');
    setNumberStart(1);
    setGaugeStitches(0);
    setGaugeRows(0);
    setCellAspectRatio(false);
    setCurrentCell({ row: 23, col: 17 });
    setInsertAnchorCell({ row: 23, col: 17 });
    setProgressRow(1);
    setProgressStitch(1);
    setProgressAutoAdvance(true);
    setCompletedRows(new Set());
    setProgressMarks(new Set());
    setHistory([]);
    setFuture([]);
    setPaletteNotice('');
    setCurrentLocalProjectId('');
    setLocalSaveState('unsaved');
    setLocalSaveMessage('새 작업');
    lastSavedSignatureRef.current = '';
    clearAppliedSourceImage();
    setPendingNewProject(false);
    navigateToProject('new');
  }, [clearAppliedSourceImage, navigateToProject]);

  useEffect(() => {
    refreshLocalProjects();
  }, [refreshLocalProjects]);

  // 첫 로드 시 URL의 ?project=<id>가 있으면 해당 도안을 불러온다(딥링크/새로고침 대응)
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('project');
    if (initial && initial !== 'new') openLocalProject(initial, { fromHistory: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 뒤로/앞으로 가기(popstate) 시 URL에 맞춰 화면을 복원한다
  useEffect(() => {
    const handlePopState = () => {
      const next = new URLSearchParams(window.location.search).get('project');
      setRouteProject(next);
      if (next && next !== 'new' && next !== currentLocalProjectId) {
        openLocalProject(next, { fromHistory: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocalProjectId]);

  useEffect(() => {
    if (!currentLocalProjectId || imageDraft || imageCandidateLoading) return undefined;
    const currentSignature = JSON.stringify(serializeCurrentProject());
    if (lastSavedSignatureRef.current === currentSignature) {
      setLocalSaveState('saved');
      setLocalSaveMessage('저장됨');
      return undefined;
    }
    setLocalSaveState('dirty');
    setLocalSaveMessage('미저장 변경사항');
    return undefined;
  }, [currentLocalProjectId, imageCandidateLoading, imageDraft, serializeCurrentProject]);

  useEffect(() => {
    if (!imageDraft) {
      setImageCandidates([]);
      setSelectedImageCandidateId('');
      setImageCandidateLoading(false);
      return undefined;
    }

    let cancelled = false;
    setImageCandidateLoading(true);
    const image = new Image();
    image.onload = async () => {
      const candidates = await buildImageConversionCandidates({
        image,
        rows: imageConversionSize.rows,
        cols: imageConversionSize.cols,
        basePalette: palette,
        paletteMode: imagePaletteMode,
        imageOptions: effectiveImageOptions,
        seed: imageCandidateSeed,
        colorCount: imageColorCount,
        grayscale: imageGrayscale
      });
      if (!cancelled) {
        setImageCandidates(candidates);
        setSelectedImageCandidateId(candidates[0]?.id ?? '');
        setImageCandidateLoading(false);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setImageCandidates([]);
        setSelectedImageCandidateId('');
        setImageCandidateLoading(false);
      }
    };
    image.src = imageDraft.src;

    return () => {
      cancelled = true;
    };
  }, [cols, effectiveImageOptions, imageCandidateSeed, imageColorCount, imageConversionSize, imageGrayscale, imageDraft, imagePaletteMode, palette, rows]);

  const paintedCellCount = useMemo(
    () => grid.reduce((sum, row) => sum + row.filter((cell) => cell.active).length, 0),
    [grid]
  );

  const hasCurrentWork = Boolean(paintedCellCount || history.length || currentLocalProjectId || localSaveState === 'dirty');
  const localSaveStatusLabel = localSaveState === 'saving'
    ? '저장 중'
    : localSaveState === 'saved'
      ? '저장됨'
      : localSaveState === 'dirty'
        ? '미저장'
        : localSaveState === 'error'
          ? '저장 오류'
          : '로컬 미저장';

  const openLocalProjectsModal = () => {
    refreshLocalProjects();
    setLocalProjectsOpen(true);
  };

  const requestNewProject = () => {
    if (hasCurrentWork) setPendingNewProject(true);
    else resetToNewProject();
  };

  const saveAndStartNewProject = async () => {
    const record = await saveCurrentLocalProject();
    if (record) resetToNewProject();
  };

  const openLocalProject = async (id, { fromHistory = false } = {}) => {
    const record = await loadLocalProject(id);
    if (!record?.projectData) {
      // 존재하지 않는 id(오래된 URL) → 시작화면으로 정리
      if (!fromHistory) navigateToProject(null, { replace: true });
      return;
    }
    applyProjectData(record.projectData, { localId: record.id });
    setStartScreenDismissed(true);
    setLocalProjectsOpen(false);
    if (!fromHistory) navigateToProject(id);
  };

  const duplicateProject = async (id) => {
    await duplicateLocalProject(id);
    await refreshLocalProjects();
  };

  const removeLocalProject = async (id) => {
    await deleteLocalProject(id);
    if (currentLocalProjectId === id) {
      setCurrentLocalProjectId('');
      setLocalSaveState('unsaved');
      setLocalSaveMessage('로컬에서 삭제됨');
    }
    await refreshLocalProjects();
  };

  const renameLocalProject = async (project) => {
    const nextName = window.prompt('작업 이름', project.name || project.projectData?.projectName || '');
    if (!nextName?.trim()) return;
    const nextProject = {
      ...project,
      name: nextName.trim(),
      updatedAt: new Date().toISOString(),
      projectData: {
        ...project.projectData,
        projectName: nextName.trim()
      }
    };
    await saveLocalProject(nextProject);
    if (currentLocalProjectId === project.id) setProjectName(nextName.trim());
    await refreshLocalProjects();
  };

  const pushHistory = useCallback(() => {
    setHistory((items) => [
      ...items.slice(-24),
      makeSnapshot(grid, palette, activePaletteId, {
        rows,
        cols,
        currentCell,
        insertAnchorCell,
        progressRow,
        completedRows
      })
    ]);
    setFuture([]);
  }, [activePaletteId, cols, completedRows, currentCell, grid, insertAnchorCell, palette, progressRow, rows]);
  const textDraftEditor = useTextDraftEditor({
    rows,
    cols,
    palette,
    activePalette,
    pushHistory,
    setRows,
    setCols,
    setDraftRows,
    setDraftCols,
    setGrid,
    setCurrentCell,
    setInsertAnchorCell,
    setMode,
    numberStart,
    setProgressRow,
    setCompletedRows,
    setPaletteNotice,
    clearProgressMarks: () => setProgressMarks(new Set())
  });

  const clampProgressRow = useCallback(
    (value, nextRows) => clampNumber(value, numberStart, numberStart + nextRows - 1),
    [numberStart]
  );

  const clampCompletedRows = useCallback(
    (value, nextRows) => {
      const minRow = numberStart;
      const maxRow = numberStart + nextRows - 1;
      return new Set([...value].filter((row) => row >= minRow && row <= maxRow));
    },
    [numberStart]
  );

  const applySnapshot = useCallback((snapshot) => {
    const snapshotRows = snapshot.rows ?? snapshot.grid.length;
    const snapshotCols = snapshot.cols ?? snapshot.grid[0]?.length ?? 0;
    setGrid(snapshot.grid);
    setRows(snapshotRows);
    setCols(snapshotCols);
    setDraftRows(snapshotRows);
    setDraftCols(snapshotCols);
    setPalette(snapshot.palette);
    setActivePaletteId(snapshot.activePaletteId);
    setCurrentCell(clampCellToGrid(snapshot.currentCell ?? currentCell, snapshotRows, snapshotCols));
    setInsertAnchorCell(clampCellToGrid(snapshot.insertAnchorCell ?? insertAnchorCell, snapshotRows, snapshotCols));
    setProgressRow(snapshot.progressRow ?? clampProgressRow(progressRow, snapshotRows));
    setCompletedRows(snapshot.completedRows ? new Set(snapshot.completedRows) : new Set());
    setProgressMarks(new Set());
    setExpandedPaletteId('');
    setPaletteNotice('');
    setPendingResize(null);
  }, [clampProgressRow, currentCell, insertAnchorCell, progressRow, setProgressMarks]);

  const applyGridStructure = useCallback(
    (nextGrid, nextRows, nextCols, nextCurrentCell = currentCell, nextInsertAnchorCell = insertAnchorCell) => {
      setRows(nextRows);
      setCols(nextCols);
      setDraftRows(nextRows);
      setDraftCols(nextCols);
      setGrid(nextGrid);
      setCurrentCell(clampCellToGrid(nextCurrentCell, nextRows, nextCols));
      setInsertAnchorCell(clampCellToGrid(nextInsertAnchorCell, nextRows, nextCols));
      setProgressRow((value) => clampProgressRow(value, nextRows));
      setProgressStitch((value) => clampNumber(value, 1, nextCols));
      setCompletedRows((value) => clampCompletedRows(value, nextRows));
      setProgressMarks(new Set());
    },
    [clampCompletedRows, clampProgressRow, currentCell, insertAnchorCell, setProgressMarks, setProgressStitch]
  );

  const updateProgressMark = useCallback(
    (row, col, action) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      setProgressMarks((previous) => {
        const next = new Set(previous);
        const key = progressMarkKey(row, col);
        if (action === 'remove') next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [cols, rows, setProgressMarks]
  );

  const clearProgressMarks = useCallback(() => {
    setProgressMarks(new Set());
  }, [setProgressMarks]);

  // 칠해진 칸 전체 지우기(실행취소 가능). 격자 크기·팔레트는 그대로.
  const clearGrid = () => {
    pushHistory();
    setGrid(createGrid(rows, cols));
    setProgressMarks(new Set());
  };

  const clearSelection = useCallback(() => {
    setGridSelection(null);
    setSelectionMoveDelta(null);
    selectionDragRef.current = null;
  }, [setGridSelection]);

  // 선택 영역만 지우기(실행취소 가능)
  const deleteSelection = useCallback(() => {
    if (!gridSelection) return;
    pushHistory();
    setGrid((previous) => clearGridRegion(previous, gridSelection));
  }, [gridSelection, pushHistory, setGrid]);

  // 도구/모드가 바뀌면 선택 해제
  useEffect(() => {
    if (tool !== 'select' || mode !== 'edit') clearSelection();
  }, [tool, mode, clearSelection]);

  // 선택이 생기면 행/열 삽입 기준(anchor)도 선택 좌상단으로 동기화 — 브러시 기준점과 따로 놀지 않게
  useEffect(() => {
    if (gridSelection) setInsertAnchorCell({ row: gridSelection.r0, col: gridSelection.c0 });
  }, [gridSelection, setInsertAnchorCell]);

  // 선택된 행/열 범위를 통째로 제거(전체 제거는 방지, 실행취소 가능)
  const removeSelectedRows = () => {
    if (!gridSelection) return;
    const span = gridSelection.r1 - gridSelection.r0 + 1;
    if (span >= rows) return;
    pushHistory();
    applyGridStructure(removeGridRowRange(grid, gridSelection.r0, gridSelection.r1), rows - span, cols);
    clearSelection();
  };

  const removeSelectedCols = () => {
    if (!gridSelection) return;
    const span = gridSelection.c1 - gridSelection.c0 + 1;
    if (span >= cols) return;
    pushHistory();
    applyGridStructure(removeGridColRange(grid, gridSelection.c0, gridSelection.c1), rows, cols - span);
    clearSelection();
  };

  // 선택 영역만 delta 방향으로 이동(격자 밖은 클리핑). 선택도 함께 이동.
  const moveSelection = useCallback((rowDelta, colDelta) => {
    if (!gridSelection) return;
    pushHistory();
    setGrid((previous) => moveGridRegion(previous, gridSelection, rowDelta, colDelta));
    setGridSelection((sel) => (sel ? {
      r0: clampNumber(sel.r0 + rowDelta, 0, rows - 1),
      c0: clampNumber(sel.c0 + colDelta, 0, cols - 1),
      r1: clampNumber(sel.r1 + rowDelta, 0, rows - 1),
      c1: clampNumber(sel.c1 + colDelta, 0, cols - 1)
    } : sel));
  }, [gridSelection, pushHistory, setGrid, setGridSelection, rows, cols]);

  // 선택 도구: Delete/Backspace = 선택 영역 지우기, Escape = 해제, 방향키 = 선택 영역 1칸 이동
  useEffect(() => {
    if (mode !== 'edit' || tool !== 'select') return undefined;
    const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const handleKeyDown = (event) => {
      if (event.target?.closest?.('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelection();
      } else if (event.key === 'Escape') {
        clearSelection();
      } else if (arrows[event.key] && gridSelection) {
        event.preventDefault();
        moveSelection(arrows[event.key][0], arrows[event.key][1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, tool, deleteSelection, clearSelection, gridSelection, moveSelection]);

  // 화면에 표시할 선택 사각형(이동 드래그 중엔 델타 반영 미리보기)
  const selectionRect = useMemo(() => {
    if (!gridSelection) return null;
    if (!selectionMoveDelta) return gridSelection;
    return {
      r0: gridSelection.r0 + selectionMoveDelta.dRow,
      c0: gridSelection.c0 + selectionMoveDelta.dCol,
      r1: gridSelection.r1 + selectionMoveDelta.dRow,
      c1: gridSelection.c1 + selectionMoveDelta.dCol
    };
  }, [gridSelection, selectionMoveDelta]);

  // 도안 배율: 'up' = 1칸→2x2(그림 2배), 'down' = 2x2→1칸. 최대 200, 최소 1.
  const scalePattern = (direction) => {
    if (direction === 'up') {
      if (rows * 2 > 200 || cols * 2 > 200) return;
      pushHistory();
      applyGridStructure(scaleGridUp(grid), rows * 2, cols * 2);
      return;
    }
    if (rows < 2 && cols < 2) return;
    pushHistory();
    applyGridStructure(scaleGridDown(grid), Math.max(1, Math.ceil(rows / 2)), Math.max(1, Math.ceil(cols / 2)));
  };

  const progressRowMin = numberStart;
  const progressRowMax = numberStart + rows - 1;

  // 진행 모드일 때만 현재 행을 읽기 순서로 분석(코 단위 스트립/색 요약/현재 코 위치용).
  const currentRowAnalysis = useMemo(() => {
    if (mode !== 'progress') return null;
    return analyzeProgressRow({
      grid,
      palette,
      rows,
      cols,
      rowNumber: progressRow,
      rowDirection,
      numberStart,
      knitMode: writtenKnitMode,
      startDirection: writtenStartDirection
    });
  }, [mode, grid, palette, rows, cols, progressRow, rowDirection, numberStart, writtenKnitMode, writtenStartDirection]);

  // 현재 코가 위치한 격자 셀(강조 표시용). progressStitch는 1부터 시작.
  const progressStitchCell = useMemo(() => {
    if (!currentRowAnalysis) return null;
    const cell = currentRowAnalysis.cells[clampNumber(progressStitch, 1, currentRowAnalysis.totalStitches) - 1];
    if (!cell) return null;
    return { row: currentRowAnalysis.rowIndex, col: cell.col };
  }, [currentRowAnalysis, progressStitch]);

  // 화면 꺼짐 방지: 진행 모드 + 사용자가 켠 경우에만 활성.
  const wakeLock = useWakeLock(mode === 'progress' && wakeLockEnabled);

  // 현재 행 변경(슬라이더/칩): 행을 옮기고 코 위치를 처음으로 되돌린다.
  const handleProgressRowChange = useCallback((nextRow) => {
    setProgressRow(clampNumber(Number(nextRow), progressRowMin, progressRowMax));
    setProgressStitch(1);
  }, [progressRowMin, progressRowMax, setProgressRow, setProgressStitch]);

  const handleProgressStitchChange = useCallback((nextStitch) => {
    setProgressStitch(clampNumber(Number(nextStitch), 1, cols));
  }, [cols, setProgressStitch]);

  const stitchForward = useCallback(() => {
    setProgressStitch((previous) => {
      const total = cols;
      if (previous < total) return previous + 1;
      // 행 끝: 자동 이동이 켜져 있고 다음 행이 있으면 다음 행 첫 코로.
      if (progressAutoAdvance && progressRow < progressRowMax) {
        setProgressRow((row) => clampNumber(row + 1, progressRowMin, progressRowMax));
        return 1;
      }
      return total;
    });
  }, [cols, progressAutoAdvance, progressRow, progressRowMin, progressRowMax, setProgressRow, setProgressStitch]);

  const stitchBackward = useCallback(() => {
    setProgressStitch((previous) => {
      if (previous > 1) return previous - 1;
      // 행 처음: 자동 이동이 켜져 있고 이전 행이 있으면 이전 행 마지막 코로.
      if (progressAutoAdvance && progressRow > progressRowMin) {
        setProgressRow((row) => clampNumber(row - 1, progressRowMin, progressRowMax));
        return cols;
      }
      return 1;
    });
  }, [cols, progressAutoAdvance, progressRow, progressRowMin, progressRowMax, setProgressRow, setProgressStitch]);

  // 코 단위 키보드 조작. 입력 필드에 포커스가 있으면 무시한다.
  useEffect(() => {
    if (mode !== 'progress') return undefined;
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const tag = target?.tagName;
      // 입력 필드(슬라이더 등)에 포커스가 있으면 무시. 코 카운터 버튼은 포커스를 잡지 않게 해
      // 스페이스 이중 처리를 막는다(패널 버튼 onMouseDown preventDefault).
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowRight') {
        event.preventDefault();
        stitchForward();
      } else if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
        event.preventDefault();
        stitchBackward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, stitchForward, stitchBackward]);

  const paintCell = useCallback(
    (row, col, selectedTool = tool, shouldRecord = true) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      setCurrentCell({ row, col });

      // 편집 모드에서만 페인팅 허용 (미리보기/진행 모드는 보기 전용)
      if (mode !== 'edit') return;

      if (selectedTool === 'select' || selectedTool === 'pan') return;

      if (selectedTool === 'picker') {
        const cell = grid[row][col];
        if (cell.paletteId) setActivePaletteId(cell.paletteId);
        return;
      }

      if (shouldRecord) pushHistory();

      setGrid((previous) => {
        const next = cloneGrid(previous);
        if (selectedTool === 'eraser') {
          next[row][col] = makeCell();
        } else if (selectedTool === 'fill') {
          const source = previous[row][col];
          const sourceKey = `${source.active}-${source.paletteId}-${source.symbol}`;
          const replacement = {
            active: true,
            color: activePalette.color,
            symbol: activePalette.code,
            label: activePalette.name,
            note: '',
            paletteId: activePalette.id
          };
          const queue = [[row, col]];
          const seen = new Set();
          while (queue.length) {
            const [r, c] = queue.shift();
            const key = `${r}:${c}`;
            if (seen.has(key) || r < 0 || r >= rows || c < 0 || c >= cols) continue;
            seen.add(key);
            const target = previous[r][c];
            const targetKey = `${target.active}-${target.paletteId}-${target.symbol}`;
            if (targetKey !== sourceKey) continue;
            next[r][c] = replacement;
            queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
          }
        } else {
          const existing = previous[row][col];
          const same = existing.active && existing.paletteId === activePalette.id;
          next[row][col] = same && shouldRecord
            ? makeCell()
            : {
                active: true,
                color: activePalette.color,
                symbol: activePalette.code,
                label: activePalette.name,
                note: '',
                paletteId: activePalette.id
              };
        }
        return next;
      });
    },
    [activePalette, cols, grid, mode, pushHistory, rows, tool]
  );

  // memo된 셀에 내려가는 콜백은 참조가 안정적이어야 스킵이 동작한다 → useCallback 필수.
  const handlePointerDown = useCallback((row, col) => {
    setCurrentCell({ row, col });
    if (mode === 'progress' && ['pen', 'eraser'].includes(tool)) {
      setIsDragging(true);
      updateProgressMark(row, col, tool === 'eraser' ? 'remove' : 'add');
      return;
    }
    if (mode !== 'edit') return;
    setIsDragging(true);
    if (tool === 'select') {
      const inside = gridSelection
        && row >= gridSelection.r0 && row <= gridSelection.r1
        && col >= gridSelection.c0 && col <= gridSelection.c1;
      if (inside) {
        selectionDragRef.current = { type: 'move', start: { row, col }, base: gridSelection, delta: { dRow: 0, dCol: 0 } };
        setSelectionMoveDelta({ dRow: 0, dCol: 0 });
      } else {
        selectionDragRef.current = { type: 'select', anchor: { row, col } };
        setGridSelection({ r0: row, c0: col, r1: row, c1: col });
      }
      return;
    }
    setInsertAnchorCell({ row, col });
    paintCell(row, col, tool, true);
  }, [mode, tool, gridSelection, setGridSelection, updateProgressMark, paintCell]);

  const handlePointerEnter = useCallback((row, col) => {
    // isDragging(atom)은 같은 tick의 후속 이벤트에 반영이 늦다 → 드래그 여부는 ref로 판단(pointerup에서 해제됨).
    if (tool === 'select' && selectionDragRef.current) {
      const drag = selectionDragRef.current;
      if (drag.type === 'select') {
        const { anchor } = drag;
        setGridSelection({
          r0: Math.min(anchor.row, row),
          c0: Math.min(anchor.col, col),
          r1: Math.max(anchor.row, row),
          c1: Math.max(anchor.col, col)
        });
      } else {
        drag.delta = { dRow: row - drag.start.row, dCol: col - drag.start.col };
        setSelectionMoveDelta(drag.delta);
      }
      return;
    }
    // ponytail: hover마다 setCurrentCell 하면 전역 atom→전체 리렌더. 드래그 페인팅 중엔 paintCell이 갱신함.
    if (!isDragging || !['pen', 'eraser'].includes(tool)) return;
    setCurrentCell({ row, col });
    if (mode === 'progress') {
      updateProgressMark(row, col, tool === 'eraser' ? 'remove' : 'add');
      return;
    }
    paintCell(row, col, tool, false);
  }, [isDragging, tool, mode, setGridSelection, updateProgressMark, paintCell]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    const drag = selectionDragRef.current;
    selectionDragRef.current = null;
    // 커밋은 ref 기준(같은 tick의 state 지연과 무관하게 정확)
    if (drag?.type === 'move' && drag.base && (drag.delta.dRow || drag.delta.dCol)) {
      const { dRow, dCol } = drag.delta;
      pushHistory();
      setGrid((previous) => moveGridRegion(previous, drag.base, dRow, dCol));
      setGridSelection({
        r0: clampNumber(drag.base.r0 + dRow, 0, rows - 1),
        c0: clampNumber(drag.base.c0 + dCol, 0, cols - 1),
        r1: clampNumber(drag.base.r1 + dRow, 0, rows - 1),
        c1: clampNumber(drag.base.c1 + dCol, 0, cols - 1)
      });
    }
    setSelectionMoveDelta(null);
  }, [pushHistory, setGrid, setGridSelection, rows, cols]);

  const undo = () => {
    setHistory((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setFuture((futureItems) => [
        makeSnapshot(grid, palette, activePaletteId, {
          rows,
          cols,
          currentCell,
          insertAnchorCell,
          progressRow,
          completedRows
        }),
        ...futureItems.slice(0, 24)
      ]);
      applySnapshot(previous);
      return items.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((items) => {
      if (!items.length) return items;
      const next = items[0];
      setHistory((historyItems) => [
        ...historyItems.slice(-24),
        makeSnapshot(grid, palette, activePaletteId, {
          rows,
          cols,
          currentCell,
          insertAnchorCell,
          progressRow,
          completedRows
        })
      ]);
      applySnapshot(next);
      return items.slice(1);
    });
  };

  const commitGridResize = (nextRows, nextCols, mode) => {
    const safeRows = Math.min(200, Math.max(1, Number(nextRows) || rows));
    const safeCols = Math.min(200, Math.max(1, Number(nextCols) || cols));
    pushHistory();
    const nextGrid = mode === 'keep'
      ? resizeGridKeepingContentAligned(grid, safeRows, safeCols, {
          // 이미지 도안은 이미지 정렬 기준, 손그림은 좌상단(start) 기준. offset이 있으면 드래그로 조정한 위치 사용
          alignX: appliedSourceImage ? imageAlignmentToResizeAnchor(appliedSourceImage.imageOptions?.alignX, 'left', 'right') : 'start',
          alignY: appliedSourceImage ? imageAlignmentToResizeAnchor(appliedSourceImage.imageOptions?.alignY, 'top', 'bottom') : 'start',
          offsetX: pendingResize?.offsetX,
          offsetY: pendingResize?.offsetY
        })
      : createGrid(safeRows, safeCols);
    applyGridStructure(nextGrid, safeRows, safeCols);
    setPendingResize(null);
    setProgressRow(numberStart);
    setProgressStitch(1);
    setCompletedRows(new Set());
  };

  const requestGridResize = (nextRows, nextCols) => {
    const safeRows = Math.min(200, Math.max(1, Number(nextRows) || rows));
    const safeCols = Math.min(200, Math.max(1, Number(nextCols) || cols));
    if (safeRows === rows && safeCols === cols) return;
    if (hasPaintedCells(grid)) {
      setPendingResize({ rows: safeRows, cols: safeCols });
      return;
    }
    commitGridResize(safeRows, safeCols, 'reset');
  };

  const movePattern = (rowDelta, colDelta) => {
    const steps = clampNumber(moveSteps, 1, 200);
    // 선택 영역이 있으면 그 영역만 이동, 없으면 도안 전체 이동
    if (gridSelection) {
      setMoveSteps(steps);
      moveSelection(rowDelta * steps, colDelta * steps);
      return;
    }
    if (!paintedCellCount) return;
    pushHistory();
    setMoveSteps(steps);
    setGrid((previous) => moveGridContent(previous, rowDelta * steps, colDelta * steps));
  };

  const insertRow = (placement) => {
    if (rows >= 200) return;
    // 선택 영역이 있으면 선택 경계 기준(위=선택 첫 행 앞, 아래=선택 마지막 행 뒤)
    const insertIndex = gridSelection
      ? (placement === 'above' ? gridSelection.r0 : gridSelection.r1 + 1)
      : (placement === 'above' ? insertAnchorCell.row : insertAnchorCell.row + 1);
    const nextRows = rows + 1;
    const nextAnchorCell = placement === 'above'
      ? { ...insertAnchorCell, row: insertAnchorCell.row + 1 }
      : insertAnchorCell;
    pushHistory();
    applyGridStructure(insertGridRow(grid, insertIndex), nextRows, cols, currentCell, nextAnchorCell);
    if (gridSelection && placement === 'above') {
      setGridSelection({ ...gridSelection, r0: gridSelection.r0 + 1, r1: gridSelection.r1 + 1 });
    }
  };

  const insertCol = (placement) => {
    if (cols >= 200) return;
    const insertIndex = gridSelection
      ? (placement === 'left' ? gridSelection.c0 : gridSelection.c1 + 1)
      : (placement === 'left' ? insertAnchorCell.col : insertAnchorCell.col + 1);
    const nextCols = cols + 1;
    const nextAnchorCell = placement === 'left'
      ? { ...insertAnchorCell, col: insertAnchorCell.col + 1 }
      : insertAnchorCell;
    pushHistory();
    applyGridStructure(insertGridCol(grid, insertIndex), rows, nextCols, currentCell, nextAnchorCell);
    if (gridSelection && placement === 'left') {
      setGridSelection({ ...gridSelection, c0: gridSelection.c0 + 1, c1: gridSelection.c1 + 1 });
    }
  };

  const removeRow = (placement) => {
    const targetRow = placement === 'above' ? insertAnchorCell.row - 1 : insertAnchorCell.row + 1;
    if (rows <= 1 || targetRow < 0 || targetRow >= rows) return;
    const nextRows = rows - 1;
    pushHistory();
    applyGridStructure(
      removeGridRow(grid, targetRow),
      nextRows,
      cols,
      adjustCellAfterRowRemoval(currentCell, targetRow, nextRows),
      adjustCellAfterRowRemoval(insertAnchorCell, targetRow, nextRows)
    );
  };

  const removeCol = (placement) => {
    const targetCol = placement === 'left' ? insertAnchorCell.col - 1 : insertAnchorCell.col + 1;
    if (cols <= 1 || targetCol < 0 || targetCol >= cols) return;
    const nextCols = cols - 1;
    pushHistory();
    applyGridStructure(
      removeGridCol(grid, targetCol),
      rows,
      nextCols,
      adjustCellAfterColRemoval(currentCell, targetCol, nextCols),
      adjustCellAfterColRemoval(insertAnchorCell, targetCol, nextCols)
    );
  };

  const mirrorGrid = () => {
    pushHistory();
    setGrid((previous) => previous.map((row) => [...row].reverse()));
    setCurrentCell((cell) => ({ ...cell, col: cols - 1 - cell.col }));
    setInsertAnchorCell((cell) => ({ ...cell, col: cols - 1 - cell.col }));
  };

  useEffect(() => {
    if (mode !== 'edit') return undefined;
    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      // 한/영 IME 상태와 무관하게 물리 키로 매칭(예: 'ㄴ'이어도 code는 KeyS)
      const key = event.code?.startsWith('Key')
        ? event.code.slice(3).toLowerCase()
        : event.key.toLowerCase();
      const nextTool = TOOL_SHORTCUTS.get(key);
      if (!nextTool) return;
      event.preventDefault();
      if (nextTool === 'mirror') {
        mirrorGrid();
      } else {
        setTool(nextTool);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, mirrorGrid, setTool]);

  // 전역 단축키: mod+Z 되돌리기, mod+Shift+Z 다시실행, mod+S 저장, +/- 줌. 물리 키(code) 기반이라 한/영 무관.
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

      const mod = event.metaKey || event.ctrlKey;
      if (mod && !event.altKey && event.code === 'KeyZ') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && !event.altKey && !event.shiftKey && event.code === 'KeyS') {
        event.preventDefault();
        saveCurrentLocalProject();
        return;
      }
      if (mod || event.altKey) return;
      if (event.code === 'Equal' || event.code === 'NumpadAdd') {
        event.preventDefault();
        setZoom((value) => clampNumber(value + 8, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM));
      } else if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
        event.preventDefault();
        setZoom((value) => clampNumber(value - 8, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveCurrentLocalProject, setZoom]);

  const rotateGrid = () => {
    pushHistory();
    setGrid((previous) => {
      const next = Array.from({ length: cols }, (_, r) =>
        Array.from({ length: rows }, (_, c) => ({ ...previous[rows - 1 - c][r] }))
      );
      setRows(cols);
      setCols(rows);
      setDraftRows(cols);
      setDraftCols(rows);
      setCurrentCell((cell) => ({ row: cell.col, col: rows - 1 - cell.row }));
      setInsertAnchorCell((cell) => ({ row: cell.col, col: rows - 1 - cell.row }));
      return next;
    });
  };

  const copyRepeat = () => {
    pushHistory();
    setGrid((previous) => {
      const next = cloneGrid(previous);
      const blockRows = Math.min(12, rows);
      const blockCols = Math.min(12, cols);
      for (let r = 0; r < rows; r += blockRows) {
        for (let c = 0; c < cols; c += blockCols) {
          for (let br = 0; br < blockRows && r + br < rows; br += 1) {
            for (let bc = 0; bc < blockCols && c + bc < cols; bc += 1) {
              next[r + br][c + bc] = { ...previous[br][bc] };
            }
          }
        }
      }
      return next;
    });
  };

  const toggleCompletedRow = (rowNumber) => {
    setCompletedRows((previous) => {
      const next = new Set(previous);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const rowNumber = useCallback(
    (rowIndex) => rowDirection === 'bottom-up' ? rows - rowIndex - 1 + numberStart : rowIndex + numberStart,
    [rowDirection, rows, numberStart]
  );

  const colNumber = useCallback((colIndex) => colIndex + numberStart, [numberStart]);

  const {
    buildExportCanvas,
    buildWrittenPattern,
    downloadWrittenPatternText,
    exportPng,
    exportPdf,
    saveProject
  } = useExport({
    grid, palette, rows, cols, projectName, rowDirection, numberStart, guideEvery,
    gridLineColorMode, guideLineColor, gridLineColor, cellAspectActive, cellAspectScale,
    activeCounts, rowNumber, colNumber, serializeCurrentProject,
    writtenKnitMode, writtenStartDirection, writtenIncludeInPdf
  });

  const loadProject = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        applyProjectData(data, { localId: '' });
        setLocalSaveMessage('JSON에서 열린 임시 작업');
      } catch (error) {
        setLocalSaveState('error');
        setLocalSaveMessage(error.message || '프로젝트 파일을 열지 못했습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const backupAllLocalProjects = useCallback(async () => {
    try {
      const backup = await exportAllLocalProjects();
      if (!backup.projects.length) {
        setLocalSaveState('error');
        setLocalSaveMessage('백업할 로컬 작업이 없습니다.');
        return;
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = `knitgrid-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      setLocalSaveMessage(`${backup.projects.length}개 작업을 백업 파일로 저장했습니다.`);
    } catch (error) {
      setLocalSaveState('error');
      setLocalSaveMessage(error.message || '전체 저장에 실패했습니다.');
    }
  }, []);

  const restoreAllLocalProjects = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const count = await importLocalProjects(JSON.parse(await file.text()));
      await refreshLocalProjects();
      setLocalSaveMessage(`${count}개 작업을 불러왔습니다.`);
    } catch (error) {
      setLocalSaveState('error');
      setLocalSaveMessage(error.message || '전체 불러오기에 실패했습니다.');
    }
  }, [refreshLocalProjects]);

  // 레퍼런스 이미지도 변환 흐름과 동일한 크롭 모달을 거친다(mode: 'reference'로 구분).
  const loadReferenceImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setCropDraft({
        src,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight,
        mode: 'reference',
        cropSelection: INITIAL_CROP_SELECTION,
        cropArea: convertPercentCropToImageCrop(INITIAL_CROP_SELECTION)
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
    };
    image.src = src;
    event.target.value = '';
  };

  // 크롭 영역만 잘라내 변환 없이 트레이싱 레이어로 격자 위에 올린다(격자/팔레트는 그대로, 세션 한정).
  const applyReferenceCrop = (draft, crop) => {
    const image = new Image();
    image.onload = () => {
      const sw = Math.max(1, Math.round(crop.width * image.naturalWidth));
      const sh = Math.max(1, Math.round(crop.height * image.naturalHeight));
      const sx = Math.round(crop.x * image.naturalWidth);
      const sy = Math.round(crop.y * image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedSrc = URL.createObjectURL(blob);
        URL.revokeObjectURL(draft.src);
        replaceAppliedSourceImageFromDraft(
          { src: croppedSrc, name: draft.name, width: sw, height: sh },
          { ...INITIAL_IMAGE_OPTIONS, fit: 'contain' },
          rows,
          cols
        );
        setMode('edit');
        setShowAppliedSourceOverlay(true);
        setIsAdjustingAppliedSourceOverlay(true);
      }, 'image/png');
    };
    image.src = draft.src;
    setCropDraft(null);
  };

  const prepareImageDraft = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImageOptions(INITIAL_IMAGE_OPTIONS);
      setImagePaletteMode('extract');
      setImageCandidates([]);
      setSelectedImageCandidateId('');
      setImageCandidateSeed(0);
      setShowOriginalOverlay(false);
      setOriginalOverlayOpacity(46);
      setCropDraft({
        src,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cropSelection: INITIAL_CROP_SELECTION,
        cropArea: convertPercentCropToImageCrop(INITIAL_CROP_SELECTION)
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      event.target.value = '';
    };
    image.src = src;
    event.target.value = '';
  };

  const closeCropDraft = () => {
    if (cropDraft?.src) URL.revokeObjectURL(cropDraft.src);
    setCropDraft(null);
  };

  const completeCropDraft = () => {
    if (!cropDraft?.cropArea) return;
    const crop = normalizeCrop(cropDraft.cropArea);
    if (cropDraft.mode === 'reference') {
      applyReferenceCrop(cropDraft, crop);
      return;
    }
    setImageOptions({
      ...INITIAL_IMAGE_OPTIONS,
      fit: 'stretch',
      crop: {
        ...crop,
        enabled: true
      }
    });
    setImageDraft({
      src: cropDraft.src,
      name: cropDraft.name,
      width: cropDraft.width,
      height: cropDraft.height
    });
    setCropDraft(null);
  };

  const closeImageDraft = () => {
    if (imageDraft?.src) URL.revokeObjectURL(imageDraft.src);
    setImageDraft(null);
    setImageCandidates([]);
    setSelectedImageCandidateId('');
    setImageCandidateLoading(false);
    setShowOriginalOverlay(false);
  };

  const applyImageDraft = () => {
    if (!imageDraft || !selectedImageCandidate) return;
    pushHistory();
    // 변환 후보는 imageConversionSize 크기로 만들어지므로 격자 칸 수도 항상 그에 맞춘다.
    const { rows: appliedRows, cols: appliedCols } = imageConversionSize;
    setRows(appliedRows);
    setCols(appliedCols);
    setGrid(cloneGrid(selectedImageCandidate.grid));
    setProgressMarks(new Set());
    replaceAppliedSourceImageFromDraft(imageDraft, effectiveImageOptions, appliedRows, appliedCols);
    if (imagePaletteMode === 'extract') {
      const nextPalette = clonePalette(selectedImageCandidate.palette);
      setPalette(nextPalette);
      setActivePaletteId(nextPalette[0]?.id ?? activePaletteId);
      setExpandedPaletteId('');
      setPaletteNotice(`이미지에서 ${nextPalette.length}개 색상을 추출했습니다.`);
    }
    setMode('edit');
    setImageDraft(null);
    setImageCandidates([]);
    setSelectedImageCandidateId('');
    setImageCandidateLoading(false);
    setShowOriginalOverlay(false);
  };

  const mergePaletteItems = ({ sourceId, targetId }) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const sourceItem = getPaletteItem(palette, sourceId);
    const targetItem = getPaletteItem(palette, targetId);
    if (!sourceItem || !targetItem) return;

    pushHistory();
    setPalette((items) => items.filter((item) => item.id !== sourceId));
    setGrid((previous) => syncCellsForPaletteMerge(previous, sourceItem, targetItem));
    if (activePaletteId === sourceId) setActivePaletteId(targetId);
    if (expandedPaletteId === sourceId) setExpandedPaletteId(targetId);
    setPaletteNotice(`${sourceItem.code}가 ${targetItem.code}로 병합되었습니다.`);
  };

  const deletePaletteItem = (sourceId, replacementId = '') => {
    const sourceItem = getPaletteItem(palette, sourceId);
    if (!sourceItem || palette.length <= 1) return;

    const usage = activeCounts.get(sourceId) || 0;
    const replacementItem = replacementId ? getPaletteItem(palette, replacementId) : null;
    if (usage > 0 && !replacementItem) {
      setPaletteNotice(`${sourceItem.code}는 ${usage}칸에서 사용 중입니다. 대체 색상을 선택한 뒤 삭제하세요.`);
      return;
    }

    const nextActiveId = activePaletteId === sourceId
      ? replacementItem?.id ?? palette.find((item) => item.id !== sourceId)?.id
      : activePaletteId;

    pushHistory();
    setPalette((items) => items.filter((item) => item.id !== sourceId));
    setGrid((previous) =>
      replacementItem
        ? syncCellsForPaletteMerge(previous, sourceItem, replacementItem)
        : clearCellsForPalette(previous, sourceItem)
    );
    setActivePaletteId(nextActiveId);
    setExpandedPaletteId('');
    setPaletteNotice(
      replacementItem
        ? `${sourceItem.code}를 삭제하고 ${replacementItem.code}로 ${usage}칸을 옮겼습니다.`
        : `${sourceItem.code}를 삭제했습니다.`
    );
  };

  const togglePaletteVisibility = (id) => {
    const currentItem = getPaletteItem(palette, id);
    if (!currentItem) return;

    pushHistory();
    setPalette((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, visible: !isPaletteVisible(item) }
          : item
      )
    );
    setPaletteNotice(
      isPaletteVisible(currentItem)
        ? `${currentItem.code}를 도안에서 숨겼습니다.`
        : `${currentItem.code}를 도안에 다시 표시했습니다.`
    );
  };

  // ponytail: 조정 중 값이 우연히 겹쳐도 자동 병합하지 않는다. 병합은 "기존 색상으로 병합" 수동 UI로만.
  const updatePaletteItem = (id, patch) => {
    const currentItem = getPaletteItem(palette, id);
    if (!currentItem) return;

    const normalizedPatch = { ...patch };
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, 'color')) {
      const normalizedColor = normalizeHex(normalizedPatch.color);
      if (!normalizedColor) return;
      normalizedPatch.color = normalizedColor;
    }

    const nextItem = { ...currentItem, ...normalizedPatch };

    pushHistory();
    setPalette((items) => items.map((item) => (item.id === id ? nextItem : item)));
    setGrid((previous) => syncCellsForPaletteChange(previous, nextItem));
    setPaletteNotice('');
  };

  const addPaletteColor = () => {
    const id = `c${Date.now()}`;
    pushHistory();
    setPalette((items) => [
      ...items,
      {
        id,
        code: `C${items.length + 1}`,
        name: '새 색상',
        color: '#f5b84b',
        visible: true
      }
    ]);
    setActivePaletteId(id);
    setExpandedPaletteId(id);
    setPaletteNotice('');
  };

  // URL이 진실의 원천: '/'(project 파라미터 없음)는 항상 인덱스(홈), ?project=...는 에디터
  const showProjectStartScreen = routeProject === null;


  return {
    rows,
    setRows,
    cols,
    setCols,
    draftRows,
    setDraftRows,
    draftCols,
    setDraftCols,
    grid,
    setGrid,
    palette,
    setPalette,
    activePaletteId,
    setActivePaletteId,
    tool,
    setTool,
    mode,
    setMode,
    displayMode,
    setDisplayMode,
    zoom,
    setZoom,
    guideEvery,
    setGuideEvery,
    guideColorMode,
    setGuideColorMode,
    guideCustomColor,
    setGuideCustomColor,
    gridLineColorMode,
    setGridLineColorMode,
    gridLineCustomColor,
    setGridLineCustomColor,
    gridLineColor,
    numberStart,
    setNumberStart,
    rowDirection,
    setRowDirection,
    gaugeStitches,
    setGaugeStitches,
    gaugeRows,
    setGaugeRows,
    cellAspectRatio,
    setCellAspectRatio,
    writtenKnitMode,
    setWrittenKnitMode,
    writtenStartDirection,
    setWrittenStartDirection,
    writtenIncludeInPdf,
    setWrittenIncludeInPdf,
    buildWrittenPattern,
    downloadWrittenPatternText,
    hasGauge,
    finishedSize,
    cellAspectActive,
    cellAspectScale,
    computeGridSizeForDimensions,
    showOppositeHeaders,
    setShowOppositeHeaders,
    currentCell,
    setCurrentCell,
    insertAnchorCell,
    setInsertAnchorCell,
    progressRow,
    progressMarks,
    setProgressRow,
    progressStitch,
    setProgressStitch,
    progressAutoAdvance,
    setProgressAutoAdvance,
    progressRowMin,
    progressRowMax,
    currentRowAnalysis,
    progressStitchCell,
    handleProgressRowChange,
    handleProgressStitchChange,
    stitchForward,
    stitchBackward,
    wakeLockEnabled,
    setWakeLockEnabled,
    wakeLockSupported: wakeLock.supported,
    wakeLockStatus: wakeLock.status,
    completedRows,
    setCompletedRows,
    history,
    setHistory,
    future,
    setFuture,
    isDragging,
    setIsDragging,
    projectName,
    setProjectName,
    cropDraft,
    setCropDraft,
    imageDraft,
    setImageDraft,
    imageOptions,
    setImageOptions,
    imagePaletteMode,
    setImagePaletteMode,
    imageColorCount,
    setImageColorCount,
    imageGrayscale,
    setImageGrayscale,
    imageCandidates,
    setImageCandidates,
    selectedImageCandidateId,
    setSelectedImageCandidateId,
    imageCandidateSeed,
    setImageCandidateSeed,
    imageCandidateLoading,
    setImageCandidateLoading,
    showOriginalOverlay,
    setShowOriginalOverlay,
    originalOverlayOpacity,
    setOriginalOverlayOpacity,
    appliedSourceImage,
    setAppliedSourceImage,
    showAppliedSourceOverlay,
    setShowAppliedSourceOverlay,
    appliedSourceOverlayOpacity,
    setAppliedSourceOverlayOpacity,
    isAdjustingAppliedSourceOverlay,
    setIsAdjustingAppliedSourceOverlay,
    appliedSourceOverlayMoveStep,
    setAppliedSourceOverlayMoveStep,
    appliedSourceOverlayTransform,
    setAppliedSourceOverlayTransform,
    expandedPaletteId,
    setExpandedPaletteId,
    paletteNotice,
    setPaletteNotice,
    pendingResize,
    setPendingResize,
    moveSteps,
    setMoveSteps,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    currentLocalProjectId,
    setCurrentLocalProjectId,
    localProjects,
    setLocalProjects,
    localProjectsOpen,
    setLocalProjectsOpen,
    localSaveState,
    setLocalSaveState,
    localSaveMessage,
    setLocalSaveMessage,
    pendingNewProject,
    setPendingNewProject,
    startScreenDismissed,
    setStartScreenDismissed,
    routeProject,
    goToStartScreen,
    showProjectStartScreen,
    fileInputRef,
    projectInputRef,
    backupInputRef,
    activePalette,
    activeCounts,
    imageWarnings,
    imagePreviewCounts,
    selectedImageCandidate,
    detectedPixelGrid,
    imageConversionSize,
    ...textDraftEditor,
    updateCropDraftSelection,
    completeCropDraftSelection,
    resetCropDraft,
    appliedSourceSizeChanged,
    appliedSourceTransformCss,
    guideLineColor,
    resetAppliedSourceOverlayTransform,
    updateAppliedSourceOverlayTransform,
    moveAppliedSourceOverlay,
    handleAppliedSourceOverlayPointerDown,
    handleAppliedSourceOverlayPointerMove,
    handleAppliedSourceOverlayPointerUp,
    clearAppliedSourceImage,
    replaceAppliedSourceImageFromDraft,
    serializeCurrentProject,
    applyProjectData,
    refreshLocalProjects,
    saveCurrentLocalProject,
    resetToNewProject,
    openLocalProjectsModal,
    requestNewProject,
    saveAndStartNewProject,
    openLocalProject,
    duplicateProject,
    removeLocalProject,
    renameLocalProject,
    pushHistory,
    clampProgressRow,
    clampCompletedRows,
    applySnapshot,
    applyGridStructure,
    paintCell,
    clearProgressMarks,
    clearGrid,
    gridSelection,
    selectionRect,
    clearSelection,
    deleteSelection,
    removeSelectedRows,
    removeSelectedCols,
    scalePattern,
    handlePointerDown,
    handlePointerEnter,
    handlePointerUp,
    undo,
    redo,
    commitGridResize,
    requestGridResize,
    movePattern,
    insertRow,
    insertCol,
    removeRow,
    removeCol,
    mirrorGrid,
    rotateGrid,
    copyRepeat,
    toggleCompletedRow,
    rowNumber,
    colNumber,
    buildExportCanvas,
    exportPng,
    exportPdf,
    saveProject,
    loadProject,
    backupAllLocalProjects,
    restoreAllLocalProjects,
    prepareImageDraft,
    referenceInputRef,
    loadReferenceImage,
    closeCropDraft,
    completeCropDraft,
    closeImageDraft,
    applyImageDraft,
    mergePaletteItems,
    deletePaletteItem,
    togglePaletteVisibility,
    updatePaletteItem,
    addPaletteColor,
    paintedCellCount,
    hasCurrentWork,
    localSaveStatusLabel
  };
}
