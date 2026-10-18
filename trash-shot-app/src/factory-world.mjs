// Chapter 4 geometry is shared by rendering, contacts and recorded mechanisms.
// Moving surfaces are metre-space poses; no simulation or save code lives here.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const p=(x,y,z)=>({x,y,z});
const box=(id,kind,min,max,surface='furniture',restitution=.28,extra={})=>({id,object:id,kind,min,max,surface,restitution,...extra});
const goal=(id,center,radius=.7)=>({id,role:'normal',kind:'factory-bin',label:'回収ボックス',shape:'circle',center,normal:p(0,1,0),up:p(0,0,1),radius});
export const FACTORY_ENVIRONMENT_PERIOD=8;
export function factoryStartTime(time=0){if(!Number.isFinite(time))throw new TypeError('Factory time must be finite');return ((time%FACTORY_ENVIRONMENT_PERIOD)+FACTORY_ENVIRONMENT_PERIOD)%FACTORY_ENVIRONMENT_PERIOD;}
export const FACTORY_PHYSICS_WORLDS=freeze({
  15:{worldVersion:15,origin:p(0,1.25,0),bin:{center:p(0,.55,6.6),radius:.68,height:1.1}},
  16:{worldVersion:16,origin:p(0,1.65,0),bin:{center:p(0,.4,6.3),radius:.72,height:.8}},
  17:{worldVersion:17,origin:p(0,2.45,0),bin:{center:p(0,.5,5.5),radius:.8,height:1}},
  18:{worldVersion:18,origin:p(0,1.3,0),bin:{center:p(1.15,.55,6.7),radius:.72,height:1.1}},
  26:{worldVersion:26,origin:p(0,1.25,0),bin:{center:p(0,.55,6.6),radius:.68,height:1.1}},
  27:{worldVersion:27,origin:p(0,1.65,0),bin:{center:p(0,.4,6.3),radius:.72,height:.8}},
  28:{worldVersion:28,origin:p(0,2.45,0),bin:{center:p(0,.5,5.5),radius:.8,height:1}},
  29:{worldVersion:29,origin:p(0,1.3,0),bin:{center:p(1.15,.55,6.7),radius:.72,height:1.1}},
  40:{worldVersion:40,origin:p(0,1.25,0),bin:{center:p(0,.55,6.6),radius:.68,height:1.1}},
  41:{worldVersion:41,origin:p(0,1.65,0),bin:{center:p(0,.4,6.3),radius:.72,height:.8}},
  42:{worldVersion:42,origin:p(0,2.45,0),bin:{center:p(0,.5,5.5),radius:.8,height:1}},
  43:{worldVersion:43,origin:p(0,1.3,0),bin:{center:p(1.15,.55,6.7),radius:.72,height:1.1}},
  44:{worldVersion:44,origin:p(0,1.65,0),bin:{center:p(0,.4,6.3),radius:.72,height:.8}},
  45:{worldVersion:45,origin:p(0,2.45,0),bin:{center:p(0,.5,5.5),radius:.8,height:1}},
  46:{worldVersion:46,origin:p(0,1.65,0),bin:{center:p(-2.2,.4,7.25),radius:.72,height:.8}},
  47:{worldVersion:47,origin:p(0,1.3,0),bin:{center:p(1.15,.55,6.7),radius:.72,height:1.1}},
});
const binSolids=(g)=>[
  box(`${g.id}-body`,'collection-bin',p(g.center.x-g.radius,0,g.center.z-g.radius),p(g.center.x+g.radius,g.center.y-.25,g.center.z+g.radius)),
];
const make=(stageId,version,factoryType,itemId,goals,solids,launch,mechanism,extra={})=>({stageId,worldVersion:version,environment:'factory',factoryType,itemId,
  physics:FACTORY_PHYSICS_WORLDS[version],origin:FACTORY_PHYSICS_WORLDS[version].origin,bin:FACTORY_PHYSICS_WORLDS[version].bin,
  goals,solids,actors:[],launch,mechanism,view:{target:p(0,1.8,3.5),distance:14,azimuth:.3,elevation:.46},
  room:{minX:-4,maxX:4,minZ:-2,maxZ:9,height:6,openSky:false},...extra});
