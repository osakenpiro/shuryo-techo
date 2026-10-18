// Chapter 5 uses the same metre-space solids and oriented goal contracts as
// the outdoor chapter. Motion is a deterministic 12-second shared clock.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const p=(x,y,z)=>({x,y,z});
const box=(id,object,kind,min,max,surface='furniture',restitution=.28,extra={})=>({id,object,kind,min,max,surface,restitution,...extra});
const top=(id,kind,center,radius,extra={})=>({id,role:'normal',kind,label:extra.label??id,shape:'circle',center,normal:p(0,1,0),up:p(0,0,1),radius,...extra});
const front=(id,kind,center,radius,extra={})=>({id,role:'normal',kind,label:extra.label??id,shape:'circle',center,normal:p(0,0,-1),up:p(0,1,0),radius,...extra});
const rectangle=(id,kind,center,halfWidth,halfHeight,extra={})=>({id,role:'normal',kind,label:extra.label??id,shape:'rectangle',center,normal:p(0,0,-1),up:p(0,1,0),halfWidth,halfHeight,...extra});
export const ECCENTRIC_ENVIRONMENT_PERIOD=12;
export function eccentricStartTime(time=0){if(!Number.isFinite(time))throw new TypeError('Eccentric time must be finite');return ((time%12)+12)%12;}
export const ECCENTRIC_PHYSICS_WORLDS=freeze({
  53:{worldVersion:53,origin:p(0,1.45,0),bin:{center:p(0,.425,15.5),radius:.42,height:.85},launchScale:1.5},
  48:{worldVersion:48,origin:p(0,1.45,0),bin:{center:p(0,.425,7.5),radius:.42,height:.85}},
  49:{worldVersion:49,origin:p(0,1.7,0),bin:{center:p(0,1.525,6),radius:.225,height:3.05},launchScale:2.2},
  50:{worldVersion:50,origin:p(0,3.5,0),bin:{center:p(1,.3,5.8),radius:.65,height:.6},launchLimits:{minPower:.1,maxPower:14,minElevation:-60,maxElevation:85}},
  51:{worldVersion:51,origin:p(0,1.4,0),bin:{center:p(0,.8,6.6),radius:.48,height:1.6}},
  52:{worldVersion:52,origin:p(0,1.15,0),bin:{center:p(0,1.8,18),radius:1.2,height:3.6},launchScale:4},

  19:{worldVersion:19,origin:p(0,18.5,0),bin:{center:p(0,.5,9.5),radius:.7,height:1},launchLimits:{minPower:.1,maxPower:14,minElevation:-80,maxElevation:85}},
  20:{worldVersion:20,origin:p(0,3.2,0),bin:{center:p(0,.55,9.5),radius:.72,height:1.1},launchLimits:{minPower:.1,maxPower:14,minElevation:-60,maxElevation:85}},
  21:{worldVersion:21,origin:p(0,1.45,0),bin:{center:p(0,.425,6.5),radius:.66,height:.85}},
  22:{worldVersion:22,origin:p(0,1.7,0),bin:{center:p(0,1.525,6),radius:.4,height:3.05},launchScale:2.2},
  23:{worldVersion:23,origin:p(0,3.5,0),bin:{center:p(1,.3,4.3),radius:1.2,height:.6},launchLimits:{minPower:.1,maxPower:14,minElevation:-60,maxElevation:85}},
  24:{worldVersion:24,origin:p(0,1.4,0),bin:{center:p(0,.8,5.4),radius:.7,height:1.6}},
  25:{worldVersion:25,origin:p(0,1.15,0),bin:{center:p(0,1.8,15),radius:1.8,height:3.6},launchScale:4},
  38:{worldVersion:38,origin:p(0,251.5,0),bin:{center:p(0,.5,35),radius:.7,height:1},launchLimits:{minPower:.1,maxPower:14,minElevation:-80,maxElevation:85}},
  39:{worldVersion:39,origin:p(0,2.05,1),bin:{center:p(0,1.125,4),radius:.42,height:1.5},launchLimits:{minPower:.1,maxPower:14,minElevation:-60,maxElevation:85}},
});
const make=(stageId,version,eccentricType,itemId,goals,solids,actors,launch,view,extra={})=>({stageId,worldVersion:version,environment:'eccentric',eccentricType,itemId,
  physics:ECCENTRIC_PHYSICS_WORLDS[version],origin:ECCENTRIC_PHYSICS_WORLDS[version].origin,bin:ECCENTRIC_PHYSICS_WORLDS[version].bin,
  goals,solids,actors,launch,view,room:{minX:-10,maxX:10,minZ:-4,maxZ:22,height:28,openSky:true},...extra});
