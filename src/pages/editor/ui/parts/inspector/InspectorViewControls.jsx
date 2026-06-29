import {
  NumberField,
  SegmentedControl,
  Select
} from '../../../../../components/index.js';
import { DISPLAY_MODES } from '../../../../../app/model/knitgridModel.js';

export function InspectorViewControls({ editor, showDisplayMode = true }) {
  const {
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
    displayMode,
    setDisplayMode
  } = editor;

  return (
    <>
      {showDisplayMode ? (
        <SegmentedControl as="div" className="display-tabs" items={DISPLAY_MODES} value={displayMode} onChange={setDisplayMode} />
      ) : null}
      <div className="two-cols">
        <NumberField label="번호 시작" value={numberStart} onChange={(value) => setNumberStart(value)} />
        <Select label="보조선" value={String(guideEvery)} onChange={(value) => setGuideEvery(Number(value))} options={[{ value: '0', label: '없음' }, { value: '5', label: '5칸' }, { value: '10', label: '10칸' }]} />
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
          <div className="guide-color-preview" style={{ '--guide-color': gridLineColor || 'var(--kg-line)' }} aria-hidden="true" />
        )}
      </div>
      <label className="check-row">
        <input type="checkbox" checked={showOppositeHeaders} onChange={(event) => setShowOppositeHeaders(event.target.checked)} />
        우측/하단 번호 표시
      </label>
      <Select className="px-3 pb-2.5" label="행 번호 방향" value={rowDirection} onChange={setRowDirection} options={[{ value: 'bottom-up', label: '아래에서 위' }, { value: 'top-down', label: '위에서 아래' }]} />
    </>
  );
}
