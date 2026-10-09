'use strict';
window.TBS.buildQuarterBranding = function ({
  T,
  signTexture,
  x,
  z,
  scene,
  box,
  frame,
  architecturalPanel,
  factoryTexture,
  droneTexture,
  bronze,
}) {
  const title = new T.Mesh(
    new T.PlaneGeometry(8.8, 2.2),
    new T.MeshBasicMaterial({
      map: signTexture('ЦЕНТР ТБС', 'ТРАНСПОРТ БУДУЩЕГО · САМАРА'),
      toneMapped: false,
    }),
  );
  title.rotation.y = Math.PI;
  title.position.set(x + 5.8, 5.35, z - 8.9);
  scene.add(title);
  box(scene, x + 5.8, 5.35, z - 8.8, 9, 2.35, 0.2, frame);
  const sideTitle = new T.Mesh(
    new T.PlaneGeometry(6.2, 1.55),
    new T.MeshBasicMaterial({
      map: signTexture('ЦЕНТР ТБС', 'САМАРА · ТЕХНОЛОГИИ'),
      toneMapped: false,
    }),
  );
  sideTitle.rotation.y = Math.PI / 2;
  sideTitle.position.set(x + 11.4, 5.25, z - 5.65);
  scene.add(sideTitle);
  architecturalPanel(
    scene,
    x + 11.86,
    6.1,
    z + 5,
    8,
    5,
    Math.PI / 2,
    factoryTexture,
    'ТБС',
    'САМАРА',
  );
  architecturalPanel(
    scene,
    x - 5.9,
    2.1,
    z - 2.6,
    6,
    3.2,
    Math.PI,
    droneTexture,
    'ТБС',
    'ТЕХНОЛОГИИ',
  );
  for (let fin = 0; fin < 11; fin++)
    box(scene, x - 11.6 + fin * 0.32, 5.85, z - 2.65, 0.08, 10.4, 0.55, bronze);
};
