'use strict';

/** @typedef {{type: 'impact', speed: number} | {type: 'recharged'}} PhysicsEvent */
/** @typedef {(dt: number) => void} FrameUpdate dt is elapsed time in seconds. */
/** @typedef {boolean | undefined} BrakingState Undefined is possible when control fields are absent. */

/**
 * The methods of presentation ports consumed by the frame scenario, not the full
 * adapter objects. Their visual state is separate from the authoritative GameState.
 * @typedef {object} GameFramePorts
 * @property {{advance: FrameUpdate, impact: (speed: number) => void, updateSound: (braking: BrakingState) => void}} audio
 * @property {{update: FrameUpdate}} traffic Traffic models, separate from the domain simulation.
 * @property {{updatePedestrians: FrameUpdate}} pedestrians
 * @property {{updatePlayerCar: (dt: number, previousSpeed: number) => BrakingState}} vehicle
 * @property {{updateWorld: FrameUpdate}} world Receives animation time, zero on pause.
 * @property {{updateDrones: () => void}} drones
 * @property {{updateMarkers: FrameUpdate}} markers Receives animation time, zero on pause.
 * @property {{updateCamera: FrameUpdate}} camera
 * @property {{updateLighting: FrameUpdate}} lighting
 * @property {{render: (dt: number, daylight: number) => void}} graphics dt is animation time; daylight is the lighting blend value.
 * @property {{updateHud: () => void}} hud
 * @property {{drawMini: () => void}} minimap
 * @property {{showToast: (message: string) => void}} notifications
 * @property {{advance: FrameUpdate, daylight: () => number}} timeline Advances presentation time and reads the lighting blend value.
 */

/**
 * Dependencies assembled by bootstrap. Only the methods used here are required.
 * @typedef {object} GameDependencies
 * @property {GameState} state Authoritative game state, not presentation state.
 * @property {{updatePhysics: (dt: number) => PhysicsEvent[]}} physics Impact speed is a nonnegative world-units-per-second magnitude.
 * @property {{advanceTraffic: FrameUpdate}} traffic Domain traffic simulation.
 * @property {GameFramePorts} ports
 */

/**
 * @typedef {object} GameScenario
 * @property {FrameUpdate} step
 * @property {() => void} initialize
 */

/**
 * Build the frame scenario without starting its scheduler.
 * @param {GameDependencies} dependencies
 * @returns {Readonly<GameScenario>} Frozen methods; the supplied game state remains mutable.
 */
globalThis.TBS.application.createGame = function ({ state, physics, traffic, ports }) {
  let hudTime = 0;
  let minimapTime = 0;

  /**
   * @param {PhysicsEvent[]} events
   * @returns {void}
   */
  function handlePhysicsEvents(events) {
    for (const event of events) {
      if (event.type === 'impact') ports.audio.impact(event.speed);
      if (event.type === 'recharged')
        ports.notifications.showToast('ТБС: экспресс-зарядка завершена');
    }
  }

  /**
   * @param {number} dt Elapsed seconds; simulation advances only while playing.
   * @returns {void}
   */
  function updateSimulation(dt) {
    if (state.mode !== 'playing') return;
    ports.audio.advance(dt);
    traffic.advanceTraffic(dt);
    ports.traffic.update(dt);
    handlePhysicsEvents(physics.updatePhysics(dt));
  }

  /**
   * @param {number} dt Elapsed seconds used by the HUD and minimap refresh timers.
   * @returns {void}
   */
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

  /**
   * @param {number} dt Elapsed seconds supplied by the runtime, clamped to [0, 0.05].
   * @returns {void}
   */
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

  /** @returns {void} Refresh the HUD and minimap without advancing time. */
  function initialize() {
    ports.hud.updateHud();
    ports.minimap.drawMini();
  }

  return Object.freeze({ step, initialize });
};
