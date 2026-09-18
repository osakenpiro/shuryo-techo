# SES-C MAINLINE START HERE — MH PORTAL

- date: 2026-09-18 JST
- state: GOAI_READY / FOREGROUND_SCOPE_LOCKED
- owning_issue: https://github.com/osakenpiro/shuryo-techo/issues/2
- evaluation_side_lane: FORKED / NOT_FOREGROUND
- production_release: NOT_CLAIMED

## One sentence

Build one Monster Hunter Portal world where **PAST = MEMORY**, **CURRENT = NOTEBOOK**, and **FUTURE = HORIZON**.

## Foreground scope — ONLY THIS

```text
PAST / 狩猟歴史館
CURRENT / 狩猟手帖
FUTURE / Wilds・Ascendance

→ integrate as one portal world
```

Evaluation-system work is explicitly out of foreground scope and has been handed off through:

`HAND-EVAL-SYSTEM-FORK-20260918-01`

## Ground truth

### TOP
- Golden TOP remains the portal-level visual contract.
- Material language: wood / leather / brass / paper / physical package objects / dense official-site-class composition.

### PAST = MEMORY
User-approved direction: **90+**.

KEEP:
- real archival desk;
- PSP-like nostalgic hero object;
- bespoke chronological shelf;
- distinct package/era identities;
- short copy;
- “あー、こうだったな。” memory-room feeling.

KILL:
- generic work-card grid;
- long explanation;
- drifting percentage hitboxes;
- fake-fidelity 3D.

Current truth:
- visual approved;
- repository integration NOT DONE;
- `archive.html` currently absent from main.

### CURRENT = NOTEBOOK
Preserve:
- `hunting-notebook.html`
- `mr-switchaxe.html`
- current hunting-record/notebook role.

Do not rewrite those pages as part of SES-C unless a separate Gate explicitly changes scope.

### FUTURE = HORIZON
Golden Ascendance visual is ground truth.

Required:
- official-site-scale Hero;
- MAIN TRAILER dominates;
- secondary videos subordinate;
- FIELD / MONSTER / WEAPONS / ANNOUNCEMENTS exist inside the world, not as a generic news grid;
- strong route back to CURRENT.

Current truth:
- Golden direction exists;
- `ascendance.html` currently absent from main;
- repository implementation NOT DONE.

## Repository reality

At fork checkpoint:

```yaml
index.html: EXISTS
portal-preview/index.html: EXISTS
hunting-notebook.html: EXISTS
mr-switchaxe.html: EXISTS
archive.html: NOT_PRESENT
ascendance.html: NOT_PRESENT
```

Never collapse:

```text
concept != local mock != repo integration != public preview != production
```

## GOAI order

### 1. PAST implementation preview
- implement approved archive in repository preview first;
- fixed aspect coordinate plane shared by visual + hit geometry;
- package hover must visually belong to the package;
- PSP interaction must match visible object;
- no 3D until fidelity is real.

### 2. PAST verification
- desktop;
- 390px;
- no hotspot drift;
- no broken assets;
- no network permission dialog caused by optional media.

### 3. FUTURE implementation preview
- Ascendance Golden hierarchy;
- main video first;
- secondary reels;
- field / monster / weapon / announcement information;
- return to notebook.

### 4. Temporal navigation
```text
PAST ← CURRENT → FUTURE
```
One header / one material world / clear re-entry.

### 5. Public preview Gate
Publish preview first.
Inspect.
Only then ask for the user visual Gate.

### 6. Production
Integrate into production root only after preview passes.

## Do not drift into

- Evaluation Contract implementation
- Museum governance
- ORBIT formalization
- GAMINGWATCH POINT/ROUTE
- generic ecosystem protocol work
- PSP 3D research as its own project

Those may provide references but are not foreground tasks.

## Immediate next action

```yaml
next_action: PAST_PREVIEW_IMPLEMENTATION
target: approved 90+ archive visual
output: repository preview, not production root
gate_after: pixel alignment + responsive check
human_action_required_before_start: false
```

## Re-entry phrase

If a future ordinary SES receives:

`MH PORTAL SES-C GOAI`

recover this file + Issue #2 and continue from the first incomplete GOAI step.
