// Exact consumed resources; imageTexture's remaining JS implementation is unchecked.
interface ThreeTextureHandle {
  image?: CanvasImageSource;
}
interface ThreeCanvasTexture extends ThreeTextureHandle {
  image: HTMLCanvasElement;
}
interface ThreeReadyImageTexture extends ThreeTextureHandle {
  image?: HTMLImageElement;
  userData: Record<string, unknown> & { onReady: (() => void)[] };
}
interface ThreeTextureRepeatHandle {
  copy: (vector: { x: number; y: number }) => this;
}
interface ThreeBasicMaterialParameters {
  fog?: boolean;
}
interface ThreeStandardMaterialParameters {
  envMapIntensity?: number;
  emissiveMap?: ThreeTextureHandle;
}
interface ThreeSpriteHandle {
  readonly scale: ThreeMarkerScale;
}
interface ThreeSpriteMaterialHandle extends ThreeMaterialHandle {
  readonly isSpriteMaterial: true;
}
interface ThreeLibraryHandle {
  SpriteMaterial: new (parameters?: ThreeBasicMaterialParameters) => ThreeSpriteMaterialHandle;
  Sprite: new (material: ThreeSpriteMaterialHandle) => ThreeSpriteHandle;
}
interface ThreeSceneUserData {
  upgradedFacades?: number;
}
type WorldSignsOptions = Pick<
  WorldOptions & WorldResources,
  'makeTexture' | 'markTexture' | 'T' | 'scene' | 'whiteMat' | 'box' | 'orangeMat'
>;
type WorldSignsModels = Pick<
  WorldResources,
  'flags' | 'sprite' | 'signTexture' | 'streetNameplate' | 'addFlag'
>;
type FacadeResourcesOptions = Pick<
  WorldOptions & WorldResources,
  'makeTexture' | 'T' | 'scene' | 'box' | 'dark' | 'trimMat' | 'unitPlane' | 'roofMat'
>;
type FacadeResourcesModels = Pick<
  WorldResources,
  | 'facadeMaterials'
  | 'nightWindows'
  | 'facade'
  | 'architecturalPanel'
  | 'buildingColors'
  | 'masonryTextures'
>;
type StreetFixturesOptions = Pick<
  WorldOptions & WorldResources,
  'mat' | 'T' | 'scene' | 'box' | 'sprite' | 'glowTexture'
>;
type StreetFixturesModels = Pick<WorldResources, 'streetFixtures' | 'streetLight'>;
interface TbsRegistry {
  createWorldSigns: (options: WorldSignsOptions) => WorldSignsModels;
  createFacadeResources: (options: FacadeResourcesOptions) => FacadeResourcesModels;
  createStreetFixtures: (options: StreetFixturesOptions) => StreetFixturesModels;
}

// Exact stage-46 resource assembly and fields assigned before publication.
interface ThreeMaterialHandle {
  userData: Record<string, unknown>;
}
interface ThreeSkidTransform {
  readonly quaternion: { setFromUnitVectors: (from: CameraVector3, to: CameraVector3) => void };
}
interface ThreeStandardMaterialParameters {
  alphaTest?: number;
  bumpMap?: ThreeTextureHandle;
  bumpScale?: number;
}
interface ThreeLoadedImageTexture extends ThreeTextureHandle {
  image?: HTMLImageElement;
  userData: Record<string, unknown> & { onReady?: (() => void)[] };
}
interface ThreeLibraryHandle {
  readonly ClampToEdgeWrapping: 1001;
  TextureLoader: new () => {
    load: (
      url: string,
      onLoad: (texture: ThreeLoadedImageTexture) => void,
    ) => ThreeLoadedImageTexture;
  };
}
interface ThreeSceneUserData {
  newShrubBeds?: number;
}
type LandscapeResourcesOptions = Pick<
  WorldOptions & WorldResources,
  | 'mat'
  | 'makeTexture'
  | 'T'
  | 'WORLD_W'
  | 'visualAssets'
  | 'vegetationCulling'
  | 'scene'
  | 'box'
  | 'flat'
  | 'grassMat'
  | 'lowPower'
  | 'unitPlane'
  | 'curbMat'
  | 'trimMat'
>;
type LandscapeResourcesModels = Pick<
  WorldResources,
  | 'leafMats'
  | 'cityLeafMaterials'
  | 'tree'
  | 'parkWood'
  | 'parkPaving'
  | 'shrubBed'
  | 'parkBench'
  | 'gardenBed'
>;
type WorldResourceBase = Omit<
  WorldResources,
  | keyof WorldSignsModels
  | keyof FacadeResourcesModels
  | keyof LandscapeResourcesModels
  | keyof StreetFixturesModels
>;
interface ObjectConstructor {
  assign<
    T extends WorldResourceBase,
    U extends
      WorldSignsModels | FacadeResourcesModels | LandscapeResourcesModels | StreetFixturesModels,
  >(
    target: T,
    source: U,
  ): asserts target is T & U;
}
interface TbsRegistry {
  createLandscapeResources: (options: LandscapeResourcesOptions) => LandscapeResourcesModels;
}

// Stage-47 terrain and park operations on actual r149 objects.
interface WorldFlagPositionAttribute extends ThreeNumericAttribute {}
interface ThreeShapeHandle {
  quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => this;
}
interface ThreeColorHandle {
  r: number;
  g: number;
  b: number;
  clone: () => this;
  multiplyScalar: (scalar: number) => this;
}
interface ThreeStandardMaterialParameters {
  vertexColors?: boolean;
  flatShading?: boolean;
}
interface ThreeLibraryHandle {
  ConeGeometry: new (
    radius?: number,
    height?: number,
    radialSegments?: number,
  ) => ThreeGeometryHandle;
  RingGeometry: new (
    innerRadius?: number,
    outerRadius?: number,
    thetaSegments?: number,
  ) => ThreeGeometryHandle;
}
