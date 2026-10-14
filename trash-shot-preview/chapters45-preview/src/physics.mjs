// World-space simulation. One metre is one unit; rendering never affects physics.
import {throwableRadius,throwableInitialVelocity,beginThrowableShot,applyThrowableAir,
  throwableRestitution,throwableFriction,throwableContact,getThrowableProfile,cloneThrowable,throwableTerminalContact,setThrowableWorld} from './throwable-physics.mjs?v=20261014-quick-retry-1';
import {SCHOOL_PHYSICS_WORLDS} from './school-world.mjs?v=20261014-quick-retry-1';
import {OUTDOOR_PHYSICS_WORLDS,OUTDOOR_WORLDS,outdoorWorldByVersion} from './outdoor-world.mjs?v=20261014-quick-retry-1';
import {FACTORY_PHYSICS_WORLDS,factoryWorldByVersion} from './factory-world.mjs?v=20261014-quick-retry-1';
import {ECCENTRIC_PHYSICS_WORLDS,ECCENTRIC_WORLDS,eccentricWorldByVersion} from './eccentric-world.mjs?v=20261014-quick-retry-1';
const extendedPhysicsWorld=version=>OUTDOOR_PHYSICS_WORLDS[version]??FACTORY_PHYSICS_WORLDS[version]??ECCENTRIC_PHYSICS_WORLDS[version];
const GRAVITY = 9.81;
const SUBSTEP = 1 / 240;
const MAX_FRAME = 0.1;
const MAX_SHOT_TIME = 5;
export function shotTimeLimit(gameOrVersion){const version=typeof gameOrVersion==='number'?gameOrVersion:ROOM_SETUPS.get(gameOrVersion);return version===38?12:MAX_SHOT_TIME;}
const CAN_RADIUS = 0.14;
const BIN_RADIUS = 0.7;
const EPSILON = 1e-7;
const ACTIVE = new Set(['flying', 'settling']);
// Observers stay outside the simulation state and never receive live references.
const OBSERVERS = new WeakMap();
// Only explicit room presets alter the launch origin. Ordinary setup, free play,
// and the independent pixel introduction retain the original metre-space setup.
const ROOM_SETUPS = new WeakMap();
// A below-rim pose is entry evidence only after this shot physically approached
// the opening from above. Side contact and old-shot state cannot manufacture it.
const BIN_TOP_APPROACH = new WeakSet();
const GOAL_CAPTURES=new WeakMap(),SHOT_EFFECTS=new WeakMap(),SHOT_ENVIRONMENT_START=new WeakMap();

function freezeTree(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') freezeTree(child);
  }
  return Object.freeze(value);
}

export const ROOM_PHYSICS_WORLDS = freezeTree({
  1: { worldVersion: 1, origin: { x: 0, y: 1.05, z: 0 },
    bin: { center: { x: 0, y: .65, z: 6 }, radius: .7, height: 1.3 } },
  2: { worldVersion: 2, origin: { x: 0, y: .94, z: 0 },
    bin: { center: { x: 0, y: .35, z: 4 }, radius: .35, height: .7 } },
  3: { worldVersion: 3, origin: { x: 0, y: .94, z: 0 },
    bin: { center: { x: 2.5, y: .35, z: 4.8 }, radius: .35, height: .7 } },
  4: { worldVersion: 4, origin: { x: 0, y: .94, z: 0 },
    bin: { center: { x: .5, y: .35, z: 4.4 }, radius: .35, height: .7 } },
  5: { worldVersion: 5, origin: { x: 0, y: .94, z: 0 },
    bin: { center: { x: 0, y: .35, z: 4 }, radius: .35, height: .7 } },
});

function notify(game, type, detail = {}) {
  const callbacks = OBSERVERS.get(game);
  if (!callbacks?.size) return;
  const event = freezeTree({
    type, time: game.time, shotId: game.attempts, phase: game.phase,
    can: {
      position: { ...game.can.position }, velocity: { ...game.can.velocity },
      radius: game.can.radius,
    },
    bin: { center: { ...game.bin.center }, radius: game.bin.radius, height: game.bin.height },
    attempts: game.attempts, successes: game.successes,
    ...(GOAL_CAPTURES.has(game)?{goalCapture:GOAL_CAPTURES.get(game)}:{}),
    ...detail,
  });
  for (const subscription of [...callbacks]) {
    try { subscription.callback(event); } catch { /* Observation cannot abort a simulation step. */ }
  }
}

