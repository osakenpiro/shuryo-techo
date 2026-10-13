// Architecture for the new outdoor views only. Legacy worlds 12 / 13 retain
// their original meshes and recordings. The field, apertures and balcony
// collision volumes remain owned by outdoor-world; these groups add a place
// around them, rather than a second set of gameplay obstacles.
const p=(x,y,z)=>({x,y,z});
const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const face=(points,fill,metadata={})=>({points,fill,stroke:null,decoration:true,...metadata});
const line=(s,a,b,stroke,metadata={})=>s.push({points:[a,b],line:true,stroke,decoration:true,...metadata});
const flat=(s,x,y,z,w,d,fill,metadata={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],fill,metadata));
function box(s,x,y,z,w,h,d,fill,metadata={}){
  const a=[p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],b=a.map(q=>({...q,y:y+h}));
  for(let i=0;i<4;i++)s.push(face([a[i],a[(i+1)%4],b[(i+1)%4],b[i]],shade(fill,[0,-13,-5,7][i]),metadata));
  s.push(face(b,shade(fill,17),metadata),face([...a].reverse(),shade(fill,-18),metadata));
}
function cylinder(s,x,y,z,r,h,fill,n=8,metadata={}){
  const a=Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,y,z+Math.sin(i/n*Math.PI*2)*r)),b=a.map(q=>({...q,y:y+h}));
  for(let i=0;i<n;i++)s.push(face([a[i],a[(i+1)%n],b[(i+1)%n],b[i]],shade(fill,Math.round(Math.cos(i/n*Math.PI*2)*9)),metadata));
  s.push(face(b,shade(fill,14),metadata));
}
function beam(s,a,b,halfWidth,fill,metadata={}){
  const d=p(b.x-a.x,b.y-a.y,b.z-a.z),length=Math.hypot(d.x,d.y,d.z),n=p(d.x/length,d.y/length,d.z/length),horizontal=Math.hypot(n.x,n.z);
  const u=horizontal>1e-9?p(n.z/horizontal,0,-n.x/horizontal):p(1,0,0),v=p(n.y*u.z-n.z*u.y,n.z*u.x-n.x*u.z,n.x*u.y-n.y*u.x);
  const ring=q=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>p(q.x+halfWidth*(u.x*x+v.x*y),q.y+halfWidth*(u.y*x+v.y*y),q.z+halfWidth*(u.z*x+v.z*y)));
  const lo=ring(a),hi=ring(b);
  for(let i=0;i<4;i++)s.push(face([lo[i],lo[(i+1)%4],hi[(i+1)%4],hi[i]],shade(fill,[2,-7,-3,9][i]),metadata));
  s.push(face(lo,shade(fill,-6),metadata),face(hi,shade(fill,10),metadata));
}
const group=(id,shapes,extra={})=>({id,object:id,shapes,physical:false,...extra});
const bound=shapes=>{
  const points=shapes.flatMap(s=>s.points),b={};
  for(const axis of ['x','y','z']){const upper=axis.toUpperCase();b['min'+upper]=Math.min(...points.map(q=>q[axis]));b['max'+upper]=Math.max(...points.map(q=>q[axis]));}
  return b;
};
const palette={cream:'#f4ead5',wall:'#eee2c6',wood:'#c89b61',teal:'#4a948b',darkTeal:'#286864',gold:'#e8b54e',green:'#91b782'};

