'use strict';

window.TBS.buildFastbackLighting = function ({ T, shadowTexture, car, body }) {
  const shadow = new T.Mesh(
    new T.PlaneGeometry(4.2, 7),
    new T.MeshBasicMaterial({
      map: shadowTexture,
      color: 0x020708,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  car.add(shadow);
  const headlights = [];
  for (const side of [-1, 1]) {
    const lamp = new T.SpotLight(0xd7edff, 2.6, 28, 0.43, 0.6, 1.3);
    lamp.position.set(side * 0.8, 1.1, -2.92);
    lamp.target.position.set(side * 1.5, 0.05, -17);
    body.add(lamp, lamp.target);
    headlights.push(lamp);
  }
  return { headlights };
};
