'use strict';

window.TBS.createDisplay = function ({
  createGraphics,
  lowPower,
  T,
  renderer,
  scene,
  camera,
  sky,
  facadeMaterials,
  mooredBoats,
  reflectionBuildings,
  car,
  getElement,
  resetControls,
  showToast,
}) {
  let savedQuality = lowPower ? 'low' : 'high';

  try {
    const saved = localStorage.getItem('tbs.graphicsQuality');
    if (['low', 'medium', 'high'].includes(saved)) savedQuality = saved;
  } catch {
    // Some browsers block localStorage for file:// pages; keep the device default.
  }

  const graphics = createGraphics({
    T,
    renderer,
    scene,
    camera,
    sky,
    car,
    water: scene.userData.waterMaterial,
    buildings: reflectionBuildings,
    facades: facadeMaterials,
    reflectObjects: mooredBoats.map((boat) => boat.mesh),
    initialQuality: savedQuality,
  });

  getElement('qualitySelect').value = graphics.quality;

  getElement('qualitySelect').addEventListener('focus', () => {
    resetControls();
  });

  getElement('qualitySelect').addEventListener('change', (e) => {
    graphics.setQuality(e.target.value);
    showToast('Качество графики: ' + e.target.options[e.target.selectedIndex].text);
  });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    graphics.resize();
  }

  addEventListener('resize', resize);
  return { graphics };
};
