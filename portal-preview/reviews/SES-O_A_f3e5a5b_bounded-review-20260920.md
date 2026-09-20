# SES-O bounded A review — f3e5a5b

## Decision and progress contract
- SIGNAL: GO / A_REPAIR_REQUIRED; this revision is REJECTED_FOR_CONSUMPTION.
- OWNER: A repair contract = osakenpiro/claude-shared#327; acceptance/integration = #326 / this ChatGPT review session.
- NEXT ACTION: repair the malformed A insertion and scoped CSS, then supply an exact-revision RETURN with desktop/mobile Machine evidence and Golden TOP same-angle comparison. Do not redesign B/C or N.
- RELEASE CONDITION: one coherent Hero/Package scene, unique route targets, bounded package geometry and state labels, a genuine 390px layout, and non-regressive Golden comparison; SES-O must inspect before consuming. Whole-product Human PASS is independently required for main promotion.
- TRACKING REF: #326 progress 5747687423; #327 request 5747686194; source branch ses-a/mh-portal-hero-package-v01-20260920; source commit f3e5a5ba61587cd919848b11b07bd459ae8ed9c8.

This is an orchestrator inspection and concrete rejection, NOT a worker ACK, CLAIM, RUNNING declaration, RETURN, or Human verdict. No A source has been consumed into the integration HTML. Main index.html is untouched.

## Exact evidence identity
The inspected files were fetched by the fixed commit above. Locally computed Git blob IDs match GitHub fetch_file results:

| File | Git blob SHA-1 | SHA-256 |
|---|---|---|
| portal-preview/a-hero-package-v0.1.html | be83258afaf7f34d93684bd670c770bdb0ed704a | 6c27c1181bc1055575af0436015fa5b91eccdbb8f3c5a7aa60ff90e6178f4714 |
| portal-preview/a-hero-package-v0.1.css | 0a9b600f23577d2cbe48247a640334a710b32b14 | b53468f1b670e164df83fb18c41405fc6b3b5c4c1c9e9d368633764264f3af60 |

Runtime: local Chrome via Playwright on the authorized Windows device. Desktop viewport 1672x941; mobile requested viewport 390x844, touch/mobile emulation. Same-commit portal-data-v2.js and portal-runtime-bindings-v0.1.js were placed at their relative paths. Official image URLs were read for internal reference review only, not copied or publication-cleared.

Golden TOP: Drive 1q3CvYvUPYIW9sktem-j5XYftMCtR1Wbm, downloaded and directly viewed. The desktop render was directly viewed alongside the Golden reference. No pixel-parity PASS is claimed.

## Reproduced defects / concrete correction

### A-R1 — duplicated Hero and route targets / FAIL
Rendered DOM has two #home sections: `section.world.a-hero-world` and the retained `section.world`. It also has two #packages IDs. Two hero h1 elements appear in sequence: the new `狩りは、時を超えて。` and old `まだ見ぬ狩場へ。`. The inherited hero/package scene was not replaced cleanly; it remains before B CURRENT.

Correction: replace the prior A region once, rather than prepend A while retaining the old Hero/Package and broken shell fragments. Keep N shell single and preserve B/C internals. Require exactly one #home and one #packages; verify route targets after insertion.

### A-R2 — malformed HTML splice / FAIL
Rendered body text includes literal backslash-n and a broken opening-anchor fragment beginning `route-brand" href="#home" data-route-id="route.home" ...`. The desktop screenshot visibly exposes this markup between scenes and repeats navigation fragments.

Correction: construct a valid document/section replacement; remove escaped-newline artifacts and broken tag fragments. Do not hide the text with CSS. Validate parsed DOM as well as source syntax.

### A-R3 — World package inherits scene CSS / FAIL
The package uses `class="a-case world"`; global `.world` rules intended for a full scene impose min-height. Runtime computed World package height/min-height is 820px on desktop and 990px on mobile, although A declares a roughly 225/270px package. Desktop transformed bounding box is about 256x833px and begins at y=-369, clipping the object against the Hero. This is an actual CSS collision, not missing asset delivery.

