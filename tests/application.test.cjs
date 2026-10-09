const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

function application() {
  return loadModules([
    'domain/config.js',
    'domain/state.js',
    'domain/math.js',
    'domain/missions.js',
    'application/session.js',
    'application/mission-controller.js',
    'application/game.js',
  ]).TBS;
}

test('session pause clears controls while preserving cargo, and resume resets the frame clock', () => {
  const TBS = application(),
    state = TBS.createState();
  const calls = [];
  state.stage = 1;
  state.keys.up = true;
  const session = TBS.createSession({
    state,
    controls: { reset: () => TBS.resetControls(state.keys) },
    audio: { beginSound: () => calls.push('audio'), updateSound: () => calls.push('silent') },
    overlay: { hide: () => calls.push('hide'), showPaused: (title) => calls.push(title) },
    clock: { reset: () => calls.push('reset') },
    notifications: { showToast() {} },
    missions: { currentMission: () => ({ title: 'Delivery' }) },
  });
  session.togglePause();
  assert.equal(state.mode, 'intro');
  session.start();
  session.togglePause();
  assert.equal(state.mode, 'paused');
  assert.equal(state.keys.up, false);
  assert.equal(state.stage, 1);
  assert.ok(calls.includes('Delivery'));
  session.togglePause();
  assert.equal(state.mode, 'playing');
  assert.equal(calls.filter((call) => call === 'reset').length, 2);
});

test('mission effects occur only after cargo acceptance and delivery rules succeed', () => {
  const TBS = application(),
    state = TBS.createState(),
    effects = [];
  const missions = TBS.createMissionRoutes({
    ...TBS.config,
    ...TBS.math,
    state,
    player: state.player,
  });
  const controller = TBS.createMissionController({
    missions,
    markers: { launch: (point) => effects.push(point) },
    hud: { updateHud() {} },
    notifications: { showToast() {} },
  });
  controller.interact();
  state.mode = 'playing';
  controller.interact();
  assert.equal(effects.length, 0);
  Object.assign(state.player, missions.target());
  controller.interact();
  assert.equal(effects.length, 1);
  Object.assign(state.player, missions.target());
  controller.interact();
  assert.equal(effects.length, 2);
  assert.equal(state.credits, 1200);
});

function gamePorts(calls) {
  let elapsed = 0;
  const mark = (name) => () => calls.push(name);
  return {
    timeline: { advance: (dt) => (elapsed += dt), daylight: () => 0.7, elapsed: () => elapsed },
    audio: { advance: mark('audio-time'), impact: mark('impact'), updateSound: mark('sound') },
    traffic: { update: mark('traffic-view') },
    pedestrians: { updatePedestrians() {} },
    vehicle: { updatePlayerCar: () => false },
    world: { updateWorld() {} },
    drones: { updateDrones() {} },
    markers: { updateMarkers() {} },
    camera: { updateCamera() {} },
    lighting: { updateLighting() {} },
    graphics: { render: (dt, daylight) => calls.push({ dt, daylight }) },
    hud: { updateHud: mark('hud') },
    minimap: { drawMini: mark('map') },
    notifications: { showToast: mark('toast') },
  };
}

test('game coordinates injected adapters and dispatches physics events without a DOM or WebGL', () => {
  const TBS = application(),
    state = TBS.createState(),
    calls = [];
  const ports = gamePorts(calls);
  const game = TBS.createGame({
    state,
    ports,
    physics: { updatePhysics: () => [{ type: 'impact', speed: 5 }, { type: 'recharged' }] },
    traffic: { advanceTraffic: () => calls.push('traffic-step') },
  });
  game.initialize();
  state.mode = 'playing';
  game.step(0.05);
  assert.ok(calls.includes('impact'));
  assert.ok(calls.includes('toast'));
  assert.ok(calls.includes('traffic-step'));
  assert.equal(ports.timeline.elapsed(), 0.05);
  calls.length = 0;
  state.mode = 'paused';
  game.step(0.05);
  assert.equal(ports.timeline.elapsed(), 0.05);
  assert.equal(calls.includes('traffic-step'), false);
  assert.equal(calls.includes('impact'), false);
  assert.deepEqual(
    calls.find((call) => typeof call === 'object'),
    { dt: 0, daylight: 0.7 },
  );
});
