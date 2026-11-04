import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const [stage,output]=process.argv.slice(2),load=p=>import(pathToFileURL(path.resolve(stage,'game',p)));
const C=await load('material-core.js'),A=await load('adventure-core.js'),O=await load('ordered-combat.js'),R=await load('room-combat.js'),P=await load('battle-policy.js');
function fixture(mp=0){let s=C.createReview();s.run.hp=s.run.maxHp=25;s.run.mp=mp;s.run.items=[];for(let k=0;k<3;k++){const i={id:'T'+k,defId:'THUNDER_TOME',durability:2,placement:null};s.run.items.push(i);s=C.move(s,i.id,C.firstFit(s,i));}const pile=A.makePile(s,'deadhand-regression');const all=pile.draw.splice(0);pile.hand=all.filter(x=>x.kind==='weapon').slice(0,5);pile.draw=all.filter(x=>!pile.hand.includes(x));const b={id:'fixture',round:1,balance:2,pile,retainedUid:pile.hand[0].uid,counter:{player:0,opponent:0}};return {s,b};}
const all=b=>[...b.pile.hand,...b.pile.draw,...b.pile.discard].map(x=>JSON.stringify(x)).sort();
let checks=0;
for(const source of ['draw','discard']){
 const {s,b}=fixture();if(source==='discard'){b.pile.discard=b.pile.draw;b.pile.draw=[];}
 const resources=structuredClone(s),before=all(b),retained=JSON.stringify(b.pile.hand[0]);assert(!O.hasLegalPlan(s,b,A.card));assert.throws(()=>P.choosePlan(s,b),/No legal/);
 assert(O.ensurePlayableHand(s,b,A.card));assert.equal(b.handRecovery.swaps.length,2);assert.equal(b.pile.hand.length,5);assert.equal(JSON.stringify(b.pile.hand[0]),retained);assert.deepEqual(all(b),before);assert.deepEqual(s,resources);assert(O.hasLegalPlan(s,b,A.card));assert.equal(P.choosePlan(s,b).length,3);
 const recovered=structuredClone(b);assert.equal(O.ensurePlayableHand(s,b,A.card),false);assert.deepEqual(b,recovered);checks+=10;
}
// A legal hand is byte-identical; a one-card rescue must not exchange two.
{
 const {s,b}=fixture(12),before=structuredClone(b);assert(O.hasLegalPlan(s,b,A.card));assert.equal(O.ensurePlayableHand(s,b,A.card),false);assert.deepEqual(b,before);checks+=3;
}
{
 const {s,b}=fixture();const i=b.pile.draw.findIndex(x=>x.kind==='guard');[b.pile.hand[1],b.pile.draw[i]]=[b.pile.draw[i],b.pile.hand[1]];assert(!O.hasLegalPlan(s,b,A.card));assert(O.ensurePlayableHand(s,b,A.card));assert.equal(b.handRecovery.swaps.length,1);checks+=3;
}
// Both public room seats take the same next-round path and keep the carried UID.
for(const cpu of [false,true]){
 const {s,b}=fixture(),reserved=b.pile.hand[0],others=[...b.pile.hand.slice(1),...b.pile.draw];b.pile.hand=[reserved];b.pile.draw=others.filter(x=>x.kind==='weapon').slice(0,4).reverse();b.pile.discard=others.filter(x=>!b.pile.draw.includes(x));b.round=2;b.retainedUid=reserved.uid;b.reveal={};
 R.nextRound({state:s,duel:b,cpu});assert(O.hasLegalPlan(s,b,A.card));assert.equal(b.pile.hand[0].uid,reserved.uid);assert.equal(b.pile.hand.length,5);assert.equal(b.round,3);checks+=4;
}
// No card generator or cost waiver: actually resolving a rescued plan still pays.
{
 const {s,b}=fixture();O.ensurePlayableHand(s,b,A.card);b.draft=P.choosePlan(s,b);const p=O.totals(s,b,b.draft,A.card,true);assert.equal(p.cards.slice(0,2).every(x=>x.mp===0),true);assert.equal(p.mpAfter,4);b.hp=b.maxHp=25;b.bot=[{name:'wait'},{name:'wait'}];O.resolve(s,b,A.card);assert.equal(s.run.mp,p.mpAfter);assert.equal(b.reveal.resources.after.mp,4);checks+=4;
}
const result={kind:'dead-hand regression; shared human/CPU preparation, existing card exchange only',checks,pass:true};fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(result);
