# Quarter cladding TypeScript migration

Stage 36 migrates only `showcase/cladding.ts`, reusing QuarterCladdingOptions.
The existing strict build emits classic `dist/adapters/world/showcase/cladding.js`.
Only that path changes in index.html; all previous ground/branding changes are preserved.
There are 40 production TS modules plus the technical build-smoke fixture.

## Real consumed contracts

Existing structural declarations gain Shape moveTo/lineTo/closePath, ExtrudeGeometry options
and translate, standard-material clone/color, Color constructor/setScalar, instanced name and
setColorAt. Native r149 closePath returns void; no invented isShape discriminator is used.
Scene userData gains the optional actual showcaseQuarter record. No casts, any, suppression,
runtime helper, shader change or new dependency is introduced. Contracts remain partial.

## Focused equivalence

Original/generated executable ASTs match. A compact comparison runs the bundled r149 with
real shapes, bevel extrusion, transforms, cloned material and DataTexture references.
Both 13-panel and empty-array scenarios pass. The normal fixture covers both orientations,
varying sizes and positions, and a complete cycle of the per-instance color expression.

Snapshots compare creation order, shape points/options, translated geometry attributes,
index/groups, material/color/map data, all instanceMatrix and instanceColor values, object
transforms, count, name, visibility, shadow flags and scene.userData.showcaseQuarter.
Independent matrix and color checks use Float32 precision. r149's unchanged InstancedMesh
frustumCulled default is false. Empty input retains count zero, an empty matrix buffer and
null instanceColor, still adding the object and metadata exactly as before.
Source plaster color/bumpScale and shared map references are preserved, as is earlier ground
scene data. This is a data/operation comparison, not proof of whole-scene pixel identity.

Originals, fixture and compact results stay outside Git in `tbs-cladding-stage36-20261014`.
The previous 34-35 reports, sources and generated scripts are hash-verified unchanged.

## Project validation

Run `npm run build`, `npm run check`, `npm run build`, `npm run test`, then existing Edge
file:// smoke. The existing 49 tests and repository tools remain unchanged. The smoke launcher
redirects only new screenshots outside the repository, leaving all prior diagnostics untouched.
General counts are updated in README and typescript-build.md.

No other game module, geometry parameter, algorithm, graphic setting, library, compiler or
security configuration changes. No commit or push is performed.
