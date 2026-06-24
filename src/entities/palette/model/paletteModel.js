import { makeCell } from '../../grid/model/gridModel.js';

export const INITIAL_PALETTE = [
  { id: 'h7', code: 'H7', name: '검정', color: '#1d2329', visible: true },
  { id: 'h2', code: 'H2', name: '아이보리', color: '#fbfaf7', visible: true },
  { id: 'e15', code: 'E15', name: '분홍', color: '#ef7897', visible: true },
  { id: 'b4', code: 'B4', name: '하늘', color: '#6fb7dc', visible: true },
  { id: 'g9', code: 'G9', name: '초록', color: '#64a884', visible: true }
];

export const clonePalette = (items) => items.map((item) => ({ ...item }));

export const getPaletteItem = (items, paletteId) => items.find((item) => item.id === paletteId);
export const isPaletteVisible = (item) => item?.visible !== false;

export const normalizePaletteItems = (items) =>
  (items?.length ? items : INITIAL_PALETTE).map((item) => ({
    ...item,
    visible: item.visible !== false
  }));

export const resolveCellDisplay = (cell, items) => {
  const paletteItem = cell.paletteId ? getPaletteItem(items, cell.paletteId) : null;
  return {
    color: paletteItem?.color ?? cell.color,
    symbol: paletteItem?.code ?? cell.symbol,
    label: paletteItem?.name ?? cell.label,
    paletteId: paletteItem?.id ?? cell.paletteId,
    visible: paletteItem ? isPaletteVisible(paletteItem) : true
  };
};

export const syncCellsForPaletteChange = (grid, paletteItem) =>
  grid.map((row) =>
    row.map((cell) =>
      cell.paletteId === paletteItem.id
        ? {
            ...cell,
            color: paletteItem.color,
            symbol: paletteItem.code,
            label: paletteItem.name
          }
        : { ...cell }
    )
  );

export const syncCellsForPaletteMerge = (grid, sourceItem, targetItem) =>
  grid.map((row) =>
    row.map((cell) =>
      cell.paletteId === sourceItem.id
        ? {
            ...cell,
            color: targetItem.color,
            symbol: targetItem.code,
            label: targetItem.name,
            paletteId: targetItem.id
          }
        : { ...cell }
    )
  );

export const clearCellsForPalette = (grid, sourceItem) =>
  grid.map((row) =>
    row.map((cell) => (cell.paletteId === sourceItem.id ? makeCell() : { ...cell }))
  );
