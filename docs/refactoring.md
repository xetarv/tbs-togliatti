# Карта архитектуры TBS Togliatti 2040

Короткий справочник по коду, проверенный на этапе №59; маршрут транспорта уточнён на №60. Состояние сессии и результаты
проверок — только верхняя запись [project-state.md](project-state.md); история работ —
[typescript-migration-log.md](typescript-migration-log.md). Архивы не нужны для обычной навигации.

## Найти систему

| Задача / слой                                   | Начать с исходников                                                                                                                                                                                                                                                                                                                                    | Контракты и ближайшие проверки                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Правила, данные, движение (`domain`)            | [config.ts](../src/domain/config.ts), [state.ts](../src/domain/state.ts), [player-physics.ts](../src/domain/player-physics.ts), [road-network.ts](../src/domain/road-network.ts), [traffic.ts](../src/domain/traffic.ts)                                                                                                                               | [game-contracts.d.ts](../types/game-contracts.d.ts): `GameState`, `PlayerState`, `GameConfig`, `TrafficVehicle`; [physics.test.cjs](../tests/physics.test.cjs), [traffic.test.cjs](../tests/traffic.test.cjs)                                                                                                           |
| Сценарий кадра, сессия, задания (`application`) | [game.ts](../src/application/game.ts), [session.ts](../src/application/session.ts), [mission-controller.ts](../src/application/mission-controller.ts), [missions.ts](../src/domain/missions.ts)                                                                                                                                                        | `GameDependencies`, `GameFramePorts`, `MissionRoutes` в game-contracts; [application.test.cjs](../tests/application.test.cjs), [missions.test.cjs](../tests/missions.test.cjs)                                                                                                                                          |
| Сборка приложения (`bootstrap`)                 | [game.ts](../src/bootstrap/game.ts), [presentation.ts](../src/bootstrap/presentation.ts), [world.ts](../src/bootstrap/world.ts)                                                                                                                                                                                                                        | [bootstrap-contracts.d.ts](../types/bootstrap-contracts.d.ts): `BuildGameOptions`, `BootstrapPorts`, `PresentationState`; [presentation-contracts.d.ts](../types/presentation-contracts.d.ts)                                                                                                                           |
| Цикл, ввод, UI и звук (`adapters`)              | [runtime.ts](../src/adapters/browser/runtime.ts), [controls.ts](../src/adapters/input/controls.ts), [camera.ts](../src/adapters/input/camera.ts), [ui/](../src/adapters/ui/), [audio/](../src/adapters/audio/)                                                                                                                                         | `RuntimeOptions`, `GameRuntime`, `InputOptions` в bootstrap-contracts; UI/audio/camera в presentation-contracts; [runtime.test.cjs](../tests/runtime.test.cjs), [input.test.cjs](../tests/input.test.cjs)                                                                                                               |
| Модели и отображение транспорта                 | [car-model.ts](../src/adapters/vehicles/car-model.ts), [player-car.ts](../src/adapters/vehicles/player-car.ts), [fastback.ts](../src/adapters/vehicles/fastback.ts), [simulation/traffic.ts](../src/adapters/simulation/traffic.ts)                                                                                                                    | `CarModels`, `CarModelsOptions` в presentation-contracts; [car-model-contracts.d.ts](../types/car-model-contracts.d.ts), [fastback-contracts.d.ts](../types/fastback-contracts.d.ts), [traffic-view-contracts.d.ts](../types/traffic-view-contracts.d.ts)                                                               |
| Строительство мира                              | [resources.ts](../src/adapters/world/resources.ts), [terrain.ts](../src/adapters/world/terrain.ts), [roads.ts](../src/adapters/world/roads.ts), [parks.ts](../src/adapters/world/parks.ts), [buildings.ts](../src/adapters/world/buildings.ts), [showcase.ts](../src/adapters/world/showcase.ts), [population.ts](../src/adapters/world/population.ts) | [world-contracts.d.ts](../types/world-contracts.d.ts): `WorldOptions`, `WorldResources`, `WorldConstructionState`; [world-showcase-contracts.d.ts](../types/world-showcase-contracts.d.ts), [world-resources-contracts.d.ts](../types/world-resources-contracts.d.ts)                                                   |
| Рендер, освещение, отсечение                    | [scene.ts](../src/adapters/rendering/scene.ts), [lighting.ts](../src/adapters/rendering/lighting.ts), [display.ts](../src/adapters/rendering/display.ts), [graphics.ts](../src/adapters/rendering/graphics.ts), [vegetation-culling.ts](../src/adapters/rendering/vegetation-culling.ts)                                                               | [rendering-contracts.d.ts](../types/rendering-contracts.d.ts), [graphics-contracts.d.ts](../types/graphics-contracts.d.ts), [vegetation-contracts.d.ts](../types/vegetation-contracts.d.ts); [reliability.test.cjs](../tests/reliability.test.cjs), [vegetation-culling.test.cjs](../tests/vegetation-culling.test.cjs) |

