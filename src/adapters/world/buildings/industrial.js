'use strict';
window.TBS.createIndustrialBuilder = function ({
  mat,
  reflectionBuildings,
  box,
  scene,
  T,
  trimMat,
  nightWindows,
  dark,
  whiteMat,
  glassMat,
  signTexture,
  detailBar,
  addFacadeLighting,
  flat,
  roadSurface,
  orangeMat,
  markTexture,
  roofMat,
  createDrone,
  addFlag,
}) {
  const industrialSites = [];
  function industrialYard(x, z, w, d, logistics) {
    industrialSites.push({ x, z, logistics });
    const steel = mat(logistics ? 0x577985 : 0x8a9595, 0.45, 0.52),
      hazard = mat(0xe1a23c),
      rubber = mat(0x202a2e),
      wood = mat(0x9e8056);
    const front = z + d / 2 - 9.7,
      rear = z + d / 2 - 1.2,
      buildingZ = (front + rear) / 2;
    reflectionBuildings.push({
      x,
      z: buildingZ,
      w: w - 3,
      d: rear - front,
      h: 8,
      seed: 3,
      color: 0x748a91,
    });
    box(scene, x, 3.9, buildingZ, w - 3, 7, 8.5, steel).castShadow = true;
    const arch = new T.CylinderGeometry(
      (w - 3) / 2,
      (w - 3) / 2,
      8.8,
      28,
      1,
      true,
      -Math.PI / 2,
      Math.PI,
    );
    arch.rotateX(-Math.PI / 2);
    arch.scale(1, 0.25, 1);
    const roof = new T.Mesh(
      arch,
      new T.MeshStandardMaterial({
        color: 0x83949a,
        metalness: 0.55,
        roughness: 0.4,
        side: T.DoubleSide,
      }),
    );
    roof.position.set(x, 7.4, buildingZ);
    roof.castShadow = true;
    scene.add(roof);
    const radius = (w - 3) / 2,
      gableShape = new T.Shape();
    gableShape.moveTo(-radius, 0);
    for (let n = 0; n <= 24; n++) {
      const angle = Math.PI - (n * Math.PI) / 24;
      gableShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.25);
    }
    gableShape.closePath();
    for (const side of [-1, 1]) {
      const gable = new T.Mesh(new T.ShapeGeometry(gableShape), steel);
      gable.position.set(x, 7.4, buildingZ + side * 4.26);
      gable.rotation.y = side < 0 ? Math.PI : 0;
      scene.add(gable);
    }
    for (let rib = -w / 2 + 1.7; rib < w / 2 - 1; rib += 1.2)
      box(scene, x + rib, 4.1, front - 0.06, 0.08, 6.5, 0.13, trimMat);
    const lampMat = new T.MeshStandardMaterial({
      color: 0xc9d7c9,
      emissive: 0xffdf9b,
      emissiveIntensity: 0,
    });
    nightWindows.push(lampMat);
    for (const side of [-1, 1]) {
      const doorX = x + side * 5.1;
      box(scene, doorX, 2.8, front - 0.15, 6.2, 4.7, 0.13, dark);
      for (let row = 0; row < 10; row++)
        box(scene, doorX, 1 + row * 0.39, front - 0.24, 5.9, 0.35, 0.08, steel);
      for (const edge of [-1, 1])
        box(scene, doorX + edge * 3.15, 2.7, front - 0.27, 0.16, 4.9, 0.27, whiteMat);
      box(scene, doorX, 5.35, front - 0.32, 6.6, 0.18, 0.8, trimMat).castShadow = true;
      box(scene, doorX, 5.21, front - 0.62, 3.7, 0.08, 0.16, lampMat);
      box(scene, doorX, 6.32, front - 0.13, 6, 0.86, 0.07, glassMat);
      for (let bar = 0; bar < 6; bar++)
        box(scene, doorX - 2.5 + bar, 6.32, front - 0.19, 0.045, 0.9, 0.08, whiteMat);
      for (const edge of [-1, 1]) {
        box(scene, doorX + edge * 3.3, 0.97, front - 1, 0.2, 1.1, 0.2, hazard);
        box(scene, doorX + edge * 3.3, 1.02, front - 1, 0.21, 0.2, 0.21, rubber);
      }
    }
    const name = new T.Mesh(
      new T.PlaneGeometry(14, 3.5),
      new T.MeshBasicMaterial({
        map: signTexture(
          logistics ? 'ТБС · ЛОГИСТИКА' : 'ТБС · СБОРОЧНЫЙ ЦЕХ',
          'ПРОМЫШЛЕННЫЙ КВАРТАЛ',
        ),
        toneMapped: false,
      }),
    );
    name.rotation.y = Math.PI;
    name.position.set(x, 8.5, front - 0.3);
    scene.add(name);
    // Service equipment stays inside the fenced site and above the roof line.
    for (const side of [-1, 1]) {
      const equipmentY = 7.4 + Math.sqrt(Math.max(0, radius * radius - 49)) * 0.25 + 0.7;
      box(scene, x + side * 7, equipmentY, buildingZ, 2.4, 1.1, 2, steel).castShadow = true;
      for (let grille = 0; grille < 8; grille++)
        box(
          scene,
          x + side * 7 - 0.9 + grille * 0.26,
          equipmentY,
          buildingZ - 1.02,
          0.1,
          0.8,
          0.035,
          dark,
        );
      detailBar(
        scene,
        [x + side * 7, equipmentY, buildingZ + 1],
        [x + side * 7, equipmentY, rear - 0.1],
        0.16,
        trimMat,
      );
      box(scene, x + side * 5.1, 0.62, front - 1.45, 5.8, 0.4, 2.5, trimMat).receiveShadow = true;
      for (let stripe = 0; stripe < 9; stripe++)
        box(
          scene,
          x + side * 5.1 - 2.6 + stripe * 0.62,
          0.64,
          front - 2.73,
          0.3,
          0.35,
          0.035,
          stripe % 2 ? rubber : hazard,
        );
      for (const edge of [-1, 1])
        box(scene, x + side * 5.1 + edge * 2.4, 1.04, front - 0.42, 0.22, 1.2, 0.18, rubber);
    }
    for (let rung = 0; rung < 15; rung++)
      box(scene, x - w / 2 + 2, 1 + rung * 0.46, front - 0.28, 0.7, 0.055, 0.14, trimMat);
    for (const side of [-1, 1])
      box(scene, x - w / 2 + 2 + side * 0.38, 4.25, front - 0.23, 0.06, 7.4, 0.09, trimMat);
    const yardFront = z - d / 2;
    addFacadeLighting(x, buildingZ, w - 3, rear - front, 7);
    flat(
      scene,
      x,
      0.405,
      (yardFront + front) / 2,
      w - 1,
      front - yardFront,
      roadSurface(w, front - yardFront),
    );
    for (const side of [-1, 1]) {
      for (let pz = yardFront + 0.5; pz < rear; pz += 2.5) {
        box(scene, x + side * (w / 2 - 0.4), 1.65, pz, 0.08, 2.6, 0.08, trimMat);
      }
      for (const y of [0.8, 1.6, 2.6])
        box(scene, x + side * (w / 2 - 0.4), y, z, 0.055, 0.055, d - 0.8, trimMat);
      box(scene, x + side * (w / 4 + 2), 1.1, yardFront + 0.4, w / 2 - 4, 1.5, 0.14, trimMat);
    }
    // A staffed-looking checkpoint and a striped vehicle barrier.
    box(scene, x - 5, 1.65, yardFront + 2.2, 2.4, 2.5, 2.5, steel);
    box(scene, x - 5, 2, yardFront + 0.91, 1.85, 1, 0.035, glassMat);
    box(scene, x - 5, 3, yardFront + 2.2, 2.75, 0.2, 2.8, whiteMat);
    box(scene, x + 3.5, 1.05, yardFront + 1, 0.35, 1.5, 0.45, orangeMat);
    for (let stripe = 0; stripe < 12; stripe++)
      box(
        scene,
        x - 3 + stripe * 0.55,
        1.58,
        yardFront + 1,
        0.55,
        0.13,
        0.13,
        stripe % 2 ? whiteMat : orangeMat,
      );
    for (let n = 0; n < (logistics ? 3 : 2); n++) {
      const cx = x + w / 2 - 4,
        cz = yardFront + 5 + (n % 2) * 4.1,
        cy = 0.45 + (n === 2 ? 2.65 : 0);
      box(scene, cx, cy + 1.25, cz, 5.2, 2.5, 3, steel).castShadow = true;
      for (let rib = 0; rib < 12; rib++)
        box(scene, cx - 2.4 + rib * 0.43, cy + 1.25, cz - 1.55, 0.08, 2.3, 0.12, trimMat);
      for (const edge of [-1, 1])
        box(scene, cx + edge * 2.6, cy + 1.25, cz - 1.57, 0.11, 2.55, 0.13, hazard);
      const badge = new T.Mesh(
        new T.PlaneGeometry(0.85, 0.85),
        new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
      );
      badge.rotation.y = Math.PI;
      badge.position.set(cx, cy + 1.4, cz - 1.64);
      scene.add(badge);
    }
    if (!logistics)
      for (let n = 0; n < 2; n++) {
        const px = x - w / 2 + 4,
          pz = yardFront + 6 + n * 5.7;
        box(scene, px, 0.69, pz, 4.2, 0.55, 4.2, whiteMat);
        flat(scene, px, 0.98, pz, 4, 4, roofMat);
        const drone = createDrone();
        drone.group.scale.setScalar(n ? 0.55 : 0.42);
        drone.group.position.set(px, 1.5, pz);
        drone.group.rotation.y = n * 0.5;
        const plaque = new T.Mesh(
          new T.PlaneGeometry(2.9, 0.725),
          new T.MeshBasicMaterial({
            map: signTexture(n ? 'ТБС · К-50' : 'ТБС · К-25', 'ВЫСТАВКА БЕСПИЛОТНИКОВ'),
            toneMapped: false,
          }),
        );
        plaque.rotation.y = Math.PI;
        plaque.position.set(px, 1.05, pz - 2.2);
        scene.add(plaque);
      }
    else {
      const vehicle = new T.Group();
      vehicle.position.set(x - 7, 0.5, yardFront + 8);
      scene.add(vehicle);
      box(vehicle, 0, 0.65, 0, 1.7, 1, 2.7, hazard);
      box(vehicle, 0, 1.5, 0.35, 1.4, 0.15, 1.3, dark);
      for (const side of [-1, 1]) {
        box(vehicle, side * 0.8, 2, 0.5, 0.1, 2.6, 0.1, dark);
        box(vehicle, side * 0.65, 1.6, -1.5, 0.09, 2.6, 0.12, trimMat);
        box(vehicle, side * 0.65, 0.25, -2.25, 0.14, 0.12, 1.7, trimMat);
        for (const pz of [-0.8, 0.9]) {
          const wheel = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.25, 14), rubber);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(side * 0.95, 0.4, pz);
          vehicle.add(wheel);
        }
      }
      box(vehicle, 0, 3.3, 0.45, 1.9, 0.13, 1.7, hazard);
      for (let n = 0; n < 3; n++) box(scene, x - 7, 0.66 + n * 0.24, front - 2, 2, 0.17, 1.5, wood);
    }
    box(scene, x + w / 2 - 1.4, 3.2, yardFront + 1, 1.5, 5.5, 0.7, dark);
    const stela = new T.Mesh(
      new T.PlaneGeometry(1.1, 1.1),
      new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
    );
    stela.rotation.y = Math.PI;
    stela.position.set(x + w / 2 - 1.4, 5, yardFront + 0.6);
    scene.add(stela);
    addFlag(x - w / 2 + 1.2, yardFront + 1);
  }
  return { industrialYard };
};
