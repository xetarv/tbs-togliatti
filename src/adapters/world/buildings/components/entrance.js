'use strict';
window.TBS.buildBuildingEntrance = function ({
  parent,
  style,
  h,
  seed,
  w,
  x,
  box,
  z,
  d,
  trimMat,
  parkWood,
  glassMat,
  whiteMat,
  roofMat,
  leafMats,
  body,
  curbMat,
  makeTexture,
  T,
  flat,
  grassMat,
  facade,
  orangeMat,
}) {
  if (style === 'residential') {
    // Actual projecting balconies, with slabs, glass balustrades and frames.
    for (let floor = 4; floor < h - 1; floor += 3.2) {
      const variant = seed % 3,
        balconyW = Math.min(w - 1.2, variant === 0 ? 3.2 : variant === 1 ? 4.2 : 5),
        bx =
          x +
          (variant === 0 ? (Math.round(floor / 3.2) % 2 ? 1 : -1) * Math.min(0.7, w * 0.12) : 0);
      box(parent, bx, floor, z - d / 2 - 0.7, balconyW, 0.19, 1.5, trimMat).castShadow = true;
      box(
        parent,
        bx,
        floor + 0.6,
        z - d / 2 - 1.38,
        balconyW,
        0.95,
        0.075,
        variant === 2 ? parkWood : glassMat,
      );
      box(parent, bx, floor + 1.1, z - d / 2 - 1.4, balconyW, 0.065, 0.08, whiteMat);
      for (const side of [-1, 1])
        box(
          parent,
          bx + (side * balconyW) / 2,
          floor + 0.6,
          z - d / 2 - 0.7,
          0.08,
          1.05,
          1.5,
          trimMat,
        );
      if (variant === 0)
        for (let rail = -balconyW / 2 + 0.2; rail < balconyW / 2; rail += 0.35)
          box(parent, bx + rail, floor + 0.65, z - d / 2 - 1.43, 0.035, 0.85, 0.045, trimMat);
      if ((Math.round(floor) + seed) % 3 === 0) {
        box(parent, bx, floor + 0.27, z - d / 2 - 1.05, balconyW * 0.7, 0.22, 0.38, roofMat);
        for (let plant = 0; plant < 4; plant++)
          box(
            parent,
            bx - balconyW * 0.25 + (plant * balconyW) / 6,
            floor + 0.47,
            z - d / 2 - 1.05,
            0.35,
            0.24,
            0.3,
            leafMats[(plant + seed) % 3],
          );
      }
    }
    const entranceZ = z - d / 2 - 0.38;
    if (seed % 3 === 0) {
      box(parent, x - w * 0.18, h + 1.4, z + d * 0.15, w * 0.52, 2.6, d * 0.45, body).castShadow =
        true;
      box(parent, x - w * 0.18, h + 2.79, z + d * 0.15, w * 0.58, 0.18, d * 0.5, whiteMat);
    }
    if (seed % 3 === 2) {
      for (const side of [-1, 1])
        box(parent, x + side * w * 0.3, h + 1.25, z, 0.1, 2.1, 0.1, trimMat);
      for (let slat = 0; slat < 7; slat++)
        box(
          parent,
          x - w * 0.32 + slat * w * 0.105,
          h + 2.35,
          z,
          0.12,
          0.12,
          d * 0.45,
          parkWood,
        ).castShadow = true;
    }
    box(parent, x, 1.55, entranceZ, 2.15, 2.55, 0.32, trimMat);
    box(parent, x, 1.52, entranceZ - 0.18, 1.75, 2.3, 0.045, glassMat);
    box(
      parent,
      x,
      2.98,
      entranceZ - 0.55,
      3.2,
      0.14,
      1.4,
      seed % 2 ? whiteMat : trimMat,
    ).castShadow = true;
    for (const step of [0, 1])
      box(
        parent,
        x,
        0.47 + step * 0.1,
        entranceZ - 0.45 + step * 0.2,
        2.8 - step * 0.25,
        0.16,
        0.8 - step * 0.2,
        curbMat,
      );
    const address = makeTexture(
      (p, w, h) => {
        p.fillStyle = '#123841';
        p.fillRect(0, 0, w, h);
        p.fillStyle = '#f3f1df';
        p.font = 'bold 52px Segoe UI,Arial';
        p.textAlign = 'center';
        p.fillText(String((seed % 90) + 1), w / 2, 61);
        p.font = '16px Segoe UI,Arial';
        p.fillText('КВАРТАЛ ТБС', w / 2, 91);
      },
      128,
      112,
    );
    const plate = new T.Mesh(
      new T.PlaneGeometry(0.9, 0.7875),
      new T.MeshBasicMaterial({ map: address, toneMapped: false }),
    );
    plate.rotation.y = Math.PI;
    plate.position.set(x + 1.55, 2.3, entranceZ - 0.19);
    parent.add(plate);
    if (seed % 2 === 0) {
      const roofGarden = box(parent, x, h + 0.44, z - d * 0.23, w * 0.65, 0.35, d * 0.22, curbMat);
      roofGarden.castShadow = true;
      flat(parent, x, h + 0.63, z - d * 0.23, w * 0.62, d * 0.2, grassMat);
    }
    if (seed % 3 === 1) {
      const upper = box(parent, x, h + 2, z, w * 0.7, 4, d * 0.64, body);
      upper.castShadow = true;
      facade(parent, x, h + 2, z - d * 0.32 - 0.025, w * 0.7 - 0.2, 3.6, Math.PI, seed + 1);
      box(parent, x, h + 4.12, z, w * 0.76, 0.24, d * 0.7, trimMat);
    }
  } else if (w >= 12) {
    // A glazed lobby sits proud of the main facade, under a structural canopy.
    box(parent, x, 1.7, z - d / 2 - 0.6, 6, 3.1, 1.1, glassMat);
    box(parent, x, 3.35, z - d / 2 - 1.1, 8, 0.23, 2.5, trimMat).castShadow = true;
    for (const side of [-1, 1])
      box(parent, x + side * 3.5, 1.7, z - d / 2 - 1.9, 0.15, 3.3, 0.15, whiteMat);
    for (let n = -2; n <= 2; n++)
      box(parent, x + n * 1.1, 1.7, z - d / 2 - 1.2, 0.06, 3, 0.07, trimMat);
    for (const side of [-1, 1]) {
      box(
        parent,
        x + side * (w / 2 - 0.7),
        h / 2,
        z - d / 2 - 0.22,
        0.32,
        h,
        0.48,
        whiteMat,
      ).castShadow = true;
      box(
        parent,
        x + side * (w / 2 - 0.7),
        h / 2,
        z - d / 2 - 0.49,
        0.09,
        h - 0.6,
        0.025,
        orangeMat,
      );
    }
  }
};
