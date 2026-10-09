'use strict';

window.TBS.createOverlay = function ({ getElement }) {
  function hide() {
    getElement('overlay').classList.add('hidden');
  }

  function showPaused(missionTitle) {
    getElement('overlayChapter').textContent = 'ТБС · Пауза';
    getElement('overlayTitle').innerHTML = 'ПАУЗА<br><span>НА МАРШРУТЕ</span>';
    getElement('overlaySub').textContent = 'Тольятти ждёт вашего возвращения';
    getElement('overlayCopy').textContent =
      'Вы на задании «' + missionTitle + '». Продолжайте движение к оранжевому маяку.';
    getElement('startBtn').textContent = 'Продолжить →';
    getElement('overlay').classList.remove('hidden');
  }

  return Object.freeze({ hide, showPaused });
};