const binSolids=(id,center,radius,height)=>[
  box(`${id}-body`,id,'bin-body',p(center.x-radius,0,center.z-radius),p(center.x+radius,height-.22,center.z+radius)),
  box(`${id}-left`,id,'bin-rim',p(center.x-radius-.1,height-.22,center.z-radius-.1),p(center.x-radius,height+.08,center.z+radius+.1),'rim',.35),
  box(`${id}-right`,id,'bin-rim',p(center.x+radius,height-.22,center.z-radius-.1),p(center.x+radius+.1,height+.08,center.z+radius+.1),'rim',.35),
  box(`${id}-front`,id,'bin-rim',p(center.x-radius,height-.22,center.z-radius-.1),p(center.x+radius,height+.08,center.z-radius),'rim',.35),
  box(`${id}-back`,id,'bin-rim',p(center.x-radius,height-.22,center.z+radius),p(center.x+radius,height+.08,center.z+radius+.1),'rim',.35),
];
const hoopSolids=[];
for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,x=.43*Math.cos(angle),z=6+.43*Math.sin(angle);
  hoopSolids.push(box(`basket-rim-${i}`, 'basket-hoop','hoop-rim',p(x-.04,3.01,z-.04),p(x+.04,3.09,z+.04),'rim',.65));
}
export const ECCENTRIC_LEGACY_WORLDS=freeze({
  'eccentric-tower':make('eccentric-tower',19,'tower','can',[top('tower-street-bin','bin',p(0,1,9.5),.7,{label:'タワーの下のごみ箱'})],
    [...binSolids('tower-street-bin',p(0,0,9.5),.7,1),box('tower-platform','tower','platform',p(-2.5,16.85,-3),p(2.5,17.05,-.55)),box('tower-left-railing','tower','rail',p(-2.5,17.05,-.65),p(-.65,18,-.55),'rail',.3),box('tower-right-railing','tower','rail',p(.65,17.05,-.65),p(2.5,18,-.55),'rail',.3)],[],
    {power:4.95,elevation:5,yaw:0},{target:p(0,8,4.8),distance:38,azimuth:.22,elevation:.35}, {landmark:{kind:'tokyo-tower',height:23},wind:p(.01,0,0)}),
  'eccentric-train':make('eccentric-train',20,'train','can',[top('train-platform-bin','bin',p(0,1.1,9.5),.72,{label:'線路脇のごみ箱'})],
    binSolids('train-platform-bin',p(0,0,9.5),.72,1.1),[],{power:8.8,elevation:42,yaw:-14},{target:p(0,1.8,4.8),distance:20,azimuth:.28,elevation:.45}, {train:{kind:'train',width:8,height:2.55,depth:1.6}}),
  'eccentric-boar':make('eccentric-boar',21,'boar','arrow',[front('forest-boar-target','boar',p(0,.85,6.5),.66,{label:'森のイノシシ',mode:'hit',motionId:'forest-boar'})],
    [box('forest-left-trunk','forest-left-tree','tree',p(-2.65,0,3),p(-2.3,4,3.35)),box('forest-right-trunk','forest-right-tree','tree',p(2.3,0,4.1),p(2.65,4,4.45))],
    [{id:'forest-boar',kind:'boar',position:p(0,.1,6.8),height:1.45,width:1.32,depth:1.1,color:'#80684e'}],{power:8.5,elevation:22,yaw:8},{target:p(0,1.1,3.6),distance:14,azimuth:.2,elevation:.4}),
  'eccentric-basket':make('eccentric-basket',22,'basket','basketball',[top('basket-ring','basket-ring',p(0,3.05,6),.4,{label:'バスケットゴール'})],
    [...hoopSolids,box('basket-backboard','basket-backboard','backboard',p(-.95,2.9,6.5),p(.95,4.1,6.64),'wall',.65),box('basket-post','basket-post','post',p(-.1,0,6.9),p(.1,3.65,7.1))],[],
    {power:9,elevation:52,yaw:0},{target:p(0,1.6,3.4),distance:15,azimuth:.2,elevation:.4}),
  'eccentric-dandelion':make('eccentric-dandelion',23,'dandelion','dandelion',[{id:'garden-flowerbed',role:'normal',kind:'flowerbed',label:'風の先の花壇',shape:'rectangle',center:p(1,.6,4.3),normal:p(0,1,0),up:p(0,0,1),halfWidth:1.2,halfHeight:.85}],
    [box('garden-flowerbed-soil','garden-flowerbed','soil',p(-.3,.05,3.35),p(2.3,.35,5.25),'soil',0),box('garden-flowerbed-left','garden-flowerbed','planter',p(-.42,0,3.22),p(-.3,.48,5.38)),box('garden-flowerbed-right','garden-flowerbed','planter',p(2.3,0,3.22),p(2.42,.48,5.38)),box('garden-flowerbed-front','garden-flowerbed','planter',p(-.3,0,3.22),p(2.3,.48,3.35)),box('garden-flowerbed-back','garden-flowerbed','planter',p(-.3,0,5.25),p(2.3,.48,5.38))],[],
    {power:1.6,elevation:30,yaw:0},{target:p(.5,1.8,2.3),distance:12,azimuth:.25,elevation:.4},{wind:p(.055,.02,.25)}),
  'eccentric-card':make('eccentric-card',24,'card','playing-card',[rectangle('card-cork-target','card-target',p(0,1.6,5.4),.72,.78,{label:'トランプを刺す的',mode:'hit'})],
    [box('card-target-board','card-target','target-board',p(-.88,.7,5.48),p(.88,2.5,5.6),'wall',.2),box('card-target-base','card-target','stand',p(-.12,0,5.6),p(.12,1.6,5.77))],[],
    {power:8,elevation:22,yaw:0},{target:p(0,1.2,3),distance:13,azimuth:.2,elevation:.4}),
  'eccentric-cannon':make('eccentric-cannon',25,'cannon','cannonball',[rectangle('fort-door-target','fort-door',p(0,2.1,15),1.55,1.95,{label:'砦の扉',mode:'hit'})],
    [box('fort-door','fort-door','door',p(-1.8,0,15.2),p(1.8,4.2,15.4),'wall',.2),box('fort-wall-left','fort-wall','wall',p(-8,0,15.1),p(-1.8,6,15.55),'wall',.3),box('fort-wall-right','fort-wall','wall',p(1.8,0,15.1),p(8,6,15.55),'wall',.3),box('fort-wall-top','fort-wall','wall',p(-1.8,4.2,15.1),p(1.8,6,15.55),'wall',.3)],[],
    {power:10,elevation:36,yaw:0},{target:p(0,2.5,7.5),distance:30,azimuth:.2,elevation:.4},{cannon:{position:p(0,.5,-.5),barrelLength:1.25}}),
});
// Real-size landmark and carriage parameters are consumed by physics and drawing.
export const TOKYO_TOWER_PROPS=freeze({height:333,center:p(0,0,-10),decks:{main:{height:150,width:28,depth:28,bodyHeight:8},top:{height:250,width:12,depth:12,bodyHeight:6}},profile:[[0,39],[80,18],[150,11.5],[225,5],[250,4],[285,2.2],[333,.1]]});
export const TRAIN_WINDOW_PROPS=freeze({carLength:21.6,carWidth:2.8,bodyBottom:.55,bodyTop:3.8,floorY:.75,nearTrackZ:0,farTrackZ:4.2,wallThickness:.10,window:{centers:[-8,-3.4,0,3.4,8],halfWidth:.90,bottomY:1.45,topY:2.65},doorCenters:[-6,6],ownSpeed:18,adjacentSpeed:20,carSpacing:24,carIndices:[0,-1,1,-2,2],trackGauge:1.435,tieSpacing:1.5,poleSpacing:36,bin:{center:p(0,1.125,4),radius:.42,mouthY:1.5,bottomY:.75}});
const towerWorld=make('eccentric-tower',38,'tower','can',[top('tower-street-bin','bin',p(0,1,35),.7,{label:'タワーの下のごみ箱'})],
 [...binSolids('tower-street-bin',p(0,0,35),.7,1),box('tower-main-deck-floor','tower-main-deck','deck-floor',p(-14,145.824,-24),p(14,146.08,4),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-main-deck-roof','tower-main-deck','deck-roof',p(-14,153.024,-24),p(14,153.264,4),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-main-deck-front','tower-main-deck','deck-wall',p(-14,146.08,3.86),p(14,153.024,4),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-main-deck-back','tower-main-deck','deck-wall',p(-14,146.08,-24),p(14,153.024,-23.86),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-main-deck-left','tower-main-deck','deck-wall',p(-14,146.08,-23.86),p(-13.86,153.024,3.86),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-main-deck-right','tower-main-deck','deck-wall',p(13.86,146.08,-23.86),p(14,153.024,3.86),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-foot-town-building','tower-foot-town','building',p(-26,0,-36),p(26,15.2,16),'building',.24,{renderedBy:'tokyo-tower-scene'}),box('tower-top-deck-floor','tower','platform',p(-6,249.8,-16),p(6,250,-4)),box('tower-launch-ledge','tower','platform',p(-2.5,249.8,-5),p(2.5,250,-.28)),box('tower-ledge-left-railing','tower','rail',p(-2.5,250,-.38),p(-.7,251.1,-.28),'rail',.3),box('tower-ledge-right-railing','tower','rail',p(.7,250,-.38),p(2.5,251.1,-.28),'rail',.3)],[],
 {power:4.9,elevation:5,yaw:0},{target:p(0,251,.5),distance:3,azimuth:0,elevation:1.3},{landmark:{kind:'tokyo-tower',...TOKYO_TOWER_PROPS},room:{minX:-65,maxX:65,minZ:-70,maxZ:85,height:345,openSky:true},wind:p(.012,0,0)});
