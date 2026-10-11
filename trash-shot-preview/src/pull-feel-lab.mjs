// All reused simulation modules share the production query and ESM instance.
import {createGame, setRoomWorld, throwCan, resetShot, stepGame, getSnapshot} from './physics.mjs?v=20261011-play-ui-1';
import {createRenderer} from './render.mjs?v=20261011-play-ui-1';
import {roomWorld} from './room-course.mjs?v=20261011-play-ui-1';
import {pullAim, PULL_FEEL} from './pull-feel.mjs?v=20261011-pull-feel-1';

const $ = id => document.getElementById(id), canvas = $('lab-scene'), overlay = $('lab-overlay');
const game = createGame(), world = roomWorld('first', 2), renderer = createRenderer(canvas);
setRoomWorld(game, 2); renderer.setWorldView(world); renderer.resetCamera();
const controls = {...world.launch}, pointers = new Set(), names = {A:'いまの引っぱり', B:'ゴムの手応え', C:'ゴム ＋ 力み'};
let mode = 'C', projection = '3d', observing = false, gesture = null, lastThrow = null, cancellations = 0,
  lastCancellation = null, previousTime = performance.now(), wheelPixels = 0, cueUntil = 0;
const busy = () => game.phase === 'flying' || game.phase === 'settling';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const inside = (event, rect) => event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
function sameLayout(g) {
  const r = canvas.getBoundingClientRect();
  return g.viewport.width === innerWidth && g.viewport.height === innerHeight &&
    r.width === g.rect.width && r.height === g.rect.height && r.left === g.rect.left && r.top === g.rect.top;
}
function aimAt(g, now) {
  return pullAim({right: g.startX-g.lastX, up: g.lastY-g.startY, size:Math.max(1, Math.min(g.rect.width,g.rect.height)),
    mode, projection, elevation:controls.elevation, elapsedSeconds:(now-g.started)/1000});
}
function releaseCapture(g) { if (g && canvas.hasPointerCapture(g.id)) canvas.releasePointerCapture(g.id); }
function cancel(reason) {
  if (!gesture) return;
  const g = gesture; gesture = null; cancellations++; lastCancellation = reason;
  releaseCapture(g); wheelPixels = 0; $('cancel-pull').hidden = true; updateUI();
}
function changeArc(amount) {
  if (busy() || projection === '2d') return;
  cancel('angle-control'); controls.elevation = clamp(controls.elevation+amount,15,75);
  cueUntil = performance.now()+1800; updateUI();
}
function updateUI() {
  canvas.closest('.scene-wrap').dataset.projection=projection;
  $('mode-label').textContent = `${mode} · ${names[mode]}`;
  for (const b of document.querySelectorAll('[data-feel]')) { b.setAttribute('aria-pressed',String(b.dataset.feel===mode)); b.disabled=busy(); }
  $('projection').disabled=busy(); $('projection').setAttribute('aria-pressed',String(projection==='2d'));
  $('projection').textContent=projection==='2d'?'3Dで比べる':'2Dで比べる';
  $('observe').setAttribute('aria-pressed',String(observing)); $('observe').disabled=projection==='2d';
  for (const id of ['arc-up','arc-down']) $(id).disabled=busy()||projection==='2d';
  $('arc-value').textContent=`${Math.round((gesture?.aim?.actual.elevation??controls.elevation)*10)/10}°`;
  $('cancel-pull').hidden=gesture?.kind!=='throw';
  canvas.dataset.observe=String(observing||gesture?.kind==='observe');
  $('instruction').textContent=projection==='2d'?'左下へ引いて、向きで角度、長さで強さ。離すと一投。':'下へ引いて、離すと一投。右ボタン保持＋ドラッグで見回し。ホイール／弧−＋で角度。';
  $('status').textContent=busy()?'缶の行方を見届けよう。':gesture?.kind==='observe'?'ドラッグで見回し。':observing?'ドラッグで見回し。「見回す」を戻すとシュート。':projection==='2d'?'画面の右上寄りから、左下へ引っぱって離す。':'画面の上寄りから、下へ引っぱって離す。';
}
document.addEventListener('pointerdown', event => {
  pointers.add(event.pointerId);
  if (pointers.size>1) cancel('second-pointer');
},true);
for (const type of ['pointerup','pointercancel']) document.addEventListener(type,event=>pointers.delete(event.pointerId),true);
canvas.addEventListener('pointerdown',event=>{
  if(gesture?.kind==='throw'&&event.button===2){cancel('right-button-chord');return;}
  if (pointers.size!==1||gesture||!['mouse','touch','pen'].includes(event.pointerType)) return;
  if (event.button!==0&&event.button!==2) return;
  const kind=(event.button===2||observing)?'observe':'throw';
  if (kind==='throw'&&busy()||kind==='observe'&&projection==='2d') return;
  if(kind==='throw'&&game.phase!=='ready')resetShot(game);
  event.preventDefault(); canvas.focus({preventScroll:true});
  const rect=canvas.getBoundingClientRect();
  gesture={id:event.pointerId,kind,pointerType:event.pointerType,button:event.button,rect,
    viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,
    lastX:event.clientX,lastY:event.clientY,started:performance.now(),aim:null,presentationTime:0};
  if(kind==='throw') {gesture.presentationTime=gesture.started;gesture.aim=aimAt(gesture,gesture.presentationTime);present(gesture.aim);}
  canvas.setPointerCapture(event.pointerId); updateUI();
});
canvas.addEventListener('pointermove',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id)return;
  if(!sameLayout(g)){cancel('layout-change');return;}
  if(!inside(event,g.rect)){cancel('outside-canvas');return;}
  if(g.pointerType==='mouse'&&(g.kind==='throw'&&event.buttons!==1||g.kind==='observe'&&!(event.buttons&(g.button===2?2:1)))) {cancel('buttons-changed');return;}
  event.preventDefault();
  if(g.kind==='observe') renderer.orbit(-(event.clientX-g.lastX)/g.rect.width*3.6,(event.clientY-g.lastY)/g.rect.height*2.4);
  g.lastX=event.clientX;g.lastY=event.clientY;
  if(g.kind==='throw')g.aim=aimAt(g,performance.now());
});
canvas.addEventListener('pointerup',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id)return;
  event.preventDefault();
  if(event.button!==g.button||!sameLayout(g)||!inside(event,g.rect)||!document.hasFocus()||document.hidden){cancel('unsafe-release');return;}
  // Freeze the last visible phase. A final pointer coordinate change is painted
  // synchronously before launching, using that very same phase and actual aim.
  g.lastX=event.clientX;g.lastY=event.clientY;
  const aim=g.kind==='throw'?aimAt(g,g.presentationTime):null;
  if(aim){g.aim=aim;present(aim);}
  const visibleAtRelease=aim?{...aim.actual}:null;
  gesture=null;releaseCapture(g);$('cancel-pull').hidden=true;wheelPixels=0;
  if(aim?.valid&&!busy()) {
    Object.assign(controls,aim.actual);
    if(throwCan(game,aim.actual)) {
      lastThrow={mode,projection,aim:structuredClone(aim),parameters:{...aim.actual},attempt:game.attempts,
        presentedAim:{...aim.actual},releasedAim:{...aim.actual},visibleAtRelease,initialVelocity:{...game.can.velocity},presentedElapsedSeconds:(g.presentationTime-g.started)/1000};
      previousTime=performance.now();
      $('result').textContent=`${mode} · ${aim.risk>0?'力み域':'安定域'}で離した。実際の向き ${projection==='2d'?`${aim.actual.elevation.toFixed(1)}°`:`左右 ${aim.actual.yaw.toFixed(1)}°`}、強さ ${aim.actual.power.toFixed(2)}。`;
    }
  } else if(g.kind==='throw') {cancellations++;lastCancellation='short-or-invalid-release';}
  updateUI();
});
for(const type of ['pointercancel','lostpointercapture']) canvas.addEventListener(type,event=>{if(gesture?.id===event.pointerId)cancel(type);});
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('wheel',event=>{
  event.preventDefault();
  if(observing||gesture?.kind==='observe'){renderer.zoom(Math.exp(clamp(event.deltaY,-100,100)*.002));return;}
  if(busy()||projection==='2d')return;
  const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  wheelPixels+=clamp(pixels,-100,100);const degrees=Math.trunc(wheelPixels/20);
  if(degrees){wheelPixels-=degrees*20;controls.elevation=clamp(controls.elevation+degrees,15,75);cueUntil=performance.now()+1800;updateUI();}
},{passive:false});
window.addEventListener('blur',()=>{cancel('blur');pointers.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel('hidden');pointers.clear();}});
window.addEventListener('resize',()=>{cancel('resize');renderer.resize();});
window.addEventListener('scroll',()=>cancel('scroll'),{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){cancel('escape');pointers.clear();}});
$('cancel-pull').addEventListener('click',()=>cancel('cancel-button'));
$('arc-down').addEventListener('click',()=>changeArc(-3));$('arc-up').addEventListener('click',()=>changeArc(3));
$('observe').addEventListener('click',()=>{cancel('view-switch');observing=!observing;updateUI();});
$('reset-view').addEventListener('click',()=>{cancel('camera-reset');renderer.resetCamera();});
$('projection').addEventListener('click',()=>{
  if(busy())return;cancel('projection-switch');projection=projection==='3d'?'2d':'3d';observing=false;
  controls.elevation=48;controls.yaw=0;renderer.setProjection(projection==='2d'?'side':'perspective');renderer.resetCamera();updateUI();
});
for(const b of document.querySelectorAll('[data-feel]')) b.addEventListener('click',()=>{
  if(busy())return;cancel('feel-switch');mode=b.dataset.feel;controls.elevation=48;controls.yaw=0;updateUI();
});

