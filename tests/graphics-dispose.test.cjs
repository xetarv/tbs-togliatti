const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

function fixture({ quarter = true, quality = 'low' } = {}) {
  const counts = new Map();
  const targets = [],
    geometries = [],
    materials = [],
    scenes = [];
  const track = (value, collection) => {
    counts.set(value, 0);
    value.addEventListener('dispose', () => counts.set(value, counts.get(value) + 1));
    if (collection) collection.push(value);
    return value;
  };
  const library = {
    ...T,
    WebGLRenderTarget: class extends T.WebGLRenderTarget {
      constructor(...args) {
        super(...args);
        track(this, targets);
      }
    },
    WebGLCubeRenderTarget: class extends T.WebGLCubeRenderTarget {
      constructor(...args) {
        super(...args);
        track(this, targets);
      }
    },
    DepthTexture: class extends T.DepthTexture {
      constructor(...args) {
        super(...args);
        track(this);
      }
    },
    PlaneGeometry: class extends T.PlaneGeometry {
      constructor(...args) {
        super(...args);
        track(this, geometries);
      }
    },
    BoxGeometry: class extends T.BoxGeometry {
      constructor(...args) {
        super(...args);
        track(this, geometries);
      }
    },
    ShaderMaterial: class extends T.ShaderMaterial {
      constructor(...args) {
        super(...args);
        track(this, materials);
      }
    },
    MeshStandardMaterial: class extends T.MeshStandardMaterial {
      constructor(...args) {
        super(...args);
        track(this, materials);
      }
    },
    Scene: class extends T.Scene {
      constructor() {
        super();
        scenes.push(this);
      }
    },
  };
  const scene = new T.Scene();
  const environment = track(new T.Texture());
  scene.environment = environment;
  const facade = track(new T.Texture());
  const originalEnv = track(new T.Texture());
  const paint = track(new T.MeshPhysicalMaterial({ envMap: originalEnv }));
  const water = track(new T.MeshStandardMaterial());
  let compileCalls = 0;
  const originalCompile = (shader) => {
    compileCalls++;
    shader.uniforms.waveTime = { value: 0 };
    water.userData.shader = shader;
  };
  water.onBeforeCompile = originalCompile;
  const sky = new T.Mesh(track(new T.SphereGeometry(1)), track(new T.ShaderMaterial()));
  const boat = new T.Group();
  const boatMaterial = track(new T.MeshStandardMaterial({ map: facade }));
  const boatGeometry = track(new T.BoxGeometry());
  boat.add(new T.Mesh(boatGeometry, boatMaterial));
  scene.add(sky, boat);
  const car = new T.Group();
  car.userData.paint = paint;
  const reflective = [track(new T.MeshStandardMaterial({ envMap: originalEnv }))];
  if (quarter) scene.userData.quarterLighting = { x: 0, z: 0, reflective };
  const camera = new T.PerspectiveCamera();
  camera.position.set(0, 10, 20);
  let target = null,
    face = 0,
    mipmap = 0,
    touches = 0,
    rendererDisposals = 0;
  const renderer = {
    info: {
      autoReset: true,
      reset() {
        touches++;
      },
    },
    capabilities: { isWebGL2: true },
    extensions: { has: () => false },
    shadowMap: {},
    toneMapping: 4,
    xr: { enabled: false },
    getRenderTarget: () => target,
    getActiveCubeFace: () => face,
    getActiveMipmapLevel: () => mipmap,
    setRenderTarget(value, f = 0, m = 0) {
      touches++;
      target = value;
      face = f;
      mipmap = m;
    },
    setPixelRatio() {
      touches++;
    },
    setSize() {
      touches++;
    },
    getDrawingBufferSize: (v) => v.set(1024, 512),
    render() {
      touches++;
    },
    dispose() {
      rendererDisposals++;
    },
  };
  const { TBS } = loadModules(['dist/adapters/rendering/graphics.js'], {
    innerWidth: 1024,
    innerHeight: 512,
    devicePixelRatio: 1,
    localStorage: { setItem() {} },
  });
  const external = [...counts.keys()];
  const graphics = TBS.createGraphics({
    T: library,
    renderer,
    scene,
    camera,
    sky,
    car,
    water,
    buildings: [
      { x: 0, z: 0, w: 10, h: 20, d: 10, color: 0x123456, seed: 0 },
      { x: 25, z: 0, w: 8, h: 10, d: 8, color: 0x123456, seed: 0 },
    ],
    facades: [facade],
    reflectObjects: [boat],
    initialQuality: quality,
  });
  const compile = (previous = {}) => {
    const shader = {
      uniforms: { ...previous },
      vertexShader: '#include <project_vertex>',
      fragmentShader: '#include <output_fragment>',
    };
    water.onBeforeCompile(shader);
    return shader;
  };
  return {
    graphics,
    renderer,
    targets,
    geometries,
    materials,
    scenes,
    counts,
    external,
    scene,
    water,
    paint,
    reflective,
    originalEnv,
    originalCompile,
    compile,
    sky,
    boat,
    touches: () => touches,
    rendererDisposals: () => rendererDisposals,
    compileCalls: () => compileCalls,
  };
}

