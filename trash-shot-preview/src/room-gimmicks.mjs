import {createGame,throwCan,stepGame} from './physics.mjs?v=20261011-first-chapter-1';

export const ROOM_WIND=Object.freeze({minX:-1.5,maxX:1.5,minY:.4,maxY:3.4,minZ:1.8,maxZ:4.2,accelerationX:1.2});
export function windAcceleration(position,enabled=true){
  const b=ROOM_WIND,p=position;
  return enabled&&p.x>=b.minX&&p.x<=b.maxX&&p.y>=b.minY&&p.y<=b.maxY&&p.z>=b.minZ&&p.z<=b.maxZ?{x:b.accelerationX,y:0,z:0}:{x:0,y:0,z:0};
}
// Only optional 1-4 uses this wrapper. The existing core still owns every
// position advance, contact, aperture entry and final success decision.
export function createRoomWindStepper(){
  let remainder=0,windSteps=0;
  return {
    reset(){remainder=0;windSteps=0;},
    step(game,dt,enabled,onSample=()=>{}){
      if(!['flying','settling'].includes(game.phase)||!Number.isFinite(dt)||dt<=0)return;
      remainder+=Math.min(dt,.1);const tick=1/240;
      for(let count=0;remainder+1e-12>=tick&&count<25;count++){
        const h=Math.min(tick,Math.max(0,5-game.time));
        if(h<=1e-12){stepGame(game,tick);onSample();remainder=0;break;}
        if(game.phase==='flying'){
          const a=windAcceleration(game.can.position,enabled);
          game.can.velocity.x+=a.x*h;if(a.x)windSteps++;
        }
        stepGame(game,h);onSample();remainder=Math.max(0,remainder-tick);
        if(!['flying','settling'].includes(game.phase)){remainder=0;break;}
      }
    },
    snapshot(){return {remainder,windSteps};}
  };
}
export function predictWindArc(game,controls,enabled=true){
  const copy=createGame({distance:game.bin.center.z,height:game.bin.height}),stepper=createRoomWindStepper(),points=[];
  throwCan(copy,controls);points.push({...copy.can.position});let samples=0;
  for(let i=0;i<1201&&['flying','settling'].includes(copy.phase);i++)stepper.step(copy,1/240,enabled,()=>{if(++samples%8===0)points.push({...copy.can.position});});
  points.push({...copy.can.position});return points;
}
