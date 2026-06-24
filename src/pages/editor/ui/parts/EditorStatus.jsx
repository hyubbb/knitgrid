import { StatusBar } from '../../../../components/index.js';
import { TOOLS } from '../../../../app/model/knitgridModel.js';

export function EditorStatus({ editor }) {
  const {
    tool,
    rowNumber,
    colNumber,
    currentCell,
    activePalette,
    mode
  } = editor;

  return (
    <StatusBar>
      <span>도구: {TOOLS.find((item) => item.id === tool)?.label}</span>
      <span>현재 위치: {rowNumber(currentCell.row)}행 {colNumber(currentCell.col)}열</span>
      <span>활성 코드: {activePalette.code} · {activePalette.name}</span>
      <span>{mode === 'progress' ? '진행 행 하이라이트 켜짐' : '편집 가능'}</span>
    </StatusBar>
  );
}
