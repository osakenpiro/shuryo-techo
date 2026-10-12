// Profiles extend the existing fixed-step simulation; the default can takes
// every original arithmetic path. No item changes gravitational acceleration.
import {DEFAULT_THROWABLE_ID,getThrowable} from './throwables.mjs?v=20261012-school-window-1';
const ITEMS=new WeakMap(),EPS=1e-9,MAX_RESTITUTION=.8;
const active=game=>game?.phase==='flying'||game?.phase==='settling';
const finiteVector=value=>value&&['x','y','z'].every(axis=>Number.isFinite(value[axis]));

export function getThrowableId(game){
  const saved=ITEMS.get(game);
  if(saved)return saved;
  // Validated replay samples carry identity without becoming live simulations.
  return getThrowable(game?.throwableId)?.id??DEFAULT_THROWABLE_ID;
}
export function getThrowableProfile(game){
  const id=getThrowableId(game);
  return id===DEFAULT_THROWABLE_ID?null:getThrowable(id).physics;
}
export function setThrowable(game,id=DEFAULT_THROWABLE_ID){
  if(!game||typeof game!=='object')throw new TypeError('An item needs a game');
  const item=getThrowable(id);if(!item)throw new RangeError('Unsupported throwable');
  if(active(game))return false;
  if(id===DEFAULT_THROWABLE_ID){ITEMS.delete(game);delete game.throwableId;}
  else{ITEMS.set(game,id);game.throwableId=id;}
  if(game.can)game.can.radius=item.physics.radius;
  return true;
}
export function cloneThrowable(from,to){return setThrowable(to,getThrowableId(from));}
export function throwableRadius(game,fallback=.14){return getThrowableProfile(game)?.radius??fallback;}
export function throwableInitialVelocity(game,velocity){
  const profile=getThrowableProfile(game);if(!profile)return velocity;
  return {x:velocity.x*profile.launchScale,y:velocity.y*profile.launchScale,z:velocity.z*profile.launchScale};
}
export function beginThrowableShot(game){
  const profile=getThrowableProfile(game);if(profile&&game.can)game.can.radius=profile.radius;
}
export function throwableSpin(game){
  const profile=getThrowableProfile(game);if(!profile)return 0;
  const inertia=profile.mass*profile.radius**2*profile.inertiaFactor;
  return Math.min(18,profile.spinImpulse/inertia);
}
export function throwablePose(game){
  const id=getThrowableId(game),angle=Math.max(0,Number.isFinite(game?.time)?game.time:0)*throwableSpin(game);
  return {id,pitch:angle*.65,yaw:angle*.3,roll:angle};
}
export function throwableAirAcceleration(game){
  const profile=getThrowableProfile(game),velocity=game?.can?.velocity;
  if(!profile||game?.phase!=='flying'||!finiteVector(velocity))return {x:0,y:0,z:0};
  const speed=Math.hypot(velocity.x,velocity.y,velocity.z),drag=profile.airDrag/profile.mass;
  const acceleration={x:-drag*speed*velocity.x,y:-drag*speed*velocity.y,z:-drag*speed*velocity.z};
  const horizontal=Math.hypot(velocity.x,velocity.z);
  if(profile.wobbleForce&&horizontal>EPS){
    const lateral=profile.wobbleForce/profile.mass*Math.sin(throwablePose(game).roll);
    acceleration.x+=velocity.z/horizontal*lateral;acceleration.z-=velocity.x/horizontal*lateral;
  }
  return acceleration;
}
export function applyThrowableAir(game,dt){
  if(!getThrowableProfile(game)||!Number.isFinite(dt)||dt<=0||game?.phase!=='flying')return false;
  const acceleration=throwableAirAcceleration(game);
  for(const axis of ['x','y','z'])game.can.velocity[axis]+=acceleration[axis]*dt;
  return true;
}
export function throwableWindScale(game){
  const profile=getThrowableProfile(game);return profile?Math.max(.2,Math.min(2.5,.035/profile.mass)):1;
}
export function throwableRestitution(game,surface,legacyValue){
  const profile=getThrowableProfile(game);if(!profile)return legacyValue;
  if(surface==='bin-bottom'&&Number.isFinite(profile.binBottomRestitution))return profile.binBottomRestitution;
  return Math.max(0,Math.min(MAX_RESTITUTION,legacyValue*profile.restitutionScale));
}
export function throwableFriction(game,legacyValue){
  const profile=getThrowableProfile(game);return profile?legacyValue*profile.frictionScale:legacyValue;
}
// Rotating an odd body's tangential rebound preserves its normal component
// and kinetic energy. Visible orientation and actual deflection share the same
// deterministic inertia-driven angle; no hidden random spread is introduced.
export function throwableContact(game,normal,beforeVelocity,incomingSpeed){
  const profile=getThrowableProfile(game),velocity=game?.can?.velocity;
  if(!profile?.contactTwist||incomingSpeed<=.15||!finiteVector(normal)||!finiteVector(velocity))return false;
  const angle=profile.contactTwist*Math.sin(throwablePose(game).roll),cos=Math.cos(angle),sin=Math.sin(angle);
  const dot=velocity.x*normal.x+velocity.y*normal.y+velocity.z*normal.z;
  const cross={x:normal.y*velocity.z-normal.z*velocity.y,y:normal.z*velocity.x-normal.x*velocity.z,z:normal.x*velocity.y-normal.y*velocity.x};
  const next={};
  for(const axis of ['x','y','z'])next[axis]=velocity[axis]*cos+cross[axis]*sin+normal[axis]*dot*(1-cos);
  Object.assign(velocity,next);return true;
}
