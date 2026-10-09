'use strict';
window.TBS.createBuildings = function (options) {
  const reflectionBuildings = [];
  const resources = { reflectionBuildings };
  Object.assign(resources, window.TBS.createFacadeLighting({ ...options, ...resources }));
  Object.assign(resources, window.TBS.createBuildingBuilder({ ...options, ...resources }));
  Object.assign(resources, window.TBS.createPavilionBuilder({ ...options, ...resources }));
  Object.assign(resources, window.TBS.createIndustrialBuilder({ ...options, ...resources }));
  return resources;
};
