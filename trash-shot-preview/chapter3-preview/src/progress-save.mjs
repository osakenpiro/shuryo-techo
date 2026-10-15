// Local player progress only. Portable codes are checksummed, not authenticated.
import {OUTDOOR_CHAPTER_IDS,emptyOutdoorProgress,validateOutdoorProgress,applyOutdoorAttempt,applyOutdoorClear,outdoorSnapshot,OUTDOOR_STAGE_ITEMS} from './outdoor-progress.mjs?v=20261015-screen-pull-1';
export {OUTDOOR_CHAPTER_IDS,outdoorSnapshot,outdoorStageItem,OUTDOOR_STAGE_ITEMS} from './outdoor-progress.mjs?v=20261015-screen-pull-1';
export const FIRST_CHAPTER_IDS=Object.freeze(['first','desk-over','desk-side','room-extra']);
export const SCHOOL_CHAPTER_IDS=Object.freeze(['school-classroom','school-vending','school-passage','school-rooftop']);
export const LEGACY_CHAPTER_IDS=Object.freeze([...FIRST_CHAPTER_IDS,...SCHOOL_CHAPTER_IDS]);
export const PREVIOUS_CHAPTER_IDS=Object.freeze([...LEGACY_CHAPTER_IDS,...OUTDOOR_CHAPTER_IDS]);
export const FACTORY_CHAPTER_IDS=Object.freeze(['factory-shutter','factory-conveyor','factory-bank','factory-relay']);
export const ECCENTRIC_CHAPTER_IDS=Object.freeze(['eccentric-tower','eccentric-train','eccentric-boar','eccentric-basket','eccentric-dandelion','eccentric-card','eccentric-cannon']);
export const BRANCH_CHAPTER_IDS=Object.freeze([...FACTORY_CHAPTER_IDS,...ECCENTRIC_CHAPTER_IDS]);
export const FACTORY_STAGE_ITEMS=Object.freeze(Object.fromEntries(FACTORY_CHAPTER_IDS.map((id,index)=>[id,['can','can','rubber-ball','heavy-ball'][index]])));
export const ECCENTRIC_STAGE_ITEMS=Object.freeze(Object.fromEntries(ECCENTRIC_CHAPTER_IDS.map((id,index)=>[id,['can','can','arrow','basketball','dandelion','playing-card','cannonball'][index]])));
export const STAGE_THROWABLE_ITEMS=Object.freeze({...OUTDOOR_STAGE_ITEMS,...FACTORY_STAGE_ITEMS,...ECCENTRIC_STAGE_ITEMS});
export const CHAPTER_IDS=Object.freeze([...PREVIOUS_CHAPTER_IDS,...BRANCH_CHAPTER_IDS]);
export const CHAPTERS=Object.freeze([
  Object.freeze({number:1,label:'自分の部屋',ids:FIRST_CHAPTER_IDS}),
  Object.freeze({number:2,label:'学校',ids:SCHOOL_CHAPTER_IDS}),
  Object.freeze({number:3,label:'外',ids:OUTDOOR_CHAPTER_IDS}),
  Object.freeze({number:4,label:'工場・動く系',ids:FACTORY_CHAPTER_IDS}),
  Object.freeze({number:5,label:'色物',ids:ECCENTRIC_CHAPTER_IDS}),
]);
export const chapterForStage=id=>CHAPTERS.find(chapter=>chapter.ids.includes(id))??null;
export function getNextStage(id,progress){
  const chapter=chapterForStage(id);if(!chapter)return null;
  const index=chapter.ids.indexOf(id);if(index<chapter.ids.length-1)return chapter.ids[index+1];
  if(chapter.number<3)return CHAPTERS.find(next=>next.number===chapter.number+1)?.ids[0]??null;
  if(chapter.number===3){const route=outdoorSnapshot(progress).firstRoute;return CHAPTERS.find(next=>next.number===route)?.ids[0]??null;}
  return null;
}
export const isChapterBoundary=id=>CHAPTERS.some(chapter=>chapter.ids.at(-1)===id);
export const PROGRESS_STORAGE_KEY='trash-shot-player-progress-v1';
const MAX=1000000,MAX_BYTES=4000,MAX_CODE=2048;
const fail=message=>{throw new Error(message);};
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min&&v<=MAX;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
function fields(value,allowed,required=allowed){
  if(!object(value))fail('Invalid progress object');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).some(key=>typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(descriptors[key],'value')||!descriptors[key].enumerable)
    ||required.some(key=>!Object.hasOwn(descriptors,key)))fail('Unknown or missing progress fields');
}
function ids(value,allowed){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>allowed.length)fail('Invalid completed IDs');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).some(key=>key!=='length'&&(typeof key!=='string'||!/^(0|[1-9]\d*)$/.test(key)||Number(key)>=value.length||!Object.hasOwn(descriptors[key],'value')||!descriptors[key].enumerable))
    ||Array.from({length:value.length},(_,i)=>String(i)).some(key=>!Object.hasOwn(descriptors,key))
    ||new Set(value).size!==value.length||value.some(id=>!allowed.includes(id)))fail('Invalid completed IDs');
}
export function validateProgress(value){
  const version=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'version')?.value:undefined;
  const keys=['version','introSeen','completedIDs','stageBestAttempts','cumulativeAttempts','cumulativeSuccesses','resumeStage','inputScheme',...([3,4].includes(version)?['outdoor']:[])];
  fields(value,keys,keys.filter(key=>key!=='introSeen'));
  if(![1,2,3,4].includes(value.version)||(value.introSeen!==undefined&&typeof value.introSeen!=='boolean'))fail('Invalid version or intro flag');
  // A legacy payload never gains new identifiers just because the catalog grew.
  const allowed=value.version===1?FIRST_CHAPTER_IDS:value.version===2?LEGACY_CHAPTER_IDS:value.version===3?PREVIOUS_CHAPTER_IDS:CHAPTER_IDS,completed=value.completedIDs;
  ids(completed,allowed);fields(value.stageBestAttempts,completed,[]);
  if(!integer(value.cumulativeAttempts)||!integer(value.cumulativeSuccesses)||value.cumulativeSuccesses>value.cumulativeAttempts||value.cumulativeSuccesses<completed.length)fail('Inconsistent totals');
  const best={};for(const id of allowed)if(completed.includes(id)){
    const n=value.stageBestAttempts[id];if(!integer(n,1)||n>value.cumulativeAttempts)fail('Invalid best count');best[id]=n;
  }
  if(value.version<4){
    if(completed.some(id=>allowed.slice(0,allowed.indexOf(id)).some(prior=>!completed.includes(prior))))fail('Nonsequential completion');
  }else{
    if(completed.some(id=>{const chapter=chapterForStage(id);return chapter.number<=3?PREVIOUS_CHAPTER_IDS.slice(0,PREVIOUS_CHAPTER_IDS.indexOf(id)).some(prior=>!completed.includes(prior)):chapter.ids.slice(0,chapter.ids.indexOf(id)).some(prior=>!completed.includes(prior))||!PREVIOUS_CHAPTER_IDS.every(prior=>completed.includes(prior));}))fail('Nonsequential chapter completion');
  }
  if(Object.values(best).reduce((sum,n)=>sum+n,0)+value.cumulativeSuccesses-completed.length>value.cumulativeAttempts)fail('Inconsistent attempt history');
  const resumeIndex=allowed.indexOf(value.resumeStage);
  if(resumeIndex<0||(value.version<4&&resumeIndex>0&&!completed.includes(allowed[resumeIndex-1]))||!['pull','swipe'].includes(value.inputScheme))fail('Invalid resume or input scheme');
  const state={version:value.version,introSeen:value.introSeen??false,completedIDs:allowed.filter(id=>completed.includes(id)),stageBestAttempts:best,cumulativeAttempts:value.cumulativeAttempts,cumulativeSuccesses:value.cumulativeSuccesses,resumeStage:value.resumeStage,inputScheme:value.inputScheme};
  if(value.version>=3)state.outdoor=validateOutdoorProgress(value.outdoor,state);
  if(value.version===4){
    if(!canChooseStage(state,state.resumeStage)||BRANCH_CHAPTER_IDS.some(id=>completed.includes(id)&&!state.outdoor.unlockedRoutes.includes(chapterForStage(id).number)))fail('Locked branch progress');
  }
  return state;
}
// Legacy saves remain byte-compatible in their codecs. Upgrade only at live
// hydration or an intentional school selection; keep a chosen room revisit.
export function migrateProgress(initial){
  const state=validateProgress(initial);
  if(state.version===1&&state.resumeStage==='room-extra'&&FIRST_CHAPTER_IDS.every(id=>state.completedIDs.includes(id)))return validateProgress({...state,version:2,resumeStage:SCHOOL_CHAPTER_IDS[0]});
  if(state.version===2&&state.resumeStage==='school-rooftop'&&LEGACY_CHAPTER_IDS.every(id=>state.completedIDs.includes(id)))return validateProgress({...state,version:3,resumeStage:OUTDOOR_CHAPTER_IDS[0],outdoor:emptyOutdoorProgress()});
  return state;
}
export function canChooseStage(progress,id){
  if(!progress||!Array.isArray(progress.completedIDs))return false;
  const chapter=chapterForStage(id);if(!chapter)return false;
  const index=chapter.ids.indexOf(id);
  if(chapter.number<=3){const prior=PREVIOUS_CHAPTER_IDS[PREVIOUS_CHAPTER_IDS.indexOf(id)-1];return prior===undefined||progress.completedIDs.includes(prior);}
  return outdoorSnapshot(progress).complete&&outdoorSnapshot(progress).unlockedRoutes.includes(chapter.number)&&(index===0||progress.completedIDs.includes(chapter.ids[index-1]));
}
export function createChapterProgress(initial){
  let state=initial!=null?migrateProgress(initial):validateProgress({version:1,introSeen:false,completedIDs:[],stageBestAttempts:{},cumulativeAttempts:0,cumulativeSuccesses:0,resumeStage:'first',inputScheme:'pull'}),pending=false;
  return {
    recordAttempt(id=state.resumeStage){if(id!==state.resumeStage||state.cumulativeAttempts===MAX)return false;state.cumulativeAttempts++;pending=true;if(state.version>=3)applyOutdoorAttempt(state);return true;},
    clear(id=state.resumeStage,attempts=1,{goalRole='normal'}={}){
      if(!['normal','alternative'].includes(goalRole)||!pending||id!==state.resumeStage||!integer(attempts,1)||attempts>state.cumulativeAttempts||state.cumulativeSuccesses===MAX)return false;
      pending=false;state.cumulativeSuccesses++;
      if(!state.completedIDs.includes(id))state.completedIDs.push(id);
      state.stageBestAttempts[id]=Math.min(state.stageBestAttempts[id]??MAX,attempts);
      if(state.version>=3)applyOutdoorClear(state,id,goalRole);
      state=validateProgress(state);return true;
    },
    chooseStage(id){if(!canChooseStage(state,id))return false;if(BRANCH_CHAPTER_IDS.includes(id)&&state.version<4)state.version=4;else if(OUTDOOR_CHAPTER_IDS.includes(id)&&state.version<3){state.version=3;state.outdoor=emptyOutdoorProgress();}else if(SCHOOL_CHAPTER_IDS.includes(id)&&state.version===1)state.version=2;state.resumeStage=id;pending=false;state=validateProgress(state);return true;},
    unlockRoute(route){if(state.version<3||!outdoorSnapshot(state).complete||![4,5].includes(route)||route===4&&state.outdoor.altIDs.length<2)return false;if(!state.outdoor.unlockedRoutes.includes(route))state.outdoor.unlockedRoutes.push(route);state=validateProgress(state);return true;},
    setInputScheme(scheme){if(!['pull','swipe'].includes(scheme))return false;state.inputScheme=scheme;return true;},
    setIntroSeen(seen=true){if(typeof seen!=='boolean')return false;state.introSeen=seen;return true;},
    snapshot(){return validateProgress(state);}
  };
}
function canonical(data){const state=validateProgress(data),text=JSON.stringify(state);if(text.length>(state.version>=3?MAX_BYTES:1500))fail('Payload too large');return text;}
function parse(text){if(typeof text!=='string'||text.length>MAX_BYTES)fail('Payload too large');const state=validateProgress(JSON.parse(text));if(state.version<3&&text.length>1500)fail('Payload too large');return state;}
export function loadProgress(storage){
  try{const text=storage.getItem(PROGRESS_STORAGE_KEY);if(text===null)return {ok:true,status:'empty',data:null};return {ok:true,status:'loaded',data:parse(text)};}
  catch{return {ok:false,status:'unavailable-or-corrupt',data:null};}
}
export function saveProgress(storage,data){
  let text;try{text=canonical(data);}catch{return {ok:false,status:'invalid'};}
  let old;try{old=storage.getItem(PROGRESS_STORAGE_KEY);if(old!==null)parse(old);}catch{return {ok:false,status:'unavailable-or-corrupt-existing'};}
  try{storage.setItem(PROGRESS_STORAGE_KEY,text);if(storage.getItem(PROGRESS_STORAGE_KEY)!==text)throw new Error('Readback mismatch');return {ok:true,status:'saved'};}
  catch{
    // Restore only this key; never clear replay/intro/other browser data.
    try{if(old===null)storage.removeItem(PROGRESS_STORAGE_KEY);else storage.setItem(PROGRESS_STORAGE_KEY,old);}catch{}
    return {ok:false,status:'write-or-readback-failed'};
  }
}
function crc(text){let n=0xffffffff;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);for(let j=0;j<8;j++)n=(n>>>1)^((n&1)?0xedb88320:0);}return ((n^0xffffffff)>>>0).toString(16).padStart(8,'0');}
export function encodeProgressCode(data){if(validateProgress(data).version!==1)fail('TS1 supports legacy progress only');const text=canonical(data),payload=btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const code=`TS1-${payload}.${crc(text)}`;if(code.length>MAX_CODE)fail('Code too large');return code;}
export function decodeProgressCode(code){
  if(typeof code!=='string'||code.length>MAX_CODE||!/^TS1-[A-Za-z0-9_-]+\.[0-9a-f]{8}$/.test(code))fail('Invalid code');
  const [payload,sum]=code.slice(4).split('.');let text;try{text=atob(payload.replace(/-/g,'+').replace(/_/g,'/'));}catch{fail('Invalid base64');}
  if(crc(text)!==sum)fail('Checksum mismatch');const data=parse(text);
  if(encodeProgressCode(data)!==code)fail('Noncanonical code');return data;
}

