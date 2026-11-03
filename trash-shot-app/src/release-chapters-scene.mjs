// All obstacle and moving receiver faces use the same metre-space bounds as
// contacts. Painted floor marks and open aperture outlines are decoration.
import {releaseChapterWorld,releaseChapterGoals,releaseChapterDynamicSolids} from './release-chapters-world.mjs?v=20261018-chapters67-1';
import {rooftopDetails,rooftopMotionShapes,rooftopVisibleShapes} from './rooftop-scene.mjs';
const p=(x,y,z)=>({x,y,z}),face=(points,fill,metadata={})=>({points,fill,stroke:null,...metadata});
const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const requireWorld=w=>{const fixed=releaseChapterWorld(w?.stageId,w?.worldVersion);if(!fixed)throw new RangeError('A fixed release chapter world is required');return fixed;};
function physicalBox(s,c,color){const a=c.min,b=c.max,lo=[p(a.x,a.y,a.z),p(b.x,a.y,a.z),p(b.x,a.y,b.z),p(a.x,a.y,b.z)],hi=lo.map(q=>({...q,y:b.y}));for(const [points,fill]of [[[lo[0],lo[1],hi[1],hi[0]],color],[[lo[1],lo[2],hi[2],hi[1]],shade(color,-13)],[[lo[2],lo[3],hi[3],hi[2]],shade(color,-5)],[[lo[3],lo[0],hi[0],hi[3]],shade(color,7)],[[hi[0],hi[1],hi[2],hi[3]],shade(color,17)],[[lo[3],lo[2],lo[1],lo[0]],shade(color,-18)]])s.push(face(points,fill,{solidId:c.id,physical:true}));}
const color=c=>c.kind==='building'?(c.id==='rooftop-source-building'?'#b7c7ba':'#afc0b7'):c.kind==='parapet'?'#cbd3bd':c.kind==='interior'?'#d7c5a2':c.kind==='receiver'?'#4d998f':c.kind==='shutter'?'#7e9690':c.kind==='tree-canopy'?'#91b67f':c.kind==='tree-trunk'?'#9b8059':c.kind==='machine-frame'?'#80958e':c.kind==='planter'?'#9caf7c':c.id.endsWith('back-wall')||c.id.endsWith('left-wall')&&!c.id.includes('extra-bank')?'#eee1c3':c.kind==='wall'?'#d4b97f':c.kind==='desk-leg'?'#97774e':c.kind==='shelf'?'#b58b59':'#c6a06a';
const floorColors={room:'#ded0ae',school:'#d7d7ba',outdoor:'#a3ba8e',factory:'#b5c1b5',extra:'#dad1b3',golf:'#80a875',glider:'#c4d0b4',rooftop:'#b8c2b0'};
const cache=new Map();
const flat=(s,x,z,w,d,fill,metadata={})=>s.push(face([p(x,.009,z),p(x+w,.009,z),p(x+w,.009,z+d),p(x,.009,z+d)],fill,{decoration:true,...metadata}));
const panel=(s,x,y,z,w,h,fill)=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],fill,{decoration:true}));
function details(s,world){
 if(world.sceneTheme==='rooftop')s.push(...rooftopDetails(world));
 if(world.mode==='golf'){
  flat(s,-2.55,-.6,5.1,8.85,'#97b887');
  for(let z=-.5;z<8;z+=.75)flat(s,-2.5,z,5,.3,'#9cbd8c');
  flat(s,-.32,-.3,.64,.6,'#e8dfba',{tee:true});
  const c=world.goals[0].center;
  s.push({points:[p(c.x+.55,.02,c.z),p(c.x+.55,1.1,c.z)],line:true,stroke:'#5b7568',decoration:true});
  s.push(face([p(c.x+.55,1.1,c.z),p(c.x+1.05,.94,c.z),p(c.x+.55,.79,c.z)],'#fff1c5',{decoration:true}));
 }
 if(world.mode==='glider'&&world.sceneTheme!=='rooftop'){
  flat(s,-1.25,-.4,2.5,world.runwayLength??8.9,'#e2d6b4');
  const g=world.goals[0],c=g.center;
  flat(s,c.x-g.halfWidth,c.z-g.halfHeight,g.halfWidth*2,g.halfHeight*2,'#749e84',{landingZone:true});
  for(let z=c.z-g.halfHeight+.12;z<c.z+g.halfHeight;z+=.32)flat(s,c.x-.045,z,.09,.16,'#f7e8b8',{landingZone:true});
 }

 if(world.goalMotion){
  const g=world.goals[0],a=world.goalMotion.amplitude,lo=g.center.x-a-g.halfWidth,hi=g.center.x+a+g.halfWidth;
  flat(s,lo,g.center.z-g.halfHeight-.16,hi-lo,g.halfHeight*2+.32,'#bdd0b3',{motionLane:true});
  for(let x=lo;x<hi;x+=.36)flat(s,x,g.center.z-g.halfHeight-.2,Math.min(.18,hi-x),.055,'#658b7c',{motionLane:true});
 }
 if(world.wind.x&&world.sceneTheme!=='rooftop'){
  s.push({points:[p(-3.25,.02,1),p(-3.25,1.65,1)],line:true,stroke:'#6b8070',decoration:true,windMast:true});
 }
 if(world.stageId==='remix-machine'||world.stageId==='extra-bank'&&!world.mode){
  const wall=world.solids.find(c=>c.id===(world.stageId==='extra-bank'?'extra-bank-left-wall':'remix-machine-reflector')),x=wall.max.x+.006;
  for(const z of [2.1,2.8,3.5])s.push(face([p(x,.7,z),p(x,1.0,z+.22),p(x,1.7,z+.22),p(x,1.4,z)],'#d4a853',{decoration:true,routeWall:wall.id}));
 }
 if(world.sceneTheme==='room'){
  flat(s,-2.25,.75,4.5,4.5,'#adbea4');flat(s,-2.1,.9,4.2,4.2,'#becbb2');
  for(let x=-1.9;x<2.1;x+=.5)s.push({points:[p(x,.013,.92),p(x,.013,5.05)],line:true,stroke:'#b0c1a6',decoration:true});
  panel(s,-1.4,1.1,8.992,2.8,1.5,'#9b805a');panel(s,-1.30,1.20,8.986,2.6,1.3,'#4f8c83');panel(s,-1.14,1.36,8.980,2.28,.98,'#d5c9a8');panel(s,-.85,1.45,8.974,.62,.64,'#8baa83');panel(s,.05,1.47,8.974,.75,.55,'#c69c63');
  for(const c of world.solids.filter(c=>c.kind==='shelf'))for(const y of [.48,.94,1.37])if(y<c.max.y)panel(s,c.min.x+.05,y,c.min.z-.008,c.max.x-c.min.x-.1,.035,'#846943');
 }
 if(world.sceneTheme==='school'){
  panel(s,-2.6,1.15,8.99,5.2,1.65,'#b99a67');panel(s,-2.48,1.27,8.98,4.96,1.41,'#366f67');
  for(let row=0;row<4;row++)panel(s,-2.15,2.42-row*.24,8.97,1.5-row*.18,.025,'#bcd2b7');
  for(let x=-3.8;x<4;x+=.8)s.push({points:[p(x,.006,-1.5),p(x,.006,8.9)],line:true,stroke:'#c2c5aa',decoration:true});
  for(const c of world.solids.filter(c=>c.kind==='desk')){const x=(c.min.x+c.max.x)/2,z=(c.min.z+c.max.z)/2;s.push(face([p(x-.20,c.max.y+.006,z-.10),p(x+.16,c.max.y+.006,z-.10),p(x+.16,c.max.y+.006,z+.13),p(x-.20,c.max.y+.006,z+.13)],'#efe5cd',{decoration:true}));}
 }
 if(world.sceneTheme==='factory'){
  flat(s,-1.65,-.8,3.3,1.2,'#9aaea2');
  for(const side of [-1,1])for(let z=1.4;z<8.8;z+=.6)flat(s,side<0?-4.1:3.55,z,.55,.25,'#dcb658');
  panel(s,-2.8,1.8,8.99,1.6,.9,'#537b73');panel(s,-2.6,2,8.98,1.2,.5,'#ced2af');
  for(const z of [2.4,7.7])s.push({points:[p(-4,4.81,z),p(4,4.81,z)],line:true,stroke:'#bcc2a3',decoration:true});
 }
 if(world.sceneTheme==='outdoor'){
  flat(s,-1.05,-1.4,2.1,10.5,'#d6c79e');for(let z=-1;z<9;z+=.6)s.push({points:[p(-1.02,.014,z),p(1.02,.014,z)],line:true,stroke:'#c1b68e',decoration:true});
  for(const c of world.solids.filter(c=>c.kind==='planter'))s.push(face([p(c.min.x+.1,c.max.y+.008,c.min.z+.1),p(c.max.x-.1,c.max.y+.008,c.min.z+.1),p(c.max.x-.1,c.max.y+.008,c.max.z-.1),p(c.min.x+.1,c.max.y+.008,c.max.z-.1)],'#6f936c',{decoration:true}));
 }
 if(world.sceneTheme==='extra'){
  for(let z=.4;z<8.8;z+=1)flat(s,-3.9,z,.18,.5,'#75a499');
  for(let z=.4;z<8.8;z+=1)flat(s,3.7,z,.18,.5,'#75a499');
 }
}
export function releaseChapterCameraConfig(world){world=requireWorld(world);return {azimuth:world.view.azimuth,elevation:world.worldVersion===76?.18:world.view.elevation,zoom:1};}
export function releaseChapterScene(camera,world){world=requireWorld(world);if(!cache.has(world.worldVersion)){
 const r=world.room,s=[face([p(r.minX,-.018,r.minZ),p(r.maxX,-.018,r.minZ),p(r.maxX,-.018,r.maxZ),p(r.minX,-.018,r.maxZ)],floorColors[world.sceneTheme],{decoration:true})];
 // A quiet floor grid gives depth without adding fake physical walls.
 for(let z=0;z<r.maxZ;z+=1)s.push({points:[p(r.minX,.002,z),p(r.maxX,.002,z)],line:true,stroke:world.sceneTheme==='outdoor'?'#92aa7e':'#c6bda1',decoration:true});
 for(const c of world.solids)physicalBox(s,c,color(c));
 details(s,world);
 // A painted hand position gives the high-view extra an unambiguous origin.
 const o=world.origin,y=(world.roofHeight??0)+.006;s.push(face([p(o.x-.24,y,o.z-.18),p(o.x+.24,y,o.z-.18),p(o.x,y,o.z+.27)],'#e98238',{decoration:true,originMark:true}));
 cache.set(world.worldVersion,s);
 }return {shapes:world.worldVersion===77?rooftopVisibleShapes(cache.get(world.worldVersion),camera):cache.get(world.worldVersion),cutaway:[],stageId:world.stageId,worldVersion:world.worldVersion,groups:world.solids.map(c=>({id:c.id,physical:true,bounds:{minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z}}))};}
