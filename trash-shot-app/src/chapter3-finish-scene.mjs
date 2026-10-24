// Revised presentation is exclusive to worlds 60/61. Earlier replay meshes
// remain on their original paths. All dimensions below are metres.
import {scoreboardLettering} from './ballpark-scene.mjs?v=20261023-chapter3-1';
const p=(x,y,z)=>({x,y,z});
const add=(a,b)=>p(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>p(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,n)=>p(a.x*n,a.y*n,a.z*n);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const len=a=>Math.hypot(a.x,a.y,a.z);
const unit=a=>mul(a,1/(len(a)||1));
const cross=(a,b)=>p(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const face=(points,fill,meta={})=>({points,fill,stroke:null,decoration:true,...meta});
function beam(s,a,b,r,color,meta={}){
  const n=unit(sub(b,a)),u=unit(cross(n,Math.abs(n.y)<.95?p(0,1,0):p(1,0,0))),v=cross(n,u);
  const ring=q=>Array.from({length:8},(_,i)=>add(q,add(mul(u,Math.cos(i*Math.PI/4)*r),mul(v,Math.sin(i*Math.PI/4)*r))));
  const A=ring(a),B=ring(b);
  for(let i=0;i<8;i++)s.push(face([A[i],A[(i+1)%8],B[(i+1)%8],B[i]],color,meta));
  s.push(face(B,color,meta));
}
function ellipsoid(s,c,r,color,meta={}){
  const at=(a,b)=>p(c.x+Math.cos(a)*Math.cos(b)*r.x,c.y+Math.sin(b)*r.y,c.z+Math.sin(a)*Math.cos(b)*r.z);
  for(let j=0;j<4;j++)for(let i=0;i<10;i++)s.push(face([at(i*Math.PI/5,-Math.PI/2+j*Math.PI/4),at((i+1)*Math.PI/5,-Math.PI/2+j*Math.PI/4),at((i+1)*Math.PI/5,-Math.PI/2+(j+1)*Math.PI/4),at(i*Math.PI/5,-Math.PI/2+(j+1)*Math.PI/4)],j===3?'#efd0ad':color,meta));
}
function panel(s,x,y,z,w,h,color,meta={}){s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],color,meta));}

export const FINISHED_SCOREBOARD=Object.freeze({headers:['1','2','3','4','5','6','7','8','9','R','H','E'],teams:[{name:'AWAY',innings:[0,1,0,0,0,0,0,0,0],runs:1,hits:3,errors:0},{name:'HOME',innings:[0,0,0,2,0,0,0,0,0],runs:2,hits:4,errors:0}]});
function scoreboard(world){
  const s=[],solid=world.solids.find(c=>c.id==='stadium-scoreboard'),x=solid.min.x,y=solid.min.y,z=solid.min.z-.018,w=solid.max.x-x,h=solid.max.y-y;
  const m={architecturePart:'scoreboard-paint',sourceSolidId:solid.id,planeOnly:true,finishedScoreboard:true};
  panel(s,x+.08,y+.08,z,w-.16,h-.16,'#173e39',m);
  panel(s,x+.14,y+h-.70,z-.002,w-.28,.48,'#d4cbb0',m);
  scoreboardLettering(s,'TRASHOOT PARK',x+.35,y+h-.60,z-.006,.045,'#254e43',m);
  const start=x+1.95,gap=.49,header=y+2.65,rows=[y+1.70,y+.75];
  for(let i=0;i<12;i++){
    const xx=start+i*gap;
    if(i===9)panel(s,xx-.11,y+.35,z-.002,1.48,2.86,'#294f43',m);
    scoreboardLettering(s,FINISHED_SCOREBOARD.headers[i],xx,header,z-.008,.064,'#cfb879',m);
    FINISHED_SCOREBOARD.teams.forEach((team,j)=>{const value=i<9?team.innings[i]:[team.runs,team.hits,team.errors][i-9];scoreboardLettering(s,String(value),xx,rows[j],z-.009,.079,i>=9?'#f1d79b':'#ebe3c8',m);});
  }
  FINISHED_SCOREBOARD.teams.forEach((team,j)=>scoreboardLettering(s,team.name,x+.30,rows[j]+.10,z-.008,.054,'#e5dec3',m));
  for(const yy of [y+.49,y+1.43,y+2.40,y+3.28])panel(s,x+.24,yy,z-.005,w-.48,.018,'#647c65',m);
  const g=world.goals.find(g=>g.kind==='scoreboard-light');
  panel(s,g.center.x-g.halfWidth,g.center.y-g.halfHeight,z-.011,g.halfWidth*2,g.halfHeight*2,'#c9a752',{...m,goalId:g.id});
  scoreboardLettering(s,'HR',g.center.x-.26,g.center.y-.15,z-.014,.055,'#fff1bb',{...m,scoreboardIndicator:true});
  return {id:'stadium60-innings-and-totals',shapes:s,physical:false};
}

