// Local rewards are earned from a live, issued shot; portable saves are not authentication.
import {CHAPTER_IDS,FIRST_CHAPTER_IDS} from './progress-save.mjs?v=20261015-screen-pull-1';
import {SHOT_ROLES} from './shot-analytics.mjs?v=20261015-screen-pull-1';
import {THROWABLE_CATALOG,DEFAULT_THROWABLE_ID} from './throwables.mjs?v=20261015-screen-pull-1';

export {THROWABLE_CATALOG as ITEM_CATALOG};
const ITEMS=Object.keys(THROWABLE_CATALOG),MAX_SHOTS=1000000,MAX_CONTACTS=2400;
const ROLE_LABELS=Object.freeze({...SHOT_ROLES,'desk-bank':'机当て','wall-bank':'壁当て','ceiling-bank':'天井当て','furniture-bank':'家具当て'});
const BONUSES=Object.freeze({'floor-1':25,'floor-2':75,'floor-3plus':125,'rim-bank':25,'side-bank':25,'desk-bank':35,'wall-bank':40,'ceiling-bank':50,'furniture-bank':25});
const MAX_POINTS=200+125+Object.entries(BONUSES).filter(([id])=>!id.startsWith('floor-')).reduce((sum,[,points])=>sum+points,0);
export const ACHIEVEMENTS=Object.freeze(Object.fromEntries([
  ['first-clear','はじめての成功'],['hole-in-one','ホールインワン'],...Object.entries(ROLE_LABELS),
].map(([id,label])=>[id,Object.freeze({id,label})])));
const ACHIEVEMENT_IDS=Object.keys(ACHIEVEMENTS);
const fail=message=>{throw new Error(message);};
const integer=(value,min=0,max=MAX_SHOTS)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
function record(value,keys,required=keys){
  if(value===null||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('Invalid rewards object');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!keys.includes(key)||!Object.hasOwn(descriptors[key],'value')||!descriptors[key].enumerable)
    ||required.some(key=>!Object.hasOwn(descriptors,key)))fail('Unknown, missing or accessor rewards fields');
}
function list(value,allowed){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>allowed.length)fail('Invalid rewards list');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).some(key=>key!=='length'&&(typeof key!=='string'||!/^(0|[1-9]\d*)$/.test(key)||Number(key)>=value.length||!Object.hasOwn(descriptors[key],'value')||!descriptors[key].enumerable))
    ||Array.from({length:value.length},(_,i)=>String(i)).some(key=>!Object.hasOwn(descriptors,key))
    ||new Set(value).size!==value.length||value.some(id=>!allowed.includes(id)))fail('Invalid rewards list');
  return allowed.filter(id=>value.includes(id));
}
const fresh=()=>({version:1,totalPoints:0,totalCoinsEarned:0,wallet:0,achievements:[],purchased:[DEFAULT_THROWABLE_ID],equipped:DEFAULT_THROWABLE_ID,issuedShots:0,lastAwardedShot:0,awardedClears:0,pendingShot:null,itemRecords:{}});

