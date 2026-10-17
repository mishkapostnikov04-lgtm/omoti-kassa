# Cashier state audit — 16 October 2026

## 17 October follow-up: preserve newer restock input

`restock-draft.cjs` adds ten groups per point for acknowledgement ownership: a
lost-reply retry must keep its exact original payload while retaining any active
new exact-quantity draft, including zero, empty/invalid input, leading zeroes and
the upper bound. It also covers reload followed by a separate new submission,
qualitative 6+, a newer committed value, other flavors/supplies and another lost
reply. It uses `shift-harness.cjs`, supports `QA_PUBLIC_BASE`/`QA_OUTPUT`, and never
falls back to production business APIs. Run `node _qa/anikina-freeze/restock-draft.cjs`.
Only matching acknowledged committed facts and their inactive matching saved
drafts may be cleared; an open editor owns its draft until explicit Done.

Local branch: `fix/cashier-state-audit-20261016`. Baseline: `4f2294a8d76dc0eeb2cf4824ed0b0ba2889baaed`.

The initial audit was held locally. The owner subsequently authorized deployment of all three cashiers on 16 October, including immediate publication of the points during opening hours. Publish sequentially: Anikina, verify, Novogodnyaya, verify, Sovetskaya, verify. Never force a client reload or clear client data. No production receipts, wallet operations, device enrollment or restock requests may be created for QA.

## Findings and ownership

1. A native loyalty lock temporarily set `disabled=true`; the C3.2 saving barrier captured that temporary value and restored it after native completion. Presentation now owns its own per-control `inert` barrier. Native purchase/correction owners retain `disabled` and their durable pending identities. Completion does not force-enable the whole form.
2. A delayed card response could overwrite an explicitly selected service payment. Changing to a non-loyalty operation clears only an uncommitted card flow; revision checks reject its late response. Closing the card panel stops an unfinished lookup while retaining its number for retry. Editing the number invalidates both old lookup and quote.
3. Recovery accepted only `.is-selected`, blocking first-purchase `.is-unconfirmed` cards. Both require a fresh explicit lookup and are accepted by the recovery gate. The gate then releases its own choice requirement. Explicit “continue without card” clears a nonfinancial candidate; it cannot discard a pending purchase/correction.
4. Read-only card/quote transport now accepts an optional AbortSignal and uses two 12-second attempts plus the existing 600ms pause. A cancelled read is not retried. Shared device authentication has its own existing budget. Checkout/status/cancel keep one 30-second attempt and ignore read cancellation. No financial payload/identity rules change.
5. The bonus correction preview intercepted flavor tiles on all three cashiers. The actual scroll viewport now ends above the measured preview instead of extending behind it. The underlying palette, cards, CSS and financial handlers are unchanged.
6. On point cashiers, a restock redraw could enable Submit during an outstanding request; there was no single-flight guard. A pending request is now saved before dispatch and reused exactly after lost replies/reload. The existing server fingerprint uses its original data/time for idempotency. New marks are not cleared when an older request is acknowledged. Only definite 400/422 rejections release the rejected local submission; ambiguous replies keep it for safe retry.
7. Old stock reads could overwrite newer stock. A generation guard now rejects stale replies. Read errors have an explicit retry that retains selected facts. Transient local storage failure sends nothing and permits another attempt; corrupt saved submissions remain protected rather than silently discarded.

Boot owns the application-wide loading/error `inert` state. Modal sheets own their own `inert`/`aria-hidden`; closing an unfinished confirmation resolves it as cancelled. Native PIN state remains exclusive to the existing Soviet cashier handlers. Lifecycle checks validate the loaded UI, do not reinitialize it, and never replay an unknown financial result as a new sale.

## Scope

Seven runtime files: the three cashier HTML files, `anikina-c31/interface.js`, `points-ui/points-interface.js`, `anikina-loyalty-v1.js`, and `cashier-loyalty-connection-v1.js`.

New local pending keys: `omoti_novogodnyaya_restock_submission_pending_v1` and `omoti_sovetskaya_restock_submission_pending_v1`. They hold one original restock submission per point until acknowledged. No card/PIN is added to a boot draft. Existing queue, receipt, device, employee and financial pending keys are preserved.

