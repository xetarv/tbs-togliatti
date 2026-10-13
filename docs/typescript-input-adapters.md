# Input adapters: controls and camera

`src/adapters/input/controls.ts` was migrated and strictly built first, followed by `camera.ts`.
Both use the existing build and classic scripts in `dist/adapters/input/`. Only their script paths
change in `index.html`; load order is retained. Nineteen production modules are now TypeScript,
with one additional technical build-smoke fixture.

## Checked contracts

Controls reuses `InputOptions`, `GameState` and `ControlsState`. Sparse keyboard maps have values
derived from movement control keys; browser handlers use real `KeyboardEvent`/`PointerEvent` and
HTML button types. Session, mission, camera, lighting and audio callbacks retain their signatures.

One assertion narrows `btn.dataset.key` to `keyof ControlsState`. It is justified by the fixed
`.touch button` markup, whose five keys were checked as left/right/action/down/up. Native DOM
types cannot express that data-attribute schema. No runtime guard, coercion or event-system rewrite
was added. The original behavior for hypothetical invalid dynamically added buttons is unchanged;
the static guarantee applies to the supplied markup.

Camera reuses `CameraOptions`, player/visual state, clamp and returned camera ports. It now checks
wheel and pointer events, the nullable drag record, Vector3 set/copy/lerp, camera position/lookAt,
the renderer canvas, DOM getter and the actual skyTime shader uniform. Existing Three.js boundaries
gain only consumed real members: the Vector3 constructor, camera position/lookAt and a distinct
sky mesh handle. Other meshes do not acquire imaginary shader fields. Graphic implementations
and full Three.js declarations remain untouched.

## Equivalence

The executable ASTs of both generated scripts match their original JavaScript. Before/after
traces cover:

- Physical WASD, arrows, Cyrillic/uppercase fallback, Space and key release.
- Non-repeating interaction/camera/lighting/audio toggles, editable-focus and paused restrictions.
- Audio-start behavior, five touch controls, capture, release/cancel/lost-capture, blur and visibility.
- Automatic and mouse camera, toggle button/text/toast, drag direction, wrong button/pointer ID.
- All wheel delta modes, large zoom deltas, drag release/blur and paused camera input.
- Identical camera positions/quaternions, copied sky position and elapsed skyTime values using r149.

Seven negative compiler checks reject incompatible callbacks, sound state, control values,
clamp results, shader values, frame dt and lerp amount. Valid control and shader assignments pass.
Detailed comparison fixtures and original sources are stored separately from production files.

## Validation and scope

```sh
npm run build
npm run check
npm run build
npm run test:browser
```

The 49 existing tests are retained. Input/camera tests load compiled scripts; the camera fixture
now creates real PresentationState, matching the game's existing contract rather than supplying
GameState as visual state. This changes no production behavior.

Edge file:// smoke checks keyboard driving, pause/resume, the camera toggle, lighting and sound
controls, graphics presets, resize and mobile touch. Detailed drag/zoom event equivalence is
checked by the separate deterministic trace; the stock smoke does not exercise every camera gesture.
Previous seventeen sources and diagnostic screenshots are preserved. No other adapter, runtime
algorithm, rendering setting, dependency, build tool or security configuration was changed.
The remaining JS adapter internals are still outside strict static checking. No commit/push occurs.
