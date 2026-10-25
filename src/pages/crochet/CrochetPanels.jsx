import { useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Hand,
  Layers,
  MousePointer2,
  Move,
  Plus,
  RotateCcw,
  RotateCw,
  Shapes,
  Spline,
  SunMedium,
  Trash2,
  Undo2
} from 'lucide-react';
import { Panel } from '../../components/index.js';
import { STITCH_CATEGORIES, STITCH_TYPES } from '../../features/crochet/model/crochetSymbols.js';
import { SymbolIcon } from './SymbolGlyph.jsx';

export const TOOLS = [
  { id: 'select', label: '선택', icon: MousePointer2, shortcut: 'V' },
  { id: 'place', label: '기호 배치', icon: Shapes, shortcut: 'P' },
  { id: 'row', label: '줄 배치', icon: Spline, shortcut: 'L' },
  { id: 'pan', label: '화면 이동', icon: Hand, shortcut: 'H' }
];

const TOOL_HINTS = {
  select: '클릭·Shift+클릭으로 선택, 빈 곳을 드래그해 범위 선택. 우클릭으로 모아뜨기·늘려뜨기 메뉴.',
  place: '캔버스를 클릭하면 선택한 기호가 놓입니다.',
  row: '시작점에서 끝점까지 드래그하면 기호 폭 간격으로 코가 놓입니다. Shift: 15° 고정.',
  pan: '드래그해 화면을 옮깁니다. 다른 도구에서도 Space를 누른 채 드래그할 수 있어요.'
};

