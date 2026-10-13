// One versioned catalog is shared by the shop, simulation and replay validator.
const freeze=value=>{
  if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
};
export const DEFAULT_THROWABLE_ID='can';
export const THROWABLE_PROFILE_VERSION=1;
const handMass=.1,canMass=.035;
const physics=(mass,radius,inertiaFactor,airDrag,restitutionScale,frictionScale,spinImpulse,wobbleForce=0,contactTwist=0)=>({
  version:THROWABLE_PROFILE_VERSION,mass,radius,inertiaFactor,airDrag,
  launchScale:Math.sqrt((handMass+canMass)/(handMass+mass)),
  restitutionScale,frictionScale,spinImpulse,wobbleForce,contactTwist,
});
export const THROWABLE_CATALOG=freeze({
  can:{id:'can',label:'空き缶',price:0,traits:['いつもの投げ心地'],shape:'can',color:'#e98238',
    physics:physics(canMass,.14,.5,0,1,1,0)},
  paper:{id:'paper',label:'紙くず',price:25,traits:['軽い','空気に流される'],shape:'paper',color:'#f3ead7',
    physics:physics(.008,.11,.55,.00025,.16,1.2,.00038,.0008,.035)},
  'rubber-ball':{id:'rubber-ball',label:'ゴムボール',price:40,traits:['よく跳ねる','転がりやすい'],shape:'ball',color:'#e9b54e',
    physics:{...physics(.055,.115,.4,.00007,4,.45,.00055),binBottomRestitution:.2}},
  'heavy-ball':{id:'heavy-ball',label:'鉄球',price:50,traits:['重い','跳ねにくい'],shape:'heavy',color:'#7a8b88',
    physics:physics(.15,.13,.4,.00006,.30,1.25,.00055)},
  carton:{id:'carton',label:'空きパック',price:60,traits:['いびつ','回転でふらつく'],shape:'carton',color:'#73a99b',
    physics:physics(.025,.16,.65,.00018,.45,.9,.0022,.006,.13)},
  coin:{id:'coin',label:'小銭',price:0,acquisition:'stage-clear',stageId:'outdoor-shrine',traits:['小さな受け口を通る','回って跳ねる'],shape:'coin',color:'#c9a757',
    physics:{...physics(.007,.055,.5,.000015,2.2,.7,.00002,0,.065),version:2}},
  baseball:{id:'baseball',label:'野球ボール',price:0,acquisition:'stage-clear',stageId:'outdoor-baseball',traits:['打球の遠投','丸いバウンド'],shape:'baseball',color:'#f5ead6',
    physics:{...physics(.145,.073,.4,.000015,2.6,.65,.0002),version:2}},
  'ice-scoop':{id:'ice-scoop',label:'アイスのボール',price:0,acquisition:'stage-clear',stageId:'outdoor-mall',traits:['落としてのせる','当たるとベチャッ'],shape:'ice-scoop',color:'#f0bed0',
    physics:{...physics(.07,.135,.4,.000015,0,2,.00003),version:2,terminalContact:'splat'}},
  'firework-ball':{id:'firework-ball',label:'花火玉',price:0,acquisition:'stage-clear',stageId:'outdoor-river',traits:['夜の川を越える','筒へ落とす'],shape:'firework-ball',color:'#bc8e5c',
    physics:{...physics(.12,.16,.4,.000015,.6,1.1,.00015),version:2}},
  arrow:{id:'arrow',label:'矢',price:0,acquisition:'stage-clear',stageId:'eccentric-boar',traits:['細い先端をねらう','飛ぶ向きに姿勢が合う'],shape:'arrow',color:'#d8ba81',
    physics:{...physics(.02,.035,.52,.00001,.15,1.2,.000005),version:3,alignToVelocity:true}},
  basketball:{id:'basketball',label:'バスケットボール',price:0,acquisition:'stage-clear',stageId:'eccentric-basket',traits:['リングへ弧を描く','大きく弾む'],shape:'basketball',color:'#d68a45',
    physics:{...physics(.62,.12,.4,.00002,3.6,.62,.0005),version:3}},
  dandelion:{id:'dandelion',label:'たんぽぽの綿毛',price:0,acquisition:'stage-clear',stageId:'eccentric-dandelion',traits:['落下がゆっくり','風に大きく流される'],shape:'dandelion',color:'#f4eed6',
    physics:{...physics(.00006,.05,.55,.000035,0,2,.00000001),version:3,verticalAirDrag:.00032,windResponse:12}},
  'playing-card':{id:'playing-card',label:'トランプ',price:0,acquisition:'stage-clear',stageId:'eccentric-card',traits:['狙った面に刺さる','薄く回転する'],shape:'playing-card',color:'#f5ead5',
    physics:{...physics(.0018,.04,.58,.000016,.16,1.2,.000005,0,.02),version:3,alignToVelocity:true}},
  cannonball:{id:'cannonball',label:'大砲の弾',price:0,acquisition:'stage-clear',stageId:'eccentric-cannon',traits:['重い一撃','跳ねにくい'],shape:'cannonball',color:'#546863',
    physics:{...physics(1.2,.18,.4,.000012,.12,1.4,.00005),version:3}},
});
export function getThrowable(id=DEFAULT_THROWABLE_ID){
  return typeof id==='string'&&Object.hasOwn(THROWABLE_CATALOG,id)?THROWABLE_CATALOG[id]:null;
}
export const isThrowableId=id=>getThrowable(id)!==null;
