'use strict';

window.TBS.createHud = function ({
  getElement,
  player,
  state,
  distance,
  currentMission,
  target,
}: HudOptions): GameFramePorts['hud'] {
  const hudCache = new Map<string, string | number>();

  function hudValue(
    id: string,
    value: string | number,
    property: 'textContent' | 'innerHTML' = 'textContent',
  ): void {
    const key = id + ':' + property;
    if (hudCache.get(key) === value) return;
    hudCache.set(key, value);
    // Browser DOM setters coerce numeric values; retain the original numeric delivery count.
    getElement(id)[property] = value as string;
  }

  function updateHud(): void {
    const m = currentMission();
    hudValue('missionNumber', String(state.missionIndex + 1).padStart(2, '0'));
    hudValue('missionTitle', m.title);
    hudValue('missionDescription', m.description);
    hudValue(
      'objective',
      (state.stage === 0 ? 'Забрать груз: ' : 'Доставить груз: ') + target().name,
    );
    hudValue('distance', 'ДО МАЯКА: ' + Math.round(distance(player, target()) * 10) + ' м');
    hudValue('delivered', state.deliveries);
    hudValue('credits', state.credits.toLocaleString('ru-RU') + ' <em>₽</em>', 'innerHTML');
    hudValue(
      'speed',
      String(Math.round(Math.abs(player.speed) * 3.6)).padStart(2, '0') + ' <small>км/ч</small>',
      'innerHTML',
    );
    const width = Number(player.battery.toFixed(1)) + '%';
    if (getElement('batteryFill').style.width !== width)
      getElement('batteryFill').style.width = width;
    hudValue('batteryText', 'ЗАРЯД ' + Math.round(player.battery) + '%');
  }
  return { updateHud };
};
