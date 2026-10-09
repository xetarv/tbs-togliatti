'use strict';
window.TBS.buildQuarterCladding = function ({ T, plaster, claddingPanels, scene, x, z }) {
  const panelShape = new T.Shape();
  panelShape.moveTo(-0.48, -0.48);
  panelShape.lineTo(0.48, -0.48);
  panelShape.lineTo(0.48, 0.48);
  panelShape.lineTo(-0.48, 0.48);
  panelShape.closePath();
  const panelGeometry = new T.ExtrudeGeometry(panelShape, {
    depth: 0.96,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 1,
    steps: 1,
  });
  panelGeometry.translate(0, 0, -0.48);
  const facing = plaster.clone();
  facing.color.setHex(0xc9c3b3);
  facing.bumpScale = 0.008;
  const panels = new T.InstancedMesh(panelGeometry, facing, claddingPanels.length),
    panelPose = new T.Object3D();
  panels.name = 'Start quarter bevelled facade panels';
  claddingPanels.forEach((p, i) => {
    panelPose.position.set(p.x, p.y, p.z);
    panelPose.rotation.set(0, p.side ? Math.PI / 2 : 0, 0);
    panelPose.scale.set(p.w, p.h, 0.065);
    panelPose.updateMatrix();
    panels.setMatrixAt(i, panelPose.matrix);
    panels.setColorAt(i, new T.Color().setScalar(0.94 + ((i * 17) % 11) * 0.006));
  });
  panels.receiveShadow = true;
  panels.castShadow = true;
  scene.add(panels);
  scene.userData.showcaseQuarter = {
    x,
    z,
    trees: 3,
    windowBays: 27,
    claddingPanels: claddingPanels.length,
  };
};
