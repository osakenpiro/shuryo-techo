import { createGame, setSetup, throwCan, resetShot, stepGame, getSnapshot } from './physics.mjs';
import { createRenderer } from './render.mjs';

const $=id=>document.getElementById(id);
const game=createGame({distance:6,height:1.3});
const controls={power:7.8,elevation:48,yaw:0};
const renderer=createRenderer($('scene'));
const inputs=['power','elevation','yaw','distance','height'].map($);
let lastUIKey='',previousTime=performance.now();

function updateControlLabels(){
  $('power-value').textContent=controls.power.toFixed(2).replace(/0$/,'');
  $('elevation-value').textContent=`${controls.elevation}°`;
  $('yaw-value').textContent=controls.yaw===0?'まっすぐ':`${controls.yaw<0?'左':'右'} ${Math.abs(controls.yaw)}°`;
  for(const id of ['power','elevation','yaw']){const input=$(id),progress=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100;input.style.setProperty('--fill',`${progress}%`);}
}

function updateUI(force=false){
  const key=[game.phase,game.lastEvent,game.attempts,game.successes,game.bin.center.z,game.bin.height].join('|');
  if(key===lastUIKey&&!force)return;
  lastUIKey=key;
  const busy=game.phase==='flying'||game.phase==='settling';
  for(const input of inputs)input.disabled=busy;
  $('throw-button').disabled=busy;
  $('reset-button').disabled=busy||game.phase==='ready';
  $('status-panel').dataset.phase=game.phase;
  $('attempt-count').textContent=String(game.attempts).padStart(2,'0');
  $('success-count').textContent=String(game.successes).padStart(2,'0');
  $('setup-description').textContent=`距離 ${game.bin.center.z} m · 高さ ${game.bin.height} m`;
  const messages={
    ready:['↗','いいところに、投げてみよう。','つまみで調整したら、準備はおしまい。','投げる'],
    flying:['·','缶の行方を、見届けよう。','すとん、と入ると気持ちいい。','飛んでいます…'],
    settling:['·','もう少し、見届けよう。','缶が落ち着くまでお待ちください。','着地を待っています…'],
    success:['✓','すとん！ きれいに入った。','この調子でもうひと投げ。','もう一度投げる'],
    miss:['↺','惜しい、もうひと投げ。','強さや角度を少し変えてみよう。','もう一度投げる']
  };
  const message=messages[game.phase]||messages.ready;
  $('status-icon').textContent=message[0];$('status').textContent=message[1];$('status-detail').textContent=message[2];$('throw-label').textContent=message[3];
  if(busy&&game.lastEvent==='rim-hit')$('status-detail').textContent='ふちに当たった！ どうなるかな。';
  if(busy&&game.lastEvent==='side-hit')$('status-detail').textContent='箱の横に当たった。もう少し高めかな。';
  if(busy&&game.lastEvent==='entered')$('status-detail').textContent='箱の中へ！ 缶が落ち着くのを待とう。';
}

for(const id of ['power','elevation','yaw'])$(id).addEventListener('input',()=>{controls[id]=Number($(id).value);updateControlLabels();});
for(const id of ['distance','height'])$(id).addEventListener('change',()=>{setSetup(game,{distance:Number($('distance').value),height:Number($('height').value)});updateUI(true);});
function fire(){const accepted=throwCan(game,controls);if(accepted){previousTime=performance.now();updateUI(true);}return accepted;}
$('throw-button').addEventListener('click',fire);
$('reset-button').addEventListener('click',()=>{if(resetShot(game))updateUI(true);});
document.addEventListener('keydown',event=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.code!=='Space'&&event.code!=='Enter')return;
  const target=event.target;if(target instanceof HTMLElement&&(target.matches('button,input,select,textarea,a')||target.isContentEditable))return;
  event.preventDefault();fire();
});
const resizeObserver=new ResizeObserver(()=>renderer.resize());resizeObserver.observe($('scene'));
window.addEventListener('resize',()=>renderer.resize());
document.addEventListener('visibilitychange',()=>{previousTime=performance.now();});
window.__trashShot={game,controls,snapshot:()=>getSnapshot(game)};
updateControlLabels();updateUI(true);
function frame(now){
  const dt=Math.max(0,Math.min((now-previousTime)/1000,.045));previousTime=now;
  stepGame(game,dt);updateUI();renderer.render(game,controls);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
