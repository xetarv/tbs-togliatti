const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(batched, housing = true, visibleMatrices = true) {
  const context = vm.createContext({
    URLSearchParams,
    location: {
      search: `?signalLampBatching=${Number(batched)}&signalHousingBatching=${Number(housing)}&visibleSignalMatrices=${Number(visibleMatrices)}`,
    },
  });
  context.window = context;
  context.TBS = {};
  for (const file of [
    'assets/three.min.js',
    'dist/adapters/rendering/vegetation-culling.js',
    'dist/adapters/simulation/traffic.js',
  ])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  const T = context.THREE,
    scene = new T.Scene(),
    unitBox = new T.BoxGeometry();
  let phase = 0;
  const view = context.TBS.createTrafficView({
    T,
    scene,
    unitBox,
    dark: new T.MeshStandardMaterial(),
    trimMat: new T.MeshStandardMaterial(),
    laneMat: new T.MeshBasicMaterial(),
    roadsX: [26, 110],
    roadsZ: [30, 110],
    ROAD: 12.4,
    traffic: [],
    getTrafficVersion: () => 0,
    removeVehicle: () => false,
    signalPhase: (_x, _z, horizontal) =>
      ['red', 'amber', 'green'][horizontal ? Math.floor(phase / 3) : phase % 3],
    camera: new T.PerspectiveCamera(),
    getGraphics: () => ({ distance: 180 }),
    box(parent, x, y, z, w, h, d, material) {
      const mesh = new T.Mesh(unitBox, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      parent.add(mesh);
      return mesh;
    },
  });
  const batches = scene.children.filter((o) => o.geometry?.attributes.signalLampModelView);
  const lamps = [];
  scene.traverse((o) => {
    if (o.geometry?.type === 'CircleGeometry' && !o.isInstancedMesh) lamps.push(o);
  });
  return {
    T,
    scene,
    batches,
    lamps,
    view,
    phase(n) {
      phase = n;
      view.update(1 / 60);
    },
  };
}
const floats = (a) => Array.from(new Float32Array(a));
function appearance(material) {
  return [
    material.color.r,
    material.color.g,
    material.color.b,
    material.toneMapped,
    material.side,
    material.depthTest,
    material.depthWrite,
    material.transparent,
    material.blending,
    material.fog,
  ];
}
function shapes(f) {
  f.scene.updateMatrixWorld(true);
  const result = [];
  for (const o of [...f.lamps, ...f.batches]) {
    const count = o.isInstancedMesh ? o.count : 1;
    for (let i = 0; i < count; i++) {
      const matrix = new f.T.Matrix4();
      if (o.isInstancedMesh) o.getMatrixAt(i, matrix);
      else matrix.copy(o.matrixWorld);
      result.push({
        matrix: floats(matrix.elements),
        material: appearance(o.material),
        cast: o.castShadow,
        receive: o.receiveShadow,
        positions: Array.from(o.geometry.attributes.position.array),
        normals: Array.from(o.geometry.attributes.normal.array),
        uv: Array.from(o.geometry.attributes.uv.array),
        index: Array.from(o.geometry.index.array),
      });
    }
  }
  return result.sort(
    (a, b) =>
      a.matrix[12] - b.matrix[12] || a.matrix[14] - b.matrix[14] || a.matrix[13] - b.matrix[13],
  );
}
test('junction lamp batches preserve all shapes, four materials, transforms and every red/amber/green combination', () => {
  for (const housing of [true, false]) {
    const a = setup(false, housing),
      b = setup(true, housing);
    assert.equal(a.lamps.length, 48);
    assert.equal(b.lamps.length, 0);
    assert.equal(b.batches.length, 16);
    for (let phase = 0; phase < 9; phase++) {
      a.phase(phase);
      b.phase(phase);
      assert.deepEqual(shapes(b), shapes(a));
      assert.equal(
        b.batches.reduce((n, o) => n + o.count, 0),
        48,
      );
      assert.ok(b.batches.filter((o) => o.visible).every((o) => o.frustumCulled));
    }
  }
});

function camera(f, position) {
  const camera = new f.T.PerspectiveCamera(60, 16 / 9, 0.1, 800);
  camera.position.set(...position);
  camera.lookAt(75.234, 4.17, 88.135);
  camera.updateMatrixWorld(true);
  return camera;
}
function prepare(f, c) {
  f.scene.updateMatrixWorld(true);
  f.scene.onBeforeRender(null, f.scene, c);
}
function views(f, c) {
  const result = [];
  for (const o of [...f.lamps, ...f.batches]) {
    if (o.isInstancedMesh) {
      const values = o.geometry.attributes.signalLampModelView.array;
      for (let i = 0; i < o.count; i++)
        result.push({
          color: appearance(o.material),
          matrix: Array.from(values.slice(i * 16, i * 16 + 16)),
        });
    } else
      result.push({
        color: appearance(o.material),
        matrix: floats(
          new f.T.Matrix4().multiplyMatrices(c.matrixWorldInverse, o.matrixWorld).elements,
        ),
      });
  }
  return result.sort(
    (a, b) =>
      a.matrix[12] - b.matrix[12] || a.matrix[14] - b.matrix[14] || a.matrix[13] - b.matrix[13],
  );
}
test('lamp projection retains exact Mesh Float32 model-view matrices for two cameras, phases and transformed scene', () => {
  const a = setup(false),
    b = setup(true);
  for (const f of [a, b]) {
    f.scene.position.set(27.123456789, -1.23456789, -36.123456789);
    f.scene.rotation.set(0.17, 0.41, -0.12);
    f.scene.scale.set(1.25, 0.8, 1.15);
  }
  for (const position of [
    [81.12, 5.37, 95.89],
    [-45.12, 12.37, 29.89],
  ]) {
    const c = camera(b, position);
    for (let phase = 0; phase < 9; phase++) {
      a.phase(phase);
      b.phase(phase);
      a.scene.updateMatrixWorld(true);
      // Phase registration can reset this flag; inspect all groups per render.
      for (const batch of b.batches) batch.frustumCulled = false;
      prepare(b, c);
      assert.deepEqual(views(b, c), views(a, c));
    }
  }
  for (const o of b.batches) {
    const shader = { vertexShader: b.T.ShaderLib.basic.vertexShader };
    o.material.onBeforeCompile(shader, null);
    assert.equal(
      shader.vertexShader,
      'attribute mat4 signalLampModelView;\n' +
        b.T.ShaderLib.basic.vertexShader.replace(
          '#include <project_vertex>',
          'vec4 mvPosition = signalLampModelView * vec4(transformed, 1.0);\ngl_Position = projectionMatrix * mvPosition;',
        ),
    );
  }
});

test('lamp buffers/resources stay stable without phase or camera change; camera changes do not upload instance transforms', () => {
  const f = setup(true),
    c = camera(f, [81, 7, 95]);
  for (const batch of f.batches) batch.frustumCulled = false;
  prepare(f, c);
  const resources = f.batches.map((o) => ({
    geometry: o.geometry,
    attribute: o.geometry.attributes.signalLampModelView,
    array: o.geometry.attributes.signalLampModelView.array,
    instance: o.instanceMatrix,
    iv: o.instanceMatrix.version,
    mv: o.geometry.attributes.signalLampModelView.version,
    material: o.material,
    materialVersion: o.material.version,
  }));
  for (let i = 0; i < 5; i++) {
    f.view.update(1 / 60);
    prepare(f, c);
  }
  resources.forEach((r, i) => {
    const o = f.batches[i];
    assert.equal(o.instanceMatrix.version, r.iv);
    assert.equal(o.geometry.attributes.signalLampModelView.version, r.mv);
    assert.equal(o.material.version, r.materialVersion);
  });
  c.position.x += 17;
  c.updateMatrixWorld(true);
  prepare(f, c);
  resources.forEach((r, i) => {
    const o = f.batches[i];
    assert.equal(o.instanceMatrix.version, r.iv);
    if (o.visible) assert.equal(o.geometry.attributes.signalLampModelView.version, r.mv + 1);
  });
  for (let i = 0; i < 90; i++) {
    f.phase(i % 9);
    prepare(f, c);
  }
  resources.forEach((r, i) => {
    const o = f.batches[i];
    assert.equal(o.geometry, r.geometry);
    assert.equal(o.geometry.attributes.signalLampModelView, r.attribute);
    assert.equal(o.geometry.attributes.signalLampModelView.array, r.array);
    assert.equal(o.instanceMatrix, r.instance);
    assert.equal(o.material, r.material);
    assert.equal(o.material.version, r.materialVersion);
  });
});

test('per-junction bounds retain visible lamps through phase changes and independent camera frusta', () => {
  const a = setup(false),
    b = setup(true);
  for (let phase = 0; phase < 9; phase++) {
    a.phase(phase);
    b.phase(phase);
    a.scene.updateMatrixWorld(true);
    b.scene.updateMatrixWorld(true);
    const lookup = new Map();
    for (const batch of b.batches)
      for (let i = 0; i < batch.count; i++) {
        const m = new b.T.Matrix4();
        batch.getMatrixAt(i, m);
        lookup.set(
          JSON.stringify([
            m.elements[12],
            m.elements[13],
            m.elements[14],
            ...appearance(batch.material),
          ]),
          batch,
        );
      }
    for (const position of [
      [120, 7, 140],
      [5, 9, -25],
      [-100, 10, 100],
    ]) {
      const c = camera(b, position),
        frustum = new b.T.Frustum().setFromProjectionMatrix(
          new b.T.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse),
        );
      prepare(b, c);
      for (const lamp of a.lamps) {
        lamp.geometry.computeBoundingBox();
        const box = lamp.geometry.boundingBox.clone().applyMatrix4(lamp.matrixWorld);
        if (!frustum.intersectsBox(box)) continue;
        const p = floats(lamp.matrixWorld.elements);
        const batch = lookup.get(
          JSON.stringify([p[12], p[13], p[14], ...appearance(lamp.material)]),
        );
        assert.ok(batch);
        assert.equal(
          frustum.intersectsObject(batch),
          true,
          'Visible lamp must remain within the registered junction bounds.',
        );
      }
    }
    for (const batch of b.batches.filter((o) => o.count)) {
      const bounds = new b.T.Box3();
      for (let i = 0; i < batch.count; i++) {
        const m = new b.T.Matrix4();
        batch.getMatrixAt(i, m);
        bounds.union(batch.geometry.boundingBox.clone().applyMatrix4(m));
      }
      assert.ok(batch.count <= 12);
      assert.ok(
        bounds.max.x - bounds.min.x < 16 && bounds.max.z - bounds.min.z < 16,
        'A lamp batch cannot span separate intersections.',
      );
    }
  }
});

