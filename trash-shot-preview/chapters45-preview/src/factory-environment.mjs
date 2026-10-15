// Adjacent production bays share the factory's metre-space and warm steel palette.
// These guarded workcells are scenery, outside the canonical throwing room.
// A primitive kit is supplied by factory-scene to avoid a circular renderer import.
const C=Object.freeze({steel:'#82978e',dark:'#315b56',teal:'#4a948b',cream:'#e7dfcb',floor:'#c8c7b6',amber:'#d6a647',black:'#4f5a53',pipe:'#a9b6a7',copper:'#b98a62',light:'#fff0c0'});
const point=(x,y,z)=>({x,y,z});
const enabled=world=>world?.environment==='factory'&&[26,27,28,29,40,41,42,43].includes(world.worldVersion);
const metadata=(equipmentId,machinePart,extra={})=>({factoryAtmosphere:true,decoration:true,equipmentId,machinePart,...extra});
const finiteTime=time=>{if(!Number.isFinite(time))throw new TypeError('Factory environment time must be finite');return time;};
const phase=(time,period)=>((time%period)+period)%period/period;

// Six-sided beams are useful for structural steel and remain cheaper than tubes.
function beam(s,a,b,width,depth,color,kit,meta){
  const {unit,cross,add,scale,face,shade}=kit,axis=unit(add(b,scale(a,-1))),right=unit(cross(axis,Math.abs(axis.y)>.8?point(0,0,1):point(0,1,0))),up=cross(axis,right);
  const ring=q=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>add(q,add(scale(right,x*width/2),scale(up,y*depth/2)))),lo=ring(a),hi=ring(b);
  for(let i=0;i<4;i++)s.push(face([lo[i],lo[(i+1)%4],hi[(i+1)%4],hi[i]],shade(color,i%2?-9:5),null,meta));
  s.push(face(hi,shade(color,12),null,meta),face([...lo].reverse(),shade(color,-12),null,meta));
}
function rotatedBox(s,center,w,h,d,angle,color,kit,meta){
  const temporary=[];kit.box(temporary,-w/2,-h/2,-d/2,w,h,d,color,meta);const cos=Math.cos(angle),sin=Math.sin(angle);
  for(const mesh of temporary)s.push({...mesh,points:mesh.points.map(q=>point(center.x+q.x*cos-q.z*sin,center.y+q.y,center.z+q.x*sin+q.z*cos))});
}
function fence(s,side,z0,z1,kit){
  const {box,line}=kit,x=side*4.35,meta=metadata(`factory-bay-fence-${side}`,'safety-rail');
  for(const z of [z0,(z0+z1)/2,z1])box(s,x-.055,0,z-.055,.11,1.04,.11,C.amber,meta);
  for(const y of [.48,.92])beam(s,point(x,y,z0),point(x,y,z1),.065,.065,C.amber,kit,meta);
  for(let z=z0+.28;z<z1;z+=.43)line(s,point(x,.16,z),point(x,.84,z),C.steel,{...meta,machinePart:'guard-mesh'});
}
function roof(s,world,kit){
  const {box,line,limb,flat}=kit,room=world.room;
  // Open roof trusses give the hall a readable volume without hiding the goals.
  for(const z of [2.5,7.6]){
    const meta=metadata(`factory-truss-${z}`,'roof-truss');
    beam(s,point(-7.1,5.55,z),point(7.1,5.55,z),.13,.15,C.steel,kit,meta);
    beam(s,point(-7.1,5.55,z),point(0,5.92,z),.12,.13,C.dark,kit,meta);
    beam(s,point(0,5.92,z),point(7.1,5.55,z),.12,.13,C.dark,kit,meta);
    for(const x of [-4.8,-2.4,0,2.4,4.8])line(s,point(x,5.55,z),point(x+1.15,5.92-Math.abs(x+1.15)/7.1*.37,z),C.steel,{...meta,machinePart:'truss-brace'});
  }
  for(const x of [-5.9,0,5.9])box(s,x-.065,5.69,room.minZ,.13,.11,room.maxZ-room.minZ,C.steel,metadata('factory-roof-purlins','purlin'));
  const duct=metadata('factory-extraction-duct','extraction-duct');
  limb(s,point(5.95,4.65,.2),point(5.95,4.65,8.4),.16,C.pipe,duct);
  limb(s,point(5.95,4.65,6.7),point(5.95,2.62,6.7),.13,C.pipe,duct);
  for(const z of [1.4,4.2,7.9])limb(s,point(5.95,4.65,z-.035),point(5.95,4.65,z+.035),.195,C.steel,{...duct,machinePart:'duct-flange'});
  const cable=metadata('factory-cable-tray','cable-tray');
  for(const x of [-3.2,-2.85])box(s,x,4.9,-.4,.05,.09,8.8,C.dark,cable);
  for(let z=-.2;z<8.4;z+=.8)line(s,point(-3.2,4.91,z),point(-2.8,4.91,z),C.steel,cable);
  for(const [i,z] of [1,4.6,8.15].entries()){
    const meta=metadata(`factory-worklight-${i}`,'worklight');
    line(s,point(-1.8,5.68,z),point(-1.8,4.91,z),C.dark,meta);
    box(s,-2.36,4.84,z-.12,1.12,.07,.24,C.cream,meta);
    flat(s,-2.3,4.83,z-.1,1,.2,C.light,{...meta,machinePart:'lamp-diffuser'});
  }
}
function cabinet(s,x,z,kit,index){
  const {box,face,line}=kit,meta=metadata(`factory-electrical-cabinet-${index}`,'electrical-cabinet');
  box(s,x,.06,z,.58,1.7,.39,C.cream,meta);
  box(s,x-.02,0,z-.01,.62,.08,.42,C.dark,{...meta,machinePart:'cabinet-plinth'});
  s.push(face([point(x+.03,.17,z-.005),point(x+.55,.17,z-.005),point(x+.55,1.72,z-.005),point(x+.03,1.72,z-.005)],'#d1d6c3',C.steel,{...meta,machinePart:'cabinet-door'}));
  box(s,x+.4,.89,z-.028,.025,.16,.03,C.dark,{...meta,machinePart:'cabinet-handle'});
  box(s,x+.10,1.39,z-.02,.12,.1,.025,C.dark,{...meta,machinePart:'isolator-switch'});
  for(const y of [.31,1.24])box(s,x+.015,y,z-.025,.026,.12,.027,C.steel,{...meta,machinePart:'cabinet-hinge'});
  for(let y=.35;y<.65;y+=.075)line(s,point(x+.1,y,z-.013),point(x+.46,y,z-.013),C.steel,{...meta,machinePart:'cabinet-vent'});
  beam(s,point(x+.29,1.76,z+.17),point(x+.29,4.83,z+.17),.035,.035,C.steel,kit,{...meta,machinePart:'electrical-conduit'});
  line(s,point(x+.29,.075,z-.02),point(x+.29,.017,z-.48),C.dark,{...meta,machinePart:'cabinet-cable-entry'});
}
function robotStatic(s,kit){
  const {box,cylinder}=kit,meta=metadata('factory-pick-place-robot','robot-base');
  box(s,-6.05,0,.97,.6,.28,.72,C.dark,meta);
  cylinder(s,-5.75,.28,1.33,.24,.47,C.steel,6,meta);
  box(s,-6.86,0,1.1,.43,1.17,.42,C.cream,{...meta,machinePart:'robot-controller'});
  box(s,-6.83,.79,1.075,.30,.2,.03,C.dark,{...meta,machinePart:'controller-screen'});
  for(const z of [.38,2.22])box(s,-5.53,.56,z,.66,.1,.58,C.steel,{...meta,machinePart:'loading-table'});
  for(const z of [.38,2.20])box(s,-5.2,.66,z,.18,.14,.2,C.copper,{...meta,machinePart:'workpiece-tray'});
}
function pressStatic(s,kit){
  const {box,cylinder}=kit,meta=metadata('factory-hydraulic-press','press-frame'),x=-5.75,z=6.6;
  box(s,x-.7,0,z-.55,1.4,.23,1.1,C.dark,meta);
  for(const dx of [-.64,.48])box(s,x+dx,.23,z-.37,.16,2.18,.74,C.teal,meta);
  box(s,x-.7,2.29,z-.48,1.4,.3,.95,C.teal,meta);
  box(s,x-.54,.82,z-.43,1.08,.16,.86,C.steel,{...meta,machinePart:'press-bed'});
  cylinder(s,x,2.4,z,.2,.38,C.steel,6,{...meta,machinePart:'hydraulic-cylinder'});
  box(s,x+.73,.18,z-.23,.36,1.23,.45,C.cream,{...meta,machinePart:'press-control-pedestal'});
  box(s,x+.62,.02,z+.55,.49,.39,.43,C.dark,{...meta,machinePart:'hydraulic-oil-tank'});
  cylinder(s,x+.86,.41,z+.76,.13,.31,C.steel,6,{...meta,machinePart:'hydraulic-pump-motor'});
  const hose=metadata('factory-hydraulic-press','hydraulic-hose');
  for(const [a,b] of [[point(x,2.72,z),point(x+.87,2.66,z+.28)],[point(x+.87,2.66,z+.28),point(x+1.06,1.12,z+.68)],[point(x+1.06,1.12,z+.68),point(x+.86,.73,z+.76)]])kit.line(s,a,b,C.dark,hose);
}
function latheStatic(s,kit){
  const {box}=kit,meta=metadata('factory-engine-lathe','lathe-bed'),x=5.84,z=5.67;
  box(s,x-.59,.44,z-.84,1.18,.41,1.7,C.teal,meta);
  for(const dz of [-.76,.50])box(s,x-.42,0,z+dz,.84,.45,.27,C.dark,{...meta,machinePart:'machine-feet'});
  box(s,x-.42,.85,z-.72,.84,.7,.39,C.cream,{...meta,machinePart:'lathe-headstock'});
  box(s,x-.26,.85,z+.54,.52,.39,.25,C.cream,{...meta,machinePart:'lathe-tailstock'});
  for(const dx of [-.28,.21])box(s,x+dx,.85,z-.36,.065,.09,.91,C.steel,{...meta,machinePart:'lathe-ways'});
  box(s,x+.67,.15,z-.47,.32,1.02,.4,C.cream,{...meta,machinePart:'lathe-console'});
}
function pallet(s,kit){
  const {box,line}=kit,meta=metadata('factory-stock-pallet','stock-pallet'),x=5.18,z=8.08;
  for(const dz of [0,.77])box(s,x,.02,z+dz,1.2,.11,.14,C.copper,meta);
  for(const dx of [0,.32,.64,.96])box(s,x+dx,.13,z,.23,.065,.91,C.copper,meta);
  box(s,x+.07,.195,z+.05,1.04,.67,.8,'#c8b792',{...meta,machinePart:'boxed-stock'});
  for(const dx of [.33,.83]){line(s,point(x+dx,.205,z+.035),point(x+dx,.87,z+.035),C.dark,{...meta,machinePart:'packing-strap'});line(s,point(x+dx,.87,z+.035),point(x+dx,.87,z+.855),C.dark,{...meta,machinePart:'packing-strap'});}
}
export function factoryEnvironmentStatic(world,kit){
  if(!enabled(world))return [];
  const s=[],{flat,line}=kit;
  for(const side of [-1,1]){
    const x=side<0?-7.3:4.15,meta=metadata(`factory-work-bay-${side}`,'work-bay-floor');
    flat(s,x,.007,-.7,3.15,9.65,C.floor,meta);
    for(let i=0;i<8;i++)line(s,point(side*4.19,.013,.1+i*.85),point(side*4.19,.013,.56+i*.85),C.amber,{...meta,machinePart:'safety-floor-marking'});
    fence(s,side,.03,3.05,kit);fence(s,side,4.58,8.3,kit);
  }
  roof(s,world,kit);cabinet(s,6.58,2.7,kit,1);cabinet(s,-6.92,8.1,kit,2);
  robotStatic(s,kit);pressStatic(s,kit);latheStatic(s,kit);pallet(s,kit);
  return s;
}

