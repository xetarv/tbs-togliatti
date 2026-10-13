# Browser adapters: runtime and presentation state

Only `src/adapters/browser/runtime.js` and `presentation-state.js` were migrated to TypeScript.
The build emits classic scripts under `dist/adapters/browser/`; `index.html` uses those two paths
at the same positions. Factory registration through `window.TBS` is unchanged.

There are now seventeen production TS modules: eleven domain/application, four bootstrap and two
browser adapters. The separate build-smoke fixture makes eighteen generated scripts.

## Strict contracts

Runtime reuses `RuntimeOptions` and `Readonly<GameRuntime>`: the actual implementation now checks
the game scenario, numeric clock, numeric frame ID, frame callback, request/cancel functions and
boolean visibility callback. Internal reset/start/stop callbacks return void; frame time is numeric.
The existing runtime declaration and bootstrap/game assembly remain unchanged.

Presentation state accepts the existing `GameState` and returns `PresentationState`. The registry
adds that factory signature once. Its six visual numeric fields remain mutable; mode and stage are
readonly live getters into the supplied authoritative state. No new state shape, cast, suppression
directive, dependency or runtime import was introduced.

## Addressed equivalence checks

Both generated executable ASTs match the original JavaScript. An isolated before/after runtime
trace checks initialization and scheduling order, repeated start, pre-start/repeated stop,
cancellation IDs, maximum dt 0.05, backwards/equal/NaN timestamps, hidden-tab scheduling and clock
advance, reset, stopped callbacks, restart and the frozen API. No edge-case behavior was corrected.

Presentation checks compare initial values and property descriptors, writable numeric fields,
independent visual objects, live mode/stage updates and absence of visual fields in GameState.
Seven negative compiler cases reject invalid clock/visibility/scheduler inputs, passing visual
state as GameState, assigning readonly mode/stage and replacing a frozen runtime method.
An accompanying positive assignment verifies that elapsed remains writable.

The detailed checks and original-source copies are stored outside production files. Existing
diagnostic images are preserved and new browser screenshots are stored separately.

## Validation

```sh
npm run build
npm run check
npm run build
npm run test:browser
```

The 49 existing tests are retained; only the runtime test's script path changes to the compiled
file. Edge smoke exercises the actual file:// game, including startup, driving, pause/resume,
camera, lighting, sound controls, resize, quality presets and mobile touch controls.
All fifteen previously migrated production sources remain unchanged.

Other JS adapter implementations and `src/app.js` remain outside strict static checking. Real
browser frame timing, OS cancellation and audible output are not exhaustively validated by the
deterministic trace or smoke test. No commit or push is performed in this stage.
