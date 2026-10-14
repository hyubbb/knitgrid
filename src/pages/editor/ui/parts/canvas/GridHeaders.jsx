const labelStep = (cellSize, minimumSpacing) => {
  if (cellSize >= minimumSpacing) return 1;
  const required = Math.ceil(minimumSpacing / Math.max(1, cellSize));
  return [5, 10, 20, 50, 100].find((step) => step >= required) || required;
};

export function HeaderRow({ cols, colNumber, area, cellWidth }) {
  const step = labelStep(cellWidth, 24);
  return (
    <div
      className={`header-row ${area}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, var(--cell-w, var(--cell)))`,
      }}
    >
      {Array.from({ length: cols }, (_, index) => {
        const number = colNumber(index);
        return (
          <div key={index} title={`${number}열`}>
            {step === 1 || number % step === 0 ? number : ""}
          </div>
        );
      })}
    </div>
  );
}

export function HeaderColumn({
  rows,
  rowNumber,
  area,
  completedRows,
  showCompleted,
  cellHeight,
}) {
  const step = labelStep(cellHeight, 14);
  return (
    <div className={`header-column ${area}`}>
      {Array.from({ length: rows }, (_, index) => {
        const number = rowNumber(index);
        return (
          <div
            key={index}
            title={`${number}행`}
            className={showCompleted && completedRows.has(number) ? "done" : ""}
          >
            {step === 1 || number % step === 0 ? number : ""}
          </div>
        );
      })}
    </div>
  );
}
