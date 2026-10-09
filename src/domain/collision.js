'use strict';

(() => {
  // Separating-axis collision test for two oriented vehicle footprints.
  function vehicleContact(first, second) {
    const { x: ax, z: az, heading: angleA } = first;
    const { x: bx, z: bz, heading: angleB } = second;
    const forwardA = { x: Math.sin(angleA), z: -Math.cos(angleA) },
      sideA = { x: Math.cos(angleA), z: Math.sin(angleA) };
    const forwardB = { x: Math.sin(angleB), z: -Math.cos(angleB) },
      sideB = { x: Math.cos(angleB), z: Math.sin(angleB) };
    const dot = (a, b) => a.x * b.x + a.z * b.z;
    let contact = null;
    for (const axis of [forwardA, sideA, forwardB, sideB]) {
      const radiusA = 2.95 * Math.abs(dot(axis, forwardA)) + 1.65 * Math.abs(dot(axis, sideA));
      const radiusB = 2.95 * Math.abs(dot(axis, forwardB)) + 1.65 * Math.abs(dot(axis, sideB));
      const separation = (ax - bx) * axis.x + (az - bz) * axis.z,
        depth = radiusA + radiusB - Math.abs(separation);
      if (depth <= 0) return null;
      if (!contact || depth < contact.depth) {
        const sign = separation < 0 ? -1 : 1;
        contact = { x: axis.x * sign, z: axis.z * sign, depth };
      }
    }
    return contact;
  }
  globalThis.TBS.domain.collision = Object.freeze({ vehicleContact });
})();
