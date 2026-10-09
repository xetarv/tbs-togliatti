'use strict';
window.TBS.buildQuarterWindows = function ({
  T,
  scene,
  box,
  room,
  wood,
  plaster,
  frame,
  bronze,
  glazing,
  warm,
  stone,
  dark,
  x,
  z,
}) {
  function bay(px, py, pz, angle, w = 2.65, h = 2.35) {
    const g = new T.Group();
    g.position.set(px, py, pz);
    g.rotation.y = angle;
    scene.add(g);
    box(g, 0, 0, -1.15, w, h, 0.08, room);
    box(g, 0, -h / 2, -0.38, w, 0.08, 1.55, wood);
    box(g, 0, h / 2, -0.38, w, 0.08, 1.55, plaster);
    for (const side of [-1, 1]) box(g, (side * w) / 2, 0, -0.38, 0.07, h, 1.55, plaster);
    box(g, w * 0.18, -h * 0.29, -0.54, w * 0.42, 0.08, 0.5, wood);
    box(g, w * 0.18, -h * 0.09, -0.69, w * 0.22, h * 0.23, 0.045, frame);
    box(g, -w * 0.19, -h * 0.3, -0.48, 0.4, 0.4, 0.4, frame);
    for (const side of [-1, 1]) {
      box(g, side * (w / 2 + 0.06), 0, 0.04, 0.12, h + 0.26, 0.5, plaster);
      box(g, 0, side * (h / 2 + 0.07), 0.04, w + 0.24, 0.14, 0.5, plaster);
    }
    box(g, 0, 0, 0.39, 0.055, h, 0.04, bronze);
    box(g, 0, h * 0.18, 0.39, w, 0.045, 0.05, bronze);
    for (const side of [-1, 1]) {
      box(g, side * (w / 2 - 0.035), 0, 0.39, 0.065, h, 0.07, frame);
      box(g, 0, side * (h / 2 - 0.035), 0.39, w, 0.065, 0.07, frame);
      // Fine vertical folds give the curtains depth behind the glazing.
      for (let fold = 0; fold < 4; fold++)
        box(g, side * (w * 0.36 + fold * 0.055), 0, 0.13, 0.028, h - 0.12, 0.08, plaster);
    }
    box(g, w * 0.19, -h * 0.22, 0.18, w * 0.32, 0.07, 0.2, wood);
    box(g, w * 0.19, -h * 0.34, 0.1, 0.07, h * 0.24, 0.12, frame);
    const pane = new T.Mesh(new T.PlaneGeometry(w, h), glazing);
    pane.position.z = 0.42;
    g.add(pane);
    box(g, -w * 0.23, 0, 0.055, w * 0.18, h, 0.035, warm);
    box(g, 0, -h / 2 - 0.15, 0.32, w + 0.45, 0.12, 0.7, stone);
    // Separate rubber seals, an opening sash and a folded metal sill.
    const seal = dark;
    for (const side of [-1, 1]) {
      box(g, side * (w / 2 - 0.085), 0, 0.426, 0.018, h - 0.12, 0.022, seal);
      box(g, 0, side * (h / 2 - 0.085), 0.426, w - 0.15, 0.018, 0.022, seal);
    }
    box(g, 0.046, -h * 0.15, 0.437, 0.024, h * 0.65, 0.035, frame);
    box(g, w * 0.25, -h * 0.48, 0.437, w * 0.47, 0.027, 0.035, frame);
    box(g, w * 0.075, -h * 0.12, 0.465, 0.025, 0.19, 0.035, bronze);
    for (const sy of [-0.3, 0.25]) box(g, w / 2 - 0.095, h * sy, 0.45, 0.035, 0.105, 0.055, bronze);
    const sill = box(g, 0, -h / 2 - 0.074, 0.45, w + 0.24, 0.035, 0.47, bronze);
    sill.rotation.x = 0.075;
    box(g, 0, -h / 2 - 0.11, 0.69, w + 0.24, 0.065, 0.025, bronze);
  }
  for (let floor = 0; floor < 3; floor++) {
    const y = 2.4 + floor * 3.1;
    for (let col = 0; col < 6; col++) bay(x - 9.5 + col * 3.8, y, z - 2.08, Math.PI);
    for (let col = 0; col < 3; col++) bay(x + 11.58, y, z + 0.3 + col * 3.7, Math.PI / 2, 2.5);
    box(scene, x, y + 1.57, z + 4, 23.5, 0.16, 12.5, plaster);
  }
};
