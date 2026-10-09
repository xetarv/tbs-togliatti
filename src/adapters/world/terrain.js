'use strict';

window.TBS.createTerrain = function ({
  T,
  WORLD_W,
  WORLD_H,
  ROAD,
  roadsX,
  roadsZ,
  scene,
  vegetationCulling,
  mat,
  curbMat,
  cyanMat,
  orangeMat,
  whiteMat,
  glassMat,
  laneMat,
  grassMat,
  roofMat,
  trimMat,
  box,
  flat,
  roadSurface,
  markTexture,
  pavingMat,
  crosswalkMat,
  worldState,
  streetLight,
  tree,
  sprite,
  dark,
  makeTexture,
  glowTexture,
  mooredBoats,
  waterfrontTerraces,
  parkWood,
  parkPaving,
  shrubBed,
  parkBench,
  signTexture,
}) {
  function city() {
    flat(scene, WORLD_W / 2, -0.16, WORLD_H / 2, WORLD_W + 650, WORLD_H + 650, grassMat);
    // Distant architecture and the opposite bank give the city a horizon.
    const distantMat = mat(0x586777, 0.12, 0.8);
    for (let i = 0; i < 34; i++) {
      const bx = -30 + (i % 17) * 24,
        bz = i < 17 ? WORLD_H + 45 : -110,
        height = 12 + ((i * 19) % 34);
      box(scene, bx, height / 2, bz, 10 + (i % 3) * 3, height, 11, distantMat);
      box(scene, bx, height + 1, bz, 5, 2, 6, roofMat);
      const width = 10 + (i % 3) * 3;
      box(scene, bx + width * 0.17, height + 2.3, bz + 1, width * 0.58, 3.2, 7, distantMat);
      for (let floor = 1; floor < height / 3; floor++) {
        for (const side of [-1, 1]) {
          box(scene, bx, floor * 3, bz + side * 5.54, width - 0.8, 1.2, 0.045, glassMat);
          box(scene, bx + side * (width / 2 + 0.025), floor * 3, bz, 0.045, 1.2, 10, glassMat);
        }
      }
      for (let rib = 0; rib < 4; rib++)
        box(
          scene,
          bx - width * 0.4 + rib * width * 0.267,
          height / 2,
          bz + 5.59,
          0.19,
          height,
          0.08,
          distantMat,
        );
    }
    const hillsGeometry = new T.PlaneGeometry(WORLD_W + 1100, 240, 140, 32),
      hp = hillsGeometry.attributes.position,
      hc = [];
    for (let i = 0; i < hp.count; i++) {
      const px = hp.getX(i),
        depth = (hp.getY(i) + 120) / 240,
        rolling =
          13 + 8 * Math.sin(px * 0.014) + 5 * Math.sin(px * 0.039 + 1.7) + 2 * Math.sin(px * 0.091);
      hp.setZ(i, Math.sin((Math.min(1, depth * 1.5) * Math.PI) / 2) * rolling);
      const c = new T.Color().setHSL(0.27, 0.12, 0.3 + depth * 0.07 + Math.sin(px * 0.049) * 0.025);
      hc.push(c.r, c.g, c.b);
    }
    hillsGeometry.setAttribute('color', new T.Float32BufferAttribute(hc, 3));
    hillsGeometry.computeVertexNormals();
    const hills = new T.Mesh(
      hillsGeometry,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: T.DoubleSide }),
    );
    hills.rotation.x = -Math.PI / 2;
    hills.position.set(WORLD_W / 2, 0, -232);
    scene.add(hills);
    // Share the irregular bank contour between the terrain and water shader.
    const bankZ = (x) => -62.5 + 2.2 * Math.sin(x * 0.036) + 1.1 * Math.sin(x * 0.113);
    const waterFunctions = `
      float bankEdge(float x){return -62.5+2.2*sin(x*.036)+1.1*sin(x*.113);}
      float riverHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float riverNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(riverHash(i),riverHash(i+vec2(1,0)),f.x),mix(riverHash(i+vec2(0,1)),riverHash(i+vec2(1,1)),f.x),f.y);}
      float riverHeight(vec2 p,float t){
        float swell=sin(dot(p,vec2(.29,.17))-t*1.1)*.085+sin(dot(p,vec2(-.19,.42))+t*.83)*.055;
        float chop=sin(dot(p,vec2(1.7,-.83))+t*1.6+riverNoise(p*.28)*3.)*.018;
        return (swell+chop)*smoothstep(0.,3.,min(18.5-p.y,p.y-bankEdge(p.x)));}
    `;
    const waterMaterial = new T.MeshStandardMaterial({
      color: 0x245861,
      metalness: 0.05,
      roughness: 0.17,
      envMapIntensity: 1.25,
    });
    waterMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.waveTime = { value: 0 };
      waterMaterial.userData.shader = shader;
      shader.vertexShader =
        'uniform float waveTime;varying vec3 vRiverWorld;\n' + waterFunctions + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 riverBase=(modelMatrix*vec4(position,1.)).xyz;
        transformed.z+=riverHeight(riverBase.xz,waveTime);
        vRiverWorld=(modelMatrix*vec4(transformed,1.)).xyz;`,
      );
      shader.fragmentShader =
        'uniform float waveTime;varying vec3 vRiverWorld;\n' +
        waterFunctions +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        vec2 p=vRiverWorld.xz;
        float h=riverHeight(p,waveTime);
        vec2 slope=vec2(riverHeight(p+vec2(.09,0),waveTime)-h,riverHeight(p+vec2(0,.09),waveTime)-h)/.09;
        float ripple=riverNoise(p*2.+vec2(waveTime*.3,-waveTime*.2));
        slope+=vec2(sin(p.x*7.+p.y*3.+waveTime*2.),cos(p.y*6.-p.x*4.+waveTime))*ripple*.016;
        normal=normalize(mat3(viewMatrix)*vec3(-slope.x,1.,-slope.y));`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float bankDistance=vRiverWorld.z-bankEdge(vRiverWorld.x);
        float shoreDistance=min(18.5-vRiverWorld.z,bankDistance);
        float shallow=1.-smoothstep(0.,8.,shoreDistance);
        float patches=riverNoise(vRiverWorld.xz*.36);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.14,.29,.22),shallow*.75);
        diffuseColor.rgb*=.9+patches*.18;
        float wash=.3+.22*sin(waveTime*1.25+vRiverWorld.x*.3);
        float foam=(1.-smoothstep(.08,.65,abs(shoreDistance-wash)))*smoothstep(.38,.72,riverNoise(vRiverWorld.xz*3.+waveTime*.16));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.8,.72),foam*.68);`,
      );
    };
    const river = new T.Mesh(new T.PlaneGeometry(WORLD_W + 1100, 86, 640, 72), waterMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.set(WORLD_W / 2, 0.02, -24);
    scene.add(river);
    scene.userData.waterMaterial = waterMaterial;
    // Sloped gravel, damp sand and planted soil replace the flat bank strips.
    const bankGeometry = new T.BufferGeometry(),
      vertices = [],
      colors = [],
      indices = [];
    const bankColors = [0x555c4d, 0x89866b, 0xa59b78, 0x76805a, 0x526c46].map(
      (c) => new T.Color(c),
    );
    for (let i = 0; i <= 300; i++) {
      const x = -550 + (i * (WORLD_W + 1100)) / 300,
        z = bankZ(x);
      for (let j = 0; j < 5; j++) {
        vertices.push(x, [-0.24, 0.13, 0.55, 1.1, 0.08][j], z - [0, 1.2, 3.8, 8, 24][j]);
        const c = bankColors[j].clone().multiplyScalar(0.91 + 0.12 * Math.sin(i * 3.71 + j));
        colors.push(c.r, c.g, c.b);
        if (i < 300 && j < 4) {
          const n = i * 5 + j;
          indices.push(n, n + 1, n + 5, n + 1, n + 6, n + 5);
        }
      }
    }
    bankGeometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    bankGeometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    bankGeometry.setIndex(indices);
    bankGeometry.computeVertexNormals();
    const bank = new T.Mesh(
      bankGeometry,
      new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: T.DoubleSide }),
    );
    bank.receiveShadow = true;
    scene.add(bank);
    const shoreRock = new T.IcosahedronGeometry(1, 1),
      rockMat = new T.MeshStandardMaterial({ color: 0x85867c, roughness: 0.92, flatShading: true });
    const rocks = new T.InstancedMesh(shoreRock, rockMat, 420),
      rockTransform = new T.Object3D();
    for (let i = 0; i < 420; i++) {
      const near = i >= 300,
        x = near ? ((i - 300) * WORLD_W) / 120 : -70 + (i * (WORLD_W + 140)) / 300;
      const sheltered = near && [47, 173, 299].some((center) => Math.abs(x - center) < 13);
      const size = sheltered ? 0 : 0.3 + (Math.sin(i * 73.13) * 0.5 + 0.5) * 1.1;
      rockTransform.position.set(
        x,
        0.02 + size * 0.16,
        near ? 17.65 - Math.sin(i * 2.17) * 0.4 : bankZ(x) - 0.3 - Math.sin(i * 2.17) * 1.5,
      );
      rockTransform.scale.set(size * 1.35, size * 0.65, size);
      rockTransform.rotation.set(i * 0.23, i * 0.8, i * 0.15);
      rockTransform.updateMatrix();
      rocks.setMatrixAt(i, rockTransform.matrix);
      rocks.setColorAt(i, new T.Color().setHSL(0.12, 0.07, 0.48 + (i % 7) * 0.025));
    }
    rocks.receiveShadow = true;
    rocks.castShadow = true;
    scene.add(rocks);
    // Reeds are narrow curved blades, clustered along the natural bank.
    const reedGeometry = new T.PlaneGeometry(0.09, 1.4, 1, 4),
      rp = reedGeometry.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const h = (rp.getY(i) + 0.7) / 1.4;
      rp.setXYZ(i, rp.getX(i) + h * h * 0.24, rp.getY(i) + 0.7, Math.sin(h * 2) * 0.08);
    }
    reedGeometry.computeVertexNormals();
    const reeds = new T.InstancedMesh(
      reedGeometry,
      new T.MeshStandardMaterial({ color: 0x718048, roughness: 1, side: T.DoubleSide }),
      1500,
    );
    for (let i = 0; i < 1500; i++) {
      const cluster = Math.floor(i / 25),
        x = -45 + cluster * 8.1 + Math.sin(i * 12.7) * 1.9;
      rockTransform.position.set(x, 0.12, bankZ(x) - 1.2 - Math.cos(i * 4.1) * 0.65);
      rockTransform.rotation.set(0, i * 2.4, Math.sin(i) * 0.12);
      rockTransform.scale.setScalar(0.55 + (i % 11) * 0.075);
      rockTransform.updateMatrix();
      reeds.setMatrixAt(i, rockTransform.matrix);
    }
    vegetationCulling.add(scene, reeds, { cellSize: 32 });
    for (let i = 0; i < 30; i++)
      tree(-35 + i * 16, bankZ(-35 + i * 16) - 12 - (i % 3) * 2, i, false, true);
    // Granite quay blocks and a dark wet line at the water level.
    const quayMat = mat(0x727a79, 0, 0.92),
      wetQuayMat = mat(0x3f514d, 0, 0.62);
    for (let x = 0; x < WORLD_W; x += 3) {
      box(scene, x + 1.48, -0.18, 18.9, 2.94, 1.05, 0.75, quayMat);
      box(scene, x + 1.48, 0.08, 18.49, 2.94, 0.18, 0.06, wetQuayMat);
    }
    box(scene, WORLD_W / 2, 0.21, 19, WORLD_W, 0.38, 1.3, curbMat);
    box(scene, WORLD_W / 2, 0.36, 19.6, WORLD_W, 0.08, 0.12, cyanMat);
    flat(scene, WORLD_W / 2, 0.06, 21.5, WORLD_W, 4.4, pavingMat);
    for (let x = 1; x < WORLD_W; x += 3)
      if (![47, 173, 299].some((center) => Math.abs(x - center) < 12)) {
        box(scene, x, 0.9, 18.6, 0.07, 1.35, 0.07, trimMat);
        box(scene, x + 1.5, 1.55, 18.6, 3, 0.08, 0.08, trimMat);
      }
    buildWaterfront();
    for (let x = 8, i = 0; x < WORLD_W - 5; x += 8.2, i++) {
      if (roadsX.some((v) => Math.abs(x - v) < 5)) continue;
      tree(x, 21.5, i);
      if (i % 3 === 0) {
        box(scene, x + 2, 0.49, 20.4, 2.4, 0.3, 0.5, mat(0x526368));
        box(scene, x + 2, 0.8, 20.4, 2.2, 0.12, 0.5, roofMat);
      }
    }
    for (const x of roadsX) {
      flat(scene, x, 0.08, (WORLD_H + 20) / 2, ROAD, WORLD_H - 20, roadSurface(ROAD, WORLD_H - 20));

      for (let z = 21; z < WORLD_H; z += 8) box(scene, x, 0.12, z, 0.16, 0.04, 3.1, laneMat);
    }
    for (const z of roadsZ) {
      flat(scene, WORLD_W / 2, 0.09, z, WORLD_W, ROAD, roadSurface(WORLD_W, ROAD));

      for (let x = 0; x < WORLD_W; x += 8) box(scene, x, 0.13, z, 3.1, 0.04, 0.16, laneMat);
    }
    for (const x of roadsX)
      for (const z of roadsZ) {
        flat(scene, x, 0.15, z, ROAD, ROAD, roadSurface(ROAD, ROAD));
        for (const s of [-1, 1]) {
          box(scene, x + s * (ROAD / 2 - 1.1), 0.16, z - ROAD / 2 + 1.6, 0.12, 0.04, 1.1, cyanMat);
          box(scene, x + s * (ROAD / 2 - 1.1), 0.16, z + ROAD / 2 - 1.6, 0.12, 0.04, 1.1, cyanMat);
          for (let k = -2; k <= 2; k++) {
            box(scene, x + k * 1.35, 0.164, z + s * 4.6, 0.77, 0.015, 1.15, crosswalkMat);
            box(scene, x + s * 4.6, 0.164, z + k * 1.35, 1.15, 0.015, 0.77, crosswalkMat);
          }
        }
        if ((roadsX.indexOf(x) + roadsZ.indexOf(z)) % 2 === 0)
          streetLight(x + ROAD / 2 + 1.1, z + ROAD / 2 + 1.1);
      }
    // The elevated TBS line runs beside the Volga.
    box(scene, WORLD_W / 2, 15.4, 17, WORLD_W, 0.35, 1.15, roofMat);
    box(scene, WORLD_W / 2, 15.67, 16.58, WORLD_W, 0.08, 0.12, cyanMat);
    box(scene, WORLD_W / 2, 15.67, 17.42, WORLD_W, 0.08, 0.12, orangeMat);
    for (const x of roadsX) {
      box(scene, x, 7.6, 17, 0.42, 15.2, 0.45, curbMat);
      box(scene, x, 14.5, 17, 3.3, 0.16, 0.62, roofMat);
    }
    worldState.maglevTrain = new T.Group();
    box(worldState.maglevTrain, 0, 0, 0, 10.5, 1.6, 2.2, whiteMat);
    box(worldState.maglevTrain, 0, 0.47, 0, 7.9, 0.8, 2.23, glassMat);
    box(worldState.maglevTrain, 0, -0.27, 1.17, 9.4, 0.12, 0.08, orangeMat);
    box(worldState.maglevTrain, 0, -0.27, -1.17, 9.4, 0.12, 0.08, cyanMat);
    sprite(worldState.maglevTrain, markTexture, 0, 1.1, 1.23, 1.8, 1.8);
    worldState.maglevTrain.position.set(55, 17.2, 17);
    scene.add(worldState.maglevTrain);
  }

  function buildWaterfront() {
    const wood = parkWood,
      ropeMat = mat(0xa49878),
      deckMat = mat(0x97a29e),
      lifeMat = mat(0xf46e22);
    const plankTexture = makeTexture(
      (p, w, h) => {
        p.fillStyle = '#96795a';
        p.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) {
          p.fillStyle = '#4e4439';
          p.fillRect(0, y, w, 2);
          for (let n = 0; n < 25; n++) {
            p.strokeStyle = n % 2 ? '#d7b48725' : '#392d2328';
            p.beginPath();
            p.moveTo(0, y + 4 + n);
            p.bezierCurveTo(w * 0.3, y + 2 + n, w * 0.6, y + 7 + n, w, y + 4 + n);
            p.stroke();
          }
        }
      },
      256,
      256,
    );
    plankTexture.repeat.set(1, 6);
    const plank = new T.MeshStandardMaterial({
      map: plankTexture,
      bumpMap: plankTexture,
      bumpScale: 0.025,
      roughness: 0.85,
    });
    for (const x of [47, 173, 299]) {
      waterfrontTerraces.push({ x, z: 12 });
      box(scene, x, 0.38, 12, 24, 0.5, 14, deckMat).receiveShadow = true;
      flat(scene, x, 0.64, 12, 23.8, 13.8, parkPaving(23.8, 13.8));
      box(scene, x, 0.46, -3, 4.6, 0.3, 22, wood).receiveShadow = true;
      flat(scene, x, 0.62, -3, 4.4, 22, plank);
      for (const side of [-1, 1]) {
        for (let z = -13; z < 7; z += 4) {
          box(scene, x + side * 2.15, 0.35, z, 0.18, 1.6, 0.18, trimMat);
          box(scene, x + side * 2.15, 1.14, z, 0.3, 0.12, 0.3, whiteMat);
        }
        for (let z = 6; z <= 18; z += 3)
          box(scene, x + side * 11.7, 1.2, z, 0.09, 1.25, 0.09, trimMat);
        box(scene, x + side * 11.7, 1.85, 12, 0.08, 0.08, 12, trimMat);
        for (const height of [1.05, 1.4])
          box(scene, x + side * 11.7, height, 12, 0.035, 0.035, 12, trimMat);
        box(scene, x + side * 7, 1.85, 5.2, 9.2, 0.08, 0.08, trimMat);
        for (const height of [1.05, 1.4])
          box(scene, x + side * 7, height, 5.2, 9.2, 0.035, 0.035, trimMat);
        for (let n = 0; n < 4; n++)
          box(scene, x + side * (3 + n * 2.8), 1.2, 5.2, 0.08, 1.25, 0.08, trimMat);
        // Slatted shade structures and seating face the river.
        const px = x + side * 7;
        for (const dx of [-2, 2])
          for (const dz of [-2, 2])
            box(scene, px + dx, 2.05, 12 + dz, 0.16, 2.8, 0.16, wood).castShadow = true;
        for (let slat = 0; slat < 12; slat++)
          box(scene, px - 2.2 + slat * 0.4, 3.48, 12, 0.17, 0.17, 4.6, wood).castShadow = true;
        parkBench(px, 1.08, 13.4, 3.35);
        box(scene, px, 0.95, 16.7, 3.4, 0.6, 1.15, curbMat);
        shrubBed(px, 1.25, 16.7, 3.1, 0.9, Math.round(px));
        const ring = new T.Mesh(new T.TorusGeometry(0.36, 0.09, 8, 28), lifeMat);
        ring.position.set(x + side * 2.18, 1.16, -5);
        ring.rotation.y = Math.PI / 2;
        scene.add(ring);
        for (const z of [6, 17]) {
          box(scene, px, 0.99, z, 0.16, 0.75, 0.16, dark);
          box(scene, px, 1.39, z, 0.25, 0.1, 0.25, cyanMat);
          sprite(scene, glowTexture, px, 1.43, z, 1.3, 1.3, 0.18);
        }
        const boat = new T.Group();
        boat.position.set(x + side * 6.1, 0, -5);
        scene.add(boat);
        const shape = new T.Shape();
        shape.moveTo(-1.35, -2.7);
        shape.lineTo(1.35, -2.7);
        shape.quadraticCurveTo(1.65, 0.8, 0, 3.65);
        shape.quadraticCurveTo(-1.65, 0.8, -1.35, -2.7);
        const hull = new T.Mesh(
          new T.ExtrudeGeometry(shape, {
            depth: 0.55,
            bevelEnabled: true,
            bevelSize: 0.09,
            bevelThickness: 0.09,
            bevelSegments: 2,
            steps: 1,
          }),
          whiteMat,
        );
        hull.rotation.x = -Math.PI / 2;
        hull.position.y = 0.12;
        hull.castShadow = true;
        boat.add(hull);
        const deck = new T.Mesh(new T.ShapeGeometry(shape), wood);
        deck.rotation.x = -Math.PI / 2;
        deck.position.y = 0.77;
        boat.add(deck);
        box(boat, 0, 1.14, 0.35, 1.85, 0.72, 2.3, glassMat);
        box(boat, 0, 1.58, 0.35, 2.05, 0.15, 2.55, whiteMat);
        box(boat, 0, 0.84, -1.1, 1.75, 0.14, 0.16, orangeMat);
        for (const s of [-1, 1]) {
          box(boat, s * 0.91, 1.14, 0.35, 0.09, 0.78, 2.3, whiteMat);
          box(boat, s * 1.25, 0.64, 1, 0.07, 0.13, 2.4, orangeMat);
        }
        const logo = new T.Mesh(
          new T.PlaneGeometry(0.95, 0.95),
          new T.MeshBasicMaterial({ map: markTexture, transparent: true, toneMapped: false }),
        );
        logo.rotation.x = -Math.PI / 2;
        logo.position.set(0, 1.67, 0.3);
        boat.add(logo);
        const mooring = new T.CatmullRomCurve3([
          new T.Vector3(x + side * 2.15, 1.1, -5),
          new T.Vector3(x + side * 3.5, 0.55, -5),
          new T.Vector3(x + side * 4.8, 0.7, -5),
        ]);
        scene.add(new T.Mesh(new T.TubeGeometry(mooring, 12, 0.035, 5, false), ropeMat));
        mooredBoats.push({ mesh: boat, phase: x * 0.1 + side });
      }
      const sign = new T.Mesh(
        new T.PlaneGeometry(8, 2),
        new T.MeshBasicMaterial({
          map: signTexture('ВОЛГА · ТБС', 'ПРИЧАЛ · НАБЕРЕЖНАЯ'),
          toneMapped: false,
        }),
      );
      sign.position.set(x, 3.25, 17.8);
      scene.add(sign);
      for (const side of [-1, 1]) box(scene, x + side * 3.9, 2, 17.6, 0.1, 2.9, 0.1, trimMat);
    }
  }

  city();
};
