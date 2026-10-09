const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(enabled = true) {
  const context = vm.createContext({ console });
  context.window = context;
  context.TBS = {};
  const root = path.resolve(__dirname, '..');
  for (const file of ['assets/three.min.js', 'src/adapters/rendering/vegetation-culling.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  const T = context.THREE;
  return {
    T,
    api: context.TBS.createVegetationCulling({ T, enabled }),
    create: context.TBS.createVegetationCulling,
  };
}

function meshAt(T, points, geometry = new T.BoxGeometry(1, 1, 1)) {
  const mesh = new T.InstancedMesh(geometry, new T.MeshBasicMaterial(), points.length);
  points.forEach(([x, y, z], i) => mesh.setMatrixAt(i, new T.Matrix4().makeTranslation(x, y, z)));
  return mesh;
}

function view(T, x = 0) {
  const camera = new T.OrthographicCamera(-5, 5, 5, -5, 0.1, 50);
  camera.position.set(x, 0, 10);
  camera.lookAt(x, 0, 0);
  camera.updateMatrixWorld(true);
  return new T.Frustum().setFromProjectionMatrix(
    new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
}

test('partition handles negative coordinates, cell boundaries, empty and single-cell meshes', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [
    [-32.01, 0, 0],
    [-32, 0, 0],
    [-0.01, 0, 0],
    [0, 0, 0],
    [31.99, 0, 0],
    [32, 0, 0],
  ]);
  assert.deepEqual(
    Array.from(api.partition(mesh), (indices) => Array.from(indices)),
    [[0], [1, 2], [3, 4], [5]],
  );
  assert.equal(api.partition(meshAt(T, [])).length, 0);
  const parent = new T.Group(),
    single = meshAt(T, [
      [0, 0, 0],
      [1, 0, 1],
    ]);
  assert.equal(api.add(parent, single, { cellSize: 32 })[0], single);
  for (const size of [0, -1, NaN, Infinity]) assert.throws(() => api.partition(mesh, size));
});

test('partition preserves every instance matrix, color, shared asset and object flag', () => {
  const { T, api } = setup();
  const parent = new T.Group(),
    mesh = meshAt(T, [
      [-40, 1, 0],
      [40, 2, 0],
      [41, 3, 0],
    ]);
  mesh.position.set(3, 4, 5);
  mesh.rotation.y = 0.3;
  mesh.scale.set(2, 1, 3);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.layers.set(2);
  mesh.renderOrder = 7;
  for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, new T.Color(i / 3, 0.5, 0.7));
  const groups = api.add(parent, mesh, { cellSize: 32 });
  assert.equal(groups.length, 2);
  assert.equal(
    groups.reduce((sum, group) => sum + group.count, 0),
    mesh.count,
  );
  const original = new T.Matrix4(),
    actual = new T.Matrix4(),
    color = new T.Color();
  let i = 0;
  for (const group of groups) {
    assert.equal(group.geometry, mesh.geometry);
    assert.equal(group.material, mesh.material);
    assert.equal(group.castShadow, true);
    assert.equal(group.receiveShadow, true);
    assert.equal(group.layers.mask, mesh.layers.mask);
    assert.equal(group.renderOrder, 7);
    assert.ok(group.position.equals(mesh.position));
    assert.ok(group.quaternion.equals(mesh.quaternion));
    assert.ok(group.scale.equals(mesh.scale));
    for (let j = 0; j < group.count; j++, i++) {
      mesh.getMatrixAt(i, original);
      group.getMatrixAt(j, actual);
      assert.ok(actual.equals(original));
      group.getColorAt(j, color);
      const expected = new T.Color();
      mesh.getColorAt(i, expected);
      assert.ok(color.equals(expected));
    }
  }
});

test('bounds include rotated, nonuniform and zero scales and wind before instance transforms', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [
    [0, 0, 0],
    [30, 2, 0],
  ]);
  const pose = new T.Object3D();
  pose.rotation.z = Math.PI / 2;
  pose.scale.set(10, 2, 3);
  pose.updateMatrix();
  mesh.setMatrixAt(0, pose.matrix);
  mesh.setMatrixAt(1, new T.Matrix4().makeScale(0, 0, 0));
  const bounds = api.bounds(mesh, new T.Vector3(0.022, 0, 0.014));
  assert.ok(bounds.min.y <= -5.22 && bounds.max.y >= 5.22);
  const corner = new T.Vector3(0.522, 0.5, 0.514).applyMatrix4(pose.matrix);
  assert.ok(bounds.containsPoint(corner));
});

