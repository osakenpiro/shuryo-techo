# MH Portal Asset / Media Desk v0.1

Checked: 2026-09-19

## Result

This pass found official CAPCOM / Monster Hunter sources for all currently modeled asset slots, but **official source != cleared reuse**.

Disposition summary:

- Package WORLD: REFERENCE_ONLY
- Package ICEBORNE: REFERENCE_ONLY
- Package RISE: REFERENCE_ONLY
- Package SUNBREAK: REFERENCE_ONLY
- Package WILDS: REFERENCE_ONLY
- Package ASCENDANCE: ASSET_PENDING
- Hero ICEBORNE/WILDS: REFERENCE_ONLY
- Wilds key visual: REFERENCE_ONLY
- Ascendance key visual: ASSET_PENDING
- Wilds primary trailer: EMBED_CANDIDATE
- Ascendance primary trailer: EMBED_CANDIDATE

## Key design consequence

### Package shelf

A now has verified official product-reference pages for five title families, but should not simply scrape those images into the portal.

The exact edition/region/crop remains a visual decision owned by SES-A.

Important:
- Iceborne expansion vs Master Edition must be explicit.
- Sunbreak is an expansion; do not fabricate a standalone retail box when the selected edition does not exist.
- Wilds base-game identity should stay distinct from later Gold Edition merchandising unless intentionally selected.
- Ascendance remains ASSET_PENDING for package-face use.

### Future media

Official streaming candidates are available:

- Wilds Launch Trailer: https://www.youtube.com/watch?v=a_wNFT4j6qI
- Ascendance 1st Trailer: https://www.youtube.com/watch?v=ZeMKYURp_A8
- Ascendance Reveal Trailer: https://www.youtube.com/watch?v=URrMx-2l_ek

Use official link/standard embed if available.
Do not download and rehost these videos.

## Publication rule

OFFICIAL_SOURCE_FOUND != PUBLICATION_CLEARED

For images:
- current posture is REFERENCE_ONLY unless later evidence supplies a valid publication/reuse basis.

For official streaming media:
- current posture is EMBED_CANDIDATE;
- integration must verify that the official player permits embedding at that time.

## Consumer handoff

### SES-A
Use this ledger to select exact title/edition imagery.
Do not let Asset Desk choose package composition.

### SES-C
Use official trailer candidates as media sources.
Ascendance key visual remains unresolved; Golden composition still wins.

### SES-E
Stable asset IDs already match this ledger 1:1.

## Files

- portal-assets-v0.1.json
- verifier: scripts/verify-portal-assets-v0.1.cjs

No product HTML/CSS changed.