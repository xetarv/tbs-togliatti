'use strict';

window.TBS.buildFastbackInterior = function ({
  rounded,
  body,
  leather,
  fabric,
  line,
  alloy,
  stitch,
  box,
  graphite,
  T,
  rubber,
  makeTexture,
}) {
  rounded(body, 0, 1.13, 0.05, 2.12, 0.14, 2.68, 0.055, leather);
  rounded(body, 0, 1.4, -1.15, 2.05, 0.2, 0.45, 0.09, leather);
  for (const side of [-1, 1]) {
    for (const z of [-0.32, 0.82]) {
      rounded(body, side * 0.55, 1.245, z, 0.72, 0.18, 0.66, 0.08, leather);
      rounded(body, side * 0.55, 1.32, z - 0.02, 0.48, 0.045, 0.47, 0.02, fabric);
      const back = rounded(body, side * 0.55, 1.54, z + 0.26, 0.68, 0.52, 0.17, 0.075, leather);
      back.rotation.x = -0.17;
      const insert = rounded(body, side * 0.55, 1.54, z + 0.162, 0.43, 0.36, 0.025, 0.012, fabric);
      insert.rotation.x = -0.17;
      rounded(body, side * 0.55, 1.855, z + 0.31, 0.36, 0.2, 0.15, 0.065, leather);
      for (const edge of [-1, 1]) {
        line(
          body,
          [
            [side * 0.55 + edge * 0.12, 1.78, z + 0.29],
            [side * 0.55 + edge * 0.12, 1.87, z + 0.31],
          ],
          0.012,
          alloy,
        );
        line(
          body,
          [
            [side * 0.55 + edge * 0.25, 1.342, z - 0.24],
            [side * 0.55 + edge * 0.25, 1.342, z + 0.19],
            [side * 0.55 + edge * 0.25, 1.73, z + 0.13],
          ],
          0.004,
          stitch,
        );
      }
    }
    rounded(body, side * 1.04, 1.35, 0.05, 0.1, 0.22, 1.68, 0.04, leather);
    rounded(body, side * 0.97, 1.42, -0.2, 0.1, 0.055, 0.29, 0.024, alloy);
    for (let n = 0; n < 5; n++)
      box(body, side * 0.81 + n * 0.032, 1.43, -0.915, 0.018, 0.06, 0.02, graphite);
  }
  rounded(body, 0, 1.28, -0.15, 0.25, 0.2, 0.87, 0.08, leather);
  rounded(body, 0, 1.42, -0.43, 0.08, 0.08, 0.13, 0.03, alloy);
  for (const z of [-0.14, 0.07]) {
    const cup = new T.Mesh(new T.TorusGeometry(0.06, 0.01, 8, 24), rubber);
    cup.rotation.x = Math.PI / 2;
    cup.position.set(0, 1.39, z);
    body.add(cup);
  }
  const steering = new T.Group();
  steering.position.set(-0.55, 1.52, -0.78);
  steering.rotation.x = -0.2;
  body.add(steering);
  steering.add(new T.Mesh(new T.TorusGeometry(0.19, 0.023, 12, 40), rubber));
  rounded(steering, 0, 0, 0, 0.15, 0.1, 0.05, 0.02, leather);
  for (const side of [-1, 1])
    line(
      steering,
      [
        [side * 0.065, -0.01, 0],
        [side * 0.17, 0.04, 0],
      ],
      0.012,
      alloy,
    );
  line(
    steering,
    [
      [0, -0.04, 0],
      [0, -0.17, 0],
    ],
    0.017,
    graphite,
  );
  const dashboard = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#0b1820';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#88d8d8';
      c.font = 'bold 42px Segoe UI';
      c.fillText('ТБС', 24, 61);
      c.font = '20px Segoe UI';
      c.fillText('063 / READY', 130, 58);
      c.fillStyle = '#ff641a';
      c.fillRect(24, 86, 204, 4);
    },
    256,
    128,
  );
  const screen = new T.Mesh(
    new T.PlaneGeometry(0.62, 0.31),
    new T.MeshBasicMaterial({ map: dashboard, toneMapped: false }),
  );
  screen.position.set(0, 1.53, -0.914);
  screen.rotation.x = -0.09;
  body.add(screen);
  rounded(body, 0, 1.95, -0.84, 0.32, 0.11, 0.09, 0.04, graphite);
  box(body, 0, 1.95, -0.79, 0.27, 0.075, 0.008, alloy);
  return { steering };
};
