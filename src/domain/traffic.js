'use strict';

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
  const variants = ['compact', 'van', 'sedan', 'shuttle'];

  function signalPhase(x, z, horizontal, atTime = time) {
    const phase = (((atTime + roadsX.indexOf(x) * 2 + roadsZ.indexOf(z) * 3) % 24) + 24) % 24;
    const local = (phase + (horizontal ? 0 : 12)) % 24;
    if (local < 8) return 'green';
    return local < 10 ? 'amber' : 'red';
  }

  function placeVehicle(vehicle) {
    vehicle.x = vehicle.horizontal ? vehicle.pos : vehicle.road + vehicle.lane;
    vehicle.z = vehicle.horizontal ? vehicle.road + vehicle.lane : vehicle.pos;
    vehicle.heading = vehicle.horizontal
      ? (vehicle.dir * Math.PI) / 2
      : vehicle.dir > 0
        ? Math.PI
        : 0;
  }

  function createVehicle(index) {
    const horizontal = index % 2 === 0;
    const dir = index % 4 < 2 ? 1 : -1;
    const roads = horizontal ? roadsZ : roadsX;
    const crosses = horizontal ? roadsX : roadsZ;
    const block = (Math.floor(index / 4) * 2 + (index % 4)) % (crosses.length - 1);
    const variant = variants[index % variants.length];
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
    return vehicle;
  }

  const traffic = Array.from({ length: 36 }, (_, index) => createVehicle(index));

  function crossingOccupied(vehicle, cross, vehicles) {
    return vehicles.some(
      (other) =>
        other.horizontal !== vehicle.horizontal &&
        Math.abs(other.road - cross) < 0.1 &&
        Math.abs(other.pos - vehicle.road) < ROAD / 2 + 3.1,
    );
  }

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

  function playerClearance(vehicle) {
    const along = vehicle.horizontal ? player.x : player.z;
    const across = vehicle.horizontal ? player.z : player.x;
    const gap = (along - vehicle.pos) * vehicle.dir;
    if (Math.abs(across - vehicle.road - vehicle.lane) < 3.25 && gap > 0)
      return Math.max(0, gap - 8);
    return Infinity;
  }

  function trafficLimit(vehicle, vehicles = traffic, atTime = time) {
    const clearance = Math.min(
      intersectionClearance(vehicle, vehicles, atTime),
      followingClearance(vehicle, vehicles),
      playerClearance(vehicle),
    );
    return { speed: Math.min(vehicle.cruise, Math.sqrt(2 * 5 * clearance)), clearance };
  }

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

  function advanceTraffic(dt) {
    time += dt;
    const limits = traffic.map((vehicle) => trafficLimit(vehicle));
    traffic.forEach((vehicle, index) => advanceVehicle(vehicle, limits[index], dt));
  }

  return Object.freeze({ traffic, signalPhase, trafficLimit, advanceTraffic });
};
