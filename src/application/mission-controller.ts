'use strict';

globalThis.TBS.application.createMissionController = function ({
  missions,
  markers,
  hud,
  notifications,
}: MissionControllerOptions): Readonly<MissionController> {
  const failureMessages: Readonly<Partial<Record<MissionInteractionResult['status'], string>>> = {
    'too-far': 'Подъедьте ближе к маяку ТБС',
    'too-fast': 'Снизьте скорость перед запуском дрона',
  };

  function interact(): void {
    const result = missions.tryInteract();
    if (result.status === 'inactive') return;
    if (failureMessages[result.status]) {
      notifications.showToast(failureMessages[result.status] as string);
      return;
    }
    // The returns above exclude inactive and both failure statuses.
    markers.launch((result as MissionSuccess).point);
    const message =
      result.status === 'pickup'
        ? 'Груз принят · дрон ТБС сопровождает машину'
        : 'Доставка выполнена · +' + (result as MissionDelivery).reward + ' ₽';
    notifications.showToast(message);
    hud.updateHud();
  }

  return Object.freeze({ interact });
};
