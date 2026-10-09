'use strict';
window.TBS.buildBuildingTrim = function ({
  parent,
  h,
  box,
  x,
  z,
  w,
  d,
  seed,
  trimMat,
  roofMat,
  style,
  glassMat,
  orangeMat,
  cyanMat,
}) {
  for (let floor = 3.2; floor < h - 0.7; floor += 3.2) {
    box(parent, x, floor, z, w + 0.18, 0.12, d + 0.18, seed % 2 ? trimMat : roofMat);
  }
  if (seed % 2 === 0) {
    for (const side of [-1, 1])
      box(parent, x + side * w * 0.3, h / 2, z - d / 2 - 0.14, 0.22, h, 0.36, trimMat).castShadow =
        true;
  }
  if (style !== 'residential') {
    box(parent, x, 1.25, z - d / 2 - 0.28, 2.1, 2.3, 0.18, glassMat);
    box(parent, x, 2.56, z - d / 2 - 0.5, 4.1, 0.13, 1.15, seed % 3 === 0 ? orangeMat : cyanMat);
  }
};
