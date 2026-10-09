'use strict';
window.TBS.buildTrafficCarLights = function ({ T, passenger, box, group, cyanMat, orangeMat }) {
  const brakeMaterial = new T.MeshBasicMaterial({ color: 0x8c160d, toneMapped: false });
  const reverseMaterial = new T.MeshBasicMaterial({ color: 0x29313b, toneMapped: false });
  for (const side of [-1, 1]) {
    if (!passenger)
      box(
        group,
        side * 0.96,
        1.18,
        -2.87,
        0.72,
        0.14,
        0.08,
        new T.MeshBasicMaterial({ color: 0xbffff1 }),
      );
    box(
      group,
      side * (passenger ? 0.73 : 0.94),
      passenger ? 1 : 1.17,
      2.86,
      passenger ? 0.6 : 0.72,
      0.12,
      0.08,
      brakeMaterial,
    );
    box(group, side * 0.47, passenger ? 0.88 : 1.17, 2.86, 0.19, 0.12, 0.08, reverseMaterial);
    if (!passenger) box(group, side * 1.32, 1.22, -0.35, 0.14, 0.11, 2.4, cyanMat);
  }
  if (!passenger) box(group, 0, 1.15, -2.88, 0.55, 0.09, 0.08, orangeMat);
  return { brakeMaterial, reverseMaterial };
};