const trainWorld=make('eccentric-train',39,'train','can',TRAIN_WINDOW_PROPS.carIndices.map(index=>top(`train-carriage-bin-${index}`,'bin',p(index*TRAIN_WINDOW_PROPS.carSpacing,1.5,4),.42,{label:'隣の電車のごみ箱',motionId:`adjacent-carriage-${index}`})),[],[],
 {power:7.2,elevation:8,yaw:15},{target:p(0,1.48,2.65),distance:3.7,azimuth:.02,elevation:.15},{train:{kind:'parallel-window',props:TRAIN_WINDOW_PROPS},room:{minX:-35,maxX:35,minZ:-8,maxZ:13,height:8,openSky:true}});
export const ECCENTRIC_RELEASED_WORLDS=freeze({...ECCENTRIC_LEGACY_WORLDS,'eccentric-tower':towerWorld,'eccentric-train':trainWorld});

const reviewTree=(id,x,z,r=.22,h=5)=>box(id,id,'tree',p(x-r,0,z-r),p(x+r,h,z+r),'wood',.24);
const woodland=make('eccentric-boar',48,'boar','arrow',[front('forest-boar-target','boar',p(0,.52,7.5),.36,{label:'森を歩くイノシシ',mode:'hit',motionId:'forest-boar'})],
  [reviewTree('forest-left-trunk',-.8,4,.23),reviewTree('forest-right-trunk',1.2,5.6,.26),reviewTree('forest-rear-left',-2.8,6.4,.3),reviewTree('forest-rear-right',3.3,8.2,.28),reviewTree('forest-deep-trunk',.3,11.2,.35)],
  [{id:'forest-boar',kind:'boar',position:p(-1.4,0,6.8),height:.95,width:.68,depth:1.45,color:'#80684e'}],{power:7.25,elevation:38,yaw:0},{target:p(0,1,6.8),distance:14,azimuth:.2,elevation:.35},
  {room:{minX:-8,maxX:8,minZ:-3,maxZ:14,height:9,openSky:true},woodland:{path:[{t:0,x:-1.4,z:6.8},{t:2.1,x:1.5,z:7.4},{t:2.7,x:1.5,z:7.4},{t:4.2,x:2.5,z:9},{t:6.7,x:-1.8,z:9.8},{t:7.5,x:-1.8,z:9.8},{t:9.3,x:-2.4,z:7.8},{t:12,x:-1.4,z:6.8}],body:{length:1.45,width:.68,height:.95},targetOffset:p(0,.52,-.1)}});
