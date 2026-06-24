import { Plus } from 'lucide-react';
import {
  countPaintedCells,
  createProjectThumbnail,
  formatProjectDate,
  luminance,
  normalizeHex
} from '../../../app/model/knitgridModel.js';

const FALLBACK_COLOR = '#10243a';

const getProjectPalette = (project) => project.projectData?.palette || [];

const getProjectGrid = (project) => project.projectData?.grid || [];

const getDominantProjectColor = (project) => {
  const palette = getProjectPalette(project);
  const grid = getProjectGrid(project);
  if (!palette.length) return FALLBACK_COLOR;

  const usage = new Map();
  grid.forEach((row) => {
    row.forEach((cell) => {
      if (!cell?.active) return;
      const key = cell.paletteId || cell.symbol || cell.color;
      usage.set(key, (usage.get(key) || 0) + 1);
    });
  });

  const dominant = [...palette]
    .filter((item) => item.visible !== false)
    .sort((a, b) => (usage.get(b.id) || usage.get(b.code) || 0) - (usage.get(a.id) || usage.get(a.code) || 0))[0];

  return normalizeHex(dominant?.color) || FALLBACK_COLOR;
};

const getProjectInfo = (project) => {
  const data = project.projectData || {};
  const summary = project.summary || {};
  const cols = summary.cols ?? data.cols ?? 0;
  const rows = summary.rows ?? data.rows ?? 0;
  const colorCount = summary.colorCount ?? data.palette?.length ?? 0;
  const paintedCells = summary.paintedCells ?? countPaintedCells(data.grid || []);
  return { cols, rows, colorCount, paintedCells };
};

export function ProjectStartPage({ editor }) {
  const {
    localProjects,
    openLocalProject,
    resetToNewProject,
    setStartScreenDismissed
  } = editor;

  const startNewProject = () => {
    setStartScreenDismissed(true);
    resetToNewProject();
  };

  return (
    <main className="project-start-page">
      <header className="project-start-header">
        <div>
          <strong>KnitGrid</strong>
          <span>저장된 도안 히스토리</span>
        </div>
        <button onClick={startNewProject}>
          <Plus size={18} />
          새 도안
        </button>
      </header>

      <section className="project-color-stack" aria-label="저장된 도안 선택">
        {localProjects.length === 0 ? (
          <p className="project-start-empty">아직 저장된 도안이 없습니다. “새 도안”으로 시작해 보세요.</p>
        ) : null}
        {localProjects.map((project) => {
          const color = getDominantProjectColor(project);
          const darkText = luminance(color) > 0.58;
          const info = getProjectInfo(project);
          const name = project.name || project.projectData?.projectName || '이름 없는 도안';
          const grid = getProjectGrid(project);
          const thumbnail = grid.length
            ? createProjectThumbnail(grid, getProjectPalette(project))
            : project.thumbnail;

          return (
            <button
              key={project.id}
              className={`project-color-card ${darkText ? 'dark-text' : 'light-text'}`}
              style={{ '--project-color': color }}
              onClick={() => openLocalProject(project.id)}
            >
              {thumbnail ? (
                <span className="project-card-thumb" aria-hidden="true">
                  <img src={thumbnail} alt="" />
                </span>
              ) : null}
              <span className="project-card-title">{name}</span>
              <span className="project-card-meta">
                <b>{color.toUpperCase()}</b>
                <small>대표색</small>
              </span>
              <span className="project-card-meta">
                <b>{info.cols} x {info.rows}</b>
                <small>격자</small>
              </span>
              <span className="project-card-meta">
                <b>{info.colorCount}색</b>
                <small>{info.paintedCells}칸</small>
              </span>
              <span className="project-card-meta">
                <b>{formatProjectDate(project.updatedAt)}</b>
                <small>수정일</small>
              </span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
