# Hero Tournament r13 Windows build

This bounded build adds shared combat presentation to the existing Windows test
release: distinct hit, guard and counter feedback; a short impact hold; and a
finishing cue only after both committed beats have resolved. Sound and motion
settings affect presentation only. Game rules, resources, save format, accepted
art, whole-object inventory rendering and native launcher source are retained.

`prepare.py` downloads the public r12 archive, verifies its pinned size, SHA-256,
ZIP CRC and every original manifest entry, then overlays only the six entries in
`overrides.json`. The two new feedback files must have null baseline hashes and
must not collide with an existing file. Their paths are added to the new manifest.
The original Node and WebView2 SDK binaries and licenses are retained.

On Windows with Python, the existing .NET Framework compiler and WebView2 Runtime:

```powershell
./build.ps1 -OutputRoot C:/task-output/hero-r13
```

The new manifest is hashed into a freshly compiled launcher. The build compares
436 legal plans and 44 illegal plans against r12, checks 436 room resource results
and retains the 38-check dead-hand regression. It then verifies the actual EXE,
rejects a changed payload, restores it, and runs smoke, learning/practice,
two-window room and solo journey checks. Failed, missing or timed-out native
checks prevent packaging. Native screenshots and profiles stay in the separate
evidence artifact; only runtime files and sanitized build metadata enter the ZIP.

The room test driver also receives the narrow CLEAR-button precondition fix:
when nothing is selected, repair selects its target directly. This does not alter
user gameplay or turn an earlier failed test into a pass.

The GitHub Actions workflow has read-only repository permissions and creates a
candidate only. It does not publish a release or update public download links.
The release executor must inspect the actual native evidence and publish the
exact checked ZIP under the user's release authority.

Extract the complete ZIP into a new folder. Do not overwrite files inside an old
Windows folder: its launcher pins its own manifest.

Human fun, first-time comprehension and separate-PC/network interoperability
remain separate from these technical checks. Existing production owner:
https://github.com/osakenpiro/claude-shared/issues/513
