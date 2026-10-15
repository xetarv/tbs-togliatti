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
