import { predictArc } from './physics.mjs';

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
  let forward, right, up, focal;
  const configureCamera = () => {
    forward=unit(sub(target,camera)); right=unit(cross({x:0,y:1,z:0},forward)); up=cross(forward,right);
    focal=Math.min(width*(width<450?1.13:.92),height*1.45);
  };
  const worldToCamera = point => {const p=sub(point,camera); return {x:dot(p,right),y:dot(p,up),z:dot(p,forward)};};
  const cameraToScreen = point => ({x:width/2+point.x*focal/point.z,y:height*.47-point.y*focal/point.z,depth:point.z,visible:point.z>.1});
  const project = point => cameraToScreen(worldToCamera(point));
  function resize() {
    const rect=canvas.getBoundingClientRect();
    width=Math.max(1,rect.width); height=Math.max(1,rect.height); pixelRatio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*pixelRatio); canvas.height=Math.round(height*pixelRatio);
    configureCamera();
  }
  function path(points) {
    if(!points.length)return;
    const p=points.map(project);
    ctx.beginPath(); ctx.moveTo(p[0].x,p[0].y);
    for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);
    ctx.closePath();
  }
  function polygon(points,fill,stroke,lineWidth=.6) {path(points);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}}
  function line(a,b,color,lineWidth=1) {const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
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
    const p=project({x:x-.3,y:.06,z:z/2});ctx.fillStyle='#8b9978';ctx.font='10px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(`${z} m`,p.x,p.y);
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
    const lower=circle(c,r,.035,n),upper=circle(c,r,h,n),innerUpper=circle(c,inner,h,n),innerLower=circle(c,inner,.07,n);
    const facing=unit({x:camera.x-c.x,y:0,z:camera.z-c.z});
    shapes.push({points:innerLower,fill:'#304b38',stroke:'#254734'});
    for(let i=0;i<n;i++){
      const j=(i+1)%n,theta=(i+.5)/n*Math.PI*2,normal={x:Math.cos(theta),y:0,z:Math.sin(theta)},visible=dot(normal,facing)>0;
      if(visible){const light=Math.round(49+normal.x*10-normal.z*6);shapes.push({points:[lower[i],lower[j],upper[j],upper[i]],fill:`hsl(135 19% ${light}%)`,stroke:null});}
      else shapes.push({points:[innerLower[i],innerLower[j],innerUpper[j],innerUpper[i]],fill:'#486a4b',stroke:null});
      shapes.push({points:[upper[i],upper[j],innerUpper[j],innerUpper[i]],fill:visible?'#b8c8a1':'#a3b990',stroke:null});
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
  function render(game,controls) {
    // The camera adapts to scene layout; physics remains entirely in world meters.
    const distance=game.bin.center.z;
    const narrow=width<450;
    target={x:0,y:.45,z:distance*.47};
    camera={x:narrow?6.8:7.3,y:narrow?7.1:6.5,z:narrow?-7.7:-8.3};
    configureCamera();
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,width,height);
    drawFloor();drawDistance(game);
    shadow(game.bin.center,.97,.8,.11);
    shadow(game.can.position,.2+Math.max(0,game.can.position.y)*.035,.2,.13/(1+Math.max(0,game.can.position.y)*.8));
    if(game.phase==='ready'||game.phase==='success'||game.phase==='miss')drawArc(game,controls);
    else drawTrail(game);
    const shapes=[...shapesForBin(game),...shapesForCan(game)];
    shapes.sort((a,b)=>b.points.reduce((sum,p)=>sum+worldToCamera(p).z,0)/b.points.length-a.points.reduce((sum,p)=>sum+worldToCamera(p).z,0)/a.points.length);
    for(const shape of shapes){if(shape.line)line(shape.points[0],shape.points[1],shape.stroke,.7);else polygon(shape.points,shape.fill,shape.stroke,.65);}
    // The near rim is a crisp world-space edge, preserving the hollow opening.
    const c=game.bin.center,r=game.bin.radius+.025,h=game.bin.height;
    const ring=circle(c,r,h,72);path(ring);ctx.strokeStyle='#69865c';ctx.lineWidth=1.1;ctx.stroke();
    if(game.phase==='success'){
      const p=project({x:c.x,y:h+.4,z:c.z});ctx.fillStyle='#bd8632';ctx.textAlign='center';ctx.font='600 13px system-ui,sans-serif';ctx.fillText('NICE SHOT!',p.x,p.y);
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2,p2={x:p.x+Math.cos(a)*33,y:p.y-5+Math.sin(a)*23};ctx.beginPath();ctx.arc(p2.x,p2.y,1.6,0,Math.PI*2);ctx.fill();}
    }
  }
  resize();
  return {resize,render,project};
}
