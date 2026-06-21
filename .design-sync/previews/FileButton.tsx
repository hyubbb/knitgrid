import { Toolbar, FileButton } from 'knitgrid';
import { ImagePlus } from 'lucide-react';

export const Upload = () => (
  <Toolbar className="command-group">
    <FileButton icon={ImagePlus} accept="image/png,image/jpeg,image/webp" onFiles={() => {}}>
      이미지
    </FileButton>
  </Toolbar>
);
