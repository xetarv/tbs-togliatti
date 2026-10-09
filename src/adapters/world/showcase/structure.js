'use strict';
window.TBS.buildQuarterStructure = function ({
  stone,
  box,
  scene,
  z,
  x,
  plaster,
  reflectionBuildings,
}) {
  const claddingPanels = [];
  function wall(px, py, pz, w, h, d, material = stone) {
    const m = box(scene, px, py, pz, w, h, d, material);
    m.castShadow = true;
    m.receiveShadow = true;
    const front = material === stone && Math.abs(pz - (z - 1.85)) < 0.01 && d === 0.4;
    const side = material === stone && Math.abs(px - (x + 11.3)) < 0.01 && w === 0.4;
    if (front || side) {
      const span = front ? w : d,
        cols = Math.ceil(span / 1.45),
        rows = Math.ceil(h / 0.78),
        pw = span / cols,
        ph = h / rows;
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++)
          claddingPanels.push({
            x: front ? px - span / 2 + (col + 0.5) * pw : px + 0.225,
            y: py - h / 2 + (row + 0.5) * ph,
            z: front ? pz - 0.225 : pz - span / 2 + (col + 0.5) * pw,
            w: pw - 0.025,
            h: ph - 0.025,
            side,
          });
    }
    return m;
  }
  wall(x, 5.8, z + 9.8, 23, 10.9, 0.4);
  wall(x - 11.3, 5.8, z + 4, 0.4, 10.9, 12);
  for (const [bottom, top] of [
    [0.35, 1.225],
    [3.575, 4.325],
    [6.675, 7.425],
    [9.775, 11.25],
  ]) {
    wall(x, (bottom + top) / 2, z - 1.85, 23, top - bottom, 0.4);
    wall(x + 11.3, (bottom + top) / 2, z + 4, 0.4, top - bottom, 12);
  }
  let edge = -11.5;
  for (let col = 0; col <= 6; col++) {
    const next = col < 6 ? -9.5 + col * 3.8 - 1.325 : 11.5;
    if (next > edge) wall(x + (edge + next) / 2, 5.8, z - 1.85, next - edge, 10.9, 0.4);
    edge = next + 2.65;
  }
  edge = -2;
  for (let col = 0; col <= 3; col++) {
    const next = col < 3 ? 0.3 + col * 3.7 - 1.25 : 10;
    if (next > edge) wall(x + 11.3, 5.8, z + (edge + next) / 2, 0.4, 10.9, next - edge);
    edge = next + 2.5;
  }
  for (let floor = 0; floor < 4; floor++)
    wall(x, 0.8 + floor * 3.1, z + 4, 22.7, 0.18, 11.6, plaster);
  reflectionBuildings.push({ x, z: z + 4, w: 23, d: 12, h: 11.25, seed: 0, color: 0xb6b0a0 });
  return { claddingPanels, wall };
};
