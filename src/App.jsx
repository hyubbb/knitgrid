import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import * as iq from 'image-q';
import { Button, IconButton, FileButton, SegmentedControl, Slider, TextField, NumberField, Select, Toggle, Panel, Toolbar, ToolRail, Modal, StatusBar } from './components/index.js';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckSquare,
  Copy,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Grid3X3,
  Hand,
  ImagePlus,
  Maximize2,
  Minus,
  MousePointer2,
  PaintBucket,
  Palette,
  PenLine,
  Pipette,
  Plus,
  Redo2,
  RotateCcw,
  Rows3,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import './styles.css';

const PRESETS = [
  { label: '16 x 16', cols: 16, rows: 16 },
  { label: '24 x 24', cols: 24, rows: 24 },
  { label: '32 x 32', cols: 32, rows: 32 },
  { label: '48 x 64', cols: 48, rows: 64 },
  { label: '96 x 120', cols: 96, rows: 120 }
];

const INITIAL_PALETTE = [
  { id: 'h7', code: 'H7', name: '검정', color: '#1d2329', visible: true },
  { id: 'h2', code: 'H2', name: '아이보리', color: '#fbfaf7', visible: true },
  { id: 'e15', code: 'E15', name: '분홍', color: '#ef7897', visible: true },
  { id: 'b4', code: 'B4', name: '하늘', color: '#6fb7dc', visible: true },
  { id: 'g9', code: 'G9', name: '초록', color: '#64a884', visible: true }
];

const TOOLS = [
  { id: 'select', label: '선택', icon: MousePointer2 },
  { id: 'pan', label: '이동', icon: Hand },
  { id: 'pen', label: '펜', icon: PenLine },
  { id: 'eraser', label: '지우개', icon: Eraser },
  { id: 'fill', label: '채우기', icon: PaintBucket },
  { id: 'picker', label: '스포이드', icon: Pipette },
  { id: 'mirror', label: '좌우 반전', icon: Maximize2 }
];

const DISPLAY_MODES = [
  { id: 'color-code', label: '색상 + 코드' },
  { id: 'color', label: '색상만' },
  { id: 'code', label: '코드만' }
];

const PROJECT_DB_NAME = 'knitgrid-local';
const PROJECT_DB_VERSION = 1;
const PROJECT_STORE_NAME = 'projects';
const DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM = {
  offsetX: 0,
  offsetY: 0,
  scaleMode: 'uniform',
  scale: 100,
  scaleX: 100,
  scaleY: 100
};

const cloneGrid = (grid) => grid.map((row) => row.map((cell) => ({ ...cell })));
const clonePalette = (items) => items.map((item) => ({ ...item }));

const normalizeHex = (value) => {
  const text = String(value || '').trim().toLowerCase();
  const hex = text.startsWith('#') ? text : `#${text}`;
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
};

const getPaletteItem = (items, paletteId) => items.find((item) => item.id === paletteId);
const isPaletteVisible = (item) => item?.visible !== false;

const normalizePaletteItems = (items) =>
  (items?.length ? items : INITIAL_PALETTE).map((item) => ({
    ...item,
    visible: item.visible !== false
  }));

const openProjectDb = () =>
  new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB를 사용할 수 없습니다.'));
      return;
    }

    const request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        const store = db.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
        store.createIndex('name', 'name');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runProjectStore = async (mode, action) => {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE_NAME, mode);
    const store = tx.objectStore(PROJECT_STORE_NAME);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const listLocalProjects = async () => {
  const items = await runProjectStore('readonly', (store) => store.getAll());
  return [...items].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
};

const saveLocalProject = (project) =>
  runProjectStore('readwrite', (store) => store.put(project));

const loadLocalProject = (id) =>
  runProjectStore('readonly', (store) => store.get(id));

const deleteLocalProject = (id) =>
  runProjectStore('readwrite', (store) => store.delete(id));

const duplicateLocalProject = async (id) => {
  const source = await loadLocalProject(id);
  if (!source) return null;
  const now = new Date().toISOString();
  const copy = {
    ...source,
    id: `kg-${Date.now()}`,
    name: `${source.name || source.projectData?.projectName || '작업'} 복사본`,
    createdAt: now,
    updatedAt: now,
    projectData: {
      ...source.projectData,
      projectName: `${source.projectData?.projectName || source.name || '작업'} 복사본`
    }
  };
  await saveLocalProject(copy);
  return copy;
};

const countPaintedCells = (projectGrid) =>
  projectGrid.reduce((sum, row) => sum + row.filter((cell) => cell.active).length, 0);