/** 왼쪽: 도구 + 기호 라이브러리 */
export function SymbolLibraryPanel({ tool, onToolChange, activeType, onTypeChange, onOpenGenerator }) {
  return (
    <aside className="ce-left" aria-label="도구와 기호">
      <div className="ce-tools" role="toolbar" aria-label="편집 도구">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`ce-tool ${tool === t.id ? 'is-active' : ''}`}
              aria-pressed={tool === t.id}
              title={`${t.label} (${t.shortcut})`}
              onClick={() => onToolChange(t.id)}
            >
              <Icon size={16} />
              <span>{t.label}</span>
              <kbd>{t.shortcut}</kbd>
            </button>
          );
        })}
      </div>
      <p className="ce-tool-hint">{TOOL_HINTS[tool]}</p>

      <button type="button" className="ce-generator-btn" onClick={onOpenGenerator}>
        <SunMedium size={16} /> 원형 생성
        <small>매직링 · 6코씩 늘리기</small>
      </button>

      <div className="ce-library">
        {STITCH_CATEGORIES.map((category) => (
          <section key={category.id} className="ce-library-group" aria-label={category.label}>
            <h3>{category.label}</h3>
            <div className="ce-symbol-grid">
              {category.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`ce-symbol ${activeType === type ? 'is-active' : ''}`}
                  aria-pressed={activeType === type}
                  title={STITCH_TYPES[type].label}
                  onClick={() => onTypeChange(type)}
                >
                  <SymbolIcon type={type} size={30} />
                  <span>{STITCH_TYPES[type].label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function RoundRow({ round, active, count, canDelete, onSelect, onChange, onDelete, onMove, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(round.name);
  const commitName = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== round.name) onChange({ name });
    else setDraft(round.name);
  };
  return (
    <li className={`ce-round ${active ? 'is-active' : ''} ${round.visible ? '' : 'is-hidden'}`}>
      <label className="ce-round-color" title="단 색상">
        <input type="color" value={round.color} onChange={(e) => onChange({ color: e.target.value })} aria-label={`${round.name} 색상`} />
        <span style={{ background: round.color }} />
      </label>
      {editing ? (
        <input
          className="ce-round-name-input"
          value={draft}
          autoFocus
          aria-label="단 이름"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') {
              setDraft(round.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="ce-round-name"
          onClick={onSelect}
          onDoubleClick={() => {
            setDraft(round.name);
            setEditing(true);
          }}
          title="클릭: 활성 단으로 · 더블클릭: 이름 바꾸기"
          aria-current={active ? 'true' : undefined}
        >
          {round.name}
          <em>{count}코</em>
        </button>
      )}
      <div className="ce-round-actions">
        <button type="button" className="ce-icon-btn" onClick={() => onMove(-1)} disabled={isFirst} aria-label={`${round.name} 위로`}>
          <ArrowUp size={13} />
        </button>
        <button type="button" className="ce-icon-btn" onClick={() => onMove(1)} disabled={isLast} aria-label={`${round.name} 아래로`}>
          <ArrowDown size={13} />
        </button>
        <button
          type="button"
          className="ce-icon-btn"
          onClick={() => onChange({ visible: !round.visible })}
          aria-pressed={!round.visible}
          aria-label={round.visible ? `${round.name} 숨기기` : `${round.name} 보이기`}
        >
          {round.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button type="button" className="ce-icon-btn is-danger" onClick={onDelete} disabled={!canDelete} aria-label={`${round.name} 삭제`}>
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

/** 오른쪽: 단 레이어 + 선택 정렬 도구 + 보기 설정 */
export function InspectorPanel({
  chart,
  counts,
  activeRoundId,
  onActiveRoundChange,
  onAddRound,
  onUpdateRound,
  onDeleteRound,
  onMoveRound,
  activeOnly,
  onActiveOnlyChange,
  selectionCount,
  onArrange,
  snap,
  onSnapChange,
  showGrid,
  onShowGridChange
}) {
  const none = selectionCount === 0;
  const few = selectionCount < 2;
  return (
    <aside className="ce-right" aria-label="단과 정렬">
      <Panel
        title="단"
        icon={Layers}
        className="ce-panel"
        action={
          <button type="button" className="ce-panel-action" onClick={onAddRound}>
            <Plus size={14} /> 단 추가
          </button>
        }
      >
        <ul className="ce-round-list">
          {chart.rounds.map((round, index) => (
            <RoundRow
              key={round.id}
              round={round}
              active={round.id === activeRoundId}
              count={counts.get(round.id) ?? 0}
              canDelete={chart.rounds.length > 1}
              isFirst={index === 0}
              isLast={index === chart.rounds.length - 1}
              onSelect={() => onActiveRoundChange(round.id)}
              onChange={(patch) => onUpdateRound(round.id, patch)}
              onDelete={() => onDeleteRound(round.id)}
              onMove={(delta) => onMoveRound(round.id, delta)}
            />
          ))}
        </ul>
        <label className="ce-switch">
          <input type="checkbox" checked={activeOnly} onChange={(e) => onActiveOnlyChange(e.target.checked)} />
          <span>활성 단만 편집</span>
        </label>
      </Panel>

      <Panel title={selectionCount ? `선택 ${selectionCount}코` : '정렬'} icon={Move} className="ce-panel">
        <div className="ce-arrange-grid" role="group" aria-label="회전">
          <button type="button" onClick={() => onArrange('rotate-ccw')} disabled={none} title="왼쪽으로 15° (Shift+R)">
            <RotateCcw size={14} /> -15°
          </button>
          <button type="button" onClick={() => onArrange('rotate-cw')} disabled={none} title="오른쪽으로 15° (R)">
            <RotateCw size={14} /> +15°
          </button>
          <button type="button" onClick={() => onArrange('radial')} disabled={few} title="선택 영역 중심에서 바깥을 향하도록">
            <SunMedium size={14} /> 방사 정렬
          </button>
          <button type="button" onClick={() => onArrange('reset-rotation')} disabled={none} title="모든 기호를 위쪽으로">
            <Undo2 size={14} /> 방향 초기화
          </button>
        </div>
        <div className="ce-align-row" role="group" aria-label="정렬">
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('left')} disabled={few} aria-label="왼쪽 맞춤" title="왼쪽 맞춤">
            <AlignStartVertical size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('centerX')} disabled={few} aria-label="가로 가운데" title="가로 가운데">
            <AlignCenterVertical size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('right')} disabled={few} aria-label="오른쪽 맞춤" title="오른쪽 맞춤">
            <AlignEndVertical size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('top')} disabled={few} aria-label="위쪽 맞춤" title="위쪽 맞춤">
            <AlignStartHorizontal size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('centerY')} disabled={few} aria-label="세로 가운데" title="세로 가운데">
            <AlignCenterHorizontal size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('bottom')} disabled={few} aria-label="아래쪽 맞춤" title="아래쪽 맞춤">
            <AlignEndHorizontal size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('distribute-x')} disabled={selectionCount < 3} aria-label="가로 간격 균등" title="가로 간격 균등">
            <AlignHorizontalSpaceAround size={15} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => onArrange('distribute-y')} disabled={selectionCount < 3} aria-label="세로 간격 균등" title="세로 간격 균등">
            <AlignVerticalSpaceAround size={15} />
          </button>
        </div>
        <div className="ce-arrange-grid">
          <button type="button" onClick={() => onArrange('group-dec')} disabled={few} title="머리가 한 점으로 모입니다">
            모아뜨기
          </button>
          <button type="button" onClick={() => onArrange('group-inc')} disabled={few} title="밑동이 한 점으로 모입니다">
            늘려뜨기
          </button>
          <button type="button" onClick={() => onArrange('ungroup')} disabled={none}>
            묶음 해제
          </button>
          <button type="button" className="is-danger" onClick={() => onArrange('delete')} disabled={none}>
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      </Panel>

      <Panel title="보기" icon={Eye} className="ce-panel">
        <label className="ce-switch">
          <input type="checkbox" checked={snap} onChange={(e) => onSnapChange(e.target.checked)} />
          <span>점 격자에 맞추기</span>
        </label>
        <label className="ce-switch">
          <input type="checkbox" checked={showGrid} onChange={(e) => onShowGridChange(e.target.checked)} />
          <span>점 격자 표시</span>
        </label>
        <p className="ce-shortcuts">
          <kbd>⌘/Ctrl+Z</kbd> 실행 취소 · <kbd>⇧</kbd>+<kbd>⌘Z</kbd> 다시 실행 · <kbd>⌘C/V</kbd> 복사·붙여넣기 · <kbd>R</kbd> 회전 ·
          방향키 이동 · <kbd>Del</kbd> 삭제
        </p>
      </Panel>
    </aside>
  );
}
