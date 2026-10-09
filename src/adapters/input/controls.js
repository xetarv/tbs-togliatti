'use strict';

window.TBS.createInput = function ({
  keys,
  resetControls,
  resetFrameClock,
  state,
  toggleDaylight,
  getSound,
  beginSound,
  toggleSound,
  togglePause,
  interact,
  toggleMouseCamera,
}) {
  const controlsByCode = {
    Space: 'handbrake',
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };

  const controlsByKey = {
    w: 'up',
    ц: 'up',
    s: 'down',
    ы: 'down',
    a: 'left',
    ф: 'left',
    d: 'right',
    в: 'right',
  };

  function movementKey(e) {
    return controlsByCode[e.code] || controlsByKey[String(e.key).toLowerCase()];
  }

  addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLElement && e.target.closest('select,input,textarea')) return;
    if (e.code === 'KeyC') {
      e.preventDefault();
      if (!e.repeat) toggleMouseCamera();
      return;
    }
    if (e.code === 'KeyN') {
      e.preventDefault();
      if (!e.repeat) toggleDaylight();
      return;
    }
    if (e.code === 'KeyM') {
      e.preventDefault();
      if (!e.repeat) toggleSound();
      return;
    }
    const sound = getSound();
    if (state.mode === 'playing' && (!sound || sound.context.state === 'suspended')) beginSound();
    const action = e.code === 'KeyE';
    const pause = e.code === 'KeyP' || e.code === 'Escape';
    const control = movementKey(e);
    if (control || action || pause) e.preventDefault();
    if (pause) {
      if (!e.repeat) togglePause();
      return;
    }
    if (action) {
      if (!e.repeat) interact();
      return;
    }
    if (control && state.mode === 'playing') keys[control] = true;
  });

  addEventListener('keyup', (e) => {
    const control = movementKey(e);
    if (control) keys[control] = false;
  });

  addEventListener('blur', () => {
    resetControls();
    if (state.mode === 'playing') togglePause();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'playing') togglePause();
    resetFrameClock();
  });

  document.querySelectorAll('.touch button').forEach((btn) => {
    const k = btn.dataset.key;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state.mode !== 'playing') return;
      btn.setPointerCapture(e.pointerId);
      btn.classList.add('active');
      if (k === 'action') interact();
      else keys[k] = true;
    });
    const release = () => {
      btn.classList.remove('active');
      keys[k] = false;
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
  });
};
