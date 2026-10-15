# Состояние TBS Togliatti 2040

## Current R2 status - 15 October 2026

R1 published base: 7ea72ebdf63060ce4d12dc670f1d1c9c08eba6eb, main.
Stage 46 completed locally: 65 production TS / 66 classic dist / 24 remaining JS.
Build/check 64/64, two complete ASTs and native r149 resource/ready comparisons passed.
The user authorized the two stage-46 call-ternary paths; the earlier stop is historical.
Stage 47 is next; final Edge smoke after 49. No push, R3 or stage 50.
Historical diagnostics retained; new compact evidence in tbs-r2-20261015-bl0T7n.

## Текущая рабочая сессия — 15 октября 2026

Рабочий ноутбук: `C:\Users\s.nikushkin\Documents\tbs-togliatti`, ветка main.
Разрешённый fast-forward завершён: исходные HEAD и origin/main пакета Р1 —
`499b051cf5e953590780200264435beb1df98567`. Этапы №39–41 опубликованы;
утверждения о локальном статусе ниже относятся к историческому снимку.
Зависимости синхронизированы npm ci без изменения manifest/lockfile.

№42: shell/office/entrance/block переведены; 55 production TS, 56 classic dist.
Проверены четыре AST и 20 сценариев r149 с порядком фабрик, ссылками style/body,
материалами, отражениями и граничными ширинами/seed. build/check: 64/64 теста, strict TS7.
Разрешён автономный пакет №42–45 с отдельными локальными коммитами; push и №46 запрещены.
Итоги следующих ступеней добавляются в эту текущую запись и журнал.

## R1 current result - 15 October 2026

Stage 42: f738a1863f6cf037ac19e25fe888bb83ec465df6.
Stage 43: dcd9ced1e95124b7ef440c838656c8a624e97618.
Stage 44: 855bb62aa9e44e83d8be691b4e14b605cc1cb0fa.
Stage 45: signs/facades/fixtures migrated; 63 production TS, 64 classic outputs.
The user explicitly resolved the earlier lint conflict by authorizing call ternaries
only for materials.ts and visual-assets.ts. The old stop is retained in the journal.
Stages 44/45: five exact ASTs; native r149/Canvas-command fixtures match for 44.
Build/check passed 64/64 tests, strict TS7 and ESLint at both resumed stages.
Final existing desktop/mobile Edge file smoke passed, including driving and audio.
Native comparisons: 64 Canvas pixel hashes, rendered leaf shader and two ready-state
resource scenes match originals. All 93 script paths exist; 52 prior dist hashes match.
The 90 historical artifact directories retain recorded timestamps; no mass file audit.
The earlier stop was resolved; all four R1 stages are complete in separate local commits.
New evidence is outside Git in tbs-r1-20261015. Full-scene pixel identity/FPS not measured.
No push or stage 46; previous commits and historical diagnostic data retained.

## Исторический снимок домашней сессии

Снимок домашней сессии от **14 октября 2026**. Это контрольная справка для продолжения
работы, а не утверждение о текущем состоянии любой другой копии проекта.
Перед изменениями проверяй Git и актуальные результаты команд.

## Игра и архитектура

TBS — неофициальная браузерная 3D-игра о поездках и доставке грузов в стилизованном
Тольятти 2040. Есть физика автомобиля, трафик, пешеходы, задания и городской мир.

`bootstrap` связывает чистые `domain` и `application` с внешними `adapters`.
Domain рассчитывает правила и состояния без DOM/Three.js; application управляет
сценариями через переданные интерфейсы. Адаптеры реализуют графику, ввод, браузер,
аудио, UI и сборку мира. Реестр — `window.TBS`/`globalThis.TBS`, с отдельными
`domain` и `application`. Подробности: [архитектура](refactoring.md),
[правила агента](../AGENTS.md), [README](../README.md).

Технологии: Three.js **r149**, WebGL, classic JavaScript, строгий TypeScript,
ESLint 10.12.0, Prettier и Node.js 24+ для инструментов. На домашнем ПК проверен
Node.js **24.21.0**. Сама игра не требует Node.js, HTTP-сервера или интернета:
`index.html` открывается через **file://**; библиотека и ресурсы сохранены локально.
Порядок обычных скриптов обязателен, runtime ESM и bundler не используются.

## TypeScript и команды

- **51 производственный TS-модуль**, включая все 11 модулей domain/application.
- Ещё один технический `src/build-smoke.ts`: всего 52 исходника TS.
- **52 classic JS-файла dist**, включая технический. dist хранится в Git.
- Миграция не завершена: часть JS-адаптеров и внутренних фабрик ещё не переведена.
  Их структурные декларации не означают статическую проверку внутренностей.

`npm run build` сначала выполняет полный strict typecheck, затем emit TS в отдельный
временный каталог, проверяет classic scripts и обновляет dist. Emit-конфигурация
использует noCheck только после строгой проверки; не запускай её вместо общей сборки.
`build:check` проверяет актуальность dist без его изменения. `typecheck` работает
без emission; `build:watch` использует тот же защищённый путь компилятора.

После опубликованного A2 производственный компилятор **TS 7.0.2** явно разрешается через
alias `@typescript/native` с проверкой версии. Alias `typescript` предоставляет
официальный пакет совместимости `@typescript/typescript6@6.0.2`, который загружает
зафиксированный API **TS 6.0.3** для `typescript-eslint` **8.71.2**.
Этот API не используется для производственной сборки.

