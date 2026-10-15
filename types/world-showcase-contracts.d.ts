// Confirmed outputs and consumed inputs; remaining JS materials factory is unchecked.
interface ThreePhysicalMaterialHandle {
  opacity: number;
  ior: number;
}
interface ThreeStandardMaterialHandle {
  map: ThreeTextureHandle | null;
  envMapIntensity: number;
}
interface ThreeTextureHandle {
  encoding: number;
}
interface ThreeLibraryHandle {
  readonly LinearEncoding: 3000;
}
interface ThreeColorHandle {
  setHSL: (h: number, s: number, l: number) => this;
}
interface QuarterMutableGeometry extends ThreeGeometryHandle {
  setAttribute: (name: string, attribute: ThreeBufferAttributeHandle) => this;
  setIndex: (index: readonly number[] | ThreeBufferAttributeHandle | null) => this;
  computeVertexNormals: () => void;
}
interface ThreeLibraryHandle {
  BoxGeometry: new (
    width?: number,
    height?: number,
    depth?: number,
    widthSegments?: number,
    heightSegments?: number,
    depthSegments?: number,
  ) => ThreeGeometryHandle;
  BufferGeometry: new () => QuarterMutableGeometry;
  Float32BufferAttribute: new (
    array: ArrayLike<number>,
    itemSize: number,
    normalized?: boolean,
  ) => ThreeNumericAttribute;
}
interface ThreeSceneUserData extends Record<string, unknown> {
  quarterLighting?: QuarterLighting;
  showcaseQuarter?: {
    x: number;
    z: number;
    trees: 3;
    windowBays: 27;
    claddingPanels: number;
  };
  quarterMaterials?: Pick<
    QuarterMaterials,
    'stone' | 'plaster' | 'bronze' | 'glazing' | 'brick' | 'plazaPaving'
  >;
}
interface QuarterLighting {
  x: number;
  z: number;
  entranceLight: ThreePointLightHandle;
  windowLight: ThreePointLightHandle;
  bounce: ThreePointLightHandle;
  lightStripMaterial: ThreeStandardMaterialHandle;
  poolMaterial: ThreeBasicMaterialHandle;
  reflective: [
    ThreePhysicalMaterialHandle,
    ThreeStandardMaterialHandle,
    ThreeStandardMaterialHandle,
  ];
}
interface QuarterMaterials {
  stone: ThreeMaterialHandle;
  bronze: ThreeStandardMaterialHandle;
  frame: ThreeStandardMaterialHandle;
  plaster: ThreeStandardMaterialHandle;
  wood: ThreeStandardMaterialHandle;
  glazing: ThreePhysicalMaterialHandle;
  brick: ThreeMaterialHandle;
  plazaPaving: ThreeMaterialHandle;
  roadRelief: ThreeTextureHandle;
  roadRoughness: ThreeTextureHandle;
  room: ThreeStandardMaterialHandle;
  warm: ThreeStandardMaterialHandle;
  contact: ThreeBasicMaterialHandle;
}
interface QuarterCladdingPanel extends DisplacementXYZ {
  w: number;
  h: number;
  side: boolean;
}
interface QuarterStructure {
  claddingPanels: QuarterCladdingPanel[];
  wall: (
    px: number,
    py: number,
    pz: number,
    w: number,
    h: number,
    d: number,
    material?: ThreeMaterialHandle,
  ) => ReturnType<BoxHelper>;
}
interface QuarterRoof {
  roofGlass: ThreePhysicalMaterialHandle;
}
type QuarterInitialContext = ShowcaseOptions & { x: number; z: number } & QuarterMaterials;
type QuarterStructureContext = QuarterInitialContext & QuarterStructure;
type QuarterRoofContext = QuarterStructureContext & QuarterRoof;

type QuarterMaterialsOptions = Pick<
  ShowcaseOptions,
  'makeTexture' | 'visualAssets' | 'mat' | 'T' | 'nightWindows'
