# SES-N Global Shell / Navigation Gate v0.1

## Scope

Support-only shell around the existing MH Portal sections.

Owns:
- global route board
- current-location signal
- stable deep links
- mobile route rail
- keyboard/focus behavior
- return-to-CURRENT affordance

Does not redesign A/B/C/MEMORY internals.

## Branch

`ses-n/mh-portal-shell-20260919`

Artifact:
- `portal-preview/nav-shell-v0.1.html`
- depends on `portal-data-v2.js` from SES-E

Latest implementation commit:
- `5a80eca062c034674efbcaffc8d37eb06e79bc9e`

Internal preview:
- https://clear-frame-jk59wa4.shipstatic.com

## Design

Desktop:
- one persistent Hunter Base route board
- five visible locations:
  - BASE
  - TITLES
  - CURRENT
  - HORIZON
  - MEMORY
- current location is signaled by one lit route lamp
- CURRENT / ICEBORNE return is always directly available

Mobile:
- no generic hamburger menu
- horizontally scrollable route rail
- same five semantic locations
- active route recenters in the rail

## Semantic dependency

Navigation does not invent route truth.

Consumed from SES-E:
- route.home
- route.packages
- route.current
- route.future
- route.memory
- title state semantics

## Machine verification

PASS.

Static checks:
- 13 / 13

Includes:
- semantic contract loaded
- five stable route IDs
- keyboard focus
- reduced-motion
- mobile horizontal route rail
- no preventDefault / no scroll-jacking
- A/B/C/MEMORY content preservation
- main not promoted

Deep-link runtime:
- #home -> home PASS
- #packages -> packages PASS
- #current -> current PASS
- #future -> future PASS
- #memory -> memory PASS

One bug was caught during runtime:
- direct #packages remained BASE because the target is already visible inside Hero.
- fixed by preserving explicit hash intent before normal scroll-location tracking resumes.

## Preservation

Compared against v0.7 skeleton:
- WORLD/Hero/Package content preserved aside from stable IDs
- B CURRENT content preserved aside from stable ID
- C FUTURE content preserved aside from stable ID
- MEMORY content preserved aside from stable ID

## AI Gate

PASS WITH NOTES.

Pass:
- answers where am I / where can I go / how do I return to CURRENT
- does not create another content section
- reuses SES-E semantic routes
- mobile keeps same information architecture
- visual language is route/signal-board rather than generic SaaS navbar

Notes:
- final visual weight should be judged only after A/C craft is complete
- current location thresholds may need tuning after section heights change
- do not Human-PASS shell in isolation now

## State

`IMPLEMENTED / MACHINE_PASS / DEEP_LINK_PASS / RETURNED_TO_SES-O / HUMAN_REVIEW_DEFERRED`

Main remains untouched.
