# Состояние TBS Togliatti 2040

## Compile-only запуск — изолированная интеграция, 26 октября 2026

Ветка `feature/safe-compile-only-startup-20261026` от `166ac744` переносит
сохранённый compile-only кандидат в штатный High startup без внешней активации.
Сергей пересмотрел критерий: прежний warm-штраф около 200 мс допустим ради
выигрыша нового запуска. Это не разрешение commit/push/merge.
[Механизм и владение ссылками](r149-safe-integration.md#compile-only-env-map-preparation--26-october-2026).
Исходная main, четыре shaderChecks-файла и историческая диагностика сохранены.
Штатный High Start/W и reuse семи программ подтверждены. Приёмка пока заблокирована:
в положении повёрнутой камеры B отличается от трёх текущих A на 23 088 пикселей
(максимум 4/255). Новые допуски не введены; публикация не разрешена.

## Итоги запуска и архив работы — 22 октября 2026

В main опубликованы Safe (`549a6beb`), подготовленные поверхности (`0c74e4e9`)
и кэш геометрии растительности (`dcedc023`). [Итоговые отчёты и ограничения](startup-results-20261022/README.md)
сохраняют отдельные серии измерений, приёмку и происхождение доказательств.
Последняя архитектурная оценка остановлена без новой B: крупная миграция не обоснована.

Четыре исторических shaderChecks-файла отдельно сохранены в GitHub-ветке
`archive/shader-checks-20261022`, коммит `b763df05`. В main они не слиты;
в основной локальной копии оставлены прежние незакоммиченные версии.
Сохранение результатов не меняет графику, геймплей или принятые алгоритмы.
Ниже находятся исторические записи; их статусы относятся к моменту соответствующего этапа.

## Stage 64 - bounded adaptive road traffic - 16 October 2026

Started clean at 08ff500314a2bb9890e540317ed78221374eba78, matching local origin/main;
xetarv/GitHub noreply author/committer confirmed. No history synchronization or push.
The original 36 and their generation are unchanged. Bootstrap now enables adaptive density
only for dynamicTraffic=1; missing/0/other values are static. The initial local checkpoint
912a30943446f16fc3a40233d9b4d657b33e3005 enabled it by default; a separate opt-in correction
preserves that commit. Standalone domain callers retain legacy mode
unless they opt in. The parked-vehicle snapshot is shared with physics. No DOM/Three
dependency was added to domain, no new production module or script order change.

Opt-in follow-up: 16 query cases checked through the actual bootstrap call; only the
decoded value 1 enables adaptation. One final build/check passed strict TS7, ESLint,
formatting and 99/99 tests; diff --check passed. Short Edge file cold starts without
a parameter (false) and with dynamicTraffic=1 (true) both passed with 36 initial cars,
version 0, successful session start and no console/resource errors. Other driving and
resource scenarios were not repeated outside the required full check. Only the flag
expression, its generated bootstrap JS, one test, a type comment and two docs changed;
controller algorithms/distances/budget/physics/graphics are untouched. Separate local
commit; no amend or push. Earlier checkpoint verification below is historical.

Density runs only via active advanceTraffic, after existing movement and before view
reconciliation/player physics. One cycle per 3 active seconds, at most one retirement
and one spawn (including large dt: no catch-up loop). The controller never spawns above
36; near cars are never evicted to fill a quota. Residence before retirement is at
least 15 active seconds; born-ID entries are deleted with sources. Retirement radius
is at least 270, spawning 190..230, separation at least 14 from traffic and parked cars.
Speed adds a conservative three-second safety horizon. Candidates are finite road-block
midpoints outside junctions, on the existing +/-2.7 lanes, directed into the player's
neighborhood; perpendicular road offset is at most 70. No safe candidate means no spawn
and no consumed ID. New placement is a small typed extension to addVehicle; invalid
roads/directions/positions throw RangeError before mutation. Shared-array, ID/version,
model-disposal and lighting synchronization from stage 63 are reused unchanged.
Road candidates are cached once for the existing fixed configuration; future road
editing would need an explicit rebuild contract. Existing ESLint complexity/depth
limits were preserved by separating validation/static candidates from live selection.

Original checkpoint: seven added regressions and all existing checks passed: build/check, strict TS7,
ESLint/formatting, 90 classic scripts and 98/98 tests. Disabled mode matches the
published stage-63 baseline for the initial 36 and every vehicle state/signal phase
over 3600 steps (180 active seconds). Native r149 repeated adaptive cycles kept views
aligned, IDs unique, population <=36 and individual resources disposable exactly once.
At the original checkpoint, both Edge file smoke modes passed startup, driving, pause/resume, camera, lighting,
sound, presets and mobile touch. Enabled desktop used the default (no query), mobile
used explicit dynamicTraffic=1; the other run used 0. Each addressed run advanced 72
controlled simulation seconds at two road locations, reconciling native views and
periodically rendering. This is not a timed GPU/FPS benchmark or natural-route replay.

Observed mode 0: 36 final/peak cars, 36 total models, no retirements; 1710 live observed
owned geometry/paint/instance resources. Mode 1: 14 additions, 20 removals, 30 final/36
peak cars, 50 total models; 1348 live and 1026 individually disposed observed resources.
Every retired observed resource emitted disposal once, with no duplicate models.
Renderer memory counters: both started at 802 geometries/75 textures; finished at
1021/82 (off), 881/79 (on). Uploads vary as cars move into view: these counters are not
byte totals, an identical-image comparison or a proof of FPS improvement.

Limits: distant appearance is conservative for the current 135-unit traffic visibility
and normal chase/orbit offset, not arbitrary camera teleports or future view-distance
changes. Some central positions have no eligible out-of-view midpoint; population may
remain below budget. Manual external additions are not forcibly capped/evicted.
No new models/UI, physics/rules changes, renderer changes or FPS claim. Existing
diagnostics are preserved; compact new helpers/baseline evidence and browser results
are isolated in ../tbs-adaptive-stage64-20261016. Local commit only; no push or stage 65.

## Stage 63 - dynamic road traffic membership - 16 October 2026

Started clean on main at published 5fbdec1ea9de30b6406f12eca0695240efd6304f;
local origin/main matched, xetarv/GitHub noreply author and committer confirmed.
TrafficSimulation adds addVehicle(variant?), removeVehicle(id) and a membership version.
IDs start after the unchanged initial 0..35 and are never reused; invalid variants
throw RangeError, missing/invalid removals return false without changing version.
The original array is mutated in place, preserving physics/audio consumers.
TrafficView reconciles ID membership only on version changes, retains existing models,
and exposes its applied version. Pending changes take effect on the next traffic
update (playing, before player physics). Factory failures clean up their own allocations
and remove unrenderable sources before propagating the error; surviving models and
simulation membership stay aligned. Failed initial view construction releases completed
traffic models too. Ordinary per-frame positioning/visibility/animation is unchanged.

CarModels now owns per-car allocations explicitly: scoped native constructor tracking
plus local wrappers around verified allocating geometry/material/texture helpers.
disposeTrafficCar is idempotent and ignores foreign models. Shared box geometry,
materials, logo and the factory-wide shadow texture survive removals; individual
geometry/material/texture allocations and InstancedMesh buffers are released.
Original helpers/builders, model-selection map, Fastback and parked vehicles remain.
One necessary consumer adjustment: lighting's material list refreshes by the applied
visual version, not the pending simulation version, avoiding stale references, incorrect
night intensity and missed changes across pause/resume. No new world lifecycle system.

Seven addressed regressions cover membership, IDs, native r149 resource ownership and
construction failure, repeated view reconciliation, real physics collision inputs,
night lighting across pending updates, and cleanup after failed initial construction.
Native baseline comparison matched all 36 records through 300 simulation steps and
all four model hierarchies, geometry buffers, material values/sharing, transforms,
instance matrices and animation. Node Canvas is stubbed; this is not a pixel claim.
Final build/check passed strict TS7, ESLint, formatting, 90 classic outputs and 91/91
tests; diff --check passed. Real Edge file smoke passed startup/driving/pause, camera,
lighting/audio, quality presets, resize and mobile touch. Its dynamic check exercised
three add/remove cycles (compact/van/shuttle) and one intentionally failed sedan build:
initial 36 and array identity retained, no duplicate models, failed source rolled back,
127 individual native geometry/InstancedMesh resources disposed once, shared resources
untouched. Renderer geometry count was 808 before and after the cycles. A premature
memory assertion in the diagnostic hook was corrected to run after removal; the first
check stopped at ESLint's preserve-caught-error rule, fixed without suppressing it.
No FPS benchmark or full-frame pixel claim. Only the final successful check ran the
full 91-test suite; addressed tests were repeated for relevant changes.
Compact comparison/browser helpers and baseline sources are outside the repository
in ../tbs-traffic-stage63-20261016. Historical diagnostics are untouched.

Direct membership mutation, arbitrary IDs and automatic district streaming are not
supported. Removing a model alone does not remove its simulation source: use the domain
API. The shared factory shadow texture lives with the factory; world/app teardown and
arbitrary new-quarter lighting remain outside scope. Local commit only; no push/№64.

## Stage 62 - explicit reflection source snapshots - 16 October 2026

Started clean at published fdbf2562d0b7b28a9b348bd76226c6a354160703; fetch confirmed
main/origin/main equality and xetarv/GitHub noreply author/committer identity.
GraphicsPort now accepts ordered snapshots through setReflectionObjects and
setReflectionBuildings. Maps reconcile by source/descriptor identity, deduplicate
inputs, retain existing clones/proxies and forget removed entries. Building changes
are applied when descriptors are explicitly resubmitted. Unused owned proxy materials
are disposed; shared proxy geometry lives until graphics disposal. Native clones borrow
world resources, which are never recursively disposed. Identical snapshots do not
invalidate quarter reflections; changed snapshots refresh quarter even at unchanged
daylight, subject to the original proximity and time gates. Cube/water schedules and
position/quaternion/distance visibility semantics remain unchanged. No per-frame scan
of world membership, target recreation or new global registry. After dispose both
snapshot methods are no-ops; existing cleanup remains idempotent.

Four added native r149 regression tests cover identity/order, duplicates, transforms,
removal, changing building descriptors/material sharing, repeated churn/disposal and
all 13 cube/water/quarter passes with existing throttling, unchanged snapshots and
fully empty sets without invalid native add calls. Addressed lifecycle checks used
erased TS during development. Eight old/new native pipeline
fixtures match unchanged shader strings/uniforms, pass order, presets, transforms,
resize and refresh intervals (controlled renderer, not a pixel comparison).
Final build/check passed strict TS7, ESLint, formatting, 90 classic scripts and 84/84
tests; git diff --check passed. Only the classic graphics JS output changed. Real Edge file smoke
passed startup, driving/pause, camera/lighting/audio, resize, presets and mobile touch.
Its addressed native WebGL check exercised three add/remove cycles: new clone present
in all 13 reflection passes, removed clone absent, duplicate registration retained
identity, removed proxy material disposed once, world resources untouched. Geometry
count was 801 before and 802 after: one reusable test-source geometry, not per-cycle
growth. The test then disposed its own geometry/material. Two new screenshots and
compact verification scripts are outside the repository in
../tbs-reflections-stage62-20261016; historical artifacts were not overwritten.

Limitations: quarterLighting/reflective, facade textures and lighting.ts material
collection remain initialization-time contracts; no automatic new-quarter lighting.
Retained source clones do not automatically rebuild changed nested topology/materials;
explicit removal and re-addition rebuilds them. No FPS or full-frame pixel claim.
No streaming/editor/renderer redesign, dependency changes or next stage. One local
stage checkpoint is authorized; push is not authorized.

## Stage 61 - owned graphics resource disposal - 16 October 2026

Started clean at published a89b693ee16764a7263308fd53ce11bd9e831cd5; fetch confirmed
main/origin/main equality. GraphicsPort now exposes idempotent dispose. Ownership is
limited to the adapter's scene/depth/cube/optional-quarter/water targets, fullscreen
geometry/material, shared proxy geometry and deduplicated proxy materials. Cloned
boats/sky share world resources and are detached without recursive GPU disposal.
Native r149 target deallocation disposes uploaded depth through the renderer listener;
a temporary depth-dispose observer supplies cleanup only if that listener did not run
(e.g. target never rendered), avoiding duplicate depth disposal.

Only still-owned environment-map bindings and water uniforms/hooks are restored or
removed. Superseding external replacements are preserved, terrain wave data remains,
and a retained disposed shader wrapper cannot reattach freed reflection targets.
Renderer autoReset is restored when still owned; an own bound target is detached,
foreign bindings preserved. No renderer/world/foreign material/texture disposal.
Renderer-owned caches, including PMREM, remain its owner's responsibility.
After disposal render/resize are no-op, setQuality returns the last quality and getters
remain readable. Neither ordinary quality/resize nor disposal stops the runtime.
Native RenderTarget.setSize disposal events remain the original r149 resize behavior.

Display owns its quality/resize listeners; input/audio/other adapters retain theirs.
Bootstrap presentation still composes those ports. Full app teardown, world recreation,
event removal and renderer destruction are outside this stage. No new manager/layer.

Four new native lifecycle regression tests and existing reliability tests passed first
against erased TS sources. Eight old/new active pipeline fixtures also match shader
strings, uniforms, passes, quality/depth/quarter/storage scenarios and transforms.
Final build/check passed strict TS7, ESLint and 80/80 tests; diff --check passed.
Real Edge file test passed startup and all presets, then observed 38 own resources
disposed exactly once, including actually uploaded r149 depth. Foreign resources and
renderer stayed usable, repeated disposal/post-dispose no-ops passed and direct world
render after cleanup used the restored terrain water shader without errors.
No FPS/full-frame pixel claim; prior diagnostics untouched. Compact new evidence:
../tbs-gpu-stage61-20261016. Changes are confined to graphics TS/dist, consumed types,
one regression test and existing docs. One local checkpoint; xetarv/GitHub noreply.
No push or stage 62.

## Stage 60 - exhaustive static traffic model selection - 16 October 2026

Started clean at published cf618d44b6830a512ea747bcc7a93c56f70a8145; fetch confirmed
main/origin/main equality. createCarModels now owns a private exhaustive
Record<TrafficVariant, TrafficModelDefinition>: body callback, passenger lighting,
scale and optional proportions. Two small family helpers retain the original
passenger/commercial factories and operation order. The public createTrafficCar API,
default sedan, untyped sedan-like fallback/metadata and animateVehicle are unchanged.
No domain/traffic distribution, physics, Fastback builder, world or GPU code changed.
Adding a fifth variant requires its type/family contracts, a map entry and tests;
opt-in spawning still belongs to domain/traffic.ts. No registration/plugin system.

Three targeted regression tests verify all four body choices, assembly order/data,
scales, animation, default/prototype-key fallback and strict rejection of an incomplete
map. Existing real-r149 fixtures compare complete before/after geometry buffers,
materials, transforms, Canvas records, object/reference order, userData, animation and
suspension batching for all four cars, default sedan and the untouched Fastback.
The comparisons match. Final build/check passed strict TS7, ESLint and 76/76 tests;
diff --check passed. Short existing Edge file smoke confirms all four variants,
original scales/userData, player Fastback and motion of the same 36 traffic vehicles,
without runtime/WebGL/resource errors. No full-frame pixel or FPS claim.

Only car-model TS/dist, its minimal definition contract, one regression test and
existing navigation/status docs changed. Prior diagnostics untouched; new compact
evidence: ../tbs-models-stage60-20261016. One local checkpoint, xetarv/GitHub noreply.
No push or subsequent stage.

## Stage 59 - architecture navigation and Codex guidance - 16 October 2026

Started clean at published e92ded22e3b548f234377d9080fe303d2a3fc52f; fetch confirmed
main/origin/main equality. AGENTS.md now routes tasks to the existing compact
docs/refactoring.md map and only the relevant sources/contracts. The map records
actual startup/TBS wiring, layer boundaries, vehicle/mission/world extension routes
and selected limits: static reflection collections, missing resource-disposal API,
and implicit registry/userData/late graphics references. Recommendations are deferred.
Local links, named contracts/integration functions, documentation formatting and
diff --check verified. Production files/dist/tests/dependencies and diagnostics
unchanged. No build/check/browser/FPS audit needed or run for documentation only.
One local documentation checkpoint; no push, code changes or stage 60.

## Stage 58 - scene/geometry state contracts - 16 October 2026

Started clean at published 31602a7e0e5e64e40491bca76c01e194d6196d0c; fetch
confirmed main/origin/main equality. Both overstatements were still present.
Scene.fog now allows null, matching native Scene before setup; lighting captures and
narrows the actual fog before updating it. createScene still assigns the exact same
FogExp2/color/density. Generic BufferGeometry/QuarterMutableGeometry attributes now
allow undefined, including unknown names on prepared primitives. A small surface
geometry contract records only native constructors' actual position/normal/uv outputs.
Extrude/Tube and primitive/clone declarations use these verified attributes; the
Fastback rounded-box cache retains its real primitive type without runtime changes.
Manual leaf positions and vegetation bounds now reject missing position explicitly;
registered groups continue to fail open if their positions are removed. No new as/!
was used to hide absence, no compiler/lint relaxation and no state-machine layer.

Addressed tests first: isolated strict TS7 rejects three unsafe reads, accepts narrowed
reads and known primitive attributes; native r149 verifies empty Scene/BufferGeometry,
primitive attributes/clones, fog/no-fog lighting and removed-position culling behavior.
One final build/check passed strict TS7, ESLint, formatting, classic output validation
and 73/73 tests. diff --check passed. Prepared-scene and culling old/new native
fixtures also match. The negative type fixture initially assumed TS7 exit 2; it was
corrected to require failure plus exactly the three intended diagnostics (TS7 exits 1).

Runtime JS is intentionally changed in exactly lighting, vegetation-culling and
visual-assets for those absent-data guards; all 87 other dist files are byte-identical.
No geometry values, material, generation order, shader, graphics-quality or successful
render algorithm changed. Full executable AST equality is not claimed for new guards.
No browser/FPS audit was run; native/addressed tests cover the changed states.
Existing diagnostics untouched; compact new evidence: ../tbs-contracts-stage58-20261016.
One local stage-58 checkpoint, xetarv/GitHub noreply. No push or stage 59.

## Stage 57 - targeted reliability fixes - 16 October 2026

Started clean at published b8cc9fb7ca430eda6ca6a505504a205004d7d642; fetch confirmed
main/origin/main equality. All four Astra findings were still applicable.

- Graphics preset lookup now requires own properties at initialization and in
  setQuality; inherited/invalid keys fall back to medium. Valid presets are unchanged.
- App error reporting logs the original thrown value and formats primitives/null/
  undefined safely, including a fallback for hostile message getters/coercion.
- Failed render passes restore prior target, cube face, mip level, toneMapping and
  XR enabled state in finally. CubeCamera mipmap flags are also restored. Successful
  render order, shader strings, materials and all quality values are unchanged.
- Runtime frame/start failures clear running/frameId and rethrow the original error;
  explicit restart is possible without duplicate live scheduling.

Permanent tests cover inherited profiles, arbitrary exceptions, seven render-failure
paths (quarter/car cube, water, main, post, low, no-depth), successful render routes,
and initialize/step/hidden/scheduler failures plus restart. Addressed first against
TS sources using Node's erased annotations without modifying dist. Eight existing
r149 old/new successful-path fixtures also match. One final build/check passed
strict TS7, ESLint, formatting, current dist and 69/69 tests; diff --check passed.
Limited Edge file:// check passed real valid/invalid profiles, renderer-failure
restoration, subsequent high water/car/quarter reflections, runtime restart and
throw-null startup reporting. No unintentional runtime/WebGL/resource errors.

Only app/runtime/graphics production code, three generated outputs, minimal consumed
r149 declarations, regression tests and these status records changed. No dependency,
architecture, gameplay or rendering-quality change. Historical diagnostics untouched;
new compact evidence: ../tbs-reliability-stage57-20261016. No full audit, benchmark,
push or stage 58. One local stage-57 checkpoint; xetarv/GitHub noreply identity.

## R4 stage 56 - Production TypeScript migration complete - 15 October 2026

All production JavaScript in src has been migrated: 89 production TS, 90 classic
JS in dist (including build-smoke), zero production JS. Actual counts verified.
Published baseline: f4e98593d7d320c93927f60a06d1b95731a95442.
Local stage 53: 2b14be55b76d3038219d393a8b9d8d1a28f90145 (authorized metadata-only
correction; historical pause and old SHA retained below).
Local stage 54: 5f1fbd18cc6b6f56770cf04b896abcdb679386a6.
Local stage 55: f65fe06885ced35dce6f241b7cc7e15552f534f2. Stage 56 closes this checkpoint.
All author/committer identities use xetarv / GitHub noreply.

App IIFE, startup order, runtime/session order, play query and error reporting retain
their full executable AST. Unknown caught errors are only structurally annotated for
the existing message read; no new runtime validation or recovery behavior was added.
Eight old/new app startup/error scenarios pass; all six R4 ASTs match. All 84 earlier
dist files retain byte hashes and stage-53 TS implementations are unchanged. Exactly
six HTML paths changed in their original positions; all 93 external script paths
exist, namespace precedes production registry consumers, app remains last.
Two diagnostic tools had stale hashing paths for migrated vegetation/terrain/population;
only these paths were updated to dist. No active loader references removed JS sources.
The remaining architecture test JS path is a deliberate virtual lint fixture.

Final build/check: strict TS7, ESLint, formatting, current dist, 64/64 tests.
Final existing Edge file smoke passed desktop/mobile with separate new outputs:
real 3D startup, player and all traffic variants, movement/steering/braking, traffic
progress, pause, cameras, HUD/minimap, missions display, sound, lighting modes,
all quality presets, resize, compiled water shader, high postprocessing and car/quarter
reflections. Desktop runtime/WebGL errors and failed local requests: none.
Actual registered scene groups: 840, with 783 outside the sampled camera frustum.
The vegetation switch affects its 421 groups and preserves independent city/signal
culling instances. Mobile lowPower, touch accelerator and camera switching pass.
Compiled app also handles missing Three, window errors and caught startup errors in
separate browser fixtures. Quarter, water day/night and mobile images were reviewed.
No full-scene pixel identity or FPS/GPU performance claim is made.

The initial final-smoke assertion incorrectly treated three culling API instances as
one; corrected only the external observer to test the vegetation-owned group subset.
Original failure log/snapshot and successful retry are retained separately. Earlier
external fixture syntax/cross-realm/namespace-position issues were also harness-only.
No game operations were modified for these test corrections.

All 90 recorded historical artifact-directory timestamps remain unchanged; historical
file contents were not mass-rehashed. New compact evidence resides outside Git:
../tbs-r4-64a61b5f. Prior diagnostics and pause records are preserved.
Four distinct local checkpoints complete R4. Push and FPS optimization were not run.
Only the expressly authorized metadata correction rewrote stage 53; no other history
was rewritten. No subsequent development stage was started.

## R4 stage 55 - completed - 15 October 2026

Graphics pipeline migrated: 88 production TS / 89 classic dist / one remaining JS.
Full executable AST matches, including exact postprocessing and water shader strings.
Eight native r149 old/new fixtures cover depth true/false, quarter present/absent,
blocked storage, preset transitions, fallback, resize, update intervals/positions,
original compile hook, uniforms/references, real CubeCamera passes using a controlled
renderer double, and restoration of toneMapping/xr. Build/check: strict TS7, ESLint,
64/64 tests. Targeted Edge file WebGL check passed actual high/medium/low/high, depth,
water shader, car/quarter cube maps and restoration, without runtime/WebGL errors.
An external observation script had a syntax typo before page launch; corrected retry
passed. Game code was unchanged for it. Final complete desktop/mobile smoke after 56.
Existing stage-53 TS implementations unchanged; shared r149 declarations extended
for actual renderer/cameras/targets/materials. No dependency/lint relaxation.
Historical diagnostics retained; separate evidence: ../tbs-r4-64a61b5f. No push/FPS test.

## R4 stage 54 - completed; identity pause resolved - 15 October 2026

The user authorized one metadata-only amendment of stage 53:
old f684cb0bb17c34dd56acb41b2664cd74ccb98d49 ->
new 2b14be55b76d3038219d393a8b9d8d1a28f90145. Author/committer are xetarv
with GitHub noreply. Tree feb19476fc78754d945b8666a9e11994f0e9198e, parent,
message and both unstaged pause documents were verified identical. Local repo
identity is now explicit; no global/system config changed. Stage 53 was not retested.
Vegetation culling migrated: 87 production TS / 88 classic outputs / two JS.
Full executable AST matches. Existing four test loaders now use compiled culling.
Build/check: strict TS7, ESLint, 64/64 tests including partition, wind, invalid inputs,
clones/fail-open, buffer versions, parent transforms, shadows and reflection frusta.
Native old/new r149 fixture also proves original this forwarding and patch-once,
revision rejection, actual culling, live disable, movement and matrix/color integrity.
A fixture-only cross-realm Array assertion was normalized; game code was unchanged.
Historical pause entries above/below remain chronological records. Final Edge after 56.
No push/FPS optimization. Evidence: ../tbs-r4-64a61b5f.

## R4 paused after stage 53 - commit identity issue - 15 October 2026

Stage 53 local commit: f684cb0bb17c34dd56acb41b2664cd74ccb98d49.
Scene/lighting/display migrated: 86 production TS / 87 classic dist / three JS.
Build/check passed strict TS7, ESLint and 64/64 tests; all three full executable
ASTs and native r149/renderer/DOM fixtures match. Final Edge smoke is not yet run.
Git automatically selected a corporate identity rather than R3's GitHub noreply.
No commit was rewritten because R4 explicitly prohibits rewriting successful commits.
Stages 54-56 have not started. Authorization to correct stage-53 author/committer
metadata is needed before continuing; no Git identity configuration was changed.
New evidence: ../tbs-r4-64a61b5f. No push, FPS changes or diagnostic deletion.
This pause record is intentionally uncommitted.

## Current R3 status - 15 October 2026

Published R2 base: 9a207b70b84a81e096b98b3af187aab32f032070, main.
Stage 50: 7484f929ea9a9cd16bb9d29a96af9f955317cf58.
Stage 51: 0fa399d03a0c27eb711356233e1658d97d4053dd. Stage 52 completed in this checkpoint.
83 production TS / 84 classic dist / six remaining JS. Build/check 64/64,
seven exact ASTs and all traffic variants/control/batching r149 comparisons passed.
Final desktop/mobile Edge file smoke passed, including actual Fastback/all traffic
variants, steering, brakes/reverse lights, nighttime lights, sound and mobile camera.
An initial added getHex assertion rounded differently under the game's color management;
its exact Color.equals replacement passed. Both attempts are retained; game code unchanged.
All 14 ASTs and r149 scenarios passed across the three stages. Three Canvas textures
were pixel-identical in the stage-51 targeted browser check; no full-game/FPS claim.
All 70 prior dist hashes match; 93 script paths exist. Protected integration modules,
ESLint and dependencies are unchanged. Historical diagnostic folder timestamps retained.
R3 is complete in three separate local checkpoints.
No push or stage 53. Historical diagnostics retained; new evidence in tbs-r3-5d686b5f.

## Current R2 status - 15 October 2026

R1 published base: 7ea72ebdf63060ce4d12dc670f1d1c9c08eba6eb, main.
Stage 46: 3db9f8dbfbd54165ee8830888cc7336c52da7e18.
Stage 47: e0e05a5dedafcea2ab516808ad21d2b548f179eb.
Stage 48: 0e1966e5fc435749f8ddfe8760c27db62a8f69ae.
Stage 49 completed in this checkpoint; 69 production TS / 70 classic dist / 20 remaining JS.
Build/check 64/64, exact AST and native full-grid/material/placement/batching comparison
passed. One final existing Edge desktop/mobile file smoke passed, including running
transport, controls, camera, audio and graphics presets. Actual waterfront/park renders,
water shader/waveTime and real image-ready queues passed in the same browser.
All 93 script files exist; 64 prior dist byte hashes match. The 90 prior diagnostic
folder timestamps are unchanged; historical file contents were not mass-rehashed.
R2 is complete in four separate local commits; no full-scene pixel/FPS claim.
No push, R3 or stage 50. Historical diagnostics retained; new compact evidence in
tbs-r2-20261015-bl0T7n. Earlier preflight stops are historical.

## Текущая рабочая сессия — 15 октября 2026

Рабочий ноутбук: `C:\Users\s.nikushkin\Documents\tbs-togliatti`, ветка main.
Разрешённый fast-forward завершён: исходные HEAD и origin/main пакета Р1 —
`499b051cf5e953590780200264435beb1df98567`. Этапы №39–41 опубликованы;
утверждения о локальном статусе ниже относятся к историческому снимку.
Зависимости синхронизированы npm ci без изменения manifest/lockfile.

№42: shell/office/entrance/block переведены; 55 production TS, 56 classic dist.
Проверены четыре AST и 20 сценариев r149 с порядком фабрик, ссылками style/body,
материалами, отражениями и граничными ширинами/seed. build/check: 64/64 теста, strict TS7.
Разрешён автономный пакет №42–45 с отдельными локальными коммитами; push и №46 запрещены.
Итоги следующих ступеней добавляются в эту текущую запись и журнал.

## R1 current result - 15 October 2026

Stage 42: f738a1863f6cf037ac19e25fe888bb83ec465df6.
Stage 43: dcd9ced1e95124b7ef440c838656c8a624e97618.
Stage 44: 855bb62aa9e44e83d8be691b4e14b605cc1cb0fa.
Stage 45: signs/facades/fixtures migrated; 63 production TS, 64 classic outputs.
The user explicitly resolved the earlier lint conflict by authorizing call ternaries
only for materials.ts and visual-assets.ts. The old stop is retained in the journal.
Stages 44/45: five exact ASTs; native r149/Canvas-command fixtures match for 44.
Build/check passed 64/64 tests, strict TS7 and ESLint at both resumed stages.
Final existing desktop/mobile Edge file smoke passed, including driving and audio.
Native comparisons: 64 Canvas pixel hashes, rendered leaf shader and two ready-state
resource scenes match originals. All 93 script paths exist; 52 prior dist hashes match.
The 90 historical artifact directories retain recorded timestamps; no mass file audit.
The earlier stop was resolved; all four R1 stages are complete in separate local commits.
New evidence is outside Git in tbs-r1-20261015. Full-scene pixel identity/FPS not measured.
No push or stage 46; previous commits and historical diagnostic data retained.

## Исторический снимок домашней сессии

Снимок домашней сессии от **14 октября 2026**. Это контрольная справка для продолжения
работы, а не утверждение о текущем состоянии любой другой копии проекта.
Перед изменениями проверяй Git и актуальные результаты команд.

## Игра и архитектура

TBS — неофициальная браузерная 3D-игра о поездках и доставке грузов в стилизованном
Тольятти 2040. Есть физика автомобиля, трафик, пешеходы, задания и городской мир.

`bootstrap` связывает чистые `domain` и `application` с внешними `adapters`.
Domain рассчитывает правила и состояния без DOM/Three.js; application управляет
сценариями через переданные интерфейсы. Адаптеры реализуют графику, ввод, браузер,
аудио, UI и сборку мира. Реестр — `window.TBS`/`globalThis.TBS`, с отдельными
`domain` и `application`. Подробности: [архитектура](refactoring.md),
[правила агента](../AGENTS.md), [README](../README.md).

Технологии: Three.js **r149**, WebGL, classic JavaScript, строгий TypeScript,
ESLint 10.12.0, Prettier и Node.js 24+ для инструментов. На домашнем ПК проверен
Node.js **24.21.0**. Сама игра не требует Node.js, HTTP-сервера или интернета:
`index.html` открывается через **file://**; библиотека и ресурсы сохранены локально.
Порядок обычных скриптов обязателен, runtime ESM и bundler не используются.

## TypeScript и команды

- **51 производственный TS-модуль**, включая все 11 модулей domain/application.
- Ещё один технический `src/build-smoke.ts`: всего 52 исходника TS.
- **52 classic JS-файла dist**, включая технический. dist хранится в Git.
- Миграция не завершена: часть JS-адаптеров и внутренних фабрик ещё не переведена.
  Их структурные декларации не означают статическую проверку внутренностей.

`npm run build` сначала выполняет полный strict typecheck, затем emit TS в отдельный
временный каталог, проверяет classic scripts и обновляет dist. Emit-конфигурация
использует noCheck только после строгой проверки; не запускай её вместо общей сборки.
`build:check` проверяет актуальность dist без его изменения. `typecheck` работает
без emission; `build:watch` использует тот же защищённый путь компилятора.

После опубликованного A2 производственный компилятор **TS 7.0.2** явно разрешается через
alias `@typescript/native` с проверкой версии. Alias `typescript` предоставляет
официальный пакет совместимости `@typescript/typescript6@6.0.2`, который загружает
зафиксированный API **TS 6.0.3** для `typescript-eslint` **8.71.2**.
Этот API не используется для производственной сборки.

`npm run check` объединяет ESLint, Prettier, build:check со strict typecheck
и тесты Node.js. ESLint действительно охватывает **52 TS-файла и 12 деклараций**,
сохраняя JS/CJS и ограничения чистых слоёв. Для изменений исходников выполняй
`npm run build && npm run check`; для документации выбирай достаточные проверки.
Не запускай отдельно тесты, уже входящие в check.

## Git и завершённые этапы

Репозиторий: [xetarv/tbs-togliatti](https://github.com/xetarv/tbs-togliatti), ветка `main`.
Последняя подтверждённая опубликованная контрольная точка:
**`dfc26303dfd38f4749607fa80d3215fc6fc99e22`**.
Коммит A2+A3 опубликован поверх `c8fa3e4659caaf6740d2a6b72ee558b08d4b247b` (№38 и A0+A1).
Перед №39 проверено совпадение main/origin/main. Изменения №39 пока локальные.

| Этап | Состояние в этой сессии                                                         |
| ---- | ------------------------------------------------------------------------------- |
| №38  | Опубликован; structure/windows мигрированы, всего 43 производственных TS-модуля |
| A0   | Опубликован; сборщик очищает только собственные временные каталоги              |
| A1   | Опубликован; постоянные тесты сборщика, рост общего набора с 49 до 56           |
| A2   | Опубликован; ESLint для TS, разделение TS7/TS6, 63 теста                        |
| A3   | Опубликованы правила агента, снимок состояния и дополнение журнала              |

Последний успешный отчёт **A2 от 14 октября 2026**: npm ci, build и check прошли,
**63/63 теста** (56 прежних + 7 новых). Все 44 dist побитово совпали с состоянием
до A2. Подтверждена сохранность 1875 прежних диагностических файлов домашней копии,
включая исторические 1869. Данные A2 — `artifacts/eslint-typescript-a2-6a88c92a/`;
[технический отчёт A2](eslint-typescript.md).

Итоговая проверка **A2+A3 от 14 октября 2026**: один `npm run check` прошёл,
**63/63 теста**. SHA-256 восьми файлов A2 и всех 44 dist не изменился;
1886 диагностических файлов, существовавших перед A3, сохранены.
Новые изменения A3 ограничены тремя документами; отдельная сборка и браузерный
тест на A3 не запускались.

При синхронизации домашнего ПК перед A2 существующий Edge file:// smoke прошёл:
запуск, движение, пауза, камера, освещение, звук, графические режимы и мобильный ввод.
На A2 браузерный тест не повторялся: runtime, HTML и Three.js не изменены.
Эти результаты не являются новым профилем FPS или доказательством пиксельной идентичности.

## Ограничения и продолжение

Пакет №39–41 выполнен локально; push запрещён.
№39 сохранён коммитом `d8f10a4f3bdeb7f585cbf74e830f6e9bdd1bb499`,
№40 — `7038d42ade841ee0ff46d08840fb9003411a40a0`.
На №39 переведены showcase roof/pavilion/landscape, на №40 — materials;
на №41 — building components trim/windows/storefront/roof.
Во всём world/showcase больше нет JS-исходников; компоненты зданий
entrance, office и shell остаются JS. Весь world не объявляется мигрированным.

Проверки №40 и №41: build/check, **64/64 теста** в каждом этапе.
Восемь AST миграций совпали. На №40 настоящий Edge Canvas подтвердил стабильное
побитовое совпадение 15 текстур (5308416 RGBA-байт) и всех 683157 операций с аргументами.
Это не утверждение о совпадении framebuffer сцены. На №41 реальные объекты r149
совпали в 16 сценариях четырёх стилей зданий; финальный Edge file:// smoke прошёл,
а desktop-аудит с исходными компонентами совпал по всем 200 вызовам и данным сцены.
Измерения FPS не проводились. Узкое разрешённое allowTernary действует только
в showcase/materials.ts и защищено постоянным тестом.

При каждой ступени прежние dist сохранялись побитово: 44 до №39, 47 до №40,
48 до №41. Добавлены только восемь новых classic JS. Историческая диагностика сохранена.
Результаты: `artifacts/typescript-stage39-dd891581/`,
`artifacts/typescript-stage40-43e1ce27/`, `artifacts/typescript-stage41-2640d867/`.
Подробности — в [журнале](typescript-migration-log.md).

- Сохранить опубликованные A2+A3 и локальные коммиты №39–41 при дальнейшей работе.
  Не коммитить/push без отдельного разрешения; перед публикацией проверить удалённую ветку.
- Не редактировать dist вручную, не ослаблять strict и архитектурные правила.
  Не заменять TS7 компилятором TS6.
- Исторические отчёты содержат прежние числа тестов, пути JS и показатели других ПК.
  Не переносить их как текущие измерения; актуальные сведения сверять с Git и проверками.
- ESLint проверяет прямые архитектурные обращения, не произвольный поток данных через aliases.
  Проектный типозависимый линт TS6 не включён; строгую проверку выполняет TS7.
- Пакет №39–41 завершён локально. Публикация требует отдельного разрешения; №42 не начинался.

История: [журнал миграции](typescript-migration-log.md).
Сборка: [описание инфраструктуры](typescript-build.md).
