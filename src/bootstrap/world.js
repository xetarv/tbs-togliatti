'use strict';

window.TBS.buildWorld = function ({ T, canvas, config }) {
  const api = window.TBS;
  const { WORLD_W, WORLD_H, ROAD, roadsX, roadsZ, isParkBlock } = config;
  const worldState = { maglevTrain: null, centralSquare: null };
  const scene = api.createScene({ T, canvas });
  const geometry = api.createGeometryHelpers({ T });
  const vegetationCulling = api.createVegetationCulling({
    T,
    enabled: new URLSearchParams(location.search).get('vegetationCulling') !== '0',
  });
  const options = {
    T,
    WORLD_W,
    WORLD_H,
    ROAD,
    roadsX,
    roadsZ,
    isParkBlock,
    worldState,
    vegetationCulling,
    ...scene,
    ...geometry,
    createVisualAssets: api.createVisualAssets,
    embeddedAssets: window.TBS_EMBEDDED || {},
    asphaltMaps: window.TBS_ASPHALT031,
  };
  const resources = api.createWorldResources(options);
  const context = { ...options, ...resources };
  const droneModels = api.createDroneModels(context);
  api.createTerrain(context);
  const roads = api.createRoads(context);
  const parks = api.createParks({ ...context, ...droneModels });
  const buildings = api.createBuildings({ ...context, ...parks, ...droneModels });
  const showcase = api.createShowcase({ ...context, ...roads, ...buildings });
  const population = api.populateWorld({
    ...context,
    ...roads,
    ...parks,
    ...buildings,
    ...showcase,
  });
  return { ...context, ...droneModels, ...buildings, ...population };
};
