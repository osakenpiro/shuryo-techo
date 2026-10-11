import { stepGame } from './physics.mjs?v=20261011-first-chapter-1';

const TICK = 1 / 240, EPS = 1e-9, SLOP = 1e-5;
const AXES = ['x', 'y', 'z'];
const ACTIVE = new Set(['flying', 'settling']);
const copy = point => ({ x: point.x, y: point.y, z: point.z });
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

function desk(centerX) {
  const center = { x: centerX, z: 3 }, width = 2.4, depth = 1.1;
  const topY = 1.1, topThickness = .1, legWidth = .18;
  const minX = center.x - width / 2, maxX = center.x + width / 2;
  const minZ = center.z - depth / 2, maxZ = center.z + depth / 2;
  const colliders = [{ id: 'desk-top', min: { x: minX, y: topY - topThickness, z: minZ }, max: { x: maxX, y: topY, z: maxZ } }];
  for (const [xi, x] of [[0, minX + .08], [1, maxX - legWidth - .08]]) {
    for (const [zi, z] of [[0, minZ + .08], [1, maxZ - legWidth - .08]]) {
      colliders.push({ id: `desk-leg-${xi}-${zi}`, min: { x, y: 0, z }, max: { x: x + legWidth, y: topY - topThickness, z: z + legWidth } });
    }
  }
  return { center, width, depth, topY, topThickness, legWidth, colliders };
}

// The renderer consumes these very same boxes. Space below the tabletop is
// genuinely open between the four legs, rather than a hidden solid wall.
export const ROOM_COURSES = freeze({
  'desk-over': { stageId: 'desk-over', desk: desk(0) },
  'desk-side': { stageId: 'desk-side', desk: desk(-1.8) },
});
export function roomCourse(stageId) { return Object.hasOwn(ROOM_COURSES, stageId) ? ROOM_COURSES[stageId] : null; }

const validPoint = point => point && AXES.every(axis => typeof point[axis] === 'number' && Number.isFinite(point[axis]));
function contactAt(point, box, radius) {
  const closest = {}, normal = {};
  let distanceSquared = 0;
  for (const axis of AXES) {
    closest[axis] = Math.max(box.min[axis], Math.min(box.max[axis], point[axis]));
    normal[axis] = point[axis] - closest[axis]; distanceSquared += normal[axis] ** 2;
  }
  const distance = Math.sqrt(distanceSquared);
  if (distance > EPS) {
    for (const axis of AXES) normal[axis] /= distance;
    return { normal, penetration: Math.max(0, radius - distance) };
  }
  let minimum = Infinity, faceAxis = 'y', sign = 1;
  for (const axis of AXES) for (const direction of [-1, 1]) {
    const gap = direction < 0 ? point[axis] - box.min[axis] : box.max[axis] - point[axis];
    if (gap < minimum) { minimum = gap; faceAxis = axis; sign = direction; }
  }
  return { normal: { x: 0, y: 0, z: 0, [faceAxis]: sign }, penetration: radius + Math.max(0, minimum) };
}

/**
 * Earliest exact segment / rounded-AABB contact for a sphere. Expanding a box
 * and using slab intersection alone would invent hits at its rounded corners.
 * Distance to the box is piecewise quadratic along a segment; solve each piece.
 * Tangency is returned, but does not by itself imply a reflecting impact.
 */
