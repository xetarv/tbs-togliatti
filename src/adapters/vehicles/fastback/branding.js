'use strict';

window.TBS.buildFastbackBranding = function ({
  makeTexture,
  skinX,
  T,
  body,
  logo,
  rounded,
  graphite,
}) {
  const label = makeTexture(
    (c, w, _h) => {
      c.fillStyle = '#eff4ed';
      c.font = 'bold 42px Segoe UI';
      c.textAlign = 'center';
      c.fillText('ТРАНСПОРТ БУДУЩЕГО', w / 2, 52);
      c.fillStyle = '#ff681f';
      c.font = 'bold 30px Segoe UI';
      c.fillText('САМАРА · 063', w / 2, 99);
    },
    640,
    128,
  );
  const plateMap = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#e8e9df';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#182729';
      c.font = 'bold 44px Segoe UI';
      c.textAlign = 'center';
      c.fillText('ТБС 063', w / 2, 56);
    },
    256,
    80,
  );
  function decal(texture, w, h, y, z, side) {
    const positions = [],
      uv = [],
      indices = [],
      nx = 20,
      ny = 4;
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const py = y + (j / ny - 0.5) * h,
          pz = z + (0.5 - i / nx) * w * side;
        positions.push(side * (skinX(py, pz) + 0.008), py, pz);
        uv.push(i / nx, j / ny);
        if (i < nx && j < ny) {
          const a = j * (nx + 1) + i;
          indices.push(a, a + 1, a + nx + 1, a + 1, a + nx + 2, a + nx + 1);
        }
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    body.add(
      new T.Mesh(
        geometry,
        new T.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
      ),
    );
  }
  for (const side of [-1, 1]) {
    decal(logo, 0.36, 0.36, 1.06, -0.48, side);
    decal(label, 0.99, 0.198, 1.07, 0.46, side);
    rounded(body, 0, 0.79, side * 2.947, 0.82, 0.28, 0.05, 0.022, graphite);
    const plate = new T.Mesh(
      new T.PlaneGeometry(0.72, 0.225),
      new T.MeshBasicMaterial({ map: plateMap, toneMapped: false }),
    );
    plate.rotation.y = side < 0 ? Math.PI : 0;
    plate.position.set(0, 0.79, side * 2.981);
    body.add(plate);
  }
  const roofMark = new T.Mesh(
    new T.PlaneGeometry(1.02, 1.02),
    new T.MeshBasicMaterial({ map: logo, transparent: true, depthWrite: false, toneMapped: false }),
  );
  roofMark.rotation.x = -Math.PI / 2;
  roofMark.position.set(0, 2.16, 0);
  body.add(roofMark);
};
