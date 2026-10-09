import { createGame, setSetup, throwCan, resetShot, stepGame, getSnapshot } from './physics.mjs';
import { createRenderer } from './render.mjs';

const $=id=>document.getElementById(id);
const canvas=$('scene');
const game=createGame({distance:6,height:1.3});
const controls={power:7.8,elevation:48,yaw:0};
const renderer=createRenderer(canvas);
const inputs=['power','elevation','yaw','distance','height'].map($);
const pointers=new Set();
const view={mode:'throw',prediction:false,gesture:null};
let lastUIKey='',previousTime=performance.now(),lastInput=null,cancellations=0;
const busy=()=>game.phase==='flying'||game.phase==='settling';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function updateControlLabels(){
  $('power-value').textContent=controls.power.toFixed(2).replace(/0$/,'');
  $('elevation-value').textContent=`${controls.elevation}°`;
  $('yaw-value').textContent=controls.yaw===0?'まっすぐ':`${controls.yaw<0?'左':'右'} ${Math.abs(controls.yaw)}°`;
  for(const id of ['power','elevation','yaw']){const input=$(id);input.value=controls[id];const progress=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100;input.style.setProperty('--fill',`${progress}%`);}
}
function updateHint(){
  canvas.dataset.mode=view.mode;canvas.dataset.dragging=String(Boolean(view.gesture));
  $('mode-throw').setAttribute('aria-pressed',String(view.mode==='throw'));
  $('mode-observe').setAttribute('aria-pressed',String(view.mode==='observe'));
  $('cancel-gesture').hidden=!view.gesture||view.gesture.kind!=='throw';
  if(view.mode==='observe'){
    $('interaction-hint').textContent='ドラッグで見回す。缶も箱も、別の角度から。';
    $('input-detail').textContent='ホイール／＋−でズーム。視点を動かしても投球しません。';
  }else if(busy()){
    $('interaction-hint').textContent='缶の行方を見届けよう。「見回す」で視点を変えられます。';
    $('input-detail').textContent='投球が落ち着いたら、もう一投。';
  }else if(view.gesture){
    const aim=view.gesture.aim;
    $('interaction-hint').textContent=aim.valid?'離すと一投。取り消しは Esc または下のボタン。':'もう少し上へ動かすと、投げられます。';
    $('input-detail').textContent=`強さ ${aim.power.toFixed(1)} · ${aim.yaw===0?'箱へまっすぐ':`${aim.yaw<0?'左':'右'} ${Math.abs(aim.yaw)}°`} · 角度 ${controls.elevation}°`;
  }else{
    $('interaction-hint').textContent='上へドラッグ／スワイプして、離すと一投。';
    $('input-detail').textContent='長く動かすほど強く。左右は箱の方向を基準に。';
  }
  canvas.setAttribute('aria-label',view.mode==='observe'?'缶と箱を観察する立体画面。ドラッグか矢印キーでカメラ回転。プラスとマイナスでズーム。':'缶を投げる立体画面。上へドラッグまたはスワイプして離すと一投。左右は箱方向を基準。数値で投げるボタンも使えます。');
}
function updateUI(force=false){
  const key=[game.phase,game.lastEvent,game.attempts,game.successes,game.bin.center.z,game.bin.height].join('|');
  if(key===lastUIKey&&!force)return;
  lastUIKey=key;
  for(const input of inputs)input.disabled=busy();
  $('throw-button').disabled=busy();
  $('reset-button').disabled=busy()||game.phase==='ready';
  $('status-panel').dataset.phase=game.phase;
  $('attempt-count').textContent=String(game.attempts).padStart(2,'0');
  $('success-count').textContent=String(game.successes).padStart(2,'0');
  $('setup-description').textContent=`距離 ${game.bin.center.z} m · 高さ ${game.bin.height} m`;
  const messages={
    ready:['↗','いいところに、投げてみよう。','画面で手投げ、または数値で投げられます。','数値で投げる'],
    flying:['·','缶の行方を、見届けよう。','すとん、と入ると気持ちいい。','飛んでいます…'],
    settling:['·','もう少し、見届けよう。','缶が落ち着くまでお待ちください。','着地を待っています…'],
    success:['✓','すとん！ 箱に入った。','視点を変えて中を見ても、もうひと投げでも。','この数値でもう一度'],
    miss:['↺','もうひと投げ。','向きや強さを変えて試してみよう。','この数値でもう一度']
  };
  const message=messages[game.phase]||messages.ready;
  $('status-icon').textContent=message[0];$('status').textContent=message[1];$('status-detail').textContent=message[2];$('throw-label').textContent=message[3];
  if(busy()&&game.lastEvent==='rim-hit')$('status-detail').textContent='ふちに当たった！ どうなるかな。';
  if(busy()&&game.lastEvent==='side-hit')$('status-detail').textContent='箱の横に当たった。';
  if(busy()&&game.lastEvent==='entered')$('status-detail').textContent='箱の中へ！ 缶が落ち着くのを待とう。';
  updateHint();
}
function cancelGesture(reason='cancel'){
  const gesture=view.gesture;
  if(!gesture)return;
  view.gesture=null;cancellations++;lastInput={type:'cancel',reason};
  $('gesture-feedback').hidden=true;
  if(canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
  updateHint();
}
function setMode(mode){cancelGesture('mode-change');view.mode=mode;updateHint();}
$('mode-throw').addEventListener('click',()=>setMode('throw'));
$('mode-observe').addEventListener('click',()=>setMode('observe'));
function cameraAction(action){cancelGesture('camera-control');action();}
$('camera-reset').addEventListener('click',()=>cameraAction(()=>renderer.resetCamera()));
for(const [id,x,y] of [['camera-left',-.16,0],['camera-right',.16,0],['camera-up',0,.12],['camera-down',0,-.12]])$(id).addEventListener('click',()=>cameraAction(()=>renderer.orbit(x,y)));
$('camera-in').addEventListener('click',()=>cameraAction(()=>renderer.zoom(.88)));
$('camera-out').addEventListener('click',()=>cameraAction(()=>renderer.zoom(1.14)));
$('prediction-toggle').addEventListener('change',()=>{cancelGesture('prediction-change');view.prediction=$('prediction-toggle').checked;});
for(const id of ['power','elevation','yaw'])$(id).addEventListener('input',()=>{cancelGesture('numeric-change');controls[id]=Number($(id).value);updateControlLabels();});
for(const id of ['distance','height'])$(id).addEventListener('change',()=>{cancelGesture('setup-change');setSetup(game,{distance:Number($('distance').value),height:Number($('height').value)});updateUI(true);});
function fire(source='numeric'){
  cancelGesture('other-throw');
  const accepted=throwCan(game,controls);
  if(accepted){lastInput={type:'throw',source,parameters:{...controls}};previousTime=performance.now();updateUI(true);if(source!=='gesture')canvas.scrollIntoView({block:'center',behavior:'instant'});}
  return accepted;
}
$('throw-button').addEventListener('click',()=>fire());
$('reset-button').addEventListener('click',()=>{cancelGesture('reset');if(resetShot(game))updateUI(true);});
function inside(event,rect){return event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;}
function sameLayout(gesture){const rect=canvas.getBoundingClientRect();return gesture.viewport.width===innerWidth&&gesture.viewport.height===innerHeight&&rect.width===gesture.rect.width&&rect.height===gesture.rect.height&&rect.left===gesture.rect.left&&rect.top===gesture.rect.top;}
function gestureAim(gesture,event){
  const size=Math.max(1,Math.min(gesture.rect.width,gesture.rect.height));
  const upward=(gesture.startY-event.clientY)/size,sideways=(event.clientX-gesture.startX)/size;
  return {power:Math.round(clamp(4+upward*18,4,13)*20)/20,yaw:Math.round(clamp(sideways*60,-60,60)*2)/2,valid:upward>=.10};
}
function showGesture(gesture,event){
  const x=gesture.startX-gesture.rect.left,y=gesture.startY-gesture.rect.top;
  const dx=event.clientX-gesture.startX,dy=event.clientY-gesture.startY;
  $('gesture-feedback').hidden=false;
  $('gesture-origin').style.left=`${x}px`;$('gesture-origin').style.top=`${y}px`;
  $('gesture-tip').style.left=`${x+dx}px`;$('gesture-tip').style.top=`${y+dy}px`;
  const line=$('gesture-line');line.style.left=`${x}px`;line.style.top=`${y}px`;line.style.width=`${Math.hypot(dx,dy)}px`;line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
  updateHint();
}
document.addEventListener('pointerdown',event=>{pointers.add(event.pointerId);if(pointers.size>1)cancelGesture('second-pointer');},true);
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,event=>{pointers.delete(event.pointerId);if(type==='pointercancel')cancelGesture('pointercancel');},true);
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0||pointers.size!==1||view.gesture||(view.mode==='throw'&&busy()))return;
  const rect=canvas.getBoundingClientRect();
  if(!inside(event,rect))return;
  event.preventDefault();canvas.focus({preventScroll:true});
  view.gesture={kind:view.mode,id:event.pointerId,rect,viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY};
  if(view.mode==='throw')view.gesture.aim=gestureAim(view.gesture,event);
  canvas.setPointerCapture(event.pointerId);updateHint();
});
canvas.addEventListener('pointermove',event=>{
  const gesture=view.gesture;if(!gesture||gesture.id!==event.pointerId)return;
  event.preventDefault();
  if(!sameLayout(gesture)){cancelGesture('layout-change');return;}
  if(!inside(event,gesture.rect)){cancelGesture('outside-canvas');return;}
  if(gesture.kind==='observe')renderer.orbit(-(event.clientX-gesture.lastX)/gesture.rect.width*3.6,(event.clientY-gesture.lastY)/gesture.rect.height*2.4);
  else{gesture.aim=gestureAim(gesture,event);showGesture(gesture,event);}
  gesture.lastX=event.clientX;gesture.lastY=event.clientY;
});
canvas.addEventListener('pointerup',event=>{
  const gesture=view.gesture;if(!gesture||gesture.id!==event.pointerId)return;
  event.preventDefault();
  const aim=gesture.kind==='throw'?gestureAim(gesture,event):null;
  const accepted=aim?.valid&&sameLayout(gesture)&&inside(event,gesture.rect)&&!busy();
  view.gesture=null;$('gesture-feedback').hidden=true;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  if(accepted){controls.power=aim.power;controls.yaw=aim.yaw;updateControlLabels();fire('gesture');}
  else{if(gesture.kind==='throw'){lastInput={type:'cancel',reason:'short-or-invalid-release'};cancellations++;}updateHint();}
});
canvas.addEventListener('lostpointercapture',()=>cancelGesture('lostpointercapture'));
$('cancel-gesture').addEventListener('click',()=>cancelGesture('cancel-button'));
canvas.addEventListener('wheel',event=>{if(view.mode!=='observe')return;event.preventDefault();cancelGesture('wheel');renderer.zoom(Math.exp(clamp(event.deltaY,-100,100)*.002));},{passive:false});
document.addEventListener('keydown',event=>{
  if(event.code==='Escape'){cancelGesture('escape');return;}
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.target===canvas){
    const turns={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.10],ArrowDown:[0,-.10]};
    if(turns[event.code]){event.preventDefault();cameraAction(()=>renderer.orbit(...turns[event.code]));return;}
    if(event.key==='+'||event.key==='='||event.key==='-'){event.preventDefault();cameraAction(()=>renderer.zoom(event.key==='-'?1.14:.88));return;}
  }
  if(event.code!=='Space'&&event.code!=='Enter')return;
  const target=event.target;if(target instanceof HTMLElement&&(target.matches('button,input,select,textarea,summary,a')||target.isContentEditable))return;
  event.preventDefault();if(view.mode==='throw'&&!view.gesture)fire('keyboard');
});
function resize(){if(renderer.resize())cancelGesture('resize');}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
window.addEventListener('resize',()=>{cancelGesture('resize');renderer.resize();});
window.addEventListener('blur',()=>{cancelGesture('blur');pointers.clear();});
document.addEventListener('visibilitychange',()=>{cancelGesture('visibility-change');pointers.clear();previousTime=performance.now();});
window.__trashShot={game,controls,snapshot:()=>getSnapshot(game),cameraSnapshot:()=>renderer.cameraSnapshot(),inputSnapshot:()=>({mode:view.mode,prediction:view.prediction,activeGesture:view.gesture?.kind||null,activePointers:pointers.size,cancellations,lastInput:lastInput?structuredClone(lastInput):null})};
updateControlLabels();updateUI(true);
function frame(now){
  const dt=Math.max(0,Math.min((now-previousTime)/1000,.045));previousTime=now;
  stepGame(game,dt);updateUI();renderer.render(game,controls,{prediction:view.prediction,aim:view.gesture?.kind==='throw'?{...controls,...view.gesture.aim}:null});
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