Correction: rename the package's generic `world` class or strictly scope the scene rules. Do not globally change B/C scene styles. Verify package computed height and silhouette at both viewports; Wilds must remain the dominant package.

### A-R4 — CURRENT/NEXT plaque becomes an opaque band / FAIL
Global `.state` sets bottom:-29px and transform:translateX(-50%); A adds top:-23px without resetting inherited bottom/transform. Desktop plaque bounding heights: Iceborne ~286px, Wilds ~374px, Ascendance ~260px. They visibly cover package artwork as tall dark strips.

Correction: use an A-specific state-label class, or reset bottom/transform/height and scope rules. Labels must remain compact, attached plaques, not artwork-covering overlays. This directly conflicts with the recorded KILL rule against unexplained black overlays.

### A-R5 — mobile overflow and traversal / FAIL
Requested mobile viewport is 390x844. Actual document clientWidth=390, scrollWidth=429; innerWidth expands to429. Thus checking scrollWidth <= innerWidth alone would falsely pass. The screenshot visibly clips the shell route rail. The retained second Hero also adds another vertical scene before CURRENT.

Correction: test scrollWidth against clientWidth/requested width and inspect the actual 390px composition. Preserve any intentionally scrollable package rail within its own container, not document overflow. Remove the duplicated scene before reconsidering scroll effects.

## Targeted Machine assertions
These are 14 bounded acceptance assertions, not a substitute for the full product test suite.

| Assertion | Result |
|---|---|
| HTML blob matches fixed GitHub revision | PASS |
| CSS blob matches fixed GitHub revision | PASS |
| One #home target | FAIL (2) |
| Unique DOM IDs | FAIL (#home and #packages duplicated) |
| One intended top Hero heading | FAIL (2) |
| No stray body markup text | FAIL |
| Six A package objects | PASS |
| World package does not inherit full-scene min-height | FAIL |
| State plaques remain compact (less than60px diagnostic threshold) | FAIL |
| Desktop pageerror-free during initial render | PASS |
| Mobile pageerror-free during initial render | PASS |
| Desktop document does not horizontally overflow | PASS |
| Mobile layout stays within390px client width | FAIL (429px scrollWidth) |
| Six referenced package images load | PASS |

Total: 7 PASS / 7 FAIL. Overall consumption gate: FAIL. Image loading and zero JS errors do not establish visual or integration correctness.

## Golden / KEEP-IMPROVE-KILL
KEEP: actual A implementation and six-title intent; attempted object depth; Wilds emphasis intent; explicit internal reference-only notice. Do not restart from a rejected v0.6 baseline.

IMPROVE: clean A-to-B handover; recover Golden's readable heading, case silhouettes, compact state labels and one continuous shelf/base; rerender the corrected revision at1672x941 and390px. Golden reference numbers are not hunter data.

KILL in this revision: duplicated complete Hero; malformed visible markup; giant World case; artwork-covering state strips; document-level mobile overflow. No weaker fallback scene or generic card redesign is requested.

D constraints remain independent: successfully loaded official references are not publication-cleared. Return the #367 asset-binding/provenance note for the exact corrected revision; do not present reference key art as a cleared physical package. No Human review of rights or final publication is inferred.

## Screenshots and delivery truth
Local review screenshots were rendered and directly inspected:
- a-desktop-1672x941.png, SHA256 ce7707980d48045ac093a9e956017d9c481caa89dacc11cc6a621631ab01bf4a
- a-mobile-390x844.png, SHA256 8a899d9932a6f417a2df48ca8707b4a05972305ad8bd44bade8a88cee668b352

They remain local diagnostic files in the temporary review directory; the hashes are not a claim of GitHub screenshot upload or recoverable long-term image delivery. Durable evidence is this report plus the fixed source blobs and reproduction conditions. A local machine-review.json records the measurements.

This failed diagnostic candidate is NOT a new review-ready Human Gate artifact. No Disco delivery, receipt, or Human acceptance is claimed. A future review-ready corrected/integrated revision must be surfaced consistently in owning chat and Disco with the same artifact/revision/scope and a verified receipt where required.

Only this report is added to the existing SES-O branch. No product implementation, main index.html, A/B/C/N source, branch topology, or automation is changed.
