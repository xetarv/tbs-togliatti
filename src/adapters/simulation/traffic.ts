'use strict';

window.TBS.createTrafficView = function ({
  traffic,
  signalPhase,
  getTrafficVersion,
  removeVehicle,
  T,
  roadsX,
  roadsZ,
  ROAD,
  scene,
  dark,
  laneMat,
  trimMat,
  box,
  createTrafficCar,
  disposeTrafficCar,
  camera,
  animateVehicle,
  getGraphics,
  unitBox,
}: TrafficViewOptions): TrafficViewPort {
  const signalHeads: TrafficSignalHead[] = [];
  const housingBatches = new Map<string, TrafficHousingPart[]>();
  const prepareSignals: ((camera: ThreeRenderCameraHandle) => void)[] = [];
  const projectionView = new T.Matrix4();
  const signalFrustum = new T.Frustum();
  const prepareVisibleSignals =
    new URLSearchParams(location.search).get('visibleSignalMatrices') !== '0';
  const batchHousing = new URLSearchParams(location.search).get('signalHousingBatching') !== '0';
  const batchLamps = new URLSearchParams(location.search).get('signalLampBatching') !== '0';
  const lampGroups = new Map<string, TrafficLampRecord[]>();
  const synchronizeLamps: (() => void)[] = [];
  let lampGeometry: ThreeSurfaceGeometry | undefined;

  const signalMaterials = [0xff4030, 0xffbd35, 0x55ff98].map(
    (color) => new T.MeshBasicMaterial({ color, toneMapped: false }),
  );

  const signalOff = new T.MeshBasicMaterial({ color: 0x17212b });

  for (const x of roadsX)
    for (const z of roadsZ)
      for (const horizontal of [true, false])
        for (const dir of [-1, 1]) {
          const head = new T.Group(),
            edge = ROAD / 2 + 0.8;
          head.position.set(x - dir * edge, 0, horizontal ? z + dir * edge : z - dir * edge);
          head.rotation.y = horizontal ? (-dir * Math.PI) / 2 : dir > 0 ? Math.PI : 0;
          box(head, 0, 2, 0, 0.12, 4, 0.12, trimMat);
          box(head, 0, 4.05, 0.03, 0.65, 1.85, 0.36, dark);
          const lamps: TrafficSignalHead['lamps'] = [];
          for (let i = 0; i < 3; i++) {
            const lamp = new T.Mesh(
              batchLamps
                ? (lampGeometry ??= new T.CircleGeometry(0.22, 16))
                : new T.CircleGeometry(0.22, 16),
              signalOff,
            );
            lamp.position.set(0, 4.62 - i * 0.55, 0.22);
            head.add(lamp);
            lamps.push(lamp);
            if (batchLamps) {
              head.updateMatrix();
              lamp.updateMatrix();
              const key = x + ':' + z;
              let records = lampGroups.get(key);
              if (!records) lampGroups.set(key, (records = []));
              records.push({
                head,
                lamp,
                local: lamp.matrix.clone(),
                instance: new T.Matrix4().multiplyMatrices(head.matrix, lamp.matrix),
                view: new T.Matrix4(),
                id: lamp.id,
                depth: 0,
              });
              head.remove(lamp);
            }
            box(head, 0, 4.89 - i * 0.55, 0.27, 0.62, 0.07, 0.6, dark);
          }
          scene.add(head);
          if (batchHousing)
            for (const part of head.children as TrafficHousingPart[])
              if (part.geometry === unitBox) {
                const key =
                  part.material.uuid + ':' + Math.floor(x / 84) + ':' + Math.floor(z / 80);
                if (!housingBatches.has(key)) housingBatches.set(key, []);
                housingBatches.get(key)!.push(part);
              }
          signalHeads.push({ x, z, horizontal, lamps });
          const lane = ((horizontal ? dir : -dir) * ROAD) / 4,
            stop = dir * (ROAD / 2 + 0.65);
          box(
            scene,
            horizontal ? x - stop : x + lane,
            0.18,
            horizontal ? z + lane : z - stop,
            horizontal ? 0.3 : ROAD / 2 - 0.8,
            0.02,
            horizontal ? ROAD / 2 - 0.8 : 0.3,
            laneMat,
          );
        }

  const culling = window.TBS.createVegetationCulling({ T });
  for (const parts of housingBatches.values()) {
    const records: TrafficHousingRecord[] = parts.map((part, index) => {
      part.parent.updateMatrix();
      part.updateMatrix();
      return {
        head: part.parent,
        local: part.matrix.clone(),
        instance: new T.Matrix4().multiplyMatrices(part.parent.matrix, part.matrix),
        view: new T.Matrix4(),
        index,
        id: part.id,
        depth: 0,
      };
    });
    const geometry = unitBox.clone();
    const material = parts[0].material;
    const batch = new T.InstancedMesh(geometry, material, parts.length);
    batch.castShadow = parts[0].castShadow;
    batch.receiveShadow = parts[0].receiveShadow;
    const world = new T.Matrix4(),
      position = new T.Vector3(),
      normal = new T.Matrix3();
    records.forEach(({ head, local }, i) => {
      world.multiplyMatrices(head.matrix, local);
      batch.setMatrixAt(i, world);
      parts[i].removeFromParent();
    });
    {
      const modelView = new T.InstancedBufferAttribute(new Float32Array(parts.length * 16), 16);
      const normalView = new T.InstancedBufferAttribute(new Float32Array(parts.length * 9), 9);
      for (const a of [modelView, normalView]) a.setUsage(T.DynamicDrawUsage);
      geometry.setAttribute('signalModelView', modelView);
      geometry.setAttribute('signalNormal', normalView);
      const originalCompile = material.onBeforeCompile;
      const originalKey = material.customProgramCacheKey;
      const compile = function (
        this: ThreeMaterialHandle,
        shader: ThreeCompiledShader,
        renderer: ThreeRendererHandle,
      ): void {
        originalCompile.call(this, shader, renderer);
        shader.vertexShader =
          'attribute mat4 signalModelView;\nattribute mat3 signalNormal;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <project_vertex>',
          'vec4 mvPosition = signalModelView * vec4(transformed, 1.0);\ngl_Position = projectionMatrix * mvPosition;',
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <defaultnormal_vertex>',
          'vec3 transformedNormal = signalNormal * objectNormal;\n#ifdef FLIP_SIDED\ntransformedNormal = -transformedNormal;\n#endif',
        );
      };
      const variantKey = originalKey.call(material) + ':signal-exact-r149';
      const key = () => variantKey;
      const order = records.map((record) => record.index);
      prepareSignals.push((camera) => {
        // Use the renderer's per-camera culling test before preparing its matrix attributes.
        if (prepareVisibleSignals && batch.frustumCulled && !signalFrustum.intersectsObject(batch))
          return;
        for (const record of records) {
          world.multiplyMatrices(record.head.matrixWorld, record.local);
          record.view.multiplyMatrices(camera.matrixWorldInverse, world);
          record.depth = position.setFromMatrixPosition(world).applyMatrix4(projectionView).z;
        }
        records.sort((a, b) => a.depth - b.depth || a.id - b.id);
        let reordered = false;
        records.forEach((record, i) => {
          if (record.index !== order[i]) reordered = true;
          order[i] = record.index;
          batch.setMatrixAt(i, record.instance);
          normal.getNormalMatrix(record.view);
          record.view.toArray(modelView.array, i * 16);
          normal.toArray(normalView.array, i * 9);
        });
        if (reordered) {
          batch.instanceMatrix.needsUpdate = true;
          culling.register(batch);
        }
        modelView.needsUpdate = normalView.needsUpdate = true;
      });
      batch.onBeforeRender = () => {
        // Reuse the original material identity and opaque sort order. Programs
        // have separate cache keys; ordinary meshes keep their original shader.
        material.onBeforeCompile = compile;
        material.customProgramCacheKey = key;
        material.needsUpdate = true;
      };
      batch.onAfterRender = () => {
        material.onBeforeCompile = originalCompile;
        material.customProgramCacheKey = originalKey;
        material.needsUpdate = true;
      };
    }
    scene.add(culling.register(batch));
  }
  housingBatches.clear();
  if (lampGeometry) {
    for (const material of [...signalMaterials, signalOff]) {
      const originalCompile = material.onBeforeCompile;
      const variantKey = material.customProgramCacheKey() + ':signal-lamp-exact-r149';
      // These four private materials are used only by lamps, so one stable hook
      // preserves their identity/sort order without swapping programs per draw.
      material.onBeforeCompile = function (shader, renderer): void {
        originalCompile.call(this, shader, renderer);
        shader.vertexShader = 'attribute mat4 signalLampModelView;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <project_vertex>',
          'vec4 mvPosition = signalLampModelView * vec4(transformed, 1.0);\ngl_Position = projectionMatrix * mvPosition;',
        );
      };
      material.customProgramCacheKey = () => variantKey;
    }
    for (const records of lampGroups.values())
      for (const material of [...signalMaterials, signalOff]) {
        const geometry = lampGeometry.clone();
        const modelView = new T.InstancedBufferAttribute(new Float32Array(records.length * 16), 16);
        modelView.setUsage(T.DynamicDrawUsage);
        geometry.setAttribute('signalLampModelView', modelView);
        const batch = new T.InstancedMesh(geometry, material, records.length);
        batch.instanceMatrix.setUsage(T.DynamicDrawUsage);
        let members: TrafficLampRecord[] = [];
        let prepared = false;
        const lastCamera = new T.Matrix4(),
          lastProjection = new T.Matrix4(),
          lastWorld = new T.Matrix4(),
          world = new T.Matrix4(),
          position = new T.Vector3();
        synchronizeLamps.push(() => {
          const next = records.filter((record) => record.lamp.material === material);
          if (next.length === members.length && next.every((record) => members.includes(record)))
            return;
          members = next;
          batch.count = members.length;
          batch.visible = members.length > 0;
          members.forEach((record, i) => batch.setMatrixAt(i, record.instance));
          batch.instanceMatrix.needsUpdate = true;
          culling.register(batch);
          prepared = false;
        });
        batch.count = 0;
        batch.visible = false;
        prepareSignals.push((camera) => {
          if (!batch.visible) return;
          if (
            prepareVisibleSignals &&
            batch.frustumCulled &&
            !signalFrustum.intersectsObject(batch)
          )
            return;
          if (
            prepared &&
            lastCamera.equals(camera.matrixWorldInverse) &&
            lastProjection.equals(camera.projectionMatrix) &&
            lastWorld.equals(scene.matrixWorld)
          )
            return;
          for (const record of members) {
            world.multiplyMatrices(record.head.matrixWorld, record.local);
            record.view.multiplyMatrices(camera.matrixWorldInverse, world);
            record.depth = position.setFromMatrixPosition(world).applyMatrix4(projectionView).z;
          }
          members.sort((a, b) => a.depth - b.depth || a.id - b.id);
          members.forEach((record, i) => record.view.toArray(modelView.array, i * 16));
          modelView.needsUpdate = true;
          lastCamera.copy(camera.matrixWorldInverse);
          lastProjection.copy(camera.projectionMatrix);
          lastWorld.copy(scene.matrixWorld);
          prepared = true;
        });
        scene.add(batch);
      }
    lampGroups.clear();
  }
  if (prepareSignals.length) {
    const original = scene.onBeforeRender;
    scene.onBeforeRender = function (
      this: ThreeSceneHandle,
      renderer: ThreeRendererHandle,
      renderedScene: ThreeSceneHandle,
      camera: ThreeRenderCameraHandle,
      ...args: [renderTarget?: ThreeRenderTargetHandle | null]
    ): void {
      original.call(this, renderer, renderedScene, camera, ...args);
      projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      if (prepareVisibleSignals) signalFrustum.setFromProjectionMatrix(projectionView);
      for (const prepare of prepareSignals) prepare(camera);
    };
  }

  function updateSignals(): void {
    let changed = false;
    for (const head of signalHeads) {
      const phase = signalPhase(head.x, head.z, head.horizontal),
        active = phase === 'red' ? 0 : phase === 'amber' ? 1 : 2;
      if (head.active === active) continue;
      head.active = active;
      changed = true;
      head.lamps.forEach((lamp, i) => {
        lamp.material = i === active ? signalMaterials[i] : signalOff;
      });
    }
    if (changed) for (const synchronize of synchronizeLamps) synchronize();
  }

  const meshes = new Map<number, TrafficCar>();
  let appliedVersion = -1;

  function synchronize(): void {
    if (appliedVersion === getTrafficVersion()) return;
    const ids = new Set(traffic.map((vehicle) => vehicle.id));
    const errors: unknown[] = [];
    for (const [id, mesh] of meshes) {
      if (ids.has(id)) continue;
      meshes.delete(id);
      try {
        disposeTrafficCar(mesh);
      } catch (error) {
        errors.push(error);
      }
    }
    for (const vehicle of [...traffic]) {
      if (meshes.has(vehicle.id)) continue;
      try {
        meshes.set(vehicle.id, createTrafficCar(vehicle.color, vehicle.variant));
      } catch (error) {
        // The factory rolls back its own allocations; remove the unrenderable source too.
        removeVehicle(vehicle.id);
        errors.push(error);
      }
    }
    appliedVersion = getTrafficVersion();
    if (errors.length) {
      traffic.forEach(placeTraffic);
      throw new AggregateError(errors, 'Traffic model synchronization failed');
    }
  }

  function placeTraffic(t: TrafficVehicle): void {
    const mesh = meshes.get(t.id)!;
    mesh.position.set(
      t.horizontal ? t.pos : t.road + t.lane,
      0.08,
      t.horizontal ? t.road + t.lane : t.pos,
    );
    mesh.rotation.y = -t.heading;
  }

  try {
    synchronize();
  } catch (error) {
    const errors = [error];
    for (const mesh of meshes.values()) {
      try {
        disposeTrafficCar(mesh);
      } catch (cleanupError) {
        errors.push(cleanupError);
      }
    }
    meshes.clear();
    throw new AggregateError(errors, 'Initial traffic model construction failed', { cause: error });
  }
  traffic.forEach(placeTraffic);

  updateSignals();

  function update(dt: number): void {
    synchronize();
    updateSignals();
    for (const vehicle of traffic) {
      placeTraffic(vehicle);
      const mesh = meshes.get(vehicle.id)!;
      const distance = getGraphics().distance;
      mesh.visible = camera.position.distanceToSquared(mesh.position) < distance * distance;
      if (mesh.visible) animateVehicle(mesh, vehicle.speed, 0, vehicle.braking, dt);
    }
  }
  return Object.freeze({
    update,
    get version() {
      return appliedVersion;
    },
  });
};
