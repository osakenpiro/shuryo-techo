// App-owned guided progress; replay V1 and physics remain unchanged.
export const STAGES=Object.freeze({
  free:Object.freeze({label:'自由に投げる'}),
  tutorial:Object.freeze({label:'はじめの一投',distance:4,height:.8,power:6,elevation:48,yaw:0}),
  first:Object.freeze({label:'1-1：部屋のゴミ箱',environment:'room',distance:6,height:1.3,power:7.8,elevation:48,yaw:0}),
  'desk-over':Object.freeze({label:'1-2：机を越えて',number:'1-2',environment:'room',course:'desk-over',distance:6,height:1.3,power:7.8,elevation:48,yaw:0}),
  'desk-side':Object.freeze({label:'1-3：机の横を通して',number:'1-3',environment:'room',course:'desk-side',distance:6,height:1.3,power:7.8,elevation:48,yaw:0}),
  'room-extra':Object.freeze({label:'1-4：扇風機と猫',environment:'room',gimmick:'fan',distance:6,height:1.3,power:7.8,elevation:48,yaw:0}),
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
