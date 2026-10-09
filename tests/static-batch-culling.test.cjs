const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(search = '') {
  const context = vm.createContext({ console, URLSearchParams, location: { search } });
  context.window = context;
  context.TBS = {};
  for (const file of [
    'assets/three.min.js',
    'src/adapters/rendering/vegetation-culling.js',
    'src/adapters/world/population.js',
  ])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  const T = context.THREE;
  const scene = new T.Scene();
  const geometry = new T.BoxGeometry(1, 1, 1);
  const material = new T.MeshStandardMaterial();
  const meshes = [];
  for (let i = 0; i < 3; i++) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(21 + i, 0, 0);
    mesh.scale.set(40, 2, 1);
    mesh.rotation.z = i * 0.04;
    mesh.castShadow = i === 0;
    scene.add(mesh);
    meshes.push(mesh);
  }
  return {
    T,
    scene,
    geometry,
    meshes,
    populate: () =>
      context.TBS.populateWorld({ T, scene, unitBox: geometry, roadsX: [], roadsZ: [] }),
  };
}

function frustum(T, x) {
  const camera = new T.OrthographicCamera(-5, 5, 5, -5, 0.1, 50);
  camera.position.set(x, 0, 10);
  camera.lookAt(x, 0, 0);
  camera.updateMatrixWorld(true);
  return new T.Frustum().setFromProjectionMatrix(
    new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
}

test('real population batches retain transforms, density, geometry and shadow flags', () => {
  const { T, scene, geometry, meshes, populate } = setup();
  populate();
  const batch = scene.children.find((o) => o.isInstancedMesh);
  assert.equal(batch.count, 3);
  assert.equal(batch.geometry, geometry);
  assert.equal(batch.material, meshes[0].material);
  assert.equal(batch.castShadow, true);
  assert.equal(batch.receiveShadow, true);
  const matrix = new T.Matrix4();
  meshes.forEach((mesh, i) => {
    batch.getMatrixAt(i, matrix);
    matrix.elements.forEach((value, n) =>
      assert.ok(Math.abs(value - mesh.matrix.elements[n]) < 1e-6 * Math.max(1, Math.abs(value))),
    );
  });
  scene.updateMatrixWorld(true);
  // Origins are outside; scaled/rotated vertices still intersect the main view.
  assert.equal(frustum(T, 0).intersectsObject(batch), true);
  assert.equal(frustum(T, -70).intersectsObject(batch), false);
  // A shadow camera can retain a batch excluded by the main camera.
  assert.equal(frustum(T, 21).intersectsObject(batch), true);
  scene.position.x = -90;
  scene.updateMatrixWorld(true);
  assert.equal(frustum(T, -70).intersectsObject(batch), true);
  assert.equal(frustum(T, 21).intersectsObject(batch), false);
});

test('static switch is independent of vegetation switch; off preserves the same batches', () => {
  for (const [query, culled] of [
    ['?vegetationCulling=0', true],
    ['?staticBatchCulling=0', false],
  ]) {
    const { T, scene, populate } = setup(query);
    populate();
    const batch = scene.children.find((o) => o.isInstancedMesh);
    assert.equal(batch.count, 3);
    assert.equal(batch.frustumCulled, culled);
    scene.updateMatrixWorld(true);
    if (culled) assert.equal(frustum(T, -70).intersectsObject(batch), false);
  }
});

test('existing batching eligibility is preserved; nested and oversized objects stay untouched', () => {
  const { T, scene, geometry, meshes, populate } = setup();
  const oversized = new T.Mesh(geometry, meshes[0].material);
  oversized.scale.x = 85;
  scene.add(oversized);
  const group = new T.Group();
  const nested = new T.Mesh(geometry, meshes[0].material);
  group.add(nested);
  scene.add(group);
  populate();
  assert.equal(oversized.parent, scene);
  assert.equal(nested.parent, group);
  assert.equal(oversized.userData.TBS_vegetationCullingR149, undefined);
  assert.equal(nested.userData.TBS_vegetationCullingR149, undefined);
  assert.equal(scene.children.filter((o) => o.isInstancedMesh).length, 1);
});
