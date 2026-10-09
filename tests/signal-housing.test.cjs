const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(enabled) {
  const context = vm.createContext({
    console,
    URLSearchParams,
    location: { search: enabled ? '' : '?signalHousingBatching=0' },
  });
  context.window = context;
  context.TBS = {};
  for (const file of [
    'assets/three.min.js',
    'src/adapters/rendering/vegetation-culling.js',
    'src/adapters/simulation/traffic.js',
  ])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  const T = context.THREE,
    scene = new T.Scene(),
    unitBox = new T.BoxGeometry(1, 1, 1);
  const dark = new T.MeshStandardMaterial({ color: 0x112233 });
  const trimMat = new T.MeshStandardMaterial({ color: 0x445566 });
  const laneMat = new T.MeshBasicMaterial();
  // Ignore stop-line boxes: they are created outside a head and remain unchanged.
  const box = (parent, x, y, z, w, h, d, material) => {
    const mesh = new T.Mesh(unitBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  };
  let phase = 0;
  const view = context.TBS.createTrafficView({
    T,
    scene,
    unitBox,
    dark,
    trimMat,
    laneMat,
    box,
    traffic: [],
    roadsX: [26, 110],
    roadsZ: [30, 110],
    ROAD: 12.4,
    signalPhase: (_x, _z, horizontal) =>
      ['red', 'amber', 'green'][(phase + Number(!horizontal)) % 3],
    camera: new T.PerspectiveCamera(),
    getGraphics: () => ({ distance: 180 }),
  });
  const heads = scene.children.filter((o) => o.isGroup);
  return {
    T,
    scene,
    unitBox,
    dark,
    trimMat,
    laneMat,
    heads,
    advance: () => {
      phase++;
      view.update(1 / 60);
    },
  };
}

function housingTransforms(fixture) {
  const { T, scene, unitBox, laneMat } = fixture;
  scene.updateMatrixWorld(true);
  const result = [],
    instance = new T.Matrix4(),
    world = new T.Matrix4();
  scene.traverse((o) => {
    if ((!o.isInstancedMesh && o.geometry !== unitBox) || o.material === laneMat) return;
    if (o.isInstancedMesh)
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, instance);
        world.multiplyMatrices(o.matrixWorld, instance);
        result.push({
          color: o.material.color.getHex(),
          matrix: world.elements.slice(),
          cast: o.castShadow,
          receive: o.receiveShadow,
        });
      }
    else
      result.push({
        color: o.material.color.getHex(),
        matrix: o.matrixWorld.elements.slice(),
        cast: o.castShadow,
        receive: o.receiveShadow,
      });
  });
  return result.sort(
    (a, b) =>
      a.color - b.color ||
      a.matrix[12] - b.matrix[12] ||
      a.matrix[14] - b.matrix[14] ||
      a.matrix[13] - b.matrix[13],
  );
}

test('housing batches preserve every shape, material, transform and shadow flag', () => {
  const before = setup(false),
    after = setup(true);
  const a = housingTransforms(before),
    b = housingTransforms(after);
  assert.equal(a.length, 80);
  assert.equal(b.length, a.length);
  a.forEach((part, i) => {
    assert.equal(part.color, b[i].color);
    assert.equal(part.cast, b[i].cast);
    assert.equal(part.receive, b[i].receive);
    part.matrix.forEach((v, n) => assert.ok(Math.abs(v - b[i].matrix[n]) < 1e-5));
  });
  const batches = after.scene.children.filter((o) => o.isInstancedMesh);
  assert.equal(batches.length, 8);
  assert.ok(
    batches.every(
      (o) =>
        o.geometry.attributes.position.count === after.unitBox.attributes.position.count &&
        o.frustumCulled,
    ),
  );
  assert.equal(after.heads.length, 16);
  assert.equal(before.scene.children.filter((o) => o.isInstancedMesh).length, 0);
});

test('all original signal lamps retain their positions, materials and phase changes', () => {
  const before = setup(false),
    after = setup(true);
  const lamps = (f) =>
    f.heads.map((h) =>
      h.children
        .filter((o) => o.geometry?.type === 'CircleGeometry')
        .map((o) => ({
          position: o.position.toArray(),
          color: o.material.color.getHex(),
          toneMapped: o.material.toneMapped,
        })),
    );
  for (let i = 0; i < 4; i++) {
    assert.equal(lamps(after).flat().length, 48);
    assert.deepEqual(
      JSON.parse(JSON.stringify(lamps(after))),
      JSON.parse(JSON.stringify(lamps(before))),
    );
    before.advance();
    after.advance();
  }
});