export function validateRewards(value){
  record(value,Object.keys(fresh()));
  if(value.version!==1)fail('Invalid rewards version');
  for(const key of ['issuedShots','lastAwardedShot','awardedClears'])if(!integer(value[key]))fail('Invalid shot counter');
  for(const key of ['totalPoints','totalCoinsEarned','wallet'])if(!integer(value[key],0,MAX_POINTS*MAX_SHOTS))fail('Invalid rewards total');
  const achievements=list(value.achievements,ACHIEVEMENT_IDS),purchased=list(value.purchased,ITEMS);
  if(!purchased.includes(DEFAULT_THROWABLE_ID)||!purchased.includes(value.equipped))fail('Invalid ownership');
  const spent=purchased.reduce((sum,id)=>sum+THROWABLE_CATALOG[id].price,0);
  if(value.wallet!==value.totalCoinsEarned-spent)fail('Inconsistent wallet');
  const clears=value.awardedClears;
  if(value.lastAwardedShot>value.issuedShots||clears>value.lastAwardedShot||(clears===0)!==(value.lastAwardedShot===0))fail('Inconsistent shot history');
  if(value.totalPoints<100*clears||value.totalPoints>MAX_POINTS*clears
    ||value.totalCoinsEarned<10*clears||value.totalCoinsEarned>Math.floor(MAX_POINTS/10)*clears
    ||value.totalPoints<10*value.totalCoinsEarned||value.totalPoints>10*value.totalCoinsEarned+9*clears)fail('Inconsistent score history');
  if((clears===0&&achievements.length)||(clears>0&&!achievements.includes('first-clear')))fail('Inconsistent achievements');
  let pendingShot=null;
  if(value.pendingShot!==null){
    record(value.pendingShot,['ticket','stageId','itemId']);
    const pending=value.pendingShot;
    if(!integer(pending.ticket,1)||pending.ticket!==value.issuedShots||pending.ticket<=value.lastAwardedShot
      ||!CHAPTER_IDS.includes(pending.stageId)||!purchased.includes(pending.itemId))fail('Invalid pending shot');
    pendingShot={ticket:pending.ticket,stageId:pending.stageId,itemId:pending.itemId};
  }
  record(value.itemRecords,ITEMS,[]);
  const itemRecords={};let recordedClears=0;
  for(const itemId of ITEMS)if(Object.hasOwn(value.itemRecords,itemId)){
    if(!purchased.includes(itemId))fail('Record for unowned item');
    const source=value.itemRecords[itemId];record(source,CHAPTER_IDS,[]);
    if(Object.keys(source).length===0)fail('Empty item record');
    const stages={};
    for(const stageId of CHAPTER_IDS)if(Object.hasOwn(source,stageId)){
      const entry=source[stageId];record(entry,['bestPoints','bestAttempts','clears']);
      if(!integer(entry.bestPoints,100,MAX_POINTS)||!integer(entry.bestAttempts,1)||!integer(entry.clears,1))fail('Invalid item best record');
      recordedClears+=entry.clears;stages[stageId]={bestPoints:entry.bestPoints,bestAttempts:entry.bestAttempts,clears:entry.clears};
    }
    itemRecords[itemId]=stages;
  }
  if(recordedClears!==clears)fail('Inconsistent item clear history');
  return {version:1,totalPoints:value.totalPoints,totalCoinsEarned:value.totalCoinsEarned,wallet:value.wallet,achievements,purchased,equipped:value.equipped,issuedShots:value.issuedShots,lastAwardedShot:value.lastAwardedShot,awardedClears:clears,pendingShot,itemRecords};
}

// Keep TS2's original four-stage envelope strict even as live rewards gain
// append-only school identifiers. No wallet, item or achievement migration.
export function validateLegacyRewards(value){
  const data=validateRewards(value);
  if((data.pendingShot&&!FIRST_CHAPTER_IDS.includes(data.pendingShot.stageId))
    ||Object.values(data.itemRecords).some(records=>Object.keys(records).some(id=>!FIRST_CHAPTER_IDS.includes(id))))fail('School rewards require TS3');
  return data;
}

export function scoreSuccessfulShot({attempts,result}={}){
  if(!result||result.success!==true)return null;
  if(!integer(attempts,1))fail('Invalid attempt count');
  const countKeys=['floorBounces','rimHits','sideHits','deskHits','wallHits','ceilingHits','furnitureHits'];
  const counts=countKeys.map((key,index)=>{const n=result[key]??(index>=3?0:undefined);if(!integer(n,0,MAX_CONTACTS))fail('Invalid actual contact count');return n;});
  if(!Array.isArray(result.roles)||result.roles.length>Object.keys(ROLE_LABELS).length)fail('Invalid actual roles');
  const roles=result.roles.map(role=>{if(!role||typeof role!=='object'||!Object.hasOwn(ROLE_LABELS,role.id))fail('Invalid actual role');return role.id;});
  if(new Set(roles).size!==roles.length)fail('Duplicate actual roles');
  const expected=[];
  if(counts.every(n=>n===0))expected.push('direct');
  if(counts[0])expected.push(counts[0]===1?'floor-1':counts[0]===2?'floor-2':'floor-3plus');
  ['rim-bank','side-bank','desk-bank','wall-bank','ceiling-bank','furniture-bank'].forEach((id,i)=>{if(counts[i+1])expected.push(id);});
  if(roles.length!==expected.length||expected.some(id=>!roles.includes(id)))fail('Roles do not match actual contacts');
  const holeInOne=attempts===1,breakdown=[{id:'clear',label:'シュート成功',points:100}];
  if(holeInOne)breakdown.push({id:'hole-in-one',label:ACHIEVEMENTS['hole-in-one'].label,points:100});
  for(const id of expected)if(BONUSES[id])breakdown.push({id,label:ROLE_LABELS[id],points:BONUSES[id]});
  const points=breakdown.reduce((sum,row)=>sum+row.points,0);
  const achievementIds=['first-clear',...(holeInOne?['hole-in-one']:[]),...expected];
  return {points,coins:Math.floor(points/10),breakdown,holeInOne,achievements:achievementIds.map(id=>({...ACHIEVEMENTS[id]}))};
}

