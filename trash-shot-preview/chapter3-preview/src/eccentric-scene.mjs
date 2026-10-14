// Chapter 5 changes places and objects while keeping the approved faceted,
// warm paper / teal material language and the production metre-space camera.
import {eccentricWorld,eccentricSolids,eccentricDynamicSolids,eccentricMotion} from './eccentric-world.mjs?v=20261014-tower-train-2';
import {scenePrimitives,FACTORY_PALETTE} from './factory-scene.mjs?v=20261014-tower-train-2';
import {throwablePose} from './throwable-physics.mjs?v=20261014-tower-train-2';
import {tokyoTowerStaticMeshes,tokyoTowerGroups} from './tokyo-tower-scene.mjs?v=20261014-tower-train-2';
import {trainWindowStaticMeshes,trainWindowDynamicMeshes,trainWindowCutaway} from './train-window-scene.mjs?v=20261014-tower-train-2';
const {p,face,shade,add,scale,cross,unit,box,physicalBox,cylinder,ellipsoid,line,flat,limb,basis,opening}=scenePrimitives;
export const ECCENTRIC_PALETTE=Object.freeze({...FACTORY_PALETTE,sky:'#bfdedb',green:'#8caf7d',grass:'#a9bd8f',bark:'#9b805b',stone:'#b8b799',water:'#86b5ad'});
const cache=new Map(),axes=['x','y','z'];
function requireWorld(world){const saved=eccentricWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A frozen eccentric world is required');return saved;}
function tree(s,x,z,scale=1,{trunk=true}={}){
  if(trunk)cylinder(s,x,0,z,.15*scale,1.8*scale,ECCENTRIC_PALETTE.bark,8,{decoration:true});
  ellipsoid(s,x,2.5*scale,z,.85*scale,1.05*scale,.77*scale,'#8bac79',8,4,{foliage:true});
  ellipsoid(s,x-.4*scale,2.8*scale,z+.08*scale,.57*scale,.7*scale,.60*scale,'#a7bf85',8,3,{foliage:true});
}
function colourOf(c){
  if(/rim|rail/.test(c.kind))return ECCENTRIC_PALETTE.gold;
  if(c.kind==='bin-body')return ECCENTRIC_PALETTE.teal;
  if(c.kind==='tree')return ECCENTRIC_PALETTE.bark;
  if(c.kind==='soil')return '#9a8963';
  if(c.kind==='planter')return '#c39b6c';
  if(c.kind==='backboard')return '#eee7cf';
  if(c.kind==='post'||c.kind==='stand')return '#6b9688';
  if(c.kind==='target-board')return '#bf9763';
  if(c.kind==='door')return '#a28359';
  if(c.kind==='wall')return '#bab797';
  return '#c3b48f';
}
function city(s,world){
  const meta={decoration:true};flat(s,-10,.006,-4,20,26,'#c3c8af',meta);
  flat(s,-2,.012,3,4,18,'#9fae9d',meta);for(let z=4;z<20;z+=1.4)flat(s,-.04,.017,z,.08,.48,'#eee4c6',meta);
  // Distant blocks flank the landing street. Their scale and repeated windows
  // establish the long drop while keeping the actual goal corridor open.
  for(const side of [-1,1])for(let i=0;i<4;i++){
    const x=side<0?-9+i*.75:4+i*.75,z=3+i*4.6,h=2.2+(i%3)*1.1,w=2.3;
    box(s,x,0,z,w,h,2.8,i%2?'#d5d0b0':'#bed0b7',meta);
    for(let y=.6;y<h-.2;y+=.75)for(let xx=x+.3;xx<x+w-.2;xx+=.7)box(s,xx,y,z-.012,.35,.36,.014,'#8cae9e',meta);
  }
  const tower={decoration:true,landmark:'tokyo-tower'},z=-1.95;
  // The lattice stands below the canonical observation platform, so this
  // cosmetic landmark does not introduce an invisible flight obstacle.
  for(const side of [-1,1])limb(s,p(side*2.35,0,z),p(side*.68,17,z),.17,'#c98056',tower);
  for(let y=1;y<16;y+=2.4){const w=2.35-y/17*1.65;limb(s,p(-w,y,z),p(w-.23,y+2.25,z),.055,'#d99c6c',tower);limb(s,p(w,y,z),p(-w+.23,y+2.25,z),.055,'#d99c6c',tower);line(s,p(-w,y,z),p(w,y,z),'#e6be88',tower);}
  box(s,-.8,17.08,-2.58,1.6,.34,1.5,'#d59865',tower);
  for(const x of [-.7,.05])box(s,x,17.42,-2.6,.55,.55,.035,'#c0d1b6',tower);
  limb(s,p(0,17.76,-2),p(0,22.8,-2),.09,'#dcac76',tower);
}
function railStation(s){
  const meta={decoration:true};flat(s,-10,.006,-4,20,26,'#c1baa0',meta);
  // Rails run along the actual source motion direction, visibly underneath
  // the moving train rather than shifting scenery behind a fixed launcher.
  for(const z of [-3.7,1.7])for(let x=-10;x<10;x+=.7)box(s,x,.013,z-.4,.21,.035,.8,'#a38c66',meta);
  for(const z of [-3.8,-3.0,1.6,2.4])line(s,p(-10,.066,z),p(10,.066,z),'#738e7c',meta);
  flat(s,-3.0,.07,7.4,6,5.2,'#d7c9ac',meta);
  for(let x=-2.8;x<3;x+=.55)flat(s,x,.075,7.4,.32,.11,'#e5be6b',meta);
  box(s,-4,0,13,8,3.5,.14,'#ddcfb0',meta);
  for(const x of [-3.3,-1.1,1.1]){box(s,x,1.1,12.98,1.4,1.8,.016,'#98b7a6',meta);box(s,x,2.91,12.96,1.4,.22,.016,'#56867a',meta);}
  for(const x of [-7,7])tree(s,x,13,1.2);
}
function forest(s,world){
  flat(s,-10,.006,-4,20,26,'#aac096',{decoration:true});
  flat(s,-1.1,.009,-1.5,2.2,11,'#d7c49a',{decoration:true});
  for(const c of eccentricSolids(world).filter(c=>c.kind==='tree')){
    const x=(c.min.x+c.max.x)/2,z=(c.min.z+c.max.z)/2;tree(s,x,z,1.55,{trunk:false});
  }
  for(const [x,z,q] of [[-4.1,8,1.3],[4.2,9,1.4],[-6.1,3,1.1],[6.1,2,1.4],[-4.5,14,1.6],[4.6,15,1.5]])tree(s,x,z,q);
  for(let i=0;i<15;i++){
    const side=i%2?-1:1,x=side*(2.4+(i%4)*.7),z=1+i*.66;ellipsoid(s,x,.12,z,.22,.16,.18,['#a3b37e','#b5c48f','#c8b57b'][i%3],8,3,{decoration:true});
  }
}
function court(s,world){
  const meta={decoration:true};flat(s,-5,.006,-3,10,13,'#d6bc91',meta);
  for(let x=-4.8;x<5;x+=.55)line(s,p(x,.009,-3),p(x,.009,10),'#c4ad82',meta);
  for(const x of [-3,3])line(s,p(x,.014,-1),p(x,.014,8),'#f4ead5',meta);
  for(const z of [-1,8])line(s,p(-3,.014,z),p(3,.014,z),'#f4ead5',meta);
  for(const x of [-1.1,1.1])line(s,p(x,.014,3),p(x,.014,7.6),'#f4ead5',meta);
  const rim=world.goals[0];opening(s,rim,{colour:'#d58f53',pocket:false,net:true});
  const back=eccentricSolids(world).find(c=>c.kind==='backboard'),z=back.min.z-.012;
  for(const x of [-.31,.31])line(s,p(x,3.12,z),p(x,3.65,z),'#8da293',meta);
  for(const y of [3.12,3.65])line(s,p(-.31,y,z),p(.31,y,z),'#8da293',meta);
  // The pole and rim are the canonical solids; this tiny floor shadow is
  // paint only, keeping the airborne opening recognisable from either camera.
  flat(s,-.27,.015,6.64,.54,.7,'#b1a887',meta);
  for(const x of [-5.7,5.7])tree(s,x,9,1.25);
}
function flower(s,x,y,z,height,color,meta={}){
  line(s,p(x,y,z),p(x,y+height,z),'#69966d',meta);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipsoid(s,x+Math.cos(a)*.038,y+height,z+Math.sin(a)*.038,.033,.022,.033,color,6,2,meta);}
  ellipsoid(s,x,y+height+.011,z,.02,.02,.02,'#d9b15b',6,2,meta);
}
function meadow(s,world){
  const meta={decoration:true};flat(s,-10,.006,-4,20,26,'#b4c697',meta);
  flat(s,-.65,.009,-1.2,1.3,3.8,'#dfcea7',meta);
  for(let i=0;i<18;i++){const x=(i%2?-1:1)*(1.7+(i%4)*.6),z=-.3+Math.floor(i/2)*.74;flower(s,x,.01,z,.18+(i%3)*.04,['#e8bd66','#e9d5b2','#c9a38f'][i%3],meta);}
  const soil=eccentricSolids(world).find(c=>c.kind==='soil');
  for(let i=0;i<8;i++)flower(s,soil.min.x+.22+(i%4)*.55,soil.max.y+.006,soil.min.z+.30+Math.floor(i/4)*1.08,.14,['#e3b564','#dfcaaa'][i%2],{flowerbedPlant:true});
  for(const x of [-5.5,5.8])tree(s,x,9,1.0);
}
function cardRange(s,world){
  const meta={decoration:true};flat(s,-5,.006,-3,10,13,'#d6c9ac',meta);
  box(s,-5,0,9.4,10,4.6,.12,'#e5d9be',meta);
  for(const x of [-4.3,2.9]){box(s,x,.6,9.37,1.4,2.4,.016,'#b7cbb2',meta);box(s,x-.07,3,9.35,1.54,.12,.016,'#8aab91',meta);}
  const goal=world.goals[0],b=basis(goal),m={targetMark:goal.id};
  // Painted cork grains and nested rings stay on the actual hit plane.
  for(const radius of [.24,.47,.64]){
    const points=Array.from({length:24},(_,i)=>b.at(Math.cos(i*Math.PI/12)*radius,Math.sin(i*Math.PI/12)*radius,.007));
    for(let i=0;i<points.length;i++)line(s,points[i],points[(i+1)%points.length],radius===.24?'#8b7553':'#ad8c61',m);
  }
  for(let y=-.59;y<.70;y+=.24)for(let x=-.61;x<.63;x+=.24)line(s,b.at(x,y,.008),b.at(x+.028,y+.01,.008),'#aa865d',m);
  flat(s,-.6,.013,-.4,1.2,.7,'#d7b66b',meta);
}
function fort(s,world){
  const meta={decoration:true};flat(s,-10,.006,-4,20,26,'#c3c59e',meta);
  flat(s,-1.55,.01,-.2,3.1,15.1,'#d8c496',meta);
  // Stone joints are flat paint on the canonical fort walls.
  for(const wall of eccentricSolids(world).filter(c=>c.kind==='wall')){
    const z=wall.min.z-.014,paint={...meta,stoneJointId:wall.id};
    for(let y=wall.min.y+.65;y<wall.max.y;y+=.7)line(s,p(wall.min.x+.02,y,z),p(wall.max.x-.02,y,z),'#a5a88b',paint);
    for(let row=0;wall.min.y+row*.7+.05<wall.max.y;row++)for(let x=wall.min.x+.38+(row%2)*.4;x<wall.max.x-.15;x+=.95)
      line(s,p(x,wall.min.y+row*.7+.05,z),p(x,Math.min(wall.max.y-.012,wall.min.y+row*.7+.62),z),'#a5a88b',paint);
  }
  const door=eccentricSolids(world).find(c=>c.kind==='door'),z=door.min.z-.016;
  for(let x=door.min.x+.20;x<door.max.x-.03;x+=.30)line(s,p(x,.06,z),p(x,door.max.y-.04,z),'#8b704e',meta);
  for(const y of [1,3.1])box(s,door.min.x+.08,y,z-.009,door.max.x-door.min.x-.16,.11,.018,'#677b64',meta);
  for(const x of [-6.8,5.5]){
    box(s,x,6,15.13,1.3,.45,.4,'#b7b899',meta);box(s,x+.05,6.45,15.16,.29,.28,.32,'#b7b899',meta);box(s,x+.95,6.45,15.16,.29,.28,.32,'#b7b899',meta);
  }
  for(const x of [-8.7,8.7])tree(s,x,9,1.4);
}
function fixedGoals(s,world){
  if(world.worldVersion===39||['boar','basket'].includes(world.eccentricType))return;
  for(const goal of world.goals){
    const hit=goal.mode==='hit';opening(s,goal,{colour:world.eccentricType==='dandelion'?'#d8c092':ECCENTRIC_PALETTE.gold,pocket:!hit&&world.eccentricType!=='dandelion'});
  }
}
export function eccentricStaticMeshes(world){
  world=requireWorld(world);const key=`${world.stageId}/${world.worldVersion}`;if(cache.has(key))return cache.get(key);
  const shapes=[];
  if(world.worldVersion===39)shapes.push(...trainWindowStaticMeshes(world));
  else{
    for(const solid of eccentricSolids(world))if(!(world.worldVersion===38&&solid.renderedBy==='tokyo-tower-scene'))physicalBox(shapes,solid,colourOf(solid));
    if(world.worldVersion===38)shapes.push(...tokyoTowerStaticMeshes(world));
    else ({tower:city,train:railStation,boar:forest,basket:court,dandelion:meadow,card:cardRange,cannon:fort})[world.eccentricType](shapes,world);
  }
  fixedGoals(shapes,world);cache.set(key,shapes);return shapes;
}
function boarShapes(s,actor,solid){
  const model=[],meta={actorId:actor.id},q=actor.position;
  ellipsoid(model,0,.63,.28,.58,.38,.58,'#937754',12,6,meta);
  ellipsoid(model,0,.66,-.25,.40,.35,.32,'#8b6e50',10,6,meta);
  ellipsoid(model,0,.56,-.51,.21,.14,.12,'#ad8b64',8,4,meta);
  for(const side of [-1,1]){
    cylinder(model,side*.33,.04,.15,.10,.38,'#765f46',8,meta);cylinder(model,side*.31,.04,.48,.10,.38,'#765f46',8,meta);
    model.push(face([p(side*.32,.90,-.34),p(side*.09,.96,-.31),p(side*.35,1.12,-.10)],'#8b7050',null,meta));
    ellipsoid(model,side*.22,.73,-.51,.035,.026,.015,'#3e4b3b',8,3,meta);ellipsoid(model,side*.09,.59,-.619,.02,.026,.012,'#6c5840',6,2,meta);
    limb(model,p(side*.20,.48,-.52),p(side*.26,.66,-.63),.026,'#eadbb7',meta);
  }
  for(let i=0;i<5;i++)model.push(face([p(-.033,.98,.01+i*.11),p(.033,.98,.01+i*.11),p(0,1.065,-.025+i*.11)],'#685841',null,meta));
  const all=model.flatMap(shape=>shape.points),lo=Object.fromEntries(axes.map(k=>[k,Math.min(...all.map(a=>a[k]))])),hi=Object.fromEntries(axes.map(k=>[k,Math.max(...all.map(a=>a[k]))]));
  for(const shape of model)s.push({...shape,physical:true,points:shape.points.map(a=>Object.fromEntries(axes.map(k=>[k,solid.min[k]+(a[k]-lo[k])/(hi[k]-lo[k])*(solid.max[k]-solid.min[k])])))});
  flat(s,solid.min.x,.013,solid.min.z,solid.max.x-solid.min.x,solid.max.z-solid.min.z,'#91a778',{actorShadow:actor.id});
}
function trainDetails(s,solid,motion){
  const meta={trainDetail:true,actorId:'roof-train'},a=solid.min,b=solid.max;
  for(const side of [-1,1]){
    const z=side<0?a.z-.007:b.z+.007;
    for(let x=a.x+.32;x<b.x-.68;x+=1.10){const width=Math.min(.72,b.x-x-.22);s.push(face([p(x,1.1,z),p(x+width,1.1,z),p(x+width,2.05,z),p(x,2.05,z)],'#b8d1b6',null,{...meta,trainWindow:true}));line(s,p(x+width/2,1.1,z),p(x+width/2,2.05,z),'#e9e0c1',meta);}
    for(const y of [.56,2.35])line(s,p(a.x+.05,y,z),p(b.x-.05,y,z),y>.6?'#dcc18a':'#d99c62',meta);
  }
  for(const x of [a.x+.55,b.x-.55])for(const z of [a.z+.025,b.z-.025])ellipsoid(s,x,.19,z,.22,.19,.075,'#627c68',8,4,{...meta,trainWheel:true});
  for(const x of [a.x-.008,b.x+.008])for(const z of [a.z+.3,b.z-.3])ellipsoid(s,x,.77,z,.012,.071,.071,'#e9c77c',8,4,{...meta,trainLamp:true});
  const frame=motion.launchFrame;flat(s,frame.origin.x-.32,b.y+.008,frame.origin.z-.29,.64,.58,'#e0bd75',{launchPlatform:true,launchFrame:{...frame.origin}});
  for(const x of [a.x+.32,b.x-.94])box(s,x,b.y+.006,(a.z+b.z)/2-.27,.62,.09,.54,'#d9dcc0',meta);
}
function cannonShapes(s,world,options){
  const q=world.cannon.position,flight=options.flightTime??options.game?.time??0,phase=options.phase??options.game?.phase,active=phase==='flying'&&flight<.45,back=active?Math.sin(Math.min(1,flight/.45)*Math.PI)*.14:0;
  const angle=(options.aim?.elevation??world.launch.elevation)*Math.PI/180,heading=(options.aim?.yaw??world.launch.yaw)*Math.PI/180;
  const mouth=add(world.origin,p(-Math.sin(heading)*back,-Math.sin(angle)*back,-Math.cos(heading)*back)),rear=add(mouth,p(-Math.sin(heading)*.95*Math.cos(angle),-.95*Math.sin(angle),-.95*Math.cos(heading)*Math.cos(angle))),meta={cannonBarrel:true,recoil:back};
  box(s,q.x-.49,.12,q.z-.24,.98,.36,.87,'#b1925d',{cannonCarriage:true});
  for(const x of [q.x-.51,q.x+.51]){ellipsoid(s,x,.4,q.z+.15,.075,.32,.32,'#8d805a',8,4,{cannonWheel:true});line(s,p(x,.4,q.z-.13),p(x,.4,q.z+.44),'#c6ad72',{cannonWheel:true});}
  limb(s,rear,mouth,.17,'#496e65',meta);
  const axis=unit(add(mouth,scale(rear,-1))),right=unit(cross(axis,p(0,1,0))),up=unit(cross(right,axis));
  const ring=(r)=>Array.from({length:16},(_,i)=>add(mouth,add(scale(right,Math.cos(i*Math.PI/8)*r),scale(up,Math.sin(i*Math.PI/8)*r)))),outer=ring(.19),inner=ring(.12);
  for(let i=0;i<16;i++)s.push(face([outer[i],outer[(i+1)%16],inner[(i+1)%16],inner[i]],'#8ba18a',null,{cannonMouth:true}));
  s.push(face(inner,'#284a43',null,{cannonMouth:true}));
  if(active)for(let i=0;i<3;i++){
    const age=Math.min(1,flight/.45),a=add(mouth,scale(axis,.12+i*.10+age*.24));ellipsoid(s,a.x,a.y,a.z,.055+age*.11,.06+age*.10,.07+age*.12,'#d9d8bd',8,3,{cannonSmoke:true,depthWrite:false});
  }
}
export function eccentricDynamicMeshes(world,time=0,options={}){
  world=requireWorld(world);if(world.worldVersion===39)return trainWindowDynamicMeshes(world,time,options);
  const motion=eccentricMotion(world,time),solids=eccentricDynamicSolids(world,time),shapes=[];
  for(const solid of solids){if(solid.kind==='boar')continue;physicalBox(shapes,solid,'#629487');}
  if(motion.train)trainDetails(shapes,solids.find(c=>c.kind==='train-roof'),motion);
  for(const actor of motion.actors){const solid=solids.find(c=>c.object===actor.id);if(actor.kind==='boar'&&solid)boarShapes(shapes,actor,solid);}
  if(world.eccentricType==='boar')for(const goal of motion.goals)opening(shapes,goal,{colour:'#ae956c',pocket:false});
  if(world.eccentricType==='dandelion'){
    const t=options.reducedMotion?0:time;for(let i=0;i<6;i++){
      const f=((t*.13+i*.17)%1+1)%1,x=-3+f*6,y=.5+i*.19,z=1.4+i*.42;line(shapes,p(x,y,z),p(x+.20,y+.03,z+.11),'#d6dfb8',{ambientWind:true,depthWrite:false});
    }
  }
  if(world.eccentricType==='cannon')cannonShapes(shapes,world,options);
  if(world.eccentricType==='cannon'&&(options.phase??options.game?.phase)==='success'){
    // Capture has already been decided by the contact adapter. These marks
    // simply make that real door hit visible; they never run another test.
    const goal=motion.goals[0],b=basis(goal),meta={fortImpact:true,goalId:goal.id};
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,r=.33+(i%3)*.09;
      line(shapes,b.at(Math.cos(a)*.13,Math.sin(a)*.13,.023),b.at(Math.cos(a)*r,Math.sin(a)*r,.024),'#ead196',meta);
      line(shapes,b.at(Math.cos(a)*r,Math.sin(a)*r,.024),b.at(Math.cos(a+.18)*(r+.12),Math.sin(a+.18)*(r+.12),.024),'#7b7254',meta);
    }
  }
  return shapes;
}
export function eccentricItemMeshes(game,itemOrShape){
  const shape=typeof itemOrShape==='string'?itemOrShape:itemOrShape?.shape??itemOrShape?.id;
  if(!['arrow','basketball','dandelion','playing-card','cannonball'].includes(shape))return null;
  const center=game?.can?.position,r=game?.can?.radius;if(!center||!Number.isFinite(r))return [];
  const velocity=game.can.velocity??p(0,0,1),captured=game.impactPose??game.capturePose??game.course?.capturePose??game.courseTrace?.capturePose,dir=captured?.incomingVelocity??captured?.direction??captured?.incomingDirection??velocity;
  const forward=unit(Math.hypot(dir.x,dir.y,dir.z)>.00001?dir:p(0,0,1)),right=unit(cross(p(0,1,0),Math.abs(forward.y)>.95?p(0,0,1):forward)),up=unit(cross(forward,right)),shapes=[],time=game.time??0;
  const pose=captured?.orientation??throwablePose(game),euler=a=>{
    const cp=Math.cos(pose.pitch),sp=Math.sin(pose.pitch),cy=Math.cos(pose.yaw),sy=Math.sin(pose.yaw),cr=Math.cos(pose.roll),sr=Math.sin(pose.roll);
    const b=p(a.x,a.y*cp-a.z*sp,a.y*sp+a.z*cp),c=p(b.x*cy+b.z*sy,b.y,-b.x*sy+b.z*cy);
    return add(center,p(c.x*cr-c.y*sr,c.x*sr+c.y*cr,c.z));
  };
  const transform=a=>shape==='playing-card'||shape==='arrow'&&(captured||game.phase==='success')?euler(a):add(center,add(scale(right,a.x),add(scale(up,a.y),scale(forward,a.z))));
  const local=[];
  if(shape==='arrow'){
    const length=Math.max(.36,r*8);limb(local,p(0,0,-length*.55),p(0,0,length*.44),Math.max(.008,r*.20),'#916d47',{itemShape:shape});
    local.push(face([p(-r*.55,0,length*.30),p(r*.55,0,length*.30),p(0,0,length*.62)],'#47685a',null,{itemShape:shape}));
    for(const a of [0,Math.PI/2,Math.PI])local.push(face([p(0,0,-length*.50),p(Math.cos(a)*r*.85,Math.sin(a)*r*.85,-length*.43),p(Math.cos(a)*r*.70,Math.sin(a)*r*.70,-length*.23),p(0,0,-length*.25)],'#e4d9b7',null,{itemShape:shape}));
  }else if(shape==='playing-card'){
    const w=Math.max(.045,r*1.9),h=w*1.4,point=(x,y,z=0)=>p(x,y,z);
    const front=[point(-w/2,-h/2),point(w/2,-h/2),point(w/2,h/2),point(-w/2,h/2)];local.push(face(front,'#f4ead5','#496f66',{itemShape:shape}));
    for(const x of [-w*.3,w*.3])local.push(face([point(x-w*.075,h*.28,.001),point(x,h*.35,.001),point(x+w*.075,h*.28,.001),point(x,h*.21,.001)],'#b47560',null,{cardSuit:true}));
    local.push(face(front.map(a=>({...a,z:-.003})),'#386f66','#f0e4c8',{itemShape:shape,cardBack:true}));
    local.push(face([point(-w*.22,0,-.0035),point(0,h*.28,-.0035),point(w*.22,0,-.0035),point(0,-h*.28,-.0035)],'#e8d3a4',null,{cardBackPattern:true}));
    const backBorder=[point(-w*.37,-h*.39,-.0035),point(w*.37,-h*.39,-.0035),point(w*.37,h*.39,-.0035),point(-w*.37,h*.39,-.0035)];
    for(let i=0;i<4;i++)line(local,backBorder[i],backBorder[(i+1)%4],'#d9c9a1',{cardBackPattern:true});
  }else if(shape==='dandelion'){
    ellipsoid(local,0,0,0,r*.47,r*.47,r*.47,'#e4d6b0',8,4,{itemShape:shape});
    for(let i=0;i<15;i++){
      const a=i*Math.PI*2/15,b=-.5+(i%5)*.24,q=p(Math.cos(a)*r*Math.cos(b),Math.sin(b)*r,Math.sin(a)*r*Math.cos(b));
      line(local,p(0,0,0),q,'#efe9d3',{itemShape:shape});for(const offset of [-.18,0,.18])line(local,q,add(q,p(Math.cos(a+offset)*r*.26,r*.19,Math.sin(a+offset)*r*.26)),'#f4edd9',{itemShape:shape});
    }
    line(local,p(0,-r*.22,0),p(0,-r*1.15,-r*.23),'#aeb68b',{itemShape:shape});
  }else{
    const color=shape==='basketball'?'#d99550':'#647d71';ellipsoid(local,0,0,0,r*.98,r*.98,r*.98,color,16,8,{itemShape:shape});
    if(shape==='basketball')for(const plane of ['x','z']){
      const ring=Array.from({length:25},(_,i)=>{const a=i*Math.PI/12;return plane==='x'?p(0,Math.sin(a)*r,Math.cos(a)*r):p(Math.cos(a)*r,Math.sin(a)*r,0);});
      for(let i=1;i<ring.length;i++)line(local,ring[i-1],ring[i],'#8b673f',{basketballSeam:true});
    }
  }
  for(const mesh of local)shapes.push({...mesh,points:mesh.points.map(transform)});
  return shapes;
}
export function eccentricCameraConfig(world){world=requireWorld(world);return {azimuth:world.view.azimuth,elevation:world.view.elevation,zoom:1};}
export function eccentricScene(camera,world){world=requireWorld(world);return {shapes:eccentricStaticMeshes(world),cutaway:world.worldVersion===39?trainWindowCutaway(world,camera):[],groups:[...eccentricSolids(world).map(c=>({id:c.id,physical:true,bounds:{minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z}})),...(world.worldVersion===38?tokyoTowerGroups(world):[])],stageId:world.stageId,worldVersion:world.worldVersion};}
export const eccentricMotionShapes=(time,world,options={})=>eccentricDynamicMeshes(world,time,options);
