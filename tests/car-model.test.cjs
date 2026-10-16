const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

function modelsFixture() {
  const { TBS, context } = loadModules(['dist/adapters/vehicles/car-model.js']);
  const api = context.TBS;
  const calls = [];
  const scene = new T.Scene();
  const material = new T.MeshStandardMaterial();
  const unitBox = new T.BoxGeometry();
  const box = (parent) => {
    const mesh = new T.Mesh(unitBox, material);
    parent.add(mesh);
    return mesh;
  };
  const body = (kind) => (group, paint, variant) => {
    calls.push([kind, variant]);
    group.userData.detailedBody = true;
    if (kind === 'passenger') group.userData.steeringWheel = box(group);
    box(group);
  };
  api.createTrafficCarGeometry = () => ({ coachwork: box, glazedQuad: box });
  api.createPassengerBodyBuilder = () => ({ createPassengerShell: body('passenger') });
  api.createCommercialBodyBuilder = () => ({ createCommercialBody: body('commercial') });
  api.buildTrafficCarWheels = ({ group }) => {
    calls.push(['wheels']);
    return {
      wheels: Array.from({ length: 4 }, (_, i) => {
        const steering = new T.Group(),
          rolling = new T.Group();
        group.add(steering);
        steering.add(rolling);
        return { steering, rolling, front: i < 2 };
      }),
    };
  };
  api.buildTrafficCarLights = ({ passenger }) => {
    calls.push(['lights', passenger]);
    return { brakeMaterial: new T.MeshBasicMaterial(), reverseMaterial: new T.MeshBasicMaterial() };
  };
  api.buildTrafficCarShadow = ({ group }) => {
    calls.push(['shadow']);
    return { shadow: box(group) };
  };
  api.buildTrafficCarSuspension = ({ group }) => {
    calls.push(['suspension']);
    group.userData.body = new T.Group();
    group.add(group.userData.body);
  };
  const hero = new T.Group();
  const models = TBS.createCarModels({
    T,
    scene,
    box,
    wedge: box,
    mat: () => material,
    dark: material,
    cyanMat: material,
    orangeMat: material,
    whiteMat: material,
    trimMat: material,
    tireMat: material,
    unitBox,
    markTexture: new T.Texture(),
    detailBar: box,
    signTexture: () => new T.Texture(),
    createFastback: () => hero,
    meshData: {},
    makeTexture(draw, w, h) {
      draw({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }, w, h);
      return new T.Texture();
    },
  });
  return { models, scene, calls, hero };
}

test('all traffic variants select the intended body once and preserve assembly API/data', () => {
  for (const variant of ['compact', 'sedan', 'van', 'shuttle']) {
    const { models, scene, calls, hero } = modelsFixture();
    assert.equal(models.createHeroCar(), hero);
    const car = models.createTrafficCar(0x2378ab, variant);
    const passenger = variant === 'compact' || variant === 'sedan';
    assert.deepEqual(calls, [
      [passenger ? 'passenger' : 'commercial', variant],
      ['wheels'],
      ['lights', passenger],
      ['shadow'],
      ['suspension'],
    ]);
    assert.equal(scene.children[0], car);
    assert.equal(scene.children.length, 1);
    assert.equal(car.userData.variant, variant);
    assert.equal(car.userData.paint.isMeshPhysicalMaterial, true);
    assert.ok(car.userData.paint.color.equals(new T.Color(0x2378ab)));
    assert.equal(car.userData.detailedBody, true);
    assert.equal(car.userData.wheels.length, 4);
    assert.equal(car.userData.body.parent, car);
    assert.equal(Boolean(car.userData.steeringWheel), passenger);
    assert.equal(car.userData.wheelRadius, variant === 'compact' ? 0.45 : 0.5);
    assert.deepEqual(
      car.scale.toArray(),
      variant === 'compact' ? [0.9, 0.9 * 1.06, 0.9 * 0.87] : [1, 1, 1],
    );
    models.animateVehicle(car, -2, 0.2, true, 0.05);
    assert.ok(car.userData.wheels[0].rolling.rotation.x > 0);
    assert.ok(car.userData.wheels[0].steering.rotation.y < 0);
    assert.ok(car.userData.brakeMaterial.color.equals(new T.Color(0xff3822)));
    assert.ok(car.userData.reverseMaterial.color.equals(new T.Color(0xe8f5ff)));
  }
});

test('omitted variant remains sedan and untyped prototype keys cannot select a model', () => {
  const { models, calls } = modelsFixture();
  assert.equal(models.createTrafficCar(0xffffff).userData.variant, 'sedan');
  for (const key of ['toString', 'constructor', '__proto__']) {
    calls.length = 0;
    const car = models.createTrafficCar(0xffffff, key);
    assert.deepEqual(calls[0], ['passenger', 'sedan']);
    assert.deepEqual(car.scale.toArray(), [1, 1, 1]);
    assert.equal(car.userData.variant, key, 'Preserve the old untyped caller metadata');
  }
});

test('strict model selection rejects an incomplete TrafficVariant map', (t) => {
  const root = path.resolve(__dirname, '..');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tbs-traffic-model-contract-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const fixture = path.join(temporary, 'fixture.ts');
  fs.writeFileSync(
    fixture,
    'declare const model: TrafficModelDefinition;\nconst complete: Record<TrafficVariant, TrafficModelDefinition> = { compact: model, sedan: model, van: model, shuttle: model };\nconst incomplete: Record<TrafficVariant, TrafficModelDefinition> = { compact: model, sedan: model, van: model };\n',
  );
  const config = path.join(temporary, 'tsconfig.json');
  fs.writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        types: [],
        target: 'ES2022',
        lib: ['ES2022', 'DOM'],
      },
      files: [
        ...fs
          .readdirSync(path.join(root, 'types'))
          .filter((n) => n.endsWith('.d.ts'))
          .map((n) => path.join(root, 'types', n)),
        fixture,
      ],
    }),
  );
  const compiler = path.join(
    path.dirname(require.resolve('@typescript/native/package.json')),
    'bin/tsc',
  );
  const result = spawnSync(process.execPath, [compiler, '--project', config, '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, 0);
  const errors = result.stdout.split(/\r?\n/).filter((line) => line.includes('error TS'));
  assert.equal(errors.length, 1, result.stdout + result.stderr);
  assert.match(errors[0], /fixture\.ts\(3,.*TS2741:.*shuttle/);
});
