'use strict';

globalThis.TBS.application.createMissionController = function ({
  missions,
  markers,
  hud,
  notifications,
}) {
  const failureMessages = {
    'too-far': 'Подъедьте ближе к маяку ТБС',
    'too-fast': 'Снизьте скорость перед запуском дрона',
  };

  function interact() {
    const result = missions.tryInteract();
    if (result.status === 'inactive') return;
    if (failureMessages[result.status]) {
      notifications.showToast(failureMessages[result.status]);
      return;
    }
    markers.launch(result.point);
    const message =
      result.status === 'pickup'
        ? 'Груз принят · дрон ТБС сопровождает машину'
        : 'Доставка выполнена · +' + result.reward + ' ₽';
    notifications.showToast(message);
    hud.updateHud();
  }

  return Object.freeze({ interact });
};