test('per-object bounds do not change shared geometry or cull a visible far-translated instance', () => {
  const { T, api } = setup();
  const geometry = new T.BoxGeometry(1, 1, 1);
  geometry.computeBoundingSphere();
  const sphere = geometry.boundingSphere.clone();
  const near = meshAt(T, [[0, 0, 0]], geometry),
    far = meshAt(T, [[100, 0, 0]], geometry);
  api.register(near);
  api.register(far);
  near.updateMatrixWorld();
  far.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(near), true);
  assert.equal(view(T).intersectsObject(far), false);
  assert.equal(view(T, 100).intersectsObject(far), true);
  assert.ok(geometry.boundingSphere.equals(sphere));
});

test('wind crossing a frustum plane is retained, and invalid displacement cannot shrink bounds', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [[5.52, 0, 0]]);
  api.register(mesh, new T.Vector3(0.022, 0, 0.014));
  mesh.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(mesh), true);
  for (const value of [-0.01, NaN, Infinity]) {
    assert.throws(() => api.bounds(mesh, new T.Vector3(value, 0, 0)));
  }
});

test('invalid instance transforms fail open instead of hiding potentially visible content', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [[0, 0, 0]]),
    matrix = new T.Matrix4();
  matrix.elements[14] = NaN;
  mesh.setMatrixAt(0, matrix);
  api.register(mesh);
  mesh.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(mesh), true);
});

test('parent movement, rotation and nonuniform scale update cached world bounds', () => {
  const { T, api } = setup();
  const parent = new T.Group(),
    mesh = meshAt(T, [[0, 0, 0]]);
  api.add(parent, mesh);
  parent.updateMatrixWorld(true);
  assert.equal(view(T).intersectsObject(mesh), true);
  parent.position.x = 100;
  parent.scale.set(2, 3, 4);
  parent.rotation.y = 0.7;
  parent.updateMatrixWorld(true);
  assert.equal(view(T).intersectsObject(mesh), false);
  assert.equal(view(T, 100).intersectsObject(mesh), true);
});

test('frustum edge, spanning and empty groups never cause false rejection', () => {
  const { T, api } = setup();
  for (const points of [
    [[5.5, 0, 0]],
    [
      [-20, 0, 0],
      [20, 0, 0],
    ],
    [],
  ]) {
    const mesh = meshAt(T, points);
    api.register(mesh);
    mesh.updateMatrixWorld();
    assert.equal(view(T).intersectsObject(mesh), true);
  }
});

test('shadow and reflection frusta independently retain a caster outside the main camera', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [[100, 0, 0]]);
  mesh.castShadow = true;
  api.register(mesh);
  mesh.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(mesh), false);
  assert.equal(view(T, 100).intersectsObject(mesh), true);
  assert.equal(view(T).intersectsObject(mesh), false);
  assert.equal(mesh.visible, true);
});

test('changed instance buffers/counts and unregistered clones conservatively remain visible', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [[100, 0, 0]]);
  api.register(mesh);
  mesh.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(mesh), false);
  mesh.setMatrixAt(0, new T.Matrix4());
  mesh.instanceMatrix.needsUpdate = true;
  assert.equal(view(T).intersectsObject(mesh), true);
  api.register(mesh);
  assert.equal(view(T).intersectsObject(mesh), true);
  mesh.count = 0;
  assert.equal(view(T).intersectsObject(mesh), true);
  const clone = mesh.clone();
  assert.equal(view(T).intersectsObject(clone), true);
  const replacement = meshAt(T, [[100, 0, 0]]);
  api.register(replacement);
  replacement.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(replacement), false);
  replacement.instanceMatrix = new T.InstancedBufferAttribute(new Float32Array(16), 16);
  assert.equal(view(T).intersectsObject(replacement), true);
});

