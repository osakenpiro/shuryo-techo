import {STAGES} from './stages.mjs?v=20261015-boar-distance-1';
import {roomWorld,roomCourse} from './room-course.mjs?v=20261015-boar-distance-1';
import {createGame,setRoomWorld,throwCan,resetShot,getSnapshot,shotTimeLimit} from './physics.mjs?v=20261015-boar-distance-1';
import {setThrowable} from './throwable-physics.mjs?v=20261015-boar-distance-1';
import {createPlayRoomStepper} from './play-room.mjs?v=20261015-boar-distance-1';
import {createSchoolPlayStepper,schoolStartTime} from './school-play.mjs?v=20261015-boar-distance-1';
import {createOutdoorPlayStepper} from './outdoor-play.mjs?v=20261015-boar-distance-1';
import {createFactoryPlayStepper,createFactorySession} from './factory-play.mjs?v=20261015-boar-distance-1';
import {createEccentricPlayStepper,throwEccentric} from './eccentric-play.mjs?v=20261015-boar-distance-1';
import {eccentricLaunchFrame,eccentricStartTime} from './eccentric-world.mjs?v=20261015-boar-distance-1';
import {createReleaseChapterPlayStepper} from './release-chapters-play.mjs';
import {releaseChapterGoals,releaseChapterStartTime} from './release-chapters-world.mjs?v=20261018-chapters67-1';
import {outdoorGoals,outdoorStartTime,shrineStartTime} from './outdoor-world.mjs?v=20261015-boar-distance-1';
import {factoryGoals,factoryMotion,factoryStartTime} from './factory-world.mjs?v=20261015-boar-distance-1';
import {eccentricGoals} from './eccentric-world.mjs?v=20261015-boar-distance-1';

const active=game=>['flying','settling'].includes(game.phase);
// All views and the authoritative host compose the same established adapters.
// This module never loads player storage, awards progress or modifies a world.
export function createOnlineCourse(stageId){
  const stage=STAGES[stageId];if(!stage?.environment)throw new RangeError('A chapter course is required');
  const world=roomWorld(stageId,stage.worldVersion),game=createGame(),environment=stage.environment;
  setRoomWorld(game,world.worldVersion);setThrowable(game,world.itemId??'can');
  const session=environment==='factory'?createFactorySession(world):null;
  let stepper=null,advanced=0,startTime=0,lastShot=null;
  // Ready geometry uses the established launch phase; a flying shot then runs
  // continuously across that boundary. Timed relay state uses absolute time.
  const environmentClock=time=>environment==='eccentric'?eccentricStartTime(time):environment==='release'?releaseChapterStartTime(time):
    environment==='factory'?(world.worldVersion===47?time:factoryStartTime(time)):
    environment==='outdoor'?(world.worldVersion===30?shrineStartTime(time):outdoorStartTime(time)):
    environment==='school'?schoolStartTime(time):time;
  const makeStepper=()=>environment==='release'?createReleaseChapterPlayStepper(world,{startTime}):
    environment==='factory'?createFactoryPlayStepper(world,{startTime,session}):
    environment==='eccentric'?createEccentricPlayStepper(world,{startTime}):
    environment==='outdoor'?createOutdoorPlayStepper(world,{startTime}):
    environment==='school'?createSchoolPlayStepper(world,{startTime}):createPlayRoomStepper(world,{extra:stageId==='room-extra'});
  function launch(input,environmentTime=0){
    if(active(game)||!Number.isFinite(environmentTime)||environmentTime<0||environmentTime>120)return false;
    if(game.phase!=='ready')resetShot(game);
    if(session){session.bankContacts=[];session.completed=false;}
    startTime=environmentClock(environmentTime);advanced=0;stepper=makeStepper();
    const accepted=environment==='eccentric'?throwEccentric(game,input,world,{startTime}):throwCan(game,input);
    if(accepted)lastShot={input:{...input},startTime};return accepted;
  }
  function advanceTo(seconds){
    if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Invalid shot time');
    const target=Math.min(Math.floor((seconds+1e-9)*240)/240,shotTimeLimit(game)+.1);
    while(stepper&&active(game)&&advanced+1e-9<target){const dt=Math.min(1/60,target-advanced);if(environment==='room')stepper.step(game,dt,stageId==='room-extra');else stepper.step(game,dt);advanced+=dt;}
    return result();
  }
  function result(){return lastShot&&!active(game)&&game.phase!=='ready'?{success:game.phase==='success',duration:game.time}:null;}
  function prepareForAim(){if(active(game)||game.phase==='success')return false;if(game.phase!=='ready')resetShot(game);lastShot=null;stepper=null;return true;}
  function targets(time=0){
    time=environmentClock(time);
    if(world.factoryType==='relay'&&(!session.plateLatched||factoryMotion(world,time,session).relayClock?.expired)){
      const plate=world.solids.find(s=>s.id===world.mechanism.plateId);
      return [{id:plate.id,kind:'setup',center:{...world.mechanism.plateCenter,y:plate.max.y},normal:{x:0,y:1,z:0},up:{x:0,y:0,z:1},shape:'rectangle',halfWidth:(plate.max.x-plate.min.x)/2,halfHeight:(plate.max.z-plate.min.z)/2}];
    }
    const goals=environment==='release'?releaseChapterGoals(world,time):environment==='factory'?factoryGoals(world,time,session):environment==='eccentric'?eccentricGoals(world,time):environment==='outdoor'?outdoorGoals(world,time):
      [{id:`${stageId}-bin`,center:{...game.bin.center,y:game.bin.height},radius:game.bin.radius,normal:{x:0,y:1,z:0},role:'normal'}];
    return goals.filter(g=>g.role==='normal').map(g=>({...g,shape:g.halfWidth?'rectangle':'circle'}));
  }
  function view(environmentTime=0){
    environmentTime=environmentClock(environmentTime);
    if(game.phase==='ready'&&environment==='eccentric'){const frame=eccentricLaunchFrame(world,environmentTime);game.can.position={...frame.origin,y:frame.origin.y+game.can.radius-.14};}
    const state=stepper?.snapshot();
    return {environment,world,course:roomCourse(stageId,world.worldVersion),customCue:true,angleCue:false,numericLabels:false,prediction:false,
      extraRoom:stageId==='room-extra',fanEnabled:stageId==='room-extra',environmentTime:active(game)||game.phase==='success'?startTime+game.time:environmentTime,
      factorySession:session,impactPose:state?.impactPose??null,capture:getSnapshot(game).goalCapture??null,effects:state?.effects??[],windArc:[]};
  }
  return Object.freeze({world,game,launch,advanceTo,result,prepareForAim,view,targets,initialAim:()=>({power:(world.launch??stage).power,elevation:(world.launch??stage).elevation,yaw:(world.launch??stage).yaw}),snapshot:()=>getSnapshot(game)});
}
