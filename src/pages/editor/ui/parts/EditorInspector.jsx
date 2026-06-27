import {
  Button,
  Chip,
  MovePad,
  NumberField,
  PaletteRow,
  Panel,
  PresetGrid,
  SegmentedControl,
  Select,
  StepperControl
} from '../../../../components/index.js';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  Download,
  FileImage,
  FileText,
  FolderOpen,
  ImagePlus,
  Palette,
  Settings2,
  Sparkles,
  Upload
} from 'lucide-react';
import {
  DISPLAY_MODES,
  PRESETS,
  clampNumber,
  isPaletteVisible,
  normalizeHex
} from '../../../../app/model/knitgridModel.js';

export function EditorInspector({ editor }) {
  const {
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    rows,
    cols,
    draftRows,
    setDraftRows,
    draftCols,
    setDraftCols,
    requestGridResize,
    moveSteps,
    setMoveSteps,
    movePattern,
    paintedCellCount,
    insertAnchorCell,
    rowNumber,
    colNumber,
    insertRow,
    removeRow,
    insertCol,
    removeCol,
    numberStart,
    setNumberStart,
    guideEvery,
    setGuideEvery,
    guideColorMode,
    setGuideColorMode,
    guideCustomColor,
    setGuideCustomColor,
    guideLineColor,
    gridLineColorMode,
    setGridLineColorMode,
    gridLineCustomColor,
    setGridLineCustomColor,
    gridLineColor,
    showOppositeHeaders,
    setShowOppositeHeaders,
    rowDirection,
    setRowDirection,
    addPaletteColor,
    displayMode,
    setDisplayMode,
    paletteNotice,
    palette,
    activePaletteId,
    setActivePaletteId,
    expandedPaletteId,
    setExpandedPaletteId,
    activeCounts,
    togglePaletteVisibility,
    updatePaletteItem,
    mergePaletteItems,
    deletePaletteItem,
    progressRow,
    setProgressRow,
    completedRows,
    toggleCompletedRow,
    requestNewProject,
    openLocalProjectsModal,
    saveCurrentLocalProject,
    localSaveState,
    fileInputRef,
    projectInputRef,
    prepareImageDraft,
    loadProject,
    exportPng,
    exportPdf,
    saveProject
  } = editor;

  return (
    <aside className={`inspector ${isInspectorCollapsed ? 'collapsed' : ''}`} aria-label="격자 설정 사이드메뉴">
      {isInspectorCollapsed ? (
        <button
          className="inspector-expand"
          onClick={() => setIsInspectorCollapsed(false)}
          title="격자 설정 펼치기"
          aria-label="격자 설정 펼치기"
        >
          <Settings2 size={17} />
          <ArrowLeft size={16} />
        </button>
      ) : (
        <>
          <Panel
            className="setup-panel"
            icon={Settings2}
            title="격자 설정"
            action={
              <button
                className="icon-toggle"
                onClick={() => setIsInspectorCollapsed(true)}
                title="격자 설정 접기"
                aria-label="격자 설정 접기"
              >
                <ArrowRight size={15} />
              </button>
            }
          >
            <PresetGrid presets={PRESETS} rows={rows} cols={cols} onSelect={requestGridResize} />
            <div className="two-cols">
              <NumberField label="가로" min={1} max={200} value={draftCols} onChange={(v) => setDraftCols(Math.min(200, v))} />
              <NumberField label="세로" min={1} max={200} value={draftRows} onChange={(v) => setDraftRows(Math.min(200, v))} />
            </div>
            <Button wide icon={Sparkles} onClick={() => requestGridResize(draftRows, draftCols)}>격자 크기 적용</Button>
            <div className="structure-panel">
              <div className="structure-title">
                <strong>도안 이동</strong>
                <label>
                  <span>칸</span>
                  <NumberField
                    min={1}
                    max={200}
                    value={moveSteps}
                    onChange={(v) => setMoveSteps(clampNumber(v, 1, 200))}
                    ariaLabel="이동 칸 수"
                  />
                </label>
              </div>
              <MovePad onMove={movePattern} centerLabel={`${paintedCellCount}칸`} disabled={!paintedCellCount} />
            </div>
            <div className="structure-panel">
              <div className="structure-title">
                <strong>행/열 추가</strong>
                <span>삽입 기준: {rowNumber(insertAnchorCell.row)}행 {colNumber(insertAnchorCell.col)}열</span>
              </div>
              <div className="insert-grid">
                <StepperControl label="위 행" onAdd={() => insertRow('above')} onRemove={() => removeRow('above')} addDisabled={rows >= 200} removeDisabled={rows <= 1 || insertAnchorCell.row === 0} addTitle="기준 위에 행 추가" removeTitle="기준 위 행 제거" />
                <StepperControl label="아래 행" onAdd={() => insertRow('below')} onRemove={() => removeRow('below')} addDisabled={rows >= 200} removeDisabled={rows <= 1 || insertAnchorCell.row >= rows - 1} addTitle="기준 아래에 행 추가" removeTitle="기준 아래 행 제거" />
                <StepperControl label="왼쪽 열" onAdd={() => insertCol('left')} onRemove={() => removeCol('left')} addDisabled={cols >= 200} removeDisabled={cols <= 1 || insertAnchorCell.col === 0} addTitle="기준 왼쪽에 열 추가" removeTitle="기준 왼쪽 열 제거" />
                <StepperControl label="오른쪽 열" onAdd={() => insertCol('right')} onRemove={() => removeCol('right')} addDisabled={cols >= 200} removeDisabled={cols <= 1 || insertAnchorCell.col >= cols - 1} addTitle="기준 오른쪽에 열 추가" removeTitle="기준 오른쪽 열 제거" />
              </div>
            </div>
            <div className="two-cols">
              <NumberField label="번호 시작" value={numberStart} onChange={(v) => setNumberStart(v)} />
              <Select label="보조선" value={String(guideEvery)} onChange={(v) => setGuideEvery(Number(v))} options={[{ value: '0', label: '없음' }, { value: '5', label: '5칸' }, { value: '10', label: '10칸' }]} />
            </div>
            <div className="two-cols guide-color-fields">
              <Select label="보조선 색상" value={guideColorMode} onChange={setGuideColorMode} options={[{ value: 'black', label: '검은색' }, { value: 'white', label: '흰색' }, { value: 'custom', label: '커스텀' }]} />
              {guideColorMode === 'custom' ? (
                <label>
                  커스텀
                  <input
                    type="color"
                    value={guideCustomColor}
                    onInput={(event) => setGuideCustomColor(event.target.value)}
                    onChange={(event) => setGuideCustomColor(event.target.value)}
                    aria-label="커스텀 보조선 색상"
                  />
                </label>
              ) : (
                <div className="guide-color-preview" style={{ '--guide-color': guideLineColor }} aria-hidden="true" />
              )}
            </div>
            <div className="two-cols guide-color-fields">
              <Select
                label="격자선 색상"
                value={gridLineColorMode}
                onChange={setGridLineColorMode}
                options={[
                  { value: 'default', label: '기본' },
                  { value: 'black', label: '검은색' },
                  { value: 'white', label: '흰색' },
                  { value: 'custom', label: '커스텀' },
                  { value: 'none', label: '없음' }
                ]}
              />
              {gridLineColorMode === 'custom' ? (
                <label>
                  커스텀
                  <input
                    type="color"
                    value={gridLineCustomColor}
                    onInput={(event) => setGridLineCustomColor(event.target.value)}
                    onChange={(event) => setGridLineCustomColor(event.target.value)}
                    aria-label="커스텀 격자선 색상"
                  />
                </label>
              ) : (
                <div
                  className="guide-color-preview"
                  style={{ '--guide-color': gridLineColor || 'var(--kg-line)' }}
                  aria-hidden="true"
                />
              )}
            </div>
            <label className="check-row">
              <input type="checkbox" checked={showOppositeHeaders} onChange={(event) => setShowOppositeHeaders(event.target.checked)} />
              우측/하단 번호 표시
            </label>
            <Select className="px-3 pb-2.5" label="행 번호 방향" value={rowDirection} onChange={setRowDirection} options={[{ value: 'bottom-up', label: '아래에서 위' }, { value: 'top-down', label: '위에서 아래' }]} />
          </Panel>

          <Panel icon={Palette} title="팔레트 / 코드" action={<Button onClick={addPaletteColor}>추가</Button>}>
            <SegmentedControl as="div" className="display-tabs" items={DISPLAY_MODES} value={displayMode} onChange={setDisplayMode} />
            {paletteNotice ? <div className="palette-notice">{paletteNotice}</div> : null}
            <div className="palette-list">
              {palette.map((item) => (
                <PaletteRow
                  key={item.id}
                  item={item}
                  visible={isPaletteVisible(item)}
                  active={activePaletteId === item.id}
                  expanded={expandedPaletteId === item.id}
                  count={activeCounts.get(item.id) || 0}
                  palette={palette}
                  canDelete={palette.length > 1}
                  onActivate={setActivePaletteId}
                  onToggleExpand={(id) => setExpandedPaletteId((current) => (current === id ? '' : id))}
                  onExpand={setExpandedPaletteId}
                  onToggleVisibility={togglePaletteVisibility}
                  onUpdate={updatePaletteItem}
                  onMerge={(sourceId, targetId) => mergePaletteItems({ sourceId, targetId })}
                  onDelete={deletePaletteItem}
                  normalizeHex={normalizeHex}
                />
              ))}
            </div>
          </Panel>

          <Panel className="progress-panel" icon={CheckSquare} title="진행 모드">
            <label>
              현재 행
              <input type="range" min={numberStart} max={rows + numberStart - 1} value={progressRow} onChange={(event) => setProgressRow(Number(event.target.value))} />
            </label>
            <div className="progress-readout">
              <strong>{progressRow}행</strong>
              <span>{completedRows.size}행 완료</span>
            </div>
            <div className="row-chips">
              {Array.from({ length: Math.min(rows, 36) }, (_, index) => {
                const row = rowDirection === 'bottom-up' ? index + numberStart : rows - index - 1 + numberStart;
                return (
                  <Chip
                    key={row}
                    label={row}
                    done={completedRows.has(row)}
                    current={progressRow === row}
                    onClick={() => {
                      setProgressRow(row);
                      toggleCompletedRow(row);
                    }}
                  />
                );
              })}
            </div>
          </Panel>

          <Panel className="import-panel" icon={Upload} title="가져오기">
            <div className="import-grid">
              <Button icon={ImagePlus} onClick={() => fileInputRef.current?.click()}>이미지로 초안 생성</Button>
              <Button icon={FolderOpen} onClick={() => projectInputRef.current?.click()}>프로젝트 파일 열기 (JSON)</Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={prepareImageDraft} hidden />
            <input ref={projectInputRef} type="file" accept="application/json,.json" onChange={loadProject} hidden />
          </Panel>

          <Panel className="export-panel" icon={ArrowDownToLine} title="내보내기">
            <div className="export-grid">
              <Button icon={FileImage} iconSize={15} onClick={exportPng}>PNG</Button>
              <Button icon={FileText} iconSize={15} onClick={exportPdf}>PDF</Button>
              <Button icon={Download} iconSize={15} onClick={saveProject}>JSON</Button>
            </div>
          </Panel>
        </>
      )}
    </aside>
  );
}
