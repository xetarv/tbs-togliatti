// This declaration exposes only the registry members used by the two checked scripts.
// JSDoc types are shared globals because these files remain classic browser scripts.
declare var TBS: {
  domain: {
    resetControls: (keys: ControlsState) => void;
    createState: () => GameState;
  };
  application: {
    createGame: (dependencies: GameDependencies) => Readonly<GameScenario>;
  };
};
