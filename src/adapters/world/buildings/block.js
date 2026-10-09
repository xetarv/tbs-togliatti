'use strict';
window.TBS.createBuildingBuilder = function (options) {
  const { makeTexture, mat } = options;
  const shopSigns = ['КАФЕ', 'МАРКЕТ', 'СЕРВИС ТБС'].map((title) =>
    makeTexture(
      (p, w, h) => {
        p.fillStyle = '#102c35';
        p.fillRect(0, 0, w, h);
        p.fillStyle = '#ff5719';
        p.fillRect(0, h - 7, w, 7);
        p.fillStyle = '#ffffff';
        p.font = '800 61px Segoe UI,Arial';
        p.textAlign = 'center';
        p.textBaseline = 'middle';
        p.fillText(title, w / 2, h / 2, w - 35);
      },
      512,
      96,
    ),
  );
  const solarMat = mat(0x193b61, 0.65, 0.21);
  function building(specification) {
    const context = { ...options, ...specification, shopSigns, solarMat };
    Object.assign(context, window.TBS.buildBuildingShell(context));
    window.TBS.buildBuildingWindows(context);
    window.TBS.buildOfficeDetails(context);
    window.TBS.buildBuildingRoof(context);
    window.TBS.buildBuildingTrim(context);
    window.TBS.buildBuildingEntrance(context);
    window.TBS.buildStorefront(context);
  }
  return { solarMat, building };
};
