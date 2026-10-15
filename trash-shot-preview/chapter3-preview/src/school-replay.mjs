// Version 5 records school contacts and a bounded walking phase around V1 poses.
// Older room envelopes keep their original codecs, keys and interpretation.
import {validateReplay,createReplayPlayer,ReplayError} from './replay.mjs?v=20261015-eccentric-review-1';
import {sweepSphereAABB} from './room-course.mjs?v=20261015-eccentric-review-1';
import {schoolWorld,schoolSolids,schoolStudentPose,schoolStudentPoses} from './school-world.mjs?v=20261015-eccentric-review-1';
import {THROWABLE_CATALOG} from './throwables.mjs?v=20261015-eccentric-review-1';

export const SCHOOL_REPLAY_STORAGE_KEY='trash-shot-school-replays-v5';
export const SCHOOL_REPLAY_LIMITS=Object.freeze({version:5,contactModel:1,rawBytes:1024*1024,
  contacts:2400,urlChars:8000,saved:5,storageBytes:5*1024*1024+100,storageKey:SCHOOL_REPLAY_STORAGE_KEY});
const STAGES=new Set(['school-classroom','school-vending','school-passage','school-rooftop']);
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
  if(value.type!=='room-impact'||value.surface==='student'||!solid||value.surface!==solid.surface||value.object!==solid.object)
    fail('INVALID_REPLAY','Unsupported fixed school contact');
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

// A replay records poses rather than re-simulating physics. Reject a changed
// walking phase that visibly intersects the student. The one-millimetre inward
// tolerance covers five-decimal poses and the gravity chord at recording cadence;
// grazing cases remain the live stepper's responsibility rather than false errors.
export function validateSchoolStudentClearance(replay,world,startTime,radius){
  if(world.worldVersion===10)return validateStudentsClearance(replay,world,startTime,radius);
  if(!world.student)return;
  const lerp=(a,b,t)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]+(b[axis]-a[axis])*t]));
  for(let i=1;i<replay.frames.length;i++){
    const a=replay.frames[i-1],b=replay.frames[i],dt=b.time-a.time;
    if(dt>1/30+1e-8)fail('INVALID_REPLAY','School passage recording cadence is too sparse');
    const cuts=[a.time];
    // Split at the predictable turn, where constant-speed walking changes sign.
    for(let turn=Math.floor((startTime+a.time)/4)+1;turn*4<startTime+b.time;turn++)cuts.push(turn*4-startTime);
    cuts.push(b.time);
    for(let j=1;j<cuts.length;j++){
      const ta=cuts[j-1],tb=cuts[j],studentA=schoolStudentPose(world,startTime+ta),studentB=schoolStudentPose(world,startTime+tb);
      const pa=lerp(a.position,b.position,(ta-a.time)/dt),pb=lerp(a.position,b.position,(tb-a.time)/dt);
      const relativeEnd=Object.fromEntries(AXES.map(axis=>[axis,pb[axis]-(studentB.position[axis]-studentA.position[axis])]));
      if(sweepSphereAABB(pa,relativeEnd,Math.max(.001,radius-.001),studentA.colliders[0]))
        fail('INVALID_REPLAY','Successful replay intersects the student at its recorded phase');
    }
  }
}

// World 10 has independent walking phases. Split each pedestrian's motion at
// its own turn before sweeping the recorded ball chord against its colliders.
// Legacy world 8 keeps the original single-student validator and sample shape.
function validateStudentsClearance(replay,world,startTime,radius){
  const lerp=(a,b,t)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]+(b[axis]-a[axis])*t]));
  for(let i=1;i<replay.frames.length;i++){
    const a=replay.frames[i-1],b=replay.frames[i],dt=b.time-a.time;
    if(dt>1/30+1e-8)fail('INVALID_REPLAY','School passage recording cadence is too sparse');
    for(const student of world.students){
      const half=student.period/2,offset=student.phaseOffset??0,cuts=[a.time];
      for(let turn=Math.floor((startTime+a.time+offset)/half)+1;turn*half-offset<startTime+b.time;turn++)
        cuts.push(turn*half-offset-startTime);
      cuts.push(b.time);
      for(let j=1;j<cuts.length;j++){
        const ta=cuts[j-1],tb=cuts[j];
        const studentA=schoolStudentPoses(world,startTime+ta).find(pose=>pose.id===student.id);
        const studentB=schoolStudentPoses(world,startTime+tb).find(pose=>pose.id===student.id);
        const pa=lerp(a.position,b.position,(ta-a.time)/dt),pb=lerp(a.position,b.position,(tb-a.time)/dt);
        const relativeEnd=Object.fromEntries(AXES.map(axis=>[axis,pb[axis]-(studentB.position[axis]-studentA.position[axis])]));
        for(const collider of studentA.colliders){
          if(sweepSphereAABB(pa,relativeEnd,Math.max(.001,radius-.001),collider))
            fail('INVALID_REPLAY','Successful replay intersects a student at its recorded phase');
        }
      }
    }
  }
}

