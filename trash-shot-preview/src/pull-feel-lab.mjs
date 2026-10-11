// All reused simulation modules share the production query and ESM instance.
import {createGame, setRoomWorld, throwCan, resetShot, getSnapshot} from './physics.mjs?v=20261011-play-ui-1';
import {createRenderer} from './render.mjs?v=20261011-play-ui-1';
import {roomWorld} from './room-course.mjs?v=20261011-play-ui-1';
import {PULL_FEEL} from './pull-feel.mjs?v=20261011-pull-feel-1';
import {createPullScale,mapScaledPull} from './pull-scale.mjs?v=20261011-room-contact-1';
import {createRoomContactStepper, predictRoomContactArc} from './room-contact.mjs?v=20261011-room-contact-1';
import {roomSolidColliders} from './room-solids.mjs?v=20261011-room-contact-1';
import {projectCueSegments,projectCuePolygon,cueDirectionPoint} from './pull-cue.mjs?v=20261011-room-contact-1';

const $ = id => document.getElementById(id), canvas = $('lab-scene'), overlay = $('lab-overlay');
const game = createGame(), world = roomWorld('first', 2), renderer = createRenderer(canvas);
setRoomWorld(game, 2); renderer.setWorldView(world); renderer.resetCamera();
const contactStepper=createRoomContactStepper(world),predictionCache=new Map(),predictionSeconds=1.5;
const sideSolids=roomSolidColliders(world).filter(c=>c.min.x<=game.can.radius&&c.max.x>=-game.can.radius);
let predictionComputations=0,cueSnapshot={visible:false,reason:'not-aiming',segments:0},sideRoomSnapshot={visible:false};
const controls = {...world.launch}, pointers = new Set(), names = {A:'抵抗なし', B:'ゴムの手応え', C:'ゴム ＋ 力み'};
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
  return mapScaledPull({scale:g.scale,right:g.startX-g.lastX,up:g.lastY-g.startY,
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
  $('instruction').textContent=projection==='2d'?'左下へ引いて、向きで角度、長さで強さ。離すと一投。':'下へ引くと奥へ、左へ引くと右へ。見回しても奥・左右は部屋基準。右ボタン保持＋ドラッグで見回し、ホイール／弧−＋で角度。';
  $('status').textContent=busy()?'缶の行方を見届けよう。':gesture?.kind==='observe'?'ドラッグで見回し。':gesture?.scale&&!gesture.scale.ready?gesture.scale.reasonText:observing?'ドラッグで見回し。「見回す」を戻すとシュート。':projection==='2d'?'左下へ引っぱって離す。':'下へ引っぱって離す。';
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
  if(kind==='throw'&&game.phase!=='ready'){resetShot(game);contactStepper.reset();}
  event.preventDefault(); canvas.focus({preventScroll:true});
  const rect=canvas.getBoundingClientRect();
  gesture={id:event.pointerId,kind,pointerType:event.pointerType,button:event.button,rect,
    viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,
    lastX:event.clientX,lastY:event.clientY,started:performance.now(),aim:null,presentationTime:0,
    scale:kind==='throw'?createPullScale({rect,startX:event.clientX,startY:event.clientY,projection,stagePower:world.launch.power,projectileProfile:{id:'can',radius:game.can.radius}}):null};
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
      contactStepper.reset();
      lastThrow={mode,projection,aim:structuredClone(aim),parameters:{...aim.actual},attempt:game.attempts,
        presentedAim:{...aim.actual},releasedAim:{...aim.actual},visibleAtRelease,initialVelocity:{...game.can.velocity},presentedElapsedSeconds:(g.presentationTime-g.started)/1000,
        visiblePrediction:structuredClone(cueSnapshot.prediction??[]),scale:structuredClone(g.scale)};
      previousTime=performance.now();
      $('result').textContent=`${mode} · ${aim.risk>0?'力み域':'安定域'}で離した。実際の向き ${projection==='2d'?`${aim.actual.elevation.toFixed(1)}°`:`左右 ${aim.actual.yaw.toFixed(1)}°`}、強さ ${aim.actual.power.toFixed(2)}。`;
    }
  } else if(g.kind==='throw') {cancellations++;lastCancellation='short-or-invalid-release';$('result').textContent=!g.scale.ready?g.scale.reasonText:projection==='2d'?'向き調整中でした。左下へもう少し引いて離すと投げられます。':'向き調整中でした。もう少し下へ引いて離すと投げられます。';}
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
function directionPoint(aim){return cueDirectionPoint(world.origin,aim);}
function predictionFor(parameters) {
  const key=`${parameters.power}|${parameters.elevation}|${parameters.yaw}`;
  if(predictionCache.has(key)){const value=predictionCache.get(key);predictionCache.delete(key);predictionCache.set(key,value);return value;}
  const value=predictRoomContactArc(game,parameters,world,{sampleEvery:1/60,maxSeconds:predictionSeconds});
  predictionComputations++;predictionCache.set(key,value);
  if(predictionCache.size>96)predictionCache.delete(predictionCache.keys().next().value);
  return value;
}
function segmentPath(segments){return segments.map(s=>`M ${svgPoint(s.from)} L ${svgPoint(s.to)}`).join(' ');}
function labelPosition(anchor,rect,width=134,height=22) {
  const obstacles=[...document.querySelectorAll('.scene-label,.force-panel,#cancel-pull')].filter(e=>!e.hidden).map(e=>{
    const r=e.getBoundingClientRect();return {x:r.left-rect.left,y:r.top-rect.top,width:r.width,height:r.height};
  });
  const candidates=[[anchor.x+8,anchor.y-28],[anchor.x-width-8,anchor.y-28],[anchor.x+8,anchor.y+8],[anchor.x-width-8,anchor.y+8]];
  for(const [cx,cy] of candidates){const x=clamp(cx,5,Math.max(5,rect.width-width-5)),y=clamp(cy,5,Math.max(5,rect.height-height-5));
    if(!obstacles.some(r=>x<r.x+r.width+3&&x+width>r.x-3&&y<r.y+r.height+3&&y+height>r.y-3))return {x,y,width,height};
  }
  return null;
}
function roomSectionMarkup(rect) {
  if(projection!=='2d'){sideRoomSnapshot={visible:false};return '';}
  const r=world.room,project=point=>renderer.project(point),path=points=>projectCueSegments(points,project,rect.width,rect.height),at=(y,z)=>({x:0,y,z});
  const front=path([at(0,r.minZ),at(r.height,r.minZ)]),back=path([at(0,r.maxZ),at(r.height,r.maxZ)]),ceiling=path([at(r.height,r.minZ),at(r.height,r.maxZ)]);
  let html=`<g data-cue="room-section"><path d="${segmentPath([...front.segments,...back.segments,...ceiling.segments])}" fill="none" stroke="#829a86" stroke-width="2"/>`;
  let furnitureSegments=0;
  for(const c of sideSolids){const shape=path([at(c.min.y,c.min.z),at(c.max.y,c.min.z),at(c.max.y,c.max.z),at(c.min.y,c.max.z),at(c.min.y,c.min.z)]);furnitureSegments+=shape.segments.length;
    html+=`<path data-solid="${c.id}" d="${segmentPath(shape.segments)}" fill="none" stroke="#9b9478" stroke-width="1.2"/>`;
  }
  for(const [text,z,lines] of [['手前の壁',r.minZ,front],['奥の壁',r.maxZ,back]]){
    const p=project(at(r.height*.62,z)),outside=p.x<0||p.x>rect.width,label=outside?(p.x<0?`← ${text}`:`${text} →`):text;
    const x=clamp(p.x+(p.x<rect.width/2?7:-69),7,Math.max(7,rect.width-84)),y=clamp(p.y,24,rect.height-24);
    html+=`<text x="${x}" y="${y}" font-size="10" fill="#637c69">${label}</text>`;
  }
  const deskLabel=project(at(world.sourceDesk.topY-.13,world.sourceDesk.center.z));
  if(deskLabel.x>=0&&deskLabel.x<rect.width&&deskLabel.y>=0&&deskLabel.y<rect.height)html+=`<text x="${deskLabel.x+5}" y="${deskLabel.y}" font-size="10" fill="#80775d">机</text>`;
  html+='</g>';sideRoomSnapshot={visible:true,solids:sideSolids.length,furnitureSegments,frontSegments:front.segments.length,backSegments:back.segments.length,ceilingSegments:ceiling.segments.length};
  return html;
}
function paintCue(aim) {
  const rect=canvas.getBoundingClientRect();overlay.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  const roomSection=roomSectionMarkup(rect);
  if(!aim||busy()){overlay.innerHTML=roomSection;cueSnapshot={visible:false,reason:busy()?'flying':'not-aiming',segments:0};$('cue-feedback').textContent='矢印は向きと強さ、青い破線は中心、橙の点線は直後の弾道。';return;}
  const origin=renderer.project(world.origin),base=directionPoint(aim.base),actual=directionPoint(aim.actual);
  const low=directionPoint({...aim.base,...(projection==='2d'?{elevation:clamp(aim.base.elevation-aim.riskAmplitude,5,85)}:{yaw:clamp(aim.base.yaw-aim.riskAmplitude,-60,60)})});
  const high=directionPoint({...aim.base,...(projection==='2d'?{elevation:clamp(aim.base.elevation+aim.riskAmplitude,5,85)}:{yaw:clamp(aim.base.yaw+aim.riskAmplitude,-60,60)})});
  const project=point=>renderer.project(point),projectPath=points=>projectCueSegments(points,project,rect.width,rect.height);
  const nominal=projectPath([world.origin,base]),initial=projectPath([world.origin,actual]),prediction=predictionFor(aim.actual),arc=projectPath(prediction);
  const anglePoints=Array.from({length:13},(_,index)=>directionPoint({...aim.actual,elevation:aim.actual.elevation*index/12})),angleArc=projectPath(anglePoints),angleSector=projectCuePolygon([world.origin,...anglePoints],project,rect.width,rect.height),flat=projectPath([world.origin,anglePoints[0]]);
  const wedge=[origin,project(low),project(high)],wedgeVisible=wedge.every(p=>p.visible&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=rect.width&&p.y>=0&&p.y<=rect.height);
  let html=roomSection+(angleSector.length>=3?`<path data-cue="angle-fan" d="M ${angleSector.map(svgPoint).join(' L ')} Z" fill="#daad4b2e"/>`:'');
  html+=`<path data-cue="angle-arc" d="${segmentPath(angleArc.segments)}" fill="none" stroke="#c49942" stroke-width="1.4"/><path data-cue="angle-flat" d="${segmentPath(flat.segments)}" fill="none" stroke="#8f997ba6" stroke-width="1"/>`;
  html+=wedgeVisible&&aim.riskAmplitude>0?`<path d="M ${wedge.map(svgPoint).join(' L ')} Z" fill="#e982382c" stroke="#e9823870" stroke-width="1"/>`:'';
  html+=`<path data-cue="prediction" d="${segmentPath(arc.segments)}" fill="none" stroke="#fffaf0" stroke-width="5" stroke-linecap="round"/><path data-cue="prediction-line" d="${segmentPath(arc.segments)}" fill="none" stroke="#b56b2e" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round"/><path data-cue="center" d="${segmentPath(nominal.segments)}" fill="none" stroke="#438f88" stroke-width="2" stroke-dasharray="4 4"/><path data-cue="initial" d="${segmentPath(initial.segments)}" fill="none" stroke="#b56b2e" stroke-width="3" stroke-linecap="round"/>`;
  const tip=initial.segments.at(-1)?.to;
  if(tip&&initial.length>=8){const from=initial.segments.at(-1).from,angle=Math.atan2(tip.y-from.y,tip.x-from.x),wing=7;
    const left={x:tip.x-Math.cos(angle)*wing+Math.sin(angle)*4,y:tip.y-Math.sin(angle)*wing-Math.cos(angle)*4},right={x:tip.x-Math.cos(angle)*wing-Math.sin(angle)*4,y:tip.y-Math.sin(angle)*wing+Math.cos(angle)*4};
    html+=`<path data-cue="arrowhead" d="M ${svgPoint(tip)} L ${svgPoint(left)} L ${svgPoint(right)} Z" fill="#b56b2e"/>`;
  }
  const anchor=initial.length>=12?tip:arc.segments.find(s=>Math.hypot(s.to.x-origin.x,s.to.y-origin.y)>24)?.to;
  const label=anchor&&labelPosition(anchor,rect),side=aim.actual.yaw<0?'左':'右';
  if(label)html+=`<g data-cue="angle-label"><rect x="${label.x}" y="${label.y}" width="${label.width}" height="${label.height}" rx="4" fill="#fffaf0ee"/><text x="${label.x+6}" y="${label.y+15}" font-size="12" fill="#365f5a">弧 ${aim.actual.elevation.toFixed(1)}° · ${side} ${Math.abs(aim.actual.yaw).toFixed(1)}°</text></g>`;
  cueSnapshot={visible:arc.segments.length>0||initial.segments.length>0,throwReady:aim.valid,reason:arc.segments.length===0?'outside-view':initial.length<12?'foreshortened':'visible',segments:arc.segments.length,
    initialLength:initial.length,arrowWorldLength:aim.actual.power*.1,angleFan:{visible:angleSector.length>=3||angleArc.segments.length>0,segments:angleArc.segments.length,length:angleArc.length},parameters:{...aim.actual},prediction,previewSeconds:predictionSeconds,predictionComputations,cacheEntries:predictionCache.size};
  $('cue-feedback').textContent=gesture?.scale&&!gesture.scale.ready?gesture.scale.reasonText:!aim.valid?(projection==='2d'?'向き調整中 · 左下へもう少し引くと投げられます。':'向き調整中 · もう少し下へ引くと投げられます。'):cueSnapshot.reason==='outside-view'?'狙いが視野外です。「視点を戻す」で缶と弾道を見られます。':cueSnapshot.reason==='foreshortened'?'今の視点では飛び出す向きが短く見えます。点線が実際の弾道です。':'矢印は向きと強さ、青い破線は中心、橙の点線は直後の弾道。';
  if(gesture?.kind==='throw') {
    const g=gesture,size=g.scale.ready?g.scale.size:1,ox=g.startX-g.rect.left,oy=g.startY-g.rect.top;
    const right=g.startX-g.lastX,up=g.lastY-g.startY;
    const angle=projection==='2d'?aim.actual.elevation*Math.PI/180:Math.atan2(up,right);
    const length=projection==='2d'?aim.effectiveDistance*size:Math.hypot(right,aim.effectiveDistance*size);
    const tx=projection==='2d'?ox-Math.cos(angle)*length:ox-right-aim.delta.yaw/60*(g.scale.yawSize??size);
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
  $('force-state').textContent=gesture?.scale&&!gesture.scale.ready?'引く余白不足':risk>0?'力み · 戻すと安定':d>PULL_FEEL.softStart&&mode!=='A'?'ゴム抵抗':'安定';
  const a=aim?.actual??controls,b=aim?.base??controls;
  const scale=gesture?.scale;
  $('diagnostic').textContent=`指の引っぱり ${d.toFixed(3)} / 抵抗後 ${(aim?.effectiveDistance??0).toFixed(3)}\n強さ ${a.power.toFixed(2)} · 中心 左右 ${b.yaw.toFixed(1)}° / 弧 ${b.elevation.toFixed(1)}°\n実際 左右 ${a.yaw.toFixed(1)}° / 弧 ${a.elevation.toFixed(1)}° · 揺れ幅 ${(aim?.riskAmplitude??0).toFixed(1)}°${scale?.ready?`\n今回の引く長さ ${(aim?.physicalDistance??0).toFixed(1)}px · ふだん ${scale.normalPx.toFixed(1)}px / ゴム ${scale.softPx.toFixed(1)}px / 力み ${scale.riskPx.toFixed(1)}px`:''}`;
}
let lastPhase=game.phase;
function present(aim,now=performance.now()){
  // The SVG owns the direction arrow in both projections. The established
  // renderer also uses a flight path for room cutaways; supply the same
  // contact-resolved path rather than implying travel through solid furniture.
  const roomPath=aim?predictionFor(aim.actual):busy()?lastThrow?.visiblePrediction??[]:[];
  renderer.render(game,aim?.actual??controls,{environment:'room',world,windArc:roomPath,prediction:false,angleCue:projection==='3d'&&!aim&&now<cueUntil,aim:null,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches});
  paintCue(aim);updateForce(aim);if(aim)$('arc-value').textContent=`${aim.actual.elevation.toFixed(1)}°`;
}
function frame(now){
  const dt=Math.min(.1,Math.max(0,(now-previousTime)/1000));previousTime=now;
  if(busy())contactStepper.step(game,dt);
  if(game.phase!==lastPhase){lastPhase=game.phase;updateUI();if(game.phase==='success'||game.phase==='miss')$('result').textContent=`${game.phase==='success'?'入った！':'もう一投。'} ${lastThrow?.mode??mode} · ${lastThrow?.aim.risk>0?'力み域':'安定域'}で離した · 強さ ${lastThrow?.parameters.power.toFixed(2)??'—'} · ${projection==='2d'?'弧':'左右'} ${Number(projection==='2d'?lastThrow?.parameters.elevation:lastThrow?.parameters.yaw).toFixed(1)}°。${contactStepper.snapshot().contactCount?'壁・家具で跳ね返った。':''} 同じ引っぱりを別の方式でも比べてみよう。`;}
  let aim=null;if(gesture?.kind==='throw'){gesture.presentationTime=now;aim=gesture.aim=aimAt(gesture,now);}
  present(aim,now);
  requestAnimationFrame(frame);
}
Object.defineProperty(window,'__pullFeelLab',{value:Object.freeze({
  snapshot:()=>structuredClone({mode,projection,observing,busy:busy(),worldVersion:2,prediction:'room-contact-short-arc',predictionSeconds,
    originScreen:renderer.project(world.origin),availableScale:gesture?.scale??null,gesture:gesture?{kind:gesture.kind,id:gesture.id,start:{x:gesture.startX-gesture.rect.left,y:gesture.startY-gesture.rect.top},scale:gesture.scale,aim:gesture.aim}:null,activePointers:pointers.size,cancellations,lastCancellation,lastThrow,controls,game:getSnapshot(game),cue:cueSnapshot,roomSection:sideRoomSnapshot,roomContacts:contactStepper.snapshot()}),
  cameraSnapshot:()=>structuredClone(renderer.cameraSnapshot()),
  parameters:()=>({...PULL_FEEL}),
}),writable:false,configurable:false});
updateUI();requestAnimationFrame(frame);
