'use strict';

/** Build the frame scenario without starting its scheduler; the supplied state remains mutable. */
globalThis.TBS.application.createGame = function ({
  state,
  physics,
  traffic,
  ports,
}: GameDependencies): Readonly<GameScenario> {
  let hudTime = 0;
  let minimapTime = 0;

  function handlePhysicsEvents(events: PhysicsEvent[]): void {
    for (const event of events) {
      if (event.type === 'impact') ports.audio.impact(event.speed);
      if (event.type === 'recharged')
        ports.notifications.showToast('ТБС: экспресс-зарядка завершена');
    }
  }

  /** Elapsed seconds; simulation advances only while playing. */
  function updateSimulation(dt: number): void {
    if (state.mode !== 'playing') return;
    ports.audio.advance(dt);
    traffic.advanceTraffic(dt);
    ports.traffic.update(dt);
    handlePhysicsEvents(physics.updatePhysics(dt));
  }

  /** Elapsed seconds used by the HUD and minimap refresh timers. */
  function refreshHud(dt: number): void {
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

  /** Elapsed seconds supplied by the runtime, clamped there to [0, 0.05]. */
  function step(dt: number): void {
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

  /** Refresh the HUD and minimap without advancing time. */
  function initialize(): void {
    ports.hud.updateHud();
    ports.minimap.drawMini();
  }

  return Object.freeze({ step, initialize });
};
