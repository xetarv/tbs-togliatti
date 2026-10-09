const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModules } = require('./helpers.cjs');

function setupInput() {
  const listeners = new Map();
  const actions = [];
  const document = { hidden: false, addEventListener() {}, querySelectorAll: () => [] };
  class HTMLElement {
    constructor(editable = false) {
      this.editable = editable;
    }
    closest() {
      return this.editable;
    }
  }
  const { TBS } = loadModules(['domain/state.js', 'adapters/input/controls.js'], {
    document,
    HTMLElement,
    performance: { now: () => 10 },
    addEventListener: (name, handler) => listeners.set(name, handler),
  });
  const state = TBS.createState();
  state.mode = 'playing';
  TBS.createInput({
    state,
    keys: state.keys,
    resetControls: () => TBS.resetControls(state.keys),
    resetFrameClock() {},
    getSound: () => ({ context: { state: 'running' } }),
    beginSound() {},
    toggleDaylight() {},
    toggleSound() {},
    toggleMouseCamera() {},
    interact: () => actions.push('interact'),
    togglePause: () => {
      state.mode = state.mode === 'playing' ? 'paused' : 'playing';
    },
  });
  function emit(name, values = {}) {
    listeners.get(name)({
      target: new HTMLElement(),
      code: '',
      key: '',
      preventDefault() {},
      ...values,
    });
  }
  return { state, actions, emit, HTMLElement };
}

test('physical WASD works with Russian labels and arrows release the same action', () => {
  const { state, emit } = setupInput();
  emit('keydown', { code: 'KeyW', key: 'ц' });
  assert.equal(state.keys.up, true);
  emit('keyup', { code: 'KeyW', key: 'ц' });
  assert.equal(state.keys.up, false);
  emit('keydown', { code: 'ArrowLeft', key: 'ArrowLeft' });
  assert.equal(state.keys.left, true);
  emit('keyup', { code: 'ArrowLeft' });
  assert.equal(state.keys.left, false);
});

test('cargo keys do not repeat, and Space is only a handbrake', () => {
  const { state, actions, emit } = setupInput();
  emit('keydown', { code: 'KeyE' });
  emit('keydown', { code: 'KeyE', repeat: true });
  assert.deepEqual(actions, ['interact']);
  emit('keydown', { code: 'Space' });
  assert.equal(state.keys.handbrake, true);
  assert.equal(actions.length, 1);
});

test('focus loss clears held keys and pauses the shift', () => {
  const { state, emit } = setupInput();
  emit('keydown', { code: 'KeyW' });
  emit('blur');
  assert.equal(state.keys.up, false);
  assert.equal(state.mode, 'paused');
});

test('paused or editable controls do not queue acceleration', () => {
  const { state, emit, HTMLElement } = setupInput();
  emit('keydown', { code: 'KeyW', target: new HTMLElement(true) });
  assert.equal(Boolean(state.keys.up), false);
  state.mode = 'paused';
  emit('keydown', { code: 'KeyW' });
  assert.equal(Boolean(state.keys.up), false);
});
