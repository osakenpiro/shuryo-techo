// A real-size school gym for revised world49 only. The old outdoor basket
// world22 keeps its original meshes and replay meaning.
// Dimensional references, read 2026-10-15:
// https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2024-v10a.pdf
// https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2024-official-basketball-rules-and-basketball-equipment.pdf
// The painted court is 28 x 15 m; lines are 5 cm; the board is 1.8 x 1.05 m.
// These dimensions guide the miniature; this school practice gym is not a
// claim of certified competition clearance around its court.
import {scenePrimitives} from './factory-scene.mjs?v=20261015-boar-distance-1';
const {p,face,box,physicalBox,line,flat,limb}=scenePrimitives;
const P=Object.freeze({wood:'#c59b68',woodLight:'#d4b07c',woodDark:'#ba925f',cream:'#eee5cf',light:'#f7efd9',teal:'#4b8980',dark:'#2b625e',steel:'#839d91',ink:'#345b54',orange:'#d7803e',paint:'#f5ebd2'});
const cache=new Map();
const finite=q=>q&&['x','y','z'].every(k=>Number.isFinite(q[k]));
function validate(world){
  if(world?.worldVersion!==49||world.stageId!=='eccentric-basket'||!Array.isArray(world.solids))throw new RangeError('Revised gym world49 is required');
  return world;
}
const envelope=c=>/ceiling/.test(c.kind+' '+c.id)||(/wall/.test(c.kind+' '+c.id)&&c.max.y-c.min.y>5);
const ceiling=c=>/ceiling/.test(c.kind+' '+c.id);
function taggedBox(s,c,color,meta={}){
  const start=s.length;physicalBox(s,c,color);
  for(let i=start;i<s.length;i++)Object.assign(s[i],meta);
}
function atWall(c,u,y,offset=.008){
  const side=c.max.x-c.min.x<c.max.z-c.min.z;
  if(side){const x=c.min.x<0?c.max.x+offset:c.min.x-offset;return p(x,y,u);}
  return p(u,y,c.min.z<0?c.max.z+offset:c.min.z-offset);
}
function wallQuad(s,c,u,y,w,h,color,meta={}){
  // The CPU depth buffer needs genuinely separated paint planes. Stacking
  // window glass / frames or pads / wainscot at the same depth produces noisy
  // moire; explicit millimetre-scale layers keep the approved quiet surfaces.
  const layer={wainscot:0,'window-reveal':0,'door-surround':0,'scoreboard-frame':0,'wall-chair-rail':1,skirting:1,'high-window':1,'closed-gym-double-door':1,'scoreboard-body':1,'school-emblem':1,'protective-wall-pad':2,'window-lower-glass':2,'door-glass':2,'scoreboard-team-label':2,'scoreboard-period':2,'exit-sign':2,'window-sill':3,'scoreboard-clock-colon':3}[meta.gymPart]??0,offset=.012+layer*.006;
  s.push(face([atWall(c,u,y,offset),atWall(c,u+w,y,offset),atWall(c,u+w,y+h,offset),atWall(c,u,y+h,offset)],color,null,{decoration:true,cutawayId:c.id,...meta}));
}
function wallStroke(s,c,u,y,v,yy,color,meta={}){
  line(s,atWall(c,u,y,.044),atWall(c,v,yy,.044),color,{decoration:true,cutawayId:c.id,...meta});
}
function groundStroke(s,a,b,width,color,meta={}){
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<1e-9)return;
  const x=-dz/length*width/2,z=dx/length*width/2;
  s.push(face([p(a.x+x,.034,a.z+z),p(b.x+x,.034,b.z+z),p(b.x-x,.034,b.z-z),p(a.x-x,.034,a.z-z)],color,null,{decoration:true,courtLine:true,...meta}));
}
function groundArc(s,cx,cz,r,start,end,color,segments=36,meta={}){
  const at=(a,rr)=>p(cx+Math.sin(a)*rr,.035,cz+Math.cos(a)*rr);
  for(let i=0;i<segments;i++){
    const a=start+(end-start)*i/segments,b=start+(end-start)*(i+1)/segments;
    s.push(face([at(a,r-.025),at(b,r-.025),at(b,r+.025),at(a,r+.025)],color,null,{decoration:true,courtLine:true,...meta}));
  }
}
function court(s,world){
  const goal=world.goals[0],ringZ=goal.center.z,far=ringZ+1.575,near=far-28,centre=(near+far)/2;
  const room=world.room??{},minX=room.minX??-8,maxX=room.maxX??8,minZ=room.minZ??-21.5,maxZ=room.maxZ??8.5;
  flat(s,minX,.010,minZ,maxX-minX,maxZ-minZ,P.wood,{gymPart:'sprung-wood-floor',decoration:true});
  // Wide maple strips and staggered joints read as a gym floor, rather than
  // a room scaled up. The quiet colour variation stays below court paint.
  let col=0;
  for(let x=minX;x<maxX-.01;x+=.44,col++){
    for(let z=minZ-((col%3)*.82);z<maxZ-.01;z+=2.47){
      const lo=Math.max(minZ,z),hi=Math.min(maxZ,z+2.45);if(hi<=lo)continue;
      flat(s,x,.016,lo,Math.min(.429,maxX-x),hi-lo,[P.wood,P.woodLight,P.wood,P.woodDark,P.wood][(col+Math.floor((z-minZ)/2.47)+20)%5],{gymPart:'maple-plank',decoration:true});
    }
  }
  for(const x of [-7.5,7.5])groundStroke(s,p(x,0,near),p(x,0,far),.05,P.paint);
  for(const z of [near,far,centre])groundStroke(s,p(-7.5,0,z),p(7.5,0,z),.05,P.paint);
  groundArc(s,0,centre,1.8,0,Math.PI*2,P.paint,64);
  // Full-size markings are anchored to the actual near basket; the opposite
  // end is painted as part of the same court, without inventing a second goal.
  for(const [end,inward] of [[far,-1],[near,1]]){
    const free=end+inward*5.8,rz=end+inward*1.575;
    flat(s,-2.45,.025,Math.min(end,free),4.9,Math.abs(end-free),'#bf986d',{gymPart:'painted-key',decoration:true});
    for(const x of [-2.45,2.45])groundStroke(s,p(x,0,end),p(x,0,free),.05,P.paint);
    groundStroke(s,p(-2.45,0,free),p(2.45,0,free),.05,P.paint);
    const start=inward<0?Math.PI/2:-Math.PI/2;
    groundArc(s,0,free,1.8,start,start+Math.PI,P.paint,32);
    // Dashed half of the free-throw circle, inside the lane.
    for(let i=0;i<10;i++)groundArc(s,0,free,1.8,start+Math.PI+i*Math.PI/10,start+Math.PI+(i+.48)*Math.PI/10,P.paint,2);
    const alpha=Math.asin(6.6/6.75),arcCentre=inward<0?Math.PI:0;
    groundArc(s,0,rz,6.75,arcCentre-alpha,arcCentre+alpha,P.paint,56);
    const join=rz+inward*Math.sqrt(6.75**2-6.6**2);
    for(const x of [-6.6,6.6])groundStroke(s,p(x,0,end),p(x,0,join),.05,P.paint);
    // Restricted-area semicircle and modest lane-space marks.
    groundArc(s,0,rz,1.25,start,start+Math.PI,P.paint,24);
    for(const x of [-2.45,2.45])for(const d of [1.75,2.65,3.55,4.45])groundStroke(s,p(x,0,end+inward*d),p(x+Math.sign(x)*.14,0,end+inward*d),.05,P.paint);
  }
  // Secondary school-court lines are deliberately quieter than basketball.
  for(const x of [-3.05,3.05])groundStroke(s,p(x,0,centre-6.7),p(x,0,centre+6.7),.025,'#779d91',{courtLineSport:'badminton'});
  for(const z of [centre-6.7,centre,centre+6.7])groundStroke(s,p(-3.05,0,z),p(3.05,0,z),.025,'#779d91',{courtLineSport:'badminton'});
}
function walls(s,world){
  for(const c of world.solids.filter(c=>envelope(c)&&!ceiling(c))){
    const side=c.max.x-c.min.x<c.max.z-c.min.z,low=side?c.min.z:c.min.x,high=side?c.max.z:c.max.x,meta={gymPart:'gym-wall',cutawayId:c.id};
    taggedBox(s,c,P.cream,meta);
    // Flat, closed-wall wainscot and pads do not pretend the windows or doors
    // are open holes. Every physical wall retains its full canonical bounds.
    wallQuad(s,c,low,.05,high-low,1.56,'#91ad99',{gymPart:'wainscot'});
    wallQuad(s,c,low,1.62,high-low,.055,P.woodDark,{gymPart:'wall-chair-rail'});
    wallQuad(s,c,low,.035,high-low,.10,P.dark,{gymPart:'skirting'});
    const padCentres=side?[low+5,low+11,low+17,low+23]:[-3.2,3.2];
    for(const centre of padCentres){if(centre-1<low||centre+1>high)continue;
      wallQuad(s,c,centre-.95,.16,1.9,1.42,P.teal,{gymPart:'protective-wall-pad'});
      wallStroke(s,c,centre,.21,centre,1.53,'#75a092',{gymPart:'pad-seam'});
      for(const y of [.22,1.50])wallStroke(s,c,centre-.87,y,centre+.87,y,'#66978b',{gymPart:'pad-edge'});
    }
    // High clerestory windows, set into cream reveals with slender mullions.
    const windowCentres=side?[low+3.6,low+9.4,low+15.2,low+21,low+26.8]:[-5.1,5.1];
    for(const u of windowCentres){const width=side?3.7:2.6;if(u-width/2<low+.3||u+width/2>high-.3)continue;
      const l=u-width/2,y=5.15,h=1.62;
      wallQuad(s,c,l-.09,y-.09,width+.18,h+.18,'#c4bca0',{gymPart:'window-reveal'});
      wallQuad(s,c,l,y,width,h,'#b8d9ce',{gymPart:'high-window'});
      wallQuad(s,c,l,y,width,.24,'#a2c4b5',{gymPart:'window-lower-glass'});
      for(const f of [0,1/3,2/3,1])wallStroke(s,c,l+width*f,y,l+width*f,y+h,P.light,{gymPart:'window-mullion'});
      wallStroke(s,c,l,y+h*.47,l+width,y+h*.47,P.light,{gymPart:'window-mullion'});
      for(const yy of [y,y+h])wallStroke(s,c,l,yy,l+width,yy,P.light,{gymPart:'window-frame'});
      wallQuad(s,c,l-.11,y-.14,width+.22,.075,P.woodLight,{gymPart:'window-sill'});
      wallStroke(s,c,l+.15,y+.75,l+.42,y+1.30,'#e5ede0',{gymPart:'window-reflection'});
    }
    if(side)for(const u of [low+1.4,high-2.6]){
      if(u+1.65>high-.2)continue;
      wallQuad(s,c,u-.08,.03,1.81,2.28,P.woodDark,{gymPart:'door-surround'});
      wallQuad(s,c,u,.04,1.65,2.17,'#9a8261',{gymPart:'closed-gym-double-door'});
      wallStroke(s,c,u+.825,.05,u+.825,2.19,P.ink,{gymPart:'door-centre'});
      for(const dx of [.24,1.03])wallQuad(s,c,u+dx,1.36,.38,.55,'#a7c2ae',{gymPart:'door-glass'});
      for(const dx of [.65,.95])wallStroke(s,c,u+dx,.91,u+dx,1.09,P.light,{gymPart:'door-handle'});
      wallQuad(s,c,u+.45,2.43,.77,.26,P.dark,{gymPart:'exit-sign'});
      wallStroke(s,c,u+.64,2.56,u+1.02,2.56,'#d6e8cc',{gymPart:'exit-symbol'});
    }
  }
}
const digits=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
function digit(s,c,x,y,value,scale=.26){
  const segments={a:[0,1,1,1],b:[1,.5,1,1],c:[1,0,1,.5],d:[0,0,1,0],e:[0,0,0,.5],f:[0,.5,0,1],g:[0,.5,1,.5]};
  for(const [key,q] of Object.entries(segments))wallStroke(s,c,x+q[0]*scale,y+q[1]*scale*1.7,x+q[2]*scale,y+q[3]*scale*1.7,digits[value].includes(key)?'#e8cb77':'#3e655d',{gymPart:'scoreboard-segment',scoreDigit:value});
}
function scoreboard(s,world){
  const c=world.solids.find(c=>envelope(c)&&!ceiling(c)&&c.max.z-c.min.z<c.max.x-c.min.x&&c.min.z>world.goals[0].center.z);if(!c)return;
  wallQuad(s,c,-1.67,5.05,3.34,1.32,P.woodDark,{gymPart:'scoreboard-frame'});
  wallQuad(s,c,-1.60,5.12,3.20,1.18,P.dark,{gymPart:'scoreboard-body'});
  wallQuad(s,c,-1.48,5.86,.92,.07,'#a7c1aa',{gymPart:'scoreboard-team-label'});
  wallQuad(s,c,.56,5.86,.92,.07,'#a7c1aa',{gymPart:'scoreboard-team-label'});
  for(const x of [-1.35,-.93,.93,1.35])digit(s,c,x,5.28,0,.20);
  digit(s,c,-.40,5.65,0,.14);digit(s,c,-.18,5.65,5,.14);digit(s,c,.13,5.65,0,.14);digit(s,c,.35,5.65,0,.14);
  for(const y of [5.73,5.82])wallQuad(s,c,.035,y,.032,.032,'#e8cb77',{gymPart:'scoreboard-clock-colon'});
  wallQuad(s,c,-.18,5.25,.36,.24,'#3c7166',{gymPart:'scoreboard-period'});
  digit(s,c,-.065,5.275,1,.08);
  // School emblem is geometric and quiet; no giant icon substitutes for goal.
  wallQuad(s,c,-.23,7.15,.46,.50,P.teal,{gymPart:'school-emblem'});
  wallStroke(s,c,-.16,7.25,.16,7.55,'#e6d29d',{gymPart:'school-emblem-line'});
  wallStroke(s,c,.16,7.25,-.16,7.55,'#e6d29d',{gymPart:'school-emblem-line'});
}
function structure(s,world){
  const roof=world.solids.find(ceiling);if(!roof)return;
  taggedBox(s,roof,'#e2dbc4',{gymPart:'actual-ceiling',cutawayId:roof.id});
  const r=world.room,minX=r?.minX??-8,maxX=r?.maxX??8,minZ=r?.minZ??-21.5,maxZ=r?.maxZ??8.5,y=roof.min.y;
  // Roof steel is decoration attached to the actual ceiling cutaway. It
  // remains metre-sized, with no unmodelled beam crossing the shot volume.
  for(let z=minZ+2.8;z<maxZ-1;z+=5.8){
    const meta={gymPart:'roof-truss',decoration:true,cutawayId:roof.id};
    limb(s,p(minX+.12,y-.66,z),p(maxX-.12,y-.66,z),.045,P.steel,meta);
    for(const side of [-1,1]){
      limb(s,p(side*7.8,y-.66,z),p(0,y-.10,z),.044,P.steel,meta);
      for(const x of [side*2.6,side*5.2])limb(s,p(x,y-.66,z),p(x-side*1.3,y-.10-Math.abs(x-side*1.3)/8*.56,z),.026,P.steel,meta);
    }
    for(const x of [-4.2,4.2]){
      const m={gymPart:'hanging-light',decoration:true,cutawayId:roof.id};
      line(s,p(x,y-.14,z),p(x,y-.94,z),'#657c70',m);
      const solid=world.solids.find(c=>c.kind==='gym-lamp'&&Math.abs((c.min.x+c.max.x)/2-x)<.001&&Math.abs((c.min.z+c.max.z)/2-z)<.001);
      if(solid)taggedBox(s,solid,'#6f8f83',m);
      else box(s,x-.68,y-1.06,z-.19,1.36,.12,.38,'#6f8f83',m);
      flat(s,x-.61,y-1.064,z-.15,1.22,.30,'#f5edcc',m);
    }
  }
  for(const x of [minX+.06,maxX-.06])for(let z=minZ+1.5;z<maxZ;z+=5.8){
    const wall=world.solids.find(c=>envelope(c)&&!ceiling(c)&&c.min.x<=x&&c.max.x>=x);if(!wall)continue;
    const meta={gymPart:'wall-pilaster',decoration:true,cutawayId:wall.id};
    box(s,x-.045,1.72,z-.065,.09,y-1.74,.13,'#d1cfb5',meta);
  }
}
function basket(s,world){
  const goal=world.goals[0],board=world.solids.find(c=>c.kind==='backboard');
  for(const solid of world.solids.filter(c=>!envelope(c)&&c.kind!=='gym-lamp')){
    const color=solid.kind==='backboard'?'#e9e9d9':/rim/.test(solid.kind)?P.orange:/post|support/.test(solid.kind)?P.teal:P.steel;
    taggedBox(s,solid,color,{gymPart:solid.kind,goalId:/rim/.test(solid.kind)?goal.id:undefined});
  }
  if(!board)return;
  const z=board.min.z-.008,lo=board.min,hi=board.max;
  const front=(x,y)=>p(x,y,z),meta={gymPart:'basket-backboard-marking',decoration:true,backboardId:board.id};
  for(const x of [lo.x+.025,hi.x-.025])line(s,front(x,lo.y+.025),front(x,hi.y-.025),P.ink,meta);
  for(const y of [lo.y+.025,hi.y-.025])line(s,front(lo.x+.025,y),front(hi.x-.025,y),P.ink,meta);
  // The official 59 x 45 cm target rectangle rests on the ring's top edge.
  const base=goal.center.y;
  for(const x of [-.295,.295])line(s,front(goal.center.x+x,base),front(goal.center.x+x,base+.45),P.orange,meta);
  for(const y of [base,base+.45])line(s,front(goal.center.x-.295,y),front(goal.center.x+.295,y),P.orange,meta);
  box(s,lo.x-.018,lo.y-.050,board.min.z-.02,hi.x-lo.x+.036,.055,board.max.z-board.min.z+.04,P.teal,{gymPart:'backboard-bottom-padding',decoration:true});
  // Mounting plate is the small joint from ring to real support arm; it does
  // not create an oversized bright goal, an invisible catch radius, or a net
  // bottom that visually blocks the opening.
  box(s,goal.center.x-.075,base-.10,board.min.z-.035,.15,.16,.035,P.orange,{gymPart:'ring-mounting-plate',decoration:true});
}
export function gymBasketStaticMeshes(world){
  world=validate(world);if(cache.has(world))return cache.get(world);
  const s=[];court(s,world);walls(s,world);scoreboard(s,world);structure(s,world);basket(s,world);
  cache.set(world,s);return s;
}
export function gymBasketCutaway(world,camera){
  world=validate(world);if(!finite(camera))return [];
  return world.solids.filter(c=>envelope(c)&&(
    ceiling(c)?camera.y>c.min.y:
    c.max.x-c.min.x<c.max.z-c.min.z?(c.min.x<0?camera.x<c.max.x:camera.x>c.min.x):
    c.min.z<0?camera.z<c.max.z:camera.z>c.min.z
  )).map(c=>c.id);
}
export function gymBasketDynamicMeshes(world,time=0,options={}){
  world=validate(world);if(!Number.isFinite(time))throw new TypeError('Gym time must be finite');
  const goal=world.goals[0],capture=options.capture??options.goalCapture??options.game?.goalCapture,phase=options.phase??options.game?.phase;
  const captureAt=capture?.environmentTime??((options.game?.startTime??0)+(capture?.time??0));
  const elapsed=Math.max(0,time-captureAt),captured=phase==='success'&&capture?.goalId===goal.id;
  const pulse=captured&&!options.reducedMotion&&elapsed<1.4?Math.sin(elapsed*19)*Math.exp(-elapsed*3.4):0;
  const s=[],r=goal.radius,y=goal.center.y,meta={gymPart:'basket-net',goalId:goal.id,decoration:true,physical:false,net:true,netCapture:captured};
  const at=(i,row)=>{
    const a=(i+(row%2)*.5)/12*Math.PI*2,rr=r*[1,.83,.61,.58][row]*(1+pulse*.12*row/3),drop=[.02,.15,.32,.43][row]+pulse*.045*row/3;
    return p(goal.center.x+Math.cos(a)*rr+pulse*.025*row/3,y-drop,goal.center.z+Math.sin(a)*rr);
  };
  // Twelve attachments form a recognizable woven, open-bottom 43 cm net.
  // Its small displacement is derived only from the actual goal capture.
  for(let row=0;row<3;row++)for(let i=0;i<12;i++){
    line(s,at(i,row),at(i,row+1),'#e9e4cd',meta);
    line(s,at(i,row),at(i+(row%2?-1:1),row+1),'#e9e4cd',meta);
  }
  for(let i=0;i<12;i++)line(s,at(i,3),at(i+1,3),'#d9d9c0',meta);
  return s;
}
