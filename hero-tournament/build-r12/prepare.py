"""Rebuild from the pinned public r11d payload; preserve the native launcher contract."""
import hashlib,json,os,pathlib,shutil,sys,urllib.request,zipfile

HERE=pathlib.Path(__file__).resolve().parent
OUT=pathlib.Path(sys.argv[1]).resolve()
BUILD='ht-windows-20261104-r12'
BASE_URL='https://github.com/osakenpiro/shuryo-techo/releases/download/hero-tournament-r11d/hero-tournament-windows-r11d.zip'
BASE_SHA='5c725276eca91d86abab965e4525b8d0725dd7e653f59c915241c9b83cc4c0a5'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def prepare():
 OUT.mkdir(parents=True,exist_ok=True)
 archive=OUT/'baseline.zip'
 if not archive.exists():urllib.request.urlretrieve(BASE_URL,archive)
 assert sha(archive)==BASE_SHA,'Baseline ZIP hash mismatch'
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None,'Baseline CRC failure'
  target=OUT/'extracted'
  for info in z.infolist():
   dest=(target/info.filename).resolve()
   assert dest.is_relative_to(target),'Unsafe archive path'
  z.extractall(target)
 stage=OUT/'HeroTournament-Windows-r12'
 shutil.copytree(OUT/'extracted/HeroTournament-Windows-r11d',stage)
 manifest=json.loads((stage/'manifest.json').read_text(encoding='utf-8-sig'))
 for f in manifest['files']:
  p=stage/f['path'];assert p.stat().st_size==f['bytes'] and sha(p)==f['sha256'],f['path']
 # Keep the old engine imports together for the before/after comparison.
 old=OUT/'baseline-game';old.mkdir()
 for p in (stage/'game').glob('*.js'):shutil.copyfile(p,old/p.name)
 changes=json.loads((HERE/'overrides.json').read_text())
 assert {f['path'] for f in changes}=={'game/ordered-combat.js','game/experience-ui.css','game/room-ui.js','game/room.css','game/adventure-core.js','game/room-combat.js'}
 for f in changes:
  p=stage/f['path'];candidate=HERE/'overrides'/f['path']
  assert sha(p)==f['baselineSHA256'],f['path']+' baseline drift'
  assert sha(candidate)==f['candidateSHA256'],f['path']+' candidate drift'
  shutil.copyfile(candidate,p)
 readme=stage/'README.md'
 text=readme.read_text(encoding='utf-8-sig').replace('r11d','r12').replace('20261023','20261104')
 text='''# 勇者トーナメント Windows r12

ZIPをすべて展開し、HeroTournament.exe を起動してください。
以前の版を閉じてから、新しい版を開いてください。

今回の更新：バッグの道具を全体絵で表示し、回転・選択できるように復元。
2手の封印前に、使用後の魔力・耐久と持ち越す札を確認できます。
作戦を組めない手札の時だけ、既存の基本札を最少枚繰り入れて進行停止を防ぎます。
通常の支払い・勝敗計算と既存の保存形式は維持しています。

Windows向けテスト版です。別PC・別回線の接続と人間の面白さ評価は継続確認中です。
接続中はホストのアプリを開いたままにしてください。

## 従来の導入と操作

'''+text
 readme.write_text(text,encoding='utf-8')
 new={'schema':1,'buildId':BUILD,'createdUtc':'2026-11-04T00:00:00Z','nodeVersion':manifest['nodeVersion'],'port':manifest['port'],'rendering':manifest['rendering'],'webView2Sdk':manifest['webView2Sdk'],'baselineZipSHA256':BASE_SHA,'sourceCommit':os.environ.get('GITHUB_SHA','local-uncommitted'),'files':[]}
 for f in manifest['files']:
  p=stage/f['path'];new['files'].append({'path':f['path'],'bytes':p.stat().st_size,'sha256':sha(p)})
 (stage/'manifest.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (OUT/'BuildStamp.cs').write_text('internal static class BuildStamp { internal const string Id = "'+BUILD+'"; internal const string ManifestHash = "'+sha(stage/'manifest.json')+'"; }\n')
 (OUT/'preparation.json').write_text(json.dumps({'buildId':BUILD,'manifestSHA256':sha(stage/'manifest.json'),'changes':changes,'sourceCommit':new['sourceCommit']},indent=2))
 print(stage)

if __name__=='__main__':prepare()
