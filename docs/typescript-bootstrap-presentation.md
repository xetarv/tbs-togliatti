# Bootstrap presentation: TypeScript boundary

Only `src/bootstrap/presentation.js` was migrated to `src/bootstrap/presentation.ts`.
The existing build generates `dist/bootstrap/presentation.js`, loaded in the same position in
`index.html`. Registration remains `window.TBS.buildPresentation`; no module loader is involved.

## Checked assembly

`BuildPresentationOptions` and `BootstrapPorts` are reused from the game bootstrap boundary.
`types/presentation-contracts.d.ts` adds the real inputs and consumed outputs of the presentation
factories. World/DOM declarations now include the resources passed by this module, parked-car
seeds and optional meshes, and the minimap canvas/context.

- Car factories check materials, textures, geometry helpers, model-data stations, player data,
  controls, animation callbacks and graphics access.
- Display/graphics check renderer, scene, camera, car, reflection records, quality controls and
  render/resize callbacks. `facadeMaterials` is an array of canvas **textures**, despite its name.
- Traffic view checks the domain vehicle array, signal phases and model-animation callbacks.
- Sound checks visual state, player, traffic, DOM access and its ambience factory.
- HUD receives `GameState`; camera, lighting, sound, pedestrians, drones, markers and world
  animation receive the distinct `PresentationState`. The two are not interchangeable.
- Minimap, markers, camera, lighting, pedestrians, drones, world animation, overlay and toast
  check their required resource fields, callbacks and returned ports.

Three.js objects are passed through structural handles using actual r149 discriminators
(`isObject3D`, `isScene`, `isPerspectiveCamera`, `isMesh`, `isMaterial`, `isTexture`,
`isBufferGeometry`). No synthetic branding properties or broad `any` types are used.
The TypeScript body contains only parameter/return annotations, including the explicit
`getGraphics` return type and timeline argument/return types. Strictness is unchanged.

## Boundaries still outside static checking

All adapter implementations, `bootstrap/world.js`, `src/app.js` and DOM/world construction remain
JavaScript. Their outputs are described by boundary declarations rather than inferred from checked
implementations. Three.js handles distinguish object categories but do not verify shader uniforms,
`userData`, renderer internals or the complete constructor library. `T` exposes only its real
`REVISION` member here because presentation forwards it without accessing constructors.
The full fastback asset schema, Web Audio graph and world-builder initialization phases also
remain outside this module's static guarantees. No adapter implementation was rewritten.

## Addressed behavioral checks

The normalized executable AST of the generated script matches the previous JavaScript.
A separate before/after wiring check verifies factory order and spread-key order, reference
identity of forwarded dependencies and returned ports, and the two different state objects.
It checks that timeline advance mutates only presentation time and returns its daylight value.

The `getGraphics` closure still reads `display.graphics` lazily: it is unavailable before display
initialization, becomes usable afterward and reads the live property on later calls. The returned
graphics port retains its original reference. No call or initialization was moved.

An isolated strict compiler check rejects sixteen invalid factory inputs, including swapped
game/visual states, material/texture confusion, incorrect signal phases, invalid quality values,
missing mission-point names, incorrect callbacks and missing DOM/graphics/drone capabilities.
The fixtures and detailed verification data are outside the production source tree.

Use the existing validation sequence:

```sh
npm run build
npm run check
npm run build
npm run test:browser
```

The 49 existing tests are unchanged. The browser smoke test loads the actual game through
`file://` and checks startup/HUD, driving, pause/resume, camera toggle, lighting, sound controls,
resize, graphics presets and mobile touch controls. It does not validate every visual effect or
audible output. Existing diagnostic screenshots are preserved; new ones are saved separately.
