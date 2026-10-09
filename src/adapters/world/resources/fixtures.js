'use strict';

window.TBS.createStreetFixtures = function ({ mat, T, scene, box, sprite, glowTexture }) {
  const streetFixtures = [];
  function streetLight(x, z) {
    const metal = mat(0x3b5965, 0.62, 0.32);
    const pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.11, 5.5, 8), metal);
    pole.position.set(x, 2.9, z);
    scene.add(pole);
    box(scene, x - 0.65, 5.57, z, 1.45, 0.11, 0.1, metal);
    box(scene, x - 1.25, 5.48, z, 0.45, 0.11, 0.3, new T.MeshBasicMaterial({ color: 0xa5ffec }));
    const halo = sprite(scene, glowTexture, x - 1.25, 5.48, z, 3.3, 3.3, 0.1);
    const pool = new T.Mesh(
      new T.PlaneGeometry(8, 8),
      new T.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.22,
        blending: T.AdditiveBlending,
        depthWrite: false,
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x - 1.25, 0.19, z);
    scene.add(pool);
    streetFixtures.push({ x: x - 1.25, z, halo, pool });
  }
  return { streetFixtures, streetLight };
};