Для обычного изменения: строка таблицы → нужная фабрика → её аргументы/результат в
`types/` → непосредственный вызывающий код → ближайший тест. Не читай весь слой.

```sh
rg -n 'createTrafficCar|TrafficVariant' src types tests
rg -n 'window\.TBS|globalThis\.TBS' src/bootstrap src/adapters/vehicles
rg --files src/adapters/world types tests
```

## Запуск, реестр и реальные зависимости

- [index.html](../index.html) — источник порядка загрузки. Сначала локальные assets
  Three.js/бренда/асфальта/Fastback, затем [namespace.ts](../src/bootstrap/namespace.ts)
  через dist; он создаёт `globalThis.TBS`, `.domain`, `.application` с `Object.create(null)`.
  Остальные classic scripts регистрируют фабрики; последним запускается [app.ts](../src/app.ts).
- В браузере `window.TBS` и `globalThis.TBS` — тот же реестр. `TbsRegistry` расширяется
  объявлениями из `types/`; это проверка контрактов, а не загрузчик или DI-контейнер.
  Объявление типа не гарантирует, что соответствующий скрипт уже загружен.
- `app.ts`: DOM → `GameState` → `PresentationState` → `buildWorld` → `buildGame` →
  `runtime.start()`, затем `session.start()` только при `?play`. Обычный старт — кнопкой.
- `buildWorld`: scene → geometry helpers → vegetation culling → world resources →
  drone models → terrain → roads → parks → buildings → showcase → population.
  Возвращаются общие ресурсы и ссылки, а не копия всей сцены.
- `buildGame`: domain traffic → road network → player physics → mission routes →
  `buildPresentation` → application game → runtime → session → mission controller → input.
  Presentation создаёт модели/игрока, display/graphics и остальные адаптеры, возвращая порты.
- В кадре `application/game.ts` вызывает переданные порты: симуляция (только playing),
  представление автомобиля/мира/дронов/маяков/камеры/света, затем render и HUD/minimap.
  Время анимации равно нулю при паузе; не заменяй его общим dt без проверки сценария.

`domain` и `application` не знают Three.js/DOM. Данные физики и миссий идут внутрь через
аргументы, результаты событий — наружу через порты. `GameState` владеет правилами смены;
`PresentationState` хранит визуальное время/эффекты и геттеры mode/stage;
`WorldConstructionState` содержит ссылки построения мира. Не объединяй эти состояния.
Границы защищены [eslint.config.mjs](../eslint.config.mjs) и [architecture.test.cjs](../tests/architecture.test.cjs).

## Проверенные маршруты расширения

### A. Новый автомобиль

- Игрок: `createCarModels().createHeroCar()` вызывает `createFastback`; сборка частей —
  [vehicles/fastback/](../src/adapters/vehicles/fastback/). `createPlayerCar` создаёт игрока,
  припаркованный транспорт и его визуальное обновление. `animateVehicle` использует
  реальные wheel/body/light ссылки из userData; смотри `FastbackCar` и контракты traffic.
- Дорожные модели: `createTrafficCar(color, variant)` и [vehicles/traffic/](../src/adapters/vehicles/traffic/).
  Варианты фиксированы `TrafficVariant` и массивом в domain/traffic.ts; адаптер
  simulation/traffic.ts связывает записи `TrafficVehicle` с моделями.
  В car-model.ts локальная `trafficModels: Record<TrafficVariant, TrafficModelDefinition>`
  исчерпывающе выбирает сборщик кузова, пассажирское освещение, масштаб и пропорции.
  Контракт — car-model-contracts.d.ts; проверка — [car-model.test.cjs](../tests/car-model.test.cjs).
  Для пятого варианта: расширь TrafficVariant и соответствующие типы автомобиля/кузовной
  фабрики, добавь запись карты; массив domain/traffic.ts меняй только для включения в поток.
  Новые особенности геометрии остаются в кузовных фабриках, а движение/скорости — в domain.
- Для новой фабрики нужны запись в `TbsRegistry`, скомпилированный скрипт в index.html
  и явная передача в bootstrap/сборщик. Общего реестра типов автомобилей сейчас нет.
  Визуальная модель относится к adapters; новое поведение движения — к domain и его тестам.
  Новая форма кузова сама по себе не меняет размеры коллизии: проверь параметры физики отдельно.

### B. Механика или миссия

- Дополнительная доставка существующего вида — данные в domain/config.ts по
  `MissionDefinition`/`MissionPoint`. Список должен быть непустым: `MissionRoutes`
  выбирает текущую запись по missionIndex, а цель — from/to по двум стадиям груза.
