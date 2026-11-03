// Append-only Chapter 6/7 candidate worlds. Earlier world versions remain in
// their original registries. These layouts compose already-played mechanics.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const p=(x,y,z)=>({x,y,z});
const solid=(id,min,max,kind='furniture',extra={})=>({id,object:id,kind,surface:kind==='wall'?'wall':'furniture',min,max,restitution:.28,...extra});
const receiver=(id,x,z,height=.9,half=.55)=>({id,role:'normal',kind:'recycle-bin',label:'回収ボックス',shape:'rectangle',center:p(x,height,z),normal:p(0,1,0),up:p(0,0,1),halfWidth:half,halfHeight:half});
const physics=(worldVersion,origin,goal)=>({worldVersion,origin,bin:{center:p(goal.center.x,goal.center.y/2,goal.center.z),radius:goal.halfWidth??.55,height:goal.center.y}});
const make=(stageId,worldVersion,label,sceneTheme,itemId,origin,goal,solids,launch,extra={})=>{
 const setup=physics(worldVersion,origin,goal);
 return {stageId,worldVersion,label,environment:'release',sceneTheme,itemId,physics:setup,origin:setup.origin,bin:setup.bin,
  goals:[goal],solids:[...solids,...themeSolids(sceneTheme)],actors:[],launch,wind:p(0,0,0),
  room:{minX:-4.4,maxX:4.4,minZ:-1.6,maxZ:9.4,height:5,openSky:true},
  view:{target:p(0,1,3.5),distance:12,azimuth:.14,elevation:.5},...extra};
};
const desk=(id,x,z,width=1.8,depth=.8,top=.95)=>[
 solid(`${id}-top`,p(x-width/2,top-.1,z-depth/2),p(x+width/2,top,z+depth/2),'desk'),
 ...[-1,1].flatMap((a,i)=>[-1,1].map((b,j)=>solid(`${id}-leg-${i}-${j}`,p(x+a*(width/2-.12)-.055,0,z+b*(depth/2-.12)-.055),p(x+a*(width/2-.12)+.055,top-.1,z+b*(depth/2-.12)+.055),'desk-leg')))
];
const wall=(id,x1,z1,x2,z2,height=4)=>solid(id,p(x1,0,z1),p(x2,height,z2),'wall',{restitution:.38});
function themeSolids(theme){
 if(theme==='room')return [wall('remix-room-back-wall',-4.4,9,4.4,9.18,3.5),wall('remix-room-left-wall',-4.48,-1.6,-4.3,9,3.5),...desk('remix-room-source-desk',0,-.95,1.7,.8,.8),solid('remix-room-back-cabinet',p(2.7,0,7.8),p(3.8,1.45,8.5),'shelf')];
 if(theme==='school')return [wall('remix-school-back-wall',-4.4,9,4.4,9.18,3.7),wall('remix-school-left-wall',-4.48,-1.6,-4.3,9,3.7),...desk('remix-school-desk-far-left',-2.2,4.5,1.4,.7,.9),...desk('remix-school-desk-far-right',2.2,4.5,1.4,.7,.9),solid('remix-school-cabinet',p(3.4,0,7.7),p(4.1,1.7,8.5),'shelf')];
 if(theme==='outdoor')return [-1,1].flatMap((side,i)=>[solid(`remix-wind-tree-trunk-${i}`,p(side*3.7-.12,0,6.2),p(side*3.7+.12,1.8,6.45),'tree-trunk'),solid(`remix-wind-tree-canopy-${i}`,p(side*3.7-.55,1.8,5.8),p(side*3.7+.55,2.9,6.9),'tree-canopy')]);
 if(theme==='factory')return [wall('remix-machine-back-wall',-4.4,9,4.4,9.18,5),...[-1,1].flatMap((side,i)=>[solid(`remix-machine-column-${i}`,p(side*4.05-.12,0,2.4),p(side*4.05+.12,4.8,2.65),'machine-frame'),solid(`remix-machine-rear-column-${i}`,p(side*4.05-.12,0,7.7),p(side*4.05+.12,4.8,7.95),'machine-frame')]),solid('remix-machine-beam',p(-4.17,4.55,2.4),p(4.17,4.8,2.65),'machine-frame')];
 return [];
}
const g54=receiver('remix-room-bin',.65,5.3,.8,.5),g55=receiver('remix-school-bin',0,6.6,.85,.62),g56=receiver('remix-wind-bin',0,8.2,.85,.68),g57=receiver('remix-machine-bin',0,6.8,.9,.62),g58=receiver('extra-overlook-bin',2,6,.8,.55);
const g59={id:'extra-bank-slot',role:'normal',kind:'wall-slot',label:'壁の受け口',shape:'rectangle',center:p(0,1.2,6.3),normal:p(0,0,-1),up:p(0,1,0),halfWidth:.65,halfHeight:.65};
export const LEGACY_RELEASE_CHAPTER_WORLDS=freeze({
 'remix-room':make('remix-room',54,'6-1：机越しの横風','room','can',p(0,1.05,0),g54,
  [...desk('remix-room-desk',.2,2.6),solid('remix-room-shelf',p(-3.7,0,6.5),p(-2.8,2.4,7),'shelf')],
  {power:7.4,elevation:48,yaw:0},{wind:p(.42,0,0),sourceMechanics:['desk-over','room-extra'],hint:'机を越える弧と、右へ流す風をいっしょに読む。'}),
 'remix-school':make('remix-school',55,'6-2：教室の動く箱','school','can',p(0,1.3,0),g55,
  [...desk('remix-school-desk-left',-2.1,2.2,1.5,.75,.9),...desk('remix-school-desk-right',2.1,2.2,1.5,.75,.9),solid('remix-school-low-shelf',p(-.75,0,3),p(.75,1.25,3.6),'shelf')],
  {power:8.1,elevation:48,yaw:8},{goalMotion:{amplitude:1.25,period:8,phase:0},sourceMechanics:['school-classroom','outdoor-river'],hint:'箱は左右へ往復する。棚を越えて、到着する場所へ。'}),
 'remix-wind':make('remix-wind',56,'6-3：風の向こうを狙って','outdoor','can',p(0,1.25,0),g56,
  [solid('remix-wind-left-planter',p(-3.2,0,3.6),p(-1.5,.65,4.5),'planter'),solid('remix-wind-right-planter',p(1.5,0,3.6),p(3.2,.65,4.5),'planter')],
  {power:8.8,elevation:44,yaw:-10},{wind:p(.65,0,.06),goalMotion:{amplitude:1.35,period:10,phase:Math.PI},sourceMechanics:['outdoor-river','room-extra'],hint:'遠い箱も動く。風の分だけ、先回りを足したり引いたり。',view:{target:p(0,1.1,4.4),distance:15,azimuth:.1,elevation:.48}}),
 'remix-machine':make('remix-machine',57,'6-4：シャッターと横の道','factory','rubber-ball',p(0,1.3,0),g57,
  [wall('remix-machine-reflector',-3.4,.8,-3.25,7.8,4),solid('remix-machine-crate',p(2.2,0,2.8),p(3.3,1.1,4),'crate')],
  {power:8.3,elevation:42,yaw:0},{shutter:{id:'remix-machine-shutter',min:p(-1.8,0,3.5),max:p(1.8,3.5,3.7),lift:3.8,period:8},sourceMechanics:['factory-shutter','factory-bank'],hint:'開く瞬間を待つか、横の壁を使うか。道はひとつではない。'}),
 'extra-overlook':make('extra-overlook',58,'7-1：上から見つける一投','extra','can',p(0,1.15,0),g58,
  [wall('extra-overlook-divider',-.9,2.4,.9,2.6,1.55),solid('extra-overlook-step',p(-2.8,0,4.4),p(-1.2,.65,5.3),'step')],
  {power:7.5,elevation:48,yaw:18.4},{sourceMechanics:['desk-over'],hint:'上から、仕切りと箱の位置を読む。弧を高くしても、横からでも。',view:{target:p(.5,.4,3.3),distance:12,azimuth:0,elevation:1.30}}),
 'extra-bank':make('extra-bank',59,'7-2：跳ねて、壁の受け口へ','extra','rubber-ball',p(0,1.15,0),g59,
  [wall('extra-bank-left-wall',-2.0,.1,-1.85,6.9,4.5),wall('extra-bank-central-screen',-.45,2.9,.45,3.12,4.5),
   solid('extra-bank-target-left',p(-3,0,6.3),p(-.65,3.7,6.46),'wall'),solid('extra-bank-target-right',p(.65,0,6.3),p(3,3.7,6.46),'wall'),
   solid('extra-bank-target-bottom',p(-.65,0,6.3),p(.65,.55,6.46),'wall'),solid('extra-bank-target-top',p(-.65,1.85,6.3),p(.65,3.7,6.46),'wall')],
  {power:7,elevation:24,yaw:-34},{sourceMechanics:['factory-bank','eccentric-card'],hint:'まっすぐは仕切りの向こう。ゴムボールの跳ね返りで壁の穴へ。',view:{target:p(-.5,1.2,3.6),distance:12,azimuth:.25,elevation:.55}}),
});

