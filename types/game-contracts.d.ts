// This declaration exposes only the registry members used by the checked scripts.
// JSDoc and TypeScript types are shared globals for classic browser scripts.

interface PointXZ {
  x: number;
  z: number;
}

type GameMode = 'intro' | 'playing' | 'paused';
/** 0: heading to pickup; 1: carrying cargo to delivery. */
type MissionStage = 0 | 1;

/** Sparse, mutable controls: absent fields are inactive. Runtime dictionary has a null prototype. */
interface ControlsState {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
  handbrake?: boolean;
  /** Touch-button release records false; interaction is dispatched directly. */
  action?: boolean;
}

/** Mutable player data shared by simulation and presentation adapters. */
interface PlayerState extends PointXZ {
  /** Heading in radians. */
  heading: number;
  /** Signed world units per second; negative means reverse. */
  speed: number;
  /** Charge percentage, from 0 to 100. */
  battery: number;
  /** Movement-angle offset from heading, in radians. */
  slip: number;
}

/** Authoritative mutable state; presentation timing and effects belong to a separate object. */
interface GameState {
  mode: GameMode;
  /** Zero-based index into the configured mission list. */
  missionIndex: number;
  stage: MissionStage;
  deliveries: number;
  /** Accumulated mission rewards. */
  credits: number;
  player: PlayerState;
  keys: ControlsState;
}

interface GameMath {
  clamp: (value: number, min: number, max: number) => number;
  distance: (a: PointXZ, b: PointXZ) => number;
}
interface DrivingSettings {
  acceleration: number;
  braking: number;
  handbrake: number;
  drag: number;
  forwardSpeed: number;
  reverseSpeed: number;
  stopThreshold: number;
  steeringThreshold: number;
  turnRate: number;
  batteryDrain: number;
}

interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface MissionPoint extends PointXZ {
  name: string;
}

interface MissionDefinition {
  title: string;
  description: string;
  from: Readonly<MissionPoint>;
  to: Readonly<MissionPoint>;
  reward: number;
}

interface MissionRules {
  interactionRadius: number;
  maximumSpeed: number;
}

interface GameConfig {
  driving: Readonly<DrivingSettings>;
  bounds: Readonly<WorldBounds>;
  missionRules: Readonly<MissionRules>;
  WORLD_W: number;
  WORLD_H: number;
  ROAD: number;
  roadsX: readonly number[];
  roadsZ: readonly number[];
  isParkBlock: (i: number, j: number) => boolean;
  missions: readonly Readonly<MissionDefinition>[];
}

interface VehicleFootprint extends PointXZ {
  heading: number;
}

interface VehicleContact extends PointXZ {
  depth: number;
}

type VehicleContactTest = (
  first: VehicleFootprint,
  second: VehicleFootprint,
) => VehicleContact | null;

interface ParkingLot {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  road: number;
}

interface RoadNetworkOptions {
  roadsX: readonly number[];
  roadsZ: readonly number[];
  ROAD: number;
  parkingLots: readonly ParkingLot[];
}

interface RoadNetwork {
  isDrivable: (x: number, z: number) => boolean;
}

interface MissionPickup {
  status: 'pickup';
  point: Readonly<MissionPoint>;
}

interface MissionDelivery {
  status: 'delivery';
  point: Readonly<MissionPoint>;
  reward: number;
}

type MissionSuccess = MissionPickup | MissionDelivery;
type MissionInteractionResult = { status: 'inactive' | 'too-far' | 'too-fast' } | MissionSuccess;

interface MissionRoutes {
  currentMission: () => Readonly<MissionDefinition>;
  target: () => Readonly<MissionPoint>;
  tryInteract: () => MissionInteractionResult;
}

interface MissionRoutesOptions {
  /** Nonempty configured list. */
  missions: readonly Readonly<MissionDefinition>[];
  state: GameState;
  player: PlayerState;
  distance: GameMath['distance'];
  missionRules: Readonly<MissionRules>;
}

type TrafficVariant = 'compact' | 'van' | 'sedan' | 'shuttle';
type SignalPhase = 'green' | 'amber' | 'red';

interface TrafficVehicle extends VehicleFootprint {
  id: number;
  horizontal: boolean;
  dir: 1 | -1;
  variant: TrafficVariant;
  color: number;
  road: number;
  lane: number;
  pos: number;
  speed: number;
  cruise: number;
  braking: boolean;
}

type TrafficVehicleInit = Omit<TrafficVehicle, 'x' | 'z' | 'heading'> & Partial<VehicleFootprint>;
type TrafficNeighbor = Pick<TrafficVehicle, 'horizontal' | 'road' | 'pos'> & { dir?: number };
type TrafficLaneVehicle = Pick<
  TrafficVehicle,
  'horizontal' | 'road' | 'lane' | 'pos' | 'dir' | 'cruise'
>;

interface TrafficLimit {
  speed: number;
  clearance: number;
}

interface TrafficOptions extends Pick<
  GameConfig,
  'roadsX' | 'roadsZ' | 'ROAD' | 'WORLD_W' | 'WORLD_H'
