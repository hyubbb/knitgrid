import { Minus, Plus } from 'lucide-react';

/**
 * -/라벨/+ 스테퍼. 행·열 추가/제거 컨트롤.
 * @param {object} props
 * @param {React.ReactNode} props.label
 * @param {() => void} props.onAdd
 * @param {() => void} props.onRemove
 * @param {boolean} [props.addDisabled]
 * @param {boolean} [props.removeDisabled]
 * @param {string} [props.addTitle]
 * @param {string} [props.removeTitle]
 * @param {number} [props.iconSize=14]
 */
export function StepperControl({ label, onAdd, onRemove, addDisabled, removeDisabled, addTitle, removeTitle, iconSize = 14 }) {
  return (
    <div className="insert-control">
      <button className="remove" onClick={onRemove} disabled={removeDisabled} title={removeTitle} aria-label={removeTitle}><Minus size={iconSize} /></button>
      <span>{label}</span>
      <button onClick={onAdd} disabled={addDisabled} title={addTitle} aria-label={addTitle}><Plus size={iconSize} /></button>
    </div>
  );
}
