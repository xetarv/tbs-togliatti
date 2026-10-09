'use strict';

window.TBS.createFastbackGeometry = function ({ meshData, T }) {
  function bodyWidth(z, k = 1) {
    const rows = meshData.stations;
    let i = 0;
    while (i < rows.length - 2 && z > rows[i + 1][0]) i++;
    const t = (z - rows[i][0]) / (rows[i + 1][0] - rows[i][0]),
      a = rows[Math.max(0, i - 1)][k],
      b = rows[i][k],
      c = rows[i + 1][k],
      d = rows[Math.min(rows.length - 1, i + 2)][k];
    return (
      0.5 *
      (2 * b +
        (-a + c) * t +
        (2 * a - 5 * b + 4 * c - d) * t * t +
        (-a + 3 * b - 3 * c + d) * t * t * t)
    );
  }
  function skinX(y, z) {
    const q = Math.min(Math.abs(z - 1.75), Math.abs(z + 1.75)),
      arch = Math.sqrt(Math.max(0, 1 - (q / 0.635) ** 2)),
      low = q < 0.635 ? Math.max(0.45, 0.52 + 0.635 * arch) : 0.45,
      u = (y - low) / (bodyWidth(z, 2) - low);
    return bodyWidth(z) - (0.11 - 0.085 * arch) * (1 - u) ** 2 + 0.017 * Math.sin(u * Math.PI);
  }
  const boxGeometry = new T.BoxGeometry(1, 1, 1),
    roundedCache = new Map();
  function box(parent, x, y, z, w, h, d, mat) {
    const m = new T.Mesh(boxGeometry, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function rounded(parent, x, y, z, w, h, d, r, mat) {
    const key = [w, h, d, r].join(':');
    let g = roundedCache.get(key);
    if (!g) {
      g = new T.BoxGeometry(w, h, d, 8, 8, 8);
      const p = g.attributes.position,
        n = g.attributes.normal,
        v = new T.Vector3(),
        core = new T.Vector3(),
        delta = new T.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        core.set(
          Math.max(-w / 2 + r, Math.min(w / 2 - r, v.x)),
          Math.max(-h / 2 + r, Math.min(h / 2 - r, v.y)),
          Math.max(-d / 2 + r, Math.min(d / 2 - r, v.z)),
        );
        delta.copy(v).sub(core).normalize();
        v.copy(core).addScaledVector(delta, r);
        p.setXYZ(i, v.x, v.y, v.z);
        n.setXYZ(i, delta.x, delta.y, delta.z);
      }
      roundedCache.set(key, g);
    }
    const m = new T.Mesh(g, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function line(parent, points, r, mat) {
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
      m = new T.Mesh(new T.TubeGeometry(curve, Math.max(18, points.length * 5), r, 6, false), mat);
    parent.add(m);
    m.castShadow = true;
    return m;
  }
  function lens(parent, x, y, z, sx, sy, sz, mat) {
    const m = new T.Mesh(new T.SphereGeometry(1, 24, 14), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  }
  return { boxGeometry, box, rounded, line, lens, skinX, bodyWidth };
};
