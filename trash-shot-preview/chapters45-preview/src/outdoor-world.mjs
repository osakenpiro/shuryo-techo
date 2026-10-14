// Metre-space geometry for Chapter 3. This file imports no simulation code:
// rendering, contacts and recorded-world validation consume the same poses.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const p=(x,y,z)=>({x,y,z});
const box=(id,object,kind,min,max,surface='furniture',restitution=.28,extra={})=>({id,object,kind,min,max,surface,restitution,...extra});
const horizontal=(id,role,kind,center,radius,extra={})=>({id,role,kind,label:extra.label??id,shape:'circle',center,normal:p(0,1,0),up:p(0,0,1),radius,...extra});
const front=(id,role,kind,center,radius,extra={})=>({id,role,kind,label:extra.label??id,shape:'circle',center,normal:p(0,0,-1),up:p(0,1,0),radius,...extra});
export const OUTDOOR_ENVIRONMENT_PERIOD=12;
export function outdoorStartTime(time=0){if(!Number.isFinite(time))throw new TypeError('Outdoor time must be finite');return ((time%OUTDOOR_ENVIRONMENT_PERIOD)+OUTDOOR_ENVIRONMENT_PERIOD)%OUTDOOR_ENVIRONMENT_PERIOD;}
export function shrineStartTime(time=0){return (Math.floor(outdoorStartTime(time)*240+1e-9)%2880)/240;}
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
  30:{worldVersion:30,origin:p(0,1.05,0),bin:{center:p(0,.55,6.8),radius:1.03,height:1.1}},
  31:{worldVersion:31,origin:p(0,1.9,0),bin:{center:p(0,3,40),radius:.62,height:6},launchScale:3.2},
  32:{worldVersion:32,origin:p(0,8.4,0),bin:{center:p(0,.7,3.2),radius:.33,height:1.4},launchLimits:{minPower:.1,maxPower:14,minElevation:-80,maxElevation:85}},
  33:{worldVersion:33,origin:p(0,1.9,0),bin:{center:p(0,3,40),radius:.62,height:6},launchScale:3.2},
  34:{worldVersion:34,origin:p(0,8.4,0),bin:{center:p(0,.625,3.2),radius:.05,height:1.25},launchLimits:{minPower:.1,maxPower:14,minElevation:-80,maxElevation:85}},
  35:{worldVersion:35,origin:p(0,1.3,0),bin:{center:p(0,.6,11.5),radius:.17,height:1.2},launchScale:1.3},
  36:{worldVersion:36,origin:p(0,1.9,0),bin:{center:p(0,2.775,40),radius:.62,height:5.55},launchScale:3.2},
  37:{worldVersion:37,origin:p(0,1.3,0),bin:{center:p(0,.6,11.5),radius:.17,height:1.2},launchScale:1.3},
});
const make=(stageId,version,outdoorType,itemId,goals,solids,actors,launch,view,extra={})=>({stageId,worldVersion:version,environment:'outdoor',outdoorType,itemId,
  physics:OUTDOOR_PHYSICS_WORLDS[version],origin:OUTDOOR_PHYSICS_WORLDS[version].origin,bin:OUTDOOR_PHYSICS_WORLDS[version].bin,
  goals,solids,actors,launch,view,room:{minX:-20,maxX:20,minZ:-3,maxZ:60,height:25,openSky:true},...extra});
