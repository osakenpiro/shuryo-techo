"""Check layout from real WebView2 checkpoints, not reconstructed states."""
import json,pathlib,sys
root=pathlib.Path(sys.argv[1]);output=pathlib.Path(sys.argv[2]);hands=[];choices=[]
for p in root.rglob('*.json'):
 try:v=json.loads(p.read_text(encoding='utf-8-sig'))
 except (ValueError,UnicodeError):continue
 d=v.get('detail') or {};g=d.get('geometry');s=d.get('snapshot') or {}
 if p.name.endswith('three-picks.json') and isinstance(g,dict):
  cards=g.get('cards') or [];footers=g.get('footer') or [];viewport=g.get('viewport') or {}
  assert len(cards)==5 and len(footers)==1,p.name
  bottom=footers[0]['y'];assert all(c['height']>0 and c['y']>=-1 and c['bottom']<=bottom+1 for c in cards),(p.name,cards,bottom)
  assert g.get('cardBadgeOverlap') is False and g['documentWidth']<=viewport['width']+1,p.name
  hands.append({'file':p.relative_to(root).as_posix(),'footerTop':bottom,'cardBottoms':[c['bottom'] for c in cards]})
 if isinstance(g,list):
  state=s.get('state') or {};scene=(state.get('journey') or {}).get('stage')
  if scene not in ('reward','growth'):continue
  geometry={x['selector']:x.get('rect') for x in g};workspace=geometry.get('.workspace');assert workspace,p.name
  prefix='.loot-choice' if scene=='reward' else '.growth-crest';fields=['strong','p','small','.choice-take'] if scene=='reward' else ['strong','.growth-change','small','.choice-take'];rects=[]
  for n in [1,2,3]:
   for field in fields:
    selector=f'{prefix}:nth-child({n}) > {field}';r=geometry.get(selector);assert r,(p.name,selector,'missing actual telemetry')
    assert r['height']>0 and r['width']>0 and r['y']>=workspace['y']-1 and r['bottom']<=workspace['bottom']+1 and r['x']>=workspace['x']-1 and r['x']+r['width']<=workspace['x']+workspace['width']+1,(p.name,selector,r,workspace)
    rects.append({'selector':selector,'bottom':r['bottom']})
  choices.append({'file':p.relative_to(root).as_posix(),'scene':scene,'workspaceBottom':workspace['bottom'],'fields':rects})
assert hands,'No real native hand checkpoints'
assert any(x['scene']=='reward' for x in choices),'No real native reward checkpoints'
assert any(x['scene']=='growth' for x in choices),'No real native growth checkpoints'
result={'kind':'actual Windows WebView2 checkpoint bounds','handCheckpoints':len(hands),'choiceCheckpoints':len(choices),'hands':hands,'choices':choices,'pass':True}
output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Native visible-layout PASS:',len(hands),'hands,',len(choices),'reward/growth')
