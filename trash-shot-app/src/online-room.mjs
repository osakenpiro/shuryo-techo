import {STAGES} from './stages.mjs?v=20261015-boar-distance-1';
import {roomWorld} from './room-course.mjs?v=20261015-boar-distance-1';

export const ONLINE_PROTOCOL = 1;
export const ONLINE_BUILD = 'trashoot-online-20261103-3';
export const ONLINE_LIMITS = Object.freeze({players:4, countdownMs:2500, roundMs:120000, packetBytes:8192});
const clone = value => structuredClone(value);
const identity = value => typeof value==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value);
export function onlineName(value){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,16)||'PLAYER':'PLAYER';}
export function onlineStage(id){return typeof id==='string' && Object.hasOwn(STAGES,id) && !!STAGES[id].environment;}
export function onlineInput(value,stageId){
  const numeric=value && Object.getPrototypeOf(value)===Object.prototype && Object.keys(value).length===3 &&
    ['power','elevation','yaw'].every(key=>typeof value[key]==='number' && Number.isFinite(value[key])) &&
    value.power>=.1 && value.power<=14 && value.elevation>=-80 && value.elevation<=85 && Math.abs(value.yaw)<=60;
  if(!numeric||stageId===undefined)return !!numeric;
  if(!onlineStage(stageId))return false;
  const limits=roomWorld(stageId,STAGES[stageId].worldVersion).physics?.launchLimits??{};
  return value.power>=(limits.minPower??.5)&&value.power<=(limits.maxPower??14)&&value.elevation>=(limits.minElevation??5)&&value.elevation<=(limits.maxElevation??85);
}
export function onlinePacket(value){
  if(!value || Object.getPrototypeOf(value)!==Object.prototype || value.v!==ONLINE_PROTOCOL || value.build!==ONLINE_BUILD)return false;
  try{if(new TextEncoder().encode(JSON.stringify(value)).length>ONLINE_LIMITS.packetBytes)return false;}catch{return false;}
  return ['hello','welcome','state','ready','start','shot','accepted','leave','ping','pong','error'].includes(value.kind);
}
export const packet = (kind,detail={}) => ({v:ONLINE_PROTOCOL,build:ONLINE_BUILD,kind,...detail});
export function onlineState(state){
  if(!state || !onlineStage(state.stageId) || state.worldVersion!==STAGES[state.stageId].worldVersion || !identity(state.hostId) ||
    !['lobby','countdown','running','finished'].includes(state.phase) || !Number.isInteger(state.round) || state.round<0 ||
    !Array.isArray(state.players) || state.players.length<1 || state.players.length>4)return false;
  if(state.phase!=='lobby' && (![state.startsAt,state.deadline].every(Number.isFinite) || state.deadline-state.startsAt!==ONLINE_LIMITS.roundMs))return false;
  if(new Set(state.players.map(p=>p?.id)).size!==state.players.length || new Set(state.players.map(p=>p?.seat)).size!==state.players.length)return false;
  return state.players.every(p=>p && identity(p.id) && typeof p.name==='string' && p.name===onlineName(p.name) && Number.isInteger(p.seat) && p.seat>=0 && p.seat<4 &&
    ['ready','connected','dnf'].every(k=>typeof p[k]==='boolean') && Number.isInteger(p.attempts) && p.attempts>=0 && p.attempts<1000000 &&
    (p.finishedAt===null || Number.isFinite(p.finishedAt)&&p.finishedAt>=0&&p.finishedAt<=ONLINE_LIMITS.roundMs) &&
    (p.shot===null || p.shot.id===p.id && p.shot.round===state.round && p.shot.seq===p.attempts && Number.isFinite(p.shot.startedAt)&&p.shot.startedAt>=0&&p.shot.startedAt<=ONLINE_LIMITS.roundMs&&onlineInput(p.shot.input,state.stageId))) &&
    state.players.some(p=>p.id===state.hostId&&p.seat===0);
}

