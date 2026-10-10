import { STAGES, createStageProgress } from './stages.mjs?v=20261010-stages-1';
import { createGame, setSetup, throwCan, resetShot, stepGame, getSnapshot, observeGame } from './physics.mjs?v=20261010-stages-1';
import { createRenderer } from './render.mjs?v=20261010-stages-1';
import { createShotAnalytics } from './shot-analytics.mjs?v=20261010-stages-1';
import { createRecorder, createReplayPlayer, validateReplay, loadReplays, saveReplay, deleteReplay, buildReplayURL, decodeReplay, replayToJSON, parseReplayJSON } from './replay.mjs?v=20261010-stages-1';

const $=id=>document.getElementById(id);
const canvas=$('scene');
const game=createGame({distance:6,height:1.3});
const controls={power:7.8,elevation:48,yaw:0};
const renderer=createRenderer(canvas);
const analytics=createShotAnalytics();
const stageProgress=createStageProgress();
let freeSetup={distance:6,height:1.3};
observeGame(game,event=>stageProgress.result(event));
observeGame(game,event=>analytics.observe(event));
const inputs=['power','elevation','yaw','distance','height'].map($);
const pointers=new Set();
const view={mode:'throw',prediction:false,gesture:null};
let lastUIKey='',previousTime=performance.now(),lastInput=null,cancellations=0,wheelAnglePixels=0;
const busy=()=>game.phase==='flying'||game.phase==='settling';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

const inviteDialog=$('invite-dialog');
// Older cached pages have no invitation controls; keep their game playable.
if(inviteDialog && $('invite-game')){
  $('invite-game').addEventListener('click',()=>{
    cancelGesture('game-invite');
    const url=new URL(location.href);url.hash='';url.search='';
    $('invite-link').value=url.href;
    $('invite-message').textContent='';
    $('invite-share').hidden=typeof navigator.share!=='function';
    inviteDialog.showModal();
  });
  $('invite-close').addEventListener('click',()=>inviteDialog.close());
  $('invite-link').addEventListener('click',event=>event.target.select());
  $('invite-copy').addEventListener('click',async()=>{
    try{
      if(!navigator.clipboard?.writeText)throw new Error('unsupported');
      await navigator.clipboard.writeText($('invite-link').value);
      $('invite-message').textContent='ゲームのリンクをコピーしました。友だちに送ってみよう。';
    }catch{
      $('invite-link').focus();$('invite-link').select();
      $('invite-message').textContent='コピーできませんでした。上のリンクを選んで、手動でコピーできます。';
    }
  });
  $('invite-share').addEventListener('click',async()=>{
    try{
      await navigator.share({title:'ごみシュート',text:'缶ひとつ、箱ひとつ。ひと投げしてみよう。',url:$('invite-link').value});
      $('invite-message').textContent='共有先にゲームのリンクを渡しました。';
    }catch(error){
      $('invite-message').textContent=error.name==='AbortError'?'共有を取り消しました。リンクはここからコピーできます。':'共有できませんでした。リンクをコピーして渡せます。';
    }
  });
}