function validateContactTrace(contacts,frames){
  for(const value of contacts){
    let left=0,right=frames.length-1;
    while(left+1<right){const mid=(left+right)>>1;if(frames[mid].time<=value.time)left=mid;else right=mid;}
    for(const [frame,velocity]of [[frames[left],value.beforeVelocity],[frames[right],value.afterVelocity]]){
      const dt=Math.abs(frame.time-value.time),speed=Math.max(Math.hypot(...AXES.map(axis=>velocity[axis])),Math.hypot(...AXES.map(axis=>frame.velocity[axis])));
      const distance=Math.hypot(...AXES.map(axis=>value.position[axis]-frame.position[axis]));
      if(distance>(speed+9.81*dt)*dt+.001)
        fail('INVALID_REPLAY','School contact is detached from its recorded pose trace');
    }
  }
}

export function validateSchoolReplay(input){
  object(input,['version','kind','item','course','replay'],'school replay');
  if(input.version!==5)fail('UNSUPPORTED_VERSION','School replay version is unsupported');
  object(input.item,['id','profileVersion'],'item');
  if(input.item.profileVersion!==1||typeof input.item.id!=='string'||!Object.hasOwn(THROWABLE_CATALOG,input.item.id)
    ||THROWABLE_CATALOG[input.item.id].physics.version!==1)
    fail('INVALID_REPLAY','Unsupported fixed throwable profile');
  const item=THROWABLE_CATALOG[input.item.id].physics;
  if(input.kind!=='school-contacts')fail('UNSUPPORTED_VERSION','School replay kind is unsupported');
  object(input.course,['worldVersion','contactModel','stageId','schoolHits','contacts','startTime'],'course');
  const course=input.course;
  const world=schoolWorld(course.stageId,course.worldVersion);
  if(![6,7,8,9,10].includes(course.worldVersion)||!STAGES.has(course.stageId)||!world||course.contactModel!==1)
    fail('INVALID_REPLAY','Unsupported fixed school contact world');
  const startTime=number(course.startTime,0,8,'course.startTime');
  if(startTime>=8)fail('INVALID_REPLAY','School walking phase must be below its eight-second period');
  const context=input.item.id==='can'?{worldVersion:course.worldVersion}:
    {worldVersion:course.worldVersion,itemId:input.item.id,profileVersion:1};
  const replay=validateReplay(input.replay,context);
  if(AXES.some(axis=>replay.bin.center[axis]!==world.bin.center[axis])
    ||replay.bin.height!==world.bin.height||replay.bin.radius!==world.bin.radius)
    fail('INVALID_REPLAY','School replay bin differs from its fixed world');
  validateSchoolStudentClearance(replay,world,startTime,item.radius);
  const solids=new Map(schoolSolids(world).map(solid=>[solid.id,solid]));
  const contacts=array(course.contacts,SCHOOL_REPLAY_LIMITS.contacts,'contacts').map(value=>contact(value,solids,replay.duration,item.radius));
  validateContactTrace(contacts,replay.frames);
  const schoolHits=number(course.schoolHits,0,SCHOOL_REPLAY_LIMITS.contacts,'course.schoolHits',true);
  if(schoolHits!==contacts.length)fail('INVALID_REPLAY','School count and contact trace disagree');
  const previousByCollider=new Map();
  for(let i=0;i<contacts.length;i++){
    const value=contacts[i],previous=previousByCollider.get(value.colliderId);
    if(value.shotId!==contacts[0].shotId||i&&value.time<contacts[i-1].time
      ||previous!==undefined&&value.time-previous<=.05)
      fail('INVALID_REPLAY','School contacts are out of shot order');
    previousByCollider.set(value.colliderId,value.time);
  }
  const record={version:5,kind:'school-contacts',item:{id:input.item.id,profileVersion:1},course:{worldVersion:course.worldVersion,contactModel:1,stageId:course.stageId,schoolHits,contacts,startTime},replay};
  if(encoder.encode(JSON.stringify(record)).byteLength>SCHOOL_REPLAY_LIMITS.rawBytes)fail('REPLAY_TOO_LARGE','School replay exceeds raw byte limit');
  return freeze(record);
}
export function createSchoolReplay(core,stageId,contacts=[],{worldVersion=6,itemId='can',profileVersion=1,startTime=0}={}){
  array(contacts,SCHOOL_REPLAY_LIMITS.contacts,'contacts');
  return validateSchoolReplay({version:5,kind:'school-contacts',item:{id:itemId,profileVersion},course:{worldVersion,contactModel:1,stageId,schoolHits:contacts.length,contacts,startTime},replay:core});
}
export function schoolPayload(record){return validateSchoolReplay(record).replay;}
export function createSchoolReplayPlayer(record){
  const valid=validateSchoolReplay(record);
  const context=valid.item.id==='can'?{worldVersion:valid.course.worldVersion}:
    {worldVersion:valid.course.worldVersion,itemId:valid.item.id,profileVersion:valid.item.profileVersion};
  const player=createReplayPlayer(valid.replay,context),world=schoolWorld(valid.course.stageId,valid.course.worldVersion);
  return {duration:player.duration,sample(time){
    const snapshot=player.sample(time),environmentTime=valid.course.startTime+snapshot.time;
    return {...snapshot,throwableId:valid.item.id,worldVersion:valid.course.worldVersion,
      startTime:valid.course.startTime,schoolStartTime:valid.course.startTime,environmentTime,
      student:schoolStudentPose(world,environmentTime),
      ...(world.worldVersion===10?{students:schoolStudentPoses(world,environmentTime)}:{})};
  }};
}
export function schoolReplayToJSON(record){return JSON.stringify(validateSchoolReplay(record));}
export function parseSchoolReplayJSON(text){
  if(typeof text!=='string')fail('INVALID_REPLAY','School replay JSON must be text');
  if(text.length>SCHOOL_REPLAY_LIMITS.rawBytes||encoder.encode(text).byteLength>SCHOOL_REPLAY_LIMITS.rawBytes)
    fail('REPLAY_TOO_LARGE','School replay exceeds JSON byte limit');
  let record;try{record=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed item replay JSON');}
  if(version(record)!==5)fail('UNSUPPORTED_VERSION','School replay cannot carry another codec version');
  return validateSchoolReplay(record);
}

// The existing bounded gzip/base64url recipe, with an explicit new fragment.
async function readBounded(stream,limit){
  const reader=stream.getReader(),chunks=[];let length=0;
  try{while(true){const{value,done}=await reader.read();if(done)break;length+=value.byteLength;
    if(length>limit){await reader.cancel().catch(()=>{});fail('REPLAY_TOO_LARGE','School replay stream exceeds byte limit');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
function base64url(bytes){
  let binary='';for(let i=0;i<bytes.length;i+=4096)binary+=String.fromCharCode(...bytes.subarray(i,i+4096));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function unbase64url(text){
  if(!text||!/^[A-Za-z0-9_-]+$/.test(text)||text.length%4===1)fail('INVALID_ENCODING','Invalid base64url school replay');
  let binary;try{binary=atob(text.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-text.length%4)%4));}
  catch{fail('INVALID_ENCODING','Invalid base64url school replay');}
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(base64url(bytes)!==text)fail('INVALID_ENCODING','Noncanonical base64url school replay');return bytes;
}
export async function encodeSchoolReplay(record){
  const json=schoolReplayToJSON(record);
  if(typeof CompressionStream!=='function'){const error=new ReplayError('COMPRESSION_UNAVAILABLE','School replay URL compression unavailable');error.fallbackJSON=json;throw error;}
  let bytes;try{bytes=await readBounded(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')),SCHOOL_REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','School replay compression failed');}
  const fragment=`tsc5.${base64url(bytes)}`;
  if(fragment.length+1>SCHOOL_REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','School replay URL exceeds 8000 characters; use its file');error.fallbackJSON=json;throw error;}
  return fragment;
}
export async function decodeSchoolReplay(fragment){
  if(typeof fragment!=='string'||fragment.length>SCHOOL_REPLAY_LIMITS.urlChars)fail('SHARE_TOO_LARGE','School replay fragment exceeds URL limit');
  const text=fragment.startsWith('#')?fragment.slice(1):fragment;
  if(!text.startsWith('tsc5.'))fail('UNSUPPORTED_VERSION','School replay fragment is unsupported');
  const bytes=unbase64url(text.slice(5));
  if(typeof DecompressionStream!=='function')fail('COMPRESSION_UNAVAILABLE','School replay URL decompression unavailable');
  let decoded;try{decoded=await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),SCHOOL_REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Invalid compressed school replay');}
  let json;try{json=decoder.decode(decoded);}catch{fail('INVALID_ENCODING','School replay is not UTF-8');}
  const record=parseSchoolReplayJSON(json);if(record.version!==5)fail('UNSUPPORTED_VERSION','School fragment cannot carry another replay');return record;
}
export async function buildSchoolReplayURL(record,url){
  let result;try{result=new URL(url);}catch{fail('INVALID_URL','School replay URL base is invalid');}
  if(!['http:','https:'].includes(result.protocol)||result.username||result.password)fail('INVALID_URL','School replay URL must use HTTP or HTTPS');
  result.hash=await encodeSchoolReplay(record);
  if(result.href.length>SCHOOL_REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','School replay URL exceeds 8000 characters; use its file');error.fallbackJSON=schoolReplayToJSON(record);throw error;}
  return result.href;
}

function requireStore(store){
  if(!store||typeof store.getItem!=='function'||typeof store.setItem!=='function'||typeof store.removeItem!=='function')
    fail('STORAGE_UNAVAILABLE','School replay storage is unavailable');return store;
}
export function loadSchoolReplays(store){
  requireStore(store);const text=store.getItem(SCHOOL_REPLAY_STORAGE_KEY);if(text==null)return [];
  if(typeof text!=='string'||text.length>SCHOOL_REPLAY_LIMITS.storageBytes||encoder.encode(text).byteLength>SCHOOL_REPLAY_LIMITS.storageBytes)
    fail('REPLAY_TOO_LARGE','Saved school replays exceed byte limit');
  let records;try{records=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed saved school replays');}
  return array(records,SCHOOL_REPLAY_LIMITS.saved,'saved school replays').map(record=>{
    if(version(record)!==5)fail('INVALID_REPLAY','Only V5 records belong in the school replay store');return validateSchoolReplay(record);
  });
}
function writeSchoolReplays(store,records){
  requireStore(store);loadSchoolReplays(store);const previous=store.getItem(SCHOOL_REPLAY_STORAGE_KEY);
  const text=JSON.stringify(records.map(validateSchoolReplay));
  if(encoder.encode(text).byteLength>SCHOOL_REPLAY_LIMITS.storageBytes)fail('REPLAY_TOO_LARGE','Saved school replays exceed byte limit');
  try{store.setItem(SCHOOL_REPLAY_STORAGE_KEY,text);if(store.getItem(SCHOOL_REPLAY_STORAGE_KEY)!==text)throw new ReplayError('STORAGE_FAILED','School replay save readback failed');}
  catch(error){try{if(previous===null)store.removeItem(SCHOOL_REPLAY_STORAGE_KEY);else store.setItem(SCHOOL_REPLAY_STORAGE_KEY,previous);}catch{}throw error;}
}
export function saveSchoolReplay(store,record){
  if(version(record)!==5)fail('INVALID_REPLAY','Only V5 records belong in the school replay store');
  const valid=validateSchoolReplay(record),records=loadSchoolReplays(store);
  writeSchoolReplays(store,[valid,...records.filter(item=>item.replay.id!==valid.replay.id)].slice(0,SCHOOL_REPLAY_LIMITS.saved));return valid;
}
export function deleteSchoolReplay(store,id){
  const records=loadSchoolReplays(store);writeSchoolReplays(store,records.filter(record=>record.replay.id!==id));return true;
}
