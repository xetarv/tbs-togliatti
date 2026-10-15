# TypeScript migration log

## R3 stage 50 - completed - 15 October 2026

- Started clean at published 9a207b70; fetch confirms no divergence. Migrated Fastback
  materials/geometry/exterior only: 72 production TS / 73 classic dist / 17 remaining JS.
- Three complete executable ASTs match Git. Actual r149 fixture uses the real mesh asset
  and unchanged Fastback/car-model assemblers: PBR scalar fields, all vertex/index/UV/normal
  buffers, transforms, shadow flags, object order, shared references and rounded cache match.
  Station interpolation is compared at interior/end/outside sample coordinates.
- setIndex accepts readonly arrays because r149 copies input; no mutation or geometry change.
- Build/check passed: strict TS7, ESLint and 64/64 tests. No rule exception added.
  New evidence is isolated in tbs-r3-5d686b5f; final native Canvas/Edge smoke after 52.

## R2 stage 49 - completed and boundary smoke passed - 15 October 2026

- Migrated population only: 69 production TS / 70 classic outputs / 20 remaining JS.
  Full executable AST matches Git, including placement, RNG and staticBatchCulling.
- Native r149 comparisons use the complete 8-by-6 block grid and actual resource/road/
  park/building/showcase factories, with a recorded visual-assets port. Both photographic
  asphalt branches and the culling switch match; parked cars/lots/landmarks, scene order,
  buffers, instance matrices/colors and material references match. Oversized and nested
  objects remain excluded; three eligible boxes retain batching and shadow flags.
- Existing static-batch-culling tests now execute dist, preserving all original cases.
  The localized single-material box refinement follows the unchanged unitBox identity
  guard; no universal claim about other scene meshes/material arrays was introduced.
- Build/check passed (strict TS7, ESLint, 64/64 tests). One final existing Edge file smoke
  passed: real running driving, pause, camera, lighting, audio, all graphics presets,
  resizing and mobile touch. Desktop/mobile screenshots were reviewed.
- The same browser run additionally rendered the real waterfront and central park,
  compiled the actual water shader, checked its live waveTime and square/train references,
  and verified four loaded images had natural dimensions and drained onReady queues.
  The generated world has 16 parked cars and six parking lots; no FPS or full-game
  framebuffer identity was measured. Native fixtures use recorded Canvas/visual-asset
  ports; this smoke exercises the unmodified real browser adapters.
- All six source JS files are removed, all 93 script paths exist, and index.html differs
  from the R1 base only in the six approved paths. Actual counts are 69 TS / 70 dist /
  20 JS. All 64 prior dist hashes match. The 90 previously recorded historical artifact
  directories retain their timestamps; historical contents were not mass-rehashed.
- New evidence is isolated in tbs-r2-20261015-bl0T7n, including two smoke screenshots.
  No dependencies, visual parameters, algorithms or remaining JS implementations changed.
  Four separate local stage commits; no push, history rewrite, R3 or stage 50.

## R2 stage 48 - completed - 15 October 2026

- Migrated roads only: 68 production TS / 69 classic outputs / 21 remaining JS.
  Full executable AST, RNG and shader strings match the Git baseline.
- Added only the explicitly authorized roads.ts allowTernary path; permanent tests
  retain positive/effect-negative/other-file restrictions for all five approved paths.
- Native r149 fixtures compare detailed/ordinary sidewalks, road buffers and instances,
  stop material/reference preservation, three camera/parent/projection states, shader
  restoration and model-view/normal bytes, frustum outcomes and trimStopBatching=0.
- Existing trim-stops tests execute dist directly with all invariants retained. The
  Mesh-result assertion follows the unchanged isMesh filter; optional depth/scratch
  accesses are narrowed only after their existing initialization loops. No new checks.
- Build/check passed: strict TS7, ESLint and 64/64 tests. No road or batching optimization.

## R2 stage 47 - completed - 15 October 2026

- Migrated parks and terrain: 67 production TS / 68 classic outputs / 22 remaining JS.
  Both complete executable ASTs (including exact GLSL) match Git originals.
