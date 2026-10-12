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
export const FACTORY_WORLDS=freeze({
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
export function factoryWorld(stageId,worldVersion){const world=typeof stageId==='string'&&Object.hasOwn(FACTORY_WORLDS,stageId)?FACTORY_WORLDS[stageId]:null;return world&&(worldVersion===undefined||worldVersion===world.worldVersion)?world:null;}
function requireWorld(world){const saved=factoryWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported factory world is required');return saved;}
export function factorySolids(world){return requireWorld(world).solids;}
export function factoryGoals(world,time=0,session){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Factory time must be finite');return world.goals.map(value=>({...value,center:{...value.center}}));}
export function factoryMotion(world,time=0,session){
  world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Factory time must be finite');
  const mechanism=world.mechanism;let shutter=null,gate=null,belt=null;
  if(world.factoryType==='shutter'){
    const phase=factoryStartTime(time),lift=mechanism.lift*(.5-.5*Math.cos(phase*Math.PI/4));
    shutter={id:mechanism.id,kind:'shutter',lift,min:p(mechanism.min.x,mechanism.min.y+lift,mechanism.min.z),max:p(mechanism.max.x,mechanism.max.y+lift,mechanism.max.z),open:lift>2.3};
  }
  if(world.factoryType==='conveyor')belt={id:mechanism.id,kind:'conveyor',speed:mechanism.speed,direction:{...mechanism.direction},offset:time*mechanism.speed,endZ:mechanism.endZ};
  if(world.factoryType==='relay'){
    const lift=session?.stageId===world.stageId&&session?.plateLatched?mechanism.lift:0;
    gate={id:mechanism.id,kind:'relay-gate',lift,min:p(mechanism.min.x,mechanism.min.y+lift,mechanism.min.z),max:p(mechanism.max.x,mechanism.max.y+lift,mechanism.max.z),open:lift>0};
  }
  const balls=world.factoryType==='relay'&&session?.stageId===world.stageId&&session.setupBall?[structuredClone(session.setupBall)]:[];
  return {actors:[],goals:factoryGoals(world,time,session),shutter,gate,belt,balls,plate:{id:mechanism.plateId??null,pressed:!!(session?.stageId===world.stageId&&session.plateLatched)},
    bankLights:world.factoryType==='bank'?mechanism.requiredColliders.map(id=>({id,lit:session?.stageId===world.stageId&&session.bankContacts?.includes(id)})):[]};
}
export function factoryDynamicSolids(world,time=0,session){
  world=requireWorld(world);const motion=factoryMotion(world,time,session),solids=[];
  for(const moving of [motion.shutter,motion.gate])if(moving)solids.push(box(moving.id,moving.kind,moving.min,moving.max,'machine',.22));
  for(const ball of motion.balls)solids.push(box(ball.id,'parked-ball',p(ball.position.x-ball.radius,ball.position.y-ball.radius,ball.position.z-ball.radius),p(ball.position.x+ball.radius,ball.position.y+ball.radius,ball.position.z+ball.radius),'ball',.2));
  return solids;
}
