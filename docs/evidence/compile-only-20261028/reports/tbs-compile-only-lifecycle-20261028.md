# Compile-only: адресное завершение lifecycle, 28 октября 2026

**Результат: шесть незакрытых сценариев прошли. Два ранее доказанных
сценария на идентичном коде повторно не исполнялись.**
Запрошенные lifecycle-гейты закрыты в исследованном объёме.
Визуальный gate 23 088 пикселей, max 4/255 остаётся открытым;
production-приёмка и merge этим результатом не разрешаются.

## Версия и происхождение

Цель всех текущих проверок — чистая B:
`2347940021c074acfd1f5a249c7b3a46ec6895c8`,
`feature/safe-compile-only-startup-20261026`,
`../tbs-compile-only-integration-20261026/`.
A `166ac7440c7e1e5e530eb6614a36acdf5295f639` не запускалась заново.
Основная локальная main `dbf73f5` не обновлялась и не использовалась для тестов.

Изучены [последний A/B](../tbs-compile-only-integrated-ab-20261028/report.md),
его raw/results и [интеграционный checkpoint](../tbs-compile-only-acceptance-20261026/INTEGRATION_STATUS_RU.md),
исторический lifecycle от 21 октября, актуальная документация Safe и сохранённая
оснастка. [Начальная матрица](matrix-before.md) зафиксирована до новых запусков.

Два PASS от 26 октября получены до checkpoint-коммита на `166ac744` с
незакоммиченным overlay. Хеши **всех десяти** файлов этого overlay совпадают
с чистым `23479400`; неизменённая часть относится к той же базе `166ac744`.
[Provenance](provenance.json) содержит пути, SHA256 и подтверждение тождественности.
Поэтому повторно использован PASS идентичного исполняемого кода, а не произвольного
старого SHA. Тогда Edge 156.0.4314.42, сейчас 156.0.4314.50; тот же RTX 3050
Laptop/D3D11, High, checks=true и file://. Нового основания повторять эти два
сценария из-за patch-обновления Edge не установлено.

Исторические 10 отмен, shader-error и no-KHR от 21 октября относятся к другой
экспериментальной версии Safe (vendor SHA256 `5fb78aeaa9ba4092eacdf2018e8e757aebc53eed0f3a98f7202cb7aa8c5684a0`).
Они определили методику и критерии, но не переносились в PASS текущей B.
Сохранённый текущий Safe имеет SHA256
`061f51c90a5e594fb344732929a6938ebb5475580f75cfb13347a24b95457fb3`.

## Итоговая матрица

Все строки относятся к точной целевой B `2347940021c074acfd1f5a249c7b3a46ec6895c8`.
Для записей 26 октября это установленная выше тождественность дерева до коммита.

| Сценарий | Дата доказательства | До | Сейчас | Первичное доказательство / исполнение |
| --- | --- | --- | --- | --- |
| High Start/W, успешная подготовка, освобождение Map | 28.10 | PASS | PASS | [8 raw A/B и результаты](../tbs-compile-only-integrated-ab-20261028/results.json); не повторялся |
| Loss после KHR-ready → close → restore → F5 | 26.10 | PASS | PASS | [Сохранённый raw](../tbs-compile-only-acceptance-20261026/functional/late-loss-restore-f5.json); не повторялся |
| Live close/recreate, старый ввод и старый close не влияют на новую сессию | 26.10 | PASS | PASS | [Сохранённый raw](../tbs-compile-only-acceptance-20261026/functional/live-recreate.json); не повторялся |
| B: отмена при реальном pending KHR | 28.10 | NOT RUN | **PASS** | [functional-B.json](functional/functional-B.json); выполнен |
| R: отмена после реального ready до запуска runtime | 28.10 | NOT RUN | **PASS** | [functional-R.json](functional/functional-R.json); выполнен |
| F: настоящая контролируемая ошибка fragment shader | 28.10 | NOT RUN | **PASS** | [functional-F.json](functional/functional-F.json); выполнен |
| D: отсутствие KHR → sequential fallback, High Start/W/close | 28.10 | NOT RUN | **PASS** | [functional-D.json](functional/functional-D.json); выполнен |
| E: context loss при pending KHR → close/restore/F5 | 28.10 | NOT RUN | **PASS** | [functional-E.json](functional/functional-E.json); выполнен |
| G: loss во время запрошенного cleanup/drain → restore/F5 | 28.10 | NOT RUN | **PASS** | [functional-G.json](functional/functional-G.json); выполнен |
| Map, polling, RAF и session-owned подписки после закрытия | 28.10 | INCONCLUSIVE | **PASS в шести адресных сценариях** | Все шесть raw, [сводка и assertions](results.json), [verify.cjs](verify.cjs) |

