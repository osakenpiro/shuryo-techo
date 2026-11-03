// The existing 240 Hz contact adapter owns motion; no UI distance clears.
import {createGame,setRoomWorld,throwCan,captureGoal,setShotEnvironmentStart,shotTimeLimit} from './physics.mjs?v=20261015-boar-distance-1';
import {createRoomContactStepper,ROOM_CONTACT_TICK} from './room-contact.mjs?v=20261015-boar-distance-1';
import {sweepOutdoorGoal} from './outdoor-play.mjs?v=20261015-boar-distance-1';
import {cloneThrowable,throwableWindScale} from './throwable-physics.mjs?v=20261015-boar-distance-1';
import {releaseChapterWorld,releaseChapterStartTime,releaseChapterGoals,releaseChapterDynamicSolids,releaseChapterWind} from './release-chapters-world.mjs?v=20261018-chapters67-1';
const TICK=ROOM_CONTACT_TICK,EPS=1e-9,AXES=['x','y','z'],active=g=>g?.phase==='flying'||g?.phase==='settling',copy=p=>({x:p.x,y:p.y,z:p.z});
export function createReleaseChapterPlayStepper(world,{startTime=0,onContact}={}){
 world=releaseChapterWorld(world?.stageId,world?.worldVersion);if(!world)throw new RangeError('A fixed release chapter world is required');
 const launchTime=releaseChapterStartTime(startTime);let remainder=0,ticks=0,shotId=null,elapsed=0,capture=null,windSteps=0;
 const dynamic=(time,h)=>{const a=releaseChapterDynamicSolids(world,launchTime+time),b=releaseChapterDynamicSolids(world,launchTime+time+h);return a.map(c=>({...c,delta:Object.fromEntries(AXES.map(axis=>[axis,b.find(q=>q.id===c.id).min[axis]-c.min[axis]]))}));};
 const captureSweep=(game,start,end,h)=>{
  if(world.mode==='golf'){
   const goal=world.goals[0],r=goal.radius-game.can.radius,dx=end.x-start.x,dz=end.z-start.z;
   const a=dx*dx+dz*dz,b=2*((start.x-goal.center.x)*dx+(start.z-goal.center.z)*dz),c=(start.x-goal.center.x)**2+(start.z-goal.center.z)**2-r*r;
   const disc=b*b-4*a*c,t=c<=0?0:a>0&&disc>=0?(-b-Math.sqrt(disc))/(2*a):-1;
   if(t>=0&&t<=1&&start.y<=game.can.radius+.025&&Math.hypot(game.can.velocity.x,game.can.velocity.z)<=world.cupSpeed)return {time:t,goal,position:{x:start.x+dx*t,y:goal.center.y,z:start.z+dz*t}};
   return null;
  }
  const a=releaseChapterGoals(world,launchTime+game.time),b=releaseChapterGoals(world,launchTime+game.time+h);let first=null;for(const goal of a){const hit=sweepOutdoorGoal(start,end,game.can.radius,goal,b.find(g=>g.id===goal.id));if(hit&&(!first||hit.time<first.time))first=hit;}return first;};
 const delegate=createRoomContactStepper(world,{solids:world.solids,dynamicColliders:dynamic,captureSweep,onContact,
  onCapture(game,hit){if(captureGoal(game,hit.goal,{position:hit.position,environmentTime:launchTime+game.time}))capture={goalId:hit.goal.id,goalRole:hit.goal.role,position:copy(hit.position),normal:copy(hit.goal.normal),time:game.time};}});
 function reset(){remainder=0;ticks=0;shotId=null;elapsed=0;capture=null;windSteps=0;delegate.reset();}
 function step(game,dt,afterStep=()=>{}){
  if(!active(game)||!Number.isFinite(dt)||dt<=0)return game;
  if(shotId!==game.attempts||game.time===0&&ticks){reset();shotId=game.attempts;}
  setShotEnvironmentStart(game,launchTime);remainder+=Math.min(dt,.1);
  for(let count=0;count<25&&remainder+EPS>=TICK&&active(game);count++){
   if(game.phase==='flying'&&AXES.some(a=>world.wind[a])){const wind=releaseChapterWind(world,launchTime+game.time,game.can.position);for(const axis of AXES)game.can.velocity[axis]+=wind[axis]*TICK*throwableWindScale(game);windSteps++;}
   delegate.step(game,TICK,afterStep);ticks++;elapsed=game.time;remainder=Math.max(0,remainder-TICK);if(!active(game))remainder=0;
  }return game;
 }
 return Object.freeze({reset,step,snapshot:()=>Object.freeze({...delegate.snapshot(),stageId:world.stageId,worldVersion:world.worldVersion,startTime:launchTime,environmentTime:launchTime+elapsed,ticks,windSteps,remainder,goalCapture:capture?structuredClone(capture):null,effects:[]})});
}
export function predictReleaseChapterArc(game,input,world,{startTime=0,sampleEvery=1/60,maxSeconds=5}={}){
 const predicted=createGame();setRoomWorld(predicted,world.worldVersion);cloneThrowable(game,predicted);throwCan(predicted,input);
 const stepper=createReleaseChapterPlayStepper(world,{startTime}),points=[copy(predicted.can.position)],interval=Number.isFinite(sampleEvery)?Math.max(TICK,Math.min(.1,sampleEvery)):1/60,perSample=Math.max(1,Math.round(interval/TICK)),limit=Math.floor(Math.min(shotTimeLimit(world.worldVersion),Math.max(0,maxSeconds))/TICK);
 for(let ticks=0;ticks<limit&&active(predicted);){const advance=Math.min(perSample,limit-ticks);stepper.step(predicted,advance*TICK);ticks+=advance;points.push(copy(predicted.can.position));}return points;
}