export function observeGame(game, callback) {
  if (!game || typeof game !== 'object' || typeof callback !== 'function') {
    throw new TypeError('observeGame requires a game and callback');
  }
  let callbacks = OBSERVERS.get(game);
  if (!callbacks) {
    callbacks = new Set();
    OBSERVERS.set(game, callbacks);
  }
  const subscription = { callback };
  callbacks.add(subscription);
  return () => {
    callbacks.delete(subscription);
    if (callbacks.size === 0 && OBSERVERS.get(game) === callbacks) OBSERVERS.delete(game);
  };
}

function options(value) {
  return value && typeof value === 'object' ? value : {};
}

function bounded(value, fallback, minimum, maximum) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : fallback;
}

function launchParameters(input,game) {
  const value = options(input);
  const limits=extendedPhysicsWorld(ROOM_SETUPS.get(game))?.launchLimits;
  return {
    power: bounded(value.power, 7.8, limits?.minPower??0.5, 14),
    elevation: bounded(value.elevation, 48, limits?.minElevation??5, 85),
    yaw: bounded(value.yaw, 0, -60, 60),
  };
}

function initialVelocity(input,game) {
  const { power, elevation, yaw } = launchParameters(input,game);
  const angle = elevation * Math.PI / 180;
  const heading = yaw * Math.PI / 180;
  const horizontal = power * Math.cos(angle);
  return {
    x: horizontal * Math.sin(heading),
    y: power * Math.sin(angle),
    z: horizontal * Math.cos(heading),
  };
}

function freshCan(game) {
  const version=ROOM_SETUPS.get(game);
  const origin = (ROOM_PHYSICS_WORLDS[version]??SCHOOL_PHYSICS_WORLDS[version]??extendedPhysicsWorld(version))?.origin ?? { x: 0, y: 1.05, z: 0 };
  const radius=throwableRadius(game,CAN_RADIUS);
  return {
    position: getThrowableProfile(game)?{...origin,y:origin.y+radius-CAN_RADIUS}:{...origin},
    velocity: { x: 0, y: 0, z: 0 },
    radius,
  };
}

function clearShot(game, reason) {
  BIN_TOP_APPROACH.delete(game);
  GOAL_CAPTURES.delete(game);SHOT_EFFECTS.delete(game);SHOT_ENVIRONMENT_START.delete(game);
  game.phase = 'ready';
  game.time = 0;
  game.can = freshCan(game);
  game.lastEvent = null;
  game.events = [];
  game.trail = [{ ...game.can.position }];
  notify(game, 'shot-reset', { reason });
  return game;
}

function record(game, type) {
  game.lastEvent = type;
  // Contact can persist over consecutive substeps. Record the contact once.
  const previous = game.events.at(-1);
  if (previous?.type === type && game.time - previous.time < 0.05) return;
  game.events.push({ type, time: game.time, position: { ...game.can.position } });
  if (game.events.length > 48) game.events.shift();
}

function radialDistance(position, bin) {
  return Math.hypot(position.x - bin.center.x, position.z - bin.center.z);
}

export function createGame(input = {}) {
  const game = {
    phase: 'ready',
    time: 0,
    can: freshCan(),
    bin: { center: { x: 0, y: 0.65, z: 6 }, radius: BIN_RADIUS, height: 1.3 },
    attempts: 0,
    successes: 0,
    lastEvent: null,
    events: [],
    trail: [],
  };
  return setSetup(game, input);
}

export function setSetup(game, input = {}) {
  const value = options(input);
  const distance = bounded(value.distance, game.bin.center.z, 3, 10);
  const height = bounded(value.height, game.bin.height, 0.5, 2.5);
  game.bin = { center: { x: 0, y: height / 2, z: distance }, radius: BIN_RADIUS, height };
  ROOM_SETUPS.delete(game);
  setThrowableWorld(game,null);
  return clearShot(game, 'setup');
}

