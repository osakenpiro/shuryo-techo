"""Browser smoke test. pip install playwright; uses CHROMIUM_PATH or /usr/bin/chromium.
Usage: python ui-test.py [base URL]; requires a running static HTTP server.
"""
import json, os, sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=(sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8765/').rstrip('/')+'/'
OUT=Path(os.environ.get('UI_OUTPUT','/mnt/data/mahjong-ui')); OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
INLINE=os.environ.get('INLINE_TEST')=='1'
ROOT=Path(__file__).resolve().parent
def injected_html():
    html=(ROOT/'index.html').read_text()
    for name in ['core','yaku','app']:
        html=html.replace(f'<script defer src="{name}.js?v=1"></script>','')
    for name in ['core','yaku','app']:
        html=html.replace('</body>','<script>'+(ROOT/(name+'.js')).read_text()+'</script></body>')
    return html
loaded=False
def goto(url):
    global loaded
    if not INLINE:
        return page.goto(url)
    if not loaded:
        page.set_content(injected_html()); loaded=True
    page.evaluate('(hash)=>{location.hash=hash}',url.split('#',1)[1] if '#' in url else 'home')

def check(name, condition=True):
    assert condition, name
    checks.append(name)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    goto(BASE); expect(page.locator('#boot-warning')).to_be_hidden()
    check('initial two-choice home',page.locator('#home .choices a').count()==2)
    check('home omits preflight disclaimer','インストール不要' not in page.locator('#home').inner_text())
    check('home links learning portal',page.locator('#home a[href="../learn/"]').count()==1)
    page.screenshot(path=str(OUT/'home-390.png'),full_page=True)
    page.locator('#home .choice[href="#yaku"]').click()
    expect(page.locator('#yaku')).to_be_visible()
    check('common role count',page.locator('.yaku').count()==8)
    page.locator('#search').fill('ぴんふ');expect(page.locator('.yaku')).to_have_count(1)
    expect(page.locator('.yaku h2')).to_have_text('平和');check('hiragana search')
    page.locator('#search').fill('ピンフ');expect(page.locator('.yaku')).to_have_count(1);check('katakana search')
    page.locator('#search').fill('四暗刻');expect(page.locator('.yaku')).to_have_count(1);check('search outside default common filter')
    page.locator('#search').fill('');page.locator('[data-key="filter"][data-value="all"]').click()
    expect(page.locator('.yaku')).to_have_count(39);check('39 reference cards')
    page.locator('[data-key="filter"][data-value="open"]').click()
    check('open filter excludes pinfu',page.locator('[data-yaku="pinfu"]').count()==0)
    page.locator('[data-key="filter"][data-value="common"]').click()
    page.screenshot(path=str(OUT/'roles-390.png'),full_page=True)
    page.locator('.bottom a[href="#score"]').click()
    expect(page.locator('#score')).to_be_visible()
    expect(page.locator('#score')).to_contain_text('4人麻雀');check('score scope label')
    expect(page.locator('#score')).to_contain_text('翻・符を選んで計算');check('score operation guidance')
    expect(page.locator('#score')).to_contain_text('あがれるかは判定しません。');check('score limitation stays visible')
    expect(page.locator('#result')).to_contain_text('翻と符');check('no invented initial score')
    def choose(key,value): page.locator(f'[data-key="{key}"][data-value="{value}"]').click()
    choose('han','1');choose('fu','30')
    expect(page.locator('#result')).to_contain_text('ドラだけでは');check('yaku confirmation required')
    page.locator('#has-yaku').check();expect(page.locator('#result .pay strong')).to_have_text('1,000点');check('child ron 1han30fu')
    page.locator('[data-key="han"][data-value="2"]').focus();page.keyboard.press('Enter')
    check('keyboard focus survives selection',page.evaluate("document.activeElement.dataset.key==='han' && document.activeElement.dataset.value==='2'"))
    choose('fu','20');expect(page.locator('#result')).to_contain_text('20符は平和ツモ用');check('20fu ron blocked')
    choose('win','tsumo');expect(page.locator('#result .pay strong')).to_have_text(['700点','400点']);check('pinfu tsumo payments')
    choose('dealer','true');expect(page.locator('#result .pay strong')).to_have_text('700点');expect(page.locator('#result')).to_contain_text('子 3人');check('dealer tsumo per person')
    choose('dealer','false')
    page.locator('#jump-result').click();check('one tap return to payment',page.locator('#result').bounding_box()['y']>=0)
    page.get_by_text('本場・供託を足す',exact=True).click()
    page.locator('#honba').fill('2');page.locator('#sticks').fill('3')
    expect(page.locator('#result .pay strong')).to_have_text(['900点','600点'])
    expect(page.locator('#result .total b')).to_have_text('5,100点');check('honba and deposit separated')
    page.locator('#honba').fill('');expect(page.locator('#result')).to_contain_text('整数');check('blank counter rejected')
    page.locator('#honba').fill('2')
    page.locator('#result').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'score-390.png'),full_page=True)
    page.locator('#reset').click();choose('han','4');choose('fu','30');page.locator('#has-yaku').check()
    expect(page.locator('#result .pay strong')).to_have_text('7,700点');check('kiriage default off')
    goto(BASE+'#rules');page.locator('#kiriage').check()
    page.locator('.bottom a[href="#score"]').click();expect(page.locator('#result .pay strong')).to_have_text('8,000点');check('kiriage on')
    page.locator('#big-han').select_option('13');expect(page.locator('#result .pay strong')).to_have_text('32,000点');expect(page.locator('#fu-field')).to_be_hidden();check('kazoe and fu not required')
    goto(BASE+'#rules');page.locator('#kazoe').uncheck();page.locator('.bottom a[href="#score"]').click()
    expect(page.locator('#result .pay strong')).to_have_text('24,000点');check('kazoe off')
    page.locator('#big-han').select_option('y2');expect(page.locator('#result .pay strong')).to_have_text('64,000点');check('explicit yakuman unaffected')
    goto(BASE+'#fu');page.locator('#f-shape').select_option('chiitoi');page.locator('#f-win').select_option('ron')
    expect(page.locator('#fu-result strong')).to_have_text('25符');check('chiitoi helper')
    page.locator('#apply-fu').click();expect(page.locator('#score-context')).to_contain_text('25符');check('fu transferred to calculator')
    page.locator('#reset').click();goto(BASE+'#fu');page.locator('#f-shape').select_option('standard');page.locator('#f-closed').select_option('yes');page.locator('#f-win').select_option('ron')
    page.locator('#f-pair').select_option('0');page.locator('#f-wait').select_option('shanpon')
    for i,v in enumerate(['ron19','seq','seq','seq']):page.locator(f'#f-g{i}').select_option(v)
    expect(page.locator('#fu-result strong')).to_have_text('40符');check('ron triplet open fu with closed hand bonus')
    page.locator('#f-g0').select_option('anko19');expect(page.locator('#fu-result')).to_contain_text('ロンで完成した3枚');expect(page.locator('#apply-fu')).to_be_disabled();check('inconsistent fu cannot apply')
    page.locator('#f-g0').select_option('ron19');page.screenshot(path=str(OUT/'fu-390.png'),full_page=True)
    for w,h in [(320,568),(375,812),(390,844),(430,932),(768,1024),(1280,800)]:
        page.set_viewport_size({'width':w,'height':h})
        for route in ['home','yaku','score','fu','rules']:
            goto(BASE+'#'+route);expect(page.locator('#'+route)).to_be_visible()
            check(f'no horizontal overflow {w}/{route}',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
        goto(BASE+'#home');page.screenshot(path=str(OUT/f'home-{w}.png'),full_page=True)
    page.set_viewport_size({'width':320,'height':568})
    goto(BASE+'#score')
    metrics=page.locator('button:visible,select:visible,.bottom a,header a').evaluate_all('(els)=>els.map(e=>({text:e.textContent,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))')
    check('primary controls at least 44x44 at 320px',all(m['w']>=44 and m['h']>=44 for m in metrics))
    if INLINE:
        page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));loaded=False;goto(BASE+'#score')
    else: page.reload()
    expect(page.locator('#result')).to_contain_text('翻と符');check('reload deliberately resets hand')
    goto(BASE+'#rules');check('reload resets rule defaults',not page.locator('#kiriage').is_checked() and page.locator('#kazoe').is_checked())
    check('no JavaScript errors',not errors)
    context.close()
    # The initial HTML remains explanatory if JS is unavailable; do not promise usable calculation.
    browser.close();browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    nojs=browser.new_context(java_script_enabled=False);np=nojs.new_page();np.set_content((ROOT/'index.html').read_text()) if INLINE else np.goto(BASE)
    check('no-JS fallback text', 'JavaScript' in (np.locator('noscript').text_content() or ''))
    expect(np.locator('#boot-warning')).to_be_visible();check('loading failure warning visible without JS')
    np.screenshot(path=str(OUT/'nojs.png'),full_page=True)
    browser.close()
report={'base_url':BASE,'browser':'Chromium mobile emulation; NOT real iOS Safari','loading':'DOM injection of exact local HTML/JS (network policy)' if INLINE else 'HTTP page load','checks_passed':len(checks),'checks':checks,'javascript_errors':errors}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
