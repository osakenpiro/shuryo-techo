// A short presentation before a live hit. No physics, attempts, awards or
// replay frames begin until the caller receives the single completed launch.
export const BASEBALL_PITCH_DURATION=.58;
const copy=value=>JSON.parse(JSON.stringify(value));
export function createBaseballIntro(){
  let pending=null,elapsed=0,lastCancel=null;
  function start({world,controls,source}){
    if(pending||![36,60].includes(world?.worldVersion)||world?.outdoorType!=='baseball'||!['power','elevation','yaw'].every(k=>Number.isFinite(controls?.[k])))return false;
    pending={stageId:world.stageId,worldVersion:world.worldVersion,controls:{...controls},source};elapsed=0;lastCancel=null;return true;
  }
  function cancel(reason='cancel'){if(!pending)return false;pending=null;elapsed=0;lastCancel=reason;return true;}
  function advance(dt,world){
    if(!pending)return null;
    if(world?.worldVersion!==pending.worldVersion||world?.stageId!==pending.stageId){cancel('stage-change');return null;}
    if(!Number.isFinite(dt)||dt<=0)return null;
    elapsed=Math.min(BASEBALL_PITCH_DURATION,elapsed+Math.min(dt,.1));
    if(elapsed<BASEBALL_PITCH_DURATION-1e-9)return null;
    const launch=copy(pending);pending=null;return launch;
  }
  function snapshot(world,radius=.0365){
    const active=pending!==null,phase=!active?'idle':elapsed<.22?'windup':elapsed<.54?'delivery':'impact';
    const from={x:0,y:1.60,z:7},to={...(world?.origin??{x:0,y:1.9,z:0})};to.y+=radius-.14;
    const t=Math.max(0,Math.min(1,(elapsed-.22)/.32));
    const ballPosition=active&&phase!=='windup'?{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+.10*Math.sin(Math.PI*t),z:from.z+(to.z-from.z)*t}:null;
    return {active,phase,elapsed,duration:BASEBALL_PITCH_DURATION,pendingStage:pending?.stageId??null,ballPosition,lastCancel};
  }
  return Object.freeze({start,cancel,advance,snapshot,get active(){return pending!==null;}});
}
