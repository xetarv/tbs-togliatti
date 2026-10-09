'use strict';

window.TBS.buildFastbackExterior = function ({
  meshData,
  T,
  materials,
  body,
  rounded,
  paint,
  rubber,
  graphite,
  box,
  line,
  orange,
  skinX,
  alloy,
  roof,
  led,
  lens,
  optics,
  brake,
  reverse,
  bodyWidth,
}) {
  for (const panel of meshData.panels) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(panel.position, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(panel.uv, 2));
    g.setIndex(panel.index);
    g.computeVertexNormals();
    const mesh = new T.Mesh(g, materials[panel.material]);
    mesh.name = panel.name;
    mesh.castShadow = panel.material !== 'glass';
    mesh.receiveShadow = panel.material !== 'glass';
    body.add(mesh);
  }
  rounded(body, 0, 0.59, -2.73, 2.35, 0.28, 0.4, 0.12, paint);
  rounded(body, 0, 0.59, 2.73, 2.43, 0.3, 0.4, 0.12, paint);
  rounded(body, 0, 0.79, -2.885, 1.8, 0.23, 0.13, 0.06, rubber);
  rounded(body, 0, 0.435, -2.8, 2.38, 0.07, 0.28, 0.033, graphite);
  rounded(body, 0, 0.455, 2.78, 2.22, 0.12, 0.35, 0.05, graphite);
  box(body, 0, 0.52, 0, 2.36, 0.14, 4.7, rubber);
  for (let n = -7; n <= 7; n++) box(body, n * 0.105, 0.79, -2.961, 0.018, 0.15, 0.022, graphite);
  for (const side of [-1, 1]) {
    rounded(body, side * 1.03, 0.84, -2.76, 0.34, 0.31, 0.3, 0.09, paint);
    rounded(body, side * 0.99, 0.8, 2.78, 0.34, 0.32, 0.27, 0.08, paint);
    rounded(body, side * 1.27, 0.48, 0, 0.18, 0.12, 2.2, 0.05, graphite);
    line(
      body,
      [
        [side * 1.28, 0.64, -1.02],
        [side * 1.285, 0.61, 0],
        [side * 1.3, 0.66, 1.04],
      ],
      0.025,
      orange,
    );
    // Flush door joints follow the changing width of the sculpted flanks.
    line(
      body,
      [
        [side * 1.4, 1.385, -1.42],
        [side * 1.32, 1.15, -0.95],
        [side * 1.24, 0.58, -0.98],
        [side * 1.23, 0.53, 0.12],
        [side * 1.32, 1.35, 0.14],
      ],
      0.009,
      rubber,
    );
    line(
      body,
      [
        [side * 1.32, 1.37, 0.14],
        [side * 1.25, 0.57, 0.15],
        [side * 1.32, 0.56, 1.02],
        [side * 1.4, 1.36, 1.37],
      ],
      0.009,
      rubber,
    );
    rounded(
      body,
      side * (skinX(1.265, -0.02) + 0.012),
      1.265,
      -0.02,
      0.026,
      0.045,
      0.24,
      0.011,
      alloy,
    );
    rounded(
      body,
      side * (skinX(1.275, 1.02) + 0.012),
      1.275,
      1.02,
      0.026,
      0.045,
      0.22,
      0.011,
      alloy,
    );
    // The window frame is a slim continuous seal; pillars sit over the glass.
    line(
      body,
      [
        [side * 1.115, 1.43, -1.45],
        [side * 0.945, 2.04, -0.68],
        [side * 0.963, 2.07, 0],
        [side * 0.945, 2.04, 0.7],
        [side * 1.115, 1.43, 1.6],
        [side * 1.13, 1.425, 0.05],
        [side * 1.115, 1.43, -1.45],
      ],
      0.022,
      rubber,
    );
    line(
      body,
      [
        [side * 1.13, 1.43, 0.15],
        [side * 0.963, 2.07, 0.07],
      ],
      0.034,
      roof,
    );
    line(
      body,
      [
        [side * 1.115, 1.43, -1.43],
        [side * 1.137, 1.42, 0],
        [side * 1.115, 1.43, 1.58],
      ],
      0.012,
      alloy,
    );
    line(
      body,
      [
        [side * 1.13, 1.44, -1.17],
        [side * 1.45, 1.5, -1.13],
      ],
      0.035,
      graphite,
    );
    rounded(body, side * 1.51, 1.51, -1.12, 0.31, 0.14, 0.36, 0.065, paint);
    rounded(body, side * 1.51, 1.51, -0.934, 0.25, 0.092, 0.016, 0.007, alloy);
    line(
      body,
      [
        [side * 1.39, 1.52, -1.28],
        [side * 1.61, 1.51, -1.27],
      ],
      0.011,
      led,
    );
    // Slim three-projector headlights with recessed optical elements.
    rounded(body, side * 0.78, 1.07, -2.91, 0.66, 0.17, 0.11, 0.05, rubber);
    for (let n = 0; n < 3; n++) {
      const x = side * (0.58 + n * 0.19);
      const ring = new T.Mesh(new T.TorusGeometry(0.049, 0.008, 10, 24), alloy);
      ring.position.set(x, 1.07, -2.972);
      body.add(ring);
      lens(body, x, 1.07, -2.976, 0.037, 0.036, 0.023, led);
      lens(body, x, 1.07, -2.99, 0.049, 0.048, 0.019, optics);
    }
    rounded(body, side * 0.78, 1.07, -2.997, 0.65, 0.165, 0.035, 0.017, optics);
    line(
      body,
      [
        [side * 0.46, 1.18, -2.88],
        [side * 0.83, 1.2, -2.82],
        [side * 1.17, 1.22, -2.64],
      ],
      0.019,
      led,
    );
    line(
      body,
      [
        [side * 0.52, 1.15, -2.68],
        [side * 0.68, 1.31, -2.08],
        [side * 0.81, 1.405, -1.54],
      ],
      0.008,
      rubber,
    );
    line(
      body,
      [
        [side * 0.3, 1.425, -1.5],
        [side * 0.7, 1.48, -1.44],
        [side * 0.98, 1.5, -1.39],
      ],
      0.015,
      rubber,
    );
    rounded(body, side * 0.75, 1.17, 2.923, 0.7, 0.13, 0.09, 0.045, rubber);
    line(
      body,
      [
        [side * 0.43, 1.17, 2.974],
        [side * 0.82, 1.18, 2.974],
        [side * 1.08, 1.21, 2.895],
      ],
      0.024,
      brake,
    );
    rounded(body, side * 0.7, 0.76, 2.94, 0.27, 0.07, 0.035, 0.016, reverse);
    for (const axle of [-1.75, 1.75]) {
      const points = [];
      for (let n = 0; n <= 32; n++) {
        const a = (n * Math.PI) / 32,
          z = axle + Math.cos(a) * 0.635;
        points.push([
          side * (bodyWidth(z) - 0.101 + 0.085 * Math.sin(a)),
          0.52 + Math.sin(a) * 0.635,
          z,
        ]);
      }
      line(body, points, 0.019, graphite);
    }
  }
  line(
    body,
    [
      [-1.1, 1.44, -1.51],
      [0, 1.435, -1.56],
      [1.1, 1.44, -1.51],
    ],
    0.018,
    rubber,
  );
  line(
    body,
    [
      [-0.94, 2.05, -0.72],
      [0, 2.115, -0.72],
      [0.94, 2.05, -0.72],
    ],
    0.022,
    roof,
  );
  line(
    body,
    [
      [-0.94, 2.05, 0.73],
      [0, 2.115, 0.73],
      [0.94, 2.05, 0.73],
    ],
    0.022,
    roof,
  );
  line(
    body,
    [
      [-1.1, 1.435, 1.65],
      [0, 1.435, 1.69],
      [1.1, 1.435, 1.65],
    ],
    0.013,
    rubber,
  );
  line(
    body,
    [
      [-1.08, 1.29, 2.56],
      [0, 1.32, 2.62],
      [1.08, 1.29, 2.56],
    ],
    0.01,
    rubber,
  );
  line(
    body,
    [
      [-0.44, 1.17, 2.98],
      [0, 1.17, 2.99],
      [0.44, 1.17, 2.98],
    ],
    0.014,
    brake,
  );
  for (let n = -2; n <= 2; n++) box(body, n * 0.29, 0.43, 2.77, 0.035, 0.18, 0.38, graphite);
};
