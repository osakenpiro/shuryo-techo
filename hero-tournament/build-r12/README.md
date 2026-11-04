# Hero Tournament r12 Windows build

This bounded build updates the existing Windows test release with the six
reviewed resource-preview and whole-object inventory files. The accepted art,
normal action costs, combat resolution, transport, save format and native launcher source remain unchanged.
If a five-card hand has no legal plan, the shared player/CPU preparation exchanges
the minimum one or two non-carried cards with existing basic cards from the draw
or discard pile. No cards or resources are created; the UI explains the recovery.

`prepare.py` downloads the existing public r11d archive, checks its pinned
SHA-256 and every original manifest entry, then overlays only the six files in
`overrides.json`. The original Node and WebView2 SDK binaries and licenses are
retained. No installer, paid service or new account is required by this build.

On Windows with Python, the existing .NET Framework compiler and WebView2 Runtime:

```powershell
./build.ps1 -OutputRoot C:/task-output/hero-r12
```

The new manifest is hashed into a freshly compiled launcher. The build verifies
the actual EXE, rejects a changed payload as a negative control, restores it,
and runs the embedded smoke, learning, two-window room and solo journey checks.
Missing/failed/timed-out native evidence prevents packaging. Only runtime files
and sanitized build metadata enter the ZIP; test profiles, screenshots and
logs remain in the separate evidence artifact.

The GitHub Actions workflow builds a candidate on the named release branch with
read-only repository permissions. It does not publish a release, update the
download page or merge a branch. The release executor must inspect the native
results and screenshots, then publish the exact checked ZIP, update all download
links and verify the public bytes under the user's current release instruction.

Do not overwrite files inside a previously distributed Windows folder: its
launcher pins its own manifest. Download and extract the complete new ZIP.

Human fun, first-time comprehension and separate-PC/network interoperability
remain separate from these technical checks. Existing production owner:
https://github.com/osakenpiro/claude-shared/issues/513
