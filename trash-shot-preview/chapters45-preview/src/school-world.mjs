// School geometry is expressed in metres and shared by rendering and contacts.
// It deliberately imports no simulation module: versioned physics presets may
// consume this data without creating a physics/geometry import cycle.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const box=(id,object,kind,min,max,surface='furniture',restitution=.28)=>({id,object,kind,surface,min,max,restitution});
const point=(x,y,z)=>({x,y,z});
function boundaries(room,{ceiling=true}={}){
  const {minX:a,maxX:b,minZ:c,maxZ:d,height:h}=room,t=.12;
  const result=[
    box('back-wall','back-wall','wall',point(a-t,0,d),point(b+t,h+t,d+t),'wall',.35),
    box('front-wall','front-wall','wall',point(a-t,0,c-t),point(b+t,h+t,c),'wall',.35),
    box('left-wall','left-wall','wall',point(a-t,0,c-t),point(a,h+t,d+t),'wall',.35),
    box('right-wall','right-wall','wall',point(b,0,c-t),point(b+t,h+t,d+t),'wall',.35),
  ];
  if(ceiling)result.push(box('ceiling','ceiling','ceiling',point(a-t,h,c-t),point(b+t,h+t,d+t),'ceiling',.22));
  return result;
}
function desk(id,x,z,{top=.75,width=.6,depth=.45,chair=true,base=0}={}){
  const a=x-width/2,b=x+width/2,c=z-depth/2,d=z+depth/2,leg=.055;
  const solids=[box(`${id}-top`,id,'desk-top',point(a,base+top-.05,c),point(b,base+top,d))];
  for(const [i,lx] of [[0,a+.04],[1,b-.04-leg]])for(const [j,lz] of [[0,c+.035],[1,d-.035-leg]]){
    solids.push(box(`${id}-leg-${i}-${j}`,id,'desk-leg',point(lx,base,lz),point(lx+leg,base+top-.05,lz+leg)));
  }
  if(chair){
    const cz=z-.48;
    solids.push(box(`${id}-chair-seat`,`${id}-chair`,'chair-seat',point(x-.21,base+.41,cz-.19),point(x+.21,base+.46,cz+.19)));
    solids.push(box(`${id}-chair-back`,`${id}-chair`,'chair-back',point(x-.21,base+.46,cz-.23),point(x+.21,base+.96,cz-.17)));
    for(const [i,lx] of [[0,x-.18],[1,x+.135]])for(const [j,lz] of [[0,cz-.16],[1,cz+.115]]){
      solids.push(box(`${id}-chair-leg-${i}-${j}`,`${id}-chair`,'chair-leg',point(lx,base,lz),point(lx+.045,base+.41,lz+.045)));
    }
  }
  return solids;
}
const classroomRoom={minX:-3.7,maxX:3.7,minZ:-1.7,maxZ:6.2,height:3.4};
const classroomSolids=boundaries(classroomRoom);
for(const [row,z] of [1,2.4,3.8].entries())for(const [column,x] of [-1.7,-.5,.7,1.9].entries())classroomSolids.push(...desk(`class-desk-${row}-${column}`,x,z));
classroomSolids.push(...desk('source-desk',-2.7,-1.15,{top:.8,width:.6,depth:.75,chair:false}));
const vendingRoom={minX:-2.7,maxX:2.7,minZ:-1.5,maxZ:4.9,height:3.2};
const vendingSolids=[...boundaries(vendingRoom),
  ...desk('source-desk',0,-.45,{top:.8,width:1.1,depth:.9,chair:false}),
  box('vending-body','vending-machine','vending',point(-1.95,0,2.65),point(-.75,1.85,3.6)),
  box('vending-bench','vending-bench','bench',point(.85,0,2.85),point(2.05,.48,3.4)),
];
const passageRoom={minX:-3.3,maxX:3.3,minZ:-1.5,maxZ:7.4,height:2.45};
const passageSolids=[...boundaries(passageRoom),
  ...desk('source-desk',0,-.45,{top:.8,width:1.1,depth:.9,chair:false}),
  box('passage-post-left','passage-post-left','post',point(-2.7,0,2.75),point(-2.52,2.45,2.93)),
  box('passage-post-right','passage-post-right','post',point(2.52,0,2.75),point(2.7,2.45,2.93)),
];
// The first passage is retained for historical V5 replays. New play crosses
// two real classroom openings and the pedestrian corridor between them.
const windowPassageRoom={minX:-4,maxX:4,minZ:-2,maxZ:9.4,height:3.08};
const windowOpenings=[
  {id:'source-window',x:0,z:1.65,width:2.1,bottom:1.02,top:2.2,depth:.16},
  {id:'target-window',x:0,z:4.6,width:2.1,bottom:1.02,top:2.2,depth:.16},
];
function windowWall(opening,room){
  const {id,x,z,width,bottom,top,depth}=opening,left=x-width/2,right=x+width/2;
  return [
    box(`${id}-left`,id,'window-wall',point(room.minX,0,z),point(left,room.height,z+depth),'wall',.35),
    box(`${id}-right`,id,'window-wall',point(right,0,z),point(room.maxX,room.height,z+depth),'wall',.35),
    box(`${id}-bottom`,id,'window-wall',point(left,0,z),point(right,bottom,z+depth),'wall',.35),
    box(`${id}-top`,id,'window-wall',point(left,top,z),point(right,room.height,z+depth),'wall',.35),
  ];
}
const windowPassageSolids=[...boundaries(windowPassageRoom),
  ...windowOpenings.flatMap(opening=>windowWall(opening,windowPassageRoom)),
  ...desk('source-desk',0,-.45,{top:.8,width:1.1,depth:.9,chair:false}),
  ...desk('source-class-desk',-2.35,-.75),
  ...desk('target-class-desk-left',-2.15,6.3),
  ...desk('target-class-desk-right',2.1,7.15),
];
const passageRooms={
  source:{...windowPassageRoom,maxZ:1.65},
  corridor:{...windowPassageRoom,minZ:1.81,maxZ:4.6},
  target:{...windowPassageRoom,minZ:4.76},
};
const rooftopRoom={minX:-6,maxX:6,minZ:-3.4,maxZ:11,height:14,openSky:true};
const rail=(id,min,max)=>box(id,'roof-rail','rail',min,max,'rail',.35);
const roofRails=[
  rail('roof-front-rail-top',point(-3.15,9.12,.55),point(3.15,9.2,.65)),
  rail('roof-front-rail-middle',point(-3.15,8.65,.55),point(3.15,8.73,.65)),
  rail('roof-left-rail-top',point(-3.15,9.12,-3.4),point(-3.05,9.2,.55)),
  rail('roof-right-rail-top',point(3.05,9.12,-3.4),point(3.15,9.2,.55)),
  rail('roof-left-rail-middle',point(-3.15,8.65,-3.4),point(-3.05,8.73,.55)),
  rail('roof-right-rail-middle',point(3.05,8.65,-3.4),point(3.15,8.73,.55)),
];
for(let i=0;i<=6;i++){const x=-3.1+i*(6.2/6);roofRails.push(rail(`roof-front-rail-post-${i}`,point(x-.04,8.1,.55),point(x+.04,9.2,.65)));}
for(let i=0;i<=4;i++){const z=-3.35+i*(3.9/4);for(const side of [-1,1])roofRails.push(rail(`roof-${side<0?'left':'right'}-rail-post-${i}`,point(side<0?-3.15:3.05,8.1,z-.04),point(side<0?-3.05:3.15,9.2,z+.04)));}
const rooftopSolids=[
  box('courtyard-school-building','courtyard-school-building','building',point(-7.5,0,14),point(7.5,6.8,15.2),'furniture',.24),
  box('courtyard-school-cornice','courtyard-school-building','building',point(-7.55,6.8,13.96),point(7.55,7,15.26),'furniture',.24),
  box('school-building','school-building','building',point(-3,0,-3.4),point(3,8,.55),'furniture',.24),
  box('roof-slab','roof-slab','roof',point(-3.15,8,-3.4),point(3.15,8.1,.65),'roof',.28),
  ...roofRails,
  ...desk('source-desk',0,-.75,{top:.8,width:1.1,depth:.9,chair:false,base:8}),
  box('courtyard-bench','courtyard-bench','bench',point(-3.2,0,7.2),point(-1.8,.48,8.2)),
];
export const SCHOOL_PHYSICS_WORLDS=freeze({
  6:{worldVersion:6,origin:point(-2.7,.94,-.7),bin:{center:point(2.35,.35,5),radius:.35,height:.7}},
  7:{worldVersion:7,origin:point(0,.94,0),bin:{center:point(0,.39,3.2),radius:.25,height:.78}},
  8:{worldVersion:8,origin:point(0,.94,0),bin:{center:point(0,.35,5.8),radius:.35,height:.7}},
  9:{worldVersion:9,origin:point(0,8.94,-.2),bin:{center:point(.4,.35,7.7),radius:.35,height:.7}},
  10:{worldVersion:10,origin:point(0,.94,0),bin:{center:point(.2,.35,7.6),radius:.35,height:.7}},
});
const make=(stageId,version,schoolType,room,solids,launch,view,extra={})=>({stageId,worldVersion:version,environment:'school',schoolType,
  physics:SCHOOL_PHYSICS_WORLDS[version],origin:SCHOOL_PHYSICS_WORLDS[version].origin,bin:SCHOOL_PHYSICS_WORLDS[version].bin,
  room,solids,sourceDesk:null,desk:null,launch,view,...extra});