const shutterGoal=goal('factory-shutter-bin',p(0,1.1,6.6),.68);
const conveyorGoal=goal('factory-conveyor-bin',p(0,.8,6.3),.72);
const bankGoal=goal('factory-bank-bin',p(0,1,5.5),.8);
const relayGoal=goal('factory-relay-bin',p(1.15,1.1,6.7),.72);
// Keep the released V7 geometry fixed. New live stages choose their revised
// version by default, while recorded world15–18 selects these exact solids.
export const FACTORY_LEGACY_WORLDS=freeze({
  'factory-shutter':make('factory-shutter',15,'shutter','can',[shutterGoal],binSolids(shutterGoal),{power:8,elevation:45,yaw:0},
    {id:'factory-shutter-door',kind:'shutter',min:p(-3.2,0,3.4),max:p(3.2,4.5,3.6),period:8,lift:4.6}),
  'factory-conveyor':make('factory-conveyor',16,'conveyor','can',[conveyorGoal],[...binSolids(conveyorGoal),
    box('factory-belt','conveyor',p(-.65,.8,1.7),p(.65,1.2,5.55),'belt',.08,{surfaceVelocity:p(0,0,2.35)})],{power:4.5,elevation:24,yaw:0},
    {id:'factory-belt',kind:'conveyor',speed:2.35,direction:p(0,0,1),endZ:5.55}),
  'factory-bank':make('factory-bank',17,'bank','rubber-ball',[bankGoal],[...binSolids(bankGoal),
    box('factory-bank-left','bank-rail',p(-1.37,0,.35),p(-1.25,4.5,7.8),'wall',.8),
    box('factory-bank-right','bank-rail',p(1.25,0,.35),p(1.37,4.5,7.8),'wall',.8)],{power:9.5,elevation:32,yaw:-42.5},
    {id:'factory-bank-route',kind:'wall-bank',requiredColliders:['factory-bank-left','factory-bank-right'],requiredCount:2}),
  'factory-relay':make('factory-relay',18,'relay','heavy-ball',[relayGoal],[...binSolids(relayGoal),
    box('factory-relay-plate','pressure-plate',p(-2.08,.6,2.7),p(-.92,.78,3.9),'plate',0)],{power:7.7,elevation:42,yaw:-24},
    {id:'factory-relay-gate',kind:'relay',min:p(-3.2,0,4.4),max:p(3.2,4.2,4.6),lift:4.5,
      plateId:'factory-relay-plate',plateCenter:p(-1.5,.78,3.3),setupLaunch:{power:7.7,elevation:42,yaw:-24},goalLaunch:{power:11.1,elevation:38,yaw:10}}),
});
function buildingSolids(world){
  const r=world.room,solids=[box('factory-back-wall','factory-wall',p(r.minX-.25,0,r.maxZ+.2),p(r.maxX+.25,5.8,r.maxZ+.35),'wall',.35)];
  for(const [index,z] of [2.5,7.6].entries()){
    solids.push(box(`factory-building-left-pillar-${index+1}`,'factory-pillar',p(r.minX-.13,0,z),p(r.minX+.03,5.6,z+.2),'wall',.35));
    solids.push(box(`factory-building-right-pillar-${index+1}`,'factory-pillar',p(r.maxX-.03,0,z),p(r.maxX+.13,5.6,z+.2),'wall',.35));
    solids.push(box(`factory-building-beam-${index+1}`,'factory-beam',p(r.minX-.13,5.48,z),p(r.maxX+.13,5.62,z+.2),'ceiling',.22));
  }
  if(world.factoryType==='shutter'||world.factoryType==='relay'){
    const q=world.mechanism;for(const [side,x] of [['left',q.min.x-.16],['right',q.max.x+.04]])solids.push(box(`${q.id}-${side}-frame`,'machine-frame',p(x,0,q.min.z-.06),p(x+.12,5.5,q.min.z+.26),'wall',.35));
    solids.push(box(`${q.id}-top-frame`,'machine-frame',p(q.min.x-.16,5.18,q.min.z-.08),p(q.max.x+.16,5.43,q.min.z+.28),'ceiling',.22));
  }
  if(world.factoryType==='conveyor'){
    const belt=world.solids.find(c=>c.kind==='conveyor');let index=0;
    for(const x of [belt.min.x+.08,belt.max.x-.13])for(const z of [belt.min.z+.2,belt.max.z-.33])solids.push(box(`factory-belt-leg-${++index}`,'conveyor-leg',p(x,.02,z),p(x+.05,belt.min.y,z+.1),'furniture',.28));
  }
  return solids;
}
export const FACTORY_RELEASED_WORLDS=freeze(Object.fromEntries(Object.entries(FACTORY_LEGACY_WORLDS).map(([id,old],index)=>{
  const version=26+index,physics=FACTORY_PHYSICS_WORLDS[version];
  return [id,{...old,worldVersion:version,physics,origin:physics.origin,bin:physics.bin,solids:[...old.solids,...buildingSolids(old)]}];
})));
// Each new live face has one receiver and alternative physical paths to it.
// Historical worlds keep their mandatory mechanism witnesses unchanged.
const bypassReflector=(id,x=3.45)=>box(id,'machine-reflector',p(x,0,1.7),p(x+.15,5,7.7),'wall',.8,{routeRole:'right-bypass',friction:.02});
const multiRouteWorld=(id,version)=>{
  const old=FACTORY_LEGACY_WORLDS[id],physics=FACTORY_PHYSICS_WORLDS[version];
  const mechanism={...old.mechanism,...(['shutter','relay'].includes(old.factoryType)?{min:{...old.mechanism.min,x:old.factoryType==='relay'?-1.0:-2.3},max:{...old.mechanism.max,x:old.factoryType==='relay'?1.0:2.3}}:{}),
    ...(old.factoryType==='bank'?{requiredCount:0}:{}),routeRequired:false};
  const world={...old,worldVersion:version,physics,origin:physics.origin,bin:physics.bin,mechanism,
    routePolicy:'any-physical-path',launch:old.factoryType==='relay'?{...old.launch,yaw:0}:old.launch,solids:[...old.solids]};
  if(['shutter','relay'].includes(old.factoryType))world.solids.push(bypassReflector(`${id}-right-reflector`,old.factoryType==='relay'?2.45:3.45));
  world.solids.push(...buildingSolids(world));return world;
};
export const FACTORY_ROUTE_WORLDS=freeze(Object.fromEntries(Object.keys(FACTORY_LEGACY_WORLDS).map((id,index)=>[id,multiRouteWorld(id,40+index)])));

