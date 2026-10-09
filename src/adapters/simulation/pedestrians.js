'use strict';

window.TBS.createPedestrians = function ({
  mat,
  T,
  lowPower,
  scene,
  orangeMat,
  whiteMat,
  box,
  markTexture,
  ROAD,
  roadsX,
  roadsZ,
  isParkBlock,
  special,
  state,
  camera,
}) {
  const pedestrianJackets = [0xe88736, 0x367e9c, 0xac5464, 0xd3ccad, 0x435463, 0x5b8766].map((c) =>
    mat(c, 0, 0.9),
  );

  const pedestrianSkin = [0xe2b390, 0xb77c56, 0x805340].map((c) => mat(c, 0, 0.95));

  const pedestrianHair = [0x30251e, 0x765137, 0xc0a078].map((c) => mat(c, 0, 0.95));

  const trousers = mat(0x273848),
    shoeMaterial = mat(0x182126);

  const headGeometry = new T.SphereGeometry(0.22, 10, 8);

  const personShadow = new T.MeshBasicMaterial({
    color: 0x14201a,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });

  function createPedestrian(seed) {
    const root = new T.Group(),
      body = new T.Group();
    root.add(body);
    const jacket = pedestrianJackets[seed % pedestrianJackets.length],
      skin = pedestrianSkin[seed % 3];
    box(body, 0, 1.17, 0, 0.47, 0.6, 0.29, jacket);
    box(body, 0, 0.84, 0, 0.38, 0.19, 0.25, trousers);
    const head = new T.Mesh(headGeometry, skin);
    head.position.set(0, 1.69, 0);
    body.add(head);
    box(body, 0, 1.84, 0.015, 0.36, 0.13, 0.31, pedestrianHair[seed % 3]);
    box(body, 0, 1.67, -0.217, 0.075, 0.075, 0.08, skin);
    const limbs = [];
    for (const side of [-1, 1]) {
      const leg = new T.Group();
      leg.position.set(side * 0.13, 0.83, 0);
      body.add(leg);
      box(leg, 0, -0.31, 0, 0.17, 0.6, 0.2, trousers);
      box(leg, 0, -0.71, -0.055, 0.21, 0.14, 0.34, shoeMaterial);
      const arm = new T.Group();
      arm.position.set(side * 0.3, 1.4, 0);
      body.add(arm);
      box(arm, 0, -0.22, 0, 0.15, 0.46, 0.19, jacket);
      box(arm, 0, -0.49, 0, 0.12, 0.13, 0.14, skin);
      limbs.push({ leg, arm, side });
    }
    if (seed % 4 === 0) {
      box(body, 0, 1.17, -0.151, 0.46, 0.07, 0.018, whiteMat);
      box(body, 0, 1.5, 0, 0.5, 0.055, 0.36, orangeMat);
      const badge = new T.Mesh(
        new T.PlaneGeometry(0.18, 0.18),
        new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
      );
      badge.rotation.y = Math.PI;
      badge.position.set(-0.11, 1.32, -0.16);
      body.add(badge);
    } else if (seed % 3 === 0)
      box(body, 0, 1.15, 0.23, 0.34, 0.46, 0.21, pedestrianJackets[(seed + 2) % 6]);
    const shadow = new T.Mesh(new T.CircleGeometry(0.35, 16), personShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);
    const scale = 1 + (seed % 4) * 0.045;
    root.scale.setScalar(scale);
    root.userData = { body, limbs };
    root.traverse((mesh) => {
      if (mesh.isMesh && mesh !== shadow) mesh.castShadow = !lowPower;
    });
    scene.add(root);
    return root;
  }

  const pedestrians = [];

  for (let j = 0; j < roadsZ.length - 1; j++)
    for (let i = 0; i < roadsX.length - 1; i++) {
      const seed = j * (roadsX.length - 1) + i,
        left = roadsX[i] + ROAD / 2 + 1.05,
        right = roadsX[i + 1] - ROAD / 2 - 1.05;
      const top = roadsZ[j] + ROAD / 2 + 1.05,
        bottom = roadsZ[j + 1] - ROAD / 2 - 1.05;
      const isPark = isParkBlock(i, j) && !special.has(i + ',' + j),
        cx = (left + right) / 2,
        cz = (top + bottom) / 2;
      const routes = [
        [
          { x: left, z: top },
          { x: right, z: top },
          { x: right, z: bottom },
          { x: left, z: bottom },
        ],
      ];
      // Strollers in parks follow a path toward the fountain and back.
      if (i === 3 && j === 3)
        routes.push([
          { x: cx - 11, z: cz - 9 },
          { x: cx + 11, z: cz - 9 },
          { x: cx + 11, z: cz + 10.5 },
          { x: cx - 11, z: cz + 10.5 },
        ]);
      else if (isPark)
        routes.push([
          { x: cx, z: top + 4 },
          { x: cx, z: cz - 4.5 },
        ]);
      for (let n = 0; n < routes.length; n++) {
        const route = routes[n];
        if (seed % 2) route.reverse();
        const leg = seed % route.length,
          start = route[leg],
          end = route[(leg + 1) % route.length],
          fraction = 0.18 + (seed % 5) * 0.13;
        const mesh = createPedestrian(seed + n * 31);
        mesh.position.set(
          start.x + (end.x - start.x) * fraction,
          0.39,
          start.z + (end.z - start.z) * fraction,
        );
        mesh.rotation.y = Math.atan2(-(end.x - start.x), -(end.z - start.z));
        pedestrians.push({
          mesh,
          route,
          target: (leg + 1) % route.length,
          speed: 0.85 + (seed % 5) * 0.12,
          wait: 0,
          arrivals: 0,
          phase: seed,
          seed,
        });
      }
    }

  function updatePedestrians(dt) {
    for (const person of pedestrians) {
      const mesh = person.mesh;
      mesh.visible = camera.position.distanceToSquared(mesh.position) < 110 * 110;
      if (state.mode !== 'playing') continue;
      let walking = false;
      if (person.wait > 0) person.wait = Math.max(0, person.wait - dt);
      else {
        const goal = person.route[person.target],
          dx = goal.x - mesh.position.x,
          dz = goal.z - mesh.position.z,
          remaining = Math.hypot(dx, dz);
        const step = Math.min(remaining, person.speed * dt);
        if (remaining > 0.001) {
          mesh.position.x += (dx / remaining) * step;
          mesh.position.z += (dz / remaining) * step;
          walking = true;
          const angle = Math.atan2(-dx, -dz),
            difference = Math.atan2(
              Math.sin(angle - mesh.rotation.y),
              Math.cos(angle - mesh.rotation.y),
            );
          mesh.rotation.y += difference * (1 - Math.exp(-dt * 10));
          person.phase += step * 7;
        }
        if (remaining <= step + 0.001) {
          person.target = (person.target + 1) % person.route.length;
          person.arrivals++;
          if (person.arrivals % 3 === 0) person.wait = 0.8 + (person.seed % 4) * 0.45;
        }
      }
      const swing = walking ? Math.sin(person.phase) * 0.44 : 0;
      for (const limb of mesh.userData.limbs) {
        limb.leg.rotation.x += (swing * limb.side - limb.leg.rotation.x) * (1 - Math.exp(-dt * 16));
        limb.arm.rotation.x +=
          (-swing * limb.side * 0.8 - limb.arm.rotation.x) * (1 - Math.exp(-dt * 16));
      }
      mesh.userData.body.position.y = walking ? Math.abs(Math.sin(person.phase)) * 0.028 : 0;
    }
  }
  return { updatePedestrians };
};
