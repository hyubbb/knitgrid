import ReactCrop from 'react-image-crop';
import { Button, Modal } from '../../../../../components/index.js';

export function CropModal({ editor }) {
  const {
    cropDraft,
    closeCropDraft,
    completeCropDraft,
    updateCropDraftSelection,
    completeCropDraftSelection,
    resetCropDraft
  } = editor;

  if (!cropDraft) return null;

  return (
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
  );
}
