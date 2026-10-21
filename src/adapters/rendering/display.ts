'use strict';

window.TBS.createDisplay = function ({
  listen,
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
}: DisplayOptions) {
  let savedQuality: GraphicsPort['quality'] = lowPower ? 'low' : 'high';

  try {
    const saved = localStorage.getItem('tbs.graphicsQuality');
    if (['low', 'medium', 'high'].includes(saved!)) savedQuality = saved as GraphicsPort['quality'];
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
    water: scene.userData.waterMaterial!,
    buildings: reflectionBuildings,
    facades: facadeMaterials,
    reflectObjects: mooredBoats.map((boat) => boat.mesh),
    initialQuality: savedQuality,
  });

  (getElement('qualitySelect') as HTMLSelectElement).value = graphics.quality;

  listen(getElement('qualitySelect'), 'focus', () => {
    resetControls();
  });

  listen(getElement('qualitySelect'), 'change', (e: Event & { target: EventTarget | null }) => {
    graphics.setQuality((e.target as HTMLSelectElement).value);
    showToast(
      'Качество графики: ' +
        (e.target as HTMLSelectElement).options[(e.target as HTMLSelectElement).selectedIndex].text,
    );
  });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    graphics.resize();
  }

  listen(window, 'resize', resize);
  return { graphics };
};
