'use strict';
window.TBS.buildStorefront = function ({
  parent,
  w,
  style,
  z,
  d,
  box,
  x,
  glassMat,
  whiteMat,
  T,
  shopSigns,
  seed,
  trimMat,
  orangeMat,
}) {
  if (w < 12 && style !== 'residential') {
    for (const side of [-1, 1]) {
      const front = z + side * (d / 2 + 0.22);
      box(parent, x, 1.65, front, w - 0.45, 2.25, 0.06, glassMat);
      for (const mullion of [-1, 0, 1])
        box(
          parent,
          x + (mullion * (w - 0.6)) / 3,
          1.65,
          front + side * 0.05,
          0.06,
          2.3,
          0.08,
          whiteMat,
        );
      const sign = new T.Mesh(
        new T.PlaneGeometry(w - 0.55, ((w - 0.55) * 96) / 512),
        new T.MeshBasicMaterial({ map: shopSigns[seed % 3], toneMapped: false }),
      );
      sign.rotation.y = side < 0 ? Math.PI : 0;
      sign.position.set(x, 3.12, front + side * 0.1);
      parent.add(sign);
      box(
        parent,
        x,
        3.8,
        front + side * 0.32,
        w + 0.1,
        0.13,
        0.9,
        style === 'office' ? trimMat : orangeMat,
      ).castShadow = true;
    }
  }
};
