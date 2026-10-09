'use strict';

window.TBS.createFastback = function (options) {
  const { T, scene } = options;
  const car = new T.Group();
  car.name = 'TBS Fastback 063';
  const body = new T.Group();
  body.name = 'sprung-body';
  car.add(body);
  const parts = { car, body };
  const materials = window.TBS.createFastbackMaterials({ ...options, ...parts });
  Object.assign(parts, materials);
  const geometry = window.TBS.createFastbackGeometry({ ...options, ...parts });
  Object.assign(parts, geometry);
  window.TBS.buildFastbackExterior({ ...options, ...parts });
  const interior = window.TBS.buildFastbackInterior({ ...options, ...parts });
  Object.assign(parts, interior);
  window.TBS.buildFastbackBranding({ ...options, ...parts });
  const wheelParts = window.TBS.buildFastbackWheels({ ...options, ...parts });
  Object.assign(parts, wheelParts);
  const lighting = window.TBS.buildFastbackLighting({ ...options, ...parts });
  Object.assign(parts, lighting);
  const { paint, wheels, headlights, brake, reverse, steering, boxGeometry } = parts;
  const batches = new Map();
  for (const m of [...body.children])
    if (m.isMesh && m.geometry === boxGeometry) {
      const list = batches.get(m.material) || [];
      list.push(m);
      batches.set(m.material, list);
    }
  for (const [material, list] of batches)
    if (list.length > 2) {
      const batch = new T.InstancedMesh(boxGeometry, material, list.length);
      list.forEach((m, i) => {
        m.updateMatrix();
        batch.setMatrixAt(i, m.matrix);
        body.remove(m);
      });
      batch.castShadow = true;
      batch.receiveShadow = true;
      body.add(batch);
    }
  Object.assign(car.userData, {
    paint,
    body,
    wheels,
    wheelRadius: 0.52,
    headlights,
    brakeMaterial: brake,
    reverseMaterial: reverse,
    steeringWheel: steering,
    variant: 'fastback',
    detailedBody: true,
  });
  scene.add(car);
  return car;
};
