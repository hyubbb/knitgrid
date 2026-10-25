import { useMemo, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Modal, SegmentedControl } from '../../components/index.js';
import { WRITTEN_KNIT_MODES, WRITTEN_START_DIRECTIONS } from '../../app/model/knitgridModel.js';

/** 대바늘 서술도안 보기 + 뜨기 방식 선택 + 복사/저장 (코바늘 서술도안 모달과 같은 형태) */
export function KnitWrittenModal({ open, onClose, editor }) {
  const {
    buildWrittenPattern,
    downloadWrittenPatternText,
    writtenKnitMode,
    setWrittenKnitMode,
    writtenStartDirection,
    setWrittenStartDirection
  } = editor;
  const [copied, setCopied] = useState('');
  const { lines, text } = useMemo(
    () => (open ? buildWrittenPattern() : { lines: [], text: '' }),
    [open, buildWrittenPattern]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('복사했습니다');
    } catch {
      setCopied('복사하지 못했습니다');
    }
    setTimeout(() => setCopied(''), 1800);
  };

  return (
    <Modal
      open={open}
      title="대바늘 서술도안"
      subtitle="평면뜨기는 안면 단을 반대 방향으로 읽고 겉뜨기·안뜨기를 바꿔 적습니다. 빈 칸은 겉뜨기, 무코는 건너뜁니다."
      onClose={onClose}
      variant="ce-modal ce-pattern-modal ke-pattern-modal"
      bodyClassName="ce-modal-body"
      actions={
        <>
          <span className="ce-copy-state" role="status">
            {copied}
          </span>
          <button type="button" onClick={downloadWrittenPatternText} disabled={!lines.length}>
            <Download size={14} /> .txt 저장
          </button>
          <button type="button" onClick={onClose}>
            닫기
          </button>
          <button type="button" className="primary" onClick={copy} disabled={!lines.length}>
            <Copy size={14} /> 복사
          </button>
        </>
      }
    >
      <div className="ke-pattern-options">
        <SegmentedControl
          className="written-tabs"
          as="div"
          ariaLabel="뜨기 방식"
          items={WRITTEN_KNIT_MODES.map((item) => ({ id: item.id, label: item.label }))}
          value={writtenKnitMode}
          onChange={setWrittenKnitMode}
        />
        <SegmentedControl
          className="written-tabs"
          as="div"
          ariaLabel="1단 진행 방향"
          items={WRITTEN_START_DIRECTIONS.map((item) => ({ id: item.id, label: item.label }))}
          value={writtenStartDirection}
          onChange={setWrittenStartDirection}
        />
      </div>
      <ol className="ke-pattern-lines">
        {lines.map((line) => {
          const [label, ...rest] = line.split(': ');
          return (
            <li key={label}>
              <b>{label}</b>
              <span>{rest.join(': ')}</span>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}
