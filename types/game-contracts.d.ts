// This declaration exposes only the registry members used by the checked scripts.
// JSDoc types are shared globals because these files remain classic browser scripts.
declare var TBS: {
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
};
