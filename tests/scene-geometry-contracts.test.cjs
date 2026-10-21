const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

test('strict contracts require narrowing fog and missing geometry attributes', (t) => {
  const root = path.resolve(__dirname, '..');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tbs-contract-state-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const fixture = path.join(temporary, 'fixture.ts');
  fs.writeFileSync(
    fixture,
    [
      'declare const library: ThreeLibraryHandle;',
      'const scene = new library.Scene();',
      'const unsafeFog: ThreeFogHandle = scene.fog;',
      'if (scene.fog) scene.fog.color.setHex(0x91abb9);',
      'const raw = new library.BufferGeometry();',
      'const unsafePosition: ThreeNumericAttribute = raw.attributes.position;',
      'const position = raw.attributes.position;',
      'if (position) position.getX(0);',
      'const box = new library.BoxGeometry();',
      'box.attributes.position.getX(0);',
      'box.attributes.normal.getY(0);',
      'box.attributes.uv.getX(0);',
      'const unsafeCustom: ThreeNumericAttribute = box.attributes.custom;',
      'box.clone().attributes.position.getX(0);',
    ].join('\n'),
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
          .filter((f) => f.endsWith('.d.ts'))
          .map((f) => path.join(root, 'types', f)),
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
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.signal, null);
  const diagnostics = result.stdout
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.includes('error TS'));
  assert.equal(diagnostics.length, 3, result.stdout);
  for (const line of [3, 6, 13])
    assert.ok(
      diagnostics.some((d) => d.includes(`fixture.ts(${line},`)),
      result.stdout,
    );
  assert.ok(
    diagnostics.every((d) => d.includes('TS2322')),
    result.stdout,
  );
});

test('native r149 empty scene/geometry and prepared primitives match their contracts', () => {
  assert.equal(T.REVISION, '149');
  assert.equal(new T.Scene().fog, null);
  assert.equal(new T.BufferGeometry().attributes.position, undefined);
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const path = new T.CatmullRomCurve3([new T.Vector3(), new T.Vector3(1, 1, 1)]);
  const geometries = [
    new T.BoxGeometry(),
    new T.SphereGeometry(),
    new T.CircleGeometry(),
    new T.CylinderGeometry(),
    new T.TorusGeometry(),
    new T.OctahedronGeometry(),
    new T.IcosahedronGeometry(),
    new T.ShapeGeometry(shape),
    new T.ExtrudeGeometry(shape),
    new T.LatheGeometry([new T.Vector2(1, 0), new T.Vector2(1, 1)]),
    new T.TubeGeometry(path),
  ];
  for (const geometry of geometries) {
    for (const key of ['position', 'normal', 'uv']) {
      assert.ok(geometry.attributes[key]?.isBufferAttribute, `${geometry.type}.${key}`);
      assert.ok(geometry.clone().attributes[key]?.isBufferAttribute);
    }
    assert.equal(geometry.attributes.custom, undefined);
    geometry.dispose();
  }
});

test('lighting narrows optional fog and preserves configured fog updates', () => {
  const { TBS } = loadModules(['dist/adapters/rendering/lighting.js']);
  const scene = new T.Scene();
  const car = new T.Group();
  car.userData.headlights = [];
  const state = { mode: 'paused', lightValue: 0.5, lightingClock: 0 };
  const api = TBS.createLighting({
    listen: (target, type, callback, options) => target.addEventListener(type, callback, options),
    T,
    scene,
    lowPower: false,
    player: { x: 0, z: 0 },
    state,
    getElement: () => ({ addEventListener() {} }),
    showToast() {},
    camera: new T.PerspectiveCamera(),
    ambientLight: new T.HemisphereLight(),
    sun: new T.DirectionalLight(),
    blueLight: new T.DirectionalLight(),
    sky: new T.Mesh(
      new T.SphereGeometry(),
      new T.ShaderMaterial({ uniforms: { daylight: { value: 1 } } }),
    ),
    duskSun: new T.Mesh(new T.SphereGeometry(), new T.MeshBasicMaterial()),
    nightWindows: [],
    streetFixtures: [],
    cityFacadeLights: [],
    car,
    getGraphics: () => ({ quality: 'high' }),
  });
  assert.doesNotThrow(() => api.updateLighting(0.016));
  scene.fog = new T.FogExp2(0x91abb9, 0.0022);
  state.lightValue = 0.2;
  api.updateLighting(0.016);
  assert.ok(scene.fog.color.equals(new T.Color(0x142638).lerp(new T.Color(0x91abb9), 0.2)));
  assert.equal(scene.fog.density, 0.0022);
});
