// App-owned guided progress. Outdoor defaults use the same immutable geometry
// as live contacts and replay validation, without copying tuned launch values.
import {OUTDOOR_WORLDS} from './outdoor-world.mjs?v=20261012-outdoor-chapter-1';
const outdoorLabels={'outdoor-shrine':'3-1：人混み越しのお賽銭','outdoor-baseball':'3-2：観客席のミットへ','outdoor-mall':'3-3：吹き抜けのアイス','outdoor-river':'3-4：川向こうの花火'};
const outdoorStages=Object.fromEntries(Object.entries(OUTDOOR_WORLDS).map(([id,w],i)=>[id,Object.freeze({label:outdoorLabels[id],number:`3-${i+1}`,environment:'outdoor',worldVersion:w.worldVersion,distance:w.bin.center.z,height:w.bin.height,...w.launch,itemId:w.itemId})]));
export const STAGES=Object.freeze({
  free:Object.freeze({label:'自由トレーニング'}),
  tutorial:Object.freeze({label:'はじめの一投',distance:4,height:.8,power:6,elevation:48,yaw:0}),
  first:Object.freeze({label:'1-1：部屋のゴミ箱',environment:'room',worldVersion:2,distance:4,height:.7,power:6.2,elevation:48,yaw:0}),
  'desk-over':Object.freeze({label:'1-2：机を越えて',number:'1-2',environment:'room',worldVersion:3,course:'desk-over',distance:4.8,height:.7,power:7.2,elevation:48,yaw:Math.atan2(2.5,4.8)*180/Math.PI}),
  'desk-side':Object.freeze({label:'1-3：本棚の向こうへ',number:'1-3',environment:'room',worldVersion:4,course:'desk-side',distance:4.4,height:.7,power:6.9,elevation:60,yaw:Math.atan2(.5,4.4)*180/Math.PI}),
  'room-extra':Object.freeze({label:'1-4：扇風機と猫',environment:'room',worldVersion:5,gimmick:'fan',distance:4,height:.7,power:6.2,elevation:48,yaw:0}),
  'school-classroom':Object.freeze({label:'2-1：教室の隅から',number:'2-1',environment:'school',worldVersion:6,distance:7.615,height:.7,power:8.5,elevation:45,yaw:Math.atan2(5.05,5.7)*180/Math.PI}),
  'school-vending':Object.freeze({label:'2-2：自販機の小さな入口',number:'2-2',environment:'school',worldVersion:7,distance:3.2,height:.78,power:5.5,elevation:48,yaw:0}),
  'school-passage':Object.freeze({label:'2-3：向かいの教室へ',number:'2-3',environment:'school',worldVersion:10,gimmick:'student',distance:7.603,height:.7,power:9.4,elevation:27,yaw:Math.atan2(.2,7.6)*180/Math.PI}),
  'school-rooftop':Object.freeze({label:'2-4：屋上から中庭へ',number:'2-4',environment:'school',worldVersion:9,gimmick:'breeze',distance:7.910,height:.7,power:6.1,elevation:40,yaw:-1}),
  ...outdoorStages,
  side:Object.freeze({label:'脇道：横からぽいっ（2D）',projection:'side',distance:8,height:1.3,power:9,elevation:48,yaw:0})
});
export function createStageProgress(){
  let id='free',run=0,active=null,attempts=0,successes=0;const completed=new Set();
  return {
    select(next){if(!STAGES[next])return false;id=next;run++;active=null;attempts=0;successes=0;return true;},
    launch(shotId){active={shotId,run};attempts++;},
    result(event,{recordClear=true}={}){if(event.type!=='result'||!active||active.shotId!==event.shotId||active.run!==run)return false;active=null;if(event.success){successes++;if(recordClear&&id!=='free')completed.add(id);}return true;},
    snapshot(){return {id,run,attempts,successes,completed:[...completed],activeShotId:active?.shotId??null};}
  };
}
