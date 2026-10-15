// Versioned woodland: metre-scale wild boar, a working bow and a deeper trail.
// Canonical solids and the deterministic actor clock own all gameplay geometry.
// The module adds no collider, alternate hit test, animation timer or asset URL.
import {eccentricMotion,eccentricSolids} from './eccentric-world.mjs?v=20261015-boar-distance-1';
import {scenePrimitives} from './factory-scene.mjs?v=20261015-boar-distance-1';
import {getThrowable} from './throwables.mjs?v=20261015-boar-distance-1';
const {p,face,shade,add,scale,cross,unit,box,physicalBox,cylinder,ellipsoid,line,flat,limb}=scenePrimitives;
const C=Object.freeze({moss:'#8fa579',grass:'#a8b88a',leaf:'#b9bd88',path:'#d4c29b',bark:'#806a50',barkLight:'#a18b64',barkDark:'#65583f',foliage:'#72916d',foliageLight:'#9fb584',coat:'#74634b',coatLight:'#8a7455',ridge:'#534b3b',wood:'#a18155',teal:'#426f65',cream:'#eee3c6'});
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n)),valid=world=>[48,53].includes(world?.worldVersion)&&world?.eccentricType==='boar';
const decoration={decoration:true,physical:false},cache=new Map();
const mix=(a,b,t)=>p(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t);
function polygon(s,points,color,meta={}){s.push(face(points,color,null,meta));}
function leaf(s,x,y,z,angle,length,width,color,meta={}){
  const d=p(Math.cos(angle)*length,0,Math.sin(angle)*length),w=p(-Math.sin(angle)*width,0,Math.cos(angle)*width),a=p(x,y,z),tip=add(a,d),middle=add(a,scale(d,.47));
  polygon(s,[a,add(middle,add(w,p(0,width*.32,0))),tip],color,meta);
  polygon(s,[a,tip,add(middle,scale(w,-1))],shade(color,-8),meta);
}
function fern(s,x,z,q=1,angle=0){
  const meta={...decoration,woodlandPlant:'fern'};
  for(let j=0;j<5;j++){
    const a=angle+j*1.256,tip=p(x+Math.cos(a)*.38*q,.17*q,z+Math.sin(a)*.38*q),root=p(x,.025,z);
    line(s,root,tip,'#6d8c62',meta);
    for(let k=1;k<4;k++){
      const v=mix(root,tip,k/4),span=(1-k/4)*.16*q;
      for(const side of [-1,1])leaf(s,v.x,v.y,v.z,a+side*.85,span,.032*q,k%2?'#8ba477':'#789766',meta);
    }
  }
}
function canopy(s,x,y,z,q=1){
  // Small separate crowns leave sky gaps, rather than a single green ceiling.
  for(const [dx,dy,dz,r,color]of [[0,0,0,1.0,C.foliage],[-.58,.28,.12,.78,C.foliageLight],[.53,.48,.28,.72,'#8aa778']])
    ellipsoid(s,x+dx*q,y+dy*q,z+dz*q,r*q,.66*q,r*.85*q,color,8,3,{...decoration,forestCanopy:true});
}
function canonicalTrunk(s,c,index){
  const a=c.min,b=c.max,x=(a.x+b.x)/2,z=(a.z+b.z)/2,h=b.y-a.y,meta={solidId:c.id,physical:true,woodlandTrunk:true};
  // The opaque visible envelope is the exact canonical AABB, including corners.
  physicalBox(s,c,index%2?C.bark:C.barkLight);
  for(let j=0;j<4;j++){
    const f=(j+.5)/4,dx=a.x+(b.x-a.x)*f,dz=a.z+(b.z-a.z)*f,y=a.y+.13+j*.05;
    line(s,p(dx,y,a.z-.002),p(dx+(j%2?.019:-.017),b.y-.04,a.z-.002),j%2?C.barkDark:C.bark,meta);
    line(s,p(a.x-.002,y,dz),p(a.x-.002,b.y-.08,dz+.018),j%2?C.bark:C.barkLight,meta);
  }
  // Root flares and branches are explicitly cosmetic and sit outside the
  // low gameplay lane; only the trunk above is a physical obstacle.
  for(let j=0;j<4;j++){
    const angle=j*Math.PI/2+.25,indexed={...decoration,rootFor:c.id};
    polygon(s,[p(x,Math.min(.38,h*.1),z),p(x+Math.cos(angle)*.64,.018,z+Math.sin(angle)*.64),p(x+Math.cos(angle+.42)*.24,.018,z+Math.sin(angle+.42)*.24)],j%2?C.bark:C.barkLight,indexed);
  }
  const crownY=b.y+.24;
  for(const side of [-1,1])limb(s,p(x,b.y-h*.23,z),p(x+side*.62,crownY+.35,z+.17),.06,C.bark,{...decoration,branchFor:c.id});
  canopy(s,x,crownY+.55,z,index%2?1.15:1.03);
}
function backgroundTree(s,x,z,h,q=1){
  const meta={...decoration,backgroundTree:true};
  cylinder(s,x,0,z,.17*q,h,C.bark,7,meta);
  for(const side of [-1,1])limb(s,p(x,h*.7,z),p(x+side*.52*q,h+.38,z+.16),.055*q,C.bark,meta);
  canopy(s,x,h+.3,z,q);
}
function forestGround(s,world){
  const r=world.room,distant=world.worldVersion===53;flat(s,r.minX-7,.004,r.minZ-3,r.maxX-r.minX+14,r.maxZ-r.minZ+13,C.grass,decoration);
  // A curved leaf-strewn game trail, with an open clearing around the boar.
  const path=distant?[[-.65,-2],[.28,.4],[-.22,2.6],[.46,4.7],[-.12,6.5],[.12,9.4],[-.22,12],[.22,14.8],[.52,16.6],[1.9,18.4],[2.6,21.5],[2.2,24.5]]:[[-.65,-2],[.28,.4],[-.22,2.6],[.46,4.7],[-.12,6.5],[.52,8.6],[1.9,10.4],[2.6,13.5]],width=.82;
  for(let i=1;i<path.length;i++){
    const [ax,az]=path[i-1],[bx,bz]=path[i],n=unit(p(-(bz-az),0,bx-ax));
    polygon(s,[p(ax+n.x*width,.009,az+n.z*width),p(bx+n.x*width,.009,bz+n.z*width),p(bx-n.x*width,.009,bz-n.z*width),p(ax-n.x*width,.009,az-n.z*width)],i%2?C.path:'#caba95',{...decoration,forestTrail:true});
  }
  for(const [x,z,rx,rz]of [[-2.5,2,1.4,.65],[2.8,4.7,1.2,.85],[-3.5,8,1.6,1.2],[1.6,10,1.5,.8],[4.1,9.2,1.1,1.3],...(distant?[[-3.5,15,1.6,1.2],[1.6,18,1.5,.8],[4.1,17.2,1.1,1.3],[-2.7,22.3,1.8,.8]]:[])])
    polygon(s,Array.from({length:9},(_,i)=>p(x+Math.cos(i*Math.PI*2/9)*rx,.011,z+Math.sin(i*Math.PI*2/9)*rz)),C.moss,{...decoration,mossPatch:true});
  for(let i=0;i<(distant?126:78);i++){
    const x=Math.sin(i*2.399)*(.7+(i%10)*.63),z=-1.2+(i*.617)%(distant?25.2:15.2),a=i*1.731;
    leaf(s,x,.018+(i%3)*.003,z,a,.08+(i%3)*.025,.027,['#bdad7c','#9d9f6e','#c8b887','#929467'][i%4],{...decoration,forestLeafLitter:true});
  }
  for(const [x,z,q,a]of [[-3.1,1,.9,.2],[3.4,2.7,1.1,.8],[-2.8,4.5,.9,1.4],[2.4,6.2,.7,.3],[-4.2,8.3,1.1,.6],[4.5,9.5,1,.2],[-3.7,11.3,.9,.8],[1.7,12.5,.7,1],...(distant?[[-3.7,15.3,.9,.8],[3.8,16.5,.8,1],[-4.2,19.5,1.1,.6],[4.5,21.5,1,.2],[-3.7,23.3,.9,.8]]:[])])fern(s,x,z,q,a);
  for(let i=0;i<(distant?15:9);i++){
    const side=i%2?-1:1,x=side*(4.4+(i%3)*.8),z=.8+i*(distant?1.55:1.25);
    ellipsoid(s,x,.10,z,.20+(i%2)*.07,.15,.18,'#aaa98a',7,2,{...decoration,forestStone:true});
  }
  // Warm light pools on the floor communicate an airy deciduous woodland.
  for(const [x,z,rx,rz]of [[-.2,1.8,.5,.22],[1.2,5.2,.6,.35],[-1.9,8.7,.72,.32],[2.8,11.1,.5,.3],...(distant?[[-1.9,16.7,.72,.32],[2.8,19.1,.5,.3],[1.3,22.2,.65,.34]]:[])])
    polygon(s,Array.from({length:7},(_,i)=>p(x+Math.cos(i*Math.PI*2/7)*rx,.022,z+Math.sin(i*Math.PI*2/7)*rz)),'#d9cc9e',{...decoration,forestSunPatch:true});
}
export function forestHuntStaticMeshes(world){
  if(!valid(world))return [];
  const key=`${world.stageId}:${world.worldVersion}`;if(cache.has(key))return cache.get(key);
  const s=[];forestGround(s,world);
  const solids=eccentricSolids(world);
  for(const [i,c]of solids.entries()){
    if(c.kind==='tree')canonicalTrunk(s,c,i);
    else physicalBox(s,c,c.kind==='stone'?'#aaa98a':C.bark);
  }
  // Background vegetation is beyond the room's playable bounds. The real
  // obstacles within the playable forest come exclusively from solids above.
  const r=world.room;
  for(const [x,z,h,q]of [[r.minX-1.4,1.4,4.5,1.25],[r.maxX+1.4,1,4.8,1.4],[r.minX-1,7,5,1.35],[r.maxX+1,7.5,4.3,1.2],[r.minX-1.6,13,4.8,1.3],[r.maxX+1.8,13.5,5.2,1.4],[-5.8,r.maxZ+2,4.4,1.2],[-2.8,r.maxZ+3.3,4.9,1.3],[.7,r.maxZ+2.6,5.2,1.4],[4.3,r.maxZ+3.2,4.6,1.3],[7.5,r.maxZ+2.2,5.2,1.4]])backgroundTree(s,x,z,h,q);
  if(world.worldVersion===53)for(const [x,z,h,q]of [[r.minX-1.1,19,5,1.35],[r.maxX+1.5,19.5,4.8,1.3],[r.minX-1.5,24.5,5.2,1.4],[r.maxX+1.2,25,4.5,1.3]])backgroundTree(s,x,z,h,q);
  cache.set(key,s);return s;
}
function boarLocal(s,actor,options){
  const meta={actorId:actor.id,boarModel:true,physical:true},moving=!options.reducedMotion&&(actor.gaitSpeed??0)>.025,phase=moving?(actor.gaitPhase??0):0,swing=moving?Math.min(.16,(actor.gaitSpeed??0)*.065):0,bob=moving?Math.sin(phase*2)*.009:0;
  ellipsoid(s,0,.52+bob,-.10,.33,.31,.59,C.coat,10,4,meta);
  ellipsoid(s,0,.59+bob,.23,.32,.30,.32,C.coatLight,10,4,meta);
  ellipsoid(s,0,.46+bob,-.43,.285,.265,.29,'#78674d',8,3,meta);
  // The long wedge-shaped head and low narrow snout distinguish boar from pig.
  const rings=[{z:.34,y:.55,rx:.235,ry:.23},{z:.57,y:.43,rx:.17,ry:.16},{z:.78,y:.355,rx:.105,ry:.085}],n=8;
  for(let j=1;j<rings.length;j++)for(let i=0;i<n;i++){
    const at=(ring,k)=>p(Math.cos(k/n*Math.PI*2)*ring.rx,ring.y+bob+Math.sin(k/n*Math.PI*2)*ring.ry,ring.z),a=rings[j-1],b=rings[j];
    polygon(s,[at(a,i),at(a,i+1),at(b,i+1),at(b,i)],shade(C.coatLight,Math.round(Math.sin(i/n*Math.PI*2)*10)),{...meta,boarHead:true});
  }
  ellipsoid(s,0,.355+bob,.788,.107,.084,.021,'#927b59',8,2,{...meta,boarSnout:true});
  for(const side of [-1,1]){
    ellipsoid(s,side*.042,.359+bob,.809,.013,.014,.004,'#4c4737',6,2,{...meta,boarNostril:true});
    ellipsoid(s,side*.194,.572+bob,.48,.012,.014,.015,'#292f29',6,2,{...meta,boarEye:true});
    const outer=[p(side*.17,.707+bob,.33),p(side*.27,.894+bob,.315),p(side*.31,.69+bob,.47)],rear=p(side*.21,.69+bob,.39);
    polygon(s,outer,'#66583f',{...meta,boarEar:true});polygon(s,[outer[0],outer[1],rear],'#8e7755',meta);polygon(s,[outer[1],outer[2],rear],'#786446',meta);
    // Short upward-curving ivory tusks are an anatomical cue, never a giant grin.
    limb(s,p(side*.13,.31+bob,.64),p(side*.17,.345+bob,.71),.016,C.cream,{...meta,boarTusk:true});
    limb(s,p(side*.17,.345+bob,.71),p(side*.16,.405+bob,.74),.011,C.cream,{...meta,boarTusk:true});
    line(s,p(side*.09,.302+bob,.77),p(side*.175,.33+bob,.59),'#5e513b',{...meta,boarMouth:true});
    for(const front of [true,false]){
      const z=front?.24:-.44,diagonal=side*(front?1:-1),stride=Math.sin(phase+diagonal*Math.PI/2)*swing,lift=moving?Math.max(0,Math.cos(phase+diagonal*Math.PI/2))*.055:0,x=side*(front?.228:.22),top=p(x,.43+bob,z),knee=p(x+side*.014,.235,z-stride*.30),ankle=p(x,.07+lift,z+stride);
      limb(s,top,knee,front?.071:.078,'#645740',{...meta,boarLeg:true});limb(s,knee,ankle,.045,'#5c513c',meta);
      for(const toe of [-1,1])box(s,x+toe*.025-.020,.018+lift,z+stride-.047,.04,.055,.105,'#444638',{...meta,boarHoof:true});
    }
    for(let i=0;i<6;i++)line(s,p(side*(.27+(i%2)*.025),.46+(i%3)*.045+bob,-.43+i*.13),p(side*(.285+(i%2)*.025),.42+(i%3)*.045+bob,-.40+i*.13),'#665840',{...meta,boarCoatStroke:true});
  }
  for(let i=0;i<11;i++){
    const z=-.43+i*.077,y=.80+bob-(i<3?(3-i)*.017:i>7?(i-7)*.019:0),height=.05+(i%3)*.013;
    polygon(s,[p(-.023,y,z-.035),p(.023,y,z-.035),p(0,y+height,z+.038)],C.ridge,{...meta,boarBristles:true});
  }
  const tailShift=moving?Math.sin(phase*.5)*.025:0;
  limb(s,p(0,.48+bob,-.68),p(.035,.41+bob,-.79),.021,'#6d5d43',{...meta,boarTail:true});
  limb(s,p(.035,.41+bob,-.79),p(.065+tailShift,.32+bob,-.82),.014,'#5e523c',meta);
}
function boarMeshes(s,actor,options){
  const model=[];boarLocal(model,actor,options);const q=actor.position,heading=Number.isFinite(actor.heading)?actor.heading:0,c=Math.cos(heading),sn=Math.sin(heading);
  for(const mesh of model)s.push({...mesh,heading,points:mesh.points.map(a=>p(q.x+a.x*c+a.z*sn,q.y+a.y,q.z-a.x*sn+a.z*c))});
  const shadow={actorShadow:actor.id,...decoration},r=.68;
  polygon(s,Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=Math.cos(a)*.35,z=Math.sin(a)*r;return p(q.x+x*c+z*sn,.027,q.z-x*sn+z*c);}),'#829473',shadow);
}
function bowMeshes(s,world,options){
  const aim=options.aim??world.launch,e=(aim.elevation??world.launch.elevation)*Math.PI/180,yaw=(aim.yaw??world.launch.yaw)*Math.PI/180,forward=p(Math.sin(yaw)*Math.cos(e),Math.sin(e),Math.cos(yaw)*Math.cos(e)),right=unit(cross(p(0,1,0),forward)),up=unit(cross(forward,right));
  const phase=options.phase??options.game?.phase??'ready',radius=options.game?.can?.radius??getThrowable(world.itemId)?.physics.radius??.035,origin=phase==='ready'&&options.game?.can?.position?options.game.can.position:p(world.origin.x,world.origin.y+radius-.14,world.origin.z),flight=options.flightTime??options.game?.time??0,rawPull=options.pullFraction??options.pull?.strength??0,pull=clamp(Number.isFinite(rawPull)?rawPull:0),release=phase==='flying'&&flight<.22&&!options.reducedMotion?Math.sin(flight/.22*Math.PI)*.065:0,draw=phase==='ready'?pull:0,extension=.04+draw*.21-release;
  // The actual arrow centre stays at the canonical launch origin. Extending
  // the bow arm increases draw length while the string remains on its nock.
  const at=(x,y,z)=>add(origin,add(scale(right,x),add(scale(up,y),scale(forward,z)))),grip=at(0,-.063,extension),meta={bow:true,decoration:true,physical:false,bowDraw:draw,launchOrigin:{...origin}},tips=[];
  for(const side of [-1,1]){
    const points=[];
    for(let i=0;i<=7;i++){
      const f=i/7,y=side*(.10+f*.61),z=extension+Math.sin(f*Math.PI)*(.09+draw*.055)-f*f*(.09+draw*.14);
      points.push(at(0,y,z));
    }
    for(let i=1;i<points.length;i++)limb(s,points[i-1],points[i],.018+(1-i/points.length)*.007,C.wood,{...meta,bowLimb:true});
    for(let i=1;i<points.length;i++)line(s,add(points[i-1],scale(right,.018)),add(points[i],scale(right,.018)),'#ccb583',{...meta,bowLamination:true});
    tips.push(points.at(-1));
  }
  limb(s,at(0,-.11,extension),at(0,.11,extension),.034,C.teal,{...meta,bowGrip:true});
  for(let i=0;i<5;i++)line(s,at(-.034,-.09+i*.036,extension-.018),at(.034,-.08+i*.036,extension+.019),'#abc0a6',{...meta,bowGripWrap:true});
  const nock=at(0,0,-.36),vibration=phase==='flying'&&flight<.18&&!options.reducedMotion?Math.sin(flight*130)*(1-flight/.18)*.025:0,stringNock=phase==='ready'?nock:at(vibration,0,extension-.045);
  for(const tip of tips)line(s,tip,stringNock,'#e7ddbf',{...meta,bowString:true});
  // A small brass arrow rest sits directly beneath the actual shaft.
  limb(s,at(-.035,-.018,extension),at(.025,-.018,extension),.008,'#cbb274',{...meta,bowArrowRest:true});
  // Restrained faceted hands make the grasp and release legible; sleeves stay
  // behind the launch position and add no obstacle to a released arrow.
  const hand=add(grip,scale(right,-.035));
  ellipsoid(s,hand.x,hand.y,hand.z,.047,.085,.042,'#c8ac82',8,3,{...meta,bowHoldingHand:true});
  const wrist=at(-.08,-.24,extension-.08),armEnd=at(-.22,-.48,extension-.27);
  limb(s,wrist,armEnd,.065,'#627f6c',{...meta,bowSleeve:true});limb(s,hand,wrist,.041,'#c8ac82',{...meta,bowWrist:true});
  if(phase==='ready'){
    const drawHand=add(nock,scale(right,.043));ellipsoid(s,drawHand.x,drawHand.y-.018,drawHand.z,.044,.047,.035,'#c8ac82',7,3,{...meta,bowDrawingHand:true});
    line(s,at(.012,-.02,-.35),at(.055,.018,-.36),'#9f805e',{...meta,bowDrawingFingers:true});
  }
}
export function forestHuntDynamicMeshes(world,time=0,options={}){
  if(!valid(world))return [];
  const s=[],motion=eccentricMotion(world,time);
  for(const actor of motion.actors??[])if(actor.kind==='boar')boarMeshes(s,actor,options);
  bowMeshes(s,world,options);return s;
}
