// Version 4 carries an allowlisted throwable profile alongside actual recorded poses.
// V1/V2/V3 codecs remain responsible for their original can recordings.
import {validateReplay,createReplayPlayer,ReplayError} from './replay.mjs?v=20261014-quick-retry-1';
import {roomWorld} from './room-course.mjs?v=20261014-quick-retry-1';
import {roomContactColliders} from './room-contact.mjs?v=20261014-quick-retry-1';
import {THROWABLE_CATALOG} from './throwables.mjs?v=20261014-quick-retry-1';

export const ITEM_REPLAY_STORAGE_KEY='trash-shot-item-replays-v4';
export const ITEM_REPLAY_LIMITS=Object.freeze({version:4,contactModel:1,rawBytes:1024*1024,
  contacts:2400,urlChars:8000,saved:5,storageBytes:5*1024*1024+100,storageKey:ITEM_REPLAY_STORAGE_KEY});
const STAGES=new Set(['first','desk-over','desk-side','room-extra']);
const AXES=['x','y','z'],SLOP=1e-5;
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const fail=(code,message)=>{throw new ReplayError(code,message);};
const version=value=>value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'version')?.value:undefined;
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const clone=value=>JSON.parse(JSON.stringify(value));
const dot=(a,b)=>AXES.reduce((sum,axis)=>sum+a[axis]*b[axis],0);

function object(value,keys,where){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)
    fail('INVALID_REPLAY',`${where}: plain object required`);
  const descriptors=Object.getOwnPropertyDescriptors(value),names=Reflect.ownKeys(descriptors);
  if(names.length!==keys.length||names.some(key=>typeof key!=='string'||!keys.includes(key))
    ||keys.some(key=>!descriptors[key]||!('value'in descriptors[key])||!descriptors[key].enumerable))
    fail('INVALID_REPLAY',`${where}: unexpected keys or accessors`);
}
function number(value,min,max,where,integer=false){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||integer&&!Number.isInteger(value))
    fail('INVALID_REPLAY',`${where}: number out of range`);
  return value;
}
function vector(value,where,normal=false){
  object(value,AXES,where);
  const result=Object.fromEntries(AXES.map(axis=>[axis,number(value[axis],normal?-1:-100,normal?1:100,`${where}.${axis}`)]));
  if(normal&&Math.abs(Math.hypot(result.x,result.y,result.z)-1)>1e-7)fail('INVALID_REPLAY','Contact normal is not a unit vector');
  return result;
}
function array(value,limit,where){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>limit
    ||Reflect.ownKeys(value).length!==value.length+1)fail('INVALID_REPLAY',`${where}: invalid array`);
  for(let i=0;i<value.length;i++){
    const descriptor=Object.getOwnPropertyDescriptor(value,String(i));
    if(!descriptor||!('value'in descriptor)||!descriptor.enumerable)fail('INVALID_REPLAY',`${where}: sparse or accessor array`);
  }
  return value;
}
function contact(value,colliders,duration,radius){
  object(value,['type','surface','object','colliderId','shotId','time','position','normal','incomingNormalSpeed','beforeVelocity','afterVelocity'],'contact');
  const solid=colliders.get(value.colliderId);
  if(value.type!=='room-impact'||!solid||value.surface!==solid.surface||value.object!==solid.object)
    fail('INVALID_REPLAY','Unsupported fixed room contact');
  const position=vector(value.position,'contact.position'),normal=vector(value.normal,'contact.normal',true);
  const difference=Object.fromEntries(AXES.map(axis=>[axis,position[axis]-Math.max(solid.min[axis],Math.min(solid.max[axis],position[axis]))]));
  const distance=Math.hypot(difference.x,difference.y,difference.z);
  // The adapter records the separated center, unlike V2's unseparated TOI.
  if(Math.abs(distance-radius-SLOP)>2e-7||AXES.some(axis=>Math.abs(difference[axis]/distance-normal[axis])>2e-6))
    fail('INVALID_REPLAY','Contact is not on the fixed separated sphere surface');
  const beforeVelocity=vector(value.beforeVelocity,'contact.beforeVelocity'),afterVelocity=vector(value.afterVelocity,'contact.afterVelocity');
  const incomingNormalSpeed=number(value.incomingNormalSpeed,.15,100,'contact.incomingNormalSpeed');
  if(incomingNormalSpeed<=.15||Math.abs(dot(beforeVelocity,normal)+incomingNormalSpeed)>1e-7
    ||dot(afterVelocity,normal)<-1e-7||dot(afterVelocity,normal)>incomingNormalSpeed*.8+1e-7
    ||Math.hypot(...AXES.map(axis=>afterVelocity[axis]))>Math.hypot(...AXES.map(axis=>beforeVelocity[axis]))+1e-7)
    fail('INVALID_REPLAY','Contact velocities disagree with its inward impact');
  return {type:'room-impact',surface:solid.surface,object:solid.object,colliderId:solid.id,
    shotId:number(value.shotId,1,Number.MAX_SAFE_INTEGER,'contact.shotId',true),
    time:number(value.time,0,duration,'contact.time'),position,normal,incomingNormalSpeed,beforeVelocity,afterVelocity};
}

