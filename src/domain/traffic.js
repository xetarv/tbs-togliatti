'use strict';

/** @typedef {'compact' | 'van' | 'sedan' | 'shuttle'} TrafficVariant */
/** @typedef {'green' | 'amber' | 'red'} SignalPhase */
/**
 * @typedef {object} TrafficVehicle
 * @property {number} id
 * @property {boolean} horizontal
 * @property {1 | -1} dir
 * @property {TrafficVariant} variant
 * @property {number} color
 * @property {number} road
 * @property {number} lane
 * @property {number} pos
 * @property {number} speed
 * @property {number} cruise
 * @property {boolean} braking
 * @property {number} x
 * @property {number} z
 * @property {number} heading Radians; assigned by placeVehicle before publication.
 */
/** @typedef {Omit<TrafficVehicle, 'x' | 'z' | 'heading'> & Partial<VehicleFootprint>} TrafficVehicleInit */
/** @typedef {Pick<TrafficVehicle, 'horizontal' | 'road' | 'pos'> & {dir?: number}} TrafficNeighbor */
/** @typedef {Pick<TrafficVehicle, 'horizontal' | 'road' | 'lane' | 'pos' | 'dir' | 'cruise'>} TrafficLaneVehicle */
/** @typedef {{speed: number, clearance: number}} TrafficLimit */
/** @typedef {{roadsX: readonly number[], roadsZ: readonly number[], ROAD: number, WORLD_W: number, WORLD_H: number, player: PointXZ}} TrafficOptions */
/**
 * @typedef {object} TrafficSimulation
 * @property {TrafficVehicle[]} traffic
 * @property {(x: number, z: number, horizontal: boolean, atTime?: number) => SignalPhase} signalPhase
 * @property {(vehicle: TrafficLaneVehicle, vehicles?: readonly TrafficNeighbor[], atTime?: number) => TrafficLimit} trafficLimit
 * @property {FrameUpdate} advanceTraffic
 */
