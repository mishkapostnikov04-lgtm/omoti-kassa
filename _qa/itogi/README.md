# Итоги Аникиной · C3.2, вариант А

Согласованный пакет: ../../design-system/modules/cashier-anikina/itogi-a-approved-20261014 относительно корня проекта OMOTI. Эталонные PNG/данные неизменны; CSS пакета подключён байт в байт.

Node/Playwright использует существующий ../c31/harness.cjs. Все бизнес-запросы перехватываются строгими фикстурами, неизвестный запрос приводит к ошибке. Реальных продаж, списаний бонусов и удалений нет.

- check-itogi.mjs: оригинальный контракт прототипа28.
- qa-itogi-live.mjs: оригинальные assertions живой кассы (baseline18 FAIL, требуется0).
- capture.cjs: все28ST/SW, originalPNG слева, действующая касса справа; sourceSHA фиксируются до съёмки. Наличие снимка не означает визуального принятия.
- financial-parity.cjs:14 одинаковых API fixtures в immutable предыдущей реализации dd7 и новой; проверяет суммы, наличные, Яндекс, все строки/тексты бонусов, задолженность, брак, сотрудников, топ и доли. Оригинальные inline business scripts не менялись.
- interaction.cjs: все5 секций, Enter/Space, чипы, full defects, reload/period/tab persistence,5недель/6месяцев/all, corrupt/denied LS, retry, widths320/360/390/430, measured safe-area/dock, reduced motion.
- ../c32/folded-stats.cjs теперь запускает более сильный пятисекционный interaction contract.

Старая C32 capture-app поддерживает OMOTI_QA_NONSTATS=1:46 состояний вне заменённыхI2. retained-c31 при том же флаге сохраняет87 внеIT; IT03/05/06 проверяются отдельно по содержанию в9 viewport. IT04/07 иI2 заменены новым утверждённым контрактом28, не ослабленным старым golden. supplemental использует новые stats selectors, остальные assertions прежние.

BASE_URL задаёт localhost или опубликованный URL; QA_STAGE задаёт уникальную папку доказательств, QA_PUBLISHED_COMMIT фиксирует проверенный релиз. Для C31 regression требуется также OMOTI_QA_BASE_URL. Оригинальные проверки8 групп, motion46 кадров, prototype14 behavior и WebKit20 сохранены. Старые отчёты не перезаписываются.

Артефакты и оркестрация: _local_artifacts/cashier-anikina-itogi-c32-20261014. Настоящий Safari/PWA scroll и hardware проверяются владельцем отдельно; WebKit fixture не заменяет телефон.
