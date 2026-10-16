# Карта архитектуры TBS Togliatti 2040

Короткий справочник по коду, проверенный на этапе №59; транспорт уточнён на №60, GPU-владение — на №61, обновление отражений — на №62. Состояние сессии и результаты
проверок — только верхняя запись [project-state.md](project-state.md); история работ —
[typescript-migration-log.md](typescript-migration-log.md). Архивы не нужны для обычной навигации.

## Найти систему

### Правила, данные, движение (`domain`)

[config.ts](../src/domain/config.ts), [state.ts](../src/domain/state.ts), [player-physics.ts](../src/domain/player-physics.ts), [road-network.ts](../src/domain/road-network.ts), [traffic.ts](../src/domain/traffic.ts)

[game-contracts.d.ts](../types/game-contracts.d.ts): `GameState`, `PlayerState`, `GameConfig`, `TrafficVehicle`; [physics.test.cjs](../tests/physics.test.cjs), [traffic.test.cjs](../tests/traffic.test.cjs)

### Сценарий кадра, сессия, задания (`application`)

[game.ts](../src/application/game.ts), [session.ts](../src/application/session.ts), [mission-controller.ts](../src/application/mission-controller.ts), [missions.ts](../src/domain/missions.ts)

`GameDependencies`, `GameFramePorts`, `MissionRoutes` в game-contracts; [application.test.cjs](../tests/application.test.cjs), [missions.test.cjs](../tests/missions.test.cjs)

### Сборка приложения (`bootstrap`)

[game.ts](../src/bootstrap/game.ts), [presentation.ts](../src/bootstrap/presentation.ts), [world.ts](../src/bootstrap/world.ts)

[bootstrap-contracts.d.ts](../types/bootstrap-contracts.d.ts): `BuildGameOptions`, `BootstrapPorts`, `PresentationState`; [presentation-contracts.d.ts](../types/presentation-contracts.d.ts)

### Цикл, ввод, UI и звук (`adapters`)

[runtime.ts](../src/adapters/browser/runtime.ts), [controls.ts](../src/adapters/input/controls.ts), [camera.ts](../src/adapters/input/camera.ts), [ui/](../src/adapters/ui/), [audio/](../src/adapters/audio/)

`RuntimeOptions`, `GameRuntime`, `InputOptions` в bootstrap-contracts; UI/audio/camera в presentation-contracts; [runtime.test.cjs](../tests/runtime.test.cjs), [input.test.cjs](../tests/input.test.cjs)

### Модели и отображение транспорта

[car-model.ts](../src/adapters/vehicles/car-model.ts), [player-car.ts](../src/adapters/vehicles/player-car.ts), [fastback.ts](../src/adapters/vehicles/fastback.ts), [simulation/traffic.ts](../src/adapters/simulation/traffic.ts)

`CarModels`, `CarModelsOptions` в presentation-contracts; [car-model-contracts.d.ts](../types/car-model-contracts.d.ts), [fastback-contracts.d.ts](../types/fastback-contracts.d.ts), [traffic-view-contracts.d.ts](../types/traffic-view-contracts.d.ts)

### Строительство мира

[resources.ts](../src/adapters/world/resources.ts), [terrain.ts](../src/adapters/world/terrain.ts), [roads.ts](../src/adapters/world/roads.ts), [parks.ts](../src/adapters/world/parks.ts), [buildings.ts](../src/adapters/world/buildings.ts), [showcase.ts](../src/adapters/world/showcase.ts), [population.ts](../src/adapters/world/population.ts)

[world-contracts.d.ts](../types/world-contracts.d.ts): `WorldOptions`, `WorldResources`, `WorldConstructionState`; [world-showcase-contracts.d.ts](../types/world-showcase-contracts.d.ts), [world-resources-contracts.d.ts](../types/world-resources-contracts.d.ts)

### Рендер, освещение, отсечение

[scene.ts](../src/adapters/rendering/scene.ts), [lighting.ts](../src/adapters/rendering/lighting.ts), [display.ts](../src/adapters/rendering/display.ts), [graphics.ts](../src/adapters/rendering/graphics.ts), [vegetation-culling.ts](../src/adapters/rendering/vegetation-culling.ts)