// The glass is a complete room-height partition; the only passage is the
// conveyor's low tunnel. No goal contact or score flag enforces this route.
function conveyorTunnelWorld(){
  const old=FACTORY_ROUTE_WORLDS['factory-conveyor'],physics=FACTORY_PHYSICS_WORLDS[44];
  return {...old,worldVersion:44,physics,origin:physics.origin,bin:physics.bin,
    mechanism:{...old.mechanism,tunnel:{min:p(-.7,1.2,3.7),max:p(.7,1.66,3.94)}},
    solids:[...old.solids,
      box('factory-glass-left','safety-glass',p(-4.3,0,3.7),p(-.7,6.3,3.94),'wall',.25),
      box('factory-glass-right','safety-glass',p(.7,0,3.7),p(4.3,6.3,3.94),'wall',.25),
      box('factory-glass-above-belt','safety-glass',p(-.7,1.66,3.7),p(.7,6.3,3.94),'wall',.25),
      box('factory-glass-belt-sill','machine-frame',p(-.7,0,3.7),p(.7,1.2,3.94),'wall',.25),
      box('factory-conveyor-safety-ceiling','safety-glass',p(-4.3,5.9,-2.2),p(4.3,6.1,9.35),'ceiling',.25)]};
}
function pistonBankWorld(){
  const old=FACTORY_ROUTE_WORLDS['factory-bank'],physics=FACTORY_PHYSICS_WORLDS[45];
  return {...old,worldVersion:45,physics,origin:physics.origin,bin:physics.bin,
    mechanism:{...old.mechanism,kind:'piston-bank',requiredColliders:['factory-bank-left-piston','factory-bank-right-piston'],
      pistons:[{id:'factory-bank-left-piston',side:'left',baseX:-1.75,amplitude:.2,phase:0},{id:'factory-bank-right-piston',side:'right',baseX:1.75,amplitude:.2,phase:Math.PI}],period:4},
    launch:{power:6,elevation:42,yaw:40},
    solids:[...old.solids.filter(s=>s.kind!=='bank-rail'),
      box('factory-bank-central-shield','machine-shield',p(-.55,0,1.8),p(.55,6.3,3.15),'wall',.25),
      box('factory-bank-safety-ceiling','safety-glass',p(-4.3,5.9,-2.2),p(4.3,6.1,9.35),'ceiling',.25)]};
}
export const FACTORY_NECESSITY_WORLDS=freeze({...FACTORY_ROUTE_WORLDS,'factory-conveyor':conveyorTunnelWorld(),'factory-bank':pistonBankWorld()});


