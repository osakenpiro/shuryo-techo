import {buildGoalCue,goalCueMarkup} from './goal-cue.mjs?v=20261015-boar-distance-1';
import { STAGES, createStageProgress } from './stages.mjs?v=20261015-boar-distance-1';
import { sideAim } from './side-aim.mjs?v=20261015-boar-distance-1';
import {createPixelIntro} from './pixel-intro.mjs?v=20261015-boar-distance-1';
import {createRoomWindStepper} from './room-gimmicks.mjs?v=20261015-boar-distance-1';
import {CHAPTER_IDS,FIRST_CHAPTER_IDS,SCHOOL_CHAPTER_IDS,OUTDOOR_CHAPTER_IDS,FACTORY_CHAPTER_IDS,ECCENTRIC_CHAPTER_IDS,BRANCH_CHAPTER_IDS,STAGE_THROWABLE_ITEMS,CHAPTERS,chapterForStage,getNextStage,isChapterBoundary,createChapterProgress,outdoorSnapshot,canChooseStage} from './progress-save.mjs?v=20261015-boar-distance-1';
import {roomCourse,roomWorld,createRoomCourseStepper} from './room-course.mjs?v=20261015-boar-distance-1';
import {createPlayRoomStepper,predictPlayRoomArc} from './play-room.mjs?v=20261015-boar-distance-1';
import {createSchoolPlayStepper,predictSchoolArc} from './school-play.mjs?v=20261015-boar-distance-1';
import {createOutdoorPlayStepper,predictOutdoorArc} from './outdoor-play.mjs?v=20261015-boar-distance-1';
import {outdoorStartTime,shrineStartTime,outdoorGoals,outdoorMotion} from './outdoor-world.mjs?v=20261015-boar-distance-1';
import {factoryStartTime,factoryGoals,factoryMotion} from './factory-world.mjs?v=20261015-boar-distance-1';
import {createFactoryPlayStepper,createFactorySession,resetFactorySession,predictFactoryArc} from './factory-play.mjs?v=20261015-boar-distance-1';
import {eccentricStartTime,eccentricLaunchFrame,eccentricGoals,eccentricMotion} from './eccentric-world.mjs?v=20261015-boar-distance-1';
import {createEccentricPlayStepper,throwEccentric,predictEccentricArc} from './eccentric-play.mjs?v=20261015-boar-distance-1';
import {createOutdoorEffects} from './outdoor-effects.mjs?v=20261015-boar-distance-1';
import {createBaseballIntro} from './baseball-intro.mjs?v=20261015-boar-distance-1';
import {loadOutdoorReplays,saveOutdoorReplay,deleteOutdoorReplay,createAdvancedRecorder,loadAdvancedReplays,saveAdvancedReplay,deleteAdvancedReplay} from './play-replay.mjs?v=20261015-boar-distance-1';
import {COURSE_REPLAY_LIMITS,createCourseReplay,validateCourseReplay,coursePayload,courseReplayResult,createCourseReplayPlayer,courseReplayToJSON,parseCourseReplayJSON,decodeCourseReplay,buildCourseReplayURL,interpretCourseContacts,loadPlayReplays,savePlayReplay,deletePlayReplay,loadItemReplays,saveItemReplay,deleteItemReplay,loadSchoolReplays,saveSchoolReplay,deleteSchoolReplay} from './play-replay.mjs?v=20261015-boar-distance-1';
import {createPullScale,mapScaledPull,screenPullBasis} from './pull-scale.mjs?v=20261015-boar-distance-1';
import {createPlayCue,playCueMarkup,pullHandleMarkup,launchCueOrigin} from './play-cue.mjs?v=20261015-boar-distance-1';
import {launchSummary,impactSummary} from './shot-summary.mjs?v=20261015-boar-distance-1';
import { createGame, setSetup, setRoomWorld, throwCan, resetShot, stepGame, getSnapshot, observeGame } from './physics.mjs?v=20261015-boar-distance-1';
import { createRenderer } from './render.mjs?v=20261015-boar-distance-1';
import { createShotAnalytics } from './shot-analytics.mjs?v=20261015-boar-distance-1';
import { createRecorder, loadReplays, saveReplay, deleteReplay } from './replay.mjs?v=20261015-boar-distance-1';
import {createGameShell} from './game-shell.mjs?v=20261015-boar-distance-1';
import {createTitleScreen} from './title-screen.mjs?v=20261015-boar-distance-1';
import {createGameMenu} from './game-menu.mjs?v=20261015-boar-distance-1';
import {createPlayerSaveUI} from './player-save-ui.mjs?v=20261015-boar-distance-1';
import {quickRetryKey,quickRetryStartsRun,createResultDelay} from './quick-retry.mjs?v=20261015-boar-distance-1';

import {createRewards,ACHIEVEMENTS} from './rewards.mjs?v=20261015-boar-distance-1';
import {loadPlayerSave,savePlayerSave,restorePlayerSave} from './player-save.mjs?v=20261015-boar-distance-1';
import {THROWABLE_CATALOG,getThrowable} from './throwables.mjs?v=20261015-boar-distance-1';
import {setThrowable,getThrowableId,getThrowableProfile} from './throwable-physics.mjs?v=20261015-boar-distance-1';
import {createStoreUI} from './item-store.mjs?v=20261015-boar-distance-1';
import {createRewardEffects} from './reward-effects.mjs?v=20261015-boar-distance-1';
import {createPreviewStorage} from './preview-storage.mjs?v=20261015-boar-distance-1';

let goalCueStage=null,goalCuePending=false,goalCueUntil=0,goalCueSource=null,goalCueState={visible:false,markers:[]};
const GOAL_CUE_MS=3200;

const $=id=>document.getElementById(id);
const reviewChapter3=location.pathname.includes('/chapter3-preview/')||new URLSearchParams(location.search).get('review')==='chapter3';
const reviewChapters45=location.pathname.includes('/chapters45-preview/')||new URLSearchParams(location.search).get('review')==='chapters45';
const reviewStage=id=>reviewChapter3&&OUTDOOR_CHAPTER_IDS.includes(id)||reviewChapters45&&BRANCH_CHAPTER_IDS.includes(id);
const previewNextStage=id=>{const ids=chapterForStage(id)?.ids??[];return ids[ids.indexOf(id)+1]??null;};
let previewStorage=null,factorySession=null;
const canvas=$('scene');
const game=createGame({distance:6,height:1.3});
const controls={power:7.8,elevation:48,yaw:0};
if($('browser-open'))$('browser-open').href=location.href;
const renderer=createRenderer(canvas);
const goalCanvas=$('goal-scene'),goalRenderer=goalCanvas?createRenderer(goalCanvas):null;
let goalCameraVisible=true,goalCameraStage=null,goalCameraWorld=null,goalCameraGoalId=null,towerViewMode='launch';
let goalCameraPresented=null;
const analytics=createShotAnalytics();
const stageProgress=createStageProgress();
if($('stage-select'))for(const [id,stage]of Object.entries(STAGES)){if([...$('stage-select').options].some(option=>option.value===id))continue;const option=document.createElement('option');option.value=id;option.textContent=stage.label;$('stage-select').append(option);}
const loadedPlayer=loadPlayerSave(storage());
const loadedProgress={ok:loadedPlayer.ok,data:loadedPlayer.progress};
let rewards=createRewards(loadedPlayer.rewards??undefined);
let chapterProgress=createChapterProgress(loadedProgress.data??undefined),chapterPractice=false,chapterShot=null,chapterResult=null;
let trainingMode=true,trainingReturnStage='first',trainingStats={attempts:0,successes:0},shotContext=null;
let chapterResultPending=false;
const chapterResultDelay=createResultDelay();
let angleCueUntil=0,arcTipLearned=false;
let playStepper=null,lastShotAnalysis=null,lastPresentedAim=null,lastReleasedAim=null,cueSnapshot={visible:false},trainingPreview=[];
const liveWorld=()=>CHAPTER_IDS.includes(stageProgress.snapshot().id)?roomWorld(stageProgress.snapshot().id,STAGES[stageProgress.snapshot().id].worldVersion):null;
const liveCourse=()=>roomCourse(stageProgress.snapshot().id,liveWorld()?.worldVersion??1);
const pullInput=()=>chapterProgress.snapshot().inputScheme==='pull';
const chapterStage=()=>CHAPTER_IDS.includes(stageProgress.snapshot().id);
const schoolStage=()=>SCHOOL_CHAPTER_IDS.includes(stageProgress.snapshot().id);
const outdoorStage=()=>OUTDOOR_CHAPTER_IDS.includes(stageProgress.snapshot().id);
const factoryStage=()=>FACTORY_CHAPTER_IDS.includes(stageProgress.snapshot().id);
const eccentricStage=()=>ECCENTRIC_CHAPTER_IDS.includes(stageProgress.snapshot().id);
const advancedStage=()=>factoryStage()||eccentricStage();
const environmentStartTime=()=>factoryStage()?(liveWorld()?.worldVersion===47?environmentTime:factoryStartTime(environmentTime)):eccentricStage()?eccentricStartTime(environmentTime):outdoorStage()?liveWorld()?.worldVersion===30?shrineStartTime(environmentTime):outdoorStartTime(environmentTime):schoolStage()?schoolStartTime():0;
const inputLimits=()=>liveWorld()?.physics.launchLimits??{minPower:.5,maxPower:14,minElevation:sideStage()?5:15,maxElevation:sideStage()?85:75};
const schoolStartTime=()=>((environmentTime%8)+8)%8;
const makePlayStepper=(world,startTime=environmentStartTime())=>world?world.environment==='factory'?createFactoryPlayStepper(world,{startTime,session:factorySession}):world.environment==='eccentric'?createEccentricPlayStepper(world,{startTime}):world.environment==='outdoor'?createOutdoorPlayStepper(world,{startTime,onEffect:effect=>outdoorEffects.onLiveEffects([effect],world)}):world.environment==='school'?createSchoolPlayStepper(world,{startTime}):createPlayRoomStepper(world,{extra:world.stageId==='room-extra'}):null;
const chapterOf=(id=stageProgress.snapshot().id)=>chapterForStage(id)??chapterForStage(chapterProgress.snapshot().resumeStage)??CHAPTERS[0];
const chapterCount=(chapter,state=chapterProgress.snapshot())=>chapter.ids.filter(id=>state.completedIDs.includes(id)).length;
// A moving goal's pose freezes to its recorded shot clock through the result.
const sceneTime=()=>[48,53].includes(liveWorld()?.worldVersion)?(shotContext?.worldVersion===liveWorld()?.worldVersion&&(busy()||game.phase==='success')?shotContext.startTime+game.time:environmentTime):liveWorld()?.worldVersion===47?(busy()&&shotContext?.worldVersion===47?shotContext.startTime+game.time:environmentTime):((schoolStage()&&['flying','settling'].includes(game.phase))||((outdoorStage()||advancedStage())&&game.phase!=='ready'))&&shotContext?.worldVersion===liveWorld()?.worldVersion?shotContext.startTime+game.time+(outdoorStage()&&shotContext.endEnvironmentTime!=null?Math.max(0,environmentTime-shotContext.endEnvironmentTime):0):liveWorld()?.worldVersion===39?eccentricStartTime(environmentTime):environmentTime;
const unlockedStage=id=>!CHAPTER_IDS.includes(id)||canChooseStage(chapterProgress.snapshot(),id);
let freeSetup={distance:6,height:1.3};
let previous3DMode='throw';
observeGame(game,event=>{if(event.type==='result'&&shotContext?.shotId===event.shotId&&shotContext.training){if(!shotContext.finished){shotContext.finished=true;if(event.success)trainingStats.successes++;}return;}stageProgress.result(event,{recordClear:!chapterPractice});});
observeGame(game,event=>analytics.observe(event));
const inputs=['power','elevation','yaw','distance','height'].map($);
const pointers=new Set();
const view={mode:'throw',prediction:false,gesture:null};
let pixelIntro=null,introHasRun=false,gameShell=null,storeUI=null,titleUI=null,menuUI=null,saveUI=null,titleOnEntry=false;
// Presentation history is separate from portable player saves and awards.
const titleSeenKey='trash-shot-title-seen-1';
let titleSeen=false;try{titleSeen=storage()?.getItem(titleSeenKey)==='seen';}catch{}
const titleActive=()=>titleUI?.isOpen()===true;
const menuOpen=()=>$('game-menu')?.open===true;
const titleUnlocked=()=>chapterProgress.snapshot().completedIDs.includes('first');
const firstTitlePending=()=>!titleSeen&&titleUnlocked()&&chapterResult?.stageId==='first'&&!chapterResult.practice;
const rewardEffects=createRewardEffects({document,reducedMotion:()=>matchMedia('(prefers-reduced-motion: reduce)').matches});
const outdoorEffects=createOutdoorEffects();
const roomWind=createRoomWindStepper();let fanEnabled=true,environmentTime=0;
const courseStepper=createRoomCourseStepper();
const extraRoom=()=>stageProgress.snapshot().id==='room-extra';
let lastUIKey='',previousTime=performance.now(),lastInput=null,cancellations=0,wheelAnglePixels=0;
const baseballIntro=createBaseballIntro();
const busy=()=>baseballIntro.active||game.phase==='flying'||game.phase==='settling'||chapterResultPending;
const sideStage=()=>STAGES[stageProgress.snapshot().id]?.projection==='side';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

const inviteDialog=$('invite-dialog');
function openGameInvitation(){
  if(!inviteDialog||busy()||pixelIntro?.active)return false;
  cancelGesture('game-invite');
  const url=new URL(location.href);url.hash='';url.search='';url.searchParams.set('v','20261015-boar-distance-1');
  $('invite-link').value=url.href;
  $('invite-message').textContent='';
  $('invite-share').hidden=typeof navigator.share!=='function';
  inviteDialog.showModal();return true;
}
// Older cached pages have no invitation controls; keep their game playable.
if(inviteDialog && $('invite-game')){
  $('invite-game').addEventListener('click',openGameInvitation);
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
      await navigator.share({title:'TRASHOOT',text:'缶ひとつ、箱ひとつ。ひと投げしてみよう。',url:$('invite-link').value});
      $('invite-message').textContent='共有先にゲームのリンクを渡しました。';
    }catch(error){
      $('invite-message').textContent=error.name==='AbortError'?'共有を取り消しました。リンクはここからコピーできます。':'共有できませんでした。リンクをコピーして渡せます。';
    }
  });
}

