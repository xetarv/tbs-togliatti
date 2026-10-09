'use strict';

window.TBS.buildGame = function ({ state, world, dom, presentation }) {
  const api = window.TBS;
  const { domain, application } = api;
  const { config, math, collision } = domain;
  const controls = { reset: () => domain.resetControls(state.keys) };
  const traffic = domain.createTrafficSimulation({
    roadsX: config.roadsX,
    roadsZ: config.roadsZ,
    ROAD: config.ROAD,
    WORLD_W: config.WORLD_W,
    WORLD_H: config.WORLD_H,
    player: state.player,
  });
  const roadNetwork = domain.createRoadNetwork({
    roadsX: config.roadsX,
    roadsZ: config.roadsZ,
    ROAD: config.ROAD,
    parkingLots: world.parkingLots,
  });
  const physics = domain.createPlayerPhysics({
    player: state.player,
    keys: state.keys,
    settings: config.driving,
    bounds: config.bounds,
    roadNetwork,
    movingVehicles: traffic.traffic,
    parkedVehicles: world.parkedCars.map((car) => ({ x: car.x, z: car.z, heading: car.a })),
    clamp: math.clamp,
    vehicleContact: collision.vehicleContact,
  });
  const missions = domain.createMissionRoutes({
    state,
    player: state.player,
    missions: config.missions,
    missionRules: config.missionRules,
    distance: math.distance,
  });
  const ports = api.buildPresentation({
    state,
    world,
    dom,
    presentation,
    traffic,
    missions,
    resetControls: controls.reset,
  });
  const game = application.createGame({ state, physics, traffic, ports });
  const runtime = api.createRuntime({
    game,
    scheduler: {
      request: (callback) => requestAnimationFrame(callback),
      cancel: (id) => cancelAnimationFrame(id),
    },
    clock: { now: () => performance.now() },
    isHidden: () => document.hidden,
  });
  const session = application.createSession({
    state,
    controls,
    audio: ports.audio,
    overlay: ports.overlay,
    notifications: ports.notifications,
    clock: runtime,
    missions,
  });
  const missionController = application.createMissionController({
    missions,
    markers: ports.markers,
    hud: ports.hud,
    notifications: ports.notifications,
  });
  api.createInput({
    state,
    keys: state.keys,
    resetControls: controls.reset,
    resetFrameClock: runtime.reset,
    ...session,
    ...missionController,
    ...ports.camera,
    ...ports.lighting,
    ...ports.audio,
    getSound: () => ports.audio.sound,
  });
  dom.getElement('startBtn').addEventListener('click', session.start);
  dom.getElement('pauseBtn').addEventListener('click', session.togglePause);
  return { runtime, session };
};
