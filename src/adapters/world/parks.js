'use strict';

window.TBS.createParks = function ({
  T,
  scene,
  mat,
  trimMat,
  flat,
  tree,
  parkPaving,
  shrubBed,
  parkBench,
  gardenBed,
  fountainJets,
  grassMat,
  box,
  visualAssets,
  vegetationCulling,
  curbMat,
  roofMat,
  cyanMat,
  orangeMat,
  whiteMat,
  detailBar,
  dark,
  markTexture,
  pavingMat,
  nightWindows,
  signTexture,
  worldState,
  addFlag,
  createDrone,
}) {
  function park(x, z, w, d, seed) {
    flat(scene, x, 0.4, z, w - 1, d - 1, mat(0x567749));
    flat(scene, x, 0.42, z, 3, d - 1, parkPaving(3, d - 1));
    flat(scene, x, 0.43, z, w - 1, 3, parkPaving(w - 1, 3));
    const bowl = new T.Mesh(new T.CylinderGeometry(3.6, 3.8, 0.6, 40), trimMat);
    bowl.position.set(x, 0.7, z);
    bowl.receiveShadow = true;
    scene.add(bowl);
    const pool = new T.Mesh(
      new T.CylinderGeometry(3.28, 3.28, 0.08, 40),
      mat(0x46a7b7, 0.45, 0.16),
    );
    pool.position.set(x, 1.03, z);
    scene.add(pool);
    const jetMaterial = new T.MeshPhysicalMaterial({
      color: 0xb9f1ff,
      transparent: true,
      opacity: 0.58,
      roughness: 0.12,
      metalness: 0.1,
    });
    for (let n = 0; n < 7; n++) {
      const jet = new T.Mesh(
        new T.CylinderGeometry(0.045, 0.12, n === 0 ? 2.6 : 1.6, 8),
        jetMaterial,
      );
      jet.position.set(
        x + (n ? Math.cos(n) * 1.8 : 0),
        n === 0 ? 2.3 : 1.85,
        z + (n ? Math.sin(n) * 1.8 : 0),
      );
      scene.add(jet);
      fountainJets.push(jet);
    }
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        tree(x + sx * w * 0.32, z + sz * d * 0.32, seed + (sx + sz + 2), true, true);
        gardenBed(x + sx * w * 0.29, z + sz * d * 0.29, w * 0.27, d * 0.25, seed + (sx + sz + 2));
        const bx = x + sx * 5,
          bz = z + sz * 5;
        parkBench(bx, 0.9, bz);
        shrubBed(x + sx * w * 0.29, 0.48, z + sz * d * 0.29, w * 0.2, d * 0.16, seed + sx + sz);
      }
  }

  function showcaseTree(x, z) {
    visualAssets.plant(scene, x, z, Math.round(x) % 3, 0.85);
    box(scene, x, 0.36, z, 2.6, 0.5, 1.6, visualAssets.material('stone', 2.6, 0.5));
    flat(scene, x, 0.62, z, 2.35, 1.35, grassMat);
    return;
  }

  const flowerGeometry = new T.IcosahedronGeometry(0.1, 0),
    flowerMaterial = new T.MeshStandardMaterial({ roughness: 0.85 });

  function flowerBed(x, z, w, d, seed) {
    box(scene, x, 0.63, z, w, 0.4, d, curbMat);
    flat(scene, x, 0.84, z, w - 0.2, d - 0.2, grassMat);
    const buds = new T.InstancedMesh(flowerGeometry, flowerMaterial, 48),
      pose = new T.Object3D(),
      colors = [0xf7bf55, 0xee786a, 0xe8e4cb, 0xa58bce];
    for (let n = 0; n < 48; n++) {
      pose.position.set(
        x + (((n * 0.618 + seed * 0.13) % 1) - 0.5) * (w - 0.4),
        0.97 + (n % 3) * 0.04,
        z + (((n * 0.414 + seed * 0.17) % 1) - 0.5) * (d - 0.35),
      );
      pose.scale.set(1, 1.1, 1);
      pose.updateMatrix();
      buds.setMatrixAt(n, pose.matrix);
      buds.setColorAt(n, new T.Color(colors[(seed + n) % 4]));
    }
    vegetationCulling.add(scene, buds);
  }

  function gazebo(x, z) {
    const timber = mat(0x987a52, 0, 0.84);
    box(scene, x, 0.55, z, 4.7, 0.26, 4.7, curbMat);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        box(scene, x + sx * 1.85, 1.95, z + sz * 1.85, 0.15, 2.65, 0.15, timber).castShadow = true;
    const roof = new T.Mesh(new T.ConeGeometry(3.15, 0.95, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x, 3.68, z);
    roof.castShadow = true;
    scene.add(roof);
    for (const side of [-1, 1]) {
      box(scene, x + side * 1.5, 1, z, 0.65, 0.17, 3.3, timber);
      box(scene, x + side * 1.84, 1.36, z, 0.1, 0.68, 3.3, timber);
    }
    box(scene, x, 1.2, z, 1.1, 0.12, 1.1, timber);
    box(scene, x, 0.85, z, 0.2, 0.7, 0.2, trimMat);
  }

  function playground(x, z) {
    const play = new T.Group();
    play.position.set(x, 0.4, z);
    scene.add(play);
    box(play, 0, 0.06, 0, 7, 0.12, 5, mat(0x648e89));
    for (const side of [-1, 1]) box(play, side * 1.65, 1.18, -0.8, 0.14, 2.25, 0.14, orangeMat);
    box(play, -1, 1.5, -0.8, 1.65, 0.18, 1.65, whiteMat);
    for (const side of [-1, 1]) box(play, -1 + side * 0.72, 2, -0.8, 0.07, 0.85, 1.6, trimMat);
    const canopy = new T.Mesh(new T.ConeGeometry(1.45, 0.65, 4), orangeMat);
    canopy.rotation.y = Math.PI / 4;
    canopy.position.set(-1, 2.8, -0.8);
    play.add(canopy);
    const slide = box(play, -1, 0.92, 1.02, 1, 0.09, 2.5, cyanMat);
    slide.rotation.x = 0.55;
    for (const side of [-1, 1]) {
      const edge = box(play, -1 + side * 0.53, 1.04, 1.02, 0.09, 0.19, 2.5, whiteMat);
      edge.rotation.x = 0.55;
    }
    for (let step = 0; step < 5; step++)
      box(play, -1, 0.25 + step * 0.28, -1.8, 0.7, 0.07, 0.16, trimMat);
    for (const side of [-1, 1]) {
      for (const end of [-1, 1])
        detailBar(play, [2 + side * 0.8, 0.1, end * 1.1], [2 + side * 0.8, 2.1, 0], 0.06, trimMat);
      detailBar(play, [2 + side * 0.35, 0.9, 0], [2 + side * 0.35, 2.05, 0], 0.025, whiteMat);
      detailBar(
        play,
        [-1 + side * 0.42, 0.12, -1.8],
        [-1 + side * 0.42, 1.65, -1.8],
        0.035,
        trimMat,
      );
    }
    box(play, 2, 2.13, 0, 1.9, 0.12, 0.12, trimMat);
    box(play, 2, 0.86, 0, 1, 0.12, 0.5, orangeMat);
  }

  function square(x, z, w, d) {
    worldState.centralSquare = { x, z };
    park(x, z, w, d, 12);
    flat(scene, x, 0.415, z, w - 1, d - 1, pavingMat);
    const inlay = new T.Mesh(new T.RingGeometry(4.25, 4.48, 64), orangeMat);
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.set(x, 0.45, z);
    scene.add(inlay);
    box(scene, x, 0.88, z - 7.1, 3.8, 0.9, 2.5, whiteMat);
    box(scene, x, 5.12, z - 7.1, 1.55, 7.6, 0.85, dark).castShadow = true;
    const light = new T.MeshStandardMaterial({
      color: 0xdbebd9,
      emissive: 0xffce8b,
      emissiveIntensity: 0,
    });
    nightWindows.push(light);
    for (const side of [-1, 1]) {
      box(scene, x + side * 0.83, 5.12, z - 7.1, 0.06, 7.4, 0.94, orangeMat);
      const logo = new T.Mesh(
        new T.PlaneGeometry(1.25, 1.25),
        new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
      );
      logo.position.set(x, 7.6, z - 7.1 + side * 0.44);
      logo.rotation.y = side < 0 ? Math.PI : 0;
      scene.add(logo);
      addFlag(x + side * 3.1, z - 7.1);
      for (const sz of [-1, 1]) {
        box(scene, x + side * 10.5, 1.04, z + sz * 5, 0.18, 1.1, 0.18, trimMat);
        box(scene, x + side * 10.5, 1.64, z + sz * 5, 0.3, 0.15, 0.3, light);
      }
      flowerBed(x + side * 6, z - 9.9, 3.5, 1.1, side + 2);
    }
    gazebo(x - 8, z + 0.2);
    box(scene, x + 8, 0.9, z, 4.5, 0.95, 4.5, whiteMat);
    flat(scene, x + 8, 1.39, z, 4.3, 4.3, roofMat);
    const display = createDrone();
    display.group.scale.setScalar(0.64);
    display.group.position.set(x + 8, 2.05, z);
    display.group.rotation.y = 0.4;
    const plaque = new T.Mesh(
      new T.PlaneGeometry(3.7, 0.925),
      new T.MeshBasicMaterial({
        map: signTexture('ТБС · К-50', 'ТЕХНОЛОГИИ БУДУЩЕГО'),
        toneMapped: false,
      }),
    );
    plaque.rotation.y = Math.PI;
    plaque.position.set(x + 8, 1.02, z - 2.28);
    scene.add(plaque);
    const sign = new T.Mesh(
      new T.PlaneGeometry(9, 2.25),
      new T.MeshBasicMaterial({
        map: signTexture('ПЛОЩАДЬ ТБС', 'ЦЕНТР ГОРОДА · ТОЛЬЯТТИ'),
        toneMapped: false,
      }),
    );
    sign.rotation.y = Math.PI;
    sign.position.set(x, 1.7, z - 10.65);
    scene.add(sign);
  }
  return { showcaseTree, park, flowerBed, gazebo, playground, square };
};
