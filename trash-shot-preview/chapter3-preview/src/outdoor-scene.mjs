// Outdoor places continue the approved room/school paper, wood and teal visual
// language. Physical mesh endpoints come from the world descriptors; painted
// trim and floor markings are decoration, not additional collision surfaces.
import {outdoorSolids,outdoorMotion,outdoorDynamicSolids} from './outdoor-world.mjs?v=20261012-outdoor-chapter-1';
import {outdoorEffectShapes,outdoorLightColor,outdoorLampShapes} from './outdoor-effects.mjs?v=20261012-outdoor-chapter-1';
export const OUTDOOR_PALETTE=Object.freeze({cream:'#f4ead5',wall:'#eee2c6',wood:'#c89b61',teal:'#4a948b',darkTeal:'#286864',gold:'#e8b54e',orange:'#e98238',sky:'#bfdedb',green:'#8caf7d',night:'#172e3d',water:'#244c60'});
const p=(x,y,z)=>({x,y,z});
const face=(points,fill,stroke=null,metadata={})=>({points,fill,stroke,...metadata});
const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const cache=new Map();
function box(s,x,y,z,w,h,d,color,metadata={}){
  const a=p(x,y,z),b=p(x+w,y,z),c=p(x+w,y,z+d),e=p(x,y,z+d),f=p(x,y+h,z),g=p(x+w,y+h,z),i=p(x+w,y+h,z+d),j=p(x,y+h,z+d);
  s.push(...[[[a,b,g,f],color],[[b,c,i,g],shade(color,-13)],[[c,e,j,i],shade(color,-5)],[[e,a,f,j],shade(color,7)],[[f,g,i,j],shade(color,17)],[[e,c,b,a],shade(color,-18)]].map(([points,fill])=>face(points,fill,null,metadata)));
}
function physicalBox(s,c,color){
  const a=c.min,b=c.max,lo=[p(a.x,a.y,a.z),p(b.x,a.y,a.z),p(b.x,a.y,b.z),p(a.x,a.y,b.z)],hi=lo.map(q=>({...q,y:b.y}));
  s.push(...[[[lo[0],lo[1],hi[1],hi[0]],color],[[lo[1],lo[2],hi[2],hi[1]],shade(color,-13)],[[lo[2],lo[3],hi[3],hi[2]],shade(color,-5)],[[lo[3],lo[0],hi[0],hi[3]],shade(color,7)],[[hi[0],hi[1],hi[2],hi[3]],shade(color,17)],[[lo[3],lo[2],lo[1],lo[0]],shade(color,-18)]].map(([points,fill])=>face(points,fill,null,{solidId:c.id,actorId:c.actorId??c.object})));
}
function cylinder(s,x,y,z,r,h,color,n=10,metadata={}){
  const lo=Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,y,z+Math.sin(i/n*Math.PI*2)*r)),hi=lo.map(q=>({...q,y:y+h}));
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,Math.round(Math.cos(i/n*Math.PI*2)*9)),null,metadata));
  s.push(face(hi,shade(color,14),null,metadata));
}
function ellipsoid(s,x,y,z,rx,ry,rz,color,n=8,rows=3,metadata={}){
  const at=(a,b)=>p(x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,c=-Math.PI/2+j/rows*Math.PI,d=-Math.PI/2+(j+1)/rows*Math.PI;
    s.push(face([at(a,c),at(b,c),at(b,d),at(a,d)],shade(color,Math.round(Math.sin((c+d)/2)*10+Math.cos(a)*5)),null,metadata));}
}
const line=(s,a,b,color='#bdc4aa',metadata={})=>s.push({points:[a,b],line:true,stroke:color,...metadata});
const flat=(s,x,y,z,w,d,color,metadata={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],color,null,metadata));
const oval=(s,x,y,z,rx,rz,color,metadata={})=>s.push(face(Array.from({length:16},(_,i)=>p(x+Math.cos(i/16*Math.PI*2)*rx,y,z+Math.sin(i/16*Math.PI*2)*rz)),color,null,{depthWrite:false,...metadata}));
const typeOf=world=>world.outdoorType??world.scene??world.stageId?.replace('outdoor-','');
const boundsOf=c=>({minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z});
const roomOf=world=>world.visualBounds??world.room??world.bounds??{minX:-6,maxX:6,minZ:-2,maxZ:12,height:8};
function surfaceColor(c,world){
  if(c.color)return c.color;
  const id=`${c.kind??''} ${c.object??''} ${c.id}`;
  if(c.id==='shrine-back-wall')return '#b4875b';
  if(typeOf(world)==='river')return /bank|ground/.test(id)?'#6c796e':/boat|deck/.test(id)?'#9b805d':/chimney|tube/.test(id)?'#456966':'#657f7e';
  if(/grass/.test(id))return OUTDOOR_PALETTE.green;
  if(/floor|slab|step|ground|walkway|bank/.test(id))return /mall/.test(world.stageId)?'#e4d8bb':'#c4b28d';
  if(/rail|frame|post|fence/.test(id))return '#b8c2a8';
  if(/scoreboard/.test(id))return OUTDOOR_PALETTE.darkTeal;
  if(/wall|building/.test(id))return OUTDOOR_PALETTE.wall;
  return OUTDOOR_PALETTE.wood;
}
function tree(s,x,y,z,scale=1){
  cylinder(s,x,y,z,.11*scale,.95*scale,'#a38456',8);
  ellipsoid(s,x,y+1.45*scale,z,.70*scale,.82*scale,.70*scale,'#93b781');
  ellipsoid(s,x-.32*scale,y+1.62*scale,z+.11*scale,.48*scale,.56*scale,.5*scale,'#aac38b');
}
function shrineDetails(s,world){
  const r=roomOf(world),goal=world.goals?.find(g=>g.role==='normal')??world.goals?.[0],c=goal?.center??goal?.position??world.bin?.center??p(0,1,7),z=c.z;
  // A stone path leads to the shared offering-box geometry. The temple itself
  // sits behind the play boundary, with no decorative wall on the throw route.
  flat(s,-1.45,.012,r.minZ,2.9,Math.max(1,z-r.minZ-.6),'#e2d7b9');
  for(let depth=r.minZ+.15;depth<z-.6;depth+=.72)line(s,p(-1.42,.014,depth),p(1.42,.014,depth),'#c9c0a4');
  const temple=world.solids.find(c=>c.id==='shrine-back-wall'),back=temple?temple.min.z-.018:r.maxZ+.7,roofY=temple?.max.y??3.1;
  // The visible wooden facade is paint/trim on the real back wall, so it
  // cannot disappear behind a duplicate, nonphysical temple building.
  box(s,-3.48,roofY-.18,back-.14,6.96,.25,1.76,'#678e7c');
  // Faceted pitched roof and warm wooden shutters retain the toy scale.
  s.push(face([p(-3.8,roofY+.07,back-.36),p(0,roofY+1.08,back+.67),p(3.8,roofY+.07,back-.36)],'#557e6e'));
  s.push(face([p(-3.8,roofY+.07,back-.36),p(-3.8,roofY+.07,back+1.8),p(0,roofY+1.08,back+1.8),p(0,roofY+1.08,back+.67)],'#628d79'));
  s.push(face([p(0,roofY+1.08,back+.67),p(0,roofY+1.08,back+1.8),p(3.8,roofY+.07,back+1.8),p(3.8,roofY+.07,back-.36)],'#476e63'));
  for(const x of [-2.9,-1.5,1.3,2.7])box(s,x,.22,back-.015,.22,roofY-.45,.035,'#c39767');
  box(s,-1.13,.26,back-.014,2.26,roofY-.6,.014,'#7b674c');
  for(let x=-1.05;x<1.12;x+=.16)line(s,p(x,.29,back-.018),p(x,roofY-.34,back-.018),'#b79a71');
  // Two stone lanterns and trees stay out of the main throwing corridor.
  for(const side of [-1,1]){
    cylinder(s,side*3.1,0,z-.55,.16,.74,'#acb4a0',8);box(s,side*3.1-.24,.74,z-.79,.48,.45,.48,'#c8cbb3');
    box(s,side*3.1-.32,1.19,z-.87,.64,.09,.64,'#a6b19b');box(s,side*3.1-.15,.85,z-.803,.3,.23,.012,'#e7c373');
    tree(s,side*(Math.max(4,r.maxX-.7)),0,back-.25,1.1);
  }
  // The visible bell assembly is separate from its real rope collider. A rope
  // is added later from the descriptor, never guessed from this facade.
  const rope=world.rope??world.bellRope??(()=>{const c=world.solids.find(c=>c.kind==='bell-rope');return c?{center:p((c.min.x+c.max.x)/2,(c.min.y+c.max.y)/2,(c.min.z+c.max.z)/2),top:c.max.y}:null;})();
  if(rope){const q=rope.center??rope.position??p(0,2,z-1),top=rope.top??rope.maxY??q.y+1.3;
    cylinder(s,q.x,top,q.z,.22,.27,'#d7b162',10);oval(s,q.x,top-.012,q.z,.23,.23,'#8d7753');
    box(s,q.x-.12,top+.27,q.z-.09,.24,.08,.18,'#bc9561');}
}
function baseballDetails(s,world){
  const r=roomOf(world),o=world.origin;
  flat(s,r.minX,.008,r.minZ,r.maxX-r.minX,r.maxZ-r.minZ,'#91b782');
  // An oversized sand diamond describes distance without marking an aim path.
  const z0=o.z-.75,z1=Math.min(r.maxZ*.53,o.z+7),span=Math.min(5,(r.maxX-r.minX)*.3);
  s.push(face([p(o.x,.012,z0),p(o.x-span,.012,z0+(z1-z0)*.5),p(o.x,.012,z1),p(o.x+span,.012,z0+(z1-z0)*.5)],'#d7bd8e'));
  for(const side of [-1,1])line(s,p(o.x,.019,z0),p(o.x+side*span*2,.019,z0+(z1-z0)),'#f4ead5');
  const bx=o.x-.22,bz=o.z-.17;
  s.push(face([p(bx,.021,bz),p(bx+.44,.021,bz),p(bx+.44,.021,bz+.22),p(bx+.22,.021,bz+.36),p(bx,.021,bz+.22)],'#f7edd7'));
  for(const side of [-1,1]){const x=o.x+side*.8;line(s,p(x-.25,.02,o.z-.43),p(x+.25,.02,o.z-.43),'#f3e8d0');line(s,p(x-.25,.02,o.z+.42),p(x+.25,.02,o.z+.42),'#f3e8d0');for(const sign of [-1,1])line(s,p(x+sign*.25,.02,o.z-.43),p(x+sign*.25,.02,o.z+.42),'#f3e8d0');}
  // Painted seat stripes lie on the descriptor's stand surfaces. The stand
  // itself is supplied as physical boxes, so no extra facade blocks a mitt.
  for(const c of world.solids??[]){if(!/stand|bleacher/.test(`${c.kind} ${c.id}`))continue;
    const y=c.max.y+.006,z=(c.min.z+c.max.z)/2;
    for(let x=c.min.x+.25;x<c.max.x-.15;x+=.66){flat(s,x,y,z-.18,.38,.28,'#bcd0ad');line(s,p(x,y+.003,z+.13),p(x+.38,y+.003,z+.13),'#789b86');}}
  const scoreboard=world.solids.find(c=>c.kind==='scoreboard');
  if(scoreboard){const z=scoreboard.min.z-.009,y=scoreboard.max.y-1.25;
    for(let x=scoreboard.min.x+.6;x<scoreboard.max.x-.5;x+=.7)box(s,x,y,z,.44,.15,.008,'#c3cbac');
    for(const x of [-4.3,3.0]){
      for(const yy of [12.6,15.5])box(s,x,yy,z,1.25,.10,.008,'#c9cba9');
      for(const xx of [x,x+1.15])box(s,xx,12.7,z,.10,2.8,.008,'#c9cba9');
    }
    for(const x of [scoreboard.min.x+.3,scoreboard.max.x-.3])line(s,p(x,scoreboard.min.y+.25,z),p(x,scoreboard.max.y-.25,z),'#50847c');
  }
  for(const x of [r.minX-1.4,r.maxX+1.4])tree(s,x,0,r.maxZ+1.3,1.4);
}
function mallDetails(s,world){
  const r=roomOf(world),o=world.origin,wall=world.solids.find(c=>c.id==='mall-back-wall'),far=wall?wall.min.z-.012:r.maxZ+.02;
  // Window lettering is deliberately geometric; no canvas text labels are
  // needed inside the 3D toy-like architecture.
  for(const y of [0,3,6])for(const x of [r.minX+.4,r.maxX-2.4]){
    box(s,x,y+.35,far,2,2.1,.025,'#afc8bd');box(s,x-.12,y+2.46,far-.02,2.24,.23,.03,y===3?'#d4b25d':'#86aa96');
    for(let k=0;k<3;k++)box(s,x+.3+k*.48,y+2.53,far-.036,.26,.07,.008,'#efe8cf');
    for(let k=0;k<3;k++)box(s,x+.18+k*.54,y+.46,far-.032,.34,.65+k*.08,.015,['#b1c798','#d5b273','#e3d5b2'][k]);
  }
  // Large tile joints ground the lowest child's level without creating an
  // invisible surface across the atrium opening at upper levels.
  for(let x=r.minX+.5;x<r.maxX;x+=.9)line(s,p(x,.014,r.minZ),p(x,.014,r.maxZ),'#d4c7a7');
  for(let z=r.minZ+.3;z<r.maxZ;z+=.9)line(s,p(r.minX,.014,z),p(r.maxX,.014,z),'#d4c7a7');
  for(const [x,z] of [[r.minX+.5,r.minZ+1.2],[r.maxX-.5,r.maxZ-1.2]]){box(s,x-.23,0,z-.23,.46,.42,.46,'#bba46f');ellipsoid(s,x,.88,z,.43,.48,.42,'#a0b986');}
  // A flat service counter mat identifies the launch point on its real floor.
  flat(s,o.x-.4,o.y-.11,o.z-.36,.8,.48,'#dfba78');
}
function riverDetails(s,world){
  const r=roomOf(world),water=world.water??world.river??{},minZ=water.minZ??3,maxZ=water.maxZ??r.maxZ-2,minX=water.minX??r.minX,maxX=water.maxX??r.maxX;
  // Water patches share a single physical surface but sample the real moving
  // lamps separately, so lit regions move rather than brightening all water.
  for(let column=0;column<64;column++)for(let row=0;row<20;row++)
    flat(s,minX+(maxX-minX)*column/64,(water.y??0)+.008,minZ+(maxZ-minZ)*row/20,(maxX-minX)/64,(maxZ-minZ)/20,OUTDOOR_PALETTE.water,{water:true});
  // Restrained far-bank silhouettes leave the firework and actual light pools
  // as the main nighttime contrast. FX owns light-driven visibility changes.
  for(const x of [r.minX+.6,r.maxX-1.4]){
    cylinder(s,x,0,r.maxZ+.8,.13,1.1,'#465f58',8);ellipsoid(s,x,1.75,r.maxZ+.8,.75,.88,.65,'#3e5c55');}
  for(let x=r.minX+.3;x<r.maxX;x+=1.9)box(s,x,0,r.maxZ+1.3,1.35,1.35+(Math.abs(Math.round(x))%3)*.4,.6,'#405b59');
  const q=world.origin;box(s,q.x-1.3,0,q.z-.7,.44,.3,.32,'#8a775c');box(s,q.x-1.22,.3,q.z-.62,.28,.22,.2,'#bd985c');
}
function buildGroups(world){
  const groups=[],background=[],solids=outdoorSolids(world);
  const r=roomOf(world),type=typeOf(world);
  if(type!=='river')flat(background,r.minX,-.018,r.minZ,r.maxX-r.minX,r.maxZ-r.minZ,type==='baseball'?'#a1bc87':type==='mall'?'#eee4cc':'#b8bd92');
  groups.push({id:'outdoor-background',shapes:background,physical:false});
  for(const c of solids){const shapes=[];physicalBox(shapes,c,surfaceColor(c,world));groups.push({id:c.id,object:c.object??c.kind,bounds:boundsOf(c),shapes,physical:true});}
  const detail=[];
  if(type==='shrine')shrineDetails(detail,world);else if(type==='baseball')baseballDetails(detail,world);else if(type==='mall')mallDetails(detail,world);else if(type==='river')riverDetails(detail,world);
  groups.push({id:'outdoor-detail',shapes:detail,physical:false});
  // These spectators/customers and their mouths have no gameplay motion. Keep
  // them in the cached depth layer rather than rebuilding hundreds of faces.
  if(type==='baseball'||type==='mall'){
    const figures=[],motion=outdoorMotion(world,0);
    for(const actor of motion.actors)actorShapes(figures,actor,0,true);
    for(const goal of motion.goals)aperture(figures,goal);
    heldObjects(figures,motion.actors,motion.goals);
    if(type==='baseball')actorShapes(figures,batterActor(world),0,true);
    groups.push({id:'outdoor-fixed-actors',shapes:figures,physical:false});
  }
  return groups;
}
function sightIntersects(bounds,camera,target){
  let lo=0,hi=1;for(const axis of ['x','y','z']){const cap=axis.toUpperCase(),delta=target[axis]-camera[axis],min=bounds['min'+cap],max=bounds['max'+cap];
    if(Math.abs(delta)<1e-8){if(camera[axis]<min||camera[axis]>max)return false;continue;}
    let a=(min-camera[axis])/delta,b=(max-camera[axis])/delta;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;}return hi>0&&lo<1;
}
const transparent=(color,alpha)=>color&&/^#[0-9a-f]{6}$/i.test(color)?`rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${alpha})`:color;
export function outdoorCameraConfig(world){return {azimuth:world?.view?.azimuth??.18,elevation:world?.view?.elevation??.43,zoom:1};}
export function outdoorScene(camera,world,time=0,options={}){
  if(world?.environment!=='outdoor')throw new RangeError('A frozen outdoor world is required');
  const key=`${world.stageId}/${world.worldVersion}`;if(!cache.has(key))cache.set(key,buildGroups(world));
  const groups=cache.get(key),shapes=[],cutaway=[],goals=world.goals??[],endpoints=[world.origin,...goals.map(g=>g.center??g.position).filter(Boolean)];
  const lamps=typeOf(world)==='river'?outdoorMotion(world,time).lamps:[];
  for(const group of groups){
    // Only building shells cut away. Real crowd, rope, stands and rails stay
    // opaque. No projected throw trajectory is used to reveal a hidden path.
    const sourceFloor=typeOf(world)==='mall'&&group.id==='mall-source-balcony',shell=group.physical&&(/wall|ceiling|building-shell/.test(`${group.id} ${group.object}`)||sourceFloor);
    const faded=shell&&(/ceiling/.test(group.id)||endpoints.some(q=>sightIntersects(group.bounds,camera,q)));
    if(faded){cutaway.push(group.id);shapes.push(...group.shapes.map(s=>({...s,fill:transparent(s.fill,sourceFloor?.11:/ceiling/.test(group.id)?.045:.16),depthWrite:false})));}
    else shapes.push(...group.shapes);
  }
  return {shapes:lamps.length?lightShapes(shapes,lamps):shapes,cutaway,groups:groups.map(({id,object,bounds,physical})=>({id,object,bounds,physical})),worldVersion:world.worldVersion,stageId:world.stageId};
}

