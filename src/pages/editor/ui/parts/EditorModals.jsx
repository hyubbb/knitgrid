import { EditorTextDraftModal } from './EditorTextDraftModal.jsx';
import { LocalProjectsModal } from './modals/LocalProjectsModal.jsx';
import { NewProjectModal } from './modals/NewProjectModal.jsx';
import { ResizeModal } from './modals/ResizeModal.jsx';
import { CropModal } from './modals/CropModal.jsx';
import { ImageConvertModal } from './modals/ImageConvertModal.jsx';

export function EditorModals({ editor }) {
  return (
    <>
      <LocalProjectsModal editor={editor} />
      <NewProjectModal editor={editor} />
      <ResizeModal editor={editor} />
      <CropModal editor={editor} />
      <ImageConvertModal editor={editor} />
      <EditorTextDraftModal editor={editor} />
    </>
  );
}
