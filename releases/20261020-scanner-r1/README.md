# CODE128 scanner improvement — 20 October 2026

Based on GitHub main 2e6d5a6. Only the scanner part of the shared loyalty module changes. Earlier recovery/modal fixes remain byte-identical.

Search upright and vertical CODE128 symbols at modest tilt angles (0, ±12, ±24 degrees), with additional grayscale thresholds. Keep native detail, process one mode per fresh video frame, and immediately reuse the successful mode for the second matching read. ZXing checksum validation and the two-read confirmation remain required. No camera/lens assumptions, new library, API, financial handler or payment retry changes.

Paired synthetic benchmark: 17/30 baseline vs 28/30 candidate, no wrong numbers, all baseline successes retained. Broader acceptance uses 48 valid codes at several angles plus 5 invalid/blank frames per point/engine, in Chromium and Windows WebKit; Chromium also uses a canvas camera stream to verify confirmation, exactly one card read, no financial requests, dialog closure and track cleanup. These fixtures do not replace testing a physical iPhone 13 Pro filming another phone screen. Very small, blurred, occluded or strongly tilted symbols may still require repositioning.

Publish three entrypoints sequentially with public resource and browser verification after each. Never replace previous immutable releases, force-reload cashiers, or clear their data. Rollback changes only the affected HTML to its prior commit and keeps release assets available for cached pages.