test('exact per-camera attributes retain the ordinary Mesh Float32 matrix path, including transformed parents', () => {
  const before = setup(false),
    after = setup(true);
  for (const f of [before, after]) {
    f.scene.position.set(27.123456789, -1.23456789, -36.123456789);
    f.scene.scale.set(1.25, 0.8, 1.15);
    f.scene.rotation.set(0.17, 0.41, -0.12);
    f.scene.updateMatrixWorld(true);
  }
  const floats = (a) => Array.from(new Float32Array(a));
  const sort = (a) =>
    a.sort((p, q) => p.view[12] - q.view[12] || p.view[14] - q.view[14] || p.view[13] - q.view[13]);
  const batches = after.scene.children.filter((o) => o.isInstancedMesh);
  for (const position of [
    [81.12, 5.37, 95.89],
    [-45.12, 12.37, 29.89],
  ]) {
    const camera = new after.T.PerspectiveCamera(60, 4 / 3, 0.1, 800);
    camera.position.set(...position);
    camera.lookAt(75.234, 4.17, 88.135);
    camera.updateMatrixWorld(true);
    after.scene.onBeforeRender(null, after.scene, camera);
    const expected = [],
      actual = [];
    before.scene.traverse((o) => {
      if (o.geometry !== before.unitBox || o.material === before.laneMat) return;
      const view = new before.T.Matrix4().multiplyMatrices(
        camera.matrixWorldInverse,
        o.matrixWorld,
      );
      expected.push({
        view: floats(view.elements),
        normal: floats(new before.T.Matrix3().getNormalMatrix(view).elements),
      });
    });
    for (const batch of batches) {
      const m = batch.material,
        oldCompile = m.onBeforeCompile,
        oldKey = m.customProgramCacheKey;
      batch.onBeforeRender(null, after.scene, camera);
      for (let i = 0; i < batch.count; i++) {
        const a = batch.geometry.attributes;
        actual.push({
          view: Array.from(a.signalModelView.array.slice(i * 16, i * 16 + 16)),
          normal: Array.from(a.signalNormal.array.slice(i * 9, i * 9 + 9)),
        });
      }
      assert.ok(m === after.dark || m === after.trimMat);
      const shader = { vertexShader: after.T.ShaderLib.standard.vertexShader };
      m.onBeforeCompile(shader, null);
      assert.ok(shader.vertexShader.includes('signalModelView * vec4(transformed, 1.0)'));
      assert.ok(!shader.vertexShader.includes('#include <defaultnormal_vertex>'));
      batch.onAfterRender();
      assert.equal(m.onBeforeCompile, oldCompile);
      assert.equal(m.customProgramCacheKey, oldKey);
    }
    assert.deepEqual(sort(actual), sort(expected));
  }
});

test('instances follow original opaque depth order and refresh conservative bounds after reordering', () => {
  const before = setup(false),
    after = setup(true);
  before.scene.updateMatrixWorld(true);
  after.scene.updateMatrixWorld(true);
  before.unitBox.computeBoundingBox();
  const groups = new Map();
  before.scene.traverse((part) => {
    if (part.geometry !== before.unitBox || !part.parent.isGroup) return;
    const head = part.parent;
    const key =
      part.material.color.getHex() +
      ':' +
      Math.floor(head.position.x / 84) +
      ':' +
      Math.floor(head.position.z / 80);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(part);
  });
  for (const position of [
    [120, 7, 140],
    [5, 9, -25],
  ]) {
    const camera = new after.T.PerspectiveCamera(60, 4 / 3, 0.1, 800);
    camera.position.set(...position);
    camera.lookAt(60, 4, 65);
    camera.updateMatrixWorld(true);
    const projection = new after.T.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    const frustum = new after.T.Frustum().setFromProjectionMatrix(projection);
    after.scene.onBeforeRender(null, after.scene, camera);
    for (const batch of after.scene.children.filter((o) => o.isInstancedMesh)) {
      const first = new after.T.Matrix4();
      batch.getMatrixAt(0, first);
      const key =
        batch.material.color.getHex() +
        ':' +
        Math.floor(first.elements[12] / 84) +
        ':' +
        Math.floor(first.elements[14] / 80);
      const depth = (part) =>
        new before.T.Vector3().setFromMatrixPosition(part.matrixWorld).applyMatrix4(projection).z;
      const expected = groups
        .get(key)
        .slice()
        .sort((a, b) => depth(a) - depth(b) || a.id - b.id);
      const matrix = new after.T.Matrix4();
      expected.forEach((part, i) => {
        batch.getMatrixAt(i, matrix);
        assert.deepEqual(
          Array.from(matrix.elements),
          Array.from(new Float32Array(part.matrixWorld.elements)),
        );
        const view = new before.T.Matrix4().multiplyMatrices(
          camera.matrixWorldInverse,
          part.matrixWorld,
        );
        assert.deepEqual(
          Array.from(batch.geometry.attributes.signalModelView.array.slice(i * 16, i * 16 + 16)),
          Array.from(new Float32Array(view.elements)),
        );
      });
      if (
        expected.some((part) =>
          frustum.intersectsBox(before.unitBox.boundingBox.clone().applyMatrix4(part.matrixWorld)),
        )
      )
        assert.equal(
          frustum.intersectsObject(batch),
          true,
          'A visible detail cannot be culled after sorting.',
        );
    }
  }
});
