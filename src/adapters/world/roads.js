'use strict';

window.TBS.createRoads = function ({
  makeTexture,
  laneMat,
  crosswalkMat,
  roadsX,
  roadsZ,
  scene,
  dark,
  box,
  T,
  unitPlane,
  ROAD,
  trimMat,
  mat,
  curbMat,
  visualAssets,
  cyanMat,
  orangeMat,
  whiteMat,
  signTexture,
}) {
  const wornPaint = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#d9ded3';
      c.fillRect(0, 0, w, h);
      let seed = 914;
      for (let i = 0; i < 1800; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const x = seed % w;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        c.fillStyle = i % 3 ? '#8c9992' : '#45535a';
        c.fillRect(x, seed % h, 1 + (i % 3), 1 + (i % 2));
      }
    },
    128,
    128,
  );

  laneMat.map = wornPaint;

  laneMat.needsUpdate = true;

  crosswalkMat.map = wornPaint;

  crosswalkMat.needsUpdate = true;

  const arrowTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = 'rgba(221,229,221,.72)';
      c.beginPath();
      c.moveTo(w * 0.5, h * 0.12);
      c.lineTo(w * 0.82, h * 0.43);
      c.lineTo(w * 0.6, h * 0.43);
      c.lineTo(w * 0.6, h * 0.9);
      c.lineTo(w * 0.4, h * 0.9);
      c.lineTo(w * 0.4, h * 0.43);
      c.lineTo(w * 0.18, h * 0.43);
      c.closePath();
      c.fill();
    },
    128,
    256,
  );

  const coverTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#37464b';
      c.fillRect(0, 0, w, h);
      c.strokeStyle = '#708087';
      c.lineWidth = 6;
      c.beginPath();
      c.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 3;
      for (let i = 24; i < w - 20; i += 14) {
        c.beginPath();
        c.moveTo(i, 26);
        c.lineTo(i, h - 26);
        c.stroke();
      }
      c.fillStyle = '#263239';
      c.fillRect(47, 55, 34, 18);
    },
    128,
    128,
  );

  const repairTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = 'rgba(15,25,30,.24)';
      c.beginPath();
      c.moveTo(10, 18);
      c.lineTo(w - 20, 7);
      c.lineTo(w - 7, h - 20);
      c.lineTo(18, h - 8);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(9,17,20,.38)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, h * 0.4);
      c.lineTo(w * 0.3, h * 0.48);
      c.lineTo(w * 0.47, h * 0.35);
      c.lineTo(w * 0.61, h * 0.63);
      c.lineTo(w, h * 0.7);
      c.stroke();
    },
    128,
    128,
  );

  const arrows = [],
    covers = [],
    repairs = [];

  for (const x of roadsX)
    for (let j = 0; j < roadsZ.length - 1; j++) {
      const z = (roadsZ[j] + roadsZ[j + 1]) / 2;
      arrows.push([x + 2.7, z, 0], [x - 2.7, z, Math.PI]);
      covers.push([x + 4.5, z + 9, 0]);
      if (j % 2 === 0) repairs.push([x - 2.9, z - 8, 0.2]);
    }

  for (const z of roadsZ)
    for (let i = 0; i < roadsX.length - 1; i++) {
      const x = (roadsX[i] + roadsX[i + 1]) / 2;
      arrows.push([x, z + 2.7, -Math.PI / 2], [x, z - 2.7, Math.PI / 2]);
      if (i % 2 === 0) repairs.push([x + 7, z + 3, 1.8]);
      // Recessed drainage slots sit along the gutter, outside wheel tracks.
      for (let slot = 0; slot < 5; slot++)
        box(scene, x + slot * 0.18, 0.155, z - 5.7, 0.08, 0.02, 0.7, dark);
    }

  function roadInstances(points, geometry, texture, w, d) {
    const mesh = new T.InstancedMesh(
        geometry,
        new T.MeshStandardMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          roughness: 0.95,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
        points.length,
      ),
      transform = new T.Object3D();
    points.forEach(([x, z, angle], i) => {
      transform.position.set(x, 0.18, z);
      transform.rotation.set(-Math.PI / 2, 0, angle);
      transform.scale.set(w, d, 1);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    });
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  roadInstances(arrows, unitPlane, arrowTexture, 1.2, 3.3);

  roadInstances(covers, new T.CircleGeometry(0.5, 20), coverTexture, 1.1, 1.1);

  roadInstances(
    repairs.filter((_, i) => i % 3 !== 0),
    unitPlane,
    repairTexture,
    2.5,
    4.6,
  );

  const shoulderTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#6b7472';
      c.fillRect(0, 0, w, h);
      let seed = 73;
      for (let i = 0; i < 5000; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const x = seed % w;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        c.fillStyle = i % 2 ? '#c1bbae40' : '#26333760';
        c.fillRect(x, seed % h, 1, 1);
      }
      c.fillStyle = '#26323888';
      c.fillRect(0, 0, 4, h);
    },
    128,
    256,
  );

  const shoulderV = [],
    shoulderH = [],
    seamsV = [],
    seamsH = [];

  for (const x of roadsX)
    for (let j = 0; j < roadsZ.length - 1; j++) {
      const z = (roadsZ[j] + roadsZ[j + 1]) / 2;
      for (const s of [-1, 1]) shoulderV.push([x + s * (ROAD / 2 - 0.3), z, 0]);
      if (j % 2 === 0) seamsV.push([x, z + 5, 0]);
    }

  for (const z of roadsZ)
    for (let i = 0; i < roadsX.length - 1; i++) {
      const x = (roadsX[i] + roadsX[i + 1]) / 2;
      for (const s of [-1, 1]) shoulderH.push([x, z + s * (ROAD / 2 - 0.3), Math.PI / 2]);
      if (i % 2 === 0) seamsH.push([x - 5, z, Math.PI / 2]);
    }

  roadInstances(shoulderV, unitPlane, shoulderTexture, 0.48, roadsZ[1] - roadsZ[0] - ROAD - 8);

  roadInstances(shoulderH, unitPlane, shoulderTexture, 0.48, roadsX[1] - roadsX[0] - ROAD - 8);

  const seamTexture = makeTexture(
    (c, w, h) => {
      c.strokeStyle = '#111e26a0';
      c.lineWidth = 5;
      c.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = h / 2 + Math.sin(x * 0.13) * 2 + Math.sin(x * 0.47);
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      c.strokeStyle = '#96948855';
      c.lineWidth = 1;
      c.stroke();
    },
    256,
    32,
  );

  roadInstances(seamsV, unitPlane, seamTexture, ROAD - 1.2, 0.25);

  roadInstances(seamsH, unitPlane, seamTexture, ROAD - 1.2, 0.25);

  const patchTexture = makeTexture(
    (c, w, h) => {
      c.beginPath();
      c.moveTo(12, 18);
      c.lineTo(w - 25, 10);
      c.lineTo(w - 12, 56);
      c.lineTo(w - 17, h - 18);
      c.lineTo(20, h - 10);
      c.closePath();
      c.fillStyle = '#29363bf0';
      c.fill();
      c.save();
      c.clip();
      let seed = 791;
      for (let i = 0; i < 13000; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const x = seed % w;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        c.fillStyle = i % 2 ? '#a2aaa632' : '#111c2840';
        c.fillRect(x, seed % h, 1, 1);
      }
      c.restore();
      c.strokeStyle = '#14232bb0';
      c.lineWidth = 3;
      c.stroke();
    },
    256,
    256,
  );

  roadInstances(
    repairs.filter((_, i) => i % 3 === 0).map(([x, z, a]) => [x + 0.4, z + 1, a + 0.12]),
    unitPlane,
    patchTexture,
    2.2,
    3.1,
  );

  const roadSignTextures = ['crossing', 'speed'].map((kind) =>
    makeTexture(
      (c, w, h) => {
        c.fillStyle = '#ecefe5';
        c.fillRect(0, 0, w, h);
        if (kind === 'speed') {
          c.strokeStyle = '#c32e27';
          c.lineWidth = 16;
          c.beginPath();
          c.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = '#182a32';
          c.font = 'bold 65px Segoe UI';
          c.textAlign = 'center';
          c.fillText('40', w / 2, h * 0.68);
        } else {
          c.fillStyle = '#176aa0';
          c.fillRect(0, 0, w, h);
          c.fillStyle = '#f2f1e7';
          c.beginPath();
          c.moveTo(w / 2, 12);
          c.lineTo(w - 10, h - 12);
          c.lineTo(10, h - 12);
          c.fill();
          c.strokeStyle = '#172d36';
          c.lineWidth = 7;
          c.beginPath();
          c.moveTo(65, 52);
          c.lineTo(58, 78);
          c.lineTo(44, 97);
          c.moveTo(58, 78);
          c.lineTo(78, 98);
          c.moveTo(61, 60);
          c.lineTo(79, 73);
          c.stroke();
          c.beginPath();
          c.arc(67, 41, 7, 0, Math.PI * 2);
          c.fillStyle = '#172d36';
          c.fill();
        }
      },
      128,
      128,
    ),
  );

  for (let j = 0; j < roadsZ.length - 1; j++)
    for (let i = 0; i < roadsX.length - 1; i++) {
      if ((i + j) % 2) continue;
      const x = roadsX[i] + ROAD / 2 + 1.8,
        z = roadsZ[j] + ROAD / 2 + 5.5,
        kind = (i + j) % 4 === 0 ? 0 : 1;
      box(scene, x, 1.9, z, 0.07, 3.4, 0.07, trimMat);
      const sign = new T.Mesh(
        kind === 1 ? new T.CircleGeometry(0.5, 32) : new T.PlaneGeometry(1, 1),
        new T.MeshStandardMaterial({
          map: roadSignTextures[kind],
          roughness: 0.65,
          side: T.DoubleSide,
        }),
      );
      sign.position.set(x, 3.25, z);
      sign.rotation.y = -Math.PI / 2;
      scene.add(sign);
    }

  const tactileMaterial = mat(0xa99c61);

  const sidewalkMaterials = ['slabs', 'brick', 'stone'].map((kind) => {
    const texture = makeTexture(
      (c, w, h) => {
        c.fillStyle = kind === 'brick' ? '#655e53' : '#777c79';
        c.fillRect(0, 0, w, h);
        let seed = 281;
        const random = () => {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        const bw = kind === 'slabs' ? 128 : kind === 'brick' ? 64 : 32,
          bh = kind === 'slabs' ? 128 : 32;
        for (let row = 0; row < h / bh; row++)
          for (let col = -1; col < w / bw; col++) {
            const x = col * bw + (kind === 'slabs' ? 0 : ((row % 2) * bw) / 2),
              y = row * bh,
              n = Math.floor(random() * 22);
            c.fillStyle =
              kind === 'brick'
                ? `rgb(${154 + n},${118 + n},${83 + n})`
                : `rgb(${158 + n},${164 + n},${160 + n})`;
            c.fillRect(x + 2, y + 2, bw - 4, bh - 4);
            c.fillStyle = '#ffffff30';
            c.fillRect(x + 3, y + 3, bw - 6, 1);
          }
        for (let i = 0; i < 8000; i++) {
          c.fillStyle = i % 2 ? '#ffffff0c' : '#18262712';
          c.fillRect(random() * w, random() * h, 1, 1);
        }
      },
      256,
      256,
    );
    texture.repeat.set(4, 4);
    return new T.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: kind === 'stone' ? 0.065 : 0.035,
      roughness: 0.94,
    });
  });

  const kerbTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#aaa99f';
      c.fillRect(0, 0, w, h);
      let seed = 724;
      const rand = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 14000; i++) {
        c.fillStyle = i % 3 ? '#494a4322' : '#fff9eb33';
        c.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
      }
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ede5d522');
      g.addColorStop(1, '#333a3440');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    },
    256,
    256,
  );

  const detailedKerb = new T.MeshStandardMaterial({
    map: kerbTexture,
    bumpMap: kerbTexture,
    bumpScale: 0.009,
    roughness: 0.94,
    color: 0xd6d4c8,
  });

  function kerbPiece(shape, x, z) {
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.19,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 2,
      curveSegments: 5,
    });
    const mesh = new T.Mesh(geo, detailedKerb);
    mesh.name = 'Chamfered concrete kerbstone';
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.18, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  function roundedSidewalk(x, z, w, d, r) {
    const detailed = x < 70 && z < 71;
    const shape = new T.Shape(),
      a = -w / 2,
      b = -d / 2;
    shape.moveTo(a + r, b);
    shape.lineTo(-1.2, b);
    shape.lineTo(-1.2, b + 1.6);
    shape.lineTo(1.2, b + 1.6);
    shape.lineTo(1.2, b);
    shape.lineTo(a + w - r, b);
    shape.absarc(a + w - r, b + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(a + w, b + d - r);
    shape.absarc(a + w - r, b + d - r, r, 0, Math.PI / 2, false);
    shape.lineTo(1.2, b + d);
    shape.lineTo(1.2, b + d - 1.6);
    shape.lineTo(-1.2, b + d - 1.6);
    shape.lineTo(-1.2, b + d);
    shape.lineTo(a + r, b + d);
    shape.absarc(a + r, b + d - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(a, b + r);
    shape.absarc(a + r, b + r, r, Math.PI, Math.PI * 1.5, false);
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: 0.23,
      bevelEnabled: false,
      curveSegments: 10,
    });
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 8, uv.getY(i) / 8);
    if (detailed) {
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 2);
    }
    const slab = new T.Mesh(geometry, [
      detailed
        ? visualAssets.material('paving', 4, 4)
        : sidewalkMaterials[Math.abs(Math.round(x + z)) % 3],
      detailed ? detailedKerb : curbMat,
    ]);
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(x, 0.15, z);
    slab.receiveShadow = true;
    scene.add(slab);
    function straightKerb(cx, cz, sw, sd) {
      if (!detailed) {
        box(scene, cx, 0.36, cz, sw, 0.07, sd, trimMat);
        return;
      }
      const s = new T.Shape();
      s.moveTo(-sw / 2, -sd / 2);
      s.lineTo(sw / 2, -sd / 2);
      s.lineTo(sw / 2, sd / 2);
      s.lineTo(-sw / 2, sd / 2);
      s.closePath();
      kerbPiece(s, cx, cz);
    }
    // Segmented kerbstones leave rounded corners clear and sit flush with the paving.
    for (const side of [-1, 1]) {
      for (let v = -w / 2 + r; v < w / 2 - r; v += 1.5) {
        const len = Math.min(1.44, w / 2 - r - v);
        if (len < 0.06 || (v < 1.2 && v + len > -1.2)) continue;
        straightKerb(x + v + len / 2, z + side * (d / 2 - 0.16), len, 0.28);
      }
      for (let v = -d / 2 + r; v < d / 2 - r; v += 1.5) {
        const len = Math.min(1.44, d / 2 - r - v);
        if (len > 0.06) straightKerb(x + side * (w / 2 - 0.16), z + v + len / 2, 0.28, len);
      }
      const rampGeometry = new T.BufferGeometry();
      rampGeometry.setAttribute(
        'position',
        new T.Float32BufferAttribute(
          [
            -1.2,
            0.16,
            (side * d) / 2,
            1.2,
            0.16,
            (side * d) / 2,
            1.2,
            0.38,
            side * (d / 2 - 1.6),
            -1.2,
            0.38,
            side * (d / 2 - 1.6),
          ],
          3,
        ),
      );
      rampGeometry.setIndex(side === 1 ? [0, 1, 2, 0, 2, 3] : [2, 1, 0, 3, 2, 0]);
      rampGeometry.computeVertexNormals();
      const ramp = new T.Mesh(rampGeometry, trimMat);
      ramp.position.set(x, 0, z);
      ramp.receiveShadow = true;
      scene.add(ramp);
      if (detailed) {
        rampGeometry.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
        ramp.material = detailedKerb;
        box(scene, x, 0.395, z + side * (d / 2 - 2.02), 2.2, 0.03, 0.65, tactileMaterial);
        const dots = new T.InstancedMesh(
            new T.CylinderGeometry(0.033, 0.043, 0.025, 6),
            tactileMaterial,
            60,
          ),
          matrix = new T.Matrix4();
        let n = 0;
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 20; col++)
            dots.setMatrixAt(
              n++,
              matrix.makeTranslation(
                x - 1.02 + col * 0.107,
                0.425,
                z + side * (d / 2 - 2.02) + (row - 1) * 0.18,
              ),
            );
        scene.add(dots);
      }
    }
    if (detailed)
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const cx = x + sx * (w / 2 - r),
            cz = z + sz * (d / 2 - r),
            start = sx === 1 ? (sz === 1 ? -Math.PI / 2 : 0) : sz === 1 ? Math.PI : Math.PI / 2;
          for (let n = 0; n < 6; n++) {
            const a = start + (n * Math.PI) / 12 + 0.007,
              b = start + ((n + 1) * Math.PI) / 12 - 0.007,
              s = new T.Shape();
            s.absarc(0, 0, r - 0.035, a, b, false);
            s.absarc(0, 0, r - 0.285, b, a, true);
            s.closePath();
            kerbPiece(s, cx, cz);
          }
        }
    // Small tactile landing pads mark the approaches to pedestrian crossings.
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        for (let n = 0; n < 5; n++)
          box(
            scene,
            x + sx * (w / 2 - r - 1) + n * 0.17,
            0.397,
            z + sz * (d / 2 - 0.8),
            0.08,
            0.025,
            0.9,
            tactileMaterial,
          );
      }
  }

  const stopSignTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#126a94';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#f3f5ee';
      c.fillRect(12, 12, w - 24, h - 24);
      c.fillStyle = '#163e51';
      c.fillRect(36, 40, 56, 65);
      c.fillRect(30, 101, 68, 12);
      c.fillStyle = '#c3e2e5';
      c.fillRect(42, 48, 44, 28);
      c.fillStyle = '#163e51';
      c.fillRect(39, 111, 12, 13);
      c.fillRect(77, 111, 12, 13);
      c.font = 'bold 18px Segoe UI';
      c.textAlign = 'center';
      c.fillText('ТБС', 64, 146);
    },
    128,
    160,
  );

  const shelterGlass = new T.MeshStandardMaterial({
    color: 0x9bc6cf,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    roughness: 0.18,
    metalness: 0.08,
  });

  function busStop(x, z) {
    const shelter = new T.Group();
    shelter.position.set(x, 0, z);
    scene.add(shelter);
    box(shelter, 0, 0.45, 0, 6, 0.18, 2.5, trimMat);
    box(shelter, 0, 3.65, 0, 6.6, 0.24, 2.9, whiteMat).castShadow = true;
    for (const side of [-1, 1]) {
      for (const depth of [-1, 1]) box(shelter, side * 2.8, 2, depth, 0.12, 3.2, 0.12, trimMat);
      box(shelter, side * 2.7, 2, 0, 0.04, 2.8, 2.15, shelterGlass);
    }
    box(shelter, 0, 2, 1.1, 5.5, 2.8, 0.05, shelterGlass);
    box(shelter, 0, 1, 0, 4.3, 0.2, 0.65, whiteMat);
    box(shelter, 0, 3.45, -1.35, 6, 0.08, 0.06, orangeMat);
    const sign = new T.Mesh(
      new T.PlaneGeometry(5.6, 1.4),
      new T.MeshBasicMaterial({
        map: signTexture('ТБС · ЭКСПРЕСС', 'ГОРОДСКОЙ ЭЛЕКТРОТРАНСПОРТ'),
        toneMapped: false,
      }),
    );
    sign.rotation.y = Math.PI;
    sign.position.set(0, 4.45, -0.2);
    shelter.add(sign);
    for (const side of [-1, 1]) box(shelter, side * 1.6, 0.72, 0, 0.13, 0.65, 0.55, trimMat);
    box(shelter, 0, 1.42, 0.3, 4.3, 0.65, 0.12, mat(0x987149));
    const route = makeTexture(
      (c, w, h) => {
        c.fillStyle = '#eef0e5';
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#152d37';
        c.font = 'bold 25px Segoe UI';
        c.fillText('ТБС · МАРШРУТ 01', 16, 38);
        c.strokeStyle = '#ff5b1c';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(30, 85);
        c.lineTo(30, 330);
        c.stroke();
        ['Центр ТБС', 'Набережная', 'Площадь ТБС', 'Академия', 'Технопарк'].forEach((name, i) => {
          const y = 85 + i * 60;
          c.fillStyle = '#ff5b1c';
          c.beginPath();
          c.arc(30, y, 9, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#152d37';
          c.font = '19px Segoe UI';
          c.fillText(name, 50, y + 6);
        });
        c.font = '16px Segoe UI';
        c.fillText('ТРАНСПОРТ БУДУЩЕГО', 16, 375);
      },
      256,
      400,
    );
    const panel = new T.Mesh(
      new T.PlaneGeometry(1.15, 1.8),
      new T.MeshBasicMaterial({ map: route, side: T.DoubleSide, toneMapped: false }),
    );
    panel.position.set(1.95, 2.25, 1.04);
    panel.rotation.y = Math.PI;
    shelter.add(panel);
    box(shelter, -3.65, 0.9, 0.3, 0.65, 1, 0.65, dark);
    box(shelter, -3.65, 1.43, 0.3, 0.75, 0.09, 0.75, trimMat);
    box(shelter, 0, 3.48, 0.5, 4.6, 0.04, 0.12, cyanMat);
    box(shelter, 3.7, 1.9, -0.65, 0.09, 3.2, 0.09, trimMat);
    const stopSign = new T.Mesh(
      new T.PlaneGeometry(0.9, 1.125),
      new T.MeshBasicMaterial({ map: stopSignTexture, side: T.DoubleSide, toneMapped: false }),
    );
    stopSign.position.set(3.7, 3.25, -0.65);
    stopSign.rotation.y = Math.PI;
    shelter.add(stopSign);
    for (const side of [-1, 1]) {
      for (const offset of [0, 2.8])
        box(shelter, side * (4.7 + offset), 0.95, 1.2, 0.08, 1.1, 0.08, trimMat);
      for (const height of [0.72, 1.42])
        box(shelter, side * 6.1, height, 1.2, 2.8, 0.07, 0.07, trimMat);
    }
  }
  return { roadInstances, roundedSidewalk, busStop };
};
