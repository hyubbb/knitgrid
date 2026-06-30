import 'react-image-crop/dist/ReactCrop.css';
import { useEffect, useState } from 'react';
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
  const [mobileDrawer, setMobileDrawer] = useState(null);

  useEffect(() => {
    if (!mobileDrawer) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileDrawer(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileDrawer]);

  const openMobileDrawer = (drawer) => {
    if (drawer === 'inspector') editor.setIsInspectorCollapsed(false);
    setMobileDrawer(drawer);
  };

  const closeMobileDrawer = () => setMobileDrawer(null);

  if (editor.showProjectStartScreen) {
    return <ProjectStartPage editor={editor} />;
  }

  return (
    <div
      className={`app ${editor.isInspectorCollapsed ? 'inspector-collapsed' : ''} ${mobileDrawer ? `mobile-drawer-${mobileDrawer}` : ''}`}
      onPointerUp={editor.handlePointerUp}
      onPointerLeave={editor.handlePointerUp}
    >
      <EditorTopbar editor={editor} mobileDrawer={mobileDrawer} onOpenMobileDrawer={openMobileDrawer} />
      {mobileDrawer ? (
        <button
          type="button"
          className="mobile-drawer-backdrop"
          onClick={closeMobileDrawer}
          aria-label="모바일 사이드 패널 닫기"
        />
      ) : null}
      <EditorToolRail editor={editor} onMobileAction={closeMobileDrawer} />
      <EditorCanvas editor={editor} />
      <EditorInspector editor={editor} />
      <EditorModals editor={editor} />
      <EditorStatus editor={editor} />
    </div>
  );
}
