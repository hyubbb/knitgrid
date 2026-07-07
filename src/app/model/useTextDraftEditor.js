import { useEffect, useMemo, useState } from 'react';
import { loadAppFonts } from '../../shared/lib/fonts.js';
import { useAtom } from 'jotai';
import {
  textDraftAtom,
  textOptionsAtom
} from '../state/editorAtoms.js';
import {
  INITIAL_TEXT_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_FONT_OPTIONS,
  TEXT_GRID_MAX_SIZE,
  TEXT_GRID_MIN_SIZE,
  TEXT_MAX_CHARS,
  TEXT_MAX_LINES,
  TEXT_WEIGHT_OPTIONS,
  buildTextPatternDraft,
  clampCellToGrid,
  cloneGrid,
  getPaletteItem,
  normalizeTextGridSize,
  normalizeTextOptions
} from './knitgridModel.js';

const TEXT_GRID_SCALE_STEP = 0.125;

export function useTextDraftEditor({
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
  clearProgressMarks
}) {
  const [textDraft, setTextDraft] = useAtom(textDraftAtom);
  const [textOptions, setTextOptions] = useAtom(textOptionsAtom);
  const [fontLoadVersion, setFontLoadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadAppFonts().finally(() => {
      if (!cancelled) setFontLoadVersion((version) => version + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const textPaletteItem = useMemo(
    () => getPaletteItem(palette, textOptions.paletteId) ?? activePalette ?? palette[0] ?? null,
    [activePalette, palette, textOptions.paletteId]
  );
  const textTargetRows = normalizeTextGridSize(textOptions.targetRows, rows);
  const textTargetCols = normalizeTextGridSize(textOptions.targetCols, cols);
  const textPreview = useMemo(() => {
    if (!textDraft) return null;
    return buildTextPatternDraft({
      rows: textTargetRows,
      cols: textTargetCols,
      paletteItem: textPaletteItem,
      options: textOptions
    });
  }, [fontLoadVersion, textDraft, textOptions, textPaletteItem, textTargetCols, textTargetRows]);

  const openTextDraft = () => {
    setTextOptions({
      ...INITIAL_TEXT_OPTIONS,
      paletteId: activePalette?.id ?? palette[0]?.id ?? '',
      targetRows: rows,
      targetCols: cols
    });
    setTextDraft({ openedAt: Date.now() });
  };

  const updateTextOptions = (patch) => {
    setTextOptions((previous) => normalizeTextOptions({ ...previous, ...patch }));
  };

  const closeTextDraft = () => {
    setTextDraft(null);
  };

  const applyTextDraft = () => {
    if (!textPreview?.paintedCellCount) return;
    pushHistory();
    setRows(textTargetRows);
    setCols(textTargetCols);
    setDraftRows(textTargetRows);
    setDraftCols(textTargetCols);
    setGrid(cloneGrid(textPreview.grid));
    setCurrentCell((cell) => clampCellToGrid(cell, textTargetRows, textTargetCols));
    setInsertAnchorCell((cell) => clampCellToGrid(cell, textTargetRows, textTargetCols));
    setProgressRow(numberStart);
    setCompletedRows(new Set());
    clearProgressMarks();
    setMode('edit');
    setTextDraft(null);
    setPaletteNotice(`텍스트에서 ${textPreview.paintedCellCount}칸을 생성했습니다.`);
  };

  const resizeTextTargetGrid = (direction) => {
    setTextOptions((previous) => {
      const normalized = normalizeTextOptions(previous);
      const scale = direction > 0 ? 1 + TEXT_GRID_SCALE_STEP : 1 - TEXT_GRID_SCALE_STEP;
      return normalizeTextOptions({
        ...normalized,
        targetRows: normalizeTextGridSize(normalized.targetRows * scale, normalized.targetRows),
        targetCols: normalizeTextGridSize(normalized.targetCols * scale, normalized.targetCols)
      });
    });
  };

  const updateTextTargetGrid = (patch) => {
    setTextOptions((previous) => normalizeTextOptions({ ...previous, ...patch }));
  };

  return {
    textDraft,
    textOptions,
    setTextOptions,
    textPreview,
    textTargetRows,
    textTargetCols,
    textGridMinSize: TEXT_GRID_MIN_SIZE,
    textGridMaxSize: TEXT_GRID_MAX_SIZE,
    canShrinkTextTargetGrid: textTargetRows > TEXT_GRID_MIN_SIZE && textTargetCols > TEXT_GRID_MIN_SIZE,
    canGrowTextTargetGrid: textTargetRows < TEXT_GRID_MAX_SIZE && textTargetCols < TEXT_GRID_MAX_SIZE,
    textPaletteItem,
    textFontOptions: TEXT_FONT_OPTIONS,
    textWeightOptions: TEXT_WEIGHT_OPTIONS,
    textAlignOptions: TEXT_ALIGN_OPTIONS,
    textMaxChars: TEXT_MAX_CHARS,
    textMaxLines: TEXT_MAX_LINES,
    openTextDraft,
    updateTextOptions,
    resizeTextTargetGrid,
    updateTextTargetGrid,
    closeTextDraft,
    applyTextDraft
  };
}