// Explicit user restore only. Never call this during boot or automatic saving.
export const PROGRESS_BACKUP_KEY='trash-shot-player-progress-v1-corrupt-backup';
export const PROGRESS_BACKUP_LIMIT=16384;
export function restoreProgress(storage,data){
  let text;try{text=canonical(data);}catch{return {ok:false,status:'invalid'};}
  let old;try{old=storage.getItem(PROGRESS_STORAGE_KEY);}catch{return {ok:false,status:'storage-unavailable'};}
  let corrupt=false;if(old!==null)try{parse(old);}catch{corrupt=true;}
  if(corrupt){
    if(typeof old!=='string'||old.length>PROGRESS_BACKUP_LIMIT)return {ok:false,status:'backup-too-large'};
    let backup;
    try{
      backup=storage.getItem(PROGRESS_BACKUP_KEY);
      if(backup!==null&&backup!==old)return {ok:false,status:'backup-conflict'};
      storage.setItem(PROGRESS_BACKUP_KEY,old);
      if(storage.getItem(PROGRESS_BACKUP_KEY)!==old)throw new Error('Backup readback mismatch');
    }catch{
      try{if(backup===null)storage.removeItem(PROGRESS_BACKUP_KEY);else if(typeof backup==='string')storage.setItem(PROGRESS_BACKUP_KEY,backup);}catch{}
      return {ok:false,status:'backup-write-or-readback-failed'};
    }
  }
  try{
    storage.setItem(PROGRESS_STORAGE_KEY,text);
    if(storage.getItem(PROGRESS_STORAGE_KEY)!==text)throw new Error('Progress readback mismatch');
    return {ok:true,status:corrupt?'restored-with-corrupt-backup':'restored'};
  }catch{
    try{if(old===null)storage.removeItem(PROGRESS_STORAGE_KEY);else storage.setItem(PROGRESS_STORAGE_KEY,old);}catch{}
    return {ok:false,status:'restore-write-or-readback-failed'};
  }
}
