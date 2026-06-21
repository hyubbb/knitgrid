import { Toolbar, Button } from 'knitgrid';
import { Save, Plus, FileText, Sparkles } from 'lucide-react';

// KnitGrid 버튼은 컨테이너 컨텍스트(.command-group / .image-modal-actions)에서 스타일된다.
export const CommandBar = () => (
  <Toolbar className="command-group">
    <Button icon={Plus}>새 작업</Button>
    <Button icon={FileText}>내 작업</Button>
    <Button variant="primary" icon={Save}>로컬 저장</Button>
  </Toolbar>
);

export const ModalActions = () => (
  <div className="image-modal-actions">
    <Button>취소</Button>
    <Button variant="danger">저장하지 않고 새로 만들기</Button>
    <Button variant="primary">현재 작업 저장 후 새로 만들기</Button>
  </div>
);

export const Wide = () => (
  <Button wide icon={Sparkles}>격자 크기 적용</Button>
);
