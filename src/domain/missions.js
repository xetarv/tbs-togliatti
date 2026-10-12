'use strict';

/** @typedef {{status: 'pickup', point: Readonly<MissionPoint>}} MissionPickup */
/** @typedef {{status: 'delivery', point: Readonly<MissionPoint>, reward: number}} MissionDelivery */
/** @typedef {MissionPickup | MissionDelivery} MissionSuccess */
/** @typedef {{status: 'inactive' | 'too-far' | 'too-fast'} | MissionSuccess} MissionInteractionResult */
/**
 * @typedef {object} MissionRoutes
 * @property {() => Readonly<MissionDefinition>} currentMission
 * @property {() => Readonly<MissionPoint>} target
 * @property {() => MissionInteractionResult} tryInteract
 */
/**
 * @typedef {object} MissionRoutesOptions
 * @property {readonly Readonly<MissionDefinition>[]} missions Nonempty configured list.
 * @property {GameState} state
 * @property {PlayerState} player
 * @property {GameMath['distance']} distance
 * @property {Readonly<MissionRules>} missionRules
 */
/** @param {MissionRoutesOptions} options @returns {MissionRoutes} */
globalThis.TBS.domain.createMissionRoutes = function ({
  missions,
  state,
  player,
  distance,
  missionRules,
}) {
  /** @returns {Readonly<MissionDefinition>} */
  const currentMission = () => missions[state.missionIndex];

  /** @returns {Readonly<MissionPoint>} */
  const target = () => (state.stage === 0 ? currentMission().from : currentMission().to);
  /** @returns {MissionInteractionResult} */
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
