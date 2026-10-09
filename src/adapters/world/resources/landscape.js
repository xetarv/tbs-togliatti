'use strict';

window.TBS.createLandscapeResources = function ({
  mat,
  makeTexture,
  T,
  WORLD_W,
  visualAssets,
  vegetationCulling,
  scene,
  box,
  flat,
  grassMat,
  lowPower,
  unitPlane,
  curbMat,
  trimMat,
}) {
  const leafMats = [mat(0x47784c), mat(0x567e50), mat(0x6b884c)];
  const cityLeafTexture = makeTexture(
    (p, w, h) => {
      for (let n = 0; n < 9; n++) {
        p.save();
        p.translate(w * 0.5 + Math.sin(n * 2.4) * w * 0.28, h * 0.16 + n * h * 0.083);
        p.rotate(n * 1.7);
        const g = p.createLinearGradient(-18, -8, 18, 8);
        g.addColorStop(0, '#a1b36b');
        g.addColorStop(1, '#3f662e');
        p.fillStyle = g;
        p.beginPath();
        p.ellipse(0, 0, 19, 7, 0, 0, Math.PI * 2);
        p.fill();
        p.strokeStyle = '#c1c48a';
        p.lineWidth = 0.8;
        p.beginPath();
        p.moveTo(-16, 0);
        p.lineTo(16, 0);
        p.stroke();
        p.restore();
      }
    },
    128,
    128,
  );
  const cityLeafMaterials = [0x94ae69, 0xb0ba86, 0x648961].map(
    (color) =>
      new T.MeshStandardMaterial({
        map: cityLeafTexture,
        color,
        alphaTest: 0.42,
        side: T.DoubleSide,
        roughness: 0.92,
      }),
  );
  const barkMaterials = [mat(0x77604a), mat(0xb3afa0), mat(0x5e5943)];
  const branchGeometry = new T.CylinderGeometry(0.75, 1, 1, 7);
  function tree(x, z, seed, planterBox = true, natural = false) {
    if (x > 0 && x < WORLD_W && z > 19 && (z < 24 || (x < 160 && z < 112))) {
      visualAssets.plant(scene, x, z, seed, 0.88);
      if (planterBox) {
        box(scene, x, 0.3, z, 2.5, 0.35, 2.5, visualAssets.material('stone', 2.5, 0.35));
        flat(scene, x, 0.485, z, 2.26, 2.26, grassMat);
      }
      return;
    }
    const type = seed % 3,
      slender = type === 1,
      height = slender ? 5.2 : 4.25,
      radius = slender ? 0.95 : 1.65;
    const branches = new T.InstancedMesh(branchGeometry, barkMaterials[type], 6),
      pose = new T.Object3D(),
      up = new T.Vector3(0, 1, 0);
    for (let n = 0; n < 6; n++) {
      const a = n * 2.399 + seed,
        start = new T.Vector3(x, n ? 1.6 + n * 0.22 : 0.25, z),
        end = new T.Vector3(
          x + (n ? Math.cos(a) * radius * 0.7 : 0),
          n ? height - 0.6 : height - 0.4,
          z + (n ? Math.sin(a) * radius * 0.7 : 0),
        ),
        delta = end.clone().sub(start);
      pose.position.copy(start.add(end).multiplyScalar(0.5));
      pose.quaternion.setFromUnitVectors(up, delta.clone().normalize());
      pose.scale.set(n ? 0.055 : 0.15, delta.length(), n ? 0.055 : 0.15);
      pose.updateMatrix();
      branches.setMatrixAt(n, pose.matrix);
    }
    branches.castShadow = true;
    vegetationCulling.add(scene, branches);
    const count = natural ? 900 : lowPower ? 48 : 80,
      canopy = new T.InstancedMesh(
        natural ? parkLeafGeometry : unitPlane,
        natural ? parkLeafMaterial : cityLeafMaterials[type],
        count,
      );
    for (let n = 0; n < count; n++) {
      const a = n * 2.399 + seed,
        r = Math.sqrt((n + 0.5) / count) * radius;
      pose.position.set(
        x + Math.cos(a) * r,
        height - 0.8 + Math.sin(n * 1.73) * (slender ? 1.2 : 0.7),
        z + Math.sin(a) * r,
      );
      pose.rotation.set(n * 0.73, n * 1.17, n * 0.43);
      pose.scale.setScalar(natural ? 1.1 + (n % 5) * 0.12 : 0.85 + (n % 5) * 0.09);
      pose.updateMatrix();
      canopy.setMatrixAt(n, pose.matrix);
      if (natural)
        canopy.setColorAt(
          n,
          new T.Color().setHSL(0.22 + (n % 4) * 0.012, 0.42, 0.28 + (n % 9) * 0.018),
        );
    }
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    vegetationCulling.add(scene, canopy);
    if (planterBox) {
      const planter = box(scene, x, 0.3, z, 2.5, 0.35, 2.5, curbMat);
      planter.receiveShadow = true;
      flat(scene, x, 0.485, z, 2.26, 2.26, grassMat);
    }
  }
  const parkLeafGeometry = new T.BufferGeometry();
  parkLeafGeometry.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [0, 0, 0, -0.13, 0.18, 0, 0, 0.22, 0.045, 0.13, 0.18, 0, 0, 0.43, 0],
      3,
    ),
  );
  parkLeafGeometry.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
  parkLeafGeometry.computeVertexNormals();
  const parkLeafMaterial = new T.MeshStandardMaterial({
    color: 0x5b793e,
    roughness: 0.9,
    side: T.DoubleSide,
  });
  const parkWoodTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#a67d51';
      c.fillRect(0, 0, w, h);
      for (let n = 0; n < 110; n++) {
        c.strokeStyle = n % 2 ? '#f3d6a330' : '#33231838';
        c.lineWidth = 1;
        c.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y = ((n * 13) % h) + Math.sin(x * 0.04 + n) * 1.4;
          x ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
    },
    256,
    128,
  );
  const parkWood = new T.MeshStandardMaterial({
    map: parkWoodTexture,
    roughness: 0.85,
    color: 0xd4bd9b,
  });
  const parkStoneTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#686e68';
      c.fillRect(0, 0, w, h);
      for (let row = 0; row < 8; row++)
        for (let col = -1; col < 5; col++) {
          const v = 153 + ((row * 19 + col * 11 + 110) % 26),
            px = col * 64 + (row % 2) * 32,
            py = row * 32;
          c.fillStyle =
            row % 4 === 0 ? `rgb(${v - 22},${v - 16},${v - 10})` : `rgb(${v + 10},${v + 7},${v})`;
          c.fillRect(px + 1, py + 1, 62, 30);
          c.fillStyle = '#eee9d630';
          c.fillRect(px + 2, py + 2, 60, 1);
        }
    },
    256,
    256,
  );
  const parkStoneHeight = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#4c4c4c';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#cccccc';
      for (let row = 0; row < 8; row++)
        for (let col = -1; col < 5; col++)
          c.fillRect(col * 64 + (row % 2) * 32 + 1, row * 32 + 1, 62, 30);
    },
    256,
    256,
  );
  parkStoneHeight.encoding = T.LinearEncoding;
  const parkPavingCache = new Map();
  function parkPaving(w, d) {
    const key = w + ':' + d;
    if (parkPavingCache.has(key)) return parkPavingCache.get(key);
    const map = parkStoneTexture.clone(),
      bump = parkStoneHeight.clone();
    for (const t of [map, bump]) {
      t.repeat.set(w / 4, d / 4);
      t.needsUpdate = true;
    }
    const material = new T.MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.028,
      roughness: 0.9,
    });
    parkPavingCache.set(key, material);
    return material;
  }
  function shrubBed(x, y, z, w, d, seed) {
    const detailed = x < 160 && z < 160,
      count = detailed ? 1400 : 360;
    const leaves = new T.InstancedMesh(
        detailed ? visualAssets.leaf : parkLeafGeometry,
        detailed ? visualAssets.foliage : parkLeafMaterial,
        count,
      ),
      pose = new T.Object3D();
    for (let n = 0; n < count; n++) {
      const u = (n * 0.618034 + seed * 0.13) % 1,
        v = (n * 0.414214 + seed * 0.17) % 1;
      pose.position.set(
        x + (u - 0.5) * w,
        y + 0.1 + Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.55,
        z + (v - 0.5) * d,
      );
      pose.rotation.set(n * 0.73, n * 1.21, n * 0.37);
      pose.scale.setScalar(detailed ? 0.42 + (n % 5) * 0.06 : 0.65 + (n % 5) * 0.13);
      pose.updateMatrix();
      leaves.setMatrixAt(n, pose.matrix);
      leaves.setColorAt(
        n,
        new T.Color().setHSL(0.21 + (n % 7) * 0.009, 0.4, 0.3 + (n % 8) * 0.015),
      );
    }
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    vegetationCulling.add(scene, leaves, {
      displacement: detailed ? new T.Vector3(0.022, 0, 0.014) : undefined,
    });
    scene.userData.newShrubBeds = (scene.userData.newShrubBeds || 0) + 1;
  }
  function parkBench(x, y, z, width = 2.7) {
    for (let slat = 0; slat < 5; slat++)
      box(scene, x, y, z + slat * 0.145, width, 0.1, 0.115, parkWood).castShadow = true;
    for (let slat = 0; slat < 3; slat++)
      box(scene, x, y + 0.28 + slat * 0.17, z + 0.64, width, 0.13, 0.11, parkWood).castShadow =
        true;
    for (const side of [-1, 1]) {
      box(scene, x + side * (width / 2 - 0.3), y - 0.24, z + 0.27, 0.12, 0.5, 0.75, trimMat);
      box(scene, x + side * (width / 2 - 0.12), y + 0.26, z + 0.25, 0.085, 0.55, 0.085, trimMat);
      box(scene, x + side * (width / 2 - 0.12), y + 0.52, z + 0.28, 0.1, 0.08, 0.68, trimMat);
    }
  }
  function gardenBed(x, z, w, d, seed) {
    flat(scene, x, 0.41, z, w, d, grassMat);
    const count = lowPower ? 35 : 65,
      tufts = new T.InstancedMesh(unitPlane, cityLeafMaterials[seed % 3], count),
      pose = new T.Object3D();
    for (let n = 0; n < count; n++) {
      const px = (((n * 0.618033 + seed * 0.13) % 1) - 0.5) * (w - 0.5),
        pz = (((n * 0.414213 + seed * 0.19) % 1) - 0.5) * (d - 0.5);
      pose.position.set(x + px, 0.65 + (n % 4) * 0.035, z + pz);
      pose.rotation.set(0, n * 2.4, 0.15 * Math.sin(n));
      pose.scale.set(0.45, 0.5 + (n % 4) * 0.07, 1);
      pose.updateMatrix();
      tufts.setMatrixAt(n, pose.matrix);
    }
    tufts.receiveShadow = true;
    vegetationCulling.add(scene, tufts);
    for (const side of [-1, 1]) box(scene, x + (side * w) / 2, 0.51, z, 0.14, 0.25, d, curbMat);
  }
  return {
    leafMats,
    cityLeafMaterials,
    tree,
    parkWood,
    parkPaving,
    shrubBed,
    parkBench,
    gardenBed,
  };
};
