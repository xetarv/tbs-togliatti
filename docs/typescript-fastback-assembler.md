# Fastback assembler TypeScript migration

Stage 24 migrates only `vehicles/fastback.ts`; all seven component JS modules remain unchanged.
The existing strict build emits classic `dist/adapters/vehicles/fastback.js`. Only that path
changes in index.html, retaining script order. There are 30 production TS modules, plus the
technical build-smoke fixture. Previous drone migrations remain uncommitted and preserved.

## Actual staged contracts

The new fastback declaration file describes the real materials, geometry helpers, interior
steering group, wheel records and spotlight array returned by the existing factories. Inputs
are projections of actual destructured parameters. Mesh-data panels describe the fields used
by exterior; no geometry data is modified. Existing world/texture and bootstrap types are reused.

Parts start with only car/body. Separate material, geometry, interior, wheel and complete
intersection types describe each real stage. Object.assign does not widen its target variable
in TypeScript, so local stage assertions follow the preceding assignments. Each assignment's
inferred result is also checked with satisfies. These erased annotations preserve runtime
mutations, spread order and references. The userData literal is checked with satisfies before
the returned car type is narrowed to its now-populated data. No all-fields-present initial
parts type, any, double cast, suppression, runtime helper or event refactor is introduced.

Consumed r149 contracts cover children with an actual isMesh discriminator, geometry/material
identity (including material arrays), Matrix4, updateMatrix, InstancedMesh/setMatrixAt,
remove/add, shadow flags, group name/userData, physical/standard materials and spotlights.
Declarations remain partial. JS factory implementations are not statically checked internally;
their real outputs and links are checked by the focused runtime comparison.

## Equivalence and visual limitation

Emitted/original executable ASTs match. Actual component factories, mesh assets, brand image,
Canvas texture helper and vehicle shadow texture are used in test Edge. Comparisons confirm
factory order, every accumulated parts reference, userData references/scalars, geometry arrays,
materials, texture pixels, transform and instance data. Material grouping retains the original
greater-than-two threshold; smaller groups remain meshes. Batch matrices match original
transforms at Float32 precision, originals are removed and both shadow flags remain enabled.

Four views/states exercise shadows, body movement, wheel/steering references and brake color.
The pixel comparison is inconclusive: repeated controls of the original also vary, both with
a reused renderer and fresh pages. Observed reused-renderer differences were small and local,
but are not claimed as pixel identity or attributed conclusively to a specific GPU cause.
Additional warm renders did not stabilize the control. No graphics settings were reduced and
no production change was made to accommodate the test. AST and exact car-data equivalence
passed; a deterministic external graphics comparison remains a separate verification limit.

Originals, focused fixtures, images and diagnostic results remain outside Git in the local
`tbs-fastback-stage24-20261013` verification folder.

## Project verification and scope

Use `npm run build`, `npm run check`, `npm run build` and the existing Edge file:// smoke.
The existing 49 tests are unchanged. Smoke covers launch/driving, pause/resume, camera,
HUD, audio, resize, graphics presets and mobile controls without browser errors.
Previous 29 TS sources, all seven component sources and diagnostic screenshots are preserved.
No physics, geometry, materials, optimizations, dependency, compiler or security setting changes.
No commit or push is performed. Car-model can be considered next as a separately scoped task;
its actual consumers will need further precise Three.js contracts.
