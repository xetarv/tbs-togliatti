'use strict';

window.TBS.createDrones = function ({ state, player, createDrone }) {
  const escortDrone = createDrone();

  const ambientDrones = Array.from({ length: 5 }, (_, i) => ({
    model: createDrone(),
    baseX: 35 + i * 42,
    baseZ: 21 + (i % 2) * 80,
    phase: i * 1.7,
  }));
  function updateDrones() {
    escortDrone.group.visible = state.stage === 1;
    if (state.stage === 1) {
      escortDrone.group.position.set(
        player.x + Math.cos(state.elapsed * 2) * 3.8,
        5.5 + Math.sin(state.elapsed * 3) * 0.25,
        player.z + Math.sin(state.elapsed * 2) * 3.8,
      );
      escortDrone.rotors.forEach((r, i) => (r.rotation.y = state.elapsed * 22 * (i % 2 ? 1 : -1)));
    }
    for (const d of ambientDrones) {
      d.model.group.position.set(
        d.baseX + Math.sin(state.elapsed * 0.38 + d.phase) * 6,
        11 + Math.sin(state.elapsed * 2 + d.phase) * 0.5,
        d.baseZ + Math.cos(state.elapsed * 0.32 + d.phase) * 4,
      );
      d.model.rotors.forEach((r, i) => (r.rotation.y = state.elapsed * 23 * (i % 2 ? 1 : -1)));
    }
  }
  return { updateDrones };
};
