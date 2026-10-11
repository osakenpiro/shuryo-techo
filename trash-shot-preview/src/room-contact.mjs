// This is a lab-only adapter. The established simulation still owns gravity,
// the hollow bin, floor contact, the five-second result, and save compatibility.
import {createGame, setRoomWorld, throwCan, stepGame} from './physics.mjs?v=20261011-play-ui-1';
import {sweepSphereAABB} from './room-course.mjs?v=20261011-play-ui-1';
import {roomSolidColliders} from './room-solids.mjs?v=20261011-room-contact-1';

const TICK = 1 / 240, GRAVITY = 9.81, EPS = 1e-9, CORE_EPS = 1.000001e-7, SLOP = 1e-5;
const AXES = ['x', 'y', 'z'], ACTIVE = new Set(['flying', 'settling']);
const SOLID_CACHE=new WeakMap();
const copy = value => ({x:value.x, y:value.y, z:value.z});
const dot = (a,b) => AXES.reduce((sum,axis)=>sum+a[axis]*b[axis],0);
const freeze = value => {
  if(value && typeof value==='object') {Object.values(value).forEach(freeze); Object.freeze(value);}
  return value;
};
const active = game => ACTIVE.has(game?.phase);
const finitePoint = p => p && AXES.every(axis=>Number.isFinite(p[axis]));

function roomBoundaryColliders(world) {
  const r=world?.room;
  if(!r || ![r.minX,r.maxX,r.minZ,r.maxZ,r.height].every(Number.isFinite) ||
    r.minX>=r.maxX || r.minZ>=r.maxZ || r.height<=0) throw new TypeError('A finite room world is required');
  const thickness=.12, pad=thickness;
  const box=(id,min,max,surface='wall')=>({id,object:id,surface,min,max,restitution:surface==='ceiling'?.22:.35});
  return [
    box('back-wall',{x:r.minX-pad,y:0,z:r.maxZ},{x:r.maxX+pad,y:r.height+pad,z:r.maxZ+thickness}),
    box('front-wall',{x:r.minX-pad,y:0,z:r.minZ-thickness},{x:r.maxX+pad,y:r.height+pad,z:r.minZ}),
    box('left-wall',{x:r.minX-thickness,y:0,z:r.minZ-pad},{x:r.minX,y:r.height+pad,z:r.maxZ+pad}),
    box('right-wall',{x:r.maxX,y:0,z:r.minZ-pad},{x:r.maxX+thickness,y:r.height+pad,z:r.maxZ+pad}),
    box('ceiling',{x:r.minX-pad,y:r.height,z:r.minZ-pad},{x:r.maxX+pad,y:r.height+thickness,z:r.maxZ+pad},'ceiling'),
  ];
}

function solidGeometry(world,extra) {
  const cached=world && SOLID_CACHE.get(world)?.get(Boolean(extra));
  if(cached)return cached;
  const boundaries=roomBoundaryColliders(world);
  const furniture=roomSolidColliders(world,extra);
  if(!Array.isArray(furniture)) throw new TypeError('Room solid geometry must be an array');
  const result=freeze([...boundaries,...furniture].map((c,index)=>{
    if(!finitePoint(c.min)||!finitePoint(c.max)||AXES.some(axis=>c.min[axis]>c.max[axis])) {
      throw new TypeError('Room solid bounds must be finite');
    }
    return {...c,id:String(c.id??`room-solid-${index}`),object:String(c.object??c.groupId??c.id??'furniture'),
      surface:String(c.surface??'furniture'),min:copy(c.min),max:copy(c.max)};
  }));
  // Production room descriptors are deeply frozen. Cache only those immutable
  // worlds, rather than allowing a mutable caller's geometry to become stale.
  if(Object.isFrozen(world) && Object.isFrozen(world.room) && Object.isFrozen(world.sourceDesk) &&
    Object.isFrozen(world.sourceDesk.center) && (!world.desk || Object.isFrozen(world.desk) &&
      Object.isFrozen(world.desk.colliders) && world.desk.colliders.every(c=>Object.isFrozen(c) &&
        Object.isFrozen(c.min) && Object.isFrozen(c.max)))) {
    let entries=SOLID_CACHE.get(world);if(!entries){entries=new Map();SOLID_CACHE.set(world,entries);}
    entries.set(Boolean(extra),result);
  }
  return result;
}

function potentiallyReached(start,end,radius,c) {
  const padding=radius+EPS;
  // Broad phase only rejects disjoint swept bounds. Rounded-edge decisions
  // remain exclusively in the existing exact sphere / AABB solver.
  return !((start.x>c.max.x+padding && end.x>c.max.x+padding) ||
    (start.x<c.min.x-padding && end.x<c.min.x-padding) ||
    (start.y>c.max.y+padding && end.y>c.max.y+padding) ||
    (start.y<c.min.y-padding && end.y<c.min.y-padding) ||
    (start.z>c.max.z+padding && end.z>c.max.z+padding) ||
    (start.z<c.min.z-padding && end.z<c.min.z-padding));
}

