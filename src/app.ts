'use strict';

(() => {
  const api = window.TBS;
  function reportError(error: unknown) {
    console.error(error);
    let message: string;
    try {
      message =
        error !== null &&
        (typeof error === 'object' || typeof error === 'function') &&
        'message' in error
          ? String(error.message)
          : String(error);
    } catch {
      // Keep the original value in the console even if its getters/coercion fail.
      message = 'Не удалось получить описание ошибки';
    }
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'Ошибка запуска 3D: ' + message;
      toast.classList.add('show');
    }
    const startButton = document.getElementById('startBtn') as HTMLButtonElement | null;
    if (startButton) startButton.disabled = true;
  }
  addEventListener('error', (event) => reportError(event.error || new Error(event.message)));

  try {
    const dom = api.createDom(document);
    if (!window.THREE) {
      dom.getElement('overlayCopy').textContent =
        'Не удалось загрузить локальную библиотеку 3D. Проверьте, что папка assets находится рядом с index.html.';
      (dom.getElement('startBtn') as HTMLButtonElement).disabled = true;
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
