// Structural JS-adapter boundaries, not a replacement for complete Three.js declarations.
// All discriminators below are actual r149 runtime properties, not synthetic brands.
interface ThreeObjectHandle {
  readonly isObject3D: true;
}
interface ThreeSceneHandle extends ThreeObjectHandle {
  readonly isScene: true;
  add: (...objects: ThreeObjectHandle[]) => this;
}
/** Actual r149 members consumed by mission markers; no general-purpose graph abstraction. */
interface ThreePositionedObjectHandle extends ThreeObjectHandle {
  readonly position: CameraVector3;
}
interface ThreeGroupHandle extends ThreePositionedObjectHandle {
  readonly isGroup: true;
  add: (...objects: ThreeObjectHandle[]) => this;
}
interface ThreeSpriteHandle extends ThreePositionedObjectHandle {
  readonly isSprite: true;
}
interface ThreePointLightHandle extends ThreePositionedObjectHandle {
  readonly isPointLight: true;
}
interface ThreeMarkerScale extends CameraVector3 {
  setScalar: (scalar: number) => this;
}
interface ThreeMarkerMeshHandle<M extends ThreeMaterialHandle>
  extends ThreeMeshHandle, ThreePositionedObjectHandle {
  material: M;
  readonly rotation: { x: number; y: number; z: number };
  readonly scale: ThreeMarkerScale;
  visible: boolean;
}
interface ThreeBasicMaterialParameters {
  color?: number;
  transparent?: boolean;
  opacity?: number;
  side?: 0 | 1 | 2;
  depthWrite?: boolean;
}
interface ThreeBasicMaterialHandle extends ThreeMaterialHandle {
  readonly isMeshBasicMaterial: true;
  opacity: number;
}
interface ThreeCameraHandle extends ThreeObjectHandle {
  readonly isPerspectiveCamera: true;
  readonly position: CameraVector3;
  lookAt: (x: number, y: number, z: number) => void;
}
/** The exact Vector3 operations used by the typed camera adapter. */
interface CameraVector3 extends DisplacementXYZ {
  set: (x: number, y: number, z: number) => this;
  copy: (vector: DisplacementXYZ) => this;
  lerp: (vector: DisplacementXYZ, alpha: number) => this;
}
/** createScene's actual mesh/shader resource; other mesh handles do not gain shader fields. */
interface CameraSkyHandle extends ThreeMeshHandle {
  readonly position: CameraVector3;
  material: { uniforms: { skyTime: { value: number } } };
}
interface ThreeMeshHandle extends ThreeObjectHandle {
  readonly isMesh: true;
}
interface ThreeMaterialHandle {
  readonly isMaterial: true;
}
interface ThreeTextureHandle {
  readonly isTexture: true;
}
interface ThreeGeometryHandle {
  readonly isBufferGeometry: true;
}
interface ThreeRendererHandle {
  readonly domElement: HTMLCanvasElement;
}
/** Only consumed constructor signatures are described; other Three.js members remain deferred. */
interface ThreeLibraryHandle {
  readonly REVISION: string;
  Vector3: new (x?: number, y?: number, z?: number) => CameraVector3;
  readonly DoubleSide: 2;
  Group: new () => ThreeGroupHandle;
  Mesh: new <M extends ThreeMaterialHandle>(
    geometry: ThreeGeometryHandle,
    material: M,
  ) => ThreeMarkerMeshHandle<M>;
  CylinderGeometry: new (
    radiusTop?: number,
    radiusBottom?: number,
    height?: number,
    radialSegments?: number,
    heightSegments?: number,
    openEnded?: boolean,
    thetaStart?: number,
    thetaLength?: number,
  ) => ThreeGeometryHandle;
  TorusGeometry: new (
    radius?: number,
    tube?: number,
    radialSegments?: number,
    tubularSegments?: number,
    arc?: number,
  ) => ThreeGeometryHandle;
  OctahedronGeometry: new (radius?: number, detail?: number) => ThreeGeometryHandle;
  MeshBasicMaterial: new (parameters?: ThreeBasicMaterialParameters) => ThreeBasicMaterialHandle;
  PointLight: new (
    color?: number,
    intensity?: number,
    distance?: number,
    decay?: number,
  ) => ThreePointLightHandle;
}

