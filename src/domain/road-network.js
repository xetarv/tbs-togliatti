'use strict';

globalThis.TBS.domain.createRoadNetwork = function ({ roadsX, roadsZ, ROAD, parkingLots }) {
  const edge = ROAD / 2;
  const cornerRadius = 4;
  const vehicleClearance = 1.2;

  function insideParkingLot(x, z, lot) {
    const inside =
      x > lot.left + 1.8 && x < lot.right - 1.8 && z > lot.top + 1.8 && z < lot.bottom - 3;
    const entrance = Math.abs(x - lot.cx) < 2.2 && z >= lot.road && z < lot.top + 5;
    return inside || entrance;
  }

  function isDrivable(x, z) {
    const dx = Math.min(...roadsX.map((road) => Math.abs(road - x)));
    const dz = Math.min(...roadsZ.map((road) => Math.abs(road - z)));
    const insideLane = dx < edge - vehicleClearance || dz < edge - vehicleClearance;
    const insideCorner =
      dx < edge + cornerRadius &&
      dz < edge + cornerRadius &&
      Math.hypot(edge + cornerRadius - dx, edge + cornerRadius - dz) >
        cornerRadius + vehicleClearance;
    return insideLane || insideCorner || parkingLots.some((lot) => insideParkingLot(x, z, lot));
  }

  return Object.freeze({ isDrivable });
};