## Как проверяли и что получили

Выполнен ровно существующий набор `functional.cjs acceptance`: B/R/F/D/E/G,
по одному сценарию каждого типа, без технических повторов и новой стресс-серии.
E/G включают native restore, отсутствие действия старого ввода и предусмотренный
методикой F5 с настоящим High Start/W и последующим close.
Триггеры, порядок событий, shader-error/no-KHR-инъекции и критерии cleanup сохранены.

В отдельной копии диагностической оснастки добавлены только:

- скалярные снимки наличия/размера `__compileOnlyEnvMaps` перед подготовкой и
  отсутствия свойства после close, без удержания самих Map/material/texture;
- read-only CDP-подсчёт временных app-owned pagehide listener и соответствующие assertions.

Игра и vendor не менялись. Отмена воспроизводится прежним диагностическим
`pagehide` после настоящего KHR=false либо после реального ready, а не новым
пользовательским механизмом. Потеря контекста — через настоящий WEBGL_lose_context;
shader-error внедряется в реальный fragment source только внешним observer;
KHR скрывается только внешним observer.

Во всех шести сценариях подготовлено **83 программы**, checks=true.
В начале подготовки Map содержит четыре заимствованные ссылки на материалы/источники;
после закрытия свойство отсутствует. В каждом конечном закрытом состоянии:

- pending=0, pollTimers=0, drain.timer=null, RAF=0;
- session listeners: 39 зарегистрированы, closed=true, active=0;
- CDP session-owned DOM listeners=0, временные app-owned pagehide listeners=0;
- afterLossOps=0, staleUses=0, postDispose operations=0;
- повторный close не меняет счётчики удаления.

Live-контексты B/R/F: 86/86 программ и 172/172 shader-объектов получили delete
без дублей; остальные наблюдаемые виды ресурсов также сбалансированы.
В no-KHR D после реального рендера удалены 89/89 программ и 178/178 shader-объектов.
При context loss E/G teardown имеет `invalidated=true`, renderer.dispose не вызывается:
старые native объекты инвалидированы контекстом, не выдаются за индивидуально удалённые.
После restore старый ввод ничего не меняет; F5 создаёт рабочую High-сессию,
которая также успешно закрывается с освобождённой Map и нулевыми подписками.

Shader-error: badLinkStatus=false, badProgramUses=0, подготовка rejected;
исходная диагностика компиляции и сообщение `Shader preparation failed` сохранены.
No-KHR: подтверждён режим `sequential-no-khr`, успешные Start/W и close.

## Ошибки и границы доказательств

Новых FAIL, необработанных pageerror и GL_INVALID 1281/1282 в этих прогонах нет.
Ожидаемые console.error сохранены: отмена страницы, потеря контекста,
контролируемая ошибка shader/link. Они не скрывались и не названы новыми дефектами.
В E/G значение `37442` — ожидаемый `CONTEXT_LOST_WEBGL`, а не 1281/1282.
Прежние PMREM sigma warnings остаются видимыми.

Нулевые старые GL-операции относятся к инструментированным запросам/удалениям,
stale use/bind и проверенному сценарию; это не абсолютная гарантия для всех гонок
или всех возможных WebGL API. Счётчик `nativeLive` observer не является отдельным
измерением VRAM. Диагностический observer удерживает ссылки для учёта явного
cleanup: полная GC-достижимость здесь не доказывалась. Эти ограничения не скрыты
за PASS и не являются назначением новой серии.

## Сохранность и следующий шаг

[Проверка](results.json): **1040 защищённых файлов** сохранили SHA256.
Точные Git HEAD/status A, B и основной main совпали с исходными; индексы пусты,
`git diff --check` успешен. B и A чистые. В main остались ровно три изменённых
исторических shaderChecks-файла и один прежний untracked тест; их байты не менялись.
Оригинальная Three.js, Safe, поверхности, checkpoint и прежние отчёты сохранены.

Все новые материалы находятся только в этом каталоге вне рабочих деревьев:
начальная/итоговая матрицы, provenance, шесть raw, журналы, скопированная оснастка,
проверяющий скрипт и манифест SHA256. Browser profiles/node_modules исключены
из манифеста доказательств. Новых A/B, визуальных серий, build/check,
commit/push/merge/PR не было.

**В рамках запрошенной матрицы открытых lifecycle-гейтов не осталось.**
Единственный следующий необходимый шаг — адресная независимая приёмка остающегося
визуального расхождения повёрнутой камеры на замороженной B. Она не выполнялась
и не закрывается этим отчётом. Production не одобрена. Работа остановлена.
