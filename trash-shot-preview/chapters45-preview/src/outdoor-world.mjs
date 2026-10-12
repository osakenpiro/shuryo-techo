// Metre-space geometry for Chapter 3. This file imports no simulation code:
// rendering, contacts and recorded-world validation consume the same poses.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const p=(x,y,z)=>({x,y,z});
const box=(id,object,kind,min,max,surface='furniture',restitution=.28,extra={})=>({id,object,kind,min,max,surface,restitution,...extra});
const horizontal=(id,role,kind,center,radius,extra={})=>({id,role,kind,label:extra.label??id,shape:'circle',center,normal:p(0,1,0),up:p(0,0,1),radius,...extra});
const front=(id,role,kind,center,radius,extra={})=>({id,role,kind,label:extra.label??id,shape:'circle',center,normal:p(0,0,-1),up:p(0,1,0),radius,...extra});
export const OUTDOOR_ENVIRONMENT_PERIOD=12;
export function outdoorStartTime(time=0){if(!Number.isFinite(time))throw new TypeError('Outdoor time must be finite');return ((time%OUTDOOR_ENVIRONMENT_PERIOD)+OUTDOOR_ENVIRONMENT_PERIOD)%OUTDOOR_ENVIRONMENT_PERIOD;}
const shrineGoals=[
  {id:'shrine-offering',role:'normal',kind:'offering-box',label:'賽銭箱',shape:'rectangle',center:p(0,1.1,6.8),normal:p(0,1,0),up:p(0,0,1),halfWidth:1.03,halfHeight:.43},
  horizontal('shrine-hand','alternative','hand',p(-1.65,2.05,4.3),.29,{label:'伸ばしている手'}),
];
const crowd=[
  {id:'worshipper-left',kind:'worshipper',position:p(-1.25,0,3.3),height:1.68,width:.43,depth:.35,color:'#b87754'},
  {id:'worshipper-right',kind:'worshipper',position:p(1.13,0,3.05),height:1.74,width:.45,depth:.35,color:'#6f9891'},
  {id:'worshipper-back-left',kind:'worshipper',position:p(-.55,0,4.25),height:1.6,width:.42,depth:.35,color:'#a59b6f'},
  {id:'worshipper-back-right',kind:'worshipper',position:p(.53,0,4.5),height:1.72,width:.42,depth:.35,color:'#7491ac'},
  {id:'hand-owner',kind:'raised-hand',position:p(-1.65,0,4.3),height:1.67,width:.44,depth:.35,color:'#bd866b'},
];
const shrineSolids=[
  box('shrine-offering-body','shrine-offering','offering-box',p(-1.16,0,6.26),p(1.16,.82,7.34)),
  box('shrine-offering-back','shrine-offering','offering-rim',p(-1.15,.82,7.23),p(1.15,1.16,7.35),'rim',.35),
  box('shrine-offering-left','shrine-offering','offering-rim',p(-1.16,.82,6.25),p(-1.04,1.16,7.34),'rim',.35),
  box('shrine-offering-right','shrine-offering','offering-rim',p(1.04,.82,6.25),p(1.16,1.16,7.34),'rim',.35),
  box('shrine-offering-front','shrine-offering','offering-rim',p(-1.15,.82,6.25),p(1.15,1.16,6.37),'rim',.35),
  box('shrine-bell-rope','shrine-bell-rope','bell-rope',p(.62,.82,5.94),p(.76,4.55,6.08),'rope',.48),
  box('shrine-back-wall','shrine-building','wall',p(-3.5,0,8.3),p(3.5,4.4,8.5),'wall',.35),
  box('shrine-left-post','shrine-building','post',p(-2.45,0,6.9),p(-2.18,4.1,7.17)),
  box('shrine-right-post','shrine-building','post',p(2.18,0,6.9),p(2.45,4.1,7.17)),
];
const mittXs=[-5.6,-2.8,0,2.8,5.6];
const baseballGoals=mittXs.map((x,i)=>front(`stadium-mitt-${i+1}`,'normal','mitt',p(x,6,40),.62,{label:`観客のミット ${i+1}`}));
baseballGoals.push({id:'stadium-scoreboard-light',role:'alternative',kind:'scoreboard-light',label:'光る得点板',shape:'rectangle',center:p(0,14,55),normal:p(0,0,-1),up:p(0,1,0),halfWidth:1.25,halfHeight:.72});
const baseballSolids=[
  box('stadium-stand','stadium-stand','stand',p(-10,0,38.7),p(10,4.2,44.2)),
  box('stadium-scoreboard','stadium-scoreboard','scoreboard',p(-6,10,55.3),p(6,17.8,55.6),'wall',.35),
  box('stadium-left-fence','stadium-left-fence','fence',p(-16.2,0,0),p(-16,2.2,58),'wall',.35),
  box('stadium-right-fence','stadium-right-fence','fence',p(16,0,0),p(16.2,2.2,58),'wall',.35),
];
const baseballActors=mittXs.map((x,i)=>({id:`spectator-${i+1}`,kind:'spectator',position:p(x,4.2,40.45),height:1.7,width:.46,depth:.35,color:['#79989c','#bc8669','#839c65','#b69b5d','#7898b0'][i]}));
const mallGoals=[
  horizontal('mall-child-cone','normal','cone',p(0,1.4,3.2),.33,{label:'子供のコーン'}),
  horizontal('mall-coffee','alternative','coffee',p(-2.7,5.4,2.3),.33,{label:'別階のコーヒー'}),
  horizontal('mall-soda','alternative','soda',p(2.8,3.3,2.8),.34,{label:'別階のサイダー'}),
];
const mallSolids=[
  box('mall-source-balcony','mall-source-balcony','balcony',p(-3.4,7.1,-2.3),p(3.4,7.3,-.45)),
  box('mall-source-left-rail','mall-source-rail','rail',p(-3.4,7.3,-.52),p(-.45,8.25,-.42),'rail',.3),
  box('mall-source-right-rail','mall-source-rail','rail',p(.45,7.3,-.52),p(3.4,8.25,-.42),'rail',.3),
  box('mall-left-middle-balcony','mall-left-balcony','balcony',p(-5.5,4.3,.5),p(-2.9,4.5,5.1)),
  box('mall-right-low-balcony','mall-right-balcony','balcony',p(3,2.1,.5),p(5.5,2.3,5.1)),
  box('mall-coffee-body','mall-coffee','cup',p(-2.96,4.96,2.04),p(-2.44,5.15,2.56)),
  box('mall-soda-body','mall-soda','cup',p(2.52,2.7,2.52),p(3.08,3.05,3.08)),
  box('mall-cone-body','mall-child-cone','cone',p(-.16,.9,3.04),p(.16,1.14,3.36)),
  box('mall-back-wall','mall-back-wall','wall',p(-6,0,6.2),p(6,10.4,6.4),'wall',.3),
];
const mallActors=[
  {id:'mall-child',kind:'child',position:p(0,0,3.52),height:1.12,width:.34,depth:.28,color:'#d2a456'},
  {id:'coffee-customer',kind:'customer',position:p(-3.4,4.5,2.55),height:1.68,width:.44,depth:.35,color:'#739990'},
  {id:'soda-customer',kind:'customer',position:p(3.55,2.3,3.08),height:1.62,width:.44,depth:.35,color:'#b98983'},
];
const riverGoals=[
  horizontal('river-firework-tube','normal','firework-tube',p(0,1.2,11.5),.57,{label:'向こう岸の花火筒'}),
  horizontal('river-steamship-chimney','alternative','chimney',p(0,2.5,6.3),.6,{label:'蒸気船の煙突',motionId:'river-steamship'}),
];
const riverSolids=[
  box('river-near-bank','river-near-bank','bank',p(-6,0,-2.8),p(6,.07,1.15)),
  box('river-far-bank','river-far-bank','bank',p(-6,0,10.6),p(6,.07,16)),
  box('river-tube-body','river-firework-tube','tube',p(-.5,.07,11),p(.5,.94,12)),
  box('river-water','river-water','water',p(-20,-.1,1.2),p(20,0,10.55),'water',0,{blocking:true}),
];
export const OUTDOOR_PHYSICS_WORLDS=freeze({
  11:{worldVersion:11,origin:p(0,1.05,0),bin:{center:p(0,.55,6.8),radius:1.03,height:1.1}},
  12:{worldVersion:12,origin:p(0,1.9,0),bin:{center:p(0,3,40),radius:.62,height:6},launchScale:3.2},
  13:{worldVersion:13,origin:p(0,8.4,0),bin:{center:p(0,.7,3.2),radius:.33,height:1.4},launchLimits:{minPower:.1,maxPower:14,minElevation:-80,maxElevation:85}},
  14:{worldVersion:14,origin:p(0,1.3,0),bin:{center:p(0,.6,11.5),radius:.57,height:1.2},launchScale:1.3},
});
const make=(stageId,version,outdoorType,itemId,goals,solids,actors,launch,view,extra={})=>({stageId,worldVersion:version,environment:'outdoor',outdoorType,itemId,
  physics:OUTDOOR_PHYSICS_WORLDS[version],origin:OUTDOOR_PHYSICS_WORLDS[version].origin,bin:OUTDOOR_PHYSICS_WORLDS[version].bin,
  goals,solids,actors,launch,view,room:{minX:-20,maxX:20,minZ:-3,maxZ:60,height:25,openSky:true},...extra});
