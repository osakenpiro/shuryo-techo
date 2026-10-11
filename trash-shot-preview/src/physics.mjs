// World-space simulation. One metre is one unit; rendering never affects physics.
const GRAVITY = 9.81;
const SUBSTEP = 1 / 240;
const MAX_FRAME = 0.1;
const MAX_SHOT_TIME = 5;
const CAN_RADIUS = 0.14;
const BIN_RADIUS = 0.7;
const EPSILON = 1e-7;
const ACTIVE = new Set(['flying', 'settling']);
// Observers stay outside the simulation state and never receive live references.
const OBSERVERS = new WeakMap();
// Only explicit room presets alter the launch origin. Ordinary setup, free play,
// and the independent pixel introduction retain the original metre-space setup.
const ROOM_SETUPS = new WeakMap();

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

function launchParameters(input) {
  const value = options(input);
  return {
    power: bounded(value.power, 7.8, 0.5, 14),
    elevation: bounded(value.elevation, 48, 5, 85),
    yaw: bounded(value.yaw, 0, -60, 60),
  };
}

function initialVelocity(input) {
  const { power, elevation, yaw } = launchParameters(input);
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
  const origin = ROOM_PHYSICS_WORLDS[ROOM_SETUPS.get(game)]?.origin ?? { x: 0, y: 1.05, z: 0 };
  return {
    position: { ...origin },
    velocity: { x: 0, y: 0, z: 0 },
    radius: CAN_RADIUS,
  };
}

function clearShot(game, reason) {
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
  return clearShot(game, 'setup');
}

export function setRoomWorld(game, worldVersion = 2) {
  if (worldVersion !== 1 && worldVersion !== 2) throw new RangeError('Room world version must be 1 or 2');
  const world = ROOM_PHYSICS_WORLDS[worldVersion];
  ROOM_SETUPS.set(game, worldVersion);
  game.bin = { ...world.bin, center: { ...world.bin.center } };
  return clearShot(game, 'room-setup');
}
export function getRoomWorldVersion(game) { return ROOM_SETUPS.get(game) ?? 0; }

export function resetShot(game) {
  if (ACTIVE.has(game.phase)) return false;
  clearShot(game, 'reset');
  return true;
}

export function throwCan(game, input = {}) {
  if (ACTIVE.has(game.phase)) return false;
  clearShot(game, 'next-shot');
  game.can.velocity = initialVelocity(input);
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
  const penetration = radius - separation + EPSILON;
  position.x += normal.x * penetration;
  position.y += normal.y * penetration;
  position.z += normal.z * penetration;
  const normalSpeed = reflect(velocity, normal, 0.28);
  if (normalSpeed !== null) {
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

function collideFloor(game, dt) {
  const { position, velocity, radius } = game.can;
  if (position.y > radius) return;
  position.y = radius;
  const incomingVerticalSpeed = velocity.y;
  // This describes the physical surface, not the stricter aperture/success test.
  const region = radialDistance(position, game.bin) < game.bin.radius
    ? 'inside' : 'outside';
  const floorDetail = {
    surface: region === 'inside' ? 'bin-bottom' : 'ground', region,
    route: game.phase === 'settling' ? 'inside' : 'outside',
    incomingVerticalSpeed,
  };
  if (velocity.y < -0.55) {
    velocity.y = -velocity.y * 0.2;
    velocity.x *= 0.65;
    velocity.z *= 0.65;
    notify(game, 'floor-impact', floorDetail);
  } else {
    velocity.y = 0;
    // Coulomb-like floor friction while the sphere is grounded.
    const horizontal = Math.hypot(velocity.x, velocity.z);
    const remaining = Math.max(0, horizontal - 8 * dt);
    if (horizontal > 0) {
      velocity.x *= remaining / horizontal;
      velocity.z *= remaining / horizontal;
    }
    notify(game, 'floor-contact', {
      ...floorDetail, kind: horizontal > 0 ? 'sliding' : 'resting',
    });
  }
  if (Math.hypot(velocity.x, velocity.z) < 0.12 && velocity.y === 0) {
    const inside = radialDistance(position, game.bin) <= game.bin.radius - radius - EPSILON;
    finish(game, game.phase === 'settling' && inside);
  }
}

function advance(game, dt) {
  const previous = { ...game.can.position };
  const { position, velocity, radius } = game.can;
  position.x += velocity.x * dt;
  position.y += velocity.y * dt - GRAVITY * dt * dt / 2;
  position.z += velocity.z * dt;
  velocity.y -= GRAVITY * dt;
  game.time += dt;

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
        game.phase = 'settling';
        record(game, 'entered');
        notify(game, 'entered');
        break;
      }
    }
  } else if (game.phase === 'settling' && previous.y <= entryPlane && position.y > entryPlane) {
    game.phase = 'flying';
    record(game, 'exited');
    notify(game, 'exited');
  }

  collideWall(game);
  collideFloor(game, dt);
  if (ACTIVE.has(game.phase) && game.time >= MAX_SHOT_TIME - EPSILON) finish(game, false);
}

export function stepGame(game, dtSeconds) {
  if (!ACTIVE.has(game.phase) || typeof dtSeconds !== 'number'
      || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return game;
  let remaining = Math.min(MAX_FRAME, dtSeconds, MAX_SHOT_TIME - game.time);
  while (remaining > EPSILON && ACTIVE.has(game.phase)) {
    const dt = Math.min(SUBSTEP, remaining);
    advance(game, dt);
    remaining -= dt;
  }
  game.trail.push({ ...game.can.position });
  if (game.trail.length > 160) game.trail.shift();
  return game;
}

export function predictArc(game, input = {}, steps = 35) {
  const count = Math.round(bounded(steps, 35, 2, 140));
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
  };
}
