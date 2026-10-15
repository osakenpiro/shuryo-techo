// Chapter 3 composes the proven 240 Hz sphere/solid contact stepper. Goal
// apertures are checked in the same earliest-contact sweep, not a UI distance.
import {createGame,setRoomWorld,throwCan,captureGoal,stopBlockedShot,stopSplatShot,emitShotEffect,getShotEffects,setShotEnvironmentStart} from './physics.mjs?v=20261015-factory-routes-1';
import {cloneThrowable,throwableWindScale,throwableRestitution,throwableFriction,throwableContact} from './throwable-physics.mjs?v=20261015-factory-routes-1';
import {createRoomContactStepper,ROOM_CONTACT_TICK} from './room-contact.mjs?v=20261015-factory-routes-1';
import {outdoorWorld,outdoorGoals,outdoorSolids,outdoorDynamicSolids,outdoorStartTime,shrineStartTime} from './outdoor-world.mjs?v=20261015-factory-routes-1';
const TICK=ROOM_CONTACT_TICK,EPS=1e-9,AXES=['x','y','z'];
const active=game=>game?.phase==='flying'||game?.phase==='settling';
const copy=p=>({x:p.x,y:p.y,z:p.z});
const dot=(a,b)=>AXES.reduce((sum,axis)=>sum+a[axis]*b[axis],0);
const sub=(a,b)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]-b[axis]]));
const lerp=(a,b,t)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]+(b[axis]-a[axis])*t]));
const finite=p=>p&&AXES.every(axis=>Number.isFinite(p[axis]));
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
export const OUTDOOR_PLAY_TICK=TICK;

/** A ball's entire cross-section must fit an inward plane crossing. Moving
 * apertures use relative travel and the same interpolated pose at contact.
 * The returned point is the ball centre on the actual capture plane. */