test('A/B disabled keeps original unsplit meshes; runtime disable restores full submission', () => {
  const { T, api } = setup(false);
  const parent = new T.Group(),
    mesh = meshAt(T, [
      [-100, 0, 0],
      [100, 0, 0],
    ]);
  assert.equal(api.add(parent, mesh, { cellSize: 32 })[0], mesh);
  assert.equal(parent.children.length, 1);
  assert.equal(mesh.frustumCulled, false);
  api.setEnabled(true);
  api.register(mesh);
  mesh.updateMatrixWorld();
  const outside = view(T, 300);
  assert.equal(outside.intersectsObject(mesh), false);
  api.setEnabled(false);
  assert.equal(outside.intersectsObject(mesh), true);
});

test('non-instanced objects still use r149 culling and repeat installation does not stack hooks', () => {
  const { T, api, create } = setup();
  const hook = T.Frustum.prototype.intersectsObject;
  const root = path.resolve(__dirname, '..');
  assert.equal(T.REVISION, '149');
  const normal = new T.Mesh(new T.BoxGeometry(), new T.MeshBasicMaterial());
  normal.position.x = 100;
  normal.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(normal), false);
  api.register(meshAt(T, [[0, 0, 0]]));
  create({ T });
  assert.equal(T.Frustum.prototype.intersectsObject, hook);
  assert.ok(
    fs.readFileSync(path.join(root, 'index.html'), 'utf8').indexOf('vegetation-culling.js') <
      fs.readFileSync(path.join(root, 'index.html'), 'utf8').indexOf('src/bootstrap/world.js'),
  );
});

test('unregistered InstancedMesh retains standard geometry culling; only our clones fail open', () => {
  const { T, api } = setup();
  const unrelated = meshAt(T, [[0, 0, 0]]);
  unrelated.frustumCulled = true;
  unrelated.position.x = 100;
  unrelated.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(unrelated), false);
  api.register(unrelated);
  const clone = unrelated.clone();
  clone.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(clone), true);
});

test('changed/replaced vertex buffers and geometries fail open until bounds are rebuilt', () => {
  const { T, api } = setup();
  const mesh = meshAt(T, [[100, 0, 0]]);
  api.register(mesh);
  mesh.updateMatrixWorld();
  assert.equal(view(T).intersectsObject(mesh), false);
  mesh.geometry.attributes.position.needsUpdate = true;
  assert.equal(view(T).intersectsObject(mesh), true);
  const position = mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setX(i, position.getX(i) - 100);
  position.needsUpdate = true;
  api.register(mesh);
  assert.equal(view(T).intersectsObject(mesh), true);
  mesh.geometry = new T.BoxGeometry(200, 1, 1);
  assert.equal(view(T).intersectsObject(mesh), true);
});

test('actual shoreline reeds preserve matrix bytes and shared assets with a bounded group count', () => {
  const { T, api } = setup();
  const root = path.resolve(__dirname, '..');
  const terrain = fs.readFileSync(path.join(root, 'src/adapters/world/terrain.js'), 'utf8');
  const start = terrain.indexOf('    const reedGeometry =');
  const end = terrain.indexOf('    vegetationCulling.add(scene, reeds, { cellSize: 32 });', start);
  assert.ok(start > 0 && end > start);
  const scene = new T.Scene();
  vm.runInNewContext(
    terrain.slice(start, end) + '\nvegetationCulling.add(scene, reeds, { cellSize: 32 });',
    {
      T,
      scene,
      vegetationCulling: api,
      rockTransform: new T.Object3D(),
      bankZ: (x) => -62.5 + 2.2 * Math.sin(x * 0.036) + 1.1 * Math.sin(x * 0.113),
    },
  );
  const groups = scene.children;
  // The narrow bank crosses a Z-cell boundary: at most two rows, 16 columns.
  assert.ok(groups.length > 1 && groups.length <= 32);
  assert.equal(
    groups.reduce((sum, group) => sum + group.count, 0),
    1500,
  );
  assert.equal(
    groups.reduce((sum, group) => sum + group.instanceMatrix.array.byteLength, 0),
    96000,
  );
  assert.equal(new Set(groups.map((group) => group.geometry)).size, 1);
  assert.equal(new Set(groups.map((group) => group.material)).size, 1);
});
