// Timed Chapter 4 mechanisms compose the existing fixed 240 Hz contact solver.
// A conveyor reaction applies only after real top contact. Relay state persists
// across retry/throws until its owner explicitly resets or replaces the session.
import {createGame,setRoomWorld,throwCan,captureGoal,stopBlockedShot,setShotEnvironmentStart} from './physics.mjs?v=20261015-conveyor-line-1';
import {cloneThrowable,getThrowableId,throwableRestitution,throwableFriction} from './throwable-physics.mjs?v=20261015-conveyor-line-1';
import {getThrowable} from './throwables.mjs?v=20261015-conveyor-line-1';
import {createRoomContactStepper,ROOM_CONTACT_TICK} from './room-contact.mjs?v=20261015-conveyor-line-1';
import {sweepOutdoorGoal} from './outdoor-play.mjs?v=20261015-conveyor-line-1';
import {sweepSphereAABB} from './room-course.mjs?v=20261015-conveyor-line-1';
import {factoryWorld,factoryGoals,factorySolids,factoryDynamicSolids,factoryStartTime} from './factory-world.mjs?v=20261015-conveyor-line-1';
const TICK=ROOM_CONTACT_TICK,EPS=1e-9,SLOP=1e-5,AXES=['x','y','z'];
const active=game=>game?.phase==='flying'||game?.phase==='settling';
const copy=p=>({x:p.x,y:p.y,z:p.z});
const sub=(a,b)=>Object.fromEntries(AXES.map(axis=>[axis,a[axis]-b[axis]]));
function requireWorld(world){const saved=factoryWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported factory world is required');return saved;}
export const FACTORY_PLAY_TICK=TICK;
export function createFactorySession(world){world=requireWorld(world);return {version:1,stageId:world.stageId,plateLatched:false,setupBall:null,setupContact:null,setupShot:null,bankContacts:[],completed:false};}
export function resetFactorySession(session,world){world=requireWorld(world);if(!session||typeof session!=='object')throw new TypeError('Factory session is required');Object.assign(session,createFactorySession(world));return session;}
// Recorded sessions carry the actual first-ball contact witness. Validation is
// structural and geometric, not a claim that client saves are cheat proof.
export function validateFactorySession(value,world){
  try{world=requireWorld(world);}catch{return false;}
  if(!value||value.version!==1||value.stageId!==world.stageId||typeof value.plateLatched!=='boolean'||typeof value.completed!=='boolean'||!Array.isArray(value.bankContacts)||new Set(value.bankContacts).size!==value.bankContacts.length)return false;
  const ids=world.factoryType==='bank'?world.mechanism.requiredColliders:[];
  if(value.bankContacts.some(id=>!ids.includes(id)))return false;
  if(!value.plateLatched)return value.setupBall===null&&value.setupContact===null&&value.setupShot===null;
  if(world.factoryType!=='relay')return false;
  const ball=value.setupBall,c=value.setupContact,item=getThrowable(ball?.itemId),plate=world.solids.find(s=>s.id===world.mechanism.plateId),finite=p=>p&&AXES.every(a=>Number.isFinite(p[a])&&Math.abs(p[a])<1000);
  return !!(ball&&ball.id==='factory-relay-first-ball'&&item&&ball.radius===item.physics.radius&&finite(ball.position)&&Number.isInteger(value.setupShot)&&value.setupShot>0&&value.setupShot<1e9&&ball.shotId===value.setupShot&&
    c?.type==='room-impact'&&c.surface==='plate'&&c.colliderId===plate.id&&c.object===plate.id&&c.shotId===value.setupShot&&Number.isFinite(c.time)&&c.time>=0&&c.time<=5&&finite(c.position)&&finite(c.normal)&&finite(c.beforeVelocity)&&finite(c.afterVelocity)&&c.normal.y>.999&&Math.abs(c.normal.x)<.001&&Math.abs(c.normal.z)<.001&&c.beforeVelocity.y<-.15&&Number.isFinite(c.incomingNormalSpeed)&&c.incomingNormalSpeed>.15&&
    ball.position.x>=plate.min.x-item.physics.radius-EPS&&ball.position.x<=plate.max.x+item.physics.radius+EPS&&ball.position.z>=plate.min.z-item.physics.radius-EPS&&ball.position.z<=plate.max.z+item.physics.radius+EPS&&Math.abs(ball.position.y-plate.max.y-item.physics.radius-SLOP)<.001&&AXES.every(a=>Math.abs(ball.position[a]-c.position[a])<.001));
}
function requireSession(session,world){if(!session)session=createFactorySession(world);if(!validateFactorySession(session,world))throw new RangeError('Factory session does not match this world');return session;}
export function createFactoryPlayStepper(world,{startTime=0,onContact,onEffect,session}={}){
  world=requireWorld(world);session=requireSession(session,world);const launchTime=factoryStartTime(startTime),belts=world.solids.filter(s=>s.surface==='belt');let belt=belts[0];
  let currentGame=null,remainder=0,ticks=0,shotId=null,elapsed=0,capture=null,effects=[],movingContacts=[],pendingMoving=null,lastMovingContact=-Infinity,carry={active:false,distance:0,contactTime:null,exitTime:null};
  const effect=(type,value={})=>{const item={id:`${world.stageId}:${currentGame?.attempts??0}:${type}:${effects.length}`,type,time:currentGame?.time??elapsed,environmentTime:launchTime+(currentGame?.time??elapsed),...value};effects.push(item);if(typeof onEffect==='function')try{onEffect(structuredClone(item));}catch{/* Display cannot interrupt physics. */}};
  const moving=(time,h)=>{const a=factoryDynamicSolids(world,launchTime+time,session),b=factoryDynamicSolids(world,launchTime+time+h,session);return a.map(solid=>{const delta=sub(b.find(q=>q.id===solid.id).min,solid.min);return {...solid,delta,...(world.worldVersion===45&&solid.kind==='piston-face'?{surfaceVelocity:Object.fromEntries(AXES.map(axis=>[axis,delta[axis]/h]))}:{})};});};
  // The shared adapter deliberately keeps its historical absolute-velocity
  // response. A closing machine bottom needs an additional relative impulse:
  // even a momentarily still ball receives momentum from the descending door.
  function closingBottomHit(game,h){
    if(world.factoryType!=='shutter')return null;
    const start=copy(game.can.position),v=game.can.velocity,end={x:start.x+v.x*h,y:start.y+v.y*h-9.81*h*h/2,z:start.z+v.z*h};
    for(const collider of moving(game.time,h)){
      if(collider.delta.y>=-EPS)continue;
      const hit=sweepSphereAABB(start,sub(end,collider.delta),game.can.radius,collider);
      if(!hit||hit.normal.y>-.999||hit.penetration>EPS)continue;
      const before={...v,y:v.y-9.81*h*hit.time},surfaceVelocity=Object.fromEntries(AXES.map(a=>[a,collider.delta[a]/h])),relativeIncoming=before.y-surfaceVelocity.y;
      if(relativeIncoming<=.15)continue;
      return {collider,hit,before,surfaceVelocity,incoming:relativeIncoming,time:game.time+h*hit.time,position:Object.fromEntries(AXES.map(a=>[a,hit.position[a]+collider.delta[a]*hit.time+hit.normal[a]*SLOP]))};
    }
    return null;
  }
  function correctClosingBottom(game,pending){
    if(!pending||pending.corrected||!active(game))return null;
    const after={...game.can.velocity,y:pending.surfaceVelocity.y-throwableRestitution(game,'machine',pending.collider.restitution)*(pending.before.y-pending.surfaceVelocity.y)};
    game.can.velocity.y=after.y-9.81*Math.max(0,game.time-pending.time);
    pending.corrected=true;
    if(pending.time-lastMovingContact<=.05)return null;
    lastMovingContact=pending.time;
    const contact={type:'room-impact',surface:'machine',object:pending.collider.object,colliderId:pending.collider.id,shotId:game.attempts,time:pending.time,position:copy(pending.position),normal:copy(pending.hit.normal),incomingNormalSpeed:pending.incoming,beforeVelocity:copy(pending.before),afterVelocity:after};
    movingContacts.push(contact);effect('factory-moving-impulse',{sourceId:pending.collider.id,position:copy(pending.position),surfaceVelocity:copy(pending.surfaceVelocity),incomingVelocity:copy(pending.before),outgoingVelocity:copy(after),contactTime:pending.time});
    return contact;
  }
  const captureSweep=(game,start,end,h)=>{
    // These are real wall witnesses, never floor bounce counters or aim values.
    if(world.factoryType==='bank'&&world.mechanism.routeRequired!==false&&!world.mechanism.requiredColliders.every(id=>session.bankContacts.includes(id)))return null;
    if(world.factoryType==='relay'&&world.mechanism.routeRequired!==false&&!session.plateLatched)return null;
    const a=factoryGoals(world,launchTime+game.time,session),b=factoryGoals(world,launchTime+game.time+h,session);let selected=null;
    for(const goal of a){const hit=sweepOutdoorGoal(start,end,game.can.radius,goal,b.find(q=>q.id===goal.id));if(hit&&(!selected||hit.time<selected.time-EPS))selected=hit;}
    return selected;
  };
  function beltSupport(game){if(!belt||!carry.active)return false;const p=game.can.position,r=game.can.radius;return p.x>=belt.min.x-EPS&&p.x<=belt.max.x+EPS&&p.z>=belt.min.z-EPS&&p.z<=belt.max.z+EPS&&Math.abs(p.y-belt.max.y-r-SLOP)<.025&&Math.abs(game.can.velocity.y)<.15;}
  // Polished machine guide faces retain the existing restitution, with their
  // lower tangential friction declared by the physical world descriptor.
  // Only new route-world machine reflectors use this reused response hook.
  const reflectorImpact=({game,collider,normal,beforeVelocity,materialBounce,supported})=>{
    if(world.worldVersion===45&&collider.kind==='piston-face'){
      const surface=collider.surfaceVelocity,relative=Object.fromEntries(AXES.map(a=>[a,beforeVelocity[a]-surface[a]])),normalSpeed=AXES.reduce((sum,a)=>sum+relative[a]*normal[a],0);
      if(normalSpeed>=0)return null;
      const incoming=-normalSpeed,bounce=throwableRestitution(game,collider.surface,materialBounce),outward=incoming*bounce;
      const tangent=Object.fromEntries(AXES.map(a=>[a,relative[a]-normalSpeed*normal[a]])),speed=Math.hypot(...AXES.map(a=>tangent[a])),remaining=Math.max(0,speed-incoming*(1+bounce)*throwableFriction(game,collider.friction));
      return {velocity:Object.fromEntries(AXES.map(a=>[a,surface[a]+outward*normal[a]+(speed>EPS?tangent[a]*remaining/speed:0)])),incomingNormalSpeed:incoming,supported:false};
    }
    if(world.mechanism.routeRequired!==false||collider.kind!=='machine-reflector')return null;
    const normalSpeed=AXES.reduce((sum,a)=>sum+beforeVelocity[a]*normal[a],0),incoming=Math.max(0,-normalSpeed);
    if(normalSpeed>=0)return null;
    const bounce=supported?0:throwableRestitution(game,collider.surface,materialBounce),outward=-normalSpeed*bounce;
    const tangent=Object.fromEntries(AXES.map(a=>[a,beforeVelocity[a]-normalSpeed*normal[a]])),speed=Math.hypot(...AXES.map(a=>tangent[a]));
    const remaining=Math.max(0,speed-incoming*(1+bounce)*throwableFriction(game,collider.friction));
    return {velocity:Object.fromEntries(AXES.map(a=>[a,outward*normal[a]+(speed>EPS?tangent[a]*remaining/speed:0)])),incomingNormalSpeed:incoming,supported};
  };
  const delegate=createRoomContactStepper(world,{solids:factorySolids(world),dynamicColliders:moving,captureSweep,impactResponse:reflectorImpact,
    onCapture(game,hit){if(captureGoal(game,hit.goal,{position:hit.position,environmentTime:launchTime+game.time})){capture={goalId:hit.goal.id,goalRole:hit.goal.role,position:copy(hit.position),normal:copy(hit.goal.normal),time:game.time};session.completed=true;}},
    onBlockingContact(game,hit,collider){
      if(world.worldVersion!==46||collider.kind!=='stamping-press')return;
      carry.active=false;effect('factory-press',{sourceId:collider.id,position:copy(game.can.position),normal:copy(hit.normal)});stopBlockedShot(game,'factory-press');
    },
    onContact(contact){
      if(pendingMoving&&contact.colliderId===pendingMoving.collider.id&&contact.normal.y<-.999&&Math.abs(contact.time-pendingMoving.time)<1e-5){const corrected=correctClosingBottom(currentGame,pendingMoving);if(corrected)contact=corrected;}
      if(world.factoryType==='bank'&&world.mechanism.requiredColliders.includes(contact.colliderId)&&!session.bankContacts.includes(contact.colliderId)){
        session.bankContacts.push(contact.colliderId);effect('factory-bank-contact',{sourceId:contact.colliderId,position:copy(contact.position),normal:copy(contact.normal)});
      }
      if(world.factoryType==='conveyor'&&belts.some(b=>b.id===contact.colliderId)&&contact.normal.y>.999&&currentGame&&active(currentGame)){
        if(world.worldVersion===46)belt=belts.find(b=>b.id===contact.colliderId);
        carry.active=true;carry.contactTime??=contact.time;currentGame.can.position.y=belt.max.y+currentGame.can.radius+SLOP;
        currentGame.can.velocity={...belt.surfaceVelocity};effect('factory-belt-contact',{sourceId:belt.id,position:copy(currentGame.can.position),surfaceVelocity:copy(belt.surfaceVelocity),incomingVelocity:copy(contact.beforeVelocity)});
      }
      if(world.factoryType==='relay'&&!session.plateLatched&&contact.colliderId===world.mechanism.plateId&&contact.normal.y>.999&&contact.beforeVelocity.y<-.15&&currentGame){
        session.plateLatched=true;session.setupShot=currentGame.attempts;session.setupContact=structuredClone(contact);
        session.setupBall={id:'factory-relay-first-ball',itemId:getThrowableId(currentGame),radius:currentGame.can.radius,position:copy(currentGame.can.position),shotId:currentGame.attempts};
        effect('factory-relay-setup',{sourceId:contact.colliderId,position:copy(currentGame.can.position),gateId:world.mechanism.id,setupShot:session.setupShot});
        stopBlockedShot(currentGame,'factory-setup');
      }
      if(typeof onContact==='function')try{onContact(contact);}catch{/* Observation cannot interrupt physics. */}
    },
  });
  function reset(){remainder=0;ticks=0;shotId=null;elapsed=0;capture=null;effects=[];movingContacts=[];pendingMoving=null;lastMovingContact=-Infinity;carry={active:false,distance:0,contactTime:null,exitTime:null};session.bankContacts=[];session.completed=false;delegate.reset();}
  function step(game,dt,afterStep=()=>{}){
    if(!active(game)||!Number.isFinite(dt)||dt<=0)return game;
    if(shotId!==game.attempts||game.time===0&&ticks){reset();shotId=game.attempts;}
    currentGame=game;setShotEnvironmentStart(game,launchTime);remainder+=Math.min(dt,.1);
    for(let count=0;count<25&&remainder+EPS>=TICK&&active(game);count++){
      const wasCarried=beltSupport(game),beforeZ=game.can.position.z,beforeX=game.can.position.x;
      if(wasCarried){game.can.position.y=belt.max.y+game.can.radius+SLOP;game.can.velocity={...belt.surfaceVelocity};}
      pendingMoving=closingBottomHit(game,TICK);
      // Record the corrected supported pose before the caller takes its frame.
      delegate.step(game,TICK,g=>{
        if(pendingMoving&&!pendingMoving.corrected&&active(g)&&g.time+EPS>=pendingMoving.time&&g.can.position.y<=pendingMoving.position.y+.002&&g.can.position.y>pendingMoving.position.y-.03&&Math.abs(g.can.position.x-pendingMoving.position.x)<.08&&Math.abs(g.can.position.z-pendingMoving.position.z)<.08){
          const contact=correctClosingBottom(g,pendingMoving);if(contact&&typeof onContact==='function')try{onContact(contact);}catch{/* Observation cannot interrupt physics. */}
        }
        if(carry.active&&active(g)){
          if(beltSupport(g)){g.can.position.y=belt.max.y+g.can.radius+SLOP;g.can.velocity={...belt.surfaceVelocity};}
          else if(wasCarried){carry.active=false;carry.exitTime=g.time;effect('factory-belt-exit',{sourceId:belt.id,position:copy(g.can.position),surfaceVelocity:copy(belt.surfaceVelocity)});}
        }
        if(wasCarried)carry.distance+=world.worldVersion===46?Math.hypot(g.can.position.x-beforeX,g.can.position.z-beforeZ):Math.max(0,g.can.position.z-beforeZ);
        if(typeof afterStep==='function')afterStep(g);
      });
      ticks++;elapsed=game.time;remainder=Math.max(0,remainder-TICK);if(!active(game))remainder=0;
    }
    return game;
  }
  const snapshot=()=>{const base=delegate.snapshot(),contacts=[...base.contacts.filter(c=>!movingContacts.some(m=>m.colliderId===c.colliderId&&Math.abs(m.time-c.time)<1e-5)),...movingContacts].sort((a,b)=>a.time-b.time);return Object.freeze({...base,contacts:structuredClone(contacts),contactCount:contacts.length,stageId:world.stageId,worldVersion:world.worldVersion,startTime:launchTime,environmentTime:launchTime+elapsed,ticks,remainder,
    goalCapture:capture?structuredClone(capture):null,effects:structuredClone(effects),mechanismState:{session:structuredClone(session),carry:structuredClone(carry)}});
  };
  return Object.freeze({reset,step,snapshot,session});
}
export function predictFactoryArc(game,input,world,{startTime=0,session,sampleEvery=1/60,maxSeconds=5}={}){
  world=requireWorld(world);const predicted=createGame();cloneThrowable(game,predicted);setRoomWorld(predicted,world.worldVersion);throwCan(predicted,input);
  const predictionSession=session?structuredClone(requireSession(session,world)):createFactorySession(world),stepper=createFactoryPlayStepper(world,{startTime,session:predictionSession}),points=[copy(predicted.can.position)];
  const interval=Number.isFinite(sampleEvery)?Math.max(TICK,Math.min(.1,sampleEvery)):1/60,ticksPerSample=Math.max(1,Math.round(interval/TICK)),limit=Number.isFinite(maxSeconds)?Math.max(0,Math.min(5,maxSeconds)):5,limitTicks=Math.floor((limit+EPS)/TICK);
  for(let ticks=0;ticks<limitTicks&&active(predicted);){const advance=Math.min(ticksPerSample,limitTicks-ticks);stepper.step(predicted,advance*TICK);ticks+=advance;points.push(copy(predicted.can.position));}
  return points;
}
