// Live chapter play and training compose the approved room contacts and fan.
// The contact adapter alone advances positions, gravity, bin entry and results.
import {createGame, setRoomWorld, throwCan} from './physics.mjs?v=20261014-tower-train-2';
import {roomWorld} from './room-course.mjs?v=20261014-tower-train-2';
import {windAcceleration} from './room-gimmicks.mjs?v=20261014-tower-train-2';
import {createRoomContactStepper, ROOM_CONTACT_TICK} from './room-contact.mjs?v=20261014-tower-train-2';
import {cloneThrowable,throwableWindScale} from './throwable-physics.mjs?v=20261014-tower-train-2';

export const PLAY_ROOM_TICK = ROOM_CONTACT_TICK;
const TICK = PLAY_ROOM_TICK, EPS = 1e-9;
const active = game => game?.phase === 'flying' || game?.phase === 'settling';
const copy = point => ({x:point.x, y:point.y, z:point.z});

function requireWorld(world) {
  if (!([2,3,4,5].includes(world?.worldVersion)) || !roomWorld(world.stageId, world.worldVersion)) {
    throw new RangeError('A supported compact chapter room is required');
  }
}

/**
 * Accumulate caller frames once. Each fixed tick applies the existing optional
 * fan impulse, then delegates exactly one tick to the unchanged contact stepper.
 * A new factory is normally made on stage selection; a changed descriptor also
 * clears shot-local telemetry and reconstructs the delegate from that world.
 */
export function createPlayRoomStepper(world, {extra=false}={}) {
  requireWorld(world);
  const extraRoom = Boolean(extra);
  let delegate = createRoomContactStepper(world, {extra:extraRoom});
  let remainder=0, windSteps=0, ticks=0, shotId=null, stageId=null, worldVersion=null;

  function reset() {
    remainder=0; windSteps=0; ticks=0; shotId=null; stageId=null; worldVersion=null;
    delegate.reset();
  }

  function step(game, dt, fanEnabled=false, afterStep=()=>{}) {
    if (!active(game) || !Number.isFinite(dt) || dt <= 0) return game;
    requireWorld(world);
    if (stageId !== world.stageId || worldVersion !== world.worldVersion) {
      delegate = createRoomContactStepper(world, {extra:extraRoom});
      reset(); stageId=world.stageId; worldVersion=world.worldVersion; shotId=game.attempts;
    } else if (shotId !== game.attempts || game.time === 0 && ticks) {
      reset(); stageId=world.stageId; worldVersion=world.worldVersion; shotId=game.attempts;
    }

    remainder += Math.min(dt, .1);
    for (let count=0; count<25 && remainder+EPS >= TICK && active(game); count++) {
      const h = Math.min(TICK, Math.max(0, 5-game.time));
      if (h > EPS && extraRoom && game.phase === 'flying') {
        const acceleration = windAcceleration(game.can.position, fanEnabled, world.worldVersion);
        // The established fan is a local x acceleration, applied before motion.
        game.can.velocity.x += acceleration.x*h*throwableWindScale(game);
        if (acceleration.x) windSteps++;
      }
      remainder = Math.max(0, remainder-TICK); ticks++;
      delegate.step(game, TICK, afterStep);
      if (!active(game)) remainder=0;
    }
    return game;
  }

  function snapshot() {
    const contact = delegate.snapshot();
    return Object.freeze({...contact, stageId, worldVersion:worldVersion ?? world.worldVersion,
      extra:extraRoom, windSteps, remainder, contactRemainder:contact.remainder});
  }
  return Object.freeze({reset, step, snapshot});
}

/** A fresh prediction uses the same composed stepper and never the live game. */
export function predictPlayRoomArc(game, input, world,
  {extra=false, fanEnabled=false, sampleEvery=1/60, maxSeconds=5}={}) {
  requireWorld(world);
  const predicted=createGame();
  setRoomWorld(predicted, world.worldVersion);
  cloneThrowable(game,predicted);
  predicted.bin={...game.bin, center:copy(game.bin.center)};
  throwCan(predicted, input);
  const stepper=createPlayRoomStepper(world, {extra}), points=[copy(predicted.can.position)];
  const interval=Number.isFinite(sampleEvery) ? Math.max(TICK, Math.min(.1, sampleEvery)) : 1/60;
  const ticksPerSample=Math.max(1, Math.round(interval/TICK));
  const limit=Number.isFinite(maxSeconds) ? Math.max(0, Math.min(5, maxSeconds)) : 5;
  const limitTicks=Math.floor((limit+EPS)/TICK);
  for (let ticks=0; ticks<limitTicks && active(predicted);) {
    const advance=Math.min(ticksPerSample, limitTicks-ticks);
    stepper.step(predicted, advance*TICK, fanEnabled); ticks+=advance;
    points.push(copy(predicted.can.position));
  }
  return points;
}