function aboveFootprint(position,collider) {
  return position.x>=collider.min.x-EPS && position.x<=collider.max.x+EPS &&
    position.z>=collider.min.z-EPS && position.z<=collider.max.z+EPS;
}
function findSupport(game,colliders) {
  if(Math.abs(game.can.velocity.y)>.1) return null;
  const p=game.can.position,radius=game.can.radius;
  return colliders.find(c=>c.surface!=='wall' && c.surface!=='ceiling' && aboveFootprint(p,c) &&
    Math.abs(p.y-c.max.y-radius-SLOP)<SLOP*4)??null;
}

/**
 * Continuous sphere contacts against individual visible furniture primitives.
 * Every caller cadence is accumulated into the same 1/240 s sequence. Nothing
 * in this module changes production replays or the established physics module.
 */
export function createRoomContactStepper(world,{onContact,extra=false}={}) {
  const colliders=solidGeometry(world,extra),lastImpact=new Map();
  let remainder=0,shotId=null,substeps=0,contactCount=0,contacts=[],boundedStops=0;
  function reset() {
    remainder=0;shotId=null;substeps=0;contactCount=0;contacts=[];boundedStops=0;lastImpact.clear();
  }
  function recordContact(game,hit,collider,beforeVelocity,afterVelocity,incomingNormalSpeed) {
    const previous=lastImpact.get(collider.id)??-Infinity;
    if(incomingNormalSpeed<=.15 || game.time-previous<=.05 || contactCount>=2400) return;
    lastImpact.set(collider.id,game.time);contactCount++;
    const event=freeze({type:'room-impact',surface:collider.surface,object:collider.object,colliderId:collider.id,
      shotId:game.attempts,time:game.time,position:copy(game.can.position),normal:copy(hit.normal),
      incomingNormalSpeed,beforeVelocity:copy(beforeVelocity),afterVelocity:copy(afterVelocity)});
    contacts.push(event);
    if(typeof onContact==='function') try{onContact(event);}catch{/* Observation cannot interrupt a throw. */}
  }
  function impact(game,hit,collider) {
    const v=game.can.velocity,before=copy(v),normalSpeed=dot(v,hit.normal),incoming=Math.max(0,-normalSpeed);
    const supported=hit.normal.y>.999 && incoming<.55;
    const bounce=supported?0:Number.isFinite(collider.restitution)?Math.max(0,Math.min(.8,collider.restitution)):
      collider.object==='bed'?.18:.28;
    if(normalSpeed<0) {
      for(const axis of AXES) v[axis]-=(1+bounce)*normalSpeed*hit.normal[axis];
      const outward=dot(v,hit.normal),tangent=Object.fromEntries(AXES.map(axis=>[axis,v[axis]-outward*hit.normal[axis]]));
      const speed=Math.hypot(tangent.x,tangent.y,tangent.z),remaining=Math.max(0,speed-incoming*(1+bounce)*.22);
      for(const axis of AXES) v[axis]=outward*hit.normal[axis]+(speed>EPS?tangent[axis]*remaining/speed:0);
    }
    for(const axis of AXES) game.can.position[axis]=hit.position[axis]+hit.normal[axis]*(hit.penetration+SLOP);
    if(supported) v.y=0;
    if(game.trail.length) game.trail[game.trail.length-1]=copy(game.can.position);
    recordContact(game,hit,collider,before,v,incoming);
    return supported && aboveFootprint(game.can.position,collider)?collider:null;
  }
  function coreAdvance(game,dt,support=null) {
    if(dt<=CORE_EPS) return;
    const p=game.can.position,v=game.can.velocity;
    const supported=support && aboveFootprint({x:p.x+v.x*dt,z:p.z+v.z*dt},support);
    if(supported) v.y=GRAVITY*dt/2; // The surface supplies the normal reaction.
    stepGame(game,dt);
    if(supported && active(game) && aboveFootprint(game.can.position,support)) {
      game.can.position.y=support.max.y+game.can.radius+SLOP;v.y=0;
      const speed=Math.hypot(v.x,v.z),remaining=Math.max(0,speed-8*dt);
      if(speed>EPS){v.x*=remaining/speed;v.z*=remaining/speed;}
      if(game.trail.length) game.trail[game.trail.length-1]=copy(game.can.position);
    }
  }
  function advanceTick(game,h) {
    let remaining=h,support=findSupport(game,colliders);
    for(let count=0;count<16 && remaining>CORE_EPS && active(game);count++) {
      const start=copy(game.can.position),v=game.can.velocity;
      const supported=support && aboveFootprint({x:start.x+v.x*remaining,z:start.z+v.z*remaining},support);
      if(!supported) support=null;
      const end={x:start.x+v.x*remaining,y:supported?start.y:start.y+v.y*remaining-GRAVITY*remaining**2/2,z:start.z+v.z*remaining};
      let selected=null;
      for(const collider of colliders) {
        if(supported && collider===support) continue;
        if(!potentiallyReached(start,end,game.can.radius,collider))continue;
        const hit=sweepSphereAABB(start,end,game.can.radius,collider);if(!hit)continue;
        const atVelocity={...v,y:supported?0:v.y-GRAVITY*remaining*hit.time};
        if(dot(atVelocity,hit.normal)>=-EPS && hit.penetration<=EPS)continue;
        if(!selected || hit.time<selected.hit.time-EPS)selected={hit,collider};
      }
      if(!selected){coreAdvance(game,remaining,support);return;}
      const {hit,collider}=selected,elapsed=remaining*hit.time;
      coreAdvance(game,elapsed,support);remaining-=elapsed;
      if(!active(game))return;
      const nextSupport=impact(game,hit,collider);
      if(nextSupport)support=nextSupport;
      // A zero-time overlap is separated before the next sweep, so corners and
      // close shelf pieces cannot spend the full tick looping on one face.
    }
    if(remaining>CORE_EPS && active(game)) {
      // Conservative fallback for a pathological overlap stack: do not carry
      // unconsumed travel through a thin solid after exhausting the hit budget.
      boundedStops++;game.can.velocity={x:0,y:0,z:0};coreAdvance(game,remaining,findSupport(game,colliders));
      for(let pass=0;pass<16;pass++) {
        let overlap=null;
        for(const collider of colliders) {
          if(!potentiallyReached(game.can.position,game.can.position,game.can.radius,collider))continue;
          const hit=sweepSphereAABB(game.can.position,game.can.position,game.can.radius,collider);
          if(hit?.penetration>EPS){overlap={hit,collider};break;}
        }
        if(!overlap)break;
        impact(game,overlap.hit,overlap.collider);
      }
    }
  }
  function step(game,dt,afterStep=()=>{}) {
    if(!active(game)||!Number.isFinite(dt)||dt<=0)return game;
    if(shotId!==game.attempts || game.time===0 && substeps) {reset();shotId=game.attempts;}
    remainder+=Math.min(dt,.1);
    for(let count=0;count<25 && remainder+EPS>=TICK && active(game);count++) {
      const h=Math.min(TICK,Math.max(0,5-game.time));
      if(h<=EPS){stepGame(game,TICK);remainder=0;break;}
      advanceTick(game,h);substeps++;remainder=Math.max(0,remainder-TICK);
      if(typeof afterStep==='function') afterStep(game);
      if(!active(game))remainder=0;
    }
    return game;
  }
  return Object.freeze({reset,step,snapshot:()=>freeze({worldVersion:world.worldVersion??0,shotId,substeps,remainder,
    contactCount,boundedStops,colliderCount:colliders.length,contacts:contacts.map(c=>({...c,position:copy(c.position),normal:copy(c.normal),
      beforeVelocity:copy(c.beforeVelocity),afterVelocity:copy(c.afterVelocity)}))})});
}