export const OUTDOOR_LEGACY_WORLDS=freeze({
  'outdoor-shrine':make('outdoor-shrine',11,'shrine','coin',shrineGoals,shrineSolids,crowd,{power:7.4,elevation:48,yaw:0},{target:p(0,1.5,3.8),distance:13,azimuth:.2,elevation:.38},{room:{minX:-5,maxX:5,minZ:-2,maxZ:8.5,height:5,openSky:true}}),
  'outdoor-baseball':make('outdoor-baseball',12,'baseball','baseball',baseballGoals,baseballSolids,baseballActors,{power:9.8,elevation:30,yaw:0},{target:p(0,5,19),distance:54,azimuth:.18,elevation:.42},{room:{minX:-17,maxX:17,minZ:-3,maxZ:58,height:20,openSky:true}}),
  'outdoor-mall':make('outdoor-mall',13,'mall','ice-scoop',mallGoals,mallSolids,mallActors,{power:3.1,elevation:0,yaw:0},{target:p(0,4.3,2),distance:16,azimuth:.28,elevation:.55},{room:{minX:-6,maxX:6,minZ:-3,maxZ:6.4,height:11,openSky:true}}),
  'outdoor-river':make('outdoor-river',14,'river','firework-ball',riverGoals,riverSolids,[{id:'firework-worker',kind:'worker',position:p(1.05,.07,11.75),height:1.7,width:.46,depth:.35,color:'#788dad'}],{power:10.4,elevation:44,yaw:0},{target:p(0,1.3,6.5),distance:20,azimuth:.18,elevation:.43},{room:{minX:-7,maxX:7,minZ:-3,maxZ:16,height:12,openSky:true},water:{minX:-20,maxX:20,minZ:1.2,maxZ:10.55,y:0},fireworks:{burstCenter:p(.2,6.2,11.5)},wind:p(.025,0,0)}),
});
const inariGoal={id:'shrine-inari',role:'alternative',kind:'inari-offering-box',label:'脇の稲荷社の賽銭箱',shape:'rectangle',center:p(3.8,.9,5.7),normal:p(0,1,0),up:p(0,0,1),halfWidth:.38,halfHeight:.3};
const inariSolids=[
  box('shrine-inari-box-body','shrine-inari','offering-box',p(3.36,0,5.35),p(4.24,.64,6.05)),
  box('shrine-inari-box-front','shrine-inari','offering-rim',p(3.36,.64,5.34),p(4.24,.94,5.4),'rim',.35),
  box('shrine-inari-box-back','shrine-inari','offering-rim',p(3.36,.64,6),p(4.24,.94,6.06),'rim',.35),
  box('shrine-inari-box-left','shrine-inari','offering-rim',p(3.35,.64,5.35),p(3.42,.94,6.05),'rim',.35),
  box('shrine-inari-box-right','shrine-inari','offering-rim',p(4.18,.64,5.35),p(4.25,.94,6.05),'rim',.35),
  box('shrine-inari-house','shrine-inari-house','small-shrine',p(3.25,0,6.15),p(4.35,1.75,7.05)),
  box('shrine-inari-roof','shrine-inari-house','small-shrine-roof',p(3.08,1.75,6.04),p(4.52,1.93,7.2)),
];
const newerCrowd=[
  [-1.5,2.1,1.7,'adult','coat','short',false],[-.55,2.35,1.24,'child','hoodie','short',false],[1.15,2.2,1.66,'adult','skirt','bob',false],
  [-2.25,3.35,1.63,'elderly','coat','grey',false],[-1.04,3.6,1.74,'adult','shirt','short',true],[.35,3.35,1.6,'teen','hoodie','ponytail',true],[1.45,3.75,1.7,'adult','coat','short',false],[2.55,3.6,1.56,'teen','shirt','bob',false],
  [-2.35,4.9,1.67,'adult','skirt','ponytail',false],[-1.35,4.7,1.54,'elderly','coat','grey',false],[-.32,5.05,1.71,'adult','shirt','short',true],[.95,4.7,1.3,'child','hoodie','short',false],[2.2,4.95,1.7,'adult','coat','bob',true],
  [-1.85,5.75,1.7,'adult','shirt','short',false],[-.95,5.9,1.65,'adult','skirt','bob',false],[1.25,5.75,1.68,'elderly','coat','grey',false],
].map(([x,z,height,age,clothing,hair,reaching],index)=>({id:`shrine-visitor-${index+1}`,kind:'worshipper',position:p(x,0,z),height,width:age==='child'?.31:index%4===0?.52:index%3===0?.35:.43,depth:.30,color:['#b87754','#739991','#d2a45f','#7999b1','#ad8885','#99a079'][index%6],
  appearance:{age:age==='elderly'?'elder':age,build:index%4===0?'broad':index%3===0?'slim':'regular',clothing:clothing==='shirt'?'sweater':clothing,hair:hair==='grey'?'silver':hair,hat:index===3?'knit':index===13?'cap':'none',bag:age==='teen'?'backpack':index%5===0?'shoulder':'none',gesture:reaching?'reach':['prayer','bow','wait'][index%3],skin:['#d6af8c','#c99574','#e5bd98'][index%3]},reaching,posePhase:index*.83}));
