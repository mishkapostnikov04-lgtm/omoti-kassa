# Аникина C3.2: безопасная проверка

Запускать bundled Node из Codex. Chrome path задаётся в scripts; Playwright/pngjs берутся из bundled runtime. Canonical repo: `omoti-kassa`, approved packages — соседний `design-system/modules/cashier-anikina`. C32 sealed working pack/evidence: `../_local_artifacts/cashier-anikina-c32-20261014`. Local preview8897 обслуживает repo и `/package/` из sealed C32 archive.

- `check-c32.mjs --code .`: обязательные C3.2 значения/отсутствие заменённых C3.1; без изменений исходного checker.
- `check-c32.mjs`:46 prototype metric states; три Итога проходят отдельный visual review, не входят в46.
- `qa-c32-live.mjs all` с `BASE_URL`: geometry, Chromium touch/scroll, motion/reduced. Strict C31 fixture owner, Service Worker blocked. Ни один private request не уходит в сеть; unknown fixture — FAIL. Изменены только Windows/dependency/path/runtime adapters, критерии не ослаблены.
- `capture-app.cjs`: все49 оригинальных C32 PNG и реальные native states. `QA_STAGE` задаёт immutable output. `BASE_URL` переключает локальную/опубликованную страницу. Демо-прототип читается только процессом QA для setup корзины; в кассу не переносится.
- `retained-c31.cjs`:34 retained states×360/390/430=102. Следует native handlers, синтетические данные, камера mocked. Для LC-10 ожидание исходной close operation обязательно до смены fixture режима, чтобы не получить ложное подтверждение сохранения. Физическую клавиатуру/камеру это не проверяет.
- `extended-regression.cjs`: protected programs/files, approved source exact, честные confirmed/queued/rejected исходы, stable touch ownership/deferred rebuild, все доки/safe areas/lastcounter, haptics/reduced, diagnostics, native month/alltime.
- `motion-frames.cjs`:8 native storyboard sequences/46 snapshots в точные offsets из frames.json; проверяет нужные target/duration/delay. Используется реальный owner checkout только с fixture. Для mouse-button release сначала завершается110ms press, затем снимок release transition; это не новая duration.
- `prototype-behavior.cjs`:14 behavior checks утверждённого прототипа без private network.
- `supplemental.cjs`: service/queue/mixed/mooncake/wrap/shortbonus/endjournal/unknownbonus/staff/top при360/430. Скролл именно `.k-list`, с проверкой достижения конца.
- `webkit-scroll.cjs`: Windows WebKit before/after touch ownership +20 programmatic scroll/update cycles. Не поддерживает mobile mouse.wheel/CDP; не заявляет физический iPhone PASS. `PLAYWRIGHT_BROWSERS_PATH` должен указывать task-local `browsers`.

Все output PNG/JSON и release checks сохраняются в task evidence вне deploy-repo. При source SHA изменении capture FAIL: такой run не принимать, переснимать изменённое на одной версии. Исторические неудачи сохранять отдельно. Финансовые реальные операции, enroll/register устройства на production, изменения БД и удаления ради QA запрещены.
