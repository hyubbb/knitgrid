import { Toolbar, IconButton } from 'knitgrid';
import { Undo2, Redo2, ArrowRight } from 'lucide-react';

export const InToolbar = () => (
  <Toolbar className="command-group">
    <IconButton icon={Undo2} label="되돌리기" />
    <IconButton icon={Redo2} label="다시 실행" />
  </Toolbar>
);

export const IconToggle = () => (
  <div className="panel-title">
    <strong>격자 설정</strong>
    <IconButton className="icon-toggle" icon={ArrowRight} label="격자 설정 접기" />
  </div>
);