interface ParkedPresentationCar extends PointXZ {
  a: number;
  seed: number;
  /** Assigned in place by createPlayerCar before its update callback can run. */
  mesh?: ThreeObjectHandle;
}

type BoxHelper = (
  parent: ThreeObjectHandle,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  material: ThreeMaterialHandle,
) => ThreeMeshHandle;
type TexturePainter = (context: CanvasRenderingContext2D, w: number, h: number) => void;
type MakeTexture = (draw: TexturePainter, w?: number, h?: number) => ThreeTextureHandle;

interface ReflectionBuilding extends PointXZ {
  w: number;
  d: number;
  h: number;
  seed: number;
  color: number;
}
interface MooredBoat {
  mesh: ThreeObjectHandle;
  phase: number;
}
/** Compatibility name for world construction data, not the visual or authoritative game state. */
type PresentationWorldState = WorldConstructionState;

interface PresentationWorldResources extends Pick<
  GameConfig,
  'WORLD_W' | 'WORLD_H' | 'ROAD' | 'roadsX' | 'roadsZ' | 'isParkBlock'
> {
  T: ThreeLibraryHandle;
  lowPower: boolean;
  scene: ThreeSceneHandle;
  renderer: ThreeRendererHandle;
  camera: ThreeCameraHandle;
  sky: CameraSkyHandle;
  duskSun: ThreeMeshHandle;
  ambientLight: ThreeObjectHandle;
  sun: ThreeObjectHandle;
  blueLight: ThreeObjectHandle;
  dark: ThreeMaterialHandle;
  cyanMat: ThreeMaterialHandle;
  orangeMat: ThreeMaterialHandle;
  whiteMat: ThreeMaterialHandle;
  trimMat: ThreeMaterialHandle;
  tireMat: ThreeMaterialHandle;
  laneMat: ThreeMaterialHandle;
  unitBox: ThreeGeometryHandle;
  unitPlane: ThreeGeometryHandle;
  markTexture: ThreeTextureHandle;
  waterTexture: ThreeTextureHandle;
  /** Despite its name, createFacadeResources returns canvas textures here. */
  facadeMaterials: readonly ThreeTextureHandle[];
  nightWindows: readonly ThreeMaterialHandle[];
  reflectionBuildings: readonly ReflectionBuilding[];
  mooredBoats: readonly MooredBoat[];
  streetFixtures: readonly (PointXZ & { halo: ThreeObjectHandle; pool: ThreeObjectHandle })[];
  cityFacadeLights: readonly (PointXZ & { y: number; poolMaterial: ThreeMaterialHandle })[];
  flags: readonly ThreeMeshHandle[];
  fountainJets: readonly ThreeObjectHandle[];
  districtLabels: readonly ThreeObjectHandle[];
  worldState: PresentationWorldState;
  visualAssets: { wind: { value: number } };
  special: { has: (key: string) => boolean };
  box: BoxHelper;
  mat: (
    color: number,
    metalness?: number,
    roughness?: number,
    emissive?: number,
  ) => ThreeMaterialHandle;
  makeTexture: MakeTexture;
  signTexture: (title: string, sub: string) => ThreeTextureHandle;
  detailBar: (
    parent: ThreeObjectHandle,
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    r: number,
    material: ThreeMaterialHandle,
  ) => ThreeMeshHandle;
  wedge: (
    parent: ThreeObjectHandle,
    width: number,
    zFront: number,
    zBack: number,
    bottom: number,
    frontHeight: number,
    backHeight: number,
    material: ThreeMaterialHandle,
  ) => ThreeMeshHandle;
  sprite: (
    parent: ThreeObjectHandle,
    texture: ThreeTextureHandle,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    opacity?: number,
  ) => ThreeSpriteHandle;
  createDrone: () => { group: ThreeObjectHandle; rotors: ThreeObjectHandle[] };
}

interface BootstrapWorld extends PresentationWorldResources {}
interface BootstrapDom {
  mini: HTMLCanvasElement;
  mctx: CanvasRenderingContext2D;
}

interface GraphicsPort {
  render: GameFramePorts['graphics']['render'];
  resize: () => void;
  /** The adapter accepts arbitrary strings and falls back to medium for an unknown preset. */
  setQuality: (quality: string) => void;
  readonly quality: 'low' | 'medium' | 'high';
  readonly distance: number;
  readonly depthSupported: boolean;
}