export function setRoomWorld(game, worldVersion = 2) {
  if (!Number.isInteger(worldVersion)||worldVersion<1||worldVersion>39) throw new RangeError('Room world version must be an integer from 1 through 39');
  const world = ROOM_PHYSICS_WORLDS[worldVersion]??SCHOOL_PHYSICS_WORLDS[worldVersion]??extendedPhysicsWorld(worldVersion);
  ROOM_SETUPS.set(game, worldVersion);
  setThrowableWorld(game,worldVersion);
  game.bin = { ...world.bin, center: { ...world.bin.center } };
  return clearShot(game, 'room-setup');
}
export function getRoomWorldVersion(game) { return ROOM_SETUPS.get(game) ?? 0; }

export function resetShot(game, {cancelActive=false} = {}) {
  if (ACTIVE.has(game.phase)&&!cancelActive) return false;
  clearShot(game, cancelActive?'retry':'reset');
  return true;
}

export function throwCan(game, input = {}, {launchFrame} = {}) {
  if (ACTIVE.has(game.phase)) return false;
  clearShot(game, 'next-shot');
  game.can.velocity = throwableInitialVelocity(game,initialVelocity(input,game));
  const scale=extendedPhysicsWorld(ROOM_SETUPS.get(game))?.launchScale;
  if(scale)for(const axis of ['x','y','z'])game.can.velocity[axis]*=scale;
  if(ROOM_SETUPS.get(game)>=19&&launchFrame){
    if(![launchFrame.origin,launchFrame.velocity].every(point=>point&&['x','y','z'].every(axis=>Number.isFinite(point[axis]))))throw new TypeError('Finite launch frame required');
    game.can.position={...launchFrame.origin,y:launchFrame.origin.y+game.can.radius-CAN_RADIUS};
    for(const axis of ['x','y','z'])game.can.velocity[axis]+=launchFrame.velocity[axis];
    game.trail=[{...game.can.position}];
  }
  beginThrowableShot(game);
  game.phase = 'flying';
  game.attempts += 1;
  record(game, 'thrown');
  notify(game, 'shot-start');
  return true;
}

function reflect(velocity, normal, restitution) {
  const dot = velocity.x * normal.x + velocity.y * normal.y + velocity.z * normal.z;
  if (dot >= 0) return null;
  const impulse = (1 + restitution) * dot;
  velocity.x -= impulse * normal.x;
  velocity.y -= impulse * normal.y;
  velocity.z -= impulse * normal.z;
  return dot;
}

function collideWall(game) {
  const { position, velocity, radius } = game.can;
  const bin = game.bin;
  const dx = position.x - bin.center.x;
  const dz = position.z - bin.center.z;
  const radial = Math.hypot(dx, dz);
  if (radial < EPSILON) return;

  // Closest point on a hollow cylindrical wall, including its circular top rim.
  const wallY = Math.max(0, Math.min(bin.height, position.y));
  const gapR = radial - bin.radius;
  const gapY = position.y - wallY;
  const separation = Math.hypot(gapR, gapY);
  if (separation >= radius) return;

  const radialSign = separation > EPSILON ? gapR / separation : 1;
  const normal = {
    x: dx / radial * radialSign,
    y: separation > EPSILON ? gapY / separation : 0,
    z: dz / radial * radialSign,
  };
  if(throwableTerminalContact(game)==='splat'){
    stopSplatShot(game,{surface:wallY===bin.height?'rim':'side',colliderId:'legacy-bin-wall',normal});return;
  }
  const penetration = radius - separation + EPSILON;
  position.x += normal.x * penetration;
  position.y += normal.y * penetration;
  position.z += normal.z * penetration;
  const beforeVelocity={...velocity};
  const normalSpeed = reflect(velocity, normal, throwableRestitution(game,'bin',0.28));
  if (normalSpeed !== null) {
    throwableContact(game,normal,beforeVelocity,-normalSpeed);
    notify(game, 'wall-impact', {
      surface: wallY === bin.height ? 'rim' : 'side',
      region: radial < bin.radius ? 'inside' : 'outside',
      route: game.phase === 'settling' ? 'inside' : 'outside',
      incomingNormalSpeed: -normalSpeed,
      normal: { ...normal },
    });
  }
  record(game, wallY === bin.height ? 'rim-hit' : 'side-hit');
}