/** Fresh lab simulation sampled from exactly the same fixed contact stepper. */
export function predictRoomContactArc(game,input,world,{sampleEvery=1/60,maxSeconds=5,extra=false}={}) {
  const copyGame=createGame();
  if(world?.worldVersion===2)setRoomWorld(copyGame,world.worldVersion);
  else throw new RangeError('A supported room world is required');
  copyGame.bin={...game.bin,center:copy(game.bin.center)};
  throwCan(copyGame,input);
  const stepper=createRoomContactStepper(world,{extra}),points=[copy(copyGame.can.position)];
  const interval=Number.isFinite(sampleEvery)?Math.max(TICK,Math.min(.1,sampleEvery)):1/60;
  const ticksPerSample=Math.max(1,Math.round(interval/TICK));
  const limit=Number.isFinite(maxSeconds)?Math.max(0,Math.min(5,maxSeconds)):5;
  const limitTicks=Math.floor((limit+EPS)/TICK);
  for(let ticks=0;ticks<limitTicks && active(copyGame);) {
    const advance=Math.min(ticksPerSample,limitTicks-ticks);
    stepper.step(copyGame,advance*TICK);ticks+=advance;
    points.push(copy(copyGame.can.position));
  }
  return points;
}

export const ROOM_CONTACT_TICK=TICK;
