// Present-tense mechanic guidance. Never predicts a hit or changes a throw.
import {releaseChapterWorld,releaseChapterDynamicSolids} from './release-chapters-world.mjs?v=20261018-chapters67-1';
const direction=(world,time)=>{
 const m=world.goalMotion,velocity=Math.cos(time*2*Math.PI/m.period+m.phase);
 return Math.abs(velocity)<.16?'折り返し':velocity>0?'右へ移動中 →':'← 左へ移動中';
};
export function releaseChapterCue(world,time=0){
 world=releaseChapterWorld(world?.stageId,world?.worldVersion);
 if(!world)return null;
 if(!Number.isFinite(time))throw new TypeError('Environment time must be finite');
 const common={stageId:world.stageId,state:'steady',title:'',detail:''};
 if(world.mode==='golf')return {...common,title:'ゴルフ · 転がす強さ × 狙う方向',detail:'弧は使わない。正面を避けて、カップで止まる強さに。引きすぎると通り過ぎる。'};
 if(world.worldVersion===77)return {...common,title:'屋上から、となりの窓へ · ビル風は右 →',detail:'吹き流しを見て、少し左へ。軽く引いてふわっと。投げた後は画面が追いかけます。'};
 if(world.worldVersion===76)return {...common,title:'紙飛行機 · ふわっと浮いて、すーっと滑空',detail:'軽く引いて、ゆるい上向きに。投げたら画面が追いかけます。遠くの着地帯へ、すーっと。'};
 if(world.mode==='glider')return {...common,title:'紙飛行機 · 低い滑空 × 右への風',detail:'ゆるく上へ。枠の下を抜け、緑の着地帯に降ろそう。弱すぎると手前に落ちる。'};
 switch(world.stageId){
  case 'remix-room':return {...common,title:'机越え ＋ 右への風 →',detail:'弧を上げるだけでは右へ外れる。高く越えて、狙いは左へ。'};
  case 'remix-school':return {...common,state:'moving',title:'箱は '+direction(world,time),detail:'棚には高い弧。狙いは箱の今いる所から、届く頃の場所へ。'};
  case 'remix-wind':return {...common,state:'moving',title:'風は右へ → · 箱は '+direction(world,time),detail:'左から風に乗せて、動く箱の少し先へ。'};
  case 'remix-machine':{
   const shutter=releaseChapterDynamicSolids(world,time).find(c=>c.id===world.shutter.id),height=shutter.min.y-world.shutter.min.y;
   const rising=Math.sin(time*2*Math.PI/world.shutter.period)>0;
   const state=height>=2.7?'open':height<=.5?'closed':rising?'opening':'closing';
   const title={open:'シャッターが高く開いている',closed:'シャッターは低い位置',opening:'シャッターが上がっている ↑',closing:'シャッターが下がっている ↓'}[state];
   return {...common,state,title,detail:'左の壁で正面を回り込み、その先のシャッターが開く間に。'};
  }
  case 'extra-overlook':return {...common,title:'上から、道を見つけよう',detail:'手前のオレンジが投げる場所。仕切りの上でも、横からでも。'};
  case 'extra-bank':return {...common,title:'左の壁を使って、壁の穴へ',detail:'ゴムボールを左の壁へ。跳ね返りで正面の仕切りを回ろう。'};
 }
 return null;
}
