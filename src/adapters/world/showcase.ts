'use strict';
window.TBS.createShowcase = function (options: ShowcaseOptions): ShowcaseModels {
  function showcaseQuarter(x: number, z: number): void {
    const context = { ...options, x, z, ...window.TBS.createQuarterMaterials(options) };
    window.TBS.buildQuarterGround(context);
    Object.assign(context, window.TBS.buildQuarterStructure(context));
    window.TBS.buildQuarterWindows(context);
    Object.assign(context, window.TBS.buildQuarterRoof(context as QuarterStructureContext));
    window.TBS.buildQuarterPavilion(context as QuarterRoofContext);
    window.TBS.buildQuarterBranding(context);
    window.TBS.buildQuarterLandscape(context);
    window.TBS.buildQuarterLighting(context);
    window.TBS.buildQuarterCladding(context as QuarterStructureContext);
  }
  return { showcaseQuarter };
};
