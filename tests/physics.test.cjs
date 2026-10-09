const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

function createPhysics() {
  const { TBS } = loadModules([
    'domain/config.js',
    'domain/state.js',
    'domain/math.js',
    'domain/collision.js',
    'domain/road-network.js',
    'domain/player-physics.js',
  ]);
  const state = TBS.createState();
  const physics = TBS.createPlayerPhysics({
    player: state.player,
    keys: state.keys,
    settings: TBS.config.driving,
    bounds: TBS.config.bounds,
    roadNetwork: TBS.createRoadNetwork({ ...TBS.config, parkingLots: [] }),
    parkedVehicles: [],
    movingVehicles: [],
    clamp: TBS.math.clamp,
    vehicleContact: TBS.collision.vehicleContact,
  });
  return {
    state,
    physics,
    vehicleContact: (x, z, heading, bx, bz, angle) =>
      TBS.collision.vehicleContact({ x, z, heading }, { x: bx, z: bz, heading: angle }),
  };
}

test('oriented vehicle footprints distinguish gaps, touching and overlap', () => {
  const { vehicleContact } = createPhysics();
  assert.equal(vehicleContact(0, 0, 0, 20, 0, 0), null);
  assert.equal(vehicleContact(0, 0, 0, 3.3, 0, 0), null);
  const collision = vehicleContact(0, 0, 0, 2, 0, 0);
  assert.ok(collision && collision.x < 0 && collision.depth > 0);
  assert.ok(vehicleContact(0, 0, 0, 3, 0, Math.PI / 2));
  const opposite = vehicleContact(2, 0, 0, 0, 0, 0);
  assert.equal(opposite.depth, collision.depth);
  assert.equal(opposite.x, -collision.x);
});

test('acceleration moves the player along the heading and consumes charge', () => {
  const { state, physics } = createPhysics();
  state.keys.up = true;
  physics.updatePhysics(0.05);
  assert.ok(state.player.x < 68);
  assert.equal(state.player.z, 30);
  assert.ok(state.player.speed > 0);
  assert.ok(state.player.battery < 100);
});

test('handbrake slows a moving vehicle without accelerating it', () => {
  const { state, physics } = createPhysics();
  state.player.speed = 10;
  state.keys.up = true;
  state.keys.handbrake = true;
  physics.updatePhysics(0.05);
  assert.equal(state.player.speed, 9.5);
});

test('entering a city block rejects movement and stops the vehicle', () => {
  const { state, physics } = createPhysics();
  Object.assign(state.player, { x: 72.8, z: 50, heading: Math.PI / 2, speed: 10 });
  state.keys.up = true;
  const events = physics.updatePhysics(0.05);
  assert.equal(state.player.x, 72.8);
  assert.equal(state.player.z, 50);
  assert.equal(state.player.speed, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'impact');
});

test('an exhausted battery emits one recharge event and stops the car', () => {
  const { state, physics } = createPhysics();
  state.player.battery = 0.000001;
  state.keys.up = true;
  const events = physics.updatePhysics(0.05);
  assert.equal(events[0].type, 'recharged');
  assert.equal(state.player.battery, 100);
  assert.equal(state.player.speed, 0);
  assert.equal(physics.updatePhysics(0.05).length, 0);
});
