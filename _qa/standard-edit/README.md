# Standard card sheet regression

`regression.cjs` exercises all three approved cashiers with synthetic receipts.
Uses the existing `anikina-freeze/shift-harness.cjs`: all OMOTI business endpoints
are intercepted, service workers blocked, no real receipts, devices or bonuses.

Run with the bundled Node/Playwright runtime. Optional `QA_ENGINE=webkit`,
`QA_POINT=anikina|novogodnyaya|sovetskaya`, and the harness's allowlisted
`QA_PUBLIC_BASE=https://mishkapostnikov04-lgtm.github.io/omoti-kassa/`.

`shift.cjs` preserves the previous full-session regression with the former
"change composition/payment" navigation step removed: basket editing is now
immediately available in the standard dock. Mock financial contracts unchanged.

Old `card-edit-camera`, `sov-card-edit` and `post-sale-card` layout selectors target
the historical standalone editor; use this suite for the current interaction.
Browser WebKit is not a physical iPhone or an actual installed PWA.
