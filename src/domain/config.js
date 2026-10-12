'use strict';

/**
 * @typedef {object} DrivingSettings
 * @property {number} acceleration
 * @property {number} braking
 * @property {number} handbrake
 * @property {number} drag
 * @property {number} forwardSpeed
 * @property {number} reverseSpeed
 * @property {number} stopThreshold
 * @property {number} steeringThreshold
 * @property {number} turnRate
 * @property {number} batteryDrain
 */
/** @typedef {{minX: number, maxX: number, minZ: number, maxZ: number}} WorldBounds */
/** @typedef {PointXZ & {name: string}} MissionPoint */
/** @typedef {{title: string, description: string, from: Readonly<MissionPoint>, to: Readonly<MissionPoint>, reward: number}} MissionDefinition */
/** @typedef {{interactionRadius: number, maximumSpeed: number}} MissionRules */
/**
 * @typedef {object} GameConfig
 * @property {Readonly<DrivingSettings>} driving
 * @property {Readonly<WorldBounds>} bounds
 * @property {Readonly<MissionRules>} missionRules
 * @property {number} WORLD_W
 * @property {number} WORLD_H
 * @property {number} ROAD
 * @property {readonly number[]} roadsX
 * @property {readonly number[]} roadsZ
 * @property {(i: number, j: number) => boolean} isParkBlock
 * @property {readonly Readonly<MissionDefinition>[]} missions
 */

(() => {
  const WORLD_W = 386,
    WORLD_H = 300,
    ROAD = 12.4;
  const roadsX = [26, 68, 110, 152, 194, 236, 278, 320, 362];
  const roadsZ = [30, 70, 110, 150, 190, 230, 270];
  /** @param {number} i @param {number} j @returns {boolean} */
  function isParkBlock(i, j) {
    return (
      (i === 3 && j === 3) ||
      (j === 4 && i % 2 === 0) ||
      (i === 5 && j === 0) ||
      (i >= 6 && (i + j) % 3 === 0) ||
      (j === 5 && i % 3 === 1)
    );
  }
  const missions = [
    {
      title: 'Контур будущего',
      description:
        'Заберите модуль связи в центре ТБС и отвезите его инженерам Жигулёвской долины.',
      from: { x: 26, z: 30, name: 'Центр ТБС' },
      to: { x: 110, z: 110, name: 'Жигулёвская долина' },
      reward: 1200,
    },
    {
      title: 'Письмо над Волгой',
      description: 'Получите дрон К-50 на площадке НПЦ БАС и отправьте груз к набережной Волги.',
      from: { x: 194, z: 30, name: 'НПЦ БАС • ТБС' },
      to: { x: 68, z: 30, name: 'Набережная Волги' },
      reward: 1800,
    },
    {
      title: 'Город на связи',
      description: 'Заберите батарею у АВТОВАЗа и доставьте её обратно в центр ТБС.',
      from: { x: 194, z: 150, name: 'АВТОВАЗ' },
      to: { x: 26, z: 30, name: 'Центр ТБС' },
      reward: 2400,
    },
  ];
  /** @template T @param {T} value @returns {T} */
  function freeze(value) {
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  }
  globalThis.TBS.domain.config = freeze({
    driving: {
      acceleration: 23,
      braking: 27,
      handbrake: 10,
      drag: 0.13,
      forwardSpeed: 22,
      reverseSpeed: -9,
      stopThreshold: 0.1,
      steeringThreshold: 0.3,
      turnRate: 1.7,
      batteryDrain: 0.004,
    },
    bounds: { minX: 2, maxX: WORLD_W - 2, minZ: 20, maxZ: WORLD_H - 2 },
    missionRules: { interactionRadius: 8.5, maximumSpeed: 5.8 },
    WORLD_W,
    WORLD_H,
    ROAD,
    roadsX: Object.freeze(roadsX),
    roadsZ: Object.freeze(roadsZ),
    isParkBlock,
    missions,
  });
})();
