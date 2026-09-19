# SES-O Integration Sandbox Gate v0.9.1

## Purpose
Converge returned B/C/D/E/N parts while preserving truth around unresolved A and partially recovered PAST source.

## Artifact
- branch: `ses-o/mh-portal-integration-20260918`
- file: `portal-preview/integration-v0.9-memory-mounted-sandbox.html`
- commit: `bf4f483d948f6920519ad68b36dd851512a6903a`
- runtime adapter: `portal-runtime-bindings-v0.1.js`
- semantic model: `portal-data-v2.js`
- asset ledger: `portal-assets-v0.1.json`

## What changed from v0.8
1. SES-E semantic model is actively consumed at runtime.
2. SES-D asset ledger is actively merged into semantic asset bindings.
3. B hunter state is projected from the semantic model:
   - CURRENT = ICEBORNE
   - main weapon = Switch Axe
   - HR / hunts remain NOT_RECORDED
4. `practiceWeapons` and `notebookArtifacts` remain distinct relations.
5. C FUTURE v0.1 remains integrated.
6. 90+ PAST source recovery advanced to `PARTIAL_SOURCE_RECOVERED`.
7. Failed cross-origin image mount was removed. MEMORY is represented as a locked approved external reference, not falsely claimed as repo-integrated.

## PAST recovery state
Recovered:
- live approved preview
- title and visible labels
- game-era hotspots
- PSP hotspot
- ARCHIVE / MEMORY
- CURRENT / NOTEBOOK link
- NEXT HORIZON
- dominant `archive.jpg` 1672x941
- basic external-link structure

Not recovered:
- exact original HTML file
- exact CSS
- exact hotspot geometry
- original local image asset
- original build script

See:
`portal-preview/PAST_MEMORY_RECOVERY_DOSSIER_v0.1.md`

## C G-ART-3
Same-frame Golden vs C v0.1 comparison:
- hierarchy transfer: KEEP
- official/provenance posture: KEEP
- visual parity: HOLD / IMPROVE

Main gaps:
- continuous world field
- image-rich secondary media
- image-bearing route panels
- lower-band material/imagery
- stronger right-side vista

## Gate

### MACHINE
PASS 20/20.

### LOCAL RUNTIME
PASS.

Observed:
```yaml
semantic: "0.1"
ledger: "MH_PORTAL_ASSET_LEDGER_V0.1"
current: "CURRENT: ICEBORNE"
weapon: "CURRENT WEAPON — スラッシュアックス"
memoryRef: true
future: true
nav: true
ok: true
```

### HUMAN
DEFERRED.

Reason:
- A Hero/Package unresolved
- C visual parity HOLD
- PAST exact repo integration unresolved

This sandbox is an integration proof, not a whole-product Human visual gate.

## Current product state
```yaml
A: HOLD_FOR_APPROVED_QUALITY_RETURN
B: PRESERVED
C_STRUCTURE: KEEP
C_VISUAL_PARITY: HOLD
D: CONSUMED
E: CONSUMED
N: CONSUMED
PAST_VISUAL: LIVE_AND_HUMAN_APPROVED_90_PLUS
PAST_SOURCE: PARTIAL_SOURCE_RECOVERED
PAST_REPO_INTEGRATION: NOT_DONE
WHOLE_PRODUCT_HUMAN_GATE: DEFERRED
MAIN: FROZEN
```