> {
  player: PointXZ;
}

interface TrafficSimulation {
  traffic: TrafficVehicle[];
  signalPhase: (x: number, z: number, horizontal: boolean, atTime?: number) => SignalPhase;
  trafficLimit: (
    vehicle: TrafficLaneVehicle,
    vehicles?: readonly TrafficNeighbor[],
    atTime?: number,
  ) => TrafficLimit;
  advanceTraffic: FrameUpdate;
}

interface MovingPhysicsVehicle extends VehicleFootprint {
  speed: number;
}

interface PlayerPhysicsOptions {
  player: PlayerState;
  keys: ControlsState;
  settings: Readonly<DrivingSettings>;
  bounds: Readonly<WorldBounds>;
  roadNetwork: Readonly<RoadNetwork>;
  movingVehicles: readonly MovingPhysicsVehicle[];
  parkedVehicles: readonly VehicleFootprint[];
  clamp: GameMath['clamp'];
  vehicleContact: VehicleContactTest;
}

interface PlayerPhysics {
  updatePhysics: (dt: number) => PhysicsEvent[];
}

interface MissionControllerOptions {
  missions: Pick<MissionRoutes, 'tryInteract'>;
  markers: { launch: (point: PointXZ) => void };
  hud: GameFramePorts['hud'];
  notifications: GameFramePorts['notifications'];
}

interface MissionController {
  interact: () => void;
}

interface SessionOptions {
  state: GameState;
  controls: { reset: () => void };
  audio: Pick<GameFramePorts['audio'], 'updateSound'> & { beginSound: () => void };
  overlay: { hide: () => void; showPaused: (title: string) => void };
  notifications: GameFramePorts['notifications'];
  /** Frame-clock reset, not wall-clock time. */
  clock: { reset: () => void };
  missions: Pick<MissionRoutes, 'currentMission'>;
}

interface GameSession {
  start: () => void;
  togglePause: () => void;
}

type PhysicsEvent = { type: 'impact'; speed: number } | { type: 'recharged' };
/** dt is elapsed time in seconds. */
type FrameUpdate = (dt: number) => void;
/** Undefined is possible when control fields are absent. */
type BrakingState = boolean | undefined;

/** Presentation methods consumed by the frame scenario; visual state is separate from GameState. */
interface GameFramePorts {
  audio: {
    advance: FrameUpdate;
    impact: (speed: number) => void;
    updateSound: (braking: BrakingState) => void;
  };
  /** Traffic models, separate from the domain simulation. */
  traffic: { update: FrameUpdate };
  pedestrians: { updatePedestrians: FrameUpdate };
  vehicle: { updatePlayerCar: (dt: number, previousSpeed: number) => BrakingState };
  /** Receives animation time, zero on pause. */
  world: { updateWorld: FrameUpdate };
  drones: { updateDrones: () => void };
  markers: { updateMarkers: FrameUpdate };
  camera: { updateCamera: FrameUpdate };
  lighting: { updateLighting: FrameUpdate };
  /** dt is animation time; daylight is the lighting blend value. */
  graphics: { render: (dt: number, daylight: number) => void };
  hud: { updateHud: () => void };
  minimap: { drawMini: () => void };
  notifications: { showToast: (message: string) => void };
  /** Advances presentation time and reads the lighting blend value. */
  timeline: { advance: FrameUpdate; daylight: () => number };
}

/** Dependencies assembled by bootstrap; only the methods consumed here are required. */
interface GameDependencies {
  /** Authoritative state, not presentation state. */
  state: GameState;
  /** Impact speed is a nonnegative world-units-per-second magnitude. */
  physics: { updatePhysics: (dt: number) => PhysicsEvent[] };
  /** Domain traffic simulation. */
  traffic: { advanceTraffic: FrameUpdate };
  ports: GameFramePorts;
}

interface GameScenario {
  step: FrameUpdate;
  initialize: () => void;
}

/** Declaration merging adds only the adapter contracts used by checked bootstrap scripts. */
interface TbsRegistry {
  domain: {
    math: Readonly<GameMath>;
    config: Readonly<GameConfig>;
    collision: Readonly<{ vehicleContact: VehicleContactTest }>;
    resetControls: (keys: ControlsState) => void;
    createState: () => GameState;
    createRoadNetwork: (options: RoadNetworkOptions) => Readonly<RoadNetwork>;
    createTrafficSimulation: (options: TrafficOptions) => Readonly<TrafficSimulation>;
    createPlayerPhysics: (options: PlayerPhysicsOptions) => Readonly<PlayerPhysics>;
    createMissionRoutes: (options: MissionRoutesOptions) => MissionRoutes;
  };
  application: {
    createGame: (dependencies: GameDependencies) => Readonly<GameScenario>;
    createSession: (options: SessionOptions) => Readonly<GameSession>;
    createMissionController: (options: MissionControllerOptions) => Readonly<MissionController>;
  };
}

declare var TBS: TbsRegistry;
