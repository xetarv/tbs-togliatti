const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

test('bootstrap enables adaptive traffic only for the exact decoded query value 1', () => {
  for (const [search, expected] of [
    ['', false],
    ['?', false],
    ['?dynamicTraffic=0', false],
    ['?dynamicTraffic=1', true],
    ['?dynamicTraffic', false],
    ['?dynamicTraffic=', false],
    ['?dynamicTraffic=2', false],
    ['?dynamicTraffic=true', false],
    ['?dynamicTraffic=false', false],
    ['?dynamicTraffic=01', false],
    ['?dynamicTraffic=1.0', false],
    ['?dynamicTraffic=%201', false],
    ['?dynamicTraffic=1%20', false],
    ['?dynamicTraffic=constructor', false],
    ['?DynamicTraffic=1', false],
    ['?dynamicTraffic=%31', true],
  ]) {
    const { TBS, context } = loadModules(['dist/domain/config.js', 'dist/bootstrap/game.js'], {
      URLSearchParams,
      location: { search },
    });
    const sentinel = new Error('Captured bootstrap dependency');
    let enabled;
    context.TBS.domain.createTrafficSimulation = (options) => {
      enabled = options.dynamicTraffic;
      throw sentinel;
    };
    assert.throws(
      () => TBS.buildGame({ state: { keys: {}, player: {} }, world: { parkedCars: [] } }),
      (error) => error === sentinel,
    );
    assert.equal(enabled, expected, 'query: ' + search);
  }
});

function fixture(options = {}) {
  const { TBS } = loadModules([
    'dist/domain/config.js',
    'dist/domain/traffic.js',
    'dist/domain/road-network.js',
  ]);
  const player = { x: 68, z: 30, speed: 0 };
  const simulation = TBS.createTrafficSimulation({
    ...TBS.config,
    player,
    dynamicTraffic: true,
    ...options,
  });
  const roads = TBS.createRoadNetwork({ ...TBS.config, parkingLots: [] });
  return { simulation, player, config: TBS.config, roads };
}

test('adaptive traffic preserves initial 36, then uses safe incoming lanes with bounded operations and lifetime hysteresis', () => {
  const { simulation: s, player, config, roads } = fixture();
  const legacy = fixture({ dynamicTraffic: false }).simulation;
  assert.equal(JSON.stringify(s.traffic), JSON.stringify(legacy.traffic));
  assert.equal(s.traffic.length, 36);
  const reference = s.traffic;
  const births = new Map(s.traffic.map((v) => [v.id, 0]));
  const seen = new Set(births.keys());
  let lastChange = -Infinity,
    additions = 0,
    removals = 0;
  for (let tick = 1; tick <= 1800; tick++) {
    const seconds = tick * 0.05;
    if (tick === 1000) Object.assign(player, { x: 362, z: 270 });
    const before = new Map(s.traffic.map((v) => [v.id, { x: v.x, z: v.z }]));
    const version = s.version;
    s.advanceTraffic(0.05);
    const changes = s.version - version;
    assert.ok(changes <= 2);
    if (changes) {
      assert.ok(seconds - lastChange >= 2.95, 'No per-frame membership churn');
      lastChange = seconds;
    }
    if (seconds < 15) assert.equal(s.version, 0, 'Initial residence grace');
    assert.equal(s.traffic, reference);
    assert.ok(s.traffic.length <= 36);
    assert.equal(new Set(s.traffic.map((v) => v.id)).size, s.traffic.length);
    for (const [id, previous] of before) {
      if (s.traffic.some((v) => v.id === id)) continue;
      assert.ok(seconds - births.get(id) >= 14.95, 'New cars cannot be immediately recycled');
      assert.ok(Math.hypot(previous.x - player.x, previous.z - player.z) > 269);
      removals++;
    }
    for (const vehicle of s.traffic) {
      if (before.has(vehicle.id)) continue;
      assert.ok(!seen.has(vehicle.id));
      seen.add(vehicle.id);
      births.set(vehicle.id, seconds);
      const distance = Math.hypot(vehicle.x - player.x, vehicle.z - player.z);
      assert.ok(
        distance >= 190 && distance <= 230,
        'Outside normal traffic view distance and camera offset',
      );
      assert.ok((vehicle.horizontal ? config.roadsZ : config.roadsX).includes(vehicle.road));
      assert.equal(vehicle.lane, (vehicle.horizontal ? vehicle.dir : -vehicle.dir) * 2.7);
      assert.ok(roads.isDrivable(vehicle.x, vehicle.z));
      assert.ok(((vehicle.horizontal ? player.x : player.z) - vehicle.pos) * vehicle.dir > 0);
      for (const cross of vehicle.horizontal ? config.roadsX : config.roadsZ)
        assert.ok(Math.abs(vehicle.pos - cross) >= config.ROAD / 2 + 8);
      for (const other of s.traffic)
        if (other.id !== vehicle.id)
          assert.ok(Math.hypot(vehicle.x - other.x, vehicle.z - other.z) >= 14);
      additions++;
    }
  }
  assert.ok(additions > 0 && removals > 0, 'Controller actually redistributes traffic');
});