export function sweepSphereAABB(start, end, radius, box) {
  if (!validPoint(start) || !validPoint(end) || !validPoint(box?.min) || !validPoint(box?.max)
      || typeof radius !== 'number' || !Number.isFinite(radius) || radius <= 0 || radius > 2
      || AXES.some(axis => box.min[axis] > box.max[axis])) return null;
  if (AXES.some(axis => Math.min(start[axis], end[axis]) > box.max[axis] + radius + EPS
      || Math.max(start[axis], end[axis]) < box.min[axis] - radius - EPS)) return null;
  const delta = Object.fromEntries(AXES.map(axis => [axis, end[axis] - start[axis]]));
  const pointAt = t => Object.fromEntries(AXES.map(axis => [axis, start[axis] + delta[axis] * t]));
  const distanceSquared = point => AXES.reduce((sum, axis) => {
    const difference = point[axis] - Math.max(box.min[axis], Math.min(box.max[axis], point[axis]));
    return sum + difference * difference;
  }, 0);
  if (distanceSquared(start) <= radius * radius + EPS) {
    return { time: 0, position: copy(start), ...contactAt(start, box, radius) };
  }
  const cuts = [0, 1];
  for (const axis of AXES) if (Math.abs(delta[axis]) > EPS) {
    for (const bound of [box.min[axis], box.max[axis]]) {
      const t = (bound - start[axis]) / delta[axis]; if (t > 0 && t < 1) cuts.push(t);
    }
  }
  cuts.sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const lo = cuts[i], hi = cuts[i + 1]; if (hi - lo < EPS) continue;
    const mid = pointAt((lo + hi) / 2); let a = 0, b = 0, c = -radius * radius;
    for (const axis of AXES) {
      const bound = mid[axis] < box.min[axis] ? box.min[axis] : mid[axis] > box.max[axis] ? box.max[axis] : null;
      if (bound === null) continue;
      const offset = start[axis] - bound, velocity = delta[axis];
      a += velocity * velocity; b += 2 * offset * velocity; c += offset * offset;
    }
    if (a <= EPS) continue;
    const discriminant = b * b - 4 * a * c; if (discriminant < -EPS) continue;
    const root = (-b - Math.sqrt(Math.max(0, discriminant))) / (2 * a);
    if (root < lo - EPS || root > hi + EPS) continue;
    const time = Math.max(lo, Math.min(hi, root)), position = pointAt(time);
    return { time, position, ...contactAt(position, box, radius) };
  }
  return null;
}

function insideBin(game) {
  const p = game.can.position, b = game.bin;
  return p.y <= b.height + game.can.radius && Math.hypot(p.x - b.center.x, p.z - b.center.z) <= b.radius - game.can.radius;
}

/**
 * A bounded course wrapper; protected core owns gravity, bin/floor, and result.
 * afterStep observes resolved poses at each uniform tick (e.g. a pose recorder).
 * Desk contacts have their own telemetry, never counterfeit floor/rim roles.
 */
