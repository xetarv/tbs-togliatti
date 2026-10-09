/* Authored surface and planting library. All assets are local and deterministic. */
'use strict';

window.TBS.createVisualAssets = function (T, renderer, vegetationCulling) {
  const size = 512,
    cache = new Map(),
    wind = { value: 0 };
  let seed = 81231;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function canvas() {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  }
  function texture(c, data = false) {
    const t = new T.CanvasTexture(c);
    t.encoding = data ? T.LinearEncoding : T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  function surface(kind) {
    const color = canvas(),
      height = canvas(),
      rough = canvas(),
      c = color.getContext('2d'),
      h = height.getContext('2d'),
      r = rough.getContext('2d');
    const asphalt = kind === 'asphalt',
      brick = kind === 'brick',
      paving = kind === 'paving';
    c.fillStyle = asphalt ? '#585a59' : brick ? '#999080' : paving ? '#817d71' : '#beb8a6';
    c.fillRect(0, 0, size, size);
    h.fillStyle = '#888888';
    h.fillRect(0, 0, size, size);
    r.fillStyle = asphalt ? '#dddddd' : '#eeeeee';
    r.fillRect(0, 0, size, size);
    for (let n = 0; n < 52000; n++) {
      const x = random() * size,
        y = random() * size,
        q = random(),
        v = Math.floor(75 + q * 110),
        radius = asphalt ? 0.35 + random() * 1.25 : 0.3 + random() * 0.75;
      c.fillStyle = `rgba(${v},${v},${v - 5},${asphalt ? 0.38 : 0.16})`;
      c.beginPath();
      c.ellipse(x, y, radius, radius * 0.65, random() * 3, 0, 6.283);
      c.fill();
      h.fillStyle = `rgb(${v},${v},${v})`;
      h.fillRect(x, y, radius, radius);
      r.fillStyle = q > 0.75 ? '#bcbcbc' : '#f0f0f0';
      r.fillRect(x, y, radius, radius);
    }
    if (!asphalt) {
      const rowH = brick ? 32 : paving ? 128 : 128,
        colW = brick ? 128 : paving ? 128 : 256;
      for (let row = 0; row < size / rowH; row++)
        for (let col = -1; col < size / colW; col++) {
          const x = col * colW + ((row % 2) * colW) / 2,
            y = row * rowH;
          c.fillStyle = brick
            ? `rgba(${125 + random() * 45},${66 + random() * 30},${43 + random() * 30},.85)`
            : `rgba(105,98,78,${random() * 0.13})`;
          c.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
          c.fillStyle = brick ? '#625b4b' : '#726c5d';
          c.fillRect(x, y, colW, 1.5);
          c.fillRect(x, y, 1.5, rowH);
          c.fillStyle = '#fff5da40';
          c.fillRect(x + 2, y + 2, colW - 4, 1);
          h.fillStyle = '#383838';
          h.fillRect(x, y, colW, 2);
          h.fillRect(x, y, 2, rowH);
          h.fillStyle = '#b0b0b0';
          h.fillRect(x + 2, y + 2, colW - 4, 1);
        }
    }
    const normal = canvas(),
      nc = normal.getContext('2d'),
      source = h.getImageData(0, 0, size, size).data,
      out = nc.createImageData(size, size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4,
          sample = (px, py) =>
            source[(((py + size) % size) * size + ((px + size) % size)) * 4] / 255;
        const nx = (sample(x - 1, y) - sample(x + 1, y)) * (asphalt ? 0.85 : 1.6),
          ny = (sample(x, y - 1) - sample(x, y + 1)) * (asphalt ? 0.85 : 1.6),
          len = Math.hypot(nx, ny, 1);
        out.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
        out.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
        out.data[i + 2] = (0.5 / len + 0.5) * 255;
        out.data[i + 3] = 255;
      }
    nc.putImageData(out, 0, 0);
    return {
      map: texture(color),
      normalMap: texture(normal, true),
      roughnessMap: texture(rough, true),
    };
  }
  const sources = {
    asphalt: surface('asphalt'),
    stone: surface('stone'),
    paving: surface('paving'),
    brick: surface('brick'),
  };
  function material(kind, w = 4, h = 4) {
    const key = kind + ':' + w + ':' + h;
    if (cache.has(key)) return cache.get(key);
    const maps = {};
    for (const [name, source] of Object.entries(sources[kind])) {
      const map = source.clone();
      map.repeat.set(w / 4, h / 4);
      map.needsUpdate = true;
      maps[name] = map;
    }
    const m = new T.MeshStandardMaterial({
      ...maps,
      color: kind === 'asphalt' ? 0x96999b : 0xffffff,
      roughness: 0.97,
      metalness: 0,
      normalScale: new T.Vector2(kind === 'asphalt' ? 0.4 : 0.65, kind === 'asphalt' ? 0.4 : 0.65),
    });
    cache.set(key, m);
    return m;
  }
  // Curved, veined leaves; their silhouettes are actual geometry rather than cards.
  const leaf = new T.BufferGeometry(),
    v = [],
    uv = [],
    ix = [];
  for (let n = 0; n <= 6; n++) {
    const t = n / 6,
      width = Math.pow(Math.sin(t * Math.PI), 0.75) * 0.105;
    v.push(
      -width,
      t * 0.37,
      Math.sin(t * Math.PI) * 0.025,
      0,
      t * 0.37,
      0.035 + Math.sin(t * Math.PI) * 0.04,
      width,
      t * 0.37,
      Math.sin(t * Math.PI) * 0.025,
    );
    uv.push(0, t, 0.5, t, 1, t);
    if (n < 6)
      for (let a = 0; a < 2; a++) {
        const k = n * 3 + a;
        ix.push(k, k + 3, k + 1, k + 1, k + 3, k + 4);
      }
  }
  leaf.setAttribute('position', new T.Float32BufferAttribute(v, 3));
  leaf.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  leaf.setIndex(ix);
  leaf.computeVertexNormals();
  const leafCanvas = canvas(),
    lc = leafCanvas.getContext('2d');
  lc.fillStyle = '#a5bb76';
  lc.fillRect(0, 0, size, size);
  const gradient = lc.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, '#324d2b');
  gradient.addColorStop(0.5, '#b8c788');
  gradient.addColorStop(1, '#466731');
  lc.fillStyle = gradient;
  lc.fillRect(0, 0, size, size);
  lc.strokeStyle = '#d1d59b60';
  lc.lineWidth = 3;
  for (let n = 0; n < 12; n++) {
    lc.beginPath();
    lc.moveTo(256, n * 43);
    lc.lineTo(0, n * 43 - 95);
    lc.moveTo(256, n * 43);
    lc.lineTo(512, n * 43 - 95);
    lc.stroke();
  }
  const foliage = new T.MeshStandardMaterial({
    map: texture(leafCanvas),
    color: 0xa4b878,
    roughness: 0.92,
    side: T.DoubleSide,
  });
  foliage.onBeforeCompile = (shader) => {
    shader.uniforms.leafTime = wind;
    shader.vertexShader = 'uniform float leafTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
    float phase=instanceMatrix[3].x*.65+instanceMatrix[3].z*.43;
    transformed.x+=sin(leafTime*1.8+phase+position.y*5.)*.022*uv.y;
    transformed.z+=sin(leafTime*1.3+phase)*.014*uv.y;`,
    );
  };
  const barkCanvas = canvas(),
    bc = barkCanvas.getContext('2d');
  bc.fillStyle = '#625b4e';
  bc.fillRect(0, 0, size, size);
  for (let n = 0; n < 500; n++) {
    bc.strokeStyle = n % 3 ? '#292f234a' : '#bdaf9240';
    bc.lineWidth = 1 + random() * 3;
    bc.beginPath();
    const x = random() * size;
    for (let y = 0; y <= size; y += 12) {
      const bx = x + Math.sin(y * 0.04 + n) * 2;
      y ? bc.lineTo(bx, y) : bc.moveTo(bx, y);
    }
    bc.stroke();
  }
  const barkMap = texture(barkCanvas),
    bark = new T.MeshStandardMaterial({ map: barkMap, color: 0xb3a990, roughness: 1 });
  const birchCanvas = canvas(),
    birchContext = birchCanvas.getContext('2d');
  birchContext.fillStyle = '#d9d6c4';
  birchContext.fillRect(0, 0, size, size);
  for (let n = 0; n < 240; n++) {
    birchContext.fillStyle = n % 3 ? '#4c504578' : '#999a8550';
    birchContext.fillRect(random() * size, random() * size, 4 + random() * 35, 1 + random() * 5);
  }
  const birchBark = new T.MeshStandardMaterial({ map: texture(birchCanvas), roughness: 1 });
  const speciesLeaves = [leaf.clone(), leaf.clone(), leaf.clone()];
  speciesLeaves[1].scale(0.75, 0.82, 0.8);
  speciesLeaves[2].scale(0.72, 1.08, 0.8);
  const maplePositions = speciesLeaves[0].attributes.position;
  for (let i = 0; i < maplePositions.count; i++) {
    const t = maplePositions.getY(i) / 0.37;
    maplePositions.setX(i, maplePositions.getX(i) * (1.08 + 0.32 * Math.sin(t * Math.PI * 5)));
  }
  speciesLeaves[0].computeVertexNormals();
  const soilCanvas = canvas(),
    soilContext = soilCanvas.getContext('2d');
  soilContext.fillStyle = '#494333';
  soilContext.fillRect(0, 0, size, size);
  for (let n = 0; n < 18000; n++) {
    soilContext.fillStyle = n % 2 ? '#96836855' : '#221f1b66';
    soilContext.fillRect(random() * size, random() * size, 1 + random() * 4, 1 + random() * 2);
  }
  const soil = new T.MeshStandardMaterial({ map: texture(soilCanvas), roughness: 1 });
  const grassGeometry = new T.BufferGeometry();
  grassGeometry.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [-0.018, 0, 0, 0.018, 0, 0, -0.014, 0.16, 0.02, 0.014, 0.16, 0.02, 0.055, 0.34, 0.065],
      3,
    ),
  );
  grassGeometry.setAttribute(
    'uv',
    new T.Float32BufferAttribute([0, 0, 1, 0, 0, 0.5, 1, 0.5, 0.5, 1], 2),
  );
  grassGeometry.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  grassGeometry.computeVertexNormals();
  function plant(parent, x, z, variant = 0, scale = 1) {
    const species = ((variant % 3) + 3) % 3,
      birch = species === 1,
      poplar = species === 2;
    const height = poplar ? 7.8 : birch ? 6.6 : 5.6,
      radius = poplar ? 1.05 : birch ? 1.7 : 2.1;
    const group = new T.Group();
    group.name = ['Клён', 'Берёза', 'Тополь'][species];
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    parent.add(group);
    const tips = [],
      branchParts = [];
    function branch(points, r) {
      const path = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))),
        g = new T.TubeGeometry(path, 10, r, 7, false),
        p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const t = Math.floor(i / 8) / 10,
          center = path.getPointAt(t),
          v = new T.Vector3()
            .fromBufferAttribute(p, i)
            .sub(center)
            .multiplyScalar(1 - t * 0.72)
            .add(center);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      branchParts.push(g);
    }
    branch(
      [
        [0, 0.35, 0],
        [0.07, 2, 0],
        [-0.06, height * 0.62, 0.05],
        [0.11, height - 0.35, 0],
      ],
      birch ? 0.105 : 0.15,
    );
    for (let n = 0; n < 18; n++) {
      const a = n * 2.399 + variant,
        t = n / 17,
        y = 2.1 + t * (height - 3.3),
        reach = radius * (0.85 - 0.35 * t),
        ex = Math.cos(a) * reach,
        ez = Math.sin(a) * reach;
      const ey = poplar ? y + 1.5 : y + 0.8;
      branch(
        [
          [0, y, 0],
          [ex * 0.5, y + 0.55, ez * 0.5],
          [ex, ey, ez],
        ],
        0.044 - t * 0.022,
      );
      for (const side of [-1, 1]) {
        const tip = [
          ex + Math.cos(a + side * 0.75) * radius * 0.32,
          ey + (birch ? -0.25 : 0.2),
          ez + Math.sin(a + side * 0.75) * radius * 0.32,
        ];
        branch([[ex * 0.65, y + 0.65, ez * 0.65], [ex, ey, ez], tip], 0.016);
        tips.push(tip);
      }
    }
    // Merge the tapered branches into one mesh per tree.
    const positions = [],
      normals = [],
      uvs = [],
      indices = [];
    for (const part of branchParts) {
      const offset = positions.length / 3;
      positions.push(...part.attributes.position.array);
      normals.push(...part.attributes.normal.array);
      uvs.push(...part.attributes.uv.array);
      for (const i of part.index.array) indices.push(i + offset);
      part.dispose();
    }
    const woodGeometry = new T.BufferGeometry();
    woodGeometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    woodGeometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    woodGeometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    woodGeometry.setIndex(indices);
    const trunk = new T.Mesh(woodGeometry, birch ? birchBark : bark);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    const count = 4200,
      leaves = new T.InstancedMesh(speciesLeaves[species], foliage, count),
      pose = new T.Object3D();
    for (let n = 0; n < count; n++) {
      const tip = tips[n % tips.length],
        angle = n * 2.399,
        v = ((n * 0.618034) % 1) * 2 - 1,
        rr = Math.sqrt(1 - v * v) * (0.18 + ((n * 0.754877) % 1) * 0.55);
      pose.position.set(
        tip[0] + Math.cos(angle) * rr * (poplar ? 0.63 : 1),
        tip[1] + v * (poplar ? 0.75 : 0.55),
        tip[2] + Math.sin(angle) * rr * (poplar ? 0.63 : 1),
      );
      pose.rotation.set(0.35 + Math.sin(n * 0.57) * 0.85, n * 1.37, Math.sin(n * 0.71) * 0.8);
      pose.scale.setScalar(0.42 + (n % 9) * 0.025);
      pose.updateMatrix();
      leaves.setMatrixAt(n, pose.matrix);
      const exposed = Math.min(1, Math.hypot(pose.position.x, pose.position.z) / radius);
      leaves.setColorAt(
        n,
        new T.Color().setHSL(0.21 + species * 0.012, 0.3, 0.39 + exposed * 0.13 + (n % 7) * 0.008),
      );
    }
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    vegetationCulling.add(group, leaves, { displacement: new T.Vector3(0.022, 0, 0.014) });
    const bed = new T.Mesh(new T.CylinderGeometry(0.88, 0.94, 0.16, 32), soil);
    bed.position.y = 0.41;
    bed.receiveShadow = true;
    group.add(bed);
    const grass = new T.InstancedMesh(grassGeometry, foliage, 240);
    for (let n = 0; n < 240; n++) {
      const a = n * 2.399,
        r = 0.24 + Math.sqrt((n * 0.618034) % 1) * 0.6;
      pose.position.set(Math.cos(a) * r, 0.495, Math.sin(a) * r);
      pose.rotation.set(0, n * 1.73, 0);
      pose.scale.setScalar(0.35 + (n % 7) * 0.065);
      pose.updateMatrix();
      grass.setMatrixAt(n, pose.matrix);
      grass.setColorAt(n, new T.Color().setHSL(0.2, 0.25, 0.36 + (n % 7) * 0.023));
    }
    grass.receiveShadow = true;
    vegetationCulling.add(group, grass, { displacement: new T.Vector3(0.022, 0, 0.014) });
    return group;
  }
  return { material, plant, wind, leaf, foliage };
};
