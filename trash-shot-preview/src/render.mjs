import { predictArc } from './physics.mjs?v=20261009-throw-fix-1';

const add = (a,b) => ({ x:a.x+b.x, y:a.y+b.y, z:a.z+b.z });
const sub = (a,b) => ({ x:a.x-b.x, y:a.y-b.y, z:a.z-b.z });
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const cross = (a,b) => ({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const scale = (a,n) => ({x:a.x*n,y:a.y*n,z:a.z*n});
const unit = a => scale(a,1/Math.hypot(a.x,a.y,a.z));
const circle = (center,radius,y,segments=48) => Array.from({length:segments},(_,i)=>({x:center.x+Math.cos(i/segments*Math.PI*2)*radius,y,z:center.z+Math.sin(i/segments*Math.PI*2)*radius}));

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 600, height = 440, pixelRatio = 1;
  let camera = {x:7.3,y:6.5,z:-8.3}, target = {x:0,y:.3,z:3.2};
  const defaultOrbit={azimuth:.581,elevation:.42,zoom:1};
  let orbitState={...defaultOrbit},sceneDistance=6;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let forward, right, up, focal;
  const configureCamera = () => {
    const distance=(10+sceneDistance*.6)*orbitState.zoom;
    camera={x:target.x+Math.sin(orbitState.azimuth)*Math.cos(orbitState.elevation)*distance,y:target.y+Math.sin(orbitState.elevation)*distance,z:target.z-Math.cos(orbitState.azimuth)*Math.cos(orbitState.elevation)*distance};
    forward=unit(sub(target,camera)); right=unit(cross({x:0,y:1,z:0},forward)); up=cross(forward,right);
    focal=Math.min(width*(width<450?1.13:.92),height*1.45);
  };
  const worldToCamera = point => {const p=sub(point,camera); return {x:dot(p,right),y:dot(p,up),z:dot(p,forward)};};
  const cameraToScreen = point => ({x:width/2+point.x*focal/point.z,y:height*.47-point.y*focal/point.z,depth:point.z,visible:point.z>.1});
  const project = point => cameraToScreen(worldToCamera(point));
  function cameraSnapshot(){return {azimuth:orbitState.azimuth,elevation:orbitState.elevation,zoom:orbitState.zoom,position:{...camera},target:{...target},viewport:{width,height}};}
  function orbit(azimuth,elevation){orbitState.azimuth=((orbitState.azimuth+azimuth)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);orbitState.elevation=clamp(orbitState.elevation+elevation,.15,1.43);configureCamera();}
  function zoom(factor){orbitState.zoom=clamp(orbitState.zoom*factor,.62,1.8);configureCamera();}
  function resetCamera(){orbitState={...defaultOrbit};configureCamera();}
  function resize() {
    const rect=canvas.getBoundingClientRect();
    const changed=width!==Math.max(1,rect.width)||height!==Math.max(1,rect.height);
    width=Math.max(1,rect.width); height=Math.max(1,rect.height); pixelRatio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*pixelRatio); canvas.height=Math.round(height*pixelRatio);
    configureCamera();
    resizeDepthLayer();
    return changed;
  }
  // Clip geometry before projecting: free views can put part of the floor behind the eye.
  function clipNear(points){
    const result=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],insideA=a.z>=.08,insideB=b.z>=.08;
      if(insideA)result.push(a);
      if(insideA!==insideB){const t=(.08-a.z)/(b.z-a.z);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:.08});}
    }
    return result;
  }
  function path(points) {
    if(!points.length)return;
    const p=clipNear(points.map(worldToCamera)).map(cameraToScreen);
    if(!p.length){ctx.beginPath();return;}
    ctx.beginPath(); ctx.moveTo(p[0].x,p[0].y);
    for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);
    ctx.closePath();
  }
  function polygon(points,fill,stroke,lineWidth=.6) {path(points);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
  function line(a,b,color,lineWidth=1) {let p=worldToCamera(a),q=worldToCamera(b);if(p.z<.08&&q.z<.08)return;if(p.z<.08||q.z<.08){const t=(.08-p.z)/(q.z-p.z),cut={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:.08};if(p.z<.08)p=cut;else q=cut;}p=cameraToScreen(p);q=cameraToScreen(q);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
  function shadow(center,rx,rz,opacity) {
    const points=Array.from({length:48},(_,i)=>({x:center.x+Math.cos(i/48*Math.PI*2)*rx,y:.007,z:center.z+Math.sin(i/48*Math.PI*2)*rz}));
    polygon(points,`rgba(62,78,46,${opacity})`);
  }
  function drawFloor() {
    const wash=ctx.createRadialGradient(width*.48,height*.48,20,width*.48,height*.48,width*.73);
    wash.addColorStop(0,'#f1f3e9');wash.addColorStop(1,'#e8edde');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
    polygon([{x:-5,y:-.015,z:-2},{x:5,y:-.015,z:-2},{x:5,y:-.015,z:11},{x:-5,y:-.015,z:11}],'#e9eddc');
    for(let x=-5;x<=5;x++)line({x,y:0,z:-2},{x,y:0,z:11},'rgba(118,143,94,.12)',.7);
    for(let z=-2;z<=11;z++)line({x:-5,y:0,z},{x:5,y:0,z},'rgba(118,143,94,.12)',.7);
    line({x:-5,y:0,z:-2},{x:-5,y:0,z:11},'rgba(128,147,107,.14)');
    line({x:5,y:0,z:-2},{x:5,y:0,z:11},'rgba(128,147,107,.14)');
  }
  function drawDistance(game) {
    const x=-1.55, z=game.bin.center.z;
    line({x,y:.012,z:0},{x,y:.012,z},'rgba(135,154,111,.45)',.9);
    for(const end of [0,z])line({x:x-.12,y:.014,z:end},{x:x+.12,y:.014,z:end},'rgba(135,154,111,.6)',1);
    const p=project({x:x-.3,y:.06,z:z/2});if(p.visible){ctx.fillStyle='#637554';ctx.font='10px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(`${z} m`,p.x,p.y);}
    const origin=circle({x:0,z:0},.39,.01);path(origin);ctx.strokeStyle='rgba(184,135,52,.45)';ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  }
  function drawArc(game,controls) {
    const points=predictArc(game,controls,48);
    const groundIndex=points.findIndex((p,i)=>i>1&&p.y<.03);
    const arc=groundIndex<0?points:points.slice(0,groundIndex+1);
    ctx.fillStyle='rgba(173,123,37,.55)';
    for(let i=0;i<arc.length;i+=2){const p=project(arc[i]);if(p.visible&&arc[i].y>=0){ctx.beginPath();ctx.arc(p.x,p.y,1.65,0,Math.PI*2);ctx.fill();}}
    if(arc.length){const last=arc[arc.length-1];if(last.y<=.2){const p=project({...last,y:.02});ctx.beginPath();ctx.ellipse(p.x,p.y,5,2.3,-.12,0,Math.PI*2);ctx.strokeStyle='rgba(173,123,37,.4)';ctx.lineWidth=1;ctx.stroke();}}
  }
  function drawTrail(game) {
    const trail=game.trail||[];
    if(trail.length<2)return;
    for(let i=1;i<trail.length;i++)line(trail[i-1],trail[i],`rgba(184,135,52,${.12+.3*i/trail.length})`,1.7);
  }
  function shapesForBin(game) {
    // The visible aperture equals the physical wall radius; decorative thickness grows outward.
    const c=game.bin.center,r=game.bin.radius+.025,h=game.bin.height,n=48,inner=game.bin.radius,shapes=[];
    const lower=circle(c,r,0,n),upper=circle(c,r,h,n),innerUpper=circle(c,inner,h,n),innerLower=circle(c,inner,0,n);
    const facing=unit({x:camera.x-c.x,y:0,z:camera.z-c.z});
    shapes.push({points:innerLower,fill:'#304b38',stroke:'#254734'});
    for(let i=0;i<n;i++){
      const j=(i+1)%n,theta=(i+.5)/n*Math.PI*2,normal={x:Math.cos(theta),y:0,z:Math.sin(theta)},visible=dot(normal,facing)>0;
      if(visible){const light=Math.round(49+normal.x*10-normal.z*6);shapes.push({points:[lower[i],lower[j],upper[j],upper[i]],fill:`hsl(135 19% ${light}%)`,stroke:null});}
      else shapes.push({points:[innerLower[i],innerLower[j],innerUpper[j],innerUpper[i]],fill:'#486a4b',stroke:null});
      shapes.push({points:[upper[i],upper[j],innerUpper[j],innerUpper[i]],fill:visible?'#b8c8a1':'#a3b990',stroke:'#69865c'});
    }
    // Subtle vertical ribs follow the same world-space cylinder.
    for(let i=0;i<n;i+=6){const theta=i/n*Math.PI*2;if(dot({x:Math.cos(theta),y:0,z:Math.sin(theta)},facing)>0){shapes.push({points:[lower[i],upper[i]],line:true,stroke:'rgba(32,73,45,.19)'});}}
    return shapes;
  }
  function shapesForCan(game) {
    const c=game.can.position,r=game.can.radius*.6,half=game.can.radius*.8,n=20,shapes=[];
    const flying=game.phase==='flying'||game.phase==='settling';
    const tilt=flying?Math.min(game.time*2.7,12):-.18;
    const axis=unit({x:Math.sin(tilt)*.65,y:Math.cos(tilt),z:Math.sin(tilt)*.76});
    const v=unit(cross(axis,Math.abs(axis.y)>.92?{x:1,y:0,z:0}:{x:0,y:1,z:0})),w=cross(axis,v);
    const ring=y=>Array.from({length:n},(_,i)=>add(add(c,scale(axis,y)),add(scale(v,Math.cos(i/n*Math.PI*2)*r),scale(w,Math.sin(i/n*Math.PI*2)*r))));
    const bottom=ring(-half),top=ring(half);
    for(let i=0;i<n;i++){const j=(i+1)%n,theta=(i+.5)/n*Math.PI*2,shade=Math.round(78+Math.cos(theta)*9);shapes.push({points:[bottom[i],bottom[j],top[j],top[i]],fill:i%8<3?'#af6b39':`hsl(46 12% ${shade}%)`,stroke:null});}
    shapes.push({points:bottom,fill:'#afa997',stroke:'#9b978a'},{points:top,fill:'#f0ede0',stroke:'#999f8d'});
    const cap=add(c,scale(axis,half+.003));shapes.push({points:[add(cap,scale(v,-.035)),add(cap,scale(w,.035)),add(cap,scale(v,.035)),add(cap,scale(w,-.035))],fill:'#939b8a',stroke:null});
    return shapes;
  }
  // Only the small bin/can meshes use a depth buffer. Reuse storage and cap its
  // resolution; floor, labels and actual trails remain in the existing canvas.
  const depthCanvas=document.createElement('canvas'),depthContext=depthCanvas.getContext('2d');
  const paletteCanvas=document.createElement('canvas');paletteCanvas.width=paletteCanvas.height=1;
  const paletteContext=paletteCanvas.getContext('2d',{willReadFrequently:true}),palette=new Map();
  let depthWidth=1,depthHeight=1,depthScale=1,depthPixels,depthValues;
  function resizeDepthLayer(){
    depthScale=Math.min(1,720/width,600/height);
    const w=Math.max(1,Math.ceil(width*depthScale)),h=Math.max(1,Math.ceil(height*depthScale));
    if(depthPixels&&w===depthWidth&&h===depthHeight)return;
    depthWidth=w;depthHeight=h;depthCanvas.width=w;depthCanvas.height=h;
    depthPixels=depthContext.createImageData(w,h);depthValues=new Float32Array(w*h);
  }
  function colorBytes(color){
    if(!palette.has(color)){paletteContext.clearRect(0,0,1,1);paletteContext.fillStyle=color;paletteContext.fillRect(0,0,1,1);palette.set(color,Array.from(paletteContext.getImageData(0,0,1,1).data));}
    return palette.get(color);
  }
  function screenPoint(point){const p=cameraToScreen(point);return {x:p.x*depthScale,y:p.y*depthScale,inverseDepth:1/point.z};}
  const edge=(a,b,x,y)=>(x-a.x)*(b.y-a.y)-(y-a.y)*(b.x-a.x);
  function writePixel(index,color,depth){
    depthValues[index]=depth;const offset=index*4,pixels=depthPixels.data;
    const alpha=color[3]/255,oldAlpha=pixels[offset+3]/255,combined=alpha+oldAlpha*(1-alpha);
    for(let c=0;c<3;c++)pixels[offset+c]=combined?(color[c]*alpha+pixels[offset+c]*oldAlpha*(1-alpha))/combined:0;
    pixels[offset+3]=combined*255;
  }
  function triangle(a,b,c,color){
    const area=edge(a,b,c.x,c.y);if(Math.abs(area)<.001)return;
    const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(depthWidth-1,Math.ceil(Math.max(a.x,b.x,c.x)));
    const minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(depthHeight-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const wa=edge(b,c,x+.5,y+.5)/area,wb=edge(c,a,x+.5,y+.5)/area,wc=1-wa-wb;
      if(wa<-.00001||wb<-.00001||wc<-.00001)continue;
      const depth=1/(wa*a.inverseDepth+wb*b.inverseDepth+wc*c.inverseDepth),index=y*depthWidth+x;
      if(depth<depthValues[index])writePixel(index,color,depth);
    }
  }
  function depthLine(a,b,color){
    let p=worldToCamera(a),q=worldToCamera(b);if(p.z<.08&&q.z<.08)return;
    if(p.z<.08||q.z<.08){const t=(.08-p.z)/(q.z-p.z),cut={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:.08};if(p.z<.08)p=cut;else q=cut;}
    p=screenPoint(p);q=screenPoint(q);
    const steps=Math.ceil(Math.min(2000,Math.hypot(q.x-p.x,q.y-p.y)*1.5));
    for(let i=0;i<=steps;i++){
      const t=steps?i/steps:0,x=Math.floor(p.x+(q.x-p.x)*t),y=Math.floor(p.y+(q.y-p.y)*t);
      if(x<0||x>=depthWidth||y<0||y>=depthHeight)continue;
      const depth=1/(p.inverseDepth+(q.inverseDepth-p.inverseDepth)*t),index=y*depthWidth+x;
      if(depth<=depthValues[index]+.012)writePixel(index,color,Math.min(depth,depthValues[index]));
    }
  }
  function drawDepthShapes(shapes){
    depthPixels.data.fill(0);depthValues.fill(Infinity);
    for(const shape of shapes){
      if(!shape.fill)continue;
      const points=clipNear(shape.points.map(worldToCamera)).map(screenPoint),color=colorBytes(shape.fill);
      for(let i=1;i<points.length-1;i++)triangle(points[0],points[i],points[i+1],color);
    }
    for(const shape of shapes){
      if(!shape.stroke)continue;const color=colorBytes(shape.stroke);
      if(shape.line)depthLine(shape.points[0],shape.points[1],color);
      else for(let i=0;i<shape.points.length;i++)depthLine(shape.points[i],shape.points[(i+1)%shape.points.length],color);
    }
    depthContext.putImageData(depthPixels,0,0);ctx.drawImage(depthCanvas,0,0,width,height);
  }
  function render(game,controls,view={}) {
    // Layout adapts the target only. The user's orbit survives every phase and resize.
    const distance=game.bin.center.z;
    sceneDistance=distance;
    target={x:0,y:.45,z:distance*.47};
    configureCamera();
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,width,height);
    drawFloor();drawDistance(game);
    shadow(game.bin.center,.97,.8,.11);
    shadow(game.can.position,.2+Math.max(0,game.can.position.y)*.035,.2,.13/(1+Math.max(0,game.can.position.y)*.8));
    if(view.prediction&&(game.phase==='ready'||game.phase==='success'||game.phase==='miss'))drawArc(game,controls);
    if(game.phase!=='ready')drawTrail(game);
    if(view.aim){const heading=view.aim.yaw*Math.PI/180,p=game.phase==='ready'?game.can.position:{x:0,y:1.05,z:0};line(p,{x:p.x+Math.sin(heading)*.75,y:p.y,z:p.z+Math.cos(heading)*.75},'#bd8632',2);}
    const shapes=[...shapesForBin(game),...shapesForCan(game)];
    drawDepthShapes(shapes);
    const c=game.bin.center,h=game.bin.height;
    if(game.phase==='success'){
      const p=project({x:c.x,y:h+.4,z:c.z});if(!p.visible)return;ctx.fillStyle='#946c23';ctx.textAlign='center';ctx.font='600 13px system-ui,sans-serif';ctx.fillText('NICE SHOT!',p.x,p.y);
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2,p2={x:p.x+Math.cos(a)*33,y:p.y-5+Math.sin(a)*23};ctx.beginPath();ctx.arc(p2.x,p2.y,1.6,0,Math.PI*2);ctx.fill();}
    }
  }
  resize();
  return {resize,render,project,orbit,zoom,resetCamera,cameraSnapshot};
}
