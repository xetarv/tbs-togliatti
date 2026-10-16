// Real r149 members consumed by the original local bus-stop batching implementation.
interface ThreeObjectHandle {
  name: string;
  readonly id: number;
  removeFromParent: () => this;
  updateWorldMatrix: (updateParents: boolean, updateChildren: boolean) => void;
}
interface ThreeMeshHandle {
  readonly isInstancedMesh?: boolean;
}
interface ThreeGeometryHandle {
  readonly type: string;
}
interface ThreeExtrudedGeometryHandle {
  readonly attributes: ThreeSurfaceGeometry['attributes'];
}
interface ThreeNumericAttribute {
  setXY: (index: number, x: number, y: number) => this;
}
interface ThreeBasicMaterialHandle {
  map: ThreeTextureHandle | null;
}
interface ThreeExtrudeOptions {
  curveSegments?: number;
}
interface ThreeShapeHandle {
  absarc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    clockwise: boolean,
  ) => this;
}
interface ThreeMatrix4Handle {
  equals: (matrix: ThreeMatrix4Handle) => boolean;
  copy: (matrix: ThreeMatrix4Handle) => this;
  makeTranslation: (x: number, y: number, z: number) => this;
}
interface StopTrimRecord {
  local: ThreeMatrix4Handle;
  view: ThreeMatrix4Handle;
  id: number;
  depth?: number;
}
interface StopTrimScratch {
  world: ThreeMatrix4Handle;
  normal: ThreeMatrix3Handle;
  position: CameraVector3;
  projectionView: ThreeMatrix4Handle;
}
interface StopTrimBatch {
  shelter: ThreeGroupHandle;
  records: StopTrimRecord[];
  modelView: ThreeSignalAttribute;
  normalView: ThreeSignalAttribute;
  previousView: ThreeMatrix4Handle;
  previousWorld: ThreeMatrix4Handle;
  previousProjection: ThreeMatrix4Handle;
  ready: boolean;
}

interface ThreeFastbackInstancedMesh {
  readonly isInstancedMesh: true;
}

// Stage-49 root-scene collection; unitBox belongs to the single-material box helper.
interface ThreeObjectHandle {
  readonly position: CameraVector3;
  remove: (...objects: ThreeObjectHandle[]) => this;
}
interface ThreeSceneHandle {
  readonly children: ThreeFastbackChild[];
}
interface ThreeNonMeshChild {
  material?: ThreeMaterialHandle | ThreeMaterialHandle[];
}
interface ThreeMaterialHandle {
  name: string;
}
interface ThreeSpriteHandle {
  material: ThreeSpriteMaterialHandle;
}
interface ThreeSpriteMaterialHandle {
  toneMapped: boolean;
  fog: boolean;
}
interface StaticBoxMesh extends ThreeFastbackMesh {
  material: ThreeMaterialHandle;
}
