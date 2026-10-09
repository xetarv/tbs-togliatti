'use strict';
window.TBS.createQuarterMaterials = function ({ makeTexture, visualAssets, mat, T, nightWindows }) {
  const stoneTexture = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#b4afa3';
      c.fillRect(0, 0, w, h);
      let seed = 149;
      for (let i = 0; i < 24000; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const px = seed % w;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        c.fillStyle = i % 2 ? '#eee8d21c' : '#514d421b';
        c.fillRect(px, seed % h, 1 + (i % 2), 1);
      }
      c.strokeStyle = '#716f6255';
      c.lineWidth = 2;
      for (let y = 0; y < h; y += 128) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
        for (let px = ((y / 128) % 2) * 128; px < w; px += 256) {
          c.beginPath();
          c.moveTo(px, y);
          c.lineTo(px, y + 128);
          c.stroke();
        }
      }
    },
    512,
    512,
  );
  stoneTexture.repeat.set(3, 2);
  const stone = visualAssets.material('stone', 12, 8).clone();
  const bronze = mat(0x705338, 0.66, 0.32),
    frame = mat(0x263b3f, 0.65, 0.35),
    plaster = mat(0xd3cfc0, 0, 0.9),
    wood = mat(0x95633e, 0, 0.87);
  const glazing = new T.MeshPhysicalMaterial({
    color: 0xa8c9cf,
    metalness: 0.14,
    roughness: 0.16,
    clearcoat: 1,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: T.DoubleSide,
  });
  function dataMap(draw, size = 256, rx = 1, ry = 1) {
    const map = makeTexture(draw, size, size);
    map.encoding = T.LinearEncoding;
    map.repeat.set(rx, ry);
    return map;
  }
  function grain(base, spread, seed) {
    return (c, w, h) => {
      c.fillStyle = `rgb(${base},${base},${base})`;
      c.fillRect(0, 0, w, h);
      for (let n = 0; n < w * h * 0.4; n++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const px = seed % w;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const v = base + (seed % spread) - spread / 2;
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(px, seed % h, 1, 1);
      }
    };
  }
  const stoneRelief = dataMap(
    (c, w, h) => {
      grain(210, 28, 421)(c, w, h);
      c.fillStyle = '#505050';
      for (let y = 0; y < h; y += 128) {
        c.fillRect(0, y, w, 3);
        for (let px = ((y / 128) % 2) * 128; px < w; px += 256) c.fillRect(px, y, 3, 128);
      }
    },
    512,
    3,
    2,
  );
  stone.bumpMap = stoneRelief;
  stone.bumpScale = 0.065;
  stone.roughnessMap = dataMap(grain(220, 32, 917), 256, 3, 2);
  stone.roughness = 0.98;
  plaster.bumpMap = dataMap(grain(160, 70, 238), 256, 4, 2);
  plaster.bumpScale = 0.018;
  plaster.roughnessMap = dataMap(grain(235, 24, 842));
  const brushed = dataMap((c, w, h) => {
    grain(170, 45, 93)(c, w, h);
    for (let y = 0; y < h; y += 3) {
      c.fillStyle = y % 2 ? '#999999' : '#cccccc';
      c.fillRect(0, y, w, 1);
    }
  }, 256);
  bronze.roughnessMap = brushed;
  bronze.roughness = 0.55;
  bronze.bumpMap = brushed;
  bronze.bumpScale = 0.002;
  bronze.envMapIntensity = 0.8;
  frame.roughnessMap = dataMap(grain(200, 55, 106));
  frame.roughness = 0.62;
  glazing.metalness = 0;
  glazing.ior = 1.5;
  glazing.roughness = 0.18;
  glazing.envMapIntensity = 0.55;
  glazing.opacity = 0.19;
  glazing.color.setHex(0xb4c8c5);
  glazing.roughnessMap = dataMap((c, w, h) => {
    c.fillStyle = '#999999';
    c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff70');
    g.addColorStop(0.25, '#ffffff00');
    g.addColorStop(0.85, '#ffffff00');
    g.addColorStop(1, '#ffffff90');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  const timber = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#9d7956';
      c.fillRect(0, 0, w, h);
      for (let n = 0; n < 150; n++) {
        c.strokeStyle = n % 3 ? '#3c291e25' : '#eed4a738';
        c.lineWidth = 1 + (n % 3) * 0.4;
        c.beginPath();
        for (let py = 0; py <= h; py += 8) {
          const px = ((n * 11) % w) + Math.sin(py * 0.035 + n) * 1.4;
          py ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
    },
    256,
    256,
  );
  wood.map = timber;
  wood.color.setHex(0xc7a984);
  wood.bumpMap = dataMap(grain(150, 35, 873));
  wood.bumpScale = 0.012;
  const brickColour = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#7c786d';
      c.fillRect(0, 0, w, h);
      for (let row = 0; row < 8; row++)
        for (let col = -1; col < 5; col++) {
          const shade = (row * 13 + col * 7 + 91) % 24;
          c.fillStyle = `rgb(${91 + shade},${79 + shade},${65 + shade})`;
          c.fillRect(col * 64 + (row % 2) * 32 + 2, row * 32 + 2, 60, 28);
        }
    },
    256,
    256,
  );
  brickColour.repeat.set(5, 1);
  const brick = visualAssets.material('brick', 20, 2);
  const pavingColour = makeTexture(
    (c, w, h) => {
      c.fillStyle = '#74786f';
      c.fillRect(0, 0, w, h);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 4; col++) {
          const v = 159 + ((row * 17 + col * 13) % 29);
          c.fillStyle = `rgb(${v + 8},${v + 4},${v - 5})`;
          c.fillRect(col * 64 + 2, row * 64 + 2, 60, 60);
          c.fillStyle = '#ebe3cd40';
          c.fillRect(col * 64 + 3, row * 64 + 3, 58, 1);
        }
    },
    256,
    256,
  );
  pavingColour.repeat.set(5, 4);
  const plazaPaving = visualAssets.material('paving', 10, 8);
  const roadRelief = dataMap(grain(130, 125, 321)),
    roadRoughness = dataMap(grain(225, 42, 532));
  const room = mat(0x66574a, 0, 0.95),
    warm = new T.MeshStandardMaterial({
      color: 0xf1d6a6,
      emissive: 0xffd09b,
      emissiveIntensity: 0,
      roughness: 0.7,
    });
  nightWindows.push(warm);
  const shadowTex = makeTexture(
    (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, w / 2);
      g.addColorStop(0, '#10201965');
      g.addColorStop(0.65, '#10201930');
      g.addColorStop(1, '#10201900');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    },
    128,
    128,
  );
  const contact = new T.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  return {
    stone,
    bronze,
    frame,
    plaster,
    wood,
    glazing,
    brick,
    plazaPaving,
    roadRelief,
    roadRoughness,
    room,
    warm,
    contact,
  };
};
