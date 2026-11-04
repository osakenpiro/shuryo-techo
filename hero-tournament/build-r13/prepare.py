"""Rebuild from the pinned public r12 payload; preserve the native launcher contract."""
import hashlib,json,os,pathlib,shutil,sys,urllib.request,zipfile

HERE=pathlib.Path(__file__).resolve().parent
OUT=pathlib.Path(sys.argv[1]).resolve()
BUILD='ht-windows-20261104-r13'
BASE_URL='https://github.com/osakenpiro/shuryo-techo/releases/download/hero-tournament-r12/hero-tournament-windows-r12.zip'
BASE_SHA='82d44d0ff59ffe92e5e33e1dbf3dda5fc29ad939f1d9ad19a9822f9475af6986'
ALLOWED={'game/experience-ui.js','game/room-answer.js','game/room-ui.js','game/room-test-driver.js','game/battle-feedback.js','game/battle-feedback.css'}
ADDED={'game/battle-feedback.js','game/battle-feedback.css'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def prepare():
 OUT.mkdir(parents=True,exist_ok=True)
 archive=OUT/'baseline.zip'
 if not archive.exists():urllib.request.urlretrieve(BASE_URL,archive)
 assert archive.stat().st_size==164581387 and sha(archive)==BASE_SHA,'Baseline ZIP hash or size mismatch'
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None,'Baseline CRC failure'
  target=OUT/'extracted'
  for info in z.infolist():
   dest=(target/info.filename).resolve()
   assert dest.is_relative_to(target),'Unsafe archive path'
  z.extractall(target)
 stage=OUT/'HeroTournament-Windows-r13'
 shutil.copytree(OUT/'extracted/HeroTournament-Windows-r12',stage)
 manifest=json.loads((stage/'manifest.json').read_text(encoding='utf-8-sig'))
 original_paths=[f['path'] for f in manifest['files']]
 assert len(original_paths)==len(set(original_paths)),'Duplicate baseline manifest entries'
 for f in manifest['files']:
  p=stage/f['path'];assert p.resolve().is_relative_to(stage),'Unsafe manifest path'
  assert p.stat().st_size==f['bytes'] and sha(p)==f['sha256'],f['path']
 # Keep the old engine imports together for the before/after comparison.
 old=OUT/'baseline-game';old.mkdir()
 for p in (stage/'game').glob('*.js'):shutil.copyfile(p,old/p.name)
 changes=json.loads((HERE/'overrides.json').read_text())
 assert len(changes)==len(ALLOWED) and {f['path'] for f in changes}==ALLOWED,'Unexpected override scope'
 for f in changes:
  p=stage/f['path'];candidate=HERE/'overrides'/f['path']
  if f['path'] in ADDED:
   assert f['baselineSHA256'] is None and not p.exists(),f['path']+' new-file collision'
  else:
   assert sha(p)==f['baselineSHA256'],f['path']+' baseline drift'
  assert sha(candidate)==f['candidateSHA256'],f['path']+' candidate drift'
  shutil.copyfile(candidate,p)
 (stage/'README.md').write_text('''# 勇者トーナメント Windows r13

ZIPをすべて展開し、以前の版を閉じてから HeroTournament.exe を起動してください。
初めてなら「妖精とチュートリアル」、すぐ遊ぶなら「ひとりでお試し」へ。

## 今回の更新

通常の打撃・防御・反撃の音と動きを追加しました。反撃が通った時は短い止めと押し返す動きで強調し、決着は2手の結果が出そろってから表示します。
効果音のON/OFFと動きを控える設定を用意しています。
戦闘の結果・支払い・保存形式は変えず、r12のバッグ全体絵と回転表示も引き継いでいます。

## 必要な環境と接続

Windows向けテスト版です。従来と同じ .NET Framework 4.8 と Microsoft Edge WebView2 Runtime が必要です。
友だちとは同じ版を使用し、ホストのアプリを開いたままにしてください。
別PC・別回線の接続と人間の面白さ評価は継続確認中です。
''',encoding='utf-8')
 new={'schema':1,'buildId':BUILD,'createdUtc':'2026-11-04T00:00:00Z','nodeVersion':manifest['nodeVersion'],'port':manifest['port'],'rendering':manifest['rendering'],'webView2Sdk':manifest['webView2Sdk'],'baselineZipSHA256':BASE_SHA,'sourceCommit':os.environ.get('GITHUB_SHA','local-uncommitted'),'files':[]}
 for name in original_paths+sorted(ADDED):
  assert name not in ADDED or name not in original_paths,'Added file already in manifest'
  p=stage/name;new['files'].append({'path':name,'bytes':p.stat().st_size,'sha256':sha(p)})
 (stage/'manifest.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (OUT/'BuildStamp.cs').write_text('internal static class BuildStamp { internal const string Id = "'+BUILD+'"; internal const string ManifestHash = "'+sha(stage/'manifest.json')+'"; }\n')
 (OUT/'preparation.json').write_text(json.dumps({'buildId':BUILD,'manifestSHA256':sha(stage/'manifest.json'),'changes':changes,'sourceCommit':new['sourceCommit']},indent=2))
 print(stage)

if __name__=='__main__':prepare()
