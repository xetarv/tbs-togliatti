# Bootstrap game: TypeScript boundary

`src/bootstrap/game.ts` replaces only `src/bootstrap/game.js`. Its compiled classic script is
`dist/bootstrap/game.js`, loaded at the same position in `index.html`. The public API remains
`window.TBS.buildGame(options)`, returning `{ runtime, session }` without starting either.

## Checked dependencies

The existing domain and application contracts are reused for state, controls, configuration,
traffic, road networks, player physics, mission routes, the frame scenario, session and mission
controller. `types/bootstrap-contracts.d.ts` describes only the adapter boundaries needed here:

- World parking lots and parked-car coordinates. The population field `a` is explicitly mapped
  to the physics field `heading`; population records cannot be supplied directly as footprints.
- A DOM getter returning an actual `HTMLElement`; missing elements are rejected by `createDom`.
- The separate visual state, including its live `mode` and `stage` accessors.
- Presentation ports extending the frame, session and mission-controller contracts, including
  camera/lighting toggles and the nullable sound getter.
- Input actions and the audio context state read by input.
- Runtime scheduling, cancellation, clock and visibility callbacks, and its start/stop/reset API.

`TbsRegistry` allows declaration merging of these signatures with the existing core registry.
The checked bootstrap body has no casts, `any`, suppression directives or runtime imports.
Both TypeScript configurations include the standard DOM library for real browser types such as
`HTMLElement`, `AudioContext`, `FrameRequestCallback`, `window` and `document`. Strict checking
remains enabled. The existing build first runs the strict contract check, then emits classic JS.
The domain/application runtime independence tests remain in place.

## Scope of the guarantees

The compiler now checks the actual bootstrap assembly: the factory arguments, property mapping,
ports, scheduler callbacks, input spreads, button handlers and returned runtime/session.
The core factory implementations are already TypeScript.

The implementations of `buildPresentation`, `createInput`, `createRuntime`, DOM and world creation
remain JavaScript. Their declared boundary signatures are based on the existing implementations;
their bodies and complete Three.js world objects are not yet statically verified. World typing
here intentionally covers only the parking data consumed by this bootstrap module. Audio typing
covers the context state read by input, not the full Web Audio graph. Presentation object identity
and accessor semantics remain runtime concerns.

## Validation

The normalized executable AST of the emitted bootstrap script matches the original JavaScript.
This checks the order and expressions of all factory calls, dependency/property/spread wiring,
the two button callbacks and the returned object without a second implementation of the logic.

An isolated compiler check rejects ten deliberately incorrect dependencies, one for each of
`createTrafficSimulation`, `createRoadNetwork`, `createPlayerPhysics`, `createMissionRoutes`,
`createGame`, `createSession`, `createMissionController`, `buildPresentation`, `createInput` and
`createRuntime`. These negative fixtures do not enter the production build or bypass type errors.

Run the existing verification sequence:

```sh
npm run build
npm run check
npm run build
npm run test:browser
```

The 49 existing tests stay unchanged. The browser smoke check loads the actual game through
`file://`, including the compiled bootstrap, and checks desktop/mobile controls and presentation.
No other bootstrap module, game algorithm, adapter implementation or dependency was changed.
