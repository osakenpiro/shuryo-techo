import * as C from './material-core.js';
import * as A from './adventure-core.js';
import * as O from './ordered-combat.js';
const copy=x=>structuredClone(x),r=x=>Math.round(x*10)/10;
export function beginDuel(state,opponent,seed,kind){
 const b={id:seed,kind,name:opponent.name,hp:opponent.state.run.hp,maxHp:opponent.state.run.maxHp,mp:opponent.state.run.mp,round:1,seriesUsed:false,pile:A.makePile(state,seed),ended:false};
 A.draw(b.pile);O.prepare(b,true,true);O.ensurePlayableHand(state,b,A.card);delete b.bot;b.signals=[];return b;
}
// Both three-card plans are validated against both real inventories before any mutation.
// Two beats resolve simultaneously, including a committed second beat after a first-beat KO.
export function resolvePair(left,right,plans){
 const seats=[left,right],before=seats.map(x=>copy(x.state.run)),bs=seats.map(x=>x.duel),totals=seats.map((x,i)=>O.totals(x.state,bs[i],plans[i],A.card,true)),defs=seats.map(x=>O.defense(x.state)),charge=bs.map(b=>b.counter?.player||0),until=bs.map(b=>b.counter?.playerUntil||0),beats=[[],[]];
 for(let k=0;k<2;k++){
  const cs=totals.map(t=>t.cards[k]),attack=cs.map((c,i)=>{const n=c.damage||0;return n?n+charge[i]:0;}),spent=cs.map((c,i)=>c.damage?charge[i]:0);
  for(let i=0;i<2;i++)if(cs[i].damage)charge[i]=0;
  const blocked=cs.map((c,i)=>!!(c.block&&attack[1-i]>0&&((c.kind==='ward')===!!cs[1-i].spell))),damage=attack.map((a,i)=>r(Math.max(0,a-(blocked[1-i]?cs[1-i].block:0)-(cs[i].spell?defs[1-i].magic:defs[1-i].physical))));
  for(let i=0;i<2;i++){
   const s=seats[i].state,foe=seats[1-i].state,c=cs[i],f=cs[1-i],ownBefore=s.run.hp,foeBefore=foe.run.hp;
   beats[i].push({beat:k+1,player:c.name,playerLabel:c.label||c.name,playerKind:c.kind,playerSpell:!!c.spell,opponent:f.label||f.name,foeSpell:!!f.spell,dealt:damage[i],taken:damage[1-i],guarded:blocked[i],foeGuarded:blocked[1-i],counterSpent:spent[i],foeCounterSpent:spent[1-i],counterReady:blocked[i]?c.counterBoost:0,ownHpBefore:ownBefore,ownHpAfter:Math.max(0,r(ownBefore-damage[1-i])),foeHpBefore:foeBefore,foeHpAfter:Math.max(0,r(foeBefore-damage[i])),armor:f.spell?defs[i].magic:defs[i].physical,foePower:f.damage||0});
   if(blocked[i]){charge[i]=c.counterBoost;until[i]=bs[i].round+1;}
  }
  for(let i=0;i<2;i++)seats[i].state.run.hp=beats[i][k].ownHpAfter;
 }
 for(let i=0;i<2;i++){
  const s=seats[i].state,b=bs[i],t=totals[i],wear={};
  s.run.mp=t.mpAfter;for(const[id,n]of Object.entries(t.uses)){const item=s.run.items.find(x=>x.id===id);wear[id]={name:C.DEFS[item.defId].name,before:item.durability,after:item.durability-n};item.durability-=n;}if(t.freeSeries)b.seriesUsed=true;
  b.counter={player:charge[i],playerUntil:until[i],opponent:charge[1-i],opponentUntil:until[1-i]};b.hp=seats[1-i].state.run.hp;b.mp=seats[1-i].state.run.mp;b.retainedUid=t.cards[2].uid;b.draft=[...plans[i]];
  b.reveal={round:b.round,player:t.cards.slice(0,2).map(c=>c.label||c.name),opponent:totals[1-i].cards.slice(0,2).map(c=>c.label||c.name),dealt:r(beats[i].reduce((n,x)=>n+x.dealt,0)),taken:r(beats[i].reduce((n,x)=>n+x.taken,0)),mp:before[i].mp-s.run.mp,durability:copy(t.uses),retained:t.cards[2].label||t.cards[2].name,retainedUid:b.retainedUid,beats:beats[i],counterAfter:copy(b.counter),resources:{before:{hp:before[i].hp,mp:before[i].mp,coin:before[i].coin,foeHp:before[1-i].hp},after:{hp:s.run.hp,mp:s.run.mp,coin:s.run.coin,foeHp:b.hp},wear}};
  b.ended=s.run.hp===0||b.hp===0||b.round>=8;
 }
 for(let i=0;i<2;i++)bs[i].mp=seats[1-i].state.run.mp;
 return bs.map(b=>copy(b.reveal));
}
export function nextRound(seat){const b=seat.duel,retained=b.pile.hand.find(c=>c.uid===b.retainedUid);if(!retained)throw Error('持ち越す札がありません');b.pile.discard.push(...b.pile.hand.filter(c=>c.uid!==retained.uid));b.pile.hand=[retained];A.draw(b.pile);b.round++;b.reveal=null;b.draft=[];for(const key of ['player','opponent'])if((b.counter[key+'Until']||0)<b.round)b.counter[key]=0;delete b.handRecovery;O.ensurePlayableHand(seat.state,b,A.card);}
