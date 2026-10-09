'use strict';
window.TBS.buildQuarterPavilion = function ({
  box,
  scene,
  x,
  z,
  room,
  plaster,
  stone,
  wood,
  T,
  roofGlass,
  detailBar,
  bronze,
  frame,
  warm,
  glazing,
  dark,
}) {
  box(scene, x + 6, 0.8, z - 5.8, 9, 0.18, 5.9, room);
  box(scene, x + 6, 2.25, z - 2.95, 9, 3.75, 0.2, plaster);
  box(scene, x + 1.55, 2.25, z - 5.8, 0.18, 3.75, 5.9, stone);
  box(scene, x + 6, 1.35, z - 4.2, 5.6, 1.1, 1.1, wood);
  box(scene, x + 6, 1.94, z - 4.2, 5.8, 0.13, 1.3, plaster);
  for (const sx of [3.2, 8.7]) {
    box(scene, x + sx, 1.25, z - 6.6, 1.1, 0.3, 1.1, room);
    box(scene, x + sx, 1.65, z - 6.1, 1.1, 0.65, 0.12, wood);
  }
  box(scene, x + 6, 0.58, z - 5.8, 9.6, 0.3, 6.5, stone);
  box(scene, x + 6, 4.28, z - 5.8, 10.3, 0.4, 6.8, plaster).castShadow = true;
  const canopy = new T.Mesh(new T.BoxGeometry(4.8, 0.075, 2.1), roofGlass);
  canopy.position.set(x + 6, 3.83, z - 9.65);
  scene.add(canopy);
  for (const dx of [4, 8]) {
    detailBar(scene, [x + dx, 3.25, z - 8.8], [x + dx, 3.8, z - 10.65], 0.035, bronze);
    detailBar(scene, [x + dx, 3.85, z - 8.8], [x + dx, 3.85, z - 10.65], 0.035, bronze);
  }
  for (const dx of [5.15, 6.85]) {
    box(scene, x + dx, 2.2, z - 9.015, 0.075, 3.3, 0.1, frame);
    detailBar(
      scene,
      [x + dx + (dx < 6 ? 0.67 : -0.67), 1.7, z - 9.06],
      [x + dx + (dx < 6 ? 0.67 : -0.67), 2.3, z - 9.06],
      0.025,
      bronze,
    );
  }
  box(scene, x + 6, 3.87, z - 9.01, 1.8, 0.09, 0.15, frame);
  box(scene, x + 6, 0.76, z - 9.25, 2.1, 0.12, 0.75, stone);
  box(scene, x + 6, 0.62, z - 9.65, 2.5, 0.12, 0.55, stone);
  for (const dx of [3, 9]) {
    box(scene, x + dx, 1.16, z - 7.55, 1.25, 0.56, 0.8, wood);
    box(scene, x + dx, 1.46, z - 7.55, 1.34, 0.08, 0.88, plaster);
    const exhibit = new T.Mesh(new T.TorusGeometry(0.3, 0.055, 10, 32), bronze);
    exhibit.position.set(x + dx, 1.95, z - 7.55);
    scene.add(exhibit);
    box(scene, x + dx, 1.65, z - 7.55, 0.065, 0.4, 0.065, frame);
    box(scene, x + dx, 3.97, z - 7.6, 1.5, 0.055, 0.13, warm);
  }
  for (const [left, right] of [
    [1.61, 3.38],
    [3.38, 5.15],
    [5.15, 6],
    [6, 6.85],
    [6.85, 8.64],
    [8.64, 10.44],
  ]) {
    const door = left >= 5.15 && right <= 6.85,
      cx = x + (left + right) / 2,
      w = right - left;
    const pane = new T.Mesh(new T.PlaneGeometry(w - 0.065, door ? 2.75 : 3.2), glazing);
    pane.rotation.y = Math.PI;
    pane.position.set(cx, door ? 2.155 : 2.25, z - 9.04);
    scene.add(pane);
    for (const edge of [left, right])
      box(scene, x + edge, door ? 2.155 : 2.25, z - 9.06, 0.045, door ? 2.83 : 3.3, 0.065, frame);
    if (door) {
      for (const py of [0.75, 3.56]) box(scene, cx, py, z - 9.06, w, 0.055, 0.07, frame);
      box(scene, cx, 0.91, z - 9.08, w - 0.07, 0.23, 0.035, bronze);
      box(scene, cx, 2.05, z - 9.085, w - 0.08, 0.04, 0.014, plaster);
      box(scene, cx, 3.47, z - 9.12, 0.25, 0.065, 0.075, bronze);
    }
  }
  box(scene, x + 6, 3.68, z - 9.08, 1.86, 0.16, 0.21, frame);
  box(scene, x + 6, 3.66, z - 9.21, 0.14, 0.06, 0.045, dark);
  for (const dx of [-2.4, 2.4]) box(scene, x + 6 + dx, 3.82, z - 9.65, 0.045, 0.09, 2.1, bronze);
  box(scene, x + 6, 3.8, z - 10.7, 4.84, 0.11, 0.055, bronze);
  box(scene, x + 6, 0.832, z - 9.24, 1.7, 0.025, 0.35, bronze);
  for (let fin = 0; fin < 11; fin++)
    box(scene, x + 11.05, 2.4, z - 8.4 + fin * 0.51, 0.5, 3.5, 0.065, wood);
  const sidePane = new T.Mesh(new T.PlaneGeometry(5.7, 3.2), glazing);
  sidePane.rotation.y = Math.PI / 2;
  sidePane.position.set(x + 10.57, 2.3, z - 5.8);
  scene.add(sidePane);
};
