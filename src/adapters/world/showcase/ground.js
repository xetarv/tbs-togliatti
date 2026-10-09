'use strict';
window.TBS.buildQuarterGround = function ({
  box,
  scene,
  x,
  z,
  brick,
  ROAD,
  roadSurface,
  roadRelief,
  roadRoughness,
  flat,
  makeTexture,
  roadInstances,
  unitPlane,
  stone,
  plaster,
  bronze,
  glazing,
  plazaPaving,
}) {
  box(scene, x, 0.76, z + 4, 23.15, 0.78, 12.15, brick);
  for (const [px, pz, w, d] of [
    [x, 30, 22, ROAD],
    [68, z, ROAD, 20],
  ]) {
    const asphalt = roadSurface(w, d);
    asphalt.bumpMap = roadRelief.clone();
    asphalt.roughnessMap = roadRoughness.clone();
    for (const map of [asphalt.bumpMap, asphalt.roughnessMap]) {
      map.repeat.set(w / 3, d / 3);
      map.needsUpdate = true;
    }
    asphalt.bumpScale = 0.006;
    asphalt.roughness = 0.96;
    asphalt.metalness = 0;
    flat(scene, px, 0.105, pz, w, d, asphalt);
  }
  const wearTexture = makeTexture(
    (c, w, h) => {
      for (const cx of [w * 0.27, w * 0.73]) {
        const g = c.createLinearGradient(cx - 15, 0, cx + 15, 0);
        g.addColorStop(0, '#121d2600');
        g.addColorStop(0.5, '#121d2626');
        g.addColorStop(1, '#121d2600');
        c.fillStyle = g;
        c.fillRect(cx - 15, 0, 30, h);
      }
    },
    128,
    256,
  );
  roadInstances(
    [
      [x, 30, Math.PI / 2],
      [68, z, 0],
    ],
    unitPlane,
    wearTexture,
    8,
    18,
  );
  scene.userData.quarterMaterials = { stone, plaster, bronze, glazing, brick, plazaPaving };
};
