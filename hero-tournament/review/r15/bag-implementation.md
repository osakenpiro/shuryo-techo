# r15 bag occupancy implementation

Target: Task #513, released r14 baseline source `4e12c91bac2b770d4322d36d51253cb8b136bd36`, verified extracted runtime `/workspace/work/hero-r14-verified-stage/HeroTournament-Windows-r14/game`.

Hypothesis: remove competing per-cell outlines from stored objects and show each item's exposed shape boundary continuously. The existing whole illustration and the existing shape-based controls remain usable, including unselected adjacent items and gaps in nonrectangular shapes.

## Candidate files

Under `hero-tournament/build-r15/overrides/game/`:

- Modified `index.html`, `room.html`: append one stylesheet link, after the existing layout stylesheet.
- Modified `material-ui.js`, `room-ui.js`: import the shared pure renderer, insert its presentation SVG markup inside each real packed object. No engine or action handler edits. Main preserves original CRLF.
- Added `bag-occupancy.js`: `footprintEdges(cells)` returns exposed cell sides, testing neighbors of the exact already-rotated `C.shape`. `footprintMarkup(cells)` produces a fill SVG and an outline SVG. No state, IDs, callbacks, DOM reads or mutations.
- Added `bag-occupancy.css`: quiet empty grid and occupied fill; continuous 2px outer outline, brighter 3px selection, art above subtle fill and below outline. All added SVG layers ignore input. Existing magic pocket, placement success, merge, adjacency preview and invalid placement have explicit preserved styles.

Main uses existing `.bag-object[data-item]` and `.cell-hit[data-hit]`. Room uses existing `.room-packed-object[data-packed-id][data-rotation]` and `.room-cell[data-cell]`. The preview ghost keeps the original renderer and has no persistent footprint. Each real item has `.bag-occupancy-fill` and `.bag-occupancy-contour`, each with `viewBox="0 0 width height"` and a `path`. Filled-cell path consists of exact unit squares. Contour path consists only of exposed edges, avoiding rectangular bounding-box outlines.

The existing main `.bag-object.overlapped` scales the whole object by .84 about bottom-right for magic-pocket stacking. Only the new fill/contour inverse-scale by 1/.84 with the same origin, so the logical footprint stays aligned to the grid while existing illustration and input transforms are unchanged. This requires explicit real-browser geometry verification; a source-only argument is insufficient.

## Completed checks

- Node syntax checks PASS for shared helper and both UI modules.
- Pure helper verified all 23 definitions × 4 rotations = 92 shapes, 704 exposed edges against a separate undirected-side cancellation calculation. Input `cells` unchanged, two SVG outputs present, empty shape gives empty output. This tests topology, not image quality or input behavior.
- Source diff inspected: each main/room UI changes only one import and one markup insertion. HTML changes only one stylesheet link. No engine/art/save/command files modified.

## Independent checks in progress

Runtime `/root/feedback_tests` owns actual browser before/after checks, not this implementer. Requested cases: 1028×719 and 1280×870, unselected multiple adjacent items, all four rotations, an item inside a nonrectangular gap, selection and invalid-preview salience, click input transparency, pocket overlap inverse-scale geometry, unchanged state. Root owns native Windows checks, actual integration, release gating and publication. No human fun, native completion, independent candidate approval or public deployment is claimed by this implementation record.