- Новое правило — domain; координация — application. Интеграция взаимодействия уже
  существует через `MissionRoutes.tryInteract()` → `createMissionController().interact()` →
  markers/HUD/notifications. Отображение: [markers.ts](../src/adapters/missions/markers.ts),
  UI и minimap из таблицы; ввод подключается в bootstrap/game.ts.
- Для самостоятельной механики используй именованные зависимости и при необходимости
  согласованно дополни `GameFramePorts`/`BootstrapPorts`. Универсального mission-plugin API,
  интерфейсов инвентаря, оружия или персонажа вне машины нет. Их нельзя считать готовыми.
  Не добавляй window/THREE/DOM или вызовы адаптеров в domain/application.

### C. Мир и кварталы

- Статическое размещение — terrain/roads/parks/population; фасады и типы зданий —
  [world/buildings/](../src/adapters/world/buildings/); показательный квартал —
  [world/showcase/](../src/adapters/world/showcase/). `createShowcase` последовательно
  дополняет context через `Object.assign`; не переставляй structure/roof/cladding.
- Текстуры/материалы: resources.ts и [world/resources/](../src/adapters/world/resources/),
  [visual-assets.ts](../src/adapters/world/visual-assets.ts). Данные размещения и дороги
  связаны с config, дорожной сетью и границами физики, а не только с размером ground.
- Для instancing учитывай локальные/мировые трансформации и ветер до instanceMatrix.
  `VegetationCulling` из world-contracts предоставляет add/register/bounds/partition/setEnabled.
  После изменения буферов требуется обновить bounds; fail-open не заменяет их пересчёт.
- Разбиение растительности, статические группы population и корпуса светофоров имеют
  отдельные экземпляры culling. Один setEnabled не отключает их все. Сохраняй видимые
  тени и независимость камер. Проверки: [static-batch-culling.test.cjs](../tests/static-batch-culling.test.cjs),
  [signal-housing.test.cjs](../tests/signal-housing.test.cjs), [trim-stops.test.cjs](../tests/trim-stops.test.cjs).
- Сначала подготовь scene.userData.waterMaterial (terrain) и quarterLighting (showcase),
  затем создавай presentation/graphics. Graphics расширяет terrain.onBeforeCompile,
  использует исходные ссылки материалов/текстур и свои render targets: не заменяй
  shader hooks, envMap или материалы вне этого контракта.

## Практические ограничения и следующие решения

Это выборочная проверка компоновщиков/потребителей, не полный анализ всех циклов.
Прямых runtime-зависимостей domain/application от рендеринга в просмотренном коде нет.
Подтверждены следующие ограничения:

1. **Статическая сборка отражений.** graphics.ts создаёт proxies по buildings и читает
   quarterLighting при создании; lighting.ts один раз собирает reflectionMaterials.
   Добавление квартала после запуска автоматически не обновит эти коллекции.
2. **Нет общего завершения ресурсов.** Публичный `GraphicsPort` (presentation-contracts)
   и результат createGraphics не имеют dispose; runtime.stop останавливает кадры,
   но не освобождает GPU-ресурсы и обработчики адаптеров. Пересоздание мира требует
   отдельного согласованного жизненного цикла, а не повторного запуска app.ts.
3. **Неявные связи через реестр/userData.** car-model.ts, fastback.ts и world/buildings.ts
   вызывают дочерние фабрики через TBS; terrain/showcase передают ресурсы graphics через
   `ThreeSceneUserData` (world-showcase/rendering/world-animation контракты).
   Нельзя переставлять создание или повторно инициализировать namespace произвольно.
   В bootstrap/presentation.ts `getGraphics` замыкается на display, создаваемый позднее:
   он предназначен для последующих обновлений, не для раннего вызова в фабрике игрока.

Возможные отдельные изменения кода (сейчас не реализованы): явное обновление ресурсов
отражений для динамического мира; ограниченный контракт освобождения созданных ресурсов.
Каждое требует своего объёма и тестов. Статическая карта существующих моделей реализована
на №60; она локальна адаптеру и не допускает произвольной регистрации.

## Проверки и подробности

Правила выбора проверок — [AGENTS.md](../AGENTS.md). Команды определены в
[package.json](../package.json): build → classic dist, check → lint/format/build:check/test.
Число тестов смотри в результате конкретной проверки, не в этой карте.
Для запуска/DOM/WebGL используй [check-browser.cjs](../tools/check-browser.cjs), сохраняя старые снимки.
Для глубокой работы с типами — [typescript-build.md](typescript-build.md), с оптимизациями —
[vegetation-culling.md](vegetation-culling.md), [signal-housing-batching.md](signal-housing-batching.md),
[driving-performance.md](driving-performance.md). Читать их нужно по задаче, не перед каждым изменением.
