'use strict';

/** @typedef {'intro' | 'playing' | 'paused'} GameMode */
/** @typedef {0 | 1} MissionStage 0: heading to pickup; 1: carrying cargo to delivery. */

/**
 * Sparse controls: an absent field is inactive. The dictionary has a null prototype.
 * @typedef {object} ControlsState
 * @property {boolean} [up]
 * @property {boolean} [down]
 * @property {boolean} [left]
 * @property {boolean} [right]
 * @property {boolean} [handbrake]
 * @property {boolean} [action] Touch-button release records false; interaction is dispatched directly.
 */

/**
 * Mutable player data shared by simulation and presentation adapters.
 * @typedef {object} PlayerState
 * @property {number} x World position on the horizontal X axis.
 * @property {number} z World position on the horizontal Z axis.
 * @property {number} heading Heading in radians.
 * @property {number} speed Signed world units per second; negative means reverse.
 * @property {number} battery Charge percentage, from 0 to 100.
 * @property {number} slip Movement-angle offset from heading, in radians.
 */

/**
 * Authoritative mutable game state. Mission progress is stored directly on this object.
 * Presentation timing, lighting and visual effects belong to a separate object.
 * @typedef {object} GameState
 * @property {GameMode} mode
 * @property {number} missionIndex Zero-based index into the configured mission list.
 * @property {MissionStage} stage
 * @property {number} deliveries Number of completed deliveries.
 * @property {number} credits Accumulated mission rewards.
 * @property {PlayerState} player
 * @property {ControlsState} keys
 */

/**
 * Clear existing control fields in place without adding missing fields.
 * @param {ControlsState} keys
 * @returns {void}
 */
globalThis.TBS.domain.resetControls = function (keys) {
  for (const key of /** @type {(keyof ControlsState)[]} */ (Object.keys(keys))) keys[key] = false;
};

/** @returns {GameState} A fresh game state with its own player and control objects. */
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
