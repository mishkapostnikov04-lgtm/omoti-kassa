# Советская: смена карты, редактирование и recovery

`node _qa/sov-card-edit/scope-check.cjs` — 50SRI, native/PIN/неизменность двух касс, старый decoder.
`node _qa/sov-card-edit/frontend-regression.cjs` — 9 fixture сценариев (карты, пустой комментарий, редактирование, ошибки, перезапуск, pending, камера, PIN, соседние кассы).
`node _qa/sov-card-edit/recovery-startup.cjs` — 4 обрыва обязательных ресурсов и2сценария сохранённой правки.

Используется существующий shift-harness: все orders.omoti.ru ответы подменены, другие host blocked, SW blocked, реальные операции запрещены. Chrome executable — штатный Windows путь; локальный сервер нормализует LF как прежний QA. `QA_OUT` задаёт папку результатов. `QA_PUBLIC_BASE=https://mishkapostnikov04-lgtm.github.io/omoti-kassa/` читает опубликованные assets с теми же fixtures. Синтетические карты только1111111/2222222 и длинный test номер; PIN не экспортируется. Реальный Safari/PWA и provider writes этими тестами не подтверждаются.
