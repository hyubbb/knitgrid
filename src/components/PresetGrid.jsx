/**
 * 프리셋 격자 크기 버튼 그리드.
 * @param {object} props
 * @param {Array<{label:string,rows:number,cols:number}>} props.presets
 * @param {number} props.rows - 현재 행
 * @param {number} props.cols - 현재 열
 * @param {(rows:number, cols:number) => void} props.onSelect
 */
export function PresetGrid({ presets, rows, cols, onSelect }) {
  return (
    <div className="preset-grid">
      {presets.map((preset) => (
        <button
          key={preset.label}
          className={rows === preset.rows && cols === preset.cols ? 'active' : ''}
          onClick={() => onSelect(preset.rows, preset.cols)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
