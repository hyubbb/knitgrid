import { Modal, Button } from 'knitgrid';
import { AlertTriangle } from 'lucide-react';

export const Confirm = () => (
  <Modal
    open
    title="새 작업 시작"
    subtitle="현재 편집 중인 작업을 어떻게 처리할지 선택하세요."
    onClose={() => {}}
    variant="resize-modal"
    bodyClassName="resize-modal-body"
    titleId="demo-modal-title"
    actions={
      <>
        <Button>취소</Button>
        <Button variant="danger">저장하지 않고 새로 만들기</Button>
        <Button variant="primary">현재 작업 저장 후 새로 만들기</Button>
      </>
    }
  >
    <AlertTriangle size={20} />
    <div>
      <strong>현재 작업이 초기화됩니다.</strong>
      <p>로컬 저장을 선택하면 이 브라우저의 내 작업 목록에 저장한 뒤 새 빈 격자로 전환합니다.</p>
    </div>
  </Modal>
);
