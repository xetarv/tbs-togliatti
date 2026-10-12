'use strict';

/**
 * @typedef {object} MissionControllerOptions
 * @property {Pick<MissionRoutes, 'tryInteract'>} missions
 * @property {{launch: (point: PointXZ) => void}} markers
 * @property {GameFramePorts['hud']} hud
 * @property {GameFramePorts['notifications']} notifications
 */
/** @typedef {{interact: () => void}} MissionController */
/** @param {MissionControllerOptions} options @returns {Readonly<MissionController>} */
globalThis.TBS.application.createMissionController = function ({
  missions,
  markers,
  hud,
  notifications,
}) {
  /** @type {Readonly<Partial<Record<MissionInteractionResult['status'], string>>>} */
  const failureMessages = {
    'too-far': 'Подъедьте ближе к маяку ТБС',
    'too-fast': 'Снизьте скорость перед запуском дрона',
  };

  /** @returns {void} */
  function interact() {
    const result = missions.tryInteract();
    if (result.status === 'inactive') return;
    if (failureMessages[result.status]) {
      notifications.showToast(/** @type {string} */ (failureMessages[result.status]));
      return;
    }
    // The returns above exclude inactive and both failure statuses.
    markers.launch(/** @type {MissionSuccess} */ (result).point);
    const message =
      result.status === 'pickup'
        ? 'Груз принят · дрон ТБС сопровождает машину'
        : 'Доставка выполнена · +' + /** @type {MissionDelivery} */ (result).reward + ' ₽';
    notifications.showToast(message);
    hud.updateHud();
  }

  return Object.freeze({ interact });
};
