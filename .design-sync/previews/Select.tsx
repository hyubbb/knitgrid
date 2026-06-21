import { Select } from 'knitgrid';

export const RowDirection = () => (
  <Select
    label="행 번호 방향"
    value="bottom-up"
    onChange={() => {}}
    options={[
      { value: 'bottom-up', label: '아래에서 위' },
      { value: 'top-down', label: '위에서 아래' }
    ]}
  />
);

export const GuideColor = () => (
  <Select
    label="보조선 색상"
    value="black"
    onChange={() => {}}
    options={[
      { value: 'black', label: '검은색' },
      { value: 'white', label: '흰색' },
      { value: 'custom', label: '커스텀' }
    ]}
  />
);