// Stable progress IDs retain their storage positions. Physical versions pin
// the old experimental faces separately from the new golf/glider rules.
const g70=receiver('remix-room-bin',0,6.5,.8,.43);
const g71=receiver('remix-school-bin',0,7,.85,.46);
const g72=receiver('remix-wind-bin',0,8.2,.85,.46);
const g73=receiver('remix-machine-bin',0,6.8,.9,.54);
const cup={...receiver('extra-golf-cup',1.8,6,.09,.34),kind:'golf-cup',shape:'circle',label:'ゴルフのカップ',radius:.34};
const landing={...receiver('extra-plane-landing',.8,8.4,.18,.85),kind:'landing-pad',label:'紙飛行機の着地帯',halfHeight:1.0};
export const PREVIOUS_RELEASE_CHAPTER_WORLDS=freeze({
 'remix-room':make('remix-room',70,'6-1：机を越えて、風を引く','room','can',p(0,1.05,0),g70,
  [...desk('remix-room-desk',0,2.9,3.0,.9,1.25),solid('remix-room-shelf',p(-3.7,0,6.5),p(-2.8,2.4,7),'shelf')],
  {power:8.0,elevation:20,yaw:0},{wind:p(1.5,0,0),sourceMechanics:['desk-over','room-extra'],hint:'低い弧は机に当たる。高く越えても右へ流れる。弧と左への狙いを合わせよう。'}),
 'remix-school':make('remix-school',71,'6-2：棚越しの待ち合わせ','school','can',p(0,1.3,0),g71,
  [...desk('remix-school-desk-left',-2.1,2.2,1.5,.75,.9),...desk('remix-school-desk-right',2.1,2.2,1.5,.75,.9),solid('remix-school-low-shelf',p(-1.4,0,3),p(1.4,2.0,3.6),'shelf')],
  {power:8.4,elevation:25,yaw:0},{goalMotion:{amplitude:1.5,period:7,phase:0},sourceMechanics:['school-classroom','factory-conveyor'],hint:'棚を高い弧で越え、箱の今いる所ではなく、届く頃の場所へ。'}),
 'remix-wind':make('remix-wind',72,'6-3：風と箱のすれ違い','outdoor','can',p(0,1.25,0),g72,
  [solid('remix-wind-left-planter',p(-3.2,0,3.6),p(-1.5,.65,4.5),'planter'),solid('remix-wind-right-planter',p(1.5,0,3.6),p(3.2,.65,4.5),'planter')],
  {power:9.2,elevation:44,yaw:0},{wind:p(1.1,0,0),goalMotion:{amplitude:1.4,period:8,phase:Math.PI/2},sourceMechanics:['room-extra','factory-conveyor'],hint:'風は右へ、箱は左右へ。風のずれと、箱の行き先を両方足し引きしよう。',view:{target:p(0,1.1,4.4),distance:15,azimuth:.1,elevation:.48}}),
 'remix-machine':make('remix-machine',73,'6-4：壁で回って、開く間に','factory','rubber-ball',p(0,1.3,0),g73,
  [wall('remix-machine-reflector',-3.4,.8,-3.25,7.8,4),wall('remix-machine-screen',-.55,2.9,.55,3.15,4.5),solid('remix-machine-crate',p(2.2,0,2.8),p(3.3,1.1,4),'crate')],
  {power:12.2,elevation:24,yaw:0},{shutter:{id:'remix-machine-shutter',min:p(-3.1,0,4.6),max:p(2.1,3.5,4.8),lift:4.1,period:8},sourceMechanics:['factory-shutter','factory-bank'],hint:'正面の仕切りは左の壁で回り込む。その先のシャッターが開く時に届かせよう。'}),
 'extra-overlook':make('extra-overlook',74,'7-1：ワンパット・ゴルフ','golf','golf-ball',p(0,.14,0),cup,
  [wall('golf-left-rail',-2.8,-.7,-2.6,8.3,.35),wall('golf-right-rail',2.6,-.7,2.8,8.3,.35),wall('golf-back-rail',-2.8,8.3,2.8,8.5,.35),solid('golf-center-bumper',p(-.6,0,2.5),p(.6,.35,2.8),'bumper')],
  {power:4.8,elevation:0,yaw:0},{mode:'golf',cupSpeed:1.7,sourceMechanics:[],hint:'引く長さが転がる強さ。正面の障害物を右から回し、速すぎない球でカップへ。',view:{target:p(.4,.1,3.8),distance:12,azimuth:0,elevation:.95},physics:{...physics(74,p(0,.14,0),cup),launchLimits:{minPower:.5,maxPower:9,minElevation:0,maxElevation:0}}}),
 'extra-bank':make('extra-bank',75,'7-2：紙飛行機の着地便','glider','paper-plane',p(0,1.6,0),landing,
  [solid('plane-gate-left',p(-3,0,3.3),p(-.95,3.4,3.45),'gate'),solid('plane-gate-right',p(.95,0,3.3),p(3,3.4,3.45),'gate'),solid('plane-gate-top',p(-.95,2.45,3.3),p(.95,3.4,3.45),'gate')],
  {power:7,elevation:12,yaw:0},{mode:'glider',wind:p(.24,0,0),glider:{lift:.18,drag:.10,maxLift:8.8},sourceMechanics:[],hint:'ゆるい上向きで滑空。高すぎると枠に当たり、弱すぎると失速する。風を読んで奥の着地帯へ。',view:{target:p(0,.9,4.5),distance:14,azimuth:.1,elevation:.85},physics:{...physics(75,p(0,1.6,0),landing),launchLimits:{minPower:.5,maxPower:11,minElevation:0,maxElevation:45}}}),
});


