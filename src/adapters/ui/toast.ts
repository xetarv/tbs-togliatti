'use strict';

window.TBS.createToast = function ({
  getElement,
}: Pick<BootstrapDom, 'getElement'>): GameFramePorts['notifications'] {
  let toastTimer = 0;
  function showToast(message: string): void {
    const el = getElement('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }
  return { showToast };
};
