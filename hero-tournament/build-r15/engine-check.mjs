import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [stage,baseline,output]=process.argv.slice(2);
const load=p=>import(pathToFileURL(path.resolve(p)).href);
const C=await load(path.join(stage,'game/material-core.js'));
const A=await load(path.join(stage,'game/adventure-core.js'));
const O=await load(path.join(stage,'game/ordered-combat.js'));
const Base=await load(path.join(baseline,'ordered-combat.js'));
const {resolvePair}=await load(path.join(stage,'game/room-combat.js'));
const clone=structuredClone,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function state(){let s=C.createReview();s.journey={stage:'duel'};s.run.hp=s.run.maxHp=25;s.run.mp=6;s.run.maxMp=12;s.run.items=[];for(const [k,id] of ['PAPER_RAPIER','FROST_WAND','SHIELD'].entries()){const i={id:'G'+k,defId:id,placement:null,durability:C.DEFS[id].weapon?.durability??null};s.run.items.push(i);s=C.move(s,i.id,C.firstFit(s,i));}return s;}
function battle(signals){return {id:'check',balance:2,round:1,counter:{player:0,opponent:0},hp:25,maxHp:25,mp:12,pile:{hand:[{uid:'p',kind:'weapon',itemId:'G0'},{uid:'p2',kind:'weapon',itemId:'G0'},{uid:'m',kind:'weapon',itemId:'G1'},{uid:'g',kind:'guard'},{uid:'w',kind:'ward'},{uid:'f',kind:'focus'}],draw:[],discard:[]},signals,bot:signals.map(x=>({name:x,damage:8,spell:x==='magic'})),draft:[]};}
let legal=0,illegal=0,room=0;const conditions=[];
for(const [label,signals,mp,wear] of [['physical',['physical','physical'],6,7],['magic',['magic','magic'],6,7],['low-mp',['magic','physical'],0,7],['last-wear',['physical','magic'],6,1]]){const s=state();s.run.mp=mp;s.run.items[0].durability=wear;const b=battle(signals);let count=0;assert(!O.render(s,b,A.card,()=>'',esc).includes('ordered-plan-resources'));
for(const a of b.pile.hand)for(const c of b.pile.hand)for(const z of b.pile.hand){const ids=[a.uid,c.uid,z.uid];if(new Set(ids).size<3)continue;const bc=clone(b);bc.draft=ids;let p;try{p=O.planResources(s,bc,A.card);}catch{illegal++;continue;}
const sourceBefore=clone(s),original=clone(s),bp=clone(bc),sc=clone(s),bc2=clone(bc);const r=O.resolve(sc,bc2,A.card),r0=Base.resolve(original,bp,A.card);assert.deepEqual(sc,original);assert.deepEqual(r,r0);assert.equal(p.mpAfter,sc.run.mp);assert.equal(p.reserve.uid,ids[2]);for(const w of p.wear)assert.equal(w.after,sc.run.items.find(i=>i.id===w.id).durability);assert(p.wear.every(w=>w.after>=0));
const left={state:clone(s),duel:clone(bc)},right={state:clone(s),duel:clone(bc)};resolvePair(left,right,[ids,ids]);assert.equal(left.state.run.mp,p.mpAfter);for(const w of p.wear)assert.equal(left.state.run.items.find(i=>i.id===w.id).durability,w.after);room++;
const html=O.render(s,bc,A.card,()=>'',esc);assert(html.includes('持ち越し・消費なし'));if(p.wear.some(w=>w.after===0))assert(html.includes('使い切り'));assert.deepEqual(s,sourceBefore);legal++;count++;
}
conditions.push({label,legal:count});
// One and two-card previews must remain valid before a reserve is selected.
for(const ids of [['g'],['w','g']]){const partial=clone(b);partial.draft=ids;assert.equal(O.planResources(s,partial,A.card).count,ids.length);assert.equal(O.planResources(s,partial,A.card).reserve,null);}
}
// Resource preview must neither disclose nor depend on an opponent's hidden plan.
const s=state(),b=battle(['magic','physical']);b.draft=['g','m','p'];const before=clone({s,b}),p=O.planResources(s,b,A.card);b.bot=[{secret:'redacted'}];assert.deepEqual(O.planResources(s,b,A.card),p);b.bot=before.b.bot;assert.deepEqual({s,b},before);
// A free series cast plus focus can spend and restore MP despite a zero net delta.
let series=state();series.run.mp=series.run.maxMp=12;for(const [k,id] of ['MAGE_HAT','MAGE_ROBE','MAGE_BOOTS'].entries()){const item={id:'S'+k,defId:id,placement:null,durability:null};series.run.items.push(item);series=C.move(series,item.id,C.firstFit(series,item));}assert(C.stats(series).seriesReady);const sb=battle(['physical','magic']);sb.draft=['m','f','g'];const sp=O.planResources(series,sb,A.card);assert.equal(sp.mpBefore,sp.mpAfter);assert.deepEqual(sp.wear,[]);const sh=O.render(series,sb,A.card,()=>'',esc);assert(sh.includes('残量は変わらない'));assert(!sh.includes('魔力・耐久の消費なし'));
const changed=JSON.parse(fs.readFileSync(new URL('./overrides.json',import.meta.url),'utf8')).map(x=>x.path);
const result={baseline:'r14',kind:'engine-and-render-regression-not-human-play',legalPlans:legal,rejectedIllegalPlans:illegal,roomResourceComparisons:room,conditions,changed,ruleOutputsUnchanged:true};fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(result);
