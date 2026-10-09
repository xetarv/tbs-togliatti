'use strict';
window.TBS.createWorldSigns = function ({
  makeTexture,
  markTexture,
  T,
  scene,
  whiteMat,
  box,
  orangeMat,
}) {
  const flags = [];
  const flagTexture = makeTexture(
    (p, w, h) => {
      p.fillStyle = '#e5e9e4';
      p.fillRect(0, 0, w, h);
      p.fillStyle = '#ff4b09';
      p.fillRect(0, h - 12, w, 12);
    },
    512,
    300,
  );
  function paintFlag() {
    const p = flagTexture.image.getContext('2d');
    p.drawImage(markTexture.image, 160, 40, 190, 190);
    flagTexture.needsUpdate = true;
  }
  if (markTexture.image?.complete) paintFlag();
  else markTexture.userData.onReady.push(paintFlag);
  function sprite(parent, texture, x, y, z, w, h, opacity = 1) {
    const o = new T.Sprite(
      new T.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false }),
    );
    o.position.set(x, y, z);
    o.scale.set(w, h, 1);
    parent.add(o);
    return o;
  }
  function signTexture(title, sub) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const p = c.getContext('2d');
    p.fillStyle = '#071826';
    p.fillRect(0, 0, 1024, 256);
    p.strokeStyle = '#ff4808';
    p.lineWidth = 12;
    p.strokeRect(7, 7, 1010, 242);
    p.fillStyle = '#ff4808';
    p.fillRect(35, 35, 14, 186);
    let fontSize = 82;
    do {
      p.font = '900 ' + fontSize + 'px Segoe UI, Arial';
      fontSize -= 2;
    } while (p.measureText(title).width > 910 && fontSize > 30);
    p.fillStyle = '#ffffff';
    p.textAlign = 'center';
    p.fillText(title, 535, 112);
    p.fillStyle = '#b9e6ee';
    p.font = '700 35px Segoe UI, Arial';
    p.fillText(sub, 535, 185, 900);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }
  function streetNameplate(x, z, width, angle, title) {
    const texture = makeTexture(
      (p, w, h) => {
        p.fillStyle = '#09202a';
        p.fillRect(0, 0, w, h);
        p.fillStyle = '#ff4b09';
        p.fillRect(0, h - 8, w, 8);
        let size = 88;
        do {
          p.font = '900 ' + size + 'px Segoe UI,Arial';
          size -= 2;
        } while (p.measureText(title).width > w - 64 && size > 28);
        p.fillStyle = '#ffffff';
        p.textAlign = 'center';
        p.textBaseline = 'middle';
        p.fillText(title, w / 2, h * 0.48);
      },
      1024,
      128,
    );
    const sign = new T.Mesh(
      new T.PlaneGeometry(width, width / 8),
      new T.MeshBasicMaterial({ map: texture, toneMapped: false, fog: false }),
    );
    sign.position.set(x, 2.4, z);
    sign.rotation.y = angle;
    scene.add(sign);
  }
  function addFlag(x, z) {
    const pole = new T.Mesh(new T.CylinderGeometry(0.055, 0.065, 4.6, 8), whiteMat);
    pole.position.set(x, 2.5, z);
    scene.add(pole);
    const fabric = new T.Mesh(
      new T.PlaneGeometry(2.8, 1.65, 14, 5),
      new T.MeshStandardMaterial({
        map: flagTexture,
        color: 0xffffff,
        side: T.DoubleSide,
        roughness: 0.95,
      }),
    );
    fabric.position.set(x + 1.4, 4.7, z);
    fabric.castShadow = true;
    scene.add(fabric);
    flags.push(fabric);
    box(scene, x, 5.7, z, 0.19, 0.2, 0.19, orangeMat);
  }

  return { flags, sprite, signTexture, streetNameplate, addFlag };
};
