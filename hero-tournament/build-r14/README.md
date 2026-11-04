# Hero Tournament r14 Windows build

This build adopts the bounded layout candidate after the independent r13 review:
reward and growth art, names and effects appear together; all five battle cards
remain readable with the tutorial guidance present; battle receipts avoid the
hand and player identity. The scope is desktop widths of at least 900 px.
Rules, resources, save format, accepted art, whole-object inventory, sound and
native launcher source are unchanged. The public r13 ZIP and fixed independent
review originals are retained.

`prepare.py` downloads the exact public r13 archive and verifies its pinned size,
SHA-256, ZIP CRC and every original manifest entry. It overlays only five entries
from `overrides.json`: four UI entries (two HTML stylesheet links and two new CSS
files), plus one read-only Windows playtest telemetry entry. The telemetry records
reward/growth comparison-field geometry without altering gameplay state. New files
must have null baseline hashes and must not collide with an existing path. Their
paths are included in the new manifest. Existing Node, WebView2 SDK binaries and
licenses are preserved.

On Windows with Python, the existing .NET Framework compiler and WebView2 Runtime:

```powershell
./build.ps1 -OutputRoot C:/task-output/hero-r14
```

The new manifest is hashed into a freshly compiled launcher. The build compares
436 legal plans and 44 rejected plans against r13, checks 436 room resource
results, and retains the dead-hand 38 and feedback classification 24 checks.
It verifies the actual EXE, rejects a changed payload, restores it, then runs
smoke, learning/practice, two-window room and solo journey checks. Missing,
failed or timed-out native checks prevent packaging. The executor adds the
native layout geometry check before final release validation.

Native screenshots and profiles remain in the evidence artifact. The release
ZIP contains runtime files and sanitized build metadata only. The GitHub Actions
workflow has read-only repository permissions and creates a candidate only: it
does not publish or update download links. The executor must inspect the actual
Windows screenshots and publish the exact checked ZIP under the user's release
instruction.

Extract the complete ZIP into a new folder. Do not replace individual files in an
old Windows folder because that launcher pins its own manifest.

Human first-time understanding, sound/feel judgments and separate-PC/network
interoperability remain distinct from technical checks. Existing task:
https://github.com/osakenpiro/claude-shared/issues/513
