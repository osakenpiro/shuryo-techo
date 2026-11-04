"""Independent r14/r15 inventory QA. Synthetic fixtures and normal UI play are reported separately.
No production source writes. Candidate stage must be prepared by the release executor.
"""
import argparse,json,pathlib,subprocess,socket,hashlib,time,urllib.request,traceback
from playwright.sync_api import sync_playwright
BASE=pathlib.Path('/workspace/work/hero-r14-verified-stage/HeroTournament-Windows-r14')
CAND=pathlib.Path('/workspace/work/hero-r15-local/HeroTournament-Windows-r15')
OUT=pathlib.Path('/workspace/work/r15-bag-browser-evidence')
HOST=r'''import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import{pathToFileURL}from'node:url';
const[root,portText,mode]=process.argv.slice(2),port=Number(portText),game=path.join(root,'game');
const C=await import(pathToFileURL(path.join(game,'material-core.js'))),P=await import(pathToFileURL(path.join(game,'preparation-core.js'))),{Rooms}=await import(pathToFileURL(path.join(game,'room-engine.js'))),{roomAPI}=await import(pathToFileURL(path.join(game,'room-http.js')));
let overlap=false;
function fixture(){let s=P.createPreparation('r15-fixed-occupancy-fixture');s.supplies.stage='pack';s.supplies.dealt=true;s.supplies.dealCount=9;s.phase='pack';s.tutorial={version:1,enabled:false,seen:[],complete:true};s.run.coin=3;s.run.items=[];
 const rows=[['AXE','IRON_AXE',0,0,0],['GAP','FIELD_RATION',1,1,0],['BOOT','MAGE_BOOTS',2,0,0],['POTION','POTION',4,0,0],['KNIFE','KNIFE',5,0,0],['SHIELD','SHIELD',2,3,0],['FLASK','MANA_FLASK',4,3,1],['LOOSE','SCOUT_CHARM',null,null,0],['FOOD','FIELD_RATION',null,null,0]];
 if(overlap){s.pocket={x:4,y:4,capacity:2};rows.push(['POCKET-A','FIELD_RATION',4,4,0],['POCKET-B','FAIRY_POCKET',4,4,0]);}
 for(const[id,defId,x,y,r]of rows){const i={id,defId,placement:null,durability:C.DEFS[defId].weapon?.durability??null};s.run.items.push(i);if(x!==null)s=C.move(s,id,{x,y,rotation:r});}
 P.restore(s);return s;}
class FixtureRooms extends Rooms{command(token,input){const result=super.command(token,input);if(mode!=='fixture'||input.type!=='OPEN_CRATE')return result;const{room,seat}=this.auth(token);seat.state=fixture();return this.project(room,seat);}}
const api=roomAPI({origin:'http://127.0.0.1:'+port,rooms:new FixtureRooms()});
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://127.0.0.1:'+port);if(u.pathname==='/__fixture'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Isolated synthetic fixture loader</title>');return;}if(u.pathname==='/__fixture-mode'){overlap=u.searchParams.get('overlap')==='1';res.end('OK');return;}if(u.pathname==='/__fixture-state'){res.setHeader('content-type','application/json');res.end(JSON.stringify(fixture()));return;}if(await api(req,res))return;const rel=decodeURIComponent(u.pathname).replace(/^\//,'')||'desktop.html',p=path.resolve(game,rel);if(!p.startsWith(path.resolve(game)+path.sep)){res.writeHead(403);res.end();return;}const data=await fs.readFile(p);res.setHeader('content-type',mime[path.extname(p)]||'application/octet-stream');res.end(data);}catch(e){res.writeHead(404);res.end(e.message);}});
server.listen(port,'127.0.0.1',()=>console.log('READY '+port));process.stdin.on('data',()=>server.close(()=>process.exit(0)));process.stdin.on('end',()=>server.close(()=>process.exit(0)));
'''
def port():
 s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
