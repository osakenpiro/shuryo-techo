/* v1 field dictionary. Stable IDs, bookmark key and export schema are unchanged. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), D = window.HUNTING_DICTIONARY;
  if (D?.version !== '1.0.0' || D.entries.length !== 109) throw Error('Incomplete dictionary data');
  const all = D.entries, byId = new Map(all.map(e => [e.id, e]));
  const latest = new Set(D.latestEntryIds), topics = D.guideTopics;
  const key = 'mh-hunting-dictionary:v1:bookmarks';
  const wn = {sa:'スラアク',bow:'弓',cb:'チャアク',gs:'大剣',sns:'片手剣'};
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s).normalize('NFKC').toLowerCase().replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  const safeUrl = s => {try {const u=new URL(s); return /^https?:$/.test(u.protocol)?u.href:'';} catch {return '';}};
  const extras = {'flash-resistance-mr':['閃光が効かない','閃光がきかない','閃光きかない'],'radial-loadout':['ショトカが戻る','ショートカットが戻る'],'mantle-cooldown':['装衣が復活しない','装衣が戻らない']};
  const hay = new Map(all.map(e=>[e.id,norm([e.title,e.reading,...e.aliases,e.quick,e.cue,e.action,e.caution,e.scope,e.route,e.category,...(extras[e.id]||[]),...e.weapons.map(w=>wn[w]||w),...(e.guide||[]).flatMap(p=>[p.title,...p.steps])].filter(Boolean).join(' '))]));
  let selected='flash-resistance-mr', visible=[], favs=new Set(), onlyFavs=false, topic='', timer;
  function toast(s) {$('toast').textContent=s; $('toast').hidden=false; clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,4500);}
  try {const a=JSON.parse(localStorage.getItem(key)||'[]'); if(Array.isArray(a))favs=new Set(a.filter(id=>byId.has(id)));} catch {toast('保存領域を読み込めませんでした。しおりは書き出しでも保存できます。');}
  function save() {try {localStorage.setItem(key,JSON.stringify([...favs]));return true;} catch {toast('ブラウザーに保存できません。しおりを書き出して控えを残せます。');return false;}}
  function view(v) {document.body.dataset.view=v; $('show-index').setAttribute('aria-pressed',String(v==='index'));$('show-detail').setAttribute('aria-pressed',String(v==='detail'));}
  function snapshot() {return {mhDictionary:1,selected,topic,onlyFavs,view:document.body.dataset.view,q:$('lookup').value,mode:$('entry-mode').value,weapon:$('weapon').value,category:$('category').value,edition:$('edition').value,first:$('first').checked};}
  function remember(push=false) {
    const u=new URL(location.href);u.search='';
    if(topic)u.searchParams.set('topic',topic);
    else if($('entry-mode').value!=='tips')u.searchParams.set('mode',$('entry-mode').value);
    if($('lookup').value)u.searchParams.set('q',$('lookup').value);
    u.hash=selected;
    history[push?'pushState':'replaceState'](snapshot(),'',u);
  }
  function restore(s) {
    topic=topics[s.topic]?s.topic:'';onlyFavs=!!s.onlyFavs;
    $('lookup').value=s.q||'';
    for(const [id,k] of [['entry-mode','mode'],['weapon','weapon'],['category','category'],['edition','edition']])$(id).value=s[k]||'all';
    $('first').checked=!!s.first;selected=s.selected;filter();view(s.view==='index'?'index':'detail');
  }
  function indicators() {
    for(const b of document.querySelectorAll('[data-topic]'))b.setAttribute('aria-pressed',String(b.dataset.topic===topic));
    $('new-only').setAttribute('aria-pressed',String($('entry-mode').value==='new'));
    $('reset').hidden=!($('lookup').value||$('entry-mode').value!=='tips'||$('weapon').value!=='all'||$('category').value!=='all'||$('edition').value!=='all'||$('first').checked||onlyFavs||topic);
  }
  function filter() {
    const terms=norm($('lookup').value.trim()).split(/\s+/).filter(Boolean),mode=$('entry-mode').value,w=$('weapon').value,c=$('category').value,t=$('edition').value;
    visible=all.filter(e=>(!topic||e.topic===topic)&&(mode==='all'||(mode==='new'?latest.has(e.id):mode==='guides'?!!e.guide:mode==='tips'?e.discovery&&!e.guide:!e.discovery))&&(w==='all'||(w==='common'?!e.weapons.length:!e.weapons.length||e.weapons.includes(w)))&&(c==='all'||e.category===c)&&(t==='all'||e.edition===t||e.editionScope==='mixed')&&(!$('first').checked||e.first)&&(!onlyFavs||favs.has(e.id))&&terms.every(q=>hay.get(e.id).includes(q)));
    if(terms.length) {const score=e=>terms.reduce((s,q)=>s+(norm(e.title).includes(q)?5:0)+(e.aliases.some(a=>norm(a)===q)?4:0),0);visible.sort((a,b)=>score(b)-score(a));}
    if(!visible.some(e=>e.id===selected))selected=visible[0]?.id||'';
    indicators();renderList();renderDetail();
  }
  function renderList() {
    $('export').href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify({schema:'mh-hunting-dictionary-bookmarks-v1',version:D.version,exported:new Date().toISOString(),ids:[...favs]},null,2));
    $('count').textContent=visible.length+' / '+all.length+'項目';$('only-favs').textContent='しおり'+(favs.size?' '+favs.size:'');$('only-favs').setAttribute('aria-pressed',String(onlyFavs));
    $('entries').innerHTML=visible.length?visible.map(e=>`<button class="entry" data-id="${esc(e.id)}" aria-current="${e.id===selected}"><span class="entry-line"><span class="entry-name">${esc(e.title)}</span>${favs.has(e.id)?'<span class="entry-star" aria-label="しおり登録済み">◆</span>':''}</span><span class="entry-topic">${esc(e.category)}${e.plate?'<span class="plate-mark">図版</span>':''}${e.availability==='retired'?'<span class="closed-mark">配信終了</span>':''}</span></button>`).join(''):'<div class="empty">条件に合う項目はありません。<button data-reset>全項目から探す</button></div>';
  }
  function stepText(text,id) {
    const links=D.stepLinks.filter(l=>l.id!==id);let out='',i=0;
    while(i<text.length){const link=links.find(l=>text.startsWith(l.label,i));if(link){out+=`<a class="step-link" href="#${esc(link.id)}" data-related="${esc(link.id)}">${esc(link.label)}</a>`;i+=link.label.length;}else{out+=esc(text[i]);i++;}}
    return out;
  }
  function routeGuide(e) {return e.guide?'<div class="guide-sections" aria-label="解放・周回の手順">'+e.guide.map((p,i)=>`<details class="guide-part" ${i===0?'open':''}><summary><span>${esc(p.title)}</span>${p.edition?'<small>'+ (p.edition==='world'?'WORLD':'IB')+'</small>':''}</summary><ol>${p.steps.map(s=>'<li>'+stepText(s,e.id)+'</li>').join('')}</ol></details>`).join('')+'</div>':'';}
  function comparison(e) {
    if(e.plate)return '';
    if(e.compare?.length)return '<div class="contrast" aria-label="違いを比較">'+e.compare.map(([a,b])=>`<dl><dt>${esc(a)}</dt><dd>${esc(b)}</dd></dl>`).join('')+'</div>';
    if(e.steps?.length)return '<div class="key-points" aria-label="要点">'+e.steps.map(s=>'<span>'+esc(s)+'</span>').join('')+'</div>';
    return '';
  }
  function plate(e) {
    const p=D.plates[e.plate];if(!p)return '';
    return `<figure class="field-plate"><img src="plates-v1/${esc(p.file)}" alt="${esc(p.alt)}" width="1672" height="941" decoding="async"><p class="plate-failure" hidden>図版を読み込めませんでした。手順と出典はこのまま読めます。</p><figcaption><span class="plate-labels">${p.labels.map(l=>'<span>'+esc(l)+'</span>').join('')}</span><span class="plate-title">${esc(p.title)}</span><details class="plate-credit"><summary>解説画について・制作と根拠</summary><p>${esc(p.note)}</p><p>制作：狩猟辞書 / OpenAI imagegen。AI生成の非公式解説画（2026-09-20）。ゲーム画像の転載ではありません。</p>${p.sources.map(id=>`<a href="${esc(safeUrl(D.sources[id].url))}" target="_blank" rel="noopener noreferrer">${esc(D.sources[id].label)} ↗</a>`).join('')}</details></figcaption></figure>${e.illustratedLinks?'<nav class="plate-paths" aria-label="図版から手順へ">'+e.illustratedLinks.map(l=>`<a href="#${esc(l.id)}" data-related="${esc(l.id)}">${esc(l.label)} ↗</a>`).join('')+'</nav>':''}`;
  }
  function renderDetail() {
    const e=byId.get(selected);
    if(!e){$('detail').innerHTML='<p class="no-match">検索語や条件を変えてみてください。</p>';document.title='検索結果なし｜狩猟辞書';return;}
    const sources=e.sources.map(k=>D.sources[k]),media=e.mediaSource&&D.sources[e.mediaSource];
    const links=sources.map(s=>safeUrl(s.url)?`<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>${s.evidence?'<span class="source-kind">'+esc(s.evidence)+'</span>':''}${s.note?'<p class="source-note">'+esc(s.note)+'</p>':''}`:'').join('');
    $('detail').innerHTML=`<button id="bookmark" class="bookmark" aria-label="${favs.has(e.id)?'しおりを外す':'しおりに挟む'}" aria-pressed="${favs.has(e.id)}"><span aria-hidden="true">${favs.has(e.id)?'◆':'＋'}</span></button><div class="entryhead"><div><div class="eyebrow">${esc(e.category)} · ${e.editionScope==='mixed'?'WORLD 通常版 / IB 改':e.edition==='iceborne'?'ICEBORNE':'WORLD / IB'}${e.availability==='retired'?'<span class="closed-mark">配信終了</span>':''}</div><h2>${esc(e.title)}</h2></div></div><p class="takeaway">${esc(e.quick)}</p>${e.scope?'<p class="scope">'+esc(e.scope)+'</p>':''}${plate(e)}${routeGuide(e)}${comparison(e)}${e.action?'<p class="action-line">'+esc(e.action)+'</p>':''}${e.route?'<p class="route"><span>場所</span>'+esc(e.route)+'</p>':''}<p class="warning"><span class="mark" aria-hidden="true">!</span><span>${esc(e.caution)}</span></p>${e.availability==='event'?'<p class="availability">イベント欄で受注。配信状況はゲーム内で確認。</p>':''}${media&&safeUrl(media.url)?`<a class="media-source" href="${esc(safeUrl(media.url))}" target="_blank" rel="noopener noreferrer">${esc(e.mediaLabel||'出典の実画面を見る ↗')}</a>`:''}<details class="more"><summary>詳しく・出典 <span>${sources.length}件</span></summary><div class="detailtext">${e.cue&&e.cue!==e.title?'<p><b>場面</b>　'+esc(e.cue)+'</p>':''}${e.note?'<p>'+esc(e.note)+'</p>':''}${e.aliases.length?'<p><b>別名・検索語</b>　'+e.aliases.map(esc).join(' / ')+'</p>':''}${links}<p class="source-note">資料確認：${esc(e.reviewed||D.reviewed)}。ゲーム内の独立再現は未実施。進行状況は自動取得していません。</p></div></details><nav class="relations" aria-label="関連・前提へ">${e.related.map(id=>`<a href="#${esc(id)}" data-related="${esc(id)}">${esc(byId.get(id).title)} ↗</a>`).join('')}</nav><div class="paper-bottom"><span>${e.guide?'解放・周回ガイド':e.discovery?'発見Tips':'基本用語'}</span><button id="copy" class="copy">この項目のリンク</button></div>`;
    document.title=e.title+'｜狩猟辞書';
    $('bookmark').onclick=()=>{const was=favs.has(e.id);was?favs.delete(e.id):favs.add(e.id);const ok=save();filter();remember();if(ok)toast(was?'しおりを外しました。':'しおりを挟みました。');};
    $('copy').onclick=async()=>{const u=new URL(location.href);u.search='';u.hash=e.id;try{if(!navigator.clipboard||!window.isSecureContext)throw Error();await navigator.clipboard.writeText(u.href);toast('リンクをコピーしました。');}catch{window.prompt('この項目へのリンク',u.href);}};
    const img=$('detail').querySelector('.field-plate img');if(img)img.onerror=()=>{img.hidden=true;$('detail').querySelector('.plate-failure').hidden=false;};
  }
  function reset(mode='tips') {topic='';$('lookup').value='';for(const id of ['weapon','category','edition'])$(id).value='all';$('first').checked=false;onlyFavs=false;$('entry-mode').value=mode;}
  function go(id,push=true) {
    if(!byId.has(id)){toast('この項目は収録されていません。検索から探せます。');return;}
    if(push)remember();
    if(!visible.some(e=>e.id===id)){reset('all');selected=id;filter();}
    selected=id;indicators();renderList();renderDetail();view('detail');$('filterdetails').open=false;
    if(push)remember(true);
    if(matchMedia('(max-width:850px)').matches)$('detail').scrollIntoView({block:'start'});
    $('detail').focus({preventScroll:true});
  }
  function chooseTopic(t,push=true) {if(!topics[t])return;if(push)remember();reset('all');topic=t;selected=topics[t].root;filter();go(selected,false);if(push)remember(true);}
  [...new Set(all.map(e=>e.category))].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('category').append(o);});
  $('purpose-nav').innerHTML=Object.entries(topics).map(([id,t])=>`<button data-topic="${id}" aria-pressed="false">${esc(t.label)}</button>`).join('');
  $('purpose-nav').onclick=e=>{const b=e.target.closest('[data-topic]');if(b)chooseTopic(b.dataset.topic);};
  function filterInput(){filter();view('index');remember();}
  $('new-only').textContent='追加ガイド '+latest.size;
  $('new-only').onclick=()=>{reset($('entry-mode').value==='new'?'tips':'new');filterInput();};
  $('lookup').oninput=()=>{if($('lookup').value.trim()){topic='';$('entry-mode').value='all';}filterInput();};
  $('clear').onclick=()=>{$('lookup').value='';filterInput();$('lookup').focus();};
  for(const id of ['weapon','category','edition','entry-mode','first'])$(id).onchange=()=>{topic='';filterInput();};
  $('reset').onclick=()=>{reset();filterInput();};
  $('only-favs').onclick=()=>{onlyFavs=!onlyFavs;if(onlyFavs){topic='';$('entry-mode').value='all';}filterInput();};
  $('entries').onclick=e=>{const b=e.target.closest('[data-id]');if(b)go(b.dataset.id);if(e.target.closest('[data-reset]')){reset('all');filterInput();}};
  $('detail').onclick=e=>{const b=e.target.closest('[data-related]');if(b&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&e.button===0){e.preventDefault();go(b.dataset.related);}};
  $('show-index').onclick=()=>{view('index');remember();};$('show-detail').onclick=()=>{view('detail');remember();};
  function hashRead(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{toast('項目リンクを読み込めませんでした。');return;}if(id==='lookup')return;if(id)go(id,false);else{reset();selected='flash-resistance-mr';filter();}}
  window.addEventListener('popstate',e=>{if(e.state?.mhDictionary===1)restore(e.state);else hashRead();});
  window.addEventListener('hashchange',()=>{if(history.state?.mhDictionary!==1||history.state.selected!==location.hash.slice(1))hashRead();});
  window.addEventListener('keydown',e=>{if(e.key==='/'&&!e.isComposing&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('lookup').focus();}if(e.key==='Escape')$('filterdetails').open=false;});
  document.addEventListener('click',e=>{if(!$('filterdetails').contains(e.target))$('filterdetails').open=false;});
  $('import').onclick=()=>$('import-file').click();
  $('import-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error();const d=JSON.parse(await f.text());if(d.schema!=='mh-hunting-dictionary-bookmarks-v1'||!Array.isArray(d.ids)||!d.ids.every(id=>typeof id==='string'))throw Error();const accepted=[...new Set(d.ids.filter(id=>byId.has(id)))];accepted.forEach(id=>favs.add(id));const ok=save();filter();remember();if(ok)toast(accepted.length+'件を読み込みました。既存のしおりは残しています。');}catch{toast('しおり書き出し用のJSONを選んでください。');}finally{e.target.value='';}};
  window.addEventListener('storage',e=>{if(e.key!==key)return;try{const a=JSON.parse(e.newValue||'[]');if(Array.isArray(a)){favs=new Set(a.filter(id=>byId.has(id)));filter();}}catch{}});
  $('totals').textContent=all.length+'項目';
  const q=new URL(location.href).searchParams;
  if(history.state?.mhDictionary===1)restore(history.state);
  else {if(['new','guides','basic','all'].includes(q.get('mode')))$('entry-mode').value=q.get('mode');if(q.get('q')){$('lookup').value=q.get('q');$('entry-mode').value='all';}filter();if(location.hash)hashRead();else if(topics[q.get('topic')])chooseTopic(q.get('topic'),false);}
  remember();document.body.dataset.ready='true';
})();
