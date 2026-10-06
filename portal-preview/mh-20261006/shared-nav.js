(()=>{'use strict';
document.querySelectorAll('[data-local-nav]').forEach(n=>{n.hidden=true});
if(document.getElementById('mh-shared-nav'))return;
const prefix=document.currentScript?.dataset.mhRoot||'';
const page=prefix||location.pathname.endsWith('/notebook.html')?'weapons.html':location.pathname.split('/').pop()||'index.html';
const header=document.createElement('header');header.id='mh-shared-nav';
const brand=document.createElement('a');brand.className='mh-brand';brand.href=prefix+'index.html';brand.textContent='MONSTER HUNTER PORTAL';
const sub=document.createElement('small');sub.textContent='狩りが、つながる。';brand.appendChild(sub);header.appendChild(brand);
const nav=document.createElement('nav');nav.setAttribute('aria-label','ポータル共通');
for(const [href,label]of [['index.html','トップ'],['history.html','狩猟歴史館'],['weapons.html','武器棚']]){const a=document.createElement('a');a.href=prefix+href;a.textContent=label;if(page===href)a.setAttribute('aria-current','page');nav.appendChild(a)}header.appendChild(nav);
if(page!=='index.html'){const back=document.createElement('a');back.className='mh-home-link';back.href=prefix+'index.html';back.textContent='← トップへ戻る';header.appendChild(back)}
document.body.prepend(header);
})();
