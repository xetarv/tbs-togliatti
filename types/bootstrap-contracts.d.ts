// Minimal structural boundaries read by bootstrap/game; JS adapter bodies are not typechecked yet.

interface BootstrapWorld {
  parkingLots: readonly ParkingLot[];
  /** Population records use a for the heading; bootstrap maps it to VehicleFootprint.heading. */
  parkedCars: readonly ParkedPresentationCar[];
}

interface BootstrapDom {
  canvas: HTMLCanvasElement;
  /** createDom throws for a missing element and caches the actual browser HTMLElement. */
  getElement: (id: string) => HTMLElement;
}

/** The separate visual state returned by createPresentationState, including its live accessors. */
interface PresentationState {
  elapsed: number;
  launchEffect: number;
  impactAmount: number;
  impactCooldown: number;
  lightValue: number;
  lightingClock: number;
  readonly mode: GameMode;
  readonly stage: MissionStage;
}

/** createInput reads only the audio context state; the rest of the sound graph is adapter-owned. */
interface InputSound {
  context: Pick<AudioContext, 'state'>;
}

interface BootstrapPorts extends GameFramePorts {
  audio: GameFramePorts['audio'] &
    SessionOptions['audio'] & {
      toggleSound: () => void;
      readonly sound: InputSound | null;
    };
  markers: GameFramePorts['markers'] & MissionControllerOptions['markers'];
  camera: GameFramePorts['camera'] & { toggleMouseCamera: () => void };
  lighting: GameFramePorts['lighting'] & { toggleDaylight: () => void };
  overlay: SessionOptions['overlay'];
}

interface BuildGameOptions {
  state: GameState;
  world: BootstrapWorld;
  dom: BootstrapDom;
  presentation: PresentationState;
}

interface BuildPresentationOptions extends BuildGameOptions {
  traffic: Readonly<TrafficSimulation>;
  missions: MissionRoutes;
  resetControls: () => void;
}

interface RuntimeOptions {
  game: Readonly<GameScenario>;
  scheduler: {
    request: (callback: FrameRequestCallback) => number;
    cancel: (id: number) => void;
  };
  clock: { now: () => number };
  isHidden: () => boolean;
}

interface GameRuntime {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/** Only controls consumed by createInput; extra spread members retain their runtime behavior. */
interface InputOptions
  extends
    Pick<GameSession, 'togglePause'>,
    MissionController,
    Pick<BootstrapPorts['camera'], 'toggleMouseCamera'>,
    Pick<BootstrapPorts['lighting'], 'toggleDaylight'>,
    Pick<BootstrapPorts['audio'], 'beginSound' | 'toggleSound'> {
  state: GameState;
  keys: ControlsState;
  resetControls: () => void;
  resetFrameClock: GameRuntime['reset'];
  getSound: () => InputSound | null;
}

interface BuildGameResult {
  runtime: Readonly<GameRuntime>;
  session: Readonly<GameSession>;
}

interface TbsRegistry {
  createDom: (document: Document) => BootstrapDom;
  buildGame: (options: BuildGameOptions) => BuildGameResult;
  buildPresentation: (options: BuildPresentationOptions) => BootstrapPorts;
  createRuntime: (options: RuntimeOptions) => Readonly<GameRuntime>;
  createPresentationState: (gameState: GameState) => PresentationState;
  createInput: (options: InputOptions) => void;
}
