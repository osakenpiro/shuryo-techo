import {createOnlineSession} from './online-session.mjs';
import {STAGES} from './stages.mjs?v=20261015-boar-distance-1';
import {canChooseStage,createChapterProgress} from './progress-save.mjs?v=20261015-boar-distance-1';
import {loadPlayerSave} from './player-save.mjs?v=20261015-boar-distance-1';
import {createRenderer} from './render.mjs?v=20261015-boar-distance-1';
import {createPullScale,mapScaledPull,screenPullBasis} from './pull-scale.mjs?v=20261015-boar-distance-1';
import {onlineCourseCue} from './online-course-cue.mjs';
import {onlineRenderPlan} from './online-render-schedule.mjs';
import {buildGoalCue,goalCueMarkup} from './goal-cue.mjs?v=20261015-boar-distance-1';

const $=id=>document.getElementById(id),views=new Map();
let session=null,current=null,gesture=null,connecting=false,lastPaint=0,previousPhase=null;
let aim={power:6.2,elevation:48,yaw:0};
let storage=null;try{storage=localStorage;}catch{}
const saved=loadPlayerSave(storage),progress=createChapterProgress(saved.progress??undefined).snapshot();
// The solo app's entry already offers every current course as practice. Online
// uses the same playable set; this never grants solo completion or item rewards.
const canHost=id=>!!STAGES[id]?.environment;
const progressing=document.createElement('optgroup'),detours=document.createElement('optgroup');progressing.label='進行中の面';detours.label='寄り道の面（練習）';
for(const [id,stage] of Object.entries(STAGES))if(canHost(id)){const option=document.createElement('option');option.value=id;option.textContent=stage.label;(canChooseStage(progress,id)?progressing:detours).append(option);}
$('online-stage').append(progressing,detours);
let invited='';try{invited=new URLSearchParams(location.hash.slice(1)).get('room')??'';}catch{}
if(invited)$('online-code').value=invited;
function status(text,error=false){$('online-status').textContent=text;$('online-status').dataset.error=String(error);}
const errors={full:'この部屋は4人でいっぱいです。',started:'もう始まっている部屋です。次の部屋で合流しよう。',version:'アプリの版が違います。みんなで更新してから集まろう。',identity:'この接続では参加できません。部屋に入り直してください。','host-left':'部屋をつくった人との接続が切れました。部屋を出て、もう一度集まろう。','shot-rejected':'今は投げられません。画面の状態を確認して、もう一投。','peer-unavailable':'部屋が見つかりません。コードと、友達が部屋を開いているか確認してね。','connection-timeout':'接続できませんでした。別の回線で試すか、部屋をつくり直してください。','network':'通信に接続できません。回線を確認してください。','signaling-disconnected':'接続サービスとの通信が切れました。対戦が続かない場合は、部屋を出て集まり直してね。'};
function createSession(){return createOnlineSession({PeerClass:window.Peer,canHost,onChange:renderState,onEvent:event=>{if(event.type==='accepted'&&event.shot.id===current?.selfId){aim={...event.shot.input};setAim();}},onError:reason=>{status(errors[reason]??'通信を続けられません。部屋を出て、もう一度集まろう。',true);if(session&&!session.snapshot().state){session.close();session=null;}}});}
async function connect(host){
 if(connecting||session)return;if(!navigator.onLine){status('オンライン対戦には通信が必要です。ひとり用はオフラインでも遊べます。',true);return;}connecting=true;$('online-create').disabled=true;$('online-join').disabled=true;status('友達の待つ場所へ、つないでいます…');
 try{session=createSession();if(host)await session.create($('online-stage').value,$('online-name').value);else await session.join($('online-code').value.trim(),$('online-name').value);}
 catch(error){session?.close();session=null;status(errors[error.message]??'接続できませんでした。回線とコードを確認してください。',true);}
 finally{connecting=false;$('online-create').disabled=false;$('online-join').disabled=false;}
}
$('online-create').addEventListener('click',()=>connect(true));$('online-join').addEventListener('click',()=>connect(false));
function leave(){history.replaceState(null,'',location.pathname+location.search);gesture=null;session?.close();session=null;current=null;previousPhase=null;for(const view of views.values())view.resizer?.disconnect();views.clear();$('online-grid').replaceChildren();$('online-lobby').hidden=false;$('online-room').hidden=true;$('online-leave').hidden=true;status('また、同じ一投を。新しい部屋に集まろう。');}
$('online-leave').addEventListener('click',leave);window.addEventListener('pagehide',()=>session?.close());
$('online-ready').addEventListener('click',()=>{const me=current?.state?.players.find(p=>p.id===current.selfId);session?.ready(!me?.ready);});
$('online-start').addEventListener('click',()=>session?.start());$('online-rematch').addEventListener('click',()=>session?.rematch());
$('online-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('online-link').value);status('招待リンクをコピーしました。');}catch{$('online-link').select();status('リンクを選択しました。コピーして友達に送れます。');}});
$('online-focus').addEventListener('click',()=>{const active=$('online-grid').classList.toggle('focus-self');$('online-focus').setAttribute('aria-pressed',String(active));$('online-focus').textContent=active?'4画面で見る':'自分を大きく';resizeViews();});
function activePlayer(){return current?.state?.players.find(p=>p.id===current.selfId);}
function mayThrow(){const p=activePlayer(),s=current?.state;return !!(current?.connected&&s?.phase==='running'&&session.hostNow()>=s.startsAt&&!p?.shot&&!p?.dnf&&p?.finishedAt===null&&!current.pendingShot);}
function setAim(){$('online-elevation').value=aim.elevation;$('online-arc-label').textContent=`弧 ${aim.elevation}°`;$('online-aim').textContent=`強さ ${aim.power.toFixed(2)} · 弧 ${aim.elevation}° · 左右 ${aim.yaw}°`;}
$('online-elevation').addEventListener('input',()=>{aim.elevation=Number($('online-elevation').value);setAim();});
function changeArc(delta){const slider=$('online-elevation');aim.elevation=Math.max(Number(slider.min),Math.min(Number(slider.max),aim.elevation+delta));setAim();}
$('online-arc-down').addEventListener('click',()=>changeArc(-2));$('online-arc-up').addEventListener('click',()=>changeArc(2));
function cancelPull(){const held=gesture;gesture=null;for(const view of views.values())view.guide?.setAttribute('hidden','');if(held?.view.canvas.hasPointerCapture(held.id))held.view.canvas.releasePointerCapture(held.id);}
function resizeViews(){cancelPull();for(const view of views.values())view.renderer?.resize();}
window.addEventListener('resize',resizeViews);window.addEventListener('blur',cancelPull);
function makeView(slot){
 const figure=document.createElement('figure');figure.className='player-view';figure.dataset.empty='true';
 const caption=document.createElement('figcaption'),name=document.createElement('span'),state=document.createElement('span');name.className='player-name';state.className='player-state';caption.append(name,state);
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',`プレイヤー${slot+1}の画面`);canvas.tabIndex=-1;
 const guide=document.createElementNS('http://www.w3.org/2000/svg','svg');guide.classList.add('pull-guide');guide.setAttribute('aria-hidden','true');guide.setAttribute('hidden','');
 const goalGuide=document.createElementNS('http://www.w3.org/2000/svg','svg');goalGuide.classList.add('goal-location');goalGuide.setAttribute('aria-hidden','true');goalGuide.setAttribute('hidden','');
 const line=document.createElementNS('http://www.w3.org/2000/svg','line'),dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','9');guide.append(line,dot);
 const empty=document.createElement('span');empty.className='empty-note';empty.textContent='友達を待っています';figure.append(caption,canvas,guide,goalGuide,empty);$('online-grid').append(figure);
 const view={figure,name,state,canvas,empty,guide,goalGuide,goalUntil:0,renderer:null,id:null,lastDraw:-Infinity};views.set(slot,view);
 view.resizer=new ResizeObserver(()=>{
  const r=canvas.getBoundingClientRect();if(!view.renderer||Math.abs(r.width-(view.layoutWidth??0))<.1&&Math.abs(r.height-(view.layoutHeight??0))<.1)return;
  if(gesture?.view===view)cancelPull();view.renderer.resize();view.layoutWidth=r.width;view.layoutHeight=r.height;
 });view.resizer.observe(canvas);
 canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0||figure.dataset.self!=='true'||!mayThrow()||gesture)return;
  event.preventDefault();canvas.focus({preventScroll:true});const course=session.course(current.selfId);course.prepareForAim();
  view.renderer.render(course.game,aim,course.view(current.state.startsAt===null?0:Math.max(0,(session.hostNow()-current.state.startsAt)/1000)));
  const rect=canvas.getBoundingClientRect();
  view.goalUntil=performance.now()+1800;
  gesture={id:event.pointerId,view,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,rect,
   scale:createPullScale({rect,startX:event.clientX,startY:event.clientY,stagePower:course.world.launch?.power??STAGES[current.state.stageId].power,projectileProfile:{id:'can',radius:course.game.can.radius}}),
   basis:screenPullBasis({...course.world.origin,y:course.game.can.position.y},view.renderer.project),baseAim:{...aim},started:performance.now(),aim:null};
  canvas.setPointerCapture(event.pointerId);
  guide.style.top=canvas.offsetTop+'px';guide.style.height=rect.height+'px';guide.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);guide.removeAttribute('hidden');
  for(const [k,v] of Object.entries({x1:event.clientX-rect.left,y1:event.clientY-rect.top,x2:event.clientX-rect.left,y2:event.clientY-rect.top}))line.setAttribute(k,v);
  dot.setAttribute('cx',event.clientX-rect.left);dot.setAttribute('cy',event.clientY-rect.top);
 });
 function mapGesture(event,time=performance.now()){const g=gesture;if(!g||g.id!==event.pointerId)return null;g.lastX=event.clientX;g.lastY=event.clientY;
  const result=mapScaledPull({scale:g.scale,right:g.startX-event.clientX,up:event.clientY-g.startY,elevation:g.baseAim.elevation,baseYaw:g.baseAim.yaw,mode:'C',elapsedSeconds:Math.max(0,(time-g.started)/1000),directionBasis:g.basis});
  const course=session.course(current.selfId),limits=course.world.physics?.launchLimits;
  if(result.valid&&limits){result.actual.elevation=Math.max(limits.minElevation??5,Math.min(limits.maxElevation??85,g.baseAim.elevation));result.actual.power=Math.max(limits.minPower??.5,Math.min(limits.maxPower??14,result.actual.power));}
  g.aim=result;if(result.valid){aim={...result.actual};setAim();}return result;
 }
 view.updateGesture=mapGesture;
 canvas.addEventListener('pointermove',event=>{if(gesture?.id!==event.pointerId)return;event.preventDefault();mapGesture(event);line.setAttribute('x2',event.clientX-gesture.rect.left);line.setAttribute('y2',event.clientY-gesture.rect.top);dot.setAttribute('cx',event.clientX-gesture.rect.left);dot.setAttribute('cy',event.clientY-gesture.rect.top);});
 canvas.addEventListener('pointerup',event=>{if(gesture?.id!==event.pointerId)return;event.preventDefault();const mapped=mapGesture(event);gesture=null;guide.setAttribute('hidden','');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(mapped?.valid&&mayThrow())session.launch({...mapped.actual});});
 for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,event=>{if(gesture?.id===event.pointerId)gesture=null;guide.setAttribute('hidden','');});
 return view;
}
function renderState(value){
 current=value;if(!value.state)return;const s=value.state,me=activePlayer();document.body.dataset.phase=s.phase;
 $('online-lobby').hidden=true;$('online-room').hidden=false;$('online-leave').hidden=false;
 $('online-course-number').textContent=`ONLINE · ${s.players.length}/4人`;$('online-course-name').textContent=STAGES[s.stageId].label;
 const link=new URL('./online.html',location.href);link.hash=new URLSearchParams({room:value.roomId}).toString();$('online-link').value=link.href;$('online-room-code').textContent=value.roomId;if(new URLSearchParams(location.hash.slice(1)).get('room')!==value.roomId)history.replaceState(null,'','#'+new URLSearchParams({room:value.roomId}));
 $('online-invite').hidden=s.phase!=='lobby';$('online-ready').hidden=s.phase!=='lobby'||value.host;$('online-ready').textContent=me?.ready?'準備を取り消す':'準備できた！';
 $('online-start').hidden=s.phase!=='lobby'||!value.host;$('online-start').disabled=s.players.length<2||!s.players.every(p=>p.ready&&p.connected);
 $('online-rematch').hidden=s.phase!=='finished'||!value.host;
 $('online-controls').hidden=s.phase!=='running'||me?.finishedAt!==null||me?.dnf===true;
 if(previousPhase===null||s.phase==='lobby'&&previousPhase!=='lobby'){
  const course=session.course(value.selfId);aim={power:STAGES[s.stageId].power,elevation:STAGES[s.stageId].elevation,yaw:STAGES[s.stageId].yaw};
  const limits=course.world.physics?.launchLimits??{};$('online-elevation').min=limits.minElevation??5;$('online-elevation').max=limits.maxElevation??85;setAim();
  const golf=course.world.mode==='golf';$('online-arc-settings').hidden=golf;$('online-controls').querySelector('.angle-row').hidden=golf;
  $('online-input-note').textContent=golf?'パターを引いて、離して転がそう。':course.world.mode==='glider'?'軽く引いて離そう。投げた後は機体を追ってみて。':'投げたい向きと逆へ引いて、離そう。';
 }
 previousPhase=s.phase;
 if(s.phase==='countdown'&&matchMedia('(max-width:640px)').matches){$('online-grid').classList.add('focus-self');$('online-focus').setAttribute('aria-pressed','true');$('online-focus').textContent='4画面で見る';}
 const ordered=[me,...s.players.filter(p=>p.id!==value.selfId)].filter(Boolean);
 for(let slot=0;slot<4;slot++){
  const p=ordered[slot],v=views.get(slot)??makeView(slot);v.figure.dataset.empty=String(!p);v.figure.dataset.self=String(p?.id===value.selfId);v.empty.hidden=!!p;
  v.name.textContent=p?`${p.id===value.selfId?'あなた · ':''}${p.name}`:'OPEN';v.state.textContent=p?(p.dnf?p.connected?'タイムアップ':'接続終了':p.finishedAt!==null?`${p.attempts}投でクリア！`:p.shot?'とんでいます…':s.phase==='lobby'?p.ready?'準備OK':'準備中':`${p.attempts}投`):'';
  if(p&&v.id!==p.id){v.id=p.id;v.renderer=createRenderer(v.canvas,{maxDepthPixels:s.stageId==='eccentric-train'?(p.id===value.selfId?90000:24000):Infinity});v.renderer.setWorldView(session.course(p.id).world);v.renderer.resetCamera();v.renderer.resize();const r=v.canvas.getBoundingClientRect();v.layoutWidth=r.width;v.layoutHeight=r.height;}
  if(!p){v.id=null;v.renderer=null;v.canvas.getContext('2d').clearRect(0,0,v.canvas.width,v.canvas.height);}
  v.canvas.tabIndex=p?.id===value.selfId?0:-1;
 }
 const ranked=[...s.players].sort((a,b)=>(a.finishedAt??Infinity)-(b.finishedAt??Infinity)||a.seat-b.seat);
 $('online-results').replaceChildren();if(s.phase==='finished')for(const p of ranked){const li=document.createElement('li');li.textContent=p.finishedAt!==null?`${p.name} · ${(p.finishedAt/1000).toFixed(2)}秒 · ${p.attempts}投`:`${p.name} · ${p.dnf&&!p.connected?'途中退出':'タイムアップ'} · ${p.attempts}投`;$('online-results').append(li);}
  if(!value.connected)status(errors['host-left'],true);
  else status(s.phase==='lobby'?'集まったら「準備できた！」。部屋をつくった人がスタートします。':s.phase==='finished'?'ナイス一投！ もう一回、みんなで挑もう。':me?.finishedAt!==null?'クリア！ 友達の一投を見届けよう。':'焦らず、狙って、ぽいっ。');
}
setInterval(()=>{session?.tick();},16);
function paint(now){
 if(current?.state&&session){
  const s=current.state,elapsed=s.startsAt===null?0:Math.max(0,(session.hostNow()-s.startsAt)/1000);
  $('online-clock').textContent=!current.connected?'接続終了':s.phase==='countdown'?`${Math.max(1,Math.ceil((s.startsAt-session.hostNow())/1000))}`:s.phase==='running'?`${Math.max(0,Math.ceil(120-elapsed))}秒`:s.phase==='finished'?'FINISH':'';
  $('online-controls').hidden=!current.connected||s.phase==='lobby'||s.phase==='countdown'||s.phase==='finished'||activePlayer()?.finishedAt!==null||activePlayer()?.dnf===true;
  
  const local=session.course(current.selfId),localView=local?.view(elapsed),cue=local?onlineCourseCue(local.world,localView.environmentTime,localView.factorySession):null;
  $('online-round-note').textContent=!current.connected?'部屋を出て、もう一度集まろう。':s.phase==='lobby'?'同じ面、同じ風で。入れた人から、観戦しよう。':s.phase==='countdown'?'せーので、いこう。':s.phase==='finished'?'最後の一投まで、おつかれさま。':cue??'入るまで、何度でも。制限時間は2分。';
  if(gesture)gesture.view.updateGesture?.({pointerId:gesture.id,clientX:gesture.lastX,clientY:gesture.lastY},now);
  for(const view of onlineRenderPlan([...views.values()],current.selfId,now)){
   const self=view.id===current.selfId;view.lastDraw=now;const c=session.course(view.id);
   view.renderer.render(c.game,self?aim:c.initialAim(),{...c.view(elapsed),...(self&&gesture?{aim,customCue:false}:{}),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
   const show=self&&c.game.phase==='ready'&&(s.phase==='countdown'||s.phase==='running'&&(elapsed<4||now<view.goalUntil));
   view.goalGuide.toggleAttribute('hidden',!show);
   if(show){const width=view.canvas.clientWidth,height=view.canvas.clientHeight,targets=c.targets(elapsed).sort((a,b)=>Math.abs(a.center.x-c.world.origin.x)-Math.abs(b.center.x-c.world.origin.x)).slice(0,3);const cue=buildGoalCue({targets,project:view.renderer.project,width,height,label:'',reducedMotion:true});view.goalGuide.setAttribute('viewBox',`0 0 ${width} ${height}`);view.goalGuide.style.top=view.canvas.offsetTop+'px';view.goalGuide.style.height=height+'px';view.goalGuide.innerHTML=goalCueMarkup(cue);}
  }
 }
 lastPaint=now;requestAnimationFrame(paint);
}
requestAnimationFrame(paint);setAim();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});



