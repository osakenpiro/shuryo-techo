// Presentation only: deterministic scrolling follows the actual plane, never its prediction.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function gliderCameraView(world,game,{reducedMotion=false}={}){
 if(![76,77].includes(world?.worldVersion)||world.mode!=='glider'||reducedMotion)return null;
 const p=game?.can?.position,t=game?.time;
 if(!p||![p.x,p.y,p.z,t].every(Number.isFinite))return null;
 const ready=game.phase==='ready',u=ready?0:clamp(t/.65,0,1),ease=u*u*(3-2*u);
 // A brief ease-in absorbs the launch transition. Constant distance keeps the
 // plane readable while ground marks and the far landing pad approach naturally.
 return {target:{x:clamp(p.x*.5,world.worldVersion===77?-4:-1.25,world.worldVersion===77?4:1.25)*ease,y:world.worldVersion===77?world.origin.y-.85:.85,z:2+clamp(p.z,0,world.worldVersion===77?33:25)*ease},distance:9.5};
}
