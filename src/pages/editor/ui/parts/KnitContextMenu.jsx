import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  KNIT_FILL_PATTERNS,
  KNIT_STITCH_CATEGORIES,
  KNIT_STITCHES,
  getKnitSelectionActions,
} from "../../../../app/model/knitgridModel.js";
import { StitchGlyph } from "./StitchGlyph.jsx";

/**
 * 격자 우클릭 메뉴. 대바늘 도안이면 선택 폭에 맞는 기법 변환(모아뜨기·교차뜨기·구멍무늬)과
 * 기호 바꾸기, 무늬 채우기를 보여준다. 방안 도안은 칠하기/지우기만.
 */
export function KnitContextMenu({ editor, position, onClose }) {
  const {
    selection,
    isKnitChart,
    activePalette,
    applyStitchToSelection,
    applySelectionAction,
    fillSelectionPattern,
    invertSelectionStitches,
    clearSelectionStitches,
    paintSelection,
  } = editor;
  const menuRef = useRef(null);
  const [placement, setPlacement] = useState(position);
  const [showStitches, setShowStitches] = useState(false);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    setPlacement({
      x: Math.max(8, Math.min(position.x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(position.y, window.innerHeight - rect.height - 8)),
    });
  }, [position, showStitches]);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      onClose();
    };
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    menuRef.current?.querySelector("button")?.focus();
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!selection) return null;
  const run = (action) => () => {
    action();
    onClose();
  };
  const width = Math.abs(selection.c1 - selection.c0) + 1;
  const height = Math.abs(selection.r1 - selection.r0) + 1;
  const smartActions = isKnitChart ? getKnitSelectionActions(selection) : [];

  // chart-grid의 transform 안에서는 fixed 위치가 어긋나므로 body로 띄운다.
  return createPortal(
    <div
      ref={menuRef}
      className='knit-context-menu'
      role='menu'
      style={{ left: placement.x, top: placement.y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className='knit-context-title'>
        선택 {width}코 × {height}단
      </div>
      {smartActions.length ? (
        <div className='knit-context-group'>
          <span className='knit-context-label'>기법 변환</span>
          {smartActions.map((action) => (
            <button
              key={action.id}
              type='button'
              role='menuitem'
              onClick={run(() => applySelectionAction(action))}
            >
              <span className='knit-context-glyphs' aria-hidden='true'>
                {action.cells.map((id, index) => (
                  <StitchGlyph key={index} id={id} size={16} />
                ))}
              </span>
              <span>{action.label}</span>
              <small>{action.hint}</small>
            </button>
          ))}
        </div>
      ) : null}
      {isKnitChart ? (
        <div className='knit-context-group'>
          <span className='knit-context-label'>무늬 채우기</span>
          {KNIT_FILL_PATTERNS.map((pattern) => (
            <button
              key={pattern.id}
              type='button'
              role='menuitem'
              onClick={run(() => fillSelectionPattern(pattern))}
            >
              <span>{pattern.label}</span>
            </button>
          ))}
          <button type='button' role='menuitem' onClick={run(invertSelectionStitches)}>
            <span>겉뜨기 ↔ 안뜨기 뒤집기</span>
          </button>
          <button
            type='button'
            role='menuitem'
            aria-expanded={showStitches}
            onClick={() => setShowStitches((open) => !open)}
          >
            <span>기호 바꾸기 {showStitches ? "▴" : "▸"}</span>
          </button>
          {showStitches ? (
            <div className='knit-context-stitches'>
              {KNIT_STITCH_CATEGORIES.map((category) => (
                <div key={category.id} className='knit-context-stitch-row'>
                  {KNIT_STITCHES.filter((stitch) => stitch.category === category.id).map((stitch) => (
                    <button
                      key={stitch.id}
                      type='button'
                      role='menuitem'
                      title={stitch.name}
                      aria-label={stitch.name}
                      onClick={run(() => applyStitchToSelection(stitch.id))}
                    >
                      <StitchGlyph id={stitch.id} size={18} />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
          <button type='button' role='menuitem' onClick={run(clearSelectionStitches)}>
            <span>기호 지우기 (겉뜨기로)</span>
          </button>
        </div>
      ) : null}
      <div className='knit-context-group'>
        <span className='knit-context-label'>색</span>
        <button type='button' role='menuitem' onClick={run(() => paintSelection(false))}>
          <i className='knit-context-swatch' style={{ background: activePalette?.color }} />
          <span>{activePalette?.name || "현재 색"}으로 칠하기</span>
        </button>
        <button type='button' role='menuitem' onClick={run(() => paintSelection(true))}>
          <span>색 지우기</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