function updateControlLabels(aim=null){
  const values={...controls,...aim};
  $('power-value').textContent=values.power.toFixed(2).replace(/0$/,'');
  $('elevation-value').textContent=`${values.elevation}°`;
  $('yaw-value').textContent=values.yaw===0?'まっすぐ':`${values.yaw<0?'左':'右'} ${Math.abs(values.yaw)}°`;
  for(const id of ['power','elevation','yaw']){const input=$(id);input.value=values[id];const progress=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100;input.style.setProperty('--fill',`${progress}%`);}
}
function updateHint(){
  canvas.dataset.mode=view.mode;canvas.dataset.dragging=String(Boolean(view.gesture));
  $('mode-throw').setAttribute('aria-pressed',String(view.mode==='throw'));
  $('mode-observe').setAttribute('aria-pressed',String(view.mode==='observe'));
  $('cancel-gesture').hidden=!view.gesture||view.gesture.kind!=='throw';
  if(view.gesture?.temporaryObserve){
    $('interaction-hint').textContent='右ボタンを押したままドラッグで見回す。離すと元の操作へ。';
    $('input-detail').textContent='短い右クリックで見回す／手投げを切り替え。';
  }else if(view.mode==='observe'){
    $('interaction-hint').textContent='ドラッグで見回す。缶も箱も、別の角度から。';
    $('input-detail').textContent='ホイールでズーム。右クリックで手投げに戻ります。';
  }else if(busy()){
    $('interaction-hint').textContent='缶の行方を見届けよう。右クリック／「見回す」で視点を変えられます。';
    $('input-detail').textContent='投球が落ち着いたら、もう一投。';
  }else if(view.gesture){
    const aim=view.gesture.aim;
    const outsideEmbeddedMouse=view.gesture.pointerType==='mouse'&&window.self!==window.top&&!inside({clientX:view.gesture.lastX,clientY:view.gesture.lastY},view.gesture.rect);
    $('interaction-hint').textContent=aim.valid?(outsideEmbeddedMouse?'外で離したら、カーソルを画面へ戻すと一投。Esc で取消。':'離すと一投。取り消しは Esc または下のボタン。'):'もう少し上へ動かすと、投げられます。';
    $('input-detail').textContent=`強さ ${aim.power.toFixed(1)} · ${aim.yaw===0?'箱へまっすぐ':`${aim.yaw<0?'左':'右'} ${Math.abs(aim.yaw)}°`} · 角度 ${controls.elevation}°`;
  }else{
    $('interaction-hint').textContent='上へドラッグ／スワイプして、離すと一投。';
    $('input-detail').textContent=`長く動かすほど強く。ホイール上で高い弧（${controls.elevation}°）。右ドラッグで見回す。短い右クリックで切替。`;
  }
  canvas.setAttribute('aria-label',view.mode==='observe'?'缶と箱を観察する立体画面。ドラッグか矢印キーでカメラ回転。ホイールかプラスとマイナスでズーム。右クリックで手投げに切替。':'缶を投げる立体画面。上へドラッグまたはスワイプして離すと一投。左右は箱方向を基準。ホイール上で投球の角度が上がります。右ドラッグで見回す。短い右クリックで切替。数値で投げるボタンも使えます。');
}
function updateScoreSummary(){
  const rate=$('success-rate');
  if(rate)rate.textContent=game.attempts?`${Math.round(game.successes/game.attempts*100)}%`:'—';
  const summary=$('live-shot-summary');
  if(!summary)return;
  summary.dataset.phase=game.phase;
  const titles={ready:game.attempts?'次の一投を構えています':'まだ投げていません',flying:'飛んでいます…',settling:'箱の中で落ち着くのを待っています…',success:'成功！ 箱に入りました',miss:'今回は入りませんでした'};
  $('live-shot-result').textContent=titles[game.phase]||titles.ready;
  const roles=$('live-shot-roles');roles.replaceChildren();roles.hidden=true;
  let detail={ready:'上へドラッグして、離すと一投。',flying:'缶の行方を見届けよう。',settling:'成功は、箱の中で落ち着いてから。',miss:'向きや強さを変えて、もう一投。'}[game.phase]||'';
  const result=analytics.snapshot().result;
  if(game.phase==='success'&&result?.success){
    for(const role of result.roles){const chip=document.createElement('span');chip.className='shot-role-chip';chip.textContent=role.label;roles.append(chip);}
    roles.hidden=!result.roles.length;
    detail=result.roles.some(role=>role.id==='direct')?'床・ふち・側面で跳ね返らず、そのまま箱へ。':`入るまでの跳ね返り：外の床 ${result.floorBounces} 回 · ふち ${result.rimHits} 回 · 側面 ${result.sideHits} 回。`;
  }
  $('live-shot-detail').textContent=detail;
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
  updateScoreSummary();
  updateStageUI();
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
  wheelAnglePixels=0;
  const gesture=view.gesture;
  if(!gesture)return;
  view.gesture=null;cancellations++;lastInput={type:'cancel',reason};
  $('gesture-feedback').hidden=true;
  if(canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
  updateControlLabels();
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
for(const id of ['power','elevation','yaw'])$(id).addEventListener('input',()=>{const value=Number($(id).value);cancelGesture('numeric-change');controls[id]=value;updateControlLabels();updateHint();});
for(const id of ['distance','height'])$(id).addEventListener('change',()=>{
  if(busy()||stageProgress.snapshot().id!=='free'){$('distance').value=String(game.bin.center.z);$('height').value=String(game.bin.height);return;}
  cancelGesture('setup-change');clearCurrentShot();setSetup(game,{distance:Number($('distance').value),height:Number($('height').value)});updateUI(true);
});
function selectStage(id){
  if(busy()||!STAGES[id])return false;
  if(stageProgress.snapshot().id==='free')freeSetup={distance:game.bin.center.z,height:game.bin.height};
  cancelGesture('stage-change');pointers.clear();clearCurrentShot();stageProgress.select(id);
  const setup=id==='free'?freeSetup:STAGES[id];setSetup(game,setup);
  $('distance').value=String(setup.distance);$('height').value=String(setup.height);
  if(id!=='free'){Object.assign(controls,{power:setup.power,elevation:setup.elevation,yaw:setup.yaw});renderer.resetCamera();}
  updateControlLabels();updateUI(true);return true;
}
if($('stage-select')){
  $('stage-select').addEventListener('change',()=>{if(!selectStage($('stage-select').value))$('stage-select').value=stageProgress.snapshot().id;});
  $('start-tutorial').addEventListener('click',()=>selectStage('tutorial'));
  $('stage-next').addEventListener('click',()=>{if(stageProgress.snapshot().id==='tutorial'&&stageProgress.snapshot().completed.includes('tutorial'))selectStage('first');});
  $('stage-retry').addEventListener('click',()=>selectStage(stageProgress.snapshot().id));
}
function updateStageUI(){
  const state=stageProgress.snapshot();
  if(state.id!=='free')for(const id of ['distance','height'])$(id).disabled=true;
  if(!$('stage-select'))return;
  $('stage-select').value=state.id;$('stage-select').disabled=busy();$('start-tutorial').disabled=busy();
  $('tutorial-card').hidden=state.id!=='tutorial';
  const clear=state.completed.includes(state.id);
  $('stage-progress').textContent=state.id==='free'?'自由投球 · プレイ記録は累積':`${clear?'クリア済み · ':''}この挑戦 ${state.successes} 成功 / ${state.attempts} 投 · 箱に1回入れよう`;
  $('stage-message').textContent=busy()?'投球が落ち着いたら、ステージを変えられます。':state.id==='tutorial'&&clear?'できた！ 次は、いつものゴミ箱へ。':state.id==='first'&&clear?'クリア！ 同じ箱でもう一投、自由投球にも戻れます。':game.phase==='miss'&&state.id!=='free'?'向きや強さを変えて、もう一投。':'';
  $('stage-next').hidden=state.id!=='tutorial'||!clear;$('stage-next').disabled=busy();
  $('stage-retry').hidden=state.id==='free';$('stage-retry').disabled=busy();
}
function fire(source='numeric'){
  cancelGesture('other-throw');
  const accepted=throwCan(game,controls);
  if(accepted){stageProgress.launch(game.attempts);clearCurrentShot();shotRecorder=createRecorder(getSnapshot(game),controls,renderer.cameraSnapshot());lastInput={type:'throw',source,parameters:{...controls}};previousTime=performance.now();updateUI(true);if(source!=='gesture')canvas.scrollIntoView({block:'center',behavior:'instant'});}
  return accepted;
}
$('throw-button').addEventListener('click',()=>fire());
$('reset-button').addEventListener('click',()=>{cancelGesture('reset');if(resetShot(game)){clearCurrentShot();updateUI(true);}});
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
  updateControlLabels(gesture.aim);
  updateHint();
}
document.addEventListener('pointerdown',event=>{if(view.gesture?.releasedCapture)cancelGesture('lostpointercapture');pointers.add(event.pointerId);if(pointers.size>1)cancelGesture('second-pointer');},true);
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,event=>{
  pointers.delete(event.pointerId);
  if(type==='pointercancel')cancelGesture('pointercancel');
  else if(view.gesture?.releasedCapture&&view.gesture.id===event.pointerId)cancelGesture('lostpointercapture');
},true);
document.addEventListener('pointermove',event=>{
  const gesture=view.gesture;if(!gesture?.releasedCapture||gesture.id!==event.pointerId)return;
  if(event.isTrusted&&event.pointerType==='mouse'&&event.buttons===0&&pointers.size===0&&document.hasFocus()&&!document.hidden){
    releaseGesture(gesture,gesture.aim);
  }else cancelGesture('lostpointercapture');
},true);
canvas.addEventListener('pointerdown',event=>{
  if(event.button===2&&event.pointerType==='mouse'){
    event.preventDefault();cancelGesture('right-button');canvas.focus({preventScroll:true});
    const rect=canvas.getBoundingClientRect();
    view.gesture={kind:'observe',temporaryObserve:true,id:event.pointerId,pointerType:event.pointerType,rect,viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,started:performance.now(),moved:false};
    canvas.setPointerCapture(event.pointerId);updateHint();return;
  }
  if(event.button!==0||pointers.size!==1||view.gesture||(view.mode==='throw'&&busy()))return;
  const rect=canvas.getBoundingClientRect();
  if(!inside(event,rect))return;
  event.preventDefault();canvas.focus({preventScroll:true});
  view.gesture={kind:view.mode,id:event.pointerId,pointerType:event.pointerType,rect,viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY};
  if(view.mode==='throw')view.gesture.aim=gestureAim(view.gesture,event);
  canvas.setPointerCapture(event.pointerId);updateHint();
});
// Context menus fire on press or release depending on the OS. Only the
// right-button release owns the click toggle; menus never toggle modes.
canvas.addEventListener('contextmenu',event=>{
  event.preventDefault();
  if(view.gesture?.kind==='throw')cancelGesture('right-button-chord');
});
function finishRightObserve(event){
  const gesture=view.gesture;
  if(event.button!==2||!gesture?.temporaryObserve)return;
  event.preventDefault();
  const toggle=!gesture.moved&&Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)<5&&performance.now()-gesture.started<500;
  view.gesture=null;
  if(canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
  if(toggle)view.mode=view.mode==='throw'?'observe':'throw';
  updateHint();
}
document.addEventListener('mouseup',finishRightObserve,true);
canvas.addEventListener('pointermove',event=>{
  const gesture=view.gesture;if(!gesture||gesture.id!==event.pointerId)return;
  event.preventDefault();
  if(gesture.kind==='throw'&&(event.buttons&2)){cancelGesture('right-button-chord');return;}
  if(gesture.temporaryObserve&&Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)>=5)gesture.moved=true;
  if(!sameLayout(gesture)){cancelGesture('layout-change');return;}
  // A throw owns its pointer from the canvas press through release. A fast
  // swipe may finish beyond the canvas; leaving its edge is not cancellation.
  if(gesture.kind!=='throw'&&!inside(event,gesture.rect)){cancelGesture('outside-canvas');return;}
  if(gesture.kind==='observe')renderer.orbit(-(event.clientX-gesture.lastX)/gesture.rect.width*3.6,(event.clientY-gesture.lastY)/gesture.rect.height*2.4);
  else{gesture.aim=gestureAim(gesture,event);showGesture(gesture,event);}
  gesture.lastX=event.clientX;gesture.lastY=event.clientY;
});
function releaseGesture(gesture,aim){
  const accepted=aim?.valid&&sameLayout(gesture)&&!busy();
  view.gesture=null;wheelAnglePixels=0;$('gesture-feedback').hidden=true;
  if(canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
  if(accepted){controls.power=aim.power;controls.yaw=aim.yaw;updateControlLabels();fire('gesture');}
  else{if(gesture.kind==='throw'){lastInput={type:'cancel',reason:'short-or-invalid-release'};cancellations++;}updateControlLabels();updateHint();}
}
canvas.addEventListener('pointerup',event=>{
  const gesture=view.gesture;if(!gesture||gesture.id!==event.pointerId)return;
  event.preventDefault();
  if(gesture.temporaryObserve){finishRightObserve(event);return;}
  if(gesture.releasedCapture){cancelGesture('lostpointercapture');return;}
  releaseGesture(gesture,gesture.kind==='throw'?gestureAim(gesture,event):null);
});
canvas.addEventListener('lostpointercapture',event=>{
  const gesture=view.gesture;
  // A cross-site iframe can miss mouse pointerup outside its border, then
  // receive capture loss on return with the real released button state.
  // Wait for a button-free move: loss followed by pointerup can instead be
  // capture being released while held and flushed by that next pointerup.
  const released=event.isTrusted&&event.pointerType==='mouse'&&event.buttons===0;
  if(released)pointers.delete(event.pointerId);
  if(released&&gesture?.id===event.pointerId&&gesture.kind==='throw'&&pointers.size===0&&document.hasFocus()&&!document.hidden){
    gesture.releasedCapture=true;
  }else cancelGesture('lostpointercapture');
});
$('cancel-gesture').addEventListener('click',()=>cancelGesture('cancel-button'));
function editingInput(target){return target instanceof HTMLElement&&(target.matches('input,select,textarea')||target.isContentEditable);}
document.addEventListener('focusin',event=>{if(editingInput(event.target))cancelGesture('input-focus');});
canvas.addEventListener('wheel',event=>{
  // Preserve browser zoom and focused form editing. Outside the canvas there
  // is no listener, so ordinary page scrolling keeps its native behavior.
  if(event.ctrlKey||event.metaKey||event.altKey||editingInput(document.activeElement))return;
  if(!Number.isFinite(event.deltaY)||event.deltaY===0)return;
  const unit=event.deltaMode===0?1:event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:0;
  const delta=event.deltaY*unit;
  if(!Number.isFinite(delta)||!delta)return;
  event.preventDefault();
  if(pointers.size>1){wheelAnglePixels=0;return;}
  if(view.gesture?.temporaryObserve){renderer.zoom(Math.exp(clamp(delta,-100,100)*.002));return;}
  if(view.mode==='observe'){cancelGesture('wheel');renderer.zoom(Math.exp(clamp(delta,-100,100)*.002));return;}
  if(busy()){wheelAnglePixels=0;return;}
  if(view.gesture&&!sameLayout(view.gesture)){cancelGesture('layout-change');return;}
  // Accumulate small trackpad deltas without rounding each event to a jump.
  wheelAnglePixels-=delta;
  const degrees=Math.trunc(wheelAnglePixels/24);
  wheelAnglePixels-=degrees*24;
  controls.elevation=clamp(controls.elevation+degrees,15,75);
  if((controls.elevation===75&&wheelAnglePixels>0)||(controls.elevation===15&&wheelAnglePixels<0))wheelAnglePixels=0;
  updateControlLabels(view.gesture?.aim);updateHint();
},{passive:false});
document.addEventListener('keydown',event=>{
  if($('replay-dialog').open)return;
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
document.addEventListener('visibilitychange',()=>{cancelGesture('visibility-change');pointers.clear();previousTime=performance.now();if(document.hidden&&videoState){stopVideo(true);replayMessage('画面を離れたため動画の作成を取り消しました。',true,'VIDEO_CANCELLED');}});

// Replays are detached recorded poses, rendered on their own canvas. They never
// call throwCan or stepGame and never alter the live play record.
let shotRecorder=null,lastReplay=null,savedReplays=[],viewedReplay=null,replayPlayer=null,replayTime=0,replayPlaying=false,replaySource='',replayDrag=null,videoState=null,videoBlob=null,videoName='';
const replayDialog=$('replay-dialog'),replayCanvas=$('replay-scene'),replayRenderer=createRenderer(replayCanvas),linkCache=new Map();
function replayMessage(text,viewer=false,code=''){
  const element=$(viewer?'replay-view-message':'replay-message');element.textContent=text;element.dataset.errorCode=code;
}
function roleText(replay){return replay.result.roles.map(role=>role.label).join(' · ');}
function clearCurrentShot(){shotRecorder=null;lastReplay=null;$('shot-result').hidden=true;$('shot-roles').textContent='';$('shot-role-detail').textContent='';$('share-controls').hidden=true;$('share-link').value='';replayMessage('');}
function captureShot(){
  if(!shotRecorder)return;
  try{
    const snapshot=getSnapshot(game);shotRecorder.record(snapshot);
    if(snapshot.phase!=='success'&&snapshot.phase!=='miss')return;
    const result=analytics.snapshot().result;lastReplay=shotRecorder.finish(snapshot,result||{});shotRecorder=null;
    if(!lastReplay)return;
    $('shot-roles').textContent=roleText(lastReplay);
    $('shot-role-detail').textContent=`最後に入るまでの跳ね返り。外の床 ${lastReplay.result.floorBounces} 回 · ふち ${lastReplay.result.rimHits} 回 · 側面 ${lastReplay.result.sideHits} 回。箱の底での反発は床の回数に含めません。`;
    $('shot-result').hidden=false;prepareReplayLink(lastReplay);
  }catch(error){shotRecorder=null;replayMessage('この一投のリプレイを作成できませんでした。',false,error.code||'RECORD_FAILED');}
}
function storage(){try{return window.localStorage;}catch{return null;}}
function refreshSaved(){
  const result=loadReplays(storage());savedReplays=result.replays;renderSaved();
  if(!result.ok)replayMessage('このブラウザの保存したリプレイを読み込めませんでした。',false,result.error?.code||'STORAGE_UNAVAILABLE');
  else if(result.discarded)replayMessage('開けない保存記録を除いて読み込みました。');
}
function renderSaved(){
  $('saved-replays').replaceChildren();$('saved-empty').hidden=savedReplays.length>0;
  for(const replay of savedReplays){
    const row=document.createElement('li'),label=document.createElement('span'),play=document.createElement('button'),remove=document.createElement('button');
    label.textContent=`${roleText(replay)} · ${replay.duration.toFixed(2)} 秒`;play.textContent='再生';remove.textContent='削除';play.type=remove.type='button';play.dataset.replayId=remove.dataset.replayId=replay.id;
    play.addEventListener('click',()=>openReplay(replay,'saved'));
    remove.addEventListener('click',()=>{const result=deleteReplay(storage(),replay.id);if(result.ok){savedReplays=result.replays;renderSaved();replayMessage('保存記録を削除しました。');}else replayMessage('保存記録を削除できませんでした。',false,result.error?.code||'STORAGE_FAILED');});
    row.append(label,play,remove);$('saved-replays').append(row);
  }
}
function persistReplay(replay,viewer=false){
  if(!replay)return;
  const result=saveReplay(storage(),replay);
  if(result.ok){savedReplays=result.replays;renderSaved();replayMessage('このブラウザに保存しました。再読み込み後も再生できます。',viewer);}
  else replayMessage('保存できませんでした。ファイルで保存できます。',viewer,result.error?.code||'STORAGE_FAILED');
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function downloadReplay(replay,viewer=false){
  if(!replay)return;
  try{downloadBlob(new Blob([replayToJSON(replay)],{type:'application/json'}),`trash-shot-${replay.id}.json`);replayMessage('リプレイのファイルを用意しました。ダウンロード先で保存を確認してください。',viewer);}catch(error){replayMessage('リプレイのファイルを作成できませんでした。',viewer,error.code||'DOWNLOAD_FAILED');}
}
function prepareReplayLink(replay){
  if(!linkCache.has(replay.id)){
    const promise=buildReplayURL(replay,location.href).then(url=>({url}),error=>({error}));linkCache.set(replay.id,promise);
    if(linkCache.size>8)linkCache.delete(linkCache.keys().next().value);
  }
  return linkCache.get(replay.id);
}
async function copyLink(url,viewer=false){
  try{if(!navigator.clipboard?.writeText)throw new Error('unsupported');await navigator.clipboard.writeText(url);replayMessage('リプレイのリンクをコピーしました。',viewer);}
  catch{replayMessage('リンクをコピーできませんでした。表示したリンクを選んでコピーできます。',viewer,'CLIPBOARD_UNAVAILABLE');}
}
async function shareReplay(replay,viewer=false){
  if(!replay)return;
  const result=await prepareReplayLink(replay);
  if(result.error){replayMessage(result.error.code==='SHARE_TOO_LARGE'?'この一投のリンクは長すぎます。リプレイのファイルで共有できます。':'このブラウザでは共有リンクを作れません。リプレイのファイルを使えます。',viewer,result.error.code);return;}
  $('share-controls').hidden=false;$('share-link').value=result.url;
  if(viewer){$('replay-share-controls').hidden=false;$('replay-share-link').value=result.url;}
  if(navigator.share){
    try{await navigator.share({title:'ごみシュートの成功リプレイ',text:roleText(replay),url:result.url});replayMessage('共有先にリンクを渡しました。投稿の完了は共有先で確認してください。',viewer);}
    catch(error){replayMessage(error.name==='AbortError'?'共有を取り消しました。リンクやファイルも使えます。':'共有先を開けませんでした。リンクやファイルも使えます。',viewer,error.name==='AbortError'?'SHARE_CANCELLED':'SHARE_FAILED');}
  }else await copyLink(result.url,viewer);
}
$('copy-replay-link').addEventListener('click',()=>copyLink($('share-link').value));
$('copy-viewed-replay-link').addEventListener('click',()=>copyLink($('replay-share-link').value,true));
$('replay-last').addEventListener('click',()=>lastReplay&&openReplay(lastReplay,'latest'));
$('save-replay').addEventListener('click',()=>persistReplay(lastReplay));
$('share-replay').addEventListener('click',()=>shareReplay(lastReplay));
$('download-replay').addEventListener('click',()=>downloadReplay(lastReplay));
$('save-viewed-replay').addEventListener('click',()=>persistReplay(viewedReplay,true));
$('share-viewed-replay').addEventListener('click',()=>shareReplay(viewedReplay,true));
$('download-viewed-replay').addEventListener('click',()=>downloadReplay(viewedReplay,true));
function restoreReplayCamera(){replayRenderer.resetCamera();replayRenderer.orbit(viewedReplay.camera.azimuth-.581,viewedReplay.camera.elevation-.42);replayRenderer.zoom(viewedReplay.camera.zoom);}
function openReplay(input,source){
  if(busy()){replayMessage('投球が落ち着いてからリプレイを開けます。');return;}
  try{
    const replay=validateReplay(input);cancelGesture('replay-open');stopVideo(true);videoBlob=null;videoName='';$('save-replay-video').disabled=$('share-replay-video').disabled=true;
    viewedReplay=replay;replayPlayer=createReplayPlayer(replay);replayTime=0;replayPlaying=true;replaySource=source;replayDrag=null;
    $('replay-title').textContent=source==='shared'?'共有された成功リプレイ':'成功した一投';
    $('replay-source').textContent=source==='shared'||source==='file'?'受け取った記録を再生しています。':'記録した動きを、別の視点から。';
    $('replay-role-title').textContent=roleText(replay);$('replay-seek').max=replay.duration;$('replay-share-controls').hidden=true;$('replay-share-link').value='';replayMessage('',true);
    if(!replayDialog.open)replayDialog.showModal();replayRenderer.resize();restoreReplayCamera();prepareReplayLink(replay);renderReplay(0);replayCanvas.focus({preventScroll:true});
  }catch(error){replayMessage('このリプレイを開けませんでした。',false,error.code||'INVALID_REPLAY');}
}
function closeReplay(){stopVideo(true);replayPlaying=false;replayDrag=null;if(replayDialog.open)replayDialog.close();}
$('replay-close').addEventListener('click',closeReplay);
replayDialog.addEventListener('cancel',event=>{event.preventDefault();closeReplay();});
$('replay-play').addEventListener('click',()=>{if(videoState){replayMessage('動画の作成中は再生を止められません。閉じると取り消せます。',true);return;}if(replayTime>=replayPlayer.duration)replayTime=0;replayPlaying=!replayPlaying;renderReplay(0);});
$('replay-restart').addEventListener('click',()=>{if(videoState)return;replayTime=0;replayPlaying=true;renderReplay(0);});
$('replay-camera-reset').addEventListener('click',()=>viewedReplay&&restoreReplayCamera());
$('replay-seek').addEventListener('input',()=>{if(videoState)return;replayPlaying=false;const value=Number($('replay-seek').value);replayTime=value>=replayPlayer.duration-1e-9?replayPlayer.duration:clamp(value,0,replayPlayer.duration);renderReplay(0);});
function renderReplay(dt){
  if(!replayDialog.open||!replayPlayer)return;
  if(replayPlaying){replayTime=Math.min(replayPlayer.duration,replayTime+dt);if(replayTime>=replayPlayer.duration)replayPlaying=false;}
  replayRenderer.render(replayPlayer.sample(replayTime),viewedReplay.controls,{prediction:false});
  $('replay-play').textContent=replayPlaying?'一時停止':replayTime>=replayPlayer.duration?'もう一度':'再生';
  $('replay-seek').value=replayTime;$('replay-time').textContent=`${replayTime.toFixed(2)} / ${replayPlayer.duration.toFixed(2)} 秒`;
  if(videoState&&!replayPlaying&&videoState.recorder.state==='recording'&&!videoState.stopping){const state=videoState;state.stopping=true;setTimeout(()=>{if(videoState===state)stopVideo(false);},180);}
}
new ResizeObserver(()=>replayRenderer.resize()).observe(replayCanvas);
replayCanvas.addEventListener('contextmenu',event=>event.preventDefault());
replayCanvas.addEventListener('pointerdown',event=>{if(event.button!==0||pointers.size!==1)return;event.preventDefault();replayCanvas.focus({preventScroll:true});replayDrag={id:event.pointerId,x:event.clientX,y:event.clientY};replayCanvas.setPointerCapture(event.pointerId);});
replayCanvas.addEventListener('pointermove',event=>{if(!replayDrag||replayDrag.id!==event.pointerId)return;if(pointers.size>1){replayDrag=null;return;}event.preventDefault();const rect=replayCanvas.getBoundingClientRect();replayRenderer.orbit(-(event.clientX-replayDrag.x)/rect.width*3.6,(event.clientY-replayDrag.y)/rect.height*2.4);replayDrag.x=event.clientX;replayDrag.y=event.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])replayCanvas.addEventListener(type,()=>{replayDrag=null;});
replayCanvas.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey||!Number.isFinite(event.deltaY))return;event.preventDefault();const unit=event.deltaMode===1?16:event.deltaMode===2?replayCanvas.clientHeight:1;replayRenderer.zoom(Math.exp(clamp(event.deltaY*unit,-100,100)*.002));},{passive:false});
replayCanvas.addEventListener('keydown',event=>{const turns={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]};if(turns[event.code]){event.preventDefault();replayRenderer.orbit(...turns[event.code]);}else if(['+','=','-'].includes(event.key)){event.preventDefault();replayRenderer.zoom(event.key==='-'?1.14:.88);}else if(event.code==='Space'){event.preventDefault();$('replay-play').click();}});
$('replay-file').addEventListener('change',async()=>{const file=$('replay-file').files[0];$('replay-file').value='';if(!file)return;try{if(file.size>180*1024)throw Object.assign(new Error(),{code:'REPLAY_TOO_LARGE'});openReplay(parseReplayJSON(await file.text()),'file');}catch(error){replayMessage('リプレイのファイルを開けません。形式や大きさを確認してください。',false,error.code||'INVALID_REPLAY');}});
function cleanupVideo(state){clearTimeout(state.deadline);state.stream.getTracks().forEach(track=>track.stop());if(videoState===state){videoState=null;$('record-replay-video').disabled=false;$('replay-seek').disabled=false;}}
function stopVideo(cancelled){if(!videoState)return;const state=videoState;state.cancelled ||= cancelled;if(state.recorder.state!=='inactive')try{state.recorder.stop();}catch{cleanupVideo(state);replayMessage('動画の作成を中断しました。',true,'VIDEO_FAILED');}}
function recordVideo(){
  if(!viewedReplay||videoState)return;
  if(!globalThis.MediaRecorder||!replayCanvas.captureStream){replayMessage('このブラウザはリプレイの動画作成に対応していません。リンクやリプレイのファイルを使えます。',true,'VIDEO_UNSUPPORTED');return;}
  let stream,recorder,mime;
  try{
    stream=replayCanvas.captureStream(30);
    for(const candidate of ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']){if(!MediaRecorder.isTypeSupported(candidate))continue;try{recorder=new MediaRecorder(stream,{mimeType:candidate,videoBitsPerSecond:2000000});mime=candidate;break;}catch{}}
    if(!recorder)throw new Error('unsupported');
    const state={recorder,stream,mime,chunks:[],bytes:0,cancelled:false,stopping:false,deadline:null,replayId:viewedReplay.id};videoState=state;videoBlob=null;$('save-replay-video').disabled=$('share-replay-video').disabled=true;$('record-replay-video').disabled=true;$('replay-seek').disabled=true;
    recorder.addEventListener('dataavailable',event=>{if(!event.data.size)return;state.bytes+=event.data.size;if(state.bytes>12*1024*1024){state.cancelled=true;replayMessage('動画が大きすぎるため作成を取り消しました。',true,'VIDEO_TOO_LARGE');stopVideo(true);}else state.chunks.push(event.data);});
    recorder.addEventListener('error',()=>{state.cancelled=true;replayMessage('動画を作成できませんでした。',true,'VIDEO_FAILED');stopVideo(true);});
    recorder.addEventListener('stop',()=>{const current=videoState===state;cleanupVideo(state);if(!current||state.cancelled||!state.chunks.length)return;videoBlob=new Blob(state.chunks,{type:recorder.mimeType||mime});const mp4=videoBlob.type.includes('mp4');videoName=`trash-shot-${state.replayId}.${mp4?'mp4':'webm'}`;$('save-replay-video').disabled=$('share-replay-video').disabled=false;replayMessage(`動画を作成しました（${mp4?'MP4':'WebM'}）。対応する共有先で使えます。`,true);});
    replayTime=0;replayPlaying=true;renderReplay(0);recorder.start(200);state.deadline=setTimeout(()=>{if(videoState===state){state.cancelled=true;replayMessage('動画の作成が終わらないため取り消しました。',true,'VIDEO_TIMEOUT');stopVideo(true);}},12000);replayMessage('リプレイを動画にしています。見回しも録画に含まれます。閉じると取り消せます。',true);
  }catch{if(videoState?.recorder===recorder)cleanupVideo(videoState);else stream?.getTracks().forEach(track=>track.stop());$('record-replay-video').disabled=false;$('replay-seek').disabled=false;replayMessage('このブラウザでは動画を作成できません。',true,'VIDEO_UNSUPPORTED');}
}
$('record-replay-video').addEventListener('click',recordVideo);
$('save-replay-video').addEventListener('click',()=>{if(videoBlob)downloadBlob(videoBlob,videoName);});
$('share-replay-video').addEventListener('click',async()=>{if(!videoBlob)return;try{const file=new File([videoBlob],videoName,{type:videoBlob.type});if(!navigator.share||!navigator.canShare?.({files:[file]})){replayMessage('この共有先では動画を渡せません。「動画を保存」から使えます。',true,'VIDEO_SHARE_UNSUPPORTED');return;}await navigator.share({files:[file],title:'ごみシュートの一投'});replayMessage('共有先に動画を渡しました。投稿の完了は共有先で確認してください。',true);}catch(error){replayMessage(error.name==='AbortError'?'動画の共有を取り消しました。':'動画を共有できませんでした。',true,error.name==='AbortError'?'SHARE_CANCELLED':'SHARE_FAILED');}});
refreshSaved();
let sharedImportTicket=0;
async function loadSharedReplay(){
  const ticket=++sharedImportTicket,hash=location.hash;
  if(!/^#tsr\d+\./.test(hash))return;
  if(replayDialog.open)closeReplay();
  viewedReplay=null;replayPlayer=null;replayTime=0;replaySource='';$('replay-role-title').textContent='';replayMessage('');
  try{const replay=await decodeReplay(hash);if(ticket===sharedImportTicket&&location.hash===hash)openReplay(replay,'shared');}
  catch(error){if(ticket===sharedImportTicket&&location.hash===hash)replayMessage('共有されたリプレイを開けません。リンクが欠けているか、未対応の形式です。',false,error.code||'INVALID_REPLAY');}
}
window.addEventListener('hashchange',loadSharedReplay);
loadSharedReplay();
window.__trashShot={game,controls,stageSnapshot:()=>stageProgress.snapshot(),snapshot:()=>getSnapshot(game),cameraSnapshot:()=>renderer.cameraSnapshot(),inputSnapshot:()=>({mode:view.mode,prediction:view.prediction,activeGesture:view.gesture?.kind||null,activePointers:pointers.size,cancellations,lastInput:lastInput?structuredClone(lastInput):null}),analyticsSnapshot:()=>analytics.snapshot(),replaySnapshot:()=>({active:replayDialog.open,playing:replayPlaying,time:replayTime,duration:replayPlayer?.duration||0,sourceId:viewedReplay?.id||null,sourceType:replaySource,recordedFrames:viewedReplay?.frames.length||0,current:replayPlayer?structuredClone(replayPlayer.sample(replayTime)):null,result:viewedReplay?structuredClone(viewedReplay.result):null,savedCount:savedReplays.length,latestId:lastReplay?.id||null,recording:Boolean(videoState),video:videoBlob?{size:videoBlob.size,mime:videoBlob.type}:null})};
updateControlLabels();updateUI(true);

// Diagnosis observes input only after an explicit opt-in. The game's input
// handlers above remain independent of the record and its copy controls.
function setupInputCheck(){
  const [entry,panel,copy,close,text,message]=['input-check-open','input-check-panel','input-check-copy','input-check-close','input-check-text','input-check-message'].map($);
  // A new app can be loaded by an older cached HTML page without these nodes.
  if(![entry,panel,copy,close,text,message].every(Boolean))return;
  const version='20261010-stages-1',limit=24,maxBytes=12000;
  let session=null,removeListeners=[];
  const clone=value=>value?(typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))):null;
  const geometry=()=>{
    const rect=canvas.getBoundingClientRect();
    return {canvas:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY,scale:window.visualViewport?.scale??null}};
  };
  const state=event=>{
    const gesture=view.gesture;
    return {mode:view.mode,phase:game.phase,attempts:game.attempts,busy:busy(),pointers:pointers.size,gesture:gesture?.kind??null,pointerId:gesture?.id??null,pendingRelease:Boolean(gesture?.releasedCapture),heldAim:clone(gesture?.aim),releaseAim:gesture?.kind==='throw'&&event?.type==='pointerup'?gestureAim(gesture,event):null,layout:gesture?sameLayout(gesture):null,cancellations,lastInput:clone(lastInput),focus:document.hasFocus(),hidden:document.hidden};
  };
  function append(event,stage){
    if(!session)return;
    const pointer=event instanceof PointerEvent;
    if(pointer&&event.target!==canvas&&!view.gesture&&!session.pointerIds.has(event.pointerId))return;
    if(pointer&&stage==='capture')session.pointerIds.add(event.pointerId);
    if(stage==='capture'||stage==='after')session.counts[event.type]=(session.counts[event.type]||0)+1;
    const snapshot=state(event),record={ms:Math.round(performance.now()-session.started),type:event.type,stage,trusted:event.isTrusted,target:event.target===canvas?'scene':event.target===window?'window':event.target===document?'document':'outside-scene',state:snapshot};
    if(pointer)Object.assign(record,{id:event.pointerId,pointerType:event.pointerType,button:event.button,buttons:event.buttons,x:Math.round(event.clientX*10)/10,y:Math.round(event.clientY*10)/10,prevented:event.defaultPrevented});
    if(event.type==='pointerdown'&&stage==='capture'){session.lossBefore=null;session.lastReleaseBefore=null;}
    if(stage==='capture'&&snapshot.gesture&&(event.type==='pointerup'||event.type==='lostpointercapture'))record.gestureGeometry={canvas:{x:view.gesture.rect.left,y:view.gesture.rect.top,width:view.gesture.rect.width,height:view.gesture.rect.height},viewport:clone(view.gesture.viewport)};
    if(event.type==='lostpointercapture'&&stage==='capture'&&snapshot.gesture){session.lossBefore=record;session.lastReleaseBefore=record;}
    if(event.type==='pointerup'&&stage==='capture')session.lastReleaseBefore=snapshot.gesture?record:session.lossBefore?.id===event.pointerId?session.lossBefore:record;
    // The existing document capture handler can finish a pending release
    // before this observer runs. Preserve the actually observed loss stage.
    if(event.type==='pointermove'&&snapshot.attempts>session.lastAttempts&&session.lossBefore?.id===event.pointerId)session.lastReleaseBefore=session.lossBefore;
    if(event.type==='keydown'&&event.code!=='Escape')return;
    if(event.type==='wheel')Object.assign(record,{deltaY:event.deltaY,deltaMode:event.deltaMode,ctrl:event.ctrlKey});
    if(event.type==='error'||event.type==='unhandledrejection'){
      const name=(event.error||event.reason)?.name;
      const names=['Error','TypeError','ReferenceError','SyntaxError','RangeError','URIError','EvalError','AggregateError','AbortError','NotAllowedError','SecurityError','NotSupportedError','InvalidStateError','DataError','OperationError','QuotaExceededError'];
      let modulePath=null;
      try{const url=new URL(event.filename);if(url.origin===location.origin&&/\.m?js$/.test(url.pathname))modulePath=url.pathname.slice(0,512);}catch{}
      record.failure={name:names.includes(name)?name:'Error',modulePath,line:Number.isFinite(event.lineno)?event.lineno:null,column:Number.isFinite(event.colno)?event.colno:null};
      session.lastRuntimeError=record;
    }
    if(view.gesture&&event.type==='pointerdown'&&stage==='bubble')session.gestureStart={ms:record.ms,pointerType:event.pointerType,id:view.gesture.id,start:{x:view.gesture.startX,y:view.gesture.startY},geometry:geometry(),state:snapshot};
    if(event.type==='pointerup'||(snapshot.attempts>session.lastAttempts))session.lastRelease=record;
    if(snapshot.cancellations>session.lastCancellations)session.lastCancellation=record;
    session.lastAttempts=snapshot.attempts;session.lastCancellations=snapshot.cancellations;
    session.events.push(record);
    if(session.events.length>limit){session.events.shift();session.dropped++;}
    if(pointer&&stage==='bubble'&&!view.gesture&&pointers.size===0){session.pointerIds.clear();session.lossBefore=null;}
  }
  function listen(target,type,handler,capture=false){
    target.addEventListener(type,handler,{capture,passive:true});
    removeListeners.push(()=>target.removeEventListener(type,handler,capture));
  }
  function open(){
    if(session)return;
    session={started:performance.now(),entryBefore:state(),entryGeometry:geometry(),events:[],counts:{},pointerIds:new Set(),dropped:0,gestureStart:null,lastReleaseBefore:null,lossBefore:null,lastRelease:null,lastCancellation:null,lastRuntimeError:null,lastAttempts:game.attempts,lastCancellations:cancellations};
    panel.hidden=false;entry.setAttribute('aria-expanded','true');text.hidden=true;text.value='';message.textContent='一度投げてから「記録をコピー」を押してください。';
    for(const type of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture']){
      listen(document,type,event=>append(event,'capture'),true);
      listen(document,type,event=>append(event,'bubble'));
    }
    for(const type of ['keydown','focusin','click','contextmenu','wheel'])listen(document,type,event=>{
      if(type==='keydown'&&event.code!=='Escape')return;
      if(type==='click'&&(!event.target.closest?.('.scene-toolbar,.camera-controls,.control-card')&&event.target!==$('cancel-gesture')))return;
      if(type==='wheel'&&event.target!==canvas)return;
      append(event,'after');
    });
    for(const type of ['resize','blur','scroll','error','unhandledrejection'])listen(window,type,event=>append(event,'after'));
    listen(document,'visibilitychange',event=>append(event,'after'));
  }
  function stop(){
    for(const remove of removeListeners)remove();
    removeListeners=[];session=null;panel.hidden=true;entry.setAttribute('aria-expanded','false');text.value='';text.hidden=true;message.textContent='';
  }
  function report(){
    const data={format:'trash-shot-input-check-1',version,childURL:(location.origin+location.pathname).slice(0,1024),embedded:window.self!==window.top,userAgent:navigator.userAgent.slice(0,320),platform:navigator.platform.slice(0,80),elapsedMs:Math.round(performance.now()-session.started),entryBeforeExistingState:session.entryBefore,entryGeometry:session.entryGeometry,gestureStart:session.gestureStart,lastReleaseBefore:session.lastReleaseBefore,lastRelease:session.lastRelease,lastCancellation:session.lastCancellation,lastRuntimeError:session.lastRuntimeError,nativeEventCounts:session.counts,droppedEvents:session.dropped,finalState:state(),finalGeometry:geometry(),events:[...session.events],ordering:'capture: after existing document capture handlers; bubble/after: after game handlers',scope:'Opt-in child-frame events only; no parent events or physical-device proof.'};
    let result=JSON.stringify(data,null,2);
    while(new TextEncoder().encode(result).length>maxBytes&&data.events.length){data.events.shift();data.droppedEvents++;result=JSON.stringify(data,null,2);}
    return result;
  }
  entry.addEventListener('click',open);
  close.addEventListener('click',stop);
  copy.addEventListener('click',async()=>{
    if(!session)return;
    const startedSession=session;
    text.value=report();
    try{
      if(!navigator.clipboard?.writeText)throw new Error('unsupported');
      await navigator.clipboard.writeText(text.value);
      if(session===startedSession)message.textContent='記録をコピーしました。この会話へ貼ってください。';
    }catch{
      if(session!==startedSession)return;
      text.hidden=false;text.focus();text.select();
      message.textContent='コピーが使えないため、記録をすべて選択しました。手動でコピーして、この会話へ貼ってください。';
    }
  });
  if(new URLSearchParams(location.search).get('input-debug')==='1')open();
}
setupInputCheck();

function frame(now){
  const dt=Math.max(0,Math.min((now-previousTime)/1000,.045));previousTime=now;
  stepGame(game,dt);captureShot();updateUI();renderer.render(game,controls,{prediction:view.prediction,aim:view.gesture?.kind==='throw'?{...controls,...view.gesture.aim}:null});
  renderReplay(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
