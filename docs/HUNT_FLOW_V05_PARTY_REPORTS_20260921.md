# Hunt Flow v0.5 / Party equipment reports

Entry: https://osakenpiro.github.io/shuryo-techo/fatalis-roadmap/flow.html?v=5
Date: 2026-09-21

## Reported facts versus inference

- osakenpiro: the five-piece ice build in the user's screenshot is now the chosen crafting target (Barioth head alpha, Kirin chest alpha, Kaiser arms beta, Kirin waist beta, Death Garon legs alpha; Frostfang switch axe and Frost Charm III). This is a selected plan, not confirmed completed gear. Fire comparison remains available.
- zushi: user reports fire specialization. Do not infer a weapon name, exact armor, decorations or completion status from that report.
- serket: user wording `ギンかりゅうたちつくれたらしい`. Display a reported Silver Rathalos longsword creation, preserving the original wording and hearsay qualifier. `飛竜刀【銀】` is a candidate interpretation, not a confirmed owned item. No MR/augment/Fatalis clear inference.
- keuita: no new equipment report.

## Implementation

- New `fatalis-roadmap/party-records.js`, blob `1596f1048e1b4718a67e17bb59bc37b757e51218`, contains the dated reports and an additive UI.
- Existing `fatalis-roadmap/flow.html`: ten source lines replaced (Git diff: +10 / -10), including script loading, v0.5 text, ice-specific crafting target and completion lookup, and updated copyable friend announcement.
- Existing activity, progress, merge, shared snapshots and equipment/material-book facilities remain.
- New store `mh-party-departure:v1` is strictly separate. All four actual departure attributes default to unknown: a specialization report is not automatically an equipped item.
- Quest-dependent fire/ice warnings do not declare a mixed team impossible or sufficient. Fire damage does not contribute to suppression during fire-active phase; physical damage and dragon-active phase are distinct.
- The new departure memo is not included in v0.4 flow snapshots; this limitation is displayed.
- No existing inventory, player progression, rank, quest selection or craft-completion data are rewritten by the party module. The embedded equipment book receives a display annotation of the chosen ice target only.
- Old explicit flow completion checks are retained. A previous weapon check may need user review if it referred to the fire comparison rather than the new ice target.

## Verification

- Module `node --check`: success.
- 17 local component checks passed: report display, unknown actual attributes, mismatches, legacy-store non-mutation, isolated new storage, simulated remount persistence, exact five armor rows, mobile overflow, no JS errors, corrupt-state protection.
- Tests used local Chromium with `set_content` and a localStorage shim because navigation was blocked. They do NOT establish real-origin reload, the full hosted flow, or end-to-end iframe persistence.
- Local tested module bytes match repository blob SHA exactly.
- GitHub Pages run `35566449776` for integration commit `5a79cba4d5ecc50ef66bcffa122169dc86387203`: completed/success, 2026-09-21 05:57:33Z.
- Public TinyFish content retrieval returned page metadata but did not expose dynamic selectors; dynamic public rendering was not independently verified.
- One external live-browser verification attempt did not start due to TinyFish wallet balance. No retry, charge, or public interaction was performed. Human visual review remains pending.

## Reference sources

- Candidate Silver Rathalos longsword: https://game8.jp/mhw/292274
- Alatreon active-state and suppression distinctions: https://gamewith.jp/mhw/192225

No root portal/Golden promotion or four-player hunt completion is implied by this release.
