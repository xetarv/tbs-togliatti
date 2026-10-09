'use strict';
window.TBS.buildBuildingWindows = function ({
  parent,
  style,
  w,
  h,
  x,
  z,
  d,
  box,
  whiteMat,
  trimMat,
}) {
  if (style === 'residential' || style === 'office') {
    // Modelled reveals and projecting sills add depth on both street-facing walls.
    const columns = Math.max(1, Math.round((w - 0.55) / 2.8)),
      floors = Math.max(1, Math.round((h - 1.1) / 2.8));
    const cellW = (w - 0.55) / columns,
      cellH = (h - 1.1) / floors;
    for (const side of [-1, 1])
      for (let level = 0; level < floors; level++)
        for (let column = 0; column < columns; column++) {
          const wx = x - (w - 0.55) / 2 + (column + 0.5) * cellW,
            wy = 0.85 + (level + 0.5) * cellH,
            front = z + side * (d / 2 + 0.13);
          box(parent, wx, wy - cellH * 0.36, front, cellW * 0.82, 0.12, 0.3, whiteMat).castShadow =
            true;
          for (const edge of [-1, 1])
            box(
              parent,
              wx + edge * cellW * 0.38,
              wy,
              front,
              0.075,
              cellH * 0.72,
              0.23,
              style === 'office' ? trimMat : whiteMat,
            );
        }
  }
};
