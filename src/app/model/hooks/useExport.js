import { useCallback } from 'react';
import {
  resolveCellDisplay,
  luminance,
  isPaletteVisible,
  buildWrittenPatternLines,
  buildWrittenPatternText,
  buildWrittenPatternCanvases
} from '../knitgridModel.js';

// 도안 내보내기(PNG/PDF/JSON/서술형 텍스트). 상태를 읽어 파일을 만들 뿐 코어 상태는 바꾸지 않는다.
export function useExport({
  grid,
  palette,
  rows,
  cols,
  projectName,
  rowDirection,
  numberStart,
  guideEvery,
  gridLineColorMode,
  guideLineColor,
  gridLineColor,
  cellAspectActive,
  cellAspectScale,
  activeCounts,
  rowNumber,
  colNumber,
  serializeCurrentProject,
  writtenKnitMode,
  writtenStartDirection,
  writtenIncludeInPdf
}) {
  const buildExportCanvas = ({ includeLegend = true, includeSymbols = true, includeHeaders = true } = {}) => {
    const baseCell = 18;
    // 종횡비 토글이 켜지면 export에도 실제 코 비율을 반영(가로/세로 셀 크기 분리).
    const cellW = cellAspectActive ? baseCell * cellAspectScale.w : baseCell;
    const cellH = cellAspectActive ? baseCell * cellAspectScale.h : baseCell;
    const header = includeHeaders ? 34 : 0;
    const margin = 18;
    const legendWidth = includeLegend ? 260 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = margin * 2 + header * 2 + cols * cellW + legendWidth;
    canvas.height = margin * 2 + header * 2 + rows * cellH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chartX = margin;
    const chartY = margin;
    const ox = chartX + header;
    const oy = chartY + header;
    const gridRight = ox + cols * cellW;
    const gridBottom = oy + rows * cellH;

    if (includeHeaders) {
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#e9f1f8';
      ctx.strokeStyle = '#b6c4d2';
      ctx.lineWidth = 1;
      ctx.fillRect(chartX, chartY, header, header);
      ctx.strokeRect(chartX, chartY, header, header);
      ctx.fillRect(gridRight, chartY, header, header);
      ctx.strokeRect(gridRight, chartY, header, header);
      ctx.fillRect(chartX, gridBottom, header, header);
      ctx.strokeRect(chartX, gridBottom, header, header);
      ctx.fillRect(gridRight, gridBottom, header, header);
      ctx.strokeRect(gridRight, gridBottom, header, header);

      for (let c = 0; c < cols; c += 1) {
        const x = ox + c * cellW;
        ctx.fillStyle = '#e9f1f8';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.fillRect(x, chartY, cellW, header);
        ctx.strokeRect(x, chartY, cellW, header);
        ctx.fillRect(x, gridBottom, cellW, header);
        ctx.strokeRect(x, gridBottom, cellW, header);
        ctx.fillStyle = '#344054';
        ctx.fillText(colNumber(c), x + cellW / 2, chartY + header / 2);
        ctx.fillText(colNumber(c), x + cellW / 2, gridBottom + header / 2);
      }
      for (let r = 0; r < rows; r += 1) {
        const y = oy + r * cellH;
        ctx.fillStyle = '#e9f1f8';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.fillRect(chartX, y, header, cellH);
        ctx.strokeRect(chartX, y, header, cellH);
        ctx.fillRect(gridRight, y, header, cellH);
        ctx.strokeRect(gridRight, y, header, cellH);
        ctx.fillStyle = '#344054';
        ctx.fillText(rowNumber(r), chartX + header / 2, y + cellH / 2);
        ctx.fillText(rowNumber(r), gridRight + header / 2, y + cellH / 2);
      }
    }

    grid.forEach((row, r) => {
      row.forEach((cellData, c) => {
        const x = ox + c * cellW;
        const y = oy + r * cellH;
        const display = resolveCellDisplay(cellData, palette);
        const shouldShowCell = cellData.active && display.visible;
        ctx.fillStyle = shouldShowCell ? display.color : '#ffffff';
        ctx.fillRect(x, y, cellW, cellH);
        if (includeSymbols && shouldShowCell && display.symbol) {
          ctx.fillStyle = luminance(display.color) < 0.55 ? '#ffffff' : '#111827';
          ctx.font = '8px Arial';
          ctx.fillText(display.symbol, x + cellW / 2, y + cellH / 2);
        }
      });
    });

    ctx.lineCap = 'square';
    for (let c = 0; c <= cols; c += 1) {
      const isGuideLine = c > 0 && c < cols && c % guideEvery === 0;
      if (!isGuideLine && gridLineColorMode === 'none') continue;
      const x = ox + c * cellW;
      ctx.beginPath();
      ctx.strokeStyle = isGuideLine ? guideLineColor : (gridLineColor || '#aeb8c4');
      ctx.lineWidth = isGuideLine ? 2.2 : 0.9;
      ctx.moveTo(x, oy);
      ctx.lineTo(x, gridBottom);
      ctx.stroke();
    }

    for (let r = 0; r <= rows; r += 1) {
      const isGuideLine = r > 0 && r < rows && (rowDirection === 'bottom-up' ? (rows - r) % guideEvery === 0 : r % guideEvery === 0);
      if (!isGuideLine && gridLineColorMode === 'none') continue;
      const y = oy + r * cellH;
      ctx.beginPath();
      ctx.strokeStyle = isGuideLine ? guideLineColor : (gridLineColor || '#aeb8c4');
      ctx.lineWidth = isGuideLine ? 2.2 : 0.9;
      ctx.moveTo(ox, y);
      ctx.lineTo(gridRight, y);
      ctx.stroke();
    }

    if (includeLegend) {
      const lx = gridRight + header + 22;
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px Arial';
      ctx.fillStyle = '#111827';
      ctx.fillText(projectName, lx, oy);
      ctx.font = '12px Arial';
      ctx.fillText(`${cols} x ${rows} cells`, lx, oy + 24);
      ctx.font = 'bold 13px Arial';
      ctx.fillText('Color key', lx, oy + 58);
      palette.filter(isPaletteVisible).forEach((item, index) => {
        const y = oy + 86 + index * 34;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, y - 10, 20, 20);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(lx, y - 10, 20, 20);
        ctx.fillStyle = '#111827';
        ctx.font = '12px Arial';
        ctx.fillText(`${item.code} ${item.name} · ${activeCounts.get(item.id) || 0}칸`, lx + 30, y);
      });
    }

    return canvas;
  };

  const exportPng = () => {
    const canvas = buildExportCanvas({ includeLegend: false, includeSymbols: false, includeHeaders: true });
    const link = document.createElement('a');
    link.download = `${projectName || 'knitgrid'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 현재 상태 + 서술형 옵션으로 줄별 텍스트를 만든다. overrides로 옵션을 임시 변경 가능.
  const buildWrittenPattern = useCallback(
    (overrides = {}) => {
      const params = {
        grid,
        palette,
        rows,
        cols,
        rowDirection,
        numberStart,
        projectName,
        knitMode: writtenKnitMode,
        startDirection: writtenStartDirection,
        ...overrides
      };
      return {
        lines: buildWrittenPatternLines(params),
        text: buildWrittenPatternText(params)
      };
    },
    [cols, grid, numberStart, palette, projectName, rowDirection, rows, writtenKnitMode, writtenStartDirection]
  );

  const downloadWrittenPatternText = useCallback(() => {
    const { text } = buildWrittenPattern();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${projectName || 'knitgrid'}-서술형.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [buildWrittenPattern, projectName]);

  const exportPdf = async () => {
    const canvas = buildExportCanvas();
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);

    // 서술형 도안 포함 옵션: 한글이 깨지는 jsPDF 기본 폰트 대신 canvas 렌더 이미지를 페이지로 덧붙인다.
    if (writtenIncludeInPdf) {
      const { lines } = buildWrittenPattern();
      const modeLabel = writtenKnitMode === 'round' ? '원통뜨기' : '평면뜨기';
      const pages = buildWrittenPatternCanvases(lines, {
        title: `${projectName || '도안'} — 서술형 도안`,
        subtitle: `${cols} x ${rows}칸 · ${modeLabel} · 총 ${lines.length}행`
      });
      pages.forEach((pageCanvas) => {
        const pageW = pageCanvas.width / 2;
        const pageH = pageCanvas.height / 2;
        pdf.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait');
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageW, pageH);
      });
    }

    pdf.save(`${projectName || 'knitgrid'}.pdf`);
  };

  const saveProject = () => {
    const blob = new Blob(
      [
        JSON.stringify(serializeCurrentProject(), null, 2)
      ],
      { type: 'application/json' }
    );
    const link = document.createElement('a');
    link.download = `${projectName || 'knitgrid'}.knitgrid.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return { buildExportCanvas, buildWrittenPattern, downloadWrittenPatternText, exportPng, exportPdf, saveProject };
}
