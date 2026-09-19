# MH Portal Data / Content Contract v0.1 — migration memo

Source: `main:portal-data.js@cf81e55f2a7b7861b769203538ea093f7718ba71`

Target fixture: `portal-data-v2.js`

## Why this migration exists

The current portal UI now treats six title objects independently:

`WORLD / ICEBORNE / RISE / SUNBREAK / WILDS / ASCENDANCE`

but the legacy data model still exposes only three grouped entries:

`mhwib / wilds / rise`.

That mismatch pushes semantic truth into DOM classes and section-specific code. v0.1 separates semantic state from presentation without replacing the current runtime yet.

## Separation rule

`title identity != hunter progress != editorial copy != asset binding != route binding`

No visual hierarchy or CSS belongs in this contract.

## Old -> new mapping

| Legacy | v0.1 destination | Rule |
| --- | --- | --- |
| `titles.mhwib` identity | `titles.world` + `titles.iceborne` | split base game and expansion |
| `titles.mhwib.status/progress` | `hunterState.currentTitleId/currentGoal` + copy | user state leaves title identity |
| `titles.mhwib.weapons/practice` | `hunterState.currentLoadout` | user loadout leaves title identity |
| `titles.mhwib.skills` | notebook-local detail data | not portal-global semantic state |
| `titles.rise` | `titles.rise` + `titles.sunbreak` | split physical title objects |
| `titles.rise.weapons` | `hunterState.history[rise]` | personal history |
| `titles.wilds` | `titles.wilds` | identity retained |
| `titles.wilds.weapons` | `hunterState.history[wilds].plannedWeaponIds` | user plan, not public title fact |
| `hunters[0]` | `hunterState` | one explicit personal-state block |
| `assetLedger` | #367 Asset Desk; semantic refs in `assetBindings` | source/rights detail leaves content model |
| `href/action` | `routes` + copy | route identity separate from button language |
| title tone/mark | visual lane | deliberately not migrated into semantic core |

## Stable portal state

| Title | portalState |
| --- | --- |
| WORLD | PAST |
| ICEBORNE | CURRENT |
| RISE | PAST |
| SUNBREAK | PAST |
| WILDS | NEXT |
| ASCENDANCE | HORIZON |

These are portal editorial semantics. They do not imply fabricated completion statistics.

## Real hunter state

Known:
- current title: ICEBORNE
- current goal: ミラボレアス
- main weapon: スラッシュアックス
- practice: 弓 / チャージアックス
- RISE history: 双剣 / 太刀
- WILDS planned-return weapons: ガンランス / ハンマー

Unknown:
- HR
- total hunt count

Unknown metrics stay `NOT_RECORDED + null`.

## Asset boundary

v0.1 contains only stable semantic asset IDs such as:

- `asset.package.iceborne`
- `asset.keyVisual.ascendance`
- `asset.media.wilds.primary`

#367 owns source, edition/region, rights/use posture, local/embed strategy and publication state evidence.

Until #367 returns, bindings remain `ASSET_PENDING`.

Legacy SVG asset IDs are preserved under `legacyRefs` only and are not publication approval.

## Consumer contract

### SES-A
Read:
- six stable title IDs
- `portalState`
- package/hero asset IDs

Do not derive title state from CSS classes.

### SES-B
Read:
- `hunterState.currentTitleId`
- `hunterState.currentLoadout`
- `knownMetrics`

Never replace `NOT_RECORDED` with decorative prototype numbers.

### SES-C
Read:
- WILDS = NEXT
- ASCENDANCE = HORIZON
- title relations / announced availability
- key-visual/media asset IDs

Unknown future details remain TBA/ASSET_PENDING.

### SES-D
Fill asset ledger evidence against stable `assetBindings` IDs. Do not mutate title/user semantics.

### SES-N
Read stable route IDs and portal state. Do not invent a second route/state vocabulary.

## Integration posture

This is migration-compatible prework.

`portal-data.js` remains untouched.

SES-O decides if/when `portal-data-v2.js` becomes the runtime source after consumer review.
