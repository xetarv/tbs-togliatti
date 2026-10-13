# Bootstrap world: TypeScript boundary

Only `src/bootstrap/world.js` was migrated to `src/bootstrap/world.ts`. Its generated classic
script is `dist/bootstrap/world.js`, loaded at the same position in `index.html`. The existing
`window.TBS.buildWorld({ T, canvas, config })` API and returned object remain unchanged.

## Checked construction contracts

`types/world-contracts.d.ts` reuses the existing configuration, Three.js boundary handles and
presentation resource types. It describes the scene, geometry helpers, vegetation-culling API,
visual-assets factory, assembled resources, drone models, road/park/building/showcase helpers
and population output. The signatures and resource names come from the current implementations.
Five destructured input projections use the actual parameter keys of their JS factories.

The compiled bootstrap now checks these eleven construction boundaries:

1. `createScene`: library/canvas to scene, renderer, camera, lights and sky resources.
2. `createGeometryHelpers`: library to wedge/detail helpers.
3. `createVegetationCulling`: library and optional boolean to add/register/bounds/partition/toggle.
4. `createWorldResources`: construction options, embedded assets, asphalt maps and visual-assets
   factory to the real material, texture, geometry, array and helper outputs.
5. `createDroneModels`: required resources to the drone-model factory.
6. `createTerrain`: its actual scene, geometry, world-state, vegetation and resource inputs.
7. `createRoads`: actual road inputs to road-instances/sidewalk/bus-stop helpers.
8. `createParks`: actual resource inputs plus the drone-model factory to park helpers.
9. `createBuildings`: world context, drone factory and showcase-tree helper to building helpers,
   reflection records, lights and solar material.
10. `createShowcase`: world context, road/building helper groups to the quarter constructor.
11. `populateWorld`: its actual input projection to parking records, landmarks and district labels.

`BuiltWorld` checks the returned assembly against these outputs and the existing `BootstrapWorld`
consumer contract. Road, park and showcase helpers remain intermediate inputs: they are not added
to the returned world. Forwarded configuration arrays and constructed object references are retained.

`WorldConstructionState` is distinct from `GameState` and `PresentationState`. The initial train
and central-square references remain nullable. The previous `PresentationWorldState` name is a type
alias for compatibility; it never represented the visual state. No readiness assertion was added.

`TBS_EMBEDDED` remains optional with the same `|| {}` fallback; `TBS_ASPHALT031` remains optional
and has the actual map/normalMap/roughnessMap keys. The URL flag still disables vegetation culling
only when `vegetationCulling=0`. No resource generation or optimization implementation was modified.

## Verification and limits

The emitted executable AST matches the original JavaScript. A before/after wiring check covers
four combinations of URL flags and present/absent embedded assets. It checks factory/spread order,
dependency references, shared mutable world state, asset forwarding/fallback and returned keys and
references. Eleven isolated negative compiler checks reject incorrect inputs, one per factory.
Positive consumer assignments confirm compatibility with game and presentation bootstrap.
The additional Box3/InstancedMesh discriminator declarations were checked against bundled r149.

Run the existing sequence:

```sh
npm run build
npm run check
npm run build
npm run test:browser
```

The 49 existing tests are retained; only the world script path in the vegetation load-order
assertion is updated to `dist/bootstrap/world.js`. The Edge smoke test creates the actual world through
`file://` and exercises startup/HUD, driving, pause/resume, camera, lighting, sound controls,
graphics presets, resize and mobile controls. This is not a full visual or performance audit.

JS adapter bodies and their nested builders remain outside static checking. Boundary declarations
are based on their actual inputs/outputs; they do not infer implementation correctness. Complete
Three.js constructors, geometry contents, shaders, userData and mutable construction readiness
remain unchecked. The `createBuildings`/`createShowcase` contexts also cover forwarded resources
used by deferred JS builders. No casts, suppression directives, broad any types, dependencies or
runtime imports were introduced. Existing migration changes and diagnostics are preserved.
