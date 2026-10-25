import { AlertTriangle, CheckCircle2, Spline } from 'lucide-react';
import { Panel } from '../../../../../components/index.js';
import { KNIT_STITCH_CATEGORIES, KNIT_STITCHES } from '../../../../../app/model/knitgridModel.js';
import { StitchGlyph } from '../StitchGlyph.jsx';

/**
 * 대바늘 기법 팔레트 + 단별 코 수 검사.
 * 기호를 고르면 기호 도구로 바뀌고, 칸을 누르면 그 기법이 놓인다.
 */
export function InspectorStitchPanel({ editor, editable = true }) {
  const { activeStitchId, setActiveStitchId, setTool, tool, knitRowAnalysis, knitRowIssues, rowNumber } = editor;
  const issues = [...knitRowIssues.values()];
  const firstRow = knitRowAnalysis[knitRowAnalysis.length - 1];
  const lastRow = knitRowAnalysis[0];

  const pickStitch = (id) => {
    setActiveStitchId(id);
    setTool('stitch');
  };

  return (
    <Panel className="stitch-panel" icon={Spline} title="대바늘 기법">
      {editable ? (
        <div className="stitch-palette">
          {KNIT_STITCH_CATEGORIES.map((category) => (
            <div key={category.id} className="stitch-palette-group">
              <span className="stitch-palette-label">{category.label}</span>
              <div className="stitch-palette-grid">
                {KNIT_STITCHES.filter((stitch) => stitch.category === category.id).map((stitch) => (
                  <button
                    key={stitch.id}
                    type="button"
                    className={`stitch-palette-item ${tool === 'stitch' && activeStitchId === stitch.id ? 'active' : ''} ${stitch.span > 1 ? 'wide' : ''}`}
                    onClick={() => pickStitch(stitch.id)}
                    title={`${stitch.name} (${stitch.consumes}→${stitch.produces}코)`}
                  >
                    <span className={`stitch-palette-glyph ${stitch.id === 'ns' ? 'no-stitch' : ''}`}>
                      <StitchGlyph id={stitch.id} size={20} />
                    </span>
                    <span className="stitch-palette-name">{stitch.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="stitch-palette-tip">
            빈 칸은 겉뜨기입니다. 선택 도구(V)로 영역을 고르고 우클릭하면 모아뜨기·교차뜨기·고무뜨기로 바꿀 수 있습니다.
          </p>
        </div>
      ) : null}

      <div className={`stitch-count-check ${issues.length ? 'has-issues' : ''}`}>
        <div className="stitch-count-head">
          {issues.length ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <strong>{issues.length ? `코 수가 맞지 않는 단 ${issues.length}개` : '모든 단의 코 수가 맞습니다'}</strong>
        </div>
        {firstRow && lastRow ? (
          <span className="stitch-count-range">
            시작 {firstRow.consumes}코 → 마지막 단 {lastRow.produces}코
          </span>
        ) : null}
        {issues.length ? (
          <ul>
            {issues.slice(-8).reverse().map((issue) => (
              <li key={issue.row}>
                <b>{rowNumber(issue.row)}단</b> 아랫단 {issue.expected}코 / 이 단이 뜨는 코 {issue.consumes}코
                <small>{issue.consumes > issue.expected ? ' — 무코를 넣거나 늘리기가 필요' : ' — 무코를 줄이거나 줄이기를 확인'}</small>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}