export function sweepOutdoorGoal(start,end,radius,goalStart,goalEnd=goalStart){
  if(!finite(start)||!finite(end)||!Number.isFinite(radius)||radius<=0||!goalStart||!goalEnd
      ||goalStart.id!==goalEnd.id||!finite(goalStart.center)||!finite(goalEnd.center)||!finite(goalStart.normal)||!finite(goalStart.up))return null;
  const normal=goalStart.normal,up=goalStart.up,right=cross(up,normal);
  if(Math.abs(dot(normal,normal)-1)>1e-6||Math.abs(dot(up,up)-1)>1e-6||Math.abs(dot(normal,up))>1e-6)return null;
  const from=dot(sub(start,goalStart.center),normal),to=dot(sub(end,goalEnd.center),normal);
  if(from<=EPS||to>EPS||from-to<=EPS)return null;
  const time=from/(from-to),position=lerp(start,end,time),center=lerp(goalStart.center,goalEnd.center,time),offset=sub(position,center);
  const u=dot(offset,right),v=dot(offset,up);
  const fits=goalStart.shape==='circle'?Number.isFinite(goalStart.radius)&&Math.hypot(u,v)<goalStart.radius-(goalStart.landing===true?0:radius)-EPS:
    goalStart.shape==='rectangle'&&Number.isFinite(goalStart.halfWidth)&&Number.isFinite(goalStart.halfHeight)
      &&Math.abs(u)<goalStart.halfWidth-radius-EPS&&Math.abs(v)<goalStart.halfHeight-radius-EPS;
  return fits?{time,position,goal:{...goalStart,center}}:null;
}
function requireWorld(world){const saved=outdoorWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported outdoor world is required');return saved;}
// A moving hand transfers momentum in its own frame. This callback is supplied
// only by revised shrine30; every historical contact keeps the old arithmetic.
export function shrineImpactResponse({game,collider,normal,beforeVelocity,materialBounce}){
  if(!['person','arm'].includes(collider.surface))return null;
  const surface=collider.surfaceVelocity??{x:0,y:0,z:0},relative=sub(beforeVelocity,surface),normalSpeed=dot(relative,normal),incoming=Math.max(0,-normalSpeed);
  if(incoming<=EPS)return {velocity:copy(beforeVelocity),incomingNormalSpeed:0,supported:false,handledThrowableContact:true};
  const bounce=throwableRestitution(game,collider.surface,materialBounce),out=Object.fromEntries(AXES.map(a=>[a,relative[a]-(1+bounce)*normalSpeed*normal[a]])),outward=dot(out,normal),tangent=Object.fromEntries(AXES.map(a=>[a,out[a]-outward*normal[a]])),speed=Math.hypot(...AXES.map(a=>tangent[a])),remaining=Math.max(0,speed-incoming*(1+bounce)*throwableFriction(game,.22));
  const after=Object.fromEntries(AXES.map(a=>[a,outward*normal[a]+(speed>EPS?tangent[a]*remaining/speed:0)]));
  // Twist acts on relative tangential energy, then return to the world frame.
  Object.assign(game.can.velocity,after);throwableContact(game,normal,relative,incoming);const rotated=copy(game.can.velocity);Object.assign(game.can.velocity,beforeVelocity);
  return {velocity:Object.fromEntries(AXES.map(a=>[a,rotated[a]+surface[a]])),incomingNormalSpeed:incoming,supported:false,handledThrowableContact:true};
}
export function createOutdoorPlayStepper(world,{startTime=0,onContact,onEffect}={}){
  world=requireWorld(world);const launchTime=world.worldVersion===30?shrineStartTime(startTime):outdoorStartTime(startTime);
  let currentGame=null,remainder=0,ticks=0,windSteps=0,shotId=null,elapsed=0,capture=null,effects=[];
  const deliverEffect=value=>{if(!value||effects.some(e=>e.id===value.id))return;effects.push(value);if(typeof onEffect==='function')try{onEffect(value);}catch{/* Display cannot stop physics. */}};
  const effect=(game,value)=>deliverEffect(emitShotEffect(game,{...value,environmentTime:launchTime+game.time}));
  const moving=(time,h)=>{
    const a=outdoorDynamicSolids(world,launchTime+time),b=outdoorDynamicSolids(world,launchTime+time+h);
    return a.map(solid=>{const end=b.find(q=>q.id===solid.id),delta=sub(end.min,solid.min);return {...solid,delta,...(world.worldVersion===30?{surfaceVelocity:Object.fromEntries(AXES.map(axis=>[axis,delta[axis]/h]))}:{})};});
  };
  const captureSweep=(game,start,end,h)=>{
    const a=outdoorGoals(world,launchTime+game.time),b=outdoorGoals(world,launchTime+game.time+h);let selected=null;
    for(const goal of a){const hit=sweepOutdoorGoal(start,end,game.can.radius,goal,b.find(q=>q.id===goal.id));if(hit&&(!selected||hit.time<selected.time-EPS))selected=hit;}
    return selected;
  };
  const delegate=createRoomContactStepper(world,{solids:outdoorSolids(world),dynamicColliders:moving,captureSweep,...(world.worldVersion===30?{impactResponse:shrineImpactResponse}:{}),
    onCapture(game,hit){if(captureGoal(game,hit.goal,{position:hit.position,environmentTime:launchTime+game.time}))capture={goalId:hit.goal.id,goalRole:hit.goal.role,position:copy(hit.position),normal:copy(hit.goal.normal),time:game.time};},
    onBlockingContact(game,hit,collider){stopBlockedShot(game,collider.surface==='person'?'crowd':collider.surface==='water'?'water':'blocked');},
    onTerminalContact(game,hit,collider){stopSplatShot(game,{surface:collider.surface,colliderId:collider.id,normal:hit.normal,environmentTime:launchTime+game.time});},
    onContact(contact){if(contact.colliderId==='shrine-bell-rope'&&currentGame)effect(currentGame,{id:`${contact.shotId}:bell:${Math.round(contact.time/TICK)}`,type:'bell-ring',sourceId:contact.colliderId,position:contact.position,normal:contact.normal});
      if(typeof onContact==='function')try{onContact(contact);}catch{/* Observation cannot stop physics. */}},
  });
  function reset(){remainder=0;ticks=0;windSteps=0;shotId=null;elapsed=0;capture=null;effects=[];delegate.reset();}
  function step(game,dt,afterStep=()=>{}){
    if(!active(game)||!Number.isFinite(dt)||dt<=0)return game;
    if(shotId!==game.attempts||game.time===0&&ticks){reset();shotId=game.attempts;}
    currentGame=game;
    setShotEnvironmentStart(game,launchTime);
    if(world.outdoorType==='baseball'&&ticks===0&&remainder===0)effect(game,{id:`game-${game.attempts}:bat`,type:'bat-swing',sourceId:'stadium-batter',position:world.origin});
    remainder+=Math.min(dt,.1);
    for(let count=0;count<25&&remainder+EPS>=TICK&&active(game);count++){
      const h=Math.min(TICK,Math.max(0,5-game.time));
      if(h>EPS&&world.wind&&game.phase==='flying'){for(const axis of AXES)game.can.velocity[axis]+=world.wind[axis]*h*throwableWindScale(game);windSteps++;}
      delegate.step(game,TICK,afterStep);ticks++;elapsed=game.time;remainder=Math.max(0,remainder-TICK);
      if(!active(game))for(const value of getShotEffects(game))deliverEffect(value);
      if(!active(game))remainder=0;
    }
    return game;
  }
  function snapshot(){return Object.freeze({...delegate.snapshot(),stageId:world.stageId,worldVersion:world.worldVersion,startTime:launchTime,environmentTime:launchTime+elapsed,
    ticks,windSteps,remainder,goalCapture:capture?structuredClone(capture):null,effects:structuredClone(effects)});}
  return Object.freeze({reset,step,snapshot});
}
export function predictOutdoorArc(game,input,world,{startTime=0,sampleEvery=1/60,maxSeconds=5}={}){
  world=requireWorld(world);const predicted=createGame();cloneThrowable(game,predicted);setRoomWorld(predicted,world.worldVersion);throwCan(predicted,input);
  const stepper=createOutdoorPlayStepper(world,{startTime}),points=[copy(predicted.can.position)];
  const interval=Number.isFinite(sampleEvery)?Math.max(TICK,Math.min(.1,sampleEvery)):1/60,ticksPerSample=Math.max(1,Math.round(interval/TICK));
  const limit=Number.isFinite(maxSeconds)?Math.max(0,Math.min(5,maxSeconds)):5,limitTicks=Math.floor((limit+EPS)/TICK);
  for(let ticks=0;ticks<limitTicks&&active(predicted);){const advance=Math.min(ticksPerSample,limitTicks-ticks);stepper.step(predicted,advance*TICK);ticks+=advance;points.push(copy(predicted.can.position));}
  return points;
}
