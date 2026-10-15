// Actual factory inputs/outputs used by world bootstrap; JS implementations remain unchecked.
interface WorldConstructionState {
  maglevTrain: ThreeGroupHandle | null;
  centralSquare: PointXZ | null;
}
interface BuildWorldOptions {
  T: ThreeLibraryHandle;
  canvas: HTMLCanvasElement;
  config: Readonly<GameConfig>;
}
type WorldDimensions = Pick<
  GameConfig,
  'WORLD_W' | 'WORLD_H' | 'ROAD' | 'roadsX' | 'roadsZ' | 'isParkBlock'
>;
type SceneResources = Pick<
  PresentationWorldResources,
  | 'renderer'
  | 'scene'
  | 'lowPower'
  | 'camera'
  | 'ambientLight'
  | 'sun'
  | 'blueLight'
  | 'sky'
  | 'duskSun'
>;
type GeometryHelpers = Pick<PresentationWorldResources, 'detailBar' | 'wedge'>;
interface DisplacementXYZ extends PointXZ {
  y: number;
}
interface InstancedMeshHandle extends ThreeMeshHandle {
  readonly isInstancedMesh: true;
  count: number;
}
interface BoundsBoxHandle {
  readonly isBox3: true;
}
interface VegetationCulling {
  add: (
    parent: ThreeObjectHandle,
    mesh: InstancedMeshHandle,
    options?: { displacement?: DisplacementXYZ; cellSize?: number },
  ) => InstancedMeshHandle[];
  register: <M extends InstancedMeshHandle>(mesh: M, displacement?: DisplacementXYZ) => M;
  bounds: (mesh: InstancedMeshHandle, displacement?: DisplacementXYZ) => BoundsBoxHandle;
  partition: (mesh: InstancedMeshHandle, cellSize?: number) => number[][];
  setEnabled: (enabled: boolean) => boolean;
}
interface WorldVisualAssets {
  wind: { value: number };
  leaf: ThreeGeometryHandle;
  foliage: ThreeMaterialHandle;
  material: (kind: VisualSurfaceKind, w?: number, h?: number) => ThreeStandardMaterialHandle;
  plant: (
    parent: ThreeObjectHandle,
    x: number,
    z: number,
    variant?: number,
    scale?: number,
  ) => ThreeObjectHandle;
}
type EmbeddedWorldAssets = Partial<Record<string, string>>;
interface AsphaltMaps {
  map: string;
  normalMap: string;
  roughnessMap: string;
}
declare var TBS_EMBEDDED: EmbeddedWorldAssets | undefined;
declare var TBS_ASPHALT031: AsphaltMaps | undefined;
type VisualAssetsFactory = (
  T: ThreeLibraryHandle,
  renderer: ThreeRendererHandle,
  vegetationCulling: VegetationCulling,
) => WorldVisualAssets;
interface WorldOptions extends WorldDimensions, SceneResources, GeometryHelpers {
  T: ThreeLibraryHandle;
  worldState: WorldConstructionState;
  vegetationCulling: VegetationCulling;
  createVisualAssets: VisualAssetsFactory;
  embeddedAssets: EmbeddedWorldAssets;
  asphaltMaps: AsphaltMaps | undefined;
}
interface WorldResources extends Pick<
  PresentationWorldResources,
  | 'dark'
  | 'cyanMat'
  | 'orangeMat'
  | 'whiteMat'
  | 'box'
  | 'mat'
  | 'laneMat'
  | 'trimMat'
  | 'markTexture'
  | 'makeTexture'
  | 'mooredBoats'
  | 'unitPlane'
  | 'fountainJets'
  | 'unitBox'
  | 'tireMat'
  | 'waterTexture'
  | 'flags'
  | 'sprite'
  | 'signTexture'
  | 'facadeMaterials'
  | 'nightWindows'
  | 'streetFixtures'
