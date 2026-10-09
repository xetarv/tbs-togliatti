'use strict';

window.TBS.createFacadeResources = function ({
  makeTexture,
  T,
  scene,
  box,
  dark,
  trimMat,
  unitPlane,
  roofMat,
}) {
  const facadeMaterials = Array.from({ length: 6 }, (_, seed) => {
    const texture = makeTexture(
      (p, w, h) => {
        p.fillStyle = ['#73818a', '#495967', '#a5aaa6', '#596b75', '#879798', '#647485'][seed];
        p.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 128)
          for (let x = 0; x < w; x += 128) {
            p.fillStyle = '#182d3c';
            p.fillRect(x + 15, y + 17, 98, 89);
            const n = ((x / 128) * 17 + (y / 128) * 31 + seed * 13) % 11;
            const g = p.createLinearGradient(x, y, x + 98, y + 89);
            g.addColorStop(0, n < 2 ? '#c7ab78' : '#708f9d');
            g.addColorStop(0.5, n < 2 ? '#a78758' : '#3d606f');
            g.addColorStop(1, '#1d394b');
            p.fillStyle = g;
            p.fillRect(x + 19, y + 21, 90, 81);
            p.fillStyle = '#b8c9cc80';
            p.fillRect(x + 19, y + 21, 90, 2);
            p.fillStyle = '#243d48';
            p.fillRect(x + 61, y + 21, 3, 81);
            p.fillStyle = '#192a3470';
            p.fillRect(x + 19, y + 67, 90, 2);
            p.fillStyle = '#142b3b55';
            p.fillRect(x + 19, y + 21, 90, 10 + n * 2);
            p.fillStyle = '#192a3440';
            p.fillRect(x, y + 122, 128, 6);
            p.fillStyle = '#ffffff20';
            p.fillRect(x, y + 120, 128, 2);
          }
      },
      512,
      512,
    );
    return texture;
  });
  const nightWindows = [];
  const windowGlow = makeTexture(
    (p, w, h) => {
      p.fillStyle = '#000000';
      p.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 128)
        for (let x = 0; x < w; x += 128)
          if ((x / 128 + (y / 128) * 3) % 3 !== 0) {
            p.fillStyle = (x + y) % 256 === 0 ? '#ffe0a6' : '#a6d9ff';
            p.fillRect(x + 19, y + 31, 90, 71);
            p.fillStyle = '#000000';
            p.fillRect(x + 61, y + 31, 3, 71);
            p.fillRect(x + 19, y + 67, 90, 3);
          }
    },
    512,
    512,
  );
  const districtFacadeTextures = new Map();
  const facadeRelief = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#c8c8c8';
      c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 128)
        for (let x = 0; x < w; x += 128) {
          c.fillStyle = '#747474';
          c.fillRect(x + 14, y + 16, 100, 92);
          c.fillStyle = '#555555';
          c.fillRect(x + 19, y + 21, 90, 81);
          c.fillStyle = '#aaaaaa';
          c.fillRect(x + 61, y + 21, 3, 81);
          c.fillRect(x + 19, y + 67, 90, 2);
        }
    },
    512,
    512,
  );
  facadeRelief.encoding = T.LinearEncoding;
  const facadeRoughness = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#eeeeee';
      c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 128)
        for (let x = 0; x < w; x += 128) {
          c.fillStyle = '#484848';
          c.fillRect(x + 19, y + 21, 90, 81);
          c.fillStyle = '#bbbbbb';
          c.fillRect(x + 61, y + 21, 3, 81);
          c.fillRect(x + 19, y + 67, 90, 2);
        }
    },
    512,
    512,
  );
  facadeRoughness.encoding = T.LinearEncoding;
  function facade(parent, x, y, z, width, height, angle, seed, style = 'office') {
    const upgraded = x < 240 && z < 200 && scene.userData.quarterMaterials;
    let source = facadeMaterials[seed % 6];
    if (upgraded) {
      const key = style + ':' + (seed % 6);
      if (!districtFacadeTextures.has(key))
        districtFacadeTextures.set(
          key,
          makeTexture(
            (c, w, h) => {
              const surface =
                style === 'residential'
                  ? masonryTextures[seed % 3]
                  : scene.userData.quarterMaterials.stone.map;
              c.drawImage(surface.image, 0, 0, w, h);
              for (let y = 0; y < h; y += 128)
                for (let x = 0; x < w; x += 128) {
                  c.drawImage(source.image, x + 15, y + 17, 98, 89, x + 15, y + 17, 98, 89);
                  c.fillStyle = '#403b3024';
                  c.fillRect(x + 13, y + 107, 104, 5);
                  c.fillStyle = '#e8e3cd60';
                  c.fillRect(x + 12, y + 104, 106, 2);
                }
            },
            512,
            512,
          ),
        );
      source = districtFacadeTextures.get(key);
    }
    const tex = source.clone();
    tex.repeat.set(
      Math.max(1, Math.round(width / 2.8)) / 4,
      Math.max(1, Math.round(height / 2.8)) / 4,
    );
    tex.needsUpdate = true;
    const glow = windowGlow.clone();
    glow.repeat.copy(tex.repeat);
    glow.needsUpdate = true;
    const material = new T.MeshStandardMaterial({
      map: tex,
      metalness: 0.32,
      roughness: 0.38,
      envMapIntensity: 0.7,
      emissive: 0xffffff,
      emissiveMap: glow,
      emissiveIntensity: 0,
    });
    nightWindows.push(material);
    if (upgraded) {
      material.bumpMap = facadeRelief.clone();
      material.roughnessMap = facadeRoughness.clone();
      for (const map of [material.bumpMap, material.roughnessMap]) {
        map.repeat.copy(tex.repeat);
        map.needsUpdate = true;
      }
      material.bumpScale = 0.045;
      material.roughness = 0.9;
      material.metalness = 0.08;
      material.envMapIntensity = 0.65;
      scene.userData.upgradedFacades = (scene.userData.upgradedFacades || 0) + 1;
    }
    const surface = new T.Mesh(new T.PlaneGeometry(width, height), material);
    surface.position.set(x, y, z);
    surface.rotation.y = angle;
    surface.receiveShadow = true;
    parent.add(surface);
  }
  const photoPanels = [];
  function architecturalPanel(parent, x, y, z, width, height, angle, photo, _title, _subtitle) {
    const panel = new T.Group();
    panel.position.set(x, y, z);
    panel.rotation.y = angle;
    parent.add(panel);
    const frame = box(panel, 0, 0, 0, 1, 1, 0.24, dark);
    const rim = box(panel, 0, 0, 0.13, 1, 1, 0.06, trimMat);
    const face = new T.Mesh(unitPlane, new T.MeshBasicMaterial({ map: photo, toneMapped: false }));
    face.position.z = 0.17;
    panel.add(face);
    const hood = box(panel, 0, 0, 0.22, 1, 0.1, 0.65, roofMat);
    hood.castShadow = true;
    function fit() {
      const img = photo.image;
      if (!img?.naturalWidth) return;
      const ratio = img.naturalWidth / img.naturalHeight;
      const pw = Math.min(width, height * ratio),
        ph = pw / ratio;
      face.scale.set(pw, ph, 1);
      frame.scale.set(pw + 0.32, ph + 0.32, 0.24);
      rim.scale.set(pw + 0.1, ph + 0.1, 0.06);
      hood.position.y = ph / 2 + 0.23;
      hood.scale.x = pw + 0.65;
      panel.userData = { sourceAspect: ratio, displayAspect: pw / ph };
    }
    if (photo.image?.complete) fit();
    else photo.userData.onReady.push(fit);
    photoPanels.push(panel);
    return panel;
  }
  const buildingColors = [0x213b4a, 0x294253, 0x1a3545, 0x344754, 0x1d414b];
  const masonryTextures = ['#baaa90', '#a06e57', '#9ba7a7'].map((base) =>
    makeTexture(
      (p, w, h) => {
        p.fillStyle = '#535b58';
        p.fillRect(0, 0, w, h);
        for (let row = 0; row < 16; row++)
          for (let col = -1; col < 9; col++) {
            const x = col * 64 + (row % 2) * 32,
              y = row * 32;
            p.fillStyle = base;
            p.fillRect(x + 1, y + 1, 62, 30);
            p.fillStyle = 'rgba(255,245,220,' + ((row * 7 + col * 3 + 40) % 7) * 0.012 + ')';
            p.fillRect(x + 2, y + 2, 60, 28);
            p.fillStyle = '#ffffff18';
            p.fillRect(x + 2, y + 2, 60, 1);
          }
      },
      512,
      512,
    ),
  );
  return {
    facadeMaterials,
    nightWindows,
    facade,
    architecturalPanel,
    buildingColors,
    masonryTextures,
  };
};
