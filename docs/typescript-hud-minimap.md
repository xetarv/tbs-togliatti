# HUD and minimap TypeScript migration

Stage 19 migrates only `src/adapters/ui/hud.ts` and `minimap.ts`, in that order.
HUD passed the strict build before minimap migration. The existing build generates classic
scripts in `dist/adapters/ui/`; only their paths change in `index.html`, retaining load order.
There are now 24 production TypeScript modules, plus the technical build-smoke fixture.

## Contracts

HUD reuses `HudOptions`, `GameState`, `PlayerState`, mission definition/point callbacks,
the DOM getter and `GameFramePorts['hud']`. Its Map stores the original string/number values.
The setter accepts only `textContent` or `innerHTML`, with no arbitrary string indexing.
One local assertion preserves the original numeric delivery-count assignment: real DOM
setters coerce numbers into text although TypeScript's DOM declaration requires strings.
The assertion emits no conversion or runtime change. Actual Edge DOM coercion was verified.
Battery width comparison, formatting, cache keys and text versus HTML updates are unchanged.

Minimap reuses `MinimapOptions`, including real `HTMLCanvasElement` and
`CanvasRenderingContext2D`, dimensions/roads, parking records, player and mission target.
Existing `PresentationWorldState`/`WorldConstructionState` describe the actual central square;
no duplicate WorldState or fictitious interface is introduced. Return types reuse frame ports.
Remaining JS adapter implementations remain outside strict static checking.

## Focused equivalence checks

- Both generated executable ASTs match their original JavaScript sources.
- HUD traces match for pickup/delivery, different missions/credits/counts, signed speed,
  distance and battery rounding. Unchanged updates perform no DOM writes.
- Canvas traces match for roads, blocks, parking, square, target and car, including
  nonuniform map scaling, player translation/heading and save/restore order.
- Actual test Edge DOM contents and all 400 x 200 Canvas pixels match before/after in two
  states. Player movement, mission target and square presence changes update the map.

Original sources, focused fixtures and results are saved outside the repository in
the local `tbs-hud-stage19-20261013` verification folder.

## Validation and scope

Run `npm run build`, `npm run check`, `npm run build`, then the existing
Edge `npm run test:browser` through `file://`. The existing 49 tests are unchanged.
The smoke covers initial mission/HUD, driving, pause/resume, camera, lighting/audio,
graphics presets, resizing and mobile touch. It does not complete every mission;
target changes and map pixels are covered by the focused comparison.

Previous migrations and diagnostic screenshots are preserved. No algorithms, graphics,
physics, Canvas drawing, adapters outside these two modules, dependencies or security
settings are changed. No commit or push is performed.
