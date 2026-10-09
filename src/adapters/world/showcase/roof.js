'use strict';
window.TBS.buildQuarterRoof = function ({
  box,
  scene,
  x,
  z,
  plaster,
  stone,
  frame,
  solarMat,
  wood,
  glazing,
  wall,
  room,
  T,
  bronze,
}) {
  box(scene, x, 11.37, z + 4, 23.5, 0.23, 12.5, plaster);
  for (const side of [-1, 1]) {
    box(scene, x + side * 11.5, 11.9, z + 4, 0.15, 0.95, 12.3, stone);
    box(scene, x, 11.9, z + 4 + side * 6.1, 23, 0.95, 0.15, stone);
  }
  box(scene, x - 6, 12.25, z + 6, 6, 1.5, 4, frame);
  for (let n = 0; n < 6; n++) box(scene, x - 8.5 + n, 13.03, z + 6, 0.65, 0.1, 3.2, solarMat);
  for (let n = 0; n < 8; n++) box(scene, x + 3 + n * 0.65, 11.75, z + 7, 0.15, 0.5, 3.4, wood);
  const roofGlass = glazing.clone();
  roofGlass.opacity = 0.34;
  roofGlass.roughness = 0.24;
  wall(x + 2.2, 12.85, z + 4.8, 9, 2.6, 0.16, room);
  wall(x - 2.3, 12.85, z + 2.1, 0.16, 2.6, 5.6, stone);
  wall(x + 6.7, 12.85, z + 2.1, 0.16, 2.6, 5.6, stone);
  const studioPane = new T.Mesh(new T.PlaneGeometry(8.9, 2.45), roofGlass);
  studioPane.rotation.y = Math.PI;
  studioPane.position.set(x + 2.2, 12.85, z - 0.73);
  scene.add(studioPane);
  for (let rib = 0; rib < 7; rib++)
    wall(x - 2.25 + rib * 1.49, 12.85, z - 0.78, 0.055, 2.5, 0.08, bronze);
  const studioRoof = wall(x + 2.2, 14.27, z + 2.1, 9.8, 0.22, 6.6, frame);
  studioRoof.rotation.x = -0.06;
  for (let rib = 0; rib < 13; rib++)
    wall(x - 2.4 + rib * 0.75, 14.39, z + 2.1, 0.035, 0.04, 6.5, bronze).rotation.x = -0.06;
  for (let n = 0; n < 15; n++) {
    wall(x - 10.5 + n * 1.5, 11.95, z - 2.18, 0.035, 0.85, 0.035, bronze);
  }
  wall(x, 12.36, z - 2.18, 22, 0.045, 0.055, bronze);
  return { roofGlass };
};
