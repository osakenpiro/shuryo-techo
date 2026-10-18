// CSS-pixel samples only; no frame-rate, device-pixel-ratio or held-time boost.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function slashAim({samples=[],now,rect,stagePower=6.2,elevation=48,baseYaw=0,side=false,basis=null}={}){
  const fallback={power:stagePower,elevation,yaw:baseYaw};
  const invalid=()=>({valid:false,actual:{...fallback},base:{...fallback},risk:0,rawDistance:0,effectiveDistance:0,delta:{yaw:0,elevation:0}});
  if(!rect||!Number.isFinite(now)||samples.length<2)return invalid();
  const valid=samples.filter(p=>[p.x,p.y,p.t].every(Number.isFinite)&&p.t<=now);
  if(valid.length!==samples.length)return invalid();
  const last=valid.at(-1),recent=valid.filter(p=>now-p.t<=160),first=recent[0];
  if(recent.length<2||!first||now-last.t>110)return invalid();
  const dt=(last.t-first.t)/1000,size=Math.min(rect.width,rect.height);
  if(dt<.012||size<=0)return invalid();
  const dx=last.x-first.x,up=first.y-last.y,travel=Math.hypot(dx,up);
  const speed=travel/dt/size;
  if(travel<10||speed<.25||up<=2)return invalid();
  let yaw=baseYaw+Math.atan2(dx,up)*180/Math.PI;
  if(basis&&!side){const {xx,xy,zx,zy}=basis,det=xx*zy-zx*xy;if(!Number.isFinite(det)||Math.abs(det)<1e-8)return invalid();yaw=Math.atan2((dx*zy+up*zx)/det,(-up*xx-dx*xy)/det)*180/Math.PI;}
  const power=Math.round(clamp(stagePower*speed/1.45,.5,14)*20)/20;
  const actual={power,elevation:side?clamp(Math.atan2(up,dx)*180/Math.PI,5,85):elevation,yaw:side?0:clamp(yaw,-60,60)};
  return {valid:true,actual,base:{...actual},speed,rawDistance:travel/size,effectiveDistance:travel/size,risk:0,directionLimited:!side&&Math.abs(yaw)>60,delta:{yaw:0,elevation:0}};
}

export function addSlashSample(samples,event){
  const sample={x:event.clientX,y:event.clientY,t:event.timeStamp};
  const last=samples.at(-1);
  // Releasing after a hold must not manufacture fresh motion.
  if(!last||last.x!==sample.x||last.y!==sample.y)samples.push(sample);
  while(samples.length>64||samples.length>2&&sample.t-samples[0].t>320)samples.shift();
}
