'use strict';

globalThis.TBS.domain.createMissionRoutes = function ({
  missions,
  state,
  player,
  distance,
  missionRules,
}) {
  const currentMission = () => missions[state.missionIndex];

  const target = () => (state.stage === 0 ? currentMission().from : currentMission().to);
  function tryInteract() {
    if (state.mode !== 'playing') return { status: 'inactive' };
    const point = target();
    if (distance(player, point) > missionRules.interactionRadius) return { status: 'too-far' };
    if (Math.abs(player.speed) > missionRules.maximumSpeed) return { status: 'too-fast' };
    if (state.stage === 0) {
      state.stage = 1;
      return { status: 'pickup', point };
    }
    const reward = currentMission().reward;
    state.credits += reward;
    state.deliveries++;
    player.battery = 100;
    state.missionIndex = (state.missionIndex + 1) % missions.length;
    state.stage = 0;
    return { status: 'delivery', point, reward };
  }

  return { currentMission, target, tryInteract };
};
