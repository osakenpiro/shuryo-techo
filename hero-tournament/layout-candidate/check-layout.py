from pathlib import Path
import subprocess,json,hashlib,sys,socket
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent;ROOT=Path(sys.argv[2]).resolve();ROOT.mkdir(parents=True,exist_ok=True);STAGE=Path(sys.argv[1]).resolve();E=HERE/'fixtures'
with socket.socket() as sock:
 sock.bind(('127.0.0.1',0));PORT=sock.getsockname()[1]
reports=[]
def stable(page):page.evaluate('document.fonts.ready');page.wait_for_timeout(150)
def toggle(page,css,on):page.locator('link[href="'+css+'"]').evaluate('(e,on)=>e.disabled=!on',on);stable(page)
def capture(page,name):page.screenshot(path=str(ROOT/(name+'.png')))
def native_geometry(page,scene):
 return page.evaluate('''scene=>{const w=document.querySelector('.workspace').getBoundingClientRect(),els=[...document.querySelectorAll(scene==='reward'?'.loot-choice > strong,.loot-choice > p,.loot-choice > small,.loot-choice .choice-take':'.growth-crest > strong,.growth-change,.growth-crest > small,.growth-crest .choice-take')];return {workspace:{top:w.top,bottom:w.bottom},fields:els.map(e=>{let r=e.getBoundingClientRect();return {text:e.innerText,top:r.top,bottom:r.bottom,visible:r.top>=w.top&&r.bottom<=w.bottom&&r.width>0}}),bodyOverflow:document.documentElement.scrollWidth>innerWidth}}''',scene)
proc=subprocess.Popen(['node',str(STAGE/'desktop-host.mjs'),str(PORT),'layout-review','local-layout'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
try:
 assert proc.stdout.readline().startswith('READY ')
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for scene,checkpoint in [('reward','reward-choice'),('growth','growth-mid-2')]:
   saved=json.loads((E/(scene+'-state.json')).read_text())
   for width,height in [(1028,719),(1280,870)]:
    context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    table='layout-'+scene;key='hero-supply-review-v1:'+table+':review'
    context.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(saved))+');')
    page.goto(f'http://127.0.0.1:{PORT}/index.html?table={table}&traveler=review#road',wait_until='networkidle');page.wait_for_function('window.heroJourney?.snapshot()?.journey?.stage==='+json.dumps(scene))
    toggle(page,'native-layout-review.css',False);page.locator('.workspace').evaluate('(e)=>e.scrollTop=0');stable(page)
    before=page.evaluate('window.heroJourney.snapshot()');bg=native_geometry(page,scene)
    capture(page,f'{scene}-{width}-before')
    toggle(page,'native-layout-review.css',True);page.locator('.workspace').evaluate('(e)=>e.scrollTop=0');stable(page)
    ag=native_geometry(page,scene);after=page.evaluate('window.heroJourney.snapshot()');capture(page,f'{scene}-{width}-after')
    assert before==after,(scene,'state changed from stylesheet')
    assert len(ag['fields'])==12 and all(x['visible'] for x in ag['fields']),(scene,width,ag)
    assert not ag['bodyOverflow'];assert not errors,errors
    # Exercise the existing choice handler and confirm a real state transition.
    if scene=='reward':page.locator('.loot-choice').first.click();page.wait_for_function('window.heroJourney.snapshot().journey.stage!=="reward"')
    else:page.locator('.growth-crest.hp').click();page.wait_for_function('window.heroJourney.snapshot().run.maxHp==='+str(saved['run']['maxHp']+5))
    reports.append({'scene':scene,'viewport':[width,height],'before':bg,'after':ag,'stateUnchangedByCSS':True,'choiceClick':'PASS','errors':errors});context.close()
  context=browser.new_context(viewport={'width':1028,'height':719});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{PORT}/room.html?mode=tutorial&new=1',wait_until='networkidle');page.wait_for_function('window.heroRoom?.snapshot()?.phase==="supply"')
  toggle(page,'room-layout-review.css',False)
  def click(sel):page.locator(sel).first.click();page.wait_for_function('!window.heroRoom.ui().busy')
  claim=page.locator('[data-claim]:not(:disabled)')
  if claim.count():claim.first.click();page.wait_for_function('!window.heroRoom.ui().busy')
  click('[data-room="OPEN_CRATE"]');click('[data-room="AUTO_PACK"]');click('[data-room="PACK_READY"]')
  page.wait_for_function('window.heroRoom.snapshot().phase==="semi"')
  ids=page.evaluate('async()=>{const P=await import("/battle-policy.js");let v=window.heroRoom.snapshot();return P.choosePlan(v.state,{...v.duel,signals:["physical","magic"]});}')
  for uid in ids[:2]:click('[data-action="ORDER_PICK"][data-uid="'+uid+'"]')
  def room_geometry():return page.evaluate('''()=>{const bottom=document.querySelector('#room-board').getBoundingClientRect().top;return {footerTop:bottom,cards:[...document.querySelectorAll('.ordered-card')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,visible:r.top>=0&&r.bottom<=bottom,text:e.innerText}}),coach:document.querySelector('[data-practice-title]')?.innerText,overflow:document.documentElement.scrollWidth>innerWidth};}''')
  for width,height in [(1028,719),(1280,870)]:
   page.set_viewport_size({'width':width,'height':height});toggle(page,'room-layout-review.css',False);page.evaluate('scrollTo(0,0)');stable(page);before=page.evaluate('({state:window.heroRoom.snapshot().state,draft:window.heroRoom.ui().draft})');bg=room_geometry();capture(page,f'hand-{width}-before')
   toggle(page,'room-layout-review.css',True);page.evaluate('scrollTo(0,0)');stable(page);ag=room_geometry();capture(page,f'hand-{width}-after');after=page.evaluate('({state:window.heroRoom.snapshot().state,draft:window.heroRoom.ui().draft})');assert before==after
   assert len(ag['cards'])==5 and all(x['visible'] for x in ag['cards']),(width,ag)
   assert not ag['overflow'];assert '③' in ag['coach']
   reports.append({'scene':'hand','viewport':[width,height],'before':bg,'after':ag,'stateUnchangedByCSS':True})
  click('[data-action="ORDER_PICK"][data-uid="'+ids[2]+'"]');click('[data-action="ORDER_CONFIRM"]');page.wait_for_function('document.querySelector("#combat-answer")?.dataset.ready==="true"');assert not errors,errors
  reports[-1]['sealAndReveal']='PASS';context.close();browser.close()
finally:proc.communicate('stop\n',timeout=10)
(ROOT/'layout-check.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2));print([{k:v for k,v in x.items() if k not in ['before','after']} for x in reports])
