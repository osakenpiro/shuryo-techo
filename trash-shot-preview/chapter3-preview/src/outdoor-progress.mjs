// Chapter 3 facts are separate from normal clear, wallet and replay playback.
export const OUTDOOR_CHAPTER_IDS=Object.freeze(['outdoor-shrine','outdoor-baseball','outdoor-mall','outdoor-river']);
export const OUTDOOR_STAGE_ITEMS=Object.freeze(Object.fromEntries(OUTDOOR_CHAPTER_IDS.map((id,index)=>[id,['coin','baseball','ice-scoop','firework-ball'][index]])));
export const OUTDOOR_ITEM_IDS=Object.freeze(Object.values(OUTDOOR_STAGE_ITEMS));
export const OUTDOOR_ROUTE_LABELS=Object.freeze({4:'工場・動く系',5:'色物'});
const fail=message=>{throw new Error(message);};
function record(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('Invalid outdoor progress');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).length!==keys.length||keys.some(key=>!Object.hasOwn(descriptors,key)||!Object.hasOwn(descriptors[key],'value')||!descriptors[key].enumerable))fail('Invalid outdoor progress fields');
}
function list(value,allowed){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>allowed.length||Reflect.ownKeys(value).length!==value.length+1)fail('Invalid outdoor progress list');
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!Object.hasOwn(d,'value')||!d.enumerable||!allowed.includes(d.value))fail('Invalid outdoor progress list');}
  if(new Set(value).size!==value.length)fail('Duplicate outdoor progress');
  return allowed.filter(id=>value.includes(id));
}
export const emptyOutdoorProgress=()=>({playedIDs:[],normalIDs:[],altIDs:[],firstRoute:null,forkAltCount:null,unlockedRoutes:[]});
export function validateOutdoorProgress(value,{completedIDs=[],cumulativeAttempts=0,cumulativeSuccesses=0}={}){
  record(value,['playedIDs','normalIDs','altIDs','firstRoute','forkAltCount','unlockedRoutes']);
  const playedIDs=list(value.playedIDs,OUTDOOR_CHAPTER_IDS),normalIDs=list(value.normalIDs,OUTDOOR_CHAPTER_IDS),altIDs=list(value.altIDs,OUTDOOR_CHAPTER_IDS),unlockedRoutes=list(value.unlockedRoutes,[4,5]);
  const completed=OUTDOOR_CHAPTER_IDS.filter(id=>completedIDs.includes(id));
  if([...normalIDs,...altIDs].some(id=>!playedIDs.includes(id)||!completed.includes(id))||completed.some(id=>!normalIDs.includes(id)&&!altIDs.includes(id)))fail('Inconsistent outdoor solutions');
  if(playedIDs.some(id=>{const index=OUTDOOR_CHAPTER_IDS.indexOf(id);return index>0&&!completed.includes(OUTDOOR_CHAPTER_IDS[index-1]);})||cumulativeAttempts<playedIDs.length)fail('Inconsistent outdoor play history');
  if(cumulativeSuccesses<completedIDs.length+normalIDs.filter(id=>altIDs.includes(id)).length)fail('Inconsistent outdoor success history');
  const finished=completed.length===OUTDOOR_CHAPTER_IDS.length;
  if(!finished){if(value.firstRoute!==null||value.forkAltCount!==null||unlockedRoutes.length)fail('Outdoor fork before chapter clear');}
  else{
    if(![4,5].includes(value.firstRoute)||!Number.isInteger(value.forkAltCount)||value.forkAltCount<0||value.forkAltCount>altIDs.length||value.forkAltCount>4
      ||value.firstRoute!==(value.forkAltCount>=2?4:5)||!unlockedRoutes.includes(value.firstRoute)||altIDs.length>=2&&!unlockedRoutes.includes(4))fail('Inconsistent outdoor fork');
  }
  return {playedIDs,normalIDs,altIDs,firstRoute:value.firstRoute,forkAltCount:value.forkAltCount,unlockedRoutes};
}
// These helpers describe facts; only the app's live-shot progress reducer writes.
export function outdoorSnapshot(progress){
  const facts=progress?.version>=3?progress.outdoor:emptyOutdoorProgress();
  const result={...facts,playedIDs:[...facts.playedIDs],normalIDs:[...facts.normalIDs],altIDs:[...facts.altIDs],unlockedRoutes:[...facts.unlockedRoutes]};
  return {...result,altCount:result.altIDs.length,complete:OUTDOOR_CHAPTER_IDS.every(id=>progress?.completedIDs?.includes(id)),recommendedRoute:result.altIDs.length>=2?4:5};
}
export function outdoorStageItem(stageId){return OUTDOOR_STAGE_ITEMS[stageId]??null;}
export function applyOutdoorAttempt(progress){
  const facts=progress.outdoor,id=progress.resumeStage;
  if(OUTDOOR_CHAPTER_IDS.includes(id)&&!facts.playedIDs.includes(id))facts.playedIDs.push(id);
}
export function applyOutdoorClear(progress,id,goalRole='normal'){
  if(!OUTDOOR_CHAPTER_IDS.includes(id))return;
  const facts=progress.outdoor,list=goalRole==='alternative'?facts.altIDs:facts.normalIDs;
  if(!list.includes(id))list.push(id);
  if(OUTDOOR_CHAPTER_IDS.every(stage=>progress.completedIDs.includes(stage))){
    if(facts.firstRoute===null){facts.forkAltCount=facts.altIDs.length;facts.firstRoute=facts.forkAltCount>=2?4:5;facts.unlockedRoutes.push(facts.firstRoute);}
    if(facts.altIDs.length>=2&&!facts.unlockedRoutes.includes(4))facts.unlockedRoutes.push(4);
  }
}