const gymRim=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,x=.245*Math.cos(a),z=6+.245*Math.sin(a);gymRim.push(box('basket-rim-'+i,'basket-hoop','hoop-rim',p(x-.022,3.028,z-.022),p(x+.022,3.072,z+.022),'rim',.65));}
const gym=make('eccentric-basket',49,'basket','basketball',[top('basket-ring','basket-ring',p(0,3.05,6),.225,{label:'体育館のバスケットゴール'})],
 [...gymRim,box('basket-backboard','basket-backboard','backboard',p(-.9,2.9,6.376),p(.9,3.95,6.416),'wall',.65),box('basket-post','basket-post','post',p(-.09,0,7),p(.09,3.7,7.18)),box('basket-support-arm','basket-post','post',p(-.09,3.53,6.416),p(.09,3.7,7.18)),
 box('gym-left-wall','gym','gym-wall',p(-8.2,0,-21.7),p(-8,9,8.7),'wall',.4),box('gym-right-wall','gym','gym-wall',p(8,0,-21.7),p(8.2,9,8.7),'wall',.4),box('gym-front-wall','gym','gym-wall',p(-8,0,-21.7),p(8,9,-21.5),'wall',.4),box('gym-back-wall','gym','gym-wall',p(-8,0,8.5),p(8,9,8.7),'wall',.4),box('gym-ceiling','gym','gym-ceiling',p(-8.2,9,-21.7),p(8.2,9.2,8.7),'ceiling',.35),...[-18.7,-12.9,-7.1,-1.3,4.5].flatMap((z,i)=>[-4.2,4.2].map((x,j)=>box('gym-lamp-'+i+'-'+j,'gym-light','gym-lamp',p(x-.68,7.94,z-.19),p(x+.68,8.06,z+.19),'ceiling',.3)))],[],
 {power:9.25,elevation:59,yaw:0},{target:p(0,2.3,5),distance:18,azimuth:.28,elevation:.3},{room:{minX:-8,maxX:8,minZ:-21.5,maxZ:8.5,height:9,openSky:false},gym:{court:{minX:-7.5,maxX:7.5,minZ:-20.425,maxZ:7.575},ringHeight:3.05,ringRadius:.225}});
const windowFrame=(prefix,z,lo,hi,bottom,topY,width=4,height=5)=>[
 box(prefix+'-left',prefix,'aperture-frame',p(-width,0,z),p(lo,height,z+.16),'wall',.24),box(prefix+'-right',prefix,'aperture-frame',p(hi,0,z),p(width,height,z+.16),'wall',.24),
 box(prefix+'-lintel',prefix,'aperture-frame',p(lo,topY,z),p(hi,height,z+.16),'wall',.24),box(prefix+'-sill',prefix,'aperture-frame',p(lo,0,z),p(hi,bottom,z+.16),'wall',.24)];
