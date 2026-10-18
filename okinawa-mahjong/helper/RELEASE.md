# 麻雀の手引き v1.0.1 / 2026-10-19 JST

URL: https://osakenpiro.github.io/shuryo-techo/okinawa-mahjong/helper/
Owning task: claude-shared #402, parent #401. Existing public audience preserved.

## Scope
Existing yaku/core preserved byte for byte. Installable PWA, complete 15-URL shell, update-on-request, local QR/link sharing, 34 tile faces with readings, concise beginner basics. Existing #home/#yaku/#score/#fu/#rules deep links retained; #basics added. Same origin and path retained. No messages/invitations sent. No records/analytics/server sync added.

## Reference transfer
- Original 85/100 rating: #415 c5840214508. Current original helper visually inspected before editing. Preserved quiet green/cream, two primary actions, mobile controls, progressive disclosure. The old score is not a score for this revision.
- INOU Miura v1.0.2: #479 c6248773641; actual fixed URL inspected. Transferred stable URL, complete shell, single-purpose menus. Did not copy travel data, map/GPS, blue palette, or unverified iPhone claims.
- M5: each tile is both the recognizable illustrated object and its name/reading selection control. Specific selected-state feedback, accessible labels, keyboard-native buttons. Rendering: self-contained original SVG; no font-dependent mahjong Unicode.

## Verification
- 241 existing score/fu/yaku checks PASS; 6 new tile/manifest/service-worker checks PASS. Existing core/yaku not edited.
- SW test: 15 shell URLs cached before ready, offline root/index/calculator requests use the cache, failure retains old cache, readiness false on incomplete cache, unrelated apps untouched, activation waits for explicit message. Node VM with synthetic network/cache; distinct from real phone airplane-mode test.
- Live browser: Japanese kana yaku search; all four tile families, 9萬/9筒/7索/白 readings and variants; child/dealer 1han30fu ron=1000/1500, tsumo=300/500 and500-all; copy-link readback equals canonical URL; dialog QR and iPhone/Android instructions.
- Live browser shell preparation status confirmed after the controller verified cache completeness.
- Live iframe viewport QA: nominal390 and320 widths, actual content375 and305 due scrollbar; 320 fixture also20px/125% root text. Home, yaku, score, basics and share: document width equals viewport; share inner width equals scrollWidth; close action visible. Representative tile reading remains above fixed nav. These are Chromium viewports, not iPhone hardware.
- Revision1.0.1: keep “34種類” together under enlarged type. Temporary review fixture removed from final source.

## Remaining limits
Actual iPhone Safari/home-screen installation, standalone restart, airplane mode not directly observed. External practice/source links require network. Flower bonus and yakitori settlement are house rules outside standard score calculations. No automatic full-hand/yaku/furiten recognition.

## Receipt
ordinary harness resolver PASS; complete receipt-level self report, not provider-wide validation. Registry/roster0.5.4; no durable role claimed or worker launched. ECOSYSTEM_CONTEXT_DRIFT between Shared views v0.6/v0.8; exact #402/#479 latest evidence took precedence. No global registry/roster/Orb status change.
