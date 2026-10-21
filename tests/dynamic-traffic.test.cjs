const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

function simulationFixture(options = {}) {
  const { TBS } = loadModules(['dist/domain/config.js', 'dist/domain/traffic.js']);
  return {
    TBS,
    simulation: TBS.createTrafficSimulation({
      ...TBS.config,
      player: { x: -100, z: -100 },
      ...options,
    }),
  };
}

function modelFixture() {
  const { TBS, context } = loadModules(
    [
      'dist/adapters/rendering/geometry.js',
      ...['geometry', 'passenger', 'commercial', 'wheels', 'lights', 'shadow', 'suspension'].map(
        (name) => 'dist/adapters/vehicles/traffic/' + name + '.js',
      ),
      'dist/adapters/vehicles/car-model.js',
      'dist/adapters/simulation/traffic.js',
      'dist/adapters/rendering/lighting.js',
    ],
    { URLSearchParams, location: { search: '?signalHousingBatching=0' } },
  );
  const resources = new Map();
  const track = (resource) => {
    resources.set(resource, 0);
    resource.addEventListener('dispose', () =>
      resources.set(resource, resources.get(resource) + 1),
    );
    return resource;
  };
  const library = { ...T };
  for (const name of [
    'BoxGeometry',
    'BufferGeometry',
    'ExtrudeGeometry',
    'CylinderGeometry',
    'TorusGeometry',
    'SphereGeometry',
    'PlaneGeometry',
    'CircleGeometry',
    'MeshStandardMaterial',
    'MeshPhysicalMaterial',
    'MeshBasicMaterial',
    'InstancedMesh',
    'Texture',
  ]) {
    library[name] = new Proxy(T[name], {
      construct(target, args, newTarget) {
        return track(Reflect.construct(target, args, newTarget));
      },
    });
  }
  const scene = new T.Scene();
  const unitBox = new library.BoxGeometry();
  const sharedMaterial = new library.MeshStandardMaterial();
  const markTexture = new library.Texture();
  sharedMaterial.map = markTexture;
  const mat = (...[color, metalness, roughness]) =>
    new library.MeshStandardMaterial({ color, metalness, roughness });
  const box = (parent, x, y, z, w, h, d, material) => {
    const mesh = new T.Mesh(unitBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const models = TBS.createCarModels({
    T: library,
    scene,
    box,
    ...TBS.createGeometryHelpers({ T: library }),
    mat,
    dark: sharedMaterial,
    cyanMat: sharedMaterial,
    orangeMat: sharedMaterial,
    whiteMat: sharedMaterial,
    trimMat: sharedMaterial,
    tireMat: sharedMaterial,
    unitBox,
    markTexture,
    signTexture: () => new library.Texture(),
    makeTexture: () => new library.Texture(),
    createFastback: () => new T.Group(),
    meshData: {},
  });
  context.TBS.createVegetationCulling = () => ({});
  const shared = new Set(resources.keys());
  return { TBS, context, models, scene, resources, shared, library, unitBox, sharedMaterial, box };
}

test('traffic membership preserves initial 36, stable array, monotonic IDs and predictable invalid operations', () => {
  const { simulation: s } = simulationFixture();
  const initial = JSON.stringify(s.traffic);
  const same = simulationFixture().simulation;
  assert.equal(JSON.stringify(same.traffic), initial);
  const reference = s.traffic;
  assert.deepEqual(
    Array.from(s.traffic, (t) => t.id),
    Array.from({ length: 36 }, (_, i) => i),
  );
  assert.equal(s.version, 0);
  for (const bad of ['constructor', '__proto__', '', null, 1]) {
    assert.throws(() => s.addVehicle(bad), { name: 'RangeError' });
  }
  assert.equal(s.version, 0);
  const first = s.addVehicle('shuttle');
  assert.equal(first.id, 36);
  assert.equal(first.variant, 'shuttle');
  assert.equal(first.x, first.horizontal ? first.pos : first.road + first.lane);
  assert.equal(s.version, 1);
  assert.equal(s.removeVehicle(first.id), true);
  assert.equal(s.removeVehicle(first.id), false);
  for (const bad of [-1, 0.5, NaN, Infinity]) assert.equal(s.removeVehicle(bad), false);
  assert.equal(s.version, 2);
  assert.equal(s.traffic, reference);
  assert.equal(JSON.stringify(s.traffic), initial);
  for (let i = 0; i < 12; i++) {
    const vehicle = s.addVehicle();
    assert.equal(vehicle.id, 37 + i);
    assert.equal(s.removeVehicle(vehicle.id), true);
  }
  assert.equal(s.traffic, reference);
});

test('native traffic model disposal releases individual allocations once, preserving shared assets', () => {
  assert.equal(T.REVISION, '149');
  const f = modelFixture();
  for (const variant of ['compact', 'sedan', 'van', 'shuttle']) {
    const before = new Set(f.resources.keys());
    const car = f.models.createTrafficCar(0x123456, variant);
    assert.equal(car.parent, f.scene);
    assert.equal(car.userData.variant, variant);
    assert.equal(car.userData.wheels.length, 4);
    f.models.animateVehicle(car, 3, 0.2, true, 0.05);
    assert.equal(f.models.disposeTrafficCar(car), true);
    assert.equal(car.parent, null);
    assert.equal(f.models.disposeTrafficCar(car), false);
    for (const [resource, count] of f.resources) {
      if (!before.has(resource)) assert.equal(count, 1, resource.type);
      if (f.shared.has(resource)) assert.equal(count, 0, 'Shared ' + resource.type);
    }
  }
  assert.equal(f.models.disposeTrafficCar(new T.Group()), false);
});

test('failed native assembly releases allocations even before attachment and preserves the original error', () => {
  const f = modelFixture();
  const original = f.context.TBS.buildTrafficCarLights;
  const error = new Error('injected light construction failure');
  const before = new Set(f.resources.keys());
  f.context.TBS.buildTrafficCarLights = (options) => {
    new options.T.MeshBasicMaterial(); // Allocated, deliberately not attached to any mesh.
    throw error;
  };
  assert.throws(
    () => f.models.createTrafficCar(0xffffff, 'sedan'),
    (caught) => caught === error,
  );
  assert.equal(f.scene.children.length, 0);
  for (const [resource, count] of f.resources)
    if (!before.has(resource)) assert.equal(count, 1, resource.type);
  for (const resource of f.shared) assert.equal(f.resources.get(resource), 0);
  f.context.TBS.buildTrafficCarLights = original;
  assert.equal(f.models.disposeTrafficCar(f.models.createTrafficCar(0, 'van')), true);
});

test('traffic view reconciles only changed membership, rolls back failures and supports repeated cycles', () => {
  const { simulation: s } = simulationFixture();
  const f = modelFixture();
  let created = 0,
    fail = false;
  const trafficResources = new Set();
  const lights = f.context.TBS.buildTrafficCarLights;
  f.context.TBS.buildTrafficCarLights = (options) => {
    if (fail) {
      new options.T.MeshBasicMaterial();
      throw new Error('injected creation failure');
    }
    return lights(options);
  };
  const view = f.TBS.createTrafficView({
    T: f.library,
    scene: f.scene,
    unitBox: f.unitBox,
    box: f.box,
    dark: f.sharedMaterial,
    trimMat: f.sharedMaterial,
    laneMat: f.sharedMaterial,
    roadsX: [],
    roadsZ: [],
    ROAD: 12.4,
    traffic: s.traffic,
    signalPhase: s.signalPhase,
    getTrafficVersion: () => s.version,
    removeVehicle: s.removeVehicle,
    camera: new T.PerspectiveCamera(),
    getGraphics: () => ({ distance: 135 }),
    ...f.models,
    createTrafficCar(color, variant) {
      created++;
      const before = new Set(f.resources.keys());
      try {
        return f.models.createTrafficCar(color, variant);
      } finally {
        for (const resource of f.resources.keys())
          if (!before.has(resource)) trafficResources.add(resource);
      }
    },
  });
  const initial = [...f.scene.children];
  assert.equal(created, 36);
  view.update(0.05);
  assert.equal(created, 36);
  assert.deepEqual(f.scene.children, initial);
  for (let i = 0; i < 4; i++) {
    const displayed = view.version;
    const vehicle = s.addVehicle('compact');
    assert.equal(view.version, displayed, 'Pending changes do not advance the displayed version');
    view.update(0.05);
    assert.equal(view.version, s.version);
    const mesh = f.scene.children.at(-1);
    assert.equal(f.scene.children.length, 37);
    assert.deepEqual(mesh.position.toArray(), [vehicle.x, 0.08, vehicle.z]);
    assert.equal(mesh.rotation.y, -vehicle.heading);
    const afterAdd = created;
    view.update(0.05);
    assert.equal(created, afterAdd);
    s.removeVehicle(vehicle.id);
    view.update(0.05);
    assert.equal(mesh.parent, null);
    assert.deepEqual(f.scene.children, initial);
  }
  fail = true;
  const failed = s.addVehicle();
  assert.throws(() => view.update(0.05), { name: 'AggregateError' });
  assert.ok(!s.traffic.some((t) => t.id === failed.id));
  assert.deepEqual(f.scene.children, initial);
  fail = false;
  view.update(0.05);
  assert.equal(f.scene.children.length, s.traffic.length);
  for (const mesh of f.scene.children.slice()) f.models.disposeTrafficCar(mesh);
  for (const [resource, count] of f.resources)
    assert.equal(count, trafficResources.has(resource) ? 1 : 0, resource.type);
});

test('removal updates physics collision inputs through the original array reference', () => {
  const { TBS, simulation: s } = simulationFixture();
  const { TBS: api } = loadModules([
    'dist/domain/state.js',
    'dist/domain/math.js',
    'dist/domain/road-network.js',
    'dist/domain/player-physics.js',
  ]);
  for (const vehicle of [...s.traffic]) s.removeVehicle(vehicle.id);
  const state = api.createState();
  let contacts = 0;
  const physics = api.createPlayerPhysics({
    player: state.player,
    keys: state.keys,
    settings: TBS.config.driving,
    bounds: TBS.config.bounds,
    roadNetwork: api.createRoadNetwork({ ...TBS.config, parkingLots: [] }),
    parkedVehicles: [],
    movingVehicles: s.traffic,
    clamp: api.math.clamp,
    vehicleContact: () => {
      contacts++;
      return null;
    },
  });
  const vehicle = s.addVehicle();
  physics.updatePhysics(0.01);
  assert.equal(contacts, 1);
  s.removeVehicle(vehicle.id);
  physics.updatePhysics(0.01);
  assert.equal(contacts, 1, 'Removed source is no longer considered for collisions');
});

test('dynamic traffic materials adopt current daylight and removed materials leave lighting tracking', () => {
  const { simulation: s } = simulationFixture();
  const f = modelFixture();
  for (const vehicle of [...s.traffic]) s.removeVehicle(vehicle.id);
  const view = f.TBS.createTrafficView({
    T: f.library,
    scene: f.scene,
    unitBox: f.unitBox,
    box: f.box,
    dark: f.sharedMaterial,
    trimMat: f.sharedMaterial,
    laneMat: f.sharedMaterial,
    roadsX: [],
    roadsZ: [],
    ROAD: 12.4,
    traffic: s.traffic,
    signalPhase: s.signalPhase,
    getTrafficVersion: () => s.version,
    removeVehicle: s.removeVehicle,
    camera: new T.PerspectiveCamera(),
    getGraphics: () => ({ distance: 135 }),
    ...f.models,
  });
  const state = { mode: 'paused', lightValue: 0, lightingClock: 0 };
  const car = new T.Group();
  car.userData.headlights = [];
  const sky = new T.Mesh(
    new T.SphereGeometry(),
    new T.ShaderMaterial({ uniforms: { daylight: { value: 1 } } }),
  );
  const lighting = f.TBS.createLighting({
    listen: (target, type, callback, options) => target.addEventListener(type, callback, options),
    T,
    scene: f.scene,
    state,
    car,
    sky,
    lowPower: true,
    player: { x: 0, z: 0 },
    camera: new T.PerspectiveCamera(),
    ambientLight: new T.HemisphereLight(),
    sun: new T.DirectionalLight(),
    blueLight: new T.PointLight(),
    duskSun: new T.Mesh(new T.SphereGeometry(), new T.MeshBasicMaterial()),
    nightWindows: [],
    streetFixtures: [],
    cityFacadeLights: [],
    getElement: () => ({ addEventListener() {} }),
    showToast() {},
    getGraphics: () => ({ quality: 'high' }),
    getTrafficVersion: () => view.version,
  });
  lighting.updateLighting(0);
  const source = s.addVehicle('sedan');
  lighting.updateLighting(0); // A paused game can see a pending source before its visual update.
  view.update(0);
  const model = f.scene.children.find((object) => object.userData.variant === 'sedan');
  const paint = model.userData.paint;
  assert.equal(paint.envMapIntensity, 1.3);
  lighting.updateLighting(0);
  assert.equal(paint.envMapIntensity, 1.3 * 0.2, 'New material receives unchanged night value');
  s.removeVehicle(source.id);
  lighting.updateLighting(0);
  view.update(0);
  lighting.updateLighting(0);
  paint.envMapIntensity = 17;
  state.lightValue = 1;
  lighting.updateLighting(0);
  assert.equal(paint.envMapIntensity, 17, 'Removed material is no longer updated');
});

test('failed initial view creation releases previously completed traffic models', () => {
  const { simulation: s } = simulationFixture();
  const f = modelFixture();
  const completed = [];
  let calls = 0;
  assert.throws(
    () =>
      f.TBS.createTrafficView({
        T: f.library,
        scene: f.scene,
        unitBox: f.unitBox,
        box: f.box,
        dark: f.sharedMaterial,
        trimMat: f.sharedMaterial,
        laneMat: f.sharedMaterial,
        roadsX: [],
        roadsZ: [],
        ROAD: 12.4,
        traffic: s.traffic,
        signalPhase: s.signalPhase,
        getTrafficVersion: () => s.version,
        removeVehicle: s.removeVehicle,
        camera: new T.PerspectiveCamera(),
        getGraphics: () => ({ distance: 135 }),
        ...f.models,
        createTrafficCar(color, variant) {
          if (++calls === 2) throw new Error('injected initial failure');
          const car = f.models.createTrafficCar(color, variant);
          completed.push(car);
          return car;
        },
      }),
    { name: 'AggregateError' },
  );
  assert.equal(completed.length, 35);
  assert.equal(f.scene.children.length, 0);
  for (const car of completed) {
    assert.equal(car.parent, null);
    assert.equal(f.models.disposeTrafficCar(car), false, 'Already released');
  }
});

test('adaptive cycles keep native views within budget and release all individual resources', () => {
  const player = { x: 68, z: 30, speed: 0 };
  const { simulation: s } = simulationFixture({ player, dynamicTraffic: true });
  const f = modelFixture();
  const owned = new Set();
  let created = 0,
    maxPerCar = 0;
  const view = f.TBS.createTrafficView({
    T: f.library,
    scene: f.scene,
    unitBox: f.unitBox,
    box: f.box,
    dark: f.sharedMaterial,
    trimMat: f.sharedMaterial,
    laneMat: f.sharedMaterial,
    roadsX: [],
    roadsZ: [],
    ROAD: 12.4,
    traffic: s.traffic,
    signalPhase: s.signalPhase,
    getTrafficVersion: () => s.version,
    removeVehicle: s.removeVehicle,
    camera: new T.PerspectiveCamera(),
    getGraphics: () => ({ distance: 135 }),
    ...f.models,
    createTrafficCar(color, variant) {
      const before = new Set(f.resources.keys());
      const model = f.models.createTrafficCar(color, variant);
      const allocated = [...f.resources.keys()].filter((resource) => !before.has(resource));
      for (const resource of allocated) owned.add(resource);
      maxPerCar = Math.max(maxPerCar, allocated.length);
      created++;
      return model;
    },
  });
  for (let tick = 0; tick < 1200; tick++) {
    if (tick === 600) Object.assign(player, { x: 362, z: 270 });
    s.advanceTraffic(0.05);
    view.update(0);
    assert.equal(f.scene.children.length, s.traffic.length);
    assert.equal(new Set(f.scene.children).size, s.traffic.length);
    assert.ok(s.traffic.length <= 36);
  }
  assert.ok(created > 36, 'Actual native replacement models were built');
  const liveOwned = [...owned].filter((resource) => f.resources.get(resource) === 0).length;
  assert.ok(liveOwned <= 36 * maxPerCar);
  for (const vehicle of [...s.traffic]) s.removeVehicle(vehicle.id);
  view.update(0);
  assert.equal(f.scene.children.length, 0);
  for (const resource of owned) assert.equal(f.resources.get(resource), 1, resource.type);
  for (const resource of f.shared)
    assert.equal(f.resources.get(resource), 0, 'Shared ' + resource.type);
});
