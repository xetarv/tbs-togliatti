'use strict';
window.TBS.createPassengerBodyBuilder = function ({
  T,
  box,
  dark,
  mat,
  coachwork,
  cyanMat,
  glazedQuad,
  detailBar,
  orangeMat,
  whiteMat,
  markTexture,
  makeTexture,
}) {
  function createPassengerShell(group, paint, variant = 'sedan') {
    const compact = variant === 'compact',
      roofRear = compact ? 1.03 : 0.73;
    // Continuous cross sections give the hood, shoulders and wheel arches a shaped silhouette.
    const stations = [
      [-2.84, 1.06, 1.04],
      [-2.58, 1.27, 1.16],
      [-2.1, 1.36, 1.27],
      [-1.5, 1.35, 1.35],
      [-0.8, 1.3, 1.35],
      [0.2, 1.29, 1.34],
      [1.2, 1.34, 1.32],
      [1.85, 1.37, 1.3],
      [2.45, 1.28, 1.2],
      [2.81, 1.08, 1.1],
    ];
    const positions = [],
      indices = [],
      samples = 100,
      sectionWidth = 7;

    for (let n = 0; n <= samples; n++) {
      const z = -2.84 + (n * 5.65) / samples;
      let i = 0;
      while (i < stations.length - 2 && z > stations[i + 1][0]) i++;
      const a = stations[i],
        b = stations[i + 1],
        t = (z - a[0]) / (b[0] - a[0]),
        smooth = t * t * (3 - 2 * t),
        w = a[1] + (b[1] - a[1]) * smooth,
        h = a[2] + (b[2] - a[2]) * smooth;
      const wheelDistance = Math.min(Math.abs(z - 1.75), Math.abs(z + 1.75));
      const low =
        wheelDistance < 0.63
          ? Math.max(0.6, 0.52 + Math.sqrt(0.63 * 0.63 - wheelDistance * wheelDistance))
          : 0.6;
      const section = [
        [-w, low],
        [-w, h - 0.1],
        [-w * 0.82, h],
        [0, h + 0.045],
        [w * 0.82, h],
        [w, h - 0.1],
        [w, low],
      ];
      for (const [x, y] of section) positions.push(x, y, z);
      if (n < samples)
        for (let side = 0; side < sectionWidth - 1; side++) {
          const v = n * sectionWidth + side;
          indices.push(v, v + sectionWidth, v + 1, v + 1, v + sectionWidth, v + sectionWidth + 1);
        }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const shell = new T.Mesh(geometry, paint);
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);
    for (const z of [-2.81, 2.78]) box(group, 0, 0.84, z, 2.1, 0.43, 0.12, paint);
    box(group, 0, 0.57, 0, 2.25, 0.18, 4.6, dark);
    const interior = mat(0x182127, 0, 0.93),
      seatMat = mat(0x4a5758, 0, 0.86),
      alloy = mat(0xa4b3b5, 0.85, 0.22);
    const glazing = new T.MeshPhysicalMaterial({
      color: 0x88b9c5,
      metalness: 0.12,
      roughness: 0.13,
      clearcoat: 1,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: T.DoubleSide,
      envMapIntensity: 1.1,
    });
    // An open cabin with separate glass surfaces reveals the seats and dashboard.
    box(group, 0, 1.3, -0.05, 2.2, 0.12, 2.4, interior);
    box(group, 0, 1.48, -1.04, 2.03, 0.23, 0.38, interior);
    for (const side of [-1, 1])
      for (const z of [-0.5, 0.62]) {
        const seat = coachwork(group, 0.72, 0.7, 0.12, 1.36, seatMat);
        seat.position.set(side * 0.57, 1.36, z);
        const back = box(group, side * 0.57, 1.64, z + 0.26, 0.67, 0.62, 0.15, seatMat);
        back.rotation.x = -0.13;
        box(group, side * 0.57, 1.99, z + 0.28, 0.38, 0.23, 0.13, interior);
      }
    const steeringWheel = new T.Mesh(new T.TorusGeometry(0.23, 0.034, 8, 24), interior);
    steeringWheel.position.set(-0.57, 1.71, -0.88);
    steeringWheel.rotation.x = -0.3;
    group.add(steeringWheel);
    group.userData.steeringWheel = steeringWheel;
    box(group, 0, 1.6, -1.06, 0.39, 0.23, 0.04, cyanMat);
    {
      const roof = coachwork(group, 1.93, compact ? 1.98 : 1.68, 0.045, 2.12, paint);
      roof.position.z = compact ? 0.05 : -0.1;
    }
    glazedQuad(
      group,
      [
        [-1.04, 1.4, -1.48],
        [1.04, 1.4, -1.48],
        [0.91, 2.1, -0.93],
        [-0.91, 2.1, -0.93],
      ],
      glazing,
    );
    glazedQuad(
      group,
      [
        [-0.91, 2.1, roofRear],
        [0.91, 2.1, roofRear],
        [1.08, 1.4, 1.39],
        [-1.08, 1.4, 1.39],
      ],
      glazing,
    );
    for (const side of [-1, 1]) {
      const bottomFront = [side * 1.12, 1.39, -1.45],
        topFront = [side * 0.94, 2.1, -0.9],
        topBack = [side * 0.94, 2.1, roofRear - 0.02],
        bottomBack = [side * 1.13, 1.39, 1.38];
      glazedQuad(group, [bottomFront, topFront, topBack, bottomBack], glazing);
      detailBar(group, bottomFront, topFront, 0.055, paint);
      detailBar(group, topFront, topBack, 0.05, paint);
      detailBar(group, topBack, bottomBack, 0.08, paint);
      detailBar(group, bottomBack, bottomFront, 0.025, alloy);
      detailBar(group, [side * 1.13, 1.4, 0.05], [side * 0.95, 2.1, 0.05], 0.045, interior);
      detailBar(group, [side * 1.31, 0.74, -0.95], [side * 1.31, 1.31, -0.97], 0.012, dark);
      detailBar(group, [side * 1.31, 0.72, 0.16], [side * 1.31, 1.32, 0.16], 0.012, dark);
      box(group, side * 1.32, 1.25, -0.05, 0.035, 0.055, 0.28, alloy);
      box(group, side * 1.32, 1.25, 0.99, 0.035, 0.055, 0.25, alloy);
      box(group, side * 1.31, 0.62, 0.05, 0.07, 0.12, 1.98, dark);
      box(group, side * 1.345, 0.77, 0.04, 0.025, 0.055, 1.85, orangeMat);
      const mirror = coachwork(group, 0.29, 0.39, 0.12, 1.55, paint);
      mirror.position.x = side * 1.5;
      mirror.position.z = -1.04;
      box(group, side * 1.5, 1.62, -0.84, 0.25, 0.1, 0.025, alloy);
      // Recessed lamp housings, individual lenses and a daytime-running light strip.
      box(group, side * 0.89, 1.06, -2.79, 0.69, 0.28, 0.13, interior);
      for (let lamp = 0; lamp < 3; lamp++) {
        const lens = new T.Mesh(
          new T.SphereGeometry(0.072, 12, 8),
          new T.MeshBasicMaterial({ color: 0xe5faff, toneMapped: false }),
        );
        lens.scale.z = 0.4;
        lens.position.set(side * (0.66 + lamp * 0.18), 1.07, -2.875);
        group.add(lens);
      }
      detailBar(group, [side * 0.56, 1.22, -2.76], [side * 1.21, 1.2, -2.58], 0.022, whiteMat);
      box(group, side * 0.88, 0.73, -2.76, 0.4, 0.12, 0.09, dark);
      const badge = new T.Mesh(
        new T.PlaneGeometry(0.45, 0.45),
        new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
      );
      badge.rotation.y = (side * Math.PI) / 2;
      badge.position.set(side * 1.345, 1.01, -0.48);
      group.add(badge);
    }
    for (let fin = 0; fin < 5; fin++)
      box(group, (fin - 2) * 0.25, 0.68, 2.72, 0.065, 0.2, 0.38, dark);
    const plateTexture = makeTexture(
      (c, w, h) => {
        c.fillStyle = '#e0e7e3';
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#15242c';
        c.font = 'bold 45px sans-serif';
        c.textAlign = 'center';
        c.fillText('ТБС 063', w / 2, 55);
      },
      256,
      80,
    );
    const plate = new T.Mesh(
      new T.PlaneGeometry(0.87, 0.27),
      new T.MeshBasicMaterial({ map: plateTexture, toneMapped: false }),
    );
    plate.position.set(0, 0.89, 2.88);
    group.add(plate);
    group.userData.detailedBody = true;
  }
  return { createPassengerShell };
};
