# Drone model and animation TypeScript migration

Stage 23 migrates only `vehicles/drone-model.ts` followed by `vehicles/drones.ts`.
Drone model passed the strict build before animation migration. The existing compiler emits
classic scripts in `dist/adapters/vehicles/`. Only their two script paths change in index.html;
order, markup and runtime registration are retained. There are 29 production TS modules,
plus the technical build-smoke fixture.

## Contracts

DroneModelsOptions/DroneModels are reused. DroneModel describes the actual Group and mutable
array of Mesh rotors. BoxHelper now returns the existing structural Mesh handle with rotation,
position and scale, matching the unchanged world resources box helper. Its material remains
ThreeMaterialHandle, without claiming every supplied material is MeshBasicMaterial. Group
visibility is added as an actual r149 member. Existing Group/Mesh/Cylinder constructors,
scene/group add and vector/Euler contracts suffice; no other graphical adapter changes.

DronesOptions uses PlayerState and PresentationState. Its stage accessor reads the live
GameState; the animation does not accept GameState as a substitute for presentation time.
The factory and update API use existing world/bootstrap/frame ports. No casts, suppressions,
new dependencies or runtime guards are needed. Structural Three.js declarations remain
partial; unmigrated helper bodies and the full runtime library remain unchecked internally.

## Focused equivalence

Both emitted executable ASTs match their originals. Tests run the bundled r149 and reuse the
unchanged box/material definitions. Each of six drones retains fourteen children, including
four rotors and four cylinder hubs. Comparisons cover geometry parameters and attribute/index
bytes, all transforms, colors/material settings, shadow flags, shared box geometry and materials.

Real GameState and PresentationState verify one escort/five background drones, original phases
and coordinates, rotor directions, live mission stage changes and repeated updates at the same
time. Hidden escort position/rotors retain their previous values as before. Four fixed animation
states and one close model view render pixel-identically in test Edge with actual Three.js.
The isolated visual test uses existing headless WebGL flags; it is not a performance/GPU audit.
Originals, focused fixtures/results and before/after images remain outside Git in the local
`tbs-drones-stage23-20261013` verification folder.

## Project verification

Validation uses `npm run build`, `npm run check`, `npm run build` and the existing Edge
`npm run test:browser` through file://. The existing 49 tests are unchanged. Smoke covers
startup, driving, pause/resume, camera, lighting/audio, resize, graphics presets and mobile
touch controls without browser errors. It does not complete all mission stages; escort-stage
behavior is covered by the focused comparison above.

Previous 27 TypeScript sources, local diagnostics and screenshots are preserved. No graphical
optimization, gameplay, physics, build tool, dependency or security setting changes.
No commit or push is performed. The project is ready for the next scoped adapter migration;
further graphical consumers may require additional accurate partial Three.js members.
