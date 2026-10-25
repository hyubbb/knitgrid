import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GRID_SIZE,
  getChartBounds,
  layoutAlongLine,
  snapPoint,
  stitchesInRect
} from '../../features/crochet/model/crochetModel.js';
import { getGroupPrimitives, getStitchLocalBox, stitchTransform } from '../../features/crochet/model/crochetSymbols.js';
import { primitivesOf, SymbolGlyph } from './SymbolGlyph.jsx';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 6;
export const clampZoom = (zoom) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

const HALO = 'var(--ce-select)';

/** 15° 단위로 각도 고정 (Shift 줄 배치) */
const constrainAngle = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const step = Math.PI / 12;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  return { x: a.x + Math.cos(angle) * length, y: a.y + Math.sin(angle) * length };
};

/**
 * 코바늘 기호도안 SVG 캔버스
 * 도구: select(선택/이동/범위) · place(기호 배치) · row(줄 배치) · pan(화면 이동, Space 누른 채 드래그도 가능)
 */
export function CrochetCanvas({
  chart,
  view,
  onViewChange,
  tool,
  activeType,
  activeRoundId,
  selection,
  onSelectionChange,
  onPlace,
  onMove,
  snap,
  showGrid,
  activeOnly,
  spaceHeld,
  onOpenMenu,
  onHoverChange
}) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [hover, setHover] = useState(null);
  const [moveOffset, setMoveOffset] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const [rowDraft, setRowDraft] = useState(null);
  const [panning, setPanning] = useState(false);

  const roundsById = useMemo(() => new Map(chart.rounds.map((r) => [r.id, r])), [chart.rounds]);
  const activeRound = roundsById.get(activeRoundId) ?? chart.rounds[0];
  const selectedSet = useMemo(() => new Set(selection), [selection]);

  // 보이는 코 (드래그 중이면 이동 미리보기 반영)
  const visibleStitches = useMemo(() => {
    const list = chart.stitches.filter((s) => roundsById.get(s.roundId)?.visible !== false);
    if (!moveOffset) return list;
    return list.map((s) => (selectedSet.has(s.id) ? { ...s, x: s.x + moveOffset.dx, y: s.y + moveOffset.dy } : s));
  }, [chart.stitches, roundsById, moveOffset, selectedSet]);

  const byId = useMemo(() => new Map(visibleStitches.map((s) => [s.id, s])), [visibleStitches]);
  const groupOf = useMemo(() => {
    const map = new Map();
    chart.groups.forEach((g) => g.stitchIds.forEach((id) => map.set(id, g)));
    return map;
  }, [chart.groups]);

  const isEditable = (s) => !activeOnly || s.roundId === activeRound?.id;

  const toWorld = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (event.clientX - rect.left - v.panX) / v.zoom, y: (event.clientY - rect.top - v.panY) / v.zoom };
  };

  const maybeSnap = (p) => (snap ? snapPoint(p) : p);

  // 휠: 커서 기준 확대/축소 (passive 해제를 위해 직접 등록)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const handleWheel = (event) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const v = viewRef.current;
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015));
      const zoom = clampZoom(v.zoom * factor);
      onViewChange({ zoom, panX: sx - ((sx - v.panX) * zoom) / v.zoom, panY: sy - ((sy - v.panY) * zoom) / v.zoom });
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [onViewChange]);

  const stitchIdFromEvent = (event) => event.target.closest?.('[data-stitch-id]')?.getAttribute('data-stitch-id') ?? null;

  /** 클릭한 코 + 같은 묶음의 코 */
  const withGroup = (id) => {
    const group = groupOf.get(id);
    return group ? group.stitchIds : [id];
  };

  const handlePointerDown = (event) => {
    if (event.button === 2) return;
    const svg = svgRef.current;
    svg.setPointerCapture?.(event.pointerId);
    const world = toWorld(event);
    const effectiveTool = spaceHeld || event.button === 1 ? 'pan' : tool;

    if (effectiveTool === 'pan') {
      dragRef.current = { mode: 'pan', startX: event.clientX, startY: event.clientY, view: viewRef.current };
      setPanning(true);
      return;
    }
    if (effectiveTool === 'place') {
      dragRef.current = { mode: 'place', start: world, startX: event.clientX, startY: event.clientY };
      return;
    }
    if (effectiveTool === 'row') {
      const a = maybeSnap(world);
      dragRef.current = { mode: 'row', a };
      setRowDraft({ a, b: a });
      return;
    }

    // 선택 도구
    const id = stitchIdFromEvent(event);
    const hit = id ? byId.get(id) : null;
    if (hit && isEditable(hit)) {
      const ids = withGroup(id);
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        const allSelected = ids.every((i) => selectedSet.has(i));
        onSelectionChange(allSelected ? selection.filter((i) => !ids.includes(i)) : [...new Set([...selection, ...ids])]);
        dragRef.current = null;
        return;
      }
      if (!selectedSet.has(id)) onSelectionChange(ids);
      dragRef.current = { mode: 'move', start: world, moved: false };
      return;
    }
    dragRef.current = { mode: 'marquee', start: world, additive: event.shiftKey };
    setMarquee({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
  };

  const handlePointerMove = (event) => {
    const world = toWorld(event);
    const drag = dragRef.current;
    if (!drag) {
      const p = maybeSnap(world);
      setHover(p);
      onHoverChange?.(world);
      return;
    }
    if (drag.mode === 'pan') {
      onViewChange({ ...drag.view, panX: drag.view.panX + event.clientX - drag.startX, panY: drag.view.panY + event.clientY - drag.startY });
    } else if (drag.mode === 'move') {
      let dx = world.x - drag.start.x;
      let dy = world.y - drag.start.y;
      if (snap) {
        dx = Math.round(dx / GRID_SIZE) * GRID_SIZE;
        dy = Math.round(dy / GRID_SIZE) * GRID_SIZE;
      }
      if (event.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      if (dx || dy) drag.moved = true;
      setMoveOffset({ dx, dy });
    } else if (drag.mode === 'marquee') {
      setMarquee({ x1: drag.start.x, y1: drag.start.y, x2: world.x, y2: world.y });
    } else if (drag.mode === 'row') {
      let b = maybeSnap(world);
      if (event.shiftKey) b = constrainAngle(drag.a, world);
      setRowDraft({ a: drag.a, b });
    } else if (drag.mode === 'place') {
      setHover(maybeSnap(world));
    }
  };

  const finishDrag = (event, cancelled = false) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setPanning(false);
    if (!drag || cancelled) {
      setMoveOffset(null);
      setMarquee(null);
      setRowDraft(null);
      return;
    }
    if (drag.mode === 'move') {
      if (drag.moved && moveOffset) onMove(selection, moveOffset.dx, moveOffset.dy);
      setMoveOffset(null);
    } else if (drag.mode === 'marquee') {
      const rect = marquee;
      setMarquee(null);
      if (!rect) return;
      const tiny = Math.abs(rect.x2 - rect.x1) * view.zoom < 3 && Math.abs(rect.y2 - rect.y1) * view.zoom < 3;
      if (tiny) {
        if (!drag.additive) onSelectionChange([]);
        return;
      }
      const ids = stitchesInRect(visibleStitches.filter(isEditable), rect);
      // 묶음은 통째로 선택
      const expanded = new Set();
      ids.forEach((id) => withGroup(id).forEach((i) => expanded.add(i)));
      onSelectionChange(drag.additive ? [...new Set([...selection, ...expanded])] : [...expanded]);
    } else if (drag.mode === 'row') {
      const draft = rowDraft;
      setRowDraft(null);
      if (!draft) return;
      const { positions } = layoutAlongLine(activeType, draft.a, draft.b);
      onPlace(positions);
    } else if (drag.mode === 'place') {
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (moved > 6) return;
      const p = maybeSnap(drag.start);
      onPlace([{ x: p.x, y: p.y, rotation: 0 }]);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    const id = stitchIdFromEvent(event);
    const hit = id ? byId.get(id) : null;
    let nextSelection = selection;
    if (hit && isEditable(hit) && !selectedSet.has(id)) {
      nextSelection = withGroup(id);
      onSelectionChange(nextSelection);
    }
    onOpenMenu({ x: event.clientX, y: event.clientY, selection: nextSelection, world: toWorld(event) });
  };

  // ── 렌더 준비 ──
  const rowLayout = rowDraft ? layoutAlongLine(activeType, rowDraft.a, rowDraft.b) : null;
  const selectedVisible = visibleStitches.filter((s) => selectedSet.has(s.id));
  const selectionBounds = selectedVisible.length ? getChartBounds(selectedVisible) : null;
  const groupsToDraw = chart.groups.filter((g) => g.stitchIds.every((id) => byId.has(id)));
  const groupedIds = new Set(groupsToDraw.flatMap((g) => g.stitchIds));
  const colorOf = (s) => roundsById.get(s.roundId)?.color ?? '#333';
  const dimOf = (s) => (activeOnly && s.roundId !== activeRound?.id ? 0.28 : 1);
  const ghostColor = activeRound?.color ?? '#333';

  const gridStep = GRID_SIZE * view.zoom * (view.zoom < 0.6 ? 5 : 1);
  const effectiveTool = spaceHeld ? 'pan' : tool;
  const cursorClass = panning ? 'is-panning' : `tool-${effectiveTool}`;

  return (
    <svg
      ref={svgRef}
      className={`ce-canvas ${cursorClass}`}
      role="application"
      aria-label="코바늘 기호도안 캔버스"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishDrag(event)}
      onPointerCancel={(event) => finishDrag(event, true)}
      onPointerLeave={() => {
        if (!dragRef.current) setHover(null);
      }}
      onContextMenu={handleContextMenu}
    >
      <defs>
        <pattern
          id="ce-dot-grid"
          width={gridStep}
          height={gridStep}
          patternUnits="userSpaceOnUse"
          x={view.panX % gridStep}
          y={view.panY % gridStep}
        >
          <circle cx={0.5} cy={0.5} r={view.zoom > 1.5 ? 1.2 : 0.9} className="ce-grid-dot" />
        </pattern>
        <pattern
          id="ce-dot-grid-major"
          width={gridStep * 5}
          height={gridStep * 5}
          patternUnits="userSpaceOnUse"
          x={view.panX % (gridStep * 5)}
          y={view.panY % (gridStep * 5)}
        >
          <circle cx={0.5} cy={0.5} r={1.6} className="ce-grid-dot-major" />
        </pattern>
      </defs>
      {showGrid ? (
        <>
          <rect width="100%" height="100%" fill="url(#ce-dot-grid)" />
          <rect width="100%" height="100%" fill="url(#ce-dot-grid-major)" />
        </>
      ) : null}

      <g transform={`translate(${view.panX} ${view.panY}) scale(${view.zoom})`}>
        {/* 선택 후광 */}
        <g className="ce-halo" pointerEvents="none">
          {groupsToDraw
            .filter((g) => g.stitchIds.some((id) => selectedSet.has(id)))
            .map((g) => (
              <SymbolGlyph key={`h-${g.id}`} primitives={getGroupPrimitives(g, byId)} color={HALO} strokeWidth={6} />
            ))}
          {selectedVisible
            .filter((s) => !groupedIds.has(s.id))
            .map((s) => (
              <g key={`h-${s.id}`} transform={stitchTransform(s)}>
                <SymbolGlyph primitives={primitivesOf(s.type)} color={HALO} strokeWidth={6} />
              </g>
            ))}
        </g>

        {/* 묶음(모아뜨기/늘려뜨기) */}
        {groupsToDraw.map((g) => {
          const first = byId.get(g.stitchIds[0]);
          return (
            <SymbolGlyph
              key={g.id}
              primitives={getGroupPrimitives(g, byId)}
              color={colorOf(first)}
              opacity={dimOf(first)}
            />
          );
        })}

        {/* 개별 코 + 히트 영역 */}
        {visibleStitches.map((s) => {
          const box = getStitchLocalBox(s.type);
          const editable = isEditable(s);
          return (
            <g
              key={s.id}
              data-stitch-id={editable ? s.id : undefined}
              transform={stitchTransform(s)}
              className={`ce-stitch ${editable ? '' : 'is-locked'}`}
              pointerEvents={editable ? undefined : 'none'}
            >
              <rect className="ce-hit" x={box.x} y={box.y} width={box.width} height={box.height} />
              {groupedIds.has(s.id) ? null : <SymbolGlyph primitives={primitivesOf(s.type)} color={colorOf(s)} opacity={dimOf(s)} />}
              {s.role ? <title>{s.role === 'standing' ? '기둥코' : '단 끝 빼뜨기'}</title> : null}
            </g>
          );
        })}

        {selectionBounds && selectedVisible.length > 1 ? (
          <rect
            className="ce-selection-box"
            x={selectionBounds.minX - 4}
            y={selectionBounds.minY - 4}
            width={selectionBounds.maxX - selectionBounds.minX + 8}
            height={selectionBounds.maxY - selectionBounds.minY + 8}
            strokeWidth={1 / view.zoom}
            strokeDasharray={`${4 / view.zoom} ${3 / view.zoom}`}
          />
        ) : null}

        {/* 기호 배치 미리보기 */}
        {effectiveTool === 'place' && hover && !panning ? (
          <g transform={`translate(${hover.x} ${hover.y})`} pointerEvents="none">
            <SymbolGlyph primitives={primitivesOf(activeType)} color={ghostColor} opacity={0.45} />
          </g>
        ) : null}
        {effectiveTool === 'row' && hover && !rowDraft ? (
          <g transform={`translate(${hover.x} ${hover.y})`} pointerEvents="none">
            <SymbolGlyph primitives={primitivesOf(activeType)} color={ghostColor} opacity={0.35} />
          </g>
        ) : null}

        {/* 줄 배치 미리보기 + 개수 뱃지 */}
        {rowDraft && rowLayout ? (
          <g pointerEvents="none">
            <line
              className="ce-row-guide"
              x1={rowDraft.a.x}
              y1={rowDraft.a.y}
              x2={rowDraft.b.x}
              y2={rowDraft.b.y}
              strokeWidth={1 / view.zoom}
              strokeDasharray={`${5 / view.zoom} ${4 / view.zoom}`}
            />
            {rowLayout.positions.map((p, index) => (
              <g key={index} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation})`}>
                <SymbolGlyph primitives={primitivesOf(activeType)} color={ghostColor} opacity={0.7} />
              </g>
            ))}
            <g transform={`translate(${rowDraft.b.x} ${rowDraft.b.y}) scale(${1 / view.zoom})`}>
              <rect className="ce-count-badge" x={10} y={8} width={46} height={22} rx={11} />
              <text className="ce-count-badge-text" x={33} y={23} textAnchor="middle">
                {rowLayout.count}개
              </text>
            </g>
          </g>
        ) : null}

        {marquee ? (
          <rect
            className="ce-marquee"
            x={Math.min(marquee.x1, marquee.x2)}
            y={Math.min(marquee.y1, marquee.y2)}
            width={Math.abs(marquee.x2 - marquee.x1)}
            height={Math.abs(marquee.y2 - marquee.y1)}
            strokeWidth={1 / view.zoom}
          />
        ) : null}
      </g>
      {chart.stitches.length === 0 ? (
        <text className="ce-empty-hint" x="50%" y="50%" textAnchor="middle">
          왼쪽에서 기호를 고르고 캔버스를 클릭하세요 · 원형 도안은 「원형 생성」으로 시작할 수 있어요
        </text>
      ) : null}
    </svg>
  );
}