function finish(game, success) {
  game.phase = success ? 'success' : 'miss';
  game.can.velocity = { x: 0, y: 0, z: 0 };
  if (success) game.successes += 1;
  record(game, success ? 'success' : 'miss');
  notify(game, 'result', { success });
}

// Only the new worlds delegate goal geometry. Legacy bin entry/settling below
// remains unchanged, including when an earned non-terminal item is re-equipped.
export function captureGoal(game,goal,{position=game?.can?.position,environmentTime}={}){
  if(!ACTIVE.has(game?.phase)||!extendedPhysicsWorld(ROOM_SETUPS.get(game)))return false;
  const world=factoryWorldByVersion(ROOM_SETUPS.get(game))??outdoorWorldByVersion(ROOM_SETUPS.get(game))??eccentricWorldByVersion(ROOM_SETUPS.get(game));
  const fixed=world.goals.find(g=>g.id===goal?.id);
  if(!fixed||fixed.role!==goal.role||!position||!['x','y','z'].every(axis=>Number.isFinite(position[axis])))return false;
  game.can.position={...position};game.phase='settling';
  const capture=freezeTree({goalId:goal.id,goalRole:goal.role,position:{...position},normal:{...goal.normal},time:game.time});
  GOAL_CAPTURES.set(game,capture);record(game,'entered');notify(game,'entered',{goalId:goal.id,goalRole:goal.role});
  notify(game,'goal-captured',{...capture,goalKind:goal.kind,...(Number.isFinite(environmentTime)?{environmentTime}:{})});
  if(game.trail.length)game.trail[game.trail.length-1]={...position};
  finish(game,true);return true;
}
export function setShotEnvironmentStart(game,time=0){if(!game||typeof game!=='object'||!Number.isFinite(time))throw new TypeError('Shot environment start must be finite');SHOT_ENVIRONMENT_START.set(game,time);}
export function emitShotEffect(game,effect){
  if(!game||!effect||!['bell-ring','ice-splat','bat-swing','gate-latched','conveyor-carry','card-stuck','door-hit','cannon-fire','boar-hit'].includes(effect.type))return false;
  const effects=SHOT_EFFECTS.get(game)??[];
  if(effects.length>=120)return false;
  const value=freezeTree({id:effect.id??`${game.attempts}:${effect.type}:${effects.length}`,type:effect.type,time:game.time,
    environmentTime:Number.isFinite(effect.environmentTime)?effect.environmentTime:(SHOT_ENVIRONMENT_START.get(game)??0)+game.time,
    sourceId:String(effect.sourceId??''),position:{...(effect.position??game.can.position)},...(effect.normal?{normal:{...effect.normal}}:{}),...(ROOM_SETUPS.get(game)===34&&effect.type==='ice-splat'?{radius:game.can.radius*1.8}:{})});
  if(effects.some(item=>item.id===value.id))return false;
  SHOT_EFFECTS.set(game,[...effects,value]);notify(game,'shot-effect',{effect:value});return value;
}
export function getShotEffects(game){return structuredClone(SHOT_EFFECTS.get(game)??[]);}
export function stopSplatShot(game,{surface='ground',colliderId='ground',normal={x:0,y:1,z:0},environmentTime}={}){
  if(!ACTIVE.has(game?.phase)||throwableTerminalContact(game)!=='splat')return false;
  record(game,'splat');emitShotEffect(game,{type:'ice-splat',sourceId:colliderId,position:game.can.position,normal,environmentTime});
  notify(game,'shot-splatted',{surface,colliderId,normal:{...normal}});finish(game,false);return true;
}

