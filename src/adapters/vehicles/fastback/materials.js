'use strict';

window.TBS.createFastbackMaterials = function ({ T }) {
  const paint = new T.MeshPhysicalMaterial({
    color: 0x87b5bf,
    metalness: 0.4,
    roughness: 0.27,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    envMapIntensity: 0.85,
    side: T.DoubleSide,
  });
  const roof = new T.MeshPhysicalMaterial({
    color: 0x17272d,
    metalness: 0.24,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.55,
    side: T.DoubleSide,
  });
  const glass = new T.MeshPhysicalMaterial({
    color: 0x829ba0,
    metalness: 0,
    roughness: 0.16,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: T.DoubleSide,
    envMapIntensity: 0.4,
  });
  const rubber = new T.MeshStandardMaterial({ color: 0x141919, roughness: 0.97 });
  const leather = new T.MeshStandardMaterial({ color: 0x303d40, roughness: 0.88 });
  const fabric = new T.MeshStandardMaterial({ color: 0x63706a, roughness: 1 });
  const alloy = new T.MeshStandardMaterial({ color: 0x9da7a5, metalness: 0.88, roughness: 0.25 });
  const graphite = new T.MeshStandardMaterial({
    color: 0x283134,
    metalness: 0.48,
    roughness: 0.46,
  });
  const rotorSteel = new T.MeshStandardMaterial({
    color: 0x505b5b,
    metalness: 0.7,
    roughness: 0.57,
  });
  const orange = new T.MeshStandardMaterial({ color: 0xff5b16, metalness: 0.16, roughness: 0.44 });
  const led = new T.MeshBasicMaterial({ color: 0xd0edf3, toneMapped: false });
  const brake = new T.MeshBasicMaterial({ color: 0x8c160d, toneMapped: false });
  const reverse = new T.MeshBasicMaterial({ color: 0x29313b, toneMapped: false });
  const stitch = new T.MeshStandardMaterial({ color: 0xa3aaa0, roughness: 0.95 });
  const optics = new T.MeshPhysicalMaterial({
    color: 0xd2e0e4,
    roughness: 0.07,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    clearcoat: 1,
  });
  const materials = { paint, roof, glass };
  return {
    paint,
    roof,
    glass,
    rubber,
    leather,
    fabric,
    alloy,
    graphite,
    rotorSteel,
    orange,
    led,
    brake,
    reverse,
    stitch,
    optics,
    materials,
  };
};
