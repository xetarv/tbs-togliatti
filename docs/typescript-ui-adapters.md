# UI adapters: DOM, toast and overlay

Stage 18 migrates only `src/adapters/ui/dom.ts`, `toast.ts` and `overlay.ts`.
The existing strict compiler generates classic scripts in `dist/adapters/ui/`.
Only these three script paths change in `index.html`; markup and load order are retained.
There are now 22 production TypeScript modules, plus the technical build-smoke fixture.

## Contracts and boundaries

DOM takes the actual browser `Document` and returns `BootstrapDom`, including the main canvas,
minimap canvas, non-null Canvas 2D context and cached `HTMLElement` getter. The registry now
declares `createDom`. A non-null assertion follows the existing cache population or throw.
Two canvas assertions rely on the fixed `game` and `minimap` canvas tags in `index.html`,
verified separately. No runtime type guard or altered error path is introduced.

Toast uses `Pick<BootstrapDom, 'getElement'>` and `GameFramePorts['notifications']`.
Messages are strings; DOM text/class updates and browser timeout IDs are checked.
Overlay uses the same DOM getter and `Readonly<SessionOptions['overlay']>`;
its hide/pause functions and string mission title are checked. The original `Object.freeze`
is retained. Neither module adds handlers or changes HTML/CSS.

Remaining JavaScript adapter bodies are still outside strict static checking. Canvas tag
assertions describe the supplied markup, not arbitrary dynamically replaced elements.

## Focused verification

The three generated executable ASTs match their original sources. Before/after traces check
cache identity, missing-element retry and exceptions, canvas/context identity and failure,
toast replacement of pending timers with the same 2500 ms delay, text and class updates,
overlay hide/pause contents and ordering, and the frozen overlay API. Fixtures, originals
and detailed results are stored outside the repository in the stage 18 verification folder.

Validation uses `npm run build`, `npm run check`, `npm run build` and the existing
Edge `npm run test:browser` through `file://`. The existing 49 tests are unchanged.
The smoke covers launch, driving, pause/resume, camera, lighting/audio, graphics presets,
resize and mobile controls; it does not exhaustively inspect every notification message.
Previous stage changes and diagnostic screenshots are preserved. No commit or push is made.
