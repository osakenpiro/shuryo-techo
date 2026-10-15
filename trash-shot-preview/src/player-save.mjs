// Two owned local keys with verified paired writes and rollback. TS2/TS3 detect
// typos, not forgery. Existing TS1/TS2 bytes and legacy validation remain strict.
import {PROGRESS_STORAGE_KEY,PROGRESS_BACKUP_KEY,PROGRESS_BACKUP_LIMIT,CHAPTER_IDS,FIRST_CHAPTER_IDS,validateProgress,decodeProgressCode} from './progress-save.mjs?v=20261015-screen-pull-1';
import {validateRewards,validateLegacyRewards} from './rewards.mjs?v=20261015-screen-pull-1';

export const REWARDS_STORAGE_KEY='trash-shot-player-rewards-v1';
export const REWARDS_BACKUP_KEY='trash-shot-player-rewards-v1-corrupt-backup';
export const REWARDS_BACKUP_LIMIT=16384;
const MAX_BYTES=6000,MAX_CODE=8200;
const fail=message=>{throw new Error(message);};
function plain(value,allowed,required=allowed){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('Invalid player save');
  const fields=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(fields).some(key=>typeof key!=='string'||!allowed.includes(key)||!Object.hasOwn(fields[key],'value')||!fields[key].enumerable)
    ||required.some(key=>!Object.hasOwn(fields,key)))fail('Invalid player save fields');
}
function player(value,allowLegacy=false){
  plain(value,['version','progress','rewards','sourceVersion'],['progress','rewards']);
  if((value.version!==undefined&&![2,3].includes(value.version))||(value.sourceVersion!==undefined&&![1,2,3].includes(value.sourceVersion)))fail('Invalid player version');
  if((value.sourceVersion===1&&(!allowLegacy||value.rewards!==null))||([2,3].includes(value.sourceVersion)&&value.rewards===null))fail('Inconsistent player source version');
  plain(value.progress,['version','introSeen','completedIDs','stageBestAttempts','cumulativeAttempts','cumulativeSuccesses','resumeStage','inputScheme'],['version','completedIDs','stageBestAttempts','cumulativeAttempts','cumulativeSuccesses','resumeStage','inputScheme']);
  const progress=validateProgress(value.progress),allowed=progress.version===1?FIRST_CHAPTER_IDS:CHAPTER_IDS;
  plain(value.progress.stageBestAttempts,allowed,[]);
  const rewards=value.rewards===null&&allowLegacy?null:validateRewards(value.rewards);
  let legacyRewards=true;if(rewards!==null)try{validateLegacyRewards(rewards);}catch{legacyRewards=false;}
  const version=value.version??(progress.version===2||!legacyRewards?3:2);
  if(version===2&&(progress.version!==1||!legacyRewards))fail('School progress and rewards require TS3');
  if((value.sourceVersion===1&&version!==2)||(value.sourceVersion===2&&version!==2)||(value.sourceVersion===3&&version!==3))fail('Inconsistent player source version');
  return {version,progress,rewards};
}
function canonical(value){const text=JSON.stringify(player(value));if(text.length>MAX_BYTES)fail('Payload too large');return text;}
function parseRewards(text){if(typeof text!=='string'||text.length>MAX_BYTES)fail('Rewards payload too large');return validateRewards(JSON.parse(text));}
function parseProgress(text){if(typeof text!=='string'||text.length>1500)fail('Progress payload too large');return player({progress:JSON.parse(text),rewards:null},true).progress;}
const definitions=[{key:PROGRESS_STORAGE_KEY,backup:PROGRESS_BACKUP_KEY,limit:PROGRESS_BACKUP_LIMIT,parse:parseProgress},{key:REWARDS_STORAGE_KEY,backup:REWARDS_BACKUP_KEY,limit:REWARDS_BACKUP_LIMIT,parse:parseRewards}];
function read(storage,definition){
  try{const raw=storage.getItem(definition.key);if(raw===null)return {ok:true,status:'empty',data:null};return {ok:true,status:'loaded',data:definition.parse(raw)};}
  catch{return {ok:false,status:'unavailable-or-corrupt',data:null};}
}
export function loadPlayerSave(storage){
  const progress=read(storage,definitions[0]),rewards=read(storage,definitions[1]),ok=progress.ok&&rewards.ok;
  return {ok,status:ok?(progress.data===null&&rewards.data===null?'empty':'loaded'):'partial-or-unavailable',progress:progress.data,rewards:rewards.data,progressStatus:progress.status,rewardsStatus:rewards.status};
}
function rollback(storage,entries){
  let verified=true;
  for(const entry of entries){try{if(entry.old===null)storage.removeItem(entry.key);else storage.setItem(entry.key,entry.old);if(storage.getItem(entry.key)!==entry.old)verified=false;}catch{verified=false;}}
  return verified;
}
function write(storage,value,restore){
  let data,texts;
  try{data=player(value,restore);texts=[JSON.stringify(data.progress),data.rewards===null?null:JSON.stringify(data.rewards)];if(texts.some(text=>text!==null&&text.length>MAX_BYTES))fail('Payload too large');}
  catch{return {ok:false,status:'invalid'};}
  const entries=[];
  try{for(let i=0;i<definitions.length;i++)if(texts[i]!==null){const definition=definitions[i];entries.push({...definition,text:texts[i],old:storage.getItem(definition.key)});}}
  catch{return {ok:false,status:'storage-unavailable'};}
  const corrupt=entries.filter(entry=>{if(entry.old===null)return false;try{entry.parse(entry.old);return false;}catch{return true;}});
  if(corrupt.length&&!restore)return {ok:false,status:'unavailable-or-corrupt-existing'};
  if(restore&&corrupt.length){
    const backups=[];
    try{
      // Inspect every backup before modifying any primary or backup key.
      for(const entry of corrupt){
        if(typeof entry.old!=='string'||entry.old.length>entry.limit)return {ok:false,status:'backup-too-large'};
        const previous=storage.getItem(entry.backup);
        if(previous!==null&&previous!==entry.old)return {ok:false,status:'backup-conflict'};
        backups.push({key:entry.backup,old:previous,text:entry.old});
      }
    }catch{return {ok:false,status:'storage-unavailable'};}
    try{for(const backup of backups){storage.setItem(backup.key,backup.text);if(storage.getItem(backup.key)!==backup.text)throw Error('Backup readback mismatch');}}
    catch{return {ok:false,status:'backup-write-or-readback-failed',rolledBack:rollback(storage,backups)};}
  }
  try{
    for(const entry of entries)storage.setItem(entry.key,entry.text);
    for(const entry of entries)if(storage.getItem(entry.key)!==entry.text)throw Error('Player readback mismatch');
    return {ok:true,status:restore?(corrupt.length?'restored-with-corrupt-backup':'restored'):'saved',preservedRewards:data.rewards===null};
  }catch{return {ok:false,status:restore?'restore-write-or-readback-failed':'write-or-readback-failed',rolledBack:rollback(storage,entries)};}
}
export const savePlayerSave=(storage,value)=>write(storage,value,false);
// Explicit restore only. Legacy TS1 restores progress and leaves the reward key untouched.
export const restorePlayerSave=(storage,value)=>write(storage,value,true);
function crc(text){let n=0xffffffff;for(let i=0;i<text.length;i++){n^=text.charCodeAt(i);for(let j=0;j<8;j++)n=(n>>>1)^((n&1)?0xedb88320:0);}return ((n^0xffffffff)>>>0).toString(16).padStart(8,'0');}
export function encodePlayerCode(value){
  const data=player(value),text=canonical(data),payload=btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const code=`TS${data.version}-${payload}.${crc(text)}`;if(code.length>MAX_CODE)fail('Code too large');return code;
}
export function decodePlayerCode(code){
  if(typeof code!=='string'||code.length>MAX_CODE)fail('Invalid player code');
  if(code.startsWith('TS1-'))return {version:2,progress:decodeProgressCode(code),rewards:null,sourceVersion:1};
  if(!/^TS[23]-[A-Za-z0-9_-]+\.[0-9a-f]{8}$/.test(code))fail('Invalid player code');
  const version=Number(code[2]);
  const [payload,sum]=code.slice(4).split('.');let text;
  try{text=atob(payload.replace(/-/g,'+').replace(/_/g,'/'));}catch{fail('Invalid base64');}
  if(text.length>MAX_BYTES||crc(text)!==sum)fail('Payload too large or checksum mismatch');
  const value=JSON.parse(text);plain(value,['version','progress','rewards']);
  const data=player(value);if(data.version!==version)fail('Player prefix/version mismatch');if(encodePlayerCode(data)!==code)fail('Noncanonical code');
  return {...data,sourceVersion:version};
}
