# Car model adapter TypeScript migration

Stage 25 migrates only `vehicles/car-model.ts`. The existing build emits classic
`dist/adapters/vehicles/car-model.js`; its single path changes in index.html without reordering.
There are 31 production TS modules, plus the technical build-smoke fixture.
Player-car, seven traffic builders and seven Fastback components remain unchanged JavaScript.

## Actual contracts

CarModelsOptions is reused. Hero creation returns FastbackCar. Traffic output is a union of
passenger (sedan/compact) and commercial (van/shuttle) cars, not a universal vehicle with
imaginary fields. Fastback steering is a Group, passenger steering is a Mesh, commercial
steering is absent. The wheel records genuinely match the existing FastbackWheel shape.
AnimateVehicle accepts only the real hero/traffic union and retains boolean/undefined braking.

New declarations describe actual inputs/results of geometry, passenger/commercial builders,
wheels, lights, shadow and suspension. Helper inputs are projections of existing world ports.
The suspension factory returns void and populates body; body builders populate detailedBody
and, for passenger cars, steeringWheel. Their JS bodies remain outside static checking.

The traffic construction group has explicitly partial userData, so no complete model is
claimed before construction. One return assertion follows the real branch-specific builders
and assignments. Runtime comparisons verify the completed data and references. Native r149
Group rotation/scale, MeshPhysicalMaterial numeric parameters and Color.setHex are added as
precise consumed members. Existing partial graphics contracts are reused without any,
suppression, double casts, new runtime guards or a dependency on complete Three.js types.

## Equivalence and visual limits

Original/generated executable ASTs match. Test Edge uses the real traffic and Fastback
factories, mesh assets, branding image, world materials, box/geometry helpers and Canvas
textures. It compares factory order and inputs, all five model structures, geometry arrays,
materials, textures, instance matrices, compact scaling, userData and shared reference links.
Default creation is also verified as sedan. Shadows remain outside the traffic suspension.

Six animation inputs cover positive/negative/zero speed, both steering directions, braking
true/false/undefined, zero dt, large dt and the reverse-light boundary at -0.2 versus -0.21.
Independent formula checks verify wheel rotation, exponential steering interpolation, steering
wheel and brake/reverse colors on hero and all four traffic variants.

Initial five-car scene images matched exactly. After animation, the migration comparison
differed at 8 pixels (maximum channel difference 9); the original control repetition likewise
differed at 8 pixels with maximum 9. Thus the animated control is unstable and full pixel
identity is not claimed. Geometry and animation data match exactly. Test settings, shadows
and antialiasing were not reduced. This is a small isolated comparison, not a GPU/FPS audit.

Originals, focused fixture/results and three pairs of images remain outside Git in the local
`tbs-car-model-stage25-20261013` verification folder.

## Project validation

Use `npm run build`, `npm run check`, `npm run build` and the existing Edge file:// smoke.
The existing 49 tests remain unchanged. Smoke covers the live player car and traffic during
startup/driving, pause/resume, camera, HUD/audio, resizing, graphics presets and mobile touch.
It does not exhaustively verify all traffic variants; the focused comparison covers them.

Previous 30 TS sources, player-car and all internal JS builders are hash-preserved, as are
diagnostic screenshots. No physics, gameplay, geometry, batching optimization, dependency,
compiler or security setting changes. No commit or push is performed. A separate player-car
migration can follow, with additional precise graphics contracts as its actual consumers need.
