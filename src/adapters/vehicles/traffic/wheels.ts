'use strict';
window.TBS.buildTrafficCarWheels = function ({
  T,
  group,
  tireMat,
  trimMat,
  body,
  box,
  whiteMat,
}: Parameters<TbsRegistry['buildTrafficCarWheels']>[0]): ReturnType<
  TbsRegistry['buildTrafficCarWheels']
> {
  const wheels: FastbackWheel[] = [];
  // These immutable geometries belong to this car, shared only by its four wheels.
  const tireGeometry = new T.CylinderGeometry(0.5, 0.5, 0.34, 18);
  const hubGeometry = new T.CylinderGeometry(0.27, 0.27, 0.36, 16);
  const fenderGeometry = new T.TorusGeometry(0.58, 0.085, 8, 24, Math.PI);
  const rimGeometry = new T.TorusGeometry(0.34, 0.04, 8, 24);
  for (const side of [-1, 1])
    for (const z of [-1.75, 1.75]) {
      const steering = new T.Group(),
        rolling = new T.Group();
      steering.position.set(side * 1.45, 0.52, z);
      group.add(steering);
      steering.add(rolling);
      const mount = (mesh: ThreePositionedObjectHandle) => {
        mesh.position.sub(steering.position);
        rolling.add(mesh);
      };

      const wheel = new T.Mesh(tireGeometry, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.45, 0.52, z);
      wheel.castShadow = true;
      mount(wheel);
      wheels.push({ steering, rolling, front: z < 0 });
      const hub = new T.Mesh(hubGeometry, trimMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(side * 1.46, 0.52, z);
      group.add(hub);
      mount(hub);
      const fender = new T.Mesh(fenderGeometry, body);
      fender.rotation.y = Math.PI / 2;
      fender.position.set(side * 1.43, 0.52, z);
      group.add(fender);
      const rim = new T.Mesh(rimGeometry, trimMat);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(side * 1.65, 0.52, z);
      group.add(rim);
      mount(rim);

      for (let spoke = 0; spoke < 5; spoke++) {
        const spokeMesh = box(group, side * 1.65, 0.52, z, 0.035, 0.065, 0.6, whiteMat);
        spokeMesh.rotation.x = (spoke * Math.PI) / 5;
        mount(spokeMesh);
      }
    }
  return { wheels };
};
