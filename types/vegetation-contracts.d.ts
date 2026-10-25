// Native r149 bounds/buffer contracts used by the existing culling hook.
interface BoundsBoxHandle {
  min: CameraVector3;
  max: CameraVector3;
  clone: () => this;
  copy: (box: BoundsBoxHandle) => this;
  union: (box: BoundsBoxHandle) => this;
  applyMatrix4: (matrix: ThreeMatrix4Handle) => this;
  expandByScalar: (amount: number) => this;
  expandByVector: (vector: DisplacementXYZ) => this;
}
interface ThreeGeometryHandle {
  readonly attributes: Record<string, ThreeNumericAttribute | undefined>;
  boundingBox: BoundsBoxHandle | null;
  computeBoundingBox: () => void;
}
interface ThreeNumericAttribute {
  version: number;
}
interface ThreeInstanceMatrixHandle {
  version: number;
  usage: number;
}
interface ThreeMatrix4Handle {
  set: (...elements: number[]) => this;
}
interface ThreeObjectHandle {
  userData: Record<string, unknown>;
  readonly matrixWorld: ThreeMatrix4Handle;
}
interface InstancedMeshHandle {
  geometry: ThreeGeometryHandle;
  material: ThreeMaterialHandle | ThreeMaterialHandle[];
  readonly instanceMatrix: ThreeInstanceMatrixHandle;
  instanceColor: ThreeInstanceMatrixHandle | null;
  getMatrixAt: (index: number, matrix: ThreeMatrix4Handle) => void;
  getColorAt: (index: number, color: ThreeColorHandle) => void;
  frustumCulled: boolean;
}
interface ThreeFrustumMesh extends ThreeMeshHandle {
  count?: number;
  instanceMatrix?: ThreeInstanceMatrixHandle;
}
interface ThreeFrustumHandle {
  setFromProjectionMatrix: (matrix: ThreeMatrix4Handle) => this;
  intersectsObject: (this: ThreeFrustumHandle, object: ThreeFrustumMesh) => boolean;
  intersectsBox: (box: BoundsBoxHandle) => boolean;
}
interface VegetationBoundsEntry {
  local: BoundsBoxHandle;
  world: BoundsBoxHandle;
  matrix: ThreeMatrix4Handle;
  count: number;
  attribute: ThreeInstanceMatrixHandle;
  version: number;
  geometry: ThreeGeometryHandle;
  positions: ThreeNumericAttribute;
  positionVersion: number;
  active: () => boolean;
}
interface VegetationGeometryBounds {
  box: BoundsBoxHandle;
  positions: ThreeNumericAttribute;
  version: number;
}
interface ThreeSkidTransform {
  copy: (source: ThreeObjectHandle, recursive?: boolean) => this;
}
interface ThreeLibraryHandle {
  Frustum: { new (): ThreeFrustumHandle; prototype: ThreeFrustumHandle };
  Box3: new () => BoundsBoxHandle;
}
