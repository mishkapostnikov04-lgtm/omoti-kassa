# Cashier recovery — 20 October 2026

Based on GitHub main cf4cb53. Anikina, Novogodnyaya and Sovetskaya retain their own layouts, tariffs, payout/PIN logic and restock behavior.

- Card panel always has visible Close and Done controls. Modal scrim covers the payment dock; background clicks dismiss only. Native financial disabled states are unchanged.
- Draft schema/key remain compatible. Only entered card number and redemption input are added; balance and quote are never restored from storage. Card reads are repeated after reload; no checkout is sent automatically.
- Discard draft is available in the receipt panel and recovery banner, with confirmation. It preserves finalized checks, queues, pending financial identities and point restock drafts. It refuses to discard while financial state is unresolved or storage cannot verify the change.
- A failed card/quote read is visible on the main cashier screen with an explicit retry. The checkout button no longer claims calculation is still running after a terminal read error.

Acceptance: 30 recovery scenarios in Chromium and 30 in Windows WebKit; 27 sequential shift scenarios; 30 restock scenarios including newer exact drafts; 14 financial parity cases; 20 point functional cases including PIN; 6 transport cases; 21 startup/integrity/legacy draft cases. All use mocked business APIs and block service workers. Static checks protect 44 native/financial handlers, existing API/storage constants, immutable releases, CSS/fonts/workers, and 48 resource seals. Real iPhone/PWA and a real employee shift are not covered by browser emulation.

Publish each HTML entrypoint separately and verify its public resources and browser flow before the next. Existing resource URLs are unchanged. Never force-reload active cashiers or clear local data. Rollback restores only the affected HTML from the previous commit; retain immutable assets for cached pages.