export function validateItemReplay(input){
  object(input,['version','kind','item','course','replay'],'item room replay');
  if(input.version!==4)fail('UNSUPPORTED_VERSION','Item replay version is unsupported');
  object(input.item,['id','profileVersion'],'item');
  if(input.item.profileVersion!==1||typeof input.item.id!=='string'||input.item.id==='can'||!Object.hasOwn(THROWABLE_CATALOG,input.item.id)
    ||THROWABLE_CATALOG[input.item.id].physics.version!==1)
    fail('INVALID_REPLAY','Unsupported fixed throwable profile');
  const item=THROWABLE_CATALOG[input.item.id].physics;
  if(input.kind!=='item-room-contacts')fail('UNSUPPORTED_VERSION','Room replay kind is unsupported');
  object(input.course,['worldVersion','contactModel','stageId','roomHits','contacts','fanEnabled'],'course');
  const course=input.course;
  if(![2,3,4,5].includes(course.worldVersion)||course.worldVersion===3&&course.stageId!=='desk-over'
    ||course.worldVersion===4&&course.stageId!=='desk-side'
    ||course.worldVersion===5&&course.stageId!=='room-extra'||course.contactModel!==1||!STAGES.has(course.stageId)
    ||typeof course.fanEnabled!=='boolean'||course.stageId!=='room-extra'&&course.fanEnabled)
    fail('INVALID_REPLAY','Unsupported fixed room contact world');
  const world=roomWorld(course.stageId,course.worldVersion),replay=validateReplay(input.replay,{worldVersion:course.worldVersion,itemId:input.item.id,profileVersion:1});
  if(AXES.some(axis=>replay.bin.center[axis]!==world.bin.center[axis])
    ||replay.bin.height!==world.bin.height||replay.bin.radius!==world.bin.radius)
    fail('INVALID_REPLAY','Room replay bin differs from its fixed world');
  const solids=new Map(roomContactColliders(world,{extra:course.stageId==='room-extra'}).map(solid=>[solid.id,solid]));
  const contacts=array(course.contacts,ITEM_REPLAY_LIMITS.contacts,'contacts').map(value=>contact(value,solids,replay.duration,item.radius));
  const roomHits=number(course.roomHits,0,ITEM_REPLAY_LIMITS.contacts,'course.roomHits',true);
  if(roomHits!==contacts.length)fail('INVALID_REPLAY','Room count and contact trace disagree');
  const previousByCollider=new Map();
  for(let i=0;i<contacts.length;i++){
    const value=contacts[i],previous=previousByCollider.get(value.colliderId);
    if(value.shotId!==contacts[0].shotId||i&&value.time<contacts[i-1].time
      ||previous!==undefined&&value.time-previous<=.05)
      fail('INVALID_REPLAY','Room contacts are out of shot order');
    previousByCollider.set(value.colliderId,value.time);
  }
  const record={version:4,kind:'item-room-contacts',item:{id:input.item.id,profileVersion:1},course:{worldVersion:course.worldVersion,contactModel:1,stageId:course.stageId,roomHits,contacts,fanEnabled:course.fanEnabled},replay};
  if(encoder.encode(JSON.stringify(record)).byteLength>ITEM_REPLAY_LIMITS.rawBytes)fail('REPLAY_TOO_LARGE','Room replay exceeds raw byte limit');
  return freeze(record);
}
export function createItemReplay(core,stageId,contacts=[],{fanEnabled=false,worldVersion=2,itemId,profileVersion=1}={}){
  array(contacts,ITEM_REPLAY_LIMITS.contacts,'contacts');
  return validateItemReplay({version:4,kind:'item-room-contacts',item:{id:itemId,profileVersion},course:{worldVersion,contactModel:1,stageId,roomHits:contacts.length,contacts,fanEnabled},replay:core});
}
export function itemPayload(record){return validateItemReplay(record).replay;}
export function createItemReplayPlayer(record){
  const valid=validateItemReplay(record);
  return createReplayPlayer(valid.replay,{worldVersion:valid.course.worldVersion,itemId:valid.item.id,profileVersion:valid.item.profileVersion});
}
export function itemReplayToJSON(record){return JSON.stringify(validateItemReplay(record));}
export function parseItemReplayJSON(text){
  if(typeof text!=='string')fail('INVALID_REPLAY','Item replay JSON must be text');
  if(text.length>ITEM_REPLAY_LIMITS.rawBytes||encoder.encode(text).byteLength>ITEM_REPLAY_LIMITS.rawBytes)
    fail('REPLAY_TOO_LARGE','Item replay exceeds JSON byte limit');
  let record;try{record=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed item replay JSON');}
  if(version(record)!==4)fail('UNSUPPORTED_VERSION','Item replay cannot carry another codec version');
  return validateItemReplay(record);
}

// The existing bounded gzip/base64url recipe, with an explicit new fragment.
async function readBounded(stream,limit){
  const reader=stream.getReader(),chunks=[];let length=0;
  try{while(true){const{value,done}=await reader.read();if(done)break;length+=value.byteLength;
    if(length>limit){await reader.cancel().catch(()=>{});fail('REPLAY_TOO_LARGE','Room replay stream exceeds byte limit');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
function base64url(bytes){
  let binary='';for(let i=0;i<bytes.length;i+=4096)binary+=String.fromCharCode(...bytes.subarray(i,i+4096));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function unbase64url(text){
  if(!text||!/^[A-Za-z0-9_-]+$/.test(text)||text.length%4===1)fail('INVALID_ENCODING','Invalid base64url room replay');
  let binary;try{binary=atob(text.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-text.length%4)%4));}
  catch{fail('INVALID_ENCODING','Invalid base64url room replay');}
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(base64url(bytes)!==text)fail('INVALID_ENCODING','Noncanonical base64url room replay');return bytes;
}
export async function encodeItemReplay(record){
  const json=itemReplayToJSON(record);
  if(typeof CompressionStream!=='function'){const error=new ReplayError('COMPRESSION_UNAVAILABLE','Room replay URL compression unavailable');error.fallbackJSON=json;throw error;}
  let bytes;try{bytes=await readBounded(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')),ITEM_REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Room replay compression failed');}
  const fragment=`tsc4.${base64url(bytes)}`;
  if(fragment.length+1>ITEM_REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','Room replay URL exceeds 8000 characters; use its file');error.fallbackJSON=json;throw error;}
  return fragment;
}
export async function decodeItemReplay(fragment){
  if(typeof fragment!=='string'||fragment.length>ITEM_REPLAY_LIMITS.urlChars)fail('SHARE_TOO_LARGE','Room replay fragment exceeds URL limit');
  const text=fragment.startsWith('#')?fragment.slice(1):fragment;
  if(!text.startsWith('tsc4.'))fail('UNSUPPORTED_VERSION','Item replay fragment is unsupported');
  const bytes=unbase64url(text.slice(5));
  if(typeof DecompressionStream!=='function')fail('COMPRESSION_UNAVAILABLE','Room replay URL decompression unavailable');
  let decoded;try{decoded=await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),ITEM_REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Invalid compressed room replay');}
  let json;try{json=decoder.decode(decoded);}catch{fail('INVALID_ENCODING','Room replay is not UTF-8');}
  const record=parseItemReplayJSON(json);if(record.version!==4)fail('UNSUPPORTED_VERSION','Room fragment cannot carry an older replay');return record;
}
export async function buildItemReplayURL(record,url){
  let result;try{result=new URL(url);}catch{fail('INVALID_URL','Room replay URL base is invalid');}
  if(!['http:','https:'].includes(result.protocol)||result.username||result.password)fail('INVALID_URL','Room replay URL must use HTTP or HTTPS');
  result.hash=await encodeItemReplay(record);
  if(result.href.length>ITEM_REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','Room replay URL exceeds 8000 characters; use its file');error.fallbackJSON=itemReplayToJSON(record);throw error;}
  return result.href;
}

function requireStore(store){
  if(!store||typeof store.getItem!=='function'||typeof store.setItem!=='function'||typeof store.removeItem!=='function')
    fail('STORAGE_UNAVAILABLE','Room replay storage is unavailable');return store;
}
export function loadItemReplays(store){
  requireStore(store);const text=store.getItem(ITEM_REPLAY_STORAGE_KEY);if(text==null)return [];
  if(typeof text!=='string'||text.length>ITEM_REPLAY_LIMITS.storageBytes||encoder.encode(text).byteLength>ITEM_REPLAY_LIMITS.storageBytes)
    fail('REPLAY_TOO_LARGE','Saved room replays exceed byte limit');
  let records;try{records=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed saved room replays');}
  return array(records,ITEM_REPLAY_LIMITS.saved,'saved room replays').map(record=>{
    if(version(record)!==4)fail('INVALID_REPLAY','Only V4 records belong in the room replay store');return validateItemReplay(record);
  });
}
function writeItemReplays(store,records){
  requireStore(store);loadItemReplays(store);const previous=store.getItem(ITEM_REPLAY_STORAGE_KEY);
  const text=JSON.stringify(records.map(validateItemReplay));
  if(encoder.encode(text).byteLength>ITEM_REPLAY_LIMITS.storageBytes)fail('REPLAY_TOO_LARGE','Saved room replays exceed byte limit');
  try{store.setItem(ITEM_REPLAY_STORAGE_KEY,text);if(store.getItem(ITEM_REPLAY_STORAGE_KEY)!==text)throw new ReplayError('STORAGE_FAILED','Room replay save readback failed');}
  catch(error){try{if(previous===null)store.removeItem(ITEM_REPLAY_STORAGE_KEY);else store.setItem(ITEM_REPLAY_STORAGE_KEY,previous);}catch{}throw error;}
}
export function saveItemReplay(store,record){
  if(version(record)!==4)fail('INVALID_REPLAY','Only V4 records belong in the room replay store');
  const valid=validateItemReplay(record),records=loadItemReplays(store);
  writeItemReplays(store,[valid,...records.filter(item=>item.replay.id!==valid.replay.id)].slice(0,ITEM_REPLAY_LIMITS.saved));return valid;
}
export function deleteItemReplay(store,id){
  const records=loadItemReplays(store);writeItemReplays(store,records.filter(record=>record.replay.id!==id));return true;
}
