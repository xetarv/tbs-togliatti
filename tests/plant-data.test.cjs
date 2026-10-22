const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const T = require('../assets/three.min.js');
const sources = [
  'fixtures/plant-reference-r149.js.txt',
  '../dist/adapters/world/visual-assets.js',
].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8'));
const assetWindow = {};
vm.runInNewContext(
  fs.readFileSync(require.resolve('../assets/visual-surfaces-embedded.js'), 'utf8'),
  {
    window: assetWindow,
  },
);
const prepared = Object.fromEntries(
  Object.entries(assetWindow.TBS_VISUAL_SURFACES).map(([name, value]) => [
    name,
    { ...value, images: { map: {}, normalMap: {}, roughnessMap: {} } },
  ]),
);
function factory(source) {
  const gradient = { addColorStop() {} };
  const drawing = new Proxy(
    {},
    { get: (_object, key) => (key.startsWith('create') ? () => gradient : () => {}) },
  );
  const context = {
    window: { TBS: {} },
    Math,
    document: { createElement: () => ({ getContext: () => drawing }) },
  };
  vm.runInNewContext(source, context);
  const culling = {
    add(parent, mesh) {
      parent.add(mesh);
    },
  };
  return context.window.TBS.createVisualAssets(
    T,
    { capabilities: { getMaxAnisotropy: () => 8 } },
    culling,
    prepared,
  );
}
const bytes = (array) =>
  Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString('hex');
function snapshot(group) {
  return group.children.map((mesh) => ({
    position: mesh.position.toArray(),
    scale: mesh.scale.toArray(),
    rotation: mesh.rotation.toArray(),
    cast: mesh.castShadow,
    receive: mesh.receiveShadow,
    count: mesh.count,
    attributes: Object.fromEntries(
      Object.entries(mesh.geometry.attributes).map(([key, value]) => [key, bytes(value.array)]),
    ),
    index: mesh.geometry.index ? bytes(mesh.geometry.index.array) : null,
    matrices: mesh.instanceMatrix ? bytes(mesh.instanceMatrix.array) : null,
    colors: mesh.instanceColor ? bytes(mesh.instanceColor.array) : null,
  }));
}
function generate(source) {
  const original = Math.random;
  let seed = 72421,
    calls = 0;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    calls++;
    return seed / 4294967296;
  };
  try {
    const api = factory(source),
      parent = new T.Group(),
      result = [];
    for (const variant of [0, 1, 0, 3, 1, -2, 0]) {
      const group = api.plant(parent, 10, 20, variant, 0.88);
      result.push({ data: snapshot(group), seed, calls });
    }
    return result;
  } finally {
    Math.random = original;
  }
}
test('prepared plant reuse preserves every native r149 geometry/instance byte and RNG transition', () => {
  const legacy = T.ColorManagement.legacyMode;
  T.ColorManagement.legacyMode = false;
  try {
    assert.deepEqual(generate(sources[1]), generate(sources[0]));
  } finally {
    T.ColorManagement.legacyMode = legacy;
  }
});
test('returned plant buffers remain independently mutable and disposable', () => {
  const api = factory(sources[1]),
    parent = new T.Group();
  const first = api.plant(parent, 0, 0, 3),
    expected = snapshot(first);
  first.children[0].geometry.attributes.position.array.fill(0);
  first.children[1].instanceMatrix.array.fill(0);
  first.children[1].instanceColor.array.fill(0);
  first.children[0].geometry.dispose();
  const next = api.plant(parent, 0, 0, 3);
  assert.deepEqual(snapshot(next), expected);
  assert.notEqual(next.children[0].geometry, first.children[0].geometry);
});