`npm run check` объединяет ESLint, Prettier, build:check со strict typecheck
и тесты Node.js. ESLint действительно охватывает **52 TS-файла и 12 деклараций**,
сохраняя JS/CJS и ограничения чистых слоёв. Для изменений исходников выполняй
`npm run build && npm run check`; для документации выбирай достаточные проверки.
Не запускай отдельно тесты, уже входящие в check.

## Git и завершённые этапы

Репозиторий: [xetarv/tbs-togliatti](https://github.com/xetarv/tbs-togliatti), ветка `main`.
Последняя подтверждённая опубликованная контрольная точка:
**`dfc26303dfd38f4749607fa80d3215fc6fc99e22`**.
Коммит A2+A3 опубликован поверх `c8fa3e4659caaf6740d2a6b72ee558b08d4b247b` (№38 и A0+A1).
Перед №39 проверено совпадение main/origin/main. Изменения №39 пока локальные.

| Этап | Состояние в этой сессии                                                         |
| ---- | ------------------------------------------------------------------------------- |
| №38  | Опубликован; structure/windows мигрированы, всего 43 производственных TS-модуля |
| A0   | Опубликован; сборщик очищает только собственные временные каталоги              |
| A1   | Опубликован; постоянные тесты сборщика, рост общего набора с 49 до 56           |
| A2   | Опубликован; ESLint для TS, разделение TS7/TS6, 63 теста                        |
| A3   | Опубликованы правила агента, снимок состояния и дополнение журнала              |

Последний успешный отчёт **A2 от 14 октября 2026**: npm ci, build и check прошли,
**63/63 теста** (56 прежних + 7 новых). Все 44 dist побитово совпали с состоянием
до A2. Подтверждена сохранность 1875 прежних диагностических файлов домашней копии,
включая исторические 1869. Данные A2 — `artifacts/eslint-typescript-a2-6a88c92a/`;
[технический отчёт A2](eslint-typescript.md).

Итоговая проверка **A2+A3 от 14 октября 2026**: один `npm run check` прошёл,
**63/63 теста**. SHA-256 восьми файлов A2 и всех 44 dist не изменился;
1886 диагностических файлов, существовавших перед A3, сохранены.
Новые изменения A3 ограничены тремя документами; отдельная сборка и браузерный
тест на A3 не запускались.

При синхронизации домашнего ПК перед A2 существующий Edge file:// smoke прошёл:
запуск, движение, пауза, камера, освещение, звук, графические режимы и мобильный ввод.
На A2 браузерный тест не повторялся: runtime, HTML и Three.js не изменены.
Эти результаты не являются новым профилем FPS или доказательством пиксельной идентичности.

## Ограничения и продолжение

Пакет №39–41 выполнен локально; push запрещён.
№39 сохранён коммитом `d8f10a4f3bdeb7f585cbf74e830f6e9bdd1bb499`,
№40 — `7038d42ade841ee0ff46d08840fb9003411a40a0`.
На №39 переведены showcase roof/pavilion/landscape, на №40 — materials;
на №41 — building components trim/windows/storefront/roof.
Во всём world/showcase больше нет JS-исходников; компоненты зданий
entrance, office и shell остаются JS. Весь world не объявляется мигрированным.

Проверки №40 и №41: build/check, **64/64 теста** в каждом этапе.
Восемь AST миграций совпали. На №40 настоящий Edge Canvas подтвердил стабильное
побитовое совпадение 15 текстур (5308416 RGBA-байт) и всех 683157 операций с аргументами.
Это не утверждение о совпадении framebuffer сцены. На №41 реальные объекты r149
совпали в 16 сценариях четырёх стилей зданий; финальный Edge file:// smoke прошёл,
а desktop-аудит с исходными компонентами совпал по всем 200 вызовам и данным сцены.
Измерения FPS не проводились. Узкое разрешённое allowTernary действует только
в showcase/materials.ts и защищено постоянным тестом.

При каждой ступени прежние dist сохранялись побитово: 44 до №39, 47 до №40,
48 до №41. Добавлены только восемь новых classic JS. Историческая диагностика сохранена.
Результаты: `artifacts/typescript-stage39-dd891581/`,
`artifacts/typescript-stage40-43e1ce27/`, `artifacts/typescript-stage41-2640d867/`.
Подробности — в [журнале](typescript-migration-log.md).

- Сохранить опубликованные A2+A3 и локальные коммиты №39–41 при дальнейшей работе.
  Не коммитить/push без отдельного разрешения; перед публикацией проверить удалённую ветку.
- Не редактировать dist вручную, не ослаблять strict и архитектурные правила.
  Не заменять TS7 компилятором TS6.
- Исторические отчёты содержат прежние числа тестов, пути JS и показатели других ПК.
  Не переносить их как текущие измерения; актуальные сведения сверять с Git и проверками.
- ESLint проверяет прямые архитектурные обращения, не произвольный поток данных через aliases.
  Проектный типозависимый линт TS6 не включён; строгую проверку выполняет TS7.
- Пакет №39–41 завершён локально. Публикация требует отдельного разрешения; №42 не начинался.

История: [журнал миграции](typescript-migration-log.md).
Сборка: [описание инфраструктуры](typescript-build.md).
