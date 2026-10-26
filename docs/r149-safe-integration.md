# r149 Safe — isolated integration candidate

## Compile-only env-map preparation — 26 October 2026

The isolated `feature/safe-compile-only-startup-20261026` candidate starts from
`166ac744`. Sergey accepted approximately 200 ms of previously measured warm
overhead in exchange for the earlier new-profile improvement; this does not
authorize commit, push or merge.

The Safe vendor applies the frozen compile-only patch, SHA256
`061f51c90a5e594fb344732929a6938ebb5475580f75cfb13347a24b95457fb3`.
The original `three.min.js` remains unchanged. High graphics passes the existing
quarter materials and Fastback paint with their existing 128-pixel cubemap sources
through `renderer.__compileOnlyEnvMaps`. The seven real variants enter the same
83-program preparation owner without resolving PMREM early. Actual draws keep
the original texture resolution path. Polling, cancellation and context generations
are unchanged. Low/Medium retain their previous preparation path.

The map borrows materials/textures; it creates no GPU resources. App drops it on
preparation completion/rejection, and graphics disposal also drops the reference.
No diagnostic activation is required by `index.html`. This section describes the
integration candidate; the earlier Safe promotion and evidence below remain historical.

The ordinary High Start/W smoke verified 83 prepared programs, exact reuse of the
seven env-map variants, and no early PMREM/render or new errors. The current visual
gate remains open: first/night match exactly; camera B differs from A1/A2/A3 by
23,088 pixels (maximum 4/255). Exact historical native A frames and signed deltas
exist, but historical RNG/audio metadata differ. No new tolerance or automatic
visual approval was introduced. Publication readiness is not established.

The isolated branch `integration/r149-safe-candidate` was created from
`5cbd6f741415bf10d44b2a6088b9bc26e1916d50`. During that integration main remained
unchanged. Four historical shaderChecks files were copied and preserved separately
with hashes in the integration diagnostics. The later authorization is recorded below.

## Authorized promotion to main — 21 October 2026

Sergey explicitly authorized transferring this frozen integration into main and
accepted the documented uncertainty of warm startup time. The earlier stopped
visual/performance gates below remain historical records. The addressed control
reproduced the exact signed movement delta between two unchanged production A runs;
it did not establish a new integration-specific difference. The short timing control
retained the new-profile gain (16.174 → 8.622 s); warm pairs were +963 and −116 ms.
No additional shader research or optimization is part of this transfer.

The source integration worktree and all its 41 changes are preserved. Complete
pre-transfer directory backups, Git bundle and tested restored base/overlays are in
`C:/Users/s.nikushkin/Documents/tbs-safe-main-backup-20261021`. Three overlapping files
receive only the reviewed Safe additions; their historical shaderChecks hunks remain
local and are excluded from the Safe commit, together with the unchanged untracked
shaderChecks test. Thus full file hashes of the merged files change, while the
original four file versions and exact historical patch remain preserved.

Final transfer checks are recorded in `artifacts/safe-main-transfer-20261021/`.
Push is not authorized by this promotion.

Main passed one final build/check: strict TS, ESLint, 107/107 tests in the working
copy (including the historical untracked shaderChecks test), and 92 generated
classic scripts. HTML loads 91 dist scripts; the separate build-smoke script is
validated by the existing tooling. Existing script order is preserved, with the two
new helpers immediately before app. One real windowed Edge/file:// High Start/W
passed on RTX 3050 Laptop/D3D11 with shader checks enabled, 76 prepared/87 cached
programs, confirmed movement and no page/WebGL/native errors. No new performance,
visual or lifecycle series was run. The shaderChecks historical hunks/test remain
outside the Safe commit; shader checks are enabled by default in the reviewed engine.

`assets/three-r149-safe.min.js` is the exact reviewed two-phase/session-lifecycle
candidate (SHA256 `5fb78aeaa9ba4092eacdf2018e8e757aebc53eed0f3a98f7202cb7aa8c5684a0`).
The original `assets/three.min.js` and its license remain unchanged. No engine
algorithm, polling interval or shader was rewritten during integration.

The 13 reviewed changes map to the separate engine, `app.ts`, scene/graphics,
bootstrap game/presentation, camera/controls/display/lighting/sound, and two typed
helpers: session listener ownership and terminal world cleanup. Both helpers are
registered through TBS and compiled into classic dist scripts. Factory options now
carry the explicit session-owned `listen` dependency through bootstrap.

Renderer retirement, context generations and ownership stay in the reviewed engine.
TS contracts expose only the operations consumed by startup/cleanup. Optional pass
and disposal hooks represent construction and closed states; missing hooks fail
explicitly. The event listener assertion bridges the native EventTarget signature
after the public overloads validate target/event mapping; callback identity is kept.
Three.js Texture/InstancedMesh discriminators narrow native owner values. Error
descriptions accept unknown thrown values.

Known evidence limits remain: warm +179 ms, early Start/W near one second, one late
menu at 5.29 s and 51–57 ms Long Tasks. Integration checks do not establish their
elimination or absence of all rare races/GC roots. Results are recorded in the
isolated worktree's `artifacts/safe-integration-20261021/`.

The base checkpoint contains five unformatted historical diagnostic files. Their
exact paths are excluded from Prettier in this branch to preserve the evidence
bytes; game sources, declarations, strict typechecking and ESLint remain covered.

## Integration acceptance — stopped at the visual gate

`npm run build && npm run check` passed, including strict TS, classic-script
validation, ESLint and 107/107 tests. The existing mock-renderer disposal test now
explicitly performs the first material draw callback before expecting the deferred
water shader to be published; the rendering algorithm is unchanged.

All eight addressed Edge scenarios passed: High Start/W and session recreation,
KHR-ready/loss/close/restore/F5, cancellation before and after readiness, controlled
shader failure, sequential no-KHR fallback, pending context loss and loss during
close. Native session subscriptions were 39 while live and zero after close; the
old close did not remove the next session's listeners. No stale GL operations or
GL_INVALID warnings were recorded. Expected injected errors and the existing PMREM
sample-count warnings remain visible in the logs.

One new fixed-step integration capture was compared with both saved genuine
production A controls. The first frame and night were pixel-identical. Movement
differed in 13,318 pixels, 15,230 channels, maximum 3/255 against each control.
Conditions and full saved CPU snapshots, camera, world, traffic, RNG, audio and
water parameters matched. Cause is not established; this is not accepted as a
tolerance or attributed to the renderer. No historical mask investigation or
additional browser retries were performed.

The visual gate therefore did not pass. Short startup timing was not run, and the
integration is blocked for merge approval. Primary evidence and masks:
`artifacts/safe-integration-20261021/visual/comparison.json`; functional logs and
snapshots are in the sibling `functional/` directory. No commit, merge or push.