export function createRoomCourseStepper({ onContact } = {}) {
  let remainder = 0, stageId = null, shotId = null, deskHits = 0, substeps = 0, contacts = [];
  const lastImpact = new Map();
  function reset() {
    remainder = 0; stageId = null; shotId = null; deskHits = 0; substeps = 0; contacts = []; lastImpact.clear();
  }
  function impact(game, hit, collider) {
    const velocity = game.can.velocity;
    const normalSpeed = AXES.reduce((sum, axis) => sum + velocity[axis] * hit.normal[axis], 0);
    const incomingNormalSpeed = Math.max(0, -normalSpeed);
    const supported = hit.normal.y > .8 && incomingNormalSpeed < .55;
    const restitution = supported ? 0 : .28;
    if (normalSpeed < 0) {
      for (const axis of AXES) velocity[axis] -= (1 + restitution) * normalSpeed * hit.normal[axis];
      const outward = AXES.reduce((sum, axis) => sum + velocity[axis] * hit.normal[axis], 0);
      const tangent = Object.fromEntries(AXES.map(axis => [axis, velocity[axis] - outward * hit.normal[axis]]));
      const speed = Math.hypot(tangent.x, tangent.y, tangent.z);
      const remaining = Math.max(0, speed - incomingNormalSpeed * (1 + restitution) * .22);
      for (const axis of AXES) velocity[axis] = outward * hit.normal[axis] + (speed > EPS ? tangent[axis] * remaining / speed : 0);
    }
    for (const axis of AXES) game.can.position[axis] = hit.position[axis] + hit.normal[axis] * (hit.penetration + SLOP);
    if (game.trail.length) game.trail[game.trail.length - 1] = copy(game.can.position);
    const prior = lastImpact.get(collider.id) ?? -Infinity;
    if (incomingNormalSpeed > .15 && game.time - prior > .05 && deskHits < 2400) {
      lastImpact.set(collider.id, game.time); deskHits++;
      const event = freeze({ type: 'desk-impact', surface: 'desk', colliderId: collider.id,
        shotId: game.attempts, time: game.time, position: copy(hit.position), normal: copy(hit.normal), incomingNormalSpeed });
      contacts.push(event);
      if (typeof onContact === 'function') try { onContact(event); } catch { /* Observation cannot interrupt simulation. */ }
    }
    return supported;
  }
  function advanceCourse(game, h, course) {
    let remaining = h;
    for (let count = 0; count < 4 && remaining > 1.000001e-7 && ACTIVE.has(game.phase); count++) {
      if (game.phase !== 'flying' || insideBin(game)) { stepGame(game, remaining); return; }
      const start = copy(game.can.position), v = game.can.velocity;
      const end = { x: start.x + v.x * remaining, y: start.y + v.y * remaining - 9.81 * remaining ** 2 / 2, z: start.z + v.z * remaining };
      let selected = null;
      for (const collider of course.desk.colliders) {
        const hit = sweepSphereAABB(start, end, game.can.radius, collider); if (!hit) continue;
        const incoming = v.x * hit.normal.x + (v.y - 9.81 * remaining * hit.time) * hit.normal.y + v.z * hit.normal.z;
        if (incoming >= -EPS && hit.penetration <= EPS) continue;
        if (!selected || hit.time < selected.hit.time) selected = { hit, collider };
      }
      if (!selected) { stepGame(game, remaining); return; }
      const { hit, collider } = selected, elapsed = remaining * hit.time;
      // Advance only to the desk's TOI before reflecting. Never emit a core
      // entry/result and then rewind it to an earlier obstacle position.
      if (elapsed > 1.000001e-7) stepGame(game, elapsed);
      remaining -= elapsed;
      if (game.phase !== 'flying') { if (remaining > 1.000001e-7) stepGame(game, remaining); return; }
      const supported = impact(game, hit, collider);
      if (supported && hit.normal.y > .999 && remaining > 1.000001e-7) {
        stepGame(game, remaining);
        const p = game.can.position;
        if (game.phase === 'flying' && p.x >= collider.min.x && p.x <= collider.max.x && p.z >= collider.min.z && p.z <= collider.max.z) {
          p.y = collider.max.y + game.can.radius + SLOP; game.can.velocity.y = 0;
          if (game.trail.length) game.trail[game.trail.length - 1] = copy(p);
        }
        return;
      }
    }
    if (remaining > 1.000001e-7 && ACTIVE.has(game.phase)) stepGame(game, remaining);
  }
  function step(game, dt, nextStageId, afterStep = () => {}) {
    if (!ACTIVE.has(game?.phase) || typeof dt !== 'number' || !Number.isFinite(dt) || dt <= 0) return game;
    const course = roomCourse(nextStageId);
    if (!course) { stepGame(game, dt); afterStep(); return game; }
    if (stageId !== nextStageId || shotId !== game.attempts || game.time === 0 && substeps) {
      reset(); stageId = nextStageId; shotId = game.attempts;
    }
    remainder += Math.min(dt, .1);
    for (let count = 0; count < 25 && remainder + EPS >= TICK && ACTIVE.has(game.phase); count++) {
      const h = Math.min(TICK, Math.max(0, 5 - game.time));
      if (h <= EPS) { stepGame(game, TICK); afterStep(); remainder = 0; break; }
      advanceCourse(game, h, course); substeps++;
      remainder = Math.max(0, remainder - TICK); afterStep();
      if (!ACTIVE.has(game.phase)) remainder = 0;
    }
    return game;
  }
  return { reset, step, snapshot: () => ({ stageId, shotId, deskHits, substeps, remainder,
    contacts: contacts.map(event => ({ ...event, position: copy(event.position), normal: copy(event.normal) })) }) };
}

