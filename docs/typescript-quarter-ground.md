# Quarter ground TypeScript migration

Stage 34 migrates only `src/adapters/world/showcase/ground.ts`, reusing QuarterGroundOptions.
The existing strict compiler emits classic `dist/adapters/world/showcase/ground.js`.
Only that script path changes in index.html; order and markup remain unchanged.
There are 38 production TS modules plus the technical build-smoke fixture.

## Contract additions

RoadSurface now returns the actual MeshStandardMaterial from visualAssets.material.
Existing material declarations gain nullable bump/roughness maps and numeric bumpScale,
roughness and metalness. Texture gains actual clone, repeat.set and needsUpdate members.
The existing scene.userData declaration uses a shared dictionary type with the optional
six quarterMaterials entries. No duplicate scene declaration, cast, any or suppression is added.
Actual JS implementations were checked for these additions and remain unchanged.

## Focused equivalence

Original/generated executable ASTs match. A compact comparison uses bundled Three.js r149,
unchanged extracted box/flat/roadSurface/material/roadInstances helpers, real geometry,
materials and DataTexture clones. Small deterministic source maps and a recording Canvas
fixture check this adapter without rebuilding a city or generating a large diagnostic corpus.

Before/after comparisons verify operation order, all four objects, geometry attributes/index,
coordinates/scales, materials, cloned bump/roughness maps, repeat/update values, preserved
source textures, Canvas wear gradients/stops/rectangles and instance matrices. All six stored
quarterMaterials retain the original references. No random source or production draw changes.
Fixtures, originals and compact results stay outside Git in `tbs-ground-stage34-20261014`.

## Project checks and scope

Validation uses `npm run build`, `npm run check`, `npm run build`, `npm run test`, followed
by the existing Edge file:// smoke. The existing 49 tests are unchanged. Browser smoke covers
startup/driving, pause/resume, camera/audio, resize, presets and mobile touch without errors.
It is not a separate pixel/GPU audit; no whole-game pixel identity is claimed.

Other game modules, shaders, algorithms, dependencies, renderer and build system are unchanged.
Existing diagnostic files are retained; overwritten smoke screenshot names are backed up,
restored and hash-verified. No commit or push is performed.
