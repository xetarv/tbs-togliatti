'use strict';

window.TBS.buildFastbackWheels = function ({
  T,
  car,
  rubber,
  graphite,
  rotorSteel,
  rounded,
  orange,
  alloy,
  lens,
}) {
  const wheels = [];
  const tireProfile = [
    [0.345, -0.175],
    [0.45, -0.18],
    [0.505, -0.13],
    [0.52, -0.08],
    [0.52, 0.08],
    [0.505, 0.13],
    [0.45, 0.18],
    [0.345, 0.175],
  ].map(([r, y]) => new T.Vector2(r, y));
  const tireGeometry = new T.LatheGeometry(tireProfile, 64),
    treadGeometry = new T.BoxGeometry(0.13, 0.013, 0.032);
  for (const side of [-1, 1])
    for (const z of [-1.75, 1.75]) {
      const steering = new T.Group(),
        rolling = new T.Group();
      steering.name = (z < 0 ? 'front' : 'rear') + (side < 0 ? '-left' : '-right');
      steering.position.set(side * 1.38, 0.52, z);
      car.add(steering);
      steering.add(rolling);
      wheels.push({ steering, rolling, front: z < 0 });
      const tire = new T.Mesh(tireGeometry, rubber);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      rolling.add(tire);
      const barrel = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.29, 48, 1, true), graphite);
      barrel.rotation.z = Math.PI / 2;
      rolling.add(barrel);
      const rotor = new T.Mesh(new T.CylinderGeometry(0.31, 0.31, 0.025, 48), rotorSteel);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.x = side * 0.12;
      rolling.add(rotor);
      rounded(steering, side * 0.16, 0.09, 0.25, 0.1, 0.24, 0.12, 0.045, orange);
      const rim = new T.Mesh(new T.TorusGeometry(0.362, 0.017, 10, 64), alloy);
      rim.rotation.y = Math.PI / 2;
      rim.position.x = side * 0.188;
      rolling.add(rim);
      for (let n = 0; n < 10; n++) {
        const a = (n * Math.PI) / 5,
          points = [
            [0.11, a - 0.1],
            [0.34, a + 0.08],
            [0.34, a + 0.19],
            [0.12, a + 0.13],
          ],
          positions = [];
        for (const [r, t] of points) positions.push(side * 0.197, Math.cos(t) * r, Math.sin(t) * r);
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        g.setIndex(side > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
        g.computeVertexNormals();
        rolling.add(new T.Mesh(g, alloy));
      }
      const cap = new T.Mesh(new T.CylinderGeometry(0.105, 0.105, 0.045, 32), graphite);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = side * 0.205;
      rolling.add(cap);
      for (let n = 0; n < 5; n++) {
        const a = (n * Math.PI * 2) / 5;
        lens(
          rolling,
          side * 0.232,
          Math.cos(a) * 0.071,
          Math.sin(a) * 0.071,
          0.014,
          0.014,
          0.014,
          alloy,
        );
      }
      const treads = new T.InstancedMesh(treadGeometry, graphite, 128),
        pose = new T.Object3D();
      for (let n = 0; n < 64; n++)
        for (let band = 0; band < 2; band++) {
          const a = (n * Math.PI) / 32;
          pose.position.set((band - 0.5) * 0.17, Math.cos(a) * 0.518, Math.sin(a) * 0.518);
          pose.rotation.set(a, band ? 0.22 : -0.22, 0);
          pose.updateMatrix();
          treads.setMatrixAt(n * 2 + band, pose.matrix);
        }
      rolling.add(treads);
      for (const dx of [-0.075, 0.075]) {
        const groove = new T.Mesh(new T.TorusGeometry(0.519, 0.006, 4, 64), rubber);
        groove.rotation.y = Math.PI / 2;
        groove.position.x = dx;
        rolling.add(groove);
      }
    }
  return { wheels };
};
