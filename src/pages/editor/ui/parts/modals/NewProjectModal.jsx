import { Button, Modal } from "../../../../../components/index.js";
import { AlertTriangle } from "lucide-react";

export function NewProjectModal({ editor }) {
  const {
    pendingNewProject,
    cancelPendingNavigation,
    discardAndNavigate,
    saveAndNavigate,
    localSaveState,
    localSaveMessage,
  } = editor;

  if (!pendingNewProject) return null;

  return (
    <Modal
      open={Boolean(pendingNewProject)}
      title="저장하지 않은 변경사항"
      subtitle="현재 편집 중인 작업을 어떻게 처리할지 선택하세요."
      onClose={cancelPendingNavigation}
      variant="resize-modal"
      bodyClassName="resize-modal-body"
      titleId="new-project-modal-title"
      closeLabel="이동 취소"
      actions={
        <>
          <Button
            onClick={cancelPendingNavigation}
            disabled={localSaveState === "saving"}
          >
            취소
          </Button>
          <Button
            variant="danger"
            onClick={discardAndNavigate}
            disabled={localSaveState === "saving"}
          >
            저장하지 않고 계속
          </Button>
          <Button
            variant="primary"
            onClick={saveAndNavigate}
            disabled={localSaveState === "saving"}
          >
            저장 후 계속
          </Button>
        </>
      }
    >
      <AlertTriangle size={20} />
      <div>
        <strong>계속하면 저장하지 않은 변경사항을 잃을 수 있습니다.</strong>
        <p>
          저장 후 계속을 선택하면 이 브라우저에 현재 작업을 저장합니다. 취소하면
          현재 작업에 머무릅니다.
        </p>
        {localSaveState === "error" ? (
          <p role="alert">{localSaveMessage}</p>
        ) : null}
      </div>
    </Modal>
  );
}