// Clock poses are exported for audit and replay checks; no frame cache or random.
export function factoryEnvironmentMotion(world,time=0,{reducedMotion=false}={}){
  if(!enabled(world))return null;
  time=finiteTime(time);if(reducedMotion)time=0;
  // Release/replay stores the environment's wrapped eight-second clock. Each
  // machine cycle divides that period so wrapping cannot reset a visible pose.
  const robotPhase=phase(time+world.worldVersion*.14,8),swing=Math.sin(robotPhase*Math.PI*2),lift=.5+.5*Math.cos(robotPhase*Math.PI*4),yaw=Math.PI/2+swing*.95;
  const shoulder=point(-5.75,.96,1.33),radius=1.12-lift*.20,wristY=1.02+lift*.49,dy=wristY-shoulder.y,distance=Math.hypot(radius,dy),upperLength=.86,foreLength=.79;
  // Two-link inverse kinematics keeps rigid metal links the same length through
  // a pick/lift/place cycle rather than stretching a cartoon arm between poses.
  const shoulderAngle=Math.atan2(dy,radius)+Math.acos((upperLength**2+distance**2-foreLength**2)/(2*upperLength*distance)),elbowRadius=Math.cos(shoulderAngle)*upperLength;
  const elbow=point(shoulder.x+Math.sin(yaw)*elbowRadius,shoulder.y+Math.sin(shoulderAngle)*upperLength,shoulder.z+Math.cos(yaw)*elbowRadius),wrist=point(shoulder.x+Math.sin(yaw)*radius,wristY,shoulder.z+Math.cos(yaw)*radius);
  const pressPhase=phase(time+world.worldVersion*.21,4),pressTravel=.37*(.5-.5*Math.cos(pressPhase*Math.PI*2));
  return {robot:{shoulder,elbow,wrist,yaw,grip:.04+.045*(.5+.5*Math.sin(robotPhase*Math.PI*4)),phase:robotPhase},press:{travel:pressTravel,ramY:1.52-pressTravel,phase:pressPhase},lathe:{angle:phase(time,2)*Math.PI*2,carriageZ:5.62+Math.sin(time*Math.PI/4)*.19},reducedMotion:!!reducedMotion};
}
export function factoryEnvironmentDynamic(world,time=0,kit,{reducedMotion=false}={}){
  const motion=factoryEnvironmentMotion(world,time,{reducedMotion});if(!motion)return [];
  const s=[],{limb,box,cylinder,line}=kit,robot=motion.robot,robotMeta=metadata('factory-pick-place-robot','robot-link');
  limb(s,point(-5.75,.73,1.33),robot.shoulder,.15,C.dark,robotMeta);
  limb(s,robot.shoulder,robot.elbow,.115,C.amber,robotMeta);
  limb(s,robot.elbow,robot.wrist,.085,C.amber,robotMeta);
  for(const q of [robot.shoulder,robot.elbow,robot.wrist])cylinder(s,q.x,q.y-.08,q.z,.135,.16,C.steel,6,{...robotMeta,machinePart:'robot-joint'});
  box(s,robot.wrist.x-.1,robot.wrist.y-.12,robot.wrist.z-.09,.2,.13,.18,C.dark,{...robotMeta,machinePart:'tool-flange'});
  for(const dx of [-robot.grip,robot.grip])box(s,robot.wrist.x+dx-.012,robot.wrist.y-.25,robot.wrist.z-.06,.024,.14,.12,C.steel,{...robotMeta,machinePart:'gripper-jaw'});
  const pressMeta=metadata('factory-hydraulic-press','press-ram');
  cylinder(s,-5.75,motion.press.ramY+.12,6.6,.082,2.40-motion.press.ramY-.12,C.steel,6,pressMeta);
  box(s,-6.17,motion.press.ramY,6.26,.84,.12,.68,C.dark,{...pressMeta,machinePart:'press-punch'});
  const latheMeta=metadata('factory-engine-lathe','rotating-spindle');
  limb(s,point(5.84,1.18,5.35),point(5.84,1.18,6.14),.10,C.steel,latheMeta);
  // A rotating radial jaw exposes spindle motion even on an untextured metal part.
  const angle=motion.lathe.angle,a=point(5.84+Math.cos(angle)*.145,1.18+Math.sin(angle)*.145,5.38),b=point(5.84-Math.cos(angle)*.145,1.18-Math.sin(angle)*.145,5.38);
  beam(s,a,b,.07,.08,C.amber,kit,{...latheMeta,machinePart:'chuck-jaw'});
  rotatedBox(s,point(5.84,1.03,motion.lathe.carriageZ),.38,.2,.28,0,C.dark,kit,{...latheMeta,machinePart:'tool-carriage'});
  line(s,point(5.84,1.15,motion.lathe.carriageZ),point(5.97,1.21,motion.lathe.carriageZ),C.copper,{...latheMeta,machinePart:'cutting-tool'});
  return s;
}