> {
  visualAssets: WorldVisualAssets;
  mat: (
    color: number,
    metalness?: number,
    roughness?: number,
    emissive?: number,
  ) => ThreeStandardMaterialHandle;
  nightWindows: ThreeMaterialHandle[];
  curbMat: ThreeMaterialHandle;
  glassMat: ThreeMaterialHandle;
  grassMat: ThreeMaterialHandle;
  roofMat: ThreeMaterialHandle;
  pavingMat: ThreeMaterialHandle;
  crosswalkMat: ThreeMaterialHandle;
  roadMat: ThreeMaterialHandle;
  glowTexture: ThreeTextureHandle;
  droneTexture: ThreeTextureHandle;
  factoryTexture: ThreeTextureHandle;
  hangarTexture: ThreeTextureHandle;
  waterfrontTerraces: PointXZ[];
  leafMats: ThreeMaterialHandle[];
  cityLeafMaterials: ThreeMaterialHandle[];
  parkWood: ThreeMaterialHandle;
  masonryTextures: ThreeTextureHandle[];
  buildingColors: number[];
  flat: (
    parent: ThreeObjectHandle,
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    material: ThreeMaterialHandle,
  ) => ThreeMeshHandle;
  roadSurface: (w: number, d: number) => ThreeStandardMaterialHandle;
  parkPaving: (w: number, d: number) => ThreeMaterialHandle;
  tree: (x: number, z: number, seed: number, planterBox?: boolean, natural?: boolean) => void;
  shrubBed: (x: number, y: number, z: number, w: number, d: number, seed: number) => void;
  parkBench: (x: number, y: number, z: number, width?: number) => void;
  gardenBed: (x: number, z: number, w: number, d: number, seed: number) => void;
  facade: (
    parent: ThreeObjectHandle,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    angle: number,
    seed: number,
    style?: string,
  ) => void;
  architecturalPanel: (
    parent: ThreeObjectHandle,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    angle: number,
    photo: ThreeTextureHandle,
    title?: string,
    subtitle?: string,
  ) => ThreeGroupHandle;
  streetNameplate: (x: number, z: number, width: number, angle: number, title: string) => void;
  addFlag: (x: number, z: number) => void;
  streetLight: (x: number, z: number) => void;
}
type WorldContext = WorldOptions & WorldResources;
type DroneModels = Pick<PresentationWorldResources, 'createDrone'>;
interface RoadModels {
  roadInstances: (
    points: readonly (readonly [number, number, number])[],
    geometry: ThreeGeometryHandle,
    texture: ThreeTextureHandle,
    w: number,
    d: number,
  ) => void;
  roundedSidewalk: (x: number, z: number, w: number, d: number, r: number) => void;
  busStop: (x: number, z: number) => void;
}
interface ParkModels {
  showcaseTree: (x: number, z: number) => void;
  park: (x: number, z: number, w: number, d: number, seed: number) => void;
  flowerBed: (x: number, z: number, w: number, d: number, seed: number) => void;
  gazebo: (x: number, z: number) => void;
  playground: (x: number, z: number) => void;
  square: (x: number, z: number, w: number, d: number) => void;
}
interface BuildingSpecification extends Omit<ReflectionBuilding, 'color'> {
  parent: ThreeObjectHandle;
  kind?: string;
}
interface BuildingModels extends Pick<
  PresentationWorldResources,
  'reflectionBuildings' | 'cityFacadeLights'
> {
  reflectionBuildings: ReflectionBuilding[];
  cityFacadeLights: PresentationWorldResources['cityFacadeLights'][number][];
  solarMat: ThreeMaterialHandle;
  addFacadeLighting: (x: number, z: number, w: number, d: number, h: number) => void;
  building: (specification: BuildingSpecification) => void;
  showcasePavilion: (x: number, z: number, w: number, d: number) => void;
  industrialYard: (x: number, z: number, w: number, d: number, logistics: boolean) => void;
}
interface ShowcaseModels {
  showcaseQuarter: (x: number, z: number) => void;
}
interface WorldLandmark {
  i: number;
  j: number;
  name: string;
  sub: string;
  photo: ThreeTextureHandle | null;
  h: number;
}
interface WorldPopulation {
  parkedCars: ParkedPresentationCar[];
  parkingLots: ParkingLot[];
  special: Map<string, WorldLandmark>;
  districtLabels: ThreeSpriteHandle[];
}
/** The returned expression must satisfy both the generation outputs and the existing consumers. */
type BuiltWorld = WorldContext & DroneModels & BuildingModels & WorldPopulation & BootstrapWorld;

// Destructured factory input projections are derived from the actual JS parameter lists.
type DroneModelsOptions = Pick<
  WorldContext,
  'T' | 'scene' | 'dark' | 'cyanMat' | 'orangeMat' | 'whiteMat' | 'box'
