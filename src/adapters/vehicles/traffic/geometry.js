'use strict';
window.TBS.createTrafficCarGeometry = function ({ T }) {
  function coachwork(parent, w, length, height, y, material) {
    const r = Math.min(0.24, w * 0.42, length * 0.42),
      x = -w / 2,
      z = -length / 2,
      shape = new T.Shape();
    shape.moveTo(x + r, z);
    shape.lineTo(x + w - r, z);
    shape.quadraticCurveTo(x + w, z, x + w, z + r);
    shape.lineTo(x + w, z + length - r);
    shape.quadraticCurveTo(x + w, z + length, x + w - r, z + length);
    shape.lineTo(x + r, z + length);
    shape.quadraticCurveTo(x, z + length, x, z + length - r);
    shape.lineTo(x, z + r);
    shape.quadraticCurveTo(x, z, x + r, z);
    const mesh = new T.Mesh(
      new T.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.075,
        bevelThickness: 0.075,
        curveSegments: 6,
      }),
      material,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function glazedQuad(parent, points, material) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }
  return { coachwork, glazedQuad };
};
