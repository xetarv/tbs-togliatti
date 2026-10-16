// Exact consumed r149 operations; these merge with existing structural handles.
type TrafficViewPort = GameFramePorts['traffic'] & { readonly version: number };

interface ThreeMatrix4Handle {
  clone: () => ThreeMatrix4Handle;
  multiplyMatrices: (a: ThreeMatrix4Handle, b: ThreeMatrix4Handle) => this;
  toArray: <A extends number[] | Float32Array>(array: A, offset?: number) => A;
}

interface ThreeMatrix3Handle {
  readonly isMatrix3: true;
  readonly elements: number[];
  getNormalMatrix: (matrix: ThreeMatrix4Handle) => this;
  toArray: <A extends number[] | Float32Array>(array: A, offset?: number) => A;
}

interface CameraVector3 {
  setFromMatrixPosition: (matrix: ThreeMatrix4Handle) => this;
  applyMatrix4: (matrix: ThreeMatrix4Handle) => this;
}

interface ThreeBufferAttributeHandle {
  readonly isBufferAttribute: true;
}

interface ThreeSignalAttribute extends ThreeBufferAttributeHandle, ThreeInstanceMatrixHandle {
  readonly array: Float32Array;
}

interface ThreeGeometryHandle {
  clone: () => ThreeGeometryHandle;
  setAttribute: (name: string, attribute: ThreeBufferAttributeHandle) => this;
}

interface ThreeRenderCameraHandle extends ThreeObjectHandle {
  readonly isCamera: true;
  readonly projectionMatrix: ThreeMatrix4Handle;
  readonly matrixWorldInverse: ThreeMatrix4Handle;
}

interface ThreeCameraHandle extends ThreeRenderCameraHandle {}

interface ThreeRenderTargetHandle {
  readonly isWebGLRenderTarget: true;
}

interface ThreeGeometryGroup {
  start: number;
  count: number;
  materialIndex?: number;
}

interface ThreeCompiledShader {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}

interface ThreeMaterialHandle {
  readonly uuid: string;
  set needsUpdate(value: boolean);
  onBeforeCompile: (
    this: ThreeMaterialHandle,
    shader: ThreeCompiledShader,
    renderer: ThreeRendererHandle,
  ) => void;
  customProgramCacheKey: (this: ThreeMaterialHandle) => string;
}

type ThreeMeshRenderCallback = (
  this: ThreeMeshHandle,
  renderer: ThreeRendererHandle,
  scene: ThreeSceneHandle,
  camera: ThreeRenderCameraHandle,
  geometry: ThreeGeometryHandle,
  material: ThreeMaterialHandle,
  group: ThreeGeometryGroup | null,
) => void;

interface ThreeMeshHandle {
  onBeforeRender: ThreeMeshRenderCallback;
  onAfterRender: ThreeMeshRenderCallback;
}

interface ThreeGroupHandle {
  readonly matrix: ThreeMatrix4Handle;
  readonly matrixWorld: ThreeMatrix4Handle;
  updateMatrix: () => void;
}

interface ThreeSceneHandle {
  onBeforeRender: (
    this: ThreeSceneHandle,
    renderer: ThreeRendererHandle,
    scene: ThreeSceneHandle,
    camera: ThreeRenderCameraHandle,
    renderTarget?: ThreeRenderTargetHandle | null,
  ) => void;
}

interface ThreeLibraryHandle {
  Matrix4: new () => ThreeMatrix4Handle;
  Matrix3: new () => ThreeMatrix3Handle;
  InstancedBufferAttribute: new (
    array: Float32Array,
    itemSize: number,
    normalized?: boolean,
    meshPerAttribute?: number,
  ) => ThreeSignalAttribute;
}

interface TrafficSignalHead extends PointXZ {
  horizontal: boolean;
  lamps: ThreeMarkerMeshHandle<ThreeBasicMaterialHandle>[];
  /** Absent until the first updateSignals call, as in the original implementation. */
  active?: 0 | 1 | 2;
}

/** Collected head children are single-material Meshes; parent is read before their removal. */
interface TrafficHousingPart extends ThreeFastbackMesh {
  readonly id: number;
  readonly parent: ThreeGroupHandle;
  material: ThreeMaterialHandle;
  removeFromParent: () => this;
}

interface TrafficHousingRecord {
  head: ThreeGroupHandle;
  local: ThreeMatrix4Handle;
  instance: ThreeMatrix4Handle;
  view: ThreeMatrix4Handle;
  index: number;
  id: number;
  depth: number;
}