class Server:
 def __init__(self,stage,mode='fixture'):
  self.port=port();self.url=f'http://127.0.0.1:{self.port}';self.proc=subprocess.Popen(['node',str(OUT/'fixture-host.mjs'),str(stage),str(self.port),mode],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);ready=self.proc.stdout.readline();assert ready.startswith('READY'),ready+self.proc.stderr.read()
 def close(self):
  try:self.proc.communicate('stop\n',timeout=10)
  except subprocess.TimeoutExpired:self.proc.kill()
def snapshot(page,kind):return page.evaluate('heroSupplies.snapshot().state' if kind=='main' else 'heroRoom.snapshot().state')
def logical(s):return {k:s.get(k) for k in ['width','height','run','pocket','upgrades','supplies']}
def wait_ready(page,kind):
 page.wait_for_function('window.heroSupplies?.snapshot()?.state.supplies.stage==="pack"' if kind=='main' else 'window.heroRoom?.snapshot()?.state.supplies.stage==="pack" && !heroRoom.ui().busy')
def click(page,kind,selector):
 page.locator(selector).first.click();
 if kind=='room':page.wait_for_function('!heroRoom.ui().busy')
def selected(page,kind):return page.evaluate('heroSupplies.placement().selected' if kind=='main' else 'heroRoom.ui().selected')
def clear(page,kind):
 if selected(page,kind) is not None:click(page,kind,'#cancel-selection' if kind=='main' else '[data-room="CLEAR"]')
 page.mouse.move(3,3)
def get_item(page,kind,id):return next(i for i in snapshot(page,kind)['run']['items'] if i['id']==id)
def select(page,kind,id):
 clear(page,kind);click(page,kind,('.bag-object[data-item="'+id+'"] .cell-hit' if get_item(page,kind,id)['placement'] else '.supply-item[data-item="'+id+'"]') if kind=='main' else '[data-select="'+id+'"]');assert selected(page,kind)==id

def fixture_page(browser,server,kind,width,height,overlap):
 c=browser.new_context(viewport={'width':width,'height':height});p=c.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
 urllib.request.urlopen(server.url+f'/__fixture-mode?overlap={int(overlap)}').read()
 if kind=='main':
  p.goto(server.url+'/__fixture');p.evaluate('''async()=>{const s=await(await fetch('/__fixture-state')).json();localStorage.setItem('hero-supply-review-v1:r15-fixture:qa',JSON.stringify(s));}''');p.goto(server.url+'/index.html?table=r15-fixture&traveler=qa#pack')
 else:
  p.goto(server.url+'/room.html?mode=practice&new=1');p.wait_for_function('window.heroRoom?.snapshot()?.phase==="supply"');click(p,kind,'[data-room="OPEN_CRATE"]')
 wait_ready(p,kind);p.wait_for_timeout(120);return c,p,errs

GEOMETRY=r'''async(kind)=>{const C=await import('/material-core.js'),s=kind==='main'?heroSupplies.snapshot().state:heroRoom.snapshot().state,board=document.querySelector(kind==='main'?'#bag-board':'.room-bag'),layer=board.querySelector(kind==='main'?'.bag-objects':'.room-bag-objects'),br=layer.getBoundingClientRect(),objectSelector=kind==='main'?'.bag-object':'.room-packed-object:not(.room-object-preview)';return {board:{x:br.x,y:br.y,width:br.width,height:br.height},items:s.run.items.filter(i=>i.placement).map(i=>{const e=board.querySelector(objectSelector+(kind==='main'?'[data-item="'+i.id+'"]':'[data-packed-id="'+i.id+'"]')),c=C.shape(i.defId,i.placement.rotation),svg=e?.querySelector('.bag-occupancy-contour'),r=svg?.getBoundingClientRect(),fill=e?.querySelector('.bag-occupancy-fill');return {id:i.id,placement:i.placement,cells:c,expected:{x:br.x+i.placement.x*br.width/s.width,y:br.y+i.placement.y*br.height/s.height,width:(Math.max(...c.map(p=>p[0]))+1)*br.width/s.width,height:(Math.max(...c.map(p=>p[1]))+1)*br.height/s.height},contour:r?{x:r.x,y:r.y,width:r.width,height:r.height,pointerEvents:getComputedStyle(svg).pointerEvents,z:getComputedStyle(svg).zIndex,viewBox:svg.getAttribute('viewBox'),d:svg.querySelector('path').getAttribute('d'),stroke:getComputedStyle(svg).stroke,strokeWidth:getComputedStyle(svg).strokeWidth}:null,fill:!!fill,wholeArt:!!e?.querySelector(kind==='main'?'.packed-illustration':'.room-packed-illustration'),rootPointer:e?getComputedStyle(e).pointerEvents:null};})};}'''

