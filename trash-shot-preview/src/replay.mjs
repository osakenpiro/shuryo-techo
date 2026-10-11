// Recorded world poses, never a seed or a second physics simulation.
import { ROOM_PHYSICS_WORLDS } from './physics.mjs?v=20261011-play-ui-1';
export const REPLAY_LIMITS = Object.freeze({version:1, duration:5.1, frames:720,
  hz:60, rawBytes:180*1024, saved:5, storageBytes:900*1024, urlChars:8000,
  contacts:2400, precision:1e-5, storageKey:'trash-shot.replays.v1'});
export const REPLAY_ROLE_LABELS = Object.freeze({direct:'ダイレクト', 'floor-1':'床1バウンド',
  'floor-2':'床2バウンド', 'floor-3plus':'床3+バウンド', 'rim-bank':'ふち当て', 'side-bank':'側面バンク'});
const PHASES = ['flying','settling','success'];
const enc = new TextEncoder(), dec = new TextDecoder('utf-8',{fatal:true});
const fail = (code,message) => {throw new ReplayError(code,message);};
export class ReplayError extends Error {
  constructor(code,message){super(message);this.name='ReplayError';this.code=code;}
}
function object(value,keys,where){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)
    fail('INVALID_REPLAY',`${where}: plain object required`);
  const descriptors=Object.getOwnPropertyDescriptors(value), names=Reflect.ownKeys(descriptors);
  if(names.length!==keys.length||names.some(key=>typeof key!=='string'||!keys.includes(key))
      ||keys.some(key=>!descriptors[key]||!('value' in descriptors[key])||!descriptors[key].enumerable))
    fail('INVALID_REPLAY',`${where}: unexpected keys or accessors`);
  return value;
}
function array(value,min,max,where){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype
      ||value.length<min||value.length>max)fail('INVALID_REPLAY',`${where}: invalid array size`);
  const keys=Reflect.ownKeys(value);
  if(keys.length!==value.length+1||keys.some(key=>typeof key!=='string'
      ||(key!=='length'&&!/^(0|[1-9]\d*)$/.test(key))))fail('INVALID_REPLAY',`${where}: invalid array keys`);
  for(let i=0;i<value.length;i++){
    const d=Object.getOwnPropertyDescriptor(value,String(i));
    if(!d||!('value' in d)||!d.enumerable)fail('INVALID_REPLAY',`${where}: sparse or accessor array`);
  }
  return value;
}
function number(value,min,max,where,integer=false){
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max
      ||(integer&&!Number.isInteger(value)))fail('INVALID_REPLAY',`${where}: number out of range`);
  return value;
}
function vector(value,where,velocity=false){
  object(value,['x','y','z'],where);
  return {x:number(value.x,-100,100,`${where}.x`),y:number(value.y,velocity?-100:0,100,`${where}.y`),
    z:number(value.z,-100,100,`${where}.z`)};
}
const quantize = value => Number(value.toFixed(5));
const qvector = value => ({x:quantize(value.x),y:quantize(value.y),z:quantize(value.z)});
function replayWorld(context={}){
  if(!context||typeof context!=='object'||Array.isArray(context)||Object.getPrototypeOf(context)!==Object.prototype)
    fail('INVALID_REPLAY','replay context: plain object required');
  if(Reflect.ownKeys(context).length===0)return 1;
  object(context,['worldVersion'],'replay context');
  if(context.worldVersion!==1&&context.worldVersion!==2)fail('UNSUPPORTED_VERSION','Replay world context is unsupported');
  return context.worldVersion;
}
function binData(value,worldVersion=1){
  object(value,['center','radius','height'],'bin');const center=vector(value.center,'bin.center');
  const height=number(value.height,.5,2.5,'bin.height');
  if(worldVersion===2){
    const allowed=ROOM_PHYSICS_WORLDS[2].bin;
    if(center.x!==allowed.center.x||center.y!==allowed.center.y||center.z!==allowed.center.z
      ||value.radius!==allowed.radius||height!==allowed.height)fail('INVALID_REPLAY','bin: unsupported room world 2 setup');
    return {center,radius:allowed.radius,height};
  }
  if(center.x!==0||Math.abs(center.y-height/2)>1e-8||center.z<3||center.z>10||value.radius!==.7)
    fail('INVALID_REPLAY','bin: unsupported setup');
  return {center,radius:.7,height};
}
function controlData(value){
  object(value,['power','elevation','yaw'],'controls');
  return {power:number(value.power,.5,14,'controls.power'),elevation:number(value.elevation,5,85,'controls.elevation'),
    yaw:number(value.yaw,-60,60,'controls.yaw')};
}
function cameraData(value){
  // Renderer snapshots have derived position/target/viewport. Only orbit settings are retained.
  if(!value||typeof value!=='object')fail('INVALID_REPLAY','camera required');
  const clean={azimuth:value.azimuth,elevation:value.elevation,zoom:value.zoom};
  return cameraSchema(clean);
}
function cameraSchema(value){
  object(value,['azimuth','elevation','zoom'],'camera');
  return {azimuth:number(value.azimuth,0,Math.PI*2,'camera.azimuth'),
    elevation:number(value.elevation,.15,1.43,'camera.elevation'),zoom:number(value.zoom,.62,1.8,'camera.zoom')};
}
function roleData(input,duration,strict=false){
  const value=input??{};
  if(strict)object(value,['roles','floorBounces','rimHits','sideHits','internalContacts','finalEntryTime'],'result');
  const result={roles:[],floorBounces:number(value.floorBounces??0,0,REPLAY_LIMITS.contacts,'floorBounces',true),
    rimHits:number(value.rimHits??0,0,REPLAY_LIMITS.contacts,'rimHits',true),
    sideHits:number(value.sideHits??0,0,REPLAY_LIMITS.contacts,'sideHits',true),
    internalContacts:number(value.internalContacts??0,0,REPLAY_LIMITS.contacts,'internalContacts',true),
    finalEntryTime:number(value.finalEntryTime??duration,0,duration+1e-8,'finalEntryTime')};
  const expected=[];
  if(result.floorBounces)expected.push(result.floorBounces===1?'floor-1':result.floorBounces===2?'floor-2':'floor-3plus');
  if(result.rimHits)expected.push('rim-bank');if(result.sideHits)expected.push('side-bank');
  if(!expected.length)expected.push('direct');
  if(value.roles!==undefined){
    array(value.roles,1,3,'roles');const ids=[];
    for(const role of value.roles){
      object(role,['id','label'],'role');
      if(typeof role.id!=='string'||!Object.hasOwn(REPLAY_ROLE_LABELS,role.id)||role.label!==REPLAY_ROLE_LABELS[role.id]
          ||ids.includes(role.id))fail('INVALID_REPLAY','role: invalid ID or label');ids.push(role.id);
    }
    if(ids.length!==expected.length||expected.some(id=>!ids.includes(id)))fail('INVALID_REPLAY','role counts disagree');
  }
  result.roles=expected.map(id=>({id,label:REPLAY_ROLE_LABELS[id]}));return result;
}
function frameData(snapshot){
  if(!snapshot||!PHASES.includes(snapshot.phase))fail('INVALID_REPLAY','frame: invalid phase');
  const time=number(snapshot.time,0,REPLAY_LIMITS.duration,'frame.time');
  if(snapshot.can?.radius!==.14)fail('INVALID_REPLAY','frame: invalid can radius');
  return {time,phase:snapshot.phase,position:qvector(vector(snapshot.can.position,'position')),
    velocity:qvector(vector(snapshot.can.velocity,'velocity',true))};
}
function freeze(value){
  if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;
}
function replayID(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  return Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join('');
}
function validID(id){return typeof id==='string'&&/^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/.test(id);}
function encodedSize(text){return enc.encode(text).byteLength;}
export function validateReplay(input,context={}){
  const worldVersion=replayWorld(context);
  object(input,['version','id','createdAt','duration','bin','controls','camera','result','frames'],'replay');
  if(input.version!==1)fail('UNSUPPORTED_VERSION','Replay version is unsupported');
  if(!validID(input.id))fail('INVALID_REPLAY','Invalid replay ID');
  const createdAt=number(input.createdAt,0,8640000000000000,'createdAt',true);
  const duration=number(input.duration,0.000001,REPLAY_LIMITS.duration,'duration');
  const bin=binData(input.bin,worldVersion),controls=controlData(input.controls),camera=cameraSchema(input.camera);
  array(input.frames,2,REPLAY_LIMITS.frames,'frames');let previous=-1;
  const frames=input.frames.map((frame,index)=>{
    object(frame,['time','phase','position','velocity'],'frame');
    const time=number(frame.time,0,duration,'frame.time');
    if(time<=previous||!PHASES.includes(frame.phase)||(index<input.frames.length-1&&frame.phase==='success'))
      fail('INVALID_REPLAY','Frames must have increasing times and one final success');
    previous=time;
    return {time,phase:frame.phase,position:vector(frame.position,'position'),velocity:vector(frame.velocity,'velocity',true)};
  });
  const first=frames[0],last=frames.at(-1);
  if(worldVersion===2){
    const origin=ROOM_PHYSICS_WORLDS[2].origin;
    if(['x','y','z'].some(axis=>first.position[axis]!==origin[axis]))fail('INVALID_REPLAY','Initial pose differs from room world 2 origin');
  }
  if(first.time!==0||first.phase!=='flying'||last.time!==duration||last.phase!=='success'
      ||Math.hypot(last.position.x-bin.center.x,last.position.z-bin.center.z)>bin.radius-.14+1e-5
      ||Math.abs(last.position.y-.14)>1e-5||Object.values(last.velocity).some(v=>v!==0))
    fail('INVALID_REPLAY','Initial/terminal pose is invalid');
  const replay={version:1,id:input.id,createdAt,duration,bin,controls,camera,result:roleData(input.result,duration,true),frames};
  if(encodedSize(JSON.stringify(replay))>REPLAY_LIMITS.rawBytes)fail('REPLAY_TOO_LARGE','Replay exceeds raw data limit');
  return freeze(replay);
}
export function createRecorder(startSnapshot,controls,camera,context={}){
  const worldVersion=replayWorld(context),codecContext={worldVersion};
  const first=frameData(startSnapshot);
  if(first.time!==0||first.phase!=='flying')fail('INVALID_REPLAY','Recorder starts immediately after launch');
  if(worldVersion===2&&['x','y','z'].some(axis=>first.position[axis]!==ROOM_PHYSICS_WORLDS[2].origin[axis]))fail('INVALID_REPLAY','Recorder origin differs from room world 2');
  const bin=binData(startSnapshot.bin,worldVersion),initialControls=controlData(controls),initialCamera=cameraData(camera);
  const frames=[first];let closed=false,lastObserved=0,dropped=0,finished=null;
  const unchanged=snapshot=>{
    const next=binData(snapshot.bin,worldVersion);
    if(JSON.stringify(bin)!==JSON.stringify(next))fail('INVALID_REPLAY','Setup changed during recording');
  };
  function record(snapshot){
    if(closed)return false;
    unchanged(snapshot);
    if(snapshot.phase==='miss'){number(snapshot.time,lastObserved,REPLAY_LIMITS.duration,'miss.time');return false;}
    const frame=frameData(snapshot);
    if(frame.time<lastObserved)fail('INVALID_REPLAY','Recording time moved backwards');lastObserved=frame.time;
    const prior=frames.at(-1);
    if(frame.time===prior.time)return false;
    if(frame.phase!=='success'&&frame.time-prior.time<1/REPLAY_LIMITS.hz-1e-8){dropped++;return false;}
    if(frames.length>=REPLAY_LIMITS.frames)fail('REPLAY_TOO_LARGE','Too many recorded frames');
    frames.push(frame);return true;
  }
  function finish(snapshot,roles={}){
    if(closed)return finished;
    if(snapshot?.phase==='miss'){closed=true;finished=null;return null;}
    if(snapshot?.phase!=='success')fail('INVALID_REPLAY','Only completed success can make a replay');
    record(snapshot);closed=true;
    const duration=frames.at(-1).time;
    finished=validateReplay({version:1,id:replayID(),createdAt:Date.now(),duration,bin,
      controls:initialControls,camera:initialCamera,result:roleData(roles,duration),frames},codecContext);return finished;
  }
  return {record,finish,get closed(){return closed;},get frameCount(){return frames.length;},get dropped(){return dropped;}};
}
export function createReplayPlayer(input,context={}){
  const replay=validateReplay(input,context),frames=replay.frames;
  function sample(time){
    if(typeof time!=='number'||!Number.isFinite(time))fail('INVALID_PLAYBACK_TIME','Playback time must be finite');
    const t=Math.max(0,Math.min(replay.duration,time));let low=0,high=frames.length-1;
    while(low+1<high){const mid=(low+high)>>1;if(frames[mid].time<=t)low=mid;else high=mid;}
    if(t===replay.duration)low=high=frames.length-1;
    const a=frames[low],b=frames[high],fraction=high===low?0:(t-a.time)/(b.time-a.time);
    const lerp=(x,y)=>({x:x.x+(y.x-x.x)*fraction,y:x.y+(y.y-x.y)*fraction,z:x.z+(y.z-x.z)*fraction});
    const position=lerp(a.position,b.position),velocity=lerp(a.velocity,b.velocity);
    return {phase:a.phase,time:t,can:{position,velocity,radius:.14},
      bin:{...replay.bin,center:{...replay.bin.center}},attempts:0,successes:0,lastEvent:null,events:[],
      trail:[...frames.slice(Math.max(0,low-158),low+1).map(frame=>({...frame.position})),{...position}]};
  }
  return {duration:replay.duration,sample};
}
export function replayToJSON(replay){return JSON.stringify(validateReplay(replay));}
export function parseReplayJSON(text){
  if(typeof text!=='string')fail('INVALID_REPLAY','Replay JSON must be text');
  if(text.length>REPLAY_LIMITS.rawBytes||encodedSize(text)>REPLAY_LIMITS.rawBytes)
    fail('REPLAY_TOO_LARGE','Replay JSON exceeds byte limit');
  let value;try{value=JSON.parse(text);}catch{fail('INVALID_REPLAY','Malformed replay JSON');}
  return validateReplay(value);
}
async function readBounded(stream,limit){
  const reader=stream.getReader(),chunks=[];let length=0;
  try{
    while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;
      if(length>limit){await reader.cancel().catch(()=>{});fail('REPLAY_TOO_LARGE','Replay stream exceeds byte limit');}
      chunks.push(value);}
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
function base64url(bytes){
  let binary='';for(let i=0;i<bytes.length;i+=4096)binary+=String.fromCharCode(...bytes.subarray(i,i+4096));
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function unbase64url(text){
  if(!text||!/^[A-Za-z0-9_-]+$/.test(text)||text.length%4===1)fail('INVALID_ENCODING','Invalid base64url replay');
  let binary;try{binary=atob(text.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-text.length%4)%4));}
  catch{fail('INVALID_ENCODING','Invalid base64url replay');}
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(base64url(bytes)!==text)fail('INVALID_ENCODING','Noncanonical base64url replay');return bytes;
}
export async function encodeReplay(replay){
  const json=replayToJSON(replay);
  if(typeof CompressionStream!=='function'){const error=new ReplayError('COMPRESSION_UNAVAILABLE','Replay URL compression unavailable');error.fallbackJSON=json;throw error;}
  let bytes;try{bytes=await readBounded(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')),REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Replay compression failed');}
  const fragment=`tsr1.${base64url(bytes)}`;
  if(fragment.length+1>REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','Replay URL exceeds 8000 characters; use the replay file');error.fallbackJSON=json;throw error;}
  return fragment;
}
export async function decodeReplay(fragment){
  if(typeof fragment!=='string'||fragment.length>REPLAY_LIMITS.urlChars)fail('SHARE_TOO_LARGE','Replay fragment exceeds URL limit');
  const text=fragment.startsWith('#')?fragment.slice(1):fragment;
  if(!text.startsWith('tsr1.'))fail('UNSUPPORTED_VERSION','Replay fragment version is unsupported');
  const bytes=unbase64url(text.slice(5));
  if(typeof DecompressionStream!=='function')fail('COMPRESSION_UNAVAILABLE','Replay URL decompression unavailable');
  let decoded;
  try{decoded=await readBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),REPLAY_LIMITS.rawBytes);}
  catch(error){if(error instanceof ReplayError)throw error;fail('INVALID_ENCODING','Invalid compressed replay');}
  let json;try{json=dec.decode(decoded);}catch{fail('INVALID_ENCODING','Replay is not UTF-8 text');}
  return parseReplayJSON(json);
}
export async function buildReplayURL(replay,url){
  let result;try{result=new URL(url);}catch{fail('INVALID_URL','Replay URL base is invalid');}
  if(!['http:','https:'].includes(result.protocol)||result.username||result.password)fail('INVALID_URL','Replay URL must use HTTP or HTTPS');
  result.hash=await encodeReplay(replay);
  if(result.href.length>REPLAY_LIMITS.urlChars){const error=new ReplayError('SHARE_TOO_LARGE','Replay URL exceeds 8000 characters; use the replay file');error.fallbackJSON=replayToJSON(replay);throw error;}
  return result.href;
}
const statusError=error=>({code:error instanceof ReplayError?error.code:'STORAGE_UNAVAILABLE',message:error instanceof ReplayError?error.message:'Replay storage is unavailable or full'});
const status=(ok,replays=[],error=null,discarded=0)=>({ok,replays,error,discarded});
export function loadReplays(storage){
  try{
    if(!storage||typeof storage.getItem!=='function')fail('STORAGE_UNAVAILABLE','Replay storage unavailable');
    const text=storage.getItem(REPLAY_LIMITS.storageKey);if(text===null)return status(true);
    if(typeof text!=='string'||text.length>REPLAY_LIMITS.storageBytes||encodedSize(text)>REPLAY_LIMITS.storageBytes)
      fail('STORAGE_CORRUPT','Stored replay data exceeds limit');
    let root;try{root=JSON.parse(text);}catch{fail('STORAGE_CORRUPT','Stored replay data is malformed');}
    object(root,['version','replays'],'storage');if(root.version!==1)fail('STORAGE_CORRUPT','Stored replay version is unsupported');
    array(root.replays,0,REPLAY_LIMITS.saved,'stored replays');const replays=[],ids=new Set();let discarded=0;
    for(const value of root.replays){try{const replay=validateReplay(value);
      if(ids.has(replay.id)){discarded++;continue;}ids.add(replay.id);replays.push(replay);}catch{discarded++;}}
    return status(true,replays,discarded?{code:'CORRUPT_ENTRIES',message:`${discarded} damaged replay(s) omitted`}:null,discarded);
  }catch(error){return status(false,[],statusError(error));}
}
function writeReplays(storage,replays,before){
  const text=JSON.stringify({version:1,replays});
  if(encodedSize(text)>REPLAY_LIMITS.storageBytes)fail('STORAGE_TOO_LARGE','Saved replays exceed storage limit');
  if(typeof storage?.setItem!=='function')fail('STORAGE_UNAVAILABLE','Replay storage unavailable');
  storage.setItem(REPLAY_LIMITS.storageKey,text);
  if(storage.getItem(REPLAY_LIMITS.storageKey)!==text)fail('STORAGE_VERIFY_FAILED','Replay storage write was not retained');
  const readback=loadReplays(storage);
  if(!readback.ok||readback.discarded||readback.replays.length!==replays.length)fail('STORAGE_VERIFY_FAILED','Replay storage readback failed');
  return status(true,readback.replays,null,before.discarded);
}
export function saveReplay(storage,input){
  const before=loadReplays(storage);if(!before.ok)return before;
  try{const replay=validateReplay(input),replays=[replay,...before.replays.filter(item=>item.id!==replay.id)].slice(0,REPLAY_LIMITS.saved);
    return writeReplays(storage,replays,before);
  }catch(error){return status(false,before.replays,statusError(error),before.discarded);}
}
export function deleteReplay(storage,id){
  const before=loadReplays(storage);if(!before.ok)return before;
  try{if(!validID(id))fail('INVALID_REPLAY','Invalid replay ID');
    return writeReplays(storage,before.replays.filter(replay=>replay.id!==id),before);
  }catch(error){return status(false,before.replays,statusError(error),before.discarded);}
}
