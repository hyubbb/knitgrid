import { Panel } from '../../../../../components/index.js';
import { Eye } from 'lucide-react';
import { InspectorViewControls } from './InspectorViewControls.jsx';

export function InspectorViewPanel({ editor, title = '보기 설정', action }) {
  return (
    <Panel className="view-panel" icon={Eye} title={title} action={action}>
      <InspectorViewControls editor={editor} showDisplayMode={false} />
    </Panel>
  );
}