// Only the hosting controller calls these methods. Remote peers can request a
// shot, but cannot submit a result, another player's identity, or a save update.
export function createOnlineRoom({hostId,name,stageId,canHost=()=>false,now=()=>performance.now()}={}){
  if(!identity(hostId) || !onlineStage(stageId) || !canHost(stageId))throw new RangeError('Host course is not eligible');
  let state={phase:'lobby',round:0,hostId,stageId,worldVersion:STAGES[stageId].worldVersion,startsAt:null,deadline:null,
    players:[{id:hostId,name:onlineName(name),seat:0,ready:true,connected:true,attempts:0,shot:null,finishedAt:null,dnf:false}]};
  const member=id=>state.players.find(player=>player.id===id);
  function finishIfDone(){if(state.phase==='running' && state.players.every(p=>p.dnf || p.finishedAt!==null))state.phase='finished';}
  function tick(){
    const time=now();
    if(state.phase==='countdown' && time>=state.startsAt)state.phase='running';
    if(state.phase==='running' && time>=state.deadline){for(const p of state.players)if(p.finishedAt===null){p.dnf=true;p.shot=null;}state.phase='finished';}
    finishIfDone();return clone(state);
  }
  function join(id,name,build){
    if(build!==ONLINE_BUILD)return {ok:false,reason:'version'};
    if(!identity(id) || member(id))return {ok:false,reason:'identity'};
    if(state.phase!=='lobby')return {ok:false,reason:'started'};
    if(state.players.length>=ONLINE_LIMITS.players)return {ok:false,reason:'full'};
    const seat=[0,1,2,3].find(n=>!state.players.some(p=>p.seat===n));
    state.players.push({id,name:onlineName(name),seat,ready:false,connected:true,attempts:0,shot:null,finishedAt:null,dnf:false});
    return {ok:true,seat};
  }
  function ready(id,value){const p=member(id);if(state.phase!=='lobby'||!p||typeof value!=='boolean')return false;p.ready=value;return true;}
  function start(){
    if(state.phase!=='lobby'||state.players.length<2||!state.players.every(p=>p.ready&&p.connected))return false;
    state.round++;state.phase='countdown';state.startsAt=now()+ONLINE_LIMITS.countdownMs;state.deadline=state.startsAt+ONLINE_LIMITS.roundMs;return true;
  }
  function launch(id,input){
    tick();const p=member(id);
    if(state.phase!=='running'||!p||!p.connected||p.dnf||p.finishedAt!==null||p.shot||!onlineInput(input,state.stageId))return null;
    const startedAt=Math.max(0,Math.floor((now()-state.startsAt)*.24)/.24);
    const shot={id,round:state.round,seq:++p.attempts,startedAt,input:{power:input.power,elevation:input.elevation,yaw:input.yaw}};
    p.shot=shot;return clone(shot);
  }
  function complete(id,seq,{success,duration}){
    const p=member(id);
    if(state.phase!=='running'||!p?.shot||p.shot.seq!==seq||p.dnf||typeof success!=='boolean'||!Number.isFinite(duration)||duration<0||duration>12.1)return false;
    const finishedAt=p.shot.startedAt+duration*1000;
    p.shot=null;if(success&&finishedAt<=ONLINE_LIMITS.roundMs)p.finishedAt=finishedAt;
    finishIfDone();return true;
  }
  function leave(id){
    if(id===hostId)return false;const p=member(id);if(!p)return false;
    if(state.phase==='lobby')state.players=state.players.filter(p=>p.id!==id);
    else{p.connected=false;p.dnf=p.finishedAt===null;p.shot=null;finishIfDone();}return true;
  }
  function rematch(){
    if(state.phase!=='finished')return false;
    state.phase='lobby';state.startsAt=null;state.deadline=null;
    state.players=state.players.filter(p=>p.connected).map(p=>({...p,ready:p.id===hostId,attempts:0,shot:null,finishedAt:null,dnf:false}));return true;
  }
  return Object.freeze({join,ready,start,launch,complete,leave,rematch,tick,snapshot:()=>clone(state)});
}
