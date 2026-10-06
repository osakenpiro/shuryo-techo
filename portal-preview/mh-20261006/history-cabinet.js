/* Additive interaction layer. Original museum callbacks remain the source of detail content. */
(() => {
 const catalog=window.MHHistoryCatalog;
 const buttons=[...document.querySelectorAll('#shelf > .hot')];
 const query=document.getElementById('history-shelf-query');
 const platform=document.getElementById('history-platform');
 const status=document.getElementById('history-shelf-status');
 const drawer=document.getElementById('dr');
 const close=document.getElementById('cx');
 const normalize=value=>String(value).normalize('NFKC').toLowerCase().replace(/\s+/g,'');
 let returnFocus=null;
 const platforms=['PSP','PSP','PSP','3DS','3DS','3DS','3DS','PS4','Switch','PS5','future'];
 const filter=()=>{
  const q=normalize(query.value);let count=0;
  buttons.forEach((button,i)=>{
   const matched=(platform.value==='all'||platform.value===platforms[i])&&normalize(D[i].slice(0,4).join(' ')+' '+window.historyPackageKeywords[i]).includes(q);
   button.hidden=!matched;if(matched)count++;
  });
  status.textContent=count ? count+' / 11展示。表紙または銘板から詳細へ。小さい画面では棚を横に送れます。' : '一致する展示がありません。検索語やゲーム機を変更してください。';
 };
 query.addEventListener('input',filter);platform.addEventListener('change',filter);
 document.getElementById('history-open-index').onclick=()=>document.getElementById('archive-history-open').click();
 const permalink=document.createElement('a');permalink.className='detail-permalink';permalink.textContent='この展示のリンク';drawer.appendChild(permalink);
 const reveal=(button,i)=>{
  returnFocus=button;drawer.setAttribute('aria-hidden','false');
  const hash=location.hash.slice(1).toLowerCase();
  const route=catalog.routes[hash]===i?hash:Object.keys(catalog.routes).find(key=>catalog.routes[key]===i);
  permalink.hidden=false;permalink.href='#'+route;
  if(button.hidden){query.value='';platform.value='all';filter();}
  drawer.focus({preventScroll:true});
 };
 buttons.forEach((button,i)=>button.addEventListener('click',()=>reveal(button,i)));
 document.getElementById('psp').addEventListener('click',()=>{returnFocus=document.getElementById('psp');drawer.setAttribute('aria-hidden','false');permalink.hidden=true;drawer.focus({preventScroll:true});});
 const originalClose=close.onclick;
 close.onclick=()=>{originalClose();drawer.setAttribute('aria-hidden','true');returnFocus?.focus({preventScroll:true});};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&drawer.classList.contains('on')&&!document.getElementById('archive-index').open){event.preventDefault();close.click();}});
 filter();
})();
