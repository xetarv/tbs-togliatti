'use strict';

window.TBS.createPlayerCar = function ({
  state,
  keys,
  clamp,
  animateVehicle,
  getGraphics,
  createTrafficCar,
  createHeroCar,
  parkedCars,
  T,
  unitPlane,
  scene,
  player,
}) {
  const car = createHeroCar();

  for (const parked of parkedCars) {
    parked.mesh = createTrafficCar(
      [0xcbd7da, 0x427d91, 0xdda15f, 0x63716a][parked.seed % 4],
      parked.seed % 3 === 0 ? 'van' : 'sedan',
    );
    parked.mesh.position.set(parked.x, 0.12, parked.z);
    parked.mesh.rotation.y = -parked.a;
  }

  const skidCapacity = 320,
    skidTransform = new T.Object3D();

  const skidMarks = new T.InstancedMesh(
    unitPlane,
    new T.MeshBasicMaterial({
      color: 0x11191c,
      transparent: true,
      opacity: 0.33,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    skidCapacity,
  );

  skidMarks.instanceMatrix.setUsage(T.DynamicDrawUsage);

  skidMarks.frustumCulled = false;

  skidMarks.count = 0;

  scene.add(skidMarks);

  let skidCursor = 0,
    previousSkid = null;

  function updateSkidMarks(active, braking, steer) {
    if (!active) return;
    const speed = Math.abs(player.speed);
    if (speed < 5 || (!braking && !(Math.abs(steer) > 0.5 && speed > 12))) {
      previousSkid = null;
      return;
    }
    const rear = {
      x: player.x - Math.sin(player.heading) * 1.75,
      z: player.z + Math.cos(player.heading) * 1.75,
      a: player.heading,
    };
    if (previousSkid) {
      const distance = Math.hypot(rear.x - previousSkid.x, rear.z - previousSkid.z);
      if (distance < 0.16) return;
      if (distance < 2)
        for (const side of [-1, 1]) {
          const ax = previousSkid.x + Math.cos(previousSkid.a) * side * 1.42,
            az = previousSkid.z + Math.sin(previousSkid.a) * side * 1.42;
          const bx = rear.x + Math.cos(rear.a) * side * 1.42,
            bz = rear.z + Math.sin(rear.a) * side * 1.42;
          skidTransform.position.set((ax + bx) / 2, 0.185, (az + bz) / 2);
          skidTransform.rotation.set(-Math.PI / 2, 0, Math.atan2(bx - ax, bz - az));
          skidTransform.scale.set(0.24, Math.hypot(bx - ax, bz - az) + 0.06, 1);
          skidTransform.updateMatrix();
          skidMarks.setMatrixAt(skidCursor, skidTransform.matrix);
          skidCursor = (skidCursor + 1) % skidCapacity;
          skidMarks.count = Math.min(skidCapacity, skidMarks.count + 1);
        }
      skidMarks.instanceMatrix.needsUpdate = true;
    }
    previousSkid = rear;
  }
  function updatePlayerCar(dt, previousSpeed) {
    car.position.set(player.x, 0.12, player.z);
    car.rotation.y = -player.heading;
    const active = state.mode === 'playing';
    const braking =
      active &&
      (keys.handbrake || (keys.down && player.speed >= 0) || (keys.up && player.speed < 0));
    updateSkidMarks(active, braking, (keys.right ? 1 : 0) - (keys.left ? 1 : 0));
    for (const parked of parkedCars)
      parked.mesh.visible =
        Math.hypot(parked.x - player.x, parked.z - player.z) < getGraphics().distance;
    animateVehicle(
      car,
      active ? player.speed : 0,
      active ? (keys.right ? 1 : 0) - (keys.left ? 1 : 0) : 0,
      braking,
      active ? dt : 0,
    );
    if (active) {
      const body = car.userData.body,
        steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
        smoothing = 1 - Math.exp(-dt * 8);
      const pitch = clamp(
        ((player.speed - previousSpeed) / Math.max(dt, 0.001)) * 0.0016,
        -0.045,
        0.045,
      );
      body.rotation.x += (pitch - body.rotation.x) * smoothing;
      body.rotation.z += (steer * player.speed * 0.002 - body.rotation.z) * smoothing;
      body.position.y =
        Math.sin(state.elapsed * 15) * Math.min(Math.abs(player.speed) * 0.0008, 0.018) +
        Math.sin(state.elapsed * 40) * state.impactAmount * 0.05;
      state.impactAmount *= Math.exp(-dt * 10);
    }

    return braking;
  }
  return { car, updatePlayerCar };
};
