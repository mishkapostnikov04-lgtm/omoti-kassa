# Отклик Аникиной · 21.10.2026

`node _qa/feedback/module.cjs`: изолированные приоритеты, интервалы, настройки, недоступные API, iOS ветки и 30 результатов.

`node _qa/feedback/browser.cjs`: действующая HTML/C3.2 с полностью подменёнными API, реальный Web Audio decode/start и spies на вибрацию. iOS здесь — эмуляция API, не проверка устройства. Работает и с `QA_PUBLIC_BASE=https://mishkapostnikov04-lgtm.github.io/omoti-kassa/`.

`node _qa/feedback/offline.cjs`: отдельный локальный HTTP стенд без бизнес-кода, настоящий worker/cache и MP3, offline decode/play, сохранение старого cache и безопасная network-only HTML. Ни одного внешнего разрешённого запроса.

`node _qa/feedback/startup.cjs`: четыре обязательных ресурса — безопасный отказ, сохранение данных, восстановление.

`python _qa/feedback/scope.py`: бизнес/boot inline побайтно, неизменность других точек, SRI, область worker.

Существующая регрессия: `QA_POINT=anikina node _qa/card-edit-camera/frontend-regression.cjs` (7 групп). Её legacy output path сохраняется; task-копия доказательства — в отчёте feedback. Реальные операции запрещены.

Подробный отчёт/матрица сигналов/телефонная приёмка: `../../../_local_artifacts/kassa-feedback-20261021/REPORT.md`.