// The first airplane course and profile remain addressable at world 75.
const floatLanding={...receiver('extra-plane-landing',.6,21,.24,1.2),kind:'landing-pad',label:'紙飛行機の着地帯',halfHeight:1.6};
export const GLIDE_RELEASE_CHAPTER_WORLDS=freeze({...PREVIOUS_RELEASE_CHAPTER_WORLDS,
 'extra-bank':make('extra-bank',76,'7-2：紙飛行機の着地便','glider','paper-plane',p(0,1.6,0),floatLanding,
  [solid('plane-gate-left',p(-3.5,0,3.3),p(-1.2,3.6,3.45),'gate'),solid('plane-gate-right',p(1.2,0,3.3),p(3.5,3.6,3.45),'gate'),solid('plane-gate-top',p(-1.2,2.85,3.3),p(1.2,3.6,3.45),'gate')],
  {power:4.8,elevation:8,yaw:0},{mode:'glider',flightSeconds:8,runwayLength:26,wind:p(.06,0,0),glider:{lift:.62,drag:.035,maxLift:9.2,verticalDamping:1.25},sourceMechanics:[],
   room:{minX:-4.4,maxX:4.4,minZ:-1.6,maxZ:27,height:6,openSky:true},
   hint:'ふわっと持ち上げ、水平にすーっと。強く引きすぎず、奥の緑の着地帯へ。弱すぎると手前に落ちる。',
   view:{target:p(0,.9,10),distance:24,azimuth:.1,elevation:.65},
   physics:{...physics(76,p(0,1.6,0),floatLanding),launchLimits:{minPower:.5,maxPower:11,minElevation:0,maxElevation:45}}}),
});

