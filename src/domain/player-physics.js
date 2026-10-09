'use strict';

globalThis.TBS.domain.createPlayerPhysics = function ({
  player,
  keys,
  settings,
  bounds,
  roadNetwork,
  movingVehicles,
  parkedVehicles,
  clamp,
  vehicleContact,
}) {
  let events = [];

  function accelerate(dt) {
    if (keys.up && player.battery > 0 && !keys.handbrake)
      player.speed += settings.acceleration * dt;
    if (keys.down) player.speed -= settings.braking * dt;
    if (!keys.up && !keys.down) player.speed *= Math.pow(settings.drag, dt);
    if (keys.handbrake) {
      player.speed =
        Math.sign(player.speed) * Math.max(0, Math.abs(player.speed) - settings.handbrake * dt);
    }
    player.speed = clamp(player.speed, settings.reverseSpeed, settings.forwardSpeed);
    if (Math.abs(player.speed) < settings.stopThreshold) player.speed = 0;
  }

  function steer(dt) {
    const direction = Number(Boolean(keys.right)) - Number(Boolean(keys.left));
    const speed = Math.abs(player.speed);
    if (direction && speed > settings.steeringThreshold) {
      const rate =
        (settings.turnRate * Math.min(speed / 6, 1)) / (1 + Math.max(speed - 9, 0) * 0.06);
      const turn = direction * rate * dt * Math.sign(player.speed) * (keys.handbrake ? 1.3 : 1);
      player.heading += turn;
      if (keys.handbrake && speed > 5) player.slip = clamp(player.slip - turn * 0.85, -0.48, 0.48);
    }
    player.slip *= Math.exp(-dt * (keys.handbrake ? 1.2 : 5));
    if (speed < 1) player.slip = 0;
  }

  function restorePosition(previous) {
    player.x = previous.x;
    player.z = previous.z;
    player.speed = 0;
  }

  function move(dt, previous) {
    const heading = player.heading + player.slip;
    player.x = clamp(player.x + Math.sin(heading) * player.speed * dt, bounds.minX, bounds.maxX);
    player.z = clamp(player.z - Math.cos(heading) * player.speed * dt, bounds.minZ, bounds.maxZ);
    if (!roadNetwork.isDrivable(player.x, player.z)) {
      events.push({ type: 'impact', speed: Math.abs(player.speed) });
      restorePosition(previous);
    }
  }

  function resolveContact(vehicle, previous, moving) {
    const contact = vehicleContact(player, vehicle);
    if (!contact) return;
    events.push({
      type: 'impact',
      speed: Math.abs(player.speed) + (moving ? vehicle.speed * 0.25 : 0),
    });
    const x = player.x + contact.x * (contact.depth + 0.03);
    const z = player.z + contact.z * (contact.depth + 0.03);
    if (!roadNetwork.isDrivable(x, z)) {
      restorePosition(previous);
      return;
    }
    player.x = moving ? clamp(x, bounds.minX, bounds.maxX) : x;
    player.z = moving ? clamp(z, bounds.minZ, bounds.maxZ) : z;
    player.speed = 0;
  }

  function consumeBattery(dt) {
    player.battery = Math.max(
      0,
      player.battery - Math.abs(player.speed) * dt * settings.batteryDrain,
    );
    if (player.battery > 0) return;
    player.battery = 100;
    player.speed = 0;
    events.push({ type: 'recharged' });
  }

  function updatePhysics(dt) {
    events = [];
    const previous = { x: player.x, z: player.z };
    accelerate(dt);
    steer(dt);
    move(dt, previous);
    for (const vehicle of movingVehicles) resolveContact(vehicle, previous, true);
    for (const vehicle of parkedVehicles) resolveContact(vehicle, previous, false);
    consumeBattery(dt);
    return events;
  }

  return Object.freeze({ updatePhysics });
};