const svgPoint=p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`;
function directionPoint(aim){const a=aim.elevation*Math.PI/180,y=aim.yaw*Math.PI/180;return renderer.project({x:world.origin.x+Math.sin(y)*Math.cos(a)*.66,y:world.origin.y+Math.sin(a)*.66,z:world.origin.z+Math.cos(y)*Math.cos(a)*.66});}
function paintCue(aim) {
  const rect=canvas.getBoundingClientRect();overlay.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  if(!aim||!aim.valid||busy()){overlay.innerHTML='';return;}
  const origin=renderer.project(world.origin),base=directionPoint(aim.base),actual=directionPoint(aim.actual);
  const low=directionPoint({...aim.base,...(projection==='2d'?{elevation:clamp(aim.base.elevation-aim.riskAmplitude,5,85)}:{yaw:clamp(aim.base.yaw-aim.riskAmplitude,-60,60)})});
  const high=directionPoint({...aim.base,...(projection==='2d'?{elevation:clamp(aim.base.elevation+aim.riskAmplitude,5,85)}:{yaw:clamp(aim.base.yaw+aim.riskAmplitude,-60,60)})});
  let html=`<path d="M ${svgPoint(origin)} L ${svgPoint(low)} L ${svgPoint(high)} Z" fill="#e982382c" stroke="#e9823870" stroke-width="1"/><line x1="${origin.x}" y1="${origin.y}" x2="${base.x}" y2="${base.y}" stroke="#438f88" stroke-width="2" stroke-dasharray="4 4"/><line x1="${origin.x}" y1="${origin.y}" x2="${actual.x}" y2="${actual.y}" stroke="#b56b2e" stroke-width="3"/><circle cx="${actual.x}" cy="${actual.y}" r="3.5" fill="#b56b2e"/>`;
  if(gesture?.kind==='throw') {
    const g=gesture,size=Math.min(g.rect.width,g.rect.height),ox=g.startX-g.rect.left,oy=g.startY-g.rect.top;
    const right=g.startX-g.lastX,up=g.lastY-g.startY;
    const angle=projection==='2d'?aim.actual.elevation*Math.PI/180:Math.atan2(up,right);
    const length=projection==='2d'?aim.effectiveDistance*size:Math.hypot(right,aim.effectiveDistance*size);
    const tx=projection==='2d'?ox-Math.cos(angle)*length:ox-right-aim.delta.yaw/60*size;
    const ty=projection==='2d'?oy+Math.sin(angle)*length:oy+aim.effectiveDistance*size;
    html+=`<line x1="${ox}" y1="${oy}" x2="${ox-right}" y2="${oy+up}" stroke="#438f8870" stroke-width="2" stroke-dasharray="3 5"/><line x1="${ox}" y1="${oy}" x2="${tx}" y2="${ty}" stroke="${aim.risk?'#e98238':'#438f88'}" stroke-width="4" stroke-linecap="round"/><circle cx="${ox}" cy="${oy}" r="5" fill="#fffaf0" stroke="#438f88" stroke-width="2"/><circle cx="${tx}" cy="${ty}" r="6" fill="${aim.risk?'#e98238':'#438f88'}"/>`;
  }
  overlay.innerHTML=html;
}
function updateForce(aim) {
  const d=aim?.rawDistance??0,percent=clamp(d/.70*100,0,100),risk=aim?.risk??0;
  $('force-fill').style.width=`${percent}%`;$('force-tip').style.left=`${percent}%`;
  // Wobble is the same released angular delta, not an unrelated random animation.
  $('force-tip').style.transform=`translateX(${(projection==='2d'?aim?.delta.elevation??0:aim?.delta.yaw??0)*2}px)`;
  document.querySelector('.force-panel').dataset.risk=String(risk>0);
  $('force-state').textContent=risk>0?'力み · 戻すと安定':d>PULL_FEEL.softStart&&mode!=='A'?'ゴム抵抗':'安定';
  const a=aim?.actual??controls,b=aim?.base??controls;
  $('diagnostic').textContent=`指の引っぱり ${d.toFixed(3)} / 抵抗後 ${(aim?.effectiveDistance??0).toFixed(3)}\n強さ ${a.power.toFixed(2)} · 中心 左右 ${b.yaw.toFixed(1)}° / 弧 ${b.elevation.toFixed(1)}°\n実際 左右 ${a.yaw.toFixed(1)}° / 弧 ${a.elevation.toFixed(1)}° · 揺れ幅 ${(aim?.riskAmplitude??0).toFixed(1)}°`;
}
let lastPhase=game.phase;
function present(aim,now=performance.now()){
  renderer.render(game,controls,{environment:'room',world,prediction:false,angleCue:projection==='3d'&&(Boolean(aim)||now<cueUntil),aim:aim?.valid?{...aim.actual,valid:true}:null,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches});
  paintCue(aim);updateForce(aim);if(aim)$('arc-value').textContent=`${aim.actual.elevation.toFixed(1)}°`;
}
function frame(now){
  const dt=Math.min(.1,Math.max(0,(now-previousTime)/1000));previousTime=now;
  if(busy())stepGame(game,dt);
  if(game.phase!==lastPhase){lastPhase=game.phase;updateUI();if(game.phase==='success'||game.phase==='miss')$('result').textContent=`${game.phase==='success'?'入った！':'もう一投。'} ${lastThrow?.mode??mode} · ${lastThrow?.aim.risk>0?'力み域':'安定域'}で離した · 強さ ${lastThrow?.parameters.power.toFixed(2)??'—'} · ${projection==='2d'?'弧':'左右'} ${Number(projection==='2d'?lastThrow?.parameters.elevation:lastThrow?.parameters.yaw).toFixed(1)}°。同じ引っぱりを別の方式でも比べてみよう。`;}
  let aim=null;if(gesture?.kind==='throw'){gesture.presentationTime=now;aim=gesture.aim=aimAt(gesture,now);}
  present(aim,now);
  requestAnimationFrame(frame);
}
Object.defineProperty(window,'__pullFeelLab',{value:Object.freeze({
  snapshot:()=>structuredClone({mode,projection,observing,busy:busy(),worldVersion:2,prediction:false,
    gesture:gesture?{kind:gesture.kind,id:gesture.id,aim:gesture.aim}:null,activePointers:pointers.size,cancellations,lastCancellation,lastThrow,controls,game:getSnapshot(game)}),
  cameraSnapshot:()=>structuredClone(renderer.cameraSnapshot()),
  parameters:()=>({...PULL_FEEL}),
}),writable:false,configurable:false});
updateUI();requestAnimationFrame(frame);
