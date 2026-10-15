// Shared metre-space primitives keep the approved paper/wood/teal art family.
// Canonical world solids own every gameplay surface; trim is decorative.
import {factoryWorld,factorySolids,factoryGoals,factoryMotion,factoryDynamicSolids} from './factory-world.mjs?v=20261015-factory-necessity-1';
import {factoryEnvironmentStatic,factoryEnvironmentDynamic} from './factory-environment.mjs?v=20261015-factory-necessity-1';
import {factoryMachineryStatic,factoryMachineryDynamic} from './factory-machinery.mjs?v=20261015-factory-necessity-1';
export const FACTORY_PALETTE=Object.freeze({cream:'#f4ead5',wall:'#eee2c6',wood:'#c89b61',teal:'#4a948b',darkTeal:'#286864',gold:'#e8b54e',orange:'#e98238',steel:'#8da69c',floor:'#d7c9ad'});
const p=(x,y,z)=>({x,y,z});
const face=(points,fill,stroke=null,meta={})=>({points,fill,stroke,...meta});
const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const add=(a,b)=>p(a.x+b.x,a.y+b.y,a.z+b.z),scale=(a,n)=>p(a.x*n,a.y*n,a.z*n);
const cross=(a,b)=>p(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const unit=a=>scale(a,1/(Math.hypot(a.x,a.y,a.z)||1));
function box(s,x,y,z,w,h,d,color,meta={}){
  const lo=[p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],hi=lo.map(a=>({...a,y:y+h}));
  for(const [points,n] of [[[lo[0],lo[1],hi[1],hi[0]],0],[[lo[1],lo[2],hi[2],hi[1]],-13],[[lo[2],lo[3],hi[3],hi[2]],-5],[[lo[3],lo[0],hi[0],hi[3]],7],[[hi[0],hi[1],hi[2],hi[3]],17],[[lo[3],lo[2],lo[1],lo[0]],-18]])s.push(face(points,shade(color,n),null,meta));
}
function physicalBox(s,c,color){
  const a=c.min,b=c.max,lo=[p(a.x,a.y,a.z),p(b.x,a.y,a.z),p(b.x,a.y,b.z),p(a.x,a.y,b.z)],hi=lo.map(q=>({...q,y:b.y})),meta={solidId:c.id,physical:true,actorId:c.actorId??c.object};
  for(const [points,n] of [[[lo[0],lo[1],hi[1],hi[0]],0],[[lo[1],lo[2],hi[2],hi[1]],-13],[[lo[2],lo[3],hi[3],hi[2]],-5],[[lo[3],lo[0],hi[0],hi[3]],7],[[hi[0],hi[1],hi[2],hi[3]],17],[[lo[3],lo[2],lo[1],lo[0]],-18]])s.push(face(points,shade(color,n),null,meta));
}
// The divider is its canonical collider, with translucent glazing instead of
// an opaque wall. Edge highlights identify its extent without hiding the goal.
function safetyGlass(s,c){
  const a=c.min,b=c.max,z=(a.z+b.z)/2,meta={solidId:c.id,physical:true,glass:true,depthWrite:false};
  const lo=[p(a.x,a.y,a.z),p(b.x,a.y,a.z),p(b.x,a.y,b.z),p(a.x,a.y,b.z)],hi=lo.map(q=>({...q,y:b.y}));
  for(const points of [[lo[0],lo[1],hi[1],hi[0]],[lo[1],lo[2],hi[2],hi[1]],[lo[2],lo[3],hi[3],hi[2]],[lo[3],lo[0],hi[0],hi[3]],[hi[0],hi[1],hi[2],hi[3]],[lo[3],lo[2],lo[1],lo[0]]])s.push(face(points,'rgba(135,202,201,.12)','rgba(87,145,142,.33)',meta));
  // Thin metal mullions sit on the edge of each glass section, including the
  // low tunnel opening; these marks do not invent an invisible aperture.
  const trim={decoration:true,glassFrameFor:c.id};
  for(const x of [a.x,b.x-.045])box(s,x,a.y,a.z-.018,.045,b.y-a.y,b.z-a.z+.036,'#527b73',trim);
  for(const y of [a.y,b.y-.045])box(s,a.x,y,a.z-.018,b.x-a.x,.045,b.z-a.z+.036,'#8ba99c',trim);
  const w=b.x-a.x,h=b.y-a.y;
  if(w>.4&&h>.6){
    for(const f of [.27,.64]){
      const x=a.x+w*f,y=a.y+h*.40,dx=Math.min(.23,w*.16),dy=Math.min(.65,h*.18);
      line(s,p(x,y,z-.13),p(x+dx,y+dy,z-.13),'rgba(247,255,246,.78)',{decoration:true,glassReflectionFor:c.id});
      line(s,p(x+.07,y,z-.13),p(x+dx+.07,y+dy,z-.13),'rgba(211,242,231,.65)',{decoration:true,glassReflectionFor:c.id});
    }
  }
}
function cylinder(s,x,y,z,r,h,color,n=10,meta={}){
  const lo=Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,y,z+Math.sin(i/n*Math.PI*2)*r)),hi=lo.map(a=>({...a,y:y+h}));
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,Math.round(Math.cos(i/n*Math.PI*2)*9)),null,meta));
  s.push(face(hi,shade(color,14),null,meta));
}
function ellipsoid(s,x,y,z,rx,ry,rz,color,n=8,rows=4,meta={}){
  const at=(a,b)=>p(x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,c=-Math.PI/2+j/rows*Math.PI,d=-Math.PI/2+(j+1)/rows*Math.PI;
    s.push(face([at(a,c),at(b,c),at(b,d),at(a,d)],shade(color,Math.round(Math.sin((c+d)/2)*10+Math.cos(a)*5)),null,meta));
  }
}
const line=(s,a,b,color,meta={})=>s.push({points:[a,b],line:true,stroke:color,...meta});
const flat=(s,x,y,z,w,d,color,meta={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],color,null,meta));
function limb(s,a,b,r,color,meta={}){
  const axis=unit(add(b,scale(a,-1))),right=unit(cross(axis,Math.abs(axis.y)>.8?p(0,0,1):p(0,1,0))),up=cross(axis,right),n=8;
  const ring=q=>Array.from({length:n},(_,i)=>add(q,add(scale(right,Math.cos(i/n*Math.PI*2)*r),scale(up,Math.sin(i/n*Math.PI*2)*r)))),lo=ring(a),hi=ring(b);
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,i%2?-7:5),null,meta));
  s.push(face(hi,shade(color,12),null,meta));
}
function basis(goal){
  const normal=unit(goal.normal??p(0,1,0)),vertical=goal.up??(Math.abs(normal.y)>.8?p(0,0,1):p(0,1,0)),right=unit(cross(vertical,normal)),up=unit(cross(normal,right));
  return {normal,right,up,at:(x,y,d=0)=>add(goal.center,add(scale(right,x),add(scale(up,y),scale(normal,d))))};
}
function opening(s,goal,{colour=FACTORY_PALETTE.gold,depth=.18,pocket=true,net=false}={}){
  const {at,normal}=basis(goal),meta={goalId:goal.id,goalRole:goal.role,goalKind:goal.kind},n=20,t=.04;
  const vertices=extra=>goal.shape==='rectangle'?
    [[-goal.halfWidth-extra,-goal.halfHeight-extra],[goal.halfWidth+extra,-goal.halfHeight-extra],[goal.halfWidth+extra,goal.halfHeight+extra],[-goal.halfWidth-extra,goal.halfHeight+extra]].map(([x,y])=>at(x,y)):
    Array.from({length:n},(_,i)=>at(Math.cos(i/n*Math.PI*2)*(goal.radius+extra),Math.sin(i/n*Math.PI*2)*(goal.radius+extra)));
  const inner=vertices(0),outer=vertices(t),back=inner.map(a=>add(a,scale(normal,-depth)));
  for(let i=0;i<inner.length;i++){const j=(i+1)%inner.length;s.push(face([outer[i],outer[j],inner[j],inner[i]],colour,null,{...meta,opening:true}));}
  if(pocket){s.push(face(back,'#315d57',null,{...meta,pocket:true}));for(let i=0;i<inner.length;i++){const j=(i+1)%inner.length;s.push(face([inner[i],inner[j],back[j],back[i]],shade(FACTORY_PALETTE.teal,i%2?-8:7),null,meta));}}
  if(net){for(let i=0;i<inner.length;i+=2){const a=inner[i],b=add(goal.center,add(scale(normal,-.65),scale(add(a,scale(goal.center,-1)),.58)));line(s,a,b,'#e7debd',{...meta,net:true});line(s,b,add(goal.center,add(scale(normal,-.38),scale(add(inner[(i+2)%inner.length],scale(goal.center,-1)),.76))),'#e7debd',{...meta,net:true});}}
}
// The eccentric chapter imports this small primitive kit rather than copying
// a second renderer or introducing a scene graph dependency.
export const scenePrimitives=Object.freeze({p,face,shade,add,scale,cross,unit,box,physicalBox,cylinder,ellipsoid,line,flat,limb,basis,opening});
const cache=new Map();
function requireWorld(world){const saved=factoryWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A frozen factory world is required');return saved;}
const colourOf=c=>c.kind==='factory-wall'?FACTORY_PALETTE.wall:['factory-pillar','factory-beam'].includes(c.kind)?'#86a195':c.kind==='machine-frame'?c.max.y-c.min.y>.5?'#587f77':'#748e80':c.kind==='machine-reflector'?'#bfcfc5':c.kind==='conveyor-leg'?'#64887a':c.kind==='conveyor'?'#477e77':c.kind==='bank-rail'?'#9caf98':c.kind==='pressure-plate'?'#c3a266':c.kind==='collection-bin'?FACTORY_PALETTE.teal:FACTORY_PALETTE.steel;
function factoryDecor(s,world){
  const r=world.room,meta={decoration:true},revised=world.worldVersion>=26;flat(s,r.minX,.008,r.minZ,r.maxX-r.minX,r.maxZ-r.minZ,FACTORY_PALETTE.floor,meta);
  for(let x=r.minX+.25;x<r.maxX;x+=.8)line(s,p(x,.012,r.minZ),p(x,.012,r.maxZ),'#cbbd9f',meta);
  for(let z=r.minZ+.4;z<r.maxZ;z+=.8)line(s,p(r.minX,.012,z),p(r.maxX,.012,z),'#cbbd9f',meta);
  // Released world15–18 keeps its decorative facade for old replay meaning.
  // Revised live worlds draw the same visible wall from its actual collider.
  if(!revised)box(s,r.minX-.25,0,r.maxZ+.2,r.maxX-r.minX+.5,5.8,.15,FACTORY_PALETTE.wall,meta);
  for(const x of [-3.25,1.75]){box(s,x,2.5,r.maxZ+.175,1.5,1.4,.025,'#a9c3b6',meta);for(const dx of [.45,.95])box(s,x+dx,2.5,r.maxZ+.15,.035,1.4,.025,'#ede1c5',meta);box(s,x,3.15,r.maxZ+.15,1.5,.035,.025,'#ede1c5',meta);}
  if(!revised)for(const z of [2.5,7.6]){box(s,r.minX-.13,0,z,.16,5.6,.20,'#86a195',meta);box(s,r.maxX-.03,0,z,.16,5.6,.20,'#86a195',meta);box(s,r.minX-.13,5.48,z,r.maxX-r.minX+.26,.14,.20,'#86a195',meta);}
  box(s,-1.12,5.10,r.maxZ+.155,2.24,.43,.035,'#396f68',meta);
  for(let x=-.85;x<1;x+=.42)box(s,x,5.24,r.maxZ+.14,.23,.07,.014,'#eddaaa',meta);
  const z=world.origin.z;flat(s,world.origin.x-.35,.021,z-.31,.7,.54,'#dbb776',meta);
  // Side markings explain machine areas, without drawing a throw solution.
  for(const side of [-1,1])for(let i=0;i<6;i++){
    const x=side<0?r.minX+.28:r.maxX-.61,z=1.05+i*.46;
    s.push(face([p(x,.016,z),p(x+.30,.016,z+.15),p(x+.30,.016,z+.28),p(x,.016,z+.13)],i%2?'#bfad87':'#e3c779',null,meta));
  }
  if(!revised&&(world.factoryType==='shutter'||world.factoryType==='relay')){
    const q=world.mechanism;for(const x of [q.min.x-.16,q.max.x+.04])box(s,x,0,q.min.z-.06,.12,5.5,.32,'#587f77',{machineTrim:q.id});
    box(s,q.min.x-.16,5.18,q.min.z-.08,q.max.x-q.min.x+.32,.25,.36,'#748e80',{machineTrim:q.id});
  }
  if(!revised&&world.factoryType==='conveyor'){
    const belt=factorySolids(world).find(c=>c.kind==='conveyor');for(const x of [belt.min.x+.08,belt.max.x-.13])for(const z of [belt.min.z+.20,belt.max.z-.33])box(s,x,.02,z,.05,belt.min.y-.02,.10,'#64887a',{beltLeg:true});
  }
  if(world.factoryType==='relay'){
    const q=world.mechanism.plateCenter;for(const x of [q.x-.7,q.x+.7])line(s,p(x,.02,q.z-.7),p(x,.02,q.z+.7),'#bc9b62',meta);
    line(s,p(q.x,.02,q.z+.8),p(q.x,.02,world.mechanism.min.z-.2),'#b0a27e',{relayWire:true});
  }
}
export function factoryStaticMeshes(world){
  world=requireWorld(world);const key=`${world.stageId}:${world.worldVersion}`;if(cache.has(key))return cache.get(key);
  const shapes=[],glazing=[];for(const solid of factorySolids(world)){if([44,45].includes(world.worldVersion)&&solid.kind==='safety-glass')glazing.push(solid);else physicalBox(shapes,solid,colourOf(solid));}
  factoryDecor(shapes,world);for(const goal of factoryGoals(world,0))opening(shapes,goal);
  shapes.push(...factoryMachineryStatic(world,scenePrimitives),...factoryEnvironmentStatic(world,scenePrimitives));
  for(const glass of glazing)safetyGlass(shapes,glass);
  cache.set(key,shapes);return shapes;
}
function doorDetail(s,door,time){
  const meta={mechanismId:door.id},z=door.min.z-.008;
  for(let y=door.min.y+.10;y<door.max.y-.02;y+=.27)line(s,p(door.min.x+.02,y,z),p(door.max.x-.02,y,z),'#6d9489',meta);
  for(const side of [-1,1]){const x=side<0?door.min.x+.05:door.max.x-.18;box(s,x,door.min.y+.025,z-.008,.13,.14,.013,door.open?'#e3c774':'#ba9170',meta);}
  box(s,-.28,door.min.y+.08,z-.018,.56,.042,.025,'#c4cead',meta);
}
function parkedBall(s,ball){const q=ball.position;ellipsoid(s,q.x,q.y,q.z,ball.radius,ball.radius,ball.radius,'#7a8b88',12,6,{actorId:ball.id,parkedBall:true,physical:true,itemId:ball.itemId});}
export function factoryDynamicMeshes(world,time=0,options={}){
  world=requireWorld(world);const session=options.session??options.game?.factorySession??options.game?.session,motion=factoryMotion(world,time,session),shapes=[];
  for(const solid of factoryDynamicSolids(world,time,session)){if(solid.kind==='parked-ball')continue;physicalBox(shapes,solid,world.worldVersion===45&&solid.kind==='piston-face'?'#b7c9bc':'#91aaa0');}
  for(const door of [motion.shutter,motion.gate])if(door)doorDetail(shapes,door,time);
  if(motion.belt){
    const belt=factorySolids(world).find(c=>c.kind==='conveyor'),gap=.44,offset=((motion.belt.offset%gap)+gap)%gap,y=belt.max.y+.006;
    for(let z=belt.min.z+offset;z<belt.max.z-.10;z+=gap){line(shapes,p(belt.min.x+.07,y,z),p(belt.max.x-.07,y,z),'#adc2a5',{beltSlat:true,mechanismId:motion.belt.id});}
    for(const x of [belt.min.x+.02,belt.max.x-.06])flat(shapes,x,y,belt.min.z,.035,belt.max.z-belt.min.z,'#d1b978',{beltEdge:true});
  }
  for(const ball of motion.balls)parkedBall(shapes,ball);
  if(world.factoryType==='relay'){
    const plate=factorySolids(world).find(c=>c.kind==='pressure-plate'),color=motion.plate.pressed?'#e6c264':'#9fac91';
    flat(shapes,plate.min.x+.045,plate.max.y+.008,plate.min.z+.045,plate.max.x-plate.min.x-.09,plate.max.z-plate.min.z-.09,color,{plateId:plate.id,pressed:motion.plate.pressed});
  }
  for(const witness of world.worldVersion===45?[]:motion.bankLights){const rail=factorySolids(world).find(c=>c.id===witness.id),x=(rail.min.x+rail.max.x)/2;ellipsoid(shapes,x,rail.max.y+.10,rail.min.z+.13,.07,.07,.07,witness.lit?'#f2d378':'#819b88',8,3,{bankWitnessId:witness.id,lit:!!witness.lit});}
  shapes.push(...factoryMachineryDynamic(world,motion,time,scenePrimitives),...factoryEnvironmentDynamic(world,time,scenePrimitives,{reducedMotion:options.reducedMotion===true}));
  return shapes;
}
export function factoryCameraConfig(world){world=requireWorld(world);return {azimuth:world.view.azimuth,elevation:world.view.elevation,zoom:1};}
export function factoryScene(camera,world){world=requireWorld(world);return {shapes:factoryStaticMeshes(world),cutaway:[],groups:factorySolids(world).map(c=>({id:c.id,physical:true,bounds:{minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z}})),stageId:world.stageId,worldVersion:world.worldVersion};}
export const factoryMotionShapes=(time,world,options={})=>factoryDynamicMeshes(world,time,options);