// Two-bone IK preserves actual upper-arm/forearm lengths. The pole chooses
// a relaxed elbow below and beside the hand instead of stretching a tube.
export function mallArmPose(actor,goal,side){
  const h=actor.height,child=actor.kind==='child',active=!!goal&&(child||(goal.center.x-actor.position.x)*side>0),q=actor.position;
  const shoulder=p(q.x+side*actor.width*.40,q.y+h*.73,q.z-.005),upper=h*.18,fore=h*.16;
  const radius=goal?(goal.kind==='cone'?.024:goal.radius*.92):0;
  const wrist=active?p(goal.center.x-side*(radius+.055),goal.center.y-(goal.kind==='cone'?.098:.067),goal.center.z+.008):p(q.x+side*actor.width*.47,q.y+h*.41,q.z-.045);
  const delta=sub(wrist,shoulder),distance=len(delta),axis=unit(delta),along=(upper*upper-fore*fore+distance*distance)/(2*distance);
  if(distance>upper+fore+1e-7||distance<Math.abs(upper-fore))throw new RangeError('Unreachable mall hand');
  const pole=p(side*.6,-1,.12),bend=unit(sub(pole,mul(axis,dot(pole,axis)))),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  return {shoulder,elbow:add(shoulder,add(mul(axis,along),mul(bend,height))),wrist,upper,fore,active,radius,side,child};
}
function hand(s,pose,goal,actor){
  const m={actorId:actor.id,mallActorPart:'gripping-hand',side:pose.side},skin='#dfbb98',scale=pose.child?.78:1;
  if(!pose.active){ellipsoid(s,add(pose.wrist,p(0,-.027*scale,0)),p(.025*scale,.045*scale,.020*scale),skin,m);return;}
  const q=goal.center,r=pose.radius,a=pose.side>0?Math.PI:0,cy=pose.wrist.y;
  const at=(angle,yy,rr=r+.005)=>p(q.x+Math.cos(angle)*rr,yy,q.z+Math.sin(angle)*rr);
  const palm=p(q.x-pose.side*(r+.020),cy,q.z+.004);
  beam(s,pose.wrist,palm,.018*scale,skin,m);ellipsoid(s,palm,p(.022*scale,.034*scale,.024*scale),skin,m);
  for(let finger=0;finger<4;finger++){
    const yy=cy+.025*scale-finger*.014*scale,points=[at(a-.10*pose.side,yy,r+.020),at(a+.30*pose.side,yy),at(a+.76*pose.side,yy-.004),at(a+1.00*pose.side,yy-.009)];
    for(let i=1;i<points.length;i++)beam(s,points[i-1],points[i],.0058*scale,skin,{...m,mallActorPart:'curled-finger',finger,joint:i});
  }
  const thumb=[add(palm,p(0,.032*scale,.006)),at(a-.55*pose.side,cy+.028*scale,r+.012),at(a-.82*pose.side,cy+.015*scale)];
  for(let i=1;i<thumb.length;i++)beam(s,thumb[i-1],thumb[i],.008*scale,skin,{...m,mallActorPart:'opposing-thumb',joint:i});
}
function mallArms(world){
  const s=[];
  for(const actor of world.actors){
    const goal=world.goals.find(g=>actor.kind==='child'?g.kind==='cone':actor.id.includes('coffee')?g.kind==='coffee':g.kind==='soda');
    for(const side of [-1,1]){
      const pose=mallArmPose(actor,goal,side),m={actorId:actor.id,mallActorPart:'articulated-arm',side};
      beam(s,pose.shoulder,pose.elbow,actor.kind==='child'?.028:.042,actor.color,m);
      ellipsoid(s,pose.elbow,p(.024,.026,.024),'#dfbb98',m);
      beam(s,pose.elbow,pose.wrist,actor.kind==='child'?.019:.030,'#dfbb98',m);hand(s,pose,goal,actor);
    }
  }
  return {id:'mall61-articulated-arms-and-grips',shapes:s,physical:false};
}
export function finishedChapter3Groups(groups,world){
  if(world.worldVersion===60){
    const result=groups.filter(g=>g.id!=='stadium36-readable-scoreboard'&&g.id!=='outdoor-fixed-batter');
    return [...result,scoreboard(world)];
  }
  const armParts=new Set(['sleeve','forearm','holding-hand','fingers']);
  return [...groups.map(g=>g.id==='mall34-visitors-and-actual-size-drinks'?{...g,shapes:g.shapes.filter(s=>!armParts.has(s.mallActorPart))}:g),mallArms(world)];
}

