// Comparison-lab input calibration. This does not change physics or saved input.
import {pullAim, PULL_FEEL} from './pull-feel.mjs?v=20261011-pull-feel-1';

export const CAN_PULL_PROFILE = Object.freeze({id:'can',radius:.14,minPower:.5,
  maxPower:14,normalPowerMultiplier:1});
export const PULL_SCALE = Object.freeze({marginPx:8,deadzonePx:8,minTravelPx:32,
  normalDistance:.22,maxDistance:.70,availableFraction:.90,comfortFraction:.48});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const roundPower=n=>Math.round(n*20)/20;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function freeze(value) {
  if(value&&typeof value==='object') {Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
}
const reasons={
  'invalid-layout':'画面の位置を確認できません。画面が落ち着いてから引いてください。',
  'invalid-profile':'投げる物の強さ設定を確認できません。',
  'outside-start':'画面の中から引き始めてください。',
  'not-enough-space':'引く余白が少ないので投げません。少し上から引き始めてください。',
};
function unavailable(reason,projection,extra={}) {
  return freeze({ready:false,reason,reasonText:reasons[reason],projection,size:1,yawSize:1,
    usableTravelPx:0,maxPx:0,normalPx:0,softPx:0,riskPx:0,fullRiskPx:0,
    marginPx:PULL_SCALE.marginPx,deadzonePx:PULL_SCALE.deadzonePx,...extra});
}

/** Freeze one gesture's reachable scale in CSS pixels, independent of DPR.
 * 3D strength uses downward travel. 2D uses one scalar for both vector axes,
 * so rotating the vector cannot change strength merely through normalization.
 * stagePower and the explicit projectile profile calibrate physical speed;
 * profiles for future objects are inputs, not implemented object mechanics.
 */
export function createPullScale({rect,startX,startY,projection='3d',stagePower=6.2,
  projectileProfile=CAN_PULL_PROFILE}={}) {
  const side=projection==='2d',resolvedProjection=side?'2d':'3d';
  if(!rect||![rect.left,rect.top,rect.width,rect.height,startX,startY].every(finite)
      ||rect.width<=0||rect.height<=0) return unavailable('invalid-layout',resolvedProjection);
  const bounds={left:rect.left,top:rect.top,width:rect.width,height:rect.height,
    right:rect.left+rect.width,bottom:rect.top+rect.height};
  const start={x:startX,y:startY};
  if(startX<bounds.left||startX>bounds.right||startY<bounds.top||startY>bounds.bottom)
    return unavailable('outside-start',resolvedProjection,{rect:bounds,start});
  const projectile={...CAN_PULL_PROFILE,...projectileProfile};
  if(!finite(stagePower)||!['radius','minPower','maxPower','normalPowerMultiplier'].every(key=>finite(projectile[key]))
      ||projectile.radius<=0||projectile.radius>2||projectile.minPower<.5||projectile.maxPower>14
      ||projectile.minPower>=projectile.maxPower||projectile.normalPowerMultiplier<=0)
    return unavailable('invalid-profile',resolvedProjection,{rect:bounds,start});
  const normalPower=clamp(roundPower(clamp(stagePower*projectile.normalPowerMultiplier,
    projectile.minPower,projectile.maxPower)),projectile.minPower,projectile.maxPower);
  // A usable calibration needs strength on both sides of the ordinary throw.
  if(normalPower<=projectile.minPower||normalPower>=projectile.maxPower)
    return unavailable('invalid-profile',resolvedProjection,{rect:bounds,start});
  const margin=PULL_SCALE.marginPx;
  const availableDownPx=Math.max(0,bounds.bottom-startY-margin);
  const availableLeftPx=Math.max(0,startX-bounds.left-margin);
  const availableRightPx=Math.max(0,bounds.right-startX-margin);
  const available=side?Math.min(availableLeftPx,availableDownPx):availableDownPx;
  const sizeFactor=clamp(Math.sqrt(projectile.radius/CAN_PULL_PROFILE.radius),.65,1.5);
  const comfortPx=Math.min(bounds.width,bounds.height)*PULL_SCALE.comfortFraction*sizeFactor;
  const usableTravelPx=Math.min(available*PULL_SCALE.availableFraction,comfortPx);
  const geometry={rect:bounds,start,availableDownPx,availableLeftPx,availableRightPx,
    usableTravelPx,comfortPx};
  if(usableTravelPx<PULL_SCALE.minTravelPx)
    return unavailable('not-enough-space',resolvedProjection,geometry);
  const size=usableTravelPx/PULL_SCALE.maxDistance;
  // Yaw gets its own horizontal scale rather than inheriting a short downward
  // scale at the can. A small horizontal margin must not amplify every pixel.
  const yawSize=Math.max(48,Math.min(bounds.width,bounds.height,
    Math.min(availableLeftPx,availableRightPx)*PULL_SCALE.availableFraction));
  return freeze({ready:true,reason:null,reasonText:'',projection:resolvedProjection,
    ...geometry,size,yawSize,maxPx:usableTravelPx,
    normalPx:size*PULL_SCALE.normalDistance,softPx:size*PULL_FEEL.softStart,
    riskPx:size*PULL_FEEL.riskStart,fullRiskPx:size*(PULL_FEEL.riskStart+PULL_FEEL.riskRange),
    marginPx:margin,deadzonePx:PULL_SCALE.deadzonePx,projectile,
    calibration:{stagePower,normalPower,normalRawDistance:PULL_SCALE.normalDistance,
      minPower:projectile.minPower,maxPower:projectile.maxPower,
      powerPerEffective:(normalPower-projectile.minPower)/PULL_SCALE.normalDistance}});
}

/** The displayed and released aim use this same deterministic mapping.
 * No position or viewport is reread here: held gestures keep their frozen scale.
 */
export function mapScaledPull({scale,right=0,up=0,mode='A',projection=scale?.projection??'3d',
  elevation=48,baseYaw=0,elapsedSeconds=0}={}) {
  const side=projection==='2d';
  const calibration=scale?.calibration;
  const safe=scale?.ready&&scale.projection===projection
    &&[right,up,elevation,baseYaw,elapsedSeconds,scale.size,scale.yawSize,
      scale.start?.x,scale.start?.y,scale.rect?.left,scale.rect?.right,
      scale.rect?.top,scale.rect?.bottom,calibration?.minPower,calibration?.maxPower,
      calibration?.powerPerEffective].every(finite)&&scale.size>0&&scale.yawSize>0;
  const aim=pullAim({right:safe?(side?right:right*(scale.size/scale.yawSize)):0,
    up:safe?up:0,size:safe?scale.size:1,mode,projection,elevation,baseYaw,elapsedSeconds});
  const power=safe?clamp(roundPower(clamp(calibration.minPower+
    aim.effectiveDistance*calibration.powerPerEffective,calibration.minPower,calibration.maxPower)),
    calibration.minPower,calibration.maxPower):.5;
  const physicalDistance=side?Math.hypot(right,up):Math.max(0,up);
  // The UI cancels outside pointer movement; the mapper independently rejects
  // outside releases as well, including overflowed extreme coordinates.
  const endpointInside=Boolean(safe&&scale.start.x-right>=scale.rect.left
    &&scale.start.x-right<=scale.rect.right&&scale.start.y+up>=scale.rect.top
    &&scale.start.y+up<=scale.rect.bottom);
  const valid=Boolean(safe&&endpointInside&&physicalDistance>=scale.deadzonePx
    &&(!side||right>=0&&up>=0));
  return {...aim,valid,base:{...aim.base,power},actual:{...aim.actual,power},
    physicalDistance:finite(physicalDistance)?physicalDistance:0,
    scaleReason:!safe?scale?.reason??'invalid-layout':endpointInside?null:'outside-canvas',
    calibration:calibration?{...calibration}:null};
}
