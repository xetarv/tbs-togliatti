'use strict';

window.TBS.createWorldAnimation = function ({
  visualAssets,
  state,
  mooredBoats,
  waterTexture,
  scene,
  flags,
  camera,
  fountainJets,
  districtLabels,
  worldState,
  WORLD_W,
}) {
  function updateWorld(animationDt) {
    visualAssets.wind.value = state.elapsed;
    for (const boat of mooredBoats) {
      boat.mesh.position.y = Math.sin(state.elapsed * 1.15 + boat.phase) * 0.055;
      boat.mesh.rotation.z = Math.sin(state.elapsed * 0.8 + boat.phase) * 0.018;
      boat.mesh.rotation.x = Math.cos(state.elapsed * 0.65 + boat.phase) * 0.012;
    }
    waterTexture.offset.x = (state.elapsed * 0.012) % 1;
    const waterShader = scene.userData.waterMaterial.userData.shader;
    if (waterShader) waterShader.uniforms.waveTime.value = state.elapsed;
    for (const flag of flags) {
      if (animationDt === 0 || camera.position.distanceToSquared(flag.position) > 110 * 110)
        continue;
      const pos = flag.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) + 1.4) / 2.8;
        pos.setZ(
          i,
          Math.sin(u * 7 - state.elapsed * 3.2 + flag.position.x) * 0.19 * u +
            Math.sin(u * 13 - state.elapsed * 4) * 0.04 * u,
        );
      }
      pos.needsUpdate = true;
      flag.geometry.computeVertexNormals();
    }
    fountainJets.forEach((jet, i) => {
      jet.scale.y = 1 + Math.sin(state.elapsed * 3 + i) * 0.08;
    });
    districtLabels.forEach((label) => {
      const range = camera.position.distanceTo(label.position);
      label.visible = range > 42 && range < 105;
    });
    worldState.maglevTrain.position.x = 8 + ((state.elapsed * 9) % (WORLD_W - 16));
  }
  return { updateWorld };
};
