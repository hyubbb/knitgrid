import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * 도안 이동용 방향 패드. 상/하/좌/우 버튼 + 중앙 라벨.
 * @param {object} props
 * @param {(dr:number, dc:number) => void} props.onMove - (행델타, 열델타)
 * @param {React.ReactNode} props.centerLabel
 * @param {boolean} [props.disabled]
 * @param {number} [props.iconSize=15]
 */
export function MovePad({ onMove, centerLabel, disabled, iconSize = 15 }) {
  return (
    <div className="move-pad">
      <span />
      <button onClick={() => onMove(-1, 0)} disabled={disabled} title="도안 위로 이동"><ArrowUp size={iconSize} /></button>
      <span />
      <button onClick={() => onMove(0, -1)} disabled={disabled} title="도안 왼쪽으로 이동"><ArrowLeft size={iconSize} /></button>
      <div>{centerLabel}</div>
      <button onClick={() => onMove(0, 1)} disabled={disabled} title="도안 오른쪽으로 이동"><ArrowRight size={iconSize} /></button>
      <span />
      <button onClick={() => onMove(1, 0)} disabled={disabled} title="도안 아래로 이동"><ArrowDown size={iconSize} /></button>
      <span />
    </div>
  );
}