def geometry_assert(data,candidate):
 assert len(data['items'])>=2
 for i in data['items']:
  assert i['wholeArt'],i
  if candidate:
   assert i['contour'] and i['fill'],i
   assert i['contour']['pointerEvents']=='none',i
   for k in ['x','y','width','height']:assert abs(i['contour'][k]-i['expected'][k])<1.4,(i['id'],k,i['contour'],i['expected'])
   w=max(x for x,y in i['cells'])+1;h=max(y for x,y in i['cells'])+1;assert i['contour']['viewBox']==f'0 0 {w} {h}',i
   expected=[];occupied=set(map(tuple,i['cells']))
   for x,y in i['cells']:
    if (x,y-1) not in occupied:expected.append(f'M{x} {y}L{x+1} {y}')
    if (x+1,y) not in occupied:expected.append(f'M{x+1} {y}L{x+1} {y+1}')
    if (x,y+1) not in occupied:expected.append(f'M{x+1} {y+1}L{x} {y+1}')
    if (x-1,y) not in occupied:expected.append(f'M{x} {y+1}L{x} {y}')
   assert i['contour']['d']==''.join(expected),i
  else:assert i['contour'] is None,i

def shot(p,kind,path):
 p.mouse.move(3,3);p.locator('#bag-board' if kind=='main' else '.room-bag').scroll_into_view_if_needed();p.wait_for_timeout(80);p.screenshot(path=str(path));p.locator('#bag-board' if kind=='main' else '.room-bag').screenshot(path=str(path.with_name(path.stem+'-bag.png')))

