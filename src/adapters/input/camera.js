'use strict';

window.TBS.createCameraControls = function ({
  camera,
  sky,
  renderer,
  player,
  showToast,
  state,
  clamp,
  T,
  getElement,
}) {
  let mouseCamera = false,
    cameraYaw = 0,
    cameraPitch = 0.42,
    cameraDrag = null,
    cameraZoom = 1;

  const cameraButton = getElement('cameraBtn'),
    viewCanvas = renderer.domElement;

  function toggleMouseCamera() {
    mouseCamera = !mouseCamera;
    cameraDrag = null;
    cameraYaw = -player.heading;
    cameraPitch = 0.42;
    cameraButton.setAttribute('aria-pressed', String(mouseCamera));
    cameraButton.textContent = mouseCamera ? 'Камера: мышь' : 'Камера: авто';
    showToast(
      mouseCamera
        ? 'Камера: зажмите левую кнопку мыши и двигайте мышь · C — авто'
        : 'Автоматическая камера включена',
    );
  }

  cameraButton.addEventListener('click', toggleMouseCamera);

  viewCanvas.addEventListener(
    'wheel',
    (e) => {
      if (state.mode !== 'playing') return;
      e.preventDefault();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      cameraZoom = clamp(cameraZoom * Math.exp(clamp(delta, -200, 200) * 0.0015), 0.5, 2.2);
    },
    { passive: false },
  );

  viewCanvas.addEventListener('pointerdown', (e) => {
    if (!mouseCamera || state.mode !== 'playing' || e.button !== 0) return;
    cameraDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    viewCanvas.setPointerCapture(e.pointerId);
  });

  viewCanvas.addEventListener('pointermove', (e) => {
    if (!cameraDrag || cameraDrag.id !== e.pointerId || state.mode !== 'playing') return;
    // Mouse right turns the view right; mouse down looks down.
    cameraYaw -= (e.clientX - cameraDrag.x) * 0.005;
    cameraPitch = clamp(cameraPitch + (e.clientY - cameraDrag.y) * 0.004, 0.12, 1.15);
    cameraDrag.x = e.clientX;
    cameraDrag.y = e.clientY;
  });

  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    viewCanvas.addEventListener(event, () => {
      cameraDrag = null;
    });

  addEventListener('blur', () => {
    cameraDrag = null;
  });

  const cameraForward = new T.Vector3(),
    cameraWanted = new T.Vector3();
  function updateCamera(dt) {
    const forward = cameraForward.set(Math.sin(player.heading), 0, -Math.cos(player.heading));
    const wanted = cameraWanted.set(
      player.x - forward.x * 16 * cameraZoom,
      2.5 + (8 + Math.abs(player.speed) * 0.025) * cameraZoom,
      player.z - forward.z * 16 * cameraZoom,
    );
    if (mouseCamera) {
      wanted.set(
        player.x + Math.sin(cameraYaw) * 19 * cameraZoom * Math.cos(cameraPitch),
        2.5 + 19 * cameraZoom * Math.sin(cameraPitch),
        player.z + Math.cos(cameraYaw) * 19 * cameraZoom * Math.cos(cameraPitch),
      );
    }
    camera.position.lerp(wanted, 1 - Math.exp(-dt * 5));
    if (mouseCamera) camera.lookAt(player.x, 2.5, player.z);
    else camera.lookAt(player.x + forward.x * 8, 2.5, player.z + forward.z * 8);
    sky.position.copy(camera.position);
    sky.material.uniforms.skyTime.value = state.elapsed;
  }
  return { toggleMouseCamera, updateCamera };
};