// World 77 adds an elevated open-window course. Worlds 75 and 76 stay fixed.
const roofWindow={id:'rooftop-open-window',role:'normal',kind:'wall-slot',label:'隣のビルの開いた窓',shape:'rectangle',center:p(.4,12.2,28.45),normal:p(0,0,-1),up:p(0,1,0),halfWidth:1.5,halfHeight:1.25};
export const RELEASE_CHAPTER_WORLDS=freeze({...GLIDE_RELEASE_CHAPTER_WORLDS,
 'extra-bank':make('extra-bank',77,'7-2：屋上から、となりの窓へ','rooftop','paper-plane',p(0,14,0),roofWindow,
  [solid('rooftop-source-building',p(-5.2,0,-10),p(5.2,12.4,2.4),'building'),
   solid('rooftop-source-parapet-left',p(-5.2,12.4,-10),p(-4.95,13.2,2.5),'parapet'),
   solid('rooftop-source-parapet-right',p(4.95,12.4,-10),p(5.2,13.2,2.5),'parapet'),
   solid('rooftop-source-front-lip',p(-5.2,12.4,2.25),p(5.2,12.9,2.5),'parapet'),
   solid('rooftop-target-left',p(-6.2,0,28),p(-1.1,19,32),'building'),
   solid('rooftop-target-right',p(1.9,0,28),p(6.2,19,32),'building'),
   solid('rooftop-target-sill',p(-1.1,0,28),p(1.9,10.95,32),'building'),
   solid('rooftop-target-lintel',p(-1.1,13.45,28),p(1.9,19,32),'building'),
   solid('rooftop-target-room-back',p(-1.1,10.95,31.8),p(1.9,13.45,32),'interior')],
  {power:4.8,elevation:8,yaw:0},{mode:'glider',flightSeconds:8,roofHeight:12.4,wind:p(.28,0,0),windGust:{period:8,amplitude:.24,secondary:.08},glider:{lift:.62,drag:.035,maxLift:9.2,verticalDamping:1.25},sourceMechanics:['room-extra'],
   room:{minX:-9,maxX:9,minZ:-12,maxZ:35,height:30,openSky:true},
   hint:'屋上から、となりの開いた窓へ。右へ流すビル風を読み、少し左へ向けてふわっと。',
   view:{target:p(0,13.15,12),distance:26,azimuth:.1,elevation:.28},
   physics:{...physics(77,p(0,14,0),roofWindow),launchLimits:{minPower:.5,maxPower:11,minElevation:0,maxElevation:45}}}),
});

