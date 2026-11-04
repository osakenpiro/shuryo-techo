# Hero Tournament r15 Windows build

This build adds visible occupation boundaries around unselected bag items while
retaining the accepted whole-item art, orientation and existing selected-cell
highlight. The r14 hand, reward/growth and receipt layout remains in place.
Rules, resources, save format, accepted art, sound and native launcher source are
unchanged. The fixed independent r13 review originals and older public releases
are retained.

`prepare.py` uses the exact public r14 archive: 164587348 bytes, SHA-256
`978f14fe78f9bff797804c2aa8a60f72134d988c55e2754b899b7b92e1cf42bd`.
It checks ZIP CRC and every original manifest entry before applying the reviewed
runtime allowlist and candidate hashes from `overrides.json`. The release executor
must freeze `ALLOWED` and `ADDED` before preparation; an unset allowlist fails
before output files are created. New paths require null baseline hashes and must
not collide with an existing file. Every final runtime path enters the new
manifest, whose hash is compiled into a fresh launcher. Existing Node, WebView2
SDK binaries and licenses are preserved.

On Windows with Python, the existing .NET Framework compiler and WebView2 Runtime:

```powershell
./build.ps1 -OutputRoot C:/task-output/hero-r15
```

The build retains the 436 legal plans, 44 rejected plans and 436 room resource
comparisons against r14, dead-hand 38 and feedback classification 24 checks.
It verifies the compiled EXE, rejects a changed runtime payload, restores it and
runs smoke, learning/practice, two-window room and solo journey checks. Failed,
missing or timed-out native evidence prevents packaging. The real WebView2
hand/reward/growth geometry gate is retained. The native bag-boundary gate checks actual main/room checkpoint engine shapes,
SVG exposed sides, fill cells, logical-grid geometry and input transparency;
both views must contain a multiple-item example before packaging.

Only runtime files and sanitized build metadata enter the release ZIP. Native
screenshots, profiles and logs remain in the separate evidence artifact. The
GitHub Actions workflow has read-only permissions and creates a candidate only;
it does not publish a release or change public download links. The executor must
inspect the actual native evidence and publish the exact checked ZIP under the
existing user authorization.

Extract the complete ZIP into a new folder. Do not replace individual files in an
older Windows folder because its launcher pins its own manifest.

Human clarity, sound/feel and separate-PC/network interoperability remain
separate from these technical checks. Existing task:
https://github.com/osakenpiro/claude-shared/issues/513