export const OUTDOOR_WORLDS=freeze({
  'outdoor-shrine':make('outdoor-shrine',11,'shrine','coin',shrineGoals,shrineSolids,crowd,{power:7.4,elevation:48,yaw:0},{target:p(0,1.5,3.8),distance:13,azimuth:.2,elevation:.38},{room:{minX:-5,maxX:5,minZ:-2,maxZ:8.5,height:5,openSky:true}}),
  'outdoor-baseball':make('outdoor-baseball',12,'baseball','baseball',baseballGoals,baseballSolids,baseballActors,{power:9.8,elevation:30,yaw:0},{target:p(0,5,19),distance:54,azimuth:.18,elevation:.42},{room:{minX:-17,maxX:17,minZ:-3,maxZ:58,height:20,openSky:true}}),
  'outdoor-mall':make('outdoor-mall',13,'mall','ice-scoop',mallGoals,mallSolids,mallActors,{power:3.1,elevation:0,yaw:0},{target:p(0,4.3,2),distance:16,azimuth:.28,elevation:.55},{room:{minX:-6,maxX:6,minZ:-3,maxZ:6.4,height:11,openSky:true}}),
  'outdoor-river':make('outdoor-river',14,'river','firework-ball',riverGoals,riverSolids,[{id:'firework-worker',kind:'worker',position:p(1.05,.07,11.75),height:1.7,width:.46,depth:.35,color:'#788dad'}],{power:10.4,elevation:44,yaw:0},{target:p(0,1.3,6.5),distance:20,azimuth:.18,elevation:.43},{room:{minX:-7,maxX:7,minZ:-3,maxZ:16,height:12,openSky:true},water:{minX:-20,maxX:20,minZ:1.2,maxZ:10.55,y:0},fireworks:{burstCenter:p(.2,6.2,11.5)},wind:p(.025,0,0)}),
});
export function outdoorWorld(stageId,worldVersion){const world=typeof stageId==='string'&&Object.hasOwn(OUTDOOR_WORLDS,stageId)?OUTDOOR_WORLDS[stageId]:null;return world&&(worldVersion===undefined||worldVersion===world.worldVersion)?world:null;}
function requireWorld(world){const saved=outdoorWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported outdoor world is required');return saved;}
export function outdoorSolids(world){return requireWorld(world).solids;}
export function outdoorActors(world,time=0){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Outdoor time must be finite');return world.actors.map((actor,index)=>({...actor,position:{...actor.position,...(world.outdoorType==='shrine'&&!actor.id.startsWith('hand-')?{x:actor.position.x+.075*Math.sin(time*Math.PI/6+index)}:{})}}));}
export function outdoorBoats(world,time=0){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Outdoor time must be finite');if(world.outdoorType!=='river')return [];const phase=time*Math.PI/6;return [
  {id:'river-steamship',kind:'steamship',position:p(4.8*Math.sin(phase-.7),.16,6.3),width:3.5,depth:1.25,height:.7,chimney:{height:2.5,radius:.6}},
  {id:'river-houseboat',kind:'houseboat',position:p(4.8*Math.sin(phase+2.2),.12,3.6),width:3,depth:1.1,height:1.05},
];}
export function outdoorGoals(world,time=0){world=requireWorld(world);const boats=outdoorBoats(world,time);return world.goals.map(goal=>({...goal,center:goal.motionId?{...goal.center,x:boats.find(b=>b.id===goal.motionId).position.x}:{...goal.center}}));}
export function outdoorMotion(world,time=0){world=requireWorld(world);const boats=outdoorBoats(world,time),actors=outdoorActors(world,time),goals=outdoorGoals(world,time);const lamps=boats.map((boat,index)=>({id:`${boat.id}-lamp`,position:p(boat.position.x,Math.max(1.25,boat.position.y+boat.height+.16),boat.position.z-boat.depth/2-.14),radius:index?3.1:7.1,intensity:index?1:2,color:index?'#efc875':'#f8dca2'}));return {actors,boats,lamps,goals};}
export function outdoorDynamicSolids(world,time=0){world=requireWorld(world);const solids=outdoorActors(world,time).map(actor=>box(`${actor.id}-body`,actor.id,'person',p(actor.position.x-actor.width/2,actor.position.y,actor.position.z-actor.depth/2),p(actor.position.x+actor.width/2,actor.position.y+actor.height,actor.position.z+actor.depth/2),'person',0,{blocking:true}));
  for(const boat of outdoorBoats(world,time)){
    const q=boat.position;solids.push(box(`${boat.id}-hull`,boat.id,'boat-hull',p(q.x-boat.width/2,q.y,q.z-boat.depth/2),p(q.x+boat.width/2,q.y+boat.height,q.z+boat.depth/2),'boat',.28));
    if(boat.chimney)solids.push(box(`${boat.id}-chimney-body`,boat.id,'chimney',p(q.x-.43,.7,q.z-.43),p(q.x+.43,2.22,q.z+.43),'boat',.3));
  }return solids;
}
