/* Field dictionary v0.4. The view never calls the retired illustration renderer. */
(()=>{'use strict';
const $=id=>document.getElementById(id),D=window.HUNTING_DICTIONARY;
if(!D?.entries?.length||D.version!=='0.4.0'){$('detail').textContent='更新データを読み込めませんでした。再読み込みしてください。';return;}
const all=D.entries,byId=new Map(all.map(e=>[e.id,e])),latest=new Set(D.latestEntryIds),key='mh-hunting-dictionary:v1:bookmarks';
const wn={sa:'スラアク',bow:'弓',cb:'チャアク',gs:'大剣',sns:'片手剣'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const safeUrl=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:'';}catch(_){return '';}};
const extraAliases={'flash-resistance-mr':['閃光が効かない','閃光がきかない','閃光きかない'],'radial-loadout':['ショトカが戻る','ショートカットが戻る'],'mantle-cooldown':['装衣が復活しない','装衣が戻らない']};
const hay=new Map(all.map(e=>[e.id,norm([e.title,e.reading,...e.aliases,e.quick,e.cue,e.action,e.caution,e.scope,e.route,e.category,...(extraAliases[e.id]||[]),...e.weapons.map(w=>wn[w]||w)].filter(Boolean).join(' '))]));
let selected=all[0].id,visible=[],favs=new Set(),onlyFavs=false,timer;
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,3500);}
try{const a=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(a))favs=new Set(a.filter(id=>byId.has(id)));}catch(_){}
function save(){try{localStorage.setItem(key,JSON.stringify([...favs]));return true;}catch(_){toast('このブラウザーには保存できません。しおりを書き出して控えを残せます。');return false;}}
function view(v){document.body.dataset.view=v;$('show-index').setAttribute('aria-pressed',String(v==='index'));$('show-detail').setAttribute('aria-pressed',String(v==='detail'));}
function filter(){const terms=norm($('lookup').value.trim()).split(/\s+/).filter(Boolean),mode=$('entry-mode').value,w=$('weapon').value,c=$('category').value,t=$('edition').value;
visible=all.filter(e=>(mode==='all'||(mode==='new'?latest.has(e.id):mode==='tips'?e.discovery:!e.discovery))&&(w==='all'||(w==='common'?!e.weapons.length:!e.weapons.length||e.weapons.includes(w)))&&(c==='all'||e.category===c)&&(t==='all'||e.edition===t)&&(!$('first').checked||e.first)&&(!onlyFavs||favs.has(e.id))&&terms.every(q=>hay.get(e.id).includes(q)));
if(terms.length){const score=e=>terms.reduce((s,q)=>s+(norm(e.title).includes(q)?5:0)+(e.aliases.some(a=>norm(a)===q)?4:0),0);visible.sort((a,b)=>score(b)-score(a));}
if(!visible.some(e=>e.id===selected))selected=visible[0]?.id||'';
$('reset').hidden=!($('lookup').value||mode!=='tips'||w!=='all'||c!=='all'||t!=='all'||$('first').checked||onlyFavs);
$('new-only').setAttribute('aria-pressed',String(mode==='new'));
renderList();renderDetail();}
function renderList(){
$('count').textContent=visible.length+' / '+all.length+'項目';
$('only-favs').textContent='しおり'+(favs.size?' '+favs.size:'');$('only-favs').setAttribute('aria-pressed',String(onlyFavs));
$('entries').innerHTML=visible.length?visible.map(e=>`<button class="entry" data-id="${esc(e.id)}" aria-current="${e.id===selected}" aria-label="${esc(e.title)}"><span class="entry-line"><span class="entry-name">${esc(e.title)}</span>${favs.has(e.id)?'<span class="entry-star" aria-label="しおり登録済み">◆</span>':''}</span><span class="entry-topic">${esc(e.category)}${latest.has(e.id)?'<span class="new-mark">追加</span>':''}</span></button>`).join(''):'<div class="empty">条件に合う項目はありません。<button data-reset>全項目から探す</button></div>';
}
function comparison(e){if(e.compare?.length)return '<div class="contrast" aria-label="違いを比較">'+e.compare.map(([a,b])=>`<dl><dt>${esc(a)}</dt><dd>${esc(b)}</dd></dl>`).join('')+'</div>';
if(e.steps?.length)return '<div class="key-points" aria-label="要点">'+e.steps.map(s=>'<span>'+esc(s)+'</span>').join('')+'</div>';return '';}
function renderDetail(){const e=byId.get(selected);if(!e){$('detail').innerHTML='<p class="no-match">検索語や条件を変えてみてください。</p>';return;}
const sources=e.sources.map(k=>D.sources[k]).filter(Boolean),media=e.mediaSource&&D.sources[e.mediaSource],sourceLinks=sources.map(s=>{const u=safeUrl(s.url);return u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>${s.note?'<p class="source-note">'+esc(s.note)+'</p>':''}`:'';}).join('');
$('detail').innerHTML=`<button id="bookmark" class="bookmark" aria-label="${favs.has(e.id)?'しおりを外す':'しおりに挟む'}" aria-pressed="${favs.has(e.id)}" title="しおり"><span aria-hidden="true">${favs.has(e.id)?'◆':'＋'}</span></button><div class="entryhead"><div><div class="eyebrow">${esc(e.category)} · ${e.edition==='iceborne'?'IB':'WORLD / IB'}${latest.has(e.id)?'<span class="new-mark">今回追加</span>':''}</div><h2>${esc(e.title)}</h2></div></div><p class="takeaway">${esc(e.quick)}</p>${e.scope?'<p class="scope">'+esc(e.scope)+'</p>':''}${comparison(e)}<p class="action-line">${esc(e.action)}</p>${e.route?'<p class="route"><span>場所</span>'+esc(e.route)+'</p>':''}<p class="warning"><span class="mark" aria-hidden="true">!</span><span>${esc(e.caution)}</span></p>${media&&safeUrl(media.url)?`<a class="media-source" href="${esc(safeUrl(media.url))}" target="_blank" rel="noopener noreferrer">${esc(e.mediaLabel||'出典の実画面を見る ↗')}</a>`:''}<details class="more"><summary>詳しく・出典 <span>${sources.length}件</span></summary><div class="detailtext">${e.cue&&e.cue!==e.title?'<p><b>場面</b>　'+esc(e.cue)+'</p>':''}${e.note?'<p>'+esc(e.note)+'</p>':''}<p><b>別名・検索語</b>　${e.aliases.map(esc).join(' / ')}</p>${sourceLinks}<p class="source-note">資料確認記録：${esc(e.reviewed||D.reviewed)}。ゲーム内での独立再現検証は未実施。発表・調査の条件は出典で確認。</p></div></details><nav class="relations" aria-label="関連項目">${e.related.filter(id=>byId.has(id)).map(id=>`<button data-related="${esc(id)}">${esc(byId.get(id).title)} ↗</button>`).join('')}</nav><div class="paper-bottom"><span>${e.discovery?'発見Tips':'基本用語'}${sources[0]?.evidence?' · '+esc(sources[0].evidence):''}</span><button id="copy" class="copy">この項目のリンク</button></div>`;
document.title=e.title+'｜狩猟辞書';
$('bookmark').onclick=()=>{const was=favs.has(e.id);was?favs.delete(e.id):favs.add(e.id);const ok=save();filter();if(ok)toast(was?'しおりを外しました。':'しおりを挟みました。');};
$('copy').onclick=async()=>{const u=new URL(location.href);u.search='';u.hash=e.id;try{if(!navigator.clipboard||!window.isSecureContext)throw Error();await navigator.clipboard.writeText(u.href);toast('リンクをコピーしました。');}catch(_){window.prompt('この項目へのリンク',u.href);}};
}
function reset(mode='tips'){ $('lookup').value='';for(const id of ['weapon','category','edition'])$(id).value='all';$('first').checked=false;onlyFavs=false;$('entry-mode').value=mode;filter();}
function go(id,push=true){if(!byId.has(id)){toast('この項目はまだ収録されていません。');return;}if(!visible.some(e=>e.id===id))reset('all');selected=id;renderList();renderDetail();view('detail');$('filterdetails').open=false;if(push&&location.hash.slice(1)!==id)history.pushState(null,'','#'+id);if(matchMedia('(max-width:850px)').matches)$('detail').scrollIntoView({block:'start'});$('detail').focus({preventScroll:true});}
[...new Set(all.map(e=>e.category))].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('category').append(o);});
$('new-only').onclick=()=>{reset($('entry-mode').value==='new'?'tips':'new');view('index');};
$('lookup').oninput=()=>{if($('lookup').value.trim())$('entry-mode').value='all';filter();view('index');};
$('clear').onclick=()=>{$('lookup').value='';filter();view('index');$('lookup').focus();};
for(const id of ['weapon','category','edition','entry-mode','first'])$(id).onchange=()=>{filter();view('index');};
$('reset').onclick=()=>{reset();view('index');};$('only-favs').onclick=()=>{onlyFavs=!onlyFavs;if(onlyFavs)$('entry-mode').value='all';filter();view('index');};
$('entries').onclick=e=>{const b=e.target.closest('[data-id]');if(b)go(b.dataset.id);if(e.target.closest('[data-reset]')){reset('all');view('index');}};
$('detail').onclick=e=>{const b=e.target.closest('[data-related]');if(b)go(b.dataset.related);};
$('show-index').onclick=()=>view('index');$('show-detail').onclick=()=>view('detail');
function hashRead(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){toast('項目リンクを読み込めませんでした。');return;}if(id==='lookup')return;if(id)go(id,false);else go(all[0].id,false);}
window.addEventListener('popstate',hashRead);window.addEventListener('hashchange',hashRead);
window.addEventListener('keydown',e=>{if(e.key==='/'&&!e.isComposing&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('lookup').focus();}if(e.key==='Escape')$('filterdetails').open=false;});
document.addEventListener('click',e=>{if(!$('filterdetails').contains(e.target))$('filterdetails').open=false;});
$('export').onclick=()=>{const b=new Blob([JSON.stringify({schema:'mh-hunting-dictionary-bookmarks-v1',version:D.version,exported:new Date().toISOString(),ids:[...favs]},null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='hunting-dictionary-bookmarks.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('import').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error();const d=JSON.parse(await f.text());if(d.schema!=='mh-hunting-dictionary-bookmarks-v1'||!Array.isArray(d.ids)||!d.ids.every(id=>typeof id==='string'))throw Error();const accepted=d.ids.filter(id=>byId.has(id));accepted.forEach(id=>favs.add(id));const ok=save();filter();if(ok)toast(accepted.length+'件を読み込みました。既存のしおりは残しています。');}catch(_){toast('しおり書き出し用のJSONを選んでください。');}finally{e.target.value='';}};
window.addEventListener('storage',e=>{if(e.key!==key)return;try{const a=JSON.parse(e.newValue||'[]');if(Array.isArray(a)){favs=new Set(a.filter(id=>byId.has(id)));filter();}}catch(_){}});
$('totals').textContent=all.filter(e=>e.discovery).length+'の発見 / '+all.filter(e=>!e.discovery).length+'の基本';
if(new URL(location.href).searchParams.get('mode')==='new')$('entry-mode').value='new';
filter();if(location.hash)hashRead();
})();
