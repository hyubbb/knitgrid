import {
  Button,
  PaletteRow,
  Panel,
  SegmentedControl,
} from "../../../../../components/index.js";
import { Palette } from "lucide-react";
import {
  DISPLAY_MODES,
  isPaletteVisible,
  normalizeHex,
} from "../../../../../app/model/knitgridModel.js";

export function InspectorPalettePanel({ editor, editable = true }) {
  const {
    addPaletteColor,
    displayMode,
    setDisplayMode,
    paletteNotice,
    palette,
    activePaletteId,
    setActivePaletteId,
    expandedPaletteId,
    setExpandedPaletteId,
    activeCounts,
    togglePaletteVisibility,
    updatePaletteItem,
    mergePaletteItems,
    deletePaletteItem,
  } = editor;

  return (
    <Panel
      icon={Palette}
      title={editable ? "팔레트 / 코드" : "팔레트 / 코드 검수"}
      action={editable ? <Button onClick={addPaletteColor}>추가</Button> : null}
    >
      <SegmentedControl
        as="div"
        className="display-tabs"
        items={DISPLAY_MODES}
        value={displayMode}
        onChange={setDisplayMode}
      />
      {paletteNotice ? (
        <div className="palette-notice">{paletteNotice}</div>
      ) : null}
      {editable ? (
        <div className="palette-list">
          {palette.map((item) => (
            <PaletteRow
              key={item.id}
              item={item}
              visible={isPaletteVisible(item)}
              active={activePaletteId === item.id}
              expanded={expandedPaletteId === item.id}
              count={activeCounts.get(item.id) || 0}
              palette={palette}
              canDelete={palette.length > 1}
              onActivate={setActivePaletteId}
              onToggleExpand={(id) =>
                setExpandedPaletteId((current) => (current === id ? "" : id))
              }
              onExpand={setExpandedPaletteId}
              onToggleVisibility={togglePaletteVisibility}
              onUpdate={updatePaletteItem}
              onMerge={(sourceId, targetId) =>
                mergePaletteItems({ sourceId, targetId })
              }
              onDelete={deletePaletteItem}
              normalizeHex={normalizeHex}
            />
          ))}
        </div>
      ) : (
        <div className="palette-summary-list">
          {palette.map((item) => {
            const visible = isPaletteVisible(item);
            const count = activeCounts.get(item.id) || 0;
            return (
              <div
                key={item.id}
                className={`palette-summary-row ${visible ? "" : "hidden-color"}`.trim()}
                aria-label={`${item.code} ${item.name}, ${count}칸, ${visible ? "표시됨" : "숨김"}`}
              >
                <i style={{ background: item.color }} aria-hidden="true" />
                <strong>{item.code}</strong>
                <span>{item.name}</span>
                <em>{visible ? "표시" : "숨김"}</em>
                <b>{count}칸</b>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
