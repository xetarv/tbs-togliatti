'use strict';

window.TBS.createLighting = function ({
  T,
  scene,
  lowPower,
  getElement,
  showToast,
  player,
  state,
  camera,
  ambientLight,
  sun,
  blueLight,
  sky,
  duskSun,
  nightWindows,
  streetFixtures,
  cityFacadeLights,
  car,
  getGraphics,
}) {
  let lightMode = 0;

  const lightModes = ['День', 'Вечер', 'Ночь', 'Авто'];

  const fogDay = new T.Color(0x91abb9),
    fogNight = new T.Color(0x142638);

  const sunlightDay = new T.Color(0xffd4a6),
    sunlightDusk = new T.Color(0xff9561);

  const reflectionMaterials = new Map();

  scene.traverse((object) => {
    if (object.material && !Array.isArray(object.material) && 'envMapIntensity' in object.material)
      reflectionMaterials.set(object.material, object.material.envMapIntensity);
  });

  const nearbyStreetLights = Array.from({ length: lowPower ? 1 : 3 }, () => {
    const lamp = new T.PointLight(0xffe1b3, 0, 18, 2);
    scene.add(lamp);
    return lamp;
  });

  const nearestFacadeLights = Array.from({ length: 3 }, () => {
    const lamp = new T.PointLight(0xffd09c, 0, 13, 2);
    scene.add(lamp);
    return lamp;
  });

  const moon = new T.Mesh(
    new T.SphereGeometry(5, 16, 12),
    new T.MeshBasicMaterial({ color: 0xd7e8ff, fog: false, toneMapped: false }),
  );

  scene.add(moon);

  let appliedLight = -1,
    lampSelectionX = Infinity,
    lampSelectionZ = Infinity;

  const skyDirection = new T.Vector3(),
    moonOffset = new T.Vector3(180, 170, -220);

  function toggleDaylight() {
    lightMode = (lightMode + 1) % lightModes.length;
    const button = getElement('daylightBtn');
    button.textContent = ['☀', '◒', '☾', '↻'][lightMode];
    button.title = 'Время суток: ' + lightModes[lightMode] + ' (N)';
    button.setAttribute('aria-label', button.title);
    showToast('Время суток: ' + lightModes[lightMode]);
  }

  getElement('daylightBtn').addEventListener('click', toggleDaylight);

  function updateLighting(dt) {
    sun.position.set(player.x - 35, 26 + 36 * state.lightValue, player.z + 40);
    sun.target.position.set(player.x, 0, player.z);
    sun.target.updateMatrixWorld();

    if (state.mode === 'playing') state.lightingClock += dt;
    const desired =
      lightMode === 3
        ? (Math.cos((state.lightingClock * Math.PI * 2) / 300) + 1) / 2
        : [1, 0.45, 0][lightMode];
    if (state.mode === 'playing')
      state.lightValue += (desired - state.lightValue) * (1 - Math.exp(-dt * 1.5));
    const night = 1 - state.lightValue;
    const nearbyFacades = cityFacadeLights
      .filter((p) => (p.x - camera.position.x) ** 2 + (p.z - camera.position.z) ** 2 < 85 * 85)
      .sort(
        (a, b) =>
          (a.x - camera.position.x) ** 2 +
          (a.z - camera.position.z) ** 2 -
          ((b.x - camera.position.x) ** 2 + (b.z - camera.position.z) ** 2),
      );
    nearestFacadeLights.forEach((lamp, i) => {
      const fixture = nearbyFacades[i];
      lamp.intensity = fixture ? night * 28 : 0;
      if (fixture) lamp.position.set(fixture.x, fixture.y, fixture.z);
    });
    for (const fixture of cityFacadeLights) fixture.poolMaterial.opacity = night * 0.12;
    const quarter = scene.userData.quarterLighting;
    if (quarter) {
      const near = Math.hypot(camera.position.x - quarter.x, camera.position.z - quarter.z) < 90;
      const level = getGraphics().quality === 'low' ? 0.55 : 1;
      quarter.entranceLight.intensity = near ? night * 42 * level : 0;
      quarter.windowLight.intensity = near && getGraphics().quality !== 'low' ? night * 16 : 0;
      quarter.bounce.intensity = near && getGraphics().quality !== 'low' ? state.lightValue * 9 : 0;
      quarter.lightStripMaterial.emissiveIntensity = 0.12 + night * 2.2;
      quarter.poolMaterial.opacity = night * 0.16;
    }
    for (const lamp of car.userData.headlights) lamp.intensity = 2.6 + night * 48;
    if (Math.abs(appliedLight - state.lightValue) > 0.0001) {
      appliedLight = state.lightValue;
      sky.material.uniforms.daylight.value = state.lightValue;
      scene.fog.color.copy(fogNight).lerp(fogDay, state.lightValue);
      ambientLight.intensity = 0.65 + 0.95 * state.lightValue;
      sun.intensity = 0.12 + 2.48 * state.lightValue;
      sun.color.copy(sunlightDusk).lerp(sunlightDay, state.lightValue);
      blueLight.intensity = 0.8 - 0.56 * state.lightValue;
      for (const material of nightWindows) material.emissiveIntensity = night * 0.9;
      for (const [material, base] of reflectionMaterials)
        material.envMapIntensity = base * (0.2 + 0.8 * state.lightValue);
      for (const fixture of streetFixtures) {
        fixture.halo.material.opacity = 0.08 + night * 0.65;
        fixture.pool.material.opacity = 0.04 + night * 0.42;
      }
      nearbyStreetLights.forEach((lamp) => {
        lamp.intensity = night * 32;
      });
    }
    if ((player.x - lampSelectionX) ** 2 + (player.z - lampSelectionZ) ** 2 > 4) {
      lampSelectionX = player.x;
      lampSelectionZ = player.z;
      const nearest = [...streetFixtures].sort(
        (a, b) =>
          (a.x - player.x) ** 2 +
          (a.z - player.z) ** 2 -
          ((b.x - player.x) ** 2 + (b.z - player.z) ** 2),
      );
      nearbyStreetLights.forEach((lamp, i) => {
        const fixture = nearest[i];
        if (fixture) lamp.position.set(fixture.x, 5.2, fixture.z);
      });
    }
    duskSun.visible = state.lightValue > 0.07;
    duskSun.material.color.copy(sun.color);
    duskSun.position.copy(camera.position).add(
      skyDirection
        .set(-35, 26 + 36 * state.lightValue, 40)
        .normalize()
        .multiplyScalar(380),
    );
    moon.visible = state.lightValue < 0.3;
    moon.position.copy(camera.position).add(moonOffset);
  }
  return { toggleDaylight, updateLighting };
};
