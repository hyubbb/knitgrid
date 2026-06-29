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
      <span>{mode === 'edit' ? '편집 가능' : mode === 'preview' ? '미리보기 검수 중' : '진행 체크 메모 가능'}</span>
    </StatusBar>
  );
}
