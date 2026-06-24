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

export const exportAllLocalProjects = async () => ({
  app: 'knitgrid',
  kind: 'local-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  projects: await listLocalProjects()
});

export const importLocalProjects = async (backup) => {
  const projects = Array.isArray(backup) ? backup : backup?.projects;
  if (!Array.isArray(projects)) throw new Error('백업 형식이 올바르지 않습니다.');
  let count = 0;
  for (const project of projects) {
    if (!project?.id) continue;
    await saveLocalProject(project);
    count += 1;
  }
  return count;
};

export const countPaintedCells = (projectGrid) =>
  projectGrid.reduce((sum, row) => sum + row.filter((cell) => cell.active).length, 0);

export const createProjectThumbnail = (projectGrid, projectPalette) => {
  const rows = projectGrid.length;
  const cols = projectGrid[0]?.length ?? 0;
  if (!rows || !cols) {
    const blank = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><rect width="1" height="1" fill="#ffffff"/></svg>';
    return `data:image/svg+xml,${encodeURIComponent(blank)}`;
  }

  // 종횡비를 보존한다: 긴 변을 최대 64셀로 다운샘플(가로로 긴 도안이 정사각으로 찌그러지지 않도록)
  const MAX_SIDE = 64;
  const step = Math.max(1, Math.ceil(Math.max(rows, cols) / MAX_SIDE));
  const sampleRows = Math.ceil(rows / step);
  const sampleCols = Math.ceil(cols / step);
  const cells = [];

  for (let r = 0; r < sampleRows; r += 1) {
    for (let c = 0; c < sampleCols; c += 1) {
      const cell = projectGrid[Math.min(rows - 1, r * step)]?.[Math.min(cols - 1, c * step)];
      const display = cell ? resolveCellDisplay(cell, projectPalette) : null;
      const color = cell?.active && display?.visible ? display.color : '#ffffff';
      cells.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="${color}" />`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sampleCols}" height="${sampleRows}" viewBox="0 0 ${sampleCols} ${sampleRows}" shape-rendering="crispEdges">${cells.join('')}</svg>`;
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
