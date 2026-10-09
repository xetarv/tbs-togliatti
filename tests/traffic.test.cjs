const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

function createTraffic() {
  const { TBS } = loadModules(['domain/config.js', 'domain/traffic.js']);
  const simulation = TBS.createTrafficSimulation({ ...TBS.config, player: { x: -100, z: -100 } });
  return simulation;
}

test('signals have alternating green, amber and red phases on a repeating cycle', () => {
  const { signalPhase } = createTraffic();
  assert.equal(signalPhase(26, 30, true, 0), 'green');
  assert.equal(signalPhase(26, 30, true, 8), 'amber');
  assert.equal(signalPhase(26, 30, true, 10), 'red');
  assert.equal(signalPhase(26, 30, false, 12), 'green');
  assert.equal(signalPhase(26, 30, true, 24), 'green');
});

test('red signals and cross traffic stop a vehicle before the junction', () => {
  const { trafficLimit } = createTraffic();
  const vehicle = { horizontal: true, road: 30, lane: 2.7, pos: 58.3, dir: 1, cruise: 8 };
  assert.ok(trafficLimit(vehicle, [], 10).speed < 1e-6);
  assert.equal(trafficLimit(vehicle, [], 0).speed, 8);
  const crossing = { horizontal: false, road: 68, pos: 30 };
  assert.ok(trafficLimit(vehicle, [crossing], 0).speed < 1e-6);
});

test('following vehicles respect the car ahead and the player in their lane', () => {
  const { trafficLimit } = createTraffic();
  const vehicle = { horizontal: true, road: 30, lane: 2.7, pos: 40, dir: 1, cruise: 8 };
  assert.ok(trafficLimit(vehicle, [{ ...vehicle, pos: 47.6 }], 0).speed < 1e-6);
  assert.equal(trafficLimit(vehicle, [{ ...vehicle, pos: 30 }], 0).speed, 8);
  const { TBS } = loadModules(['domain/config.js', 'domain/traffic.js']);
  const simulation = TBS.createTrafficSimulation({ ...TBS.config, player: { x: 48, z: 32.7 } });
  assert.equal(simulation.trafficLimit(vehicle, [], 0).speed, 0);
});

test('traffic accelerates gradually, updates plain coordinates and wraps at the city boundary', () => {
  const { traffic, advanceTraffic } = createTraffic();
  const vehicle = traffic[0];
  vehicle.pos = 394;
  vehicle.speed = vehicle.cruise;
  advanceTraffic(0.05);
  assert.equal(vehicle.pos, -8);
  assert.equal(vehicle.x, -8);
  assert.equal(vehicle.z, vehicle.road + vehicle.lane);
  assert.equal('mesh' in vehicle, false);
  assert.ok(traffic.some((car) => car.speed > 0 && car.speed <= 0.13));
});
