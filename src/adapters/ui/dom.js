'use strict';

window.TBS.createDom = function (document) {
  const elements = new Map();
  function getElement(id) {
    if (!elements.has(id)) {
      const element = document.getElementById(id);
      if (!element) throw new Error('Missing game element: ' + id);
      elements.set(id, element);
    }
    return elements.get(id);
  }
  const canvas = getElement('game'),
    mini = getElement('minimap'),
    mctx = mini.getContext('2d');
  if (!mctx) throw new Error('Мини-карта недоступна: браузер не поддерживает Canvas 2D.');
  return { getElement, canvas, mini, mctx };
};