// Previously released world 31 is kept byte-for-byte for saved V7 records.
// The default can advance without rebinding their collision or actor poses.
export const OUTDOOR_PREVIOUS_WORLDS=freeze({
  'outdoor-baseball':{...OUTDOOR_LEGACY_WORLDS['outdoor-baseball'],worldVersion:31,physics:OUTDOOR_PHYSICS_WORLDS[31],origin:OUTDOOR_PHYSICS_WORLDS[31].origin,bin:OUTDOOR_PHYSICS_WORLDS[31].bin,solids:[...baseballSolids,...[-4.7,4.7].map((x,index)=>box(`stadium-scoreboard-support-${index===0?'left':'right'}`,'stadium-scoreboard','scoreboard-column',p(x-.16,0,55.3),p(x+.16,10,55.6),'wall',.35))],view:{target:p(0,8,26),distance:82,azimuth:.12,elevation:.44},visualBounds:{minX:-38,maxX:38,minZ:-23,maxZ:78,height:36}},
  'outdoor-mall':{...OUTDOOR_LEGACY_WORLDS['outdoor-mall'],worldVersion:32,physics:OUTDOOR_PHYSICS_WORLDS[32],origin:OUTDOOR_PHYSICS_WORLDS[32].origin,bin:OUTDOOR_PHYSICS_WORLDS[32].bin,view:{target:p(0,4.2,2.1),distance:15.4,azimuth:0,elevation:.98},visualBounds:{minX:-9,maxX:9,minZ:-4,maxZ:8,height:12}},
});
// One stepped outfield boundary owns both the collision volumes and their
// visible terraces. The central catchers stand behind the fence in row one;
// connected side wings turn toward the infield instead of leaving a podium
// in the grass. AABB steps intentionally match the existing contact model.
const standLevels=[4.2,5.5,6.8,8.1],standDepths=[4.4,3.4,3.4,3.4];
const wingRanges=[[10,13,36.46666666666667],[13,16,35.233333333333334],[16,19,34],[19,21.2,31.123076923076923],[21.2,23.4,28.246153846153845],[23.4,25.5,25.5]];
const standSegments=[{id:'centre',minX:-10,maxX:10,frontZ:37.9},...[-1,1].flatMap(side=>wingRanges.map(([inner,outer,frontZ],i)=>({id:`${side<0?'left':'right'}-${i+1}`,minX:side<0?-outer:inner,maxX:side<0?-inner:outer,frontZ})))];
const connectedStandSolids=[];
for(const segment of standSegments){
  connectedStandSolids.push(box(`stadium-outfield-fence-${segment.id}`,'stadium-outfield-fence','outfield-fence',p(segment.minX,0,segment.frontZ-.3),p(segment.maxX,2.4,segment.frontZ),'wall',.35));
  let z=segment.frontZ;
  for(const [row,height] of standLevels.entries()){
    connectedStandSolids.push(box(`stadium-terrace-${segment.id}-${row+1}`,'stadium-connected-stands','stand-terrace',p(segment.minX,0,z),p(segment.maxX,height,z+standDepths[row])));
    z+=standDepths[row];
  }
}
// Close the short returns between each stepped front segment, so a visible
// fence corner has no diagonal gap in the same sphere sweep used for play.
for(const side of [-1,1]){
  let priorZ=37.9;
  for(const [index,[inner,,frontZ]] of wingRanges.entries()){
    const x=side*inner;
    connectedStandSolids.push(box(`stadium-fence-return-${side<0?'left':'right'}-${index+1}`,'stadium-outfield-fence','fence-return',p(x-.15,0,frontZ-.3),p(x+.15,2.4,priorZ),'wall',.35));
    priorZ=frontZ;
  }
}
connectedStandSolids.push(box('stadium-front-row-rail','stadium-connected-stands','stand-rail',p(-10,4.75,39.45),p(10,4.9,39.52),'rail',.3));
export const BASEBALL_STANDS_GEOMETRY=freeze({worldVersion:33,segments:standSegments,levels:standLevels,depths:standDepths,solids:connectedStandSolids,fieldFront:standSegments.map(s=>({minX:s.minX,maxX:s.maxX,z:s.frontZ-.3})),spectatorRow:{floorY:4.2,feetZ:40.45,goalY:6,goalZ:40,solidId:'stadium-terrace-centre-1'}});
const foulPoles=[-1,1].map(side=>box(`stadium-foul-pole-${side<0?'left':'right'}`,'stadium-foul-poles','foul-pole',p(side*25.5-.07,0,25.18),p(side*25.5+.07,10,25.32),'wall',.35));
const seatedCatchers=baseballActors.map((actor,index)=>({...actor,facing:p(0,0,-1),gesture:'await-catch',mittGoalId:baseballGoals[index].id,supportSolidId:'stadium-terrace-centre-1',appearance:{shirt:['jersey','hoodie','jersey','jacket','jersey'][index],hair:['short','bob','short','short','short'][index],hat:['cap','none','cap','cap','none'][index],skin:['#d6af8c','#c99574','#e5bd98','#c99574','#d6af8c'][index]}}));
const realMallGoals=[
  horizontal('mall-child-cone','normal','cone',p(0,1.25,3.2),.05,{label:'子供のコーン',landing:true}),
  horizontal('mall-coffee','alternative','coffee',p(-2.7,5.4,2.3),.045,{label:'別階のコーヒー'}),
  horizontal('mall-soda','alternative','soda',p(2.8,3.3,2.8),.05,{label:'別階のサイダー'}),
];
const realMallSolids=[...mallSolids.filter(c=>!['mall-coffee-body','mall-soda-body','mall-cone-body'].includes(c.id)),
  ...[-1,1].flatMap(side=>[.55,4.82].map((z,index)=>box(`mall-${side<0?'left':'right'}-balcony-post-${index+1}`,'mall-balcony-supports','balcony-post',p(side<0?-5.5:5.34,0,z),p(side<0?-5.34:5.5,side<0?4.3:2.1,z+.18)))),
  ...[[4.3,4.5,'middle'],[2.1,2.3,'lower'],[7.1,7.3,'upper']].map(([bottom,top,level])=>box(`mall-rear-${level}-gallery`,'mall-connected-galleries','balcony',p(-6,bottom,5.1),p(6,top,6.2))),
  box('mall-left-middle-gallery-link','mall-connected-galleries','balcony',p(-6,4.3,.5),p(-5.5,4.5,5.1)),
  box('mall-right-lower-gallery-link','mall-connected-galleries','balcony',p(5.5,2.1,.5),p(6,2.3,5.1)),
  box('mall-coffee-body','mall-coffee','cup',p(-2.75,5.29,2.25),p(-2.65,5.36,2.35)),
  box('mall-soda-body','mall-soda','cup',p(2.745,3.13,2.745),p(2.855,3.26,2.855)),
  box('mall-cone-body','mall-child-cone','cone',p(-.047,1.10,3.153),p(.047,1.20,3.247)),
];
export const OUTDOOR_MALL_PROPS=freeze({worldVersion:34,iceRadius:.035,cone:{center:p(0,1.25,3.2),mouthRadius:.05,outerRadius:.055,tipY:1.10},coffee:{center:p(-2.7,5.4,2.3),mouthRadius:.045,outerRadius:.05,bottomY:5.29},soda:{center:p(2.8,3.3,2.8),mouthRadius:.05,outerRadius:.055,bottomY:3.13}});
export const OUTDOOR_RIVER_PROPS=freeze({worldVersion:35,fireworkRadius:.12,tube:{center:p(0,1.2,11.5),mouthRadius:.17,outerRadius:.205,bottomY:.07},steamship:{width:8,depth:2.4,height:.6,baseY:.16,hullSections:[[-4,-3,.42],[-3,-2,.92],[-2,2,1.2],[2,3,.92],[3,4,.42]],wheelhouse:{minX:1.44,maxX:2.64,minY:.81,maxY:2.55,halfDepth:.72},chimney:{height:2.9,radius:.22,outerRadius:.27,bodyTop:2.65}},houseboat:{width:6.4,depth:2.15,height:.48,baseY:.12,hullSections:[[-3.2,-2.4,.38],[-2.4,-1.6,.82],[-1.6,1.6,1.075],[1.6,2.4,.82],[2.4,3.2,.38]],cabin:{halfLength:2.5,halfDepth:.87,floorY:.6,eaveY:2.35,ridgeY:2.60}}});
export const OUTDOOR_RIVER_NIGHT_PROPS=freeze({...OUTDOOR_RIVER_PROPS,worldVersion:37,
  traffic:{period:12,minX:-20,maxX:20,steamship:{laneZ:5,phase:0,direction:1},houseboat:{laneZ:2.5,phase:1.3,direction:-1}},
  lighting:{ambient:.04,sky:'#050912',water:'#070e18',steamship:{radius:7.5,intensity:1.65,color:'#f8dca2'},houseboat:{radius:3.6,intensity:1.05,color:'#efc875'},board:{radius:3.2,intensity:.8,color:'#f4ca82'}}});
