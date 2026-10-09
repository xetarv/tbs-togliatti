'use strict';
window.TBS.buildOfficeDetails = function ({
  parent,
  style,
  T,
  seed,
  box,
  x,
  h,
  z,
  d,
  w,
  trimMat,
  whiteMat,
  glassMat,
  parkWood,
  detailBar,
}) {
  if (style === 'office') {
    const officeGlass = new T.MeshPhysicalMaterial({
      color: seed % 2 ? 0x7fa5b6 : 0x8ba9a0,
      roughness: 0.16,
      metalness: 0.15,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      clearcoat: 1,
    });
    for (const side of [-1, 1]) {
      box(parent, x, h / 2 + 0.6, z + side * (d / 2 + 0.065), w - 0.5, h - 1.9, 0.035, officeGlass);
      for (let column = -w / 2 + 0.6; column < w / 2; column += 1.4)
        box(
          parent,
          x + column,
          h / 2 + 0.6,
          z + side * (d / 2 + 0.105),
          0.055,
          h - 1.9,
          0.09,
          trimMat,
        );
      for (let floor = 3; floor < h - 0.3; floor += 1.65)
        box(parent, x, floor, z + side * (d / 2 + 0.12), w - 0.45, 0.055, 0.13, whiteMat);
    }
    box(parent, x, h + 2.4, z, w * 0.62, 4.4, d * 0.56, glassMat).castShadow = true;
    box(parent, x, h + 4.66, z, w * 0.68, 0.18, d * 0.62, whiteMat);
    for (const side of [-1, 1])
      box(parent, x + side * w * 0.3, h + 2.4, z - d * 0.29, 0.13, 4.5, 0.13, trimMat);
    for (let rib = -w / 2 + 0.8; rib < w / 2; rib += 2.8)
      box(
        parent,
        x + rib,
        h / 2,
        z - d / 2 - 0.35,
        0.18,
        h - 0.8,
        0.65,
        seed % 2 ? whiteMat : trimMat,
      ).castShadow = true;
    const canopyW = Math.min(w - 1, 7),
      entrance = z - d / 2 - 0.5;
    box(parent, x, 3.1, entrance, canopyW, 0.2, 2, seed % 2 ? trimMat : parkWood).castShadow = true;
    for (const side of [-1, 1])
      detailBar(
        parent,
        [x + side * (canopyW / 2 - 0.2), 0.5, entrance - 0.8],
        [x + side * canopyW * 0.28, 3, entrance - 0.8],
        0.06,
        trimMat,
      );
    if (seed % 2 === 0) {
      box(
        parent,
        x - w * 0.22,
        h + 1.65,
        z + d * 0.15,
        w * 0.32,
        2.8,
        d * 0.36,
        officeGlass,
      ).castShadow = true;
      box(parent, x - w * 0.22, h + 3.12, z + d * 0.15, w * 0.36, 0.18, d * 0.4, whiteMat);
    }
  }
};