test('graphics disposal owns targets/depth/fullscreen/proxies and leaves shared world resources alive', () => {
  const f = fixture();
  assert.equal(T.REVISION, '149');
  assert.ok(
    [...f.counts.values()].every((count) => count === 0),
    'No disposal during this ordinary low-quality creation',
  );
  assert.equal(f.scenes[1].children[0].material, f.sky.material);
  assert.equal(f.scenes[1].children[0].geometry, f.sky.geometry);
  const boatClone = f.scenes[1].children.find((o) => o.isGroup);
  assert.equal(boatClone.children[0].material, f.boat.children[0].material);
  assert.equal(boatClone.children[0].geometry, f.boat.children[0].geometry);
  f.graphics.dispose();
  const owned = [...f.targets, f.targets[0].depthTexture, ...f.geometries, ...f.materials];
  for (const resource of owned) assert.equal(f.counts.get(resource), 1, resource.type);
  for (const resource of f.external) assert.equal(f.counts.get(resource), 0, resource.type);
  assert.equal(f.rendererDisposals(), 0);
  assert.equal(f.renderer.info.autoReset, true);
  assert.equal(f.scene.children.length, 2);
  assert.ok(f.scenes.every((s) => s.children.length === 0));
  assert.equal(f.water.onBeforeCompile, f.originalCompile);
  const before = [...f.counts.values()];
  f.graphics.dispose();
  assert.deepEqual([...f.counts.values()], before);
  const touches = f.touches();
  f.graphics.render(1, 1);
  f.graphics.resize();
  assert.equal(f.graphics.setQuality('high'), 'low');
  assert.equal(f.graphics.quality, 'low');
  assert.equal(f.graphics.distance, 85);
  assert.equal(f.touches(), touches, 'Disposed methods cannot touch renderer/resources');
});

test('compiled water bindings and own environment maps are detached and prior hooks/maps restored', () => {
  const f = fixture({ quality: 'high' });
  const previousReflection = { value: new T.Texture() };
  const shader = f.compile({ waterReflection: previousReflection });
  const wave = shader.uniforms.waveTime;
  const installed = f.water.onBeforeCompile;
  f.graphics.render(1, 0.3);
  assert.ok(f.paint.envMap.isCubeTexture);
  assert.ok(f.reflective[0].envMap.isCubeTexture);
  const counts = new Map(f.counts);
  f.graphics.dispose();
  assert.equal(f.paint.envMap, f.originalEnv);
  assert.equal(f.reflective[0].envMap, f.originalEnv);
  assert.equal(shader.uniforms.waterReflection, previousReflection);
  assert.equal(shader.uniforms.waterReflectionMatrix, undefined);
  assert.equal(shader.uniforms.reflectionStrength, undefined);
  assert.equal(shader.uniforms.waveTime, wave, 'Keep terrain wave data');
  assert.equal(f.water.userData.shader, shader);
  assert.equal(f.water.onBeforeCompile, f.originalCompile);
  const later = { uniforms: {}, vertexShader: '', fragmentShader: '' };
  installed(later);
  assert.equal(
    later.uniforms.waterReflection,
    undefined,
    'A retained disposed wrapper cannot reinstall freed targets',
  );
  assert.ok(later.uniforms.waveTime);
  for (const resource of f.external) assert.equal(f.counts.get(resource), counts.get(resource));
});

test('superseding hooks/uniforms/env maps survive and an absent quarter is safe', () => {
  const f = fixture({ quarter: false, quality: 'high' });
  const shader = f.compile();
  f.graphics.render(1, 0.3);
  const installed = f.water.onBeforeCompile;
  const newerHook = (s) => {
    installed(s);
    s.uniforms.foreign = { value: 7 };
  };
  const foreign = new T.Texture(),
    foreignBinding = { value: foreign };
  f.water.onBeforeCompile = newerHook;
  shader.uniforms.waterReflection = foreignBinding;
  f.paint.envMap = foreign;
  const foreignTarget = new T.WebGLRenderTarget(1, 1);
  f.renderer.setRenderTarget(foreignTarget);
  f.graphics.dispose();
  assert.equal(f.water.onBeforeCompile, newerHook);
  assert.equal(shader.uniforms.waterReflection, foreignBinding);
  assert.equal(f.paint.envMap, foreign);
  assert.equal(f.renderer.getRenderTarget(), foreignTarget);
  assert.equal(f.targets.length, 3);
  const later = { uniforms: {}, vertexShader: '', fragmentShader: '' };
  newerHook(later);
  assert.equal(later.uniforms.foreign.value, 7);
  assert.equal(later.uniforms.waterReflection, undefined);
});

test('r149 render-target disposal disposes depth exactly once with or without a renderer listener', () => {
  for (const initialized of [false, true]) {
    const f = fixture({ quarter: false });
    const target = f.targets[0],
      depth = target.depthTexture;
    // This reproduces the bundled renderer's deallocation listener; actual WebGL is checked in Edge.
    if (initialized) {
      const listener = () => {
        target.removeEventListener('dispose', listener);
        depth.dispose();
      };
      target.addEventListener('dispose', listener);
    }
    f.renderer.setRenderTarget(target);
    f.graphics.dispose();
    assert.equal(f.renderer.getRenderTarget(), null);
    assert.equal(f.counts.get(depth), 1);
    f.graphics.dispose();
    assert.equal(f.counts.get(depth), 1);
  }
});