function baseballField(world){
  const s=[],o=world.origin,m={architecturePart:'field-marking',planeOnly:true};
  // Light and dark grass strips, the infield arc and four white bases describe
  // an actual ballpark at the same scale as its forty-metre throw.
  for(let i=0;i<8;i++)flat(s,-15,.006,3+i*4.35,30,4.35,i%2?'#91b782':'#a4bf8b',m);
  const home=p(o.x,.019,o.z-.55),left=p(-6.4,.019,6.6),second=p(0,.019,13.1),right=p(6.4,.019,6.6);
  s.push(face([home,left,second,right],'#dbc497',m));
  const arc=[home,...Array.from({length:19},(_,i)=>p(Math.sin(-Math.PI/2+i/18*Math.PI)*10,.011,3+Math.cos(-Math.PI/2+i/18*Math.PI)*10))];
  s.push(face(arc,'#d4bd8f',m),face([home,left,second,right],'#dec89e',m));
  for(const [x,z] of [[-6.4,6.6],[0,13.1],[6.4,6.6]])s.push(face([p(x,.023,z-.23),p(x+.23,.023,z),p(x,.023,z+.23),p(x-.23,.023,z)],'#fff4dc',m));
  s.push(face([p(-.22,.024,-.7),p(.22,.024,-.7),p(.22,.024,-.44),p(0,.024,-.26),p(-.22,.024,-.44)],'#fff4dc',m));
  for(const side of [-1,1])line(s,home,p(side*15.7,.026,17),'#fff4dc',m);
  const mound=Array.from({length:12},(_,i)=>p(Math.cos(i/12*Math.PI*2)*1.2,.025,7+Math.sin(i/12*Math.PI*2)*1.2));
  s.push(face(mound,'#c3a478',m));flat(s,-.34,.027,6.91,.68,.16,'#f8edd5',m);
  for(const side of [-1,1]){const x=side*.88;for(const z of [-.84,.2])line(s,p(x-.25,.03,z),p(x+.25,.03,z),'#fff4dc',m);for(const dx of [-.25,.25])line(s,p(x+dx,.03,-.84),p(x+dx,.03,.2),'#fff4dc',m);}
  // Seat markings on the existing physical stand never protrude above it.
  const stand=world.solids.find(c=>c.id==='stadium-stand');
  for(let row=0;row<3;row++)for(let x=stand.min.x+.28;x<stand.max.x-.4;x+=.76){
    const z=stand.min.z+.65+row*1.45,y=stand.max.y+.002;
    flat(s,x,y,z,.46,.55,row%2?'#83ada0':'#abd0b6',{...m,sourceSolidId:stand.id});
    line(s,p(x,y+.001,z+.57),p(x+.46,y+.001,z+.57),'#426f68',m);
  }
  return group('stadium-field-and-real-stand-trim',s,{architectureRole:'plane-trim'});
}

function stadiumBowl(){
  const s=[],centerZ=27.5,n=32,at=(theta,rx,rz,y)=>p(Math.sin(theta)*rx,y,centerZ+Math.cos(theta)*rz);
  // The ellipse contains the entire rectangular physics field, including its
  // corners. Every seat, spectator and concourse is outside the playable room.
  for(let row=0;row<4;row++)for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,rx=29+row*1.9,rz=42.5+row*1.7,y=row*2.1;
    const lo=[at(a,rx,rz,y),at(b,rx,rz,y)],hi=[at(a,rx+1.7,rz+1.5,y+1.55),at(b,rx+1.7,rz+1.5,y+1.55)];
    const m={architecturePart:'bowl',outsidePlayArea:true,tier:row};
    s.push(face([lo[0],lo[1],hi[1],hi[0]],row%2?'#b9c9ad':'#9fbaa4',m));
    line(s,hi[0],hi[1],'#587d71',m);
    // A single low-poly seat back and a small head/torso silhouette per bay
    // provide population without consuming hundreds of detailed actors.
    const theta=(a+b)/2,q=at(theta,rx+.95,rz+.88,y+1.11),tangent=p(Math.cos(theta)*.36,0,-Math.sin(theta)*.36);
    const seat=[p(q.x-tangent.x,q.y,q.z-tangent.z),p(q.x+tangent.x,q.y,q.z+tangent.z),p(q.x+tangent.x,q.y+.46,q.z+tangent.z),p(q.x-tangent.x,q.y+.46,q.z-tangent.z)];
    s.push(face(seat,['#64988d','#e1be7d','#86a6b5','#bb9476'][row],{...m,architecturePart:'seat-back'}));
    if((i+row)%3!==0){
      const head=p(q.x,q.y+.92,q.z),body=p(q.x,q.y+.63,q.z),colors=['#81a090','#c59a6c','#a5b9b3','#d6bc82'];
      s.push(face([p(body.x-.14,body.y-.23,body.z),p(body.x+.14,body.y-.23,body.z),p(body.x+.12,body.y+.13,body.z),p(body.x-.12,body.y+.13,body.z)],colors[(i+row)%4],{...m,architecturePart:'background-spectator'}));
      s.push(face([p(head.x-.095,head.y-.095,head.z),p(head.x+.095,head.y-.095,head.z),p(head.x+.095,head.y+.095,head.z),p(head.x-.095,head.y+.095,head.z)],i%4?'#947958':'#c9b191',{...m,architecturePart:'background-spectator'}));
    }
  }
  // Deep teal outer fascia and vertical cream piers give the bowl a silhouette
  // rather than a loose collection of blocks. The back facade mounts the
  // existing scoreboard visually; it does not introduce an invisible pole.
  for(let i=0;i<n;i++){
    const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,m={architecturePart:'concourse',outsidePlayArea:true};
    s.push(face([at(a,37,49.5,0),at(b,37,49.5,0),at(b,37,49.5,10.5),at(a,37,49.5,10.5)],'#ded6b9',m));
    s.push(face([at(a,37.02,49.52,8.6),at(b,37.02,49.52,8.6),at(b,37.02,49.52,9.6),at(a,37.02,49.52,9.6)],palette.teal,m));
    line(s,at(a,37.03,49.53,.4),at(a,37.03,49.53,10.5),'#b8ad8f',m);
  }
  return group('stadium-elliptical-seated-bowl',s,{architectureRole:'background',bounds:bound(s)});
}

