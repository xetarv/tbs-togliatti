'use strict';

globalThis.TBS.domain.resetControls = function (keys) {
  for (const key of Object.keys(keys)) keys[key] = false;
};

globalThis.TBS.domain.createState = function () {
  return {
    mode: 'intro',
    missionIndex: 0,
    stage: 0,
    deliveries: 0,
    credits: 0,
    player: { x: 68, z: 30, heading: -Math.PI / 2, speed: 0, battery: 100, slip: 0 },
    keys: Object.create(null),
  };
};
