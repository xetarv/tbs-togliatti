'use strict';

window.TBS.createMissionMarkers = function ({ state, target, T, sprite, signTexture, scene }) {
  const beacon = new T.Group();

  const beaconColumn = new T.Mesh(
    new T.CylinderGeometry(1.25, 2.2, 9, 24, 1, true),
    new T.MeshBasicMaterial({
      color: 0xff680b,
      transparent: true,
      opacity: 0.15,
      side: T.DoubleSide,
      depthWrite: false,
    }),
  );

  beaconColumn.position.y = 4.5;

  beacon.add(beaconColumn);

  const ring = new T.Mesh(
    new T.TorusGeometry(3.7, 0.16, 8, 40),
    new T.MeshBasicMaterial({ color: 0xffb45f, transparent: true, opacity: 0.94 }),
  );

  ring.rotation.x = Math.PI / 2;

  ring.position.y = 0.22;

  beacon.add(ring);

  const gem = new T.Mesh(
    new T.OctahedronGeometry(1.35),
    new T.MeshBasicMaterial({ color: 0xff681c }),
  );

  gem.position.y = 8.9;

  beacon.add(gem);

  const beaconLabel = sprite(beacon, signTexture('ТБС', 'ТОЧКА МАРШРУТА'), 0, 12, 0, 8.5, 2.1);

  const beaconLight = new T.PointLight(0xff7529, 1.45, 15, 2);

  beaconLight.position.y = 3.4;

  beacon.add(beaconLight);

  scene.add(beacon);

  const pickupRing = new T.Mesh(
    new T.TorusGeometry(2.2, 0.12, 8, 40),
    new T.MeshBasicMaterial({ color: 0x5dfff1, transparent: true, opacity: 0 }),
  );

  pickupRing.rotation.x = Math.PI / 2;

  scene.add(pickupRing);
  function updateMarkers(animationDt) {
    beacon.position.set(target().x, 0.1, target().z);
    ring.scale.setScalar(1 + Math.sin(state.elapsed * 3) * 0.1);
    gem.rotation.y = state.elapsed * 1.5;
    gem.position.y = 8.9 + Math.sin(state.elapsed * 3) * 0.45;
    beaconColumn.material.opacity = 0.12 + Math.sin(state.elapsed * 3) * 0.035;
    beaconLabel.position.y = 12 + Math.sin(state.elapsed * 2) * 0.25;
    if (state.launchEffect > 0) {
      state.launchEffect = Math.max(0, state.launchEffect - animationDt);
      pickupRing.material.opacity = state.launchEffect / 1.3;
      pickupRing.scale.setScalar(1 + (1.3 - state.launchEffect) * 3);
      pickupRing.visible = true;
    } else pickupRing.visible = false;
  }
  function launch(point) {
    state.launchEffect = 1.3;
    pickupRing.position.set(point.x, 0.45, point.z);
  }
  return { launch, updateMarkers };
};