function stadiumRoof(){
  const panels=[],ribs=[],centerZ=27.5,at=(theta,r)=>p(Math.sin(theta)*37*r,20.2+15*Math.sqrt(Math.max(0,1-r*r)),centerZ+Math.cos(theta)*49.5*r);
  const rings=[1,.88,.68,.43,.15,0];
  // The near half is deliberately removed as a diorama cutaway. The remaining
  // pearl shell and curved ribs still read as a dome, above the physics room.
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<16;i++){
    const a=-Math.PI/2+i/16*Math.PI,b=-Math.PI/2+(i+1)/16*Math.PI;
    panels.push(face([at(a,rings[k]),at(b,rings[k]),at(b,rings[k+1]),at(a,rings[k+1])],k%2?'rgba(244,234,213,0.24)':'rgba(222,231,213,0.26)',{architecturePart:'dome-shell',depthWrite:false,outsidePlayArea:true}));
  }
  // Seven filled, shaded rib beams carry the pearl shell. Their square
  // cross-sections remain above y=20, beyond the complete ballistic room.
  for(let i=0;i<=6;i++){
    const theta=-Math.PI/2+i/6*Math.PI;
    for(let k=0;k<rings.length-1;k++)beam(ribs,at(theta,rings[k]),at(theta,rings[k+1]),.12,'#849f95',{architecturePart:'roof-rib',depthWrite:false,outsidePlayArea:true});
  }
  for(const r of [1,.68,.15])for(let i=0;i<16;i++)line(ribs,at(-Math.PI/2+i/16*Math.PI,r),at(-Math.PI/2+(i+1)/16*Math.PI,r),'#a3b6a6',{architecturePart:'roof-rib',depthWrite:false,outsidePlayArea:true});
  const m={architectureRole:'roof-shell',architecturalShell:true,bounds:bound([...panels,...ribs]),cutaway:'near-half-open'};
  // The ribs themselves are beyond all playable heights and remain readable.
  // Their open curved shape is not an enclosing box; an AABB shell fade would
  // incorrectly wash them out whenever a ray passes through the empty dome.
  return [group('stadium-open-dome-shell',panels,m),group('stadium-curved-roof-ribs',ribs,{...m,architecturalShell:false})];
}

function stadiumScoreboard(world){
  const s=[],c=world.solids.find(c=>c.id==='stadium-scoreboard'),z=c.min.z-.002,m={architecturePart:'scoreboard-paint',planeOnly:true,sourceSolidId:c.id};
  const painted=(x,y,w,h,color)=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],color,m));
  painted(c.min.x+.24,c.min.y+.24,c.max.x-c.min.x-.48,.12,'#82a696');
  painted(c.min.x+.24,c.max.y-.36,c.max.x-c.min.x-.48,.12,'#82a696');
  for(let x=c.min.x+.5;x<c.max.x-.5;x+=.65)painted(x,c.max.y-.95,.35,.13,'#c9d0ae');
  // Conventional innings and seven-segment digits anchor a recognizable score
  // board. The actual gold alternative aperture is rendered by outdoor-scene.
  for(let row=0;row<2;row++)for(let column=0;column<8;column++){
    const x=-5.2+column*.64,y=11+row*1.2;
    for(const dy of [0,.68])painted(x,y+dy,.3,.06,'#d9d8b6');
    for(const dx of [0,.24])painted(x+dx,y+.06,.06,.62,'#d9d8b6');
  }
  return group('stadium-scoreboard-innings',s,{architectureRole:'plane-trim'});
}

