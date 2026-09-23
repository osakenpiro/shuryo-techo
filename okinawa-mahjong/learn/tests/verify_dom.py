"""DOM/browser tests via set_content. Navigation policy blocked local HTTP/file URLs.
Storage persistence and helper availability are explicit mocks, not live-service tests.
Run: python verify_dom.py [path/to/index.html]
Requires: playwright plus Chromium (CHROMIUM_BIN or /usr/bin/chromium).
"""
import json, pathlib, sys, os
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'index.html'
HTML=SOURCE.read_text(encoding='utf-8')
results=[];errors=[]
def ok(name,condition):
 assert condition,name
 results.append({'test':name,'result':'PASS'})
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 def load(hash='home',store=None,helper=False,blocked=False,width=390):
  page=b.new_page(viewport={'width':width,'height':844})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate('s=>{window.__store=s;window.__requests=[];}',store or {})
  if not blocked:
   page.evaluate("Object.defineProperty(window,'localStorage',{value:{getItem:k=>window.__store[k]??null,setItem:(k,v)=>window.__store[k]=String(v)},configurable:true})")
  page.evaluate('ready=>{window.__helperReady=ready;window.fetch=async url=>{window.__requests.push(url);return {ok:window.__helperReady,text:async()=>"役一覧・点数"}}}',helper)
  page.evaluate('h=>location.hash=h',hash)
  page.set_content(HTML,wait_until='load')
  page.wait_for_function("document.querySelector('#helper-state').textContent !== 'ヘルパーの接続を確認しています。'")
  return page
 def nav(page,hash):
  page.evaluate('h=>location.hash=h',hash)
  page.wait_for_timeout(35)
 page=load()
 ok('Six theme links',page.locator('.topic-link').count()==6)
 ok('Missing helper branch: hidden link + retry (mock)',page.locator('#helper-link').is_hidden() and page.locator('#helper-retry').is_visible())
 ok('Startup only requests same-origin helper (fetch mock)',page.evaluate('window.__requests')==['../helper/'])
 nav(page,'all');ok('Nine unique videos',page.locator('.card:visible').count()==9 and len(set(page.locator('.card').evaluate_all('(els)=>els.map(x=>x.dataset.video)')))==9)
 ok('External video links safe',page.locator('.watch[href*="youtube"]').evaluate_all('(els)=>els.length===9&&els.every(x=>x.target==="_blank"&&x.rel.includes("noopener"))'))
 page.locator('[data-filter="short"]').click();page.wait_for_timeout(35)
 ok('Short filter exactly five; title follows route',page.locator('.card:visible').count()==5 and page.locator('#view-title').inner_text()=='約5分以内で学ぶ')
 nav(page,'call');page.locator('[data-filter="short"]').click()
 ok('Long video excluded and empty state shown',page.locator('.card:visible').count()==0 and page.locator('#empty').is_visible())
 page.locator('#reset-filter').click();ok('Topic empty-state recovery',page.locator('.card:visible').count()==1)
 for topic in ['yaku','score','waits','call','defense','efficiency']:
  nav(page,topic);ok('Stable hash #'+topic,page.locator('#lesson-'+topic).is_visible() and page.locator('.lesson:visible').count()==1)
 nav(page,'yaku');page.locator('[data-save="tanyao"]').click();state=page.evaluate('window.__store');page.close();page=load('yaku',state)
 ok('Bookmark rehydrates from stored JSON (storage mock)',page.locator('[data-save="tanyao"]').get_attribute('aria-pressed')=='true')
 nav(page,'saved');ok('Saved view exactly one',page.locator('.card:visible').count()==1)
 page.locator('[data-save="tanyao"]').click();ok('Remove last bookmark: empty state + keyboard focus',page.locator('#empty').is_visible() and page.locator('[data-filter="saved"]').evaluate('(el)=>el===document.activeElement'))
 page.locator('#reset-filter').click();page.wait_for_timeout(35);ok('Global reset updates route/title',page.locator('#view-title').inner_text()=='動画を全部見る' and page.locator('.card:visible').count()==9)
 nav(page,'defense');page.locator('.quiz summary').click();ok('Practice answer opens',page.locator('.quiz[open]').count()==1)
 page.locator('#share').click();ok('Clipboard unavailable: manual copy fallback',page.locator('#sharebox').is_visible() and page.locator('#shareurl').input_value().endswith('#defense'))
 page.locator('#shareclose').click();ok('Share close returns keyboard focus',page.locator('#sharebox').is_hidden() and page.locator('#share').evaluate('(el)=>el===document.activeElement'))
 nav(page,'<img src=x onerror=alert(1)>');ok('Hostile hash safely returns home',page.locator('#home').is_visible() and page.locator('img').count()==0)
 malformed=load('home',{'okmj.learn.v1':'{broken'});ok('Malformed JSON safe',malformed.locator('#home').is_visible());malformed.close()
 whitelist=load('saved',{'okmj.learn.v1':json.dumps({'saved':['constructor','__proto__','tanyao']})});ok('Stored IDs whitelisted',whitelist.locator('.card:visible').count()==1);whitelist.close()
 ready=load(helper=True);ok('Available helper branch (mock)',ready.locator('#helper-link').is_visible());ready.close()
 for width in [320,390,768,1024]:
  page.set_viewport_size({'width':width,'height':1000})
  for route in ['home','all','call']:
   nav(page,route)
   for size in [18,22,36]:
    page.evaluate('(s)=>document.documentElement.style.fontSize=s+"px"',size)
    ok(f'No horizontal overflow: {width}px / {route} / font {size}px',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.set_viewport_size({'width':390,'height':844});nav(page,'home');page.evaluate('document.documentElement.style.fontSize="18px"')
 page.evaluate("document.querySelector('#message').textContent=''");page.screenshot(path=str(ROOT/'phone-home.png'),full_page=True)
 page.locator('#font').click();state=page.evaluate('window.__store');page.close();page=load('home',state)
 ok('Large font rehydrates from JSON (storage mock)',page.evaluate('parseFloat(getComputedStyle(document.documentElement).fontSize)')==22)
 page.locator('#font').click();nav(page,'yaku');page.evaluate("document.querySelector('#message').textContent=''");page.screenshot(path=str(ROOT/'phone-yaku.png'),full_page=True)
 page.set_viewport_size({'width':1024,'height':768});nav(page,'home');page.evaluate("document.querySelector('#message').textContent=''");page.screenshot(path=str(ROOT/'tablet-home.png'),full_page=True)
 nav(page,'waits');page.evaluate("document.querySelector('#message').textContent=''");page.screenshot(path=str(ROOT/'tablet-waits.png'),full_page=True)
 ok('No uncaught JS errors in tested DOM flows',not errors)
 denied=load('yaku',blocked=True);denied.locator('[data-save="tanyao"]').click();ok('Storage denied: memory-only state + warning',denied.locator('[data-save="tanyao"]').get_attribute('aria-pressed')=='true' and 'このページを開いている間' in denied.locator('#message').inner_text())
 nojs=b.new_context(java_script_enabled=False);np=nojs.new_page();np.set_content(HTML)
 ok('No-JS fallback has six source links',np.locator('main > noscript a').count()==6)
 ok('No iframes or copied images',page.locator('iframe,img').count()==0)
 b.close()
report={'tests':len(results),'passed':len(results),'checks':results,'scope':'Chromium set_content DOM tests. Local HTTP/file navigation was blocked by browser policy. localStorage persistence and helper availability are explicit mocks. Real video playback, live navigation and iOS/iPadOS are not covered.'}
(ROOT/'test-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'tests':len(results),'passed':len(results)},ensure_ascii=False))
