# Резервный перенос async-экспериментов, 20.10.2026

Ветка: [checkpoint/r149-async-safe-20261020](https://github.com/xetarv/tbs-togliatti/tree/checkpoint/r149-async-safe-20261020).
База: `5cbd6f741415bf10d44b2a6088b9bc26e1916d50`. Это резервная ветка; merge/push в main не выполняется.

**Точный SHA checkpoint:** после получения ветки выполните `git rev-parse HEAD`; полный опубликованный SHA также передан в финальном сообщении Сергею. Файл внутри коммита не может содержать собственный вычисленный SHA без изменения этого SHA.

## Получить дома без перезаписи домашней работы

В существующем домашнем клоне сначала посмотрите `git status`. Не сбрасывайте и не перезаписывайте локальные изменения. Получите отдельную ветку и создайте отдельный worktree в свободной папке:

```powershell
git fetch origin checkpoint/r149-async-safe-20261020
git worktree add -b home/r149-async-safe-20261020 ../tbs-r149-home origin/checkpoint/r149-async-safe-20261020
cd ../tbs-r149-home
git rev-parse HEAD
```

Если имя ветки или папка уже заняты, выберите другое свободное имя; никаких force/reset/clean. Эти команды не переключают существующую домашнюю main.

## Проверить и восстановить

Все новые ZIP лежат рядом с этим README; список и SHA-256 — в [manifest.json](manifest.json) и [SHA256SUMS.txt](SHA256SUMS.txt). Пять старых ZIP уже опубликованы в базе, находятся в [соседнем пакете](../r149-async-principle-20261019/README.md) и повторно не дублируются. Они нужны для раннего B и исторических исходников.

В корне **нового чистого worktree**:

```powershell
powershell -NoProfile -File docs/diagnostics/r149-async-handoff-20261020/restore.ps1 -ApplyShaderChecks
node docs/diagnostics/r149-async-handoff-20261020/prepare-portable.cjs
```

Restore проверяет ZIP, извлекает сначала старые, затем новые архивы и сверяет все новые файлы с SHA-256. Отличающиеся существующие файлы не перезаписываются. `-ApplyShaderChecks` разрешён только на чистом отдельном worktree: восстанавливает четыре исторических изменения из точных снимков. Без этого флага снимки остаются в `artifacts/r149-handoff-inputs-20261020/shaderChecks/` для сравнения. Production renderer не заменяется экспериментальным.

Для Node-скриптов нужен Node.js; для браузерных проверок — существующие зависимости проекта (`npm ci`, только если их нет). Восстановление и подготовка требуют только штатных PowerShell/.NET и Node, новые зависимости не устанавливаются автоматически.

`prepare-portable.cjs` создаёт **новые** `*.portable.html/js/cjs`, переадресует старые абсолютные пути в текущий корень и проверяет все script-ссылки последнего Safe. Оригинальные извлечённые файлы сохраняются побитово. Старые генераторы нельзя запускать поверх сохранённых доказательств.

## Открыть A и последний Safe

```powershell
Start-Process msedge.exe (([uri](Join-Path (Get-Location).Path 'index.html')).AbsoluteUri)
Start-Process msedge.exe (([uri](Join-Path (Get-Location).Path 'artifacts/r149-minimal-cancel-20261020/index-fixed.portable.html')).AbsoluteUri)
```

Фактические file:// URL также выводит подготовка и сохраняет в `artifacts/r149-home-continuation-20261020/prepared-paths.json`. High и shader checks=true; режим LINK_STATUS остаётся только в экспериментальном HTML.

## Инструменты продолжения — не запускать автоматически

Подготовлены отдельные пустые каталоги результатов, чтобы не перезаписывать историю:

```powershell
# Исходный минимальный пример и отрицательный контроль:
node artifacts/r149-home-continuation-20261020/minimal/run-minimal.cjs simple
# Отмена старого Safe до исправления (может дать 1281):
node artifacts/r149-home-continuation-20261020/original/check.cjs cancel
# Три отмены исправленной копии:
node artifacts/r149-home-continuation-20261020/fixed/check.cjs cancel
# High Start/W, context loss и явный reload по инструкции F5:
node artifacts/r149-home-continuation-20261020/fixed/check.cjs
```

Сценарии создают новые browser profiles, которые не входят в Git. При повторном исследовании используйте новый каталог результатов; готовые runner откажутся перезаписывать JSON. Восьмисценарная минимальная матрица включает отдельные `simple narrow` из оригинального скрипта.

## Что читать первым

[STATE.md](STATE.md), затем `artifacts/r149-minimal-cancel-20261020/report.md` и `retirement-patch.json`. Первое дальнейшее решение — оценить приемлемость синхронного ожидания при отмене (до 1,95 с в короткой серии) и оставшиеся production-блокеры. Не повторять завершённые общие аудиты и не начинать новую оптимизацию без задания.

Все времена относятся к **рабочему ноутбуку** Ryzen 7 7435HS / RTX 3050 Laptop / 16 ГБ. Домашние i7-9700K / RTX 2080 Ti / 32 ГБ — другая среда; ноутбучные результаты не являются домашними измерениями.

Исключены browser profiles/cookies/accounts, node_modules, большая часть дублирующихся полных trace и промежуточных performance-кадров. Точный перечень пропусков и причин — в manifest. Исторические RGBA, дублируемые сохранёнными lossless PNG, частично исключены; последние три состояния Safe и ключевая A/A-маска сохранены также сырыми RGBA.
