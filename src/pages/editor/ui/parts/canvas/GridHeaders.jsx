export function HeaderRow({ cols, colNumber, area }) {
  return (
    <div
      className={`header-row ${area}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, var(--cell-w, var(--cell)))`,
      }}
    >
      {Array.from({ length: cols }, (_, index) => (
        <div key={index}>{colNumber(index)}</div>
      ))}
    </div>
  );
}

export function HeaderColumn({ rows, rowNumber, area, completedRows, showCompleted }) {
  return (
    <div className={`header-column ${area}`}>
      {Array.from({ length: rows }, (_, index) => {
        const number = rowNumber(index);
        return (
          <div
            key={index}
            className={showCompleted && completedRows.has(number) ? "done" : ""}
          >
            {number}
          </div>
        );
      })}
    </div>
  );
}
