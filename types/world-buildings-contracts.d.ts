// Actual stages of createBuildings; remaining JS factory bodies are not statically checked.
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
  buildBuildingShell: (options: BuildingShellOptions) => BuildingShellResult;
  buildOfficeDetails: (options: BuildingOfficeOptions) => void;
  buildBuildingEntrance: (options: BuildingEntranceOptions) => void;
  createFacadeLighting: (options: FacadeLightingOptions) => FacadeLightingModels;
  createBuildingBuilder: (options: BuildingBuilderOptions) => BuildingBuilderModels;
  createPavilionBuilder: (options: PavilionBuilderOptions) => PavilionBuilderModels;
  createIndustrialBuilder: (options: IndustrialBuilderOptions) => IndustrialBuilderModels;
}

type BuildingShellResult = Pick<BuildingComponentContext, 'style' | 'body'>;
// This exact mutation adds shell's fields before consumers. Its return is unused.
// The narrow overload checks both assembly inputs and refines only this staged context.
interface ObjectConstructor {
  assign(
    target: Omit<BuildingComponentContext, 'style' | 'body'>,
    source: BuildingShellResult,
  ): asserts target is BuildingComponentContext;
}
type BuildingShellOptions = Pick<
  BuildingComponentContext,
  | 'parent'
  | 'kind'
  | 'w'
  | 'seed'
  | 'buildingColors'
  | 'reflectionBuildings'
  | 'x'
  | 'z'
  | 'd'
  | 'h'
  | 'mat'
  | 'masonryTextures'
  | 'box'
  | 'scene'
  | 'roofMat'
  | 'trimMat'
  | 'dark'
  | 'facade'
>;
type BuildingOfficeOptions = Pick<
  BuildingComponentContext,
  | 'parent'
  | 'style'
  | 'T'
  | 'seed'
  | 'box'
  | 'x'
  | 'h'
  | 'z'
  | 'd'
  | 'w'
  | 'trimMat'
  | 'whiteMat'
  | 'glassMat'
  | 'parkWood'
  | 'detailBar'
>;
type BuildingEntranceOptions = Pick<
  BuildingComponentContext,
  | 'parent'
  | 'style'
  | 'h'
  | 'seed'
  | 'w'
  | 'x'
  | 'box'
  | 'z'
  | 'd'
  | 'trimMat'
  | 'parkWood'
  | 'glassMat'
  | 'whiteMat'
  | 'roofMat'
  | 'leafMats'
  | 'body'
  | 'curbMat'
  | 'makeTexture'
  | 'T'
  | 'flat'
  | 'grassMat'
  | 'facade'
  | 'orangeMat'
>;

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