No backend/API contract, database, monetary formula, tariff, configured PIN, stylesheet, font, worker or notification changes. Protected receipt/correction coordinators and purchase/status/cancel functions are checked against the baseline. No automatic `skipWaiting`, cache cleanup or reload of an active cashier.

Sequential rollout uses immutable copies under `releases/20261016-state-r3/`. The four original JS addresses remain byte-for-byte baseline compatible with older HTML and cashiers not yet switched. Each HTML is published in its own stage with the assets it selects; there are 45 exact SRI entries across all three. New release copies are exactly the audited fix bytes, with no added runtime changes. Tests follow actual manifest addresses rather than assuming original root filenames. Never clear application storage to accelerate an update.

## Checks

Use the existing bundled Node/Playwright and installed Chrome. Business responses are synthetic; routing has no production business fallback. `shift-harness.cjs` serves static files locally and handles every business request in memory.

```text
node _qa/anikina-freeze/scope.cjs
node _qa/anikina-freeze/scope.cjs --index
node _qa/anikina-freeze/transport.cjs
node _qa/anikina-freeze/regression.cjs
node _qa/anikina-freeze/shift.cjs
node _qa/anikina-freeze/restock.cjs
node _qa/anikina-freeze/startup.cjs
node _qa/points/functional.cjs
node _qa/points/startup.cjs
node _qa/points/recovery.cjs
node _qa/points/financial.cjs
```

- `regression`: ten focused Anikina groups, including three consecutive bonus→defect→next-card cycles, rejected and unknown purchases, first-card recovery, late reads and the separate UI barrier.
- `shift`: nine groups per cashier. Complete uninterrupted fast/slow shift; ordinary edit; first-card mixed payment; self paid/unpaid; refund by transfer; bonus edit cancellation/confirmation; next sale; newer-card race; network retry; unknown result across resume/reload; explicit recovery without a card.
- `restock`: five groups per point, including the previously reproduced duplicate, lost acknowledgement with exact-payload retry, preserving new marks after reload, stale stock responses, read retry and local storage failure.
- `transport`: virtual-time deadlines/cancellation. Does not mistake a fake clock for real provider latency.
- `startup`: sixteen Anikina resource-integrity/retry/lifecycle groups. Existing point startup suite covers 54 groups; recovery adds six. Existing point functional suite includes native Soviet PIN, all payment modes, seller reset, ordinary/bonus edit, offline queue and touch ownership. It does not export PIN values.
- `scope`: 42 exact protected functions, existing API/storage/config constants, exact receipt/correction coordinator, 45 SRI entries, unchanged styles/fonts/workers. Historical design byte-equality guards are not silently rewritten to accept the new logic.

Evidence is outside the deployment tree in `../evidence/` and `../_local_artifacts/`. Before-geometry failed hit-test results are retained. Early failed tests caused by dispatching a synthetic click on Document instead of an Element were corrected in the test fixture, not treated as a production defect.

## Publication and acceptance

On 16 October the public HTML of all three cashiers matched baseline main and already contained C3.2. A separate remote `points-c32-ui` branch was not present; the older “not published” sentence in `_qa/points/README.md` describes a historical preparation stage. This audit used the exact available C3.2 source; no unavailable home-computer working files were assumed current.

Before publication, re-fetch main and reconcile later work rather than replacing it with this snapshot. Authorization is recorded above. Verify each published HTML and its exact assets, then run fixture-only browser acceptance against the public URL before proceeding. Roll back the affected HTML to its previous commit on a critical acceptance failure; original JS remains available. Do not restore a database or clear pending identities for rollback.

Actual iPhone installed-PWA acceptance remains: keyboard/safe areas and touch reachability during bonus editing, long background suspension/OS process termination, real camera scanning, real device/network conditions and provider responses, and safe update of an already installed older shell. Synthetic Chromium lifecycle events are not a physical iPhone test. No real provider purchase was executed by this audit.
