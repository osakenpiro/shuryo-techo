import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {HUNTERS,blankBook,initialBook,migrationFromLocal,validateBook,validatePlan,revisionNext,ConflictError,encode} from './core.mjs';
const fixture=()=>({version:1,hunters:HUNTERS.map(blankBook),plan:[{id:'mixed',title:'共有の狩り',note:'混ぜない',done:false}]});
test('migration is own-only and leaves original IDs, inventory, progress untouched',()=>{
  const state=fixture();state.hunters[0].name='おさだ';state.hunters[0].stock['砕竜の撃滅拳']=3;
  state.hunters[0].requests=[{id:'old-stable-id',itemId:'lightbreak-axe',memo:'本人の最新メモ',priority:3,done:true}];
  state.hunters[1].stock.private=9;const raw=JSON.stringify(state);
  const own=migrationFromLocal(raw,'osakenpiro');
  assert.equal(JSON.stringify(state),raw);assert.equal(own.name,'osakenpiro');assert.equal(own.requests[0].id,'old-stable-id');assert.equal(own.requests[0].done,true);assert.equal(own.requests[0].priority,3);assert.equal(own.stock['砕竜の撃滅拳'],3);assert.equal(own.hunters,undefined);assert.equal(own.plan,undefined);assert.equal(own.stock.private,undefined);
});
test('cannot import another hunter as self',()=>assert.throws(()=>validateBook(blankBook('serket'),'osakenpiro')));
test('missing/duplicate canonical identity is rejected',()=>{assert.throws(()=>migrationFromLocal({version:1,hunters:[]},'osakenpiro'));const f=fixture();f.hunters.push(blankBook('osakenpiro'));assert.throws(()=>migrationFromLocal(f,'osakenpiro'));});
test('unknown stock stays null, zero stays zero, negatives and fractions reject',()=>{const h=blankBook('osakenpiro');h.stock={unknown:null,empty:0};assert.deepEqual(validateBook(h,h.id).stock,h.stock);h.stock.empty=-1;assert.throws(()=>validateBook(h,h.id));h.stock.empty=1.2;assert.throws(()=>validateBook(h,h.id));});
test('prototype keys and duplicate request IDs reject',()=>{const h=blankBook('osakenpiro');h.stock=JSON.parse('{"__proto__":0}');assert.throws(()=>validateBook(h,h.id));h.stock={};const r={id:'a',itemId:'x',memo:'',priority:2,done:false};h.requests=[r,r];assert.throws(()=>validateBook(h,h.id));});
test('initial 12 contain all original requests plus priority Fatalis, friends start blank',()=>{
  const sandbox={window:{}};vm.runInNewContext(readFileSync(new URL('../data.js',import.meta.url),'utf8'),sandbox);
  const items=[...sandbox.window.HUNT_DATA.items,{id:'fatalis-sa-set',note:'最優先候補'}];
  const h=initialBook('osakenpiro',items);assert.equal(h.requests.length,12);assert.equal(h.requests.find(r=>r.itemId==='fatalis-sa-set').priority,1);assert.equal(h.stock['ゼニー'],20218);assert.equal(h.requests.filter(r=>r.itemId.endsWith('-bow')).length,5);
  for(const friend of HUNTERS.slice(1))assert.equal(initialBook(friend,items).requests.length,0);
});
test('stale revisions reject rather than silently overwrite',()=>{assert.equal(revisionNext(null,0),1);assert.equal(revisionNext({revision:9},9),10);assert.throws(()=>revisionNext({revision:9},8),ConflictError);});
test('invalid and oversized plans reject',()=>{assert.deepEqual(validatePlan([]),[]);assert.throws(()=>validatePlan([{id:'x',title:'',note:'',done:false}]));assert.throws(()=>encode({text:'あ'.repeat(70000)}));});
