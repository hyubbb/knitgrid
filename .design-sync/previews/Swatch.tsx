import { Swatch } from 'knitgrid';

export const Palette = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <Swatch color="#1d2329" code="H7" title="H7 검정" onClick={() => {}} />
    <Swatch color="#fbfaf7" code="H2" title="H2 아이보리" active onClick={() => {}} />
    <Swatch color="#ef7897" code="E15" title="E15 분홍" onClick={() => {}} />
    <Swatch color="#6fb7dc" code="B4" title="B4 하늘" onClick={() => {}} />
    <Swatch color="#64a884" code="G9" title="G9 초록" onClick={() => {}} />
  </div>
);
