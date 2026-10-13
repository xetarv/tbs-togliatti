# Bootstrap namespace: TypeScript completion

`src/bootstrap/namespace.ts` replaces the last JavaScript bootstrap source. The build emits
`dist/bootstrap/namespace.js` as a classic script. All four bootstrap modules and all eleven
domain/application modules are now TypeScript: fifteen production modules. The separate technical
`src/build-smoke.ts` fixture brings the build output count to sixteen scripts.

## Registry typing and initialization

The module uses the existing `declare var TBS: TbsRegistry` and its merged member declarations.
No additional global declaration, cast, suppression directive, type-only placeholder or initializer
wrapper is required. TypeScript checks the assignment targets against that single registry type.
The three executable statements remain exactly:

```js
globalThis.TBS = Object.create(null);
globalThis.TBS.domain = Object.create(null);
globalThis.TBS.application = Object.create(null);
```

Methods are registered by subsequent scripts; the initial objects are intentionally empty.
The standard TypeScript declaration of `Object.create` returns `any`. This existing library
boundary is not disguised as proof that an empty registry already contains all methods. Its actual
initial structure and subsequent registration were checked at runtime. No new `any` declaration or
assertion that an empty object is a populated registry was introduced.

The namespace still unconditionally replaces any previous registry when executed. No idempotence
guard was added. Absence of repeated initialization means that `index.html` loads this script once
and later registration scripts retain the same root/domain/application objects.

## Loading and validation

Only the namespace script path was replaced in `index.html`; its position is unchanged. The four
asset scripts before it define Three.js/asset globals, not the `TBS` registry. Namespace precedes
every script that uses the registry. The test loader now loads the compiled namespace first.

Addressed checks confirmed:

- Identical executable AST before and after compilation.
- Exactly three `Object.create(null)` calls and root/domain/application assignment order.
- Three distinct empty objects with null prototypes immediately after initialization.
- Preservation of unconditional replacement behavior for a preexisting registry.
- Stable registry references and null prototypes while loading subsequent real scripts.
- Registration of domain/application without browser globals and full registration with `window`.
- One namespace inclusion and no registry use by earlier asset scripts.
- All fourteen previously migrated source files unchanged by SHA-256.
- Four invalid scalar/misspelled registry assignments rejected by the strict compiler.

Run the existing sequence:

```sh
npm run build
npm run check
npm run build
npm run test:browser
```

The 49 existing tests are retained. Edge smoke uses a fresh test profile and a cold `file://`
navigation, then checks startup/HUD, driving, pause/resume, camera, lighting, sound controls,
resize, graphics presets and mobile touch controls. Existing diagnostics are preserved and new
screenshots/logs are stored separately. JS adapter internals remain outside strict static checking,
as documented in previous bootstrap stages. No dependencies, build tooling, game behavior or
security settings were changed. No commit or push is performed by this stage.
