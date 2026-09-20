# 装備づくりの依頼帳 / MHW:I

Independent functional v0.1. Created 2026-09-20 from the user's request for an actual parchment-style page: wanted equipment → missing materials → next hunt → today's order.

- Page: https://osakenpiro.github.io/shuryo-techo/equipment-wishlist/
- Osada entry: `?hunter=osakenpiro` (`osada` accepted as an alias)
- All hunters: `?hunter=all`
- Record owner: osakenpiro/shuryo-techo#3
- Portal integration owner: osakenpiro/claude-shared#326
- This directory is the entire implementation scope. Root index, portal-data, hunting-notebook, portal-preview and other workers' files were not modified by this task.
- Linking the independent page is distinct from approval/merge of the portal redesign. Portal-root inbound link remains an integration task.

## Files and operation

`index.html`, `style.css`, `data.js`, `app.js`. No framework, build, account, API, analytics, external font or server-side persistence. Serve these four files together over HTTP(S). Run `node --check app.js` and `node --check data.js` for syntax checks.

Desktop: request ledger and two planning notes side by side. Mobile: switch between requests and today's plan. Add a hunter, choose a template or write a request, enter owned materials, choose targets, and reorder today's list with up/down buttons. Completion of a hunt and completion of equipment are separate actions.

## Inventory and plans

- Inventory is shared across requests belonging to one hunter, never across people.
- Unknown quantities are null, not zero. Osada's four Lightbreak Axe materials and money are the only seeded observed inventory, from the supplied 2026-09-20 screenshot.
- The screenshot states craft cost 80,000z, money 20,218z; displayed shortfall is 59,782z. Its direct observation takes precedence over the external DB's different price.
- Material summary adds every incomplete request's requirement before subtracting inventory once. Each expanded request also shows that individual recipe's requirement.
- Completing equipment does not automatically consume stock or zenny. Update the game inventory manually after crafting.
- Candidate order is priority, known shortages, then number of related requests. This is a transparent consultation heuristic, not an optimal route or automatic quest-unlock check.
- Re-adding the same target updates a plan only when the set of hunters is the same. Another hunter's existing target is preserved. Use the all-hunters view to add a combined target; independently added routes can remain separate.
- Plan notes are snapshots. Use the target's update action to refresh them after inventory changes.

## Initial data / sources

11 templates: Lightbreak Axe, four elemental bows, Mighty Bow Jewel, Power Prolonger armor, greatsword build, mantles, armor spheres, Tool Specialist.

The bows list only the final upgrade step, with a separate base-weapon confirmation. Edelescha uses its upgrade route, not the direct-production recipe. Full tree costs are not implied.

User-provided videos: `019IDVQJDRw` is bow equipment; `pR-eVGPCmQw` is greatsword equipment; `yuFl3NW4wTw` is switch-axe gameplay/how-to. Video categories were checked; full video builds have not been transcribed. Unknown sets and mantle unlock details remain consultation requests, not fabricated completed builds.

Equipment recipe/source URLs are stored per template in data.js and exposed in each request. The DB is unofficial. Power Prolonger armor parts are candidates, not an endorsed complete set. Initial stock is a historical screenshot observation, not a live game connection.

## Storage / handoff contract

- localStorage key: `mhwi-equipment-requests-v1`; state schema version 1.
- Share format: `mhwi-request-v1`; backup format: `mhwi-book-backup-v1`.
- Share is a selected-hunter snapshot in a URL fragment or JSON. It is readable by anyone with the link, not encrypted, not authenticated, and not real-time synchronized.
- Individual sharing excludes other hunters and mixed-hunter plan entries. Full backup explicitly includes all local hunters after confirmation.
- Import displays a confirmation first, then appends a new copy. Existing requests and stock are never silently replaced.
- User text is escaped; imported URLs are limited to HTTP(S); file/input sizes and numeric values are checked. Storage errors and cross-tab conflicts are surfaced rather than reported as successful saves.

## Acceptance checks (2026-09-20)

PASS: initial 11 requests; screenshot shortages/money; request creation; hunter isolation; same-target plans preserve both hunters; per-hunter shared inventory aggregation; route add/reorder; selected-hunter-only share packet; import has no effect before confirmation; accepted import preserves original; mobile page switching; no document horizontal overflow at 320/375/768/1024/1440 widths; tested interactions produced no observed JavaScript errors.

Verification scope: actual HTML/CSS/JS rendered and exercised in Chromium using local `set_content` and an in-memory localStorage API fixture. Navigation to HTTP pages was blocked by the browser environment's administrator policy; those checks do NOT establish end-to-end persistence on the deployed origin or across actual user devices. No policy bypass was attempted. Published files and GitHub Pages deployment are checked separately in the issue RETURN.

## Next useful refinements

Confirm exact mantle targets and the video-derived builds; add quest unlock/material route detail; permit editing of custom recipe rows after creation; add screenshot-to-inventory review; consider consent-based synchronized multi-user storage separately. Do not replace existing user stock with future seed-data changes.