const legacyPassageWorld=freeze(make('school-passage',8,'passage',passageRoom,passageSolids,
  {power:7.9,elevation:30,yaw:0},{target:point(0,.95,2.6),distance:10.4,azimuth:.16,elevation:.36},
  {student:{id:'school-student',period:8,halfWidth:2.7,z:3.05,height:1.76,width:.44,depth:.34}}));
export const SCHOOL_WORLDS=freeze({
  'school-classroom':make('school-classroom',6,'classroom',classroomRoom,classroomSolids,
    {power:8.5,elevation:45,yaw:Math.atan2(5.05,5.7)*180/Math.PI},
    {target:point(-.85,.9,2.15),distance:12.2,azimuth:.18,elevation:.4}),
  'school-vending':make('school-vending',7,'vending',vendingRoom,vendingSolids,
    {power:5.5,elevation:48,yaw:0},{target:point(-.25,.85,1.65),distance:8.2,azimuth:.16,elevation:.42}),
  'school-passage':make('school-passage',10,'passage',windowPassageRoom,windowPassageSolids,
    {power:9.4,elevation:27,yaw:Math.atan2(.2,7.6)*180/Math.PI},
    {target:point(0,1.04,3.65),distance:14.4,azimuth:.2,elevation:.43},
    {passageRooms,windowOpenings,students:[
      {id:'school-student-a',period:8,halfWidth:3.65,z:2.5,height:1.76,width:.44,depth:.34,phaseOffset:0,travelDirection:1},
      {id:'school-student-b',period:8,halfWidth:3.65,z:3.85,height:1.76,width:.44,depth:.34,phaseOffset:2,travelDirection:-1},
    ]}),
  'school-rooftop':make('school-rooftop',9,'rooftop',rooftopRoom,rooftopSolids,
    {power:6.1,elevation:40,yaw:-1},{target:point(0,4.35,3.8),distance:17.5,azimuth:.25,elevation:.9},
    {wind:{x:.35,y:0,z:0}}),
});
export function schoolWorld(stageId,worldVersion){
  if(stageId==='school-passage'&&worldVersion===8)return legacyPassageWorld;
  const world=typeof stageId==='string'&&Object.hasOwn(SCHOOL_WORLDS,stageId)?SCHOOL_WORLDS[stageId]:null;
  return world&&(worldVersion===undefined||worldVersion===world.worldVersion)?world:null;
}
export function schoolSolids(world){
  const saved=schoolWorld(world?.stageId,world?.worldVersion);
  if(!saved)throw new RangeError('A supported school world is required');
  return saved.solids;
}
// Constant-speed back-and-forth walking. The periodic phase is saved at launch;
// elapsed simulation time therefore reproduces the same visible crossing.
function studentPose(s,time,legacy=false){
  const phase=(((time+(s.phaseOffset??0))%s.period)+s.period)%s.period,half=s.period/2,forward=phase<half;
  const travel=s.travelDirection??1;
  const x=(forward?-s.halfWidth+phase/half*s.halfWidth*2:s.halfWidth-(phase-half)/half*s.halfWidth*2)*travel;
  const direction=(forward?1:-1)*travel;
  const position=point(x,0,s.z),velocity=point(direction*s.halfWidth*2/half,0,0);
  return freeze({id:s.id,position,velocity,direction,phase,period:s.period,
    x,y:0,z:s.z,colliders:[{...box(legacy?'school-student-body':`${s.id}-body`,s.id,'student',point(x-s.width/2,0,s.z-s.depth/2),point(x+s.width/2,s.height,s.z+s.depth/2),'student',0),blocking:true}]});
}
export function schoolStudentPoses(world,time=0){
  const students=world?.students??(world?.student?[world.student]:[]);
  if(!students.length)return Object.freeze([]);
  if(!Number.isFinite(time))throw new TypeError('Student time must be finite');
  return Object.freeze(students.map(s=>studentPose(s,time,Boolean(world.student))));
}
export function schoolStudentPose(world,time=0){
  return schoolStudentPoses(world,time)[0]??null;
}
