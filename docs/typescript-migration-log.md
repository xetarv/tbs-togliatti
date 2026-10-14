# TypeScript migration log

## Stage 38 — showcase structure and windows

- Migrated only `structure.js` and `windows.js` to strict TypeScript, using existing
  QuarterStructureOptions, QuarterStructure, QuarterCladdingPanel and QuarterWindowsOptions.
- Typed numeric wall/bay inputs and the mutable panel array. The existing Mesh declaration
  gains the actual r149 receiveShadow property. No runtime checks, casts or algorithm changes.
- Both modules remain classic scripts registered through window.TBS. The existing build
  generates dist files; index.html changes exactly two script paths without reordering.
- Total: 43 production TS modules, plus the technical build-smoke fixture.
- Both complete executable ASTs match their original JS. On bundled Three.js r149, two
  coordinate scenarios match geometry attributes/indices, shared materials, transforms,
  shadow flags, creation order, references and reflection records: 25 walls, 304 panels,
  27 window groups and 1137 window meshes (including three floor belts).
- Ten wall edge cases per scenario cover front/side tolerance, strict dimensions, alternate
  material, corner precedence and empty spans. Returned meshes, wall closure, mutable panel
  array and reflection-array identity are preserved. Actual unchanged roof and cladding
  builders receive the same panel data; their scene output and instance matrices/colors match.
- One shared `npm run build` + `npm run check` passed: strict types, 44 classic scripts
  (43 production modules plus fixture), lint/format and 49/49 tests. One additional
  `npm run test` and the existing Edge file:// smoke passed. Smoke covers startup, driving,
  pause, camera, lighting, audio, resizing, quality presets and mobile touch without errors.
- All 3349 earlier diagnostic files, old screenshot hashes and 84 prior source/output hashes
  are unchanged. Exactly two HTML paths change. Retained diagnostics: 10 external stage files,
  including two smoke images, original sources, inventory and compact verification code/logs.
  The existing build/check tools created 88 temporary JS copies; only these new duplicates
  were removed after checking their hashes against dist and excluding every prior artifact.
  No scene dumps are saved.
- Scoped formatting and `git diff --check` pass. README changes only its production-module
  count. Comparison originals and new smoke outputs are in `tbs-stage38-20261014` outside Git.
- No whole-scene pixel-identity or performance claim. JS helpers and remaining roof module
  still have partial structural contracts. New diagnostics stay outside tracked files;
  prior diagnostics are preserved. One local commit is allowed; no push.

## Infrastructure A0–A3 — 14 October 2026

- A0 and A1 are published in `c8fa3e4659caaf6740d2a6b72ee558b08d4b247b`.
  Cleanup targets only temporary directories created by the current build; permanent
  failure/check/watch tests raised the suite from 49 to 56 tests after A1.
- A2 is completed locally, uncommitted and unpublished. ESLint now processes all
  44 TS sources (43 production plus fixture) and 12 ambient declarations, preserving
  JS coverage and pure-layer boundaries. TS7 7.0.2 remains the guarded build/typecheck
  compiler; the official TS6 compatibility API is used only by ESLint.
  The successful A2 check on 14 October 2026 passed 63/63 tests (seven new tests).
  All 44 dist files remained byte-identical; runtime and earlier diagnostics were preserved.
  Details: [A2 report](eslint-typescript.md).
- A3 adds only documentation: root AGENTS.md, [project state](project-state.md) and this
  appended section. Production-module count stays at 43. A3 is also local and unpublished;
  the Stage 38 history above is retained. No performance or framebuffer identity claim.
  One final A2+A3 check passed 63/63 tests; all 44 dist files and eight A2 files
  remain byte-identical to the state before A3.
- Next game stage 39 has not started; its module selection is not approved.

## Stage 39 — roof, pavilion and landscape — 14 October 2026

- A2+A3 publication was verified by fetch: local main and origin/main both pointed to
  `dfc26303dfd38f4749607fa80d3215fc6fc99e22`; the tracked tree was clean.
- Migrated only roof (47 original lines), pavilion (95) and landscape (115): linked
  construction steps with existing QuarterRoof/Pavilion/Landscape contracts.
  The larger materials.js (220 lines) remains the sole JS module in world/showcase.
  Old source JS files were removed before building; three HTML paths changed in place.
- Added only actual consumed r149 declarations: physical-material opacity, Color.setHSL,
  BoxGeometry and mutable BufferGeometry/Float32BufferAttribute construction.
  No runtime casts, branches, allocations, algorithm changes or infrastructure upgrades.
- Total: 46 production TS modules plus build-smoke, 47 classic outputs. ESLint actually
  processed 47 TS sources and 12 declarations; TS7 7.0.2 builds/checks, TS6 6.0.3 is parser API.