function mallFloorAndEdges(world){
  const s=[],source=[],room=world.room,m={architecturePart:'tile-floor',planeOnly:true};
  for(let x=room.minX;x<room.maxX;x+=1)for(let z=room.minZ;z<room.maxZ;z+=1)flat(s,x,.003,z,Math.min(1,room.maxX-x),Math.min(1,room.maxZ-z),(Math.round(x+z)%2)?'#efe5cd':'#e6dbc2',m);
  for(let x=room.minX+.5;x<room.maxX;x+=1)line(s,p(x,.005,room.minZ),p(x,.005,room.maxZ),'#d8cbaa',m);
  for(let z=room.minZ+.5;z<room.maxZ;z+=1)line(s,p(room.minX,.005,z),p(room.maxX,.005,z),'#d8cbaa',m);
  // Upper floor trim is supported by the real balcony tops. The hole remains
  // completely open; no cosmetic floor spans the falling scoop's path.
  for(const c of world.solids.filter(c=>c.kind==='balcony')){
    const mm={architecturePart:'balcony-floor-trim',planeOnly:true,sourceSolidId:c.id},y=c.max.y+.002,into=c.id==='mall-source-balcony'?source:s;
    flat(into,c.min.x,y,c.min.z,c.max.x-c.min.x,c.max.z-c.min.z,'#e1d5b9',mm);
    for(let z=c.min.z+.45;z<c.max.z;z+=.75)line(into,p(c.min.x+.06,y+.001,z),p(c.max.x-.06,y+.001,z),'#c5bba0',mm);
    if(c.id==='mall-source-balcony'){flat(into,-.45,y+.002,-.93,.9,.32,'#caa46b',mm);}
    else {const x=c.id.includes('left')?c.max.x-.06:c.min.x+.06;line(s,p(x,y+.001,c.min.z+.08),p(x,y+.001,c.max.z-.08),'#749989',mm);}
  }
  // Source balcony paint must fade with its physical slab when it occludes
  // the downstairs child. Keeping it separate also leaves all lower floors
  // fully opaque, preserving the depth cue of the open atrium.
  return [group('mall-atrium-floor-and-real-balconies',s,{architectureRole:'plane-trim'}),group('mall-source-floor-trim',source,{architectureRole:'plane-trim',sourceBalcony:true,architecturalShell:true,bounds:bound(source)})];
}

function mallPhysicalRailTrim(world){
  const s=[];
  for(const c of world.solids.filter(c=>c.id==='mall-source-left-rail'||c.id==='mall-source-right-rail')){
    const m={architecturePart:'real-glass-rail-frame',sourceSolidId:c.id},w=c.max.x-c.min.x,h=c.max.y-c.min.y,d=c.max.z-c.min.z;
    box(s,c.min.x,c.max.y-.065,c.min.z,w,.065,d,palette.wood,m);
    box(s,c.min.x,c.min.y,c.min.z,w,.035,d,'#a3b6a6',m);
    for(let x=c.min.x;x<c.max.x-.06;x+=.72)box(s,x,c.min.y,c.min.z,.06,h,d,'#8fa596',m);
    box(s,c.max.x-.06,c.min.y,c.min.z,.06,h,d,'#8fa596',m);
  }
  return group('mall-real-source-balustrade-frames',s,{architectureRole:'physical-trim'});
}

