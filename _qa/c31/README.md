# C3.1 regression

Run `node _qa/c31/regression.cjs`. Requires Playwright and Chrome. Set `OMOTI_PLAYWRIGHT_MODULE` to its installed module path if it is not bundled beside Node; `OMOTI_CHROME_EXE` overrides the Chrome executable.

Only synthetic data. Every request to `orders.omoti.ru` is fixture-owned, Service Worker blocked. Unexpected endpoints fail. No live sale, deletion, bonus, registration or device approval is permitted. The output does not prove real financial transactions or iPhone camera/keyboard behaviour.

Contract records the pre-C3.1 DOM IDs and protected asset SHA, not client data. Functional groups include quantity/undo, device seller selection, eight prices/payments, mixed net, bonus cap, QR, lost response/recovery, local search, deletion guards, isolated confirmation, totals, gross/due and saving locks. Diagnostic JSON/PNG are local test outputs; do not publish them.