def interactive_checks(p,kind,candidate):
 result={};start=logical(snapshot(p,kind));clear(p,kind)
 # Cell in the axe's rectangular bounds but outside its L belongs to the separate ration.
 if kind=='main':click(p,kind,'.bag-object[data-item="GAP"] .cell-hit')
 else:click(p,kind,'[data-cell="1,1"]')
 assert selected(p,kind)=='GAP';clear(p,kind);assert logical(snapshot(p,kind))==start;result['L-hole-neighbor-selected']='GAP'
 # Free L hole of the boot must accept a separate 1-cell item, with ordinary UI input.
 select(p,kind,'LOOSE');click(p,kind,'[data-cell="3,0"]');clear(p,kind)
 assert get_item(p,kind,'LOOSE')['placement']=={'x':3,'y':0,'rotation':0};result['free-L-hole-placement']={'x':3,'y':0}
 # Every cardinal rotation is committed through real rotate/placement controls at a clear area.
 rotations=[]
 for rotation in range(4):
  select(p,kind,'BOOT')
  click(p,kind,'[data-manipulate="unpack"]' if kind=='main' else '[data-room="UNPACK"]');clear(p,kind);select(p,kind,'BOOT')
  for n in range(rotation):click(p,kind,'[data-manipulate="rotate"]' if kind=='main' else '[data-room="ROTATE"]')
  before=logical(snapshot(p,kind));current=p.evaluate('heroSupplies.placement()' if kind=='main' else 'heroRoom.ui()');assert current['rotation']==rotation;assert logical(snapshot(p,kind))==before
  # Original boot footprint spans columns2-3, rows0-1; moving it to row1/col2 stays free except the loose L-gap above.
  click(p,kind,'[data-cell="2,1"]');clear(p,kind);assert get_item(p,kind,'BOOT')['placement']=={'x':2,'y':1,'rotation':rotation}
  data=p.evaluate(GEOMETRY,kind);geometry_assert(data,candidate);rotations.append({'rotation':rotation,'contour':next(i for i in data['items'] if i['id']=='BOOT')['contour']})
 result['rotations']=rotations
 # Select an existing item, inspect the stronger selected outline, and preview an invalid edge.
 select(p,kind,'AXE');before=logical(snapshot(p,kind));
 if candidate:
  e=p.locator(('.bag-object[data-item="AXE"]' if kind=='main' else '.room-packed-object[data-packed-id="AXE"]')+' .bag-occupancy-contour');result['selectedStroke']=e.evaluate('(e)=>({stroke:getComputedStyle(e).stroke,width:getComputedStyle(e).strokeWidth})');assert result['selectedStroke']['width']=='3px'
 p.locator('[data-cell="5,4"]').hover();p.wait_for_timeout(50)
 if kind=='main':
  assert p.locator('.placement-preview.invalid').count()==1;result['invalidPreview']=p.locator('.placement-preview.invalid span').first.evaluate('(e)=>({z:getComputedStyle(e.parentElement).zIndex,background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow})')
 else:
  assert p.locator('.room-cell.preview-invalid').count()>0;result['invalidPreview']=p.locator('.room-cell.preview-invalid').first.evaluate('(e)=>({shadow:getComputedStyle(e).boxShadow,background:getComputedStyle(e).backgroundColor})');assert '3px' in result['invalidPreview']['shadow']
 assert logical(snapshot(p,kind))==before;clear(p,kind);result['previewDidNotMutateState']=True
 # Repack invokes the normal algorithm, then all contours must follow the actual new state.
 if kind=='room':click(p,kind,'[data-room="AUTO_PACK"]');clear(p,kind);geometry_assert(p.evaluate(GEOMETRY,kind),candidate);result['repack']='ordinary AUTO_PACK accepted'
 return result

def normal_solo(browser,server):
 c=browser.new_context(viewport={'width':1028,'height':719});p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(server.url+'/room.html?mode=practice&new=1');p.wait_for_function('window.heroRoom?.snapshot()?.phase==="supply"')
 def btn(s):click(p,'room',s)
 claims=p.locator('[data-claim]:not(:disabled)')
 if claims.count():btn('[data-claim="'+claims.first.get_attribute('data-claim')+'"]')
 btn('[data-room="OPEN_CRATE"]');btn('[data-room="AUTO_PACK"]');clear(p,'room');initial=logical(snapshot(p,'room'));geometry_assert(p.evaluate(GEOMETRY,'room'),True);shot(p,'room',OUT/'normal-solo-packing.png');assert logical(snapshot(p,'room'))==initial;btn('[data-room="PACK_READY"]');rounds=0
 for step in range(120):
  p.wait_for_function('heroRoom.snapshot()&&!heroRoom.ui().busy');v=p.evaluate('heroRoom.snapshot()')
  if v['phase']=='complete':break
  if v['phase']=='intermission':
   mine=next(x for x in v['seats'] if x['id']==v['you'])
   if not mine['nextReady']:btn('[data-room="AUTO_PACK"]');btn('[data-room="PACK_READY"]')
   else:p.wait_for_timeout(80)
   continue
  if v['phase'] not in ['semi','final'] or v['match']['done'] or v.get('ack'):p.wait_for_timeout(80);continue
  if v['duel'].get('reveal'):
   if p.locator('[data-answer-finish]').count() and p.locator('[data-answer-finish]').is_visible():btn('[data-answer-finish]')
   btn('[data-action="ORDER_NEXT"]');rounds+=1;continue
  if v['sealed']:p.wait_for_timeout(80);continue
  ids=p.evaluate('''async()=>{const{choosePlan}=await import('/battle-policy.js');const v=heroRoom.snapshot();return choosePlan(v.state,{...v.duel,signals:['physical','magic']});}''')
  for uid in ids:btn('[data-action="ORDER_PICK"][data-uid="'+uid+'"]')
  btn('[data-action="ORDER_CONFIRM"]')
 else:raise AssertionError('normal solo finite bound')
 final=p.evaluate('heroRoom.snapshot()');assert final['phase']=='complete';assert len(final['ranking'])==4;assert not errors;shot(p,'room',OUT/'normal-solo-result.png') if p.locator('.room-bag').count() else p.screenshot(path=str(OUT/'normal-solo-result.png'));c.close();return {'kind':'normal randomized stock; ordinary room UI buttons with public own-state choosePlan; not synthetic fixture or native Windows','rounds':rounds,'complete':True,'errors':errors}

