import { FolderOpen, Grid3X3, Palette, Plus, Sparkles } from "lucide-react";
import {
  countPaintedCells,
  createProjectThumbnail,
  formatProjectDate,
  luminance,
  normalizeHex,
} from "../../../app/model/knitgridModel.js";

const FALLBACK_COLOR = "#10243a";

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
    .sort(
      (a, b) =>
        (usage.get(b.id) || usage.get(b.code) || 0) -
        (usage.get(a.id) || usage.get(a.code) || 0),
    )[0];

  return normalizeHex(dominant?.color) || FALLBACK_COLOR;
};

const getProjectInfo = (project) => {
  const data = project.projectData || {};
  const summary = project.summary || {};
  const cols = summary.cols ?? data.cols ?? 0;
  const rows = summary.rows ?? data.rows ?? 0;
  const colorCount = summary.colorCount ?? data.palette?.length ?? 0;
  const paintedCells =
    summary.paintedCells ?? countPaintedCells(data.grid || []);
  return { cols, rows, colorCount, paintedCells };
};

export function ProjectStartPage({ editor }) {
  const {
    localProjects,
    openLocalProject,
    resetToNewProject,
    setStartScreenDismissed,
  } = editor;

  const startNewProject = () => {
    setStartScreenDismissed(true);
    resetToNewProject();
  };

  return (
    <main className="project-start-page">
      <header className="project-start-header">
        <div className="project-start-brand flex items-center gap-2">
          <span className="project-start-mark" aria-hidden="true">
            <Grid3X3 size={18} />
          </span>
          <div>
            <strong>KnitGrid</strong>
          </div>
        </div>
        <button className="project-start-primary" onClick={startNewProject}>
          <Plus size={18} />새 도안 만들기
        </button>
      </header>

      <section className="project-start-hero hidden" aria-label="KnitGrid 소개">
        <div>
          <p className="project-eyebrow">
            <Sparkles size={14} /> Pattern workspace
          </p>
          <h1>
            색과 격자를 한눈에 관리하는
            <br />
            차분한 니팅 차트 에디터
          </h1>
          <p className="project-hero-copy">
            저장된 도안을 바로 이어 열고, 새 도안은 추천 격자에서 빠르게
            시작하세요. 편집 화면은 캔버스가 중심이 되도록 더 밝고 정돈된 밀도로
            다듬었습니다.
          </p>
        </div>
        <div className="project-hero-stats" aria-hidden="true">
          <span>
            <Palette size={16} /> 팔레트 기반
          </span>
          <span>
            <Grid3X3 size={16} /> 10칸 가이드
          </span>
          <span>
            <FolderOpen size={16} /> 로컬 저장
          </span>
        </div>
      </section>

      <section className="project-color-stack" aria-label="저장된 도안 선택">
        {localProjects.length === 0 ? (
          <div className="project-start-empty">
            <span className="project-empty-icon">
              <FolderOpen size={22} />
            </span>
            <strong>아직 저장된 도안이 없습니다</strong>
            <p>
              새 도안을 만들면 이곳에 대표색과 크기, 최근 수정일이 카드로
              쌓입니다.
            </p>
            <button onClick={startNewProject}>
              <Plus size={16} /> 첫 도안 시작하기
            </button>
          </div>
        ) : null}
        {localProjects.map((project) => {
          const color = getDominantProjectColor(project);
          const darkText = luminance(color) > 0.58;
          const info = getProjectInfo(project);
          const name =
            project.name ||
            project.projectData?.projectName ||
            "이름 없는 도안";
          const grid = getProjectGrid(project);
          const thumbnail = grid.length
            ? createProjectThumbnail(grid, getProjectPalette(project))
            : project.thumbnail;

          return (
            <button
              key={project.id}
              className={`project-color-card ${darkText ? "dark-text" : "light-text"}`}
              style={{ "--project-color": color }}
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
                <b>
                  {info.cols} x {info.rows}
                </b>
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
