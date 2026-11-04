// QA-only readout: this module never changes application state or DOM.
export async function captureBag(){
 const main=document.querySelector('#bag-board .bag-objects'),room=document.querySelector('.room-bag-objects');
 const layer=main||room;if(!layer)return null;
 const C=await import('./material-core.js'),s=(main?window.__heroNativeSnapshot?.():window.heroRoom?.snapshot())?.state;
 if(!s)return null;
 const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 const painted=e=>{for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility!=='visible'||Number(s.opacity)<=0)return false;}return true;};
 return {kind:main?'main':'room',width:s.width,height:s.height,layer:box(layer),expected:s.run.items.filter(i=>i.placement).map(i=>({id:i.id,defId:i.defId,placement:i.placement,cells:C.shape(i.defId,i.placement.rotation)})),objects:[...layer.querySelectorAll(main?'.bag-object':'.room-packed-object:not(.room-object-preview)')].map(e=>{
  const svg=e.querySelector('.bag-occupancy-contour'),fill=e.querySelector('.bag-occupancy-fill'),p=svg?.querySelector('path'),cs=p&&getComputedStyle(p);
  return {id:e.dataset.item||e.dataset.packedId,contour:svg?{rect:box(svg),paintVisible:painted(svg),viewBox:svg.getAttribute('viewBox'),d:p?.getAttribute('d'),stroke:cs.stroke,strokeWidth:cs.strokeWidth,opacity:cs.opacity,pointerEvents:getComputedStyle(svg).pointerEvents}:null,fill:fill?{rect:box(fill),paintVisible:painted(fill),d:fill.querySelector('path')?.getAttribute('d'),pointerEvents:getComputedStyle(fill).pointerEvents}:null};
 })};
}