/** @param {TrafficOptions} options @returns {Readonly<TrafficSimulation>} */
globalThis.TBS.domain.createTrafficSimulation = function ({
  roadsX,
  roadsZ,
  ROAD,
  WORLD_W,
  WORLD_H,
  player,
}) {
  let time = 0;
  const colors = [0xf4a063, 0xe2e7e8, 0x88bbcf, 0xd8eee8];
  /** @type {TrafficVariant[]} */
  const variants = ['compact', 'van', 'sedan', 'shuttle'];

  /** @param {number} x @param {number} z @param {boolean} horizontal @param {number} [atTime] @returns {SignalPhase} */
  function signalPhase(x, z, horizontal, atTime = time) {
    const phase = (((atTime + roadsX.indexOf(x) * 2 + roadsZ.indexOf(z) * 3) % 24) + 24) % 24;
    const local = (phase + (horizontal ? 0 : 12)) % 24;
    if (local < 8) return 'green';
    return local < 10 ? 'amber' : 'red';
  }

  /** @param {TrafficVehicleInit} vehicle @returns {void} Assign all footprint fields in place. */
  function placeVehicle(vehicle) {
    vehicle.x = vehicle.horizontal ? vehicle.pos : vehicle.road + vehicle.lane;
    vehicle.z = vehicle.horizontal ? vehicle.road + vehicle.lane : vehicle.pos;
    vehicle.heading = vehicle.horizontal
      ? (vehicle.dir * Math.PI) / 2
      : vehicle.dir > 0
        ? Math.PI
        : 0;
  }

  /** @param {number} index @returns {TrafficVehicle} */
  function createVehicle(index) {
    const horizontal = index % 2 === 0;
    const dir = index % 4 < 2 ? 1 : -1;
    const roads = horizontal ? roadsZ : roadsX;
    const crosses = horizontal ? roadsX : roadsZ;
    const block = (Math.floor(index / 4) * 2 + (index % 4)) % (crosses.length - 1);
    const variant = variants[index % variants.length];
    /** @type {TrafficVehicleInit} */
    const vehicle = {
      id: index,
      horizontal,
      dir,
      variant,
      color: colors[index % colors.length],
      road: roads[Math.floor(index / 2) % roads.length],
      lane: (horizontal ? dir : -dir) * 2.7,
      pos: (crosses[block] + crosses[block + 1]) / 2,
      speed: 0,
      cruise: (variant === 'shuttle' ? 6.5 : 7) + ((index * 1.37) % 3),
      braking: true,
    };
    placeVehicle(vehicle);
    return /** @type {TrafficVehicle} */ (vehicle);
  }

  const traffic = Array.from({ length: 36 }, (_, index) => createVehicle(index));

  /** @param {TrafficLaneVehicle} vehicle @param {number} cross @param {readonly TrafficNeighbor[]} vehicles @returns {boolean} */
  function crossingOccupied(vehicle, cross, vehicles) {
    return vehicles.some(
      (other) =>
        other.horizontal !== vehicle.horizontal &&
        Math.abs(other.road - cross) < 0.1 &&
        Math.abs(other.pos - vehicle.road) < ROAD / 2 + 3.1,
    );
  }

  /** @param {TrafficLaneVehicle} vehicle @param {readonly TrafficNeighbor[]} vehicles @param {number} atTime @returns {number} */
  function intersectionClearance(vehicle, vehicles, atTime) {
    let clearance = Infinity;
    for (const cross of vehicle.horizontal ? roadsX : roadsZ) {
      const gap = (cross - vehicle.pos) * vehicle.dir - (ROAD / 2 + 3.5);
      const x = vehicle.horizontal ? cross : vehicle.road;
      const z = vehicle.horizontal ? vehicle.road : cross;
      if (gap >= -0.001 && signalPhase(x, z, vehicle.horizontal, atTime) !== 'green') {
        clearance = Math.min(clearance, Math.max(0, gap));
      }
      if (gap >= 0 && gap < 25 && crossingOccupied(vehicle, cross, vehicles))
        clearance = Math.min(clearance, gap);
    }
    return clearance;
  }

  /** @param {TrafficLaneVehicle} vehicle @param {readonly TrafficNeighbor[]} vehicles @returns {number} */
  function followingClearance(vehicle, vehicles) {
    let clearance = Infinity;
    for (const other of vehicles) {
      const sameLane =
        other !== vehicle &&
        other.horizontal === vehicle.horizontal &&
        other.road === vehicle.road &&
        other.dir === vehicle.dir;
      if (!sameLane) continue;
      const gap = (other.pos - vehicle.pos) * vehicle.dir;
      if (gap > 0) clearance = Math.min(clearance, Math.max(0, gap - 7.6));
    }
    return clearance;
  }

  /** @param {TrafficLaneVehicle} vehicle @returns {number} */
  function playerClearance(vehicle) {
    const along = vehicle.horizontal ? player.x : player.z;
    const across = vehicle.horizontal ? player.z : player.x;
    const gap = (along - vehicle.pos) * vehicle.dir;
    if (Math.abs(across - vehicle.road - vehicle.lane) < 3.25 && gap > 0)
      return Math.max(0, gap - 8);
    return Infinity;
  }

  /** @param {TrafficLaneVehicle} vehicle @param {readonly TrafficNeighbor[]} [vehicles] @param {number} [atTime] @returns {TrafficLimit} */
  function trafficLimit(vehicle, vehicles = traffic, atTime = time) {
    const clearance = Math.min(
      intersectionClearance(vehicle, vehicles, atTime),
      followingClearance(vehicle, vehicles),
      playerClearance(vehicle),
    );
    return { speed: Math.min(vehicle.cruise, Math.sqrt(2 * 5 * clearance)), clearance };
  }

  /** @param {TrafficVehicle} vehicle @param {TrafficLimit} limit @param {number} dt Elapsed seconds. @returns {void} */
  function advanceVehicle(vehicle, limit, dt) {
    const oldSpeed = vehicle.speed;
    vehicle.speed += Math.max(-5 * dt, Math.min(2.6 * dt, limit.speed - vehicle.speed));
    const movement = Math.min(vehicle.speed * dt, limit.clearance);
    if (movement < vehicle.speed * dt || limit.clearance < 0.015) vehicle.speed = 0;
    vehicle.pos += vehicle.dir * movement;
    const end = vehicle.horizontal ? WORLD_W : WORLD_H;
    const start = vehicle.horizontal ? -8 : 19;
    if (vehicle.pos > end + 8) vehicle.pos = start;
    if (vehicle.pos < start) vehicle.pos = end + 8;
    vehicle.braking = vehicle.speed < oldSpeed - 0.005 || vehicle.speed < 0.1;
    placeVehicle(vehicle);
  }

  /** @type {FrameUpdate} */
  function advanceTraffic(dt) {
    time += dt;
    const limits = traffic.map((vehicle) => trafficLimit(vehicle));
    traffic.forEach((vehicle, index) => advanceVehicle(vehicle, limits[index], dt));
  }

  return Object.freeze({ traffic, signalPhase, trafficLimit, advanceTraffic });
};
