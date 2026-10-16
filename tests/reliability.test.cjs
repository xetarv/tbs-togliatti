const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

function graphicsFixture({ initialQuality = 'high', quarter = false, depth = true } = {}) {
  const targets = [];
  const library = {
    ...T,
    WebGLRenderTarget: class extends T.WebGLRenderTarget {
      constructor(...args) {
        super(...args);
        targets.push(this);
      }
    },
    WebGLCubeRenderTarget: class extends T.WebGLCubeRenderTarget {
      constructor(...args) {
        super(...args);
        targets.push(this);
      }
    },
  };
  const scene = new T.Scene();
  if (quarter) scene.userData.quarterLighting = { x: 0, z: 0, reflective: [] };
  const camera = new T.PerspectiveCamera();
  camera.position.set(0, 10, 20);
  const car = new T.Group();
  car.userData.paint = new T.MeshPhysicalMaterial();
  const water = new T.MeshStandardMaterial();
  const sky = new T.Mesh(new T.SphereGeometry(1), new T.ShaderMaterial());
  let target = null;
  let face = 0;
  let mipmap = 0;
  const passes = [];
  const renderer = {
    capabilities: { isWebGL2: depth },
    extensions: { has: () => false },
    info: { reset() {} },
    shadowMap: {},
    toneMapping: T.ACESFilmicToneMapping,
    xr: { enabled: true },
    getRenderTarget: () => target,
    getActiveCubeFace: () => face,
    getActiveMipmapLevel: () => mipmap,
    setRenderTarget(value, cubeFace = 0, level = 0) {
      target = value;
      face = cubeFace;
      mipmap = level;
    },
    setPixelRatio() {},
    setSize() {},
    getDrawingBufferSize: (v) => v.set(1024, 768),
    render(s, c) {
      passes.push({ scene: s, camera: c, target, face });
    },
  };
  const { TBS } = loadModules(['dist/adapters/rendering/graphics.js'], {
    innerWidth: 1024,
    innerHeight: 768,
    devicePixelRatio: 1,
    localStorage: { setItem() {} },
  });
  const graphics = TBS.createGraphics({
    T: library,
    renderer,
    scene,
    camera,
    sky,
    car,
    water,
    buildings: [],
    facades: [],
    initialQuality,
  });
  return { graphics, renderer, scene, targets, passes };
}

test('graphics accepts only own preset keys at initialization and on changes', () => {
  for (const invalid of ['toString', 'constructor', '__proto__', 'hasOwnProperty', '', 'bad']) {
    const { graphics } = graphicsFixture({ initialQuality: invalid });
    assert.equal(graphics.quality, 'medium');
    assert.equal(graphics.distance, 110);
    graphics.render(0.016, 1);
    for (const valid of ['low', 'high', 'medium']) {
      assert.equal(graphics.setQuality(valid), valid);
      assert.equal(graphics.setQuality(invalid), 'medium');
      assert.equal(graphics.distance, 110);
    }
  }
  for (const [quality, distance] of [
    ['low', 85],
    ['medium', 110],
    ['high', 135],
  ]) {
    const { graphics } = graphicsFixture({ initialQuality: quality });
    assert.equal(graphics.quality, quality);
    assert.equal(graphics.distance, distance);
  }
});

test('failed cube, water, main and post passes restore renderer state and preserve errors', () => {
  for (const phase of ['quarter', 'cube', 'water', 'main', 'post', 'low', 'no-depth']) {
    const { graphics, renderer, scene, targets } = graphicsFixture({
      quarter: phase === 'quarter',
      initialQuality: phase === 'low' ? 'low' : 'high',
      depth: phase !== 'no-depth',
    });
    const previousTarget = new T.WebGLCubeRenderTarget(8);
    renderer.setRenderTarget(previousTarget, 2, 1);
    const failure = new Error('controlled ' + phase);
    const render = renderer.render;
    renderer.render = (s, c) => {
      const target = renderer.getRenderTarget();
      const fail =
        ((phase === 'quarter' || phase === 'cube') && target?.isWebGLCubeRenderTarget) ||
        (phase === 'water' && target && target !== targets[0] && !target.isWebGLCubeRenderTarget) ||
        (['main', 'low', 'no-depth'].includes(phase) && s === scene) ||
        (phase === 'post' && s !== scene && target === null);
      if (fail) throw failure;
      render(s, c);
    };
    assert.throws(
      () => graphics.render(0.95, 0.3),
      (error) => error === failure,
    );
    assert.equal(renderer.toneMapping, T.ACESFilmicToneMapping, phase);
    assert.equal(renderer.xr.enabled, true, phase);
    assert.equal(renderer.getRenderTarget(), previousTarget, phase);
    assert.equal(renderer.getActiveCubeFace(), 2, phase);
    assert.equal(renderer.getActiveMipmapLevel(), 1, phase);
    for (const t of targets.filter((t) => t.isWebGLCubeRenderTarget)) {
      assert.equal(t.texture.generateMipmaps, true, phase);
    }
  }
});

test('successful render retains cube, water, postprocessing and direct-render paths', () => {
  for (const quality of ['high', 'medium', 'low']) {
    const { graphics, renderer, scene, passes } = graphicsFixture({ initialQuality: quality });
    graphics.render(0.95, 0.3);
    assert.equal(renderer.getRenderTarget(), null);
    assert.equal(renderer.toneMapping, T.ACESFilmicToneMapping);
    assert.equal(renderer.xr.enabled, true);
    assert.equal(
      passes.filter((p) => p.target?.isWebGLCubeRenderTarget).length,
      quality === 'high' ? 6 : 0,
    );
    assert.equal(passes.filter((p) => p.scene === scene).length, 1);
    assert.equal(passes.at(-1).scene === scene, quality === 'low');
  }
});

test('startup and window-error reporting tolerate arbitrary thrown values without losing diagnostics', () => {
  const hostile = {
    get message() {
      throw new Error('message getter');
    },
  };
  const values = [
    null,
    undefined,
    42,
    'failure',
    Symbol('failure'),
    new Error('original'),
    { message: 'detail' },
    hostile,
    Object.create(null),
  ];
  for (const value of values) {
    const logged = [];
    const elements = {
      toast: { textContent: '', classList: { add() {} } },
      startBtn: { disabled: false },
    };
    const handlers = {};
    const { context } = loadModules([], {
      console: { error: (error) => logged.push(error) },
      document: { getElementById: (id) => elements[id] },
      addEventListener: (name, callback) => {
        handlers[name] = callback;
      },
    });
    context.TBS.createDom = () => {
      throw value;
    };
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8'), context);
    assert.equal(logged[0], value);
    assert.equal(elements.startBtn.disabled, true);
    assert.ok(elements.toast.textContent.length > 20);
    assert.doesNotThrow(() => handlers.error({ error: value, message: 'event failure' }));
    assert.equal(logged.length, 2);
    if (value === 'failure') assert.ok(elements.toast.textContent.endsWith('failure'));
    if (value === null) assert.ok(elements.toast.textContent.endsWith('event failure'));
  }
});
