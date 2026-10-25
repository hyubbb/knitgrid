import { useMemo, useState } from 'react';
import { AlignLeft, Check, ClipboardCopy, Download } from 'lucide-react';
import { Button, Panel, SegmentedControl, Toggle } from '../../../../../components/index.js';
import {
  WRITTEN_KNIT_MODES,
  WRITTEN_START_DIRECTIONS
} from '../../../../../app/model/knitgridModel.js';

/**
 * 서술형(줄별) 도안 패널. 뜨기 방식/시작 방향 선택, 생성 텍스트 미리보기,
 * 클립보드 복사, .txt 다운로드, PDF 포함 토글을 제공한다.
 */
export function InspectorWrittenPanel({ editor, action }) {
  const {
    buildWrittenPattern,
    downloadWrittenPatternText,
    writtenKnitMode,
    setWrittenKnitMode,
    writtenStartDirection,
    setWrittenStartDirection,
    writtenIncludeInPdf,
    setWrittenIncludeInPdf,
    paintedCellCount,
    isKnitChart
  } = editor;
  // 대바늘 도안은 빈 칸도 겉뜨기라 항상 서술도안이 있다.
  const hasPattern = Boolean(paintedCellCount || isKnitChart);

  const [copied, setCopied] = useState(false);

  // 옵션/격자 변경 시 재계산. 200×200도 순수 연산이라 즉각적.
  const { lines, text } = useMemo(
    () => buildWrittenPattern(),
    [buildWrittenPattern]
  );

  const startDirItems = useMemo(
    () => WRITTEN_START_DIRECTIONS.map((item) => ({ id: item.id, label: item.label })),
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Panel className="written-panel" icon={AlignLeft} title="서술형 도안" action={action}>
      <div className="written-option">
        <span className="written-option-label">뜨기 방식</span>
        <SegmentedControl
          className="written-tabs"
          as="div"
          ariaLabel="뜨기 방식"
          items={WRITTEN_KNIT_MODES.map((item) => ({ id: item.id, label: item.label }))}
          value={writtenKnitMode}
          onChange={setWrittenKnitMode}
        />
        <p className="written-hint">
          {WRITTEN_KNIT_MODES.find((item) => item.id === writtenKnitMode)?.description}
        </p>
      </div>

      <div className="written-option">
        <span className="written-option-label">첫 행 진행 방향</span>
        <SegmentedControl
          className="written-tabs"
          as="div"
          ariaLabel="첫 행 진행 방향"
          items={startDirItems}
          value={writtenStartDirection}
          onChange={setWrittenStartDirection}
        />
      </div>

      {hasPattern ? (
        <div className="written-preview" role="group" aria-label="서술형 도안 미리보기">
          <pre>{lines.join('\n')}</pre>
        </div>
      ) : (
        <p className="written-hint written-empty">격자에 색을 칠하면 줄별 서술형 도안이 여기에 표시됩니다.</p>
      )}

      <div className="written-actions">
        <Button icon={copied ? Check : ClipboardCopy} onClick={handleCopy} disabled={!hasPattern}>
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button icon={Download} onClick={downloadWrittenPatternText} disabled={!hasPattern}>
          .txt 저장
        </Button>
      </div>

      <label className="check-row written-pdf-row">
        <Toggle
          className="gauge-aspect-toggle"
          pressed={writtenIncludeInPdf}
          onChange={setWrittenIncludeInPdf}
          label="PDF에 서술형 도안 포함"
        >
          {writtenIncludeInPdf ? 'PDF 포함 ON' : 'PDF 포함 OFF'}
        </Toggle>
        <span>PDF 내보내기에 서술형 도안 페이지를 덧붙입니다.</span>
      </label>
    </Panel>
  );
}
