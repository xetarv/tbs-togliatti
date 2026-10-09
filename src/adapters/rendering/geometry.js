'use strict';

window.TBS.createGeometryHelpers = function ({ T }) {
  function wedge(parent, width, zFront, zBack, bottom, frontHeight, backHeight, material) {
    const a = -width / 2,
      b = width / 2;
    const vertices = new Float32Array([
      a,
      bottom,
      zFront,
      b,
      bottom,
      zFront,
      b,
      bottom,
      zBack,
      a,
      bottom,
      zBack,
      a,
      frontHeight,
      zFront,
      b,
      frontHeight,
      zFront,
      b,
      backHeight,
      zBack,
      a,
      backHeight,
      zBack,
    ]);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(vertices, 3));
    geometry.setIndex([
      0, 5, 1, 0, 4, 5, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2, 4, 7, 6, 4, 6, 5, 0,
      1, 2, 0, 2, 3,
    ]);
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function detailBar(parent, a, b, r, material) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      delta = end.clone().sub(start);
    const mesh = new T.Mesh(new T.CylinderGeometry(r, r, delta.length(), 8), material);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  return { detailBar, wedge };
};
