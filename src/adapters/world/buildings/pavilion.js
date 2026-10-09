'use strict';
window.TBS.createPavilionBuilder = function ({
  reflectionBuildings,
  makeTexture,
  visualAssets,
  mat,
  T,
  nightWindows,
  box,
  scene,
  trimMat,
  dark,
  whiteMat,
  signTexture,
  flat,
  grassMat,
  leafMats,
  showcaseTree,
}) {
  function showcasePavilion(x, z, w, d) {
    reflectionBuildings.push({ x, z, w, d, h: 7.7, seed: 2, color: 0xd1cbb6 });
    const stoneTexture = makeTexture(
      (c, tw, th) => {
        c.fillStyle = '#bcb9aa';
        c.fillRect(0, 0, tw, th);
        for (let n = 0; n < 5000; n++) {
          const q = (Math.sin(n * 71.37) * 43758.54) % 1;
          c.fillStyle = n % 2 ? 'rgba(45,39,31,.08)' : 'rgba(255,255,240,.12)';
          c.fillRect(Math.abs(q) * tw, (n * 73) % th, 1 + (n % 3), 1);
        }
        c.fillStyle = '#777c75';
        c.fillRect(0, 0, tw, 2);
        c.fillRect(0, 0, 2, th);
      },
      256,
      128,
    );
    stoneTexture.repeat.set(4, 3);
    const stone = visualAssets.material('stone', 10, 7);
    const timber = mat(0x78593c, 0, 0.82),
      interior = mat(0xb7b4a1, 0, 0.88);
    const glazing = new T.MeshPhysicalMaterial({
      color: 0xb4c6c6,
      metalness: 0,
      roughness: 0.18,
      transparent: true,
      opacity: 0.23,
      depthWrite: false,
      side: T.DoubleSide,
      envMapIntensity: 0.6,
    });
    const glow = new T.MeshStandardMaterial({
      color: 0xdad0ad,
      roughness: 0.8,
      emissive: 0xffd898,
      emissiveIntensity: 0,
    });
    nightWindows.push(glow);
    const front = z - d / 2;
    box(scene, x, 0.4, z, w + 0.3, 0.6, d + 0.3, stone).receiveShadow = true;
    box(scene, x, 3.8, z, w, 0.3, d, stone).castShadow = true;
    box(scene, x, 7.5, z, w + 0.65, 0.4, d + 0.65, stone).castShadow = true;
    box(scene, x, 3.95, z + d / 2 - 0.18, w, 7.1, 0.35, stone).castShadow = true;
    for (const side of [-1, 1])
      box(scene, x + side * (w / 2 - 0.24), 3.9, z, 0.48, 7.1, d, stone).castShadow = true;
    for (const level of [0, 1]) {
      const y = level * 3.55;
      box(scene, x, y + 1.65, z + d / 2 - 0.39, w - 1, 2.3, 0.035, glow);
      for (let column = -w / 2 + 1.6; column < w / 2 - 1; column += 3) {
        box(scene, x + column, y + 1.02, z + 0.45, 1.9, 0.1, 1, interior);
        for (const side of [-1, 1])
          box(scene, x + column + side * 0.65, y + 0.58, z + 0.45, 0.07, 0.85, 0.6, trimMat);
        box(scene, x + column, y + 1.38, z + 0.5, 0.6, 0.46, 0.06, dark);
        box(scene, x + column, y + 0.66, z - 0.55, 0.57, 0.5, 0.57, timber);
        box(scene, x + column, y + 1.1, z - 0.3, 0.57, 0.55, 0.08, timber);
      }
      // Deep window reveals and external fins cast real facade shadows.
      for (let column = -w / 2 + 0.5; column < w / 2; column += 1.5) {
        box(scene, x + column, y + 2, front - 0.05, 0.07, 3.25, 0.12, trimMat);
        if (Math.abs(column) > 3)
          box(scene, x + column, y + 2, front - 0.31, 0.14, 3.25, 0.66, timber).castShadow = true;
      }
      const window = new T.Mesh(new T.PlaneGeometry(w - 0.9, 3.05), glazing);
      window.rotation.y = Math.PI;
      window.position.set(x, y + 2, front - 0.12);
      scene.add(window);
    }
    for (const side of [-1, 1]) {
      box(scene, x + side * 2, 1.65, front - 0.26, 0.08, 2.8, 0.14, trimMat);
      box(scene, x + side * 0.24, 1.52, front - 0.29, 0.035, 0.6, 0.065, whiteMat);
    }
    box(scene, x, 3.5, front - 0.7, 5.5, 0.16, 1.8, trimMat).castShadow = true;
    for (let rib = 0; rib < 9; rib++)
      box(scene, x - 2.4 + rib * 0.6, 3.38, front - 0.7, 0.045, 0.08, 1.7, timber);
    const name = new T.Mesh(
      new T.PlaneGeometry(12, 3),
      new T.MeshBasicMaterial({
        map: signTexture('ИНЖЕНЕРНЫЙ ЦЕНТР', 'ТРАНСПОРТ БУДУЩЕГО САМАРА'),
        toneMapped: false,
      }),
    );
    name.rotation.y = Math.PI;
    name.position.set(x, 9.2, front + 0.25);
    scene.add(name);
    box(scene, x, 9.2, front + 0.4, 12.4, 3.3, 0.28, dark).castShadow = true;
    for (const side of [-1, 1]) {
      box(scene, x + side * (w / 2 - 2), 7.94, z, 2.8, 0.5, d - 1.1, stone);
      flat(scene, x + side * (w / 2 - 2), 8.2, z, 2.5, d - 1.4, grassMat);
      for (let n = 0; n < 9; n++) {
        const bush = new T.Mesh(new T.IcosahedronGeometry(0.38, 1), leafMats[n % 3]);
        bush.position.set(
          x + side * (w / 2 - 2) + Math.sin(n * 2.4) * 0.8,
          8.35,
          z + Math.cos(n * 2.4) * 1.5,
        );
        bush.scale.y = 0.7;
        scene.add(bush);
      }
      showcaseTree(x + side * (w / 2 - 2), front - 1.45);
    }
    scene.userData.showcasePavilion = true;
  }
  return { showcasePavilion };
};