export function finishedBatterShapes(world,options={}){
  const s=[],m={actorId:'baseball-batter',finishedBatter:true},q=p(-.68,0,-.38),skin='#dcb895',uniform='#eee5ce';
  const left=p(q.x-.19,.045,q.z-.27),right=p(q.x+.19,.045,q.z+.24),hip=p(q.x,.82,q.z),head=p(q.x,1.56,q.z);
  for(const foot of [left,right]){ellipsoid(s,foot,p(.09,.045,.15),'#3c6659',{...m,batterPart:'grounded-shoe'});const knee=p(foot.x,.42,foot.z+.03);beam(s,foot,knee,.055,uniform,m);beam(s,knee,hip,.070,uniform,m);}
  beam(s,hip,p(q.x,1.30,q.z),.18,uniform,{...m,batterPart:'jersey'});beam(s,p(q.x,1.28,q.z),p(q.x,1.47,q.z),.05,skin,m);ellipsoid(s,head,p(.12,.15,.11),skin,m);ellipsoid(s,add(head,p(0,.10,.01)),p(.14,.065,.13),'#315f54',{...m,batterPart:'helmet'});
  const t=options.flightTime??0,swing=options.phase==='flying'&&t<.32,grip=p(-.45,1.05,-.25),strike=p(world.origin.x,world.origin.y+.0365-.14,world.origin.z),direction=unit(sub(strike,grip)),angle=t/.32*1.8,tip=swing?add(grip,mul(p(direction.x*Math.cos(angle)+direction.z*Math.sin(angle),direction.y,-direction.x*Math.sin(angle)+direction.z*Math.cos(angle)),.74)):p(-.13,1.77,-.32);
  for(const side of [-1,1]){const shoulder=p(q.x+side*.16,1.28,q.z),elbow=p(q.x+side*.22,1.05,q.z-.12),wrist=add(grip,p(0,side*.025,0));beam(s,shoulder,elbow,.052,uniform,m);beam(s,elbow,wrist,.032,skin,m);ellipsoid(s,wrist,p(.025,.035,.026),skin,{...m,batterPart:'bat-grip'});}
  beam(s,grip,tip,.023,'#b98e56',{...m,batterPart:'bat'});beam(s,add(grip,mul(sub(tip,grip),.55)),tip,.033,'#d1ae74',{...m,batterPart:'bat-barrel'});
  return s;
}
