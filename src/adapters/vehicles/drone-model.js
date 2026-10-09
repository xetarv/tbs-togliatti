'use strict';

window.TBS.createDroneModels = function ({ T, scene, dark, cyanMat, orangeMat, whiteMat, box }) {
  function createDrone() {
    const group = new T.Group(),
      rotors = [];
    box(group, 0, 0, 0, 2.2, 0.48, 1.7, whiteMat);
    box(group, 0, -0.4, 0, 1.3, 0.38, 1, orangeMat);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        box(group, sx * 1.45, 0, sz * 1.22, 2.2, 0.13, 0.14, dark).rotation.y = sx * sz * 0.35;
        const hub = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.12, 12), dark);
        hub.position.set(sx * 2.4, 0.08, sz * 1.8);
        group.add(hub);
        const rotor = box(group, sx * 2.4, 0.18, sz * 1.8, 1.6, 0.035, 0.13, cyanMat);
        rotors.push(rotor);
      }
    scene.add(group);
    return { group, rotors };
  }
  return { createDrone };
};