function updateControlLabels(aim=null){
  const values={...controls,...aim};
  const label=document.querySelector('label[for="power"]');if(label)label.textContent=getThrowableId(game)==='can'?'初速（m/s）':'引っ張りの強さ';
  $('power-value').textContent=values.power.toFixed(2).replace(/0$/,'');
  $('elevation-value').textContent=`${values.elevation}°`;
  $('yaw-value').textContent=values.yaw===0?'まっすぐ':`${values.yaw<0?'左':'右'} ${Math.abs(values.yaw)}°`;
  for(const id of ['power','elevation','yaw']){const input=$(id);input.value=values[id];const progress=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100;input.style.setProperty('--fill',`${progress}%`);}
}
function updateHint(){
  const motion=pullInput()?'左下へ引いて':'右上へなぞって',straight=pullInput()?'下へ引いて':'上へドラッグ／スワイプして';
  canvas.dataset.mode=view.mode;canvas.dataset.dragging=String(Boolean(view.gesture));
  canvas.dataset.projection=sideStage()?'side':'perspective';canvas.dataset.training=String(trainingMode);
  if($('arc-value')){$('arc-value').hidden=!trainingMode;$('arc-value').textContent=trainingMode?`${view.gesture?.aim?.actual?.elevation??controls.elevation}°`:'';}
  $('mode-throw').setAttribute('aria-pressed',String(view.mode==='throw'));
  $('mode-observe').setAttribute('aria-pressed',String(view.mode==='observe'));
  $('cancel-gesture').hidden=!view.gesture||view.gesture.kind!=='throw';
  if(sideStage()){
    $('interaction-hint').textContent=busy()?'横から、投げたものの行方を見届けよう。':view.gesture?.aim?.valid?'離すと一投。Esc または下のボタンで取消。':`${motion}、離すと一投。`;
    const aim=view.gesture?.aim?.actual;
    $('input-detail').textContent=aim&&trainingMode?`弧 ${aim.elevation.toFixed(1)}° · 初速 ${(aim.power*getThrowable(getThrowableId(game)).physics.launchScale).toFixed(2)} m/s · 向きで角度、長さで強さ`:view.gesture?pullStateHint(view.gesture):`${motion}、向きで角度、長さで強さ。${trainingMode?'つまみでも練習できます。':'金色の弧で角度、矢印の長さで強さ。'}`;
    canvas.setAttribute('aria-label',`横から見た2D投球画面。${motion}、離すと一投。向きで角度、長さで強さ。箱へ向かう平面内で投げます。${trainingMode?'練習では数値でも投げられます。':''}`);
    return;
  }
  if(view.gesture?.temporaryObserve){
    $('interaction-hint').textContent='右ボタンを押したままドラッグで見回す。離すと元の操作へ。';
    $('input-detail').textContent='短い右クリックで見回す／手投げを切り替え。';
  }else if(view.mode==='observe'){
    $('interaction-hint').textContent='ドラッグで見回す。缶も箱も、別の角度から。';
    $('input-detail').textContent='ホイールでズーム。右クリックで手投げに戻ります。';
  }else if(busy()){
    $('interaction-hint').textContent='投げたものの行方を見届けよう。右クリック／「見回す」で視点を変えられます。';
    $('input-detail').textContent='投球が落ち着いたら、もう一投。';
  }else if(view.gesture){
    const mapped=view.gesture.aim,aim=mapped.actual;
    const outsideEmbeddedMouse=view.gesture.pointerType==='mouse'&&window.self!==window.top&&!inside({clientX:view.gesture.lastX,clientY:view.gesture.lastY},view.gesture.rect);
    $('interaction-hint').textContent=!view.gesture.scale?.ready&&pullInput()?view.gesture.scale.reasonText:mapped.valid?(outsideEmbeddedMouse?'画面の外で離すと取り消します。':'離すと一投。取り消しは Esc または下のボタン。'):`もう少し${pullInput()?'下':'上'}へ動かすと、投げられます。`;
    $('input-detail').textContent=trainingMode?launchSummary({...aim,power:aim.power*getThrowable(getThrowableId(game)).physics.launchScale}).text:pullStateHint(view.gesture);
  }else{
    $('interaction-hint').textContent=game.phase==='miss'?`もう一投。${straight}、離してみよう。`:`${straight}、離すと一投。`;
    $('input-detail').textContent='矢印の向きが方向、長さが強さ。金色の弧が角度。ホイール／弧 −・＋で調整。右ドラッグで見回す。左右は画面の奥を基準。';
  }
  canvas.setAttribute('aria-label',view.mode==='observe'?'缶と箱を観察する立体画面。ドラッグか矢印キーでカメラ回転。ホイールかプラスとマイナスでズーム。右クリックで手投げに切替。':`缶を投げる立体画面。${straight}、離すと一投。ホイールまたは弧のボタンで投球角度を調整。右ボタンを押したままドラッグで見回せます。${trainingMode?'練習では数値でも投げられます。':''}`);
}
function pullStateHint(gesture){return gesture.scale&&!gesture.scale.ready?gesture.scale.reasonText:gesture.aim?.risk>0?'力み · 少し戻すと安定。':gesture.aim?.rawDistance>.28?'ゴム抵抗 · 矢印の長さが強さ。':'矢印の向きが方向、長さが強さ。金色の弧が角度。';}
function actualLiveResult(){
  const result=analytics.snapshot().result;if(!result?.success)return result;
  if(shotContext?.worldVersion>=2&&playStepper)return interpretCourseContacts(result,playStepper.snapshot().contacts,shotContext.worldVersion);
  const deskHits=liveCourse()?courseStepper.snapshot().contacts.filter(c=>c.time<result.finalEntryTime+1e-8).length:0;
  return {...result,deskHits,roles:deskHits?[...result.roles.filter(r=>r.id!=='direct'),{id:'desk-bank',label:'机当て'}]:result.roles};
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
  let detail={ready:`${pullInput()?'下へ引いて':'上へなぞって'}、離すと一投。`,flying:'投げたものの行方を見届けよう。',settling:'成功は、箱の中で落ち着いてから。',miss:'向きや強さを変えて、もう一投。'}[game.phase]||'';
  if(sideStage()&&game.phase==='ready')detail=`${pullInput()?'左下へ引く':'右上へなぞる'}。向きで角度、長さで強さを決めて、離すと一投。`;
  if(sideStage()&&game.phase==='miss')detail='角度や強さを変えて、もう一投。';
  const result=actualLiveResult();
  if(game.phase==='success'&&result?.success){
    for(const role of result.roles){const chip=document.createElement('span');chip.className='shot-role-chip';chip.textContent=role.label;roles.append(chip);}
    roles.hidden=!result.roles.length;
    detail=impactSummary(result);
  }
  $('live-shot-detail').textContent=detail;
  updateAnalysisUI();
}
function updateAnalysisUI(){const element=$('live-shot-analysis');if(!element)return;const settled=['success','miss'].includes(game.phase)&&lastShotAnalysis?.shotId===game.attempts;element.hidden=!settled;element.textContent=settled?lastShotAnalysis.launch.text:'';}
function updateUI(force=false){
  const key=[game.phase,game.lastEvent,game.attempts,game.successes,game.bin.center.z,game.bin.height,pixelIntro?.active===true,fanEnabled,baseballIntro.active,...(liveWorld()?.worldVersion===47?[timedRelayState()?.activated,timedRelayState()?.open,timedRelayState()?.expired,timedRelayState()?.sensorActive]:[])].join('|');
  if(key===lastUIKey&&!force)return;
  lastUIKey=key;
  for(const input of inputs)input.disabled=busy();
  $('throw-button').disabled=busy();
  $('reset-button').disabled=busy()||game.phase==='ready';
  if($('quick-retry'))$('quick-retry').disabled=!quickRetryAvailable();
  $('status-panel').dataset.phase=baseballIntro.active?'pitching':game.phase;
  if($('pitch-cancel'))$('pitch-cancel').hidden=!baseballIntro.active;
  $('attempt-count').textContent=String(game.attempts).padStart(2,'0');
  $('success-count').textContent=String(game.successes).padStart(2,'0');
  updateScoreSummary();
  updateStageUI();
  $('setup-description').textContent=`距離 ${game.bin.center.z} m · 高さ ${game.bin.height} m`;
  const messages={
    ready:['↗','いいところに、投げてみよう。','画面で手投げ、または数値で投げられます。','数値で投げる'],
    flying:['·','投げたものの行方を、見届けよう。','すとん、と入ると気持ちいい。','飛んでいます…'],
    settling:['·','もう少し、見届けよう。','投げたものが落ち着くまでお待ちください。','着地を待っています…'],
    success:['✓','すとん！ 箱に入った。','視点を変えて中を見ても、もうひと投げでも。','この数値でもう一度'],
    miss:['↺','もうひと投げ。','向きや強さを変えて試してみよう。','この数値でもう一度']
  };
  const message=messages[game.phase]||messages.ready;
  $('status-icon').textContent=message[0];$('status').textContent=message[1];$('status-detail').textContent=message[2];$('throw-label').textContent=message[3];
  if(sideStage()&&game.phase==='success')$('status-detail').textContent='横から入った！ 記録は3Dで見回せます。';
  if(sideStage()&&game.phase==='miss')$('status-detail').textContent='強さや弧の高さを変えて、もう一投。';
  if(busy()&&game.lastEvent==='rim-hit')$('status-detail').textContent='ふちに当たった！ どうなるかな。';
  if(busy()&&game.lastEvent==='side-hit')$('status-detail').textContent='箱の横に当たった。';
  if(game.phase==='miss'&&game.events.some(event=>event.type==='student-blocked'))$('status-detail').textContent='生徒が通り過ぎるのを待って、もう一投。';
  if(liveWorld()?.worldVersion===46&&game.phase==='miss'&&playStepper?.snapshot().effects?.some(e=>e.type==='factory-press')){$('status').textContent='プレスに挟まれた！';$('status-detail').textContent='動きを見て、投げるタイミングを変えよう。リトライ R でもう一投。';}
  if(liveWorld()?.worldVersion===47&&game.phase!=='success'&&factorySession?.plateLatched){const relay=timedRelayState();$('status').textContent=relay.expired?'扉が閉じた！':relay.open?'扉が開いている！':'一球目が仕掛けを動かしています';$('status-detail').textContent=relay.expired?'リトライ R で一球目から、もう一度。':'球がレールを流れる間に、二球目を箱へ。構えている間も動きます。';}
  if(busy()&&game.lastEvent==='entered')$('status-detail').textContent='箱の中へ！ 投げたものが落ち着くのを待とう。';
  if(baseballIntro.active){$('status').textContent='投球から、打球へ。';$('status-detail').textContent='投手の球を打ち返します。';$('live-shot-result').textContent='投手が投げています…';}
  updateHint();
}
function cancelGesture(reason='cancel'){
  if(['escape','blur','visibility-change','menu-open','stage-change','reset','replay-open','title-screen','chapter-top'].includes(reason))cancelBaseballPitch(reason);
  wheelAnglePixels=0;
  const gesture=view.gesture;
  if(!gesture)return;
  view.gesture=null;cancellations++;lastInput={type:'cancel',reason};
  $('gesture-feedback').hidden=true;
  if(canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
  updateControlLabels();
  updateHint();
}
function setMode(mode){if(titleActive()||pixelIntro?.active)return;cancelGesture('mode-change');view.mode=sideStage()?'throw':mode;updateHint();}
$('mode-throw').addEventListener('click',()=>setMode('throw'));
$('mode-observe').addEventListener('click',()=>setMode('observe'));
function updateZoomControls(){
  const camera=renderer.cameraSnapshot(),zoom=camera.projection==='side'?camera.sideZoom:camera.zoom;
  for(const id of ['camera-in','play-zoom-in'])if($(id))$(id).disabled=zoom<=.62+1e-8;
  for(const id of ['camera-out','play-zoom-out'])if($(id))$(id).disabled=zoom>=1.8-1e-8;
}
function cameraAction(action){if(titleActive()||pixelIntro?.active)return;cancelGesture('camera-control');action();updateZoomControls();}
function returnTowerLaunch(){
  if(liveWorld()?.worldVersion!==38||towerViewMode!=='overview')return;
  towerViewMode='launch';renderer.resetCamera();updateTowerViewControls();
}
function updateTowerViewControls(){
  const available=liveWorld()?.worldVersion===38;
  for(const [id,mode]of [['tower-view-overview','overview'],['tower-view-launch','launch']]){
    const button=$(id);if(!button)continue;button.hidden=!available;
    button.setAttribute('aria-pressed',String(available&&towerViewMode===mode));
  }
}
$('tower-view-overview')?.addEventListener('click',()=>cameraAction(()=>{
  if(liveWorld()?.worldVersion!==38)return;
  towerViewMode='overview';renderer.setCameraViewOverride({target:{x:0,y:155,z:-10},distance:600});
  renderer.restoreCamera({azimuth:.4,elevation:.33,zoom:1});updateTowerViewControls();
}));
$('tower-view-launch')?.addEventListener('click',()=>cameraAction(()=>{towerViewMode='launch';renderer.resetCamera();updateTowerViewControls();}));
$('camera-reset').addEventListener('click',()=>cameraAction(()=>{towerViewMode='launch';renderer.resetCamera();updateTowerViewControls();}));
for(const [id,x,y] of [['camera-left',-.16,0],['camera-right',.16,0],['camera-up',0,.12],['camera-down',0,-.12]])$(id).addEventListener('click',()=>cameraAction(()=>renderer.orbit(x,y)));
for(const id of ['camera-in','play-zoom-in'])$(id)?.addEventListener('click',()=>cameraAction(()=>renderer.zoom(.88)));
for(const id of ['camera-out','play-zoom-out'])$(id)?.addEventListener('click',()=>cameraAction(()=>renderer.zoom(1.14)));
for(const id of ['play-zoom-in','play-zoom-out'])for(const type of ['pointerdown','focus'])$(id)?.addEventListener(type,()=>cancelGesture('camera-control'));
canvas.addEventListener('pointerup',event=>{
  // Pointer capture routes a held throw's release to the canvas even above a
  // button. Releasing on these camera controls expresses a camera action.
  if(view.gesture?.kind==='throw'&&document.elementFromPoint(event.clientX,event.clientY)?.closest('.camera-zoom-controls,#goal-confirm'))cancelGesture('camera-control');
},{capture:true});
$('prediction-toggle').addEventListener('change',()=>{cancelGesture('prediction-change');view.prediction=trainingMode&&$('prediction-toggle').checked;});
function learnArcTip(before){
  if(stageProgress.snapshot().id==='desk-side'&&!trainingMode&&controls.elevation!==before){arcTipLearned=true;if($('arc-tip'))$('arc-tip').hidden=true;}
}
function changeArc(amount){if(titleActive()||busy()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open||sideStage())return;cancelGesture('arc-control');const before=controls.elevation,limits=inputLimits();controls.elevation=clamp(controls.elevation+amount,limits.minElevation,limits.maxElevation);learnArcTip(before);angleCueUntil=performance.now()+1800;updateControlLabels();updateHint();updateStageUI();}
$('arc-lower')?.addEventListener('click',()=>changeArc(-3));$('arc-higher')?.addEventListener('click',()=>changeArc(3));
$('game-menu-open')?.addEventListener('click',()=>{if(titleActive()||pixelIntro?.active)return;cancelGesture('menu');const menu=$('game-menu');menu.open=!menu.open;$('game-menu-open').setAttribute('aria-expanded',String(menu.open));if(menu.open)menu.scrollIntoView({block:'start',behavior:'instant'});});
$('game-menu')?.addEventListener('toggle',()=>{if($('game-menu').open)cancelGesture('menu');$('game-menu-open')?.setAttribute('aria-expanded',String($('game-menu').open));});
document.querySelector('.wordmark')?.addEventListener('click',event=>{event.preventDefault();showChapterTop();});
$('training-start')?.addEventListener('click',()=>{if(titleActive()||busy()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open)return;trainingReturnStage=stageProgress.snapshot().id==='free'?chapterProgress.snapshot().resumeStage:stageProgress.snapshot().id;selectPlayable(stageProgress.snapshot().id,{allowPractice:true,training:true});});
$('training-exit')?.addEventListener('click',()=>{if(titleActive()||busy()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open)return;const target=stageProgress.snapshot().id==='free'?trainingReturnStage:stageProgress.snapshot().id;selectPlayable(target,{allowPractice:true,training:false});});
for(const id of ['power','elevation','yaw'])$(id).addEventListener('input',()=>{if(titleActive()||!trainingMode){updateControlLabels();return;}const value=sideStage()&&id==='yaw'?0:Number($(id).value);cancelGesture('numeric-change');controls[id]=value;if(id==='elevation'||id==='yaw')angleCueUntil=performance.now()+1800;updateControlLabels();updateHint();});
for(const id of ['distance','height'])$(id).addEventListener('change',()=>{
  if(titleActive()||busy()||stageProgress.snapshot().id!=='free'){$('distance').value=String(game.bin.center.z);$('height').value=String(game.bin.height);return;}
  cancelGesture('setup-change');clearCurrentShot();setSetup(game,{distance:Number($('distance').value),height:Number($('height').value)});updateUI(true);
});
function selectStage(id,{fromIntro=false,allowPractice=false,fromEntry=false,training=id==='free'}={}){
  cancelBaseballPitch('stage-change');
  if(titleActive()||pixelIntro?.active&&!fromIntro)return false;
  if(busy()||!STAGES[id]||$('chapter-result')?.open||replayDialog.open)return false;
  if(!unlockedStage(id)&&!allowPractice&&!reviewStage(id))return false;
  cancelPendingChapterResult();
  trainingMode=training===true;trainingStats={attempts:0,successes:0};shotContext=null;chapterPractice=CHAPTER_IDS.includes(id)&&!unlockedStage(id);chapterShot=null;
  view.prediction=false;$('prediction-toggle').checked=false;trainingPreview=[];lastShotAnalysis=null;
  if(CHAPTER_IDS.includes(id)&&!chapterPractice&&!trainingMode){chapterProgress.chooseStage(id);if(!fromEntry)persistChapter();}
  if($('chapter-top'))$('chapter-top').hidden=true;
  chapterResult=null;
  const wasSide=sideStage(),willBeSide=STAGES[id].projection==='side';
  if(stageProgress.snapshot().id==='free')freeSetup={distance:game.bin.center.z,height:game.bin.height};
  cancelGesture('stage-change');pointers.clear();outdoorEffects.clear();if(fromIntro)shotRecorder=null;else clearCurrentShot();stageProgress.select(id);
  goalCameraStage=null;goalCameraWorld=null;goalCameraPresented=null;goalCameraGoalId=null;towerViewMode='launch';
  roomWind.reset();courseStepper.reset();if(id==='room-extra')fanEnabled=true;
  setThrowable(game,STAGE_THROWABLE_ITEMS[id]?STAGE_THROWABLE_ITEMS[id]:CHAPTER_IDS.includes(id)?rewards.snapshot().equipped:'can');
  const setup=id==='free'?freeSetup:STAGES[id];if(CHAPTER_IDS.includes(id))setRoomWorld(game,setup.worldVersion);else setSetup(game,setup);renderer.setWorldView(liveWorld());
  factorySession=factoryStage()?createFactorySession(liveWorld()):null;
  playStepper=makePlayStepper(liveWorld());
  $('distance').value=String(setup.distance);$('height').value=String(setup.height);
  if(willBeSide&&!wasSide){previous3DMode=view.mode;view.mode='throw';}
  else if(wasSide&&!willBeSide)view.mode=previous3DMode;
  renderer.setProjection(willBeSide?'side':'perspective');
  const limits=inputLimits();$('power').min=String(limits.minPower);$('power').max=String(limits.maxPower);
  $('elevation').min=String(limits.minElevation);$('elevation').max=String(limits.maxElevation);$('elevation').step=willBeSide?'.5':'1';
  if(id!=='free'){Object.assign(controls,liveWorld()?.launch??{power:setup.power,elevation:setup.elevation,yaw:setup.yaw});if(willBeSide||!wasSide)renderer.resetCamera();}
  if(!willBeSide){controls.power=clamp(controls.power,(schoolStage()||outdoorStage()||advancedStage())?limits.minPower:4,(schoolStage()||outdoorStage()||advancedStage())?limits.maxPower:13);controls.elevation=Math.round(clamp(controls.elevation,limits.minElevation,limits.maxElevation));}
  if($('game-menu')){$('game-menu').open=false;$('game-menu-open')?.setAttribute('aria-expanded','false');}
  goalCuePending=true;goalCueUntil=0;
  updateControlLabels();updateUI(true);return true;
}
function selectPlayable(id,options){
  const accepted=selectStage(id,options);
  if(accepted){canvas.scrollIntoView({block:'center',behavior:'instant'});canvas.focus({preventScroll:true});}
  return accepted;
}
if($('stage-select')){
  $('stage-select').addEventListener('change',()=>{if(!selectPlayable($('stage-select').value))$('stage-select').value=stageProgress.snapshot().id;});
  $('start-tutorial').addEventListener('click',()=>selectPlayable('tutorial'));
  $('stage-next').addEventListener('click',()=>{const state=stageProgress.snapshot();if(state.id==='tutorial'&&state.completed.includes('tutorial'))selectPlayable('first');else if(chapterProgress.snapshot().completedIDs.includes(state.id)){if(state.id==='first'&&!titleSeen&&showTitleScreen())return;const next=getNextStage(state.id,chapterProgress.snapshot());if(isChapterBoundary(state.id))showChapterTop(true,state.id);else if(next)selectPlayable(next);else showChapterTop(true,state.id);}});
  $('stage-retry').addEventListener('click',()=>quickRetry('stage-button'));
}
function goalCameraAvailable(){return outdoorStage()||advancedStage()||stageProgress.snapshot().id==='school-rooftop';}
function goalCameraShown(){return goalCameraVisible&&goalCameraAvailable()&&!pixelIntro?.active&&!titleActive()&&($('chapter-top')?.hidden??true);}
function updateStageUI(){
  const state=stageProgress.snapshot(),available=goalCameraAvailable();
  updateZoomControls();updateTowerViewControls();
  if($('goal-camera-open')){const button=$('goal-camera-open');button.hidden=!available;button.setAttribute('aria-pressed',String(goalCameraVisible&&available));button.textContent='ゴールのワイプ';button.setAttribute('aria-label',goalCameraVisible?'ゴールのワイプを隠す':'ゴールのワイプを表示する');}
  if($('goal-camera'))$('goal-camera').hidden=!goalCameraShown();
  if($('arc-tip'))$('arc-tip').hidden=state.id!=='desk-side'||trainingMode||arcTipLearned||pixelIntro?.active===true||titleActive();
  const side=sideStage(),motion=pullInput()?'左下へ引く':'右上へなぞる',straight=pullInput()?'下へ引く':'上へなぞる',course=liveCourse();
  $('yaw').disabled=busy()||side;
  $('mode-observe').disabled=side;
  for(const id of ['camera-left','camera-right','camera-up','camera-down'])$(id).disabled=side;
  $('camera-help').textContent=side?`横視点のカメラは固定。「ズーム −／＋」で拡大・縮小。視点を戻すと元の大きさへ。投球は${motion}。向きで角度、長さで強さを決めます。`:'右ボタンを押したままドラッグで一時的に見回す。短い右クリック／「見回す」で切替。ドラッグや矢印キーで回転。「ズーム −／＋」で拡大・縮小。見回し中は、右ボタンを押している間もホイールでズームできます。';
  if($('first-throw-tip'))$('first-throw-tip').textContent=liveWorld()?.outdoorType==='mall'?`弧 −で下向きにも。${straight}、離してコーンへ。`:side?`脇道の2D：${motion}。向きで角度、長さで強さ。離すと一投。`:`${straight}。長さで強さ、離すと一投。`;
  if($('control-help'))$('control-help').textContent=side?`${motion}向きで角度、長さで強さ。数値なら角度5〜85°、強さ0.5〜14を調整できます。`:`${straight}長さで強さ。${pullInput()?'左右は引く向きの反対へ。':'左右は箱方向を基準。'}弧はホイールや角度つまみでも。`;
  if($('tutorial-motion'))$('tutorial-motion').textContent=`${straight}、離すと一投。`;
  if($('input-scheme')){$('input-scheme').value=chapterProgress.snapshot().inputScheme;$('input-scheme').disabled=busy()||pixelIntro?.active===true;}
  if($('stage-help')){$('stage-help').hidden=!side;$('stage-help').textContent=`本編とは別の2D脇道。${motion}向きで角度、長さで強さを決めて、8 m先の箱へ。記録は3Dで見回せます。`;}
  if(state.id==='desk-side'&&liveWorld()?.worldVersion===4&&$('stage-help')){$('stage-help').hidden=false;$('stage-help').textContent='箱の前に本棚。高い弧で上を越すか、横の壁や家具で跳ね返して狙おう。';}
  if(course?.desk&&$('stage-help')){$('stage-help').hidden=false;$('stage-help').textContent=state.id==='desk-over'?'箱の手前に机。高い弧で越えても、机で跳ね返って入っても成功。':'机の横に開いた投球路。左右と弧を合わせて箱へ。机と4本の脚には実際に当たります。';}
  if(schoolStage()&&$('stage-help')){$('stage-help').hidden=false;$('stage-help').textContent={
    'school-classroom':'机と椅子の列を、高い弧で越えて奥の箱へ。弧 −・＋やホイールで角度を変えられます。',
    'school-vending':'箱の入口は小さめ。近くても強く引きすぎず、ふわっと入口へ落とそう。',
    'school-passage':'こちらの窓から、向かいの教室へ。廊下を行き交う生徒の間を見て、二つの窓を通そう。',
    'school-rooftop':'屋上から中庭へ。高さで遠くへ届くので、引きすぎに注意。旗が示す風も読もう。'
  }[state.id];}
  if(outdoorStage()&&$('stage-help')){$('stage-help').hidden=false;$('stage-help').textContent={
    'outdoor-shrine':'お参り客の向こうの賽銭箱へ。人の動きを見て、弧で越そう。鈴の紐に当たると、鳴って跳ね返るよ。',
    'outdoor-baseball':'引いて離すとバッターが打つ！ 観客席のミットはどれでも成功。矢印は打つ方向と力の目安です。',
    'outdoor-mall':'吹き抜けの下、子供のコーンへ。弧 −で下向きにも落とせます。アイスは一度ぶつかるとベチャッ。',
    'outdoor-river':'川向こうの花火筒へ。船の明かりが照らす場所を見て、タイミングも選ぼう。'
  }[state.id];}
  if(advancedStage()&&$('stage-help')){$('stage-help').hidden=false;$('stage-help').textContent={
    'factory-shutter':'箱はひとつ。開く瞬間を狙うか、右の反射ガイドで回り込もう。',
    'factory-conveyor':'右へ、奥へ、左へ。4本のベルトを乗り継いで箱へ。途中の2基のプレスを見て投げよう。',
    'factory-bank':'正面は遮蔽物。左右に動くピストンの面で跳ね返し、向こうの箱を狙おう。',
    'factory-relay':liveWorld()?.worldVersion===47?(factorySession?.plateLatched?(timedRelayState()?.expired?'扉が閉じました。リトライ R で一球目から。':'一球目が流れる間に二球目を箱へ。構えている間も扉は動きます。'):'一球目を左の受け口へ。球がレールを流れる間だけ扉が開きます。'):factorySession?.plateLatched?'扉が開いた！ 次の球を右奥の箱へ。リトライで装置も戻ります。':'左の板を1球目で押して扉を開ける？ 右のガイドで1球で入れる？ 同じ箱への道を探そう。',
    'eccentric-tower':'250mの展望台から、街のごみ箱へ。低い弧で落とすように投げよう。「タワー全景」で塔を見渡せます。',
    'eccentric-train':'自分の車窓から、隣の電車の開いた窓へ。少し先のごみ箱を狙って、窓が並ぶタイミングで離そう。',
    'eccentric-boar':'奥の獣道を歩くイノシシへ。立ち止まりや向きを見て、少し先を狙おう。低めの弧でも矢が届きます。',
    'eccentric-basket':'体育館のリングへ。高い弧で直接狙うか、ボードを使おう。壁や天井にも跳ね返ります。',
    'eccentric-dandelion':'風を読んで、トレリスの開口の向こうの花壇へ。綿毛は風に大きく流されます。強く投げすぎず、抜ける高さを探そう。',
    'eccentric-card':'部屋の開口を抜けて、奥のコルクへ。カードは薄い姿勢で飛び、当たるとその向きで刺さります。',
    'eccentric-cannon':'防壁の向こう、砦の門へ。低すぎる弧は防壁に当たります。大砲の射角と強さを合わせよう。'
  }[state.id];}
  $('prediction-toggle').disabled=!trainingMode;if(!trainingMode){view.prediction=false;$('prediction-toggle').checked=false;}
  if(extraRoom()&&$('stage-help')){$('stage-help').hidden=false;$('stage-help').textContent='箱の手前で、風が右へ。左を狙って補正しよう。猫はのんびり散歩中。';}
  if($('fan-controls')){$('fan-controls').hidden=!extraRoom();$('fan-toggle').checked=fanEnabled;$('fan-toggle').disabled=busy();$('fan-state').textContent=fanEnabled?'ON · 右へ吹く':'風 OFF';}
  if(state.id!=='free'||!trainingMode)for(const id of ['distance','height'])$(id).disabled=true;
  for(const id of ['power','elevation','yaw'])$(id).disabled=busy()||!trainingMode||id==='yaw'&&side;
  $('throw-button').disabled=busy()||!trainingMode;
  if($('training-panel'))$('training-panel').hidden=!trainingMode;
  if($('training-banner'))$('training-banner').hidden=!trainingMode;
  if($('training-start'))$('training-start').disabled=busy()||pixelIntro?.active===true||trainingMode;
  if($('training-exit'))$('training-exit').disabled=busy()||pixelIntro?.active===true;
  if($('setup-description'))$('setup-description').hidden=!trainingMode;
  if($('hud-stage'))$('hud-stage').textContent=(trainingMode?'トレーニング · ':'')+STAGES[state.id].label;
  if($('hud-attempts'))$('hud-attempts').textContent=trainingMode?`練習 ${trainingStats.attempts}投`:chapterPractice?'プレビュー練習':`この面 ${state.attempts}投`;
  if($('arc-value')){$('arc-value').hidden=!trainingMode;$('arc-value').textContent=trainingMode?`${controls.elevation}°`:'';}
  for(const id of ['arc-lower','arc-higher'])if($(id))$(id).disabled=busy()||pixelIntro?.active===true||side;
  if($('arc-value'))$('arc-value').parentElement.hidden=side;
  if(!$('stage-select'))return;
  $('stage-select').value=state.id;$('stage-select').disabled=busy()||pixelIntro?.active===true;$('start-tutorial').disabled=busy()||pixelIntro?.active===true;
  $('tutorial-card').hidden=state.id!=='tutorial';
  const clear=chapterStage()?!trainingMode&&!chapterPractice&&chapterProgress.snapshot().completedIDs.includes(state.id):state.completed.includes(state.id);
  $('stage-progress').textContent=trainingMode?'トレーニング · 本編の投数・成功・ベストには入りません':chapterPractice?'プレビュー練習 · 本編の記録には入りません':state.id==='free'?'自由投球 · このプレイの記録':`${clear?'クリア済み · ':''}${state.attempts}投 / ${state.successes}成功`;
  $('stage-message').textContent=factoryStage()&&liveWorld()?.factoryType==='relay'&&game.phase==='miss'&&factorySession?.plateLatched?(liveWorld()?.worldVersion===47?(timedRelayState()?.expired?'時間切れ。リトライ R でもう一度。':'一球目が流れている！ その間に二球目を。'):'仕掛けが動いた！ 次の球で箱へ。'):busy()?'投球が落ち着いたら、ステージを変えられます。':state.id==='tutorial'&&clear?'できた！ 次は、1-1のゴミ箱へ。':chapterStage()&&clear?'もう一度挑戦するか、次の面へ。':side&&clear?'脇道クリア！ 本編とは別の挑戦です。':game.phase==='miss'&&state.id!=='free'?'向きや強さを変えて、もう一投。':'';
  $('stage-next').hidden=!(state.id==='tutorial'||chapterStage())||!clear;$('stage-next').disabled=busy();
  const next=getNextStage(state.id,chapterProgress.snapshot());$('stage-next').textContent=chapterStage()?next?`${STAGES[next].label}へ`:`第${chapterOf().number}章のトップへ`:'1-1へ';
  for(const option of $('stage-select').options){const preview=reviewStage(option.value);option.disabled=!preview&&!unlockedStage(option.value)&&option.value!==state.id;option.textContent=STAGES[option.value].label+(!unlockedStage(option.value)?preview?'（プレビュー練習）':'（未開放）':'');}
  $('stage-retry').hidden=state.id==='free';$('stage-retry').disabled=busy();
  if($('title-open')){$('title-open').hidden=!titleUnlocked();$('title-open').disabled=!titleUnlocked()||busy()||pixelIntro?.active===true;}
  gameShell?.update();saveUI?.update();
}
function cancelBaseballPitch(reason){
  if(!baseballIntro.cancel(reason))return false;
  lastInput={type:'cancel',reason:'pitch-'+reason};cancellations++;updateUI(true);return true;
}
$('pitch-cancel')?.addEventListener('click',()=>cancelBaseballPitch('cancel-button'));
$('game-menu-open')?.addEventListener('click',()=>cancelBaseballPitch('menu-open'),true);
$('game-menu')?.addEventListener('toggle',()=>{if(menuOpen())cancelBaseballPitch('menu-open');});
function fire(source='numeric'){
  if((source==='numeric'||source==='keyboard')&&!trainingMode)return false;
  if(busy()||titleActive()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open||$('store-dialog')?.open||$('chapter-top')&&!$('chapter-top').hidden)return false;
  if(liveWorld()?.worldVersion===36){
    cancelGesture('other-throw');
    if(!resetShot(game))return false;
    const accepted=baseballIntro.start({world:liveWorld(),controls,source});
    if(accepted){lastInput={type:'pitch-start',source,parameters:{...controls}};previousTime=performance.now();updateUI(true);}
    return accepted;
  }
  return fireNow(source);
}
function fireNow(source='numeric'){
  if((source==='numeric'||source==='keyboard')&&!trainingMode)return false;
  if(titleActive()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open||$('store-dialog')?.open||$('chapter-top')&&!$('chapter-top').hidden)return false;
  cancelGesture('other-throw');returnTowerLaunch();
  if(sideStage()){controls.yaw=0;updateControlLabels();}
  if(factoryStage()){factorySession.bankContacts=[];factorySession.completed=false;}
  const launchTime=environmentStartTime(),factoryStartSession=factoryStage()?structuredClone(factorySession):null,launchFrame=eccentricStage()?eccentricLaunchFrame(liveWorld(),launchTime):null;
  const accepted=eccentricStage()?throwEccentric(game,controls,liveWorld(),{startTime:launchTime}):throwCan(game,controls);
  if(accepted){
    if(trainingMode)trainingStats.attempts++;else stageProgress.launch(game.attempts);
    clearCurrentShot();outdoorEffects.clear();roomWind.reset();courseStepper.reset();
    if(schoolStage()||outdoorStage()||advancedStage())playStepper=makePlayStepper(liveWorld(),environmentStartTime());else playStepper?.reset();
    const itemId=getThrowableId(game),profileVersion=getThrowable(itemId).physics.version;
    shotContext={id:stageProgress.snapshot().id,shotId:game.attempts,training:trainingMode,worldVersion:liveWorld()?.worldVersion??1,fanEnabled,startTime:environmentStartTime(),finished:false,itemId,profileVersion,stageLoan:outdoorStage()||advancedStage(),factorySession:factoryStartSession,launchFrame,launch:{...launchSummary({...controls,power:Math.hypot(game.can.velocity.x,game.can.velocity.y,game.can.velocity.z)}),effort:controls.power},initialVelocity:{...game.can.velocity}};
    lastShotAnalysis=null;lastReleasedAim={parameters:{...controls},initialVelocity:{...game.can.velocity},presented:source==='gesture'&&lastPresentedAim?structuredClone(lastPresentedAim):null};
    chapterShot=!trainingMode&&chapterStage()?{...shotContext,eligible:!chapterPractice}:null;
    if(chapterShot?.eligible){chapterProgress.recordAttempt(chapterShot.id);chapterShot.rewardTicket=rewards.beginShot({stageId:chapterShot.id,itemId,stageLoan:chapterShot.stageLoan,eligible:true,source:'live',training:false,practice:false});persistChapter();}
    try{shotRecorder=((liveWorld()?.worldVersion??1)>=15||profileVersion===3)?createAdvancedRecorder(getSnapshot(game),controls,renderer.cameraSnapshot(),{worldVersion:liveWorld()?.worldVersion??1,stageId:stageProgress.snapshot().id,itemId,profileVersion,startTime:launchTime,factorySession:factoryStartSession,launchFrame}):createRecorder(getSnapshot(game),controls,renderer.cameraSnapshot(),liveWorld()?{worldVersion:liveWorld().worldVersion,...(itemId!=='can'?{itemId,profileVersion}:{})}:{});}catch{replayMessage('この一投の録画を開始できません。プレイの結果は記録します。');}
    lastInput={type:'throw',source,training:trainingMode,parameters:{...controls}};previousTime=performance.now();updateUI(true);if(source!=='gesture')canvas.scrollIntoView({block:'center',behavior:'instant'});
  }
  return accepted;
}
$('throw-button').addEventListener('click',()=>fire());
$('reset-button').addEventListener('click',()=>{cancelGesture('reset');if(resetShot(game)){if(factoryStage()){resetFactorySession(factorySession,liveWorld());Object.assign(controls,liveWorld().launch);}clearCurrentShot();playStepper?.reset();shotContext=null;updateUI(true);}});
$('quick-retry')?.addEventListener('click',()=>quickRetry('button'));
function quickRetryAvailable(){
  return !titleActive()&&!menuOpen()&&!pixelIntro?.active&&($('chapter-top')?.hidden??true)
    &&!document.querySelector('dialog[open]:not(#chapter-result)');
}
function cancelPendingChapterResult(){chapterResultDelay.cancel();chapterResultPending=false;}
function quickRetry(source='keyboard'){
  if(!quickRetryAvailable())return false;
  const stage=stageProgress.snapshot(),newRun=quickRetryStartsRun({phase:game.phase,stage,result:chapterResult});
  if(newRun&&!trainingMode&&!chapterPractice&&chapterStage())persistChapter();
  // Retire the queued release and recorder before resetting the live shot.
  cancelBaseballPitch('retry');cancelGesture('retry');pointers.clear();
  cancelPendingChapterResult();$('chapter-result')?.close();chapterResult=null;
  clearCurrentShot();chapterShot=null;shotContext=null;
  if(!resetShot(game,{cancelActive:true}))return false;
  if(newRun)stageProgress.select(stage.id);
  if(factoryStage()){resetFactorySession(factorySession,liveWorld());Object.assign(controls,liveWorld().launch);}
  roomWind.reset();courseStepper.reset();playStepper?.reset();
  lastShotAnalysis=null;lastPresentedAim=null;lastReleasedAim=null;trainingPreview=[];cueSnapshot={visible:false};angleCueUntil=0;
  rewardEffects.clear();outdoorEffects.clear();goalCameraPresented=null;goalCameraGoalId=null;
  view.mode='throw';previous3DMode='throw';
  lastInput={type:'retry',source,stageId:stageProgress.snapshot().id,attempts:game.attempts};
  previousTime=performance.now();updateControlLabels();updateUI(true);
  canvas.focus({preventScroll:true});return true;
}
if($('fan-toggle'))$('fan-toggle').addEventListener('change',()=>{if(busy()||!extraRoom()){$('fan-toggle').checked=fanEnabled;return;}cancelGesture('fan-toggle');fanEnabled=$('fan-toggle').checked;updateUI(true);});
function inside(event,rect){return event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;}
function sameLayout(gesture){const rect=canvas.getBoundingClientRect();return gesture.viewport.width===innerWidth&&gesture.viewport.height===innerHeight&&rect.width===gesture.rect.width&&rect.height===gesture.rect.height&&rect.left===gesture.rect.left&&rect.top===gesture.rect.top;}
function gestureAim(gesture,event,time=gesture.presentationTime??gesture.started){
  const size=Math.max(1,Math.min(gesture.rect.width,gesture.rect.height));
  const sign=pullInput()?-1:1;
  if(pullInput()){
    const mapped=mapScaledPull({scale:gesture.scale,right:(event.clientX-gesture.startX)*sign,up:(gesture.startY-event.clientY)*sign,mode:'C',projection:sideStage()?'2d':'3d',elevation:controls.elevation,baseYaw:liveWorld()?.launch.yaw??0,directionBasis:gesture.directionBasis,elapsedSeconds:Math.max(0,(time-gesture.started)/1000)});
    // Only the new drop world extends the established 3D arc range. Pull
    // strength and witnessed wobble keep the same mapper as displayed release.
    if(outdoorStage()||advancedStage()){const limits=inputLimits(),arc=clamp(controls.elevation,limits.minElevation,limits.maxElevation);mapped.actual.elevation=arc;mapped.base.elevation=arc;}
    return mapped;
  }
  // The previously selected swipe scheme retains its established mapping.
  if(sideStage()){const actual=sideAim((event.clientX-gesture.startX)*sign,(gesture.startY-event.clientY)*sign,size);return {...actual,actual:{power:actual.power,elevation:actual.elevation,yaw:0},base:{...actual},rawDistance:Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)/size,effectiveDistance:Math.hypot(event.clientX-gesture.startX,event.clientY-gesture.startY)/size,risk:0,delta:{yaw:0,elevation:0}};}
  const upward=(gesture.startY-event.clientY)*sign/size,sideways=(event.clientX-gesture.startX)*sign/size;
  const actual={power:Math.round(clamp(4+upward*18,4,13)*20)/20,elevation:controls.elevation,yaw:Math.round(clamp(sideways*60+(liveWorld()?.launch.yaw??0),-60,60)*2)/2};
  return {actual,base:{...actual},valid:upward>=.10,rawDistance:upward,effectiveDistance:upward,risk:0,delta:{yaw:0,elevation:0}};
}
function showGesture(gesture){
  $('gesture-feedback').hidden=!gesture.aim.directionLimited;
  if(gesture.aim.directionLimited)$('gesture-feedback').textContent='横方向の上限です。少し正面へ戻すと狙えます。';
  updateControlLabels(gesture.aim.actual);
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
    if(pullInput()&&!inside({clientX:gesture.lastX,clientY:gesture.lastY},gesture.rect))cancelGesture('outside-canvas');else releaseGesture(gesture,gesture.aim);
  }else cancelGesture('lostpointercapture');
},true);
canvas.addEventListener('pointerdown',event=>{
  if(titleActive()||menuOpen()||$('chapter-top')&&!$('chapter-top').hidden||$('chapter-result')?.open||replayDialog.open)return;
  if(event.button===2&&event.pointerType==='mouse'){
    event.preventDefault();cancelGesture('right-button');canvas.focus({preventScroll:true});
    if(sideStage())return;
    const rect=canvas.getBoundingClientRect();
    view.gesture={kind:'observe',temporaryObserve:true,id:event.pointerId,pointerType:event.pointerType,rect,viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,started:performance.now(),moved:false};
    canvas.setPointerCapture(event.pointerId);updateHint();return;
  }
  if(event.button!==0||pointers.size!==1||view.gesture||$('chapter-result')?.open||replayDialog.open||(view.mode==='throw'&&busy()))return;
  if(view.mode==='throw')returnTowerLaunch();
  outdoorEffects.gesture(event);
  const rect=canvas.getBoundingClientRect();
  if(!inside(event,rect))return;
  event.preventDefault();canvas.focus({preventScroll:true});
  if(view.mode==='throw'&&game.phase!=='ready'){resetShot(game);clearCurrentShot();playStepper?.reset();shotContext=null;updateUI(true);}
  const started=performance.now();
  view.gesture={kind:view.mode,id:event.pointerId,pointerType:event.pointerType,rect,viewport:{width:innerWidth,height:innerHeight},startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,started,presentationTime:started,scale:createPullScale({rect,startX:event.clientX,startY:event.clientY,projection:sideStage()?'2d':'3d',stagePower:liveWorld()?.launch.power??STAGES[stageProgress.snapshot().id]?.power??7.8,projectileProfile:{id:'can',radius:game.can.radius}})};
  if(pullInput()&&!sideStage())view.gesture.directionBasis=screenPullBasis(launchCueOrigin(game,liveWorld()?.origin),renderer.project);
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
  if((gesture.kind!=='throw'||pullInput())&&!inside(event,gesture.rect)){cancelGesture('outside-canvas');return;}
  if(gesture.kind==='observe')renderer.orbit(-(event.clientX-gesture.lastX)/gesture.rect.width*3.6,(event.clientY-gesture.lastY)/gesture.rect.height*2.4);
  else{gesture.aim=gestureAim(gesture,event);showGesture(gesture,event);}
  gesture.lastX=event.clientX;gesture.lastY=event.clientY;
});
function releaseGesture(gesture,aim){
  const accepted=aim?.valid&&sameLayout(gesture)&&!busy()&&(!pullInput()||inside({clientX:gesture.lastX,clientY:gesture.lastY},gesture.rect));
  view.gesture=null;wheelAnglePixels=0;$('gesture-feedback').hidden=true;
  if(canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);
  if(accepted){Object.assign(controls,aim.actual);updateControlLabels();fire('gesture');}
  else{if(gesture.kind==='throw'){lastInput={type:'cancel',reason:'short-or-invalid-release'};cancellations++;}updateControlLabels();updateHint();}
}
canvas.addEventListener('pointerup',event=>{
  const gesture=view.gesture;if(!gesture||gesture.id!==event.pointerId)return;
  event.preventDefault();
  if(gesture.temporaryObserve){finishRightObserve(event);return;}
  if(gesture.releasedCapture){cancelGesture('lostpointercapture');return;}
  if(pullInput()&&!inside(event,gesture.rect)){cancelGesture('outside-canvas');return;}
  gesture.lastX=event.clientX;gesture.lastY=event.clientY;
  if(gesture.kind==='throw'){gesture.aim=gestureAim(gesture,event,gesture.presentationTime);presentLive(gesture.presentationTime);}
  releaseGesture(gesture,gesture.kind==='throw'?gesture.aim:null);
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
  if(titleActive()||menuOpen())return;
  // Preserve browser zoom and focused form editing. Outside the canvas there
  // is no listener, so ordinary page scrolling keeps its native behavior.
  if(event.ctrlKey||event.metaKey||event.altKey||editingInput(document.activeElement))return;
  if(!Number.isFinite(event.deltaY)||event.deltaY===0)return;
  const unit=event.deltaMode===0?1:event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:0;
  const delta=event.deltaY*unit;
  if(!Number.isFinite(delta)||!delta)return;
  event.preventDefault();
  if(pointers.size>1){wheelAnglePixels=0;return;}
  if(view.gesture?.temporaryObserve){renderer.zoom(Math.exp(clamp(delta,-100,100)*.002));updateZoomControls();return;}
  if(view.mode==='observe'){cancelGesture('wheel');renderer.zoom(Math.exp(clamp(delta,-100,100)*.002));updateZoomControls();return;}
  if(busy()){wheelAnglePixels=0;return;}
  // In 2D a held vector owns its angle. A wheel cannot silently replace it.
  if(sideStage()&&view.gesture){wheelAnglePixels=0;return;}
  if(view.gesture&&!sameLayout(view.gesture)){cancelGesture('layout-change');return;}
  // Accumulate small trackpad deltas without rounding each event to a jump.
  wheelAnglePixels-=delta;
  const degrees=Math.trunc(wheelAnglePixels/24);
  wheelAnglePixels-=degrees*24;
  const limits=inputLimits(),lower=limits.minElevation,upper=limits.maxElevation;
  const beforeArc=controls.elevation;controls.elevation=clamp(controls.elevation+degrees,lower,upper);learnArcTip(beforeArc);if(degrees)angleCueUntil=performance.now()+1800;
  if((controls.elevation===upper&&wheelAnglePixels>0)||(controls.elevation===lower&&wheelAnglePixels<0))wheelAnglePixels=0;
  if(view.gesture?.kind==='throw'){view.gesture.aim=gestureAim(view.gesture,{clientX:view.gesture.lastX,clientY:view.gesture.lastY});presentLive(view.gesture.presentationTime);}
  updateControlLabels(view.gesture?.aim?.actual);updateHint();
},{passive:false});
document.addEventListener('keydown',event=>{
  if(quickRetryKey(event,{available:quickRetryAvailable()})){event.preventDefault();quickRetry('keyboard');return;}
  if(titleActive()||menuOpen()||$('replay-dialog').open)return;
  if(event.code==='Escape'){cancelGesture('escape');return;}
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
  if($('chapter-result')?.open||$('chapter-top')&&!$('chapter-top').hidden)return;
  if(event.target===canvas){
    const turns={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.10],ArrowDown:[0,-.10]};
    if(turns[event.code]){event.preventDefault();cameraAction(()=>renderer.orbit(...turns[event.code]));return;}
    if(event.key==='+'||event.key==='='||event.key==='-'){event.preventDefault();cameraAction(()=>renderer.zoom(event.key==='-'?1.14:.88));return;}
  }
  if(event.code!=='Space'&&event.code!=='Enter')return;
  const target=event.target;if(target instanceof HTMLElement&&(target.matches('button,input,select,textarea,summary,a')||target.isContentEditable))return;
  event.preventDefault();if(trainingMode&&view.mode==='throw'&&!view.gesture)fire('keyboard');
});
$('goal-camera-open')?.addEventListener('click',()=>{
  // This only reveals a second render of the live shot. It never changes the
  // thrower's orbit, input mapping, simulation clock, or replay camera tuple.
  goalCameraVisible=!goalCameraVisible;updateStageUI();if(goalCameraShown())goalRenderer?.resize();
});
function resize(){if(renderer.resize())cancelGesture('resize');if(goalCameraShown())goalRenderer?.resize();}
const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
if(goalCanvas)new ResizeObserver(()=>{if(goalCameraShown())goalRenderer?.resize();}).observe(goalCanvas);
window.addEventListener('resize',()=>{cancelGesture('resize');renderer.resize();if(goalCameraShown())goalRenderer?.resize();});
window.addEventListener('blur',()=>{cancelGesture('blur');pointers.clear();});
document.addEventListener('visibilitychange',()=>{cancelGesture('visibility-change');pointers.clear();previousTime=performance.now();if(document.hidden&&videoState){stopVideo(true);replayMessage('画面を離れたため動画の作成を取り消しました。',true,'VIDEO_CANCELLED');}});

