// Deterministic Chapter 5 input, moving launch frames and target captures reuse
// the existing 240 Hz contact solver. Predictions call this exact same adapter.
import {createGame,setRoomWorld,throwCan,captureGoal,stopBlockedShot,emitShotEffect,getShotEffects,setShotEnvironmentStart} from './physics.mjs?v=20261014-night-cards-1';
import {cloneThrowable,throwableWindScale,throwablePose,fixThrowablePose} from './throwable-physics.mjs?v=20261014-night-cards-1';
import {createRoomContactStepper,ROOM_CONTACT_TICK} from './room-contact.mjs?v=20261014-night-cards-1';
import {sweepOutdoorGoal} from './outdoor-play.mjs?v=20261014-night-cards-1';
import {eccentricWorld,eccentricGoals,eccentricSolids,eccentricDynamicSolids,eccentricLaunchFrame,eccentricStartTime} from './eccentric-world.mjs?v=20261014-night-cards-1';
const TICK=ROOM_CONTACT_TICK,EPS=1e-9,AXES=['x','y','z'],IMPACT_POSES=new WeakMap();
const active=game=>game?.phase==='flying'||game?.phase==='settling';
const copy=p=>({x:p.x,y:p.y,z:p.z});
const sub=(a,b)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]-b[axis]]));
export const ECCENTRIC_PLAY_TICK=TICK;
function requireWorld(world){const saved=eccentricWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported eccentric world is required');return saved;}
/** Supply the launch frame before the core shot-start observer records frame0. */
export function throwEccentric(game,input,world,{startTime=0}={}){
  world=requireWorld(world);const time=eccentricStartTime(startTime),frame=eccentricLaunchFrame(world,time);
  const thrown=throwCan(game,input,{launchFrame:frame});
  if(thrown){IMPACT_POSES.delete(game);setShotEnvironmentStart(game,time);}return thrown;
}
export function getEccentricImpactPose(game){const pose=IMPACT_POSES.get(game);return pose?structuredClone(pose):null;}
export function createEccentricPlayStepper(world,{startTime=0,onContact,onEffect}={}){
  world=requireWorld(world);const launchTime=eccentricStartTime(startTime);
  let remainder=0,ticks=0,windSteps=0,shotId=null,elapsed=0,capture=null,impactPose=null,effects=[];
  const deliverEffect=value=>{if(!value||effects.some(e=>e.id===value.id))return;effects.push(value);if(typeof onEffect==='function')try{onEffect(value);}catch{/* Presentation cannot alter a throw. */}};
  const effect=(game,value)=>deliverEffect(emitShotEffect(game,{...value,environmentTime:launchTime+game.time}));
  const moving=(time,h)=>{
    const a=eccentricDynamicSolids(world,launchTime+time),b=eccentricDynamicSolids(world,launchTime+time+h);
    return a.map(solid=>({...solid,delta:sub(b.find(q=>q.id===solid.id).min,solid.min)}));
  };
  const captureSweep=(game,start,end,h)=>{
    const a=eccentricGoals(world,launchTime+game.time),b=eccentricGoals(world,launchTime+game.time+h);let selected=null;
    for(const goal of a){const hit=sweepOutdoorGoal(start,end,game.can.radius,goal,b.find(q=>q.id===goal.id));if(hit&&(!selected||hit.time<selected.time-EPS))selected=hit;}
    return selected;
  };
  const delegate=createRoomContactStepper(world,{solids:eccentricSolids(world),dynamicColliders:moving,captureSweep,
    onCapture(game,hit){
      if(hit.goal.mode==='hit'){
        const incomingVelocity=copy(game.can.velocity),pose=throwablePose(game);
        impactPose={mode:'hit',position:copy(hit.position),normal:copy(hit.goal.normal),incomingVelocity,orientation:pose};
        IMPACT_POSES.set(game,structuredClone(impactPose));fixThrowablePose(game,pose);
        const type=world.eccentricType==='boar'?'boar-hit':world.eccentricType==='card'?'card-stuck':'door-hit';
        effect(game,{id:`${game.attempts}:${type}`,type,sourceId:hit.goal.id,position:hit.position,normal:hit.goal.normal});
      }
      if(captureGoal(game,hit.goal,{position:hit.position,environmentTime:launchTime+game.time}))capture={goalId:hit.goal.id,goalRole:hit.goal.role,position:copy(hit.position),normal:copy(hit.goal.normal),time:game.time};
    },
    onBlockingContact(game,hit,collider){stopBlockedShot(game,collider.surface==='person'?'person':'blocked');},
    onContact(contact){if(typeof onContact==='function')try{onContact(contact);}catch{/* Observation cannot stop physics. */}},
  });
  function reset(){remainder=0;ticks=0;windSteps=0;shotId=null;elapsed=0;capture=null;impactPose=null;effects=[];delegate.reset();}
  function step(game,dt,afterStep=()=>{}){
    if(!active(game)||!Number.isFinite(dt)||dt<=0)return game;
    if(shotId!==game.attempts||game.time===0&&ticks){reset();shotId=game.attempts;}
    setShotEnvironmentStart(game,launchTime);
    if(world.eccentricType==='cannon'&&ticks===0&&remainder===0)effect(game,{id:`${game.attempts}:cannon-fire`,type:'cannon-fire',sourceId:'cannon',position:game.can.position});
    remainder+=Math.min(dt,.1);
    for(let count=0;count<25&&remainder+EPS>=TICK&&active(game);count++){
      const h=Math.min(TICK,Math.max(0,5-game.time));
      if(h>EPS&&world.wind&&game.phase==='flying'){for(const axis of AXES)game.can.velocity[axis]+=world.wind[axis]*h*throwableWindScale(game);windSteps++;}
      delegate.step(game,TICK,afterStep);ticks++;elapsed=game.time;remainder=Math.max(0,remainder-TICK);
      if(!active(game))for(const value of getShotEffects(game))deliverEffect(value);
      if(!active(game))remainder=0;
    }return game;
  }
  function snapshot(){return Object.freeze({...delegate.snapshot(),stageId:world.stageId,worldVersion:world.worldVersion,startTime:launchTime,environmentTime:launchTime+elapsed,
    ticks,windSteps,remainder,goalCapture:capture?structuredClone(capture):null,impactPose:impactPose?structuredClone(impactPose):null,effects:structuredClone(effects)});}
  return Object.freeze({reset,step,snapshot});
}
export function predictEccentricArc(game,input,world,{startTime=0,sampleEvery=1/60,maxSeconds=5}={}){
  world=requireWorld(world);const predicted=createGame();cloneThrowable(game,predicted);setRoomWorld(predicted,world.worldVersion);throwEccentric(predicted,input,world,{startTime});
  const stepper=createEccentricPlayStepper(world,{startTime}),points=[copy(predicted.can.position)];
  const interval=Number.isFinite(sampleEvery)?Math.max(TICK,Math.min(.1,sampleEvery)):1/60,ticksPerSample=Math.max(1,Math.round(interval/TICK));
  const limit=Number.isFinite(maxSeconds)?Math.max(0,Math.min(5,maxSeconds)):5,limitTicks=Math.floor((limit+EPS)/TICK);
  for(let ticks=0;ticks<limitTicks&&active(predicted);){const advance=Math.min(ticksPerSample,limitTicks-ticks);stepper.step(predicted,advance*TICK);ticks+=advance;points.push(copy(predicted.can.position));}
  return points;
}