- Native r149 comparisons cover all park builders, centralSquare and maglevTrain references,
  six moored boats/three terraces, bank buffers, rocks/reed matrices and colors, the 1500
  reeds registration with cellSize 32, and water shader assignment/uniform identity.
- Construction-only boats/jets collections are typed mutable, retaining readonly views
  for consumers. The existing reeds test now extracts the actual compiled dist code;
  textual markers were adjusted only for compiler indentation, with all checks preserved.
- Build/check passed (strict TS7, ESLint, 64/64 tests). No shader/culling/terrain changes.
  Native Canvas/WebGL smoke remains scheduled at the R2 boundary after stage 49.

## R2 stage 46 - completed - 15 October 2026

- Explicit authorization resolves the earlier stop (historical record retained).
  Only resources.ts and resources/landscape.ts were added to allowTernary at this stage;
  the permanent test covers all four allowed files, rejects pure/mixed branches, and
  still rejects call ternaries in roads.ts and other TS files.
- Migrated both resource modules: 65 production TS, 66 classic outputs. Both complete
  executable ASTs match Git. Native r149 fixtures cover immediate/deferred image readiness,
  callback queue replacement, four factory calls in order, shared unit meshes/materials,
  visual assets, tree/shrub/garden culling, instance matrices/colors and Canvas commands.
- A constrained Object.assign assertion signature reflects only staged resource assembly.
  imageTexture refines the real onReady array after initialization; no runtime checks added.
- Build/check passed (strict TS7, ESLint, 64/64 tests). Evidence is outside Git in
  tbs-r2-20261015-bl0T7n; native Canvas/browser boundary remains scheduled after 49.

## R2 stage 46 - preflight stop - 15 October 2026

- Fresh fetch confirms main/origin/main at 7ea72ebdf63060ce4d12dc670f1d1c9c08eba6eb;
  the starting working tree was clean. Counts remain 63 production TS / 64 dist / 26 JS.
- Before source edits, actual ESLint lintText under each prospective TS path rejects
  resources.js:64 and resources/landscape.js:148 (no-unused-expressions).
  Both are existing Canvas lineTo/moveTo call ternaries with effects in both branches.
- The R2 instructions explicitly require stopping for this conflict: no extra allowTernary
  files or executable-AST rewrites were applied. Stages 46-49 remain uncompleted.
- No build/check/Edge rerun or commit; only the two status documents were updated.
  One compact new probe report is outside Git in tbs-r2-20261015-bl0T7n;
  historical diagnostics, source, dist, dependencies and existing commits were untouched.

## Stage 45 - resource adapters - 15 October 2026

- Migrated signs, facades and fixtures: 63 production TS, 64 classic outputs.
  Three complete executable ASTs match Git originals. The existing district texture cache
  remains; no facade material cache was added. Sprite/geometry references are preserved.
- Exact contracts distinguish makeTexture Canvas output from loaded images with onReady
  queues; Mesh preserves its geometry reference. The sole material refinement for stone
  follows materials.ts:40 (visualAssets.material(...).clone()), leaving the pre-existing
  broader QuarterMaterials/default wall contract unchanged. Non-null access in synchronous
  painters/cache lookups and ready callbacks describes existing preconditions only.
- Build/check passed: strict TS7, ESLint and 64/64 tests. Existing Edge file smoke passed:
  startup, driving, pause, camera, lighting, audio, resize/presets and mobile touch.
- In the same final browser run, original/current r149 comparisons matched SHA-256 pixels
  for 64 Canvas surfaces, a real rendered leaf-shader image, and two resource scenes.
  Immediate and deferred fit/paintFlag, pre-existing callbacks, aspect 3.2, no-naturalWidth
  early return, shared collections, facade texture-cache identity and new material per
  facade all passed. Scene/geometry/material/matrix snapshots match; full-game framebuffer
  identity and FPS were not measured. Desktop/mobile smoke screenshots were reviewed.
