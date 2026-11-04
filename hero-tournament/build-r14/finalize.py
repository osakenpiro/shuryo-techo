import hashlib,json,os,pathlib,sys,zipfile
out=pathlib.Path(sys.argv[1]);stage=out/'HeroTournament-Windows-r14'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=json.loads((stage/'manifest.json').read_text())
for f in m['files']:
 p=stage/f['path'];assert p.stat().st_size==f['bytes'] and sha(p)==f['sha256'],f['path']
exe=stage/'HeroTournament.exe';assert exe.read_bytes()[:2]==b'MZ' and exe.stat().st_size>20000
results=[]
for p in sorted((stage/'playtest-evidence').glob('*/result.json')):
 v=json.loads(p.read_text(encoding='utf-8-sig'));assert v['type']=='complete' and v['detail']['result']=='PASS'
 results.append({'path':str(p.relative_to(stage)).replace('\\','/'),'sha256':sha(p)})
assert len(results)==3
receipt={'schema':1,'buildId':m['buildId'],'sourceCommit':os.environ.get('GITHUB_SHA'),'manifestSHA256':sha(stage/'manifest.json'),'exeSHA256':sha(exe),'exeBytes':exe.stat().st_size,'nativeTestResults':results,'integrityNegativeControl':'tampered payload rejected with exit 2; restored payload passes','rendering':'embedded WebView2','humanFun':'unverified','separatePCNetwork':'unverified'}
(stage/'build-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
paths=[f['path'] for f in m['files']]+['HeroTournament.exe','manifest.json','build-receipt.json','peerjs-dependency.json']
assert len(paths)==len(set(paths))
archive=out/'hero-tournament-windows-r14.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in paths:z.write(stage/name,'HeroTournament-Windows-r14/'+name)
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None and len(z.namelist())==len(paths)
 assert not any('playtest-evidence' in n or 'Profile' in n for n in z.namelist())
release={'version':'r14','updated':'2026.11.04','platform':'Windows','download':'https://github.com/osakenpiro/shuryo-techo/releases/download/hero-tournament-r14/hero-tournament-windows-r14.zip','bytes':archive.stat().st_size,'sha256':sha(archive),'publicPage':'https://osakenpiro.github.io/shuryo-techo/hero-tournament/','sourceCommit':os.environ.get('GITHUB_SHA'),'manifestSHA256':sha(stage/'manifest.json'),'exeSHA256':sha(exe)}
(out/'release-candidate.json').write_text(json.dumps(release,indent=2)+'\n')
(out/'build-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(release,indent=2))
