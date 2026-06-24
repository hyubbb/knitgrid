import 'react-image-crop/dist/ReactCrop.css';
import { useKnitGridEditor } from '../../../app/model/useKnitGridEditor.js';
import { EditorCanvas } from './parts/EditorCanvas.jsx';
import { EditorInspector } from './parts/EditorInspector.jsx';
import { EditorModals } from './parts/EditorModals.jsx';
import { EditorStatus } from './parts/EditorStatus.jsx';
import { EditorToolRail } from './parts/EditorToolRail.jsx';
import { EditorTopbar } from './parts/EditorTopbar.jsx';
import { ProjectStartPage } from './ProjectStartPage.jsx';

export function EditorPage() {
  const editor = useKnitGridEditor();

  if (editor.showProjectStartScreen) {
    return <ProjectStartPage editor={editor} />;
  }

  return (
    <div
      className={`app ${editor.isInspectorCollapsed ? 'inspector-collapsed' : ''}`}
      onPointerUp={editor.handlePointerUp}
      onPointerLeave={editor.handlePointerUp}
    >
      <EditorTopbar editor={editor} />
      <EditorToolRail editor={editor} />
      <EditorCanvas editor={editor} />
      <EditorInspector editor={editor} />
      <EditorModals editor={editor} />
      <EditorStatus editor={editor} />
    </div>
  );
}