const createProjectThumbnail = (projectGrid, projectPalette) => {
  const rows = projectGrid.length;
  const cols = projectGrid[0]?.length ?? 0;
  const sampleRows = Math.min(rows, 24);
  const sampleCols = Math.min(cols, 24);
  const cells = [];

  for (let r = 0; r < sampleRows; r += 1) {
    for (let c = 0; c < sampleCols; c += 1) {
      const sourceRow = Math.floor((r / sampleRows) * rows);
      const sourceCol = Math.floor((c / sampleCols) * cols);
      const cell = projectGrid[sourceRow]?.[sourceCol];
      const display = cell ? resolveCellDisplay(cell, projectPalette) : null;
      const color = cell?.active && display?.visible ? display.color : '#ffffff';
      cells.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="${color}" />`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sampleCols} ${sampleRows}" shape-rendering="crispEdges">${cells.join('')}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const createProjectRecord = (id, data, existing = null) => {
  const now = new Date().toISOString();
  const normalizedPalette = normalizePaletteItems(data.palette);
  const normalizedGrid = data.grid || createGrid(data.rows, data.cols);
  return {
    id,
    name: data.projectName || '이름 없는 작업',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    projectData: {
      version: 2,
      ...data,
      palette: normalizedPalette,
      grid: normalizedGrid
    },
    summary: {
      rows: data.rows,
      cols: data.cols,
      colorCount: normalizedPalette.length,
      paintedCells: countPaintedCells(normalizedGrid)
    },
    thumbnail: createProjectThumbnail(normalizedGrid, normalizedPalette)
  };
};

const formatProjectDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

const resolveCellDisplay = (cell, items) => {
  const paletteItem = cell.paletteId ? getPaletteItem(items, cell.paletteId) : null;
  return {
    color: paletteItem?.color ?? cell.color,
    symbol: paletteItem?.code ?? cell.symbol,
    label: paletteItem?.name ?? cell.label,
    paletteId: paletteItem?.id ?? cell.paletteId,
    visible: paletteItem ? isPaletteVisible(paletteItem) : true
  };
};

const syncCellsForPaletteChange = (grid, paletteItem) =>
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

const syncCellsForPaletteMerge = (grid, sourceItem, targetItem) =>
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

const clearCellsForPalette = (grid, sourceItem) =>
  grid.map((row) =>
    row.map((cell) => (cell.paletteId === sourceItem.id ? makeCell() : { ...cell }))
  );

const makeSnapshot = (grid, palette, activePaletteId, meta = {}) => ({
  grid: cloneGrid(grid),
  palette: clonePalette(palette),
  activePaletteId,
  rows: meta.rows ?? grid.length,
  cols: meta.cols ?? grid[0]?.length ?? 0,
  currentCell: meta.currentCell ? { ...meta.currentCell } : null,
  insertAnchorCell: meta.insertAnchorCell ? { ...meta.insertAnchorCell } : null,
  progressRow: meta.progressRow ?? null,
  completedRows: meta.completedRows ? [...meta.completedRows] : null
});

const makeCell = () => ({
  active: false,
  color: '#ffffff',
  symbol: '',
  label: '',
  note: '',
  paletteId: ''
});

const createGrid = (rows, cols) =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, makeCell));

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));
const clampFiniteNumber = (value, min, max) => {
  const next = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(next) ? next : min));
};

const clampCellToGrid = (cell, nextRows, nextCols) => ({
  row: clampNumber(cell.row, 0, Math.max(0, nextRows - 1)),
  col: clampNumber(cell.col, 0, Math.max(0, nextCols - 1))
});

const hasPaintedCells = (grid) => grid.some((row) => row.some((cell) => cell.active));

const resizeGridKeepingContent = (grid, nextRows, nextCols) =>
  Array.from({ length: nextRows }, (_, rowIndex) =>
    Array.from({ length: nextCols }, (_, colIndex) =>
      grid[rowIndex]?.[colIndex] ? { ...grid[rowIndex][colIndex] } : makeCell()
    )
  );

const moveGridContent = (grid, rowDelta, colDelta) => {
  const nextRows = grid.length;
  const nextCols = grid[0]?.length ?? 0;
  const next = createGrid(nextRows, nextCols);
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell.active) return;
      const targetRow = rowIndex + rowDelta;
      const targetCol = colIndex + colDelta;
      if (targetRow < 0 || targetRow >= nextRows || targetCol < 0 || targetCol >= nextCols) return;
      next[targetRow][targetCol] = { ...cell };
    });
  });
  return next;
};

const insertGridRow = (grid, index) => {
  const cols = grid[0]?.length ?? 0;
  const safeIndex = clampNumber(index, 0, grid.length);
  return [
    ...grid.slice(0, safeIndex).map((row) => row.map((cell) => ({ ...cell }))),
    Array.from({ length: cols }, makeCell),
    ...grid.slice(safeIndex).map((row) => row.map((cell) => ({ ...cell })))
  ];
};

const insertGridCol = (grid, index) => {
  const safeIndex = clampNumber(index, 0, grid[0]?.length ?? 0);
  return grid.map((row) => [
    ...row.slice(0, safeIndex).map((cell) => ({ ...cell })),
    makeCell(),
    ...row.slice(safeIndex).map((cell) => ({ ...cell }))
  ]);
};

const removeGridRow = (grid, index) => {
  const safeIndex = clampNumber(index, 0, grid.length - 1);
  return grid
    .filter((_, rowIndex) => rowIndex !== safeIndex)
    .map((row) => row.map((cell) => ({ ...cell })));
};

const removeGridCol = (grid, index) => {
  const safeIndex = clampNumber(index, 0, (grid[0]?.length ?? 1) - 1);
  return grid.map((row) =>
    row
      .filter((_, colIndex) => colIndex !== safeIndex)
      .map((cell) => ({ ...cell }))
  );
};

const adjustCellAfterRowRemoval = (cell, rowIndex, nextRows) =>
  clampCellToGrid(
    {
      row: cell.row > rowIndex ? cell.row - 1 : cell.row,
      col: cell.col
    },
    nextRows,
    Number.MAX_SAFE_INTEGER
  );

const adjustCellAfterColRemoval = (cell, colIndex, nextCols) =>
  clampCellToGrid(
    {
      row: cell.row,
      col: cell.col > colIndex ? cell.col - 1 : cell.col
    },
    Number.MAX_SAFE_INTEGER,
    nextCols
  );

const seedGrid = (rows = 64, cols = 48) => {
  const grid = createGrid(rows, cols);
  const paint = (r, c, palette) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      grid[r][c] = {
        active: true,
        color: palette.color,
        symbol: palette.code,
        label: palette.name,
        note: '',
        paletteId: palette.id
      };
    }
  };

  const black = INITIAL_PALETTE[0];
  const white = INITIAL_PALETTE[1];
  const pink = INITIAL_PALETTE[2];
  const blue = INITIAL_PALETTE[3];
  const green = INITIAL_PALETTE[4];
  const midR = Math.floor(rows / 2) - 7;
  const midC = Math.floor(cols / 2) - 8;

  for (let r = 0; r < 15; r += 1) {
    for (let c = 0; c < 17; c += 1) {
      const edge = r === 0 || r === 14 || c === 0 || c === 16;
      const stripe = (r + c) % 5 === 0;
      if (edge) paint(midR + r, midC + c, black);
      if (r > 3 && r < 11 && c > 4 && c < 12) paint(midR + r, midC + c, pink);
      if (stripe && r > 1 && r < 13 && c > 1 && c < 15) paint(midR + r, midC + c, blue);
      if ((r === 6 || r === 7 || r === 8) && c > 6 && c < 10) paint(midR + r, midC + c, white);
    }
  }

  for (let r = rows - 16; r < rows - 8; r += 1) {
    for (let c = 6; c < cols - 6; c += 6) {
      paint(r, c, green);
      paint(r + 1, c + 1, green);
      paint(r + 2, c + 2, green);
    }
  }

  return grid;
};

const hexToRgb = (hex) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return [255, 255, 255];
  return normalized.match(/\w\w/g).map((x) => parseInt(x, 16));
};

const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((value) => clampNumber(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const rgbToHsl = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;

  if (max === min) return { hue: 0, saturation: 0, lightness };

  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
  let hue = 0;
  if (max === rn) hue = (gn - bn) / delta + (gn < bn ? 6 : 0);
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;

  return { hue: hue * 60, saturation, lightness };
};

const srgbToLinear = (value) => {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const rgbToLab = (r, g, b) => {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  const x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047;
  const y = (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) / 1.00000;
  const z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883;
  const convert = (value) => (value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116);
  const fx = convert(x);
  const fy = convert(y);
  const fz = convert(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

const getPerceptualColorDistance = (sourceHex, targetHex) => {
  const source = rgbToLab(...hexToRgb(sourceHex));
  const target = rgbToLab(...hexToRgb(targetHex));
  return Math.sqrt(source.reduce((sum, value, index) => sum + (value - target[index]) ** 2, 0));
};

const mapImageColorToPalette = (color, paletteItems) => {
  const candidates = paletteItems.length ? paletteItems : INITIAL_PALETTE;
  let best = candidates[0];
  let bestDistance = Infinity;
  candidates.forEach((item) => {
    const distance = getPerceptualColorDistance(color, item.color);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  });
  return { item: best, distance: bestDistance };
};

const nearestPalette = (hex, palette) => mapImageColorToPalette(hex, palette).item;

const luminance = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const INITIAL_IMAGE_OPTIONS = {
  fit: 'cover',
  alignX: 'center',
  alignY: 'center',
  crop: {
    enabled: false,
    x: 0,
    y: 0,
    width: 1,
    height: 1
  }
};

const normalizeCrop = (crop = INITIAL_IMAGE_OPTIONS.crop) => {
  const width = clampFiniteNumber(crop.width, 0.05, 1);
  const height = clampFiniteNumber(crop.height, 0.05, 1);
  return {
    enabled: crop.enabled === true,
    x: clampFiniteNumber(crop.x, 0, 1 - width),
    y: clampFiniteNumber(crop.y, 0, 1 - height),
    width,
    height
  };
};

const INITIAL_CROP_SELECTION = {
  unit: '%',
  x: 10,
  y: 10,
  width: 80,
  height: 80
};

const normalizePercentCrop = (crop = INITIAL_CROP_SELECTION) => {
  const width = clampFiniteNumber(crop.width, 1, 100);
  const height = clampFiniteNumber(crop.height, 1, 100);
  return {
    unit: '%',
    x: clampFiniteNumber(crop.x, 0, 100 - width),
    y: clampFiniteNumber(crop.y, 0, 100 - height),
    width,
    height
  };
};

const convertPercentCropToImageCrop = (crop) => {
  const normalized = normalizePercentCrop(crop);
  return normalizeCrop({
    enabled: true,
    x: normalized.x / 100,
    y: normalized.y / 100,
    width: normalized.width / 100,
    height: normalized.height / 100
  });
};

const IMAGE_PALETTE_MODES = [
  {
    id: 'extract',
    label: '이미지 색상 자동 추출',
    description: '원본에서 주요 색상을 뽑아 팔레트와 코드로 만듭니다.'
  },
  {
    id: 'match',
    label: '현재 팔레트에 맞춤',
    description: '이미 만든 팔레트 안에서 가장 가까운 색으로 변환합니다.'
  }
];

const IMAGE_SAMPLE_SCALE = 4;
const IMAGE_EXTRACT_COLOR_LIMIT = 6;
const IMAGE_COLOR_WARNING_DISTANCE = 24;
const IMAGE_CANDIDATE_CONFIGS = [
  {
    id: 'crisp',
    label: '선명',
    tag: '윤곽 우선',
    colors: 6,
    colorDistanceFormula: 'cie94-textiles',
    paletteQuantization: 'wuquant',
    imageQuantization: 'nearest',
    sampleOffset: 0,
    artifactFilter: true
  },
  {
    id: 'soft',
    label: '부드러움',
    tag: '노이즈 완화',
    colors: 5,
    colorDistanceFormula: 'euclidean-bt709-noalpha',
    paletteQuantization: 'rgbquant',
    imageQuantization: 'nearest',
    sampleOffset: 1,
    artifactFilter: true
  },
  {
    id: 'dither',
    label: '디더링',
    tag: '그라데이션 보존',
    colors: 6,
    colorDistanceFormula: 'cie94-textiles',
    paletteQuantization: 'wuquant',
    imageQuantization: 'floyd-steinberg',
    sampleOffset: 2,
    artifactFilter: false
  },
  {
    id: 'simple',
    label: '단순화',
    tag: '색상 적게',
    colors: 3,
    colorDistanceFormula: 'pngquant',
    paletteQuantization: 'wuquant',
    imageQuantization: 'nearest',
    sampleOffset: 3,
    artifactFilter: true
  }
];

const getImageColorName = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  const { hue, saturation, lightness } = rgbToHsl(r, g, b);
  if (saturation < 0.12) {
    if (lightness > 0.88) return '아이보리';
    if (lightness < 0.22) return '검정';
    return '회색';
  }
  if (hue < 18 || hue >= 342) return '빨강';
  if (hue < 48) return '주황';
  if (hue < 70) return '노랑';
  if (hue < 170) return '초록';
  if (hue < 250) return '파랑';
  if (hue < 300) return '보라';
  return '분홍';
};

const shouldIgnoreImageArtifactPixel = ({ r, g, b, a }) => {
  if (a < 32) return true;
  const brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max ? (max - min) / max : 0;
  if (brightness < 0.34) return true;
  if (saturation < 0.1 && brightness > 0.34 && brightness < 0.86) return true;
  return false;
};

const getColorBucketKey = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  const { hue, saturation, lightness } = rgbToHsl(r, g, b);
  if (saturation < 0.12) {
    if (lightness > 0.86) return 'neutral-light';
    if (lightness < 0.24) return 'neutral-dark';
    return `neutral-${Math.round(lightness * 5)}`;
  }
  return [
    Math.round(hue / 16),
    Math.round(saturation * 4),
    Math.round(lightness * 5)
  ].join(':');
};

const extractDominantImageColors = (samples, options = {}) => {
  const limit = options.limit ?? IMAGE_EXTRACT_COLOR_LIMIT;
  const buckets = new Map();

  samples.forEach((sample) => {
    if (!sample?.hex) return;
    const key = getColorBucketKey(sample.hex);
    const current = buckets.get(key) || {
      count: 0,
      r: 0,
      g: 0,
      b: 0
    };
    const weight = sample.weight || 1;
    const [r, g, b] = hexToRgb(sample.hex);
    current.count += weight;
    current.r += r * weight;
    current.g += g * weight;
    current.b += b * weight;
    buckets.set(key, current);
  });

  return [...buckets.values()]
    .filter((bucket) => bucket.count > 0)
    .map((bucket) => ({
      hex: rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
      count: bucket.count
    }))
    .sort((a, b) => b.count - a.count)
    .reduce((items, color) => {
      const duplicate = items.some((item) => getPerceptualColorDistance(item.hex, color.hex) < 9);
      return duplicate || items.length >= limit ? items : [...items, color];
    }, []);
};

const createPaletteFromImageColors = (colors) => {
  const sourceColors = colors.length
    ? colors
    : [{ hex: '#fbfaf7', count: 1 }];

  return sourceColors.map((color, index) => ({
    id: `img-${index + 1}-${color.hex.replace('#', '')}`,
    code: `IMG${index + 1}`,
    name: getImageColorName(color.hex),
    color: color.hex,
    visible: true
  }));
};

const getMappablePalette = (paletteItems) => {
  const visibleItems = paletteItems.filter(isPaletteVisible);
  return visibleItems.length ? visibleItems : paletteItems;
};

const getCellSampleColor = (pixels, canvasWidth, row, col, options = {}) => {
  const sampleOffset = options.sampleOffset || 0;
  const xStart = col * IMAGE_SAMPLE_SCALE;
  const yStart = row * IMAGE_SAMPLE_SCALE;
  const inset = IMAGE_SAMPLE_SCALE > 2 ? 1 : 0;
  const offsetX = sampleOffset % 2;
  const offsetY = Math.floor(sampleOffset / 2) % 2;
  const preferred = [];
  const fallback = [];

  for (let y = yStart + inset + offsetY; y < yStart + IMAGE_SAMPLE_SCALE - inset; y += 1) {
    for (let x = xStart + inset + offsetX; x < xStart + IMAGE_SAMPLE_SCALE - inset; x += 1) {
      const index = (y * canvasWidth + x) * 4;
      const pixel = {
        r: pixels[index],
        g: pixels[index + 1],
        b: pixels[index + 2],
        a: pixels[index + 3]
      };
      if (pixel.a < 32) continue;
      fallback.push(pixel);
      if (!options.artifactFilter || !shouldIgnoreImageArtifactPixel(pixel)) preferred.push(pixel);
    }
  }

  const selected = preferred.length ? preferred : fallback;
  if (!selected.length) return null;
  const total = selected.reduce(
    (sum, pixel) => ({
      r: sum.r + pixel.r,
      g: sum.g + pixel.g,
      b: sum.b + pixel.b
    }),
    { r: 0, g: 0, b: 0 }
  );
  return rgbToHex(total.r / selected.length, total.g / selected.length, total.b / selected.length);
};

const drawImageToAnalysisCanvas = ({ image, rows, cols, imageOptions }) => {
  const canvas = document.createElement('canvas');
  canvas.width = cols * IMAGE_SAMPLE_SCALE;
  canvas.height = rows * IMAGE_SAMPLE_SCALE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const crop = normalizeCrop(imageOptions.crop);
  const source = crop.enabled
    ? {
        x: crop.x * image.naturalWidth,
        y: crop.y * image.naturalHeight,
        width: crop.width * image.naturalWidth,
        height: crop.height * image.naturalHeight
      }
    : {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight
      };
  const placement = getImagePlacement({
    imageWidth: source.width,
    imageHeight: source.height,
    targetWidth: canvas.width,
    targetHeight: canvas.height,
    ...imageOptions
  });
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    placement.dx,
    placement.dy,
    placement.width,
    placement.height
  );
  return {
    canvas,
    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
  };
};

const pointContainerToCellColors = ({ pointContainer, rows, cols, config }) => {
  const pixels = pointContainer.toUint8Array();
  const width = pointContainer.getWidth();
  const colors = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      colors.push(getCellSampleColor(pixels, width, r, c, config));
    }
  }
  return colors;
};

const buildPaletteFromCellColors = (cellColors, config) =>
  extractDominantImageColors(
    cellColors.filter(Boolean).map((hex) => ({ hex, weight: 1 })),
    { limit: config.colors || IMAGE_EXTRACT_COLOR_LIMIT }
  );

const buildGridFromCellColors = ({ cellColors, rows, cols, paletteItems, note }) => {
  const nextGrid = createGrid(rows, cols);
  cellColors.forEach((hex, index) => {
    if (!hex) return;
    const match = mapImageColorToPalette(hex, paletteItems);
    const item = match.item;
    const row = Math.floor(index / cols);
    const col = index % cols;
    nextGrid[row][col] = {
      active: true,
      color: item.color,
      symbol: item.code,
      label: item.name,
      note,
      paletteId: item.id
    };
  });
  return nextGrid;
};

const scoreImageCandidate = ({ cellColors, paletteItems, colorWarnings }) => {
  const activeCount = cellColors.filter(Boolean).length;
  const usedKeys = new Set(cellColors.filter(Boolean).map(getColorBucketKey));
  const warningPenalty = colorWarnings.reduce((sum, warning) => sum + warning.count, 0);
  const palettePenalty = Math.max(0, paletteItems.length - 6) * 12;
  return Math.max(1, Math.round(100 - warningPenalty / Math.max(1, activeCount) * 100 - palettePenalty + usedKeys.size * 2));
};

const createPreviewSignature = (grid) =>
  grid
    .flat()
    .filter((cell) => cell.active)
    .slice(0, 160)
    .map((cell) => cell.paletteId || cell.color)
    .join('|');

const summarizeColorWarnings = (cellColors, targetPalette) => {
  const buckets = new Map();
  cellColors.forEach((color) => {
    if (!color) return;
    const match = mapImageColorToPalette(color, targetPalette);
    if (match.distance < IMAGE_COLOR_WARNING_DISTANCE) return;
    const key = `${getColorBucketKey(color)}:${match.item.id}`;
    const current = buckets.get(key) || {
      sourceHex: color,
      targetHex: match.item.color,
      targetCode: match.item.code,
      distance: match.distance,
      count: 0
    };
    current.count += 1;
    if (match.distance > current.distance) {
      current.sourceHex = color;
      current.distance = match.distance;
    }
    buckets.set(key, current);
  });

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
};

const buildImageCandidateWithImageQ = ({ imageData, rows, cols, basePalette, paletteMode, config, seed }) => {
  const source = iq.utils.PointContainer.fromImageData(imageData);
  let quantized = source;

  try {
    const quantizedPalette = iq.buildPaletteSync([source], {
      colorDistanceFormula: config.colorDistanceFormula,
      paletteQuantization: config.paletteQuantization,
      colors: config.colors
    });
    quantized = iq.applyPaletteSync(source, quantizedPalette, {
      colorDistanceFormula: config.colorDistanceFormula,
      imageQuantization: config.imageQuantization
    });
  } catch {
    quantized = source;
  }

  const cellColors = pointContainerToCellColors({
    pointContainer: quantized,
    rows,
    cols,
    config: {
      ...config,
      sampleOffset: (config.sampleOffset + seed) % 4
    }
  });
  const extractedColors = buildPaletteFromCellColors(cellColors, config);
  const conversionPalette = paletteMode === 'extract'
    ? createPaletteFromImageColors(extractedColors)
    : basePalette;
  const targetPalette = paletteMode === 'extract'
    ? conversionPalette
    : getMappablePalette(basePalette);
  const colorWarnings = paletteMode === 'match'
    ? summarizeColorWarnings(cellColors, targetPalette)
    : [];
  const nextGrid = buildGridFromCellColors({
    cellColors,
    rows,
    cols,
    paletteItems: targetPalette,
    note: `${config.label} 이미지 변환 초안`
  });

  return {
    id: `${config.id}-${seed}`,
    label: config.label,
    tag: config.tag,
    grid: nextGrid,
    palette: conversionPalette,
    extractedColors,
    colorWarnings,
    score: scoreImageCandidate({ cellColors, paletteItems: conversionPalette, colorWarnings }),
    signature: createPreviewSignature(nextGrid)
  };
};

const buildConvertedImageGrid = ({ image, rows, cols, basePalette, paletteMode, imageOptions }) => {
  const { imageData } = drawImageToAnalysisCanvas({ image, rows, cols, imageOptions });
  return buildImageCandidateWithImageQ({
    imageData,
    rows,
    cols,
    basePalette,
    paletteMode,
    config: IMAGE_CANDIDATE_CONFIGS[0],
    seed: 0
  });
};

const buildImageConversionCandidates = async ({ image, rows, cols, basePalette, paletteMode, imageOptions, seed }) => {
  const { imageData } = drawImageToAnalysisCanvas({ image, rows, cols, imageOptions });
  const candidates = [];
  for (const config of IMAGE_CANDIDATE_CONFIGS) {
    candidates.push(buildImageCandidateWithImageQ({
      imageData,
      rows,
      cols,
      basePalette,
      paletteMode,
      config,
      seed
    }));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  return candidates;
};

const FIT_OPTIONS = [
  { id: 'cover', label: '채우기', description: '격자를 꽉 채우고 넘치는 부분은 잘립니다.' },
  { id: 'contain', label: '맞춰 넣기', description: '이미지 전체를 보존하고 남는 칸은 여백이 됩니다.' },
  { id: 'stretch', label: '늘려 맞춤', description: '잘림은 없지만 원본 비율이 왜곡될 수 있습니다.' }
];

const HORIZONTAL_ALIGNMENTS = [
  { id: 'left', label: '좌측' },
  { id: 'center', label: '중앙' },
  { id: 'right', label: '우측' }
];

const VERTICAL_ALIGNMENTS = [
  { id: 'top', label: '상단' },
  { id: 'center', label: '중앙' },
  { id: 'bottom', label: '하단' }
];

const getImagePlacement = ({ imageWidth, imageHeight, targetWidth, targetHeight, fit, alignX, alignY }) => {
  if (fit === 'stretch') {
    return { dx: 0, dy: 0, width: targetWidth, height: targetHeight, scaleX: targetWidth / imageWidth, scaleY: targetHeight / imageHeight };
  }

  const scale = fit === 'contain'
    ? Math.min(targetWidth / imageWidth, targetHeight / imageHeight)
    : Math.max(targetWidth / imageWidth, targetHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const freeX = targetWidth - width;
  const freeY = targetHeight - height;
  const dx = alignX === 'left' ? 0 : alignX === 'right' ? freeX : freeX / 2;
  const dy = alignY === 'top' ? 0 : alignY === 'bottom' ? freeY : freeY / 2;

  return { dx, dy, width, height, scaleX: scale, scaleY: scale };
};

export function App() {
  const [rows, setRows] = useState(64);
  const [cols, setCols] = useState(48);
  const [draftRows, setDraftRows] = useState(64);
  const [draftCols, setDraftCols] = useState(48);
  const [grid, setGrid] = useState(() => seedGrid());
  const [palette, setPalette] = useState(INITIAL_PALETTE);
  const [activePaletteId, setActivePaletteId] = useState('h7');
  const [tool, setTool] = useState('pen');
  const [mode, setMode] = useState('edit');
  const [displayMode, setDisplayMode] = useState('color-code');
  const [zoom, setZoom] = useState(86);
  const [guideEvery, setGuideEvery] = useState(10);
  const [guideColorMode, setGuideColorMode] = useState('black');
  const [guideCustomColor, setGuideCustomColor] = useState('#111827');
  const [numberStart, setNumberStart] = useState(1);
  const [rowDirection, setRowDirection] = useState('bottom-up');
  const [showOppositeHeaders, setShowOppositeHeaders] = useState(true);
  const [currentCell, setCurrentCell] = useState({ row: 23, col: 17 });
  const [insertAnchorCell, setInsertAnchorCell] = useState({ row: 23, col: 17 });
  const [progressRow, setProgressRow] = useState(17);
  const [completedRows, setCompletedRows] = useState(() => new Set([1, 2, 3, 4, 5]));
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [projectName, setProjectName] = useState('코지 파우치 패턴');
  const [cropDraft, setCropDraft] = useState(null);
  const [imageDraft, setImageDraft] = useState(null);
  const [imageOptions, setImageOptions] = useState(INITIAL_IMAGE_OPTIONS);
  const [imagePaletteMode, setImagePaletteMode] = useState('extract');
  const [imageCandidates, setImageCandidates] = useState([]);
  const [selectedImageCandidateId, setSelectedImageCandidateId] = useState('');
  const [imageCandidateSeed, setImageCandidateSeed] = useState(0);
  const [imageCandidateLoading, setImageCandidateLoading] = useState(false);
  const [showOriginalOverlay, setShowOriginalOverlay] = useState(false);
  const [originalOverlayOpacity, setOriginalOverlayOpacity] = useState(46);
  const [appliedSourceImage, setAppliedSourceImage] = useState(null);
  const [showAppliedSourceOverlay, setShowAppliedSourceOverlay] = useState(false);
  const [appliedSourceOverlayOpacity, setAppliedSourceOverlayOpacity] = useState(45);
  const [isAdjustingAppliedSourceOverlay, setIsAdjustingAppliedSourceOverlay] = useState(false);
  const [appliedSourceOverlayMoveStep, setAppliedSourceOverlayMoveStep] = useState(1);
  const [appliedSourceOverlayTransform, setAppliedSourceOverlayTransform] = useState(DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM);
  const [expandedPaletteId, setExpandedPaletteId] = useState('');
  const [paletteNotice, setPaletteNotice] = useState('');
  const [pendingResize, setPendingResize] = useState(null);
  const [moveSteps, setMoveSteps] = useState(1);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [currentLocalProjectId, setCurrentLocalProjectId] = useState('');
  const [localProjects, setLocalProjects] = useState([]);
  const [localProjectsOpen, setLocalProjectsOpen] = useState(false);
  const [localSaveState, setLocalSaveState] = useState('unsaved');
  const [localSaveMessage, setLocalSaveMessage] = useState('');
  const [pendingNewProject, setPendingNewProject] = useState(false);
  const fileInputRef = useRef(null);
  const projectInputRef = useRef(null);
  const gridScrollRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const lastSavedSignatureRef = useRef('');
  const appliedSourceDragRef = useRef(null);

  const activePalette = useMemo(
    () => palette.find((item) => item.id === activePaletteId) ?? palette[0],
    [activePaletteId, palette]
  );

  const activeCounts = useMemo(() => {
    const counts = new Map();
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.active) {
          counts.set(cell.paletteId || cell.symbol, (counts.get(cell.paletteId || cell.symbol) || 0) + 1);
        }
      });
    });
    return counts;
  }, [grid]);

  const imageWarnings = useMemo(() => {
    if (!imageDraft) return [];
    const warnings = [];
    const imageRatio = imageDraft.width / imageDraft.height;
    const gridRatio = cols / rows;
    const ratioDelta = Math.abs(imageRatio - gridRatio) / gridRatio;
    const placement = getImagePlacement({
      imageWidth: imageDraft.width,
      imageHeight: imageDraft.height,
      targetWidth: cols,
      targetHeight: rows,
      ...imageOptions
    });
    const croppedX = Math.max(0, placement.width - cols);
    const croppedY = Math.max(0, placement.height - rows);

    if (imageDraft.width > cols * 4 || imageDraft.height > rows * 4) {
      warnings.push(`원본 ${imageDraft.width} x ${imageDraft.height}px을 ${cols} x ${rows}칸으로 줄입니다. 세부 묘사가 많이 뭉개질 수 있습니다.`);
    }

    if (ratioDelta > 0.12 && imageOptions.fit === 'cover') {
      warnings.push('이미지 비율과 격자 비율 차이가 커서 일부 영역이 잘립니다. 상단/중앙/하단 정렬을 확인하세요.');
    }

    if ((croppedX > 0.5 || croppedY > 0.5) && imageOptions.fit === 'cover') {
      const vertical = croppedY > 0.5 ? `${Math.round(croppedY)}칸 높이` : '';
      const horizontal = croppedX > 0.5 ? `${Math.round(croppedX)}칸 너비` : '';
      warnings.push(`현재 채우기 설정에서는 ${[horizontal, vertical].filter(Boolean).join(', ')} 정도가 격자 밖으로 넘어갑니다.`);
    }

    if (imageOptions.fit === 'stretch' && ratioDelta > 0.08) {
      warnings.push('늘려 맞춤은 잘림은 없지만 원본 형태가 가로/세로로 왜곡될 수 있습니다.');
    }

    if (imageOptions.fit === 'contain') {
      warnings.push('맞춰 넣기는 원본 전체를 보존하지만 남는 칸은 빈 배경으로 변환됩니다.');
    }

    return warnings;
  }, [cols, imageDraft, imageOptions, rows]);

  const imagePreviewCounts = useMemo(() => {
    const counts = new Map();
    const selectedCandidate = imageCandidates.find((candidate) => candidate.id === selectedImageCandidateId) ?? imageCandidates[0];
    selectedCandidate?.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.active) counts.set(cell.paletteId, (counts.get(cell.paletteId) || 0) + 1);
      });
    });
    return counts;
  }, [imageCandidates, selectedImageCandidateId]);

  const selectedImageCandidate = useMemo(
    () => imageCandidates.find((candidate) => candidate.id === selectedImageCandidateId) ?? imageCandidates[0] ?? null,
    [imageCandidates, selectedImageCandidateId]
  );

  const updateCropDraftSelection = useCallback((percentCrop) => {
    setCropDraft((previous) => {
      if (!previous) return previous;
      const cropSelection = normalizePercentCrop(percentCrop);
      return {
        ...previous,
        cropSelection,
        cropArea: convertPercentCropToImageCrop(cropSelection)
      };
    });
  }, []);

  const completeCropDraftSelection = useCallback((percentCrop) => {
    setCropDraft((previous) => {
      if (!previous) return previous;
      const cropSelection = normalizePercentCrop(percentCrop);
      return {
        ...previous,
        cropSelection,
        cropArea: convertPercentCropToImageCrop(cropSelection)
      };
    });
  }, []);

  const resetCropDraft = useCallback(() => {
    setCropDraft((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        cropSelection: INITIAL_CROP_SELECTION,
        cropArea: convertPercentCropToImageCrop(INITIAL_CROP_SELECTION)
      };
    });
  }, []);

  const appliedSourceSizeChanged = Boolean(
    appliedSourceImage && (appliedSourceImage.rows !== rows || appliedSourceImage.cols !== cols)
  );
  const appliedSourceTransformCss = appliedSourceOverlayTransform.scaleMode === 'free'
    ? `translate(calc(${appliedSourceOverlayTransform.offsetX} * var(--cell)), calc(${appliedSourceOverlayTransform.offsetY} * var(--cell))) scale(${appliedSourceOverlayTransform.scaleX / 100}, ${appliedSourceOverlayTransform.scaleY / 100})`
    : `translate(calc(${appliedSourceOverlayTransform.offsetX} * var(--cell)), calc(${appliedSourceOverlayTransform.offsetY} * var(--cell))) scale(${appliedSourceOverlayTransform.scale / 100})`;
  const guideLineColor = guideColorMode === 'white'
    ? '#ffffff'
    : guideColorMode === 'custom'
      ? normalizeHex(guideCustomColor) ?? '#111827'
      : '#111827';

  useEffect(() => {
    const scrollNode = gridScrollRef.current;
    if (!scrollNode) return undefined;

    const frame = requestAnimationFrame(() => {
      scrollNode.scrollLeft = Math.max(0, (scrollNode.scrollWidth - scrollNode.clientWidth) / 2);
      scrollNode.scrollTop = Math.max(0, (scrollNode.scrollHeight - scrollNode.clientHeight) / 2);
    });

    return () => cancelAnimationFrame(frame);
  }, [rows, cols, zoom, showOppositeHeaders, isInspectorCollapsed]);

  const resetAppliedSourceOverlayTransform = useCallback(() => {
    setAppliedSourceOverlayTransform(DEFAULT_APPLIED_SOURCE_OVERLAY_TRANSFORM);
    setAppliedSourceOverlayMoveStep(1);
  }, []);

  const updateAppliedSourceOverlayTransform = useCallback((patch) => {
    setAppliedSourceOverlayTransform((previous) => {
      const next = { ...previous, ...patch };
      return {
        offsetX: clampFiniteNumber(next.offsetX, -200, 200),
        offsetY: clampFiniteNumber(next.offsetY, -200, 200),
        scaleMode: next.scaleMode === 'free' ? 'free' : 'uniform',
        scale: clampFiniteNumber(next.scale, 50, 250),
        scaleX: clampFiniteNumber(next.scaleX, 50, 250),
        scaleY: clampFiniteNumber(next.scaleY, 50, 250)
      };
    });
  }, []);

  const moveAppliedSourceOverlay = useCallback((colDelta, rowDelta) => {
    const step = clampFiniteNumber(appliedSourceOverlayMoveStep, 0.1, 200);
    setAppliedSourceOverlayMoveStep(step);
    setAppliedSourceOverlayTransform((previous) => ({
      ...previous,
      offsetX: clampFiniteNumber(previous.offsetX + colDelta * step, -200, 200),
      offsetY: clampFiniteNumber(previous.offsetY + rowDelta * step, -200, 200)
    }));
  }, [appliedSourceOverlayMoveStep]);

  const handleAppliedSourceOverlayPointerDown = (event) => {
    if (!isAdjustingAppliedSourceOverlay) return;
    event.preventDefault();
    event.stopPropagation();
    const cellSize = parseFloat(getComputedStyle(event.currentTarget).getPropertyValue('--cell')) || 24;
    appliedSourceDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: appliedSourceOverlayTransform.offsetX,
      offsetY: appliedSourceOverlayTransform.offsetY,
      cellSize
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAppliedSourceOverlayPointerMove = (event) => {
    const drag = appliedSourceDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    setAppliedSourceOverlayTransform((previous) => ({
      ...previous,
      offsetX: clampFiniteNumber(drag.offsetX + (event.clientX - drag.startX) / drag.cellSize, -200, 200),
      offsetY: clampFiniteNumber(drag.offsetY + (event.clientY - drag.startY) / drag.cellSize, -200, 200)
    }));
  };

  const handleAppliedSourceOverlayPointerUp = (event) => {
    const drag = appliedSourceDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    appliedSourceDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const clearAppliedSourceImage = useCallback(() => {
    setAppliedSourceImage((previous) => {
      if (previous?.src) URL.revokeObjectURL(previous.src);
      return null;
    });
    setShowAppliedSourceOverlay(false);
    setAppliedSourceOverlayOpacity(45);
    setIsAdjustingAppliedSourceOverlay(false);
    resetAppliedSourceOverlayTransform();
  }, [resetAppliedSourceOverlayTransform]);

  const replaceAppliedSourceImageFromDraft = useCallback((draft, options, nextRows, nextCols) => {
    if (!draft?.src) return;
    setAppliedSourceImage((previous) => {
      if (previous?.src && previous.src !== draft.src) URL.revokeObjectURL(previous.src);
      return {
        src: draft.src,
        name: draft.name,
        width: draft.width,
        height: draft.height,
        imageOptions: { ...options },
        rows: nextRows,
        cols: nextCols
      };
    });
    setShowAppliedSourceOverlay(false);
    setAppliedSourceOverlayOpacity(45);
    setIsAdjustingAppliedSourceOverlay(false);
    resetAppliedSourceOverlayTransform();
  }, [resetAppliedSourceOverlayTransform]);

  const serializeCurrentProject = useCallback(() => ({
    version: 2,
    projectName,
    rows,
    cols,
    palette,
    grid,
    activePaletteId,
    displayMode,
    guideColorMode,
    guideCustomColor,
    rowDirection,
    numberStart
  }), [activePaletteId, cols, displayMode, grid, guideColorMode, guideCustomColor, numberStart, palette, projectName, rowDirection, rows]);

  const applyProjectData = useCallback((data, options = {}) => {
    const loadedPalette = normalizePaletteItems(data.palette);
    const nextRows = data.rows || 64;
    const nextCols = data.cols || 48;
    const loadedGrid = data.grid || createGrid(nextRows, nextCols);
    const loadedActivePaletteId = data.activePaletteId && getPaletteItem(loadedPalette, data.activePaletteId)
      ? data.activePaletteId
      : loadedPalette[0]?.id;

    setProjectName(data.projectName || '불러온 도안');
    setRows(nextRows);
    setCols(nextCols);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setPalette(loadedPalette);
    setGrid(loadedGrid.map((row) => row.map((cell) => {
      const display = resolveCellDisplay(cell, loadedPalette);
      return cell.paletteId && getPaletteItem(loadedPalette, cell.paletteId)
        ? { ...cell, color: display.color, symbol: display.symbol, label: display.label }
        : cell;
    })));
    setActivePaletteId(loadedActivePaletteId);
    setExpandedPaletteId('');
    setDisplayMode(data.displayMode || 'color-code');
    setGuideColorMode(data.guideColorMode || 'black');
    setGuideCustomColor(normalizeHex(data.guideCustomColor) || '#111827');
    setRowDirection(data.rowDirection || 'bottom-up');
    setNumberStart(data.numberStart || 1);
    setCurrentCell((cell) => clampCellToGrid(cell, nextRows, nextCols));
    setInsertAnchorCell((cell) => clampCellToGrid(cell, nextRows, nextCols));
    setProgressRow(data.numberStart || 1);
    setCompletedRows(new Set());
    setHistory([]);
    setFuture([]);
    setPaletteNotice('');
    clearAppliedSourceImage();
    setCurrentLocalProjectId(options.localId || '');
    setLocalSaveState(options.localId ? 'saved' : 'unsaved');
    setLocalSaveMessage(options.localId ? '저장됨' : '로컬에 저장되지 않음');
    lastSavedSignatureRef.current = options.localId ? JSON.stringify({ version: 2, ...data }) : '';
  }, [clearAppliedSourceImage]);

  const refreshLocalProjects = useCallback(async () => {
    try {
      setLocalProjects(await listLocalProjects());
    } catch (error) {
      setLocalSaveState('error');
      setLocalSaveMessage(error.message || '로컬 작업 목록을 불러오지 못했습니다.');
    }
  }, []);

  const saveCurrentLocalProject = useCallback(async () => {
    try {
      setLocalSaveState('saving');
      setLocalSaveMessage('저장 중');
      const data = serializeCurrentProject();
      const id = currentLocalProjectId || `kg-${Date.now()}`;
      const existing = currentLocalProjectId ? await loadLocalProject(currentLocalProjectId) : null;
      const record = createProjectRecord(id, data, existing);
      await saveLocalProject(record);
      lastSavedSignatureRef.current = JSON.stringify(record.projectData);
      setCurrentLocalProjectId(id);
      setLocalSaveState('saved');
      setLocalSaveMessage('저장됨');
      await refreshLocalProjects();
      return record;
    } catch (error) {
      setLocalSaveState('error');
      setLocalSaveMessage(error.message || '저장 실패');
      return null;
    }
  }, [currentLocalProjectId, refreshLocalProjects, serializeCurrentProject]);

  const resetToNewProject = useCallback(() => {
    const nextRows = 64;
    const nextCols = 48;
    setProjectName('새 도안');
    setRows(nextRows);
    setCols(nextCols);
    setDraftRows(nextRows);
    setDraftCols(nextCols);
    setPalette(normalizePaletteItems(INITIAL_PALETTE));
    setGrid(createGrid(nextRows, nextCols));
    setActivePaletteId('h7');
    setExpandedPaletteId('');
    setDisplayMode('color-code');
    setRowDirection('bottom-up');
    setNumberStart(1);
    setCurrentCell({ row: 23, col: 17 });
    setInsertAnchorCell({ row: 23, col: 17 });
    setProgressRow(17);
    setCompletedRows(new Set());
    setHistory([]);
    setFuture([]);
    setPaletteNotice('');
    setCurrentLocalProjectId('');
    setLocalSaveState('unsaved');
    setLocalSaveMessage('새 작업');
    lastSavedSignatureRef.current = '';
    clearAppliedSourceImage();
    setPendingNewProject(false);
  }, [clearAppliedSourceImage]);

  useEffect(() => {
    refreshLocalProjects();
  }, [refreshLocalProjects]);

  useEffect(() => {
    if (!currentLocalProjectId || imageDraft || imageCandidateLoading) return undefined;
    const currentSignature = JSON.stringify(serializeCurrentProject());
    if (lastSavedSignatureRef.current === currentSignature) {
      setLocalSaveState('saved');
      setLocalSaveMessage('저장됨');
      return undefined;
    }
    setLocalSaveState('dirty');
    setLocalSaveMessage('미저장 변경사항');
    window.clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      saveCurrentLocalProject();
    }, 900);
    return () => window.clearTimeout(autoSaveTimerRef.current);
  }, [currentLocalProjectId, imageCandidateLoading, imageDraft, saveCurrentLocalProject, serializeCurrentProject]);

  useEffect(() => () => {
    window.clearTimeout(autoSaveTimerRef.current);
  }, []);

  useEffect(() => {
    if (!imageDraft) {
      setImageCandidates([]);
      setSelectedImageCandidateId('');
      setImageCandidateLoading(false);
      return undefined;
    }

    let cancelled = false;
    setImageCandidateLoading(true);
    const image = new Image();
    image.onload = async () => {
      const candidates = await buildImageConversionCandidates({
        image,
        rows,
        cols,
        basePalette: palette,
        paletteMode: imagePaletteMode,
        imageOptions,
        seed: imageCandidateSeed
      });
      if (!cancelled) {
        setImageCandidates(candidates);
        setSelectedImageCandidateId(candidates[0]?.id ?? '');
        setImageCandidateLoading(false);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setImageCandidates([]);
        setSelectedImageCandidateId('');
        setImageCandidateLoading(false);
      }
    };
    image.src = imageDraft.src;

    return () => {
      cancelled = true;
    };
  }, [cols, imageCandidateSeed, imageDraft, imageOptions, imagePaletteMode, palette, rows]);

  const paintedCellCount = useMemo(
    () => grid.reduce((sum, row) => sum + row.filter((cell) => cell.active).length, 0),
    [grid]
  );

  const hasCurrentWork = Boolean(paintedCellCount || history.length || currentLocalProjectId || localSaveState === 'dirty');
  const localSaveStatusLabel = localSaveState === 'saving'
    ? '저장 중'
    : localSaveState === 'saved'
      ? '저장됨'
      : localSaveState === 'dirty'
        ? '미저장'
        : localSaveState === 'error'
          ? '저장 오류'
          : '로컬 미저장';

  const openLocalProjectsModal = () => {
    refreshLocalProjects();
    setLocalProjectsOpen(true);
  };

  const requestNewProject = () => {
    if (hasCurrentWork) setPendingNewProject(true);
    else resetToNewProject();
  };

  const saveAndStartNewProject = async () => {
    const record = await saveCurrentLocalProject();
    if (record) resetToNewProject();
  };

  const openLocalProject = async (id) => {
    const record = await loadLocalProject(id);
    if (!record?.projectData) return;
    applyProjectData(record.projectData, { localId: record.id });
    setLocalProjectsOpen(false);
  };

  const duplicateProject = async (id) => {
    await duplicateLocalProject(id);
    await refreshLocalProjects();
  };

  const removeLocalProject = async (id) => {
    await deleteLocalProject(id);
    if (currentLocalProjectId === id) {
      setCurrentLocalProjectId('');
      setLocalSaveState('unsaved');
      setLocalSaveMessage('로컬에서 삭제됨');
    }
    await refreshLocalProjects();
  };

  const renameLocalProject = async (project) => {
    const nextName = window.prompt('작업 이름', project.name || project.projectData?.projectName || '');
    if (!nextName?.trim()) return;
    const nextProject = {
      ...project,
      name: nextName.trim(),
      updatedAt: new Date().toISOString(),
      projectData: {
        ...project.projectData,
        projectName: nextName.trim()
      }
    };
    await saveLocalProject(nextProject);
    if (currentLocalProjectId === project.id) setProjectName(nextName.trim());
    await refreshLocalProjects();
  };

  const pushHistory = useCallback(() => {
    setHistory((items) => [
      ...items.slice(-24),
      makeSnapshot(grid, palette, activePaletteId, {
        rows,
        cols,
        currentCell,
        insertAnchorCell,
        progressRow,
        completedRows
      })
    ]);
    setFuture([]);
  }, [activePaletteId, cols, completedRows, currentCell, grid, insertAnchorCell, palette, progressRow, rows]);

  const clampProgressRow = useCallback(
    (value, nextRows) => clampNumber(value, numberStart, numberStart + nextRows - 1),
    [numberStart]
  );

  const clampCompletedRows = useCallback(
    (value, nextRows) => {
      const minRow = numberStart;
      const maxRow = numberStart + nextRows - 1;
      return new Set([...value].filter((row) => row >= minRow && row <= maxRow));
    },
    [numberStart]
  );

  const applySnapshot = useCallback((snapshot) => {
    const snapshotRows = snapshot.rows ?? snapshot.grid.length;
    const snapshotCols = snapshot.cols ?? snapshot.grid[0]?.length ?? 0;
    setGrid(snapshot.grid);
    setRows(snapshotRows);
    setCols(snapshotCols);
    setDraftRows(snapshotRows);
    setDraftCols(snapshotCols);
    setPalette(snapshot.palette);
    setActivePaletteId(snapshot.activePaletteId);
    setCurrentCell(clampCellToGrid(snapshot.currentCell ?? currentCell, snapshotRows, snapshotCols));
    setInsertAnchorCell(clampCellToGrid(snapshot.insertAnchorCell ?? insertAnchorCell, snapshotRows, snapshotCols));
    setProgressRow(snapshot.progressRow ?? clampProgressRow(progressRow, snapshotRows));
    setCompletedRows(snapshot.completedRows ? new Set(snapshot.completedRows) : new Set());
    setExpandedPaletteId('');
    setPaletteNotice('');
    setPendingResize(null);
  }, [clampProgressRow, currentCell, insertAnchorCell, progressRow]);

  const applyGridStructure = useCallback(
    (nextGrid, nextRows, nextCols, nextCurrentCell = currentCell, nextInsertAnchorCell = insertAnchorCell) => {
      setRows(nextRows);
      setCols(nextCols);
      setDraftRows(nextRows);
      setDraftCols(nextCols);
      setGrid(nextGrid);
      setCurrentCell(clampCellToGrid(nextCurrentCell, nextRows, nextCols));
      setInsertAnchorCell(clampCellToGrid(nextInsertAnchorCell, nextRows, nextCols));
      setProgressRow((value) => clampProgressRow(value, nextRows));
      setCompletedRows((value) => clampCompletedRows(value, nextRows));
    },
    [clampCompletedRows, clampProgressRow, currentCell, insertAnchorCell]
  );

  const paintCell = useCallback(
    (row, col, selectedTool = tool, shouldRecord = true) => {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      setCurrentCell({ row, col });

      if (selectedTool === 'select' || selectedTool === 'pan') return;

      if (selectedTool === 'picker') {
        const cell = grid[row][col];
        if (cell.paletteId) setActivePaletteId(cell.paletteId);
        return;
      }

      if (shouldRecord) pushHistory();

      setGrid((previous) => {
        const next = cloneGrid(previous);
        if (selectedTool === 'eraser') {
          next[row][col] = makeCell();
        } else if (selectedTool === 'fill') {
          const source = previous[row][col];
          const sourceKey = `${source.active}-${source.paletteId}-${source.symbol}`;
          const replacement = {
            active: true,
            color: activePalette.color,
            symbol: activePalette.code,
            label: activePalette.name,
            note: '',
            paletteId: activePalette.id
          };
          const queue = [[row, col]];
          const seen = new Set();
          while (queue.length) {
            const [r, c] = queue.shift();
            const key = `${r}:${c}`;
            if (seen.has(key) || r < 0 || r >= rows || c < 0 || c >= cols) continue;
            seen.add(key);
            const target = previous[r][c];
            const targetKey = `${target.active}-${target.paletteId}-${target.symbol}`;
            if (targetKey !== sourceKey) continue;
            next[r][c] = replacement;
            queue.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
          }
        } else {
          const existing = previous[row][col];
          const same = existing.active && existing.paletteId === activePalette.id;
          next[row][col] = same && shouldRecord
            ? makeCell()
            : {
                active: true,
                color: activePalette.color,
                symbol: activePalette.code,
                label: activePalette.name,
                note: '',
                paletteId: activePalette.id
              };
        }
        return next;
      });
    },
    [activePalette, cols, grid, pushHistory, rows, tool]
  );

  const handlePointerDown = (row, col) => {
    setIsDragging(true);
    setInsertAnchorCell({ row, col });
    paintCell(row, col, tool, true);
  };

  const handlePointerEnter = (row, col) => {
    setCurrentCell({ row, col });
    if (!isDragging || !['pen', 'eraser'].includes(tool)) return;
    paintCell(row, col, tool, false);
  };

  const handlePointerUp = () => setIsDragging(false);

  const undo = () => {
    setHistory((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setFuture((futureItems) => [
        makeSnapshot(grid, palette, activePaletteId, {
          rows,
          cols,
          currentCell,
          insertAnchorCell,
          progressRow,
          completedRows
        }),
        ...futureItems.slice(0, 24)
      ]);
      applySnapshot(previous);
      return items.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((items) => {
      if (!items.length) return items;
      const next = items[0];
      setHistory((historyItems) => [
        ...historyItems.slice(-24),
        makeSnapshot(grid, palette, activePaletteId, {
          rows,
          cols,
          currentCell,
          insertAnchorCell,
          progressRow,
          completedRows
        })
      ]);
      applySnapshot(next);
      return items.slice(1);
    });
  };

  const commitGridResize = (nextRows, nextCols, mode) => {
    const safeRows = Math.min(200, Math.max(1, Number(nextRows) || rows));
    const safeCols = Math.min(200, Math.max(1, Number(nextCols) || cols));
    pushHistory();
    const nextGrid = mode === 'keep'
      ? resizeGridKeepingContent(grid, safeRows, safeCols)
      : createGrid(safeRows, safeCols);
    applyGridStructure(nextGrid, safeRows, safeCols);
    setPendingResize(null);
    setProgressRow(numberStart);
    setCompletedRows(new Set());
  };

  const requestGridResize = (nextRows, nextCols) => {
    const safeRows = Math.min(200, Math.max(1, Number(nextRows) || rows));
    const safeCols = Math.min(200, Math.max(1, Number(nextCols) || cols));
    if (safeRows === rows && safeCols === cols) return;
    if (hasPaintedCells(grid)) {
      setPendingResize({ rows: safeRows, cols: safeCols });
      return;
    }
    commitGridResize(safeRows, safeCols, 'reset');
  };

  const movePattern = (rowDelta, colDelta) => {
    if (!paintedCellCount) return;
    const steps = clampNumber(moveSteps, 1, 200);
    pushHistory();
    setMoveSteps(steps);
    setGrid((previous) => moveGridContent(previous, rowDelta * steps, colDelta * steps));
  };

  const insertRow = (placement) => {
    if (rows >= 200) return;
    const insertIndex = placement === 'above' ? insertAnchorCell.row : insertAnchorCell.row + 1;
    const nextRows = rows + 1;
    const nextAnchorCell = placement === 'above'
      ? { ...insertAnchorCell, row: insertAnchorCell.row + 1 }
      : insertAnchorCell;
    pushHistory();
    applyGridStructure(insertGridRow(grid, insertIndex), nextRows, cols, currentCell, nextAnchorCell);
  };

  const insertCol = (placement) => {
    if (cols >= 200) return;
    const insertIndex = placement === 'left' ? insertAnchorCell.col : insertAnchorCell.col + 1;
    const nextCols = cols + 1;
    const nextAnchorCell = placement === 'left'
      ? { ...insertAnchorCell, col: insertAnchorCell.col + 1 }
      : insertAnchorCell;
    pushHistory();
    applyGridStructure(insertGridCol(grid, insertIndex), rows, nextCols, currentCell, nextAnchorCell);
  };

  const removeRow = (placement) => {
    const targetRow = placement === 'above' ? insertAnchorCell.row - 1 : insertAnchorCell.row + 1;
    if (rows <= 1 || targetRow < 0 || targetRow >= rows) return;
    const nextRows = rows - 1;
    pushHistory();
    applyGridStructure(
      removeGridRow(grid, targetRow),
      nextRows,
      cols,
      adjustCellAfterRowRemoval(currentCell, targetRow, nextRows),
      adjustCellAfterRowRemoval(insertAnchorCell, targetRow, nextRows)
    );
  };

  const removeCol = (placement) => {
    const targetCol = placement === 'left' ? insertAnchorCell.col - 1 : insertAnchorCell.col + 1;
    if (cols <= 1 || targetCol < 0 || targetCol >= cols) return;
    const nextCols = cols - 1;
    pushHistory();
    applyGridStructure(
      removeGridCol(grid, targetCol),
      rows,
      nextCols,
      adjustCellAfterColRemoval(currentCell, targetCol, nextCols),
      adjustCellAfterColRemoval(insertAnchorCell, targetCol, nextCols)
    );
  };

  const mirrorGrid = () => {
    pushHistory();
    setGrid((previous) => previous.map((row) => [...row].reverse()));
    setCurrentCell((cell) => ({ ...cell, col: cols - 1 - cell.col }));
    setInsertAnchorCell((cell) => ({ ...cell, col: cols - 1 - cell.col }));
  };

  const rotateGrid = () => {
    pushHistory();
    setGrid((previous) => {
      const next = Array.from({ length: cols }, (_, r) =>
        Array.from({ length: rows }, (_, c) => ({ ...previous[rows - 1 - c][r] }))
      );
      setRows(cols);
      setCols(rows);
      setDraftRows(cols);
      setDraftCols(rows);
      setCurrentCell((cell) => ({ row: cell.col, col: rows - 1 - cell.row }));
      setInsertAnchorCell((cell) => ({ row: cell.col, col: rows - 1 - cell.row }));
      return next;
    });
  };

  const copyRepeat = () => {
    pushHistory();
    setGrid((previous) => {
      const next = cloneGrid(previous);
      const blockRows = Math.min(12, rows);
      const blockCols = Math.min(12, cols);
      for (let r = 0; r < rows; r += blockRows) {
        for (let c = 0; c < cols; c += blockCols) {
          for (let br = 0; br < blockRows && r + br < rows; br += 1) {
            for (let bc = 0; bc < blockCols && c + bc < cols; bc += 1) {
              next[r + br][c + bc] = { ...previous[br][bc] };
            }
          }
        }
      }
      return next;
    });
  };

  const toggleCompletedRow = (rowNumber) => {
    setCompletedRows((previous) => {
      const next = new Set(previous);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const rowNumber = (rowIndex) =>
    rowDirection === 'bottom-up' ? rows - rowIndex - 1 + numberStart : rowIndex + numberStart;

  const colNumber = (colIndex) => colIndex + numberStart;

  const buildExportCanvas = ({ includeLegend = true, includeSymbols = true, includeHeaders = true } = {}) => {
    const cell = 18;
    const header = includeHeaders ? 34 : 0;
    const margin = 18;
    const legendWidth = includeLegend ? 260 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = margin * 2 + header * 2 + cols * cell + legendWidth;
    canvas.height = margin * 2 + header * 2 + rows * cell;
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
    const gridRight = ox + cols * cell;
    const gridBottom = oy + rows * cell;

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
        const x = ox + c * cell;
        ctx.fillStyle = '#e9f1f8';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.fillRect(x, chartY, cell, header);
        ctx.strokeRect(x, chartY, cell, header);
        ctx.fillRect(x, gridBottom, cell, header);
        ctx.strokeRect(x, gridBottom, cell, header);
        ctx.fillStyle = '#344054';
        ctx.fillText(colNumber(c), x + cell / 2, chartY + header / 2);
        ctx.fillText(colNumber(c), x + cell / 2, gridBottom + header / 2);
      }
      for (let r = 0; r < rows; r += 1) {
        const y = oy + r * cell;
        ctx.fillStyle = '#e9f1f8';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.fillRect(chartX, y, header, cell);
        ctx.strokeRect(chartX, y, header, cell);
        ctx.fillRect(gridRight, y, header, cell);
        ctx.strokeRect(gridRight, y, header, cell);
        ctx.fillStyle = '#344054';
        ctx.fillText(rowNumber(r), chartX + header / 2, y + cell / 2);
        ctx.fillText(rowNumber(r), gridRight + header / 2, y + cell / 2);
      }
    }

    grid.forEach((row, r) => {
      row.forEach((cellData, c) => {
        const x = ox + c * cell;
        const y = oy + r * cell;
        const display = resolveCellDisplay(cellData, palette);
        const shouldShowCell = cellData.active && display.visible;
        ctx.fillStyle = shouldShowCell ? display.color : '#ffffff';
        ctx.fillRect(x, y, cell, cell);
        if (includeSymbols && shouldShowCell && display.symbol) {
          ctx.fillStyle = luminance(display.color) < 0.55 ? '#ffffff' : '#111827';
          ctx.font = '8px Arial';
          ctx.fillText(display.symbol, x + cell / 2, y + cell / 2);
        }
      });
    });

    ctx.lineCap = 'square';
    for (let c = 0; c <= cols; c += 1) {
      const isGuideLine = c > 0 && c < cols && c % guideEvery === 0;
      const x = ox + c * cell;
      ctx.beginPath();
      ctx.strokeStyle = isGuideLine ? guideLineColor : '#aeb8c4';
      ctx.lineWidth = isGuideLine ? 2.2 : 0.9;
      ctx.moveTo(x, oy);
      ctx.lineTo(x, gridBottom);
      ctx.stroke();
    }

    for (let r = 0; r <= rows; r += 1) {
      const isGuideLine = r > 0 && r < rows && r % guideEvery === 0;
      const y = oy + r * cell;
      ctx.beginPath();
      ctx.strokeStyle = isGuideLine ? guideLineColor : '#aeb8c4';
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

  const exportPdf = async () => {
    const canvas = buildExportCanvas();
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
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

  const loadProject = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        applyProjectData(data, { localId: '' });
        setLocalSaveMessage('JSON에서 열린 임시 작업');
      } catch (error) {
        setLocalSaveState('error');
        setLocalSaveMessage(error.message || '프로젝트 파일을 열지 못했습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const prepareImageDraft = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImageOptions(INITIAL_IMAGE_OPTIONS);
      setImagePaletteMode('extract');
      setImageCandidates([]);
      setSelectedImageCandidateId('');
      setImageCandidateSeed(0);
      setShowOriginalOverlay(false);
      setOriginalOverlayOpacity(46);
      setCropDraft({
        src,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cropSelection: INITIAL_CROP_SELECTION,
        cropArea: convertPercentCropToImageCrop(INITIAL_CROP_SELECTION)
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      event.target.value = '';
    };
    image.src = src;
    event.target.value = '';
  };

  const closeCropDraft = () => {
    if (cropDraft?.src) URL.revokeObjectURL(cropDraft.src);
    setCropDraft(null);
  };

  const completeCropDraft = () => {
    if (!cropDraft?.cropArea) return;
    const crop = normalizeCrop(cropDraft.cropArea);
    setImageOptions({
      ...INITIAL_IMAGE_OPTIONS,
      fit: 'stretch',
      crop: {
        ...crop,
        enabled: true
      }
    });
    setImageDraft({
      src: cropDraft.src,
      name: cropDraft.name,
      width: cropDraft.width,
      height: cropDraft.height
    });
    setCropDraft(null);
  };

  const closeImageDraft = () => {
    if (imageDraft?.src) URL.revokeObjectURL(imageDraft.src);
    setImageDraft(null);
    setImageCandidates([]);
    setSelectedImageCandidateId('');
    setImageCandidateLoading(false);
    setShowOriginalOverlay(false);
  };

  const applyImageDraft = () => {
    if (!imageDraft || !selectedImageCandidate) return;
    pushHistory();
    setGrid(cloneGrid(selectedImageCandidate.grid));
    replaceAppliedSourceImageFromDraft(imageDraft, imageOptions, rows, cols);
    if (imagePaletteMode === 'extract') {
      const nextPalette = clonePalette(selectedImageCandidate.palette);
      setPalette(nextPalette);
      setActivePaletteId(nextPalette[0]?.id ?? activePaletteId);
      setExpandedPaletteId('');
      setPaletteNotice(`이미지에서 ${nextPalette.length}개 색상을 추출했습니다.`);
    }
    setMode('edit');
    setImageDraft(null);
    setImageCandidates([]);
    setSelectedImageCandidateId('');
    setImageCandidateLoading(false);
    setShowOriginalOverlay(false);
  };

  const mergePaletteItems = ({ sourceId, targetId }) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const sourceItem = getPaletteItem(palette, sourceId);
    const targetItem = getPaletteItem(palette, targetId);
    if (!sourceItem || !targetItem) return;

    pushHistory();
    setPalette((items) => items.filter((item) => item.id !== sourceId));
    setGrid((previous) => syncCellsForPaletteMerge(previous, sourceItem, targetItem));
    if (activePaletteId === sourceId) setActivePaletteId(targetId);
    if (expandedPaletteId === sourceId) setExpandedPaletteId(targetId);
    setPaletteNotice(`${sourceItem.code}가 ${targetItem.code}로 병합되었습니다.`);
  };

  const deletePaletteItem = (sourceId, replacementId = '') => {
    const sourceItem = getPaletteItem(palette, sourceId);
    if (!sourceItem || palette.length <= 1) return;

    const usage = activeCounts.get(sourceId) || 0;
    const replacementItem = replacementId ? getPaletteItem(palette, replacementId) : null;
    if (usage > 0 && !replacementItem) {
      setPaletteNotice(`${sourceItem.code}는 ${usage}칸에서 사용 중입니다. 대체 색상을 선택한 뒤 삭제하세요.`);
      return;
    }

    const nextActiveId = activePaletteId === sourceId
      ? replacementItem?.id ?? palette.find((item) => item.id !== sourceId)?.id
      : activePaletteId;

    pushHistory();
    setPalette((items) => items.filter((item) => item.id !== sourceId));
    setGrid((previous) =>
      replacementItem
        ? syncCellsForPaletteMerge(previous, sourceItem, replacementItem)
        : clearCellsForPalette(previous, sourceItem)
    );
    setActivePaletteId(nextActiveId);
    setExpandedPaletteId('');
    setPaletteNotice(
      replacementItem
        ? `${sourceItem.code}를 삭제하고 ${replacementItem.code}로 ${usage}칸을 옮겼습니다.`
        : `${sourceItem.code}를 삭제했습니다.`
    );
  };

  const togglePaletteVisibility = (id) => {
    const currentItem = getPaletteItem(palette, id);
    if (!currentItem) return;

    pushHistory();
    setPalette((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, visible: !isPaletteVisible(item) }
          : item
      )
    );
    setPaletteNotice(
      isPaletteVisible(currentItem)
        ? `${currentItem.code}를 도안에서 숨겼습니다.`
        : `${currentItem.code}를 도안에 다시 표시했습니다.`
    );
  };

  const updatePaletteItem = (id, patch, options = { autoMerge: true }) => {
    const currentItem = getPaletteItem(palette, id);
    if (!currentItem) return;

    const normalizedPatch = { ...patch };
    if (Object.prototype.hasOwnProperty.call(normalizedPatch, 'color')) {
      const normalizedColor = normalizeHex(normalizedPatch.color);
      if (!normalizedColor) return;
      normalizedPatch.color = normalizedColor;
    }

    const nextItem = { ...currentItem, ...normalizedPatch };
    const duplicate = normalizedPatch.color && options.autoMerge
      ? palette.find((item) => item.id !== id && normalizeHex(item.color) === nextItem.color)
      : null;

    pushHistory();

    if (duplicate) {
      setPalette((items) => items.filter((item) => item.id !== id));
      setGrid((previous) => syncCellsForPaletteMerge(previous, currentItem, duplicate));
      if (activePaletteId === id) setActivePaletteId(duplicate.id);
      if (expandedPaletteId === id) setExpandedPaletteId(duplicate.id);
      setPaletteNotice(`${currentItem.code}가 ${duplicate.code}로 병합되었습니다.`);
      return;
    }

    setPalette((items) => items.map((item) => (item.id === id ? nextItem : item)));
    setGrid((previous) => syncCellsForPaletteChange(previous, nextItem));
    setPaletteNotice('');
  };

  const addPaletteColor = () => {
    const id = `c${Date.now()}`;
    pushHistory();
    setPalette((items) => [
      ...items,
      {
        id,
        code: `C${items.length + 1}`,
        name: '새 색상',
        color: '#f5b84b',
        visible: true
      }
    ]);
    setActivePaletteId(id);
    setExpandedPaletteId(id);
    setPaletteNotice('');
  };

  return (
    <div className={`app ${isInspectorCollapsed ? 'inspector-collapsed' : ''}`} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Grid3X3 size={18} />
          </div>
          <div>
            <strong>KnitGrid</strong>
            <TextField value={projectName} onChange={setProjectName} ariaLabel="프로젝트 이름" />
          </div>
        </div>

        <SegmentedControl
          className="mode-tabs"
          ariaLabel="작업 모드"
          items={[
            { id: 'edit', label: 'Edit', icon: PenLine },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'progress', label: 'Progress', icon: Rows3 }
          ]}
          value={mode}
          onChange={setMode}
        />

        <Toolbar className="command-group">
          <span className={`local-save-state state-${localSaveState}`} title={localSaveMessage || localSaveStatusLabel}>
            {localSaveStatusLabel}
          </span>
          <Button icon={Plus} onClick={requestNewProject}>새 작업</Button>
          <Button icon={FileText} onClick={openLocalProjectsModal}>내 작업</Button>
          <Button variant="primary" icon={Save} onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>로컬 저장</Button>
          <IconButton icon={Undo2} label="되돌리기" size={16} onClick={undo} disabled={!history.length} title="되돌리기" />
          <IconButton icon={Redo2} label="다시 실행" size={16} onClick={redo} disabled={!future.length} title="다시 실행" />
          <FileButton icon={ImagePlus} accept="image/png,image/jpeg,image/webp" title="이미지 업로드" onFiles={(files) => prepareImageDraft({ target: { files } })}>이미지</FileButton>
          <Button icon={FileImage} onClick={exportPng}>PNG</Button>
          <Button icon={FileText} onClick={exportPdf}>PDF</Button>
          <Button icon={Download} onClick={saveProject}>JSON</Button>
        </Toolbar>
      </header>

      <ToolRail
        items={TOOLS}
        value={tool}
        onSelect={(id) => id === 'mirror' ? mirrorGrid() : setTool(id)}
        ariaLabel="편집 도구"
      >
        <button onClick={rotateGrid} title="회전">
          <RotateCcw size={20} />
          <span>회전</span>
        </button>
        <button onClick={copyRepeat} title="반복 복제">
          <Copy size={20} />
          <span>반복</span>
        </button>
      </ToolRail>

      <main className="workspace">
        <section className="canvas-panel">
          <Toolbar className="canvas-toolbar">
            <div>
              <strong>{cols} x {rows}</strong>
              <span>{guideEvery}칸 보조선 · 최대 200 x 200</span>
            </div>
            <Slider min={46} max={132} value={zoom} onChange={setZoom} leftIcon={ZoomOut} rightIcon={ZoomIn} valueLabel={`${zoom}%`} />
            <div className="source-overlay-control">
              <button
                className={showAppliedSourceOverlay ? 'active' : ''}
                onClick={() => {
                  setShowAppliedSourceOverlay((value) => {
                    if (value) setIsAdjustingAppliedSourceOverlay(false);
                    return !value;
                  });
                }}
                disabled={!appliedSourceImage}
                title={appliedSourceImage ? `${appliedSourceImage.name} 원본 보기` : '적용된 원본 이미지 없음'}
              >
                <Eye size={14} />
                원본 보기
              </button>
              <button
                className={isAdjustingAppliedSourceOverlay ? 'active' : ''}
                onClick={() => setIsAdjustingAppliedSourceOverlay((value) => !value)}
                disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                title="원본 위치와 크기 조정"
              >
                <Hand size={14} />
                원본 조정
              </button>
              <label>
                <span>투명도</span>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={appliedSourceOverlayOpacity}
                  disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                  onChange={(event) => setAppliedSourceOverlayOpacity(Number(event.target.value))}
                  aria-label="편집 화면 원본 투명도"
                />
              </label>
              <div className="source-overlay-scale-mode" aria-label="원본 크기 조정 방식">
                <button
                  className={appliedSourceOverlayTransform.scaleMode === 'uniform' ? 'active' : ''}
                  onClick={() => updateAppliedSourceOverlayTransform({ scaleMode: 'uniform' })}
                  disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                >
                  균일
                </button>
                <button
                  className={appliedSourceOverlayTransform.scaleMode === 'free' ? 'active' : ''}
                  onClick={() => updateAppliedSourceOverlayTransform({ scaleMode: 'free' })}
                  disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                >
                  가로/세로
                </button>
              </div>
              {appliedSourceOverlayTransform.scaleMode === 'uniform' ? (
                <label>
                  <span>크기</span>
                  <input
                    type="range"
                    min="50"
                    max="250"
                    step="1"
                    value={appliedSourceOverlayTransform.scale}
                    disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                    onChange={(event) => updateAppliedSourceOverlayTransform({ scale: event.target.value })}
                    aria-label="원본 균일 크기"
                  />
                </label>
              ) : (
                <>
                  <label>
                    <span>가로</span>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="1"
                      value={appliedSourceOverlayTransform.scaleX}
                      disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                      onChange={(event) => updateAppliedSourceOverlayTransform({ scaleX: event.target.value })}
                      aria-label="원본 가로 크기"
                    />
                  </label>
                  <label>
                    <span>세로</span>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="1"
                      value={appliedSourceOverlayTransform.scaleY}
                      disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                      onChange={(event) => updateAppliedSourceOverlayTransform({ scaleY: event.target.value })}
                      aria-label="원본 세로 크기"
                    />
                  </label>
                </>
              )}
              <div className="source-overlay-stepper">
                <label>
                  <span>이동</span>
                  <input
                    type="number"
                    min="0.1"
                    max="200"
                    step="0.1"
                    value={appliedSourceOverlayMoveStep}
                    disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                    onChange={(event) => setAppliedSourceOverlayMoveStep(clampFiniteNumber(event.target.value, 0.1, 200))}
                    aria-label="원본 이동 칸 수"
                  />
                </label>
                <div className="source-overlay-move-pad" aria-label="원본 이동">
                  <button onClick={() => moveAppliedSourceOverlay(0, -1)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 위로 이동" aria-label="원본 위로 이동">
                    <ArrowUp size={13} />
                  </button>
                  <button onClick={() => moveAppliedSourceOverlay(-1, 0)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 왼쪽으로 이동" aria-label="원본 왼쪽으로 이동">
                    <ArrowLeft size={13} />
                  </button>
                  <button onClick={() => moveAppliedSourceOverlay(1, 0)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 오른쪽으로 이동" aria-label="원본 오른쪽으로 이동">
                    <ArrowRight size={13} />
                  </button>
                  <button onClick={() => moveAppliedSourceOverlay(0, 1)} disabled={!appliedSourceImage || !showAppliedSourceOverlay} title="원본 아래로 이동" aria-label="원본 아래로 이동">
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
              <button
                className="icon-only reset"
                onClick={resetAppliedSourceOverlayTransform}
                disabled={!appliedSourceImage || !showAppliedSourceOverlay}
                title="정렬 초기화"
                aria-label="정렬 초기화"
              >
                <RotateCcw size={14} />
              </button>
              <button
                className="icon-only"
                onClick={clearAppliedSourceImage}
                disabled={!appliedSourceImage}
                title="원본 제거"
                aria-label="원본 제거"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Toolbar>
          {appliedSourceImage && appliedSourceSizeChanged ? (
            <div className="source-overlay-note">
              원본은 {appliedSourceImage.cols} x {appliedSourceImage.rows}칸 적용 당시 기준입니다.
            </div>
          ) : null}

          <div ref={gridScrollRef} className={`grid-scroll mode-${mode}`}>
            <div
              className="chart-grid"
              style={{
                '--rows': rows,
                '--cols': cols,
                '--cell': `${Math.round((zoom / 100) * 24)}px`,
                '--guide-color': guideLineColor
              }}
            >
              {appliedSourceImage && showAppliedSourceOverlay ? (
                <div
                  className={`applied-source-overlay ${isAdjustingAppliedSourceOverlay ? 'adjusting' : ''}`}
                  aria-hidden="true"
                  style={{
                    opacity: appliedSourceOverlayOpacity / 100,
                    transform: appliedSourceTransformCss
                  }}
                  onPointerDown={handleAppliedSourceOverlayPointerDown}
                  onPointerMove={handleAppliedSourceOverlayPointerMove}
                  onPointerUp={handleAppliedSourceOverlayPointerUp}
                  onPointerCancel={handleAppliedSourceOverlayPointerUp}
                >
                  <img
                    src={appliedSourceImage.src}
                    alt=""
                    style={{
                      objectFit: appliedSourceImage.imageOptions.fit === 'stretch' ? 'fill' : appliedSourceImage.imageOptions.fit,
                      objectPosition: `${appliedSourceImage.imageOptions.alignX === 'left' ? 0 : appliedSourceImage.imageOptions.alignX === 'right' ? 100 : 50}% ${appliedSourceImage.imageOptions.alignY === 'top' ? 0 : appliedSourceImage.imageOptions.alignY === 'bottom' ? 100 : 50}%`
                    }}
                  />
                </div>
              ) : null}
              <div className="corner top-left" />
              <HeaderRow cols={cols} colNumber={colNumber} area="top" />
              <div className="corner top-right" />
              <HeaderColumn rows={rows} rowNumber={rowNumber} area="left" completedRows={completedRows} />
              <div className="cells" style={{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }}>
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const actualRowNumber = rowNumber(r);
                    const guideRow = (r + 1) % guideEvery === 0;
                    const guideCol = (c + 1) % guideEvery === 0;
                    const progress = mode === 'progress' && actualRowNumber === progressRow;
                    const completed = mode === 'progress' && completedRows.has(actualRowNumber);
                    const display = resolveCellDisplay(cell, palette);
                    const shouldShowCell = cell.active && display.visible;
                    const isInsertAnchor = insertAnchorCell.row === r && insertAnchorCell.col === c;
                    return (
                      <button
                        key={`${r}-${c}`}
                        className={`cell ${cell.active ? 'filled' : ''} ${isInsertAnchor ? 'insert-anchor' : ''} ${!display.visible ? 'palette-hidden' : ''} ${guideRow ? 'guide-row' : ''} ${guideCol ? 'guide-col' : ''} ${progress ? 'progress-row' : ''} ${completed ? 'completed-row' : ''}`}
                        style={{ background: shouldShowCell && displayMode !== 'code' ? display.color : '#fff' }}
                        onPointerDown={() => handlePointerDown(r, c)}
                        onPointerEnter={() => handlePointerEnter(r, c)}
                        title={`${actualRowNumber}행 ${colNumber(c)}열 ${shouldShowCell ? display.symbol || '빈 칸' : `${display.symbol || '색상'} 숨김`}`}
                      >
                        {shouldShowCell && displayMode !== 'color' ? (
                          <span style={{ color: displayMode === 'code' || luminance(display.color) > 0.55 ? '#172033' : '#fff' }}>
                            {display.symbol}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
              {showOppositeHeaders ? <HeaderColumn rows={rows} rowNumber={rowNumber} area="right" completedRows={completedRows} /> : <div />}
              {showOppositeHeaders ? <div className="corner bottom-left" /> : <div />}
              {showOppositeHeaders ? <HeaderRow cols={cols} colNumber={colNumber} area="bottom" /> : <div />}
              {showOppositeHeaders ? <div className="corner bottom-right" /> : <div />}
            </div>
          </div>
        </section>
      </main>

      <aside className={`inspector ${isInspectorCollapsed ? 'collapsed' : ''}`} aria-label="격자 설정 사이드메뉴">
        {isInspectorCollapsed ? (
          <button
            className="inspector-expand"
            onClick={() => setIsInspectorCollapsed(false)}
            title="격자 설정 펼치기"
            aria-label="격자 설정 펼치기"
          >
            <Settings2 size={17} />
            <ArrowLeft size={16} />
          </button>
        ) : (
          <>
        <Panel
          className="setup-panel"
          icon={Settings2}
          title="격자 설정"
          action={
            <button
              className="icon-toggle"
              onClick={() => setIsInspectorCollapsed(true)}
              title="격자 설정 접기"
              aria-label="격자 설정 접기"
            >
              <ArrowRight size={15} />
            </button>
          }
        >
          <div className="preset-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={rows === preset.rows && cols === preset.cols ? 'active' : ''}
                onClick={() => requestGridResize(preset.rows, preset.cols)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="two-cols">
            <NumberField label="가로" min={1} max={200} value={draftCols} onChange={(v) => setDraftCols(Math.min(200, v))} />
            <NumberField label="세로" min={1} max={200} value={draftRows} onChange={(v) => setDraftRows(Math.min(200, v))} />
          </div>
          <Button wide icon={Sparkles} onClick={() => requestGridResize(draftRows, draftCols)}>격자 크기 적용</Button>
          <div className="structure-panel">
            <div className="structure-title">
              <strong>도안 이동</strong>
              <label>
                <span>칸</span>
                <NumberField
                  min={1}
                  max={200}
                  value={moveSteps}
                  onChange={(v) => setMoveSteps(clampNumber(v, 1, 200))}
                  ariaLabel="이동 칸 수"
                />
              </label>
            </div>
            <div className="move-pad">
              <span />
              <button onClick={() => movePattern(-1, 0)} disabled={!paintedCellCount} title="도안 위로 이동">
                <ArrowUp size={15} />
              </button>
              <span />
              <button onClick={() => movePattern(0, -1)} disabled={!paintedCellCount} title="도안 왼쪽으로 이동">
                <ArrowLeft size={15} />
              </button>
              <div>{paintedCellCount}칸</div>
              <button onClick={() => movePattern(0, 1)} disabled={!paintedCellCount} title="도안 오른쪽으로 이동">
                <ArrowRight size={15} />
              </button>
              <span />
              <button onClick={() => movePattern(1, 0)} disabled={!paintedCellCount} title="도안 아래로 이동">
                <ArrowDown size={15} />
              </button>
              <span />
            </div>
          </div>
          <div className="structure-panel">
            <div className="structure-title">
              <strong>행/열 추가</strong>
              <span>삽입 기준: {rowNumber(insertAnchorCell.row)}행 {colNumber(insertAnchorCell.col)}열</span>
            </div>
            <div className="insert-grid">
              <div className="insert-control">
                <button
                  className="remove"
                  onClick={() => removeRow('above')}
                  disabled={rows <= 1 || insertAnchorCell.row === 0}
                  title="기준 위 행 제거"
                  aria-label="기준 위 행 제거"
                >
                  <Minus size={14} />
                </button>
                <span>위 행</span>
                <button onClick={() => insertRow('above')} disabled={rows >= 200} title="기준 위에 행 추가" aria-label="기준 위에 행 추가">
                  <Plus size={14} />
                </button>
              </div>
              <div className="insert-control">
                <button
                  className="remove"
                  onClick={() => removeRow('below')}
                  disabled={rows <= 1 || insertAnchorCell.row >= rows - 1}
                  title="기준 아래 행 제거"
                  aria-label="기준 아래 행 제거"
                >
                  <Minus size={14} />
                </button>
                <span>아래 행</span>
                <button onClick={() => insertRow('below')} disabled={rows >= 200} title="기준 아래에 행 추가" aria-label="기준 아래에 행 추가">
                  <Plus size={14} />
                </button>
              </div>
              <div className="insert-control">
                <button
                  className="remove"
                  onClick={() => removeCol('left')}
                  disabled={cols <= 1 || insertAnchorCell.col === 0}
                  title="기준 왼쪽 열 제거"
                  aria-label="기준 왼쪽 열 제거"
                >
                  <Minus size={14} />
                </button>
                <span>왼쪽 열</span>
                <button onClick={() => insertCol('left')} disabled={cols >= 200} title="기준 왼쪽에 열 추가" aria-label="기준 왼쪽에 열 추가">
                  <Plus size={14} />
                </button>
              </div>
              <div className="insert-control">
                <button
                  className="remove"
                  onClick={() => removeCol('right')}
                  disabled={cols <= 1 || insertAnchorCell.col >= cols - 1}
                  title="기준 오른쪽 열 제거"
                  aria-label="기준 오른쪽 열 제거"
                >
                  <Minus size={14} />
                </button>
                <span>오른쪽 열</span>
                <button onClick={() => insertCol('right')} disabled={cols >= 200} title="기준 오른쪽에 열 추가" aria-label="기준 오른쪽에 열 추가">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="two-cols">
            <NumberField label="번호 시작" value={numberStart} onChange={(v) => setNumberStart(v)} />
            <Select label="보조선" value={String(guideEvery)} onChange={(v) => setGuideEvery(Number(v))} options={[{ value: '5', label: '5칸' }, { value: '10', label: '10칸' }]} />
          </div>
          <div className="two-cols guide-color-fields">
            <Select label="보조선 색상" value={guideColorMode} onChange={setGuideColorMode} options={[{ value: 'black', label: '검은색' }, { value: 'white', label: '흰색' }, { value: 'custom', label: '커스텀' }]} />
            {guideColorMode === 'custom' ? (
              <label>
                커스텀
                <input
                  type="color"
                  value={guideCustomColor}
                  onInput={(event) => setGuideCustomColor(event.target.value)}
                  onChange={(event) => setGuideCustomColor(event.target.value)}
                  aria-label="커스텀 보조선 색상"
                />
              </label>
            ) : (
              <div className="guide-color-preview" style={{ '--guide-color': guideLineColor }} aria-hidden="true" />
            )}
          </div>
          <label className="check-row">
            <input type="checkbox" checked={showOppositeHeaders} onChange={(event) => setShowOppositeHeaders(event.target.checked)} />
            우측/하단 번호 표시
          </label>
          <Select label="행 번호 방향" value={rowDirection} onChange={setRowDirection} options={[{ value: 'bottom-up', label: '아래에서 위' }, { value: 'top-down', label: '위에서 아래' }]} />
        </Panel>

        <Panel
          icon={Palette}
          title="팔레트 / 코드"
          action={<Button onClick={addPaletteColor}>추가</Button>}
        >
          <SegmentedControl className="display-tabs" items={DISPLAY_MODES} value={displayMode} onChange={setDisplayMode} />
          {paletteNotice ? <div className="palette-notice">{paletteNotice}</div> : null}
          <div className="palette-list">
            {palette.map((item) => {
              const visible = isPaletteVisible(item);
              return (
              <div
                key={item.id}
                data-palette-id={item.id}
                className={`palette-row ${activePaletteId === item.id ? 'active' : ''} ${expandedPaletteId === item.id ? 'expanded' : ''} ${visible ? '' : 'hidden-color'}`}
                onClick={() => {
                  setActivePaletteId(item.id);
                  setExpandedPaletteId((current) => (current === item.id ? '' : item.id));
                }}
              >
                <button
                  className={`palette-visibility-toggle ${visible ? '' : 'is-hidden'}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePaletteVisibility(item.id);
                  }}
                  title={visible ? `${item.code} 도안에서 숨기기` : `${item.code} 도안에 표시`}
                  aria-label={visible ? `${item.code} 숨기기` : `${item.code} 다시 표시`}
                >
                  {visible ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{visible ? '숨김' : '표시'}</span>
                </button>
                <button
                  className="palette-swatch"
                  style={{ background: item.color }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePaletteId(item.id);
                    setExpandedPaletteId(item.id);
                  }}
                  title={`${item.code} 색상 편집`}
                />
                <input
                  value={item.code}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePaletteId(item.id);
                    setExpandedPaletteId(item.id);
                  }}
                  onFocus={() => {
                    setActivePaletteId(item.id);
                    setExpandedPaletteId(item.id);
                  }}
                  onChange={(event) => updatePaletteItem(item.id, { code: event.target.value })}
                  aria-label="코드"
                />
                <input
                  value={item.name}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePaletteId(item.id);
                    setExpandedPaletteId(item.id);
                  }}
                  onFocus={() => {
                    setActivePaletteId(item.id);
                    setExpandedPaletteId(item.id);
                  }}
                  onChange={(event) => updatePaletteItem(item.id, { name: event.target.value })}
                  aria-label="이름"
                />
                <span>{activeCounts.get(item.id) || 0}</span>
                {expandedPaletteId === item.id ? (
                  <div className="palette-editor" onClick={(event) => event.stopPropagation()}>
                    <label>
                      색상
                      <input
                        type="color"
                        value={item.color}
                        onChange={(event) => updatePaletteItem(item.id, { color: event.target.value })}
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
                          if (normalized && normalized !== item.color) updatePaletteItem(item.id, { color: normalized });
                        }}
                        onBlur={(event) => {
                          const normalized = normalizeHex(event.target.value);
                          if (normalized) updatePaletteItem(item.id, { color: normalized });
                          else event.target.value = item.color;
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                        aria-label="HEX 색상"
                      />
                    </label>
                    <label>
                      코드
                      <input value={item.code} onChange={(event) => updatePaletteItem(item.id, { code: event.target.value })} aria-label="확장 코드" />
                    </label>
                    <label>
                      이름
                      <input value={item.name} onChange={(event) => updatePaletteItem(item.id, { name: event.target.value })} aria-label="확장 이름" />
                    </label>
                    <Select
                      label="기존 색상으로 병합"
                      className="palette-merge-field"
                      value=""
                      onChange={(v) => { if (v) mergePaletteItems({ sourceId: item.id, targetId: v }); }}
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
                          {activeCounts.get(item.id) || 0}칸에서 사용 중입니다.
                          {activeCounts.get(item.id) ? ' 삭제하려면 대체 색상을 선택하세요.' : ' 바로 삭제할 수 있습니다.'}
                        </span>
                      </div>
                      {activeCounts.get(item.id) ? (
                        <Select
                          value=""
                          onChange={(v) => { if (v) deletePaletteItem(item.id, v); }}
                          ariaLabel="삭제하며 대체할 색상"
                          disabled={palette.length <= 1}
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
                          onClick={() => deletePaletteItem(item.id)}
                          disabled={palette.length <= 1}
                        >삭제</Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="progress-panel" icon={CheckSquare} title="진행 모드">
          <label>
            현재 행
            <input type="range" min={numberStart} max={rows + numberStart - 1} value={progressRow} onChange={(event) => setProgressRow(Number(event.target.value))} />
          </label>
          <div className="progress-readout">
            <strong>{progressRow}행</strong>
            <span>{completedRows.size}행 완료</span>
          </div>
          <div className="row-chips">
            {Array.from({ length: Math.min(rows, 36) }, (_, index) => {
              const row = rowDirection === 'bottom-up' ? index + numberStart : rows - index - 1 + numberStart;
              return (
                <button
                  key={row}
                  className={`${completedRows.has(row) ? 'done' : ''} ${progressRow === row ? 'current' : ''}`}
                  onClick={() => {
                    setProgressRow(row);
                    toggleCompletedRow(row);
                  }}
                >
                  {row}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="export-panel" icon={ArrowDownToLine} title="가져오기 / 내보내기">
          <div className="local-project-actions">
            <Button icon={Plus} iconSize={15} onClick={requestNewProject}>새 작업</Button>
            <Button icon={FileText} iconSize={15} onClick={openLocalProjectsModal}>내 작업</Button>
            <Button icon={Save} iconSize={15} onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>로컬 저장</Button>
          </div>
          <Button wide icon={Upload} onClick={() => fileInputRef.current?.click()}>이미지로 초안 생성</Button>
          <Button wide icon={Download} onClick={() => projectInputRef.current?.click()}>프로젝트 열기</Button>
          <div className="export-grid">
            <Button onClick={exportPng}>PNG</Button>
            <Button onClick={exportPdf}>PDF</Button>
            <Button onClick={saveProject}>JSON</Button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={prepareImageDraft} hidden />
          <input ref={projectInputRef} type="file" accept="application/json,.json" onChange={loadProject} hidden />
        </Panel>
          </>
        )}
      </aside>

      <Modal
        open={localProjectsOpen}
        title="내 작업"
        subtitle="이 브라우저에 저장된 KnitGrid 작업입니다. 다른 기기나 브라우저와 자동 공유되지는 않습니다."
        onClose={() => setLocalProjectsOpen(false)}
        variant="local-project-modal"
        bodyClassName="local-project-modal-body"
        titleId="local-project-modal-title"
        closeLabel="내 작업 닫기"
        actions={
          <>
            <Button onClick={() => setLocalProjectsOpen(false)}>닫기</Button>
            <Button variant="primary" onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>현재 작업 로컬 저장</Button>
          </>
        }
      >
        {localProjects.length ? (
          <div className="local-project-list">
            {localProjects.map((project) => (
              <article
                key={project.id}
                className={`local-project-row ${currentLocalProjectId === project.id ? 'active' : ''}`}
              >
                <img src={project.thumbnail} alt="" aria-hidden="true" />
                <div className="local-project-meta">
                  <strong>{project.name || project.projectData?.projectName || '이름 없는 작업'}</strong>
                  <span>{formatProjectDate(project.updatedAt)} 수정</span>
                  <div>
                    <b>{project.summary?.cols ?? project.projectData?.cols} x {project.summary?.rows ?? project.projectData?.rows}</b>
                    <b>{project.summary?.colorCount ?? project.projectData?.palette?.length ?? 0}색</b>
                    <b>{project.summary?.paintedCells ?? countPaintedCells(project.projectData?.grid || [])}칸</b>
                  </div>
                </div>
                <div className="local-project-row-actions">
                  <Button variant="primary" onClick={() => openLocalProject(project.id)}>열기</Button>
                  <Button onClick={() => duplicateProject(project.id)}>복제</Button>
                  <Button onClick={() => renameLocalProject(project)}>이름 변경</Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`${project.name || '작업'}을 삭제할까요?`)) removeLocalProject(project.id);
                    }}
                  >삭제</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-local-projects">
            <FileText size={24} />
            <strong>아직 저장된 작업이 없습니다.</strong>
            <p>상단의 로컬 저장을 누르면 이 브라우저에 작업이 저장됩니다.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(pendingNewProject)}
        title="새 작업 시작"
        subtitle="현재 편집 중인 작업을 어떻게 처리할지 선택하세요."
        onClose={() => setPendingNewProject(false)}
        variant="resize-modal"
        bodyClassName="resize-modal-body"
        titleId="new-project-modal-title"
        closeLabel="새 작업 취소"
        actions={
          <>
            <Button onClick={() => setPendingNewProject(false)}>취소</Button>
            <Button variant="danger" onClick={resetToNewProject}>저장하지 않고 새로 만들기</Button>
            <Button variant="primary" onClick={saveAndStartNewProject} disabled={localSaveState === 'saving'}>현재 작업 저장 후 새로 만들기</Button>
          </>
        }
      >
        <AlertTriangle size={20} />
        <div>
          <strong>현재 작업이 초기화됩니다.</strong>
          <p>로컬 저장을 선택하면 이 브라우저의 내 작업 목록에 저장한 뒤 새 빈 격자로 전환합니다.</p>
        </div>
      </Modal>

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
          <p>그림을 유지하면 좌상단 기준으로 보존되고, 줄어드는 영역의 오른쪽/아래 칸은 잘립니다.</p>
        </div>
      </Modal>

      <Modal
        open={Boolean(cropDraft)}
        title="이미지 크롭"
        subtitle={cropDraft ? `${cropDraft.name} · ${cropDraft.width} x ${cropDraft.height}px` : undefined}
        onClose={closeCropDraft}
        variant="crop-modal"
        bodyClassName="crop-modal-body"
        titleId="crop-modal-title"
        closeLabel="이미지 크롭 닫기"
        actions={
          <>
            <Button onClick={closeCropDraft}>취소</Button>
            <Button variant="primary" onClick={completeCropDraft} disabled={!cropDraft?.cropArea}>크롭 완료</Button>
          </>
        }
      >
        <div className="cropper-shell">
          <ReactCrop
            crop={cropDraft?.cropSelection}
            keepSelection
            minWidth={8}
            minHeight={8}
            onChange={(_, percentCrop) => updateCropDraftSelection(percentCrop)}
            onComplete={(_, percentCrop) => completeCropDraftSelection(percentCrop)}
          >
            <img className="crop-source-image" src={cropDraft?.src} alt="크롭할 원본 이미지" />
          </ReactCrop>
        </div>
        <div className="crop-modal-controls">
          <Button onClick={resetCropDraft}>초기화</Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(imageDraft)}
        title="이미지 변환 미리보기"
        subtitle={imageDraft ? `${imageDraft.name} · 원본 ${imageDraft.width} x ${imageDraft.height}px → 격자 ${cols} x ${rows}칸` : undefined}
        onClose={closeImageDraft}
        variant=""
        bodyClassName="image-modal-body"
        titleId="image-modal-title"
        closeLabel="이미지 변환 닫기"
        actions={
          <>
            <Button onClick={closeImageDraft}>취소</Button>
            <Button variant="primary" onClick={applyImageDraft} disabled={imageCandidateLoading || !selectedImageCandidate}>
              {imageCandidateLoading ? '계산 중' : '선택 후보로 격자 생성'}
            </Button>
          </>
        }
      >
        <div className="image-preview-panel">
                <div className="image-preview-tools">
                  <button
                    className={showOriginalOverlay ? 'active' : ''}
                    onClick={() => setShowOriginalOverlay((value) => !value)}
                    disabled={!selectedImageCandidate}
                  >
                    <Eye size={14} />
                    원본 겹쳐보기
                  </button>
                  <button
                    onClick={() => setImageCandidateSeed((value) => value + 1)}
                    disabled={imageCandidateLoading}
                  >
                    <RotateCcw size={14} />
                    다시 생성
                  </button>
                  <label>
                    투명도
                    <input
                      type="range"
                      min="20"
                      max="85"
                      value={originalOverlayOpacity}
                      disabled={!showOriginalOverlay || !selectedImageCandidate}
                      onChange={(event) => setOriginalOverlayOpacity(Number(event.target.value))}
                      aria-label="원본 레이어 투명도"
                    />
                  </label>
                </div>
                <div className="image-candidate-list" aria-label="변환 후보">
                  {imageCandidateLoading && !imageCandidates.length ? (
                    <div className="image-candidate-loading">후보 생성 중</div>
                  ) : imageCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      className={selectedImageCandidate?.id === candidate.id ? 'active' : ''}
                      onClick={() => setSelectedImageCandidateId(candidate.id)}
                    >
                      <div
                        className="candidate-thumb"
                        style={{
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                          '--preview-rows': rows
                        }}
                      >
                        {candidate.grid.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <span
                              key={`${rowIndex}-${colIndex}`}
                              style={{ background: cell.active ? cell.color : '#ffffff' }}
                            />
                          ))
                        )}
                      </div>
                      <strong>{candidate.label}</strong>
                      <small>{candidate.tag} · {candidate.palette.length}색 · {candidate.score}점</small>
                    </button>
                  ))}
                </div>
                <div
                  className="image-preview-frame"
                  style={{
                    aspectRatio: `${cols} / ${rows}`,
                    '--preview-cols': cols,
                    '--preview-rows': rows
                  }}
                >
                  {imageCandidateLoading && !selectedImageCandidate ? (
                    <div className="image-preview-loading">변환 후보 계산 중</div>
                  ) : selectedImageCandidate ? (
                    <div
                      className="converted-preview-grid"
                      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                      aria-label="실제 변환 결과 미리보기"
                    >
                      {selectedImageCandidate.grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <span
                            key={`${rowIndex}-${colIndex}`}
                            style={{ background: cell.active ? cell.color : '#ffffff' }}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <img
                      src={imageDraft.src}
                      alt="업로드 이미지 미리보기"
                      style={{
                        objectFit: imageOptions.fit === 'stretch' ? 'fill' : imageOptions.fit,
                        objectPosition: `${imageOptions.alignX === 'left' ? 0 : imageOptions.alignX === 'right' ? 100 : 50}% ${imageOptions.alignY === 'top' ? 0 : imageOptions.alignY === 'bottom' ? 100 : 50}%`
                      }}
                    />
                  )}
                  {selectedImageCandidate && showOriginalOverlay ? (
                    <img
                      className="original-overlay-image"
                      src={imageDraft.src}
                      alt="원본 이미지 레이어"
                      style={{
                        opacity: originalOverlayOpacity / 100,
                        objectFit: imageOptions.fit === 'stretch' ? 'fill' : imageOptions.fit,
                        objectPosition: `${imageOptions.alignX === 'left' ? 0 : imageOptions.alignX === 'right' ? 100 : 50}% ${imageOptions.alignY === 'top' ? 0 : imageOptions.alignY === 'bottom' ? 100 : 50}%`
                      }}
                    />
                  ) : null}
                  <div className="image-preview-grid" />
                </div>
                <p>
                  후보 중 하나를 고르면 큰 미리보기와 원본 겹쳐보기가 그 결과 기준으로 바뀝니다.
                </p>
                {selectedImageCandidate ? (
                  <div className="image-palette-preview">
                    <strong>선택 후보 팔레트</strong>
                    <div>
                      {selectedImageCandidate.palette.map((item) => (
                        <span key={item.id}>
                          <i style={{ background: item.color }} />
                          {item.code} {item.name}
                          <b>{imagePreviewCounts.get(item.id) || 0}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="image-settings-panel">
                <div className="setting-block">
                  <strong>변환 방식</strong>
                  <div className="option-stack">
                    {IMAGE_PALETTE_MODES.map((item) => (
                      <button
                        key={item.id}
                        className={imagePaletteMode === item.id ? 'active' : ''}
                        onClick={() => setImagePaletteMode(item.id)}
                      >
                        <span>{item.label}</span>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-block">
                  <strong>맞춤 방식</strong>
                  <div className="option-stack">
                    {FIT_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        className={imageOptions.fit === item.id ? 'active' : ''}
                        onClick={() => setImageOptions((previous) => ({ ...previous, fit: item.id }))}
                      >
                        <span>{item.label}</span>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-block">
                  <strong>가로 정렬</strong>
                  <div className="segmented">
                    {HORIZONTAL_ALIGNMENTS.map((item) => (
                      <button
                        key={item.id}
                        className={imageOptions.alignX === item.id ? 'active' : ''}
                        disabled={imageOptions.fit === 'stretch'}
                        onClick={() => setImageOptions((previous) => ({ ...previous, alignX: item.id }))}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-block">
                  <strong>세로 정렬</strong>
                  <div className="segmented">
                    {VERTICAL_ALIGNMENTS.map((item) => (
                      <button
                        key={item.id}
                        className={imageOptions.alignY === item.id ? 'active' : ''}
                        disabled={imageOptions.fit === 'stretch'}
                        onClick={() => setImageOptions((previous) => ({ ...previous, alignY: item.id }))}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {imageWarnings.length ? (
                  <div className="image-warning">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>변환 전에 확인하세요</strong>
                      {imageWarnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedImageCandidate?.colorWarnings.length ? (
                  <div className="image-warning image-color-warning">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>현재 팔레트와 색상 차이가 큽니다</strong>
                      <p>원본 색상과 가까운 코드가 없어 다른 색으로 보일 수 있습니다. 자동 추출 방식을 권장합니다.</p>
                      <div className="color-warning-list">
                        {selectedImageCandidate.colorWarnings.map((warning) => (
                          <span key={`${warning.sourceHex}-${warning.targetCode}`}>
                            <i style={{ background: warning.sourceHex }} />
                            <em />
                            <i style={{ background: warning.targetHex }} />
                            {warning.targetCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
      </Modal>

      <StatusBar>
        <span>도구: {TOOLS.find((item) => item.id === tool)?.label}</span>
        <span>현재 위치: {rowNumber(currentCell.row)}행 {colNumber(currentCell.col)}열</span>
        <span>활성 코드: {activePalette.code} · {activePalette.name}</span>
        <span>{mode === 'progress' ? '진행 행 하이라이트 켜짐' : '편집 가능'}</span>
      </StatusBar>
    </div>
  );
}

function HeaderRow({ cols, colNumber, area }) {
  return (
    <div className={`header-row ${area}`} style={{ gridTemplateColumns: `repeat(${cols}, var(--cell))` }}>
      {Array.from({ length: cols }, (_, index) => (
        <div key={index}>{colNumber(index)}</div>
      ))}
    </div>
  );
}

function HeaderColumn({ rows, rowNumber, area, completedRows }) {
  return (
    <div className={`header-column ${area}`}>
      {Array.from({ length: rows }, (_, index) => {
        const number = rowNumber(index);
        return (
          <div key={index} className={completedRows.has(number) ? 'done' : ''}>
            {number}
          </div>
        );
      })}
    </div>
  );
}
