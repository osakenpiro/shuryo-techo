# Hunt Flow v0.6 — release / 2026-09-21

Public entry: https://osakenpiro.github.io/shuryo-techo/fatalis-roadmap/flow.html?v=6

## Shipped

- Current activity, next quest and preparation flow appear before expanded party reports. Compact report summaries remain visible; the exact chosen five-piece ice build, fire comparison and material book remain accessible.
- Selected-hunter sharing now uses `mh-hunt-flow/v2`, with flow records plus explicitly recorded departure attributes. Material quantities, MR and audio are not included. Old `mh-hunt-flow/v1` snapshots are still accepted.
- Import previews changes and updates only named hunters. Omitted completion fields are preserved. Shared quest adoption is a separate unchecked-by-default choice; it does not silently replace the local quest.
- Import checks for intervening local changes. Two-store writes attempt rollback on failure. Undo restores the imported flow and departure state but refuses to overwrite a subsequently edited departure memo.
- Changing current activity no longer converts an unknown Geology state to false.
- Focus handling avoids redrawing an active input or confirmation dialog. Hidden form controls use an explicit hidden CSS rule.
- `裏チシキ001` distinguishes Guiding Lands eligible shiny pickups from ordinary event rewards and the skill's normal gathering effects.
- Updated friend announcement copy. No messages were sent to friends.

## Scope and facts preserved

The user's chosen ice build is a crafting target, not an acquired or completed loadout. zushi's fire specialization and serket's reported Silver Rathalos longsword remain qualified reports. Exact serket weapon name is unconfirmed. keuita's loadout remains unknown.

Existing root portal, Golden/integration surfaces, `fatalis-roadmap/index.html`, `app.js`, and `osakenpiro.html` were not changed. Existing inventory and progression stores are not migrated or reset. No quest clear, MR, item ownership or actual play-session activity was invented. No cloud sync, recording, external ASR processing, or background worker was started.

## Release evidence

Release commit: `dd945d98b86d99c2a0643720b4c5d66fb6d2bd84`

GitHub Pages run `35567859185`: completed / success at 2026-09-21 06:19:16Z.

Locally tested files exactly match repository blob hashes:

| File | Blob SHA |
|---|---|
| fatalis-roadmap/flow.html | 977a8a0bbbe36cb6a2992c474d86a67776a204f9 |
| fatalis-roadmap/flow.css | 09224df7f64ef672b44d867d32bbdec22223539a |
| fatalis-roadmap/flow-core.js | d6de9842727230e9340fe5cda1d55a8a67abc96a |
| fatalis-roadmap/party-records-v06.js | 40b987dc24018e5f69a2db805aecfabe9e865650 |

31 local Chromium checks passed, with zero page JavaScript errors in those tests: rendering; responsive layout; exact ice target; mismatch warning; state preservation; old-link compatibility; selected-person sharing; review/cancel; partial merge; optional quest adoption; rollback; concurrent-change rejection; undo; and unknown-state preservation.

**Verification limit:** these interaction checks used `set_content` and a localStorage shim because runtime HTTP navigation is blocked. They do not prove live-origin refresh, the native browser storage implementation, or deployed iframe end-to-end operation. Test inventory/MR values were synthetic fixtures, not user progress. GitHub Pages deployment success is separately verified; live public browser interaction remains unverified. No paid external-browser retry or payment was made.

## Parallel catch-up / compatibility

Read existing orchestration #326 and MH-VOICE #374. #326 comment 5754860280 reports receipt by the existing Codex successor, not completed transcription. This release does not duplicate that work.

`fatalis-roadmap/app.js` and the reviewed progress-proposal adapter `mh-fatalis-proposal/v1` remain unchanged. The new `mh-hunt-flow/v2` format is for manual sharing, not an ASR adapter and not permission to publish private source speech. Equipment, activity, progression, departure choice and dictionary candidates remain different relations.

No new project issue or portal-wide Human PASS is implied.
