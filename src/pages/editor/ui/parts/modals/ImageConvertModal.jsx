import { Button, Modal, NumberField } from '../../../../../components/index.js';
import { AlertTriangle, Eye, RotateCcw } from 'lucide-react';
import {
  FIT_OPTIONS,
  HORIZONTAL_ALIGNMENTS,
  VERTICAL_ALIGNMENTS,
  IMAGE_PALETTE_MODES,
  IMAGE_COLOR_COUNT_MIN,
  IMAGE_COLOR_COUNT_MAX,
  IMAGE_COLOR_COUNT_WARN,
  clampImageColorCount
} from '../../../../../app/model/knitgridModel.js';

export function ImageConvertModal({ editor }) {
  const {
    cols,
    rows,
    imageDraft,
    closeImageDraft,
    applyImageDraft,
    imageCandidateLoading,
    selectedImageCandidate,
    showOriginalOverlay,
    setShowOriginalOverlay,
    imageCandidateSeed,
    setImageCandidateSeed,
    originalOverlayOpacity,
    setOriginalOverlayOpacity,
    imageCandidates,
    setSelectedImageCandidateId,
    imageOptions,
    setImageOptions,
    imagePreviewCounts,
    imagePaletteMode,
    setImagePaletteMode,
    imageColorCount,
    setImageColorCount,
    imageGrayscale,
    setImageGrayscale,
    imageWarnings,
    detectedPixelGrid,
    imageConversionSize
  } = editor;

  if (!imageDraft) return null;

  // 미리보기 격자는 실제 변환 크기 기준(현재 격자 유지가 아니면 cols/rows와 다를 수 있음)
  const previewCols = selectedImageCandidate?.grid[0]?.length ?? imageConversionSize?.cols ?? cols;
  const previewRows = selectedImageCandidate?.grid.length ?? imageConversionSize?.rows ?? rows;

  // 색상 수 조절: match 모드에선 색상 수가 최종 팔레트를 바꾸지 못하므로 비활성.
  const colorCountDisabled = imagePaletteMode !== 'extract';
  // 자동(null)일 때 스텝퍼의 기준값은 프리셋 상한(가장 색이 많은 후보 기준).
  const effectiveColorCount = imageColorCount ?? IMAGE_COLOR_COUNT_MAX;
  const setColorCount = (value) => setImageColorCount(clampImageColorCount(value));
  const applyColorPreset = ({ count = null, grayscale = false }) => {
    setImageGrayscale(grayscale);
    setImageColorCount(count);
  };
  const isPreset = (count, grayscale) =>
    imageGrayscale === grayscale && imageColorCount === count;

  return (
    <Modal
      open={Boolean(imageDraft)}
      title="이미지 변환 미리보기"
      subtitle={imageDraft ? `${imageDraft.name} · 원본 ${imageDraft.width} x ${imageDraft.height}px → 격자 ${previewCols} x ${previewRows}칸` : undefined}
      onClose={closeImageDraft}
      variant=""
      bodyClassName="image-modal-body"
      titleId="image-modal-title"
      closeLabel="이미지 변환 닫기"
      actions={
        <>
          <Button onClick={closeImageDraft}>취소</Button>
          <Button variant="primary" onClick={applyImageDraft} disabled={imageCandidateLoading || !selectedImageCandidate}>
            {imageCandidateLoading ? '계산 중' : '선택 후보로 격자 생성'}
          </Button>
        </>
      }
    >
      <div className="image-preview-panel">
        <div className="image-preview-tools">
          <button className={showOriginalOverlay ? 'active' : ''} onClick={() => setShowOriginalOverlay((value) => !value)} disabled={!selectedImageCandidate}>
            <Eye size={14} />
            원본 겹쳐보기
          </button>
          <button onClick={() => setImageCandidateSeed((value) => value + 1)} disabled={imageCandidateLoading}>
            <RotateCcw size={14} />
            다시 생성
          </button>
          <label>
            투명도
            <input
              type="range"
              min="20"
              max="85"
              value={originalOverlayOpacity}
              disabled={!showOriginalOverlay || !selectedImageCandidate}
              onChange={(event) => setOriginalOverlayOpacity(Number(event.target.value))}
              aria-label="원본 레이어 투명도"
            />
          </label>
        </div>
        <div className="image-candidate-list" aria-label="변환 후보">
          {imageCandidateLoading && !imageCandidates.length ? (
            <div className="image-candidate-loading">후보 생성 중</div>
          ) : imageCandidates.map((candidate) => (
            <button
              key={candidate.id}
              className={selectedImageCandidate?.id === candidate.id ? 'active' : ''}
              onClick={() => setSelectedImageCandidateId(candidate.id)}
            >
              <div className="candidate-thumb" style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))`, '--preview-rows': previewRows }}>
                {candidate.grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <span key={`${rowIndex}-${colIndex}`} style={{ background: cell.active ? cell.color : '#ffffff' }} />
                  ))
                )}
              </div>
              <strong>{candidate.label}</strong>
              <small>{candidate.tag} · {candidate.palette.length}색 · {candidate.score}점</small>
            </button>
          ))}
        </div>
        <div className="image-preview-frame" style={{ aspectRatio: `${previewCols} / ${previewRows}`, '--preview-cols': previewCols, '--preview-rows': previewRows }}>
          {imageCandidateLoading && !selectedImageCandidate ? (
            <div className="image-preview-loading">변환 후보 계산 중</div>
          ) : selectedImageCandidate ? (
            <div className="converted-preview-grid" style={{ gridTemplateColumns: `repeat(${previewCols}, minmax(0, 1fr))` }} aria-label="실제 변환 결과 미리보기">
              {selectedImageCandidate.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <span key={`${rowIndex}-${colIndex}`} style={{ background: cell.active ? cell.color : '#ffffff' }} />
                ))
              )}
            </div>
          ) : (
            <img
              src={imageDraft.src}
              alt="업로드 이미지 미리보기"
              style={{
                objectFit: imageOptions.fit === 'stretch' ? 'fill' : imageOptions.fit,
                objectPosition: `${imageOptions.alignX === 'left' ? 0 : imageOptions.alignX === 'right' ? 100 : 50}% ${imageOptions.alignY === 'top' ? 0 : imageOptions.alignY === 'bottom' ? 100 : 50}%`
              }}
            />
          )}
          {selectedImageCandidate && showOriginalOverlay ? (
            <img
              className="original-overlay-image"
              src={imageDraft.src}
              alt="원본 이미지 레이어"
              style={{
                opacity: originalOverlayOpacity / 100,
                objectFit: imageOptions.fit === 'stretch' ? 'fill' : imageOptions.fit,
                objectPosition: `${imageOptions.alignX === 'left' ? 0 : imageOptions.alignX === 'right' ? 100 : 50}% ${imageOptions.alignY === 'top' ? 0 : imageOptions.alignY === 'bottom' ? 100 : 50}%`
              }}
            />
          ) : null}
          <div className="image-preview-grid" />
        </div>
        <p>후보 중 하나를 고르면 큰 미리보기와 원본 겹쳐보기가 그 결과 기준으로 바뀝니다.</p>
        {selectedImageCandidate ? (
          <div className="image-palette-preview">
            <strong>선택 후보 팔레트</strong>
            <div>
              {selectedImageCandidate.palette.map((item) => (
                <span key={item.id}>
                  <i style={{ background: item.color }} />
                  {item.code} {item.name}
                  <b>{imagePreviewCounts.get(item.id) || 0}</b>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="image-settings-panel">
        <div className="setting-block">
          <strong>색상 수</strong>
          <div className="color-count-stepper" role="group" aria-label="색상 수 조절">
            <button
              type="button"
              aria-label="색상 줄이기"
              disabled={colorCountDisabled || effectiveColorCount <= IMAGE_COLOR_COUNT_MIN}
              onClick={() => setColorCount(effectiveColorCount - 1)}
            >−</button>
            <span aria-live="polite">
              {imageColorCount === null ? '자동' : `${imageColorCount}색`}
              {imageGrayscale ? ' · 흑백' : ''}
            </span>
            <button
              type="button"
              aria-label="색상 늘리기"
              disabled={colorCountDisabled || effectiveColorCount >= IMAGE_COLOR_COUNT_MAX}
              onClick={() => setColorCount(effectiveColorCount + 1)}
            >+</button>
          </div>
          <div className="segmented four">
            <button className={imageGrayscale ? 'active' : ''} disabled={colorCountDisabled} onClick={() => applyColorPreset({ count: IMAGE_COLOR_COUNT_MIN, grayscale: true })} aria-pressed={imageGrayscale}>흑백</button>
            <button className={isPreset(2, false) ? 'active' : ''} disabled={colorCountDisabled} onClick={() => applyColorPreset({ count: 2 })} aria-pressed={isPreset(2, false)}>2색</button>
            <button className={isPreset(4, false) ? 'active' : ''} disabled={colorCountDisabled} onClick={() => applyColorPreset({ count: 4 })} aria-pressed={isPreset(4, false)}>4색</button>
            <button className={isPreset(null, false) ? 'active' : ''} disabled={colorCountDisabled} onClick={() => applyColorPreset({ count: null })} aria-pressed={isPreset(null, false)}>자동</button>
          </div>
          {colorCountDisabled ? (
            <small className="setting-hint">‘현재 팔레트에 맞춤’에서는 색상 수가 적용되지 않습니다. ‘이미지 색상 자동 추출’로 바꿔 주세요.</small>
          ) : imageGrayscale ? (
            <small className="setting-hint">채도를 없애 검정~흰색 계조로만 변환합니다. 스텝퍼로 회색 단계를 늘릴 수 있어요.</small>
          ) : imageColorCount && imageColorCount > IMAGE_COLOR_COUNT_WARN ? (
            <small className="setting-hint">실 {imageColorCount}볼은 색 교체 관리가 어려워요. 실제 색 수는 후보 카드에서 확인하세요.</small>
          ) : null}
        </div>

        <div className="setting-block">
          <strong>변환 방식</strong>
          <div className="option-stack">
            {IMAGE_PALETTE_MODES.map((item) => (
              <button key={item.id} className={imagePaletteMode === item.id ? 'active' : ''} onClick={() => setImagePaletteMode(item.id)}>
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <strong>격자 크기</strong>
          <div className="option-stack">
            <button className={!imageOptions.matchImageAspect && !imageOptions.matchPixelGrid ? 'active' : ''} onClick={() => setImageOptions((previous) => ({ ...previous, matchImageAspect: false, matchPixelGrid: false }))}>
              <span>현재 격자 유지</span>
              <small>지금 설정한 칸 수에 이미지를 맞춰 넣습니다(넘치면 잘림).</small>
            </button>
            <button className={imageOptions.matchImageAspect ? 'active' : ''} onClick={() => setImageOptions((previous) => ({ ...previous, matchImageAspect: true, matchPixelGrid: false }))}>
              <span>이미지 비율로 맞추기</span>
              <small>격자를 이미지 비율에 맞춰 다시 잡습니다. 잘림 없이 전체가 들어갑니다.</small>
            </button>
            {detectedPixelGrid ? (
              <button className={imageOptions.matchPixelGrid ? 'active' : ''} onClick={() => setImageOptions((previous) => ({ ...previous, matchPixelGrid: true, matchImageAspect: false }))}>
                <span>원본 픽셀 그대로 ({detectedPixelGrid.logicalCols} x {detectedPixelGrid.logicalRows})</span>
                <small>픽셀아트 격자를 자동 감지했습니다. 원본과 같은 칸 수로 1:1 변환됩니다(크롭·맞춤 방식 무시).</small>
              </button>
            ) : null}
          </div>
          {!imageOptions.matchImageAspect && !imageOptions.matchPixelGrid ? (
            <div className="two-cols">
              <NumberField label="가로 칸" min={1} max={200} value={imageOptions.targetCols ?? cols} onChange={(value) => setImageOptions((previous) => ({ ...previous, targetCols: Math.min(200, Math.max(1, value)) }))} />
              <NumberField label="세로 칸" min={1} max={200} value={imageOptions.targetRows ?? rows} onChange={(value) => setImageOptions((previous) => ({ ...previous, targetRows: Math.min(200, Math.max(1, value)) }))} />
            </div>
          ) : null}
        </div>

        <div className="setting-block">
          <strong>변환 정밀도</strong>
          <div className="option-stack">
            <button className={!imageOptions.pixelArt && !imageOptions.matchPixelGrid ? 'active' : ''} disabled={imageOptions.matchPixelGrid} onClick={() => setImageOptions((previous) => ({ ...previous, pixelArt: false }))}>
              <span>사진용(부드럽게)</span>
              <small>주변 색을 평균 내 자연스럽게. 일반 사진·그림에 적합.</small>
            </button>
            <button className={imageOptions.pixelArt || imageOptions.matchPixelGrid ? 'active' : ''} disabled={imageOptions.matchPixelGrid} onClick={() => setImageOptions((previous) => ({ ...previous, pixelArt: true }))}>
              <span>차트·픽셀아트(선명)</span>
              <small>칸마다 가장 많은 색으로 스냅하고 격자선을 무시합니다. '원본 픽셀 그대로' 선택 시 자동 적용됩니다.</small>
            </button>
          </div>
        </div>

        <div className="setting-block">
          <strong>맞춤 방식</strong>
          <div className="option-stack">
            {FIT_OPTIONS.map((item) => (
              <button key={item.id} className={imageOptions.fit === item.id ? 'active' : ''} disabled={imageOptions.matchImageAspect || imageOptions.matchPixelGrid} onClick={() => setImageOptions((previous) => ({ ...previous, fit: item.id }))}>
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <strong>가로 정렬</strong>
          <div className="segmented">
            {HORIZONTAL_ALIGNMENTS.map((item) => (
              <button key={item.id} className={imageOptions.alignX === item.id ? 'active' : ''} disabled={imageOptions.matchImageAspect || imageOptions.matchPixelGrid || imageOptions.fit === 'stretch'} onClick={() => setImageOptions((previous) => ({ ...previous, alignX: item.id }))}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-block">
          <strong>세로 정렬</strong>
          <div className="segmented">
            {VERTICAL_ALIGNMENTS.map((item) => (
              <button key={item.id} className={imageOptions.alignY === item.id ? 'active' : ''} disabled={imageOptions.matchImageAspect || imageOptions.matchPixelGrid || imageOptions.fit === 'stretch'} onClick={() => setImageOptions((previous) => ({ ...previous, alignY: item.id }))}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {imageWarnings.length ? (
          <div className="image-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>변환 전에 확인하세요</strong>
              {imageWarnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        ) : null}

        {selectedImageCandidate?.colorWarnings.length ? (
          <div className="image-warning image-color-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>현재 팔레트와 색상 차이가 큽니다</strong>
              <p>원본 색상과 가까운 코드가 없어 다른 색으로 보일 수 있습니다. 자동 추출 방식을 권장합니다.</p>
              <div className="color-warning-list">
                {selectedImageCandidate.colorWarnings.map((warning) => (
                  <span key={`${warning.sourceHex}-${warning.targetCode}`}>
                    <i style={{ background: warning.sourceHex }} />
                    <em />
                    <i style={{ background: warning.targetHex }} />
                    {warning.targetCode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
