import { Toggle } from 'knitgrid';
import { Eye, EyeOff } from 'lucide-react';

// .palette-visibility-toggle 컨텍스트(팔레트 행 가시성 토글)
export const Visible = () => (
  <div className="palette-row">
    <Toggle pressed className="palette-visibility-toggle" iconOn={EyeOff} iconOff={Eye} onChange={() => {}} label="숨기기">
      <span>숨김</span>
    </Toggle>
  </div>
);

export const Hidden = () => (
  <div className="palette-row hidden-color">
    <Toggle pressed={false} className="palette-visibility-toggle" pressedClassName="is-hidden" iconOn={EyeOff} iconOff={Eye} onChange={() => {}} label="표시">
      <span>표시</span>
    </Toggle>
  </div>
);
