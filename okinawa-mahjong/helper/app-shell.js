'use strict';
(() => {
  const $=id=>document.getElementById(id), T=window.MJ_TILES;
  if(!T)return;
  let family='m', selected='1m';
  function selectTile(id,focus=false){
    const t=T.all.find(x=>x.id===id);if(!t)return;
    selected=id;
    document.querySelectorAll('[data-pai]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pai===id)));
    $('tile-reading').innerHTML=`${T.face(id)}<div><h3>${t.name}</h3><p class="reading">${t.reading}</p>${t.note?`<p>${t.note}</p>`:''}</div>`;
    if(focus)document.querySelector(`[data-pai="${id}"]`)?.focus({preventScroll:true});
  }
  function renderFamily(next){
    family=next;const f=T.families.find(x=>x.id===family);if(!f)return;
    $('pai-tabs').innerHTML=T.families.map(x=>`<button type="button" data-family="${x.id}" aria-pressed="${x.id===family}">${x.name}<small>${x.reading}</small></button>`).join('');
    $('pai-family-title').textContent=f.name+'（'+f.reading+'）';
    $('pai-family-hint').textContent=f.hint;
    $('pai-grid').innerHTML=T.all.filter(x=>x.family===family).map(t=>`<button type="button" class="pai-button" data-pai="${t.id}" aria-label="${t.name} ${t.reading}" aria-pressed="false">${T.face(t.id)}<small>${t.name}</small></button>`).join('');
    selectTile(T.all.find(t=>t.family===family).id);
  }
  $('pai-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-family]');if(!b)return;renderFamily(b.dataset.family);document.querySelector(`[data-family="${family}"]`).focus({preventScroll:true});});
  $('pai-grid').addEventListener('click',e=>{const b=e.target.closest('[data-pai]');if(b)selectTile(b.dataset.pai);});
  $('basic-shape').innerHTML=['123m','456p','789s','111z','55z'].map(g=>`<span class="mini-hand" aria-hidden="true">${g.slice(0,-1).split('').map(n=>T.face(n+g.slice(-1))).join('')}</span>`).join('');
  renderFamily('m');

  const dialog=$('share-dialog'), canonical=$('share-url').value;
  $('open-share').addEventListener('click',()=>{dialog.showModal();$('share-feedback').textContent='';});
  $('close-share').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  async function copyLink(){
    try{await navigator.clipboard.writeText(canonical);$('share-feedback').textContent='リンクをコピーしました。';}
    catch(_){$('share-url').focus();$('share-url').select();$('share-feedback').textContent='リンクを長押ししてコピーしてください。';}
  }
  $('copy-link').addEventListener('click',copyLink);
  $('share-link').addEventListener('click',async()=>{
    if(!navigator.share){await copyLink();return;}
    try{await navigator.share({title:'麻雀の手引き',text:'役・点数・牌の読み方。卓のそばに、小さな手引き。',url:canonical});}
    catch(e){if(e.name!=='AbortError')$('share-feedback').textContent='共有できませんでした。「リンクをコピー」をお使いください。';}
  });
  let installPrompt=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install-app').hidden=false;});
  $('install-app').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice.outcome==='accepted')$('install-state').textContent='追加したアイコンから使えます。';installPrompt=null;$('install-app').hidden=true;});
  window.addEventListener('appinstalled',()=>{$('install-app').hidden=true;$('install-state').textContent='ホーム画面から使えます。';});
  if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone)$('install-state').textContent='ホーム画面のアプリとして起動しています。';

  // Only claim offline readiness after the controlling worker verifies every shell asset.
  const status=$('offline-status');let reg=null;
  function shellReady(worker){return new Promise(resolve=>{
    if(!worker){resolve(false);return;}
    const channel=new MessageChannel();const timeout=setTimeout(()=>resolve(false),5000);
    channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data?.ready===true);};
    worker.postMessage({type:'SHELL_STATUS'},[channel.port2]);
  });}
  async function updateStatus(){
    const ready=await shellReady(navigator.serviceWorker?.controller);
    status.dataset.ready=String(ready);
    status.textContent=ready?(navigator.onLine?'✓ 役・点数・牌を、通信なしで使えます。':'通信なしで利用中 · 役・点数・牌を使えます。'):(navigator.onLine?'持ち歩く準備中。通信につないで、もう一度開いてください。':'初回の準備には通信が必要です。');
  }
  function showUpdate(){if(reg?.waiting&&navigator.serviceWorker.controller)$('update-note').hidden=false;}
  $('update-app').addEventListener('click',()=>{if(!reg?.waiting)return;$('update-app').disabled=true;reg.waiting.postMessage({type:'ACTIVATE_UPDATE'});});
  let updating=false;
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if($('update-app').disabled&&!updating){updating=true;location.reload();}else updateStatus();});
    window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async r=>{
      reg=r;showUpdate();
      r.addEventListener('updatefound',()=>{const worker=r.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){showUpdate();updateStatus();}});});
      await navigator.serviceWorker.ready;await updateStatus();
    }).catch(()=>{status.textContent='今は持ち歩く準備ができません。通信につないでお使いください。';});
  }else status.textContent='このブラウザでは、通信につないでお使いください。';
})();
