'use strict';
window.TBS.buildQuarterLighting = function ({
  T,
  x,
  z,
  scene,
  box,
  frame,
  contact,
  flat,
  glowTexture,
  glazing,
  bronze,
}) {
  const lightStripMaterial = new T.MeshStandardMaterial({
    color: 0xffe0b6,
    emissive: 0xffc887,
    emissiveIntensity: 0.1,
    roughness: 0.5,
  });
  const entranceLight = new T.PointLight(0xffd2a0, 0, 15, 2);
  entranceLight.position.set(x + 6, 3.7, z - 7);
  scene.add(entranceLight);
  const windowLight = new T.PointLight(0xffddb2, 0, 12, 2);
  windowLight.position.set(x + 5.5, 2.9, z - 4.8);
  scene.add(windowLight);
  const bounce = new T.PointLight(0xe8d6b3, 0, 20, 2);
  bounce.position.set(x + 10, 2.6, z - 10.8);
  scene.add(bounce);
  box(scene, x + 6, 4.045, z - 8.15, 8.5, 0.045, 0.13, lightStripMaterial);
  for (const px of [x - 7.8, x - 4.4]) {
    box(scene, px, 0.94, z - 10.8, 0.2, 1.05, 0.2, frame);
    box(scene, px, 1.34, z - 10.8, 0.23, 0.11, 0.23, lightStripMaterial);
  }
  const shade = contact.clone();
  shade.opacity = 0.45;
  flat(scene, x + 6, 0.415, z - 7.6, 10.3, 3.1, shade);
  const poolMaterial = new T.MeshBasicMaterial({
    map: glowTexture,
    color: 0xffc58f,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });
  flat(scene, x + 6, 0.427, z - 8.4, 10, 4.5, poolMaterial);
  scene.userData.quarterLighting = {
    x,
    z,
    entranceLight,
    windowLight,
    bounce,
    lightStripMaterial,
    poolMaterial,
    reflective: [glazing, bronze, frame],
  };
};
