# Mission markers TypeScript migration

Stage 21 migrates only `src/adapters/missions/markers.ts` to the existing strict compiler.
It emits `dist/adapters/missions/markers.js` as a classic script. Its one script path changes
in `index.html` without reordering. There are now 27 production TypeScript modules, plus
the technical build-smoke fixture.

## Contracts checked

MarkersOptions retains PresentationState and the MissionPoint target getter. Launch accepts
Readonly<PointXZ>, matching the existing mission controller: a name is not required to place
the pickup ring. Update animation dt remains numeric. The returned API retains the existing
bootstrap marker ports.

Only actual r149 members used here are added to the shared structural declarations: Group,
Mesh with material type preservation, Cylinder/Torus/OctahedronGeometry, MeshBasicMaterial
parameters and opacity, DoubleSide, PointLight, position, Euler angle fields, scale.setScalar,
visibility and scene/group add. Constructor signatures describe the numeric arguments consumed
by this adapter, not every overload accepted by Three.js. Sprite's result is now a real Sprite
handle with position, based on the unchanged world signs helper. Sign textures retain their
existing texture contract. No universal graphics type, cast, suppression or dependency is added.

These are partial structural contracts, not complete Three.js declarations. Unmigrated graphical
adapter bodies and the full runtime library are not statically checked. Later migrations may
need further precise members or separately scoped decisions about complete Three.js types.

## Equivalence and visual checks

Both executable ASTs match. Tests use the bundled Three.js REVISION 149 to compare creation
order, child structure, geometry parameters/attribute/index bytes, materials, light parameters,
transforms and API keys. Frames cover initial/animated beacon, retargeting, launch and relaunch,
zero dt, oversized dt and completion. Target is still called twice per update. The original
last-effect frame remains visible after launchEffect reaches zero, then hides on the next update.

A small isolated test Edge scene renders both versions using actual unchanged sprite and
signTexture helpers. PNG pixels match in four marker states, including animation and pickup.
It uses the existing headless WebGL flags, makes no GPU/performance claim and is not a complete
city visual audit. Original sources, focused fixture, results and before/after images are saved
outside the repository in the local `tbs-markers-stage21-20261013` verification folder.

## Project verification

Validation uses `npm run build`, `npm run check`, `npm run build` and the existing Edge
`npm run test:browser` through `file://`. The existing 49 tests are unchanged. The smoke
covers startup/initial mission, movement, pause/resume and mobile controls without browser
errors; it does not complete all missions. Marker-specific effects are covered above.

Previous 26 TypeScript sources and diagnostic screenshots are preserved. No graphical
algorithm, optimization, gameplay, dependency, build system or security setting changes.
No commit or push is made. Stages 16-21 remain pending final review and publication.
