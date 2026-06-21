import { StepperControl } from 'knitgrid';

export const RowColumn = () => (
  <div className="insert-grid">
    <StepperControl label="위 행" onAdd={() => {}} onRemove={() => {}} addTitle="기준 위에 행 추가" removeTitle="기준 위 행 제거" />
    <StepperControl label="아래 행" onAdd={() => {}} onRemove={() => {}} addTitle="기준 아래에 행 추가" removeTitle="기준 아래 행 제거" />
    <StepperControl label="왼쪽 열" onAdd={() => {}} onRemove={() => {}} addTitle="기준 왼쪽에 열 추가" removeTitle="기준 왼쪽 열 제거" />
    <StepperControl label="오른쪽 열" onAdd={() => {}} onRemove={() => {}} addTitle="기준 오른쪽에 열 추가" removeTitle="기준 오른쪽 열 제거" />
  </div>
);