interface FastbackMeshData {
  stations: readonly (readonly number[])[];
}
declare var TBS_FASTBACK_MESH: FastbackMeshData;
interface FastbackOptions extends Pick<BootstrapWorld, 'T' | 'scene' | 'makeTexture'> {
  meshData: FastbackMeshData;
  logo: ThreeTextureHandle;
  shadowTexture: ThreeTextureHandle;
}

interface CarModels {
  createHeroCar: () => ThreeObjectHandle;
  createTrafficCar: (color: number, variant?: TrafficVariant) => ThreeObjectHandle;
  animateVehicle: (
    mesh: ThreeObjectHandle,
    speed: number,
    steer: number,
    braking: BrakingState,
    dt: number,
  ) => void;
}

type CarModelsOptions = Pick<
  BootstrapWorld,
  | 'T'
  | 'box'
  | 'dark'
  | 'mat'
  | 'cyanMat'
  | 'detailBar'
  | 'orangeMat'
  | 'whiteMat'
  | 'markTexture'
  | 'makeTexture'
  | 'trimMat'
  | 'signTexture'
  | 'scene'
  | 'wedge'
  | 'tireMat'
  | 'unitBox'
> & {
  createFastback: (options: FastbackOptions) => ThreeObjectHandle;
  meshData: FastbackMeshData;
};
interface VisualContext {
  state: PresentationState;
  player: PlayerState;
}
interface GraphicsAccess {
  getGraphics: () => GraphicsPort;
}
interface PlayerCarPort {
  car: ThreeObjectHandle;
  updatePlayerCar: GameFramePorts['vehicle']['updatePlayerCar'];
}
type PlayerCarOptions = VisualContext &
  GraphicsAccess &
  CarModels &
  Pick<BootstrapWorld, 'parkedCars' | 'T' | 'unitPlane' | 'scene'> & {
    keys: ControlsState;
    clamp: GameMath['clamp'];
  };

interface GraphicsOptions extends Pick<
  BootstrapWorld,
  'T' | 'renderer' | 'scene' | 'camera' | 'sky'
> {
  car: ThreeObjectHandle;
  water: ThreeMaterialHandle;
  buildings: readonly ReflectionBuilding[];
  facades: readonly ThreeTextureHandle[];
  reflectObjects?: readonly ThreeObjectHandle[];
  initialQuality: GraphicsPort['quality'];
}
type DisplayOptions = Pick<
  BootstrapWorld,
  | 'lowPower'
  | 'T'
  | 'renderer'
  | 'scene'
  | 'camera'
  | 'sky'
  | 'facadeMaterials'
  | 'mooredBoats'
  | 'reflectionBuildings'
> &
  Pick<BootstrapDom, 'getElement'> &
  GameFramePorts['notifications'] & {
    car: ThreeObjectHandle;
    createGraphics: (options: GraphicsOptions) => GraphicsPort;
    resetControls: () => void;
  };
type TrafficViewOptions = Pick<
  BootstrapWorld,
  | 'T'
  | 'roadsX'
  | 'roadsZ'
  | 'ROAD'
  | 'scene'
  | 'dark'
  | 'laneMat'
  | 'trimMat'
  | 'box'
  | 'camera'
  | 'unitBox'
> &
  GraphicsAccess &
  Pick<CarModels, 'createTrafficCar' | 'animateVehicle'> &
  Pick<TrafficSimulation, 'traffic' | 'signalPhase'>;
interface AmbiencePort {
  update: (player: PlayerState, traffic: readonly TrafficVehicle[], elapsed: number) => void;
  levels: { water: number; city: number; traffic: number };
  voiceCount: number;
  spatial: (
    player: PlayerState,
    x: number,
    z: number,
    radius: number,
  ) => {
    level: number;
    pan: number;
  };
}
type AmbienceFactory = (context: AudioContext, output: AudioNode) => AmbiencePort;

interface SoundGraph {
  context: AudioContext;
  master: GainNode;
  motor: OscillatorNode;
  motorGain: GainNode;
  tires: GainNode;
  buffer: AudioBuffer;
  ambient: AmbiencePort;
}
type SoundPort = BootstrapPorts['audio'] & { readonly sound: SoundGraph | null };

