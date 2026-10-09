'use strict';

(() => {
  const api = window.TBS;
  function reportError(error) {
    console.error(error);
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Ошибка запуска 3D: ' + error.message;
      toast.classList.add('show');
    }
    const startButton = document.getElementById('startBtn');
    if (startButton) startButton.disabled = true;
  }
  addEventListener('error', (event) => reportError(event.error || new Error(event.message)));

  try {
    const dom = api.createDom(document);
    if (!window.THREE) {
      dom.getElement('overlayCopy').textContent =
        'Не удалось загрузить локальную библиотеку 3D. Проверьте, что папка assets находится рядом с index.html.';
      dom.getElement('startBtn').disabled = true;
      return;
    }
    const T = window.THREE;
    T.ColorManagement.legacyMode = false;
    const state = api.domain.createState();
    const presentation = api.createPresentationState(state);
    const world = api.buildWorld({ T, canvas: dom.canvas, config: api.domain.config });
    const { runtime, session } = api.buildGame({ state, presentation, world, dom });
    runtime.start();
    if (new URLSearchParams(location.search).has('play')) session.start();
  } catch (error) {
    reportError(error);
  }
})();
