import { createGrid } from '../../../entities/grid/model/gridModel.js';
import { normalizePaletteItems, resolveCellDisplay } from '../../../entities/palette/model/paletteModel.js';

export const PROJECT_DB_NAME = 'knitgrid-local';
export const PROJECT_DB_VERSION = 1;
export const PROJECT_STORE_NAME = 'projects';

export const openProjectDb = () =>
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

export const runProjectStore = async (mode, action) => {
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

export const listLocalProjects = async () => {
  const items = await runProjectStore('readonly', (store) => store.getAll());
  return [...items].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
};

export const saveLocalProject = (project) =>
  runProjectStore('readwrite', (store) => store.put(project));

export const loadLocalProject = (id) =>
  runProjectStore('readonly', (store) => store.get(id));

export const deleteLocalProject = (id) =>
  runProjectStore('readwrite', (store) => store.delete(id));

export const duplicateLocalProject = async (id) => {
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

export const countPaintedCells = (projectGrid) =>
  projectGrid.reduce((sum, row) => sum + row.filter((cell) => cell.active).length, 0);

export const createProjectThumbnail = (projectGrid, projectPalette) => {
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

export const createProjectRecord = (id, data, existing = null) => {
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

export const formatProjectDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};
