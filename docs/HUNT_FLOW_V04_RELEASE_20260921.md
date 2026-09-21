# Hunt Flow v0.4 — released 2026-09-21

Public entry: https://osakenpiro.github.io/shuryo-techo/fatalis-roadmap/flow.html?v=4

## User request and ground truth

Show exactly which quest osakenpiro should farm next, what materials are needed, when to stop, and current activity. Integrate existing equipment/material features, prepare future merging with the other three hunters, release and provide a friend update message.

Confirmed latest report: osakenpiro is farming with a Geology Jewel equipped. Exact quest, MR, current region/region level, exact inventory and final weapon stage remain unknown. Do not assume that this report proves current Guiding Lands farming. Existing reports retained: Frostfang materials available (quantity unknown); Anjanath fire switch axe created (final stage unknown).

## Changes

- New `fatalis-roadmap/flow.html`: responsive directed preparation flow, current-activity selection, Geology status, quest detail and stop criteria, equipment-book drawer, per-hunter flow state, copyable release message, snapshot sharing/import and same-exact-quest merge candidates.
- `fatalis-roadmap/app.js`: appended navigation-only IIFE updating the existing personal-record panel to point to the flow. Original code prefix preserved byte-for-byte. Root portal and golden/integration prototypes untouched.
- `fatalis-roadmap/osakenpiro.html` v0.3 remains unchanged and is embedded lazily by same-origin iframe. Its equipment, charm-stage, inventory and comparison features remain the input surface.

## Data boundaries

- Own store: `mh-hunt-flow:v1`, schema `mh-hunt-flow/v1`, keyed by explicit player ID (`osakenpiro`, `keuita`, `serket`, `zushi`). Records hold active activity ID, nullable Geology state, confirmed task-status map and update timestamp.
- Read-only legacy stores: `mh-osakenpiro-preparation:v1`, `mh-osakenpiro-compare:v1`, `mh-fatalis-roadmap:v1`.
- Equipment completion, armor-up flag, material quantities and MR feed the display. Inventory sufficiency never automatically means item crafted.
- Flow completion does not write equipment ownership, deduct materials, or advance the overall Fatalis progression pawns.
- Shared URL snapshots contain only the selected hunter's flow (no material inventory or MR). JSON export may contain all four. Import shows the change preview and replaces only the named players. Other players and legacy stores are preserved. Confirmation is required, old timestamps are flagged, undo is available.
- Merge preview only matches concrete shared quest/activity IDs. Generic `guiding`, `other`, `weapon`, `trial`, and unknown activities are excluded to avoid falsely equating region-level requirements or different quests.
- Local-first; not a live server, cloud synchronization, Discord bot, automatic quest completion detector, or automatic multiplayer matchmaking.

## Quest routing

Suggested baseline: optional missing normal Barioth head (`氷牙竜ベリオロス！`) and Ebony Odogaron legs (`森に兇爪あり`), plus only missing remaining armor. In parallel: armor spheres (`黒轟竜は傷つかない`), decorations (`鳴神上狼、荒事を成す`), weapon/charm check at smithy. Frostfang rerun (`終の白騎士`) only for shortages. Alatreon trial follows unlock and appropriate-element checks. Guiding augments and Safi farming are optional strengthening routes, not forced prerequisites.

Sources are linked in the page. The active Safi rotation was not established. Geology is not represented as increasing normal event completion rewards.

## Verification

- Published flow blob SHA: `b75db1c60d91e2265d3c224b1b90c108a666f948`.
- Patched app blob SHA: `b34ab31956022e5f0aa256471e5be0d9a207719b`.
- Local tested source matches both repository blobs.
- Local Chromium desktop1440 and mobile390 render inspected. 24 checks passed: unconfirmed initial quest, concrete next candidate, confirmation/cancel, state serialization, simulated reload, complete/undo, legacy completions and quantities, legacy non-mutation, inline-book target, exclusion of generic Guiding matches, concrete same-quest matching, import review, per-person replacement, invalid-input rejection, no JS errors, mobile overflow and selection, corrupt-state protection.
- IMPORTANT limitation: browser network navigation is blocked in the local runtime. Tests used `set_content` with a localStorage shim, not actual deployed reload or end-to-end iframe persistence. Real browser localStorage implementation and full hosted interactivity have not been independently end-to-end tested here.
- GitHub Pages workflow `35564155009`: completed/success for commit `d72058971ce64c34aadb021cb84ef5c7d6f0e64b`.
- TinyFish read-only public fetch confirmed the live flow title and rendered main-board navigation link to the flow.

Human visual acceptance remains open. The page is released for friend testing; no portal-wide Human PASS is implied.
