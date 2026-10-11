// Project real world-space cue segments without stretching their direction.
// Near-plane clipping precedes projection; viewport clipping follows it.
const finitePoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
const mix = (a,b,t) => ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export function cueDirectionPoint(origin,aim,seconds=.1) {
  const elevation=aim.elevation*Math.PI/180,yaw=aim.yaw*Math.PI/180,length=aim.power*seconds;
  return {x:origin.x+Math.sin(yaw)*Math.cos(elevation)*length,y:origin.y+Math.sin(elevation)*length,z:origin.z+Math.cos(yaw)*Math.cos(elevation)*length};
}
export function clipCueSegment(a,b,width,height) {
  if (!finitePoint(a)||!finitePoint(b)||![width,height].every(Number.isFinite)||width<=0||height<=0) return null;
  const dx=b.x-a.x,dy=b.y-a.y,p=[-dx,dx,-dy,dy],q=[a.x,width-a.x,a.y,height-a.y];
  let begin=0,end=1;
  for(let i=0;i<4;i++) {
    if(p[i]===0){if(q[i]<0)return null;continue;}
    const t=q[i]/p[i];
    if(p[i]<0)begin=Math.max(begin,t);else end=Math.min(end,t);
    if(begin>end)return null;
  }
  return {from:{x:a.x+dx*begin,y:a.y+dy*begin},to:{x:a.x+dx*end,y:a.y+dy*end}};
}
export function projectCueSegments(points,project,width,height,{near=.11}={}) {
  const segments=[];
  if(!Array.isArray(points)||typeof project!=='function')return {segments,length:0};
  for(let index=1;index<points.length;index++) {
    let a=points[index-1],b=points[index],pa=project(a),pb=project(b);
    const da=pa?.depth??1,db=pb?.depth??1;
    if(!Number.isFinite(da)||!Number.isFinite(db)||da<near&&db<near)continue;
    if(da<near||db<near) {
      const t=(near-da)/(db-da),cut=mix(a,b,t);
      if(da<near){a=cut;pa=project(a);}else{b=cut;pb=project(b);}
    }
    const segment=clipCueSegment(pa,pb,width,height);
    if(segment)segments.push({...segment,index:index-1});
  }
  return {segments,length:segments.reduce((sum,s)=>sum+Math.hypot(s.to.x-s.from.x,s.to.y-s.from.y),0)};
}
export function projectCuePolygon(points,project,width,height,{near=.11}={}) {
  if(!Array.isArray(points)||points.length<3||typeof project!=='function'||width<=0||height<=0)return [];
  let world=[];
  for(let index=0;index<points.length;index++) {
    const a=points[index],b=points[(index+1)%points.length],da=project(a)?.depth??1,db=project(b)?.depth??1;
    if(!Number.isFinite(da)||!Number.isFinite(db))return [];
    const insideA=da>=near,insideB=db>=near;
    if(insideA)world.push(a);
    if(insideA!==insideB)world.push(mix(a,b,(near-da)/(db-da)));
  }
  let polygon=world.map(project);
  if(!polygon.every(finitePoint))return [];
  for(const [axis,value,sign] of [['x',0,1],['x',width,-1],['y',0,1],['y',height,-1]]) {
    const clipped=[];
    for(let index=0;index<polygon.length;index++) {
      const a=polygon[index],b=polygon[(index+1)%polygon.length],insideA=(a[axis]-value)*sign>=0,insideB=(b[axis]-value)*sign>=0;
      if(insideA)clipped.push(a);
      if(insideA!==insideB){const t=(value-a[axis])/(b[axis]-a[axis]);clipped.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
    }
    polygon=clipped;
  }
  return polygon.length>=3?polygon.map(p=>({x:p.x,y:p.y})):[];
}
