'use strict';

globalThis.TBS.domain.createTrafficSimulation = function ({
  roadsX,
  roadsZ,
  ROAD,
  WORLD_W,
  WORLD_H,
  player,
  parkedVehicles = [],
  dynamicTraffic = false,
}: TrafficOptions): Readonly<TrafficSimulation> {
  let time = 0;
  const colors = [0xf4a063, 0xe2e7e8, 0x88bbcf, 0xd8eee8];
  const variants: TrafficVariant[] = ['compact', 'van', 'sedan', 'shuttle'];

  function signalPhase(
    x: number,
    z: number,
    horizontal: boolean,
    atTime: number = time,
  ): SignalPhase {
    const phase = (((atTime + roadsX.indexOf(x) * 2 + roadsZ.indexOf(z) * 3) % 24) + 24) % 24;
    const local = (phase + (horizontal ? 0 : 12)) % 24;
    if (local < 8) return 'green';
    return local < 10 ? 'amber' : 'red';
  }

  function placeVehicle(vehicle: TrafficVehicleInit): asserts vehicle is TrafficVehicle {
    vehicle.x = vehicle.horizontal ? vehicle.pos : vehicle.road + vehicle.lane;
    vehicle.z = vehicle.horizontal ? vehicle.road + vehicle.lane : vehicle.pos;
    vehicle.heading = vehicle.horizontal
      ? (vehicle.dir * Math.PI) / 2
      : vehicle.dir > 0
        ? Math.PI
        : 0;
  }

  function createVehicle(index: number): TrafficVehicle {
    const horizontal = index % 2 === 0;
    const dir = index % 4 < 2 ? 1 : -1;
    const roads = horizontal ? roadsZ : roadsX;
    const crosses = horizontal ? roadsX : roadsZ;
    const block = (Math.floor(index / 4) * 2 + (index % 4)) % (crosses.length - 1);
    const variant = variants[index % variants.length];
    const vehicle: TrafficVehicleInit = {
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
  let nextId = traffic.length,
    version = 0,
    densityElapsed = 0;
  const born = new Map(traffic.map((vehicle) => [vehicle.id, time]));

  function validatePlacement(placement: TrafficPlacement | undefined): void {
    if (
      placement !== undefined &&
      (!placement ||
        typeof placement.horizontal !== 'boolean' ||
        ![1, -1].includes(placement.dir) ||
        !(placement.horizontal ? roadsZ : roadsX).includes(placement.road) ||
        !Number.isFinite(placement.pos) ||
        placement.pos < (placement.horizontal ? -8 : 19) ||
        placement.pos > (placement.horizontal ? WORLD_W : WORLD_H) + 8)
    )
      throw new RangeError('Invalid traffic placement');
  }

  function addVehicle(variant?: TrafficVariant, placement?: TrafficPlacement): TrafficVehicle {
    if (variant !== undefined && !variants.includes(variant))
      throw new RangeError('Unknown traffic variant');
    if (!Number.isSafeInteger(nextId)) throw new RangeError('Traffic IDs exhausted');
    validatePlacement(placement);
    const vehicle = createVehicle(nextId);
    if (variant !== undefined) {
      vehicle.variant = variant;
      vehicle.cruise = (variant === 'shuttle' ? 6.5 : 7) + ((nextId * 1.37) % 3);
    }
    if (placement) {
      vehicle.horizontal = placement.horizontal;
      vehicle.road = placement.road;
      vehicle.dir = placement.dir;
      vehicle.pos = placement.pos;
      vehicle.lane = (vehicle.horizontal ? vehicle.dir : -vehicle.dir) * 2.7;
      placeVehicle(vehicle);
    }
    nextId++;
    traffic.push(vehicle);
    born.set(vehicle.id, time);
    version++;
    return vehicle;
  }

  function removeVehicle(id: number): boolean {
    if (!Number.isSafeInteger(id) || id < 0) return false;
    const index = traffic.findIndex((vehicle) => vehicle.id === id);
    if (index < 0) return false;
    traffic.splice(index, 1);
    born.delete(id);
    version++;
    return true;
  }

  // Road geometry is fixed by configuration; enumerate eligible block midpoints once.
  function placementsFor(horizontal: boolean): TrafficPlacement[] {
    const placements: TrafficPlacement[] = [];
    const roads = horizontal ? roadsZ : roadsX;
    const crosses = horizontal ? roadsX : roadsZ;
    for (const road of roads) {
      for (let i = 0; i < crosses.length - 1; i++) {
        const pos = (crosses[i] + crosses[i + 1]) / 2;
        if (
          !Number.isFinite(pos) ||
          pos < (horizontal ? 4 : 23) ||
          pos > (horizontal ? WORLD_W : WORLD_H) - 4 ||
          crosses.some((cross) => Math.abs(cross - pos) < ROAD / 2 + 8)
        )
          continue;
        placements.push({ horizontal, road, dir: 1, pos }, { horizontal, road, dir: -1, pos });
      }
    }
    return placements;
  }
  const placements = dynamicTraffic ? [...placementsFor(true), ...placementsFor(false)] : [];

  // Event-sized work, never a scene scan. Spawn outside the current 135-unit view
  // budget plus the normal chase/orbit-camera offset; keep a wider retirement band.
  function findPlacement(minDistance: number): TrafficPlacement | undefined {
    let best: TrafficPlacement | undefined,
      bestDistance = Infinity;
    for (const placement of placements) {
      const { horizontal, road, dir, pos } = placement;
      if (
        Math.abs(road - (horizontal ? player.z : player.x)) > 70 ||
        ((horizontal ? player.x : player.z) - pos) * dir <= 0
      )
        continue;
      const lane = (horizontal ? dir : -dir) * 2.7;
      const x = horizontal ? pos : road + lane,
        z = horizontal ? road + lane : pos;
      const distance = Math.hypot(x - player.x, z - player.z);
      if (distance < minDistance || distance > 230 || distance >= bestDistance) continue;
      if (
        traffic.some((vehicle) => Math.hypot(x - vehicle.x, z - vehicle.z) < 14) ||
        parkedVehicles.some((vehicle) => Math.hypot(x - vehicle.x, z - vehicle.z) < 14)
      )
        continue;
      best = placement;
      bestDistance = distance;
    }
    return best;
  }

  function updateDensity(dt: number): void {
    if (!dynamicTraffic) return;
    densityElapsed += dt;
    if (densityElapsed < 3) return;
    densityElapsed %= 3; // One bounded cycle even after an unusually long caller step.
    if (!Number.isFinite(player.x) || !Number.isFinite(player.z)) return;
    const speed = Math.abs(player.speed ?? 0);
    if (!Number.isFinite(speed)) return;
    const minDistance = Math.max(190, speed * 3 + 20);
    const retireDistance = Math.max(270, minDistance + 40);
    let distant: TrafficVehicle | undefined,
      farthest = retireDistance;
    for (const vehicle of traffic) {
      if (time - (born.get(vehicle.id) ?? time) < 15) continue;
      const distance = Math.hypot(vehicle.x - player.x, vehicle.z - player.z);
      if (distance > farthest) {
        distant = vehicle;
        farthest = distance;
      }
    }
    if (distant) removeVehicle(distant.id);
    if (traffic.length < 36) {
      const placement = findPlacement(minDistance);
      if (placement) addVehicle(undefined, placement);
    }
  }

  function crossingOccupied(
    vehicle: TrafficLaneVehicle,
    cross: number,
    vehicles: readonly TrafficNeighbor[],
  ): boolean {
    return vehicles.some(
      (other) =>
        other.horizontal !== vehicle.horizontal &&
        Math.abs(other.road - cross) < 0.1 &&
        Math.abs(other.pos - vehicle.road) < ROAD / 2 + 3.1,
    );
  }

  function intersectionClearance(
    vehicle: TrafficLaneVehicle,
    vehicles: readonly TrafficNeighbor[],
    atTime: number,
  ): number {
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

  function followingClearance(
    vehicle: TrafficLaneVehicle,
    vehicles: readonly TrafficNeighbor[],
  ): number {
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

  function playerClearance(vehicle: TrafficLaneVehicle): number {
    const along = vehicle.horizontal ? player.x : player.z;
    const across = vehicle.horizontal ? player.z : player.x;
    const gap = (along - vehicle.pos) * vehicle.dir;
    if (Math.abs(across - vehicle.road - vehicle.lane) < 3.25 && gap > 0)
      return Math.max(0, gap - 8);
    return Infinity;
  }

  function trafficLimit(
    vehicle: TrafficLaneVehicle,
    vehicles: readonly TrafficNeighbor[] = traffic,
    atTime: number = time,
  ): TrafficLimit {
    const clearance = Math.min(
      intersectionClearance(vehicle, vehicles, atTime),
      followingClearance(vehicle, vehicles),
      playerClearance(vehicle),
    );
    return { speed: Math.min(vehicle.cruise, Math.sqrt(2 * 5 * clearance)), clearance };
  }

  function advanceVehicle(vehicle: TrafficVehicle, limit: TrafficLimit, dt: number): void {
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

  function advanceTraffic(dt: number): void {
    time += dt;
    const limits = traffic.map((vehicle) => trafficLimit(vehicle));
    traffic.forEach((vehicle, index) => advanceVehicle(vehicle, limits[index], dt));
    updateDensity(dt);
  }

  return Object.freeze({
    traffic,
    signalPhase,
    trafficLimit,
    advanceTraffic,
    addVehicle,
    removeVehicle,
    get version() {
      return version;
    },
  });
};