// Replays are detached recorded poses, rendered on their own canvas. They never
// call throwCan or stepGame and never alter the live play record.
let shotRecorder=null,lastReplay=null,savedReplays=[],viewedReplay=null,viewedPayload=null,viewedResult=null,replayPlayer=null,replayTime=0,replayPlaying=false,replaySource='',replayDrag=null,videoState=null,videoBlob=null,videoName='',replayReturnsToResult=false;
const replayDialog=$('replay-dialog'),replayCanvas=$('replay-scene'),replayRenderer=createRenderer(replayCanvas),linkCache=new Map();
function replayMessage(text,viewer=false,code=''){
  const element=$(viewer?'replay-view-message':'replay-message');element.textContent=text;element.dataset.errorCode=code;
}
function roleText(replay){return courseReplayResult(replay).roles.map(role=>role.label).join(' · ');}
const timedRelayState=()=>liveWorld()?.worldVersion===47?factoryMotion(liveWorld(),sceneTime(),factorySession).relayClock:null;
function clearCurrentShot(){shotRecorder=null;lastReplay=null;$('shot-result').hidden=true;$('shot-roles').textContent='';$('shot-role-detail').textContent='';$('share-controls').hidden=true;$('share-link').value='';replayMessage('');}
function captureShot(){
  if((outdoorStage()||advancedStage())&&['success','miss'].includes(game.phase)&&shotContext?.endEnvironmentTime==null){shotContext.endEnvironmentTime=environmentTime;const capture=getSnapshot(game).goalCapture??null;shotContext.capture=capture?{...capture,environmentTime:shotContext.startTime+capture.time}:null;}
  if(['success','miss'].includes(game.phase)&&shotContext?.shotId===game.attempts&&lastShotAnalysis?.shotId!==game.attempts){
    const result=actualLiveResult();
    // Misses have no successful replay or entry-relative bounce totals. Keep
    // their actual launch, with complete witnessed contacts separately named.
    const analyticsTrace=analytics.snapshot(),roomContacts=shotContext.worldVersion>=2?playStepper?.snapshot().contacts??[]:[];
    lastShotAnalysis={shotId:game.attempts,success:game.phase==='success',launch:{...shotContext.launch},initialVelocity:{...shotContext.initialVelocity},result:result?structuredClone(result):null,
      witnessedContacts:{core:analyticsTrace.contacts.length,room:roomContacts.length},finalEntryTime:game.phase==='success'?result?.finalEntryTime??null:null};
    updateAnalysisUI();
  }
  if(factoryStage()&&liveWorld()?.factoryType==='relay'&&game.phase==='miss'&&factorySession?.plateLatched&&shotContext&&!shotContext.setupPresented&&(liveWorld()?.worldVersion!==47||factorySession.setupShot===game.attempts)){
    shotContext.setupPresented=true;Object.assign(controls,liveWorld().mechanism.goalLaunch);updateControlLabels();updateStageUI();
  }
  if(!shotRecorder){if(game.phase==='success')completeChapterShot();return;}
  try{
    const snapshot=getSnapshot(game);shotRecorder.record(snapshot);
    if(snapshot.phase!=='success'&&snapshot.phase!=='miss')return;
    const result=analytics.snapshot().result;lastReplay=shotRecorder.finish(snapshot,result||{});shotRecorder=null;
    if(!lastReplay)return;
    if(shotContext&&CHAPTER_IDS.includes(shotContext.id))lastReplay=createCourseReplay(lastReplay,shotContext.id,playStepper?.snapshot().contacts??[],{worldVersion:shotContext.worldVersion,itemId:shotContext.itemId,profileVersion:shotContext.profileVersion,fanEnabled:shotContext.id==='room-extra'&&shotContext.fanEnabled,startTime:shotContext.startTime,capture:snapshot.goalCapture??null,factorySession:shotContext.factorySession,launchFrame:shotContext.launchFrame,impactPose:playStepper?.snapshot().impactPose??null});
    const actual=courseReplayResult(lastReplay);
    $('shot-roles').textContent=(shotContext?.training?'練習の一投 · ':'')+roleText(lastReplay);
    $('shot-role-detail').textContent=impactSummary(actual)+' 箱の底での反発は床の回数に含めません。';
    if($('shot-launch-analysis'))$('shot-launch-analysis').textContent=shotContext.launch.text;
    $('shot-result').hidden=false;prepareReplayLink(lastReplay);
  }catch(error){shotRecorder=null;lastReplay=null;replayMessage('この一投のリプレイを作成できませんでした。プレイの結果は記録します。',false,error.code||'RECORD_FAILED');}
  finally{if(game.phase==='success')completeChapterShot(lastReplay);}
}
function storage(){try{const raw=window.localStorage;return reviewChapters45?(previewStorage??=createPreviewStorage(raw,'trash-shot-chapters45-preview-1:',['trash-shot-chapter3-preview-1:'])):reviewChapter3?(previewStorage??=createPreviewStorage(raw)):raw;}catch{return null;}}
function persistChapter(){
  const result=savePlayerSave(storage(),{progress:chapterProgress.snapshot(),rewards:rewards.snapshot()});
  if($('progress-status'))$('progress-status').textContent=result.ok?'続きの記録をこのブラウザに保存しました。':'このブラウザへ保存できませんでした。保存コードを出して持ち運べます。';
  return result;
}
function showChapterTop(closed=false,stageId=stageProgress.snapshot().id){
  if(titleActive()||busy()||pixelIntro?.active)return false;
  cancelGesture('chapter-top');const state=chapterProgress.snapshot(),panel=$('chapter-top');if(!panel)return false;if($('chapter-save-status'))$('chapter-save-status').hidden=true;
  const chapter=chapterOf(stageId),count=chapterCount(chapter,state),complete=count===chapter.ids.length;
  panel.hidden=false;panel.dataset.chapter=String(chapter.number);if(panel.querySelector('.home-art-tag'))panel.querySelector('.home-art-tag').textContent=chapter.number===3?'ひとつの部屋から、こんなところまで。':chapter.number===2?'教室の隅から、校舎の外へ。':'ひとつの部屋から、はじまる。';$('chapter-top-title').textContent=(closed&&complete?`第${chapter.number}章クリア！ `:'')+chapter.label;
  $('chapter-top-record').textContent=`第${chapter.number}章 ${count}/${chapter.ids.length}面クリア · 通算 ${state.cumulativeAttempts}投 / ${state.cumulativeSuccesses}成功${count?' · ベスト '+chapter.ids.filter(id=>state.completedIDs.includes(id)).map(id=>`${STAGES[id].number??(id==='first'?'1-1':'1-4')} ${state.stageBestAttempts[id]}投`).join(' / '):''}`;
  $('chapter-continue').textContent=complete&&chapter.number===1&&state.resumeStage==='school-classroom'?'第2章・学校へ進む → 2-1':`${STAGES[state.resumeStage].label}から続ける`;
  if($('game-menu'))$('game-menu').open=false;
  gameShell?.update();panel.scrollIntoView({block:'start',behavior:'instant'});$('chapter-continue')?.focus({preventScroll:true});return true;
}
function openStageSelection(){
  if(titleActive()||busy()||pixelIntro?.active)return false;
  cancelGesture('stage-selection');$('chapter-top').hidden=true;menuUI?.select('stages');
  if($('game-menu')){$('game-menu').open=true;$('game-menu-open')?.setAttribute('aria-expanded','true');}
  gameShell?.update();const target=$('chapter-stage-cards')??$('stage-select');
  target.scrollIntoView({block:'start',behavior:'instant'});target.querySelector('button:not(:disabled)')?.focus({preventScroll:true});return true;
}
function showTitleScreen(){
  if(!titleUI||!titleUnlocked()||busy()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open||$('store-dialog')?.open||inviteDialog?.open)return false;
  cancelGesture('title-screen');pointers.clear();angleCueUntil=0;cueSnapshot={visible:false};rewardEffects.clear();
  if($('game-menu')){$('game-menu').open=false;$('game-menu-open')?.setAttribute('aria-expanded','false');}
  if($('chapter-top'))$('chapter-top').hidden=true;
  const progress=chapterProgress.snapshot(),complete=progress.completedIDs.length===CHAPTER_IDS.length;
  const target=STAGES[progress.resumeStage],chapter=chapterOf(progress.resumeStage),chapterLabel=$('title-screen').querySelector('.title-chapter');if(chapterLabel){chapterLabel.querySelector('span').textContent=`CHAPTER ${chapter.number}`;chapterLabel.querySelector('strong').textContent=chapter.label;}
  titleUI.show({continueLabel:!titleSeen&&progress.resumeStage==='desk-over'?'1-2へ進む':'続きから',chapterComplete:complete,
    stageLabel:target.label,recordText:CHAPTERS.map(chapter=>`第${chapter.number}章 ${chapterCount(chapter,progress)}/${chapter.ids.length}`).join(' · ')+`面クリア · 合計 ${rewards.snapshot().totalPoints} pt`});
  if(!titleActive())return false;
  titleSeen=true;try{storage()?.setItem(titleSeenKey,'seen');}catch{}
  updateUI(true);return true;
}
function presentReward(award){
  const points=$('chapter-result-points'),breakdown=$('chapter-score-breakdown'),coins=$('chapter-reward-coins');
  for(const id of ['chapter-reward-score','chapter-score-detail'])if($(id))$(id).hidden=!award.ok;
  if(points){points.hidden=!award.ok;points.textContent=award.ok?`${award.points} pt`:'';}
  if(coins){coins.hidden=!award.ok;coins.textContent=award.ok?`+${award.coins} コイン · 残高 ${award.wallet}`:'';}
  if(breakdown){breakdown.replaceChildren();breakdown.hidden=!award.ok;if(award.ok){for(const row of award.breakdown){const line=document.createElement('li');line.textContent=`${row.label} +${row.points}`;breakdown.append(line);}if(award.newAchievements?.length){const line=document.createElement('li');line.className='reward-new-achievements';line.textContent='実績を獲得：'+award.newAchievements.map(a=>typeof a==='string'?Object.values(ACHIEVEMENTS).find(item=>item.id===a)?.label??a:a.label).join(' / ');breakdown.append(line);}}}
  if(!award.ok)rewardEffects.clear();
}
function storeAvailable(){return !titleActive()&&!busy()&&!pixelIntro?.active&&!$('chapter-result')?.open&&!replayDialog.open;}
function refreshEquipped(){
  if(chapterStage())selectStage(stageProgress.snapshot().id,{allowPractice:true,fromEntry:true,training:trainingMode});
  predictionCache?.clear();storeUI?.update();updateUI(true);
}
function storeAction(action,id){
  if(!storeAvailable())return {ok:false,message:'投球と結果画面を終えてから選べます。'};
  cancelGesture('store-item');const result=action==='buy'?rewards.purchase(id):rewards.equip(id);
  if(!result.ok)return {ok:false,message:result.reason==='insufficient-coins'?'コインが足りません。ステージをクリアして貯めよう。':'この物はまだ選べません。'};
  if(action==='buy')rewards.equip(id);
  refreshEquipped();const saved=persistChapter();
  return {ok:true,message:saved.ok?(outdoorStage()||advancedStage()?'部屋や学校で使う物を装備しました。この章は面ごとに投げ物が決まっています。':action==='buy'?'購入して装備しました。この面をはじめから遊べます。':'持ち替えました。この面をはじめから遊べます。'):'今回は装備しました。保存できないため、保存コードを控えてください。'};
}
function completeChapterShot(replay=null){
  const shot=chapterShot;if(trainingMode||game.phase!=='success'||!shot||!CHAPTER_IDS.includes(shot.id)||shot.shotId!==game.attempts)return;
  const actual=actualLiveResult();chapterShot=null;const attempts=stageProgress.snapshot().attempts,roles=actual?.roles??[];
  const goalCapture=getSnapshot(game).goalCapture??null,goalRole=goalCapture?.goalRole??'normal';
  const eligible=shot.eligible&&chapterProgress.clear(shot.id,attempts,{goalRole});
  const award=eligible?rewards.award({ticket:shot.rewardTicket,stageId:shot.id,itemId:shot.itemId,stageLoan:shot.stageLoan,goalRole,attempts,result:actual,eligible:true,source:'live',training:false,practice:false}):{ok:false};
  if(eligible){const next=eligible?getNextStage(shot.id,chapterProgress.snapshot()):previewNextStage(shot.id);if(next)chapterProgress.chooseStage(next);persistChapter();}
  chapterResult={stageId:shot.id,attempts,goalRole,goalId:goalCapture?.goalId??null,roles:roles.map(r=>({...r})),best:eligible?chapterProgress.snapshot().stageBestAttempts[shot.id]:null,practice:!eligible,itemId:shot.itemId,reward:award.ok?award:null,replay,analysis:lastShotAnalysis?structuredClone(lastShotAnalysis):{launch:{...shot.launch}}};
  const dialog=$('chapter-result');if(!dialog)return;
  cancelGesture('chapter-result');$('chapter-result-kind').textContent=eligible?'STAGE CLEAR':'PRACTICE CLEAR';$('chapter-result-title').textContent=STAGES[shot.id].label;
  $('chapter-result-attempts').textContent=`${attempts} 投で成功`;$('chapter-result-best').textContent=eligible?(award.ok?`${getThrowable(shot.itemId).label}のベスト ${award.itemBest.bestPoints} pt · ${award.itemBest.bestAttempts} 投`:`ベスト ${chapterResult.best} 投`):'練習の結果です。本編の記録は変わりません。';
  $('chapter-result-roles').replaceChildren(...roles.map(role=>{const chip=document.createElement('span');chip.className='shot-role-chip';chip.textContent=role.label;return chip;}));
  const goalLabel=liveWorld()?.goals?.find(g=>g.id===goalCapture?.goalId)?.label;
  $('chapter-result-detail').textContent=goalCapture?`${getThrowable(shot.itemId).label}が${goalLabel??'受け皿'}へ！ ${goalRole==='alternative'?'別解を発見。':''}`:getThrowable(shot.itemId).label+'が箱の中で落ち着いて、成功。';
  if(award.unlockedItem)$('chapter-result-detail').textContent+=` ${award.unlockedItem.label}を手に入れた！ 部屋や学校でも投げられます。`;
  presentReward(award);
  if($('chapter-launch-analysis'))$('chapter-launch-analysis').textContent=shot.launch.text;
  if($('chapter-impact-analysis'))$('chapter-impact-analysis').textContent=impactSummary(actual);
  for(const id of ['chapter-result-replay','chapter-result-save'])if($(id))$(id).hidden=!replay;
  const next=eligible?getNextStage(shot.id,chapterProgress.snapshot()):previewNextStage(shot.id);$('chapter-result-next').textContent=!eligible?reviewStage(next)?`${STAGES[next].label}を試す`:'練習を終える':firstTitlePending()&&titleUI?'タイトル画面へ':isChapterBoundary(shot.id)?`第${chapterOf(shot.id).number}章クリア · トップへ`:next?`${STAGES[next].label}へ`:`第${chapterOf(shot.id).number}章のトップへ`;
  if(eligible&&isChapterBoundary(shot.id)){const chapter=chapterOf(shot.id);$('chapter-result-kind').textContent='CHAPTER CLEAR';const fork=outdoorSnapshot(chapterProgress.snapshot());$('chapter-result-detail').textContent+=` 第${chapter.number}章クリア！ `+(chapter.number===1?'次は放課後の学校へ。':chapter.number===2?'次は外へ。神社のお賽銭から。':chapter.number>=4?'この章は一区切り。マップから別の道や未プレイの面へ。':`別解 ${fork.altCount}/4面。最初の道は第${fork.firstRoute}章・${fork.firstRoute===4?'工場':'色物'}。マップから未発見を探せます。`);}
  $('chapter-share-status').textContent='';$('chapter-share-text').hidden=true;gameShell?.update();storeUI?.update();
  const result=chapterResult;
  const showResult=()=>{if(chapterResult!==result)return;chapterResultPending=false;if(!dialog.open)dialog.showModal();updateUI(true);if(award.ok)rewardEffects.celebrate({holeInOne:award.holeInOne,tricky:roles.some(r=>r.id!=='direct'),points:award.points});};
  if(shot.id==='outdoor-river'&&goalRole==='normal'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){chapterResultPending=true;updateUI(true);chapterResultDelay.run(showResult,1900);}else showResult();
}
if($('chapter-result')){
  $('chapter-result').addEventListener('cancel',event=>{if(firstTitlePending()&&titleUI){event.preventDefault();$('chapter-result').close();showTitleScreen();}});
  $('chapter-result-next').addEventListener('click',()=>{const result=chapterResult;$('chapter-result').close();if(!result)return;if(firstTitlePending()&&showTitleScreen())return;const next=result.practice?previewNextStage(result.stageId):getNextStage(result.stageId,chapterProgress.snapshot());if(result.practice&&reviewStage(next))selectPlayable(next,{allowPractice:true});else if(result.practice||!next||isChapterBoundary(result.stageId))showChapterTop(!result.practice,result.stageId);else selectPlayable(next);});
  $('chapter-result-repeat').addEventListener('click',()=>quickRetry('result-button'));
  $('chapter-result-replay')?.addEventListener('click',()=>{if(!chapterResult?.replay)return;$('chapter-result').close();openReplay(chapterResult.replay,'latest');replayReturnsToResult=replayDialog.open;if(!replayDialog.open)$('chapter-result').showModal();});
  $('chapter-result-save')?.addEventListener('click',()=>{if(chapterResult?.replay)$('chapter-share-status').textContent=persistReplay(chapterResult.replay)?'この一投をこのブラウザに保存しました。':'この一投を保存できません。リプレイ画面からファイルで保存できます。';});
  $('chapter-result-share').addEventListener('click',async()=>{
    const result=chapterResult;if(!result)return;const link=result.replay?await prepareReplayLink(result.replay):{},url=link.url??new URL('./',location.href).href;
    const text=`TRASHOOT ${STAGES[result.stageId].label}：${result.attempts}投で成功 · ${result.roles.map(r=>r.label).join(' / ')}${result.reward?` · ${result.reward.points}点`:''} · ${getThrowable(result.itemId??'can').label}${result.best?` · ベスト${result.best}投`:''}${result.practice?'（練習）':''}`;
    $('chapter-share-text').value=text+'\n'+url;$('chapter-share-text').hidden=false;
    try{if(navigator.share){await navigator.share({title:'TRASHOOTの結果',text,url});$('chapter-share-status').textContent='共有先に結果を渡しました。';}else{if(!navigator.clipboard?.writeText)throw new Error('unsupported');await navigator.clipboard.writeText(text+'\n'+url);$('chapter-share-status').textContent='結果とリンクをコピーしました。';}}
    catch(error){$('chapter-share-status').textContent=error.name==='AbortError'?'共有を取り消しました。':'結果とリンクを選んで手動でコピーできます。';}
  });
}
if($('progress-export')){
  $('input-scheme').addEventListener('change',()=>{if(titleActive()||busy()||pixelIntro?.active){$('input-scheme').value=chapterProgress.snapshot().inputScheme;return;}cancelGesture('input-scheme');chapterProgress.setInputScheme($('input-scheme').value);persistChapter();updateUI(true);});
  $('chapter-home-open').addEventListener('click',()=>showChapterTop());$('chapter-continue').addEventListener('click',()=>selectPlayable(chapterProgress.snapshot().resumeStage));$('chapter-menu').addEventListener('click',openStageSelection);
}
const courseStorageKey='trash-shot-course-replays-v2';
function loadCourseRecords(){
  const text=storage()?.getItem(courseStorageKey);if(text==null)return [];
  if(text.length>5*COURSE_REPLAY_LIMITS.rawBytes+100)throw new Error('Oversized course records');const data=JSON.parse(text);if(!Array.isArray(data)||data.length>5)throw new Error('Invalid course records');
  return data.map(record=>{if(record?.version!==2)throw new Error('Invalid course record');return validateCourseReplay(record);});
}
function writeCourseRecords(records){
  const store=storage();if(!store)throw new Error('Storage unavailable');loadCourseRecords();const old=store.getItem(courseStorageKey),text=JSON.stringify(records.map(validateCourseReplay));
  try{store.setItem(courseStorageKey,text);if(store.getItem(courseStorageKey)!==text)throw new Error('Readback failed');}catch(error){try{if(old===null)store.removeItem(courseStorageKey);else store.setItem(courseStorageKey,old);}catch{}throw error;}
}
function refreshSaved(){
  const result=loadReplays(storage());let courses=[],roomRecords=[],itemRecords=[],schoolRecords=[],outdoorRecords=[];try{courses=loadCourseRecords();}catch{replayMessage('以前の第1章の保存記録を読み込めません。元の保存は残しています。');}try{roomRecords=loadPlayReplays(storage());}catch{replayMessage('部屋の保存記録を読み込めません。元の保存は残しています。');}try{itemRecords=loadItemReplays(storage());}catch{replayMessage('投げる物の保存記録を読み込めません。元の保存は残しています。');}try{schoolRecords=loadSchoolReplays(storage());}catch{replayMessage('学校の保存記録を読み込めません。元の保存は残しています。');}try{outdoorRecords=loadOutdoorReplays(storage());}catch{replayMessage('新しい受け皿の保存記録を読み込めません。元の保存は残しています。');}let advancedRecords=[];try{advancedRecords=loadAdvancedReplays(storage());}catch{replayMessage('新章の保存リプレイを読み込めません。元の保存は残しています。');}savedReplays=[...advancedRecords,...outdoorRecords,...schoolRecords,...itemRecords,...roomRecords,...courses,...result.replays];renderSaved();
  if(!result.ok)replayMessage('このブラウザの保存したリプレイを読み込めませんでした。',false,result.error?.code||'STORAGE_UNAVAILABLE');
  else if(result.discarded)replayMessage('開けない保存記録を除いて読み込みました。');
}
function renderSaved(){
  $('saved-replays').replaceChildren();$('saved-empty').hidden=savedReplays.length>0;
  for(const replay of savedReplays){
    const row=document.createElement('li'),label=document.createElement('span'),play=document.createElement('button'),remove=document.createElement('button');
    const payload=coursePayload(replay);label.textContent=`${replay.item?getThrowable(replay.item.id).label+' · ':''}${replay.course?STAGES[replay.course.stageId].label+' · ':''}${roleText(replay)} · ${payload.duration.toFixed(2)} 秒`;play.textContent='再生';remove.textContent='削除';play.type=remove.type='button';play.dataset.replayId=remove.dataset.replayId=payload.id;
    play.addEventListener('click',()=>openReplay(replay,'saved'));
    remove.addEventListener('click',()=>{if(replay.version===7){try{deleteAdvancedReplay(storage(),payload.id);refreshSaved();replayMessage('保存記録を削除しました。');}catch{replayMessage('保存記録を削除できませんでした。');}}else if(replay.version===6){try{deleteOutdoorReplay(storage(),payload.id);refreshSaved();replayMessage('保存記録を削除しました。');}catch{replayMessage('保存記録を削除できませんでした。');}}else if(replay.version===5){try{deleteSchoolReplay(storage(),payload.id);refreshSaved();replayMessage('学校の保存記録を削除しました。');}catch{replayMessage('保存記録を削除できませんでした。');}}else if(replay.version===4){try{deleteItemReplay(storage(),payload.id);refreshSaved();replayMessage('保存記録を削除しました。');}catch{replayMessage('保存記録を削除できませんでした。');}}else if(replay.version===3){try{deletePlayReplay(storage(),payload.id);refreshSaved();replayMessage('保存記録を削除しました。');}catch{replayMessage('保存記録を削除できませんでした。');}}else if(replay.version===2){try{writeCourseRecords(loadCourseRecords().filter(record=>coursePayload(record).id!==payload.id));refreshSaved();replayMessage('保存記録を削除しました。');}catch{replayMessage('保存記録を削除できませんでした。');}}else{const result=deleteReplay(storage(),payload.id);if(result.ok){refreshSaved();replayMessage('保存記録を削除しました。');}else replayMessage('保存記録を削除できませんでした。',false,result.error?.code||'STORAGE_FAILED');}});
    row.append(label,play,remove);$('saved-replays').append(row);
  }
}
function persistReplay(replay,viewer=false){
  if(!replay)return;
  if(replay.version===7){try{saveAdvancedReplay(storage(),replay);refreshSaved();replayMessage('この一投をこのブラウザに保存しました。',viewer);return true;}catch{replayMessage('保存できませんでした。ファイルで保存できます。',viewer,'STORAGE_FAILED');return false;}}
  if(replay.version===6){try{saveOutdoorReplay(storage(),replay);refreshSaved();replayMessage('この一投をこのブラウザに保存しました。',viewer);return true;}catch{replayMessage('保存できませんでした。リプレイのファイルで保存できます。',viewer,'STORAGE_FAILED');return false;}}
  if(replay.version===5){try{saveSchoolReplay(storage(),replay);refreshSaved();replayMessage('学校の一投をこのブラウザに保存しました。',viewer);return true;}catch{replayMessage('保存できませんでした。リプレイのファイルで保存できます。',viewer,'STORAGE_FAILED');return false;}}
  if(replay.version===4){try{saveItemReplay(storage(),replay);refreshSaved();replayMessage('この物の一投をこのブラウザに保存しました。',viewer);return true;}catch{replayMessage('保存できませんでした。リプレイのファイルで保存できます。',viewer,'STORAGE_FAILED');return false;}}
  if(replay.version===3){try{savePlayReplay(storage(),replay);refreshSaved();replayMessage('部屋の一投をこのブラウザに保存しました。',viewer);return true;}catch{replayMessage('保存できませんでした。リプレイのファイルで保存できます。',viewer,'STORAGE_FAILED');return false;}}
  if(replay.version===2){try{const valid=validateCourseReplay(replay),id=coursePayload(valid).id;writeCourseRecords([valid,...loadCourseRecords().filter(record=>coursePayload(record).id!==id)].slice(0,5));refreshSaved();replayMessage('第1章の一投をこのブラウザに保存しました。',viewer);return true;}catch{replayMessage('保存できませんでした。リプレイのファイルで保存できます。',viewer,'STORAGE_FAILED');return false;}}
  const result=saveReplay(storage(),replay);
  if(result.ok){refreshSaved();replayMessage('このブラウザに保存しました。再読み込み後も再生できます。',viewer);return true;}
  replayMessage('保存できませんでした。ファイルで保存できます。',viewer,result.error?.code||'STORAGE_FAILED');return false;
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function downloadReplay(replay,viewer=false){
  if(!replay)return;
  try{downloadBlob(new Blob([courseReplayToJSON(replay)],{type:'application/json'}),`trash-shot-${coursePayload(replay).id}.json`);replayMessage('リプレイのファイルを用意しました。ダウンロード先で保存を確認してください。',viewer);}catch(error){replayMessage('リプレイのファイルを作成できませんでした。',viewer,error.code||'DOWNLOAD_FAILED');}
}
function prepareReplayLink(replay){
  const id=coursePayload(replay).id;
  if(!linkCache.has(id)){
    const promise=buildCourseReplayURL(replay,location.href).then(url=>({url}),error=>({error}));linkCache.set(id,promise);
    if(linkCache.size>8)linkCache.delete(linkCache.keys().next().value);
  }
  return linkCache.get(id);
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
    try{await navigator.share({title:'TRASHOOTの成功リプレイ',text:roleText(replay),url:result.url});replayMessage('共有先にリンクを渡しました。投稿の完了は共有先で確認してください。',viewer);}
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
function restoreReplayCamera(){replayRenderer.setWorldView(viewedReplay?.course?roomWorld(viewedReplay.course.stageId,viewedReplay.course.worldVersion):null);replayRenderer.restoreCamera(viewedPayload.camera);}
function openReplay(input,source){
  if(busy()){replayMessage('投球が落ち着いてからリプレイを開けます。');return;}
  try{
    const replay=validateCourseReplay(input),payload=coursePayload(replay);cancelGesture('replay-open');stopVideo(true);videoBlob=null;videoName='';$('save-replay-video').disabled=$('share-replay-video').disabled=true;
    viewedReplay=replay;viewedPayload=payload;viewedResult=courseReplayResult(replay);replayPlayer=createCourseReplayPlayer(replay);replayTime=0;replayPlaying=true;replaySource=source;replayDrag=null;
    $('replay-title').textContent=source==='shared'?'共有された成功リプレイ':'成功した一投';
    $('replay-source').textContent=replay.course?'保存した軌道を、その面で見回せます。プレイヤーの進行は変わりません。':'記録は共通の3D画面で見回せます。';
    $('replay-role-title').textContent=(replay.item?getThrowable(replay.item.id).label+' · ':'')+roleText(replay);$('replay-seek').max=replayDisplayDuration();$('replay-share-controls').hidden=true;$('replay-share-link').value='';replayMessage('',true);
    if($('replay-launch-analysis'))$('replay-launch-analysis').textContent=launchSummary({...payload.controls,power:Math.hypot(payload.frames[0].velocity.x,payload.frames[0].velocity.y,payload.frames[0].velocity.z)})?.text??'';
    if(!replayDialog.open)replayDialog.showModal();replayRenderer.resize();restoreReplayCamera();prepareReplayLink(replay);renderReplay(0);replayCanvas.focus({preventScroll:true});
  }catch(error){replayMessage('このリプレイを開けませんでした。',false,error.code||'INVALID_REPLAY');}
}
function closeReplay({returnResult=true}={}){stopVideo(true);replayPlaying=false;replayDrag=null;if(replayDialog.open)replayDialog.close();if(replayReturnsToResult){replayReturnsToResult=false;if(returnResult&&chapterResult&&!$('chapter-result').open)$('chapter-result').showModal();}}
$('replay-close').addEventListener('click',closeReplay);
replayDialog.addEventListener('cancel',event=>{event.preventDefault();closeReplay();});
$('replay-play').addEventListener('click',()=>{if(videoState){replayMessage('動画の作成中は再生を止められません。閉じると取り消せます。',true);return;}if(replayTime>=replayDisplayDuration())replayTime=0;replayPlaying=!replayPlaying;renderReplay(0);});
$('replay-restart').addEventListener('click',()=>{if(videoState)return;replayTime=0;replayPlaying=true;renderReplay(0);});
$('replay-camera-reset').addEventListener('click',()=>viewedReplay&&restoreReplayCamera());
$('replay-seek').addEventListener('input',()=>{if(videoState)return;replayPlaying=false;const value=Number($('replay-seek').value);replayTime=value>=replayDisplayDuration()-1e-9?replayDisplayDuration():clamp(value,0,replayDisplayDuration());renderReplay(0);});
const replayDisplayDuration=()=>replayPlayer?(replayPlayer.duration+([6,7].includes(viewedReplay?.version)&&viewedReplay.course.stageId==='outdoor-river'&&viewedReplay.course.capture?.goalRole==='normal'?4:0)):0;
function renderReplay(dt){
  if(!replayDialog.open||!replayPlayer)return;
  if(replayPlaying){replayTime=Math.min(replayDisplayDuration(),replayTime+dt);if(replayTime>=replayDisplayDuration())replayPlaying=false;}
  const course=viewedReplay.course,sample=replayPlayer.sample(replayTime),replayWorld=course?roomWorld(course.stageId,course.worldVersion):null;replayRenderer.render(sample,viewedPayload.controls,{prediction:false,numericLabels:true,windArc:[],environment:replayWorld?.environment??(course?'room':null),world:replayWorld,course:course?roomCourse(course.stageId,course.worldVersion):null,extraRoom:course?.stageId==='room-extra',fanEnabled:course?.fanEnabled,environmentTime:replayWorld?.environment==='outdoor'?(course.startTime??0)+replayTime:sample.environmentTime??replayTime,factorySession:sample.factorySession,impactPose:sample.impactPose,capture:sample.goalCapture??null,effects:[],stageNumber:course?STAGES[course.stageId].number??(course.stageId==='first'?'1-1':'1-4'):null,monitorCanvas:pixelIntro?.image});
  $('replay-play').textContent=replayPlaying?'一時停止':replayTime>=replayDisplayDuration()?'もう一度':'再生';
  $('replay-seek').value=replayTime;$('replay-time').textContent=`${replayTime.toFixed(2)} / ${replayDisplayDuration().toFixed(2)} 秒`;
  if(videoState&&!replayPlaying&&videoState.recorder.state==='recording'&&!videoState.stopping){const state=videoState;state.stopping=true;setTimeout(()=>{if(videoState===state)stopVideo(false);},180);}
}
new ResizeObserver(()=>replayRenderer.resize()).observe(replayCanvas);
replayCanvas.addEventListener('contextmenu',event=>event.preventDefault());
replayCanvas.addEventListener('pointerdown',event=>{if(event.button!==0||pointers.size!==1)return;event.preventDefault();replayCanvas.focus({preventScroll:true});replayDrag={id:event.pointerId,x:event.clientX,y:event.clientY};replayCanvas.setPointerCapture(event.pointerId);});
replayCanvas.addEventListener('pointermove',event=>{if(!replayDrag||replayDrag.id!==event.pointerId)return;if(pointers.size>1){replayDrag=null;return;}event.preventDefault();const rect=replayCanvas.getBoundingClientRect();replayRenderer.orbit(-(event.clientX-replayDrag.x)/rect.width*3.6,(event.clientY-replayDrag.y)/rect.height*2.4);replayDrag.x=event.clientX;replayDrag.y=event.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])replayCanvas.addEventListener(type,()=>{replayDrag=null;});
replayCanvas.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey||!Number.isFinite(event.deltaY))return;event.preventDefault();const unit=event.deltaMode===1?16:event.deltaMode===2?replayCanvas.clientHeight:1;replayRenderer.zoom(Math.exp(clamp(event.deltaY*unit,-100,100)*.002));},{passive:false});
replayCanvas.addEventListener('keydown',event=>{const turns={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]};if(turns[event.code]){event.preventDefault();replayRenderer.orbit(...turns[event.code]);}else if(['+','=','-'].includes(event.key)){event.preventDefault();replayRenderer.zoom(event.key==='-'?1.14:.88);}else if(event.code==='Space'){event.preventDefault();$('replay-play').click();}});
$('replay-file').addEventListener('change',async()=>{const file=$('replay-file').files[0];$('replay-file').value='';if(!file)return;try{if(file.size>COURSE_REPLAY_LIMITS.rawBytes)throw Object.assign(new Error(),{code:'REPLAY_TOO_LARGE'});openReplay(parseCourseReplayJSON(await file.text()),'file');}catch(error){replayMessage('リプレイのファイルを開けません。形式や大きさを確認してください。',false,error.code||'INVALID_REPLAY');}});
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
    const state={recorder,stream,mime,chunks:[],bytes:0,cancelled:false,stopping:false,deadline:null,replayId:viewedPayload.id};videoState=state;videoBlob=null;$('save-replay-video').disabled=$('share-replay-video').disabled=true;$('record-replay-video').disabled=true;$('replay-seek').disabled=true;
    recorder.addEventListener('dataavailable',event=>{if(!event.data.size)return;state.bytes+=event.data.size;if(state.bytes>12*1024*1024){state.cancelled=true;replayMessage('動画が大きすぎるため作成を取り消しました。',true,'VIDEO_TOO_LARGE');stopVideo(true);}else state.chunks.push(event.data);});
    recorder.addEventListener('error',()=>{state.cancelled=true;replayMessage('動画を作成できませんでした。',true,'VIDEO_FAILED');stopVideo(true);});
    recorder.addEventListener('stop',()=>{const current=videoState===state;cleanupVideo(state);if(!current||state.cancelled||!state.chunks.length)return;videoBlob=new Blob(state.chunks,{type:recorder.mimeType||mime});const mp4=videoBlob.type.includes('mp4');videoName=`trash-shot-${state.replayId}.${mp4?'mp4':'webm'}`;$('save-replay-video').disabled=$('share-replay-video').disabled=false;replayMessage(`動画を作成しました（${mp4?'MP4':'WebM'}）。対応する共有先で使えます。`,true);});
    replayTime=0;replayPlaying=true;renderReplay(0);recorder.start(200);state.deadline=setTimeout(()=>{if(videoState===state){state.cancelled=true;replayMessage('動画の作成が終わらないため取り消しました。',true,'VIDEO_TIMEOUT');stopVideo(true);}},12000);replayMessage('リプレイを動画にしています。見回しも録画に含まれます。閉じると取り消せます。',true);
  }catch{if(videoState?.recorder===recorder)cleanupVideo(videoState);else stream?.getTracks().forEach(track=>track.stop());$('record-replay-video').disabled=false;$('replay-seek').disabled=false;replayMessage('このブラウザでは動画を作成できません。',true,'VIDEO_UNSUPPORTED');}
}
$('record-replay-video').addEventListener('click',recordVideo);
$('save-replay-video').addEventListener('click',()=>{if(videoBlob)downloadBlob(videoBlob,videoName);});
$('share-replay-video').addEventListener('click',async()=>{if(!videoBlob)return;try{const file=new File([videoBlob],videoName,{type:videoBlob.type});if(!navigator.share||!navigator.canShare?.({files:[file]})){replayMessage('この共有先では動画を渡せません。「動画を保存」から使えます。',true,'VIDEO_SHARE_UNSUPPORTED');return;}await navigator.share({files:[file],title:'TRASHOOTの一投'});replayMessage('共有先に動画を渡しました。投稿の完了は共有先で確認してください。',true);}catch(error){replayMessage(error.name==='AbortError'?'動画の共有を取り消しました。':'動画を共有できませんでした。',true,error.name==='AbortError'?'SHARE_CANCELLED':'SHARE_FAILED');}});
refreshSaved();
let sharedImportTicket=0;
async function loadSharedReplay(){
  const ticket=++sharedImportTicket,hash=location.hash;
  if(!/^#ts[rc]\d+\./.test(hash))return;
  if(titleActive())titleUI.hide();
  if(replayDialog.open)closeReplay({returnResult:false});
  viewedReplay=null;replayPlayer=null;replayTime=0;replaySource='';$('replay-role-title').textContent='';replayMessage('');
  try{const replay=await decodeCourseReplay(hash);if(ticket===sharedImportTicket&&location.hash===hash)openReplay(replay,'shared');}
  catch(error){if(ticket===sharedImportTicket&&location.hash===hash)replayMessage('共有されたリプレイを開けません。リンクが欠けているか、未対応の形式です。',false,error.code||'INVALID_REPLAY');}
}
window.addEventListener('hashchange',loadSharedReplay);
loadSharedReplay();
window.__trashShot={goalCueSnapshot:()=>structuredClone(goalCueState),game,controls,pitchSnapshot:()=>baseballIntro.snapshot(liveWorld(),game.can.radius),advancedSnapshot:()=>({active:advancedStage(),preview:reviewChapters45,stageId:stageProgress.snapshot().id,environmentTime,startTime:environmentStartTime(),sceneTime:sceneTime(),towerViewMode,goalCameraGoalId,motion:eccentricStage()?structuredClone(eccentricMotion(liveWorld(),sceneTime())):null,factorySession:factorySession?structuredClone(factorySession):null,timedRelay:liveWorld()?.worldVersion===47?structuredClone(factoryMotion(liveWorld(),sceneTime(),factorySession)):null,impactPose:playStepper?.snapshot().impactPose??null}),outdoorSnapshot:()=>({active:outdoorStage(),preview:reviewChapter3,stageId:stageProgress.snapshot().id,environmentTime,startTime:environmentStartTime(),sceneTime:sceneTime(),motion:outdoorStage()?structuredClone(outdoorMotion(liveWorld(),sceneTime())):null,facts:outdoorSnapshot(chapterProgress.snapshot()),audio:outdoorEffects.snapshot(),goalCamera:{enabled:goalCameraVisible,visible:goalCameraShown(),mode:'inset',mainMode:'thrower',stageId:goalCameraShown()?stageProgress.snapshot().id:null,camera:renderer.cameraSnapshot(),insetVisible:goalCameraShown(),insetCamera:goalRenderer?.cameraSnapshot()??null,presented:goalCameraPresented?{...goalCameraPresented}:null,prediction:false,numericLabels:false}}),schoolSnapshot:()=>({active:schoolStage(),stageId:stageProgress.snapshot().id,environmentTime,phase:schoolStartTime(),sceneTime:sceneTime()}),menuSnapshot:()=>({selected:menuUI?.selected()??null,open:$('game-menu')?.open===true,arcTipVisible:$('arc-tip')?.hidden===false,arcTipLearned}),titleSnapshot:()=>({active:titleActive(),seen:titleSeen,unlocked:titleUnlocked(),firstResultPending:firstTitlePending()}),stageSnapshot:()=>({...stageProgress.snapshot(),completed:[...stageProgress.snapshot().completed.filter(id=>!CHAPTER_IDS.includes(id)),...chapterProgress.snapshot().completedIDs]}),chapterSnapshot:()=>({...chapterProgress.snapshot(),training:trainingMode,practice:chapterPractice,currentStage:stageProgress.snapshot().id,result:chapterResult?{stageId:chapterResult.stageId,attempts:chapterResult.attempts,roles:structuredClone(chapterResult.roles),best:chapterResult.best,practice:chapterResult.practice,itemId:chapterResult.itemId,reward:structuredClone(chapterResult.reward),analysis:structuredClone(chapterResult.analysis)}:null}),courseSnapshot:()=>playStepper?.snapshot()??courseStepper.snapshot(),rewardSnapshot:()=>rewards.snapshot(),throwableSnapshot:()=>({id:getThrowableId(game),profile:getThrowableProfile(game)??getThrowable(getThrowableId(game)).physics}),playSnapshot:()=>structuredClone({roomContacts:playStepper?.snapshot()??null,cue:cueSnapshot,trainingPreview:trainingPreview??[],frozenScale:view.gesture?.scale??null,presentedAim:lastPresentedAim,releasedAim:lastReleasedAim,resultAnalysis:lastShotAnalysis,numericLabels:trainingMode,predictionVisible:trainingMode&&view.prediction}),snapshot:()=>getSnapshot(game),cameraSnapshot:()=>renderer.cameraSnapshot(),introSnapshot:()=>pixelIntro?.snapshot()??null,gimmickSnapshot:()=>({active:extraRoom(),fanEnabled,...(playStepper?.snapshot()??roomWind.snapshot()),windArc:(trainingPreview??[]).map(p=>({...p}))}),inputSnapshot:()=>({scheme:chapterProgress.snapshot().inputScheme,training:trainingMode,trainingStats:{...trainingStats},worldVersion:liveWorld()?.worldVersion??1,mode:view.mode,prediction:view.prediction,activeGesture:view.gesture?.kind||null,heldAim:view.gesture?.kind==='throw'?{...view.gesture.aim.actual,valid:view.gesture.aim.valid,risk:view.gesture.aim.risk,rawDistance:view.gesture.aim.rawDistance}:null,lastPaintedPhase:view.gesture?.kind==='throw'?(view.gesture.presentationTime-view.gesture.started)/1000:null,activePointers:pointers.size,cancellations,lastInput:lastInput?structuredClone(lastInput):null}),analyticsSnapshot:()=>({...analytics.snapshot(),result:actualLiveResult()}),replaySnapshot:()=>({active:replayDialog.open,playing:replayPlaying,time:replayTime,duration:replayPlayer?.duration||0,sourceId:viewedPayload?.id||null,sourceType:replaySource,recordedFrames:viewedPayload?.frames.length||0,current:replayPlayer?structuredClone(replayPlayer.sample(replayTime)):null,result:viewedResult?structuredClone(viewedResult):null,course:viewedReplay?.course?structuredClone(viewedReplay.course):null,savedCount:savedReplays.length,latestId:lastReplay?coursePayload(lastReplay).id:null,recording:Boolean(videoState),video:videoBlob?{size:videoBlob.size,mime:videoBlob.type}:null})};
updateControlLabels();updateUI(true);
// Explicit stages and shared records bypass the fresh pixel introduction.
const entryStage=new URLSearchParams(location.search).get('stage')??(reviewChapters45?'factory-shutter':reviewChapter3?'outdoor-shrine':null);
if($('chapter3-preview-note')){$('chapter3-preview-note').hidden=!(reviewChapter3||reviewChapters45);if(reviewChapters45)$('chapter3-preview-note').textContent='第4・5章の開発試遊版。未開放面も練習で選べます。保存はフレンド版・第3章版と別です。';}
if($('outdoor-sound'))$('outdoor-sound').addEventListener('change',event=>{outdoorEffects.setEnabled(event.target.checked);if(event.target.checked)outdoorEffects.gesture(event);});
window.addEventListener('pagehide',()=>outdoorEffects.destroy());
const sharedEntry=/^#ts[rc]\d+\./.test(location.hash);
if(!sharedEntry&&STAGES[entryStage])selectStage(entryStage,{allowPractice:true,fromEntry:true});
const introSeenKey='trash-shot-pixel-intro-1';
function updateIntroUI(){
  if(!pixelIntro)return;
  const state=pixelIntro.snapshot(),panel=$('pixel-intro-controls');if(panel)panel.hidden=!state.active;
  document.body.classList.toggle('pixel-intro-active',state.active);
  if($('pixel-intro-aim'))$('pixel-intro-aim').textContent=state.gesture?.valid?'離して一投。向きで角度、長さで強さ。':state.mode==='pullback'?'部屋へ…':`${pullInput()?'左下へ引く':'右上へなぞる'}。向きで角度、長さで強さ。離して一投。`;
  if($('pixel-intro-skip'))$('pixel-intro-skip').disabled=state.mode==='pullback';
  if($('pixel-intro-retry'))$('pixel-intro-retry').hidden=state.world.phase!=='miss';
}
if($('pixel-intro-controls')){
  pixelIntro=createPixelIntro(canvas,{inputScheme:()=>chapterProgress.snapshot().inputScheme,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,onReveal:({shouldPersist})=>{cancelGesture('intro-reveal');pointers.clear();selectStage('first',{fromIntro:true});if(shouldPersist){chapterProgress.setIntroSeen(true);persistChapter();try{storage()?.setItem(introSeenKey,'seen');}catch{}}},onDone:()=>{updateIntroUI();updateUI(true);canvas.scrollIntoView({block:'center',behavior:'instant'});}});
  for(const [type,method] of [['pointerdown','down'],['pointermove','move'],['pointerup','up'],['pointercancel','cancel'],['lostpointercapture','cancel']])canvas.addEventListener(type,event=>{if(!pixelIntro.active)return;event.preventDefault();event.stopImmediatePropagation();if(pointers.size>1){pixelIntro.cancel();return;}pixelIntro[method](event);updateIntroUI();},{capture:true});
  canvas.addEventListener('wheel',event=>{if(pixelIntro.active&&!event.ctrlKey&&!event.metaKey){event.preventDefault();event.stopImmediatePropagation();}},{capture:true,passive:false});
  document.addEventListener('keydown',event=>{if(!pixelIntro.active||event.target!==canvas&&event.code!=='Escape')return;if(event.code==='Escape')pixelIntro.cancel();event.preventDefault();event.stopImmediatePropagation();},{capture:true});
  for(const type of ['blur','resize'])window.addEventListener(type,()=>pixelIntro.cancel());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pixelIntro.cancel();});
  $('pixel-intro-skip')?.addEventListener('click',event=>pixelIntro.skip(event.isTrusted));$('pixel-intro-retry')?.addEventListener('click',()=>pixelIntro.retry());
  $('intro-replay')?.addEventListener('click',()=>{if(titleActive()||busy()||pixelIntro.active)return;cancelGesture('intro-replay');if($('chapter-top'))$('chapter-top').hidden=true;introHasRun=true;pixelIntro.start();updateIntroUI();canvas.scrollIntoView({block:'center',behavior:'instant'});});
  if(!sharedEntry&&!STAGES[entryStage]){let seen=chapterProgress.snapshot().introSeen;try{seen=seen||storage()?.getItem(introSeenKey)==='seen';}catch{}if(seen||loadedProgress.data){selectStage(chapterProgress.snapshot().resumeStage,{fromEntry:true});titleOnEntry=titleUnlocked();}else{introHasRun=true;pixelIntro.start();}}
  updateIntroUI();
}

