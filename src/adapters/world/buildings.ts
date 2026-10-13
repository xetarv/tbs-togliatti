'use strict';
window.TBS.createBuildings = function (options: BuildingsOptions): BuildingModels {
  const reflectionBuildings: BuildingModels['reflectionBuildings'] = [];
  const resources = { reflectionBuildings };
  Object.assign(resources, window.TBS.createFacadeLighting({ ...options, ...resources }));
  Object.assign(
    resources,
    window.TBS.createBuildingBuilder({ ...options, ...(resources as BuildingsWithLighting) }),
  );
  Object.assign(
    resources,
    window.TBS.createPavilionBuilder({ ...options, ...(resources as BuildingsWithBuilder) }),
  );
  Object.assign(
    resources,
    window.TBS.createIndustrialBuilder({ ...options, ...(resources as BuildingsWithPavilion) }),
  );
  return resources as BuildingModels;
};