const garden=make('eccentric-dandelion',50,'dandelion','dandelion',[{id:'garden-flowerbed',role:'normal',kind:'flowerbed',label:'格子の先の花壇',shape:'rectangle',center:p(1,.6,5.8),normal:p(0,1,0),up:p(0,0,1),halfWidth:.65,halfHeight:.55}],
 [...windowFrame('garden-trellis',3,-.1,1.5,.8,2.8,4,4.5),box('garden-flowerbed-soil','garden-flowerbed','soil',p(.25,.05,5.15),p(1.75,.35,6.45),'soil',0),box('garden-planter-left','garden-flowerbed','planter',p(.15,0,5.05),p(.25,.55,6.55)),box('garden-planter-right','garden-flowerbed','planter',p(1.75,0,5.05),p(1.85,.55,6.55)),box('garden-planter-front','garden-flowerbed','planter',p(.25,0,5.05),p(1.75,.55,5.15)),box('garden-planter-back','garden-flowerbed','planter',p(.25,0,6.45),p(1.75,.55,6.55))],[],
 {power:3,elevation:20,yaw:0},{target:p(.5,1.7,3.1),distance:13,azimuth:.28,elevation:.35},{wind:p(.055,.02,.25),garden:{aperture:{min:p(-.1,.8,3),max:p(1.5,2.8,3.16)}}});
const parlor=make('eccentric-card',51,'card','playing-card',[rectangle('card-cork-target','card-target',p(0,1.6,6.6),.48,.55,{label:'枠の先のコルク標的',mode:'hit'})],
 [...windowFrame('card-display-frame',3,-.48,.48,1,2.25,3.5,3.4),box('card-target-board','card-target','target-board',p(-.65,.85,6.68),p(.65,2.35,6.8),'wall',.2),box('card-target-base','card-target','stand',p(-.12,0,6.8),p(.12,1.6,6.95)),box('parlor-table','parlor-table','table',p(-1.3,0,1.3),p(1.3,.85,2.6)),box('parlor-cabinet','parlor-cabinet','cabinet',p(1.6,0,4.2),p(2.5,2.5,5.4)),box('parlor-left-wall','parlor','room-wall',p(-4.6,0,-3),p(-4.5,4.2,8.2),'wall',.25),box('parlor-right-wall','parlor','room-wall',p(4.5,0,-3),p(4.6,4.2,8.2),'wall',.25),box('parlor-back-wall','parlor','room-wall',p(-4.5,0,8),p(4.5,4.2,8.2),'wall',.25),box('parlor-ceiling','parlor','room-ceiling',p(-4.6,4.2,-3),p(4.6,4.35,8.2),'ceiling',.25)],[],
 {power:10,elevation:20,yaw:0},{target:p(0,1.5,3.5),distance:12,azimuth:.08,elevation:.17},{room:{minX:-4,maxX:4,minZ:-3,maxZ:8,height:3.6,openSky:false},parlor:{aperture:{min:p(-.48,1,3),max:p(.48,2.25,3.16)}}});
const fortress=make('eccentric-cannon',52,'cannon','cannonball',[rectangle('fort-door-target','fort-door',p(0,2.1,18),1.2,1.65,{label:'防塁の向こうの砦の扉',mode:'hit'})],
 [box('fort-moat-water','fort-moat','moat-water',p(-9,-1.5,6),p(9,0,11),'water',0,{blocking:true}),box('fort-door','fort-door','door',p(-1.5,0,18.2),p(1.5,4.2,18.4),'wall',.2),box('fort-wall-left','fort-wall','wall',p(-8,0,18.1),p(-1.5,7,18.55),'wall',.3),box('fort-wall-right','fort-wall','wall',p(1.5,0,18.1),p(8,7,18.55),'wall',.3),box('fort-wall-top','fort-wall','wall',p(-1.5,4.2,18.1),p(1.5,7,18.55),'wall',.3),box('fort-forward-rampart','fort-rampart','rampart',p(-8,0,9.8),p(8,2.8,10.5),'wall',.2),...[-9,9].flatMap((x,i)=>[box('fort-tower-'+i+'-mid','fort-tower-'+i,'tower-masonry',p(x-1,0,17.9),p(x+1,8,19.1),'wall',.3),box('fort-tower-'+i+'-front','fort-tower-'+i,'tower-masonry',p(x-.6,0,17.5),p(x+.6,8,17.9),'wall',.3),box('fort-tower-'+i+'-back','fort-tower-'+i,'tower-masonry',p(x-.6,0,19.1),p(x+.6,8,19.5),'wall',.3)]),...Array.from({length:10},(_,i)=>{const x=-7.4+i*1.5;return box('fort-merlon-'+i,'fort-wall','battlement',p(x,7,18.1),p(x+.65,7.65,18.55),'wall',.3);}),...[-9,9].flatMap((x,i)=>[-.65,.2].map((dx,j)=>box('fort-tower-merlon-'+i+'-'+j,'fort-tower-'+i,'battlement',p(x+dx,8,17.55),p(x+dx+.45,8.6,17.95),'wall',.3)))],[],
 {power:11,elevation:38,yaw:0},{target:p(0,3,10),distance:33,azimuth:.2,elevation:.35},{cannon:{position:p(0,.5,-.5),barrelLength:1.25},fortress:{moat:{min:p(-9,-1.5,6),max:p(9,0,11)},rampartHeight:2.8}});