export const RELEASE_CHAPTER_PHYSICS_WORLDS=freeze(Object.fromEntries([...Object.values(LEGACY_RELEASE_CHAPTER_WORLDS),...Object.values(PREVIOUS_RELEASE_CHAPTER_WORLDS),...Object.values(GLIDE_RELEASE_CHAPTER_WORLDS),...Object.values(RELEASE_CHAPTER_WORLDS)].map(w=>[w.worldVersion,w.physics])));
const BY_VERSION=freeze(Object.fromEntries([...Object.values(LEGACY_RELEASE_CHAPTER_WORLDS),...Object.values(PREVIOUS_RELEASE_CHAPTER_WORLDS),...Object.values(GLIDE_RELEASE_CHAPTER_WORLDS),...Object.values(RELEASE_CHAPTER_WORLDS)].map(w=>[w.worldVersion,w])));
export const REMIX_CHAPTER_IDS=freeze(['remix-room','remix-school','remix-wind','remix-machine']);
export const EXTRA_CHAPTER_IDS=freeze(['extra-overlook','extra-bank']);
export const RELEASE_CHAPTER_IDS=freeze([...REMIX_CHAPTER_IDS,...EXTRA_CHAPTER_IDS]);
export const RELEASE_STAGE_ITEMS=freeze(Object.fromEntries(Object.values(RELEASE_CHAPTER_WORLDS).map(w=>[w.stageId,w.itemId])));
export function releaseChapterWorldByVersion(version){return Number.isInteger(version)&&Object.hasOwn(BY_VERSION,version)?BY_VERSION[version]:null;}
export function releaseChapterWorld(stageId,version){const w=version===undefined?RELEASE_CHAPTER_WORLDS[stageId]:releaseChapterWorldByVersion(version);return w?.stageId===stageId?w:null;}
const requireWorld=w=>{const fixed=releaseChapterWorld(w?.stageId,w?.worldVersion);if(!fixed)throw new RangeError('A fixed release chapter world is required');return fixed;};
export function releaseChapterStartTime(time=0){if(!Number.isFinite(time))throw new TypeError('Environment time must be finite');return ((time%40)+40)%40;}
export function releaseChapterGoals(world,time=0){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Environment time must be finite');return world.goals.map(g=>({...g,center:{...g.center,...(world.goalMotion?{x:g.center.x+world.goalMotion.amplitude*Math.sin(time*2*Math.PI/world.goalMotion.period+world.goalMotion.phase)}:{})}}));}
// Receiver walls are derived from the exact swept aperture. They never fill
// the opening or remain behind as a static invisible receiver when it moves.
export function releaseChapterReceiverSolids(world,time=0){world=requireWorld(world);return releaseChapterGoals(world,time).filter(g=>g.kind==='recycle-bin').flatMap(g=>{
 const x=g.center.x,z=g.center.z,y=g.center.y,w=g.halfWidth,d=g.halfHeight,t=.08;
 return [solid(`${g.id}-left`,p(x-w-t,0,z-d-t),p(x-w,y,z+d+t),'receiver'),solid(`${g.id}-right`,p(x+w,0,z-d-t),p(x+w+t,y,z+d+t),'receiver'),solid(`${g.id}-front`,p(x-w,0,z-d-t),p(x+w,y,z-d),'receiver'),solid(`${g.id}-back`,p(x-w,0,z+d),p(x+w,y,z+d+t),'receiver')];
 });}
export function releaseChapterDynamicSolids(world,time=0){world=requireWorld(world);const solids=releaseChapterReceiverSolids(world,time);if(world.shutter){const s=world.shutter,lift=s.lift*(.5-.5*Math.cos(time*2*Math.PI/s.period));solids.push(solid(s.id,p(s.min.x,s.min.y+lift,s.min.z),p(s.max.x,s.max.y+lift,s.max.z),'shutter',{surface:'machine',restitution:.22}));}return solids;}
export function releaseChapterWind(world,time=0,point){world=requireWorld(world);if(!Number.isFinite(time))throw new TypeError('Environment time must be finite');if(!world.windGust)return {...world.wind};
 const z=point?.z??world.origin.z,exposure=Math.max(.35,Math.min(1,(z+.5)/4)),phase=time*2*Math.PI/world.windGust.period;
 const gain=exposure*(1+world.windGust.amplitude*Math.sin(phase)+world.windGust.secondary*Math.sin(phase*2+.7));
 return {x:world.wind.x*gain,y:world.wind.y*gain,z:world.wind.z*gain};
}
export function releaseChapterMotion(world,time=0){world=requireWorld(world);return {goals:releaseChapterGoals(world,time),solids:releaseChapterDynamicSolids(world,time),wind:releaseChapterWind(world,time),environmentTime:time};}
