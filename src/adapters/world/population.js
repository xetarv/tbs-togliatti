'use strict';

window.TBS.populateWorld = function ({
  asphaltMaps,
  droneTexture,
  factoryTexture,
  hangarTexture,
  T,
  ROAD,
  roadsX,
  roadsZ,
  isParkBlock,
  scene,
  dark,
  roadMat,
  curbMat,
  cyanMat,
  orangeMat,
  laneMat,
  roofMat,
  trimMat,
  box,
  flat,
  roadSurface,
  pavingMat,
  architecturalPanel,
  tree,
  gardenBed,
  sprite,
  signTexture,
  streetNameplate,
  park,
  roundedSidewalk,
  busStop,
  addFacadeLighting,
  building,
  showcasePavilion,
  flowerBed,
  gazebo,
  playground,
  square,
  industrialYard,
  showcaseQuarter,
  addFlag,
  renderer,
  makeTexture,
  crosswalkMat,
  unitBox,
}) {
  const landmarks = [
    { i: 0, j: 0, name: 'ЦЕНТР ТБС', sub: 'ТРАНСПОРТ БУДУЩЕГО САМАРА', photo: droneTexture, h: 10 },
    { i: 3, j: 0, name: 'НПЦ БАС', sub: 'САМАРА · ТОЛЬЯТТИ', photo: factoryTexture, h: 12 },
    { i: 1, j: 1, name: 'ЖИГУЛЁВСКАЯ ДОЛИНА', sub: 'ТЕХНОПАРК · ТБС', photo: hangarTexture, h: 9 },
    { i: 3, j: 2, name: 'АВТОВАЗ', sub: 'ЭЛЕКТРОМОБИЛЬНОСТЬ', photo: null, h: 11 },
    { i: 4, j: 0, name: 'ЗАВОД ТБС', sub: 'БЕСПИЛОТНЫЕ СИСТЕМЫ', photo: droneTexture, h: 13 },
    { i: 0, j: 2, name: 'ТБС · ЭНЕРГИЯ', sub: 'ЗАРЯДКА', photo: null, h: 8 },
    { i: 2, j: 3, name: 'ТБС · ЛОГИСТИКА', sub: 'К-25  /  К-50', photo: factoryTexture, h: 9 },
    {
      i: 5,
      j: 2,
      name: 'ТБС · АЭРОПОРТ',
      sub: 'ВОЗДУШНАЯ МОБИЛЬНОСТЬ',
      photo: droneTexture,
      h: 11,
    },
    { i: 3, j: 4, name: 'ТБС · АКАДЕМИЯ', sub: 'ИНЖЕНЕРНЫЙ КАМПУС', photo: hangarTexture, h: 10 },
    { i: 6, j: 1, name: 'ТБС · ТЕХНОПАРК', sub: 'ВОСТОЧНЫЙ РАЙОН', photo: factoryTexture, h: 13 },
    {
      i: 7,
      j: 3,
      name: 'ТБС · КОНСТРУКТОРСКОЕ БЮРО',
      sub: 'БЕСПИЛОТНЫЕ СИСТЕМЫ',
      photo: droneTexture,
      h: 11,
    },
    {
      i: 5,
      j: 5,
      name: 'ТБС · ИСПЫТАТЕЛЬНЫЙ ЦЕНТР',
      sub: 'ЮЖНЫЙ РАЙОН',
      photo: hangarTexture,
      h: 10,
    },
  ];

  const special = new Map(landmarks.map((l) => [l.i + ',' + l.j, l]));

  landmarks.forEach((l) => (l.h += 4));

  const districtLabels = [];

  const parkingLots = [],
    parkedCars = [];

  const residentialCourts = [];

  const landingMat = new T.MeshBasicMaterial({
    color: 0x7ce5db,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
  });

  for (let j = 0; j < roadsZ.length - 1; j++)
    for (let i = 0; i < roadsX.length - 1; i++) {
      const left = roadsX[i] + ROAD / 2 + 1.2,
        right = roadsX[i + 1] - ROAD / 2 - 1.2;
      const top = roadsZ[j] + ROAD / 2 + 1.2,
        bottom = roadsZ[j + 1] - ROAD / 2 - 1.2;
      const cx = (left + right) / 2,
        cz = (top + bottom) / 2,
        w = right - left,
        d = bottom - top;
      flat(scene, cx, 0.1, cz, w + 2.4, d + 2.4, roadSurface(w + 2.4, d + 2.4));
      const landmark = special.get(i + ',' + j);
      const isPark = isParkBlock(i, j);
      const isIndustrial = j === 1 && (i === 4 || i === 5);
      const isParking = !landmark && !isPark && !isIndustrial && (i + j) % 4 === 1;
      if (!isParking) {
        roundedSidewalk(cx, cz, w + 2.4, d + 2.4, 4);
      }
      if (i === 0 && j === 0) {
        showcaseQuarter(cx, cz);
      } else if (landmark) {
        building({
          parent: scene,
          x: cx,
          z: cz,
          w: w - 3,
          d: d - 3,
          h: landmark.h,
          seed: 17 + i * 3 + j,
          kind: /ЗАВОД|НПЦ|АВТОВАЗ/.test(landmark.name) ? 'factory' : 'campus',
        });
        const pad = new T.Mesh(new T.RingGeometry(3.35, 3.57, 36), landingMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(cx - 3, landmark.h + 0.37, cz + 2);
        scene.add(pad);
        box(scene, cx - 3, landmark.h + 0.39, cz + 2, 2.9, 0.04, 0.11, landingMat);
        box(scene, cx - 3, landmark.h + 0.39, cz + 2, 0.11, 0.04, 2.9, landingMat);
        const faceZ = cz - (d - 3) / 2 - 0.25;
        const photoHeight = landmark.h - 4.6,
          photoY = 3.8 + photoHeight / 2;
        architecturalPanel(
          scene,
          cx,
          photoY,
          faceZ - 0.14,
          w - 5,
          photoHeight,
          Math.PI,
          landmark.photo || factoryTexture,
          landmark.name,
          landmark.sub,
        );
        architecturalPanel(
          scene,
          cx + (w - 3) / 2 + 0.38,
          photoY,
          cz,
          d - 5,
          photoHeight,
          Math.PI / 2,
          landmark.photo || droneTexture,
          landmark.name,
          landmark.sub,
        );
        architecturalPanel(
          scene,
          cx,
          photoY,
          cz + (d - 3) / 2 + 0.38,
          w - 5,
          photoHeight,
          0,
          landmark.photo || factoryTexture,
          landmark.name,
          landmark.sub,
        );
        architecturalPanel(
          scene,
          cx - (w - 3) / 2 - 0.38,
          photoY,
          cz,
          d - 5,
          photoHeight,
          -Math.PI / 2,
          landmark.photo || droneTexture,
          landmark.name,
          landmark.sub,
        );
        streetNameplate(cx, faceZ - 0.45, w - 5, Math.PI, landmark.name);
        streetNameplate(cx, cz + (d - 3) / 2 + 0.7, w - 5, 0, landmark.name);
        streetNameplate(cx + (w - 3) / 2 + 0.7, cz, d - 5, Math.PI / 2, landmark.name);
        streetNameplate(cx - (w - 3) / 2 - 0.7, cz, d - 5, -Math.PI / 2, landmark.name);
        // Roof lettering is a physical sign, fixed to the architecture.
        box(scene, cx, landmark.h + 2.2, faceZ + 0.3, 20.4, 5.4, 0.5, dark);
        const lettering = signTexture(landmark.name, landmark.sub);
        const signWidth = Math.min(w - 4, 20);
        const nameplate = new T.Mesh(
          new T.PlaneGeometry(signWidth, signWidth / 4),
          new T.MeshBasicMaterial({ map: lettering, toneMapped: false }),
        );
        nameplate.rotation.y = Math.PI;
        nameplate.position.set(cx, landmark.h + 2.2, faceZ);
        scene.add(nameplate);
        const label = sprite(scene, lettering, cx, landmark.h + 5.6, cz, 18, 4.5);
        label.material.toneMapped = false;
        label.material.fog = false;
        districtLabels.push(label);
        addFacadeLighting(cx, cz, w - 3, d - 3, landmark.h);
        addFlag(cx - w / 3, cz + d / 2 + 1);
        addFlag(cx + w / 3, cz + d / 2 + 1);
        addFlag(cx - w / 3, cz - d / 2 - 1);
        addFlag(cx + w / 3, cz - d / 2 - 1);
      } else if (i === 3 && j === 3) {
        square(cx, cz, w, d);
      } else if (isIndustrial) {
        industrialYard(cx, cz, w, d, i === 5);
      } else if (isPark) {
        park(cx, cz, w, d, i + j);
        busStop(cx, top + 1.7);
      } else if (isParking) {
        const back = bottom - 11;
        parkingLots.push({ left, right, top, bottom: back, cx, road: roadsZ[j] });
        flat(scene, cx, 0.15, (top + back) / 2, w, back - top, roadSurface(w, back - top));
        flat(scene, cx, 0.16, (roadsZ[j] + top) / 2, 8, top - roadsZ[j], roadMat);
        if (i === 1 && j === 0) showcasePavilion(cx, bottom - 4.5, w - 3, 7);
        else
          building({
            parent: scene,
            x: cx,
            z: bottom - 4.5,
            w: w - 3,
            d: 7,
            h: 7,
            seed: i + j,
            kind: 'office',
          });
        for (let bay = 0; bay < 5; bay++) {
          const x = left + 3 + bay * 5;
          flat(scene, x - 2.3, 0.18, back - 3.8, 0.1, 6.4, laneMat);
          flat(scene, x, 0.18, back - 0.65, 4.6, 0.1, laneMat);
          box(scene, x, 0.28, back - 1, 2.25, 0.22, 0.28, curbMat);
          if (bay === 0 || bay === 2 || bay === 4)
            parkedCars.push({ x, z: back - 4.3, a: Math.PI, seed: i * 5 + j + bay });
        }
        // Charging terminals and a readable sign identify the company parking.
        for (const x of [left + 3, left + 13]) {
          box(scene, x, 1.2, back - 0.1, 0.7, 2, 0.48, dark);
          box(scene, x, 1.55, back - 0.36, 0.5, 0.55, 0.04, cyanMat);
          box(scene, x, 2.26, back - 0.1, 0.85, 0.15, 0.6, orangeMat);
        }
        box(scene, cx - 5, 1.8, top, 0.1, 3.6, 0.1, trimMat);
        const parkingSign = new T.Mesh(
          new T.PlaneGeometry(5, 1.25),
          new T.MeshBasicMaterial({
            map: signTexture('P · ТБС', 'ПАРКОВКА · ЭЛЕКТРО'),
            toneMapped: false,
            side: T.DoubleSide,
          }),
        );
        parkingSign.position.set(cx - 5, 3.2, top);
        parkingSign.rotation.y = Math.PI;
        scene.add(parkingSign);
        addFlag(right - 1, bottom - 1);
      } else if ((i + j) % 3 === 0) {
        // Two residential wings leave a planted courtyard and a clear central footpath.
        const hasParking = (i + j) % 2 === 0;
        residentialCourts.push({ x: cx, z: cz, parking: hasParking });
        for (const side of [-1, 1])
          building({
            parent: scene,
            x: cx + side * w * 0.26,
            z: cz + 3,
            w: w * 0.35,
            d: d * 0.43,
            h: 12 + ((i * 3 + j) % 4) * 3.2,
            seed: i * 17 + j + (side + 1),
            kind: 'residential',
          });
        flat(scene, cx, 0.4, cz, 3.2, d - 1, pavingMat);
        gazebo(cx + 7, cz - 6.2);
        if (hasParking) {
          const lot = {
            left: cx - 12,
            right: cx - 2.5,
            top,
            bottom: cz - 3,
            cx: cx - 5.2,
            road: roadsZ[j],
          };
          parkingLots.push(lot);
          flat(scene, cx - 7.25, 0.42, (top + cz - 3) / 2, 9.5, cz - 3 - top, roadMat);
          flat(scene, lot.cx, 0.43, (roadsZ[j] + top) / 2, 5.8, top - roadsZ[j], roadMat);
          for (const px of [cx - 11.5, cx - 7.2, cx - 2.9])
            flat(scene, px, 0.44, cz - 6.2, 0.09, 5.8, laneMat);
          parkedCars.push({ x: cx - 9.3, z: cz - 6.2, a: Math.PI, seed: i * 9 + j });
        } else playground(cx - 7, cz - 6.5);
        for (const side of [-1, 1]) {
          if (side === -1 && hasParking) continue;
          gardenBed(cx + side * w * 0.27, top + 1.6, w * 0.34, 2.2, i + j + (side + 1));
          tree(cx + side * w * 0.27, top + 1.6, i + j + (side + 1), false);
          box(scene, cx + side * 3.1, 0.87, cz, 1.1, 0.17, 2.6, roofMat);
          for (const leg of [-1, 1])
            box(scene, cx + side * 3.1, 0.58, cz + leg * 0.9, 0.75, 0.5, 0.12, trimMat);
        }
        flowerBed(cx, cz + d / 2 - 1.4, 3.2, 1.3, i + j);
      } else if ((i + j) % 3 === 1) {
        building({
          parent: scene,
          x: cx + 1,
          z: cz + 2,
          w: w * 0.67,
          d: d * 0.66,
          h: 19 + ((i + j) % 4) * 3.2,
          seed: i * 19 + j,
          kind: 'office',
        });
        gardenBed(cx, top + 1.55, w * 0.7, 2.1, i + j);
        for (const side of [-1, 1])
          tree(cx + side * w * 0.32, top + 1.6, i + j + (side + 1), false);
      } else {
        for (let n = 0; n < 3; n++) {
          const bx = left + 5 + (n * (w - 10)) / 2;
          const height = 7 + ((i * 7 + j * 3 + n * 5) % 13) + (j > 1 && n === 1 ? 8 : 0);
          building({
            parent: scene,
            x: bx,
            z: cz,
            w: Math.max(4, w / 3 - 2),
            d: d - 3,
            h: height,
            seed: i * 17 + j * 11 + n,
          });
        }
      }
    }

  if (asphaltMaps) {
    const maps = {},
      loader = new T.TextureLoader();
    for (const key of ['map', 'normalMap', 'roughnessMap']) {
      const texture = loader.load(asphaltMaps[key]);
      texture.encoding = key === 'map' ? T.sRGBEncoding : T.LinearEncoding;
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      maps[key] = texture;
    }
    const asphalt = new T.MeshStandardMaterial({
      ...maps,
      color: 0xc4c8cc,
      roughness: 0.96,
      metalness: 0,
      normalScale: new T.Vector2(0.38, 0.38),
    });
    asphalt.name = 'Asphalt031-photogrammetry';
    for (const [x, z, w, d] of [
      [68, 30, 64, ROAD],
      [68, 21.9, ROAD, 3.8],
      [68, 48.1, ROAD, 23.8],
    ]) {
      const geometry = new T.PlaneGeometry(w, d),
        p = geometry.attributes.position,
        uv = geometry.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, (x + p.getX(i)) / 4, (p.getY(i) - z) / 4);
      const surface = new T.Mesh(geometry, asphalt);
      surface.name = 'Start intersection photographic asphalt';
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(x, 0.153, z);
      surface.receiveShadow = true;
      scene.add(surface);
    }
    const paint = makeTexture(
      (c, w, h) => {
        c.fillStyle = '#eee9d9';
        c.fillRect(0, 0, w, h);
        let seed = 31031;
        const rand = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        c.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 750; i++) {
          c.globalAlpha = 0.25 + rand() * 0.65;
          c.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 3);
        }
        for (let i = 0; i < 100; i++) {
          const y = rand() * h,
            s = 1 + rand() * 4;
          c.globalAlpha = 0.75;
          c.fillRect(i % 2 ? 0 : w - s, y, s, 1 + rand() * 5);
        }
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      },
      256,
      256,
    );
    const paintMat = new T.MeshStandardMaterial({
      map: paint,
      transparent: true,
      alphaTest: 0.2,
      roughness: 0.95,
      metalness: 0,
    });
    paintMat.name = 'Local worn road paint';
    for (const mesh of scene.children) {
      if (mesh.material !== laneMat && mesh.material !== crosswalkMat) continue;
      const { x, z } = mesh.position;
      if (!(
        (x >= 36 && x <= 100 && Math.abs(z - 30) <= ROAD / 2) ||
        (Math.abs(x - 68) <= ROAD / 2 && z >= 20 && z <= 60)
      ))
        continue;
      if (mesh.material === laneMat) mesh.position.y = 0.174;
      mesh.material = paintMat;
    }
  }

  const staticBatches = new Map();
  // Reuse the tested r149 per-instance bounds adapter without vegetation wind
  // or spatial subdivision. This switch is independent of vegetation culling.
  const batchCulling = window.TBS.createVegetationCulling({
    T,
    enabled: new URLSearchParams(location.search).get('staticBatchCulling') !== '0',
  });

  for (const child of [...scene.children])
    if (child.isMesh && child.geometry === unitBox) {
      if (Math.max(child.scale.x, child.scale.z) > 84) continue;
      const key =
        child.material.uuid +
        ':' +
        Math.floor(child.position.x / 84) +
        ':' +
        Math.floor(child.position.z / 80);
      if (!staticBatches.has(key)) staticBatches.set(key, []);
      staticBatches.get(key).push(child);
    }

  for (const meshes of staticBatches.values()) {
    if (meshes.length < 3) continue;
    const batch = new T.InstancedMesh(unitBox, meshes[0].material, meshes.length);
    meshes.forEach((mesh, i) => {
      mesh.updateMatrix();
      batch.setMatrixAt(i, mesh.matrix);
      scene.remove(mesh);
    });
    batch.castShadow = meshes.some((m) => m.castShadow);
    batch.receiveShadow = true;
    scene.add(batchCulling.register(batch));
  }
  return { parkedCars, special, parkingLots, districtLabels };
};