export const ECCENTRIC_REVIEWED_WORLDS=freeze({...ECCENTRIC_RELEASED_WORLDS,'eccentric-boar':woodland,'eccentric-basket':gym,'eccentric-dandelion':garden,'eccentric-card':parlor,'eccentric-cannon':fortress});
const distantWoodland=(()=>{const old=woodland,physics=ECCENTRIC_PHYSICS_WORLDS[53],shift=q=>({...q,z:q.z+8});return {...old,worldVersion:53,physics,origin:physics.origin,bin:physics.bin,
 goals:old.goals.map(g=>({...g,center:shift(g.center)})),solids:old.solids.map(s=>({...s,min:shift(s.min),max:shift(s.max)})),actors:old.actors.map(a=>({...a,position:shift(a.position)})),
 woodland:{...old.woodland,path:old.woodland.path.map(shift)},launch:{power:9,elevation:20,yaw:0},view:{target:p(0,1,8.2),distance:24,azimuth:.16,elevation:.27},room:{...old.room,maxZ:24}};})();
export const ECCENTRIC_WORLDS=freeze({...ECCENTRIC_REVIEWED_WORLDS,'eccentric-boar':distantWoodland});
const ECCENTRIC_BY_VERSION=freeze(Object.fromEntries([...Object.values(ECCENTRIC_LEGACY_WORLDS),...Object.values(ECCENTRIC_RELEASED_WORLDS),...Object.values(ECCENTRIC_REVIEWED_WORLDS),...Object.values(ECCENTRIC_WORLDS)].map(w=>[w.worldVersion,w])));

export function eccentricWorld(stageId,worldVersion){const world=worldVersion===undefined?ECCENTRIC_WORLDS[stageId]:ECCENTRIC_BY_VERSION[worldVersion];return world?.stageId===stageId?world:null;}
export function eccentricWorldByVersion(version){return Number.isInteger(version)&&Object.hasOwn(ECCENTRIC_BY_VERSION,version)?ECCENTRIC_BY_VERSION[version]:null;}
function requireWorld(world){const saved=eccentricWorld(world?.stageId,world?.worldVersion);if(!saved)throw new RangeError('A supported eccentric world is required');return saved;}
export function eccentricSolids(world){return requireWorld(world).solids;}
export function eccentricLaunchFrame(world,time=0){world=requireWorld(world);time=eccentricStartTime(time);if(world.worldVersion===39)return {origin:{...world.origin},velocity:p(0,0,0),orientation:p(0,0,0),environmentTime:time};const phase=time*Math.PI/6;
  return {origin:{...world.origin,...(world.eccentricType==='train'?{x:3*Math.sin(phase)}:{})},velocity:p(world.eccentricType==='train'?Math.PI/2*Math.cos(phase):0,0,0),orientation:p(0,0,0),environmentTime:time};}
export function woodlandPose(world,time=0){world=requireWorld(world);if(![48,53].includes(world.worldVersion))return null;time=eccentricStartTime(time);const path=world.woodland.path;let i=0;while(i<path.length-2&&time>=path[i+1].t)i++;const a=path[i],b=path[i+1],u=(time-a.t)/(b.t-a.t),s=u*u*(3-2*u),dx=b.x-a.x,dz=b.z-a.z;
 const anchors=path.slice(1).map((q,j)=>({t:(q.t+path[j].t)/2,dx:q.x-path[j].x,dz:q.z-path[j].z})).filter(q=>Math.hypot(q.dx,q.dz)>1e-8).map(q=>({...q,h:Math.atan2(q.dx,q.dz)}));
 let hi=anchors.findIndex(q=>q.t>time);if(hi<0)hi=0;const next=anchors[hi],prev=anchors[(hi+anchors.length-1)%anchors.length],pt=prev.t>time?prev.t-12:prev.t,nt=next.t<=time?next.t+12:next.t,v=(time-pt)/(nt-pt),blend=v*v*(3-2*v),turn=Math.atan2(Math.sin(next.h-prev.h),Math.cos(next.h-prev.h)),heading=prev.h+turn*blend;
 return {position:p(a.x+dx*s,0,a.z+dz*s),heading,gaitSpeed:Math.hypot(dx,dz)*6*u*(1-u)/(b.t-a.t),gaitPhase:time*8};}
