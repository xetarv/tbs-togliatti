'use strict';

globalThis.TBS.application.createSession = function ({
  state,
  controls,
  audio,
  overlay,
  notifications,
  clock,
  missions,
}) {
  function start() {
    state.mode = 'playing';
    audio.beginSound();
    overlay.hide();
    clock.reset();
    notifications.showToast('Смена ТБС началась · W — вперёд, S — назад');
  }

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
