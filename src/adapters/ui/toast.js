'use strict';

window.TBS.createToast = function ({ getElement }) {
  let toastTimer = 0;
  function showToast(message) {
    const el = getElement('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  }
  return { showToast };
};
