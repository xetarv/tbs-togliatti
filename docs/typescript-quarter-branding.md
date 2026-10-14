# Quarter branding TypeScript migration

Stage 35 migrates only `showcase/branding.ts` using existing QuarterBrandingOptions.
The existing strict compiler emits classic `dist/adapters/world/showcase/branding.js`.
Only that path changes in index.html; there are 39 production TS modules plus build-smoke.
All uncommitted stage 34 code, outputs, declarations and documentation are retained.

## Contracts and scope

Existing PlaneGeometry, Mesh, MeshBasicMaterial, textures, transforms, signTexture and box
contracts suffice. One dependency declaration is corrected: architecturalPanel actually
returns a Group, not a Mesh. Its unchanged implementation and arguments are used in checks.
No new runtime operation, cast, suppression, dependency or graphical implementation is added.

## Focused checks

Original/generated executable ASTs match. A compact comparison uses bundled Three.js r149,
the unchanged actual box, signTexture and architecturalPanel helpers, deterministic recording
Canvas and photo fixtures. Before/after snapshots compare all 16 scene objects, geometry arrays,
materials, coordinates, rotations, scales, hierarchy and operation order. Exact Russian titles
and subtitles and all sign-painting operations match; all eleven bronze fins retain their material.

Ready and deferred photo cases preserve original texture references and aspect fitting. Existing
ground scene.userData is retained. This validates painting commands and object data, not a
separate full-scene pixel or GPU audit. Remaining JS helpers are not checked internally by TS.

Use `npm run build`, `npm run check`, `npm run build` and the existing Edge file:// smoke.
The 49 existing tests and repository browser tool remain unchanged. Only screenshot output is
redirected in the test launcher to a new folder outside the repository, protecting old diagnostics.
Fixtures/results stay in the local `tbs-branding-stage35-20261014` folder, outside Git.

No other gameplay module, graphics setting, shader, compiler or dependency changes.
No commit or push is performed. General TypeScript status is updated in typescript-build.md and README.