export function releaseChapterMotionShapes(world,time=0){world=requireWorld(world);const shapes=[];for(const c of releaseChapterDynamicSolids(world,time))physicalBox(shapes,c,color(c));
 if(world.sceneTheme==='rooftop')shapes.push(...rooftopMotionShapes(world,time));
 if(world.wind.x&&world.sceneTheme!=='rooftop'){
  const x=-3.25,y=1.62,z=1,sign=Math.sign(world.wind.x),wave=Math.sin(time*2.2)*.07;
  shapes.push(face([p(x,y,z),p(x+sign*.72,y-.08,z+wave),p(x+sign*.61,y-.35,z+wave),p(x,y-.29,z)],'#d4a853',{decoration:true,windFlag:true}));
 }
 if(world.wind.x&&world.sceneTheme!=='rooftop'){
  for(let i=0;i<5;i++){
   const phase=((time*.52+i*.19)%1),x=-2.4+phase*4.8,z=1.5+i*1.12,y=.9+(i%2)*.65,sign=Math.sign(world.wind.x);
   shapes.push({points:[p(x,y,z),p(x+sign*.28,y+.02,z),p(x+sign*.19,y+.085,z)],line:true,stroke:'#d4a853',decoration:true,windStreak:true});
  }
 }
 for(const g of releaseChapterGoals(world,time)){
  if(g.kind==='golf-cup'){
   const c=g.center,points=Array.from({length:20},(_,i)=>p(c.x+Math.cos(i*Math.PI/10)*g.radius,.012,c.z+Math.sin(i*Math.PI/10)*g.radius));
   shapes.push(face(points,'#233d35',{decoration:true,goalId:g.id}));
   for(let i=0;i<20;i++)shapes.push({points:[points[i],points[(i+1)%20]],line:true,stroke:'#f6e3a7',goalId:g.id,aperture:true});
   continue;
  }
  const c=g.center,w=g.halfWidth,h=g.halfHeight,points=g.kind==='wall-slot'?[p(c.x-w,c.y-h,c.z-.006),p(c.x+w,c.y-h,c.z-.006),p(c.x+w,c.y+h,c.z-.006),p(c.x-w,c.y+h,c.z-.006)]:[p(c.x-w,c.y+.008,c.z-h),p(c.x+w,c.y+.008,c.z-h),p(c.x+w,c.y+.008,c.z+h),p(c.x-w,c.y+.008,c.z+h)];
  for(let i=0;i<4;i++)shapes.push({points:[points[i],points[(i+1)%4]],line:true,stroke:'#e9b54e',goalId:g.id,aperture:true});
  if(g.kind==='recycle-bin')shapes.push(face([p(c.x-w,.008,c.z-h),p(c.x+w,.008,c.z-h),p(c.x+w,.008,c.z+h),p(c.x-w,.008,c.z+h)],'#286864',{goalId:g.id,decoration:true}));
 }
 return shapes;
}