function signalBatches(f) {
  return Array.from(f.scene.children).filter(
    (o) =>
      o.isInstancedMesh &&
      (o.geometry.attributes.signalModelView || o.geometry.attributes.signalLampModelView),
  );
}
function viewAttribute(o) {
  return o.geometry.attributes.signalModelView || o.geometry.attributes.signalLampModelView;
}

test('visible signal matrices match eager preparation through phases, camera re-entry and transformed parents', () => {
  let rendered = 0,
    skipped = 0,
    reentered = 0;
  for (const housing of [false, true]) {
    const a = setup(true, housing, false),
      b = setup(true, housing, true);
    const source = signalBatches(a),
      target = signalBatches(b);
    assert.equal(source.length, target.length);
    let lastVisible = new Set();
    const poses = [
      [
        [26, 6, 20],
        [26, 3, 40],
      ],
      [
        [110, 6, 100],
        [110, 3, 120],
      ],
      [
        [90, 8, 40],
        [30, 3, 35],
      ],
      [
        [26, 6, 20],
        [26, 3, 40],
      ],
    ];
    for (const [poseIndex, pose] of poses.entries()) {
      if (poseIndex === 2)
        for (const f of [a, b]) {
          f.scene.position.set(5, 0.5, -3);
          f.scene.rotation.y = 0.23;
          f.scene.scale.set(1.1, 0.9, 1.2);
        }
      const ca = new a.T.PerspectiveCamera(44, 16 / 9, 0.1, 180),
        cb = new b.T.PerspectiveCamera(44, 16 / 9, 0.1, 180);
      for (const c of [ca, cb]) {
        c.position.set(...pose[0]);
        c.lookAt(...pose[1]);
        c.updateMatrixWorld(true);
      }
      for (let phase = 0; phase < 9; phase++) {
        a.phase(phase);
        b.phase(phase);
        const before = target.map((o) => ({
          version: viewAttribute(o).version,
          data: Array.from(viewAttribute(o).array),
        }));
        prepare(a, ca);
        prepare(b, cb);
        const frustum = new b.T.Frustum().setFromProjectionMatrix(
          new b.T.Matrix4().multiplyMatrices(cb.projectionMatrix, cb.matrixWorldInverse),
        );
        const visible = new Set();
        target.forEach((o, i) => {
          if (!o.visible) return;
          const attr = viewAttribute(o);
          if (o.frustumCulled && !frustum.intersectsObject(o)) {
            assert.equal(attr.version, before[i].version);
            assert.deepEqual(Array.from(attr.array), before[i].data);
            skipped++;
          } else {
            assert.deepEqual(
              Array.from(attr.array.slice(0, o.count * 16)),
              Array.from(viewAttribute(source[i]).array.slice(0, o.count * 16)),
            );
            if (o.geometry.attributes.signalNormal)
              assert.deepEqual(
                Array.from(o.geometry.attributes.signalNormal.array),
                Array.from(source[i].geometry.attributes.signalNormal.array),
              );
            visible.add(o.id);
            rendered++;
            if (poseIndex && !lastVisible.has(o.id)) reentered++;
          }
        });
        lastVisible = visible;
      }
    }
  }
  assert.ok(rendered > 0);
  assert.ok(skipped > 0);
  assert.ok(reentered > 0);
});

test('disabling per-object culling still prepares all signal attributes exactly', () => {
  const a = setup(true, true, false),
    b = setup(true, true, true),
    source = signalBatches(a),
    target = signalBatches(b);
  for (const o of target) o.frustumCulled = false;
  const ca = new a.T.PerspectiveCamera(30, 1, 0.1, 60),
    cb = new b.T.PerspectiveCamera(30, 1, 0.1, 60);
  for (const c of [ca, cb]) {
    c.position.set(0, 5, 0);
    c.lookAt(0, 5, -100);
    c.updateMatrixWorld(true);
  }
  for (let phase = 0; phase < 9; phase++) {
    a.phase(phase);
    b.phase(phase);
    for (const o of target) o.frustumCulled = false;
    prepare(a, ca);
    prepare(b, cb);
    target.forEach((o, i) =>
      assert.deepEqual(
        Array.from(viewAttribute(o).array.slice(0, o.count * 16)),
        Array.from(viewAttribute(source[i]).array.slice(0, o.count * 16)),
      ),
    );
  }
});
