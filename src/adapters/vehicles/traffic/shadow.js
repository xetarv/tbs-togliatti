'use strict';
window.TBS.buildTrafficCarShadow = function ({ T, vehicleShadowTexture, group }) {
  const shadow = new T.Mesh(
    new T.CircleGeometry(2.35, 24),
    new T.MeshBasicMaterial({
      map: vehicleShadowTexture,
      color: 0x02090d,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1, 1.52, 1);
  shadow.position.y = 0.12;
  group.add(shadow);
  return { shadow };
};
