"""Check actual Windows DOM readouts against the live engine shape and bag grid."""
import json,math,pathlib,re,sys
root=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);records=[];kinds=set()
for p in root.rglob('*.json'):
 j=json.loads(p.read_text(encoding='utf-8-sig'));b=j.get('detail',{}).get('bagOccupancy')
 if not b or not b['expected']:continue
 assert all(math.isfinite(b['layer'][k]) for k in ['x','y','width','height']) and b['layer']['width']>0 and b['layer']['height']>0,(p,'invisible layer dimensions')
 ex={i['id']:i for i in b['expected']};actual={i['id']:i for i in b['objects']}
 assert len(ex)==len(b['expected']) and len(actual)==len(b['objects']) and ex.keys()==actual.keys(),str(p)+' item set'
 for ident,i in ex.items():
  c=actual[ident]['contour'];f=actual[ident]['fill'];assert c and f,(p,ident,'missing footprint')
  cells={tuple(v) for v in i['cells']};w=max(x for x,y in cells)+1;h=max(y for x,y in cells)+1
  assert [float(v) for v in c['viewBox'].split()]==[0,0,w,h],(p,ident,'viewBox')
  # Compare undirected exposed segments, independently cancelling shared cell edges.
  edges=set()
  for x,y in cells:
   corners=[(x,y),(x+1,y),(x+1,y+1),(x,y+1)]
   for a,z in zip(corners,corners[1:]+corners[:1]):
    edge=tuple(sorted([a,z]));edges.symmetric_difference_update({edge})
  matches=re.findall(r'M(\d+) (\d+)L(\d+) (\d+)',c['d'] or '')
  assert ''.join('M'+a+' '+z+'L'+v+' '+q for a,z,v,q in matches)==c['d'],(p,ident,'unexpected SVG commands')
  observed=[tuple(sorted([(int(a),int(z)),(int(v),int(q))])) for a,z,v,q in matches]
  assert len(observed)==len(set(observed)) and set(observed)==edges,(p,ident,'exposed edges')
  fills=re.findall(r'M(\d+) (\d+)h1v1h-1z',f['d'] or '')
  assert ''.join('M'+a+' '+z+'h1v1h-1z' for a,z in fills)==f['d'] and len(fills)==len(cells) and {(int(a),int(z)) for a,z in fills}==cells,(p,ident,'fill cells')
  l=b['layer'];pos=i['placement'];expected={'x':l['x']+pos['x']/b['width']*l['width'],'y':l['y']+pos['y']/b['height']*l['height'],'width':w/b['width']*l['width'],'height':h/b['height']*l['height']}
  for render in [c,f]:
   assert all(math.isfinite(render['rect'][k]) for k in ['x','y','width','height']) and render['rect']['width']>0 and render['rect']['height']>0,(p,ident,'invisible footprint dimensions')
   assert render['paintVisible'] is True,(p,ident,'hidden footprint ancestor')
   assert all(abs(render['rect'][key]-value)<1.1 for key,value in expected.items()),(p,ident,'board geometry',render['rect'],expected)
   assert render['pointerEvents']=='none',(p,ident,'input interception')
  assert c['stroke']!='none' and float(c['strokeWidth'].removesuffix('px'))>=1 and float(c['opacity'])>0,(p,ident,'invisible contour')
 kinds.add(b['kind']);records.append({'checkpoint':str(p.relative_to(root)),'kind':b['kind'],'items':len(ex)})
assert kinds=={'main','room'},'Missing main/room actual native bag readouts'
assert any(r['items']>=2 and r['kind']=='main' for r in records),'Missing multi-item main bag'
assert any(r['items']>=2 and r['kind']=='room' for r in records),'Missing multi-item room bag'
out.write_text(json.dumps({'pass':True,'kind':'actual Windows engine-shape / SVG / logical-grid / input-transparency checks','checkpoints':records},indent=2)+'\n')
print('Native bag occupancy PASS:',len(records),'checkpoints')