def source_hashes(stage):
 names=['bag-occupancy.js','bag-occupancy.css','material-ui.js','room-ui.js','index.html','room.html']
 return {name:hashlib.sha256((stage/'game'/name).read_bytes()).hexdigest() if (stage/'game'/name).exists() else None for name in names}

def main():
 global OUT
 parser=argparse.ArgumentParser();parser.add_argument('--baseline',type=pathlib.Path,default=BASE);parser.add_argument('--candidate',type=pathlib.Path,default=CAND);parser.add_argument('--out',type=pathlib.Path,default=OUT);parser.add_argument('--prepare-only',action='store_true');parser.add_argument('--no-normal-play',action='store_true');args=parser.parse_args();OUT=args.out;OUT.mkdir(exist_ok=True,parents=True);(OUT/'fixture-host.mjs').write_text(HOST)
 if args.prepare_only:print('Prepared fixture host; candidate ready:',(args.candidate/'game/bag-occupancy.js').exists());return
 assert (args.candidate/'game/bag-occupancy.js').exists(),'Candidate stage not prepared yet'
 report={'kind':'independent Linux Chromium inventory geometry/UI checks; synthetic fixtures and normal-play separately labeled','comparisons':[],'normalPlay':None,'pass':False,'sourceSHA256':{'r14':source_hashes(args.baseline),'r15':source_hashes(args.candidate)}};servers=[]
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
   fingerprints={}
   for name,stage,candidate in [('r14',args.baseline,False),('r15',args.candidate,True)]:
    srv=Server(stage);servers.append(srv)
    for kind in ['main','room']:
     for overlap in [False,True]:
      for w,h in [(1028,719),(1280,870)]:
       context,p,errors=fixture_page(browser,srv,kind,w,h,overlap);state=logical(snapshot(p,kind));fingerprint=json.dumps(state,sort_keys=True,ensure_ascii=False);k=(kind,overlap,w,h)
       if name=='r14':fingerprints[k]=fingerprint
       else:assert fingerprints[k]==fingerprint,'Baseline/candidate fixture differs'
       clear(p,kind);shot(p,kind,OUT/f'{name}-{kind}-{"pocket" if overlap else "standard"}-{w}.png');geom=p.evaluate(GEOMETRY,kind);geometry_assert(geom,candidate);assert logical(snapshot(p,kind))==state
       item={'build':name,'renderer':kind,'overlap':overlap,'viewport':[w,h],'geometry':geom,'idleRenderingStateUnchanged':True,'errors':errors}
       if not overlap and w==1280:item['interactions']=interactive_checks(p,kind,candidate)
       assert not errors,errors;report['comparisons'].append(item);context.close();print(name,kind,overlap,w,'PASS',flush=True)
   if not args.no_normal_play:
    srv=Server(args.candidate,'normal');servers.append(srv);report['normalPlay']=normal_solo(browser,srv);print('normal solo PASS',flush=True)
   browser.close()
  assert report['sourceSHA256']=={'r14':source_hashes(args.baseline),'r15':source_hashes(args.candidate)},'Source changed during browser comparison'
  report['pass']=True
 except Exception as e:
  report['error']=str(e);report['traceback']=traceback.format_exc();raise
 finally:
  for srv in servers:srv.close()
  (OUT/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('PASS',len(report['comparisons']))
if __name__=='__main__':main()
