'use strict';

// r149 tests geometry.boundingSphere, which ignores instance transforms.
// Keep per-object bounds and let every render/shadow camera use its own frustum.
window.TBS.createVegetationCulling = function ({ T, enabled = true }) {
  if (T.REVISION !== '149') throw new Error('Vegetation culling requires Three.js r149.');
  const key = Symbol.for('TBS.vegetationCulling.r149');
  const prototype = T.Frustum.prototype;
  if (!prototype[key]) {
    const original = prototype.intersectsObject;
    const entries = new WeakMap();
    Object.defineProperty(prototype, key, { value: { entries } });
    prototype.intersectsObject = function (object) {
      const entry = entries.get(object);
      if (!entry) {
        // Only clones of our groups need the conservative fallback. Leave all
        // unrelated objects, including custom-cullable InstancedMesh, untouched.
        if (object.isInstancedMesh && object.userData.TBS_vegetationCullingR149) return true;
        return original.call(this, object);
      }
      if (!entry.active()) return true;
      // A changed instance buffer needs an explicit rebuild. Fail open meanwhile.
      if (
        object.count !== entry.count ||
        object.instanceMatrix !== entry.attribute ||
        object.instanceMatrix.version !== entry.version ||
        object.geometry !== entry.geometry ||
        object.geometry.attributes.position !== entry.positions ||
        object.geometry.attributes.position.version !== entry.positionVersion
      )
        return true;
      if (!entry.matrix.equals(object.matrixWorld)) {
        entry.matrix.copy(object.matrixWorld);
        entry.world.copy(entry.local).applyMatrix4(object.matrixWorld).expandByScalar(0.01);
      }
      if (
        !Number.isFinite(entry.world.min.x) ||
        !Number.isFinite(entry.world.min.y) ||
        !Number.isFinite(entry.world.min.z) ||
        !Number.isFinite(entry.world.max.x) ||
        !Number.isFinite(entry.world.max.y) ||
        !Number.isFinite(entry.world.max.z)
      )
        return true;
      return this.intersectsBox(entry.world);
    };
  }
  const registry = prototype[key].entries;
  const geometryBounds = new WeakMap();
  const matrix = new T.Matrix4();
  const transformed = new T.Box3();
  const position = new T.Vector3();

  function bounds(mesh, displacement = new T.Vector3()) {
    if (
      [displacement.x, displacement.y, displacement.z].some((v) => v < 0 || !Number.isFinite(v))
    ) {
      throw new Error('Invalid vegetation displacement.');
    }
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position;
    let cached = geometryBounds.get(geometry);
    if (!cached || cached.positions !== positions || cached.version !== positions.version) {
      geometry.computeBoundingBox();
      cached = { box: geometry.boundingBox.clone(), positions, version: positions.version };
      geometryBounds.set(geometry, cached);
    }
    // Wind is applied before instanceMatrix: expand in vertex space first.
    const base = cached.box.clone().expandByVector(displacement);
    const local = new T.Box3();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      local.union(transformed.copy(base).applyMatrix4(matrix));
    }
    return local;
  }

  function register(mesh, displacement) {
    if (!enabled) return mesh;
    const local = bounds(mesh, displacement);
    registry.set(mesh, {
      local,
      world: local.clone(),
      matrix: new T.Matrix4().set(...Array(16).fill(NaN)),
      count: mesh.count,
      attribute: mesh.instanceMatrix,
      version: mesh.instanceMatrix.version,
      geometry: mesh.geometry,
      positions: mesh.geometry.attributes.position,
      positionVersion: mesh.geometry.attributes.position.version,
      active: () => enabled,
    });
    mesh.userData.TBS_vegetationCullingR149 = true;
    mesh.frustumCulled = true;
    return mesh;
  }

  function partition(mesh, cellSize = 32) {
    if (!(cellSize > 0) || !Number.isFinite(cellSize))
      throw new Error('Invalid vegetation cell size.');
    const cells = new Map();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      const cell = Math.floor(position.x / cellSize) + ':' + Math.floor(position.z / cellSize);
      if (!cells.has(cell)) cells.set(cell, []);
      cells.get(cell).push(i);
    }
    return [...cells.values()];
  }

  function add(parent, mesh, { displacement, cellSize } = {}) {
    const cells = enabled && cellSize ? partition(mesh, cellSize) : [];
    if (cells.length <= 1) {
      parent.add(register(mesh, displacement));
      return [mesh];
    }
    const color = new T.Color();
    const groups = cells.map((indices) => {
      const group = new T.InstancedMesh(mesh.geometry, mesh.material, indices.length);
      T.Object3D.prototype.copy.call(group, mesh, false);
      group.count = indices.length;
      // The constructor already allocated the correctly sized subset buffer.
      group.instanceMatrix.setUsage(mesh.instanceMatrix.usage);
      group.instanceColor = null;
      indices.forEach((source, target) => {
        mesh.getMatrixAt(source, matrix);
        group.setMatrixAt(target, matrix);
        if (mesh.instanceColor) {
          mesh.getColorAt(source, color);
          group.setColorAt(target, color);
        }
      });
      parent.add(register(group, displacement));
      return group;
    });
    return groups;
  }

  return { add, register, bounds, partition, setEnabled: (value) => (enabled = Boolean(value)) };
};
