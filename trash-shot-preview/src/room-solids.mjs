// Collision solids for the comparison room, recovered from the actual meshes.
// Keep the saved worlds and production renderer unchanged. A furniture group
// is never converted to one solid box: open legs and shelf gaps stay open.
import {roomScene} from './room-scene.mjs?v=20261011-play-ui-1';

const AXES = ['x', 'y', 'z'];
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const cache = new Map();
const equal = (a, b) => Math.abs(a - b) < 1e-8;
const boundsOf = points => ({
  min: Object.fromEntries(AXES.map(k => [k, Math.min(...points.map(p => p[k]))])),
  max: Object.fromEntries(AXES.map(k => [k, Math.max(...points.map(p => p[k]))])),
});

function boxAt(shapes, start) {
  const faces = shapes.slice(start, start + 5);
  if (faces.length !== 5 || faces.some(s => s.line || s.points.length !== 4)) return null;
  const bounds = boundsOf(faces.flatMap(s => s.points));
  if (AXES.some(k => bounds.max[k] - bounds.min[k] <= 1e-8)) return null;
  // The existing room box builder writes front/right/back/left/top faces.
  const planes = [['z', 'min'], ['x', 'max'], ['z', 'max'], ['x', 'min'], ['y', 'max']];
  for (let i = 0; i < 5; i++) {
    const [axis, side] = planes[i];
    if (faces[i].points.some(p => !equal(p[axis], bounds[side][axis]))) return null;
    if (faces[i].points.some(p => AXES.some(k => !equal(p[k], bounds.min[k]) && !equal(p[k], bounds.max[k])))) return null;
    if (new Set(faces[i].points.map(p => AXES.map(k => p[k]).join(','))).size !== 4) return null;
  }
  return bounds;
}

function cylinderAt(shapes, topIndex) {
  const top = shapes[topIndex];
  if (top.line || top.points.length < 6 || top.points.length > 32) return null;
  const n = top.points.length, sides = shapes.slice(topIndex - n, topIndex);
  if (sides.length !== n || sides.some(s => s.line || s.points.length !== 4)) return null;
  const topY = top.points[0].y;
  if (top.points.some(p => !equal(p.y, topY))) return null;
  const all = [...top.points, ...sides.flatMap(s => s.points)], bounds = boundsOf(all);
  if (topY <= bounds.min.y || !equal(topY, bounds.max.y)) return null;
  const cx = top.points.reduce((s, p) => s + p.x, 0) / n;
  const cz = top.points.reduce((s, p) => s + p.z, 0) / n;
  const radii = top.points.map(p => Math.hypot(p.x - cx, p.z - cz));
  const radius = radii[0];
  if (radius <= 0 || radii.some(r => !equal(r, radius))) return null;
  const ring = new Set(top.points.map(p => `${p.x},${p.z}`));
  if (sides.some(s => s.points.some(p => !ring.has(`${p.x},${p.z}`) || !equal(p.y, topY) && !equal(p.y, bounds.min.y)))) return null;
  // An inscribed box stays inside the polygonal pot/cup. It is a documented
  // narrow collision approximation, not an enclosing square with invisible corners.
  const half = radius * Math.cos(Math.PI / n) / Math.SQRT2;
  return {min:{x:cx-half,y:bounds.min.y,z:cz-half},max:{x:cx+half,y:topY,z:cz+half},approximation:'inscribed-cylinder-box'};
}

function furnitureFor(bounds, groups) {
  return groups.find(g => g.bounds &&
    bounds.min.x >= g.bounds.minX - .09 && bounds.max.x <= g.bounds.maxX + .09 &&
    bounds.min.z >= g.bounds.minZ - .09 && bounds.max.z <= g.bounds.maxZ + .09)?.id ?? null;
}

function bevelCapAt(shapes, start, body) {
  const sides=shapes.slice(start+5,start+9),top=shapes[start+9];
  if(sides.length!==4||!top||top.line||top.points.length!==4||sides.some(s=>s.line||s.points.length!==4))return null;
  const cap=boundsOf(top.points),topY=cap.max.y;
  if(topY<=body.max.y||topY-body.max.y>.06||top.points.some(p=>!equal(p.y,topY)))return null;
  if(cap.min.x<=body.min.x||cap.max.x>=body.max.x||cap.min.z<=body.min.z||cap.max.z>=body.max.z)return null;
  if(sides.some(s=>s.points.some(p=>!equal(p.y,body.max.y)&&!equal(p.y,topY))))return null;
  return {min:{x:cap.min.x,y:body.max.y,z:cap.min.z},max:{x:cap.max.x,y:topY,z:cap.max.z}};
}

export function roomSolidColliders(world, extra = false) {
  if (world?.worldVersion !== 2 || !world.room || !world.sourceDesk) {
    throw new RangeError('Comparison room solids require the fixed compact room');
  }
  const key = JSON.stringify([world.stageId, world.room, world.sourceDesk, world.desk, Boolean(extra)]);
  if (cache.has(key)) return cache.get(key);
  const r = world.room;
  // A camera inside the room retains all wall geometry. Fading changes colors
  // only; the extracted vertex positions remain the exact production meshes.
  const scene = roomScene({x:0,y:1.5,z:(r.minZ+r.maxZ)/2},world.bin.center.z,[],extra,null,world);
  const furniture = scene.groups.filter(g => g.bounds);
  const result = [], ids = new Map();
  const add = (bounds, object, shapeIndex, approximation) => {
    const index = ids.get(object) ?? 0; ids.set(object, index + 1);
    result.push({id:`${object}-${index}`,object,surface:object==='source-desk'?'desk':'furniture',
      min:bounds.min,max:bounds.max,restitution:object==='bed'?.20:.30,shapeIndex,
      ...(approximation?{approximation}:{}),geometrySource:'room-scene-mesh'});
  };
  for (let i=0; i<scene.shapes.length; i++) {
    const bounds = boxAt(scene.shapes,i);
    if (bounds) {
      const object = furnitureFor(bounds,furniture);
      if (object) {
        add(bounds,object,i);
        const cap=bevelCapAt(scene.shapes,i,bounds);
        if(cap)add(cap,object,i+9,'inscribed-bevel-cap-box');
      }
      i += 4; continue;
    }
    const cylinder = cylinderAt(scene.shapes,i);
    if (cylinder) {
      const object = furnitureFor(cylinder,furniture);
      if (object) add(cylinder,object,i,cylinder.approximation);
    }
  }
  // Chapter obstacle desks already have explicit render/physics descriptors.
  for (const box of world.desk?.colliders ?? []) result.push({...box,object:'course-desk',surface:'desk',restitution:.30,geometrySource:'room-course-descriptor'});
  const solids = freeze(result); cache.set(key,solids); return solids;
}
