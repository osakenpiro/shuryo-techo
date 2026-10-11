// Local player progress only. Portable codes are checksummed, not authenticated.
export const CHAPTER_IDS=Object.freeze(['first','desk-over','desk-side','room-extra']);
export const PROGRESS_STORAGE_KEY='trash-shot-player-progress-v1';
const MAX=1000000,MAX_BYTES=1500,MAX_CODE=2048;
const fail=message=>{throw new Error(message);};
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min&&v<=MAX;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
export function validateProgress(value){
  if(!object(value))fail('Invalid progress object');
  const keys=['version','introSeen','completedIDs','stageBestAttempts','cumulativeAttempts','cumulativeSuccesses','resumeStage','inputScheme'];
  if(Object.keys(value).some(k=>!keys.includes(k))||keys.filter(k=>k!=='introSeen').some(k=>!Object.hasOwn(value,k)))fail('Unknown or missing progress fields');
  if(value.version!==1||(value.introSeen!==undefined&&typeof value.introSeen!=='boolean'))fail('Invalid version or intro flag');
  const completed=value.completedIDs;
  if(!Array.isArray(completed)||completed.length>4||new Set(completed).size!==completed.length||completed.some(id=>!CHAPTER_IDS.includes(id)))fail('Invalid completed IDs');
  if(!object(value.stageBestAttempts)||Object.keys(value.stageBestAttempts).some(id=>!completed.includes(id)))fail('Invalid best attempts');
  if(!integer(value.cumulativeAttempts)||!integer(value.cumulativeSuccesses)||value.cumulativeSuccesses>value.cumulativeAttempts||value.cumulativeSuccesses<completed.length)fail('Inconsistent totals');
  const best={};for(const id of CHAPTER_IDS)if(completed.includes(id)){
    const n=value.stageBestAttempts[id];if(!integer(n,1)||n>value.cumulativeAttempts)fail('Invalid best count');best[id]=n;
  }
  if(completed.some(id=>CHAPTER_IDS.slice(0,CHAPTER_IDS.indexOf(id)).some(prior=>!completed.includes(prior))))fail('Nonsequential completion');
  if(Object.values(best).reduce((sum,n)=>sum+n,0)+value.cumulativeSuccesses-completed.length>value.cumulativeAttempts)fail('Inconsistent attempt history');
  const resumeIndex=CHAPTER_IDS.indexOf(value.resumeStage);
  if(resumeIndex<0||(resumeIndex>0&&!completed.includes(CHAPTER_IDS[resumeIndex-1]))||!['pull','swipe'].includes(value.inputScheme))fail('Invalid resume or input scheme');
  return {version:1,introSeen:value.introSeen??false,completedIDs:CHAPTER_IDS.filter(id=>completed.includes(id)),stageBestAttempts:best,cumulativeAttempts:value.cumulativeAttempts,cumulativeSuccesses:value.cumulativeSuccesses,resumeStage:value.resumeStage,inputScheme:value.inputScheme};
}
export function createChapterProgress(initial){
  let state=validateProgress(initial??{version:1,introSeen:false,completedIDs:[],stageBestAttempts:{},cumulativeAttempts:0,cumulativeSuccesses:0,resumeStage:'first',inputScheme:'pull'}),pending=false;
  return {
    recordAttempt(){if(state.cumulativeAttempts===MAX)return false;state.cumulativeAttempts++;pending=true;return true;},
    clear(id=state.resumeStage,attempts=1){
      if(!pending||id!==state.resumeStage||!integer(attempts,1)||attempts>state.cumulativeAttempts||state.cumulativeSuccesses===MAX)return false;
      pending=false;state.cumulativeSuccesses++;
      if(!state.completedIDs.includes(id))state.completedIDs.push(id);
      state.stageBestAttempts[id]=Math.min(state.stageBestAttempts[id]??MAX,attempts);
      state=validateProgress(state);return true;
    },
    chooseStage(id){const index=CHAPTER_IDS.indexOf(id);if(index<0||(index>0&&!state.completedIDs.includes(CHAPTER_IDS[index-1])))return false;state.resumeStage=id;pending=false;return true;},
    setInputScheme(scheme){if(!['pull','swipe'].includes(scheme))return false;state.inputScheme=scheme;return true;},
    setIntroSeen(seen=true){if(typeof seen!=='boolean')return false;state.introSeen=seen;return true;},
    snapshot(){return validateProgress(state);}
  };
}
function canonical(data){const text=JSON.stringify(validateProgress(data));if(text.length>MAX_BYTES)fail('Payload too large');return text;}
function parse(text){if(typeof text!=='string'||text.length>MAX_BYTES)fail('Payload too large');return validateProgress(JSON.parse(text));}
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
export function encodeProgressCode(data){const text=canonical(data),payload=btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const code=`TS1-${payload}.${crc(text)}`;if(code.length>MAX_CODE)fail('Code too large');return code;}
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
