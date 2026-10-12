const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(search = '') {
  const context = vm.createContext({ console, URLSearchParams, location: { search } });
  context.window = context;
  context.TBS = {};
  for (const file of [
    'assets/three.min.js',
    'src/adapters/rendering/vegetation-culling.js',
    'src/adapters/world/roads.js',
  ])
    vm.runInContext(
      fs.readFileSync(
        path.join(process.env.TBS_TRIM_TEST_ROOT || path.resolve(__dirname, '..'), file),
        'utf8',
      ),
      context,
    );
  const T = context.THREE,
    scene = new T.Scene(),
    geometry = new T.BoxGeometry(1, 1, 1);
  const mat = (color) => new T.MeshStandardMaterial({ color });
  const trimMat = mat(0x5d7e87),
    whiteMat = mat(0xffffff);
  const roads = context.TBS.createRoads({
    T,
    scene,
    trimMat,
    whiteMat,
    mat,
    roadsX: [],
    roadsZ: [],
    ROAD: 12.4,
    unitPlane: new T.PlaneGeometry(1, 1),
    laneMat: mat(0),
    crosswalkMat: mat(0),
    dark: mat(0),
    curbMat: mat(0),
    cyanMat: mat(0),
    orangeMat: mat(0),
    makeTexture: () => new T.Texture(),
    signTexture: () => new T.Texture(),
    visualAssets: { material: () => mat(0) },
    box(parent, x, y, z, w, h, d, material) {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      parent.add(mesh);
      return mesh;
    },
  });
  roads.busStop(-80, 20);
  roads.busStop(180, 200);
  const stops = scene.children.filter((o) => o.isGroup);
  const parts = stops.map((s) => s.children.filter((o) => o.material === trimMat));
  const untouched = stops.flatMap((s) => s.children.filter((o) => o.material !== trimMat));
  const camera = new T.PerspectiveCamera(65, 16 / 9, 0.1, 300);
  camera.position.set(-80, 8, 40);
  camera.lookAt(-80, 2, 20);
  const prepare = () => {
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    scene.onBeforeRender({}, scene, camera);
  };
  const frustum = () =>
    new T.Frustum().setFromProjectionMatrix(
      new T.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
    );
  return { T, scene, camera, geometry, trimMat, stops, parts, untouched, prepare, frustum };
}

test('stop batching preserves geometry, material, local transforms and other shadow casters', () => {
  const f = fixture();
  f.prepare();
  for (let i = 0; i < f.stops.length; i++) {
    const batch = f.stops[i].children.find((o) => o.isInstancedMesh);
    assert.equal(batch.count, 17);
    assert.equal(batch.material, f.trimMat);
    assert.equal(batch.castShadow, false);
    assert.equal(batch.receiveShadow, false);
    for (const key of ['position', 'normal', 'uv'])
      assert.deepEqual(
        Array.from(batch.geometry.attributes[key].array),
        Array.from(f.geometry.attributes[key].array),
      );
    assert.deepEqual(Array.from(batch.geometry.index.array), Array.from(f.geometry.index.array));
    const matrix = new f.T.Matrix4();
    f.parts[i].forEach((p, j) => {
      batch.getMatrixAt(j, matrix);
      assert.deepEqual(
        Array.from(matrix.elements),
        Array.from(new Float32Array(p.matrix.elements)),
      );
    });
  }
  assert.ok(f.untouched.every((o) => o.parent));
  assert.equal(f.untouched.filter((o) => o.castShadow).length, 2);
});

test('stop model-view and normal attributes retain original r149 uniform precision after camera and parent changes', () => {
  const f = fixture();
  f.prepare();
  f.stops[0].rotation.y = 0.17;
  f.stops[0].position.x += 3;
  f.camera.position.x += 4;
  f.camera.lookAt(-80, 2, 20);
  f.prepare();
  const batch = f.stops[0].children.find((o) => o.isInstancedMesh),
    pv = new f.T.Matrix4().multiplyMatrices(f.camera.projectionMatrix, f.camera.matrixWorldInverse);
  const originals = f.parts[0]
    .map((p) => {
      const world = new f.T.Matrix4().multiplyMatrices(f.stops[0].matrixWorld, p.matrix);
      return {
        id: p.id,
        view: new f.T.Matrix4().multiplyMatrices(f.camera.matrixWorldInverse, world),
        z: new f.T.Vector3().setFromMatrixPosition(world).applyMatrix4(pv).z,
      };
    })
    .sort((a, b) => a.z - b.z || a.id - b.id);
  for (let i = 0; i < originals.length; i++) {
    assert.deepEqual(
      Array.from(batch.geometry.attributes.trimModelView.array.slice(i * 16, i * 16 + 16)),
      Array.from(new Float32Array(originals[i].view.elements)),
    );
    const normal = new f.T.Matrix3().getNormalMatrix(originals[i].view);
    assert.deepEqual(
      Array.from(batch.geometry.attributes.trimNormal.array.slice(i * 9, i * 9 + 9)),
      Array.from(new Float32Array(normal.elements)),
    );
  }
});

test('local stop bounds cull distant groups and track parent movement; unchanged views avoid repeated uploads', () => {
  const f = fixture();
  f.prepare();
  const batches = f.stops.map((s) => s.children.find((o) => o.isInstancedMesh));
  assert.equal(f.frustum().intersectsObject(batches[0]), true);
  assert.equal(f.frustum().intersectsObject(batches[1]), false);
  const attr = batches[0].geometry.attributes.trimModelView,
    version = attr.version;
  f.prepare();
  assert.equal(attr.version, version);
  f.camera.position.x += 1;
  f.prepare();
  assert.equal(attr.version, version + 1);
  f.stops[1].position.copy(f.stops[0].position);
  f.prepare();
  assert.equal(f.frustum().intersectsObject(batches[1]), true);
});

test('diagnostic off switch leaves all original stop meshes and shadows intact', () => {
  const f = fixture('?trimStopBatching=0');
  f.prepare();
  assert.equal(f.stops.flatMap((s) => s.children).filter((o) => o.isInstancedMesh).length, 0);
  assert.ok(f.parts.flat().every((o) => o.parent));
  assert.equal(f.parts.flat().length, 34);
  assert.equal(f.untouched.filter((o) => o.castShadow).length, 2);
});
