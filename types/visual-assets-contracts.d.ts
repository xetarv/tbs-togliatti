// Actual operations consumed by geometry.ts and visual-assets.ts on bundled r149.
type VisualSurfaceKind = 'asphalt' | 'stone' | 'paving' | 'brick';
interface VisualSurfaceMaps {
  map: ThreeTextureHandle;
  normalMap: ThreeTextureHandle;
  roughnessMap: ThreeTextureHandle;
}
interface BakedVisualSurface {
  beforeSeed: number;
  afterSeed: number;
  randomCalls: number;
  images: Record<keyof VisualSurfaceMaps, string>;
}
interface PreparedVisualSurface extends Omit<BakedVisualSurface, 'images'> {
  images: Record<keyof VisualSurfaceMaps, HTMLImageElement>;
}
type BakedVisualSurfaces = Record<VisualSurfaceKind, BakedVisualSurface>;
type PreparedVisualSurfaces = Record<VisualSurfaceKind, PreparedVisualSurface>;
declare var TBS_VISUAL_SURFACES: BakedVisualSurfaces | undefined;
interface TbsRegistry {
  prepareVisualSurfaces: (
    baked: BakedVisualSurfaces | undefined,
  ) => Promise<PreparedVisualSurfaces | undefined>;
}
interface ThreeNumericAttribute extends ThreeBufferAttributeHandle {
  readonly array: ArrayLike<number> & Iterable<number>;
  readonly count: number;
  getX: (index: number) => number;
  getY: (index: number) => number;
  setX: (index: number, x: number) => this;
  setXYZ: (index: number, x: number, y: number, z: number) => this;
}
interface QuarterMutableGeometry {
  clone: () => this;
  scale: (x: number, y: number, z: number) => this;
  readonly attributes: Record<string, ThreeNumericAttribute | undefined>;
  dispose: () => void;
}
interface ThreeTubeGeometry extends QuarterMutableGeometry {
  readonly attributes: ThreeSurfaceGeometry['attributes'];
  readonly index: ThreeNumericAttribute;
}
interface ThreeCurveHandle {
  getPointAt: (u: number) => CameraVector3;
}
interface CameraVector3 {
  clone: () => this;
  sub: (vector: DisplacementXYZ) => this;
  add: (vector: DisplacementXYZ) => this;
  length: () => number;
  normalize: () => this;
  multiplyScalar: (scalar: number) => this;
  fromBufferAttribute: (attribute: ThreeNumericAttribute, index: number) => this;
}
interface ThreeMeshHandle {
  readonly quaternion: ThreeQuaternionHandle;
}
interface ThreeRendererHandle {
  readonly capabilities: { getMaxAnisotropy: () => number; isWebGL2: boolean };
}
interface ThreeTextureHandle {
  wrapS: number;
  wrapT: number;
  anisotropy: number;
}
interface ThreeStandardMaterialParameters {
  normalMap?: ThreeTextureHandle;
  roughnessMap?: ThreeTextureHandle;
  normalScale?: ThreeTextureRepeatHandle;
}
interface ThreeStandardMaterialHandle {
  onBeforeCompile: (shader: ThreeCompiledShader) => void;
}
interface ThreeLibraryHandle {
  readonly sRGBEncoding: 3001;
  readonly RepeatWrapping: 1000;
  CanvasTexture: new (image: HTMLCanvasElement | HTMLImageElement) => ThreeCanvasTexture;
  Vector2: new (x?: number, y?: number) => ThreeTextureRepeatHandle;
  BufferAttribute: new (array: Float32Array, itemSize: number) => ThreeNumericAttribute;
  CatmullRomCurve3: new (points: CameraVector3[]) => ThreeCurveHandle;
  TubeGeometry: new (
    path: ThreeCurveHandle,
    tubularSegments?: number,
    radius?: number,
    radialSegments?: number,
    closed?: boolean,
  ) => ThreeTubeGeometry;
}