// Diagnosis observes input only after an explicit opt-in. The game's input
// handlers above remain independent of the record and its copy controls.
function setupInputCheck(){
  const [entry,panel,copy,close,text,message]=['input-check-open','input-check-panel','input-check-copy','input-check-close','input-check-text','input-check-message'].map($);
  // A new app can be loaded by an older cached HTML page without these nodes.
  if(![entry,panel,copy,close,text,message].every(Boolean))return;
  const version='20261012-school-window-1',limit=24,maxBytes=12000;
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

const predictionCache=new Map();
function previewFor(aim){
  if(!trainingMode||!view.prediction||busy())return [];
  const world=liveWorld(),moving=Boolean(world?.student||world?.students?.length||outdoorStage()||advancedStage()),startTime=moving?environmentStartTime():0,key=[getThrowableId(game),stageProgress.snapshot().id,game.bin.center.z,game.bin.height,aim.power,aim.elevation,aim.yaw,fanEnabled].join('/');
  if(!moving&&predictionCache.has(key)){const arc=predictionCache.get(key);predictionCache.delete(key);predictionCache.set(key,arc);return arc;}
  // Free / side use their unchanged renderer predictor. Chapter training uses
  // exactly the same room + optional wind integrator as the accepted shot.
  const arc=world?factoryStage()?predictFactoryArc(game,aim,world,{startTime,session:factorySession,maxSeconds:5}):eccentricStage()?predictEccentricArc(game,aim,world,{startTime,maxSeconds:5}):outdoorStage()?predictOutdoorArc(game,aim,world,{startTime,maxSeconds:5}):schoolStage()?predictSchoolArc(game,aim,world,{startTime,maxSeconds:5}):predictPlayRoomArc(game,aim,world,{extra:extraRoom(),fanEnabled,maxSeconds:5}):null;
  if(arc&&!moving){predictionCache.set(key,arc);if(predictionCache.size>96)predictionCache.delete(predictionCache.keys().next().value);}
  return arc;
}
// Goal hints are presentation only; they never change the physical world,
// camera, launch, progress, rewards or replay. Entry hints wait for visible play.
function goalCueBlocked(){return titleActive()||pixelIntro?.active===true||replayDialog.open||$('chapter-result')?.open||$('store-dialog')?.open||$('game-menu')?.open||($('chapter-top')&&!$('chapter-top').hidden);}
function goalCueTargets(){
  const world=liveWorld();
  const declared=world?.environment==='outdoor'?outdoorGoals(world,sceneTime()):world?.environment==='factory'?factoryGoals(world,sceneTime(),factorySession):world?.environment==='eccentric'?eccentricGoals(world,sceneTime()):world?.goals;
  const goals=declared?.filter(g=>g.role!=='alternative')??[];
  if(goals.length)return goals.map(g=>({...g,center:{...g.center}}));
  return [{id:'stage-bin',role:'normal',kind:'bin',shape:'circle',center:{...game.bin.center,y:game.bin.height},normal:{x:0,y:1,z:0},up:{x:0,y:0,z:1},radius:game.bin.radius}];
}
function beginGoalCue(source='button'){
  if(goalCueBlocked())return false;
  if(view.gesture?.kind==='throw')cancelGesture('goal-confirm');
  goalCueStage=stageProgress.snapshot().id;goalCuePending=false;goalCueSource=source;goalCueUntil=performance.now()+GOAL_CUE_MS;return true;
}
$('goal-confirm')?.addEventListener('click',()=>beginGoalCue());
$('goal-confirm')?.addEventListener('pointerdown',()=>{if(view.gesture?.kind==='throw')cancelGesture('goal-confirm');});
$('goal-confirm')?.addEventListener('focus',()=>{if(view.gesture?.kind==='throw')cancelGesture('goal-confirm');});
function paintGoalCue(now){
  const overlay=$('goal-cue');if(!overlay)return;
  const blocked=goalCueBlocked();if($('goal-confirm'))$('goal-confirm').disabled=blocked;
  const stageId=stageProgress.snapshot().id;
  if(blocked||view.gesture?.kind==='throw'){
    if(view.gesture?.kind==='throw'){goalCueUntil=0;goalCuePending=false;goalCueStage=stageId;}
    overlay.replaceChildren();goalCueState={visible:false,stageId,source:goalCueSource,markers:[],reason:blocked?'play-hidden':'aiming'};return;
  }
  if(goalCueStage!==stageId||goalCuePending)beginGoalCue('stage-entry');
  const remaining=Math.max(0,goalCueUntil-now);
  if(!remaining){overlay.replaceChildren();goalCueState={visible:false,stageId,source:goalCueSource,markers:[],reason:'expired'};return;}
  const rect=canvas.getBoundingClientRect(),targets=goalCueTargets();
  const pip=$('goal-camera'),pr=pip&&!pip.hidden?pip.getBoundingClientRect():null;
  const avoidRects=pr&&pr.width>0&&pr.height>0?[{x:pr.left-rect.left,y:pr.top-rect.top,width:pr.width,height:pr.height}]:[];
  const cue=buildGoalCue({targets,avoidRects,project:renderer.project,width:rect.width,height:rect.height,opacity:Math.min(1,remaining/450),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
  overlay.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);overlay.innerHTML=goalCueMarkup(cue);
  goalCueState={...cue,stageId,source:goalCueSource,remainingMS:remaining,durationMS:GOAL_CUE_MS,targetIds:targets.map(t=>t.id),targets:targets.map(t=>({id:t.id,kind:t.kind,center:{...t.center}})),sceneTime:sceneTime(),worldVersion:liveWorld()?.worldVersion??0};
}

function paintPlayCue(aim){
  const overlay=$('play-cue');if(!overlay)return;
  const rect=canvas.getBoundingClientRect();overlay.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  if(!aim||busy()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open){overlay.replaceChildren();cueSnapshot={visible:false,numericLabels:trainingMode,predictionVisible:trainingMode&&view.prediction&&!busy(),predictionPoints:trainingPreview?.length??0};return;}
  const origin=launchCueOrigin(game,liveWorld()?.origin);
  const cue=createPlayCue(origin,aim,renderer.project,rect.width,rect.height);
  const gesture=view.gesture?.kind==='throw'?view.gesture:null;
  overlay.innerHTML=playCueMarkup(cue,{risk:gesture?.aim?.risk>0,heading:gesture?.aim?.vectorPull===true})+(gesture?pullHandleMarkup(gesture,gesture.aim,sideStage(),pullInput()?-1:1,cue.originVisible?cue.projectedOrigin:null):'');
  cueSnapshot={visible:cue.visible,origin:{...cue.origin},projectedOrigin:{...cue.projectedOrigin},projectedBall:renderer.project(game.can.position),originVisible:cue.originVisible,numericLabels:trainingMode,predictionVisible:trainingMode&&view.prediction,predictionPoints:trainingPreview?.length??0,arrowWorldLength:cue.arrowWorldLength,arrowScreenLength:cue.initial.length,
    angleFan:{visible:cue.sector.length>=3,segments:cue.angleArc.segments.length},parameters:{...aim},risk:gesture?.aim?.risk??0};
  lastPresentedAim={parameters:{...aim},elapsedSeconds:gesture?(gesture.presentationTime-gesture.started)/1000:null,scale:gesture?.scale?structuredClone(gesture.scale):null};
}
function presentGoalCamera(world,stage){
  if(!goalCameraShown()||!goalRenderer||!world)return;
  if(goalCameraStage!==stageProgress.snapshot().id||goalCameraWorld?.worldVersion!==world.worldVersion){
    // Frame the declared goal region once, rather than tracking a moving goal
    // or the ball. Dynamic poses still use the main view's exact live clock.
    const goals=world.goals?.filter(goal=>goal.role==='normal')??[],target=goals.length?goals.reduce((point,goal)=>({x:point.x+goal.center.x/goals.length,y:point.y+goal.center.y/goals.length,z:point.z+goal.center.z/goals.length}),{x:0,y:0,z:0}):{x:world.bin.center.x,y:world.bin.height,z:world.bin.center.z};
    const baseball=world.outdoorType==='baseball',mall=world.outdoorType==='mall',river=world.outdoorType==='river';
    const factoryGoal=world.environment==='factory'&&[26,27,28,29,40,41,42,43,44,45,46,47].includes(world.worldVersion);
    const conveyorGoal=factoryGoal&&world.factoryType==='conveyor';
    const smallMall=mall&&goals.some(goal=>goal.kind==='cone'&&goal.radius<=.1),smallRiver=river&&world.props?.tube?.mouthRadius<=.2;
    const goalWidth=goals.length?Math.max(...goals.map(goal=>goal.center.x+(goal.radius??goal.halfWidth??0)))-Math.min(...goals.map(goal=>goal.center.x-(goal.radius??goal.halfWidth??0))):0;
    if(baseball)target.y-=.55;
    if(smallMall)target.y-=.35;
    if(smallRiver)target.y+=1;
    // The factory receiver camera sits past the shutter/gate and between bank
    // walls. It stays fixed there while showing the same live shot and clock.
    goalCameraWorld={...world,view:{...world.view,target,distance:world.worldVersion===49?3.8:world.worldVersion===50?2.4:world.worldVersion===51?2.8:world.worldVersion===52?4.5:conveyorGoal?1.65:factoryGoal?1.85:baseball?Math.max(14,goalWidth*.95+1.5):smallMall?2.2:smallRiver?5.5:mall?6.5:7}};
    goalRenderer.setWorldView(goalCameraWorld);goalRenderer.resize();
    // Front/three-quarter placement keeps the receiver readable and avoids
    // looking through the scoreboard behind the baseball stand.
    goalRenderer.restoreCamera({azimuth:factoryGoal?0:baseball?.12:smallRiver?Math.PI:.35,elevation:conveyorGoal?1.15:factoryGoal?.6:baseball?.24:smallMall?.35:mall?.42:smallRiver?.24:.32,zoom:1});
    goalCameraStage=stageProgress.snapshot().id;
  }
  const environmentTime=sceneTime(),snapshot=playStepper?.snapshot();
  if(world.worldVersion===39){
    // A camera fixed inside the receiving carriage moves with that carriage,
    // never with the projectile. Choose the current nearby receiver before a
    // shot, then retain its ID through the raw-time periodic boundary.
    const goals=eccentricGoals(world,environmentTime).filter(g=>g.role==='normal');
    if(game.phase==='ready'||!goalCameraGoalId)goalCameraGoalId=[...goals].sort((a,b)=>Math.abs(a.center.x-game.can.position.x)-Math.abs(b.center.x-game.can.position.x))[0]?.id??null;
    const goal=goals.find(g=>g.id===goalCameraGoalId);
    if(goal){
      goalCameraWorld={...world,view:{...world.view,target:{...goal.center,y:goal.center.y-.05},distance:1.35}};
      goalRenderer.setWorldView(goalCameraWorld);
      goalRenderer.restoreCamera({azimuth:.14,elevation:.36,zoom:1});
    }
  }
  goalRenderer.render(game,controls,{baseballPitch:baseballIntro.snapshot(liveWorld(),game.can.radius),world:goalCameraWorld,environment:world.environment,prediction:false,numericLabels:false,customCue:true,angleCue:false,windArc:[],factorySession,impactPose:snapshot?.impactPose??null,capture:shotContext?.capture??getSnapshot(game).goalCapture??null,effects:outdoorStage()||world.worldVersion===46||eccentricStage()?snapshot?.effects??[]:[],environmentTime,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
  goalCameraPresented={shotId:game.attempts,time:game.time,environmentTime,phase:game.phase,position:{...game.can.position}};
  if($('goal-camera'))$('goal-camera').dataset.aiming=String(view.gesture?.kind==='throw');
}
function presentLive(now){
  if(eccentricStage()&&game.phase==='ready'){const frame=eccentricLaunchFrame(liveWorld(),environmentStartTime());game.can.position={...frame.origin,y:frame.origin.y+game.can.radius-.14};}
  const stage=STAGES[stageProgress.snapshot().id],preloadRoom=pixelIntro?.active;
  const mapped=view.gesture?.kind==='throw'?view.gesture.aim:null,effectiveAim=mapped?.actual??controls;
  trainingPreview=preloadRoom?[]:previewFor(effectiveAim);
  // An empty room fade path supplies no unseen future flight in normal play.
  const roomPath=preloadRoom?undefined:trainingMode&&view.prediction?(trainingPreview??undefined):[];
  renderer.render(game,controls,{baseballPitch:baseballIntro.snapshot(liveWorld(),game.can.radius),environment:preloadRoom?'room':stage?.environment,world:preloadRoom?roomWorld('first',2):liveWorld(),course:liveCourse(),angleCue:false,customCue:!preloadRoom,numericLabels:trainingMode&&!preloadRoom,
    extraRoom:extraRoom(),fanEnabled,environmentTime:sceneTime(),factorySession,impactPose:playStepper?.snapshot().impactPose??null,capture:shotContext?.capture??getSnapshot(game).goalCapture??null,effects:outdoorStage()||liveWorld()?.worldVersion===46||eccentricStage()?playStepper?.snapshot().effects??[]:[],reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,windArc:roomPath,
    stageNumber:stage?.number??(stageProgress.snapshot().id==='first'?'1-1':extraRoom()?'1-4':null),monitorCanvas:pixelIntro?.image,revealProgress:pixelIntro?.cameraProgress,
    prediction:trainingMode&&view.prediction&&!preloadRoom,pullFraction:mapped?.valid?Math.max(0,Math.min(1,mapped.actual.power/14)):0,aim:mapped?.actual??null});
  paintPlayCue(!preloadRoom&&(mapped||now<angleCueUntil)?effectiveAim:null);
  if(!preloadRoom)presentGoalCamera(liveWorld(),stage);
}
function frame(now){
  const dt=Math.max(0,Math.min((now-previousTime)/1000,.045));previousTime=now;
  const queued=baseballIntro.advance(dt,liveWorld());
  if(queued){Object.assign(controls,queued.controls);updateControlLabels();fireNow(queued.source);}
  pixelIntro?.advance(dt);updateIntroUI();
  if(!pixelIntro?.active){if(playStepper){if(schoolStage()||outdoorStage()||advancedStage())playStepper.step(game,dt,captureShot);else playStepper.step(game,dt,fanEnabled,captureShot);}else if(liveCourse())courseStepper.step(game,dt,stageProgress.snapshot().id,captureShot,liveWorld()?.worldVersion??1);else if(extraRoom())roomWind.step(game,dt,fanEnabled,captureShot);else{stepGame(game,dt);captureShot();}}updateUI();environmentTime+=dt;
  if(view.gesture?.kind==='throw'){
    const gesture=view.gesture;if(!sameLayout(gesture))cancelGesture('layout-change');else{gesture.presentationTime=now;gesture.aim=gestureAim(gesture,{clientX:gesture.lastX,clientY:gesture.lastY},now);showGesture(gesture);}
  }
  presentLive(now);
  paintGoalCue(now);
  pixelIntro?.render(renderer.monitorQuad());
  renderReplay(dt);
  requestAnimationFrame(frame);
}
storeUI=createStoreUI({document,catalog:Object.values(THROWABLE_CATALOG),
  getState:()=>{const state=rewards.snapshot();return {coins:state.wallet,ownedIds:rewards.ownedIds(),equippedId:state.equipped,achievements:Object.values(ACHIEVEMENTS).filter(a=>state.achievements.includes(a.id)),busy:busy(),canOpen:storeAvailable()};},
  onBuy:id=>storeAction('buy',id),onEquip:id=>storeAction('equip',id)});
$('store-open')?.addEventListener('click',()=>{if(!storeAvailable())return;cancelGesture('store-open');storeUI.open();});
function canRestorePlayer(){
  const blocked=titleActive()||busy()||pixelIntro?.active||$('chapter-result')?.open||replayDialog.open||$('store-dialog')?.open;
  return {ok:!blocked,message:blocked?'投球や結果画面を閉じてから復元できます。':''};
}
saveUI=createPlayerSaveUI({document,
  getPlayer:()=>({progress:chapterProgress.snapshot(),rewards:rewards.snapshot()}),
  canRestore:canRestorePlayer,
  initialStatus:loadedProgress.ok?'続きはこのブラウザに自動保存します。':'保存した記録を読み込めません。元の保存は残しています。保存コードから復元できます。',
  onRestore:data=>{
    const guard=canRestorePlayer();if(!guard.ok)return {...guard,status:'blocked'};
    const saved=restorePlayerSave(storage(),data);cancelGesture('progress-restore');chapterProgress=createChapterProgress(data.progress);if(data.rewards)rewards=createRewards(data.rewards);chapterPractice=false;
    selectStage(chapterProgress.snapshot().resumeStage,{fromEntry:true});storeUI?.update();updateUI(true);showChapterTop();
    const message=saved.ok?saved.status==='restored-with-corrupt-backup'?'元の壊れた保存を控えて、コードから復元しました。':'コードから復元し、このブラウザに保存しました。':'このプレイでは復元できましたが、このブラウザには保存できません。保存コードを控えてください。';
    if($('chapter-save-status')){$('chapter-save-status').hidden=false;$('chapter-save-status').textContent=message;$('chapter-save-status').dataset.state=saved.ok?'success':'warning';}
    return {ok:true,status:saved.ok?saved.status:'in-memory-only',message};
  },
  onReplay:async fragment=>{
    const guard=canRestorePlayer();if(!guard.ok)return guard;
    try{const replay=await decodeCourseReplay(fragment);const currentGuard=canRestorePlayer();if(!currentGuard.ok)return currentGuard;cancelGesture('restore-replay-link');openReplay(replay,'pasted-link');return {ok:replayDialog.open,message:replayDialog.open?'一投のリプレイを開きました。続きの記録やコインは変わりません。':'リプレイを開けませんでした。'};}
    catch{return {ok:false,message:'リプレイを開けません。リンクが途中で切れていないか確認してください。'};}
  },
  onContinue:()=>{if(!canRestorePlayer().ok)return false;return selectPlayable(chapterProgress.snapshot().resumeStage,{fromEntry:true,training:false});}
});
menuUI=createGameMenu({element:$('game-menu')});
gameShell=createGameShell({
  getState:()=>({progress:chapterProgress.snapshot(),stageId:stageProgress.snapshot().id,busy:busy(),introActive:pixelIntro?.active===true,trainingMode,previewChapter3:reviewChapter3,previewChapters45:reviewChapters45,result:chapterResult,homeChapterNumber:Number($('chapter-top')?.dataset.chapter)||null}),
  selectStage,
  onRouteVisit:route=>{if(busy()||pixelIntro?.active||!chapterProgress.unlockRoute(route))return false;persistChapter();return true;}
});
gameShell.update();
if($('title-screen')){
  titleUI=createTitleScreen({element:$('title-screen'),
    onContinue:()=>{titleUI.hide();selectPlayable(chapterProgress.snapshot().resumeStage);},
    onStageSelect:()=>{titleUI.hide();openStageSelection();},onInvite:openGameInvitation});
  $('title-open')?.addEventListener('click',showTitleScreen);
  if(titleOnEntry)showTitleScreen();
}
requestAnimationFrame(frame);
