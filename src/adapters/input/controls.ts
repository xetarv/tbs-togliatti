'use strict';

type MovementControl = Exclude<keyof ControlsState, 'action'>;

window.TBS.createInput = function ({
  listen,
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
}: InputOptions): void {
  const controlsByCode: Partial<Record<string, MovementControl>> = {
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

  const controlsByKey: Partial<Record<string, MovementControl>> = {
    w: 'up',
    ц: 'up',
    s: 'down',
    ы: 'down',
    a: 'left',
    ф: 'left',
    d: 'right',
    в: 'right',
  };

  function movementKey(e: KeyboardEvent): MovementControl | undefined {
    return controlsByCode[e.code] || controlsByKey[String(e.key).toLowerCase()];
  }

  listen(window, 'keydown', (e: KeyboardEvent) => {
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

  listen(window, 'keyup', (e: KeyboardEvent) => {
    const control = movementKey(e);
    if (control) keys[control] = false;
  });

  listen(window, 'blur', () => {
    resetControls();
    if (state.mode === 'playing') togglePause();
  });

  listen(document, 'visibilitychange', () => {
    if (document.hidden && state.mode === 'playing') togglePause();
    resetFrameClock();
  });

  document.querySelectorAll<HTMLButtonElement>('.touch button').forEach((btn) => {
    // Fixed index.html touch buttons all declare keys from ControlsState; verified with the markup.
    const k = btn.dataset.key as keyof ControlsState;
    listen(btn, 'pointerdown', (e: PointerEvent) => {
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
    listen(btn, 'pointerup', release);
    listen(btn, 'pointercancel', release);
    listen(btn, 'lostpointercapture', release);
  });
};
