'use strict';

window.TBS.createDom = function (document: Document): BootstrapDom {
  const elements = new Map<string, HTMLElement>();
  function getElement(id: string): HTMLElement {
    if (!elements.has(id)) {
      const element = document.getElementById(id);
      if (!element) throw new Error('Missing game element: ' + id);
      elements.set(id, element);
    }
    // The missing entry above is populated or throws before this lookup.
    return elements.get(id)!;
  }
  // Both fixed IDs are canvas elements in index.html.
  const canvas = getElement('game') as HTMLCanvasElement,
    mini = getElement('minimap') as HTMLCanvasElement,
    mctx = mini.getContext('2d');
  if (!mctx) throw new Error('Мини-карта недоступна: браузер не поддерживает Canvas 2D.');
  return { getElement, canvas, mini, mctx };
};