[rendering-contracts.d.ts](../types/rendering-contracts.d.ts), [graphics-contracts.d.ts](../types/graphics-contracts.d.ts), [vegetation-contracts.d.ts](../types/vegetation-contracts.d.ts); [reliability.test.cjs](../tests/reliability.test.cjs), [vegetation-culling.test.cjs](../tests/vegetation-culling.test.cjs)

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
- Динамический состав (№63): `TrafficSimulation.addVehicle(variant?)` возвращает машину
  с монотонным ID; неизвестный вариант — RangeError. `removeVehicle(id)` возвращает
  false для отсутствующего/некорректного ID. `version` меняется только при изменении
  состава. Не заменяй/не редактируй состав массива traffic напрямую: его ссылка нужна
  физике и звуку. TrafficView сверяет ID только при новой версии, сохраняет существующие
  модели и отражает показанную версию через свой getter. Изменения применяются на
  следующем обновлении трафика (в игре — при playing, до физики). Ошибка фабрики удаляет
  непостроенный источник, сохраняет согласованность остальных ID и передаётся runtime.
- Адаптивная плотность (№64) включается только при `?dynamicTraffic=1`; без параметра,
  при `0` и любых других значениях сохраняется прежний режим 36 машин. Standalone domain-фабрика
  без dynamicTraffic сохраняет прежний режим. Контроллер вызывается после движения
  traffic, перед согласованием моделей и физикой, только через активный игровой шаг.
  Раз в 3 с он удаляет не более одной машины дальше 270 и добавляет не более одной,
  если машин меньше 36. Время жизни до удаления — минимум 15 активных секунд.
  `addVehicle(variant?, placement?)` принимает road/axis/dir/pos, вычисляя прежние
  полосу и heading. Автопоявление: середины существующих участков, вдали от перекрёстков,
  190–230 от игрока, минимум 14 от трафика/припаркованных машин; направление — к району
  игрока. Родственная дорога должна проходить не дальше 70 по поперечной оси.
  При высокой скорости увеличивается защитный горизонт; небезопасное создание пропускается.
  Радиусы учитывают нынешнюю дальность 135 и обычное смещение камеры, но не произвольную
  телепортацию/будущее увеличение дальности. В центре карты может не быть подходящей
  невидимой точки: бюджет останется незаполненным. Не повышай плотность принудительно.
  Проверки — [adaptive-traffic.test.cjs](../tests/adaptive-traffic.test.cjs) и native lifecycle
  в dynamic-traffic.test.cjs. FPS-выигрыш не измерен; изменение состава — игровая политика,
  не замена rendering/culling. Контроллер не увеличивает лимит для внешних ручных addVehicle.
- `CarModels.disposeTrafficCar(model)` освобождает только выделения этой фабрики и
  отсоединяет модель; повторный/чужой вызов возвращает false. Конструкторы traffic
  учитывают индивидуальные геометрии, материалы и InstancedMesh; локальные обёртки
  mat/makeTexture/signTexture/detailBar/wedge учитывают их новые ресурсы, включая
  незавершённую сборку. Эти helpers должны создавать новые ресурсы, как в текущем коде:
  ввод кэшей потребует уточнения владения. unitBox, общие материалы, markTexture и
  общая текстура тени не освобождаются. Fastback/припаркованные модели не изменены.
  Освещение пересобирает список материалов по версии уже показанного трафика,
  сохраняя исходные базовые интенсивности и удаляя отсутствующие ссылки. Проверка —
  [dynamic-traffic.test.cjs](../tests/dynamic-traffic.test.cjs).
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

1. **Явное обновление отражений, статическое освещение квартала.**
   `GraphicsPort.setReflectionObjects(sources)` и `setReflectionBuildings(buildings)`
   принимают полные упорядоченные снимки по событию изменения мира. Идентичность
   источника/дескриптора сохраняет клон/прокси; повторения удаляются, отсутствующие
   источники отсоединяются и забываются. Изменённый дескриптор здания нужно передать
   повторно: обновятся позиция, размеры и материал. Неиспользуемые собственные
   материалы прокси освобождаются; общая геометрия живёт до dispose. Клоны заимствуют
   ресурсы мира. Обновление cube/water идёт по прежнему расписанию; quarter помечается
   для обновления даже при прежнем daylight, с прежними ограничениями расстояния/частоты.
   Кадровой пересборки нет. Семантика синхронизации позиции/quaternion и видимости по
   расстоянию сохранена; изменение вложенной структуры/материалов клона автоматически
   не отслеживается (источник можно явно удалить и добавить). После dispose методы — no-op.
   quarterLighting/его reflective и facades фиксируются при создании graphics;
   lighting.ts пересматривает reflectionMaterials при изменении показанного трафика
   (№63), но самостоятельное добавление квартала не является таким событием.
   Новые кварталы автоматически не регистрируются. Проверки — graphics-dispose.test.cjs.
