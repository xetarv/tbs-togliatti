const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

test('scene disables shader diagnostics only for the explicit shaderChecks=0 experiment', () => {
  for (const [search, expected] of [
    ['', true],
    ['?shaderChecks=0', false],
    ['?shaderChecks=1', true],
    ['?shaderChecks=', true],
    ['?shaderChecks=false', true],
    ['?shaderChecks=2', true],
    ['?shaderChecks=00', true],
    ['?other=0', true],
  ]) {
    const renderer = {
      debug: { checkShaderErrors: true },
      shadowMap: {},
      setPixelRatio() {},
      setSize() {},
    };
    let environmentCreated = false;
    const library = {
      ...T,
      WebGLRenderer: class {
        constructor() {
          return renderer;
        }
      },
      PMREMGenerator: class {
        constructor(value) {
          assert.equal(value, renderer);
          assert.equal(value.debug.checkShaderErrors, expected, search);
        }
        fromScene() {
          environmentCreated = true;
          return { texture: new T.Texture() };
        }
        dispose() {}
      },
    };
    const { TBS } = loadModules(['dist/adapters/rendering/scene.js'], {
      URLSearchParams,
      location: { search },
      matchMedia: () => ({ matches: false }),
      innerWidth: 1024,
      innerHeight: 768,
      devicePixelRatio: 1,
    });
    const world = TBS.createScene({ canvas: {}, T: library });
    assert.equal(world.renderer, renderer);
    assert.equal(renderer.debug.checkShaderErrors, expected, search);
    assert.equal(environmentCreated, true);
    assert.equal(world.scene.fog.density, 0.0022);
    assert.equal(renderer.shadowMap.enabled, true);
  }
});
