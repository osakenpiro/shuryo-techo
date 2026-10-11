const one=value=>Number(value).toFixed(1).replace(/\.0$/,'');
export function launchSummary(controls){
  if(!controls||!['power','elevation','yaw'].every(key=>Number.isFinite(controls[key])))return null;
  return Object.freeze({power:controls.power,elevation:controls.elevation,yaw:controls.yaw,
    text:`初速 ${one(controls.power)} m/s · 弧 ${one(controls.elevation)}° · 左右 ${Math.abs(controls.yaw)<.05?'まっすぐ':`${controls.yaw<0?'左':'右'} ${one(Math.abs(controls.yaw))}°`}`});
}
export function impactSummary(result){
  if(!result?.success)return '';
  if(result.roles?.some(role=>role.id==='direct'))return '跳ね返らず、そのまま箱へ。';
  const counts=[['外の床',result.floorBounces],['ふち',result.rimHits],['箱の側面',result.sideHits],['机',result.deskHits],['壁',result.wallHits],['天井',result.ceilingHits],['家具',result.furnitureHits]];
  return '入るまでの跳ね返り：'+counts.filter(([,count])=>Number.isFinite(count)&&count>0).map(([label,count])=>`${label} ${count} 回`).join(' · ')+'。';
}
