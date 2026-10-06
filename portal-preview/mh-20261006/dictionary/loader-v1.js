/* Atomic data/app version check; asynchronous failures leave a readable retry path. */
(() => {
  'use strict';
  const status=document.getElementById('load-message');
  const root=document.querySelector('main');
  root.inert=true;
  document.getElementById('retry-load').onclick=()=>location.reload();
  function load(src){return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const timer=setTimeout(()=>{script.remove();reject(Error('Load timeout: '+src));},12000);
    script.src=src;script.onload=()=>{clearTimeout(timer);resolve();};
    script.onerror=()=>{clearTimeout(timer);reject(Error('Load failed: '+src));};
    document.head.append(script);
  });}
  (async()=>{
    try {
      await load('data-v1.js');
      if(window.HUNTING_DICTIONARY?.version!=='1.0.0')throw Error('Data version mismatch');
      await load('app-v1.js');
      if(document.body.dataset.ready!=='true')throw Error('App did not initialize');
      document.getElementById('load-status').hidden=true;root.inert=false;
    } catch(error) {
      document.body.dataset.ready='error';
      document.getElementById('retry-load').hidden=false;
      status.textContent='辞書の読み込みに失敗しました。通信を確認して再読み込みしてください。保存済みのしおりは消していません。';
      console.error('Dictionary initialization:',error.message);
    }
  })();
})();
