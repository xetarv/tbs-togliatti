'use strict';

window.TBS.buildPresentation = function ({
  world,
  state,
  presentation,
  traffic,
  missions,
  dom,
  resetControls,
}) {
  const api = window.TBS;
  const context = { ...world, ...dom, state: presentation, player: state.player };
  const notifications = api.createToast(dom);
  const getGraphics = () => display.graphics;
  const carModels = api.createCarModels({
    ...world,
    createFastback: api.createFastback,
    meshData: window.TBS_FASTBACK_MESH,
  });
  const vehicleContext = {
    ...context,
    ...carModels,
    keys: state.keys,
    clamp: api.domain.math.clamp,
    getGraphics,
  };
  const vehicle = api.createPlayerCar(vehicleContext);
  const shared = { ...vehicleContext, ...vehicle, ...notifications };
  const display = api.createDisplay({
    ...shared,
    createGraphics: api.createGraphics,
    resetControls,
  });
  const trafficView = api.createTrafficView({
    ...shared,
    traffic: traffic.traffic,
    signalPhase: traffic.signalPhase,
  });
  const audio = api.createSound({
    state: presentation,
    player: state.player,
    traffic: traffic.traffic,
    getElement: dom.getElement,
    createAmbience: api.createAmbience,
  });
  const hud = api.createHud({
    ...dom,
    state,
    player: state.player,
    distance: api.domain.math.distance,
    ...missions,
  });
  const minimap = api.createMinimap({
    ...world,
    ...dom,
    player: state.player,
    target: missions.target,
  });
  const markers = api.createMissionMarkers({ ...context, target: missions.target });
  const camera = api.createCameraControls(shared);
  const lighting = api.createLighting(shared);
  const pedestrians = api.createPedestrians(shared);
  const drones = api.createDrones(context);
  const animation = api.createWorldAnimation(context);
  const overlay = api.createOverlay(dom);
  const timeline = {
    advance(dt) {
      presentation.elapsed += dt;
    },
    daylight() {
      return presentation.lightValue;
    },
  };
  return {
    audio,
    hud,
    minimap,
    markers,
    camera,
    lighting,
    pedestrians,
    drones,
    overlay,
    notifications,
    vehicle,
    world: animation,
    graphics: display.graphics,
    traffic: trafficView,
    timeline,
  };
};