test('no safe candidate skips spawning without consuming an ID or forcing parked-car overlap', () => {
  const { config } = fixture({ dynamicTraffic: false });
  const parkedVehicles = [];
  for (const horizontal of [true, false]) {
    const roads = horizontal ? config.roadsZ : config.roadsX;
    const crosses = horizontal ? config.roadsX : config.roadsZ;
    for (const road of roads)
      for (let i = 0; i < crosses.length - 1; i++)
        for (const dir of [-1, 1]) {
          const pos = (crosses[i] + crosses[i + 1]) / 2;
          const lane = (horizontal ? dir : -dir) * 2.7;
          parkedVehicles.push({
            x: horizontal ? pos : road + lane,
            z: horizontal ? road + lane : pos,
            heading: 0,
          });
        }
  }
  const { simulation: s } = fixture({ parkedVehicles });
  for (const vehicle of [...s.traffic]) s.removeVehicle(vehicle.id);
  const version = s.version;
  for (let i = 0; i < 240; i++) s.advanceTraffic(0.05);
  assert.equal(s.traffic.length, 0);
  assert.equal(s.version, version);
  assert.equal(s.addVehicle().id, 36, 'Unsafe searches do not consume IDs');
});

test('nearby and projected collision-horizon vehicles survive retirement cycles', () => {
  const { simulation: s, player } = fixture();
  for (const vehicle of [...s.traffic]) s.removeVehicle(vehicle.id);
  Object.assign(player, { x: 26, z: 30, speed: 100 });
  const near = s.addVehicle('sedan', { horizontal: true, road: 30, dir: 1, pos: 26 });
  const approaching = s.addVehicle('van', { horizontal: true, road: 30, dir: -1, pos: 330 });
  near.cruise = approaching.cruise = 0;
  for (let i = 0; i < 600; i++) s.advanceTraffic(0.05);
  assert.ok(s.traffic.includes(near));
  assert.ok(
    s.traffic.includes(approaching),
    'Fast-player safety horizon takes precedence over retirement radius',
  );
  assert.equal(s.traffic.length, 2, 'Unsafe high-speed spawns are skipped');
});

test('placement derives coordinates/heading and rejects invalid roads before allocating membership', () => {
  const { simulation: s } = fixture({ dynamicTraffic: false });
  for (const placement of [
    null,
    { horizontal: 1 },
    { horizontal: true, road: 99, dir: 1, pos: 47 },
    { horizontal: true, road: 30, dir: 0, pos: 47 },
    { horizontal: false, road: 26, dir: 1, pos: NaN },
    { horizontal: false, road: 26, dir: 1, pos: 400 },
  ]) {
    assert.throws(() => s.addVehicle('compact', placement), { name: 'RangeError' });
  }
  assert.equal(s.version, 0);
  const vehicle = s.addVehicle('compact', { horizontal: false, road: 26, dir: -1, pos: 50 });
  assert.equal(vehicle.id, 36);
  assert.equal(vehicle.x, 28.7);
  assert.equal(vehicle.z, 50);
  assert.equal(vehicle.heading, 0);
});

test('disabled adaptive mode keeps all original IDs through long drives and a large step performs at most one density cycle', () => {
  const { simulation: s, player } = fixture({ dynamicTraffic: false });
  for (let i = 0; i < 3600; i++) {
    Object.assign(player, { x: i < 1800 ? 26 : 362, z: i < 1800 ? 30 : 270 });
    s.advanceTraffic(0.05);
  }
  assert.equal(s.version, 0);
  assert.deepEqual(
    Array.from(s.traffic, (v) => v.id),
    Array.from({ length: 36 }, (_, i) => i),
  );
  const enabled = fixture().simulation;
  enabled.advanceTraffic(60);
  assert.ok(enabled.version <= 2, 'No catch-up burst after long input dt');
});

test('application pause freezes density/simulation and resume does not catch up wall-clock time', () => {
  const { simulation: s } = fixture();
  const { TBS } = loadModules(['dist/domain/state.js', 'dist/application/game.js']);
  const state = TBS.createState();
  const noop = () => {};
  const ports = {
    audio: { advance: noop, updateSound: noop },
    traffic: { update: noop },
    vehicle: { updatePlayerCar: () => false },
    pedestrians: { updatePedestrians: noop },
    world: { updateWorld: noop },
    drones: { updateDrones: noop },
    markers: { updateMarkers: noop },
    camera: { updateCamera: noop },
    lighting: { updateLighting: noop },
    graphics: { render: noop },
    hud: { updateHud: noop },
    minimap: { drawMini: noop },
    timeline: { advance: noop, daylight: () => 1 },
  };
  const game = TBS.createGame({ state, traffic: s, ports, physics: { updatePhysics: () => [] } });
  state.mode = 'playing';
  for (let i = 0; i < 500; i++) game.step(0.05);
  state.mode = 'paused';
  const before = JSON.stringify(s.traffic),
    version = s.version;
  for (let i = 0; i < 1000; i++) game.step(0.05);
  assert.equal(JSON.stringify(s.traffic), before);
  assert.equal(s.version, version);
  state.mode = 'playing';
  game.step(0.05);
  assert.ok(s.version - version <= 2);
});
