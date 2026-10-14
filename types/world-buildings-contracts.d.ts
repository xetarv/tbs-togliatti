// Actual stages of createBuildings. The four inner JS implementations remain unchecked.
type BuildingReflectionResources = Pick<BuildingModels, 'reflectionBuildings'>;
type FacadeLightingModels = Pick<BuildingModels, 'cityFacadeLights' | 'addFacadeLighting'>;
type BuildingBuilderModels = Pick<BuildingModels, 'solarMat' | 'building'>;
type PavilionBuilderModels = Pick<BuildingModels, 'showcasePavilion'>;
type IndustrialBuilderModels = Pick<BuildingModels, 'industrialYard'>;

type BuildingsWithLighting = BuildingReflectionResources & FacadeLightingModels;
type BuildingsWithBuilder = BuildingsWithLighting & BuildingBuilderModels;
type BuildingsWithPavilion = BuildingsWithBuilder & PavilionBuilderModels;

type FacadeLightingOptions = Pick<
  BuildingsOptions,
  'T' | 'nightWindows' | 'box' | 'scene' | 'dark' | 'glowTexture' | 'flat'
>;
// block.js forwards the full context to its existing components.
type BuildingBuilderOptions = BuildingsOptions & BuildingsWithLighting;
type PavilionBuilderOptions = Pick<
  BuildingsOptions & BuildingReflectionResources,
  | 'reflectionBuildings'
  | 'makeTexture'
  | 'visualAssets'
  | 'mat'
  | 'T'
  | 'nightWindows'
  | 'box'
  | 'scene'
  | 'trimMat'
  | 'dark'
  | 'whiteMat'
  | 'signTexture'
  | 'flat'
  | 'grassMat'
  | 'leafMats'
  | 'showcaseTree'
>;
type IndustrialBuilderOptions = Pick<
  BuildingsOptions & BuildingsWithLighting,
  | 'mat'
  | 'reflectionBuildings'
  | 'box'
  | 'scene'
  | 'T'
  | 'trimMat'
  | 'nightWindows'
  | 'dark'
  | 'whiteMat'
  | 'glassMat'
  | 'signTexture'
  | 'detailBar'
  | 'addFacadeLighting'
  | 'flat'
  | 'roadSurface'
  | 'orangeMat'
  | 'markTexture'
  | 'roofMat'
  | 'createDrone'
  | 'addFlag'
>;

interface TbsRegistry {
  createFacadeLighting: (options: FacadeLightingOptions) => FacadeLightingModels;
  createBuildingBuilder: (options: BuildingBuilderOptions) => BuildingBuilderModels;
  createPavilionBuilder: (options: PavilionBuilderOptions) => PavilionBuilderModels;
  createIndustrialBuilder: (options: IndustrialBuilderOptions) => IndustrialBuilderModels;
}

// block.js spreads options and specification, then assigns shell's actual style/body result.
type BuildingComponentContext = BuildingBuilderOptions &
  BuildingSpecification & {
    shopSigns: ThreeTextureHandle[];
    solarMat: BuildingModels['solarMat'];
    style: string;
    body: ThreeStandardMaterialHandle;
  };

type BuildingTrimOptions = Pick<
  BuildingComponentContext,
  | 'parent'
  | 'h'
  | 'box'
  | 'x'
  | 'z'
  | 'w'
  | 'd'
  | 'seed'
  | 'trimMat'
  | 'roofMat'
  | 'style'
  | 'glassMat'
  | 'orangeMat'
  | 'cyanMat'
>;

type BuildingWindowsOptions = Pick<
  BuildingComponentContext,
  'parent' | 'style' | 'w' | 'h' | 'x' | 'z' | 'd' | 'box' | 'whiteMat' | 'trimMat'
>;

type BuildingStorefrontOptions = Pick<
  BuildingComponentContext,
  | 'parent'
  | 'w'
  | 'style'
  | 'z'
  | 'd'
  | 'box'
  | 'x'
  | 'glassMat'
  | 'whiteMat'
  | 'T'
  | 'shopSigns'
  | 'seed'
  | 'trimMat'
  | 'orangeMat'
>;

type BuildingRoofOptions = Pick<
  BuildingComponentContext,
  | 'parent'
  | 'style'
  | 'T'
  | 'x'
  | 'w'
  | 'h'
  | 'z'
  | 'd'
  | 'wedge'
  | 'roofMat'
  | 'box'
  | 'glassMat'
  | 'trimMat'
  | 'whiteMat'
  | 'solarMat'
>;

interface TbsRegistry {
  buildBuildingTrim: (options: BuildingTrimOptions) => void;
  buildBuildingWindows: (options: BuildingWindowsOptions) => void;
  buildStorefront: (options: BuildingStorefrontOptions) => void;
  buildBuildingRoof: (options: BuildingRoofOptions) => void;
}
