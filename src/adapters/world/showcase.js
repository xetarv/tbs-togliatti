'use strict';
window.TBS.createShowcase = function (options) {
  function showcaseQuarter(x, z) {
    const context = { ...options, x, z, ...window.TBS.createQuarterMaterials(options) };
    window.TBS.buildQuarterGround(context);
    Object.assign(context, window.TBS.buildQuarterStructure(context));
    window.TBS.buildQuarterWindows(context);
    Object.assign(context, window.TBS.buildQuarterRoof(context));
    window.TBS.buildQuarterPavilion(context);
    window.TBS.buildQuarterBranding(context);
    window.TBS.buildQuarterLandscape(context);
    window.TBS.buildQuarterLighting(context);
    window.TBS.buildQuarterCladding(context);
  }
  return { showcaseQuarter };
};
