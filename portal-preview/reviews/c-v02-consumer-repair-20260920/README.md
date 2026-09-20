# SES-O C v0.2 consumer binding repair — 2026-09-20

## Finding
SES-O `integration-v0.10-c-v02-sandbox.html` contained the C v0.2 FUTURE markup, but the C v0.2 `.asc-*` stylesheet block was absent. The integrated render therefore collapsed toward default/dark HTML despite C source having the intended visual substrate.

## Bounded repair
A new integration revision was created without rewriting C hierarchy or B/D/E/N:
- `portal-preview/integration-v0.10.1-c-v02-style-repair.html`
- restored the exact FUTURE stylesheet block from C v0.2 source
- historical v0.10 artifact left unchanged

## Machine / runtime
- one `#future`
- `.asc-stage`: grid at desktop / block at mobile
- 4 route panels and 3 secondary media slots preserved
- desktop viewport: 1672 client / 1672 scroll width
- dominant media: ~796×420 at desktop
- mobile dominant media: ~362×235

## Visual result
Before repair, the integrated C surface showed default blue links / near-black unstyled areas; support metrics were entropy 3.568, edgeMean 1.29, edge>32 0.7%.
After repair, C source visual class/layout is restored; support metrics rise to entropy 5.397, edgeMean 3.86, edge>32 4.9%.
These metrics are support evidence only, not a taste score.

## Golden adjudication
C v0.2 is now faithfully consumed, but Golden parity is still OPEN. The repaired integrated candidate remains materially less image-rich than the approved Ascendance Golden, especially where official YouTube embeds return error 153 and route/lower scenic fields remain abstract.

This is not a new C source regression. Do not churn C hierarchy. The integration consumer omission is fixed; remaining Golden gap stays a whole-product visual/Human-gate concern.

## Progress contract
- SIGNAL: `GO / C_CONSUMER_BINDING_REPAIRED / GOLDEN_PARITY_OPEN`
- OWNER: consumer binding = SES-O #326; C source = shuryo-techo#2
- NEXT ACTION: use v0.10.1 for whole-product visual review; do not send C back unless a concrete source-lane regression is found
- RELEASE CONDITION: main remains ROUTE_LOCKED until whole-product Human PASS; C Golden parity remains open
- TRACKING REF: C RETURN `5747270428`; consume receipt `5747305501`; prior structural verification `5747686721`