export function eccentricActors(world,time=0){world=requireWorld(world);time=eccentricStartTime(time);if([48,53].includes(world.worldVersion)){const pose=woodlandPose(world,time);return world.actors.map(a=>({...a,...pose,position:{...pose.position}}));}return world.actors.map(actor=>({...actor,position:{...actor.position,...(actor.id==='forest-boar'?{x:2.2*Math.sin(time*Math.PI/6)}:{})}}));}
export function eccentricGoals(world,time=0){world=requireWorld(world);const actors=eccentricActors(world,time);if([48,53].includes(world.worldVersion)){const a=actors[0],h=a.heading,offset=world.woodland.targetOffset;return world.goals.map(g=>({...g,center:p(a.position.x+offset.z*Math.sin(h),a.position.y+offset.y,a.position.z+offset.z*Math.cos(h)),normal:p(-Math.sin(h),0,-Math.cos(h)),up:p(0,1,0)}));}return world.goals.map(goal=>({...goal,center:{...goal.center,...(world.worldVersion===39?{x:trainWindowMotion(world,time).adjacentTrains.find(car=>car.id===goal.motionId).position.x}:goal.motionId?{x:actors.find(a=>a.id===goal.motionId).position.x}:{})}}));}
export function eccentricDynamicSolids(world,time=0){world=requireWorld(world);const result=[];
  if(world.worldVersion===39)return trainWindowSolids(world,time);
  if(world.eccentricType==='train'){const frame=eccentricLaunchFrame(world,time),x=frame.origin.x;result.push(box('train-roof','train','train-roof',p(x-4,.15,-.8),p(x+4,2.7,.8),'train',.25));}
  if([48,53].includes(world.worldVersion))return result;
  if(world.eccentricType==='boar'){const boar=eccentricActors(world,time)[0],x=boar.position.x;result.push(box('forest-boar-body','forest-boar','boar',p(x-.66,.1,6.62),p(x+.66,1.55,7.5),'target',.2));}
  return result;
}
export function eccentricMotion(world,time=0){world=requireWorld(world);const rawTime=time;time=eccentricStartTime(time);const launchFrame=eccentricLaunchFrame(world,time);return {actors:eccentricActors(world,time),goals:eccentricGoals(world,world.worldVersion===39?rawTime:time),launchFrame,...(world.worldVersion===39?{trainWindow:trainWindowMotion(world,rawTime)}:{}),
  train:world.worldVersion===39?null:world.eccentricType==='train'?{id:'roof-train',kind:'train',position:p(launchFrame.origin.x,1.425,0),width:8,height:2.55,depth:1.6}:null,wind:world.wind?{...world.wind}:p(0,0,0)};}

// An inertial player frame travels forward at 18 m/s. The adjacent train
// travels at 20 m/s: its windows, bin and colliders drift +2 m/s together.
// Raw within-shot time never wraps, including throws across phase 12. At
// ready reset the repeated 24-metre carriage pattern is geometrically equal.
export function trainWindowMotion(world,time=0){world=requireWorld(world);if(world.worldVersion!==39)return null;if(!Number.isFinite(time))throw new TypeError('Train time must be finite');const props=TRAIN_WINDOW_PROPS,relative=props.adjacentSpeed-props.ownSpeed;
 const car=(id,x,z,speed)=>({id,kind:'train-carriage',position:p(x,(props.bodyBottom+props.bodyTop)/2,z),width:props.carLength,depth:props.carWidth,height:props.bodyTop-props.bodyBottom,velocity:p(speed-props.ownSpeed,0,0),worldVelocity:p(speed,0,0)}),adjacentTrains=props.carIndices.map(index=>car(`adjacent-carriage-${index}`,index*props.carSpacing+relative*time,props.farTrackZ,props.adjacentSpeed));
 return {ownTrain:car('own-carriage',0,props.nearTrackZ,props.ownSpeed),adjacentTrain:adjacentTrains.find(car=>car.id==='adjacent-carriage-0'),adjacentTrains,trackOffset:((time*props.ownSpeed)%props.tieSpacing+props.tieSpacing)%props.tieSpacing,sceneryOffset:((time*props.ownSpeed)%props.poleSpacing+props.poleSpacing)%props.poleSpacing,groundVelocity:p(-props.ownSpeed,0,0),trackGauge:props.trackGauge,windowOpenings:props.window.centers.map(x=>({x,halfWidth:props.window.halfWidth,bottomY:props.window.bottomY,topY:props.window.topY})),props,geometry:props};
}
export function trainWindowSolids(world,time=0){world=requireWorld(world);if(world.worldVersion!==39)return [];const props=TRAIN_WINDOW_PROPS,motion=trainWindowMotion(world,time),solids=[];
 for(const car of [motion.ownTrain,...motion.adjacentTrains]){const {x,z}=car.position,half=props.carLength/2,depth=props.carWidth/2,w=props.wallThickness,id=car.id;
  solids.push(box(`${id}-floor`,id,'train-floor',p(x-half,props.floorY-w,z-depth),p(x+half,props.floorY,z+depth),'train',.25),box(`${id}-roof`,id,'train-roof',p(x-half,props.bodyTop-w,z-depth),p(x+half,props.bodyTop,z+depth),'train',.25),box(`${id}-end-left`,id,'train-end',p(x-half,props.floorY,z-depth),p(x-half+w,props.bodyTop,z+depth),'train',.25),box(`${id}-end-right`,id,'train-end',p(x+half-w,props.floorY,z-depth),p(x+half,props.bodyTop,z+depth),'train',.25));
  for(const side of [-1,1])for(const localX of [-5,2.5]){const seatX=x+localX,seatZ=z+side*(depth-.38);solids.push(box(`${id}-seat-${side}-${localX}-pan`,id,'train-seat',p(seatX,props.floorY+.29,seatZ-.30),p(seatX+2.3,props.floorY+.45,seatZ+.30),'train',.2),box(`${id}-seat-${side}-${localX}-back`,id,'train-seat',p(seatX,props.floorY+.44,seatZ+side*.32-.04),p(seatX+2.3,props.floorY+1.04,seatZ+side*.32+.04),'train',.2));}
  for(const [side,sideZ]of [['near',z-depth],['far',z+depth-w]]){solids.push(box(`${id}-${side}-lower`,id,'train-body',p(x-half,props.floorY,sideZ),p(x+half,props.window.bottomY,sideZ+w),'train',.25),box(`${id}-${side}-upper`,id,'train-body',p(x-half,props.window.topY,sideZ),p(x+half,props.bodyTop-w,sideZ+w),'train',.25));let cursor=-half;
   for(const [index,center]of props.window.centers.entries()){solids.push(box(`${id}-${side}-pillar-${index}`,id,'window-pillar',p(x+cursor,props.window.bottomY,sideZ),p(x+center-props.window.halfWidth,props.window.topY,sideZ+w),'train',.3));cursor=center+props.window.halfWidth;}
   solids.push(box(`${id}-${side}-pillar-last`,id,'window-pillar',p(x+cursor,props.window.bottomY,sideZ),p(x+half,props.window.topY,sideZ+w),'train',.3));
  }
 }
 const bin=props.bin;for(const [index,car]of motion.adjacentTrains.entries())for(const solid of binSolids(`train-carriage-bin-${props.carIndices[index]}`,p(car.position.x,0,bin.center.z),bin.radius,bin.mouthY-bin.bottomY))solids.push({...solid,min:{...solid.min,y:solid.min.y+bin.bottomY},max:{...solid.max,y:solid.max.y+bin.bottomY}});
 return solids;
}

