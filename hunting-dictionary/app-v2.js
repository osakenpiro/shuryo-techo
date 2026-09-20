(()=>{'use strict';
const $=id=>document.getElementById(id),D=window.HUNTING_DICTIONARY,V=window.MH_VISUALS;
if(!D?.entries||!V){$('detail').innerHTML='<p class="fatal">辞書を読み込めませんでした。再読み込みしてください。</p>';return;}
const all=D.entries,byId=new Map(all.map(e=>[e.id,e])),key='mh-hunting-dictionary:v1:bookmarks',wn={sa:'スラアク',bow:'弓',cb:'チャアク',gs:'大剣'};
let selected=all[0]?.id||'',visible=all,onlyFavs=false,favs=new Set(),timer;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const hay=new Map(all.map(e=>[e.id,norm([e.title,e.reading,...e.aliases,e.quick,e.cue,e.action,e.caution,...e.weapons.map(w=>wn[w])].join(' '))]));
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,3200);}
try{const a=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(a))favs=new Set(a.filter(id=>byId.has(id)));}catch(_){/* Storage failure is reported when the user tries to save. */}
function save(){try{localStorage.setItem(key,JSON.stringify([...favs]));return true;}catch(_){toast('保存領域を使えません。「書き出す」で控えを残せます。');return false;}}
function view(v){document.body.dataset.view=v;$('show-index').setAttribute('aria-pressed',String(v==='index'));$('show-detail').setAttribute('aria-pressed',String(v==='detail'));}
function hasFilter(){return $('lookup').value||$('weapon').value!=='all'||$('category').value!=='all'||$('edition').value!=='all'||$('first').checked||onlyFavs;}
function filter(){const terms=norm($('lookup').value.trim()).split(/\s+/).filter(Boolean),w=$('weapon').value,c=$('category').value,t=$('edition').value;
visible=all.filter(e=>(w==='all'||(w==='common'?!e.weapons.length:!e.weapons.length||e.weapons.includes(w)))&&(c==='all'||e.category===c)&&(t==='all'||e.edition===t)&&(!$('first').checked||e.first)&&(!onlyFavs||favs.has(e.id))&&terms.every(q=>hay.get(e.id).includes(q)));
if(terms.length){const score=e=>terms.reduce((a,q)=>a+(norm(e.title).includes(q)?5:0)+(e.aliases.some(x=>norm(x)===q)?4:0)+(norm(e.reading).includes(q)?3:0),0);visible.sort((a,b)=>score(b)-score(a));}
if(!visible.some(e=>e.id===selected))selected=visible[0]?.id||'';
$('reset').hidden=!hasFilter();renderList();renderDetail();}
function renderList(){
$('count').textContent=visible.length+'項目'+(visible.length!==all.length?' / '+all.length:'');
$('only-favs').textContent='しおり'+(favs.size?' '+favs.size:'');$('only-favs').setAttribute('aria-pressed',String(onlyFavs));
$('entries').innerHTML=visible.length?visible.map(e=>`<button class="entry" data-id="${e.id}" aria-current="${e.id===selected}" aria-label="${esc(e.title)}">${V.icon(e.id)}<span class="entry-name">${esc(e.title)}</span>${favs.has(e.id)?'<span class="entry-star" aria-label="しおり登録済み">◆</span>':''}</button>`).join(''):'<div class="empty">見つかりませんでした。<button data-reset>条件を解除</button></div>';
}
function renderDetail(){const e=byId.get(selected),v=V.map[selected];if(!e||!v){$('detail').innerHTML='<div class="no-match">検索語や条件を変えてみてください。</div>';return;}
let panels=V.panels(e.id);
if(e.id==='clutch-flinch')panels=panels.replace('<div class="scene"><div class="scene-art">'+V.svg(v.scenes[1][1],v.scenes[1][0]),'<div class="scene"><button class="scene-button" id="clutch-demo" aria-label="クラッチして隙を延ばす模式図を試す" aria-pressed="false"><div class="scene-art">'+V.svg(v.scenes[1][1],v.scenes[1][0])).replace('<span>2</span>クラッチ</div></div>','<span>2</span>クラッチ</div></button></div>');
$('detail').innerHTML=`<button class="bookmark" id="bookmark" aria-label="${favs.has(e.id)?'しおりを外す':'しおりに挟む'}" title="${favs.has(e.id)?'しおりを外す':'しおりに挟む'}" aria-pressed="${favs.has(e.id)}"><svg viewBox="0 0 28 50" aria-hidden="true"><path d="M2 0H26V46L14 37 2 46Z"/><path d="M9 10H19M9 16H19" fill="none" stroke="currentColor" stroke-width="1"/></svg></button><div class="entryhead"><div><div class="eyebrow">${esc(e.weapons.length?e.weapons.map(w=>wn[w]).join('・'):e.category)}${e.edition==='iceborne'?'<span class="ib">IB</span>':''}</div><h2>${esc(e.title)}</h2></div></div><p class="takeaway">${esc(v.short)}</p><div class="story" id="story">${panels}</div><p class="warning"><span class="mark" aria-hidden="true">!</span><span>${esc(v.warning)}</span></p><details class="more"><summary>詳しく・出典</summary><div class="detailtext"><p><b>見分け方</b>　${esc(e.cue)}</p><p><b>実践</b>　${esc(e.action)}</p><p><b>注意</b>　${esc(e.caution)}</p>${e.note?'<p>'+esc(e.note)+'</p>':''}<p><b>別名</b>　${e.aliases.map(esc).join(' / ')}</p>${e.sources.map(k=>D.sources[k]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>${s.note?'<p>'+esc(s.note)+'</p>':''}`).join('')}<small>本文の出典確認：${D.reviewed}。図は仕組みの模式図です。ゲーム画面・公式アイコンではなく、時間・距離・倍率の実測値も表しません。</small></div></details><nav class="relations" aria-label="関連項目">${e.related.filter(id=>byId.has(id)).map(id=>`<button data-related="${id}">${V.icon(id)}<span>${esc(byId.get(id).title)} ↗</span></button>`).join('')}</nav><div class="paper-bottom"><span>${String(all.indexOf(e)+1).padStart(2,'0')} / ${all.length}</span><button class="copy" id="copy">項目のリンクをコピー</button></div>`;
document.title=e.title+'｜狩猟辞書';
$('bookmark').onclick=()=>{const was=favs.has(e.id);was?favs.delete(e.id):favs.add(e.id);const ok=save();filter();if(ok)toast(was?'しおりを外しました。':'しおりを挟みました。');};
$('copy').onclick=async()=>{const u=new URL(location.href);u.search='';u.hash=e.id;try{if(!navigator.clipboard||!window.isSecureContext)throw Error();await navigator.clipboard.writeText(u.href);toast('リンクをコピーしました。');}catch(_){window.prompt('この項目へのリンク',u.href);}};
if($('clutch-demo'))$('clutch-demo').onclick=()=>{const on=$('clutch-demo').getAttribute('aria-pressed')!=='true';$('clutch-demo').setAttribute('aria-pressed',String(on));$('story').classList.toggle('demo-done',on);$('story').lastElementChild.querySelector('.scene-label').innerHTML='<span>3</span>'+(on?'降りても、隙は続く':'隙が延びる');toast(on?'模式図：しがみつくことで隙を延長。':'模式図を戻しました。');};
}
function reset(){ $('lookup').value='';for(const x of ['weapon','category','edition'])$(x).value='all';$('first').checked=false;onlyFavs=false;filter();}
function go(id,push=true){if(!byId.has(id)){toast('この項目はまだ収録されていません。');return;}if(!visible.some(e=>e.id===id))reset();selected=id;renderList();renderDetail();view('detail');$('filterdetails').open=false;if(push&&location.hash.slice(1)!==id)window.history.pushState(null,'','#'+id);if(matchMedia('(max-width:850px)').matches)$('detail').scrollIntoView({block:'start'});$('detail').focus({preventScroll:true});}
[...new Set(all.map(e=>e.category))].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('category').append(o);});
$('lookup').addEventListener('input',()=>{filter();view('index');});$('clear').onclick=()=>{$('lookup').value='';filter();view('index');$('lookup').focus();};
for(const id of ['weapon','category','edition','first'])$(id).onchange=()=>{filter();view('index');};
$('reset').onclick=()=>{reset();view('index');};$('only-favs').onclick=()=>{onlyFavs=!onlyFavs;filter();view('index');};
$('entries').onclick=e=>{const b=e.target.closest('button[data-id]');if(b)go(b.dataset.id);if(e.target.closest('[data-reset]')){reset();view('index');}};
$('detail').onclick=e=>{const b=e.target.closest('button[data-related]');if(b)go(b.dataset.related);};
$('show-index').onclick=()=>view('index');$('show-detail').onclick=()=>view('detail');
function hashRead(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){toast('項目リンクの形式が不正です。');return;}if(id)go(id,false);else if(all.length)go(all[0].id,false);}
window.addEventListener('popstate',hashRead);window.addEventListener('hashchange',hashRead);
window.addEventListener('keydown',e=>{if(e.key==='/'&&!e.isComposing&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('lookup').focus();}if(e.key==='Escape')$('filterdetails').open=false;});
document.addEventListener('click',e=>{if(!$('filterdetails').contains(e.target))$('filterdetails').open=false;});
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({schema:'mh-hunting-dictionary-bookmarks-v1',version:'0.2.0',exported:new Date().toISOString(),ids:[...favs]},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='hunting-dictionary-bookmarks.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('しおりを書き出しました。');};
$('import').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error();const d=JSON.parse(await file.text());if(d.schema!=='mh-hunting-dictionary-bookmarks-v1'||!Array.isArray(d.ids)||!d.ids.every(x=>typeof x==='string'))throw Error();const ids=d.ids.filter(id=>byId.has(id));ids.forEach(id=>favs.add(id));const ok=save();filter();if(ok)toast(ids.length+'件を読み込みました。');}catch(_){toast('しおり書き出し用のJSONを選んでください。');}finally{e.target.value='';}};
window.addEventListener('storage',e=>{if(e.key!==key)return;try{const a=JSON.parse(e.newValue||'[]');if(Array.isArray(a)){favs=new Set(a.filter(id=>byId.has(id)));filter();}}catch(_){}});
filter();if(location.hash)hashRead();
})();
