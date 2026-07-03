import { useState } from 'react';
import { Button, NumberField, Panel, Toggle } from '../../../../../components/index.js';
import { Ruler } from 'lucide-react';

/**
 * 게이지 입력 + 완성 치수 표시 + 목표 치수 역산 + 셀 종횡비 토글.
 * 게이지(10cm당 코수/단수)가 설정되면 완성 예상 치수와 실제 코 비율 미리보기를 제공한다.
 */
export function InspectorGaugePanel({ editor, action, editable = true }) {
  const {
    gaugeStitches,
    setGaugeStitches,
    gaugeRows,
    setGaugeRows,
    cellAspectRatio,
    setCellAspectRatio,
    hasGauge,
    finishedSize,
    computeGridSizeForDimensions,
    requestGridResize
  } = editor;

  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');

  const targetWidthNum = Number(targetWidth);
  const targetHeightNum = Number(targetHeight);
  const canReverse = hasGauge && targetWidthNum > 0 && targetHeightNum > 0;
  const reverseResult = canReverse
    ? computeGridSizeForDimensions(targetWidthNum, targetHeightNum)
    : null;

  return (
    <Panel className="gauge-panel" icon={Ruler} title="게이지 & 치수" action={action}>
      <div className="two-cols">
        <NumberField
          label="10cm당 코수(가로)"
          min={0}
          max={200}
          value={gaugeStitches || ''}
          onChange={(value) => setGaugeStitches(Math.max(0, Math.min(200, value)))}
          disabled={!editable}
        />
        <NumberField
          label="10cm당 단수(세로)"
          min={0}
          max={200}
          value={gaugeRows || ''}
          onChange={(value) => setGaugeRows(Math.max(0, Math.min(200, value)))}
          disabled={!editable}
        />
      </div>

      {hasGauge ? (
        <div className="gauge-result">
          <span className="gauge-result-label">완성 예상 치수</span>
          <strong>
            가로 {finishedSize.widthCm.toFixed(1)}cm × 세로 {finishedSize.heightCm.toFixed(1)}cm
          </strong>
        </div>
      ) : (
        <p className="gauge-hint">10cm당 코수와 단수를 모두 입력하면 완성 치수와 실제 비율 미리보기를 사용할 수 있습니다.</p>
      )}

      <label className="check-row gauge-aspect-row">
        <Toggle
          className="gauge-aspect-toggle"
          pressed={cellAspectRatio}
          onChange={setCellAspectRatio}
          disabled={!hasGauge}
          label="실제 코 비율로 표시"
        >
          {cellAspectRatio ? '실제 비율 ON' : '실제 비율 OFF'}
        </Toggle>
        <span>실제 코 비율로 셀 표시 (정사각형 대신 완성물 왜곡 미리보기)</span>
      </label>

      {editable ? (
        <div className="structure-panel gauge-reverse">
          <div className="structure-title">
            <strong>목표 치수로 격자 만들기</strong>
          </div>
          <div className="two-cols gauge-reverse-inputs">
            <NumberField
              label="가로(cm)"
              min={0}
              value={targetWidth}
              onChange={(value) => setTargetWidth(Number.isFinite(value) ? String(value) : '')}
              disabled={!hasGauge}
            />
            <NumberField
              label="세로(cm)"
              min={0}
              value={targetHeight}
              onChange={(value) => setTargetHeight(Number.isFinite(value) ? String(value) : '')}
              disabled={!hasGauge}
            />
          </div>
          {!hasGauge ? (
            <p className="gauge-hint">먼저 게이지를 입력하세요.</p>
          ) : reverseResult ? (
            <>
              <div className="gauge-result">
                <span className="gauge-result-label">필요한 격자</span>
                <strong>{reverseResult.cols}코 × {reverseResult.rows}단</strong>
              </div>
              <Button
                wide
                onClick={() => requestGridResize(reverseResult.rows, reverseResult.cols)}
                disabled={reverseResult.cols === editor.cols && reverseResult.rows === editor.rows}
              >
                이 크기로 격자 변경
              </Button>
            </>
          ) : (
            <p className="gauge-hint">목표 가로/세로 치수를 입력하세요.</p>
          )}
        </div>
      ) : null}
    </Panel>
  );
}
