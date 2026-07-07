import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "./Button.jsx";
import { Select } from "./Select.jsx";
import { Swatch } from "./Swatch.jsx";

/**
 * 팔레트 한 행: 가시성 토글 + 스와치 + 코드/이름 + 카운트 + (펼침 시) 편집기.
 * 모든 데이터/핸들러는 props. 로직은 App에 유지.
 * @param {object} props
 * @param {{id:string,code:string,name:string,color:string}} props.item
 * @param {boolean} props.visible
 * @param {boolean} props.active
 * @param {boolean} props.expanded
 * @param {number} props.count - 사용 칸 수
 * @param {Array<{id:string,code:string,name:string}>} props.palette - 병합/삭제 대상 목록
 * @param {boolean} props.canDelete - palette.length > 1
 * @param {(id:string) => void} props.onActivate
 * @param {(id:string) => void} props.onToggleExpand
 * @param {(id:string) => void} props.onExpand - 강제 펼침(스와치/입력 클릭·포커스)
 * @param {(id:string) => void} props.onToggleVisibility
 * @param {(id:string, patch:object) => void} props.onUpdate
 * @param {(sourceId:string, targetId:string) => void} props.onMerge
 * @param {(id:string, replacementId?:string) => void} props.onDelete
 * @param {(value:string) => string|null} props.normalizeHex
 */
export function PaletteRow({
  item,
  visible,
  active,
  expanded,
  count,
  palette,
  canDelete,
  onActivate,
  onToggleExpand,
  onExpand,
  onToggleVisibility,
  onUpdate,
  onMerge,
  onDelete,
  normalizeHex,
}) {
  return (
    <div
      data-palette-id={item.id}
      className={`palette-row ${active ? "active" : ""} ${expanded ? "expanded" : ""} ${visible ? "" : "hidden-color"}`}
      onClick={() => {
        onActivate(item.id);
        onToggleExpand(item.id);
      }}
    >
      <button
        className={`palette-visibility-toggle ${visible ? "" : "is-hidden"}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleVisibility(item.id);
        }}
        title={
          visible ? `${item.code} 도안에서 숨기기` : `${item.code} 도안에 표시`
        }
        aria-label={visible ? `${item.code} 숨기기` : `${item.code} 다시 표시`}
      >
        {visible ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <Swatch
        color={item.color}
        onClick={(event) => {
          event.stopPropagation();
          onActivate(item.id);
          onExpand(item.id);
        }}
        title={`${item.code} 색상 편집`}
      />
      <input
        value={item.code}
        onClick={(event) => {
          event.stopPropagation();
          onActivate(item.id);
          onExpand(item.id);
        }}
        onFocus={() => {
          onActivate(item.id);
          onExpand(item.id);
        }}
        onChange={(event) => onUpdate(item.id, { code: event.target.value })}
        aria-label="코드"
      />
      <input
        value={item.name}
        onClick={(event) => {
          event.stopPropagation();
          onActivate(item.id);
          onExpand(item.id);
        }}
        onFocus={() => {
          onActivate(item.id);
          onExpand(item.id);
        }}
        onChange={(event) => onUpdate(item.id, { name: event.target.value })}
        aria-label="이름"
      />
      <span>{count}</span>
      {expanded ? (
        <div
          className="palette-editor"
          onClick={(event) => event.stopPropagation()}
        >
          <label>
            색상
            <input
              type="color"
              value={item.color}
              onChange={(event) =>
                onUpdate(item.id, { color: event.target.value })
              }
              aria-label={`${item.code} 색상`}
            />
          </label>
          <label>
            HEX
            <input
              defaultValue={item.color}
              key={`${item.id}-${item.color}`}
              onChange={(event) => {
                const normalized = normalizeHex(event.target.value);
                if (normalized && normalized !== item.color)
                  onUpdate(item.id, { color: normalized });
              }}
              onBlur={(event) => {
                const normalized = normalizeHex(event.target.value);
                if (normalized) onUpdate(item.id, { color: normalized });
                else event.target.value = item.color;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              aria-label="HEX 색상"
            />
          </label>
          <label>
            코드
            <input
              value={item.code}
              onChange={(event) =>
                onUpdate(item.id, { code: event.target.value })
              }
              aria-label="확장 코드"
            />
          </label>
          <label>
            이름
            <input
              value={item.name}
              onChange={(event) =>
                onUpdate(item.id, { name: event.target.value })
              }
              aria-label="확장 이름"
            />
          </label>
          <Select
            label="기존 색상으로 병합"
            className="palette-merge-field"
            value=""
            onChange={(v) => {
              if (v) onMerge(item.id, v);
            }}
            ariaLabel="기존 색상으로 병합"
          >
            <option value="">대상 선택</option>
            {palette
              .filter((target) => target.id !== item.id)
              .map((target) => (
                <option key={target.id} value={target.id}>
                  {target.code} · {target.name}
                </option>
              ))}
          </Select>
          <div className="palette-delete-field">
            <div>
              <strong>컬러코드 삭제</strong>
              <span>
                {count}칸에서 사용 중입니다.
                {count
                  ? " 삭제하려면 대체 색상을 선택하세요."
                  : " 바로 삭제할 수 있습니다."}
              </span>
            </div>
            {count ? (
              <Select
                value=""
                onChange={(v) => {
                  if (v) onDelete(item.id, v);
                }}
                ariaLabel="삭제하며 대체할 색상"
                disabled={!canDelete}
              >
                <option value="">대체 색상 선택</option>
                {palette
                  .filter((target) => target.id !== item.id)
                  .map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.code} · {target.name}
                    </option>
                  ))}
              </Select>
            ) : (
              <Button
                variant="danger"
                icon={Trash2}
                iconSize={14}
                onClick={() => onDelete(item.id)}
                disabled={!canDelete}
              >
                삭제
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
