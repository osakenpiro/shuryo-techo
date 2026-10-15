// V6 isolates new capture planes and profiles from historical V1–V5 records.
// Playback reads recorded poses and a saved environment clock; it awards nothing.
import {validateReplay,createReplayPlayer,ReplayError} from './replay.mjs?v=20261015-factory-machines-2';
import {roomWorld,sweepSphereAABB} from './room-course.mjs?v=20261015-factory-machines-2';
import {roomContactColliders} from './room-contact.mjs?v=20261015-factory-machines-2';
import {schoolSolids,schoolStudentPose,schoolStudentPoses} from './school-world.mjs?v=20261015-factory-machines-2';
import {validateSchoolStudentClearance} from './school-replay.mjs?v=20261015-factory-machines-2';
import {outdoorWorld,outdoorGoals,outdoorMotion,outdoorDynamicSolids} from './outdoor-world.mjs?v=20261015-factory-machines-2';
import {sweepOutdoorGoal} from './outdoor-play.mjs?v=20261015-factory-machines-2';
import {THROWABLE_CATALOG} from './throwables.mjs?v=20261015-factory-machines-2';

export const OUTDOOR_REPLAY_STORAGE_KEY='trash-shot-expanded-replays-v6';
export const OUTDOOR_REPLAY_LIMITS=Object.freeze({version:6,contactModel:1,rawBytes:1024*1024,contacts:2400,urlChars:8000,saved:5,storageBytes:5*1024*1024+100,storageKey:OUTDOOR_REPLAY_STORAGE_KEY});
const AXES=['x','y','z'],SLOP=1e-5,TOL=.0001;
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const fail=(code,message)=>{throw new ReplayError(code,message);};
const version=value=>value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'version')?.value:undefined;
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const dot=(a,b)=>AXES.reduce((sum,axis)=>sum+a[axis]*b[axis],0);
const subtract=(a,b)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]-b[axis]]));
function object(value,keys,where){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('INVALID_REPLAY',`${where}: plain object required`);
  const descriptors=Object.getOwnPropertyDescriptors(value),names=Reflect.ownKeys(descriptors);
  if(names.length!==keys.length||names.some(key=>typeof key!=='string'||!keys.includes(key))||keys.some(key=>!descriptors[key]||!('value'in descriptors[key])||!descriptors[key].enumerable))fail('INVALID_REPLAY',`${where}: unexpected keys or accessors`);
}
function number(value,min,max,where,integer=false){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||integer&&!Number.isInteger(value))fail('INVALID_REPLAY',`${where}: number out of range`);return value;
}
function vector(value,where,normal=false){
  object(value,AXES,where);const result=Object.fromEntries(AXES.map(axis=>[axis,number(value[axis],normal?-1:-100,normal?1:100,`${where}.${axis}`)]));
  if(normal&&Math.abs(Math.hypot(result.x,result.y,result.z)-1)>1e-7)fail('INVALID_REPLAY','Contact normal is not a unit vector');return result;
}
function array(value,limit,where){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||value.length>limit||Reflect.ownKeys(value).length!==value.length+1)fail('INVALID_REPLAY',`${where}: invalid array`);
  for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d||!('value'in d)||!d.enumerable)fail('INVALID_REPLAY',`${where}: sparse or accessor array`);}return value;
}
function captureData(value,duration){
  object(value,['goalId','goalRole','position','normal','time'],'capture');
  if(typeof value.goalId!=='string'||value.goalId.length>80||!['normal','alternative'].includes(value.goalRole))fail('INVALID_REPLAY','Invalid capture identity');
  return {goalId:value.goalId,goalRole:value.goalRole,position:vector(value.position,'capture.position'),normal:vector(value.normal,'capture.normal',true),time:number(value.time,0,duration,'capture.time')};
}
function coreContext(item,worldVersion,capture){
  return {worldVersion,...(item.id==='can'?{}:{itemId:item.id,profileVersion:item.profileVersion}),...(worldVersion>=11?{capture}:{})};
}
function solidsAt(world,time){
  if(world.worldVersion>=11)return [...world.solids,...outdoorDynamicSolids(world,time)];
  if(world.environment==='school')return schoolSolids(world);
  return roomContactColliders(world,{extra:world.stageId==='room-extra'});
}
function contactData(value,world,startTime,duration,radius){
  object(value,['type','surface','object','colliderId','shotId','time','position','normal','incomingNormalSpeed','beforeVelocity','afterVelocity'],'contact');
  const time=number(value.time,0,duration,'contact.time');
  const solid=solidsAt(world,startTime+time).find(s=>s.id===value.colliderId);
  if(value.type!=='room-impact'||!solid||solid.blocking||value.surface!==solid.surface||value.object!==solid.object)fail('INVALID_REPLAY','Unsupported fixed expanded contact');
  const position=vector(value.position,'contact.position'),normal=vector(value.normal,'contact.normal',true);
  const difference=subtract(position,Object.fromEntries(AXES.map(axis=>[axis,Math.max(solid.min[axis],Math.min(solid.max[axis],position[axis]))]))),distance=Math.hypot(...AXES.map(axis=>difference[axis]));
  // The moving adapter linearly interpolates each 240 Hz sweep. Its sine pose
  // at contact differs from the exact timed pose by at most a few micrometres.
  const dynamic=world.worldVersion>=11&&!world.solids.some(s=>s.id===solid.id);
  if(Math.abs(distance-radius-SLOP)>(dynamic?1e-5:2e-7)
    ||AXES.some(axis=>Math.abs(difference[axis]/distance-normal[axis])>(dynamic?1e-4:2e-6)))
    fail('INVALID_REPLAY','Contact is not on the fixed separated sphere surface');
  const beforeVelocity=vector(value.beforeVelocity,'contact.beforeVelocity'),afterVelocity=vector(value.afterVelocity,'contact.afterVelocity'),incomingNormalSpeed=number(value.incomingNormalSpeed,.15,100,'contact.incomingNormalSpeed');
  if(incomingNormalSpeed<=.15||Math.abs(dot(beforeVelocity,normal)+incomingNormalSpeed)>1e-7||dot(afterVelocity,normal)<-1e-7||dot(afterVelocity,normal)>incomingNormalSpeed*.8+1e-7||Math.hypot(...AXES.map(axis=>afterVelocity[axis]))>Math.hypot(...AXES.map(axis=>beforeVelocity[axis]))+1e-7)fail('INVALID_REPLAY','Contact velocities disagree with its inward impact');
  return {type:'room-impact',surface:solid.surface,object:solid.object,colliderId:solid.id,shotId:number(value.shotId,1,Number.MAX_SAFE_INTEGER,'contact.shotId',true),time,position,normal,incomingNormalSpeed,beforeVelocity,afterVelocity};
}
function validateTrace(contacts,frames){
  const previousByCollider=new Map();
  for(let i=0;i<contacts.length;i++){
    const value=contacts[i],previous=previousByCollider.get(value.colliderId);
    if(value.shotId!==contacts[0].shotId||i&&value.time<contacts[i-1].time||previous!==undefined&&value.time-previous<=.05)fail('INVALID_REPLAY','Expanded contacts are out of shot order');previousByCollider.set(value.colliderId,value.time);
    let left=0,right=frames.length-1;while(left+1<right){const mid=(left+right)>>1;if(frames[mid].time<=value.time)left=mid;else right=mid;}
    for(const [frame,velocity]of [[frames[left],value.beforeVelocity],[frames[right],value.afterVelocity]]){
      const dt=Math.abs(frame.time-value.time),speed=Math.max(Math.hypot(...AXES.map(axis=>velocity[axis])),Math.hypot(...AXES.map(axis=>frame.velocity[axis])));
      if(Math.hypot(...AXES.map(axis=>value.position[axis]-frame.position[axis]))>(speed+9.81*dt)*dt+.001)fail('INVALID_REPLAY','Expanded contact is detached from its recorded pose trace');
    }
  }
}
function validateCapture(capture,replay,world,startTime,radius){
  const goal=outdoorGoals(world,startTime+capture.time).find(goal=>goal.id===capture.goalId);
  if(!goal||goal.role!==capture.goalRole||AXES.some(axis=>Math.abs(goal.normal[axis]-capture.normal[axis])>1e-7))fail('INVALID_REPLAY','Capture differs from its fixed goal identity');
  const offset=subtract(capture.position,goal.center),plane=dot(offset,goal.normal);
  if(Math.abs(plane)>TOL)fail('INVALID_REPLAY','Capture is detached from its timed goal plane');
  if(goal.shape==='circle'){
    const radial=Math.sqrt(Math.max(0,dot(offset,offset)-plane*plane));
    if(radial>goal.radius-radius+TOL)fail('INVALID_REPLAY','Throwable does not fit the circular goal');
  }else if(goal.shape==='rectangle'){
    const right={x:goal.up.y*goal.normal.z-goal.up.z*goal.normal.y,y:goal.up.z*goal.normal.x-goal.up.x*goal.normal.z,z:goal.up.x*goal.normal.y-goal.up.y*goal.normal.x};
    if(Math.abs(dot(offset,right))>goal.halfWidth-radius+TOL||Math.abs(dot(offset,goal.up))>goal.halfHeight-radius+TOL)fail('INVALID_REPLAY','Throwable does not fit the rectangular goal');
  }else fail('INVALID_REPLAY','Unsupported capture shape');
  const prior=replay.frames.at(-2),previousGoal=outdoorGoals(world,startTime+prior.time).find(value=>value.id===goal.id);
  const crossing=sweepOutdoorGoal(prior.position,capture.position,radius,previousGoal,goal);
  if(!crossing||Math.hypot(...AXES.map(axis=>crossing.position[axis]-capture.position[axis]))>TOL)
    fail('INVALID_REPLAY','Capture lacks an inward recorded approach');
  if(Math.abs(capture.time-replay.duration)>1e-8)fail('INVALID_REPLAY','Capture time differs from terminal frame');
  for(let i=1;i<replay.frames.length;i++)if(replay.frames[i].time-replay.frames[i-1].time>1/30+1e-8)fail('INVALID_REPLAY','Expanded recording cadence is too sparse');
}
function validateBlockingClearance(replay,world,startTime,radius){
  for(let i=1;i<replay.frames.length;i++){
    const a=replay.frames[i-1],b=replay.frames[i];
    const start=solidsAt(world,startTime+a.time).filter(solid=>solid.blocking);
    const end=new Map(solidsAt(world,startTime+b.time).filter(solid=>solid.blocking).map(solid=>[solid.id,solid]));
    for(const collider of start){
      const other=end.get(collider.id),delta=subtract(other.min,collider.min);
      if(sweepSphereAABB(a.position,subtract(b.position,delta),Math.max(.001,radius-.001),collider))
        fail('INVALID_REPLAY','Successful replay intersects a timed blocking object');
    }
  }
}
function validateOpeningCapture(replay,radius){
  const last=replay.frames.at(-1),prior=replay.frames.at(-2),bin=replay.bin;
  const plane=Math.abs(last.position.y-bin.height)<=1e-5?bin.height:bin.height+radius;
  const goal={id:'legacy-bin-opening',shape:'circle',center:{...bin.center,y:plane},normal:{x:0,y:1,z:0},up:{x:0,y:0,z:1},radius:bin.radius};
  // Five-decimal terminal poses retain the exact entry plane within codec
  // precision. Restore that y only for the shared strict crossing witness.
  const crossing=sweepOutdoorGoal(prior.position,{...last.position,y:plane},radius,goal);
  if(!crossing||Math.abs(replay.result.finalEntryTime-replay.duration)>1e-8)
    fail('INVALID_REPLAY','Splat item lacks its successful bin opening witness');
}
export function validateOutdoorReplay(input){
  object(input,['version','kind','item','course','replay'],'expanded replay');
  if(input.version!==6||input.kind!=='expanded-goals')fail('UNSUPPORTED_VERSION','Expanded replay version or kind is unsupported');
  object(input.item,['id','profileVersion'],'item');
  if(![1,2].includes(input.item.profileVersion)||typeof input.item.id!=='string'||!Object.hasOwn(THROWABLE_CATALOG,input.item.id)||input.item.profileVersion!==THROWABLE_CATALOG[input.item.id].physics.version)fail('INVALID_REPLAY','Unsupported fixed expanded throwable profile');
  object(input.course,['worldVersion','contactModel','stageId','startTime','fanEnabled','contacts','capture'],'course');
  const course=input.course;
  number(course.worldVersion,2,14,'course.worldVersion',true);
  const world=course.worldVersion>=11?outdoorWorld(course.stageId,course.worldVersion):roomWorld(course.stageId,course.worldVersion);
  if(!world||course.contactModel!==1||typeof course.fanEnabled!=='boolean'||course.fanEnabled&&course.stageId!=='room-extra'||course.worldVersion<=10&&input.item.profileVersion!==2)fail('INVALID_REPLAY','Unsupported fixed expanded world');
  const period=course.worldVersion>=11?12:world.environment==='school'?8:1;
  const startTime=number(course.startTime,0,period,'course.startTime');if(startTime>=period||world.environment==='room'&&startTime!==0)fail('INVALID_REPLAY','Invalid saved environment phase');
  if(course.worldVersion<=10&&course.capture!==null)fail('INVALID_REPLAY','Historical bin world cannot carry expanded capture');
  const capture=course.worldVersion>=11?captureData(course.capture,5.1):null;
  const replay=validateReplay(input.replay,coreContext(input.item,course.worldVersion,capture)),radius=THROWABLE_CATALOG[input.item.id].physics.radius;
  if(world.environment==='school')validateSchoolStudentClearance(replay,world,startTime,radius);
  if(capture){validateCapture(capture,replay,world,startTime,radius);validateBlockingClearance(replay,world,startTime,radius);}
  else if(THROWABLE_CATALOG[input.item.id].physics.terminalContact==='splat')validateOpeningCapture(replay,radius);
  const contacts=array(course.contacts,OUTDOOR_REPLAY_LIMITS.contacts,'contacts').map(value=>contactData(value,world,startTime,replay.duration,radius));validateTrace(contacts,replay.frames);
  if(THROWABLE_CATALOG[input.item.id].physics.terminalContact==='splat'&&contacts.length)fail('INVALID_REPLAY','Splat item cannot survive a non-goal contact');
  const record={version:6,kind:'expanded-goals',item:{id:input.item.id,profileVersion:input.item.profileVersion},course:{worldVersion:course.worldVersion,contactModel:1,stageId:course.stageId,startTime,fanEnabled:course.fanEnabled,contacts,capture},replay};
  if(encoder.encode(JSON.stringify(record)).byteLength>OUTDOOR_REPLAY_LIMITS.rawBytes)fail('REPLAY_TOO_LARGE','Expanded replay exceeds raw byte limit');return freeze(record);
}
export function createOutdoorReplay(core,stageId,contacts=[],{worldVersion,itemId='can',profileVersion=THROWABLE_CATALOG[itemId]?.physics.version,startTime=0,fanEnabled=false,capture=null}={}){
  return validateOutdoorReplay({version:6,kind:'expanded-goals',item:{id:itemId,profileVersion},course:{worldVersion,contactModel:1,stageId,startTime,fanEnabled,contacts,capture},replay:core});
}
export function outdoorPayload(record){return validateOutdoorReplay(record).replay;}
export function createOutdoorReplayPlayer(record){
  const valid=validateOutdoorReplay(record),{course,item}=valid,world=course.worldVersion>=11?outdoorWorld(course.stageId,course.worldVersion):roomWorld(course.stageId,course.worldVersion);
  const player=createReplayPlayer(valid.replay,coreContext(item,course.worldVersion,course.capture));
  return {duration:player.duration,sample(time){
    const snapshot=player.sample(time),environmentTime=course.startTime+snapshot.time;
    return {...snapshot,throwableId:item.id,worldVersion:course.worldVersion,startTime:course.startTime,environmentTime,
      ...(course.worldVersion>=11?{goals:outdoorGoals(world,environmentTime),motion:outdoorMotion(world,environmentTime),goalCapture:snapshot.time>=course.capture.time?{...course.capture,environmentTime:course.startTime+course.capture.time}:null}:
        world.environment==='school'?{schoolStartTime:course.startTime,student:schoolStudentPose(world,environmentTime),...(course.worldVersion===10?{students:schoolStudentPoses(world,environmentTime)}:{})}: {})};
  }};
}
export function outdoorReplayToJSON(record){return JSON.stringify(validateOutdoorReplay(record));}
export function parseOutdoorReplayJSON(text){
  if(typeof text!=='string')fail('INVALID_REPLAY','Expanded replay JSON must be text');
  if(text.length>OUTDOOR_REPLAY_LIMITS.rawBytes||encoder.encode(text).byteLength>OUTDOOR_REPLAY_LIMITS.rawBytes)fail('REPLAY_TOO_LARGE','Expanded replay exceeds JSON byte limit');
  let record;try{record=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed expanded replay JSON');}
  if(version(record)!==6)fail('UNSUPPORTED_VERSION','Expanded replay cannot carry another codec version');return validateOutdoorReplay(record);
}

// The existing bounded gzip/base64url recipe, with an explicit new fragment.
async function readBounded(stream,limit){
  const reader=stream.getReader(),chunks=[];let length=0;
  try{while(true){const{value,done}=await reader.read();if(done)break;length+=value.byteLength;
    if(length>limit){await reader.cancel().catch(()=>{});fail('REPLAY_TOO_LARGE','Outdoor replay stream exceeds byte limit');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
function base64url(bytes){
  let binary='';for(let i=0;i<bytes.length;i+=4096)binary+=String.fromCharCode(...bytes.subarray(i,i+4096));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function unbase64url(text){
  if(!text||!/^[A-Za-z0-9_-]+$/.test(text)||text.length%4===1)fail('INVALID_ENCODING','Invalid base64url expanded replay');
  let binary;try{binary=atob(text.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-text.length%4)%4));}
  catch{fail('INVALID_ENCODING','Invalid base64url expanded replay');}
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(base64url(bytes)!==text)fail('INVALID_ENCODING','Noncanonical base64url expanded replay');return bytes;
}
export async function encodeOutdoorReplay(record){
  const json=outdoorReplayToJSON(record);
  if(typeof CompressionStream!=='function'){const error=new ReplayError('COMPRESSION_UNAVAILABLE','Outdoor replay URL compression unavailable');error.fallbackJSON=json;throw error;}
  let bytes;try{bytes=await readBounded(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')),OUTDOOR_REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Outdoor replay compression failed');}
  const fragment=`tsc6.${base64url(bytes)}`;
  if(fragment.length+1>OUTDOOR_REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','Outdoor replay URL exceeds 8000 characters; use its file');error.fallbackJSON=json;throw error;}
  return fragment;
}
export async function decodeOutdoorReplay(fragment){
  if(typeof fragment!=='string'||fragment.length>OUTDOOR_REPLAY_LIMITS.urlChars)fail('SHARE_TOO_LARGE','Outdoor replay fragment exceeds URL limit');
  const text=fragment.startsWith('#')?fragment.slice(1):fragment;
  if(!text.startsWith('tsc6.'))fail('UNSUPPORTED_VERSION','Outdoor replay fragment is unsupported');
  const bytes=unbase64url(text.slice(5));
  if(typeof DecompressionStream!=='function')fail('COMPRESSION_UNAVAILABLE','Outdoor replay URL decompression unavailable');
  let decoded;try{decoded=await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),OUTDOOR_REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Invalid compressed expanded replay');}
  let json;try{json=decoder.decode(decoded);}catch{fail('INVALID_ENCODING','Outdoor replay is not UTF-8');}
  const record=parseOutdoorReplayJSON(json);if(record.version!==6)fail('UNSUPPORTED_VERSION','Outdoor fragment cannot carry another replay');return record;
}
export async function buildOutdoorReplayURL(record,url){
  let result;try{result=new URL(url);}catch{fail('INVALID_URL','Outdoor replay URL base is invalid');}
  if(!['http:','https:'].includes(result.protocol)||result.username||result.password)fail('INVALID_URL','Outdoor replay URL must use HTTP or HTTPS');
  result.hash=await encodeOutdoorReplay(record);
  if(result.href.length>OUTDOOR_REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','Outdoor replay URL exceeds 8000 characters; use its file');error.fallbackJSON=outdoorReplayToJSON(record);throw error;}
  return result.href;
}

function requireStore(store){
  if(!store||typeof store.getItem!=='function'||typeof store.setItem!=='function'||typeof store.removeItem!=='function')
    fail('STORAGE_UNAVAILABLE','Outdoor replay storage is unavailable');return store;
}
export function loadOutdoorReplays(store){
  requireStore(store);const text=store.getItem(OUTDOOR_REPLAY_STORAGE_KEY);if(text==null)return [];
  if(typeof text!=='string'||text.length>OUTDOOR_REPLAY_LIMITS.storageBytes||encoder.encode(text).byteLength>OUTDOOR_REPLAY_LIMITS.storageBytes)
    fail('REPLAY_TOO_LARGE','Saved expanded replays exceed byte limit');
  let records;try{records=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed saved expanded replays');}
  return array(records,OUTDOOR_REPLAY_LIMITS.saved,'saved expanded replays').map(record=>{
    if(version(record)!==6)fail('INVALID_REPLAY','Only V6 records belong in the expanded replay store');return validateOutdoorReplay(record);
  });
}
function writeOutdoorReplays(store,records){
  requireStore(store);loadOutdoorReplays(store);const previous=store.getItem(OUTDOOR_REPLAY_STORAGE_KEY);
  const text=JSON.stringify(records.map(validateOutdoorReplay));
  if(encoder.encode(text).byteLength>OUTDOOR_REPLAY_LIMITS.storageBytes)fail('REPLAY_TOO_LARGE','Saved expanded replays exceed byte limit');
  try{store.setItem(OUTDOOR_REPLAY_STORAGE_KEY,text);if(store.getItem(OUTDOOR_REPLAY_STORAGE_KEY)!==text)throw new ReplayError('STORAGE_FAILED','Outdoor replay save readback failed');}
  catch(error){try{if(previous===null)store.removeItem(OUTDOOR_REPLAY_STORAGE_KEY);else store.setItem(OUTDOOR_REPLAY_STORAGE_KEY,previous);}catch{}throw error;}
}
export function saveOutdoorReplay(store,record){
  if(version(record)!==6)fail('INVALID_REPLAY','Only V6 records belong in the expanded replay store');
  const valid=validateOutdoorReplay(record),records=loadOutdoorReplays(store);
  writeOutdoorReplays(store,[valid,...records.filter(item=>item.replay.id!==valid.replay.id)].slice(0,OUTDOOR_REPLAY_LIMITS.saved));return valid;
}
export function deleteOutdoorReplay(store,id){
  const records=loadOutdoorReplays(store);writeOutdoorReplays(store,records.filter(record=>record.replay.id!==id));return true;
}
