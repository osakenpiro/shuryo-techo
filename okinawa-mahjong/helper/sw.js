'use strict';
const VERSION='1.0.0';
const CACHE='mj-tebiki-'+VERSION;
const SCOPE=self.registration.scope;
const FILES=['./','index.html','core.js?v=1','yaku.js?v=1','glossary.js?v=1','tiles.js?v=1.0.0','app.js?v=1.0.0','app-shell.js?v=1.0.0','app-shell.css?v=1.0.0','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon-maskable.png','share-qr.svg'];
const URLS=FILES.map(x=>new URL(x,SCOPE).href);
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // A failed asset aborts installation; the old worker and complete cache stay active.
  await cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})));
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('mj-tebiki-')&&n!==CACHE).map(n=>caches.delete(n)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(SCOPE))return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Keep the HTML and its versioned assets together until an explicit update.
    if(req.mode==='navigate'&&(url.pathname===new URL(SCOPE).pathname||url.pathname===new URL('index.html',SCOPE).pathname))return (await cache.match(new URL('index.html',SCOPE).href))||fetch(req);
    return (await cache.match(req))||fetch(req);
  })());
});
self.addEventListener('message',e=>{
  if(e.data?.type==='ACTIVATE_UPDATE'){self.skipWaiting();return;}
  if(e.data?.type==='SHELL_STATUS')e.waitUntil((async()=>{
    const cache=await caches.open(CACHE),all=await Promise.all(URLS.map(url=>cache.match(url)));
    e.ports?.[0]?.postMessage({ready:all.every(Boolean),version:VERSION,count:all.filter(Boolean).length});
  })());
});