const eligible=context=>context?.eligible===true&&(context.source??'live')==='live'&&!context.training&&!context.practice&&CHAPTER_IDS.includes(context.stageId);
export function createRewards(initial){
  let state=validateRewards(initial??fresh());
  return {
    snapshot:()=>validateRewards(state),
    beginShot(context){
      const itemId=context?.itemId??state.equipped;
      if(!eligible(context)||itemId!==state.equipped||!state.purchased.includes(itemId)||state.issuedShots===MAX_SHOTS)return null;
      state.issuedShots++;state.pendingShot={ticket:state.issuedShots,stageId:context.stageId,itemId};return state.issuedShots;
    },
    award(context){
      if(!eligible(context))return {ok:false,reason:'ineligible'};
      const pending=state.pendingShot,itemId=context.itemId??state.equipped;
      if(!pending||context.ticket!==pending.ticket||context.stageId!==pending.stageId||itemId!==pending.itemId
        ||itemId!==state.equipped||context.ticket<=state.lastAwardedShot)return {ok:false,reason:'invalid-ticket'};
      let score;try{score=scoreSuccessfulShot(context);}catch{return {ok:false,reason:'invalid-result'};}
      if(!score)return {ok:false,reason:'not-success'};
      const next=validateRewards(state),newAchievements=score.achievements.filter(entry=>!next.achievements.includes(entry.id));
      next.totalPoints+=score.points;next.totalCoinsEarned+=score.coins;next.wallet+=score.coins;
      next.achievements.push(...newAchievements.map(entry=>entry.id));next.lastAwardedShot=context.ticket;next.awardedClears++;next.pendingShot=null;
      next.itemRecords[itemId]??={};
      const previous=next.itemRecords[itemId][context.stageId];
      next.itemRecords[itemId][context.stageId]={bestPoints:Math.max(previous?.bestPoints??0,score.points),bestAttempts:Math.min(previous?.bestAttempts??MAX_SHOTS,context.attempts),clears:(previous?.clears??0)+1};
      state=validateRewards(next);
      return {ok:true,points:score.points,coins:score.coins,breakdown:score.breakdown,holeInOne:score.holeInOne,newAchievements,totalPoints:state.totalPoints,wallet:state.wallet,itemId,itemBest:{...state.itemRecords[itemId][context.stageId]}};
    },
    purchase(itemId){
      if(!ITEMS.includes(itemId))return {ok:false,reason:'unknown-item'};
      if(state.purchased.includes(itemId))return {ok:false,reason:'already-owned'};
      const item=THROWABLE_CATALOG[itemId];if(state.wallet<item.price)return {ok:false,reason:'insufficient-coins'};
      state.wallet-=item.price;state.purchased.push(itemId);state=validateRewards(state);
      return {ok:true,itemId,wallet:state.wallet,equipped:state.equipped};
    },
    equip(itemId){
      if(!state.purchased.includes(itemId))return {ok:false,reason:'not-owned'};
      state.equipped=itemId;return {ok:true,itemId,wallet:state.wallet,equipped:itemId};
    },
  };
}
