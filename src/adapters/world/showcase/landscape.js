'use strict';
window.TBS.buildQuarterLandscape = function ({
  flat,
  scene,
  x,
  z,
  plazaPaving,
  visualAssets,
  vegetationCulling,
  box,
  frame,
  T,
  plaster,
  bronze,
  wood,
  contact,
  addFlag,
}) {
  flat(scene, x - 6, 0.405, z - 7.4, 10, 8, plazaPaving);
  flat(scene, x + 5.8, 0.415, z - 10.55, 10.8, 2.45, visualAssets.material('paving', 10.8, 2.45));
  for (let n = 0; n < 42; n++)
    box(scene, x - 11.4 + n * 0.55, 0.437, z - 11.72, 0.36, 0.018, 0.035, frame);
  for (const dx of [-10, -6, 2, 10]) {
    const bollard = new T.Mesh(new T.CylinderGeometry(0.065, 0.085, 0.9, 12), frame);
    bollard.position.set(x + dx, 0.87, z - 12.05);
    bollard.castShadow = true;
    scene.add(bollard);
    box(scene, x + dx, 1.16, z - 12.05, 0.14, 0.05, 0.14, plaster);
  }
  const grate = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.028, 40), frame);
  grate.position.set(x + 13.65, 0.127, z - 5);
  scene.add(grate);
  for (let rib = -3; rib <= 3; rib++)
    box(scene, x + 13.65 + rib * 0.085, 0.145, z - 5, 0.025, 0.015, 0.5, bronze);
  for (const dx of [-10, 10]) {
    const bin = box(scene, x + dx, 0.99, z - 10.7, 0.55, 1.1, 0.55, frame);
    bin.castShadow = true;
    for (let slat = 0; slat < 5; slat++)
      box(scene, x + dx - 0.22 + slat * 0.11, 1, z - 11, 0.055, 0.86, 0.06, wood);
    box(scene, x + dx, 1.57, z - 10.7, 0.62, 0.065, 0.62, bronze);
  }
  for (const bz of [z - 10, z - 4.1]) {
    flat(scene, x - 6, 0.421, bz, 8.8, 1.5, contact);
    for (let slat = 0; slat < 6; slat++)
      box(scene, x - 6, 0.91, bz - 0.42 + slat * 0.16, 4.2, 0.11, 0.12, wood);
    for (const side of [-1, 1]) box(scene, x - 6 + side * 1.7, 0.64, bz, 0.12, 0.5, 0.85, frame);
  }
  addFlag(x - 11, z - 9);
  addFlag(x + 11, z + 10.4);
  const leafGeometry = new T.BufferGeometry();
  leafGeometry.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [0, 0, 0, -0.13, 0.19, 0, 0, 0.22, 0.045, 0.13, 0.19, 0, 0, 0.48, 0],
      3,
    ),
  );
  leafGeometry.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
  leafGeometry.computeVertexNormals();
  const foliage = new T.MeshStandardMaterial({
    color: 0x526b3b,
    roughness: 0.88,
    side: T.DoubleSide,
  });
  visualAssets.plant(scene, x - 9.3, z - 6.6, 0);
  visualAssets.plant(scene, x - 2.3, z - 9.5, 1, 0.87);
  visualAssets.plant(scene, x + 11.5, z + 9.5, 2, 1.05);
  const planting = new T.InstancedMesh(visualAssets.leaf, visualAssets.foliage, 1100),
    plantPose = new T.Object3D();
  for (let n = 0; n < 1100; n++) {
    const bed = n % 2,
      bx = x - 9.3 + bed * 7,
      bz = z - 6.5 - bed * 3,
      a = n * 2.399,
      r = Math.sqrt((n * 0.618034) % 1) * 1.05;
    plantPose.position.set(
      bx + Math.cos(a) * r,
      0.75 + ((n * 0.41421) % 1) * 0.6,
      bz + Math.sin(a) * r,
    );
    plantPose.rotation.set(n * 0.4, n * 0.73, n * 0.13);
    plantPose.scale.setScalar(0.6 + (n % 4) * 0.12);
    plantPose.updateMatrix();
    planting.setMatrixAt(n, plantPose.matrix);
    planting.setColorAt(n, new T.Color().setHSL(0.24, 0.36, 0.22 + (n % 9) * 0.015));
  }
  planting.castShadow = true;
  planting.receiveShadow = true;
  vegetationCulling.add(scene, planting, { displacement: new T.Vector3(0.022, 0, 0.014) });
  const grassGeometry = new T.BufferGeometry();
  grassGeometry.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [-0.018, 0, 0, 0.018, 0, 0, 0.045, 0.32, 0.035, 0.06, 0.58, 0.085],
      3,
    ),
  );
  grassGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  grassGeometry.computeVertexNormals();
  const grass = new T.InstancedMesh(grassGeometry, foliage, 480);
  for (let n = 0; n < 480; n++) {
    const bed = n % 2;
    plantPose.position.set(
      x - 9.3 + bed * 7 + Math.sin(n * 2.4) * 1.15,
      0.73,
      z - 6.5 - bed * 3 + Math.cos(n * 1.3) * 1.15,
    );
    plantPose.rotation.set(0, n * 2.4, 0);
    plantPose.scale.setScalar(0.6 + (n % 8) * 0.09);
    plantPose.updateMatrix();
    grass.setMatrixAt(n, plantPose.matrix);
    grass.setColorAt(n, new T.Color().setHSL(0.2, 0.32, 0.3 + (n % 6) * 0.025));
  }
  vegetationCulling.add(scene, grass);
};
