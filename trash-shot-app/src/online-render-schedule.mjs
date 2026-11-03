// Spread remote views across frames. A simultaneous remote refresh must never
// consume the frame needed to present the local player's drag or release.
export function onlineRenderPlan(views,selfId,now){
  if(!Number.isFinite(now))return [];
  const live=views.filter(view=>view.id&&view.renderer),local=live.find(view=>view.id===selfId);
  const remote=live.filter(view=>view.id!==selfId&&now-view.lastDraw>=1000/15-1)
    .sort((a,b)=>a.lastDraw-b.lastDraw)[0];
  return [...(local&&now-local.lastDraw>=1000/60-1?[local]:[]),...(remote?[remote]:[])];
}
