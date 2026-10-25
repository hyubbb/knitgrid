import { useEffect, useMemo, useRef } from "react";
import {
  buildKnitStitches,
  getSafeDpr,
  renderKnitFabric,
} from "../../../../app/model/knitgridModel.js";

/**
 * 실물 보기 모드에서 셀 아래에 깔리는 메리야스 편물 캔버스.
 * 위/아래 가장자리 코머리가 보이도록 셀 영역보다 pad만큼 크게 그린다.
 */
export function KnitPreviewLayer({ grid, palette, rows, cols, cellW, cellH }) {
  const canvasRef = useRef(null);
  const stitches = useMemo(
    () => buildKnitStitches({ grid, palette }),
    [grid, palette],
  );
  const pad = cellH * 0.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    // 브러시 드래그처럼 연속 변경은 한 프레임에 한 번만 그린다.
    const frame = requestAnimationFrame(() => {
      const width = cols * cellW;
      const height = rows * cellH + pad * 2;
      const dpr = getSafeDpr(width, height);
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderKnitFabric(ctx, {
        stitches,
        rows,
        cols,
        cellW,
        cellH,
        dpr,
        originY: pad,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [stitches, rows, cols, cellW, cellH, pad]);

  return (
    <canvas
      ref={canvasRef}
      className='knit-preview-layer'
      style={{ top: -pad }}
      aria-hidden='true'
    />
  );
}
