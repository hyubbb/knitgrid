import { useMemo, useState } from 'react';
import { Plus, Trash2, WandSparkles } from 'lucide-react';
import { Modal } from '../../components/index.js';
import { buildIncreaseRounds, planRoundUnits } from '../../features/crochet/model/crochetModel.js';
import { STITCH_TYPES } from '../../features/crochet/model/crochetSymbols.js';

const ROUND_TYPES = ['sc', 'hdc', 'dc', 'tr', 'dtr', 'ch', 'bobble', 'popcorn', 'fpdc', 'bpdc'];

const clampInt = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** 앞 단 대비 변화 설명 */
const describeChange = (prev, count) => {
  if (!prev) return '시작 단';
  if (count === prev) return '늘림 없음';
  const units = planRoundUnits(prev, count);
  const inc = units.filter((u) => u === 'inc').length;
  const dec = units.filter((u) => u === 'dec').length;
  if (inc) return `늘려뜨기 ${inc}회`;
  if (dec) return `모아뜨기 ${dec}회`;
  return '자동 분배 불가 (묶음 없이 배치)';
};

/**
 * 원형(방사) 도안 생성 대화상자
 * onGenerate({ magicRing, standing, rounds: [{count, type}] })
 */
export function RoundGeneratorModal({ open, onClose, onGenerate }) {
  const [magicRing, setMagicRing] = useState(true);
  const [standing, setStanding] = useState(false);
  const [start, setStart] = useState('6');
  const [increase, setIncrease] = useState('6');
  const [roundCount, setRoundCount] = useState('5');
  const [defaultType, setDefaultType] = useState('sc');
  const [rounds, setRounds] = useState(() => buildIncreaseRounds({ start: 6, increase: 6, roundCount: 5, type: 'sc' }));

  const autofill = () => {
    setRounds(
      buildIncreaseRounds({
        start: clampInt(start, 1, 60, 6),
        increase: clampInt(increase, 0, 60, 6),
        roundCount: clampInt(roundCount, 1, 40, 5),
        type: defaultType
      })
    );
  };

  const updateRound = (index, patch) => setRounds((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const total = useMemo(() => rounds.reduce((sum, r) => sum + (Number(r.count) || 0), 0), [rounds]);

  const handleGenerate = () => {
    const clean = rounds.map((r) => ({ count: clampInt(r.count, 1, 300, 6), type: r.type }));
    if (!clean.length) return;
    onGenerate({ magicRing, standing, rounds: clean });
  };

  return (
    <Modal
      open={open}
      title="원형 도안 생성"
      subtitle="중심에서 바깥으로 단을 쌓습니다. 늘어난 코는 늘려뜨기, 줄어든 코는 모아뜨기로 자동 묶입니다."
      onClose={onClose}
      variant="ce-modal ce-round-modal"
      bodyClassName="ce-modal-body"
      actions={
        <>
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="button" className="primary" onClick={handleGenerate} disabled={!rounds.length}>
            {rounds.length}단 생성 (총 {total}코)
          </button>
        </>
      }
    >
      <div className="ce-form-row">
        <label className="ce-check">
          <input type="checkbox" checked={magicRing} onChange={(e) => setMagicRing(e.target.checked)} />
          중심 매직링
        </label>
        <label className="ce-check">
          <input type="checkbox" checked={standing} onChange={(e) => setStanding(e.target.checked)} />
          기둥코·단 끝 빼뜨기 표시
        </label>
      </div>

      <fieldset className="ce-fieldset">
        <legend>매 단 일정하게 늘리기</legend>
        <div className="ce-form-grid">
          <label>
            시작 코 수
            <input inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            매 단 늘림
            <input inputMode="numeric" value={increase} onChange={(e) => setIncrease(e.target.value)} />
          </label>
          <label>
            단 수
            <input inputMode="numeric" value={roundCount} onChange={(e) => setRoundCount(e.target.value)} />
          </label>
          <label>
            기호
            <select value={defaultType} onChange={(e) => setDefaultType(e.target.value)}>
              {ROUND_TYPES.map((t) => (
                <option key={t} value={t}>
                  {STITCH_TYPES[t].label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ce-autofill" onClick={autofill}>
            <WandSparkles size={14} /> 목록 채우기
          </button>
        </div>
      </fieldset>

      <div className="ce-round-table" role="table" aria-label="단 목록">
        <div className="ce-round-table-head" role="row">
          <span role="columnheader">단</span>
          <span role="columnheader">코 수</span>
          <span role="columnheader">기호</span>
          <span role="columnheader">구성</span>
          <span role="columnheader" aria-label="삭제" />
        </div>
        {rounds.map((r, index) => (
          <div key={index} className="ce-round-table-row" role="row">
            <span role="cell">{index + 1}단</span>
            <span role="cell">
              <input
                aria-label={`${index + 1}단 코 수`}
                inputMode="numeric"
                value={r.count}
                onChange={(e) => updateRound(index, { count: e.target.value.replace(/[^0-9]/g, '') })}
              />
            </span>
            <span role="cell">
              <select aria-label={`${index + 1}단 기호`} value={r.type} onChange={(e) => updateRound(index, { type: e.target.value })}>
                {ROUND_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {STITCH_TYPES[t].label}
                  </option>
                ))}
              </select>
            </span>
            <span role="cell" className="ce-round-change">
              {describeChange(index ? Number(rounds[index - 1].count) : 0, Number(r.count))}
            </span>
            <span role="cell">
              <button
                type="button"
                className="ce-icon-btn"
                aria-label={`${index + 1}단 삭제`}
                onClick={() => setRounds((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        ))}
        <button
          type="button"
          className="ce-add-row"
          onClick={() =>
            setRounds((list) => {
              const last = list[list.length - 1];
              return [...list, { count: last ? Number(last.count) + clampInt(increase, 0, 60, 6) : 6, type: last?.type ?? defaultType }];
            })
          }
        >
          <Plus size={14} /> 단 추가
        </button>
      </div>
    </Modal>
  );
}