function conveyorLineWorld(){
  const old=FACTORY_NECESSITY_WORLDS['factory-conveyor'],physics=FACTORY_PHYSICS_WORLDS[46],receiver=goal('factory-conveyor-bin',p(-2.2,.8,7.25),.72);
  const belts=[
    box('factory-line-belt-1','conveyor',p(-.6,1.3,1.7),p(1.8,1.6,2.8),'belt',.08,{surfaceVelocity:p(3.8,0,0)}),
    box('factory-line-belt-2','conveyor',p(1.55,1.2,1.7),p(2.95,1.5,4.3),'belt',.08,{surfaceVelocity:p(0,0,3.8)}),
    box('factory-line-belt-3','conveyor',p(-1.75,1.1,4.1),p(2.95,1.4,5.2),'belt',.08,{surfaceVelocity:p(-3.8,0,0)}),
    box('factory-line-belt-4','conveyor',p(-2.9,1,4.1),p(-1.5,1.3,6.6),'belt',.08,{surfaceVelocity:p(0,0,1.8)})];
  const wall=(id,z,lo,hi,bottom,top)=>[
    box(id+'-left','safety-glass',p(-4.3,0,z),p(lo,6.3,z+.18),'wall',.2),
    box(id+'-right','safety-glass',p(hi,0,z),p(4.3,6.3,z+.18),'wall',.2),
    box(id+'-lintel','safety-glass',p(lo,top,z),p(hi,6.3,z+.18),'wall',.2),
    box(id+'-sill','machine-frame',p(lo,0,z),p(hi,bottom,z+.18),'wall',.2)];
  return {...old,worldVersion:46,physics,origin:physics.origin,bin:physics.bin,goals:[receiver],launch:{power:4.5,elevation:40,yaw:0},
    mechanism:{...old.mechanism,id:belts[0].id,kind:'conveyor-line',speed:3.8,direction:p(1,0,0),endZ:6.6,belts:belts.map(b=>b.id),
      presses:[{id:'factory-line-press-1',min:p(1.55,1.51,3),max:p(2.95,2.1,3.55),lift:2.5,phase:0},
        {id:'factory-line-press-2',min:p(-.6,1.41,4.1),max:p(.1,2,5.2),lift:2.5,phase:Math.PI}],pressPeriod:4},
    solids:[...old.solids.filter(q=>!['collection-bin','conveyor','conveyor-leg','safety-glass','machine-frame'].includes(q.kind)),...binSolids(receiver),...belts,
      ...wall('factory-line-inlet',1.45,-.6,.6,0,2.25),...wall('factory-line-right-port',3.25,1.5,3,1.5,1.96),...wall('factory-line-left-port',5.7,-3,-1.45,1.3,1.76),
      box('factory-line-safety-ceiling','safety-glass',p(-4.3,5.9,-2.2),p(4.3,6.1,9.35),'ceiling',.25)]};
}
export const FACTORY_CONVEYOR_WORLDS=freeze({...FACTORY_NECESSITY_WORLDS,'factory-conveyor':conveyorLineWorld()});


