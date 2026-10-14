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
