import { Panel, Button } from 'knitgrid';
import { Settings2, Palette } from 'lucide-react';

export const Basic = () => (
  <Panel icon={Settings2} title="격자 설정">
    <div className="preset-grid">
      <button className="active">16 x 16</button>
      <button>24 x 24</button>
      <button>32 x 32</button>
    </div>
  </Panel>
);

export const WithAction = () => (
  <Panel icon={Palette} title="팔레트 / 코드" action={<Button>추가</Button>}>
    <div className="display-tabs">
      <button className="active">색상 + 코드</button>
      <button>색상만</button>
      <button>코드만</button>
    </div>
  </Panel>
);