- All 93 script paths exist; index.html differs from Git baseline only in the 12 approved
  src-to-dist paths. The 52 pre-existing dist files retain their byte hashes. The 90 old
  artifact directories remain present with unchanged recorded directory timestamps;
  historical file contents were not mass-rehashed. New results are outside the repo in
  tbs-r1-20261015 (two smoke screenshots plus compact evidence). No push or stage 46.

## Stage 44 - completed after explicit authorization - 15 October 2026

- The earlier stop record below is historical. User authorized allowTernary only for
  materials.ts and visual-assets.ts; the permanent lint test checks both allowed files,
  pure/mixed branches rejected, and three other TS files still rejecting call ternaries.
- Migrated rendering/geometry and world/visual-assets: 60 production TS, 61 classic outputs.
  Two complete executable ASTs match Git originals, including all GLSL strings and RNG calls.
- Actual r149 fixtures match wedge/detailBar (including zero length), four plant variants,
  vertex/index buffers, instance matrices/colors, material cache identities and maps,
  shader/wind identity, displacement registration and streamed Canvas command hashes.
- Context non-null assertions preserve the original browser Canvas-2D precondition;
  cache lookups are guarded by has, and Object.entries keys come from exactly three maps.
  Native Canvas pixels and shader/browser validation remain scheduled for stage 45.
- Build/check passed: strict TS7, ESLint and 64/64 tests. No dependencies or algorithms changed.

## Stage 44 ? stopped at validation conflict ? 15 October 2026

- No stage-44 game/type/index changes were made; stage 45 was not started.
- Two isolated checks used the actual ESLint configuration: the unchanged bark Canvas
  conditional in visual-assets.js (line 207) preserves the full executable AST but fails
  @typescript-eslint/no-unused-expressions when treated as TS. An equivalent if/else
  passes lint but changes the executable AST. Neither candidate was applied.
- A new lint exception or runtime syntax rewrite needs resolution of the package constraints
  (unchanged executable expressions and no ESLint weakening). Existing materials.ts has
  its own explicit allowTernary exception; it was not broadened.
- Successful stages 42 and 43 remain separate local commits; 58 production TS and 59
  classic outputs. Final boundary Edge/Canvas/shader/ready validation was not reached.
- Evidence is limited to a small external 44-blocker.json; no historical artifacts changed.

## Stage 43 ? remaining buildings ? 15 October 2026

- Migrated lighting, pavilion and industrial; 58 production TS, 59 classic outputs.
  No production JS remains under world/buildings. Existing exact factory projections reused;
  declarations add real CylinderGeometry transforms, ShapeGeometry, IcosahedronGeometry
  and standard material metalness. No implementation or rendering changes.
- Three executable ASTs match Git originals. Actual r149 comparisons cover facade lighting,
  pavilion and both logistics branches: scene order, geometry, materials, matrices,
  reflection records, painter calls and shared cityFacadeLights references match.
- Build/check passed (64/64 tests, strict TS7); native fixtures use recorded Canvas calls,
  not full-scene pixel comparison. Prior outputs and diagnostics are retained.

## Stage 42 — remaining building components — 15 October 2026

- Started from published 499b051 after explicitly authorized fast-forward; npm ci restored
  locked dependencies. Prior stages and historical documentation are retained.
- Migrated shell, office, entrance and block only: 55 production TS, 56 classic outputs.
  Existing input projections are extended for those actual factories. A narrow Object.assign
  assertion signature describes the real style/body mutation before component consumers;
  no runtime assertions, operations or allocations were added.
- Four complete executable ASTs match Git originals. Twenty actual r149 scenarios cover
  residential/office/factory/campus, default styles, width below/at/above 12 and seeds 0–3.
  Creation order, shared contexts/shopSigns/materials, geometry, matrices, shadows,
  reflectionBuildings and Canvas painter calls match. Canvas calls here are recorded;
  final native Canvas/shader/browser validation is reserved for the package boundary.
- Build/check passed, including strict TS7, ESLint and 64/64 tests; no push permitted.
- Compact originals and evidence are outside Git in tbs-r1-20261015. No FPS or full-scene
  framebuffer identity claim; untouched JS factories still have partial structural contracts.

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