// A visible school pedestrian is a terminal obstruction, never a rebound or a
// trick reward. Route it through the established result observer and counters.
export function stopBlockedShot(game,reason='student') {
  if(!ACTIVE.has(game?.phase))return false;
  record(game,reason==='student'?'student-blocked':'blocked');
  notify(game,'shot-blocked',{reason});
  finish(game,false);
  return true;
}

function collideFloor(game, dt) {
  const { position, velocity, radius } = game.can;
  if (position.y > radius) return;
  position.y = radius;
  if(throwableTerminalContact(game)==='splat'){
    if(game.phase==='settling'&&ROOM_SETUPS.get(game)<=10)finish(game,true);
    else stopSplatShot(game);
    return;
  }
  const incomingVerticalSpeed = velocity.y;
  // This describes the physical surface, not the stricter aperture/success test.
  const region = ROOM_SETUPS.get(game)>10?'outside':radialDistance(position, game.bin) < game.bin.radius
    ? 'inside' : 'outside';
  const floorDetail = {
    surface: region === 'inside' ? 'bin-bottom' : 'ground', region,
    route: game.phase === 'settling' ? 'inside' : 'outside',
    incomingVerticalSpeed,
  };
  if (velocity.y < -0.55) {
    const beforeVelocity={...velocity};
    velocity.y = -velocity.y * throwableRestitution(game,region==='inside'?'bin-bottom':'floor',0.2);
    const retention=getThrowableProfile(game)?Math.max(0,1-throwableFriction(game,.35)):.65;
    velocity.x *= retention;
    velocity.z *= retention;
    throwableContact(game,{x:0,y:1,z:0},beforeVelocity,-incomingVerticalSpeed);
    notify(game, 'floor-impact', floorDetail);
  } else {
    velocity.y = 0;
    // Coulomb-like floor friction while the sphere is grounded.
    const horizontal = Math.hypot(velocity.x, velocity.z);
    const remaining = Math.max(0, horizontal - throwableFriction(game,8) * dt);
    if (horizontal > 0) {
      velocity.x *= remaining / horizontal;
      velocity.z *= remaining / horizontal;
    }
    notify(game, 'floor-contact', {
      ...floorDetail, kind: horizontal > 0 ? 'sliding' : 'resting',
    });
  }
  if (Math.hypot(velocity.x, velocity.z) < 0.12 && velocity.y === 0) {
    const inside = radialDistance(position, game.bin) <= game.bin.radius - radius + EPSILON;
    finish(game, game.phase === 'settling' && inside);
  }
}

function advance(game, dt, airApplied=false) {
  if(!airApplied)applyThrowableAir(game,dt);
  const previous = { ...game.can.position };
  const { position, velocity, radius } = game.can;
  position.x += velocity.x * dt;
  position.y += velocity.y * dt - GRAVITY * dt * dt / 2;
  position.z += velocity.z * dt;
  velocity.y -= GRAVITY * dt;
  game.time += dt;

  if(ROOM_SETUPS.get(game)>10){
    // Goal planes are swept in the composed contact adapter before advancing
    // this substep. A near-bin position or an old opening witness never clears.
    collideFloor(game,dt);
    if(ACTIVE.has(game.phase)&&game.time>=shotTimeLimit(game)-EPSILON)finish(game,false);
    return;
  }

  if(game.phase==='flying'&&[previous,position].some(point=>point.y>=game.bin.height
      &&radialDistance(point,game.bin)<=game.bin.radius+radius+EPSILON))BIN_TOP_APPROACH.add(game);

  // A descending sphere can clear the rim obliquely after its lower cap passes
  // the early plane. Also check its centre crossing, where its full cross-section
  // must fit the aperture; neither wall contact nor an inside position is entry.
  const entryPlane = game.bin.height + radius;
  if (game.phase === 'flying' && velocity.y < 0) {
    for (const plane of [entryPlane, game.bin.height]) {
      if (previous.y <= plane || position.y > plane) continue;
      const fraction = (previous.y - plane) / (previous.y - position.y);
      const crossing = {
        x: previous.x + (position.x - previous.x) * fraction,
        z: previous.z + (position.z - previous.z) * fraction,
      };
      if (radialDistance(crossing, game.bin) < game.bin.radius - radius - EPSILON) {
        if(throwableTerminalContact(game)==='splat'){
          position.x=crossing.x;position.y=plane;position.z=crossing.z;
          game.time-=dt*(1-fraction);
        }
        game.phase = 'settling';
        record(game, 'entered');
        notify(game, 'entered');
        // An earned scoop is accepted by a real legacy opening before its
        // side/bottom can become a non-goal splat. Old item settling is exact.
        if(throwableTerminalContact(game)==='splat'){finish(game,true);return;}
        break;
      }
    }
  } else if (game.phase === 'settling' && previous.y <= entryPlane && position.y > entryPlane) {
    game.phase = 'flying';
    record(game, 'exited');
    notify(game, 'exited');
  }

  collideWall(game);
  // A rim reflection may pass between both original descending entry planes.
  // Accept the actual wholly-contained sphere only with the above-opening
  // witness; it still has to settle and can still escape before succeeding.
  if(game.phase==='flying'&&BIN_TOP_APPROACH.has(game)&&position.y+radius<=game.bin.height+EPSILON
      &&radialDistance(position,game.bin)<=game.bin.radius-radius+EPSILON){
    game.phase='settling';record(game,'entered');notify(game,'entered');
  }
  collideFloor(game, dt);
  if (ACTIVE.has(game.phase) && game.time >= shotTimeLimit(game) - EPSILON) finish(game, false);
}