- All three complete executable ASTs match the originals. Three controlled-input scenarios
  on actual bundled r149 cover normal coordinates, far fractional coordinates and zero/-0
  with aliased stone/plaster. Exact bytes of geometry attributes/indices and instance buffers,
  materials, matrices, transforms, creation order, calls, shared references and results match.
  Real geometry helpers and vegetation culling are used; structure/windows and cladding
  consume the same data. roofGlass remains a new clone, passed by identity to the canopy;
  glazing is unchanged. Landscape submits 1100 planting and 480 grass instances as before.
- One common build and check passed, including strict types, lint/format and 63/63 tests.
  Existing Edge file:// smoke passed startup, driving, pause, quality presets and mobile input.
  Its diagnostic wrapper also compared the actual pre-animation city against the original
  three JS implementations: complete desktop audit matched, including quarter resource sharing,
  geometry/instance byte fingerprints, material/texture parameters and canvas-pixel fingerprints.
  Both desktop and mobile built 1483 quarter objects, 70 geometries and 304 cladding panels;
  the whole scene had 4623 objects. These fingerprints are not framebuffer pixel identity.
- Prior 44 dist files remain SHA-256 identical; only three new generated outputs were added.
  Protected sources, A2+A3 configuration, assets and previous diagnostics are preserved.
  Compact artifacts: `artifacts/typescript-stage39-dd891581/` (originals, comparison.json,
  toolchain/coverage, build/check logs, baseline/desktop/mobile audits and smoke images).
- Stage 39 is local, ready for acceptance and separate publication. No commit/push or Stage 40.

## Stage 40 — showcase materials

- Stage 39 was retained as local commit `d8f10a4f3bdeb7f585cbf74e830f6e9bdd1bb499`.
  No checks of that completed stage were repeated and no push was performed.
- Migrated only materials.js to strict materials.ts; the whole world/showcase subdirectory
  is now TS (other world subdirectories still contain JS). Total: 47 production modules,
  48 classic outputs and 48 linted TS sources plus 12 declarations.
- Real resource/visual-assets implementations confirm MeshStandardMaterial results.
  Narrowed those return boundaries and added only consumed texture encoding and material fields.
  Painter callbacks reuse TexturePainter. All constants, seeds, Canvas operations and references
  remain unchanged; the complete executable AST is identical.
- The initial lint block was resolved by explicit user authorization: only materials.ts enables
  allowTernary under the error-level no-unused-expressions rule. One permanent test verifies
  valid calls in both branches, invalid pure/mixed branches and rejection outside that exact file.
- Build/check pass with 64/64 tests. Actual Edge Canvas/r149 comparisons include a stable
  original control repeat: all 15 generated textures match byte-for-byte (5308416 RGBA bytes),
  and 683157 recorded Canvas operations/arguments match. Material parameters, returned keys,
  nightWindows, stone clone and shared texture references match. This is texture pixel equality,
  not full-scene framebuffer identity. The final game smoke is deferred until Stage 41.
- Previous 47 dist outputs and older diagnostics are preserved; only materials.js is added to dist.
  Compact artifacts are in `artifacts/typescript-stage40-43e1ce27/` (including earlier failure logs).
  Stage 40 is local and not pushed. Stage 41 may proceed after its successful local commit.

## Stage 41 — building detail components

- Stage 40 is preserved as local commit `7038d42ade841ee0ff46d08840fb9003411a40a0`.
  Migrated trim (30 original lines), windows (41), storefront (52) and building roof (54),
  distinct from showcase roof. Old JS was replaced before build; four HTML paths changed in place.
- Input projections reuse the actual block.js context after shell's style/body assignment.
  Added only the genuine Object3D.add member missing from the base handle. Remaining block,
  shell, office and entrance JS implementations are unchanged and not statically checked.
- All four complete executable ASTs match. On actual r149, 16 controlled scenarios cover
  residential/office/factory/campus, widths below/at/above 12, minimum window cells, the trim
  height boundary, seeds 0–3, fractional far coordinates and scene/group parents.
  Geometry/index bytes, matrices, material/texture sharing, transforms, shadow flags, call
  and creation order match exactly; all results remain undefined. The real wedge helper is used.
- Build/check pass with 64/64 tests. Actual ESLint coverage: 52 TS sources and 12 declarations;
  production-module count is 51. No additional dependencies or lint changes in this stage.
- One final existing Edge file:// smoke passed desktop/mobile driving, pause, camera, lighting,
  quality presets and touch input without errors. A diagnostic baseline with the four original
  JS components exactly matched the desktop pre-animation audit, including all 200 component
  calls/contexts and quarter scene fingerprints. The scene contained 4623 objects in both runs.
  This is not a full framebuffer pixel comparison or a performance measurement.
- Only four new generated JS files were added; all previous 48 dist files are SHA-256 unchanged.
  All prior diagnostics and the successful Stage 39/40 work are preserved. Artifacts:
  `artifacts/typescript-stage41-2640d867/` (originals, exact comparison summary, coverage,
  build/check logs and baseline/desktop/mobile audit with two final smoke images).
- Stage 41 is complete locally, ready for its separately authorized local commit.
  The package does not permit push or Stage 42. Building components remaining JS:
  entrance.js, office.js and shell.js; all world/showcase modules are TS.
