'use strict';
window.TBS.createFacadeLighting = function ({
  T,
  nightWindows,
  box,
  scene,
  dark,
  glowTexture,
  flat,
}) {
  const cityFacadeLights = [];
  const facadeLampMaterial = new T.MeshStandardMaterial({
    color: 0xffe0ad,
    emissive: 0xffc482,
    emissiveIntensity: 0,
    roughness: 0.5,
  });
  nightWindows.push(facadeLampMaterial);
  function addFacadeLighting(x, z, w, d, h) {
    const front = z - d / 2 - 0.32;
    for (const side of [-1, 1]) {
      const px = x + side * Math.min(w * 0.32, 7.5);
      box(scene, px, 2.8, front, 0.22, 0.5, 0.24, dark);
      box(scene, px, 2.76, front - 0.14, 0.17, 0.25, 0.035, facadeLampMaterial);
      const poolMaterial = new T.MeshBasicMaterial({
        map: glowTexture,
        color: 0xffd09c,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: T.AdditiveBlending,
      });
      flat(scene, px, 0.398, front - 0.55, 3.2, 2, poolMaterial);
      cityFacadeLights.push({ x: px, y: 2.3, z: front - 0.5, poolMaterial });
    }
    box(
      scene,
      x,
      Math.min(h - 0.5, 3.6),
      front - 0.04,
      Math.min(w * 0.6, 8),
      0.055,
      0.08,
      facadeLampMaterial,
    );
  }
  return { cityFacadeLights, addFacadeLighting };
};
