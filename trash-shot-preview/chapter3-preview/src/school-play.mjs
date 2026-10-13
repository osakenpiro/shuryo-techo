// The school adapter composes the established 240 Hz room contact stepper.
// Only explicit school solids, deterministic pedestrian motion and rooftop
// wind differ; gravity, hollow-bin entry, item profiles and results stay core.
import {createGame,setRoomWorld,throwCan,stopBlockedShot} from './physics.mjs?v=20261014-ballpark-1';
import {schoolWorld,schoolSolids,schoolStudentPoses} from './school-world.mjs?v=20261014-ballpark-1';
import {createRoomContactStepper,ROOM_CONTACT_TICK} from './room-contact.mjs?v=20261014-ballpark-1';
import {cloneThrowable,throwableWindScale} from './throwable-physics.mjs?v=20261014-ballpark-1';
const TICK=ROOM_CONTACT_TICK,EPS=1e-9;
const active=game=>game?.phase==='flying'||game?.phase==='settling';
const copy=p=>({x:p.x,y:p.y,z:p.z});
export const SCHOOL_PLAY_TICK=TICK;
export const SCHOOL_ENVIRONMENT_PERIOD=8;
export function schoolStartTime(time=0){
  if(!Number.isFinite(time))throw new TypeError('School start time must be finite');
  return ((time%SCHOOL_ENVIRONMENT_PERIOD)+SCHOOL_ENVIRONMENT_PERIOD)%SCHOOL_ENVIRONMENT_PERIOD;
}
function requireWorld(world){if(!schoolWorld(world?.stageId,world?.worldVersion))throw new RangeError('A supported school world is required');}
export function createSchoolPlayStepper(world,{startTime=0,onContact}={}){
  requireWorld(world);
  world=schoolWorld(world.stageId,world.worldVersion);
  const launchTime=schoolStartTime(startTime);
  const moving=(elapsed,h)=>{
    const start=schoolStudentPoses(world,launchTime+elapsed),end=schoolStudentPoses(world,launchTime+elapsed+h);
    return start.flatMap((pose,index)=>{
      const next=end[index],delta={x:next.position.x-pose.position.x,y:next.position.y-pose.position.y,z:next.position.z-pose.position.z};
      return pose.colliders.map(c=>({...c,delta}));
    });
  };
  const delegate=createRoomContactStepper(world,{solids:schoolSolids(world),onContact,
    ...(world.student||world.students?.length?{dynamicColliders:moving,onBlockingContact:game=>stopBlockedShot(game,'student')}:{})});
  let remainder=0,ticks=0,windSteps=0,shotId=null,elapsed=0;
  function reset(){remainder=0;ticks=0;windSteps=0;shotId=null;elapsed=0;delegate.reset();}
  function step(game,dt,afterStep=()=>{}){
    if(!active(game)||!Number.isFinite(dt)||dt<=0)return game;
    if(shotId!==game.attempts||game.time===0&&ticks){reset();shotId=game.attempts;}
    remainder+=Math.min(dt,.1);
    for(let count=0;count<25&&remainder+EPS>=TICK&&active(game);count++){
      const h=Math.min(TICK,Math.max(0,5-game.time));
      if(h>EPS&&world.wind&&game.phase==='flying'){
        for(const axis of ['x','y','z'])game.can.velocity[axis]+=world.wind[axis]*h*throwableWindScale(game);
        windSteps++;
      }
      delegate.step(game,TICK,afterStep);ticks++;elapsed=game.time;remainder=Math.max(0,remainder-TICK);
      if(!active(game))remainder=0;
    }
    return game;
  }
  const snapshot=()=>Object.freeze({...delegate.snapshot(),stageId:world.stageId,worldVersion:world.worldVersion,
    startTime:launchTime,environmentTime:launchTime+elapsed,ticks,windSteps,remainder});
  return Object.freeze({reset,step,snapshot});
}
export function predictSchoolArc(game,input,world,{startTime=0,sampleEvery=1/60,maxSeconds=5}={}){
  requireWorld(world);const predicted=createGame();setRoomWorld(predicted,world.worldVersion);cloneThrowable(game,predicted);
  predicted.bin={...game.bin,center:copy(game.bin.center)};throwCan(predicted,input);
  const stepper=createSchoolPlayStepper(world,{startTime}),points=[copy(predicted.can.position)];
  const interval=Number.isFinite(sampleEvery)?Math.max(TICK,Math.min(.1,sampleEvery)):1/60;
  const ticksPerSample=Math.max(1,Math.round(interval/TICK));
  const limit=Number.isFinite(maxSeconds)?Math.max(0,Math.min(5,maxSeconds)):5,limitTicks=Math.floor((limit+EPS)/TICK);
  for(let ticks=0;ticks<limitTicks&&active(predicted);){const advance=Math.min(ticksPerSample,limitTicks-ticks);stepper.step(predicted,advance*TICK);ticks+=advance;points.push(copy(predicted.can.position));}
  return points;
}
