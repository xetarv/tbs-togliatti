'use strict';

globalThis.TBS.application.createGame = function ({ state, physics, traffic, ports }) {
  let hudTime = 0;
  let minimapTime = 0;

  function handlePhysicsEvents(events) {
    for (const event of events) {
      if (event.type === 'impact') ports.audio.impact(event.speed);
      if (event.type === 'recharged')
        ports.notifications.showToast('ТБС: экспресс-зарядка завершена');
    }
  }

  function updateSimulation(dt) {
    if (state.mode !== 'playing') return;
    ports.audio.advance(dt);
    traffic.advanceTraffic(dt);
    ports.traffic.update(dt);
    handlePhysicsEvents(physics.updatePhysics(dt));
  }

  function refreshHud(dt) {
    hudTime += dt;
    minimapTime += dt;
    if (hudTime >= 0.1) {
      hudTime = 0;
      ports.hud.updateHud();
    }
    if (minimapTime >= 0.1) {
      minimapTime = 0;
      ports.minimap.drawMini();
    }
  }

  function step(dt) {
    const animationDt = state.mode === 'paused' ? 0 : dt;
    ports.timeline.advance(animationDt);
    const previousSpeed = state.player.speed;
    updateSimulation(dt);
    ports.pedestrians.updatePedestrians(dt);
    const braking = ports.vehicle.updatePlayerCar(dt, previousSpeed);
    ports.audio.updateSound(braking);
    ports.world.updateWorld(animationDt);
    ports.drones.updateDrones();
    ports.markers.updateMarkers(animationDt);
    ports.camera.updateCamera(dt);
    ports.lighting.updateLighting(dt);
    ports.graphics.render(animationDt, ports.timeline.daylight());
    refreshHud(dt);
  }

  function initialize() {
    ports.hud.updateHud();
    ports.minimap.drawMini();
  }

  return Object.freeze({ step, initialize });
};
