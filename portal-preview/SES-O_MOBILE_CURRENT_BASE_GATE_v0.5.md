# SES-O Mobile Current Base Gate v0.5

## Trigger
Disco human feedback:
- 「workべんちってどこのことだっけ？」
- 「スマホだと縦にスクロール長いなあ。」
- 「スクロールに合わせたアニメーションとか最近流行ってるじゃん。検討rondo」

## Scope
Mobile traversal of the CURRENT hunting base only.

Preserved:
- 14-weapon A/BOLD-CONTOUR rack
- Switch Axe CURRENT
- Bow / Great Sword notebook connections
- three physical notebooks
- Hunting Log / Guild Card
- Tier research ledger
- A/B Guild Beam material continuity

Out of scope:
- final SES-A Hero/background quality
- final Package Shelf faces/provenance
- SES-C full visual completion
- main promotion

## Artifact
- branch: `ses-o/mh-portal-integration-20260918`
- file: `portal-preview/integration-v0.5-mobile-current-base.html`
- final commit: `718a0b4852e3f7f271cf93d642d9fa0ce8203b5e`
- review preview: https://dilated-ghost-gnk29x3.shipstatic.com
- main: untouched

## Implementation

Mobile no longer serializes rack + books + log + Tier as long independent vertical blocks.

One CURRENT stage:
- outer track: `180svh`
- sticky authored stage: `100svh`
- remaining scroll travel drives four states in the same base:
  1. 武器を選ぶ
  2. 狩猟手帖をひらく
  3. 狩猟記録 / Tier
  4. 次の狩場へ

Interaction:
- ordinary passive page scroll
- no preventDefault / scroll-jacking
- requestAnimationFrame throttled state projection
- overlapping books rather than stacked book sections
- Guild Card / Tier emerge over the same desk
- final state opens a horizon window toward Wilds / Ascendance
- reduced-motion disables transitions while preserving discrete state changes

## Gate sequence

### IMPLEMENT
PASS.

### MACHINE GATE
PASS 38/38.

Validated:
- 6 package objects retained
- 14 weapons retained
- 3 notebooks retained
- Guild Card / Tier retained
- A/B beam retained
- CURRENT/NEXT/HORIZON semantics retained
- `180svh` mobile track
- `100svh` sticky stage
- four explicit mobile stages
- passive scroll + rAF
- no scroll-jack
- reduced-motion fallback
- no remote SVG/image dependency
- package faces remain explicitly non-final
- main not promoted

### RUNTIME RENDER CHECK
PASS after one caught-and-fixed test issue.

First review render exposed that a transition state was being captured at the transition start frame. Product DOM inspection showed the stage state was correct; review-capture harness was then changed to disable transitions for static stage screenshots.

Exact current HTML was rendered with Chrome at 390×844 into four final-state screenshots.

Adjacent mean absolute pixel differences:
- stage 0 -> 1: 61.59
- stage 1 -> 2: 41.19
- stage 2 -> 3: 62.54

Therefore all four states are materially distinct in the static review specimen.

### AI GATE
PASS WITH NOTES.

PASS:
- directly addresses the user's mobile-length complaint without deleting authored objects;
- replaces vertical stacking with spatial/state substitution;
- keeps the physical workbench identity;
- makes CURRENT understandable as 「現在の狩り」 instead of requiring the internal term Workbench;
- carries A/B beam into B and exits B toward C;
- animation is functional/spatial, not a decorative CSS demo.

NOTES:
- exact SES-B v0.4 HTML remains unrecovered; this implementation continues on the SES-O integrated surrogate plus user-supplied B CURRENT contract;
- stage timing/feel cannot be fully certified by static images; human phone interaction is still required;
- package/background remain SES-A IMPROVE, not part of this PASS.

### KENSHIRO TASTE PROXY GATE
PASS WITH NOTES.

Matches direct design evidence:
- preserves materiality / weapon rack / physical books;
- avoids SaaS cards and equal grids;
- responds to explicit request for scroll-linked mobile motion;
- does not shorten by deleting meaningful content;
- uses one place changing state, consistent with SAIHO Work-not-Website.

Risk to watch:
- motion becoming showy or too fast;
- four chapter changes over 80svh may need human tuning;
- explanatory stage plaque should remain supporting, not become dominant UI.

### HUMAN GATE
WAIT.

Review questions:
1. Mobile now feels like moving through **one CURRENT hunting base**, rather than reading a long vertical page?
2. Scroll chapter changes feel too fast / too slow / about right?
3. Keep the four chapters, or merge Guild Card/Tier into the notebook chapter?

## Current state
`MACHINE: PASS`
`RUNTIME: PASS`
`AI: PASS_WITH_NOTES`
`TASTE_PROXY: PASS_WITH_NOTES`
`HUMAN: WAIT`
`SES-A PACKAGE/BG: IMPROVE / NOT FINAL`
`MAIN PROMOTION: FORBIDDEN`
