# Аникина · контролируемый запуск

Версия anikina-boot-20261015-r1. Это исправление запуска C3.2, оформление и бизнес-owners прежние. HTML является owner раннего supervisor (id anikina-boot-controller); interface.js имеет preflight, финальное acknowledgement и карантин для ранее закешированного HTML без supervisor. SW меняет только navigation Аникиной; push owner прежний, query-bearing окно фокусируется по pathname.

До ready: app inert/невидим, input события и оба входа closeCheck защищены. Ready: 13 JS/CSS успешно загружены с SHA384 SRI, native loyalty flags и обязательные API объектов готовы, C31UI завершён, карта в своей панели и пять разделов Итогов существуют. Ошибка/timeout/исключение/resume corruption сохраняют диагностику и блокируют продажи; модальные окна закрываются, незавершённое UI-подтверждение отменяется прежним владельцем без отправки.

Повтор только явно пользователем: сохранение формы → проверка отсутствия выполняемого write → static fetch cache:reload с integrity всех 13 ресурсов → повторная проверка/сохранение → новый URL HTML. Хранилища не очищаются. Черновик omoti_anikina_boot_draft_v1 не содержит номера карты. Требование выбрать карту заново блокирует молчаливую обычную продажу. Pending/bonus-edit snapshot остаётся читаемым, автоматически не переигрывается; завершение и статус принадлежат прежним pending keys/queue/modules.

SW network-only/no-store navigation отклоняет негодный/старый HTML до исполнения. Нет Cache Storage, skipWaiting, claim или принудительного reload активной кассы. Поэтому уже открытый старый документ и существующий старый worker обновляются лишь при обычном безопасном закрытии/новом открытии. Не очищать данные PWA для ускорения обновления.

Проверки (bundled Node, Chrome/Windows WebKit):

- node _qa/boot/check-seal.cjs --index — SRI по реальным staged bytes (учёт Windows CRLF/Git clean).
- node _qa/boot/startup.cjs — BASE_URL и QA_STAGE задают source и отдельный output; BOOT_BROWSER=webkit использует сохранённый task-local runtime. Полный перечень normal/fault/recovery/storage/legacy случаев в коде.
- node _qa/boot/http-cache.cjs — без browser routing, настоящий native HTTP cache, намеренно несовместимый cached itogi; API перехвачен только в JS замкнутыми фикстурами без fallback. Перед retry SRI блокирует файл, cache:reload заменяет его, правильный UI восстанавливается.
- node _qa/boot/service-worker.cjs — unit scope/response/no-store/focus и настоящий локальный worker при good/legacy/offline/retry; бизнес-приложения/внешних API в этом стенде нет.
- Прежний full regression и finance/capture/motion проходят отдельно. Идентичность money/native contracts допускает только точные startup guard/diagnostic/ack additions, а не изменение формул. Из прежнего immutable protected-list выведен только явно изменённый данной задачей SW; его контракт проверяется новым тестом. Остальные прежние checks сохранены.

Все business calls в browser QA отвечаются H.context fixtures, Service Worker blocked. Исключение worker-test — отдельный полностью локальный server/profile без бизнес-JS. Реальные продажи/loyalty/delete/register запрещены. Диагностика omoti_anikina_boot_diag_v1 только sessionStorage: stage/resource/build/exception line/name/sanitized message; нет cart/card/token/employee payload.

Windows WebKit и синтетические pageshow/visibility события не заменяют установленный iPhone PWA. Факт, что именно сорвалось на устройстве владельца, без его новой диагностики не установлен. Не называть Safari cache доказанной первопричиной.