interface Window {
  webkitAudioContext?: typeof AudioContext;
}
type SoundOptions = VisualContext &
  Pick<BootstrapDom, 'getElement'> & {
    traffic: TrafficVehicle[];
    createAmbience: AmbienceFactory;
  };
type HudOptions = Pick<BootstrapDom, 'getElement'> &
  Pick<MissionRoutes, 'currentMission' | 'target'> & {
    state: GameState;
    player: PlayerState;
    distance: GameMath['distance'];
  };
type MinimapOptions = Pick<
  BootstrapWorld,
  'WORLD_W' | 'WORLD_H' | 'ROAD' | 'roadsX' | 'roadsZ' | 'parkingLots' | 'worldState'
> &
  Pick<BootstrapDom, 'mini' | 'mctx'> & {
    player: PlayerState;
    target: MissionRoutes['target'];
  };
type MarkersOptions = Pick<BootstrapWorld, 'T' | 'sprite' | 'signTexture' | 'scene'> & {
  state: PresentationState;
  target: MissionRoutes['target'];
};
type CameraOptions = Pick<BootstrapWorld, 'camera' | 'sky' | 'renderer' | 'T'> &
  Pick<BootstrapDom, 'getElement'> &
  VisualContext &
  GameFramePorts['notifications'] & {
    clamp: GameMath['clamp'];
  };
type LightingOptions = Pick<
  BootstrapWorld,
  | 'T'
  | 'scene'
  | 'lowPower'
  | 'camera'
  | 'ambientLight'
  | 'sun'
  | 'blueLight'
  | 'sky'
  | 'duskSun'
  | 'nightWindows'
  | 'streetFixtures'
  | 'cityFacadeLights'
> &
  Pick<BootstrapDom, 'getElement'> &
  VisualContext &
  GraphicsAccess &
  GameFramePorts['notifications'] & { car: ThreeObjectHandle };
type PedestriansOptions = Pick<
  BootstrapWorld,
  | 'mat'
  | 'T'
  | 'lowPower'
  | 'scene'
  | 'orangeMat'
  | 'whiteMat'
  | 'box'
  | 'markTexture'
  | 'ROAD'
  | 'roadsX'
  | 'roadsZ'
  | 'isParkBlock'
  | 'special'
  | 'camera'
> & {
  state: PresentationState;
};
type DronesOptions = VisualContext & Pick<BootstrapWorld, 'createDrone'>;
type WorldAnimationOptions = Pick<
  BootstrapWorld,
  | 'visualAssets'
  | 'mooredBoats'
  | 'waterTexture'
  | 'scene'
  | 'flags'
  | 'camera'
  | 'fountainJets'
  | 'districtLabels'
  | 'worldState'
  | 'WORLD_W'
> & {
  state: PresentationState;
};

interface TbsRegistry {
  createFastback: (options: FastbackOptions) => ThreeObjectHandle;
  createCarModels: (options: CarModelsOptions) => CarModels;
  createPlayerCar: (options: PlayerCarOptions) => PlayerCarPort;
  createGraphics: (options: GraphicsOptions) => GraphicsPort;
  createDisplay: (options: DisplayOptions) => { graphics: GraphicsPort };
  createTrafficView: (options: TrafficViewOptions) => GameFramePorts['traffic'];
  createAmbience: AmbienceFactory;
  createSound: (options: SoundOptions) => SoundPort;
  createHud: (options: HudOptions) => GameFramePorts['hud'];
  createMinimap: (options: MinimapOptions) => GameFramePorts['minimap'];
  createMissionMarkers: (options: MarkersOptions) => BootstrapPorts['markers'];
  createCameraControls: (options: CameraOptions) => BootstrapPorts['camera'];
  createLighting: (options: LightingOptions) => BootstrapPorts['lighting'];
  createPedestrians: (options: PedestriansOptions) => GameFramePorts['pedestrians'];
  createDrones: (options: DronesOptions) => GameFramePorts['drones'];
  createWorldAnimation: (options: WorldAnimationOptions) => GameFramePorts['world'];
  createOverlay: (options: Pick<BootstrapDom, 'getElement'>) => SessionOptions['overlay'];
  createToast: (options: Pick<BootstrapDom, 'getElement'>) => GameFramePorts['notifications'];
}
