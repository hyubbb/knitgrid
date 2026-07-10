import { Button, Modal } from '../../../../../components/index.js';
import { Download, FileText, Upload } from 'lucide-react';
import { countPaintedCells, formatProjectDate } from '../../../../../app/model/knitgridModel.js';

export function LocalProjectsModal({ editor }) {
  const {
    localProjectsOpen,
    setLocalProjectsOpen,
    localProjects,
    currentLocalProjectId,
    openLocalProject,
    duplicateProject,
    renameLocalProject,
    removeLocalProject,
    saveCurrentLocalProject,
    localSaveState,
    backupInputRef,
    backupAllLocalProjects,
    restoreAllLocalProjects
  } = editor;

  if (!localProjectsOpen) return null;

  return (
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
          <Button icon={Upload} onClick={() => backupInputRef.current?.click()}>전체 불러오기</Button>
          <Button icon={Download} onClick={backupAllLocalProjects} disabled={!localProjects.length}>전체 저장</Button>
          <Button variant="primary" onClick={saveCurrentLocalProject} disabled={localSaveState === 'saving'}>현재 작업 로컬 저장</Button>
        </>
      }
    >
      <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={restoreAllLocalProjects} hidden />
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
  );
}
