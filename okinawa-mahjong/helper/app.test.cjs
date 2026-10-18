'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const T=require('./tiles.js'),ROOT='https://osakenpiro.github.io/shuryo-techo/okinawa-mahjong/helper/';
test('34 distinct tiles: 9 in each suit, 7 honors, all with a reading',()=>{
  assert.equal(T.all.length,34);assert.equal(new Set(T.all.map(x=>x.id)).size,34);
  assert.deepEqual(T.families.map(f=>T.all.filter(t=>t.family===f.id).length),[9,9,9,7]);
  for(const t of T.all){assert.ok(t.name&&t.reading);assert.match(T.face(t.id),/<svg/);}
  assert.deepEqual(T.all.filter(t=>t.family==='z').map(t=>t.reading),['トン','ナン','シャー','ペイ','ハク','ハツ','チュン']);
  assert.ok(!T.face('5z').includes('<text'));assert.match(T.face('1s'),/<path/);
  for(let n=1;n<=9;n++)assert.equal((T.face(n+'p').match(/<circle/g)||[]).length,n*2);
});
test('all manifest icons and entrypoints exist in the retained helper scope',()=>{
  const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.webmanifest')));
  assert.equal(m.scope,'./');assert.equal(m.start_url,'./');assert.equal(m.display,'standalone');
  assert.deepEqual(m.icons.filter(i=>i.purpose==='any').map(i=>i.sizes),['192x192','512x512']);
  for(const i of m.icons)assert.ok(fs.existsSync(path.join(__dirname,i.src)));
  for(const shortcut of m.shortcuts)assert.match(shortcut.url,/^\.\/#(yaku|score|basics)$/);
});
function worker({offline=false,failFile=null,existing=new Map()}={}){
  const handlers={},buckets=existing,requested=[];let skip=0,claim=0;
  const key=r=>typeof r==='string'?r:r.url;
  const network=async r=>{const url=key(r);requested.push(url);if(offline||url.includes(failFile||'NO_MATCH'))throw Error('offline');const name=new URL(url).pathname.slice(new URL(ROOT).pathname.length)||'index.html';const file=path.join(__dirname,name);if(!fs.existsSync(file))return new Response('missing',{status:404});return new Response(fs.readFileSync(file));};
  const caches={open:async name=>{if(!buckets.has(name))buckets.set(name,new Map());const b=buckets.get(name);return {match:async r=>b.get(key(r))?.clone(),addAll:async requests=>{const staged=await Promise.all(requests.map(async r=>{const response=await network(r);if(!response.ok)throw Error('bad shell response');return [key(r),response];}));staged.forEach(([k,v])=>b.set(k,v));}};},keys:async()=>[...buckets.keys()],delete:async n=>buckets.delete(n)};
  const context={self:{registration:{scope:ROOT},location:{origin:new URL(ROOT).origin},clients:{claim:async()=>{claim++;}},skipWaiting:()=>{skip++;},addEventListener:(name,f)=>{handlers[name]=f;}},URL,Request,Response,caches,fetch:network,Promise};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'sw.js'),'utf8'),context);
  const event=(name,data={})=>{let waiting,response;handlers[name]({...data,waitUntil:p=>{waiting=p;},respondWith:p=>{response=p;}});return {waiting,response};};
  return {event,buckets,requested,get skipped(){return skip;},get claimed(){return claim;}};
}
test('complete shell installs; initial readiness is backed by every cached asset',async()=>{
  const w=worker();await w.event('install').waiting;assert.equal(w.skipped,0);
  let status;await w.event('message',{data:{type:'SHELL_STATUS'},ports:[{postMessage:x=>status=x}]}).waiting;
  assert.equal(status.ready,true);assert.equal(status.count,15);
});
test('offline restart returns HTML for root/index and serves the cached calculator',async()=>{
  const online=worker();await online.event('install').waiting;const off=worker({offline:true,existing:online.buckets});
  for(const suffix of ['','?from=homescreen','index.html?from=link']){
    const response=await off.event('fetch',{request:{method:'GET',url:ROOT+suffix,mode:'navigate'}}).response;
    assert.match(await response.text(),/麻雀の手引き/);
  }
  const response=await off.event('fetch',{request:{method:'GET',url:ROOT+'core.js?v=1',mode:'cors'}}).response;assert.match(await response.text(),/function score/);assert.equal(off.requested.length,0);
});
test('failed new shell leaves the old cache intact and cannot say ready',async()=>{
  const old=new Map([['mj-tebiki-old',new Map([['old','original']])]]),w=worker({failFile:'tiles.js',existing:old});
  await assert.rejects(w.event('install').waiting);assert.equal(old.get('mj-tebiki-old').get('old'),'original');assert.equal(w.skipped,0);
  let status;await w.event('message',{data:{type:'SHELL_STATUS'},ports:[{postMessage:x=>status=x}]}).waiting;assert.equal(status.ready,false);
});
test('activation only cleans this app caches; external links and sibling apps stay untouched',async()=>{
  const w=worker({existing:new Map([['unrelated-app',new Map()],['mj-tebiki-old',new Map()]])});await w.event('install').waiting;await w.event('activate').waiting;
  assert.ok(w.buckets.has('unrelated-app'));assert.ok(!w.buckets.has('mj-tebiki-old'));assert.equal(w.claimed,1);
  for(const url of ['https://example.org/','https://osakenpiro.github.io/mahjong-keikoba/'])assert.equal(w.event('fetch',{request:{method:'GET',url,mode:'navigate'}}).response,undefined);
  w.event('message',{data:{type:'ACTIVATE_UPDATE'}});assert.equal(w.skipped,1);
});
