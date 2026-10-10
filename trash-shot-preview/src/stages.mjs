// App-owned guided progress; replay V1 and physics remain unchanged.
export const STAGES=Object.freeze({
  free:Object.freeze({label:'自由に投げる'}),
  tutorial:Object.freeze({label:'はじめの一投',distance:4,height:.8,power:6,elevation:48,yaw:0}),
  first:Object.freeze({label:'ステージ1：いつものゴミ箱',distance:6,height:1.3,power:7.8,elevation:48,yaw:0})
});
export function createStageProgress(){
  let id='free',run=0,active=null,attempts=0,successes=0;const completed=new Set();
  return {
    select(next){if(!STAGES[next])return false;id=next;run++;active=null;attempts=0;successes=0;return true;},
    launch(shotId){active={shotId,run};attempts++;},
    result(event){if(event.type!=='result'||!active||active.shotId!==event.shotId||active.run!==run)return false;active=null;if(event.success){successes++;if(id!=='free')completed.add(id);}return true;},
    snapshot(){return {id,run,attempts,successes,completed:[...completed],activeShotId:active?.shotId??null};}
  };
}
