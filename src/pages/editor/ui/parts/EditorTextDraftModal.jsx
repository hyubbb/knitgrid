import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Minus, Plus, Type } from 'lucide-react';
import { Button, Modal } from '../../../../components/index.js';
import { TEXT_SAMPLE_SCALE } from '../../../../app/model/knitgridModel.js';
import { parseNumericInput } from '../../../../shared/lib/number.js';

const DEFAULT_ZOOM_PREVIEW_CELL_SIZE = 16;
const MIN_ZOOM_PREVIEW_CELL_SIZE = 10;
const MAX_ZOOM_PREVIEW_CELL_SIZE = 32;
const ZOOM_PREVIEW_CELL_STEP = 2;
const ZOOM_PREVIEW_CELL_GAP = 1;

const clampPreviewCellSize = (value) =>
  Math.min(MAX_ZOOM_PREVIEW_CELL_SIZE, Math.max(MIN_ZOOM_PREVIEW_CELL_SIZE, value));

// ponytail: 편집 중엔 원본 문자열을 보여주고 blur 때 정규화값으로 되돌린다(매 키 clamp 방지)
function GridSizeInput({ value, ariaLabel, onCommit }) {
  const [buffer, setBuffer] = useState(String(value));
  const focusedRef = useRef(false);
  useEffect(() => {
    if (!focusedRef.current) setBuffer(String(value));
  }, [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      spellCheck={false}
      value={buffer}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(event) => {
        const raw = event.target.value.replace(/[^0-9]/g, '');
        setBuffer(raw);
        onCommit(parseNumericInput(raw, value));
      }}
      onBlur={() => {
        focusedRef.current = false;
        setBuffer(String(value));
      }}
      aria-label={ariaLabel}
    />
  );
}