>;

type QuarterGroundOptions = Pick<
  QuarterInitialContext,
  | 'box'
  | 'scene'
  | 'x'
  | 'z'
  | 'brick'
  | 'ROAD'
  | 'roadSurface'
  | 'roadRelief'
  | 'roadRoughness'
  | 'flat'
  | 'makeTexture'
  | 'roadInstances'
  | 'unitPlane'
  | 'stone'
  | 'plaster'
  | 'bronze'
  | 'glazing'
  | 'plazaPaving'
>;

type QuarterStructureOptions = Pick<
  QuarterInitialContext,
  'stone' | 'box' | 'scene' | 'z' | 'x' | 'plaster' | 'reflectionBuildings'
>;

type QuarterWindowsOptions = Pick<
  QuarterStructureContext,
  | 'T'
  | 'scene'
  | 'box'
  | 'room'
  | 'wood'
  | 'plaster'
  | 'frame'
  | 'bronze'
  | 'glazing'
  | 'warm'
  | 'stone'
  | 'dark'
  | 'x'
  | 'z'
>;

type QuarterRoofOptions = Pick<
  QuarterStructureContext,
  | 'box'
  | 'scene'
  | 'x'
  | 'z'
  | 'plaster'
  | 'stone'
  | 'frame'
  | 'solarMat'
  | 'wood'
  | 'glazing'
  | 'wall'
  | 'room'
  | 'T'
  | 'bronze'
>;

type QuarterPavilionOptions = Pick<
  QuarterRoofContext,
  | 'box'
  | 'scene'
  | 'x'
  | 'z'
  | 'room'
  | 'plaster'
  | 'stone'
  | 'wood'
  | 'T'
  | 'roofGlass'
  | 'detailBar'
  | 'bronze'
  | 'frame'
  | 'warm'
  | 'glazing'
  | 'dark'
>;

type QuarterBrandingOptions = Pick<
  QuarterRoofContext,
  | 'T'
  | 'signTexture'
  | 'x'
  | 'z'
  | 'scene'
  | 'box'
  | 'frame'
  | 'architecturalPanel'
  | 'factoryTexture'
  | 'droneTexture'
  | 'bronze'
>;

type QuarterLandscapeOptions = Pick<
  QuarterRoofContext,
  | 'flat'
  | 'scene'
  | 'x'
  | 'z'
  | 'plazaPaving'
  | 'visualAssets'
  | 'vegetationCulling'
  | 'box'
  | 'frame'
  | 'T'
  | 'plaster'
  | 'bronze'
  | 'wood'
  | 'contact'
  | 'addFlag'
>;

type QuarterLightingOptions = Pick<
  QuarterRoofContext,
  | 'T'
  | 'x'
  | 'z'
  | 'scene'
  | 'box'
  | 'frame'
  | 'contact'
  | 'flat'
  | 'glowTexture'
  | 'glazing'
  | 'bronze'
>;

type QuarterCladdingOptions = Pick<
  QuarterRoofContext,
  'T' | 'plaster' | 'claddingPanels' | 'scene' | 'x' | 'z'
>;

interface TbsRegistry {
  createQuarterMaterials: (options: QuarterMaterialsOptions) => QuarterMaterials;
  buildQuarterGround: (options: QuarterGroundOptions) => void;
  buildQuarterStructure: (options: QuarterStructureOptions) => QuarterStructure;
  buildQuarterWindows: (options: QuarterWindowsOptions) => void;
  buildQuarterRoof: (options: QuarterRoofOptions) => QuarterRoof;
  buildQuarterPavilion: (options: QuarterPavilionOptions) => void;
  buildQuarterBranding: (options: QuarterBrandingOptions) => void;
  buildQuarterLandscape: (options: QuarterLandscapeOptions) => void;
  buildQuarterLighting: (options: QuarterLightingOptions) => void;
  buildQuarterCladding: (options: QuarterCladdingOptions) => void;
}
