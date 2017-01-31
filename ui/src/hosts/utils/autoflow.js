const cellWidth = 4;
const cellHeight = 4;
const pageWidth = 12;

export const autoflow = (layouts) => {
  let cellCount = 0;
  return layouts.reduce((cells, layout) => {
    return cells.concat(layout.cells.map((cell) => {
      const x = (cellCount * cellWidth % pageWidth);
      const y = Math.floor(cellCount * cellWidth / pageWidth) * cellHeight;
      cellCount += 1;
      return Object.assign(cell, {
        w: cellWidth,
        h: cellHeight,
        x,
        y,
      });
    }));
  }, []);
};
