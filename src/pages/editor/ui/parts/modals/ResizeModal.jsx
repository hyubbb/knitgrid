import { useRef } from 'react';
import { Button, Modal } from '../../../../../components/index.js';
import { AlertTriangle } from 'lucide-react';
import { HORIZONTAL_ALIGNMENTS, VERTICAL_ALIGNMENTS } from '../../../../../app/model/knitgridModel.js';

const alignLabel = (options, id) => options.find((item) => item.id === id)?.label ?? '중앙';
const resizeAnchor = (id, endId) => (id === endId ? 'end' : id === 'center' ? 'center' : 'start');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
// 정렬(start/center/end)로부터 기본 offset(0~delta) 계산 — gridModel.alignOffset과 동일
const baseOffset = (delta, anchor) => (anchor === 'end' ? delta : anchor === 'center' ? Math.floor(delta / 2) : 0);

export function ResizeModal({ editor }) {
  const {
    pendingResize,
    setPendingResize,
    cols,
    rows,
    grid,
    commitGridResize,
    paintedCellCount,
    appliedSourceImage
  } = editor;

  if (!pendingResize) return null;

  return (
    <Modal
      open={Boolean(pendingResize)}
      title="격자 크기 변경"
      subtitle={pendingResize ? `현재 ${cols} x ${rows}칸에서 ${pendingResize.cols} x ${pendingResize.rows}칸으로 바꿉니다.` : undefined}
      onClose={() => setPendingResize(null)}
      variant="resize-modal"
      bodyClassName="resize-modal-body"
      titleId="resize-modal-title"
      closeLabel="격자 크기 변경 취소"
      actions={
        <>
          <Button onClick={() => setPendingResize(null)}>취소</Button>
          <Button variant="danger" onClick={() => commitGridResize(pendingResize.rows, pendingResize.cols, 'reset')}>초기화</Button>
          <Button variant="primary" onClick={() => commitGridResize(pendingResize.rows, pendingResize.cols, 'keep')}>그림 유지</Button>
        </>
      }
    >
      <AlertTriangle size={20} />
      <div>
        <strong>그려진 칸 {paintedCellCount}개가 있습니다.</strong>
        <p>
          {appliedSourceImage
            ? '이미지 도안은 현재 이미지 정렬 기준으로 보존됩니다. 줄어들면 그 기준의 바깥쪽부터 잘리고, 늘어나면 반대쪽에 빈 칸이 생깁니다.'
            : '그림을 유지하면 아래 미리보기 기준으로 보존됩니다. 줄어들면 바깥쪽이 잘리고, 늘어나면 반대쪽에 빈 칸이 생깁니다.'}
        </p>
        {pendingResize ? (
          <ResizeAlignPreview
            grid={grid}
            curCols={cols}
            curRows={rows}
            nextCols={pendingResize.cols}
            nextRows={pendingResize.rows}
            alignX={appliedSourceImage?.imageOptions?.alignX}
            alignY={appliedSourceImage?.imageOptions?.alignY}
            isImage={Boolean(appliedSourceImage)}
            offsetX={pendingResize.offsetX}
            offsetY={pendingResize.offsetY}
            onOffsetChange={(offsetX, offsetY) =>
              setPendingResize((previous) => ({ ...previous, offsetX, offsetY }))
            }
          />
        ) : null}
      </div>
    </Modal>
  );
}