export function EditorTextDraftModal({ editor }) {
  const {
    textDraft,
    closeTextDraft,
    applyTextDraft,
    palette,
    textOptions,
    updateTextOptions,
    textPreview,
    textTargetRows,
    textTargetCols,
    canShrinkTextTargetGrid,
    canGrowTextTargetGrid,
    resizeTextTargetGrid,
    updateTextTargetGrid,
    textPaletteItem,
    textFontOptions,
    textWeightOptions,
    textAlignOptions,
    textMaxChars,
    textMaxLines
  } = editor;
  const textLength = textOptions.text.replace(/\n/g, '').length;
  const lineCount = textOptions.text ? textOptions.text.split('\n').length : 0;
  const canApply = Boolean(textPreview?.paintedCellCount);
  const paletteLabel = textPaletteItem ? `${textPaletteItem.code} ${textPaletteItem.name}` : '선택한 색상';
  const [previewMode, setPreviewMode] = useState('fit');
  const [previewCellSize, setPreviewCellSize] = useState(DEFAULT_ZOOM_PREVIEW_CELL_SIZE);
  const previewScrollRef = useRef(null);
  const isZoomedPreview = previewMode === 'zoom';
  const zoomPercent = Math.round((previewCellSize / DEFAULT_ZOOM_PREVIEW_CELL_SIZE) * 100);
  const textCellHeight = textPreview?.fontSize ? textPreview.fontSize / TEXT_SAMPLE_SCALE : 0;
  const shouldSuggestZoom = canApply && textCellHeight > 0 && textCellHeight < 7;
  const previewFrameStyle = {
    '--preview-cols': textTargetCols,
    '--preview-rows': textTargetRows,
    '--text-preview-cell': `${previewCellSize}px`,
    '--text-preview-gap': `${ZOOM_PREVIEW_CELL_GAP}px`,
    '--text-preview-width': `${textTargetCols * previewCellSize + (textTargetCols - 1) * ZOOM_PREVIEW_CELL_GAP + 2}px`,
    '--text-preview-height': `${textTargetRows * previewCellSize + (textTargetRows - 1) * ZOOM_PREVIEW_CELL_GAP + 2}px`
  };
  if (!isZoomedPreview) previewFrameStyle.aspectRatio = `${textTargetCols} / ${textTargetRows}`;
  const previewBounds = useMemo(() => {
    if (!textPreview?.grid.length) return null;
    let minRow = textTargetRows;
    let maxRow = -1;
    let minCol = textTargetCols;
    let maxCol = -1;
    textPreview.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell.active) return;
        minRow = Math.min(minRow, rowIndex);
        maxRow = Math.max(maxRow, rowIndex);
        minCol = Math.min(minCol, colIndex);
        maxCol = Math.max(maxCol, colIndex);
      });
    });
    return maxRow >= 0 ? { minRow, maxRow, minCol, maxCol } : null;
  }, [textPreview, textTargetCols, textTargetRows]);

  useEffect(() => {
    if (!isZoomedPreview || !previewBounds || !previewScrollRef.current) return;
    const scroller = previewScrollRef.current;
    const stride = previewCellSize + ZOOM_PREVIEW_CELL_GAP;
    const boundsWidth = (previewBounds.maxCol - previewBounds.minCol + 1) * previewCellSize
      + (previewBounds.maxCol - previewBounds.minCol) * ZOOM_PREVIEW_CELL_GAP;
    const boundsHeight = (previewBounds.maxRow - previewBounds.minRow + 1) * previewCellSize
      + (previewBounds.maxRow - previewBounds.minRow) * ZOOM_PREVIEW_CELL_GAP;
    const left = previewBounds.minCol * stride;
    const top = previewBounds.minRow * stride;
    scroller.scrollLeft = Math.max(0, left - (scroller.clientWidth - boundsWidth) / 2);
    scroller.scrollTop = Math.max(0, top - (scroller.clientHeight - boundsHeight) / 2);
  }, [isZoomedPreview, previewBounds, previewCellSize]);

  const resizePreviewZoom = (direction) => {
    setPreviewMode('zoom');
    setPreviewCellSize((value) => clampPreviewCellSize(value + direction * ZOOM_PREVIEW_CELL_STEP));
  };

  if (!textDraft) return null;

  return (
    <Modal
      open={Boolean(textDraft)}
      title="텍스트 변환 미리보기"
      subtitle={`${textTargetCols} x ${textTargetRows}칸 도안으로 변환합니다.`}
      onClose={closeTextDraft}
      variant="text-modal"
      bodyClassName="text-modal-body"
      titleId="text-modal-title"
      closeLabel="텍스트 변환 닫기"
      actions={
        <>
          <Button onClick={closeTextDraft}>취소</Button>
          <Button variant="primary" onClick={applyTextDraft} disabled={!canApply}>도안 생성</Button>
        </>
      }
    >
      <div className="text-preview-panel">
        <div className="text-preview-toolbar">
          <div className="text-preview-heading">
            <strong>미리보기</strong>
            <div className="text-grid-size-control" aria-label="텍스트 변환 격자 크기">
              <b>격자</b>
              <label>
                <span>가로</span>
                <GridSizeInput
                  value={textTargetCols}
                  ariaLabel="텍스트 격자 가로 칸 수"
                  onCommit={(next) => updateTextTargetGrid({ targetCols: next })}
                />
              </label>
              <i aria-hidden="true">x</i>
              <label>
                <span>세로</span>
                <GridSizeInput
                  value={textTargetRows}
                  ariaLabel="텍스트 격자 세로 칸 수"
                  onCommit={(next) => updateTextTargetGrid({ targetRows: next })}
                />
              </label>
              <button
                type="button"
                onClick={() => resizeTextTargetGrid(-1)}
                disabled={!canShrinkTextTargetGrid}
                aria-label="텍스트 격자 줄이기"
              >
                <Minus size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => resizeTextTargetGrid(1)}
                disabled={!canGrowTextTargetGrid}
                aria-label="텍스트 격자 키우기"
              >
                <Plus size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="text-preview-view-controls">
            <div className={`text-preview-mode segmented two ${shouldSuggestZoom ? 'needs-zoom' : ''}`} aria-label="텍스트 미리보기 표시 방식">
              <button className={!isZoomedPreview ? 'active' : ''} onClick={() => setPreviewMode('fit')}>
                전체
              </button>
              <button className={isZoomedPreview ? 'active' : ''} onClick={() => setPreviewMode('zoom')}>
                확대
              </button>
            </div>
            <div className="text-preview-zoom-control" aria-label="텍스트 미리보기 확대 축소">
              <button
                type="button"
                onClick={() => resizePreviewZoom(-1)}
                disabled={previewCellSize <= MIN_ZOOM_PREVIEW_CELL_SIZE}
                aria-label="텍스트 미리보기 축소"
              >
                <Minus size={13} aria-hidden="true" />
              </button>
              <b>{zoomPercent}%</b>
              <button
                type="button"
                onClick={() => resizePreviewZoom(1)}
                disabled={previewCellSize >= MAX_ZOOM_PREVIEW_CELL_SIZE}
                aria-label="텍스트 미리보기 확대"
              >
                <Plus size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        {shouldSuggestZoom ? (
          <div className="text-preview-readability">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>글자가 작게 생성됩니다. 격자 +로 글자 크기를 키워보세요.</span>
          </div>
        ) : null}
        <div className={`image-preview-frame text-preview-frame ${isZoomedPreview ? 'zoomed' : 'fit'}`} style={previewFrameStyle}>
          <div className="text-preview-scroll" ref={previewScrollRef}>
            <div className="text-preview-content">
              <div className="converted-preview-grid" style={{ gridTemplateColumns: `repeat(${textTargetCols}, minmax(0, 1fr))` }} aria-label="텍스트 변환 결과 미리보기">
                {textPreview?.grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <span key={`${rowIndex}-${colIndex}`} style={{ background: cell.active ? cell.color : '#ffffff' }} />
                  ))
                )}
              </div>
              <div className="image-preview-grid" />
            </div>
          </div>
        </div>
        <div className="text-preview-summary">
          <Type size={18} aria-hidden="true" />
          <div>
            <strong>{canApply ? `${textPreview.paintedCellCount}칸 생성 예정` : '변환할 텍스트를 입력하세요'}</strong>
            <p>{paletteLabel} 색으로 글자 셀만 채웁니다.</p>
          </div>
        </div>
        {!canApply && textOptions.text.trim() ? (
          <div className="image-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>셀에 잡히는 글자가 없습니다</strong>
              <p>더 굵은 글꼴을 선택하거나 짧은 텍스트로 다시 입력하세요.</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="text-settings-panel">
        <label className="text-input-block">
          <span>텍스트</span>
          <textarea
            value={textOptions.text}
            onChange={(event) => updateTextOptions({ text: event.target.value })}
            rows={4}
            maxLength={textMaxChars + textMaxLines - 1}
            placeholder="예: KNIT"
            aria-describedby="text-draft-limit"
          />
          <small id="text-draft-limit">{textLength}/{textMaxChars}자 · {lineCount}/{textMaxLines}줄</small>
        </label>

        <div className="setting-block">
          <strong>글꼴</strong>
          <div className="segmented">
            {textFontOptions.map((item) => (
              <button key={item.id} className={textOptions.fontFamily === item.id ? 'active' : ''} onClick={() => updateTextOptions({ fontFamily: item.id })}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <strong>굵기</strong>
          <div className="segmented two">
            {textWeightOptions.map((item) => (
              <button key={item.id} className={textOptions.fontWeight === item.id ? 'active' : ''} onClick={() => updateTextOptions({ fontWeight: item.id })}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <strong>정렬</strong>
          <div className="segmented">
            {textAlignOptions.map((item) => (
              <button key={item.id} className={textOptions.align === item.id ? 'active' : ''} onClick={() => updateTextOptions({ align: item.id })}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="setting-block">
          <span>글자색</span>
          <select value={textPaletteItem?.id ?? ''} onChange={(event) => updateTextOptions({ paletteId: event.target.value })} aria-label="텍스트 글자색">
            {palette.map((item) => (
              <option key={item.id} value={item.id}>{item.code} {item.name}</option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}
