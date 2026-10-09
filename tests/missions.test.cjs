const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

function createRoutes() {
  const { TBS } = loadModules([
    'domain/config.js',
    'domain/state.js',
    'domain/math.js',
    'domain/missions.js',
  ]);
  const state = TBS.createState();
  const routes = TBS.createMissionRoutes({
    ...TBS.config,
    ...TBS.math,
    state,
    player: state.player,
  });
  return { state, routes, missions: TBS.config.missions };
}

test('cargo requires an active shift, proximity and low speed', () => {
  const { state, routes } = createRoutes();
  assert.equal(routes.tryInteract().status, 'inactive');
  state.mode = 'playing';
  assert.equal(routes.tryInteract().status, 'too-far');
  Object.assign(state.player, routes.target(), { speed: 6 });
  assert.equal(routes.tryInteract().status, 'too-fast');
  assert.equal(state.stage, 0);
  state.player.speed = -6;
  assert.equal(routes.tryInteract().status, 'too-fast');
  state.player.speed = 5.8;
  assert.equal(routes.tryInteract().status, 'pickup');
  assert.equal(state.stage, 1);
  assert.equal(state.credits, 0);
  assert.equal(state.deliveries, 0);
});

test('all three deliveries pay once, recharge and cycle to the first route', () => {
  const { state, routes, missions } = createRoutes();
  state.mode = 'playing';
  let expectedCredits = 0;
  for (let index = 0; index < missions.length; index++) {
    Object.assign(state.player, routes.target(), { speed: 0, battery: 25 });
    assert.equal(routes.tryInteract().status, 'pickup');
    Object.assign(state.player, routes.target());
    const result = routes.tryInteract();
    expectedCredits += missions[index].reward;
    assert.equal(result.status, 'delivery');
    assert.equal(result.reward, missions[index].reward);
    assert.equal(state.credits, expectedCredits);
    assert.equal(state.deliveries, index + 1);
    assert.equal(state.player.battery, 100);
    assert.equal(state.stage, 0);
    if (index < missions.length - 1) {
      assert.equal(routes.tryInteract().status, 'too-far');
    }
  }
  assert.equal(state.missionIndex, 0);
  assert.equal(state.credits, 5400);
  // The final delivery and the next pickup share the TBS center.
  assert.equal(routes.tryInteract().status, 'pickup');
  assert.equal(state.credits, 5400);
  assert.equal(state.deliveries, 3);
});

test('pausing a shift preserves cargo and route progress', () => {
  const { state, routes } = createRoutes();
  state.mode = 'playing';
  Object.assign(state.player, routes.target());
  routes.tryInteract();
  state.mode = 'paused';
  Object.assign(state.player, routes.target());
  assert.equal(routes.tryInteract().status, 'inactive');
  assert.equal(state.stage, 1);
  assert.equal(state.deliveries, 0);
  state.mode = 'playing';
  assert.equal(routes.tryInteract().status, 'delivery');
});
