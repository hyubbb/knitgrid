import { AlertTriangle, CheckCircle2, Eraser, Hand, MousePointer2, PaintBucket, PenLine, Spline } from 'lucide-react';
import { Panel } from '../../components/index.js';
import { KNIT_STITCH_CATEGORIES, KNIT_STITCHES } from '../../app/model/knitgridModel.js';
import { StitchGlyph } from '../editor/ui/parts/StitchGlyph.jsx';

// 대바늘 화면의 도구. id는 격자 편집 훅의 tool과 같다.
export const KNIT_TOOLS = [
  { id: 'select', label: '선택', icon: MousePointer2, shortcut: 'V' },
  { id: 'stitch', label: '기호', icon: Spline, shortcut: 'K' },
  { id: 'eraser', label: '지우개', icon: Eraser, shortcut: 'E' },
  { id: 'pen', label: '배색', icon: PenLine, shortcut: 'B' },
  { id: 'fill', label: '채우기', icon: PaintBucket, shortcut: 'F' },
  { id: 'pan', label: '화면 이동', icon: Hand, shortcut: 'H' }
];

const TOOL_HINTS = {
  select: '드래그로 영역을 고르고 우클릭하면 모아뜨기·교차뜨기·고무뜨기로 바꿀 수 있습니다.',
  stitch: '칸을 누르면 고른 기호가 놓입니다. 같은 기호를 다시 누르면 겉뜨기(빈 칸)로 돌아갑니다.',
  eraser: '기호와 배색을 함께 지웁니다. 교차뜨기는 통째로 지워집니다.',
  pen: '배색 실 색을 칠합니다. 기호는 그대로 유지됩니다.',
  fill: '같은 색으로 이어진 칸을 한 번에 칠합니다.',
  pan: '드래그해서 화면을 옮깁니다.'
};

/** 왼쪽: 도구 + 기법 기호 라이브러리 */
export function KnitLibraryPanel({ editor }) {
  const { tool, setTool, activeStitchId, setActiveStitchId, mode } = editor;
  const editable = mode === 'edit';

  const pickStitch = (id) => {
    setActiveStitchId(id);
    setTool('stitch');
  };

  return (
    <aside className="ce-left" aria-label="도구와 기호">
      <div className="ce-tools" role="toolbar" aria-label="편집 도구">
        {KNIT_TOOLS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`ce-tool ${tool === item.id ? 'is-active' : ''}`}
              aria-pressed={tool === item.id}
              title={`${item.label} (${item.shortcut})`}
              onClick={() => setTool(item.id)}
              disabled={!editable && item.id !== 'pan'}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              <kbd>{item.shortcut}</kbd>
            </button>
          );
        })}
      </div>
      <p className="ce-tool-hint">{editable ? TOOL_HINTS[tool] || '' : '진행 모드에서는 도안을 고칠 수 없습니다.'}</p>

      <div className="ce-library">
        {KNIT_STITCH_CATEGORIES.map((category) => (
          <section key={category.id} className="ce-library-group" aria-label={category.label}>
            <h3>{category.label}</h3>
            <div className="ce-symbol-grid">
              {KNIT_STITCHES.filter((stitch) => stitch.category === category.id).map((stitch) => {
                const active = tool === 'stitch' && activeStitchId === stitch.id;
                return (
                  <button
                    key={stitch.id}
                    type="button"
                    className={`ce-symbol ke-symbol ${active ? 'is-active' : ''} ${stitch.span > 1 ? 'is-wide' : ''}`}
                    aria-pressed={active}
                    title={`${stitch.name} (${stitch.consumes}코 → ${stitch.produces}코)`}
                    onClick={() => pickStitch(stitch.id)}
                    disabled={!editable}
                  >
                    <span className={`ke-symbol-glyph ${stitch.id === 'ns' ? 'is-no-stitch' : ''}`}>
                      <StitchGlyph id={stitch.id} size={22} />
                    </span>
                    <span>{stitch.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <p className="ce-tool-hint">빈 칸은 겉뜨기입니다.</p>
      </div>
    </aside>
  );
}

/** 오른쪽: 단별 코 수 검사 */
export function KnitCountPanel({ editor }) {
  const { knitRowAnalysis, knitRowIssues, rowNumber } = editor;
  const issues = [...knitRowIssues.values()];
  const firstRow = knitRowAnalysis[knitRowAnalysis.length - 1];
  const lastRow = knitRowAnalysis[0];
  const Icon = issues.length ? AlertTriangle : CheckCircle2;

  return (
    <Panel title="코 수 검사" icon={Icon} className={`ce-panel ke-count ${issues.length ? 'has-issues' : ''}`}>
      <strong className="ke-count-head">
        {issues.length ? `코 수가 맞지 않는 단 ${issues.length}개` : '모든 단의 코 수가 맞습니다'}
      </strong>
      {firstRow && lastRow ? (
        <span className="ke-count-range">
          시작 {firstRow.consumes}코 → 마지막 단 {lastRow.produces}코
        </span>
      ) : null}
      {issues.length ? (
        <ul className="ke-count-list">
          {issues.slice(-8).reverse().map((issue) => (
            <li key={issue.row}>
              <b>{rowNumber(issue.row)}단</b> 아랫단 {issue.expected}코 / 이 단이 뜨는 코 {issue.consumes}코
              <small>
                {issue.consumes > issue.expected ? '무코를 넣거나 늘리기가 필요합니다' : '무코를 줄이거나 줄이기를 확인하세요'}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ke-count-tip">모아뜨기를 넣으면 윗단에 무코가 필요한지 여기서 알려줍니다.</p>
      )}
    </Panel>
  );
}
