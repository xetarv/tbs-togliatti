# Quarter lighting TypeScript migration

Stage 37 migrates only `showcase/lighting.ts`, reusing QuarterLightingOptions.
The existing strict build emits classic `dist/adapters/world/showcase/lighting.js`.
Only its script path changes in index.html, in the same loading position.
There are 41 production TS modules plus the technical build-smoke fixture.
Stages 34–36 remain intact. No commit or push is performed.

## Consumed contracts

Existing structural declarations gain the actual MeshStandardMaterial constructor and
consumed emissive/roughness parameters, AdditiveBlending (r149 value 2), basic-material
clone and blending, point-light color/intensity/distance/decay, and standard-material
emissive/emissiveIntensity. Scene userData gains optional QuarterLighting with the
three lights, shared materials and ordered reflective tuple (glazing, bronze, frame).
No casts, any, suppression, runtime checks or new allocations are introduced.
These are partial structural contracts; the JS rendering consumers remain unchecked.

## Focused equivalence

The complete executable AST of the original and emitted scripts matches, excluding
only source locations and literal spelling. The bundled actual Three.js r149 runs
both implementations at (110, 90), (-40, -25) and (0, 0). Native box/flat helpers are
extracted unchanged from world/resources.js into the external fixture.

All scenarios compare the order and parameters of constructors, scene additions,
five box calls and two flat calls; all ten scene objects; geometry attributes,
indices/groups, transforms/matrices, visibility and shadow flags; materials, colors,
emissive, roughness, opacity, blending, texture references and light parameters.
All three initial intensities remain zero. The contact clone is distinct, has
opacity 0.45 and shares the original texture; original contact stays unchanged.

Independent reference assertions cover entranceLight, windowLight, bounce,
lightStripMaterial, poolMaterial and all three ordered reflective materials.
Downstream intensity/emissive/opacity mutations reach the same scene objects.
Earlier quarterMaterials/showcaseQuarter references survive unchanged. This verifies
object data and operations; whole-scene pixel identity is not measured.

Originals, compact fixture, equivalence results and smoke screenshots are outside
Git in `tbs-lighting-stage37-20261014`. All pre-existing production TS sources,
generated showcase scripts and stage 34–36 reports are hash-inventoried before work.
Existing diagnostic file sizes/timestamps and smoke-image hashes are inventoried.

## Project validation

`npm run build`, `npm run check`, `npm run build`, `npm run test` all passed.
Strict TypeScript and all 49 tests passed; 42 classic scripts include 41 production
modules and the technical build-smoke fixture. `git diff --check` passed.

The existing headless Edge file:// smoke passed cold launch, driving, pause, camera,
lighting, audio control, resize, all graphics presets and mobile touch controls,
with no browser/WebGL errors or failed resource requests. Its launcher changes
only the screenshot output directory. This is not a whole-scene pixel comparison,
subjective sound assessment or performance measurement.

All 46 earlier source/output/report hashes and all 3181 prior diagnostic files
(size/timestamp), including existing smoke-image hashes, remain unchanged.
The HTML comparison confirms exactly one script-path replacement relative to the
stage 36 working copy. No test suite, dependency, compiler, game algorithm,
graphic setting, shader or security configuration changes.
