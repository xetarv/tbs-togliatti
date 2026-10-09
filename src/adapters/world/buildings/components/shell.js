'use strict';
window.TBS.buildBuildingShell = function ({
  parent,
  kind,
  w,
  seed,
  buildingColors,
  reflectionBuildings,
  x,
  z,
  d,
  h,
  mat,
  masonryTextures,
  box,
  scene,
  roofMat,
  trimMat,
  dark,
  facade,
}) {
  const style = kind || (w < 12 ? (seed % 3 === 0 ? 'office' : 'residential') : 'campus');
  const color =
    style === 'residential'
      ? [0xa09a86, 0xb8ad94, 0x87989a][seed % 3]
      : style === 'factory'
        ? 0x70818b
        : buildingColors[seed % buildingColors.length];
  reflectionBuildings.push({ x, z, w, d, h, seed, color });
  const body = mat(color, style === 'residential' ? 0.06 : 0.25, 0.58);
  if (style === 'residential') {
    const masonry = masonryTextures[seed % 3].clone();
    masonry.repeat.set(Math.max(1, w / 5), Math.max(1, h / 5));
    masonry.needsUpdate = true;
    body.map = masonry;
    body.bumpMap = masonry;
    body.bumpScale = 0.035;
    body.roughness = 0.87;
  }
  const main = box(parent, x, h / 2, z, w, h, d, body);
  main.castShadow = true;
  main.receiveShadow = true;
  const regionalMaterials = x < 240 && z < 200 ? scene.userData.quarterMaterials : null;
  box(
    parent,
    x,
    0.47,
    z,
    w + 0.6,
    0.68,
    d + 0.6,
    regionalMaterials ? regionalMaterials.brick : roofMat,
  );
  box(parent, x, h + 0.16, z, w + 0.32, 0.32, d + 0.32, trimMat);
  box(parent, x, h + 0.42, z, Math.max(2, w * 0.24), 0.54, Math.max(2, d * 0.28), dark);
  box(
    parent,
    x - w * 0.24,
    h + 0.6,
    z + d * 0.17,
    Math.max(1.3, w * 0.19),
    0.85,
    Math.max(1.3, d * 0.21),
    roofMat,
  );
  box(
    parent,
    x + w * 0.24,
    h + 0.47,
    z - d * 0.12,
    Math.max(1.2, w * 0.17),
    0.42,
    Math.max(1.2, d * 0.18),
    dark,
  );
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      box(parent, x + sx * (w / 2 - 0.24), h / 2, z + sz * (d / 2 - 0.24), 0.24, h, 0.24, trimMat);
  if (seed % 3 === 0 && style !== 'factory') {
    const crown = box(parent, x, h + 1.15, z, w * 0.56, 1.5, d * 0.5, body);
    crown.castShadow = true;
    box(parent, x, h + 1.96, z, w * 0.6, 0.17, d * 0.54, trimMat);
  }
  facade(parent, x, h / 2 + 0.3, z + d / 2 + 0.025, w - 0.55, h - 1.1, 0, seed, style);
  facade(parent, x, h / 2 + 0.3, z - d / 2 - 0.025, w - 0.55, h - 1.1, Math.PI, seed, style);
  facade(parent, x + w / 2 + 0.025, h / 2 + 0.3, z, d - 0.55, h - 1.1, Math.PI / 2, seed, style);
  facade(parent, x - w / 2 - 0.025, h / 2 + 0.3, z, d - 0.55, h - 1.1, -Math.PI / 2, seed, style);
  return { style, body };
};