function mallStorefronts(world){
  const s=[],wall=world.solids.find(c=>c.id==='mall-back-wall'),z=wall.min.z-.002,m={architecturePart:'storefront-paint',planeOnly:true,sourceSolidId:wall.id};
  const painted=(x,y,w,h,color)=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],color,m));
  // Different frontage rhythms make the three levels read as one shopping
  // centre, with an atrium around them, instead of detached floating platforms.
  for(const [level,y] of [[0,0],[1,2.3],[2,4.5],[3,7.3]]){
    for(const side of [-1,1]){
      const x=side<0?-5.75:3.28,w=2.45;
      painted(x,y+.15,w,1.65,level%2?'#aac6bb':'#b5c8bc');
      painted(x-.08,y+1.82,w+.16,.25,[palette.teal,'#c9a66a','#9baa91',palette.teal][level]);
      for(let k=0;k<4;k++)painted(x+.24+k*.45,y+1.92,.26,.055,'#f6ebd4');
      painted(x+.7,y+.2,.065,1.57,'#d2dbc5');painted(x+1.55,y+.2,.065,1.57,'#d2dbc5');
      for(let k=0;k<3;k++)painted(x+.2+k*.78,y+.3,.48,.6+[.05,.2,0][k],['#91ae8c','#e0b870','#d3c1a0'][(k+level)%3]);
    }
    // Horizontal architectural bands are a mural on the real back wall.
    painted(-5.98,y+.025,11.96,.09,'#c6b996');
  }
  for(const x of [-3.15,3.1])painted(x,0,.16,10.35,'#d7ccb0');
  return group('mall-four-level-shopfront-mural',s,{architectureRole:'plane-trim'});
}

function mallOutsideArchitecture(){
  const s=[],m={architecturePart:'mall-outer-colonnade',outsidePlayArea:true};
  // Tall arcaded sides, stepped galleries and skylight edges sit outside the
  // six-metre-wide playable atrium. The platform/rail interiors stay canonical.
  for(const side of [-1,1]){
    const x=side<0?-6.6:6.1;
    for(const z of [-2.4,1,4.6]){box(s,x,0,z,.5,10.6,.5,'#ded2b4',m);box(s,x-.03,10.3,z-.03,.56,.35,.56,'#c3bca0',m);}
    for(const y of [2.2,4.4,7.2]){box(s,x,y,-2.6,.48,.16,8.6,'#d1c4a4',m);box(s,x,y+.16,-2.6,.48,.09,8.6,'#93afa0',m);}
    // An escalator flight behind each side edge connects the architecture
    // visually. All tread and balustrade geometry remains outside x±6.
    const ex=side<0?-7.55:6.8;
    for(let i=0;i<12;i++)box(s,ex,2.3+i*.195,.35+i*.32,.64,.08,.34,i%2?'#91a69a':'#b5c5af',{...m,architecturePart:'outer-escalator'});
    for(const dx of [0,.59])line(s,p(ex+dx,3.18,.35),p(ex+dx,5.52,4.2),'#5d877b',{...m,architecturePart:'outer-escalator'});
  }
  // A low oval information kiosk and planters live behind the far wall, never
  // between the falling scoop and the child holding the real cone.
  for(const x of [-4.8,4.8]){box(s,x-.3,0,6.62,.6,.55,.6,'#c4ab78',m);cylinder(s,x,.55,6.92,.28,.58,'#8eaf81',7,m);}
  const roof=[];
  for(const x of [-6.38,6.38])box(roof,x-.09,11.1,-2.65,.18,.13,9.25,'#8ca99d',{architecturePart:'skylight-frame',outsidePlayArea:true,depthWrite:false});
  for(const z of [-2.6,6.52])box(roof,-6.45,11.1,z,12.9,.13,.14,'#8ca99d',{architecturePart:'skylight-frame',outsidePlayArea:true,depthWrite:false});
  return [group('mall-outer-arcade-and-escalators',s,{architectureRole:'background',bounds:bound(s)}),group('mall-open-skylight-frame',roof,{architectureRole:'roof-shell',architecturalShell:true,bounds:bound(roof),cutaway:'open-centre'})];
}

export function outdoorArchitectureGroups(world){
  if(world?.worldVersion===31&&world.stageId==='outdoor-baseball')return [baseballField(world),stadiumBowl(),...stadiumRoof(),stadiumScoreboard(world)];
  if(world?.worldVersion===32&&world.stageId==='outdoor-mall')return [...mallFloorAndEdges(world),mallPhysicalRailTrim(world),mallStorefronts(world),...mallOutsideArchitecture()];
  return [];
}