const add=(a,b)=>p(a.x+b.x,a.y+b.y,a.z+b.z);
const scale=(a,n)=>p(a.x*n,a.y*n,a.z*n);
const cross=(a,b)=>p(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const unit=a=>scale(a,1/(Math.hypot(a.x,a.y,a.z)||1));
const centroid=shape=>scale(shape.points.reduce(add,p(0,0,0)),1/shape.points.length);
const lightShapes=(shapes,lamps)=>shapes.map(shape=>({...shape,fill:outdoorLightColor(shape.fill,centroid(shape),lamps,{ambient:.24}),stroke:outdoorLightColor(shape.stroke,centroid(shape),lamps,{ambient:.24})}));
function basis(goal){
  const normal=unit(goal.normal??p(0,1,0)),vertical=goal.up??(Math.abs(normal.y)>.8?p(0,0,1):p(0,1,0)),right=unit(cross(vertical,normal)),up=unit(cross(normal,right));
  return {normal,right,up,at:(x,y,d=0)=>add(goal.center,add(scale(right,x),add(scale(up,y),scale(normal,d))))};
}
function aperture(s,goal){
  const {at,normal}=basis(goal),meta={goalId:goal.id,goalRole:goal.role,goalKind:goal.kind},n=16,thickness=.045;
  const outline=goal.shape==='rectangle'?
    [[-goal.halfWidth,-goal.halfHeight],[goal.halfWidth,-goal.halfHeight],[goal.halfWidth,goal.halfHeight],[-goal.halfWidth,goal.halfHeight]].map(([x,y])=>at(x,y)):
    Array.from({length:n},(_,i)=>at(Math.cos(i/n*Math.PI*2)*goal.radius,Math.sin(i/n*Math.PI*2)*goal.radius));
  const outer=goal.shape==='rectangle'?
    [[-goal.halfWidth-thickness,-goal.halfHeight-thickness],[goal.halfWidth+thickness,-goal.halfHeight-thickness],[goal.halfWidth+thickness,goal.halfHeight+thickness],[-goal.halfWidth-thickness,goal.halfHeight+thickness]].map(([x,y])=>at(x,y)):
    Array.from({length:n},(_,i)=>at(Math.cos(i/n*Math.PI*2)*(goal.radius+thickness),Math.sin(i/n*Math.PI*2)*(goal.radius+thickness)));
  const color=goal.kind==='hand'?'#e9c9a0':goal.kind==='mitt'?'#c49760':goal.kind==='scoreboard-light'?'#ffe19a':goal.role==='alternative'?'#deb45e':'#e9c375';
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;s.push(face([outer[i],outer[j],outline[j],outline[i]],color,null,{...meta,opening:true}));}
  const depth=goal.kind==='mitt'?.22:goal.kind==='hand'?.018:goal.kind==='scoreboard-light'?.002:.16;
  const back=outline.map(q=>add(q,scale(normal,-depth)));
  if(['mitt','hand','scoreboard-light'].includes(goal.kind)){
    s.push(face(back,goal.kind==='mitt'?'#8d6541':goal.kind==='hand'?'#e2bd93':'#efc65c',null,meta));
    if(goal.kind==='mitt')for(let i=0;i<outline.length;i+=2)line(s,outline[i],back[(i+2)%back.length],'#d8b379',meta);
    if(goal.kind==='scoreboard-light'){
      const w=goal.halfWidth??goal.radius*.7,h=goal.halfHeight??goal.radius*.7;
      for(const x of [-.55,0,.55])for(const y of [-.5,0,.5]){const c=at(x*w,y*h,.005);ellipsoid(s,c.x,c.y,c.z,.035,.035,.018,'#fff2b6',6,2,meta);}
    }
    return;
  }
  // Open mouths show their actual descriptor aperture. The dark pocket sits
  // below the mouth and cannot look like a cap across a valid entry plane.
  s.push(face(back,goal.kind==='cone'?'#d6ac6c':goal.kind==='coffee'?'#755d42':goal.kind==='soda'?'#82b7a0':'#365f58',null,meta));
  if(goal.shape==='rectangle'){
    for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;s.push(face([outline[i],outline[j],back[j],back[i]],shade('#b29163',i%2?-16:2),null,meta));}
    return;
  }
  const height=goal.kind==='cone'?.5:goal.kind==='chimney'?.68:goal.kind==='firework-tube'?.62:.33;
  const bottom=goal.kind==='cone'?outer.map(()=>add(goal.center,scale(normal,-height))):outer.map(q=>add(q,scale(normal,-height)));
  const bodyColor=goal.kind==='cone'?'#d5aa69':goal.kind==='coffee'?'#e9dac0':goal.kind==='soda'?'#a5cbb8':goal.kind==='chimney'?'#496f6d':'#60938b';
  for(let i=0;i<outer.length;i++){const j=(i+1)%outer.length;s.push(face([outer[i],outer[j],bottom[j],bottom[i]],shade(bodyColor,Math.round(Math.cos(i/outer.length*Math.PI*2)*12)),null,meta));}
  if(goal.kind==='cone')for(let i=0;i<outer.length;i+=2){const mid=add(goal.center,scale(normal,-height*.48));line(s,outer[i],add(mid,scale(basis(goal).right,.08*Math.cos(i))), '#bf935b',meta);}
}
function actorShapes(s,actor,time,reducedMotion=false){
  const q=actor.position??actor,model=[],height=actor.height??1.68,width=actor.width??.46,depth=actor.depth??.34,young=actor.kind==='child';
  const t=reducedMotion?0:time,gait=actor.velocity&&Math.hypot(actor.velocity.x??0,actor.velocity.z??0)>.01?Math.sin(t*5.5)*.045:0,color=actor.color??(young?'#d5ac65':'#698f81');
  box(model,-.17,.67,-.115,.34,.46,.23,color);box(model,-.16,.56,-.11,.32,.13,.22,shade(color,-8));
  cylinder(model,0,1.13,0,.06,.08,'#d8b896',8);ellipsoid(model,0,1.4,0,.14,.18,.13,'#ead0aa');ellipsoid(model,0,1.51,.012,.147,.104,.137,actor.hairColor??'#746950');
  for(const side of [-1,1]){
    box(model,side*.075-.05,.07,side*gait-.052,.10,.50,.105,'#617e70');box(model,side*.075-.06,.02,side*gait-.092,.12,.065,.16,'#747a62');
    box(model,side<0?-.23:.17,.76,-.065,.06,.30,.13,color);ellipsoid(model,side*.201,.72,0,.037,.055,.047,'#e4c49c',6,2);
    box(model,side*.05-.006,1.408,-.132,.012,.012,.005,'#58614b');
  }
  const points=model.flatMap(shape=>shape.points),lo=Object.fromEntries(['x','y','z'].map(k=>[k,Math.min(...points.map(a=>a[k]))])),hi=Object.fromEntries(['x','y','z'].map(k=>[k,Math.max(...points.map(a=>a[k]))]));
  const min=actor.colliders?.[0]?.min??p(q.x-width/2,q.y??0,q.z-depth/2),max=actor.colliders?.[0]?.max??p(q.x+width/2,(q.y??0)+height,q.z+depth/2);
  // A silhouette fills the descriptor's physical body envelope. Gait changes
  // the interior geometry, never the collision body's position or dimensions.
  for(const shape of model)s.push({...shape,actorId:actor.id,points:shape.points.map(a=>Object.fromEntries(['x','y','z'].map(k=>[k,min[k]+(a[k]-lo[k])/(hi[k]-lo[k])*(max[k]-min[k])])))});
  oval(s,q.x,(q.y??0)+.008,q.z,width*.65,depth*.8,'rgba(57,77,52,.14)',{actorShadow:actor.id});
}
function boatDetails(s,boat,time,reducedMotion=false){
  const q=boat.position,w=boat.width??2,d=boat.depth??1.1,h=boat.height??.55,steam=boat.kind==='steamship',color=steam?'#cfdbcd':'#d4b878',meta={boatDetailId:boat.id};
  // Thin cabin windows, a cream rubbing strake and a painted bow distinguish
  // boat silhouettes while retaining the shared rectangular contact hull.
  for(const side of [-1,1])for(let x=-w*.33;x<w*.32;x+=w*.19){const z=q.z+side*(d*.5+.012);
    box(s,q.x+x,q.y+h*.30,z-.004,w*.11,h*.32,.008,'#e7c88b',meta);
    box(s,q.x+x+w*.044,q.y+h*.30,z-.008,w*.018,h*.32,.009,'#6f887d',meta);}
  for(const side of [-1,1]){
    const z=q.z+side*(d*.5+.018);
    box(s,q.x-w*.47,q.y+h*.17,z-.003,w*.94,h*.09,.006,color,meta);
    line(s,p(q.x-w*.43,q.y+h*.75,z),p(q.x+w*.43,q.y+h*.75,z),color,meta);
  }
  flat(s,q.x-w*.46,q.y+h+.007,q.z-d*.45,w*.92,d*.90,steam?'#819e92':'#997952',meta);
  if(steam){
    // The scoop-like bow is a decorative plate within the real hull width.
    s.push(face([p(q.x+w*.43,q.y+h*.22,q.z-d*.5-.02),p(q.x+w*.49,q.y+h*.45,q.z-d*.5-.02),p(q.x+w*.38,q.y+h*.45,q.z-d*.5-.02)],'#b7c8b6',null,meta));
    const t=reducedMotion?0:time;
    for(let i=0;i<3;i++){
      const age=((t*.37+i*.34)%1+1)%1,x=q.x-.08-age*.32,y=2.8+age*.8,z=q.z+.03,r=.11+age*.12,smoke=[];
      ellipsoid(smoke,x,y,z,r,r*.85,r*.8,'#78918f',8,3,meta);
      s.push(...smoke.map(shape=>({...shape,fill:transparent(shape.fill,.23*(1-age)),depthWrite:false})));
    }
  }else{
    // The pitched canopy is quiet scenery above the contact hull; it never
    // covers the mouth of a goal or adds an unrecorded gameplay obstacle.
    const a=q.x-w*.49,b=q.x+w*.49,front=q.z-d*.51,back=q.z+d*.51,edge=q.y+h+.025,ridge=edge+.20;
    s.push(face([p(a,edge,front),p(b,edge,front),p(b,ridge,q.z),p(a,ridge,q.z)],'#8d9267',null,meta));
    s.push(face([p(a,ridge,q.z),p(b,ridge,q.z),p(b,edge,back),p(a,edge,back)],'#626f5f',null,meta));
    for(const x of [a+.1,b-.1])line(s,p(x,q.y+h*.3,front-.006),p(x,edge,front-.006),'#d0b67d',meta);
  }
}
function limb(s,a,b,r,color,metadata={}){
  const axis=unit(p(b.x-a.x,b.y-a.y,b.z-a.z)),right=unit(cross(axis,Math.abs(axis.y)>.8?p(0,0,1):p(0,1,0))),up=cross(axis,right),n=6;
  const ring=q=>Array.from({length:n},(_,i)=>add(q,add(scale(right,Math.cos(i/n*Math.PI*2)*r),scale(up,Math.sin(i/n*Math.PI*2)*r)))),lo=ring(a),hi=ring(b);
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,i%2?-6:6),null,metadata));
}
function heldObjects(s,actors,goals){
  for(const goal of goals){
    const actor=goal.kind==='hand'?actors.find(a=>a.kind==='raised-hand'):goal.kind==='cone'?actors.find(a=>a.kind==='child'):goal.kind==='coffee'?actors.find(a=>a.id.includes('coffee')):goal.kind==='soda'?actors.find(a=>a.id.includes('soda')):goal.kind==='mitt'?actors.find(a=>Math.abs(a.position.x-goal.center.x)<.1):null;
    if(!actor)continue;
    if(goal.kind==='cone'){
      // Both raised hands make the cone read as a held object above the child,
      // rather than as a hat hiding the child's head in the default view.
      for(const side of [-1,1]){
        const q=actor.position,start=p(q.x+side*actor.width*.40,q.y+actor.height*.68,q.z-actor.depth*.12),end=p(goal.center.x+side*.16,goal.center.y-.27,goal.center.z-.025),elbow=p(start.x+side*.025,start.y+.16,(start.z+end.z)/2);
        limb(s,start,elbow,.045,actor.color??'#d2a456',{gestureActorId:actor.id});limb(s,elbow,end,.04,'#e7c79f',{gestureActorId:actor.id});
        ellipsoid(s,end.x,end.y,end.z,.053,.061,.052,'#edcfaa',6,2,{gestureActorId:actor.id});
      }
      continue;
    }
    const q=actor.position,h=actor.height,side=goal.center.x<q.x?-1:1,start=p(q.x+side*actor.width*.34,q.y+h*.7,q.z-actor.depth*.2),end=goal.kind==='hand'?p(goal.center.x,goal.center.y-.025,goal.center.z):p(goal.center.x,goal.center.y-.18,goal.center.z+.035),middle=p((start.x+end.x)/2,(start.y+end.y)/2-.05,(start.z+end.z)/2);
    limb(s,start,middle,.045,actor.color??'#819b82',{gestureActorId:actor.id});limb(s,middle,end,.037,'#e4c49c',{gestureActorId:actor.id});
  }
}
const batterActor=world=>({id:'baseball-batter',kind:'batter',position:p(world.origin.x-.48,Math.max(0,world.origin.y-1.05),world.origin.z-.15),width:.46,depth:.34,height:1.72,color:'#eee6cf'});
function batSwing(s,world,time,options){
  if(typeOf(world)!=='baseball')return;
  const o=world.origin;
  // A cosmetic bat arc uses the existing flight elapsed time; it changes no
  // launch direction, speed or user input. Capture is not required to swing.
  const elapsed=options.flightTime??0,active=options.phase==='flying'&&elapsed<.55,angle=active?-.55+Math.min(1,elapsed/.34)*2.2:-.55;
  const hand=p(o.x-.29,o.y-.03,o.z-.08),tip=p(hand.x+Math.cos(angle)*.71,hand.y+.15+Math.sin(angle)*.12,hand.z+Math.sin(angle)*.58);
  line(s,hand,tip,'#ba9564',{batterBat:true});line(s,p(hand.x+.025,hand.y,hand.z),p(tip.x+.025,tip.y,tip.z),'#d1ac76',{batterBat:true});
}
export function outdoorMotionShapes(time,world,options={}){
  if(typeof options==='boolean')options={reducedMotion:options};
  if(world?.environment!=='outdoor')throw new RangeError('A frozen outdoor world is required');
  const motion=outdoorMotion(world,time),shapes=[],movingFigures=['shrine','river'].includes(typeOf(world));
  if(movingFigures)for(const actor of motion.actors??[])actorShapes(shapes,actor,time,!!options.reducedMotion);
  const dynamic=outdoorDynamicSolids(world,time),actorIds=new Set((motion.actors??[]).map(actor=>actor.id)),actorSolidIds=new Set((motion.actors??[]).flatMap(actor=>(actor.colliders??[]).map(c=>c.id)));
  for(const solid of dynamic){if(actorIds.has(solid.object)||actorIds.has(solid.actorId)||actorSolidIds.has(solid.id)||solid.kind==='actor'||solid.kind==='person'||solid.kind==='crowd'||solid.kind==='student')continue;
    const boat=motion.boats.find(b=>b.id===solid.object),color=boat&&solid.kind==='boat-hull'?(boat.kind==='steamship'?'#587f7b':'#b29462'):surfaceColor(solid,world);
    physicalBox(shapes,solid,color);}
  for(const boat of motion.boats??[])boatDetails(shapes,boat,time,!!options.reducedMotion);
  if(movingFigures){for(const goal of motion.goals??[])aperture(shapes,goal);heldObjects(shapes,motion.actors,motion.goals);}
  batSwing(shapes,world,time,options);
  const lit=typeOf(world)==='river'?lightShapes(shapes,motion.lamps??[]):shapes;
  lit.push(...outdoorLampShapes(motion.lamps??[],{waterY:world.water?.y??0,waterBounds:world.water}));
  lit.push(...outdoorEffectShapes(world,time,options));
  return lit;
}