const realRiverGoals=[horizontal('river-firework-tube','normal','firework-tube',p(0,1.2,11.5),.17,{label:'向こう岸の花火筒'}),horizontal('river-steamship-chimney','alternative','chimney',p(0,2.9,6.3),.22,{label:'蒸気船の煙突',motionId:'river-steamship'})];
const realRiverSolids=[...riverSolids.filter(c=>c.id!=='river-tube-body'),box('river-tube-body','river-firework-tube','tube',p(-.205,.07,11.295),p(.205,.96,11.705)),
  box('river-tube-rim-front','river-firework-tube','tube-rim',p(-.205,.96,11.295),p(.205,1.24,11.33),'rim',.35),
  box('river-tube-rim-back','river-firework-tube','tube-rim',p(-.205,.96,11.67),p(.205,1.24,11.705),'rim',.35),
  box('river-tube-rim-left','river-firework-tube','tube-rim',p(-.205,.96,11.295),p(-.17,1.24,11.705),'rim',.35),
  box('river-tube-rim-right','river-firework-tube','tube-rim',p(.17,.96,11.295),p(.205,1.24,11.705),'rim',.35),
];
// Released world33 is immutable: changing the live ballpark cannot change its
// saved stand contacts, catcher positions, capture dimensions or view.
export const OUTDOOR_RELEASED_WORLDS=freeze({
  'outdoor-baseball':{...OUTDOOR_PREVIOUS_WORLDS['outdoor-baseball'],worldVersion:33,physics:OUTDOOR_PHYSICS_WORLDS[33],origin:OUTDOOR_PHYSICS_WORLDS[33].origin,bin:OUTDOOR_PHYSICS_WORLDS[33].bin,actors:seatedCatchers,solids:[...connectedStandSolids,...foulPoles,...OUTDOOR_PREVIOUS_WORLDS['outdoor-baseball'].solids.filter(c=>c.id==='stadium-scoreboard'||c.kind==='scoreboard-column')],room:{minX:-28,maxX:28,minZ:-3,maxZ:58,height:20,openSky:true},stands:BASEBALL_STANDS_GEOMETRY,view:{target:p(0,6.5,24),distance:68,azimuth:.08,elevation:.42}},
});
// World36 separates the hand-sized glove mesh from the user-approved human
// catching area. The ball must cross this actual receiver plane inward; the
// scene moves the same receiver's glove to the saved capture position.
const receiverGoals=mittXs.map((x,index)=>({id:`stadium-mitt-${index+1}`,role:'normal',kind:'mitt',label:`観客のミット ${index+1}`,shape:'rectangle',center:p(x,5.55,40),normal:p(0,0,-1),up:p(0,1,0),halfWidth:.62,halfHeight:.85,mode:'catch',receiverActorId:`spectator-${index+1}`}));
receiverGoals.push({id:'stadium-scoreboard-light',role:'alternative',kind:'scoreboard-light',label:'光る得点板',shape:'rectangle',center:p(0,14,55),normal:p(0,0,-1),up:p(0,1,0),halfWidth:.72,halfHeight:.45});
const realStandLevels=Array.from({length:16},(_,row)=>4.2+.325*row),realStandDepths=[2.95,...Array(15).fill(.85)],realStandAisles=[-17.2,-7,7,17.2].map(x=>({minX:x-.6,maxX:x+.6,width:1.2}));
const realStandSolids=[];
for(const segment of standSegments){
  realStandSolids.push(box(`stadium-outfield-fence-${segment.id}`,'stadium-outfield-fence','outfield-fence',p(segment.minX,0,segment.frontZ-.3),p(segment.maxX,2.4,segment.frontZ),'wall',.35));
  let z=segment.frontZ;
  for(const [row,height] of realStandLevels.entries()){
    const endZ=z+realStandDepths[row],seatZ=row===0?segment.frontZ+2.55:(z+endZ)/2,aisles=realStandAisles.filter(a=>a.minX>segment.minX&&a.maxX<segment.maxX);
    const cuts=[segment.minX,...aisles.flatMap(a=>[a.minX,a.maxX]),segment.maxX];
    for(let part=0;part<cuts.length-1;part++){
      const minX=cuts[part],maxX=cuts[part+1],aisle=aisles.some(a=>a.minX===minX&&a.maxX===maxX),metadata={rowIndex:row,segmentId:segment.id,seatZ};
      if(aisle&&row>0){
        for(let step=0;step<2;step++)realStandSolids.push(box(`stadium-aisle-${segment.id}-${row+1}-${part}-${step+1}`,'stadium-connected-stands','stand-stair',p(minX,0,z+(endZ-z)*step/2),p(maxX,height-.1625*(1-step),z+(endZ-z)*(step+1)/2),'furniture',.28,{...metadata,stepIndex:step}));
      }else realStandSolids.push(box(`stadium-terrace-${segment.id}-${row+1}-${part}`,'stadium-connected-stands',aisle?'stand-concourse':'stand-terrace',p(minX,0,z),p(maxX,height,endZ),'furniture',.28,metadata));
    }
    z=endZ;
  }
}
realStandSolids.push(...connectedStandSolids.filter(c=>c.kind==='fence-return'));
// Only the five front-row receiver chairs lie in the playable catching strip.
// Their visible pan/back bounds are shared with rendering. Far rows remain
// stadium scenery over the real stepped seating terrain, rather than adding
// thousands of thin contacts to the ball's active path.
const targetSeats=mittXs.map((x,index)=>({id:`stadium-target-chair-${index+1}`,actorId:`spectator-${index+1}`,position:p(x,4.2,40.45),width:.48,depth:.43,seatHeight:.43,backHeight:.82,supportSolidId:'stadium-terrace-centre-1-2'}));
for(const seat of targetSeats){const q=seat.position;realStandSolids.push(box(`${seat.id}-pan`,seat.id,'chair-pan',p(q.x-.24,q.y+.40,q.z-.215),p(q.x+.24,q.y+.43,q.z+.215),'furniture',.28,{receiverActorId:seat.actorId}),box(`${seat.id}-back`,seat.id,'chair-back',p(q.x-.24,q.y+.43,q.z+.215),p(q.x+.24,q.y+.82,q.z+.255),'furniture',.28,{receiverActorId:seat.actorId}));}
export const BASEBALL_REAL_STANDS_GEOMETRY=freeze({worldVersion:36,segments:standSegments,levels:realStandLevels,depths:realStandDepths,aisles:realStandAisles,solids:realStandSolids,fieldFront:BASEBALL_STANDS_GEOMETRY.fieldFront,spectatorRow:{floorY:4.2,feetZ:40.45,goalY:5.55,goalZ:40,solidId:'stadium-terrace-centre-1-2'},chair:{width:.48,pitch:.58},stair:{tread:.425,rise:.1625},targetSeats});
const realScoreboardSolids=[box('stadium-scoreboard','stadium-scoreboard','scoreboard',p(-4.2,11.9,55.2),p(4.2,16.1,55.5),'wall',.35),...[-2.8,2.8].map((x,index)=>box(`stadium-scoreboard-support-${index===0?'left':'right'}`,'stadium-scoreboard','scoreboard-column',p(x-.12,0,55.2),p(x+.12,11.9,55.5),'wall',.35))];
const realCatchers=seatedCatchers.map(actor=>({...actor,supportSolidId:'stadium-terrace-centre-1-2'}));
const pitcher={id:'stadium-pitcher',kind:'pitcher',position:p(0,.08,7),height:1.75,width:.46,depth:.35,color:'#f4e9d0',facing:p(0,0,-1),gesture:'pitch',supportSolidId:'stadium-pitcher-mound'};
const pitcherMound=box('stadium-pitcher-mound','stadium-pitcher-mound','mound',p(-.55,0,6.45),p(.55,.08,7.55),'furniture',.28);
// World 35 keeps its original sine motion and light/view descriptors for V7.
export const OUTDOOR_RETAINED_RIVER_WORLDS=freeze({35:{...OUTDOOR_LEGACY_WORLDS['outdoor-river'],worldVersion:35,physics:OUTDOOR_PHYSICS_WORLDS[35],origin:OUTDOOR_PHYSICS_WORLDS[35].origin,bin:OUTDOOR_PHYSICS_WORLDS[35].bin,goals:realRiverGoals,solids:realRiverSolids,props:OUTDOOR_RIVER_PROPS,launch:{power:10.45,elevation:44,yaw:0}}});
export const OUTDOOR_WORLDS=freeze({...OUTDOOR_LEGACY_WORLDS,'outdoor-shrine':{...OUTDOOR_LEGACY_WORLDS['outdoor-shrine'],worldVersion:30,physics:OUTDOOR_PHYSICS_WORLDS[30],origin:OUTDOOR_PHYSICS_WORLDS[30].origin,bin:OUTDOOR_PHYSICS_WORLDS[30].bin,
  actors:newerCrowd,goals:[shrineGoals[0],inariGoal],solids:[...shrineSolids,...inariSolids],view:{...OUTDOOR_LEGACY_WORLDS['outdoor-shrine'].view,target:p(.25,1.5,3.8),distance:14.5},inari:{goalId:'shrine-inari',center:p(3.8,0,6.6),boxCenter:inariGoal.center,boxHalfWidth:inariGoal.halfWidth,boxHalfDepth:inariGoal.halfHeight}},
  'outdoor-baseball':{...OUTDOOR_RELEASED_WORLDS['outdoor-baseball'],worldVersion:36,physics:OUTDOOR_PHYSICS_WORLDS[36],origin:OUTDOOR_PHYSICS_WORLDS[36].origin,bin:OUTDOOR_PHYSICS_WORLDS[36].bin,goals:receiverGoals,actors:[...realCatchers,pitcher],solids:[...realStandSolids,...foulPoles,...realScoreboardSolids,pitcherMound],stands:BASEBALL_REAL_STANDS_GEOMETRY,scoreboard:{min:p(-4.2,11.9,55.2),max:p(4.2,16.1,55.5),highlightGoalId:'stadium-scoreboard-light'},mitt:{length:.32,width:.24,depth:.09},pitcherId:'stadium-pitcher'},
  'outdoor-mall':{...OUTDOOR_PREVIOUS_WORLDS['outdoor-mall'],worldVersion:34,physics:OUTDOOR_PHYSICS_WORLDS[34],origin:OUTDOOR_PHYSICS_WORLDS[34].origin,bin:OUTDOOR_PHYSICS_WORLDS[34].bin,goals:realMallGoals,solids:realMallSolids,props:OUTDOOR_MALL_PROPS,launch:{power:3.05,elevation:-3,yaw:0}},
  'outdoor-river':{...OUTDOOR_RETAINED_RIVER_WORLDS[35],worldVersion:37,physics:OUTDOOR_PHYSICS_WORLDS[37],origin:OUTDOOR_PHYSICS_WORLDS[37].origin,bin:OUTDOOR_PHYSICS_WORLDS[37].bin,goals:realRiverGoals.map(goal=>goal.motionId?{...goal,center:{...goal.center,z:5}}:goal),props:OUTDOOR_RIVER_NIGHT_PROPS,lighting:OUTDOOR_RIVER_NIGHT_PROPS.lighting,view:{target:p(0,1.1,6.5),distance:14.6,azimuth:.1,elevation:.21}}});
