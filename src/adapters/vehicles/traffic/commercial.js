'use strict';
window.TBS.createCommercialBodyBuilder = function ({
  T,
  mat,
  box,
  dark,
  coachwork,
  glazedQuad,
  detailBar,
  orangeMat,
  trimMat,
  markTexture,
  signTexture,
}) {
  function createCommercialBody(group, paint, variant) {
    const shuttle = variant === 'shuttle',
      top = shuttle ? 3.08 : 2.78;
    const cabinGlass = new T.MeshPhysicalMaterial({
      color: 0x86b5c3,
      metalness: 0.1,
      roughness: 0.17,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const seats = mat(shuttle ? 0x467a82 : 0x424d53, 0, 0.87);
    box(group, 0, 1.3, 0.05, 2.35, 0.15, 4.3, dark);
    const roof = coachwork(group, 2.47, 4.35, 0.1, top, paint);
    roof.position.z = 0.1;
    glazedQuad(
      group,
      [
        [-1.12, 1.47, -2.2],
        [1.12, 1.47, -2.2],
        [1.06, top - 0.08, -1.85],
        [-1.06, top - 0.08, -1.85],
      ],
      cabinGlass,
    );
    box(group, 0, 1.58, -1.8, 2.12, 0.22, 0.42, dark);
    for (const side of [-1, 1]) {
      detailBar(group, [side * 1.14, 1.4, -2.18], [side * 1.09, top, -1.84], 0.06, paint);
      box(group, side * 1.22, 1.46, 0.25, 0.14, 0.44, 3.9, paint);
      box(group, side * 1.25, 1.61, 0.14, 0.045, 0.08, 3.9, orangeMat);
      box(group, side * 1.48, 2.05, -1.8, 0.28, 0.23, 0.3, paint);
      for (let row = 0; row < (shuttle ? 3 : 1); row++) {
        const z = -1.1 + row * 1.2;
        box(group, side * 0.6, 1.56, z, 0.65, 0.16, 0.62, seats);
        box(group, side * 0.6, 1.96, z + 0.26, 0.64, 0.75, 0.13, seats);
        box(group, side * 0.6, 2.39, z + 0.26, 0.35, 0.18, 0.13, dark);
      }
      if (shuttle) {
        glazedQuad(
          group,
          [
            [side * 1.245, 1.75, -1.72],
            [side * 1.245, top - 0.12, -1.72],
            [side * 1.245, top - 0.12, 2.08],
            [side * 1.245, 1.75, 2.08],
          ],
          cabinGlass,
        );
        for (let rib = 0; rib < 4; rib++)
          box(
            group,
            side * 1.26,
            (top + 1.7) / 2,
            -1.73 + rib * 1.28,
            0.07,
            top - 1.7,
            0.055,
            paint,
          );
        for (const z of [-0.83, 0.12]) box(group, side * 1.28, 1.9, z, 0.045, 2.12, 0.045, trimMat);
        box(group, side * 1.3, 0.61, -0.36, 0.3, 0.13, 1.15, trimMat);
      } else {
        box(group, side * 1.19, 2.13, 0.96, 0.18, 1.28, 2.25, paint);
        glazedQuad(
          group,
          [
            [side * 1.25, 1.75, -1.74],
            [side * 1.25, top - 0.16, -1.74],
            [side * 1.25, top - 0.16, -0.23],
            [side * 1.25, 1.75, -0.23],
          ],
          cabinGlass,
        );
        box(group, side * 1.28, 2.18, -0.17, 0.08, 1.22, 0.1, paint);
        for (let rib = 0; rib < 4; rib++)
          box(group, side * 1.295, 2.05, 0.15 + rib * 0.49, 0.035, 0.7, 0.035, trimMat);
      }
      const logo = new T.Mesh(
        new T.PlaneGeometry(0.56, 0.56),
        new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
      );
      logo.rotation.y = (side * Math.PI) / 2;
      logo.position.set(side * 1.3, shuttle ? 1.28 : 2.26, shuttle ? 1.3 : 1);
      group.add(logo);
    }
    box(group, 0, 1.67, 2.25, 2.36, 0.4, 0.12, paint);
    if (shuttle) {
      glazedQuad(
        group,
        [
          [-1.11, 1.88, 2.28],
          [1.11, 1.88, 2.28],
          [1.11, top - 0.1, 2.28],
          [-1.11, top - 0.1, 2.28],
        ],
        cabinGlass,
      );
      const sign = new T.Mesh(
        new T.PlaneGeometry(1.95, 0.4875),
        new T.MeshBasicMaterial({
          map: signTexture('ТБС · 01', 'ЭЛЕКТРОШАТТЛ'),
          toneMapped: false,
        }),
      );
      sign.rotation.y = Math.PI;
      sign.position.set(0, top + 0.02, -2.105);
      group.add(sign);
      box(group, 0, top + 0.02, -2.02, 2.07, 0.56, 0.15, dark);
      box(group, 0, top + 0.25, 0.9, 1.55, 0.32, 1.3, trimMat);
    } else {
      box(group, 0, 2.15, 2.25, 2.33, 1.18, 0.12, paint);
      box(group, 0, 2.15, 2.32, 0.035, 1.2, 0.025, dark);
      for (const side of [-1, 1]) box(group, side * 0.21, 2.05, 2.34, 0.18, 0.05, 0.04, trimMat);
      for (const z of [-0.1, 1.6]) box(group, 0, top + 0.22, z, 2.12, 0.07, 0.08, trimMat);
    }
    group.userData.detailedBody = true;
  }
  return { createCommercialBody };
};
