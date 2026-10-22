# Standard receipt editing · 22 October 2026

New and saved receipts use the existing C3.2 dock and card sheet. The standalone
top attachment button and full-screen correction editor are no longer mounted.
The existing correction coordinator owns financial edits and its durable keys.

For an ordinary saved receipt, card selection creates an explicit `editReceipt`
attachment intent. Redemption, accrual, net receipt and any basket/payment edits
are coordinated together. One original receipt is rewritten after the provider
confirms both records. Legacy r1 pending attachments remain metadata-only.

For an existing bonus receipt, the same card controls edit the chosen redemption;
the coordinator posts only the changes in bonuses. The approved wrong-card
transfer remains a separate financial operation preserving its original amounts:
the sheet explains that redemption can be changed after saving that transfer.

No service worker/cache/local storage clearing, automatic reload, PIN changes,
new pricing formulas or scanner changes. Optional reason is in the cart sheet.

Backend prerequisite: `cashier-standard-edit-20261022-r1`, migration
`20261022_03_cashier_standard_card_edit.sql`. Keep that coordinator/guard for
pending or completed attachment-edit operations, even when reverting the UI.

QA: `_qa/standard-edit`. Older editor-specific UI scripts are historical layouts.
Tests intercept all business API calls and block service workers. Real iPhone
camera/PWA use and a physical full shift are not claimed.
