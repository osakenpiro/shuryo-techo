import {releaseChapterCue} from './release-chapters-cue.mjs';
import {factoryMotion} from './factory-world.mjs?v=20261015-boar-distance-1';
import {eccentricGoals} from './eccentric-world.mjs?v=20261015-boar-distance-1';
const hints=Object.freeze({
 first:'机から、奥のゴミ箱へ。引く長さで強さを変えよう。',
 'desk-over':'高い弧で机を越えて、奥の箱へ。',
 'desk-side':'本棚を越すか、横の壁で跳ね返して箱へ。',
 'room-extra':'扇風機の風は右へ。少し左を狙って補正しよう。',
 'school-classroom':'机の列を、高い弧で越えよう。',
 'school-vending':'自販機の小さな入口へ。力を抑えて正確に。',
 'school-passage':'二つの窓の向こうへ。生徒が通り過ぎる間を狙おう。',
 'school-rooftop':'屋上から中庭の箱へ。風も読もう。',
 'outdoor-shrine':'参拝する人の向こうの賽銭箱へ。動きと風を見よう。',
 'outdoor-baseball':'ホームランの一球を、観客のミットへ。',
 'outdoor-mall':'吹き抜けから子どものコーンへ、アイスを落とそう。弧は下向きにもできます。',
 'outdoor-river':'船の灯りを読んで、向こう岸の花火筒へ。',
 'factory-conveyor':'4本のベルトを乗り継ごう。2基のプレスに注意。',
 'factory-bank':'動くピストンで跳ね返し、遮蔽物の向こうへ。',
 'eccentric-tower':'250m下の街の箱へ。弱めの力で、落とすように投げよう。',
 'eccentric-boar':'奥の獣道を歩くイノシシへ。動く先を読んで低く射よう。',
 'eccentric-basket':'高い弧でリングへ。ボードを使っても入ります。',
 'eccentric-dandelion':'綿毛を風に乗せ、トレリスの開口の向こうの花壇へ。',
 'eccentric-card':'開口を通して奥のコルクへ。トランプは当たると刺さります。',
 'eccentric-cannon':'防壁を越えて、砦の扉へ。弧と強さを合わせよう。',
});
// These cues describe present geometry/state, never a predicted future shot.
export function onlineCourseCue(world,time=0,session=null){
 if(world.environment==='release'){
  if(world.worldVersion===77)return 'ビル風は右 → 軽く引いて、となりの窓へ。少し左に狙おう。';
  const cue=releaseChapterCue(world,time);return `${cue.title} ${cue.detail}`;
 }
 if(world.factoryType==='shutter')return factoryMotion(world,time,session).shutter.open?'シャッターが開いています。通り抜ける時間も見て投げよう。':'開く瞬間を狙うか、右のガイドで回り込もう。';
 if(world.factoryType==='relay'){
  const motion=factoryMotion(world,time,session);
  if(motion.relayClock?.expired)return 'レールの球が止まりました。もう一度プレートへ投げると、やり直せます。';
  if(motion.gate.open)return 'ゲートが開いています。今のうちに二球目を箱へ！';
  return session?.plateLatched?'一球目が仕掛けを動かしています。ゲートが開く間に二球目を箱へ。':'一球目をプレートに乗せ、レールを流れる間に二球目を箱へ。';
 }
 if(world.eccentricType==='train'){
  const nearest=Math.min(...eccentricGoals(world,time).filter(g=>g.role==='normal').map(g=>Math.abs(g.center.x-world.origin.x)));
  return `${nearest<3?'窓が近づいています。':'窓が並ぶ時を待とう。'}窓の進む先へ。車体は通り抜けません。`;
 }
 return hints[world.stageId]??world.hint??'狙いを定めて、引いて、離そう。';
}
