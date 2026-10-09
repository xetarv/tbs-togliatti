'use strict';
window.TBS.buildTrafficCarSuspension = function ({ T, group, shadow, wheels, unitBox }) {
  const suspension = new T.Group();
  for (const part of [...group.children])
    if (part !== shadow && !wheels.some((w) => w.steering === part)) suspension.add(part);
  const fittings = new Map();
  for (const part of suspension.children)
    if (part.isMesh && part.geometry === unitBox) {
      if (!fittings.has(part.material)) fittings.set(part.material, []);
      fittings.get(part.material).push(part);
    }
  for (const [material, parts] of fittings)
    if (parts.length >= 3) {
      const batch = new T.InstancedMesh(unitBox, material, parts.length);
      parts.forEach((part, i) => {
        part.updateMatrix();
        batch.setMatrixAt(i, part.matrix);
        suspension.remove(part);
      });
      batch.castShadow = parts.some((part) => part.castShadow);
      batch.receiveShadow = true;
      suspension.add(batch);
    }
  group.add(suspension);
  group.userData.body = suspension;
};
