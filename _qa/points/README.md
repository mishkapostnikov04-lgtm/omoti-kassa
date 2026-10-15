# Новогодняя / Советская · C3.2 · локальные проверки

Ветка `points-c32-ui`, immutable baseline `04ab7e92b98ce0e437ebb545b2c2f8dc902288af`, локальный тег `pre-points-c32`. Ветка и тег **не опубликованы**. Никаких merge / push / deploy без нового разрешения владельца.

Дизайнерские 15 файлов `points-ui/` совпадают с финальным пакетом Claude (хеши в `approved-source.json`). Порядок шести CSS перед native inline CSS существенен: иначе `.k-kassa` перекрывает скрытие неактивного экрана. Контроль активного экрана входит в визуальную проверку. Общие JS/CSS, Аникина и финансовые программы сохранены. Два старых QA immutable-списка теперь проверяют разрешённые изменения точек более строгим `static.cjs`; остальные assertions прежние.

## Изоляция

`fixtures.js` и `guard.js` — искусственные данные и закрытый транспорт **только QA**, не часть рабочего приложения. Каждый business fetch отвечает в памяти; native fetch используется только для static localhost. Другие transport запрещены; Service Worker / камера / beacon отключены. Browser routing обрывает внешние URL, в том числе отдельно распознанную инъекцию локального Kaspersky. Неизвестный app URL / fixture — ошибка. Никаких production API fallback и настоящих продаж, регистраций, бонусов, удалений или подтоварок.

Настоящий PIN не хранится в QA или документах. Функциональный тест вводит его из существующей native-константы внутри браузера, не возвращая значение в Node, логи или файлы. В визуальном режиме дополнительная кнопка DEMO существует только в тестовом init script для сопоставимости с PNG Claude. В native PIN-тесте она отсутствует. Финансовый baseline читается из Git в памяти и обслуживается только после удаления PIN; открытие его Итогов — явный fixture bypass.

## Запуск

Использовать bundled Node с Playwright рядом с runtime (или настроить его путь в `harness.cjs`), установленный Chrome. Все команды из корня repo:

```text
node _qa/points/static.cjs
node _qa/points/static.cjs --index
node _qa/points/functional.cjs
node _qa/points/startup.cjs
node _qa/points/recovery.cjs
node _qa/points/financial.cjs
node _qa/points/geometry.cjs
node _qa/points/worker.cjs
node _qa/points/cache.cjs
```

`POINTS_BROWSER=webkit` включает Windows WebKit для functional/startup; путь к уже установленному task runtime указан в начале scripts. Это **не Safari на настоящем iPhone**. Startup проверяет 15 оборванных ресурсов, пять несовместимых JS/CSS, исключение, lifecycle, safe retry, сохранение корзины/смешанной оплаты/заявки, pending/сотрудников и выключенный JS — 26 сценариев на точку. Functional — 10 сценариев на точку, включая настоящий PIN, восемь оплат, edit/bonus/pending/offline queue, ошибку/повтор Итогов, 30 taps и сохранность touch target.

`worker.cjs` использует отдельный локальный origin без бизнес-приложения: unit scope/push + реальный Chromium worker good/legacy/offline/online/storage. `cache.cjs` работает без Playwright routing, с настоящим HTTP cache и CSP self; бизнес-запросы отвечаются только замкнутой fixture. Наличие снимков не означает пиксельной идентичности исходным PNG другого renderer.

Для исходных 22 checks: запустить `node _qa/points/harness.cjs 8910`, затем `PLAYWRIGHT_MODULE=<module>` и `PREVIEW_BASE_URL=http://127.0.0.1:8910` для `node _qa/points/approved-qa.cjs`. Этот сервер обслуживает реальные исходники: безопасную подмену сети устанавливает именно тестовый browser context. Не открывать его как ручную рабочую кассу. Изменены только пути/платформа/закрытый fixture transport; критерии не ослаблены. Bootstrap layout test отдельно считает единственный рисуемый экран.

Для визуальных сценариев разместить неизменённый архив в `../_local_artifacts/cashier-points-c32-integration-20261015/input/omoti-points-c32-handoff-20261015`. `node _qa/points/visual.cjs` снимает 59 состояний × 360/390/430 = 177. `ORACLE=1` снимает те же состояния с реальных очищенных HTML Claude в том же браузере (59 исходных размеров), `SCREENS` выбирает повтор конкретных кадров, `RESUME=1` продолжает прерванный run. Эталоны не перезаписывать. Выход — task artifacts, кроме исходного `RESULTS-points-c32.json` в этой папке (игнорируется).

## Технический запуск, отдельно от дизайна

Supervisor `points-boot-20261015-r1` встроен в head обеих HTML до ресурсов. 15 JS/CSS с SHA384 SRI на каждую кассу; native loyalty acknowledgements, C31UI, шесть Итогов и перенесённая карта обязательны. До ready приложение inert, невидимо и ввод перехватывается; входы closeCheck / submitRestock защищены. Exception / timeout / lifecycle corruption — диагностируемая ошибка без рабочей старой формы. Retry сохраняет отдельный draft, запрещён во время write, проверяет **свежий HTML manifest** и его same-origin SRI assets через cache:reload. Нет очистки localStorage/PWA/очереди.

Новые данные только `omoti_<point>_boot_draft_v1` и session `omoti_<point>_boot_diag_v1`. Draft содержит корзину, сотрудника, оплату, comment/edit/mixed и несохранённые отметки подтоварки; **без номера карты и PIN**. Требуется повторно выбрать карту или явно подтвердить продолжение без неё; pending/bonus-edit не переигрываются как новая продажа. Прежняя очередь и бонусные модули остаются владельцами своих операций. Диагностика — версия/этап/ресурс/исключение, без содержимого чека.

`omoti_cashier-sw.js` обслуживает только навигацию двух точек в своей папке, требует HTML с supervisor, network-only/no-store, иначе безопасная 503. Push сохранён, окно с retry-query фокусируется по pathname. Нет skipWaiting / clients.claim / Cache Storage / принудительной перезагрузки. Регистрация worker остаётся прежней (настройка уведомлений); старые открытые документы/worker не обновляются задним числом. Полностью загруженная касса сохраняет прежнюю offline queue; холодный запуск без связи блокируется безопасно.

Будущая публикация требует отдельного разрешения, свежей сверки main/Pages, backup и postflight. Откат нельзя делать слепой заменой HTML на старый без supervisor под новым активным worker: он корректно отклонит его. Нужен согласованный комплект и проверка естественной смены worker. Сейчас публикаций 0.
