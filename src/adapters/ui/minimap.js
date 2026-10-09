'use strict';

window.TBS.createMinimap = function ({
  mini,
  mctx,
  WORLD_W,
  WORLD_H,
  ROAD,
  roadsX,
  roadsZ,
  player,
  parkingLots,
  worldState,
  target,
}) {
  function drawMini() {
    const w = mini.width,
      h = mini.height,
      sx = w / WORLD_W,
      sz = h / WORLD_H;
    mctx.fillStyle = '#0c242d';
    mctx.fillRect(0, 0, w, h);
    mctx.fillStyle = '#0b526a';
    mctx.fillRect(0, 0, w, 18 * sz);
    mctx.fillStyle = '#506675';
    for (const x of roadsX) mctx.fillRect((x - ROAD / 2) * sx, 0, ROAD * sx, h);
    for (const z of roadsZ) mctx.fillRect(0, (z - ROAD / 2) * sz, w, ROAD * sz);
    mctx.fillStyle = '#1c4b49';
    for (let j = 0; j < roadsZ.length - 1; j++)
      for (let i = 0; i < roadsX.length - 1; i++)
        mctx.fillRect(
          (roadsX[i] + ROAD / 2 + 1) * sx,
          (roadsZ[j] + ROAD / 2 + 1) * sz,
          (roadsX[i + 1] - roadsX[i] - ROAD - 2) * sx,
          (roadsZ[j + 1] - roadsZ[j] - ROAD - 2) * sz,
        );
    mctx.fillStyle = '#9acbd5';
    mctx.font = 'bold 9px sans-serif';
    mctx.textAlign = 'center';
    for (const p of parkingLots) mctx.fillText('P', p.cx * sx, (p.top + 5) * sz);
    if (worldState.centralSquare) {
      mctx.fillStyle = '#ff741f';
      mctx.font = 'bold 14px sans-serif';
      mctx.fillText('★', worldState.centralSquare.x * sx, worldState.centralSquare.z * sz + 4);
    }
    mctx.textAlign = 'start';
    const t = target();
    mctx.fillStyle = '#ffb45f';
    mctx.beginPath();
    mctx.arc(t.x * sx, t.z * sz, 7, 0, Math.PI * 2);
    mctx.fill();
    mctx.save();
    mctx.translate(player.x * sx, player.z * sz);
    mctx.rotate(player.heading);
    mctx.fillStyle = '#78fff0';
    mctx.beginPath();
    mctx.moveTo(0, -9);
    mctx.lineTo(6, 6);
    mctx.lineTo(-6, 6);
    mctx.closePath();
    mctx.fill();
    mctx.restore();
  }
  return { drawMini };
};