function timedRelayWorld(){
  const old=FACTORY_CONVEYOR_WORLDS['factory-relay'],physics=FACTORY_PHYSICS_WORLDS[47];
  const mechanism={...old.mechanism,kind:'timed-relay',min:p(-4.3,0,4.4),max:p(4.3,5.9,4.6),lift:6,
    track:{points:[p(-2.7,.84,3.6),p(-2.7,.65,6.6),p(-3.1,.5,7.2)],duration:7,openFrom:1,openUntil:6,ramp:.6}};
  return {...old,worldVersion:47,physics,origin:physics.origin,bin:physics.bin,mechanism,launch:mechanism.setupLaunch,
    solids:[...old.solids.filter(s=>s.kind!=='machine-reflector'&&!s.id.startsWith('factory-relay-gate-')),
      box('factory-relay-safety-ceiling','safety-glass',p(-4.3,5.9,-2.2),p(4.3,6.1,9.35),'ceiling',.25),
      ...[[-2.86,-2.78],[-2.62,-2.54]].map(([a,b],i)=>box('factory-relay-track-rail-'+i,'relay-track-rail',p(a,.36,3.6),p(b,.48,6.8),'furniture',.28))]};
}
export const FACTORY_WORLDS=freeze({...FACTORY_CONVEYOR_WORLDS,'factory-relay':timedRelayWorld()});
function timedRelayMotion(world,time,session){
  const track=world.mechanism.track,activated=session?.version===2&&session.stageId===world.stageId&&session.plateLatched&&Number.isFinite(session.activatedAt),age=activated?Math.max(0,time-session.activatedAt):0;
  const progress=activated?Math.min(1,age/track.duration):0,remaining=activated?Math.max(0,track.openUntil-age):0;
  const opening=activated?Math.max(0,Math.min(1,(age-(track.openFrom-track.ramp))/track.ramp,(track.openUntil+track.ramp-age)/track.ramp)):0;
  const points=[...(activated?[{...session.setupBall.position}]:[{...world.mechanism.plateCenter,y:world.mechanism.plateCenter.y+.14}]),...track.points.map(q=>({...q}))];
  const lengths=points.slice(1).map((q,i)=>Math.hypot(q.x-points[i].x,q.y-points[i].y,q.z-points[i].z));let distance=lengths.reduce((a,b)=>a+b,0)*progress,position={...points[0]};
  for(let i=0;i<lengths.length;i++){const ratio=Math.min(1,distance/lengths[i]);position=Object.fromEntries(['x','y','z'].map(a=>[a,points[i][a]+(points[i+1][a]-points[i][a])*ratio]));if(distance<=lengths[i])break;distance-=lengths[i];}
  return {relayClock:{activated,age,remaining,progress,open:opening>.999,expired:activated&&age>=track.duration,sensorActive:activated&&age>=track.openFrom-track.ramp&&age<track.openUntil+track.ramp},track:{...track,points},lift:world.mechanism.lift*opening,
    balls:activated?[{...structuredClone(session.setupBall),position,rolling:progress<1,progress}]:[]};
}

