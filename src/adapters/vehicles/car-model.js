'use strict';
window.TBS.createCarModels = function ({
  T,
  box,
  dark,
  mat,
  cyanMat,
  detailBar,
  orangeMat,
  whiteMat,
  markTexture,
  makeTexture,
  trimMat,
  signTexture,
  createFastback,
  meshData,
  scene,
  wedge,
  tireMat,
  unitBox,
}) {
  const { coachwork, glazedQuad } = window.TBS.createTrafficCarGeometry({ T });
  const { createPassengerShell } = window.TBS.createPassengerBodyBuilder({
    T,
    box,
    dark,
    mat,
    coachwork,
    cyanMat,
    glazedQuad,
    detailBar,
    orangeMat,
    whiteMat,
    markTexture,
    makeTexture,
  });
  const { createCommercialBody } = window.TBS.createCommercialBodyBuilder({
    T,
    mat,
    box,
    dark,
    coachwork,
    glazedQuad,
    detailBar,
    orangeMat,
    trimMat,
    markTexture,
    signTexture,
  });
  const vehicleShadowTexture = makeTexture(
    (c, w, h) => {
      const gradient = c.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, w * 0.5);
      gradient.addColorStop(0, 'rgba(0,0,0,.75)');
      gradient.addColorStop(0.55, 'rgba(0,0,0,.48)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gradient;
      c.fillRect(0, 0, w, h);
    },
    128,
    128,
  );
  function createHeroCar() {
    return createFastback({
      meshData,
      T,
      scene,
      logo: markTexture,
      makeTexture,
      shadowTexture: vehicleShadowTexture,
    });
  }
  function createTrafficCar(color, variant = 'sedan') {
    const group = new T.Group();
    const body = new T.MeshPhysicalMaterial({
      color,
      metalness: 0.65,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.3,
    });

    const passenger = variant !== 'van' && variant !== 'shuttle';
    if (passenger) createPassengerShell(group, body, variant);
    else {
      coachwork(group, 2.65, 5.15, 0.63, 0.65, body);
      wedge(group, 2.76, -2.82, -1.1, 0.67, 1.02, 1.61, body);
      wedge(group, 2.76, 1.05, 2.78, 0.67, 1.63, 1.04, body);
      box(group, 0, 0.55, 0, 2.33, 0.22, 4.98, dark);
    }
    if (!passenger) createCommercialBody(group, body, variant);
    if (!passenger) {
      box(group, 0, 1.11, -2.82, 2.38, 0.22, 0.1, dark);
      box(group, 0, 1.01, 2.81, 2.35, 0.22, 0.1, dark);
    } else box(group, 0, 0.78, -2.875, 1.3, 0.13, 0.045, dark);
    const { wheels } = window.TBS.buildTrafficCarWheels({
      T,
      group,
      tireMat,
      trimMat,
      body,
      box,
      whiteMat,
    });

    const { brakeMaterial, reverseMaterial } = window.TBS.buildTrafficCarLights({
      T,
      passenger,
      box,
      group,
      cyanMat,
      orangeMat,
    });

    const { shadow } = window.TBS.buildTrafficCarShadow({ T, vehicleShadowTexture, group });

    group.userData.wheels = wheels;
    group.userData.brakeMaterial = brakeMaterial;
    group.userData.reverseMaterial = reverseMaterial;
    window.TBS.buildTrafficCarSuspension({ T, group, shadow, wheels, unitBox });

    group.userData.variant = variant;
    group.userData.paint = body;
    const scale = variant === 'compact' ? 0.9 : 1;
    group.scale.setScalar(scale);
    if (variant === 'compact') {
      group.scale.z *= 0.87;
      group.scale.y *= 1.06;
    }
    group.userData.wheelRadius = 0.5 * scale;
    scene.add(group);
    return group;
  }
  function animateVehicle(mesh, speed, steer, braking, dt) {
    if (mesh.userData.steeringWheel) mesh.userData.steeringWheel.rotation.z = -steer * 0.65;
    for (const wheel of mesh.userData.wheels) {
      wheel.rolling.rotation.x =
        (wheel.rolling.rotation.x - (speed * dt) / mesh.userData.wheelRadius) % (Math.PI * 2);
      const angle = wheel.front ? -steer * 0.38 : 0;
      wheel.steering.rotation.y += (angle - wheel.steering.rotation.y) * (1 - Math.exp(-dt * 12));
    }
    mesh.userData.brakeMaterial.color.setHex(braking ? 0xff3822 : 0x8c160d);
    mesh.userData.reverseMaterial.color.setHex(speed < -0.2 ? 0xe8f5ff : 0x29313b);
  }
  return { createHeroCar, createTrafficCar, animateVehicle };
};