export function sweepWoodlandBoar(world,start,end,radius,time,dt=0){
 world=requireWorld(world);if(![48,53].includes(world.worldVersion))return null;const a=woodlandPose(world,time),b=woodlandPose(world,time+dt),h=woodlandPose(world,time+dt/2).heading,c=Math.cos(h),s=Math.sin(h),r={x:.34+radius,y:.43+radius,z:.725+radius};
 const local=(point,pose)=>{const x=point.x-pose.position.x,z=point.z-pose.position.z;return {x:x*c-z*s,y:point.y-.52,z:x*s+z*c};},u=local(start,a),v=local(end,b),d={x:v.x-u.x,y:v.y-u.y,z:v.z-u.z};
 const A=['x','y','z'].reduce((n,k)=>n+d[k]*d[k]/(r[k]*r[k]),0),B=2*['x','y','z'].reduce((n,k)=>n+u[k]*d[k]/(r[k]*r[k]),0),C=['x','y','z'].reduce((n,k)=>n+u[k]*u[k]/(r[k]*r[k]),0)-1,disc=B*B-4*A*C;
 if(A<1e-14||disc<0)return null;const t=C<=0?0:(-B-Math.sqrt(disc))/(2*A);if(t<0||t>1)return null;
 const q={x:u.x+d.x*t,y:u.y+d.y*t,z:u.z+d.z*t},n={x:q.x/(r.x*r.x),y:q.y/(r.y*r.y),z:q.z/(r.z*r.z)},length=Math.hypot(n.x,n.y,n.z),normal=p((n.x*c+n.z*s)/length,n.y/length,(-n.x*s+n.z*c)/length),position=p(start.x+(end.x-start.x)*t,start.y+(end.y-start.y)*t,start.z+(end.z-start.z)*t),g=eccentricGoals(world,time+dt*t)[0];
 return {time:t,position,goal:{...g,center:position,normal}};
}
export function forestBoarGeometry(world,time=0){world=requireWorld(world);if(![48,53].includes(world.worldVersion))return null;const pose=woodlandPose(world,time);return {center:p(pose.position.x,.52,pose.position.z),radii:p(.34,.43,.725),heading:pose.heading,pose};}
export function forestBoarPointMetric(world,point,radius,time=0){const g=forestBoarGeometry(world,time);if(!g)return null;const c=Math.cos(g.heading),s=Math.sin(g.heading),x=point.x-g.center.x,z=point.z-g.center.z,q=p(x*c-z*s,point.y-g.center.y,x*s+z*c),r=p(g.radii.x+radius,g.radii.y+radius,g.radii.z+radius);return {metric:(q.x/r.x)**2+(q.y/r.y)**2+(q.z/r.z)**2,local:q,radii:r,geometry:g};}
export function sweepForestBoarTarget(world,start,end,radius,startTime,endTime){return sweepWoodlandBoar(world,start,end,radius,startTime,endTime-startTime);}
