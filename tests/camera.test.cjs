const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../assets/three.min.js');
const { loadModules } = require('./helpers.cjs');

test('camera drag and zoom affect the live camera after toggling mouse control', () => {
  const handlers = new Map();
  const canvas = {
    addEventListener: (name, handler) => handlers.set(name, handler),
    setPointerCapture() {},
  };
  const button = { setAttribute() {}, addEventListener() {} };
  const { TBS } = loadModules(['domain/math.js', 'domain/state.js', 'adapters/input/camera.js'], {
    addEventListener() {},
    innerHeight: 768,
  });
  const state = TBS.createState();
  state.mode = 'playing';
  const camera = new T.PerspectiveCamera();
  const sky = new T.Object3D();
  sky.material = { uniforms: { skyTime: { value: 0 } } };
  const controls = TBS.createCameraControls({
    T,
    state,
    player: state.player,
    ...TBS.math,
    camera,
    sky,
    renderer: { domElement: canvas },
    getElement: () => button,
    showToast() {},
  });
  controls.toggleMouseCamera();
  controls.updateCamera(10);
  const before = camera.position.clone();
  handlers.get('pointerdown')({ pointerId: 1, clientX: 0, clientY: 0, button: 0 });
  handlers.get('pointermove')({ pointerId: 1, clientX: 100, clientY: 50 });
  controls.updateCamera(10);
  assert.ok(camera.position.distanceTo(before) > 5);
  const focus = new T.Vector3(state.player.x, 2.5, state.player.z);
  const distanceBeforeZoom = camera.position.distanceTo(focus);
  handlers.get('wheel')({ deltaY: 100, deltaMode: 0, preventDefault() {} });
  controls.updateCamera(10);
  assert.ok(camera.position.distanceTo(focus) > distanceBeforeZoom);
  assert.equal(sky.position.distanceTo(camera.position), 0);
});
