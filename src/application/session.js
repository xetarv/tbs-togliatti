'use strict';

/**
 * @typedef {object} SessionOptions
 * @property {GameState} state
 * @property {{reset: () => void}} controls
 * @property {Pick<GameFramePorts['audio'], 'updateSound'> & {beginSound: () => void}} audio
 * @property {{hide: () => void, showPaused: (title: string) => void}} overlay
 * @property {GameFramePorts['notifications']} notifications
 * @property {{reset: () => void}} clock Frame-clock reset, not wall-clock time.
 * @property {Pick<MissionRoutes, 'currentMission'>} missions
 */
/** @typedef {{start: () => void, togglePause: () => void}} GameSession */
/** @param {SessionOptions} options @returns {Readonly<GameSession>} */
globalThis.TBS.application.createSession = function ({
  state,
  controls,
  audio,
  overlay,
  notifications,
  clock,
  missions,
}) {
  /** @returns {void} */
  function start() {
    state.mode = 'playing';
    audio.beginSound();
    overlay.hide();
    clock.reset();
    notifications.showToast('Смена ТБС началась · W — вперёд, S — назад');
  }

  /** @returns {void} */
  function togglePause() {
    if (state.mode === 'paused') {
      start();
      return;
    }
    if (state.mode !== 'playing') return;
    controls.reset();
    state.mode = 'paused';
    audio.updateSound(false);
    overlay.showPaused(missions.currentMission().title);
  }

  return Object.freeze({ start, togglePause });
};
