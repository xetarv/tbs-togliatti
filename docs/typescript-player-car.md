# Player car adapter TypeScript migration

Stage 26 migrates only `vehicles/player-car.ts`. The existing compiler emits classic
`dist/adapters/vehicles/player-car.js`; its single script path changes in index.html.
There are 32 production TypeScript modules plus the technical build-smoke fixture.
Previous stages, car-model/Fastback and all internal JS builders remain unchanged.

## Real contracts

PlayerCarOptions reuses PlayerState, ControlsState, clamp, graphics access and the exact
CarModels hero/traffic/animation ports. Its state is the actual PresentationState passed by
bootstrap, whose mode reads live GameState; these states are not merged. The result car is
FastbackCar. ParkedPresentationCar now has an optional TrafficCar mesh, assigned in place
by the original constructor loop. One non-null assertion in update follows that initialization;
the readonly collection contract and tests cover this lifecycle, including empty parking.
No runtime guard or new initialization is introduced.

The nullable previous skid point has x/z/heading. Consumed r149 contracts add Object3D
position/Euler/scale/matrix/updateMatrix, DynamicDrawUsage, polygon offset parameters and
InstancedBufferAttribute setUsage/needsUpdate, count and frustumCulled. Existing Group, Mesh,
materials, Matrix4 and InstancedMesh contracts are reused. They remain partial; no any,
double cast, suppression or full graphics dependency is added.

## Focused equivalence

Executable ASTs match. Test sequences use actual r149 transforms, materials, instanced
buffers, GameState/PresentationState and the unchanged animateVehicle function. Minimal
real Three.js car models exercise this adapter's ports, not another audit of the detailed
Fastback geometry already checked in previous stages.

Before/after sequences compare construction order/colors/variants, car and parked references,
positions/headings, sparse undefined braking, forward/reverse braking, handbrake, steering,
parking distance boundaries, pause/resume, body transforms, acceleration/impact decay and zero dt.
Tyre tracks compare all submitted matrices and upload versions, short moves below 0.16,
gaps at least 2, speed/turn thresholds, resets and retained paused anchors. More than 320 writes
verify cursor wrap, capped count and exact final Float32 matrix slots; empty parking also passes.
Skid material, dynamic usage, frustum setting and shared plane geometry are unchanged.

Originals, focused fixtures/results and smoke outputs remain outside Git in the local
`tbs-player-car-stage26-20261013` verification folder.

## Browser and project verification

Run `npm run build`, `npm run check`, `npm run build:check`. The existing 49 tests remain
unchanged. The existing Edge file:// smoke is extended only in memory with additional WASD
turn/brake and Space handbrake input, plus a test-only observer retaining the actual player
adapter result. It confirms nonzero live tyre-track count and existing dynamic/frustum settings.
All original startup, pause/resume, camera/audio/HUD, presets, resize and mobile checks remain.
The repository smoke tool and production registry implementations are not changed.

There is no new before/after pixel comparison or claim of pixel identity. Earlier animated
original-image controls were unstable; browser rendering and exact data/AST comparisons provide
the checks for this stage. No graphics setting, simulation algorithm, batching, material,
dependency, compiler or security configuration changes. Diagnostic screenshots are restored.
No commit/push is performed. Stages 23-26 are ready for final review and publication, with
the previously documented visual-control limitation retained.
