// Presentation only. The live stepper owns contacts, captures and their clock;
// these helpers never award a clear, change a throw, or write player progress.
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const point=(x,y,z)=>({x,y,z});
const finitePoint=v=>v&&['x','y','z'].every(k=>Number.isFinite(v[k]));
// Native recorded events keep shot time as `time`; their `environmentTime`
// already includes the launch phase. Never add startTime a second time here.
const eventTime=e=>Number.isFinite(e?.environmentTime)?e.environmentTime:e?.time;
const add=(a,b)=>point(a.x+b.x,a.y+b.y,a.z+b.z);
const scale=(a,k)=>point(a.x*k,a.y*k,a.z*k);
const cross=(a,b)=>point(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const unit=v=>{const n=Math.hypot(v.x,v.y,v.z);return n>1e-8?scale(v,1/n):point(0,1,0);};
const rgba=(r,g,b,a)=>`rgba(${r},${g},${b},${clamp(a).toFixed(3)})`;
const fxFace=(points,fill,effectType,extra={})=>({points,fill,depthWrite:false,effectType,emissive:true,...extra});
const fxLine=(a,b,stroke,effectType,extra={})=>({points:[a,b],line:true,stroke,depthWrite:false,effectType,emissive:true,...extra});
function basis(normal){const n=unit(normal??point(0,1,0)),u=unit(cross(n,Math.abs(n.y)>.9?point(1,0,0):point(0,1,0)));return {n,u,v:cross(n,u)};}
const circleOn=(center,u,v,r,n=12)=>Array.from({length:n},(_,i)=>add(center,add(scale(u,Math.cos(i/n*Math.PI*2)*r),scale(v,Math.sin(i/n*Math.PI*2)*r))));
const riverOf=world=>world?.water&&Number.isFinite(world.water.y)?world.water:null;
function onWater(q,water){return point(clamp(q.x,water.minX,water.maxX),water.y+.019,clamp(q.z,water.minZ,water.maxZ));}

// The same lamps supplied by outdoorMotion(world,time) illuminate geometry.
// A smooth finite radius makes the moving pool of visibility readable without
// altering collision geometry or inventing a transparent wall around a lamp.
export function outdoorLightLevel(position,lamps=[],{ambient=.20}={}){
  let level=clamp(Number.isFinite(ambient)?ambient:.20);
  if(!finitePoint(position))return level;
  for(const lamp of lamps){
    if(!finitePoint(lamp?.position)||!Number.isFinite(lamp.radius)||lamp.radius<=0)continue;
    const d=Math.hypot(position.x-lamp.position.x,position.y-lamp.position.y,position.z-lamp.position.z)/lamp.radius;
    const t=clamp(1-d),falloff=t*t*(3-2*t);
    level+=falloff*clamp(Number.isFinite(lamp.intensity)?lamp.intensity:1,0,2);
  }
  return clamp(level);
}

export function outdoorLightColor(color,position,lamps=[],options={}){
  const nightRGBA=options.night===true&&/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(color??'');
  if(!/^#[0-9a-f]{6}$/i.test(color)&&!nightRGBA)return color;
  const light=outdoorLightLevel(position,lamps,options);
  // The original material hue survives; warmer light lifts it near the boats.
  const components=nightRGBA?color.match(/[\d.]+/g).map(Number):null,rgb=components?.slice(0,3)??[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const lit=rgb.map((c,i)=>Math.round(clamp(c*light+light*(1-light)*[20,11,1][i]+(options.night===true?(1-light)*[2,4,7][i]:0),0,255)));
  if(nightRGBA)return `rgba(${lit.join(',')},${components[3]??1})`;
  return '#'+lit.map(c=>c.toString(16).padStart(2,'0')).join('');
}

export function outdoorLampShapes(lamps=[],{waterY,waterBounds}={}){
  const shapes=[];
  for(const lamp of lamps){
    if(!finitePoint(lamp?.position))continue;
    const c=lamp.position,r=.10;
    shapes.push(fxFace(circleOn(c,point(1,0,0),point(0,1,0),r,8),'#ffdda0','lamp-glow',{lampId:lamp.id}));
    shapes.push(fxFace(circleOn(c,point(1,0,0),point(0,1,0),r*2.3,10),rgba(255,211,120,.12),'lamp-halo',{lampId:lamp.id}));
    if(!Number.isFinite(waterY)||c.y<=waterY)continue;
    const center=point(c.x,waterY+.014,c.z),rx=.20,rz=.55;
    const ring=Array.from({length:12},(_,i)=>point(center.x+Math.cos(i/12*Math.PI*2)*rx,center.y,center.z+Math.sin(i/12*Math.PI*2)*rz));
    shapes.push(fxFace(waterBounds?ring.map(q=>onWater(q,{...waterBounds,y:waterY})):ring,rgba(255,204,111,.23),'lamp-reflection',{lampId:lamp.id}));
  }
  return shapes;
}

// Optional batter animation remains an ordinary pull-and-release throw. The
// scene owns the bat mesh; this returns its deterministic short follow-through.
export function batSwingPose(time,launchTime,{duration=.28,reducedMotion=false}={}){
  const age=Number.isFinite(time)&&Number.isFinite(launchTime)?time-launchTime:-Infinity,phase=clamp(age/Math.max(.01,duration));
  const active=Number.isFinite(age)&&age>=0&&age<=duration;
  return {active,phase,angle:reducedMotion?0:-1.05+2.25*(1-Math.pow(1-phase,3))};
}

export function iceSplatData(effect,time,{reducedMotion=false}={}){
  if(effect?.type!=='ice-splat'||!finitePoint(effect.position)||!Number.isFinite(eventTime(effect)))return null;
  const age=time-eventTime(effect);if(age<0||age>4)return null;
  const {n,u,v}=basis(effect.normal),radius=Number.isFinite(effect.radius)?clamp(effect.radius,.06,.6):.19;
  const spread=reducedMotion?1:.7+.3*clamp(age/.12),center=add(effect.position,scale(n,.008));
  const points=Array.from({length:14},(_,i)=>{
    const a=i/14*Math.PI*2,r=radius*spread*(i%2?.69:1);
    return add(center,add(scale(u,Math.cos(a)*r),scale(v,Math.sin(a)*r)));
  });
  return {center,normal:n,radius:radius*spread,points,color:effect.color??'#f0bf9c',age};
}

function bellShapes(effect,time,reducedMotion){
  const age=time-eventTime(effect);if(!finitePoint(effect.position)||age<0||age>.8)return [];
  const r=reducedMotion?.18:.13+.48*age,alpha=.72*(1-age/.8);
  const vertices=circleOn(effect.position,point(1,0,0),point(0,1,0),r,12);
  return vertices.map((q,i)=>fxLine(q,vertices[(i+1)%vertices.length],rgba(244,198,93,alpha),'bell-ring',{sourceId:effect.sourceId}));
}

function fireworkPlan(world,capture){
  if(!capture||(capture.role??capture.goalRole)!=='normal'||!Number.isFinite(eventTime(capture)))return null;
  if(world?.stageId!=='outdoor-river'&&world?.outdoorType!=='fireworks')return null;
  const goal=world.goals?.find(g=>g.id===capture.goalId);
  const origin=finitePoint(capture.position)?capture.position:goal?.center;
  if(!finitePoint(origin))return null;
  const burst=finitePoint(world.fireworks?.burstCenter)?world.fireworks.burstCenter:add(origin,point(.2,7.8,0));
  return {origin,burst,water:riverOf(world)};
}

function fireworkShapes(world,time,capture,reducedMotion){
  const plan=fireworkPlan(world,capture);if(!plan)return [];
  const age=time-eventTime(capture);if(age<0||age>5.4)return [];
  const shapes=[],{origin,burst,water}=plan,launchDuration=.95;
  if(age<launchDuration&&!reducedMotion){
    const t=age/launchDuration,rocket=point(origin.x+(burst.x-origin.x)*t,origin.y+(burst.y-origin.y)*t,origin.z+(burst.z-origin.z)*t);
    const tail=point(rocket.x,Math.max(origin.y,rocket.y-.65),rocket.z);
    shapes.push(fxLine(tail,rocket,'#f3c66f','firework-launch'));
    shapes.push(fxFace(circleOn(rocket,point(1,0,0),point(0,1,0),.085,6),'#fff0b3','firework-launch'));
    return shapes;
  }
  const ageBurst=age-launchDuration;if(ageBurst<0)return [];
  const growth=reducedMotion?1:1-Math.exp(-ageBurst*2.7),radius=2.55*growth;
  const alpha=clamp((4.45-ageBurst)/2.4),count=reducedMotion?16:32;
  const centerOnWater=water?point(clamp(burst.x,water.minX+.3,water.maxX-.3),water.y+.019,water.minZ+(water.maxZ-water.minZ)*.64):null;
  for(let i=0;i<count;i++){
    const angle=i/count*Math.PI*2,r=radius*(i%2?1:.86),fall=reducedMotion?0:ageBurst*ageBurst*.10;
    const tip=point(burst.x+Math.cos(angle)*r,burst.y+Math.sin(angle)*r-fall,burst.z+Math.sin(angle*3)*r*.12);
    const inner=point(burst.x+Math.cos(angle)*r*.76,burst.y+Math.sin(angle)*r*.76-fall,tip.z);
    const color=i%3?rgba(249,192,91,alpha):rgba(235,142,75,alpha);
    shapes.push(fxLine(inner,tip,color,'firework-burst',{burstIndex:i}));
    shapes.push(fxFace(circleOn(tip,point(1,0,0),point(0,1,0),.045+alpha*.035,5),color,'firework-spark',{burstIndex:i}));
    if(water){
      const shimmer=reducedMotion?1:.9+.1*Math.sin(ageBurst*9+i*1.3);
      // Reflection lies on the real water surface, not behind it. The same
      // blossom index, radius, fade and clock connect each mirrored streak.
      const reflection=onWater(point(centerOnWater.x+(tip.x-burst.x)*.70,water.y,centerOnWater.z-(tip.y-burst.y)*.45),water);
      const end=onWater(add(reflection,point(.10*shimmer,0,.06)),water);
      shapes.push(fxLine(reflection,end,i%3?rgba(249,192,91,alpha*.40):rgba(235,142,75,alpha*.40),'firework-reflection',{burstIndex:i}));
    }
  }
  return shapes;
}

export function outdoorEffectShapes(world,time,{capture=null,effects=[],reducedMotion=false}={}){
  if(!world||!Number.isFinite(time))return [];
  const shapes=[];
  for(const effect of (Array.isArray(effects)?effects.slice(-32):[])){
    if(effect?.type==='ice-splat'){
      const splat=iceSplatData(effect,time,{reducedMotion});
      if(splat)shapes.push(fxFace(splat.points,splat.color,'ice-splat',{sourceId:effect.sourceId}));
    }else if(effect?.type==='bell-ring'&&Number.isFinite(eventTime(effect)))shapes.push(...bellShapes(effect,time,reducedMotion));
  }
  shapes.push(...fireworkShapes(world,time,capture,reducedMotion));
  return shapes;
}

// A context is created/resumed only inside a trusted user's gesture. Replay,
// prediction and an unavailable AudioContext are silent without side effects.
export function createOutdoorEffects({enabled=true,audioContextFactory}={}){
  let audio=null,unlocked=false,destroyed=false,played=0;
  const seen=new Set(),voices=new Set();
  const makeContext=audioContextFactory??(()=>{const Context=globalThis.AudioContext??globalThis.webkitAudioContext;return Context?new Context():null;});
  function stopVoices(){for(const voice of voices){try{voice.stop();}catch{}try{voice.disconnect();}catch{}}voices.clear();}
  async function gesture(event){
    if(destroyed||!enabled||event?.isTrusted!==true)return false;
    try{audio??=makeContext();if(!audio)return false;if(audio.state==='suspended')await audio.resume();unlocked=audio.state==='running';return unlocked;}catch{unlocked=false;return false;}
  }
  function ring(){
    // Repeated real bounces can ring again, but cannot build an unbounded chord.
    while(voices.size>12){const voice=voices.values().next().value;try{voice.stop();}catch{}voices.delete(voice);}
    const start=audio.currentTime;
    for(const [i,frequency] of [622,931,1284,1720].entries()){
      const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.026/(i+1),start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+.80-i*.08);
      oscillator.connect(gain);gain.connect(audio.destination);voices.add(oscillator);
      oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(start);oscillator.stop(start+.85);
    }
    played++;
  }
  function onLiveEffects(effects=[],world,{prediction=false,replay=false}={}){
    if(destroyed||prediction||replay||world?.stageId!=='outdoor-shrine')return 0;
    let count=0;
    for(const event of effects){
      if(event?.type!=='bell-ring'||event.sourceId!=='shrine-bell-rope'||!Number.isFinite(eventTime(event)))continue;
      const key=event.id??`${event.type}/${event.sourceId}/${eventTime(event)}`;
      if(seen.has(key))continue;seen.add(key);
      if(seen.size>256)seen.delete(seen.values().next().value);
      if(!enabled||!unlocked||audio?.state!=='running')continue;
      try{ring();count++;}catch{/* Sound failure cannot interrupt a shot. */}
    }
    return count;
  }
  return Object.freeze({gesture,onLiveEffects,
    setEnabled(value){enabled=value===true;if(!enabled)stopVoices();return enabled;},
    clear(){seen.clear();stopVoices();},
    snapshot:()=>({enabled,unlocked,contextCreated:Boolean(audio),played,activeVoices:voices.size,destroyed}),
    destroy(){if(destroyed)return;destroyed=true;stopVoices();seen.clear();try{const closing=audio?.close?.();closing?.catch?.(()=>{});}catch{}unlocked=false;},
  });
}
