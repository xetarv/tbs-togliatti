const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');
const assetWindow = {};
vm.runInNewContext(
  fs.readFileSync(require.resolve('../assets/visual-surfaces-embedded.js'), 'utf8'),
  { window: assetWindow },
);
const baked = assetWindow.TBS_VISUAL_SURFACES;

class ImageFixture {
  naturalWidth = 512;
  naturalHeight = 512;
  async decode() {}
}
function api(Image = ImageFixture) {
  return loadModules(['dist/adapters/world/visual-assets.js'], { Image }).TBS;
}

test('fixed surfaces prepare all twelve local PNGs and preserve the original RNG transitions', async () => {
  const prepared = await api().prepareVisualSurfaces(baked);
  let seed = 81231;
  for (const kind of ['asphalt', 'stone', 'paving', 'brick']) {
    const surface = prepared[kind];
    assert.equal(surface.beforeSeed, seed);
    for (let i = 0; i < surface.randomCalls; i++)
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    assert.equal(surface.afterSeed, seed);
    for (const image of Object.values(surface.images)) {
      assert.equal(image.naturalWidth, 512);
      assert.ok(image.src.startsWith('data:image/png;base64,'));
    }
  }
});

test('missing surface pack retains the procedural path; malformed or failed images reject before world creation', async () => {
  assert.equal(await api().prepareVisualSurfaces(undefined), undefined);
  const bad = { ...baked, asphalt: { ...baked.asphalt, randomCalls: Infinity } };
  await assert.rejects(api().prepareVisualSurfaces(bad), /RNG count/);
  class WrongSize extends ImageFixture {
    naturalWidth = 256;
  }
  await assert.rejects(api(WrongSize).prepareVisualSurfaces(baked), /dimensions/);
  class DecodeFailure extends ImageFixture {
    async decode() {
      throw new Error('decode failed');
    }
  }
  await assert.rejects(api(DecodeFailure).prepareVisualSurfaces(baked), /decode failed/);
});

test('stale baked RNG metadata cannot silently shift subsequent procedural planting', async () => {
  const a = api(),
    prepared = await a.prepareVisualSurfaces(baked);
  assert.throws(
    () =>
      a.createVisualAssets(
        T,
        {},
        {},
        { ...prepared, asphalt: { ...prepared.asphalt, beforeSeed: 0 } },
      ),
    /RNG input/,
  );
  assert.throws(
    () =>
      a.createVisualAssets(
        T,
        {},
        {},
        { ...prepared, asphalt: { ...prepared.asphalt, afterSeed: 0 } },
      ),
    /RNG output/,
  );
});

test('page departure during image decoding does not create a late renderer/world or retain its pagehide listener', async () => {
  const { context } = loadModules([]);
  let resolve,
    worlds = 0;
  const pending = new Promise((r) => {
      resolve = r;
    }),
    listeners = new Map();
  context.THREE = { ColorManagement: {} };
  context.document = {};
  context.addEventListener = (name, fn) => listeners.set(name, fn);
  context.removeEventListener = (name, fn) => {
    if (listeners.get(name) === fn) listeners.delete(name);
  };
  context.TBS.createDom = () => ({});
  context.TBS.domain.createState = () => ({});
  context.TBS.createPresentationState = () => ({});
  context.TBS.prepareVisualSurfaces = () => pending;
  context.TBS.buildWorld = () => {
    worlds++;
    throw new Error('Late world');
  };
  vm.runInContext(fs.readFileSync(require.resolve('../dist/app.js'), 'utf8'), context);
  assert.ok(listeners.has('pagehide'));
  listeners.get('pagehide')();
  resolve(undefined);
  await new Promise((r) => setImmediate(r));
  assert.equal(worlds, 0);
  assert.equal(listeners.has('pagehide'), false);
});
