'use strict';

window.TBS.createWorldResources = function (options) {
  const { T, renderer, createVisualAssets, embeddedAssets, vegetationCulling } = options;
  const mat = (color, metalness = 0, roughness = 0.8, emissive = 0x000000) =>
    new T.MeshStandardMaterial({ color, metalness, roughness, emissive, envMapIntensity: 0.45 });
  const dark = mat(0x142733, 0.22, 0.72),
    roadMat = mat(0x192b34, 0.08, 0.93),
    curbMat = mat(0x31505a, 0.08, 0.83),
    cyanMat = mat(0x47e6e0, 0.12, 0.27, 0x148c8b),
    orangeMat = mat(0xff4808, 0.2, 0.34, 0xa32c0c),
    whiteMat = mat(0xdcebf0, 0.24, 0.42),
    glassMat = mat(0x16445d, 0.68, 0.18, 0x071a28),
    tireMat = mat(0x101820, 0.08, 0.95),
    laneMat = new T.MeshBasicMaterial({ color: 0xaabac0 }),
    grassMat = mat(0x173730),
    roofMat = mat(0x203945, 0.12, 0.76);
  const trimMat = mat(0x5d7e87, 0.48, 0.35);
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const unitPlane = new T.PlaneGeometry(1, 1);
  function box(parent, x, y, z, w, h, d, material) {
    const o = new T.Mesh(unitBox, material);
    o.position.set(x, y, z);
    o.scale.set(w, h, d);
    parent.add(o);
    return o;
  }
  function flat(parent, x, y, z, w, d, material) {
    if (material.userData.paving) material = pavingSurface(w, d);
    const o = new T.Mesh(unitPlane, material);
    o.rotation.x = -Math.PI / 2;
    o.position.set(x, y, z);
    o.scale.set(w, d, 1);
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function makeTexture(draw, w = 256, h = 256) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const visualAssets = createVisualAssets(T, renderer, vegetationCulling);
  function roadSurface(w, d) {
    return visualAssets.material('asphalt', w, d);
  }
  const waterTexture = makeTexture(
    (p, w, h) => {
      p.fillStyle = '#7595a1';
      p.fillRect(0, 0, w, h);
      for (let i = 0; i < 95; i++) {
        const y = i * 1.37;
        p.strokeStyle = i % 3 === 0 ? '#c2d9dc28' : '#405e6e25';
        p.lineWidth = 1;
        p.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const wave = y + Math.sin(x * 0.07 + i * 0.55) * 0.8;
          x ? p.lineTo(x, wave) : p.moveTo(x, wave);
        }
        p.stroke();
      }
    },
    512,
    128,
  );
  waterTexture.repeat.set(7, 1);
  function imageTexture(file) {
    const source = embeddedAssets[file] || 'assets/' + file;
    const tex = new T.TextureLoader().load(source, (t) => {
      for (const callback of t.userData.onReady || []) callback();
      t.userData.onReady = [];
    });
    tex.userData.onReady = [];
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }
  const markTexture = imageTexture('cropped-fav-tb_drone-192x192.png');
  const droneTexture = imageTexture('home-sec3-img__1-768x597.webp');
  const factoryTexture = imageTexture('tb-samara-hero-vid-poster.webp');
  const hangarTexture = imageTexture('tb-samara-mission-big-img.webp');
  const pavingTexture = makeTexture((p, w, h) => {
    p.fillStyle = '#b8b9b2';
    p.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32)
      for (let x = -64; x < w; x += 64) {
        const offset = ((y / 32) % 2) * 32,
          shade = 166 + (((x / 64) * 7 + (y / 32) * 3 + 99) % 7) * 5;
        p.fillStyle = 'rgb(' + shade + ',' + (shade + 3) + ',' + (shade - 2) + ')';
        p.fillRect(x + offset + 2, y + 2, 60, 28);
        p.fillStyle = '#ffffff30';
        p.fillRect(x + offset + 2, y + 2, 60, 1);
      }
  });
  pavingTexture.repeat.set(4, 4);
  const pavingMat = new T.MeshStandardMaterial({
    map: pavingTexture,
    color: 0xb7bec0,
    roughness: 0.92,
  });
  pavingMat.userData.paving = true;
  const pavingSurfaces = new Map();
  function pavingSurface(w, d) {
    const key = w.toFixed(2) + ':' + d.toFixed(2);
    if (pavingSurfaces.has(key)) return pavingSurfaces.get(key);
    const texture = pavingTexture.clone();
    texture.repeat.set(w / 8, d / 8);
    texture.needsUpdate = true;
    const material = new T.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.025,
      color: 0xb7bec0,
      roughness: 0.92,
    });
    pavingSurfaces.set(key, material);
    return material;
  }
  const glowTexture = makeTexture(
    (p, w, h) => {
      const g = p.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(126,255,237,.85)');
      g.addColorStop(0.24, 'rgba(80,220,231,.38)');
      g.addColorStop(1, 'rgba(80,220,231,0)');
      p.fillStyle = g;
      p.fillRect(0, 0, w, h);
    },
    128,
    128,
  );
  glowTexture.wrapS = glowTexture.wrapT = T.ClampToEdgeWrapping;
  const crosswalkMat = new T.MeshBasicMaterial({
    color: 0x9bb9bc,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const mooredBoats = [],
    waterfrontTerraces = [];
  const fountainJets = [];
  const resources = {
    dark,
    cyanMat,
    orangeMat,
    whiteMat,
    box,
    mat,
    curbMat,
    glassMat,
    laneMat,
    grassMat,
    roofMat,
    trimMat,
    flat,
    roadSurface,
    markTexture,
    pavingMat,
    crosswalkMat,
    makeTexture,
    glowTexture,
    mooredBoats,
    waterfrontTerraces,
    unitPlane,
    visualAssets,
    fountainJets,
    droneTexture,
    factoryTexture,
    hangarTexture,
    roadMat,
    unitBox,
    tireMat,
    waterTexture,
  };
  Object.assign(resources, window.TBS.createWorldSigns({ ...options, ...resources }));
  Object.assign(resources, window.TBS.createFacadeResources({ ...options, ...resources }));
  Object.assign(resources, window.TBS.createLandscapeResources({ ...options, ...resources }));
  Object.assign(resources, window.TBS.createStreetFixtures({ ...options, ...resources }));
  return resources;
};
