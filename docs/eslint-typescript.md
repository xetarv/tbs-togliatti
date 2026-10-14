# A2: ESLint для TypeScript

Домашний ПК, 14 октября 2026. Исходная основа и ветка:
`c8fa3e4659caaf6740d2a6b72ee558b08d4b247b`, `main`.
43 производственных модуля и технический `src/build-smoke.ts`.

## Совместимость и воспроизводимость

Использована [официальная схема Microsoft](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
для инструментов, которым нужен программный API старого компилятора.
Проверены [поддерживаемые версии typescript-eslint](https://typescript-eslint.io/users/dependency-versions/)
и метаданные npm выбранного выпуска: ESLint 10 и TypeScript >=4.8.4 <6.1.0 поддерживаются.

Прямые зависимости зафиксированы точно:

- `@typescript/native`: `npm:typescript@7.0.2` — компиляция и строгая проверка.
- `typescript`: `npm:@typescript/typescript6@6.0.2` — совместимый API для ESLint.
- `typescript-eslint`: `8.71.2` — parser, plugin и recommended-конфигурация.

Пакет совместимости 6.0.2 сам переэкспортирует `@typescript/old`, который после
установки имеет версию **6.0.3**, зафиксированную в lockfile.
Это фактическая версия API, загружаемого парсером; версия основного компилятора — **7.0.2**.
Подтверждены `createSourceFile`, пути разрешения API, версии CLI и согласованность
manifest/lockfile. Установка через `npm ci` успешна. Ни `--force`, ни обход peer dependencies
не применялись. Версии 101 прежней записи зависимостей в lockfile (кроме заменённого
пакета typescript) сохранились.

`tools/build-typescript.cjs` явно разрешает `@typescript/native/package.json`
и требует имя `typescript` и версию `7.0.2` до любых операций с dist.
`build`, `build:check`, `build:watch` используют этот же путь.
`npm run typecheck` вызывает тот же сборщик с `--typecheck`: только strict noEmit,
без генерации и временных каталогов. Таким образом, выбор компилятора не зависит
от порядка npm bin-links или наличия TS6.

## Правила и охват

Реальный запуск ESLint обработал **44 `src/**/*.ts`** (включая fixture)
и **12 `types/**/*.d.ts`**. Для каждого результата проверены выбранный TS-парсер,
включённое правило TS no-unused-vars и отключённое базовое no-undef.
Существующий охват JS/CJS и исключения assets/dist/artifacts/node_modules сохранены.

Подключены recommended-правила typescript-eslint, включая no-explicit-any и правила
корректного использования TS-конструкций. `@typescript-eslint/no-unused-vars`
заменяет базовое правило, сохраняя проверку всех параметров и соглашение `_`.
`no-undef` выключен только для TS: глобальные межфайловые контракты проверяет строгий TS7.
Обычные правила оформления поведения JS и ограничения сложности применяются также к TS.

Для domain/application сохранены complexity 15, max-depth 4, max-statements 25.
Добавлен явный запрет браузерных глобальных зависимостей и THREE,
включая обращения через globalThis; это необходимо при отключённом TS no-undef.
Сохранён запрет чужого реестра TBS, включая статические обращения в квадратных скобках.
Runtime import/require запрещены в чистых слоях: зависимости передаются аргументами.

Только для `.d.ts` необходимы два исключения:

- `no-var: off` допускает реальные ambient `declare var`, формирующие globalThis.TBS
  и другие существующие глобальные данные classic scripts.
- `no-empty-object-type` разрешает интерфейс с одним extends: существующие именованные
  handles и BootstrapWorld используют слияние деклараций в разных файлах.

Другие TS-правила, включая no-unused-vars, в декларациях сохранены.
Игровые `.ts`, общие объявления типов, HTML и настройки компиляции не переписывались.

## Постоянные тесты

В `tests/architecture.test.cjs` добавлены пять тестов с `ESLint.lintText()`:

1. Аннотации и доступ к собственному domain/application реестру проходят.
2. Неиспользуемая TS-переменная выдаёт именно `@typescript-eslint/no-unused-vars`.
3. Browser globals и THREE, напрямую и через globalThis, выдаёт `no-restricted-globals`.
4. Чужой реестр TBS и runtime import выдаёт `no-restricted-syntax`.
5. Ambient `.d.ts`, type-only параметры и слияние интерфейсов проходят без ложных ошибок.

Каждый виртуальный TS-файл проверяется на отсутствие игнорирования и ошибок парсинга.
Проверяются конкретные ruleId. Прежний JS-тест no-undef и архитектурных ограничений сохранён.
Два адресных теста сборщика дополнительно проверяют отказ при подмене TS7 на TS6
и общий путь компилятора для standalone typecheck без emission.

## Материалы и ограничения

Данные сохранены в `artifacts/eslint-typescript-a2-6a88c92a/`: снимок SHA-256 всех
44 файлов dist, инвентаризация прежних диагностических файлов, логи установки,
линтера и итоговых проверок, проверка toolchain и `toolchain-coverage.json`.
Архитектурные ограничения — статические правила прямых обращений, не анализ потока
данных через произвольные aliases. ESLint не заменяет strict typecheck TS7;
типозависимый проектный линт через TS6 не включался.

Classic scripts, Three.js r149 и file:// не затрагиваются.
Никакого коммита/push, A3 или этапа №39 в рамках A2.

## Итоговые результаты

`npm run build` прошёл: strict typecheck TS7, 44 classic scripts.
`npm run check` прошёл: ESLint, Prettier, build:check и **63/63 теста**
(56 прежних и 7 новых). Общий запуск тестов выполнен один раз.
`git diff --check` прошёл. SHA-256 всех **44/44 файлов dist** совпал с состоянием
до A2. Прежние диагностические файлы проверены по сохранённой инвентаризации;
исторические 1869 файлов не удалялись. Отслеживаемые src, types, index.html,
assets и TS-конфигурации не изменены.

Изменения: package.json, package-lock.json, eslint.config.mjs, tools/build-typescript.cjs,
tests/architecture.test.cjs, tests/typescript-build.test.cjs, docs/typescript-build.md
и этот отчёт. HEAD не изменился; рабочее дерево содержит только локальные изменения A2.
Готовность к следующему отдельному A3 подтверждена текущими проверками.
Новый браузерный запуск на A2 не выполнялся: runtime-файлы побитово сохранены,
Edge file:// уже проверен при предшествовавшей синхронизации.