// 리사이즈 시 어디가 유지/잘림/빈칸이 되는지 보여주고, 유지 영역을 드래그해 위치를 조정하는 미니 다이어그램
function ResizeAlignPreview({ grid, curCols, curRows, nextCols, nextRows, alignX, alignY, isImage, offsetX, offsetY, onOffsetChange }) {
  const drag = useRef(null);
  const ax = resizeAnchor(alignX, 'right');
  const ay = resizeAnchor(alignY, 'bottom');
  const deltaX = Math.abs(curCols - nextCols);
  const deltaY = Math.abs(curRows - nextRows);
  const ox = clamp(offsetX ?? baseOffset(deltaX, ax), 0, deltaX);
  const oy = clamp(offsetY ?? baseOffset(deltaY, ay), 0, deltaY);
  const uW = Math.max(curCols, nextCols);
  const uH = Math.max(curRows, nextRows);
  const cell = Math.max(4, Math.min(12, 116 / Math.max(uW, uH)));
  // 작은 쪽 축이 offset부터 시작, 큰 쪽은 union 전체를 차지 (0부터)
  const curX = curCols <= nextCols ? ox : 0;
  const nextX = nextCols <= curCols ? ox : 0;
  const curY = curRows <= nextRows ? oy : 0;
  const nextY = nextRows <= curRows ? oy : 0;
  const keepX = Math.max(curX, nextX);
  const keepY = Math.max(curY, nextY);
  const keepW = Math.max(0, Math.min(curX + curCols, nextX + nextCols) - keepX);
  const keepH = Math.max(0, Math.min(curY + curRows, nextY + nextRows) - keepY);
  const draggable = deltaX > 0 || deltaY > 0;

  // 실제 그려진 칸이 유지 영역에 들어오는지 계산 (유지 범위 밖 active 칸 = 잘림)
  const keepSrcCol = keepX - curX;
  const keepSrcRow = keepY - curY;
  let paintedTotal = 0;
  let clipped = 0;
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  (grid ?? []).forEach((row, r) =>
    row.forEach((cellData, c) => {
      if (!cellData.active) return;
      paintedTotal += 1;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
      const kept = keepW > 0 && keepH > 0
        && r >= keepSrcRow && r < keepSrcRow + keepH
        && c >= keepSrcCol && c < keepSrcCol + keepW;
      if (!kept) clipped += 1;
    })
  );
  const hasPainted = paintedTotal > 0;

  const onPointerDown = (event) => {
    if (!draggable) return;
    event.preventDefault();
    drag.current = { startX: event.clientX, startY: event.clientY, ox, oy };
    const onMove = (moveEvent) => {
      const start = drag.current;
      if (!start) return;
      const nx = deltaX === 0 ? start.ox : clamp(Math.round(start.ox + (moveEvent.clientX - start.startX) / cell), 0, deltaX);
      const ny = deltaY === 0 ? start.oy : clamp(Math.round(start.oy + (moveEvent.clientY - start.startY) / cell), 0, deltaY);
      onOffsetChange(nx, ny);
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // 장식용 rect는 pointerEvents none — 위에 그려져도 드래그 핸들의 pointerdown을 가로채지 않게
  const rect = (x, y, w, h, extra) => (
    <span aria-hidden style={{ position: 'absolute', left: x * cell, top: y * cell, width: w * cell, height: h * cell, pointerEvents: 'none', ...extra }} />
  );
  const hatch = 'repeating-linear-gradient(45deg, transparent 0 2px, var(--kg-line) 2px 3px)';
  const swatch = { width: 10, height: 10, borderRadius: 2, display: 'inline-block' };
  const legendItem = { display: 'inline-flex', alignItems: 'center', gap: 4 };
  return (
    <div style={{ marginTop: 10 }}>
      {isImage ? (
        <span
          style={{
            display: 'inline-block', padding: '3px 8px', borderRadius: 999,
            background: 'var(--kg-teal-soft)', color: 'var(--kg-teal)', fontSize: 10, fontWeight: 800
          }}
        >
          이미지 정렬: 가로 {alignLabel(HORIZONTAL_ALIGNMENTS, alignX)} · 세로 {alignLabel(VERTICAL_ALIGNMENTS, alignY)}
        </span>
      ) : null}
      <div style={{ position: 'relative', width: uW * cell, height: uH * cell, marginTop: 8 }}>
        {rect(curX, curY, curCols, curRows, { background: 'var(--kg-coral-soft)' })}
        {rect(nextX, nextY, nextCols, nextRows, { backgroundImage: hatch })}
        {keepW > 0 && keepH > 0
          ? rect(keepX, keepY, keepW, keepH, { background: 'var(--kg-teal)', opacity: 0.85 })
          : null}
        {hasPainted
          ? rect(curX + minC, curY + minR, maxC - minC + 1, maxR - minR + 1, {
              border: '1.5px dashed var(--kg-ink, #111)', borderRadius: 2, boxSizing: 'border-box'
            })
          : null}
        {keepW > 0 && keepH > 0 && draggable ? (
          <span
            onPointerDown={onPointerDown}
            title="드래그해서 유지 영역 위치 조정"
            style={{
              position: 'absolute', left: keepX * cell, top: keepY * cell,
              width: keepW * cell, height: keepH * cell,
              cursor: 'move', touchAction: 'none'
            }}
          />
        ) : null}
        {rect(nextX, nextY, nextCols, nextRows, { border: '2px solid var(--kg-teal)', borderRadius: 2 })}
      </div>
      {draggable ? (
        <p style={{ margin: '6px 0 0', fontSize: 10, fontWeight: 700, color: 'var(--kg-teal)' }}>
          파란 영역을 드래그해 유지할 위치를 조정하세요. 점선은 그림 범위입니다.
        </p>
      ) : null}
      {hasPainted ? (
        <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 800, color: clipped > 0 ? 'var(--kg-coral)' : 'var(--kg-teal)' }}>
          {clipped > 0 ? `그려진 ${paintedTotal}칸 중 ${clipped}칸이 잘립니다` : `그려진 ${paintedTotal}칸이 모두 유지됩니다`}
        </p>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 10, fontWeight: 700, color: 'var(--kg-muted)' }}>
        <span style={legendItem}><span style={{ ...swatch, background: 'var(--kg-teal)', opacity: 0.85 }} />유지</span>
        <span style={legendItem}><span style={{ ...swatch, background: 'var(--kg-coral-soft)' }} />잘림</span>
        <span style={legendItem}><span style={{ ...swatch, backgroundImage: hatch, border: '1px solid var(--kg-line)' }} />빈 칸(비어 있음)</span>
      </div>
    </div>
  );
}
