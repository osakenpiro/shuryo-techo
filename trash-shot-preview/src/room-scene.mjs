// Peripheral room furniture is presentation only and stays outside the throw lane.
// Chapter desks draw from the exact bounds owned by the course collision module.
export const ROOM_PALETTE=Object.freeze({cream:'#f4ead5',teal:'#438f88',darkTeal:'#286864',wood:'#c89357',gold:'#e8b54e',orange:'#e98238'});
export const ROOM_LANE=Object.freeze({minX:-1.65,maxX:1.65,minZ:-1,maxZ:7.6});
export const ROOM_MONITOR_QUAD=Object.freeze([{x:3.12,y:2.22,z:4.28},{x:4.1,y:2.22,z:4.28},{x:4.1,y:1.66,z:4.28},{x:3.12,y:1.66,z:4.28}].map(Object.freeze));
const p=(x,y,z)=>({x,y,z});
const face=(points,fill,stroke=null)=>({points,fill,stroke});
const groups=[];
function group(id,bounds,build,extra=false){const shapes=[];build(shapes);groups.push({id,bounds,shapes,extra});}
function box(s,x,y,z,w,h,d,color=ROOM_PALETTE.wood){
  const a=p(x,y,z),b=p(x+w,y,z),c=p(x+w,y,z+d),e=p(x,y,z+d),f=p(x,y+h,z),g=p(x+w,y+h,z),i=p(x+w,y+h,z+d),j=p(x,y+h,z+d);
  s.push(face([a,b,g,f],color),face([b,c,i,g],shade(color,-16)),face([c,e,j,i],shade(color,-7)),face([e,a,f,j],shade(color,8)),face([f,g,i,j],shade(color,20)));
}
function beveledTop(s,x,y,z,w,h,d,color){
  const b=Math.min(.045,h*.3),ring=(inset,level)=>[p(x+inset,level,z+inset),p(x+w-inset,level,z+inset),p(x+w-inset,level,z+d-inset),p(x+inset,level,z+d-inset)];
  box(s,x,y,z,w,h-b,d,color);const lower=ring(0,y+h-b),upper=ring(b,y+h);
  for(let i=0;i<4;i++)s.push(face([lower[i],lower[(i+1)%4],upper[(i+1)%4],upper[i]],shade(color,12+i*2)));
  s.push(face(upper,shade(color,22)));
}
function shade(color,amount){return '#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+amount)).toString(16).padStart(2,'0')).join('');}
function cylinder(s,x,y,z,r,h,color,n=10){
  const lo=Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,y,z+Math.sin(i/n*Math.PI*2)*r));
  const hi=lo.map(q=>({...q,y:y+h}));
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,Math.round(Math.cos(i/n*Math.PI*2)*12))));
  s.push(face(hi,shade(color,12)));
}
function plant(s,x,y,z,size=.6){
  cylinder(s,x,y,z,size*.25,size*.38,'#d9b47a');
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2,tip=p(x+Math.cos(a)*size*.46,y+size*(.8+(i%3)*.21),z+Math.sin(a)*size*.46),root=p(x,y+size*.25,z);
    s.push(face([root,p(x+Math.cos(a+.55)*size*.25,y+size*.63,z+Math.sin(a+.55)*size*.25),tip,p(x+Math.cos(a-.55)*size*.22,y+size*.67,z+Math.sin(a-.55)*size*.22)],i%2?'#6a9c71':'#88b27c'));
  }
}
// All room planes, even stripes and sunlight, are projected in world space.
group('floor',null,s=>{
  s.push(face([p(-4.8,-.03,-2),p(4.8,-.03,-2),p(4.8,-.03,9.2),p(-4.8,-.03,9.2)],'#b98750'));
  for(let row=0;row<18;row++)for(let col=-1;col<4;col++){
    const x=-4.8+row*.534,z=-2+col*2.8+(row%2)*1.4,z0=Math.max(-2,z),z1=Math.min(9.2,z+2.8);
    if(z1>z0)s.push(face([p(x,.001,z0+.009),p(x+.527,.001,z0+.009),p(x+.527,.001,z1-.009),p(x,.001,z1-.009)],['#d5ac7b','#d1a777','#d8b080','#d3aa7a'][row%4]));
  }
  s.push(face([p(-1.25,.012,-.6),p(1.25,.012,-.6),p(1.25,.012,6.7),p(-1.25,.012,6.7)],'#ece3ca'));
  for(let z=-.5;z<6.7;z+=.55)s.push(face([p(-1.18,.014,z),p(1.18,.014,z),p(1.18,.014,z+.17),p(-1.18,.014,z+.17)],'#aec2ad'));
  // Warm window light; a painted plane rather than a screen-space overlay.
  s.push(face([p(-4.1,.006,4.3),p(-2.8,.006,4.6),p(-1.8,.006,7.8),p(-3.8,.006,7.1)],'#e7c68d'));
  for(const [x,z,rx,rz] of [[-3.2,6.9,1.3,2.0],[3.4,4.4,1.1,1.05],[3.1,2.9,.57,.56],[1.45,8.72,1.05,.4],[3.63,7.02,.58,.5]]){
    s.push({...face(Array.from({length:20},(_,i)=>p(x+Math.cos(i/20*Math.PI*2)*rx,.024,z+Math.sin(i/20*Math.PI*2)*rz)),'rgba(96,70,43,.12)'),depthWrite:false});
  }
});
group('back-wall',null,s=>{
  box(s,-4.8,0,9.2,9.6,3.65,.12,'#f1e6cf');
  box(s,-4.8,0,9.15,9.6,.16,.06,'#d5bc95');
  // A deep frame, blue glass and pale curtains make the room inhabited.
  box(s,-3.95,1.05,9.02,3.35,2.15,.12,'#d2b07d');
  box(s,-3.78,1.21,8.99,3.01,1.82,.07,'#a4cdd3');
  box(s,-3.73,1.25,8.95,1.42,.7,.035,'#c4dfdc');
  box(s,-3.73,2.07,8.94,1.42,.89,.035,'#abd5dc');
  box(s,-2.19,1.25,8.95,1.37,1.71,.035,'#bdd9d7');
  box(s,-2.33,1.2,8.85,.09,1.85,.16,'#f3ead7');
  box(s,-3.79,2.0,8.86,3.02,.09,.15,'#f3ead7');
  box(s,-4.12,1.0,8.74,.38,2.31,.14,'#fff4df');box(s,-.79,1.0,8.74,.38,2.31,.14,'#fff4df');
  box(s,-4.22,3.36,8.73,3.99,.07,.08,'#ac895a');
  box(s,3.26,1.95,9.0,.86,.9,.09,'#b29369');box(s,3.33,2.02,8.97,.72,.76,.04,'#f8efd9');
  s.push(face([p(3.42,2.15,8.92),p(3.95,2.15,8.92),p(3.74,2.68,8.92)],'#77a29b'));
});
group('left-wall',null,s=>{
  box(s,-4.92,0,-2,.12,3.65,11.2,'#eee1c7');box(s,-4.78,0,-2,.04,.16,11.2,'#c9af88');
  box(s,-4.75,0,-.9,.11,2.75,1.38,'#5f9990');box(s,-4.61,.13,-.76,.03,2.47,1.1,'#77aca0');
  cylinder(s,-4.56,1.23,.17,.055,.05,'#e6b657',8);
  box(s,-4.68,2.05,2.5,.09,.73,.82,'#b28b60');box(s,-4.57,2.12,2.57,.025,.59,.68,'#f8ecd4');
  s.push(face([p(-4.53,2.2,2.65),p(-4.53,2.2,3.14),p(-4.53,2.57,2.91)],'#d6a25c'));
});
group('right-wall',null,s=>{box(s,4.8,0,-2,.12,3.65,11.2,'#f2e6cf');box(s,4.75,0,-2,.04,.16,11.2,'#d3b78f');});
group('front-wall',null,s=>{box(s,-4.8,0,-2.12,9.6,3.65,.12,'#f1e6cf');});
group('bed',{minX:-4.35,maxX:-1.48,minZ:5.05,maxZ:8.8},s=>{
  box(s,-4.25,.16,5.15,2.08,.49,3.5,'#c69762');box(s,-4.3,.36,8.52,2.18,1.05,.14,'#b58651');
  beveledTop(s,-4.23,.65,5.17,2.04,.3,3.38,'#f6eddb');beveledTop(s,-4.22,.95,5.18,2.02,.08,2.45,'#f9efdc');
  box(s,-4.24,.92,5.15,2.05,.12,1.07,'#70a49c');box(s,-4.26,.5,5.12,2.09,.42,.05,'#67998f');
  beveledTop(s,-4.02,.96,7.68,.82,.2,.59,'#f9f1dd');beveledTop(s,-3.05,.96,7.68,.63,.2,.59,'#ddb665');
  box(s,-2.0,0,7.75,.48,.62,.65,'#cfa674');plant(s,-1.76,.62,8.08,.38);
});
group('shelf',{minX:.45,maxX:2.45,minZ:8.34,maxZ:9.12},s=>{
  box(s,.48,0,8.47,1.93,.15,.62,'#3d827c');box(s,.48,0,8.47,.13,2.62,.62,'#438b83');box(s,2.28,0,8.47,.13,2.62,.62,'#438b83');
  box(s,.61,.1,9.01,1.67,2.42,.06,'#5d9c91');
  for(const y of [.84,1.64,2.46])box(s,.52,y,8.45,1.87,.1,.66,'#4d948a');
  const colors=['#ebbd62','#efe0bf','#779b8e','#c67e49','#e6d4aa'];
  for(const y of [.15,.94,1.74])for(let i=0;i<7;i++)box(s,.69+i*.2,y,8.6,.14,.47+(i%3)*.07,.32,colors[i%5]);
  plant(s,.83,2.56,8.77,.49);cylinder(s,1.94,2.56,8.8,.16,.29,'#dfb069');
});
group('desk',{minX:2.2,maxX:4.35,minZ:2.5,maxZ:5.5},s=>{
  beveledTop(s,2.52,1.28,3.57,1.72,.15,1.62,'#c89b61');box(s,2.49,1.23,3.54,1.78,.07,1.69,'#ddb379');
  for(const x of [2.63,4.02])for(const z of [3.69,4.94])box(s,x,0,z,.12,1.28,.12,'#efe5cf');
  box(s,3.62,.54,3.8,.5,.62,1.14,'#c29a6c');for(const y of [.55,.85])box(s,3.6,y,3.77,.55,.25,.04,'#e7d3ac');
  for(const y of [.69,.99])box(s,3.82,y,3.72,.15,.035,.055,'#8b8662');
  // Chair faces the desk; seat/back and four legs have real depth.
  beveledTop(s,2.72,.63,2.58,.79,.13,.72,'#c3925c');box(s,2.72,.72,2.53,.79,.67,.12,'#cfa269');
  for(const x of [2.79,3.36])for(const z of [2.65,3.11])box(s,x,0,z,.09,.67,.09,'#e8dec6');
  box(s,2.88,1.45,4.44,.53,.035,.39,'#f0e1bf');box(s,2.91,1.49,4.45,.49,.025,.35,'#77a399');
  cylinder(s,3.71,1.44,4.73,.12,.23,'#629a91');
  for(let i=0;i<4;i++)box(s,3.63+i*.043,1.64,4.73,.018,.24+(i%2)*.06,.018,['#daa64b','#708c85'][i%2]);
  cylinder(s,3.0,1.44,4.95,.16,.035,'#b8824b');box(s,2.98,1.48,4.93,.035,.43,.035,'#aa845c');
  cylinder(s,3.0,1.88,4.95,.25,.17,'#e88c40');
  box(s,3.08,1.62,4.31,1.06,.64,.13,'#357570');box(s,3.12,1.66,4.28,.98,.56,.03,'#f4ead5');
  box(s,3.57,1.45,4.4,.08,.19,.08,'#397d77');beveledTop(s,3.35,1.43,4.28,.5,.035,.34,'#4e9189');
});
group('floor-plant',{minX:3.1,maxX:4.1,minZ:6.45,maxZ:7.5},s=>plant(s,3.63,0,7.02,1.12));
group('fan',{minX:-2.8,maxX:-1.82,minZ:2.55,maxZ:3.55},s=>{
  beveledTop(s,-2.7,0,2.7,.74,.12,.68,'#428981');box(s,-2.38,.1,2.99,.12,1.45,.12,'#eadfc5');
  const x=-2.15,y=1.53,z=3.05,n=18;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;s.push(face([p(x,y+Math.cos(a)*.48,z+Math.sin(a)*.48),p(x,y+Math.cos(b)*.48,z+Math.sin(b)*.48),p(x,y+Math.cos(b)*.41,z+Math.sin(b)*.41),p(x,y+Math.cos(a)*.41,z+Math.sin(a)*.41)],'#51978d'));}
  for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI*.75])s.push({points:[p(x+.014,y+Math.cos(angle)*.41,z+Math.sin(angle)*.41),p(x+.014,y-Math.cos(angle)*.41,z-Math.sin(angle)*.41)],line:true,stroke:'#ccd5bf'});
},true);
function intersectsSight(bounds,camera,target){
  let lo=0,hi=1;
  for(const axis of ['X','Z']){
    const key=axis.toLowerCase(),delta=target[key]-camera[key];
    if(Math.abs(delta)<1e-7){if(camera[key]<bounds['min'+axis]||camera[key]>bounds['max'+axis])return false;continue;}
    let a=(bounds['min'+axis]-.1-camera[key])/delta,b=(bounds['max'+axis]+.1-camera[key])/delta;
    if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;
  }
  return hi>0&&lo<1;
}
export function roomScene(camera,binZ=6,flight=[],extra=false,course=null){
  const shapes=[],cutaway=[];
  for(const g of groups){
    if(g.extra&&!extra)continue;
    if(g.id==='back-wall'&&camera.z>8.9||g.id==='front-wall'&&camera.z<-.8||g.id==='left-wall'&&camera.x<-4.5||g.id==='right-wall'&&camera.x>4.5)continue;
    const maxY={bed:1.5,shelf:3.15,desk:2.45,'floor-plant':1.6,fan:2.05}[g.id];
    const reached=g.bounds&&flight.some(q=>q.y<=maxY+.14&&q.x>=g.bounds.minX-.14&&q.x<=g.bounds.maxX+.14&&q.z>=g.bounds.minZ-.14&&q.z<=g.bounds.maxZ+.14);
    const wallReached=g.id==='back-wall'&&flight.some(q=>q.z>=9.06&&q.y<3.8)||g.id==='front-wall'&&flight.some(q=>q.z<=-1.86&&q.y<3.8)||g.id==='left-wall'&&flight.some(q=>q.x<=-4.66&&q.y<3.8)||g.id==='right-wall'&&flight.some(q=>q.x>=4.66&&q.y<3.8);
    const faded=reached||wallReached||g.bounds&&[p(0,1,0),p(0,1,binZ)].some(q=>intersectsSight(g.bounds,camera,q));
    if(faded){cutaway.push(g.id);const dim=c=>c?`rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},.23)`:null;for(const s of g.shapes)shapes.push({...s,fill:dim(s.fill),stroke:dim(s.stroke),depthWrite:false});}
    else shapes.push(...g.shapes);
  }
  // Physical desk surfaces come directly from the collider descriptor. They
  // remain visibly solid; only the peripheral bedroom furniture cuts away.
  if(course?.desk)for(const collider of course.desk.colliders){const a=collider.min,b=collider.max;box(shapes,a.x,a.y,a.z,b.x-a.x,b.y-a.y,b.z-a.z,collider.id==='desk-top'?'#b58959':'#bda079');}
  return {shapes,cutaway,groups:groups.filter(g=>!g.extra||extra).map(g=>({id:g.id,bounds:g.bounds})),course:course?.stageId??null};
}
export function roomMotionShapes(time,fanEnabled=true,reducedMotion=false){
  const shapes=[],t=reducedMotion?0:time,head={x:-2.13,y:1.53,z:3.05};
  for(let i=0;i<3;i++){
    const a=t*(fanEnabled?10:0)+i/3*Math.PI*2;
    shapes.push(face([p(head.x,head.y,head.z),p(head.x,head.y+Math.cos(a)*.35,head.z+Math.sin(a)*.35),p(head.x,head.y+Math.cos(a+.65)*.28,head.z+Math.sin(a+.65)*.28)],fanEnabled?'#d2b66b':'#baa575'));
  }
  box(shapes,-2.11,1.49,3.01,.06,.08,.08,'#e0bb58');
  const z=1.35+Math.sin(t*.55)*.72,x=-3.3;
  shapes.push({...face(Array.from({length:16},(_,i)=>p(x+.25+Math.cos(i/16*Math.PI*2)*.48,.028,z+.15+Math.sin(i/16*Math.PI*2)*.25)),'rgba(96,70,43,.14)'),depthWrite:false});
  beveledTop(shapes,x,.25,z,.53,.25,.29,'#dcb374');beveledTop(shapes,x+.39,.47,z-.02,.25,.22,.25,'#dfba81');
  for(const ex of [x+.42,x+.59])shapes.push(face([p(ex,.64,z+.02),p(ex+.08,.64,z+.02),p(ex+.038,.83,z+.08)],'#c6a16c'));
  for(const ex of [x+.06,x+.43])for(const ez of [z+.04,z+.21])box(shapes,ex,.05+Math.max(0,Math.sin(t*4+(ex===x+.06?0:Math.PI)))*.07,ez,.075,.24,.065,'#caa572');
  box(shapes,x-.11,.32,z+.1,.09,.46,.075,'#cea971');box(shapes,x-.18,.7,z+.1,.14,.075,.075,'#cea971');
  box(shapes,x+.58,.59,z-.025,.035,.025,.013,'#545c48');box(shapes,x+.55,.49,z-.04,.06,.034,.022,'#bc8d73');
  return shapes;
}
// Two clipped affine triangles preserve the monitor's projected screen quad.
export function paintScreenQuad(ctx,source,quad){
  if(!source||quad.length!==4||quad.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.visible===false))return false;
  const w=source.width,h=source.height;
  // The pixel game's opaque paper also covers antialiased triangle seams.
  ctx.save();ctx.beginPath();ctx.moveTo(quad[0].x,quad[0].y);for(const p of quad.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle='#f4ead5';ctx.fill();ctx.restore();
  for(const [a,b,c,uv] of [[quad[0],quad[1],quad[2],0],[quad[0],quad[2],quad[3],1]]){
    // A subpixel overlap covers the shared antialiased diagonal without a gap.
    const center={x:(a.x+b.x+c.x)/3,y:(a.y+b.y+c.y)/3},expanded=[a,b,c].map(p=>{const d=Math.hypot(p.x-center.x,p.y-center.y)||1;return {x:p.x+(p.x-center.x)/d*.7,y:p.y+(p.y-center.y)/d*.7};});
    ctx.save();ctx.beginPath();ctx.moveTo(expanded[0].x,expanded[0].y);ctx.lineTo(expanded[1].x,expanded[1].y);ctx.lineTo(expanded[2].x,expanded[2].y);ctx.closePath();ctx.clip();
    if(!uv)ctx.transform((b.x-a.x)/w,(b.y-a.y)/w,(c.x-b.x)/h,(c.y-b.y)/h,a.x,a.y);
    else ctx.transform((b.x-c.x)/w,(b.y-c.y)/w,(c.x-a.x)/h,(c.y-a.y)/h,a.x,a.y);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(source,0,0);ctx.restore();
  }
  return true;
}