export function stepGame(game, dtSeconds,{airApplied=false}={}) {
  if (!ACTIVE.has(game.phase) || typeof dtSeconds !== 'number'
      || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return game;
  let remaining = Math.min(MAX_FRAME, dtSeconds, shotTimeLimit(game) - game.time);
  while (remaining > EPSILON && ACTIVE.has(game.phase)) {
    const dt = Math.min(SUBSTEP, remaining);
    advance(game, dt,airApplied);
    remaining -= dt;
  }
  game.trail.push({ ...game.can.position });
  if (game.trail.length > 160) game.trail.shift();
  return game;
}

export function predictArc(game, input = {}, steps = 35) {
  const count = Math.round(bounded(steps, 35, 2, 140));
  if(getThrowableProfile(game)){
    const predicted=createGame(),worldVersion=ROOM_SETUPS.get(game);
    if(worldVersion)setRoomWorld(predicted,worldVersion);
    predicted.bin={...game.bin,center:{...game.bin.center}};
    cloneThrowable(game,predicted);throwCan(predicted,input);
    const points=[{...predicted.can.position}];
    while(ACTIVE.has(predicted.phase)){stepGame(predicted,SUBSTEP);points.push({...predicted.can.position});}
    return Array.from({length:count+1},(_,index)=>points[Math.round(index*(points.length-1)/count)]);
  }
  const position = freshCan(game).position;
  const velocity = initialVelocity(input);
  const impactTime = (velocity.y + Math.sqrt(velocity.y ** 2
    + 2 * GRAVITY * (position.y - CAN_RADIUS))) / GRAVITY;
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const time = impactTime * index / count;
    points.push({
      x: position.x + velocity.x * time,
      y: Math.max(CAN_RADIUS, position.y + velocity.y * time - GRAVITY * time * time / 2),
      z: position.z + velocity.z * time,
    });
  }
  return points;
}

export function getSnapshot(game) {
  return {
    phase: game.phase,
    time: game.time,
    can: {
      position: { ...game.can.position },
      velocity: { ...game.can.velocity },
      radius: game.can.radius,
    },
    bin: { center: { ...game.bin.center }, radius: game.bin.radius, height: game.bin.height },
    attempts: game.attempts,
    successes: game.successes,
    lastEvent: game.lastEvent,
    events: game.events.map(event => ({ ...event, position: { ...event.position } })),
    trail: game.trail.map(point => ({ ...point })),
    ...(GOAL_CAPTURES.has(game)?{goalCapture:structuredClone(GOAL_CAPTURES.get(game))}:{}),
    ...(SHOT_EFFECTS.has(game)?{shotEffects:structuredClone(SHOT_EFFECTS.get(game))}:{}),
  };
}
