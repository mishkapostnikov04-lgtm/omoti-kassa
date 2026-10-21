# Три кассы: редактор карты и общая камера

Текущий baseline9a6efc7. Разрешение владельца21.10 распространяет редактор/полные номера/необязательную причину/recovery на все3кассы, scanner Аникиной на обе точки.

`node _qa/card-edit-camera/scope-check.cjs`:54SRI, native/PIN/платёжные handlers,3/4вкладки и неизменность decoder Аникиной.
`QA_POINT=anikina|novogodnyaya|sovetskaya node _qa/card-edit-camera/frontend-regression.cjs`:7focused сценариев каждой точки.
С тем же QA_POINT запускать recovery-startup.cjs:4обрыва обязательных assets+2retained сценария.
`node _qa/card-edit-camera/scanner.cjs`:53синтетических кадра+1video flow на каждой точке.
`node _qa/card-edit-camera/camera-correction.cjs`:по1camera transfer/cancel flow каждой точки.

PowerShell: `$env:QA_POINT='anikina'` перед вызовом node. `QA_PUBLIC_BASE=https://mishkapostnikov04-lgtm.github.io/omoti-kassa/` включает опубликованные статические ресурсы. Все business/provider запросы подменены, SW blocked, настоящие продажи/бонусы/удаления/заявки запрещены. PIN не экспортируется. Доказательства сохраняются в существующую task artifact папку. Physical iPhone/Safari/PWA не проверяется этими тестами. Прежний _qa/sov-card-edit — исторический Sov-only release, не текущий scope check всех3.
