// The school uses the same warm paper / wood / teal language as the approved
// room art. Every physical surface is drawn from the frozen school descriptor;
// small flat markings do not introduce additional gameplay obstacles.
import {schoolSolids,schoolStudentPose,schoolStudentPoses} from './school-world.mjs?v=20261015-timed-relay-1';

export const SCHOOL_PALETTE=Object.freeze({cream:'#f4ead5',wall:'#eee2c6',wood:'#c89b61',metal:'#c1cab7',teal:'#4a948b',darkTeal:'#286864',gold:'#e8b54e',orange:'#e98238',sky:'#bfdedb',green:'#8caf7d'});
const p=(x,y,z)=>({x,y,z});
const face=(points,fill,stroke=null)=>({points,fill,stroke});
const cache=new Map();
const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
function box(s,x,y,z,w,h,d,color,metadata={}){
  const a=p(x,y,z),b=p(x+w,y,z),c=p(x+w,y,z+d),e=p(x,y,z+d),f=p(x,y+h,z),g=p(x+w,y+h,z),i=p(x+w,y+h,z+d),j=p(x,y+h,z+d);
  s.push(...[[[a,b,g,f],color],[[b,c,i,g],shade(color,-13)],[[c,e,j,i],shade(color,-5)],[[e,a,f,j],shade(color,7)],[[f,g,i,j],shade(color,17)],[[e,c,b,a],shade(color,-18)]].map(([points,fill])=>({...face(points,fill),...metadata})));
}
function physicalBox(s,c,color){
  // Keep the canonical endpoint bytes: reconstructing max as min+(max-min)
  // can introduce roundoff even though the dimensions are mathematically equal.
  const a=c.min,b=c.max,lo=[p(a.x,a.y,a.z),p(b.x,a.y,a.z),p(b.x,a.y,b.z),p(a.x,a.y,b.z)],hi=lo.map(q=>({...q,y:b.y}));
  s.push(...[[[lo[0],lo[1],hi[1],hi[0]],color],[[lo[1],lo[2],hi[2],hi[1]],shade(color,-13)],[[lo[2],lo[3],hi[3],hi[2]],shade(color,-5)],[[lo[3],lo[0],hi[0],hi[3]],shade(color,7)],[[hi[0],hi[1],hi[2],hi[3]],shade(color,17)],[[lo[3],lo[2],lo[1],lo[0]],shade(color,-18)]].map(([points,fill])=>({...face(points,fill),solidId:c.id})));
}
function cylinder(s,x,y,z,r,h,color,n=10){
  const low=Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,y,z+Math.sin(i/n*Math.PI*2)*r)),high=low.map(q=>({...q,y:y+h}));
  for(let i=0;i<n;i++)s.push(face([low[i],low[(i+1)%n],high[(i+1)%n],high[i]],shade(color,Math.round(Math.cos(i/n*Math.PI*2)*9))));s.push(face(high,shade(color,14)));
}
function ellipsoid(s,x,y,z,rx,ry,rz,color,n=10,rows=4){
  const at=(a,b)=>p(x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,c=-Math.PI/2+j/rows*Math.PI,d=-Math.PI/2+(j+1)/rows*Math.PI;s.push(face([at(a,c),at(b,c),at(b,d),at(a,d)],shade(color,Math.round(Math.sin((c+d)/2)*10+Math.cos(a)*5))));}
}
const stroke=(s,a,b,color='#bdc4aa')=>s.push({points:[a,b],line:true,stroke:color});
const flat=(s,x,y,z,w,d,color)=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],color));
const oval=(s,x,y,z,rx,rz,color)=>s.push({...face(Array.from({length:20},(_,i)=>p(x+Math.cos(i/20*Math.PI*2)*rx,y,z+Math.sin(i/20*Math.PI*2)*rz)),color),depthWrite:false});
const boundsOf=c=>({minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z});
const typeOf=world=>world.schoolType??world.scene??world.stageId?.replace('school-','');
const kindOf=c=>c.kind==='window-wall'?'window-wall':String(c.object??c.kind??c.id);
function surfaceColor(c){
  const id=`${kindOf(c)} ${c.id}`;
  if(c.id==='courtyard-school-building')return '#ddcfb0';if(c.id==='courtyard-school-cornice')return '#b1c0ac';
  if(/wall|building|ceiling|roof-floor|floor|slab/.test(id))return /floor|slab/.test(id)?'#d5bb92':SCHOOL_PALETTE.wall;
  if(/vending/.test(id))return '#4b9690';
  if(/rail|fence|post|leg|frame/.test(id))return '#c0c8b4';
  if(/chair|desk|source/.test(id))return SCHOOL_PALETTE.wood;
  return '#bfa778';
}
function roomBounds(world){
  const r=world.room??world.bounds;
  return r&&Number.isFinite(r.minX)?r:{minX:-3.7,maxX:3.7,minZ:-1.3,maxZ:6.6,height:3.4};
}
function schoolBackdrop(s,world){
  // The far rooftop school has real shared solids; its facade markings are
  // flat decoration. Foliage stays beyond the courtyard map edges.
  const type=typeOf(world),r=roomBounds(world),roof=type==='rooftop';
  if(type==='classroom'||type==='vending'||world.windowOpenings?.length)return;
  const back=roof?14:r.maxZ+3;
  if(!roof){box(s,-7.5,0,back,15,6.8,1.2,'#ddcfb0');box(s,-7.55,6.8,back-.04,15.1,.2,1.3,'#b1c0ac');}
  const facadeFirst=s.length;for(const y of [1.15,3.1,5.05])for(let x=-6.9;x<7;x+=1.48){box(s,x,y,back-.015,1.06,1.27,.018,'#9dc7c5');box(s,x+.5,y,back-.032,.045,1.27,.012,'#e9e2c8');box(s,x,y+.62,back-.033,1.06,.035,.012,'#e9e2c8');}
  if(roof){
    for(const shape of s.slice(facadeFirst))shape.shellId='courtyard-school-building';
    flat(s,-8,.003,-2,16,18,'#d7d5b4');
    for(let x=-8;x<8;x+=1.2)for(let z=-1;z<14;z+=1.2)flat(s,x,.006,z,1.17,1.17,(Math.round(x/1.2+z/1.2)%3===0)?'#d0ceb0':'#dedcc1');
    // Courtyard path and planted edges frame the actual ground-level target.
    const b=world.bin.center;flat(s,b.x-1.1,.009,-.5,2.2,Math.max(1,b.z+2),'#efe2bf');
    for(const [x,z] of [[-9.3,8.8],[9.6,10.2],[-9.5,13.2]]){cylinder(s,x,0,z,.12,1.4,'#a7895f');ellipsoid(s,x,2.0,z,.85,1.0,.85,'#94b87f',10,4);ellipsoid(s,x-.35,2.3,z+.1,.62,.73,.63,'#a8c18a',10,4);}
  }else{
    flat(s,-7.5,-.45,r.minZ-1,15,r.maxZ-r.minZ+4,'#b8c698');
    for(const [x,z] of [[-6,r.maxZ+1.4],[6.2,r.minZ+2]]){cylinder(s,x,-.45,z,.10,1.2,'#b3966b');ellipsoid(s,x,1.4,z,.85,.9,.85,'#99b880');}
  }
}
function classroomDetail(s,world){
  const r=roomBounds(world),back=r.maxZ-.009;
  // Chalkboard, cork notice board and a clock are flat against the real wall.
  box(s,-2.55,1.08,back-.04,3.25,1.33,.04,'#ba9866');box(s,-2.47,1.16,back-.061,3.09,1.17,.02,'#4c7e70');
  for(const [x,y,w] of [[-2.17,1.98,.87],[-2.17,1.82,1.56],[-2.17,1.65,1.06],[-.59,2.10,.71]])stroke(s,p(x,y,back-.067),p(x+w,y,back-.067),'#c1d4b5');
  box(s,-2.56,1.05,back-.13,3.29,.055,.12,'#c8aa75');box(s,-1.75,1.11,back-.116,.18,.025,.04,'#f5eed8');
  box(s,1.0,1.35,back-.035,1.11,1.03,.035,'#bb9e72');box(s,1.07,1.42,back-.052,.97,.89,.017,'#d1bb8e');
  for(const [x,y,w,h,c] of [[1.14,1.76,.38,.45,'#f4edda'],[1.58,1.54,.32,.52,'#e9d99e'],[1.57,2.11,.36,.10,'#9fbfa8']])box(s,x,y,back-.064,w,h,.012,c);
  const cx=.65,cy=2.92,cz=back-.062,n=20;
  s.push(face(Array.from({length:n},(_,i)=>p(cx+Math.cos(i/n*Math.PI*2)*.24,cy+Math.sin(i/n*Math.PI*2)*.24,cz)),'#b69c73'));
  s.push(face(Array.from({length:n},(_,i)=>p(cx+Math.cos(i/n*Math.PI*2)*.207,cy+Math.sin(i/n*Math.PI*2)*.207,cz-.008)),'#fff6df'));stroke(s,p(cx,cy,cz-.013),p(cx,cy+.13,cz-.013),'#5e7f70');stroke(s,p(cx,cy,cz-.013),p(cx+.11,cy-.06,cz-.013),'#5e7f70');
  // Glass rectangles sit on the wall plane, so their physical extent remains
  // the wall descriptor instead of an invented window collision surface.
  for(const z of [.20,2.1,4.0]){
    const x=r.minX+.007;box(s,x,1.08,z,.04,1.62,1.42,'#c2aa80');box(s,x+.041,1.15,z+.07,.011,1.47,1.28,'#aed5d1');
    box(s,x+.054,1.86,z+.07,.017,.055,1.28,'#f9f0d8');box(s,x+.054,1.15,z+.69,.017,1.47,.055,'#f9f0d8');
    box(s,x+.05,1.06,z-.02,.21,.055,1.46,'#d5bb89');
    flat(s,r.minX+.03,.014,z+.12,1.9,1.08,'#e4ca94');
  }
  // The door is a painted inset, not another solid blocking the room.
  const x=r.maxX-.015;box(s,x-.018,0,-.82,.018,2.38,1.02,'#6b9f91');box(s,x-.035,1.28,-.72,.015,.8,.8,'#c2ded4');box(s,x-.051,1.06,-.64,.016,.034,.12,'#d4b565');
  const source=world.origin;flat(s,source.x-.32,source.y-.14+.004,source.z-.48,.38,.28,'#f6edd6');flat(s,source.x-.29,source.y-.14+.006,source.z-.44,.32,.22,'#abc4b0');
}
function vendingDetail(s,world,solids){
  const c=solids.find(c=>/vending/.test(`${kindOf(c)} ${c.id}`));if(!c)return;
  const a=c.min,b=c.max,w=b.x-a.x,z=a.z-.007,h=b.y-a.y;
  box(s,a.x+w*.07,a.y+h*.37,z-.013,w*.70,h*.48,.013,'#dce7d3');
  box(s,a.x+w*.11,a.y+h*.40,z-.021,w*.62,h*.42,.009,'#577e76');
  const colors=['#d7b55e','#c58e55','#a5c2a1','#ebe3c7'];
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
    const x=a.x+w*(.17+col*.13),y=a.y+h*(.45+row*.13),r=Math.min(.035,w*.04);cylinder(s,x,y,z-.052,r,.13,colors[(row+col)%4],8);cylinder(s,x,y+.13,z-.052,r*.73,.035,'#e4e1c3',8);
    box(s,x-.025,y-.025,z-.044,.05,.016,.014,'#ecbd64');
  }
  box(s,a.x+w*.07,a.y+h*.88,z-.015,w*.70,h*.075,.015,'#f0d990');
  for(let i=0;i<5;i++)box(s,a.x+w*(.16+i*.095),a.y+h*.905,z-.021,w*.052,h*.019,.006,'#69978c');
  box(s,a.x+w*.82,a.y+h*.56,z-.02,w*.11,h*.07,.02,'#edd591');box(s,a.x+w*.85,a.y+h*.48,z-.025,w*.047,h*.04,.025,'#b0cbbb');
  box(s,a.x+w*.14,a.y+h*.13,z-.022,w*.58,h*.12,.022,'#346c65');box(s,a.x+w*.20,a.y+h*.13,z-.03,w*.46,h*.025,.008,'#95b7a5');
  const r=roomBounds(world);box(s,r.minX+.12,2.25,r.maxZ-.012,1.58,.40,.012,'#d5ba7e');box(s,r.minX+.21,2.35,r.maxZ-.02,.48,.14,.008,'#6b9e91');box(s,r.minX+.83,2.35,r.maxZ-.02,.55,.14,.008,'#f5edcf');
  // A few oversized, quiet tile lines make this shorter shot feel precise.
  for(let x=r.minX+.55;x<r.maxX;x+=.82)stroke(s,p(x,.015,r.minZ),p(x,.015,r.maxZ),'#c7c7aa');for(let z=r.minZ+.4;z<r.maxZ;z+=.82)stroke(s,p(r.minX,.015,z),p(r.maxX,.015,z),'#c7c7aa');
}
function passageDetail(s,world){
  if(world.windowOpenings?.length){windowCrossingDetail(s,world);return;}
  const r=roomBounds(world),y=.008;
  // Parallel strips and pale glass make the route readable while leaving the
  // actual moving student and bin as the strongest foreground silhouettes.
  for(let z=r.minZ+.25;z<r.maxZ;z+=.75)flat(s,r.minX+.15,y,z,r.maxX-r.minX-.30,.028,'#c2c7a9');
  for(const x of [r.minX+.16,r.maxX-.16])stroke(s,p(x,y,r.minZ),p(x,y,r.maxZ),'#b1bb9c');
  for(let z=r.minZ+.28;z<r.maxZ;z+=1.5){s.push({points:[p(r.minX,r.height,z),p(r.maxX,r.height,z)],line:true,stroke:'rgba(184,165,119,.45)',depthWrite:false});}
  for(const side of [-1,1]){const x=side<0?r.minX+.014:r.maxX-.014;
    for(let z=r.minZ+.2;z<r.maxZ-.2;z+=1.5){s.push({...face([p(x,.75,z),p(x,.75,z+1.32),p(x,2.45,z+1.32),p(x,2.45,z)],'rgba(190,218,202,.16)'),depthWrite:false});stroke(s,p(x,1.65,z),p(x,1.65,z+1.32),'#d8dec4');}
  }
}
function windowCrossingDetail(s,world){
  const r=roomBounds(world),corridor=world.passageRooms.corridor;
  // Both classroom openings stay empty. Painted trim sits on the actual
  // wall bands; it is not a glass pane across a physically open window.
  for(const opening of world.windowOpenings){
    const {x,z,width,bottom,top,depth}=opening,left=x-width/2,right=x+width/2,t=.065;
    for(const front of [-1,1]){
      const plane=z+(front<0?-.001:depth+.001);
      for(const [a,b,c,d] of [[left-t,bottom-t,left,top+t],[right,bottom-t,right+t,top+t],[left,bottom-t,right,bottom],[left,top,right,top+t]])
        s.push({...face([p(a,b,plane),p(c,b,plane),p(c,d,plane),p(a,d,plane)],SCHOOL_PALETTE.teal),windowId:opening.id});
      stroke(s,p(left,bottom,plane),p(right,bottom,plane),'#dfbf76');
    }
  }
  // The crosswise corridor has tile joints and a pair of travel lanes. The
  // classroom floors remain warm wood, making the three spaces legible.
  for(let x=r.minX+.5;x<r.maxX;x+=.8)stroke(s,p(x,.012,corridor.minZ),p(x,.012,corridor.maxZ),'#b9c2b0');
  for(let z=corridor.minZ+.3;z<corridor.maxZ;z+=.65)stroke(s,p(r.minX,.012,z),p(r.maxX,.012,z),'#c5ccba');
  for(const z of [corridor.minZ+.18,corridor.maxZ-.18])flat(s,r.minX+.15,.014,z,r.maxX-r.minX-.3,.035,'#e5cf92');
  // Quiet direction marks describe the hallway, without showing a throw path.
  for(const [x,z,direction] of [[-2.3,2.5,1],[2.3,3.85,-1]]){
    s.push(face([p(x-direction*.18,.017,z-.10),p(x+direction*.20,.017,z),p(x-direction*.18,.017,z+.10)],'#b4c1ae'));
  }
  const back=r.maxZ-.011;
  box(s,-2.7,1.05,back-.035,3.3,1.35,.035,'#ba9866');
  box(s,-2.62,1.13,back-.057,3.14,1.19,.018,'#4c7e70');
  for(const [x,y,w] of [[-2.32,2.03,.8],[-2.32,1.85,1.5],[-2.32,1.65,1.1],[-.65,2.15,.65]])stroke(s,p(x,y,back-.06),p(x+w,y,back-.06),'#c7d8bc');
  box(s,-2.72,1.02,back-.12,3.34,.055,.12,'#c8aa75');
  box(s,1.2,1.38,back-.028,1.15,.95,.028,'#bb9e72');
  for(const [x,y,c] of [[1.30,1.50,'#f4edda'],[1.76,1.68,'#e9d99e']])box(s,x,y,back-.043,.36,.48,.012,c);
  for(const z of [6.0,7.7]){
    const x=r.minX+.008;
    s.push({...face([p(x,1.18,z),p(x,1.18,z+1.25),p(x,2.6,z+1.25),p(x,2.6,z)],'#b5d6d0'),depthWrite:false});
    stroke(s,p(x+.006,1.9,z),p(x+.006,1.9,z+1.25),'#f6ebd4');
  }
  // Books and a notebook stay flat on the real source desk.
  flat(s,-.38,.804,-.7,.31,.25,'#f4ead3');flat(s,-.35,.807,-.66,.25,.18,'#aec6ad');
}
function rooftopDetail(s,world,solids){
  const floor=solids.find(c=>c.kind==='roof'||/roof-floor|roof-slab|roof-platform/.test(`${kindOf(c)} ${c.id}`)),r=roomBounds(world);
  if(floor){const a=floor.min,b=floor.max;for(let x=a.x+.35;x<b.x;x+=.75)stroke(s,p(x,b.y+.008,a.z),p(x,b.y+.008,b.z),'#c3c1a2');for(let z=a.z+.4;z<b.z;z+=.75)stroke(s,p(a.x,b.y+.008,z),p(b.x,b.y+.008,z),'#c3c1a2');}
  // The height is communicated by real stacked school windows on the outer
  // wall and a visible courtyard below, rather than by a screen-space caption.
  const wall=solids.find(c=>c.id==='school-building');
  if(wall){const first=s.length,a=wall.min,b=wall.max;for(const z of [a.z-.026,b.z+.011])for(let y=1;y<b.y-.7;y+=2.3)for(let x=a.x+.45;x<b.x-.5;x+=1.4){box(s,x,y,z,.95,1.30,.018,'#a7c9c0');box(s,x+.445,y,z-.003,.045,1.30,.024,'#efe7cc');}for(const shape of s.slice(first))shape.shellId=wall.id;}
  // Wind ribbons are drawn from the real rooftop wind direction below.
  const source=world.origin;stroke(s,p(source.x-1.1,source.y-.5,source.z-.45),p(source.x-1.1,source.y+.05,source.z-.45),'#b8aa82');
}
function groundDetail(s,world){
  const r=roomBounds(world),type=typeOf(world);if(type==='rooftop')return;
  if(world.windowOpenings?.length){
    for(const [name,room] of Object.entries(world.passageRooms)){
      const tile=name==='corridor';flat(s,r.minX,0,room.minZ,r.maxX-r.minX,room.maxZ-room.minZ,tile?'#d6dcc8':'#d4b27f');
      if(!tile)for(let x=r.minX;x<r.maxX-.01;x+=.52)for(let z=room.minZ;z<room.maxZ-.01;z+=1.2)
        flat(s,x,.002,z,Math.min(.515,r.maxX-x),Math.min(1.19,room.maxZ-z),['#d5b787','#cfad7c','#d8bb8c'][Math.abs(Math.round(x*5+z*2))%3]);
    }
    return;
  }
  flat(s,r.minX,0,r.minZ,r.maxX-r.minX,r.maxZ-r.minZ,type==='classroom'?'#d1b07f':'#d9d1ac');
  if(type==='classroom')for(let x=r.minX;x<r.maxX-.01;x+=.42)for(let z=r.minZ;z<r.maxZ-.01;z+=1.32){const w=Math.min(.415,r.maxX-x),d=Math.min(1.31,r.maxZ-z);flat(s,x,.002,z,w,d,['#d5b787','#cfad7c','#d8bb8c'][Math.abs(Math.round(x*5+z*2))%3]);}
}
function buildGroups(world){
  const solids=schoolSolids(world),groups=[];
  for(const c of solids){const shapes=[],id=c.id;physicalBox(shapes,c,surfaceColor(c));groups.push({id,object:kindOf(c),bounds:boundsOf(c),shapes,physical:true});}
  const background=[];groundDetail(background,world);schoolBackdrop(background,world);groups.unshift({id:'school-background',shapes:background,physical:false});
  const detail=[],type=typeOf(world);if(type==='classroom')classroomDetail(detail,world);else if(type==='vending')vendingDetail(detail,world,solids);else if(type==='passage')passageDetail(detail,world);else if(type==='rooftop')rooftopDetail(detail,world,solids);
  groups.push({id:'school-detail',shapes:detail,physical:false});return groups;
}
function sightIntersects(bounds,camera,target){
  let lo=0,hi=1;for(const axis of ['x','y','z']){const cap=axis.toUpperCase(),delta=target[axis]-camera[axis],min=bounds['min'+cap],max=bounds['max'+cap];if(Math.abs(delta)<1e-8){if(camera[axis]<min||camera[axis]>max)return false;continue;}let a=(min-camera[axis])/delta,b=(max-camera[axis])/delta;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;}return hi>0&&lo<1;
}
const transparent=(color,alpha)=>color&&/^#[0-9a-f]{6}$/i.test(color)?`rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${alpha})`:color;
export function schoolCameraConfig(world){return {azimuth:world?.view?.azimuth??.18,elevation:world?.view?.elevation??.43,zoom:1};}
export function schoolScene(camera,world){
  if(world?.environment!=='school')throw new RangeError('A frozen school world is required');
  const key=`${world.stageId}/${world.worldVersion}`;if(!cache.has(key))cache.set(key,buildGroups(world));const groups=cache.get(key),shapes=[],cutaway=[];
  const endpoints=[world.origin,{...world.bin.center,y:world.bin.height}];
  const shellFade=new Set(groups.filter(g=>g.physical&&/wall|ceiling|roof-cover|passage-roof|building/.test(`${g.id} ${g.object}`)&&(/ceiling|roof-cover|passage-roof/.test(`${g.id} ${g.object}`)||endpoints.some(q=>sightIntersects(g.bounds,camera,q)))).map(g=>g.id));
  for(const group of groups){
    // Only architectural shells cut away. Desks/chairs remain fully solid;
    // no future throw trajectory is consulted to reveal a possible route.
    const glass=typeOf(world)==='passage'&&['left-wall','right-wall'].includes(group.id);
    const partition=world.windowOpenings?.length&&group.object==='window-wall';
    const shell=group.physical&&/wall|ceiling|roof-cover|passage-roof|building/.test(`${group.id} ${group.object}`),faded=glass||partition||shell&&(/ceiling|roof-cover|passage-roof/.test(`${group.id} ${group.object}`)||endpoints.some(q=>sightIntersects(group.bounds,camera,q)));
    if(faded){cutaway.push(group.id);const alpha=glass?.10:/ceiling|roof-cover|passage-roof/.test(`${group.id} ${group.object}`)?.045:.16;shapes.push(...group.shapes.map(s=>({...s,fill:transparent(s.fill,alpha),stroke:transparent(s.stroke,alpha),depthWrite:false})));}
    else shapes.push(...group.shapes.map(shape=>shape.shellId&&shellFade.has(shape.shellId)?{...shape,fill:transparent(shape.fill,.16),stroke:transparent(shape.stroke,.16),depthWrite:false}:shape));
  }
  return {shapes,cutaway,groups:groups.map(({id,object,bounds,physical})=>({id,object,bounds,physical})),worldVersion:world.worldVersion,stageId:world.stageId};
}
export function schoolMotionShapes(time,world,reducedMotion=false){
  const shapes=[],type=typeOf(world);
  if(type==='rooftop'){
    const o=world.origin,t=reducedMotion?0:time,wind=world.wind?.x??world.wind?.acceleration?.x??.3,direction=wind<0?-1:1;
    const x=o.x-1.1,y=o.y-.08,z=o.z-.45,wave=reducedMotion?0:Math.sin(t*2.2)*.035;
    shapes.push(face([p(x,y,z),p(x+direction*.32,y+.035,z+wave),p(x+direction*.48,y-.02,z+wave*.6),p(x+direction*.32,y-.105,z+wave),p(x,y-.10,z)],'#dfb557'));return shapes;
  }
  if(type!=='passage')return shapes;
  const poses=schoolStudentPoses(world,time);
  for(const [index,pose] of poses.entries()){
  const center=pose.position??pose,origin=p(center.x,center.y??0,center.z),heading=pose.heading??(pose.direction<0?-Math.PI/2:Math.PI/2),t=reducedMotion?0:time;
  // A calm, faceted school uniform. Feet and a floor shadow show exactly where
  // the moving collision envelope sits; gait never changes that envelope.
  const human=[],gait=reducedMotion?0:Math.sin(t*5.5)*.09,bob=reducedMotion?0:Math.sin(t*11)*.008;
  box(human,-.19,.74+bob,-.115,.38,.47,.23,index===1?'#a08d65':'#477e78');box(human,-.17,.59,-.115,.34,.16,.23,'#698e7b');
  box(human,-.039,1.13+bob,-.125,.078,.08,.018,'#e7d9b4');box(human,-.028,1.01+bob,-.139,.056,.13,.016,'#d3b46b');
  cylinder(human,0,1.2+bob,0,.065,.08,'#d8b896');ellipsoid(human,0,1.44+bob,-.005,.142,.175,.13,'#ead0aa',10,4);ellipsoid(human,0,1.53+bob,.008,.148,.113,.137,'#75684c',10,3);
  // A small eye and fringe on the forward face keep the character friendly.
  for(const side of [-1,1])box(human,side*.054-.006,1.447+bob,-.134,.012,.012,.012,'#535f4c');box(human,-.12,1.51+bob,-.13,.24,.035,.012,'#786b50');
  for(const side of [-1,1]){
    const stride=side*gait;box(human,side*.083-.054,.095,stride-.05,.108,.51,.11,'#496e66');box(human,side*.083-.064,.025,stride-.093,.128,.084,.18,'#6d7560');
    box(human,side<0?-.256:.193,.84+bob,-stride-.063,.063,.29,.12,'#51877b');ellipsoid(human,side*.226,.80+bob,-stride,.040,.055,.047,'#e7c59e',8,3);
  }
  // One flat satchel rests within the same torso envelope.
  box(human,-.165,.78,.116,.30,.32,.038,index===1?'#7c9e8a':'#cba572');box(human,-.135,.78,.156,.24,.04,.015,'#ac8c61');
  const cos=Math.cos(heading),sin=Math.sin(heading),rotated=human.map(shape=>({...shape,points:shape.points.map(q=>p(q.x*cos-q.z*sin,q.y,q.x*sin+q.z*cos))})),vertices=rotated.flatMap(s=>s.points),minimum=Object.fromEntries(['x','y','z'].map(k=>[k,Math.min(...vertices.map(p=>p[k]))])),maximum=Object.fromEntries(['x','y','z'].map(k=>[k,Math.max(...vertices.map(p=>p[k]))])),envelope=pose.colliders?.[0]??{min:p(origin.x-world.student.width/2,origin.y,origin.z-world.student.depth/2),max:p(origin.x+world.student.width/2,origin.y+world.student.height,origin.z+world.student.depth/2)};
  // Align the visible body's envelope to the very same moving collision box,
  // including its head height. The decorative ground shadow is separate.
  shapes.push(...rotated.map(shape=>({...shape,studentId:pose.id,points:shape.points.map(q=>Object.fromEntries(['x','y','z'].map(k=>[k,envelope.min[k]+(q[k]-minimum[k])/(maximum[k]-minimum[k])*(envelope.max[k]-envelope.min[k])])))})));
  oval(shapes,origin.x,origin.y+.010,origin.z,.23,.25,'rgba(79,91,63,.16)');
  // Visible pale footprints anticipate the same route without forecasting a
  // projectile. They stay under the student and within the passage floor.
  if(!reducedMotion){const beat=(time*.88)%1;if(beat>.72){const sign=pose.direction??1;oval(shapes,origin.x-sign*.22,origin.y+.012,origin.z,.065,.045,`rgba(144,157,115,${(1-beat)*.65})`);}}
  }
  return shapes;
}