const WORLD_BY_VERSION=freeze(Object.fromEntries([...Object.values(FACTORY_LEGACY_WORLDS),...Object.values(FACTORY_RELEASED_WORLDS),...Object.values(FACTORY_ROUTE_WORLDS),...Object.values(FACTORY_NECESSITY_WORLDS),...Object.values(FACTORY_CONVEYOR_WORLDS),...Object.values(FACTORY_WORLDS)].map(w=>[w.worldVersion,w])));
export function factoryWorldByVersion(worldVersion){return Number.isInteger(worldVersion)&&Object.hasOwn(WORLD_BY_VERSION,worldVersion)?WORLD_BY_VERSION[worldVersion]:null;}
export function factoryWorld(stageId,worldVersion){const world=worldVersion===undefined?typeof stageId==='string'&&Object.hasOwn(FACTORY_WORLDS,stageId)?FACTORY_WORLDS[stageId]:null:factoryWorldByVersion(worldVersion);return world?.stageId===stageId?world:null;}
function requireWorld(world){const saved=factoryWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported factory world is required');return saved;}
export function factorySolids(world){return requireWorld(world).solids;}
export function factoryGoals(world,time=0,session){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Factory time must be finite');return world.goals.map(value=>({...value,center:{...value.center}}));}
export function factoryMotion(world,time=0,session){
  world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Factory time must be finite');if(world.worldVersion===47&&(time<0||time>1e9))throw new RangeError('Timed relay clock is outside its absolute range');
  const mechanism=world.mechanism,timed=world.worldVersion===47?timedRelayMotion(world,time,session):null;let shutter=null,gate=null,belt=null;
  if(world.factoryType==='shutter'){
    const phase=factoryStartTime(time),lift=mechanism.lift*(.5-.5*Math.cos(phase*Math.PI/4));
    shutter={id:mechanism.id,kind:'shutter',lift,min:p(mechanism.min.x,mechanism.min.y+lift,mechanism.min.z),max:p(mechanism.max.x,mechanism.max.y+lift,mechanism.max.z),open:lift>2.3};
  }
  if(world.factoryType==='conveyor')belt={id:mechanism.id,kind:'conveyor',speed:mechanism.speed,direction:{...mechanism.direction},offset:time*mechanism.speed,endZ:mechanism.endZ};
  if(world.factoryType==='relay'){
    const lift=timed?timed.lift:session?.stageId===world.stageId&&session?.plateLatched?mechanism.lift:0;
    gate={id:mechanism.id,kind:'relay-gate',lift,min:p(mechanism.min.x,mechanism.min.y+lift,mechanism.min.z),max:p(mechanism.max.x,mechanism.max.y+lift,mechanism.max.z),open:lift>0};
  }
  const pistons=(mechanism.pistons??[]).map(q=>{
    const offset=q.amplitude*Math.sin(time*2*Math.PI/mechanism.period+q.phase),x=q.baseX+offset;
    return {id:q.id,kind:'piston-face',side:q.side,offset,min:p(x-.1,0,.45),max:p(x+.1,5.8,7.25),
      surfaceVelocity:p(q.amplitude*2*Math.PI/mechanism.period*Math.cos(time*2*Math.PI/mechanism.period+q.phase),0,0)};
  });
  const belts=world.worldVersion===46?world.solids.filter(s=>s.surface==='belt').map(s=>({id:s.id,kind:s.kind,min:{...s.min},max:{...s.max},speed:Math.hypot(s.surfaceVelocity.x,s.surfaceVelocity.z),direction:p(s.surfaceVelocity.x/Math.hypot(s.surfaceVelocity.x,s.surfaceVelocity.z),0,s.surfaceVelocity.z/Math.hypot(s.surfaceVelocity.x,s.surfaceVelocity.z)),offset:time*Math.hypot(s.surfaceVelocity.x,s.surfaceVelocity.z)})):[];
  const presses=(mechanism.presses??[]).map(q=>{const lift=q.lift*(.5+.5*Math.cos(time*2*Math.PI/mechanism.pressPeriod+q.phase));return {id:q.id,kind:'stamping-press',lift,min:p(q.min.x,q.min.y+lift,q.min.z),max:p(q.max.x,q.max.y+lift,q.max.z),closed:lift<.35};});
  const balls=timed?timed.balls:world.factoryType==='relay'&&session?.stageId===world.stageId&&session.setupBall?[structuredClone(session.setupBall)]:[];
  return {actors:[],goals:factoryGoals(world,time,session),shutter,gate,belt,balls,...(pistons.length?{pistons}:{}),...(belts.length?{belts,presses}:{}),...(timed?{relayClock:timed.relayClock,track:timed.track}:{}),plate:{id:mechanism.plateId??null,pressed:!!(session?.stageId===world.stageId&&session.plateLatched)},
    bankLights:world.factoryType==='bank'?mechanism.requiredColliders.map(id=>({id,lit:session?.stageId===world.stageId&&session.bankContacts?.includes(id)})):[]};
}
export function factoryDynamicSolids(world,time=0,session){
  world=requireWorld(world);const motion=factoryMotion(world,time,session),solids=[];
  for(const moving of [motion.shutter,motion.gate])if(moving)solids.push(box(moving.id,moving.kind,moving.min,moving.max,'machine',.22));
  for(const piston of motion.pistons??[])solids.push(box(piston.id,piston.kind,piston.min,piston.max,'machine',.8,{friction:.02,surfaceVelocity:piston.surfaceVelocity,side:piston.side}));
  for(const press of motion.presses??[])solids.push(box(press.id,press.kind,press.min,press.max,'machine',0,{blocking:true}));
  for(const ball of motion.balls)solids.push(box(ball.id,'parked-ball',p(ball.position.x-ball.radius,ball.position.y-ball.radius,ball.position.z-ball.radius),p(ball.position.x+ball.radius,ball.position.y+ball.radius,ball.position.z+ball.radius),'ball',.2));
  return solids;
}
