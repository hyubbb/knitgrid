import { useRef } from 'react';
import ReactCrop from 'react-image-crop';
import { Button, Modal } from '../../../../components/index.js';
import { AlertTriangle, Download, Eye, FileText, RotateCcw, Upload } from 'lucide-react';
import {
  FIT_OPTIONS,
  HORIZONTAL_ALIGNMENTS,
  IMAGE_PALETTE_MODES,
  VERTICAL_ALIGNMENTS,
  countPaintedCells,
  formatProjectDate
} from '../../../../app/model/knitgridModel.js';
import { EditorTextDraftModal } from './EditorTextDraftModal.jsx';

export function EditorModals({ editor }) {
  const {
    localProjectsOpen,
    setLocalProjectsOpen,
    localProjects,
    currentLocalProjectId,
    openLocalProject,
    duplicateProject,
    renameLocalProject,
    removeLocalProject,
    saveCurrentLocalProject,
    localSaveState,
    backupInputRef,
    backupAllLocalProjects,
    restoreAllLocalProjects,
    pendingNewProject,
    setPendingNewProject,
    resetToNewProject,
    saveAndStartNewProject,
    pendingResize,
    setPendingResize,
    cols,
    rows,
    commitGridResize,
    paintedCellCount,
    appliedSourceImage,
    cropDraft,
    closeCropDraft,
    completeCropDraft,
    updateCropDraftSelection,
    completeCropDraftSelection,
    resetCropDraft,
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
    imageWarnings
  } = editor;

  return (
    <>
      {localProjectsOpen ? (
        <Modal
          open={localProjectsOpen}
          title="내 작업"
          subtitle="이 브라우저에 저장된 KnitGrid 작업입니다. 다른 기기나 브라우저와 자동 공유되지는 않습니다."
          onClose={() => setLocalProjectsOpen(false)}
          variant="local-project-modal"
          bodyClassName="local-project-modal-body"
          titleId="local-project-modal-title"
          closeLabel="내 작업 닫기"
          actions={
            <>
              <Button onClick={() => setLocalProjectsOpen(false)}>닫기</Button>
              <Button icon={Upload} onClick={() => backupInputRef.current?.click()}>전체 불러오기</Button>
              <Button icon={Download} onClick={backupAllLocalProjects} disabled={!localProjects.length}>전체 저장</Button>
              <Button variant="primary" onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>현재 작업 로컬 저장</Button>
            </>
          }
        >
          <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={restoreAllLocalProjects} hidden />
          {localProjects.length ? (
            <div className="local-project-list">
              {localProjects.map((project) => (
                <article
                  key={project.id}
                  className={`local-project-row ${currentLocalProjectId === project.id ? 'active' : ''}`}
                >
                  <img src={project.thumbnail} alt="" aria-hidden="true" />
                  <div className="local-project-meta">
                    <strong>{project.name || project.projectData?.projectName || '이름 없는 작업'}</strong>
                    <span>{formatProjectDate(project.updatedAt)} 수정</span>
                    <div>
                      <b>{project.summary?.cols ?? project.projectData?.cols} x {project.summary?.rows ?? project.projectData?.rows}</b>
                      <b>{project.summary?.colorCount ?? project.projectData?.palette?.length ?? 0}색</b>
                      <b>{project.summary?.paintedCells ?? countPaintedCells(project.projectData?.grid || [])}칸</b>
                    </div>
                  </div>
                  <div className="local-project-row-actions">
                    <Button variant="primary" onClick={() => openLocalProject(project.id)}>열기</Button>
                    <Button onClick={() => duplicateProject(project.id)}>복제</Button>
                    <Button onClick={() => renameLocalProject(project)}>이름 변경</Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`${project.name || '작업'}을 삭제할까요?`)) removeLocalProject(project.id);
                      }}
                    >삭제</Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-local-projects">
              <FileText size={24} />
              <strong>아직 저장된 작업이 없습니다.</strong>
              <p>상단의 로컬 저장을 누르면 이 브라우저에 작업이 저장됩니다.</p>
            </div>
          )}
        </Modal>
      ) : null}

      {pendingNewProject ? (
        <Modal
          open={Boolean(pendingNewProject)}
          title="새 작업 시작"
          subtitle="현재 편집 중인 작업을 어떻게 처리할지 선택하세요."
          onClose={() => setPendingNewProject(false)}
          variant="resize-modal"
          bodyClassName="resize-modal-body"
          titleId="new-project-modal-title"
          closeLabel="새 작업 취소"
          actions={
            <>
              <Button onClick={() => setPendingNewProject(false)}>취소</Button>
              <Button variant="danger" onClick={resetToNewProject}>저장하지 않고 새로 만들기</Button>
              <Button variant="primary" onClick={saveAndStartNewProject} disabled={localSaveState === 'saving'}>현재 작업 저장 후 새로 만들기</Button>
            </>
          }
        >
          <AlertTriangle size={20} />
          <div>
            <strong>현재 작업이 초기화됩니다.</strong>
            <p>로컬 저장을 선택하면 이 브라우저의 내 작업 목록에 저장한 뒤 새 빈 격자로 전환합니다.</p>
          </div>
        </Modal>
      ) : null}

      {pendingResize ? (
        <Modal
          open={Boolean(pendingResize)}
          title="격자 크기 변경"
          subtitle={pendingResize ? `현재 ${cols} x ${rows}칸에서 ${pendingResize.cols} x ${pendingResize.rows}칸으로 바꿉니다.` : undefined}
          onClose={() => setPendingResize(null)}
          variant="resize-modal"
          bodyClassName="resize-modal-body"
          titleId="resize-modal-title"
          closeLabel="격자 크기 변경 취소"
          actions={
            <>
              <Button onClick={() => setPendingResize(null)}>취소</Button>
              <Button variant="danger" onClick={() => commitGridResize(pendingResize.rows, pendingResize.cols, 'reset')}>초기화</Button>
              <Button variant="primary" onClick={() => commitGridResize(pendingResize.rows, pendingResize.cols, 'keep')}>그림 유지</Button>
            </>
          }
        >
          <AlertTriangle size={20} />
          <div>
            <strong>그려진 칸 {paintedCellCount}개가 있습니다.</strong>
            <p>
              {appliedSourceImage
                ? '이미지 도안은 현재 이미지 정렬 기준으로 보존됩니다. 줄어들면 그 기준의 바깥쪽부터 잘리고, 늘어나면 반대쪽에 빈 칸이 생깁니다.'
                : '그림을 유지하면 아래 미리보기 기준으로 보존됩니다. 줄어들면 바깥쪽이 잘리고, 늘어나면 반대쪽에 빈 칸이 생깁니다.'}
            </p>
            {pendingResize ? (
              <ResizeAlignPreview
                curCols={cols}
                curRows={rows}
                nextCols={pendingResize.cols}
                nextRows={pendingResize.rows}
                alignX={appliedSourceImage?.imageOptions?.alignX}
                alignY={appliedSourceImage?.imageOptions?.alignY}
                isImage={Boolean(appliedSourceImage)}
                offsetX={pendingResize.offsetX}
                offsetY={pendingResize.offsetY}
                onOffsetChange={(offsetX, offsetY) =>
                  setPendingResize((previous) => ({ ...previous, offsetX, offsetY }))
                }
              />
            ) : null}
          </div>
        </Modal>
      ) : null}

      {cropDraft ? (
        <Modal
          open={Boolean(cropDraft)}
          title="이미지 크롭"
          subtitle={cropDraft ? `${cropDraft.name} · ${cropDraft.width} x ${cropDraft.height}px` : undefined}
          onClose={closeCropDraft}
          variant="crop-modal"
          bodyClassName="crop-modal-body"
          titleId="crop-modal-title"
          closeLabel="이미지 크롭 닫기"
          actions={
            <>
              <Button onClick={closeCropDraft}>취소</Button>
              <Button variant="primary" onClick={completeCropDraft} disabled={!cropDraft?.cropArea}>크롭 완료</Button>
            </>
          }
        >
          <div className="cropper-shell">
            <ReactCrop
              crop={cropDraft?.cropSelection}
              keepSelection
              minWidth={8}
              minHeight={8}
              onChange={(_, percentCrop) => updateCropDraftSelection(percentCrop)}
              onComplete={(_, percentCrop) => completeCropDraftSelection(percentCrop)}
            >
              <img className="crop-source-image" src={cropDraft?.src} alt="크롭할 원본 이미지" />
            </ReactCrop>
          </div>
          <div className="crop-modal-controls">
            <Button onClick={resetCropDraft}>초기화</Button>
          </div>
        </Modal>
      ) : null}

      {imageDraft ? (
        <Modal
          open={Boolean(imageDraft)}
          title="이미지 변환 미리보기"
          subtitle={imageDraft ? `${imageDraft.name} · 원본 ${imageDraft.width} x ${imageDraft.height}px → 격자 ${cols} x ${rows}칸` : undefined}
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
                  <div className="candidate-thumb" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, '--preview-rows': rows }}>
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
            <div className="image-preview-frame" style={{ aspectRatio: `${cols} / ${rows}`, '--preview-cols': cols, '--preview-rows': rows }}>
              {imageCandidateLoading && !selectedImageCandidate ? (
                <div className="image-preview-loading">변환 후보 계산 중</div>
              ) : selectedImageCandidate ? (
                <div className="converted-preview-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-label="실제 변환 결과 미리보기">
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
              <strong>맞춤 방식</strong>
              <div className="option-stack">
                {FIT_OPTIONS.map((item) => (
                  <button key={item.id} className={imageOptions.fit === item.id ? 'active' : ''} onClick={() => setImageOptions((previous) => ({ ...previous, fit: item.id }))}>
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
                  <button key={item.id} className={imageOptions.alignX === item.id ? 'active' : ''} disabled={imageOptions.fit === 'stretch'} onClick={() => setImageOptions((previous) => ({ ...previous, alignX: item.id }))}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-block">
              <strong>세로 정렬</strong>
              <div className="segmented">
                {VERTICAL_ALIGNMENTS.map((item) => (
                  <button key={item.id} className={imageOptions.alignY === item.id ? 'active' : ''} disabled={imageOptions.fit === 'stretch'} onClick={() => setImageOptions((previous) => ({ ...previous, alignY: item.id }))}>
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
      ) : null}
      <EditorTextDraftModal editor={editor} />
    </>
  );
}

const alignLabel = (options, id) => options.find((item) => item.id === id)?.label ?? '중앙';
const resizeAnchor = (id, endId) => (id === endId ? 'end' : id === 'center' ? 'center' : 'start');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
// 정렬(start/center/end)로부터 기본 offset(0~delta) 계산 — gridModel.alignOffset과 동일
const baseOffset = (delta, anchor) => (anchor === 'end' ? delta : anchor === 'center' ? Math.floor(delta / 2) : 0);

// 리사이즈 시 어디가 유지/잘림/빈칸이 되는지 보여주고, 유지 영역을 드래그해 위치를 조정하는 미니 다이어그램
function ResizeAlignPreview({ curCols, curRows, nextCols, nextRows, alignX, alignY, isImage, offsetX, offsetY, onOffsetChange }) {
  const drag = useRef(null);
  const ax = resizeAnchor(alignX, 'right');
  const ay = resizeAnchor(alignY, 'bottom');
  const deltaX = Math.abs(curCols - nextCols);
  const deltaY = Math.abs(curRows - nextRows);
  const ox = clamp(offsetX ?? baseOffset(deltaX, ax), 0, deltaX);
  const oy = clamp(offsetY ?? baseOffset(deltaY, ay), 0, deltaY);
  const uW = Math.max(curCols, nextCols);
  const uH = Math.max(curRows, nextRows);
  const cell = Math.max(4, Math.min(12, 116 / Math.max(uW, uH)));
  // 작은 쪽 축이 offset부터 시작, 큰 쪽은 union 전체를 차지 (0부터)
  const curX = curCols <= nextCols ? ox : 0;
  const nextX = nextCols <= curCols ? ox : 0;
  const curY = curRows <= nextRows ? oy : 0;
  const nextY = nextRows <= curRows ? oy : 0;
  const keepX = Math.max(curX, nextX);
  const keepY = Math.max(curY, nextY);
  const keepW = Math.max(0, Math.min(curX + curCols, nextX + nextCols) - keepX);
  const keepH = Math.max(0, Math.min(curY + curRows, nextY + nextRows) - keepY);
  const draggable = deltaX > 0 || deltaY > 0;

  const onPointerDown = (event) => {
    if (!draggable) return;
    event.preventDefault();
    drag.current = { startX: event.clientX, startY: event.clientY, ox, oy };
    const onMove = (moveEvent) => {
      const start = drag.current;
      if (!start) return;
      const nx = deltaX === 0 ? start.ox : clamp(Math.round(start.ox + (moveEvent.clientX - start.startX) / cell), 0, deltaX);
      const ny = deltaY === 0 ? start.oy : clamp(Math.round(start.oy + (moveEvent.clientY - start.startY) / cell), 0, deltaY);
      onOffsetChange(nx, ny);
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // 장식용 rect는 pointerEvents none — 위에 그려져도 드래그 핸들의 pointerdown을 가로채지 않게
  const rect = (x, y, w, h, extra) => (
    <span aria-hidden style={{ position: 'absolute', left: x * cell, top: y * cell, width: w * cell, height: h * cell, pointerEvents: 'none', ...extra }} />
  );
  const hatch = 'repeating-linear-gradient(45deg, transparent 0 2px, var(--kg-line) 2px 3px)';
  const swatch = { width: 10, height: 10, borderRadius: 2, display: 'inline-block' };
  const legendItem = { display: 'inline-flex', alignItems: 'center', gap: 4 };
  return (
    <div style={{ marginTop: 10 }}>
      {isImage ? (
        <span
          style={{
            display: 'inline-block', padding: '3px 8px', borderRadius: 999,
            background: 'var(--kg-teal-soft)', color: 'var(--kg-teal)', fontSize: 10, fontWeight: 800
          }}
        >
          이미지 정렬: 가로 {alignLabel(HORIZONTAL_ALIGNMENTS, alignX)} · 세로 {alignLabel(VERTICAL_ALIGNMENTS, alignY)}
        </span>
      ) : null}
      <div style={{ position: 'relative', width: uW * cell, height: uH * cell, marginTop: 8 }}>
        {rect(curX, curY, curCols, curRows, { background: 'var(--kg-coral-soft)' })}
        {rect(nextX, nextY, nextCols, nextRows, { backgroundImage: hatch })}
        {keepW > 0 && keepH > 0
          ? rect(keepX, keepY, keepW, keepH, { background: 'var(--kg-teal)', opacity: 0.85 })
          : null}
        {keepW > 0 && keepH > 0 && draggable ? (
          <span
            onPointerDown={onPointerDown}
            title="드래그해서 유지 영역 위치 조정"
            style={{
              position: 'absolute', left: keepX * cell, top: keepY * cell,
              width: keepW * cell, height: keepH * cell,
              cursor: 'move', touchAction: 'none'
            }}
          />
        ) : null}
        {rect(nextX, nextY, nextCols, nextRows, { border: '2px solid var(--kg-teal)', borderRadius: 2 })}
      </div>
      {draggable ? (
        <p style={{ margin: '6px 0 0', fontSize: 10, fontWeight: 700, color: 'var(--kg-teal)' }}>
          파란 영역을 드래그해 유지할 위치를 조정하세요.
        </p>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 10, fontWeight: 700, color: 'var(--kg-muted)' }}>
        <span style={legendItem}><span style={{ ...swatch, background: 'var(--kg-teal)', opacity: 0.85 }} />유지</span>
        <span style={legendItem}><span style={{ ...swatch, background: 'var(--kg-coral-soft)' }} />잘림</span>
        <span style={legendItem}><span style={{ ...swatch, backgroundImage: hatch, border: '1px solid var(--kg-line)' }} />빈 칸(비어 있음)</span>
      </div>
    </div>
  );
}
