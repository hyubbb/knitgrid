import { Toolbar, Button, Badge } from 'knitgrid';
import { Plus, FileText, Save } from 'lucide-react';

export const CommandGroup = () => (
  <Toolbar className="command-group">
    <Badge state="saved">로컬 저장됨</Badge>
    <Button icon={Plus}>새 작업</Button>
    <Button icon={FileText}>내 작업</Button>
    <Button variant="primary" icon={Save}>로컬 저장</Button>
  </Toolbar>
);
