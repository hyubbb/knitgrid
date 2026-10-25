import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Modal } from '../../components/index.js';
import { buildWrittenPattern, formatWrittenPattern } from '../../features/crochet/model/crochetPattern.js';

/** 서술도안 보기 + 복사 */
export function WrittenPatternModal({ open, onClose, chart, projectName }) {
  const [copied, setCopied] = useState('');
  const lines = useMemo(() => (open ? buildWrittenPattern(chart) : []), [open, chart]);
  const colors = useMemo(() => new Map(chart.rounds.map((r) => [r.id, r.color])), [chart.rounds]);

  const copy = async () => {
    const text = formatWrittenPattern(chart, projectName);
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
      title="서술도안"
      subtitle="단별 기호 순서를 읽어 반복 구간을 묶었습니다. 원형 단은 반시계 방향, 줄 단은 왼쪽→오른쪽 순서입니다."
      onClose={onClose}
      variant="ce-modal ce-pattern-modal"
      bodyClassName="ce-modal-body"
      actions={
        <>
          <span className="ce-copy-state" role="status">
            {copied}
          </span>
          <button type="button" onClick={onClose}>
            닫기
          </button>
          <button type="button" className="primary" onClick={copy} disabled={!lines.length}>
            <Copy size={14} /> 복사
          </button>
        </>
      }
    >
      {lines.length ? (
        <ol className="ce-pattern-list">
          {lines.map((line) => (
            <li key={line.roundId}>
              <span className="ce-pattern-dot" style={{ background: colors.get(line.roundId) }} aria-hidden="true" />
              <strong>{line.label}</strong>
              <span className="ce-pattern-text">{line.text}</span>
              <span className="ce-pattern-count">({line.stitchCount}코)</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="ce-muted">아직 기호가 없습니다. 기호를 배치하거나 원형 도안을 생성해 보세요.</p>
      )}
    </Modal>
  );
}
