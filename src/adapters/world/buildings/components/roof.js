'use strict';
window.TBS.buildBuildingRoof = function ({
  parent,
  style,
  T,
  x,
  w,
  h,
  z,
  d,
  wedge,
  roofMat,
  box,
  glassMat,
  trimMat,
  whiteMat,
  solarMat,
}) {
  if (style === 'factory') {
    const monitors = new T.Group();
    monitors.position.set(x + w * 0.27, h + 0.25, z);
    parent.add(monitors);
    for (let section = 0; section < 3; section++) {
      const front = -d * 0.4 + section * d * 0.27,
        back = front + d * 0.23;
      wedge(monitors, w * 0.36, front, back, 0, 0.16, 1.7, roofMat);
      box(monitors, 0, 0.95, back + 0.015, w * 0.32, 1.25, 0.06, glassMat);
    }
    for (let n = 0; n < 3; n++) {
      const vent = new T.Mesh(new T.CylinderGeometry(0.48, 0.58, 1.4, 12), trimMat);
      vent.position.set(x - w * 0.29, h + 0.85, z - d * 0.25 + n * 2.5);
      parent.add(vent);
      box(parent, x - w * 0.29, h + 1.61, z - d * 0.25 + n * 2.5, 1.4, 0.13, 1.4, whiteMat);
    }
    for (const side of [-1, 1])
      for (let rib = -d / 2 + 0.6; rib < d / 2; rib += 1.2)
        box(parent, x + side * (w / 2 + 0.09), h / 2, rib + z, 0.12, h - 0.3, 0.065, trimMat);
  } else {
    for (let row = 0; row < 3; row++) {
      const panel = box(
        parent,
        x + w * 0.2,
        h + 0.8,
        z + d * 0.15 + row * 1.35,
        w * 0.42,
        0.08,
        1.12,
        solarMat,
      );
      panel.rotation.x = -0.22;
      box(parent, x + w * 0.2, h + 0.64, z + d * 0.15 + row * 1.35, 0.12, 0.36, 1.05, trimMat);
    }
  }
};