>;
type TerrainOptions = Pick<
  WorldContext,
  | 'T'
  | 'WORLD_W'
  | 'WORLD_H'
  | 'ROAD'
  | 'roadsX'
  | 'roadsZ'
  | 'scene'
  | 'vegetationCulling'
  | 'mat'
  | 'curbMat'
  | 'cyanMat'
  | 'orangeMat'
  | 'whiteMat'
  | 'glassMat'
  | 'laneMat'
  | 'grassMat'
  | 'roofMat'
  | 'trimMat'
  | 'box'
  | 'flat'
  | 'roadSurface'
  | 'markTexture'
  | 'pavingMat'
  | 'crosswalkMat'
  | 'worldState'
  | 'streetLight'
  | 'tree'
  | 'sprite'
  | 'dark'
  | 'makeTexture'
  | 'glowTexture'
  | 'mooredBoats'
  | 'waterfrontTerraces'
  | 'parkWood'
  | 'parkPaving'
  | 'shrubBed'
  | 'parkBench'
  | 'signTexture'
>;
type RoadsOptions = Pick<
  WorldContext,
  | 'makeTexture'
  | 'laneMat'
  | 'crosswalkMat'
  | 'roadsX'
  | 'roadsZ'
  | 'scene'
  | 'dark'
  | 'box'
  | 'T'
  | 'unitPlane'
  | 'ROAD'
  | 'trimMat'
  | 'mat'
  | 'curbMat'
  | 'visualAssets'
  | 'cyanMat'
  | 'orangeMat'
  | 'whiteMat'
  | 'signTexture'
>;
type ParksOptions = Pick<
  WorldContext & DroneModels,
  | 'T'
  | 'scene'
  | 'mat'
  | 'trimMat'
  | 'flat'
  | 'tree'
  | 'parkPaving'
  | 'shrubBed'
  | 'parkBench'
  | 'gardenBed'
  | 'fountainJets'
  | 'grassMat'
  | 'box'
  | 'visualAssets'
  | 'vegetationCulling'
  | 'curbMat'
  | 'roofMat'
  | 'cyanMat'
  | 'orangeMat'
  | 'whiteMat'
  | 'detailBar'
  | 'dark'
  | 'markTexture'
  | 'pavingMat'
  | 'nightWindows'
  | 'signTexture'
  | 'worldState'
  | 'addFlag'
  | 'createDrone'
>;
type PopulationOptions = Pick<
  WorldContext & RoadModels & ParkModels & BuildingModels & ShowcaseModels,
  | 'asphaltMaps'
  | 'droneTexture'
  | 'factoryTexture'
  | 'hangarTexture'
  | 'T'
  | 'ROAD'
  | 'roadsX'
  | 'roadsZ'
  | 'isParkBlock'
  | 'scene'
  | 'dark'
  | 'roadMat'
  | 'curbMat'
  | 'cyanMat'
  | 'orangeMat'
  | 'laneMat'
  | 'roofMat'
  | 'trimMat'
  | 'box'
  | 'flat'
  | 'roadSurface'
  | 'pavingMat'
  | 'architecturalPanel'
  | 'tree'
  | 'gardenBed'
  | 'sprite'
  | 'signTexture'
  | 'streetNameplate'
  | 'park'
  | 'roundedSidewalk'
  | 'busStop'
  | 'addFacadeLighting'
  | 'building'
  | 'showcasePavilion'
  | 'flowerBed'
  | 'gazebo'
  | 'playground'
  | 'square'
  | 'industrialYard'
  | 'showcaseQuarter'
  | 'addFlag'
  | 'renderer'
  | 'makeTexture'
  | 'crosswalkMat'
  | 'unitBox'
>;

type BuildingsOptions = WorldContext & DroneModels & Pick<ParkModels, 'showcaseTree'>;
type ShowcaseOptions = WorldContext & RoadModels & BuildingModels;
interface TbsRegistry {
  buildWorld: (options: BuildWorldOptions) => BuiltWorld;
  createScene: (options: Pick<BuildWorldOptions, 'T' | 'canvas'>) => SceneResources;
  createGeometryHelpers: (options: Pick<BuildWorldOptions, 'T'>) => GeometryHelpers;
  createVegetationCulling: (options: {
    T: ThreeLibraryHandle;
    enabled?: boolean;
  }) => VegetationCulling;
  createVisualAssets: VisualAssetsFactory;
  createWorldResources: (options: WorldOptions) => WorldResources;
  createDroneModels: (options: DroneModelsOptions) => DroneModels;
  createTerrain: (options: TerrainOptions) => void;
  createRoads: (options: RoadsOptions) => RoadModels;
  createParks: (options: ParksOptions) => ParkModels;
  createBuildings: (options: BuildingsOptions) => BuildingModels;
  createShowcase: (options: ShowcaseOptions) => ShowcaseModels;
  populateWorld: (options: PopulationOptions) => WorldPopulation;
}