const OUTDOOR_WORLD_BY_VERSION=freeze(Object.fromEntries([...Object.values(OUTDOOR_LEGACY_WORLDS),...Object.values(OUTDOOR_PREVIOUS_WORLDS),...Object.values(OUTDOOR_RELEASED_WORLDS),...Object.values(OUTDOOR_RETAINED_RIVER_WORLDS),...Object.values(OUTDOOR_WORLDS)].map(w=>[w.worldVersion,w])));
export function outdoorWorldByVersion(worldVersion){return Number.isInteger(worldVersion)&&Object.hasOwn(OUTDOOR_WORLD_BY_VERSION,worldVersion)?OUTDOOR_WORLD_BY_VERSION[worldVersion]:null;}
export function outdoorWorld(stageId,worldVersion){const world=worldVersion===undefined?typeof stageId==='string'&&Object.hasOwn(OUTDOOR_WORLDS,stageId)?OUTDOOR_WORLDS[stageId]:null:outdoorWorldByVersion(worldVersion);return world?.stageId===stageId?world:null;}
function requireWorld(world){const saved=outdoorWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported outdoor world is required');return saved;}
export function outdoorSolids(world){return requireWorld(world).solids;}
export function outdoorActors(world,time=0){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Outdoor time must be finite');if(world.worldVersion===30)return world.actors.map(actor=>shrineVisitorPose(actor,time));return world.actors.map((actor,index)=>({...actor,position:{...actor.position,...(world.outdoorType==='shrine'&&!actor.id.startsWith('hand-')?{x:actor.position.x+.075*Math.sin(time*Math.PI/6+index)}:{})}}));}
function shrineVisitorKinematics(actor,time){
  const phase=time*Math.PI/6+actor.posePhase,q={...actor.position,x:actor.position.x+.025*Math.sin(phase)},h=actor.height,w=actor.width,joints={hip:p(q.x,h*.48,q.z),head:p(q.x,h*.91,q.z),leftShoulder:p(q.x-w*.42,h*.77,q.z),rightShoulder:p(q.x+w*.42,h*.77,q.z)};
  const reach=actor.reaching?(.5+.5*Math.sin(phase))*.84:0;
  for(const [name,side] of [['left',-1],['right',1]]){
    joints[`${name}Elbow`]=p(q.x+side*(w*.63+.12*reach),h*(.59+.19*reach),q.z-.13*reach);
    joints[`${name}Wrist`]=p(q.x+side*(w*.68+.28*reach),h*(.43+.95*reach),q.z-.24*reach);
    if(actor.appearance.gesture==='prayer'){joints[`${name}Elbow`]=p(q.x+side*.19,h*.61,q.z+.04);joints[`${name}Wrist`]=p(q.x+side*.035,h*.65,q.z+.14);}
    if(actor.appearance.gesture==='bow'){joints.head=p(q.x,h*.88,q.z+.05);joints[`${name}Wrist`].z+=.08;}
    joints[`${name}Knee`]=p(q.x+side*w*.22,h*.24,q.z);joints[`${name}Foot`]=p(q.x+side*w*.22,.035,q.z+.035);
  }
  return {position:q,joints,reach};
}
function shrineVisitorPose(actor,time){
  // Constant-speed translation within each physics tick gives rendering,
  // relative sweeps and replay validation one reconstructable surface speed.
  const tick=1/240,from=Math.floor((time+1e-9)/tick)*tick,f=Math.max(0,Math.min(1,(time-from)/tick)),a=shrineVisitorKinematics(actor,from),b=shrineVisitorKinematics(actor,from+tick),mix=(x,y)=>p(x.x+(y.x-x.x)*f,x.y+(y.y-x.y)*f,x.z+(y.z-x.z)*f),q=mix(a.position,b.position),joints=Object.fromEntries(Object.entries(a.joints).map(([key,value])=>[key,mix(value,b.joints[key])])),h=actor.height,w=actor.width,reach=a.reach+(b.reach-a.reach)*f;
  const parts=[box(`${actor.id}-torso`,actor.id,'person-torso',p(q.x-w/2,h*.28,q.z-.15),p(q.x+w/2,h*.82,q.z+.15),'person',.20),box(`${actor.id}-head`,actor.id,'person-head',p(joints.head.x-.1,joints.head.y-h*.09,joints.head.z-.1),p(joints.head.x+.1,joints.head.y+h*.09,joints.head.z+.1),'person',.20)];
  for(const name of ['left','right']){
    const knee=joints[`${name}Knee`];parts.push(box(`${actor.id}-${name}-leg`,actor.id,'person-leg',p(knee.x-.055,0,q.z-.07),p(knee.x+.055,h*.48,q.z+.07),'person',.20));
    const chain=[joints[`${name}Shoulder`],joints[`${name}Elbow`],joints[`${name}Wrist`]];
    for(let segment=0;segment<2;segment++)for(const [index,t] of [.25,.75].entries()){
      const a=chain[segment],b=chain[segment+1],center=p(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t),r=.07;
      parts.push(box(`${actor.id}-${name}-arm-${segment}-${index}`,actor.id,'person-arm',p(center.x-r,center.y-r,center.z-r),p(center.x+r,center.y+r,center.z+r),'arm',.25));
    }
    const center=chain[2];parts.push(box(`${actor.id}-${name}-hand`,actor.id,'person-hand',p(center.x-.085,center.y-.07,center.z-.07),p(center.x+.085,center.y+.07,center.z+.07),'arm',.25));
  }
  return {...actor,position:q,joints,contactParts:parts,reach};
}
export function outdoorBoats(world,time=0){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Outdoor time must be finite');if(world.outdoorType!=='river')return [];const phase=time*Math.PI/6;if(world.worldVersion===37){
  const props=world.props,traffic=props.traffic,position=(kind)=>{const lane=traffic[kind],fraction=outdoorStartTime(time+lane.phase)/traffic.period,x=lane.direction>0?traffic.minX+(traffic.maxX-traffic.minX)*fraction:traffic.maxX-(traffic.maxX-traffic.minX)*fraction;return p(x,props[kind].baseY,lane.laneZ);};
  return [{id:'river-steamship',kind:'steamship',position:position('steamship'),...props.steamship},{id:'river-houseboat',kind:'houseboat',position:position('houseboat'),...props.houseboat}];
}if(world.worldVersion===35)return [
  {id:'river-steamship',kind:'steamship',position:p(4.8*Math.sin(phase-.7),.16,6.3),width:8,depth:2.4,height:.6,hullSections:OUTDOOR_RIVER_PROPS.steamship.hullSections,wheelhouse:OUTDOOR_RIVER_PROPS.steamship.wheelhouse,chimney:{height:2.9,radius:.22,outerRadius:.27,bodyTop:2.65}},
  {id:'river-houseboat',kind:'houseboat',position:p(4.8*Math.sin(phase+2.2),.12,3.6),width:6.4,depth:2.15,height:.48,hullSections:OUTDOOR_RIVER_PROPS.houseboat.hullSections,cabin:{halfLength:2.5,halfDepth:.87,floorY:.6,eaveY:2.35,ridgeY:2.60}},
];return [
  {id:'river-steamship',kind:'steamship',position:p(4.8*Math.sin(phase-.7),.16,6.3),width:3.5,depth:1.25,height:.7,chimney:{height:2.5,radius:.6}},
  {id:'river-houseboat',kind:'houseboat',position:p(4.8*Math.sin(phase+2.2),.12,3.6),width:3,depth:1.1,height:1.05},
];}
export function outdoorGoals(world,time=0){world=requireWorld(world);const boats=outdoorBoats(world,time);return world.goals.map(goal=>{const boat=goal.motionId?boats.find(b=>b.id===goal.motionId):null;return {...goal,center:boat?{...goal.center,x:boat.position.x,...(world.worldVersion===37?{z:boat.position.z}:{})}:{...goal.center}};});}
export function outdoorMotion(world,time=0){world=requireWorld(world);const boats=outdoorBoats(world,time),actors=outdoorActors(world,time),goals=outdoorGoals(world,time);const lamps=world.worldVersion===37?boats.flatMap(boat=>{
  const light=world.lighting[boat.kind],board=world.lighting.board,q=boat.position;
  return [{id:`${boat.id}-lamp`,position:p(q.x,1.25,q.z+boat.depth/2+.14),...light},{id:`${boat.id}-board-lamp`,position:p(q.x,1.25,q.z-boat.depth/2-.14),...board}];
}):boats.map((boat,index)=>({id:`${boat.id}-lamp`,position:p(boat.position.x,Math.max(1.25,boat.position.y+boat.height+.16),boat.position.z-boat.depth/2-.14),radius:index?3.1:7.1,intensity:index?1:2,color:index?'#efc875':'#f8dca2'}));return {actors,boats,lamps,goals};}
export function outdoorDynamicSolids(world,time=0){world=requireWorld(world);const actors=outdoorActors(world,time),solids=world.worldVersion===30?actors.flatMap(a=>a.contactParts):actors.map(actor=>box(`${actor.id}-body`,actor.id,'person',p(actor.position.x-actor.width/2,actor.position.y,actor.position.z-actor.depth/2),p(actor.position.x+actor.width/2,actor.position.y+actor.height,actor.position.z+actor.depth/2),'person',0,{blocking:true}));
  for(const boat of outdoorBoats(world,time)){
    const q=boat.position;
    if(world.worldVersion===35||world.worldVersion===37){
      boat.hullSections.forEach(([from,to,halfDepth],index)=>solids.push(box(`${boat.id}-hull-${index+1}`,boat.id,'boat-hull',p(q.x+from,q.y,q.z-halfDepth),p(q.x+to,q.y+boat.height,q.z+halfDepth),'boat',.28)));
      if(boat.wheelhouse)solids.push(box(`${boat.id}-wheelhouse`,boat.id,'boat-wheelhouse',p(q.x+boat.wheelhouse.minX,boat.wheelhouse.minY,q.z-boat.wheelhouse.halfDepth),p(q.x+boat.wheelhouse.maxX,boat.wheelhouse.maxY,q.z+boat.wheelhouse.halfDepth),'boat',.28));
      if(boat.cabin)solids.push(box(`${boat.id}-cabin`,boat.id,'boat-cabin',p(q.x-boat.cabin.halfLength,boat.cabin.floorY,q.z-boat.cabin.halfDepth),p(q.x+boat.cabin.halfLength,boat.cabin.ridgeY,q.z+boat.cabin.halfDepth),'boat',.28));
    }else solids.push(box(`${boat.id}-hull`,boat.id,'boat-hull',p(q.x-boat.width/2,q.y,q.z-boat.depth/2),p(q.x+boat.width/2,q.y+boat.height,q.z+boat.depth/2),'boat',.28));
    if(boat.chimney){
      if(world.worldVersion===35||world.worldVersion===37){
        solids.push(box(`${boat.id}-chimney-body`,boat.id,'chimney',p(q.x-.27,.76,q.z-.27),p(q.x+.27,2.65,q.z+.27),'boat',.3));
        for(const [part,min,max] of [
          ['front',p(q.x-.27,2.65,q.z-.27),p(q.x+.27,2.92,q.z-.22)],
          ['back',p(q.x-.27,2.65,q.z+.22),p(q.x+.27,2.92,q.z+.27)],
          ['left',p(q.x-.27,2.65,q.z-.27),p(q.x-.22,2.92,q.z+.27)],
          ['right',p(q.x+.22,2.65,q.z-.27),p(q.x+.27,2.92,q.z+.27)],
        ])solids.push(box(`${boat.id}-chimney-rim-${part}`,boat.id,'chimney-rim',min,max,'rim',.35));
      }else solids.push(box(`${boat.id}-chimney-body`,boat.id,'chimney',p(q.x-.43,.7,q.z-.43),p(q.x+.43,2.22,q.z+.43),'boat',.3));
    }
  }return solids;
}