2. **Освобождение графики локально, не является teardown приложения.**
   `GraphicsPort.dispose()` (presentation-contracts) освобождает собственные targets,
   depth texture, fullscreen-геометрию/материал и proxy-геометрию/материалы один раз.
   Клоны неба/лодок только отсоединяются: их геометрии, материалы и текстуры разделяются
   с миром. Собственные uniform/envMap-ссылки очищаются или восстанавливаются только
   при совпадении текущего владельца; заменённый кем-то другим shader hook сохраняется.
   В r149 renderer сам удаляет depth texture загруженного target; для неиспользованного
   target есть запасная очистка без двойного dispose. Native setSize по-прежнему может
   выдавать события dispose при resize — это не вызов GraphicsPort.dispose.
   После dispose render/resize — no-op, setQuality возвращает последнее качество,
   геттеры остаются доступны. Сам renderer, его внутренние кэши (включая PMREM),
   сцена и внешние ресурсы не уничтожаются. Проверка — [graphics-dispose.test.cjs](../tests/graphics-dispose.test.cjs).
   runtime.stop останавливает кадры отдельно; graphics.dispose не останавливает цикл.
   Display по-прежнему владеет qualitySelect/resize-обработчиками, остальные адаптеры —
   своими событиями. Полное пересоздание мира требует отдельного согласованного teardown,
   а не повторного запуска app.ts.
3. **Неявные связи через реестр/userData.** car-model.ts, fastback.ts и world/buildings.ts
   вызывают дочерние фабрики через TBS; terrain/showcase передают ресурсы graphics через
   `ThreeSceneUserData` (world-showcase/rendering/world-animation контракты).
   Нельзя переставлять создание или повторно инициализировать namespace произвольно.
   В bootstrap/presentation.ts `getGraphics` замыкается на display, создаваемый позднее:
   он предназначен для последующих обновлений, не для раннего вызова в фабрике игрока.

Возможные отдельные изменения кода (сейчас не реализованы): обновление освещения новых
кварталов; согласованное завершение событий/мира и владение
renderer на уровне приложения. Статическая карта моделей реализована на №60,
локальный dispose графики — на №61, явные снимки источников отражений — на №62.
Это не системы регистрации/управления всеми ресурсами.

## Проверки и подробности

Правила выбора проверок — [AGENTS.md](../AGENTS.md). Команды определены в
[package.json](../package.json): build → classic dist, check → lint/format/build:check/test.
Число тестов смотри в результате конкретной проверки, не в этой карте.
Для глубокой работы с типами — [typescript-build.md](typescript-build.md), с оптимизациями —
[vegetation-culling.md](vegetation-culling.md), [signal-housing-batching.md](signal-housing-batching.md),
[driving-performance.md](driving-performance.md). Читать их нужно по задаче, не перед каждым изменением.

## Компактный шаблон задания Codex

Постоянные правила — в AGENTS.md; в задании достаточно специфики задачи:

```text
Цель: конкретный результат и критерий приёмки.
Область: целевые модули/контракты; что вне задачи; ожидаемая Git-основа.
Инварианты: соблюдать AGENTS.md; дополнительные ограничения этой задачи.
Проверки: адресные сценарии; итоговые проверки по AGENTS.md.
Остановка: после результата либо при конфликте/риске/необходимости выйти за область.
Git: разрешён ли один локальный коммит; разрешён ли push (по умолчанию — нет).
```

Для оценки следующей задачи фиксируй число прочитанных файлов и повторных чтений,
повторных полных проверок и усечённых выводов; сопоставляй только задачи близкого объёма
с одинаковыми критериями приёмки. Токены сравнивай лишь при наличии фактической
статистики среды с указанием источника; размер документов не равен расходу токенов.
