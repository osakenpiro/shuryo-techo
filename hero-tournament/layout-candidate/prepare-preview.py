"""Prepare an HTTP-only layout preview from the immutable public r13 ZIP.
No EXE or Windows runtime is copied; this is not a Windows distribution.
"""
from pathlib import Path
import hashlib,json,sys,zipfile
HERE=Path(__file__).resolve().parent
BASE_SHA='2d6c41c5535e18077e845cf197014cd4c68b3bf4247073ec7a1ad9253e4b45cb'
ALLOWED={'game/room.html','game/index.html','game/room-layout-review.css','game/native-layout-review.css'}
sha=lambda b:hashlib.sha256(b).hexdigest()
archive=Path(sys.argv[1]);out=Path(sys.argv[2]).resolve()
assert not out.exists(),'Choose a new output directory'
assert sha(archive.read_bytes())==BASE_SHA,'Expected the exact public r13 ZIP'
changes=json.loads((HERE/'overrides.json').read_text())
assert len(changes)==4 and {x['path'] for x in changes}==ALLOWED
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 names=z.namelist();assert len(names)==len(set(names))
 prefix='HeroTournament-Windows-r13/'
 manifest=json.loads(z.read(prefix+'manifest.json'))
 for f in manifest['files']:
  assert sha(z.read(prefix+f['path']))==f['sha256']
 for c in changes:
  p=HERE/'overrides'/c['path'];assert sha(p.read_bytes())==c['candidateSHA256']
  if c['baselineSHA256'] is None:assert prefix+c['path'] not in names
  else:assert sha(z.read(prefix+c['path']))==c['baselineSHA256']
 selected=[f['path'] for f in manifest['files'] if f['path'].startswith('game/') or f['path']=='desktop-host.mjs']
 out.mkdir(parents=True)
 for name in selected:
  dest=(out/name).resolve();assert dest.is_relative_to(out)
  dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(prefix+name))
for c in changes:
 dest=out/c['path'];dest.write_bytes((HERE/'overrides'/c['path']).read_bytes())
for c in changes:
 if c['path'] not in selected:selected.append(c['path'])
manifest.update(buildId='hero-layout-http-preview',baselineZipSHA256=BASE_SHA,files=[{'path':name,'bytes':(out/name).stat().st_size,'sha256':sha((out/name).read_bytes())} for name in selected])
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(out/'README-preview.txt').write_text('HTTP layout preview only. No EXE. Public Windows release remains r13.\nRun: node desktop-host.mjs 18807 layout-preview local-preview\nOpen: http://127.0.0.1:18807/desktop.html\n')
print('Prepared HTTP-only preview:',out)
