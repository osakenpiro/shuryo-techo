// Temporary goal-location cues. Inputs are present target poses supplied by
// the caller; this module neither chooses goals nor predicts a thrown object.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const point=(x,y,z)=>({x,y,z});
const finitePoint=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const add=(a,b)=>point(a.x+b.x,a.y+b.y,a.z+b.z);
const scale=(p,n)=>point(p.x*n,p.y*n,p.z*n);
const cross=(a,b)=>point(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const unit=p=>{const n=Math.hypot(p.x,p.y,p.z);return n>1e-9?scale(p,1/n):null;};
const number=n=>finite(n)?n.toFixed(2):'0';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=(value,length)=>Array.from(String(value??'')).slice(0,length).join('');

function projectPoint(project,p){
  try{const q=project(p);return q&&typeof q==='object'?q:null;}catch{return null;}
}
function outline(target,center){
  const normal=unit(finitePoint(target.normal)?target.normal:point(0,1,0))??point(0,1,0);
  const fallback=Math.abs(normal.y)>.8?point(0,0,1):point(0,1,0);
  const upHint=finitePoint(target.up)?target.up:fallback,right=unit(cross(upHint,normal))??unit(cross(fallback,normal)),up=unit(cross(normal,right));
  const shape=target.shape==='rectangle'||target.shape==='rect'?'rectangle':'circle';
  const radius=finite(target.radius)&&target.radius>0?target.radius:.2;
  const halfWidth=shape==='rectangle'&&finite(target.halfWidth)&&target.halfWidth>0?target.halfWidth:radius;
  const halfHeight=shape==='rectangle'&&finite(target.halfHeight)&&target.halfHeight>0?target.halfHeight:radius;
  return {shape,points:[add(center,scale(right,halfWidth)),add(center,scale(right,-halfWidth)),add(center,scale(up,halfHeight)),add(center,scale(up,-halfHeight))]};
}
function edgePosition(dx,dy,width,height,margin){
  const nx=finite(dx)?dx:0,ny=finite(dy)?dy:0,size=Math.max(Math.abs(nx),Math.abs(ny)),sx=size>1e-8?nx/size:0,sy=size>1e-8?ny/size:0,length=Math.hypot(sx,sy),direction=length>1e-8?{x:sx/length,y:sy/length}:{x:0,y:1};
  const halfWidth=width/2-margin,halfHeight=height/2-margin;
  const distance=Math.min(Math.abs(direction.x)>1e-9?halfWidth/Math.abs(direction.x):Infinity,Math.abs(direction.y)>1e-9?halfHeight/Math.abs(direction.y):Infinity);
  return {x:width/2+direction.x*distance,y:height/2+direction.y*distance,angle:Math.atan2(direction.y,direction.x)*180/Math.PI};
}

const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const boxAround=(x,y,rx,ry)=>({x:x-rx,y:y-ry,width:rx*2,height:ry*2});
function protectedRects(rects,width,height){
  if(!Array.isArray(rects))return [];
  return rects.slice(0,8).filter(r=>r&&['x','y','width','height'].every(k=>finite(r[k]))&&r.width>0&&r.height>0).map(r=>{
    const x=clamp(r.x,0,width),y=clamp(r.y,0,height),right=clamp(r.x+r.width,0,width),bottom=clamp(r.y+r.height,0,height);
    return {x,y,width:right-x,height:bottom-y};
  }).filter(r=>r.width>0&&r.height>0);
}
function outsideProtected(location,flag,rx,ry,rects,width,height,margin,target,directional){
  const marker=boxAround(location.x,location.y,directional?13:rx+4,directional?13:ry+4),flagBox=boxAround(flag.x,flag.y,11,11);
  if(!rects.some(r=>overlaps(marker,r)||!directional&&overlaps(flagBox,r)))return {...location,occluded:false};
  const candidates=[];
  for(const r of rects){
    // Below and left retain a nearby directional relationship to the goal.
    candidates.push({x:r.x-17,y:clamp(location.y,margin,height-margin),priority:0},{x:clamp(location.x,margin,width-margin),y:r.y+r.height+17,priority:0},
      {x:r.x+r.width+17,y:clamp(location.y,margin,height-margin),priority:1},{x:clamp(location.x,margin,width-margin),y:r.y-17,priority:1});
  }
  candidates.push({x:margin,y:clamp(location.y,margin,height-margin),priority:2},{x:clamp(location.x,margin,width-margin),y:height-margin,priority:2});
  const valid=candidates.filter(q=>q.x>=margin&&q.x<=width-margin&&q.y>=margin&&q.y<=height-margin&&!rects.some(r=>overlaps(boxAround(q.x,q.y,13,13),r)));
  valid.sort((a,b)=>a.priority-b.priority||Math.hypot(a.x-location.x,a.y-location.y)-Math.hypot(b.x-location.x,b.y-location.y));
  const chosen=valid[0];if(!chosen)return null;
  return {x:chosen.x,y:chosen.y,angle:Math.atan2(target.y-chosen.y,target.x-chosen.x)*180/Math.PI,occluded:true};
}

/** Pure present-pose projection.
 * targets: caller-selected goals with center/position, id, normal/up and either
 * radius or rectangle halfWidth/halfHeight. project is renderer.project.
 * Returned markers can be copied into the application's read-only snapshot.
 * avoidRects protects fixed overlays such as the goal camera. A blocked cue
 * becomes a displaced arrow pointing back to the true projected goal; the
 * target and camera stay unchanged. occluded/directional expose this to QA.
 * The caller owns showing, fade timing, expiry and all gameplay state.
 */
export function buildGoalCue({targets=[],project,width,height,opacity=1,reducedMotion=false,label='ゴールはこちら',avoidRects=[]}={}){
  const w=finite(width)&&width>0?width:0,h=finite(height)&&height>0?height:0,alpha=finite(opacity)?clamp(opacity,0,1):1;
  const cue={width:w,height:h,opacity:alpha,reducedMotion:!!reducedMotion,label:short(label,48),markers:[],visible:false};
  if(w<48||h<48||typeof project!=='function'||!Array.isArray(targets))return cue;
  const margin=Math.min(24,w/4,h/4),protectedAreas=protectedRects(avoidRects,w,h);
  for(let i=0;i<targets.length;i++){
    const target=targets[i],center=target?.center??target?.position;if(!finitePoint(center))continue;
    const q=projectPoint(project,center);if(!q)continue;
    const hasScreen=finite(q.x)&&finite(q.y),behind=finite(q.depth)?q.depth<=.1:q.visible===false;
    if(!hasScreen&&!behind)continue;
    const offscreen=behind||!hasScreen||q.x<margin||q.x>w-margin||q.y<margin||q.y>h-margin;
    const geometry=outline(target,center),projected=offscreen?[]:geometry.points.map(p=>projectPoint(project,p)).filter(p=>p&&finite(p.x)&&finite(p.y)&&(!finite(p.depth)||p.depth>.1));
    const rx=clamp(projected.length?Math.max(...projected.map(p=>Math.abs(p.x-q.x))):12,9,26),ry=clamp(projected.length?Math.max(...projected.map(p=>Math.abs(p.y-q.y))):12,9,26);
    let location=offscreen?edgePosition((hasScreen?q.x-w/2:0)*(behind?-1:1),(hasScreen?q.y-h/2:0)*(behind?-1:1),w,h,margin):{x:q.x,y:q.y,angle:0};
    const flagY=location.y-ry-14>=10?location.y-ry-14:location.y+ry+14,flag={x:clamp(location.x+rx+10,10,w-10),y:clamp(flagY,10,h-10)};
    const actualDirection=hasScreen?{x:behind?w-q.x:q.x,y:behind?h-q.y:q.y}:{x:w/2,y:h+24};
    location=outsideProtected(location,flag,rx,ry,protectedAreas,w,h,margin,actualDirection,offscreen);if(!location)continue;
    cue.markers.push({id:short(target.id??`goal-${i+1}`,128),kind:short(target.kind??'goal',48),shape:geometry.shape,x:location.x,y:location.y,rx,ry,angle:location.angle,offscreen,behind,occluded:location.occluded,directional:offscreen||location.occluded,flag});
  }
  cue.visible=alpha>0&&cue.markers.length>0;
  return cue;
}
function ring(marker,className){
  const x=number(marker.x),y=number(marker.y),rx=number(marker.rx),ry=number(marker.ry);
  return marker.shape==='rectangle'?`<rect class="${className}" x="${number(marker.x-marker.rx)}" y="${number(marker.y-marker.ry)}" width="${number(marker.rx*2)}" height="${number(marker.ry*2)}" rx="5"/>`:`<ellipse class="${className}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
}
const flag=(x,y)=>`<g class="goal-cue-flag" transform="translate(${number(x)} ${number(y)})"><circle class="goal-cue-flag-paper" r="10"/><path class="goal-cue-flag-pole" d="M -4 6 V -6"/><path class="goal-cue-flag-cloth" d="M -3 -6 H 6 L 3 -2 L 6 1 H -3 Z"/></g>`;
export function goalCueMarkup(cue){
  if(!cue?.visible||!Array.isArray(cue.markers))return '';
  const markers=cue.markers.map(marker=>{
    const attributes=`data-goal-cue-marker="${escape(marker.id)}" data-goal-id="${escape(marker.id)}" data-goal-offscreen="${marker.offscreen}" data-goal-behind="${marker.behind}" data-goal-occluded="${!!marker.occluded}"`;
    if(marker.directional??marker.offscreen)return `<g ${attributes} class="goal-cue-edge" transform="translate(${number(marker.x)} ${number(marker.y)}) rotate(${number(marker.angle)})"><circle class="goal-cue-edge-paper" r="12"/><path class="goal-cue-edge-arrow" d="M -6 -7 L 8 0 L -6 7 L -2 0 Z"/></g>`;
    return `<g ${attributes} class="goal-cue-marker">${ring(marker,'goal-cue-halo')}${ring(marker,'goal-cue-ring')}${flag(marker.flag.x,marker.flag.y)}</g>`;
  }).join('');
  const label=cue.label?short(cue.label,48):'',labelWidth=Math.min(cue.width-20,Math.max(98,Array.from(label).length*12+34)),labelY=Math.max(4,cue.height-43);
  const note=label?`<g class="goal-cue-note" transform="translate(10 ${number(labelY)})"><rect class="goal-cue-note-paper" width="${number(labelWidth)}" height="29" rx="9"/><text x="12" y="19">${escape(label)}</text></g>`:'';
  return `<g class="goal-cue-content" opacity="${number(clamp(cue.opacity,0,1))}" data-goal-cue-count="${cue.markers.length}" data-goal-cue-reduced-motion="${!!cue.reducedMotion}">${markers}${note}</g>`;
}
