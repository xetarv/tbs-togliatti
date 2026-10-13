'use strict';

window.TBS.createFastback = function (options: FastbackOptions): FastbackCar {
  const { T, scene } = options;
  const car = new T.Group();
  car.name = 'TBS Fastback 063';
  const body = new T.Group();
  body.name = 'sprung-body';
  car.add(body);
  const parts: FastbackBaseParts = { car, body };
  const materials = window.TBS.createFastbackMaterials({ ...options, ...parts });
  Object.assign(parts, materials) satisfies FastbackMaterialParts;
  // Object.assign mutates parts without widening its TypeScript type; each assertion follows that stage.
  const geometry = window.TBS.createFastbackGeometry({
    ...options,
    ...(parts as FastbackMaterialParts),
  });
  Object.assign(parts as FastbackMaterialParts, geometry) satisfies FastbackGeometryParts;
  window.TBS.buildFastbackExterior({ ...options, ...(parts as FastbackGeometryParts) });
  const interior = window.TBS.buildFastbackInterior({
    ...options,
    ...(parts as FastbackGeometryParts),
  });
  Object.assign(parts as FastbackGeometryParts, interior) satisfies FastbackInteriorParts;
  window.TBS.buildFastbackBranding({ ...options, ...(parts as FastbackInteriorParts) });
  const wheelParts = window.TBS.buildFastbackWheels({
    ...options,
    ...(parts as FastbackInteriorParts),
  });
  Object.assign(parts as FastbackInteriorParts, wheelParts) satisfies FastbackWheelParts;
  const lighting = window.TBS.buildFastbackLighting({
    ...options,
    ...(parts as FastbackWheelParts),
  });
  Object.assign(parts as FastbackWheelParts, lighting) satisfies FastbackCompleteParts;
  const { paint, wheels, headlights, brake, reverse, steering, boxGeometry } =
    parts as FastbackCompleteParts;
  const batches = new Map<ThreeMaterialHandle | ThreeMaterialHandle[], ThreeFastbackMesh[]>();
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
  } satisfies FastbackCarUserData);
  scene.add(car);
  // The preceding checked Object.assign populated this exact userData shape.
  return car as FastbackCar;
};
