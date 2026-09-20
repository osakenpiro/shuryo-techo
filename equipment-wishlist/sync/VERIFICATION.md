# Verification / production gate

2026-09-20. Main work record: osakenpiro/shuryo-techo#3.

## Confirmed

CI run 35511148239 at commit a753e3754960a0fb9374ec380d4a105d2ec0de8d passed the 8 core tests and 11 Firestore-emulator integration/security tests. This includes two independent SDK clients, owner/friend/outsider permissions, shared agenda edits, role-escalation denial, revocation, duplicate migration prevention, and stale concurrent saves.

The first run 35510994093 failed the concurrent conflict classification test (10/11 emulator tests passed). A losing write was denied by the revision rule rather than surfaced as the custom conflict type. The fix performs an authorized fresh server read to distinguish a changed revision, while preserving the original error if read permission is gone or network unavailable. It does not retry the stale write or relax the security rules. The corrected test subsequently passed.

Browser-gate tests are included in CI: config-null means disabled login, hidden private UI, no SDK requests or local-state writes, and no horizontal overflow at 320/390/768/1440 px. Their latest result is recorded on Issue #3; inclusion of a test here is not itself a passing result.

## Not established

- No production Firebase project has been chosen or configured.
- No real Google login or four-user membership registration has been completed by this release.
- No production two-device synchronization or production security audit is claimed.
- No actual browser-local user inventory has been uploaded.
- A separate local Chromium navigation attempt was blocked by the environment administrator policy; the policy was not altered. Emulator CI runs and browser CI results are separate evidence from that attempt.

The frontend deliberately remains gated through config.mjs=null. Setup and production two-device verification must complete before changing the user-facing state to ACTIVE.
