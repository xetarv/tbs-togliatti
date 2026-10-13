'use strict';

window.TBS.createPresentationState = function (gameState: GameState): PresentationState {
  return {
    elapsed: 0,
    launchEffect: 0,
    impactAmount: 0,
    impactCooldown: 0,
    lightValue: 1,
    lightingClock: 0,
    get mode(): GameMode {
      return gameState.mode;
    },
    get stage(): MissionStage {
      return gameState.stage;
    },
  };
};
