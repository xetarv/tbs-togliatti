# Индекс сохранённых экспериментов

Полный пофайловый provenance, SHA256 и правила восстановления: [EVIDENCE_INDEX.json](EVIDENCE_INDEX.json). Имена ниже — логические каталоги после [восстановления](RESTORE.ps1).

| Каталог | Назначение и статус |
| --- | --- |
| `tbs-startup-next-step-20261028` | Выбор незавершённого интеграционного A/B; [отчёт](reports/tbs-startup-next-step-20261028.md). |
| `tbs-compile-only-integrated-ab-20261028` | Восемь пригодных измерений точных A/B, raw JSON и runner; выигрыш new 27,50%, warm неустойчив. [Отчёт](reports/tbs-compile-only-integrated-ab-20261028.md). |
| `tbs-compile-only-lifecycle-20261028` | Матрица восьми PASS, адресные сценарии, журналы и контроль сохранности. [Отчёт](reports/tbs-compile-only-lifecycle-20261028.md). |
| `tbs-camera-evidence-for-astra-20261028` | Исходные текущие A1/A2/A3/B и исторические A-контроли, PNG/RGBA, метаданные, сравнения. Исходный ZIP также сохранён [без изменений](packages/camera-astra-original.zip). |
| `tbs-camera-evidence-tools-20261028` | Скрипты происхождения, анализа и сборки camera-пакета. |
| `tbs-compile-only-camera-causal-20261028` | Обоснование внешнего отключения подготовки; [отчёт](reports/tbs-compile-only-camera-causal-20261028.md). |
| `tbs-compile-only-camera-pair-20261028` | Единственная пара enabled/disabled, полные снимки и signed delta: 0 различий. [Отчёт](reports/tbs-compile-only-camera-pair-20261028.md). |
| `tbs-compile-only-disabled-equivalence-20261028` | Офлайн-анализ без новых запусков: NOT PROVEN. [Отчёт](reports/tbs-compile-only-disabled-equivalence-20261028.md). |
| `tbs-compile-only-acceptance-20261026` | Приёмочные исходные материалы и патчи интеграции; [статус 26 октября](reports/INTEGRATION_STATUS_RU_20261026.md). |
| `tbs-safe-compile-only-20261026` | Старый прототип, исходные метрики и warm-анализ; не смешивать с интеграционной серией 28 октября. |
| `tbs-first-render-investigation-20261026` | Источники стоимости первого рендера. |
| `tbs-safe-envmap-causal-20261026` | Причинный контроль envMap и необходимые первичные материалы. |
| `tbs-warm-readiness-20261026` | Сохранённые readiness/polling-тайминги и заключения. |
| `tbs-browser-trace-20261026` | Существующие браузерные трассы; повторно не снимались. |
| `tbs-compile-only-publication-20261026` | Происхождение опубликованного экспериментального checkpoint. |

Итоговое решение и ограничения: [README_RU.md](README_RU.md). Исторические отчёты сохранены как доказательства своего этапа, а не как новые разрешения на разработку.
