import {releaseChapterScene,releaseChapterMotionShapes,releaseChapterCameraConfig} from './release-chapters-scene.mjs';
import { predictArc } from './physics.mjs?v=20261015-boar-distance-1';
import { roomScene,roomMotionShapes,roomMonitorQuad,paintScreenQuad } from './room-scene.mjs?v=20261015-boar-distance-1';
import {schoolScene,schoolMotionShapes,schoolCameraConfig} from './school-scene.mjs?v=20261015-boar-distance-1';
import {outdoorScene,outdoorMotionShapes,outdoorCameraConfig} from './outdoor-scene.mjs?v=20261015-boar-distance-1';
import {factoryScene,factoryMotionShapes,factoryCameraConfig} from './factory-scene.mjs?v=20261015-boar-distance-1';
import {eccentricScene,eccentricMotionShapes,eccentricCameraConfig,eccentricItemMeshes} from './eccentric-scene.mjs?v=20261015-boar-distance-1';
import {drawPixelText} from './pixel-type.mjs?v=20261015-boar-distance-1';
import {getThrowable} from './throwables.mjs?v=20261015-boar-distance-1';
import {getThrowableId,throwablePose} from './throwable-physics.mjs?v=20261015-boar-distance-1';

const add = (a,b) => ({ x:a.x+b.x, y:a.y+b.y, z:a.z+b.z });
const sub = (a,b) => ({ x:a.x-b.x, y:a.y-b.y, z:a.z-b.z });
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const cross = (a,b) => ({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const scale = (a,n) => ({x:a.x*n,y:a.y*n,z:a.z*n});
const unit = a => scale(a,1/Math.hypot(a.x,a.y,a.z));
const circle = (center,radius,y,segments=48) => Array.from({length:segments},(_,i)=>({x:center.x+Math.cos(i/segments*Math.PI*2)*radius,y,z:center.z+Math.sin(i/segments*Math.PI*2)*radius}));

// Alternate live views keep the world's target and distance. Their ordinary
// orbit tuple can therefore be recorded and restored by every existing codec.
export function goalCameraOrbit(world){
  if(world?.worldVersion===49)return {azimuth:Math.PI*2-.85,elevation:.36,zoom:.62};
  return {azimuth:Math.PI-(world?.outdoorType==='baseball'?.16:.1),elevation:world?.worldVersion===31?.46:world?.outdoorType==='mall'?.22:.26,zoom:world?.worldVersion===32?.9:.62};
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 600, height = 440, pixelRatio = 1;
  let camera = {x:7.3,y:6.5,z:-8.3}, target = {x:0,y:.3,z:3.2};
  const defaultOrbit={azimuth:.581,elevation:.42,zoom:1};
  let orbitState={...defaultOrbit},sceneDistance=6;
  let projection='perspective',sideZoom=1,sideFrame={scale:40,left:40,floor:height-42};
  let worldView=null,cameraViewOverride=null;
  let environment=null,roomCache=null,roomBuilds=0,roomCutaway=[],roomFlightKey='',roomFlight=[],revealProgress=null,revealDistance=1;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  let forward, right, up, focal,angleCueSnapshot=null,coinAccentSnapshot=null;
  const configureCamera = () => {
    const distance=(cameraViewOverride?.distance??worldView?.view.distance??(10+sceneDistance*.6))*orbitState.zoom*revealDistance;
    camera={x:target.x+Math.sin(orbitState.azimuth)*Math.cos(orbitState.elevation)*distance,y:target.y+Math.sin(orbitState.elevation)*distance,z:target.z-Math.cos(orbitState.azimuth)*Math.cos(orbitState.elevation)*distance};
    forward=unit(sub(target,camera)); right=unit(cross({x:0,y:1,z:0},forward)); up=cross(forward,right);
    const portraitRoom=([2,3,4,5].includes(worldView?.worldVersion)||['school','outdoor','factory','eccentric'].includes(worldView?.environment))&&width<600;
    focal=worldView?.worldVersion===39?Math.min(width*(width<600?.88:.42),height*1.1):Math.min(width*(portraitRoom?1.48:width<450?1.13:.92),height*1.45);
  };
  const worldToCamera = point => {const p=sub(point,camera); return {x:dot(p,right),y:dot(p,up),z:dot(p,forward)};};
  const cameraToScreen = point => ({x:width/2+point.x*focal/point.z,y:height*.47-point.y*focal/point.z,depth:point.z,visible:point.z>.1});
  const project = point => projection==='side'?{x:sideFrame.left+point.z*sideFrame.scale,y:sideFrame.floor-point.y*sideFrame.scale,depth:1,visible:true}:cameraToScreen(worldToCamera(point));
  // The legal 3D orbit is retained for V1 replays; side zoom never changes it.
  function cameraSnapshot(){return {azimuth:orbitState.azimuth,elevation:orbitState.elevation,zoom:orbitState.zoom,projection,sideZoom,environment,worldVersion:worldView?.worldVersion??0,angleCue:angleCueSnapshot?structuredClone(angleCueSnapshot):null,roomBuilds,roomCutaway:[...roomCutaway],position:{...camera},target:{...target},viewport:{width,height},...(coinAccentSnapshot?{coinAccent:structuredClone(coinAccentSnapshot)}:{})};}
  function setProjection(mode){projection=mode==='side'?'side':'perspective';}
  function setWorldView(world){if(worldView?.worldVersion!==world?.worldVersion){roomCache=null;cameraViewOverride=null;}worldView=world??null;}
  function setCameraViewOverride(view){cameraViewOverride=worldView?.worldVersion===38&&view?{target:{...view.target},distance:view.distance}:null;if(cameraViewOverride)target={...cameraViewOverride.target};configureCamera();}
  function monitorQuad(){return roomMonitorQuad(worldView).map(project);}
  function orbit(azimuth,elevation){if(projection==='side')return;orbitState.azimuth=((orbitState.azimuth+azimuth)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);orbitState.elevation=clamp(orbitState.elevation+elevation,.15,1.43);configureCamera();}
  function zoom(factor){if(projection==='side'){sideZoom=clamp(sideZoom*factor,.62,1.8);return;}orbitState.zoom=clamp(orbitState.zoom*factor,.62,1.8);configureCamera();}
  function restoreCamera(snapshot){orbitState={azimuth:snapshot.azimuth,elevation:clamp(snapshot.elevation,.15,1.43),zoom:clamp(snapshot.zoom,.62,1.8)};configureCamera();}
  function resetCamera(){cameraViewOverride=null;if(projection==='side'){sideZoom=1;return;}if(worldView?.worldVersion===38)target={...worldView.view.target};orbitState=worldView?.environment==='release'?releaseChapterCameraConfig(worldView):worldView?.environment==='factory'?factoryCameraConfig(worldView):worldView?.environment==='eccentric'?eccentricCameraConfig(worldView):worldView?.environment==='outdoor'?outdoorCameraConfig(worldView):worldView?.environment==='school'?schoolCameraConfig(worldView):[2,3,4,5].includes(worldView?.worldVersion)?{azimuth:.18,elevation:.40,zoom:1}:{...defaultOrbit};configureCamera();}
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
  function shadow(center,rx,rz,opacity,groundY=0) {
    const points=Array.from({length:48},(_,i)=>({x:center.x+Math.cos(i/48*Math.PI*2)*rx,y:groundY+.007,z:center.z+Math.sin(i/48*Math.PI*2)*rz}));
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
  function drawDistance(game,numericLabels=true) {
    const x=-1.55, z=game.bin.center.z;
    line({x,y:.012,z:0},{x,y:.012,z},'rgba(135,154,111,.45)',.9);
    for(const end of [0,z])line({x:x-.12,y:.014,z:end},{x:x+.12,y:.014,z:end},'rgba(135,154,111,.6)',1);
    const p=project({x:x-.3,y:.06,z:z/2});if(numericLabels&&p.visible){ctx.fillStyle='#637554';ctx.font='10px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(`${z} m`,p.x,p.y);}
    const origin=circle({x:0,z:0},.39,.01);path(origin);ctx.strokeStyle='rgba(184,135,52,.45)';ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  }
  function drawArc(game,controls,override=null) {
    const points=override||predictArc(game,controls,48);
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
  function drawAngleCue(game,aim,numericLabels=true){
    const baseOrigin=worldView?.origin??{x:0,y:1.05,z:0},item=getThrowable(getThrowableId(game));
    const origin=item.id==='can'?baseOrigin:{...baseOrigin,y:baseOrigin.y+game.can.radius-.14},angle=aim.elevation*Math.PI/180,heading=aim.yaw*Math.PI/180,radius=.66;
    const at=a=>({x:origin.x+Math.sin(heading)*Math.cos(a)*radius,y:origin.y+Math.sin(a)*radius,z:origin.z+Math.cos(heading)*Math.cos(a)*radius});
    const arc=Array.from({length:13},(_,i)=>at(angle*i/12));polygon([origin,...arc],'rgba(218,173,75,.18)');
    for(let i=1;i<arc.length;i++)line(arc[i-1],arc[i],'#c49942',1.4);
    line(origin,arc[0],'rgba(143,153,123,.65)',1);line(origin,arc.at(-1),'#bc852f',2.2);
    const o=project(origin),tip=project(arc.at(-1));if(!tip.visible||!o.visible)return;
    const direction=Math.atan2(tip.y-o.y,tip.x-o.x);ctx.beginPath();ctx.moveTo(tip.x,tip.y);for(const offset of [-.45,.45])ctx.lineTo(tip.x-Math.cos(direction+offset)*9,tip.y-Math.sin(direction+offset)*9);ctx.closePath();ctx.fillStyle='#bc852f';ctx.fill();
    const text=`弧 ${aim.elevation}°${aim.yaw?` · ${aim.yaw<0?'左':'右'} ${Math.abs(aim.yaw)}°`:''}`,x=clamp(tip.x+10,12,width-142),y=clamp(tip.y-14,42,height-18);
    if(numericLabels){ctx.font='600 12px system-ui,sans-serif';ctx.textAlign='left';const textWidth=ctx.measureText(text).width;ctx.fillStyle='rgba(255,248,233,.94)';ctx.fillRect(x-5,y-15,textWidth+10,23);ctx.fillStyle='#286864';ctx.fillText(text,x,y);}
    angleCueSnapshot={origin:{...origin},elevation:aim.elevation,yaw:aim.yaw,tip:arc.at(-1),screenOrigin:o,screenTip:tip};
  }
  function shapesForBin(game,room=false) {
    // The visible aperture equals the physical wall radius; decorative thickness grows outward.
    const c=game.bin.center,r=game.bin.radius+(room ? .065 : .025),h=game.bin.height,n=48,inner=game.bin.radius,shapes=[];
    // A thin visual bottom sits above the decorative rug, never over the mouth.
    const lower=circle(c,r,0,n),upper=circle(c,r,h,n),innerUpper=circle(c,inner,h,n),innerLower=circle(c,inner,room ? .026 : 0,n);
    const facing=unit({x:camera.x-c.x,y:0,z:camera.z-c.z});
    shapes.push({points:innerLower,fill:room?'#235452':'#304b38',stroke:room?'#1e4b49':'#254734'});
    for(let i=0;i<n;i++){
      const j=(i+1)%n,theta=(i+.5)/n*Math.PI*2,normal={x:Math.cos(theta),y:0,z:Math.sin(theta)},visible=dot(normal,facing)>0;
      if(visible){const light=Math.round((room?45:49)+normal.x*10-normal.z*6);shapes.push({points:[lower[i],lower[j],upper[j],upper[i]],fill:room?`hsl(175 32% ${light}%)`:`hsl(135 19% ${light}%)`,stroke:null});}
      else shapes.push({points:[innerLower[i],innerLower[j],innerUpper[j],innerUpper[i]],fill:room?'#367b77':'#486a4b',stroke:null});
      shapes.push({points:[upper[i],upper[j],innerUpper[j],innerUpper[i]],fill:room?(visible?'#eac264':'#cfa64b'):(visible?'#b8c8a1':'#a3b990'),stroke:room?'#b99547':'#69865c'});
      if(room)shapes.push({points:[{...upper[i],y:h-.07},{...upper[j],y:h-.07},upper[j],upper[i]],fill:visible?'#dcaf51':'#bd9541'});
    }
    // Subtle vertical ribs follow the same world-space cylinder.
    for(let i=0;i<n;i+=6){const theta=i/n*Math.PI*2;if(dot({x:Math.cos(theta),y:0,z:Math.sin(theta)},facing)>0){shapes.push({points:[lower[i],{...upper[i],y:h-.08}],line:true,stroke:room?'rgba(25,87,82,.27)':'rgba(32,73,45,.19)'});}}
    return shapes;
  }
  function shapesForCan(game,room=false,options={}) {
    const item=getThrowable(getThrowableId(game));
    if(item.id!=='can')return shapesForItem(game,item,options);
    const c=game.can.position,r=game.can.radius*.6,half=game.can.radius*.8,n=20,shapes=[];
    const flying=game.phase==='flying'||game.phase==='settling';
    const tilt=flying?Math.min(game.time*2.7,12):-.18;
    const axis=unit({x:Math.sin(tilt)*.65,y:Math.cos(tilt),z:Math.sin(tilt)*.76});
    const v=unit(cross(axis,Math.abs(axis.y)>.92?{x:1,y:0,z:0}:{x:0,y:1,z:0})),w=cross(axis,v);
    const ring=(y,crumple=false)=>Array.from({length:n},(_,i)=>{const radius=r*(crumple?(.77+.17*Math.cos(i*2.4)) :1);return add(add(c,scale(axis,y)),add(scale(v,Math.cos(i/n*Math.PI*2)*radius),scale(w,Math.sin(i/n*Math.PI*2)*radius)));});
    const bottom=ring(-half),top=ring(half);
    const middle=ring(0,true);
    for(let i=0;i<n;i++){const j=(i+1)%n,theta=(i+.5)/n*Math.PI*2,shade=Math.round(78+Math.cos(theta)*9);if(room){const color=`hsl(27 78% ${Math.round(53+Math.cos(theta)*10)}%)`;shapes.push({points:[bottom[i],bottom[j],middle[j],middle[i]],fill:color},{points:[middle[i],middle[j],top[j],top[i]],fill:i%5===0?'#eaa66b':color});}else shapes.push({points:[bottom[i],bottom[j],top[j],top[i]],fill:i%8<3?'#af6b39':`hsl(46 12% ${shade}%)`,stroke:null});}
    shapes.push({points:bottom,fill:'#afa997',stroke:'#9b978a'},{points:top,fill:'#f0ede0',stroke:'#999f8d'});
    const cap=add(c,scale(axis,half+.003));shapes.push({points:[add(cap,scale(v,-.035)),add(cap,scale(w,.035)),add(cap,scale(v,.035)),add(cap,scale(w,-.035))],fill:'#939b8a',stroke:null});
    return shapes;
  }
  function shapesForItem(game,item,options={}){
    const specialised=eccentricItemMeshes(game,item,options);if(specialised)return specialised;
    const center=game.can.position,radius=game.can.radius,pose=throwablePose(game),shapes=[];
    const transform=point=>{
      const cp=Math.cos(pose.pitch),sp=Math.sin(pose.pitch),cy=Math.cos(pose.yaw),sy=Math.sin(pose.yaw),cr=Math.cos(pose.roll),sr=Math.sin(pose.roll);
      const a={x:point.x,y:point.y*cp-point.z*sp,z:point.y*sp+point.z*cp};
      const b={x:a.x*cy+a.z*sy,y:a.y,z:-a.x*sy+a.z*cy};
      return {x:center.x+b.x*cr-b.y*sr,y:center.y+b.x*sr+b.y*cr,z:center.z+b.z};
    };
    const face=(points,fill,stroke=null)=>shapes.push({points:points.map(transform),fill,stroke});
    if(item.shape==='coin'){
      const n=14,half=radius*.12,r=radius*.94,ring=y=>Array.from({length:n},(_,i)=>({x:Math.cos(i/n*Math.PI*2)*r,y,z:Math.sin(i/n*Math.PI*2)*r})),lo=ring(-half),hi=ring(half);
      for(let i=0;i<n;i++)face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],i%2?'#b99643':'#d6b767');
      face(lo,'#b99b52');face(hi,'#e6cd88','#b99b52');
      face([{x:-r*.28,y:half+.001,z:-r*.28},{x:r*.28,y:half+.001,z:-r*.28},{x:r*.28,y:half+.001,z:r*.28},{x:-r*.28,y:half+.001,z:r*.28}],'#b99b52');
    }else if(['ball','heavy','baseball','ice-scoop','firework-ball'].includes(item.shape)){
      const rows=8,columns=16;
      const vertex=(row,column)=>{const latitude=-Math.PI/2+row/rows*Math.PI,longitude=column/columns*Math.PI*2;return {x:Math.cos(latitude)*Math.cos(longitude)*radius*.96,y:Math.sin(latitude)*radius*.96,z:Math.cos(latitude)*Math.sin(longitude)*radius*.96};};
      for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
        const shade=item.shape==='heavy'?Math.round(42+row*3+Math.cos(column/columns*Math.PI*2)*9):Math.round(51+row*2+Math.cos(column/columns*Math.PI*2)*8);
        const color=item.shape==='heavy'?`hsl(171 9% ${shade}%)`:item.shape==='baseball'?((row===2||row===5)&&column%2===0?'#b86858':`hsl(43 42% ${82+Math.round(Math.cos(column)*5)}%)`):item.shape==='ice-scoop'?`hsl(343 49% ${72+row+Math.round(Math.cos(column)*4)}%)`:item.shape==='firework-ball'?(column%4===0?'#6a6459':`hsl(31 38% ${46+row+Math.round(Math.cos(column)*5)}%)`):(row===3||column===3?'#f4de94':`hsl(41 77% ${shade}%)`);
        face([vertex(row,column),vertex(row,column+1),vertex(row+1,column+1),vertex(row+1,column)],color);
      }
    }else if(item.shape==='paper'){
      const phi=(1+Math.sqrt(5))/2;
      const vertices=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(([x,y,z],index)=>{
        const scale=radius*(.78+.16*Math.cos(index*2.3))/Math.hypot(x,y,z);return {x:x*scale,y:y*scale,z:z*scale};
      });
      const triangles=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
      triangles.forEach((indices,index)=>face(indices.map(i=>vertices[i]),['#f3ead7','#dfd3b7','#fff7e5','#e7dcc3'][index%4],'#c9bc9e'));
    }else{
      // The box fits inside its documented spherical collision envelope. Its
      // asymmetric folded top and deterministic tumble remain visible.
      const x=radius*.45,y=radius*.70,z=radius*.43;
      const vertices=[{x:-x,y:-y,z:-z},{x:x,y:-y,z:-z},{x:x,y:y,z:-z},{x:-x,y:y,z:-z},{x:-x,y:-y,z:z},{x:x,y:-y,z:z},{x:x,y:y*.77,z:z},{x:-x,y:y*.77,z:z}];
      for(const [indices,color] of [[[0,1,2,3],'#5f9688'],[[1,5,6,2],'#79aa9b'],[[5,4,7,6],'#e7ead5'],[[4,0,3,7],'#6e9f91'],[[3,2,6,7],'#f5eedb'],[[0,4,5,1],'#497d72']])face(indices.map(i=>vertices[i]),color);
      face([{x:-x*.55,y:-y*.25,z:z+.001},{x:x*.55,y:-y*.25,z:z+.001},{x:x*.55,y:y*.36,z:z+.001},{x:-x*.55,y:y*.36,z:z+.001}],'#d9b96b');
    }
    return shapes;
  }
  // The same capped depth buffer handles room and gameplay meshes. Static room
  // geometry is cached per view, while the can is always drawn at its real pose.
  const depthCanvas=document.createElement('canvas'),depthContext=depthCanvas.getContext('2d');
  const paletteCanvas=document.createElement('canvas');paletteCanvas.width=paletteCanvas.height=1;
  const paletteContext=paletteCanvas.getContext('2d',{willReadFrequently:true}),palette=new Map();
  let depthWidth=1,depthHeight=1,depthScale=1,depthPixels,depthValues;
  function resizeDepthLayer(){
    // The static room cache supersamples edges, with a bounded pixel budget.
    // Neutral/free and replay views keep their existing resolution budget.
    depthScale=['outdoor','factory','eccentric'].includes(environment)?Math.min(1.5,1100/width,750/height):environment==='room'||environment==='school'?(revealProgress!==null?Math.min(1,480/width,320/height):Math.min(2,1280/width,900/height)):Math.min(1,720/width,600/height);
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
  function writePixel(index,color,depth,depthWrite=true){
    if(depthWrite)depthValues[index]=depth;const offset=index*4,pixels=depthPixels.data;
    const alpha=color[3]/255,oldAlpha=pixels[offset+3]/255,combined=alpha+oldAlpha*(1-alpha);
    for(let c=0;c<3;c++)pixels[offset+c]=combined?(color[c]*alpha+pixels[offset+c]*oldAlpha*(1-alpha))/combined:0;
    pixels[offset+3]=combined*255;
  }
  function triangle(a,b,c,color,depthWrite=true){
    const area=edge(a,b,c.x,c.y);if(Math.abs(area)<.001)return;
    const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(depthWidth-1,Math.ceil(Math.max(a.x,b.x,c.x)));
    const minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(depthHeight-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const wa=edge(b,c,x+.5,y+.5)/area,wb=edge(c,a,x+.5,y+.5)/area,wc=1-wa-wb;
      if(wa<-.00001||wb<-.00001||wc<-.00001)continue;
      const depth=1/(wa*a.inverseDepth+wb*b.inverseDepth+wc*c.inverseDepth),index=y*depthWidth+x;
      if(depth<depthValues[index])writePixel(index,color,depth,depthWrite);
    }
  }
  function depthLine(a,b,color,depthWrite=true){
    let p=worldToCamera(a),q=worldToCamera(b);if(p.z<.08&&q.z<.08)return;
    if(p.z<.08||q.z<.08){const t=(.08-p.z)/(q.z-p.z),cut={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:.08};if(p.z<.08)p=cut;else q=cut;}
    p=screenPoint(p);q=screenPoint(q);
    const steps=Math.ceil(Math.min(2000,Math.hypot(q.x-p.x,q.y-p.y)*1.5));
    for(let i=0;i<=steps;i++){
      const t=steps?i/steps:0,x=Math.floor(p.x+(q.x-p.x)*t),y=Math.floor(p.y+(q.y-p.y)*t);
      if(x<0||x>=depthWidth||y<0||y>=depthHeight)continue;
      const depth=1/(p.inverseDepth+(q.inverseDepth-p.inverseDepth)*t),index=y*depthWidth+x;
      if(depth<=depthValues[index]+.012)writePixel(index,color,Math.min(depth,depthValues[index]),depthWrite);
    }
  }
  function rasterizeShapes(shapes){
    for(const shape of shapes){
      if(!shape.fill)continue;
      const points=clipNear(shape.points.map(worldToCamera)).map(screenPoint),color=colorBytes(shape.fill);
      for(let i=1;i<points.length-1;i++)triangle(points[0],points[i],points[i+1],color,shape.depthWrite!==false);
    }
    for(const shape of shapes){
      if(!shape.stroke)continue;const color=colorBytes(shape.stroke);
      if(shape.line)depthLine(shape.points[0],shape.points[1],color,shape.depthWrite!==false);
      else for(let i=0;i<shape.points.length;i++)depthLine(shape.points[i],shape.points[(i+1)%shape.points.length],color,shape.depthWrite!==false);
    }
  }
  function drawDepthShapes(shapes,backgroundDepth=null){
    depthPixels.data.fill(0);if(backgroundDepth)depthValues.set(backgroundDepth);else depthValues.fill(Infinity);
    rasterizeShapes(shapes);depthContext.putImageData(depthPixels,0,0);ctx.drawImage(depthCanvas,0,0,width,height);
  }
  function drawCoinAccent(game,view){
    if(getThrowable(getThrowableId(game)).shape!=='coin')return;
    const point=project(game.can.position),physicalRadius=game.can.radius;
    const isVisible=(p,radius=physicalRadius)=>{
      if(!p.visible||p.x<0||p.y<0||p.x>=width||p.y>=height)return false;
      const x=Math.min(depthWidth-1,Math.floor(p.x*depthScale)),y=Math.min(depthHeight-1,Math.floor(p.y*depthScale));
      return p.depth-radius<=depthValues[y*depthWidth+x]+.025;
    };
    const bodyRadiusPixels=physicalRadius*focal/Math.max(.1,point.depth),visible=isVisible(point);
    // A screen-space glint makes a real-size coin readable. Its collision
    // radius, pose and past trail remain unchanged; there is no future path.
    coinAccentSnapshot={visible,phase:game.phase,screen:{x:point.x,y:point.y},physicalRadius,bodyRadiusPixels,haloRadius:12,historicalMotes:0};
    if(!visible)return;
    const t=view.reducedMotion?0:(view.environmentTime??game.time??0),pulse=view.reducedMotion?1:.84+.16*Math.sin(t*7);
    ctx.save();
    const glow=ctx.createRadialGradient(point.x,point.y,1,point.x,point.y,12);
    glow.addColorStop(0,`rgba(255,245,179,${.8*pulse})`);glow.addColorStop(.38,`rgba(249,205,83,${.38*pulse})`);glow.addColorStop(1,'rgba(249,205,83,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(point.x,point.y,12,0,Math.PI*2);ctx.fill();
    const core=Math.max(2.1,Math.min(4,bodyRadiusPixels));
    ctx.fillStyle='#fff8ce';ctx.strokeStyle='#c39335';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(point.x,point.y,core,core*.68,.25,0,Math.PI*2);ctx.fill();ctx.stroke();
    const star=(x,y,r,alpha)=>{ctx.globalAlpha=alpha;ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.24,y-r*.24);ctx.lineTo(x+r,y);ctx.lineTo(x+r*.24,y+r*.24);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.24,y+r*.24);ctx.lineTo(x-r,y);ctx.lineTo(x-r*.24,y-r*.24);ctx.closePath();ctx.fill();};
    star(point.x+5,point.y-5,3.3,pulse);star(point.x-5.5,point.y+3.5,1.9,.55+.2*pulse);
    if(['flying','settling'].includes(game.phase)){
      const trail=game.trail??[];
      for(const [offset,alpha] of [[4,.5],[9,.3],[14,.15]]){
        const prior=trail[trail.length-1-offset];if(!prior)continue;
        const p=project(prior);if(!isVisible(p,0))continue;
        star(p.x,p.y,1.6,alpha);coinAccentSnapshot.historicalMotes++;
      }
    }
    ctx.restore();
  }
  function drawRoom(game,controls,view){
    ctx.fillStyle='#f4ead5';ctx.fillRect(0,0,width,height);
    const flightKey=[worldView?.worldVersion,getThrowableId(game),game.bin.radius,worldView?.origin.y,game.attempts,game.bin.center.z,game.bin.height,controls.power,controls.elevation,controls.yaw].join('/');
    // An explicit empty path is intentional: normal aiming must not use a
    // hidden future trajectory to fade walls or furniture.
    if(!Array.isArray(view.windArc)&&roomFlightKey!==flightKey){roomFlightKey=flightKey;roomFlight=predictArc(game,controls,80);}
    const room=roomScene(camera,game.bin.center.z,[...(Array.isArray(view.windArc)?view.windArc:roomFlight),...(game.trail||[])],view.extraRoom,view.course,worldView);
    const key=[worldView?.worldVersion,game.bin.radius,width,height,depthWidth,depthHeight,sceneDistance,camera.x,camera.y,camera.z,orbitState.azimuth,orbitState.elevation,orbitState.zoom,view.extraRoom===true,view.course?.stageId,...room.cutaway].join('/');
    if(!roomCache||roomCache.key!==key){
      const opaque=room.shapes.filter(s=>s.depthWrite!==false),faded=room.shapes.filter(s=>s.depthWrite===false);
      faded.sort((a,b)=>dot(sub(b.points[0],camera),forward)-dot(sub(a.points[0],camera),forward));
      depthPixels.data.fill(0);depthValues.fill(Infinity);rasterizeShapes([...opaque,...faded]);
      const image=document.createElement('canvas');image.width=depthWidth;image.height=depthHeight;image.getContext('2d').putImageData(depthPixels,0,0);
      roomCache={key,image,depth:new Float32Array(depthValues)};roomCutaway=room.cutaway;roomBuilds++;
    }
    ctx.drawImage(roomCache.image,0,0,width,height);
    return roomCache.depth;
  }
  function drawSchool(game,view){
    const wash=ctx.createLinearGradient(0,0,0,height);
    wash.addColorStop(0,worldView.schoolType==='rooftop'||worldView.schoolType==='passage'?'#bddbd5':'#f4ead5');wash.addColorStop(1,'#f0e4c9');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
    const scene=schoolScene(camera,worldView);
    const key=['school',worldView.worldVersion,width,height,depthWidth,depthHeight,camera.x,camera.y,camera.z,orbitState.azimuth,orbitState.elevation,orbitState.zoom,...scene.cutaway].join('/');
    if(!roomCache||roomCache.key!==key){
      const opaque=scene.shapes.filter(s=>s.depthWrite!==false),faded=scene.shapes.filter(s=>s.depthWrite===false);
      faded.sort((a,b)=>dot(sub(b.points[0],camera),forward)-dot(sub(a.points[0],camera),forward));
      depthPixels.data.fill(0);depthValues.fill(Infinity);rasterizeShapes([...opaque,...faded]);
      const image=document.createElement('canvas');image.width=depthWidth;image.height=depthHeight;image.getContext('2d').putImageData(depthPixels,0,0);
      roomCache={key,image,depth:new Float32Array(depthValues)};roomCutaway=scene.cutaway;roomBuilds++;
    }
    ctx.drawImage(roomCache.image,0,0,width,height);return roomCache.depth;
  }
  function drawOutdoor(game,view){
    const river=worldView.outdoorType==='river',night=worldView.worldVersion===37,time=view.environmentTime??0;
    const wash=ctx.createLinearGradient(0,0,0,height);wash.addColorStop(0,night?(worldView.lighting?.sky??'#050a14'):river?'#152f3b':worldView.outdoorType==='baseball'?'#bddbd5':'#f4ead5');wash.addColorStop(1,night?(worldView.lighting?.water??'#0b1722'):river?'#294854':'#efe1c6');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
    // Background pools are cached for at most 100 ms of environment time.
    // New images sample the actual current lamp pose; boat meshes, chimney,
    // colliders, ball and fixed goal camera still follow their frame clock.
    const lightTick=river?Math.floor(time*10)/10:0;
    const key=['outdoor',worldView.worldVersion,width,height,depthWidth,depthHeight,camera.x,camera.y,camera.z,lightTick].join('/');
    if(!roomCache||roomCache.key!==key){
      const scene=outdoorScene(camera,worldView,night?time:lightTick,view),opaque=scene.shapes.filter(s=>s.depthWrite!==false),faded=scene.shapes.filter(s=>s.depthWrite===false);
      faded.sort((a,b)=>dot(sub(b.points[0],camera),forward)-dot(sub(a.points[0],camera),forward));
      depthPixels.data.fill(0);depthValues.fill(Infinity);rasterizeShapes([...opaque,...faded]);
      const image=document.createElement('canvas');image.width=depthWidth;image.height=depthHeight;image.getContext('2d').putImageData(depthPixels,0,0);
      roomCache={key,image,depth:new Float32Array(depthValues)};roomCutaway=scene.cutaway;roomBuilds++;
    }
    ctx.drawImage(roomCache.image,0,0,width,height);return roomCache.depth;
  }
  function drawAdvanced(game,view){
    const factory=worldView.environment==='factory';
    const wash=ctx.createLinearGradient(0,0,0,height);wash.addColorStop(0,factory?'#d5d8bf':'#bfdedb');wash.addColorStop(1,'#f4ead5');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
    const key=['advanced',worldView.worldVersion,width,height,depthWidth,depthHeight,camera.x,camera.y,camera.z].join('/');
    if(!roomCache||roomCache.key!==key){
      const scene=(worldView.environment==='release'?releaseChapterScene:factory?factoryScene:eccentricScene)(camera,worldView),opaque=scene.shapes.filter(s=>s.depthWrite!==false),faded=scene.shapes.filter(s=>s.depthWrite===false);
      faded.sort((a,b)=>dot(sub(b.points[0],camera),forward)-dot(sub(a.points[0],camera),forward));
      depthPixels.data.fill(0);depthValues.fill(Infinity);rasterizeShapes([...opaque,...faded]);
      const image=document.createElement('canvas');image.width=depthWidth;image.height=depthHeight;image.getContext('2d').putImageData(depthPixels,0,0);
      roomCache={key,image,depth:new Float32Array(depthValues)};roomCutaway=scene.cutaway;roomBuilds++;
    }
    ctx.drawImage(roomCache.image,0,0,width,height);return roomCache.depth;
  }
  function drawSide(game,controls,view){
    // A true orthographic y/z plane: a metre has the same scale on both axes,
    // independent of depth. Fit the actual flight without hiding the bin.
    const trail=game.trail||[],points=[game.can.position,...trail];
    let prediction=[];
    if(view.prediction&&['ready','success','miss'].includes(game.phase)){
      const arc=view.windArc??predictArc(game,{...(view.aim||controls),yaw:0},64),end=arc.findIndex((p,i)=>i>1&&p.y<.03);
      prediction=end<0?arc:arc.slice(0,end+1);
      points.push(...prediction);
    }
    const minZ=Math.min(-.8,...points.map(p=>p.z-.3)),maxZ=Math.max(game.bin.center.z+1.8,...points.map(p=>p.z+.4));
    const maxY=Math.max(3.8,...points.map(p=>p.y+.45));
    const scale=Math.min((width-44)/(maxZ-minZ),(height-72)/maxY)/sideZoom;
    sideFrame={scale,left:22-minZ*scale,floor:height-38};
    ctx.fillStyle='#eef2e7';ctx.fillRect(0,0,width,height);
    const stroke=(a,b,color,lineWidth=1)=>{const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();};
    for(let y=1;y<=Math.ceil(maxY);y++)stroke({z:minZ,y},{z:maxZ,y},'rgba(103,132,81,.12)');
    const floor=sideFrame.floor;
    ctx.fillStyle='#dde5cf';ctx.fillRect(0,floor,width,height-floor);
    stroke({z:minZ,y:0},{z:maxZ,y:0},'#829570',1.5);
    ctx.textAlign='center';ctx.font='10px system-ui,sans-serif';ctx.fillStyle='#536b49';
    if(view.numericLabels!==false)for(let z=0;z<=game.bin.center.z;z+=2){const p=project({z,y:0});ctx.beginPath();ctx.moveTo(p.x,floor);ctx.lineTo(p.x,floor+5);ctx.strokeStyle='#829570';ctx.stroke();ctx.fillText(`${z} m`,p.x,floor+20);}
    ctx.textAlign='left';ctx.font='600 12px system-ui,sans-serif';ctx.fillStyle='#36553f';ctx.fillText('脇道 · 横からぽいっ（2D）',14,22);
    if(prediction.length){ctx.fillStyle='#ac7728';for(let i=0;i<prediction.length;i+=2){const p=project(prediction[i]);if(prediction[i].y>=0){ctx.beginPath();ctx.arc(p.x,p.y,1.7,0,Math.PI*2);ctx.fill();}}}
    for(let i=1;i<trail.length;i++)stroke(trail[i-1],trail[i],`rgba(167,112,33,${.25+.4*i/trail.length})`,2);
    if(view.aim?.valid&&!view.customCue){
      const angle=view.aim.elevation*Math.PI/180,length=.6+view.aim.power*.06,origin=game.phase==='ready'?game.can.position:{y:1.05,z:0};
      const end={z:origin.z+Math.cos(angle)*length,y:origin.y+Math.sin(angle)*length},a=project(origin),b=project(end),heading=Math.atan2(b.y-a.y,b.x-a.x);
      stroke(origin,end,'#a86d25',2.5);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-8*Math.cos(heading-.45),b.y-8*Math.sin(heading-.45));ctx.lineTo(b.x-8*Math.cos(heading+.45),b.y-8*Math.sin(heading+.45));ctx.closePath();ctx.fillStyle='#a86d25';ctx.fill();
    }
    const c=game.bin.center,r=game.bin.radius,h=game.bin.height;
    const left=project({z:c.z-r,y:h}),right=project({z:c.z+r,y:0});
    // Open-topped section of the same hollow cylinder. The inside edges
    // coincide with physical walls; decorative thickness extends outward.
    ctx.fillStyle='rgba(131,164,111,.16)';ctx.fillRect(left.x,left.y,right.x-left.x,right.y-left.y);
    ctx.fillStyle='#779568';ctx.fillRect(left.x-4,left.y,4,right.y-left.y);ctx.fillRect(right.x,left.y,4,right.y-left.y);ctx.fillRect(left.x-4,right.y,right.x-left.x+8,4);
    stroke({z:c.z-r,y:h},{z:c.z-r,y:0},'#3f6647',1.5);stroke({z:c.z+r,y:h},{z:c.z+r,y:0},'#3f6647',1.5);
    const p=project(game.can.position),canRadius=Math.max(4,game.can.radius*scale),tilt=['flying','settling'].includes(game.phase)?game.time*2.7:-.18;
    const item=getThrowable(getThrowableId(game));
    if(item.id==='can'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(tilt);ctx.fillStyle='#bb7c49';ctx.fillRect(-canRadius*.65,-canRadius,canRadius*1.3,canRadius*2);ctx.strokeStyle='#835a36';ctx.lineWidth=1;ctx.strokeRect(-canRadius*.65,-canRadius,canRadius*1.3,canRadius*2);ctx.fillStyle='#ece7d9';ctx.beginPath();ctx.ellipse(0,-canRadius,canRadius*.65,canRadius*.22,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }else{
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(throwablePose(game).roll);ctx.fillStyle=item.color;ctx.strokeStyle=item.shape==='paper'?'#c9bc9e':'#5b7f72';ctx.lineWidth=1;
      ctx.beginPath();
      if(item.shape==='ball'||item.shape==='heavy')ctx.arc(0,0,canRadius*.96,0,Math.PI*2);
      else if(item.shape==='paper')for(let index=0;index<9;index++){const angle=index/9*Math.PI*2,r=canRadius*(.8+.14*Math.cos(index*2.3)),x=Math.cos(angle)*r,y=Math.sin(angle)*r;index?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      else{ctx.moveTo(-canRadius*.45,-canRadius*.7);ctx.lineTo(canRadius*.45,-canRadius*.54);ctx.lineTo(canRadius*.45,canRadius*.7);ctx.lineTo(-canRadius*.45,canRadius*.7);}
      ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    if(game.phase==='success'){const p=project({z:c.z,y:h+.6});ctx.textAlign='center';ctx.fillStyle='#946c23';ctx.font='600 13px system-ui,sans-serif';ctx.fillText('NICE SHOT!',p.x,p.y);}
  }
  function render(game,controls,view={}) {
    // Layout adapts the target only. The user's orbit survives every phase and resize.
    const distance=game.bin.center.z;
    setWorldView(view.world??null);sceneDistance=distance;angleCueSnapshot=null;coinAccentSnapshot=null;
    revealProgress=typeof view.revealProgress==='number'?clamp(view.revealProgress,0,1):null;
    revealDistance=revealProgress===null?1:.28+.72*revealProgress;
    environment=projection==='perspective'?(['factory','eccentric','release'].includes(worldView?.environment)?worldView.environment:view.environment==='outdoor'||worldView?.environment==='outdoor'?'outdoor':view.environment==='school'||worldView?.environment==='school'?'school':view.environment==='room'?'room':null):null;
    if(!environment){roomCache=null;roomCutaway=[];}
    resizeDepthLayer();
    const baseTarget=cameraViewOverride?.target??worldView?.view.target??{x:0,y:.45,z:distance*.47},quad=roomMonitorQuad(worldView),monitorCenter=quad.reduce((v,q)=>add(v,scale(q,.25)),{x:0,y:0,z:0});
    target=revealProgress===null?{...baseTarget}:add(scale(monitorCenter,1-revealProgress),scale(baseTarget,revealProgress));
    configureCamera();
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.clearRect(0,0,width,height);
    if(projection==='side'){drawSide(game,controls,view);return;}
    const room=environment==='room',school=environment==='school',outdoor=environment==='outdoor',advanced=['factory','eccentric','release'].includes(environment),backgroundDepth=room?drawRoom(game,view.aim||controls,view):school?drawSchool(game,view):outdoor?drawOutdoor(game,view):advanced?drawAdvanced(game,view):null;
    if(!room&&!school&&!outdoor&&!advanced)drawFloor();if(!school&&!outdoor&&!advanced)drawDistance(game,view.numericLabels!==false);
    if(room&&view.monitorCanvas){ctx.save();ctx.globalAlpha=roomCutaway.includes([2,3,4,5].includes(worldView?.worldVersion)?'source-desk':'desk') ? .23 : 1;paintScreenQuad(ctx,view.monitorCanvas,monitorQuad());ctx.restore();}
    if(!outdoor&&!advanced)shadow(game.bin.center,game.bin.radius*1.35,game.bin.radius*1.14,.11);
    const schoolGround=school?worldView.solids.filter(s=>['desk-top','roof'].includes(s.kind)&&s.max.y<=game.can.position.y&&game.can.position.x>=s.min.x-game.can.radius&&game.can.position.x<=s.max.x+game.can.radius&&game.can.position.z>=s.min.z-game.can.radius&&game.can.position.z<=s.max.z+game.can.radius):[],canGround=Math.max(0,...schoolGround.map(s=>s.max.y));
    if(!(worldView?.worldVersion===36&&view.baseballPitch?.active))shadow(game.can.position,.2+Math.max(0,game.can.position.y-canGround)*.035,.2,.13/(1+Math.max(0,game.can.position.y-canGround)*.8),canGround);
    if(view.prediction&&(!view.course||Array.isArray(view.windArc))&&(game.phase==='ready'||game.phase==='success'||game.phase==='miss'))drawArc(game,view.aim||controls,view.windArc);
    if(game.phase!=='ready')drawTrail(game);
    if(view.aim&&!view.customCue){const heading=view.aim.yaw*Math.PI/180,p=game.phase==='ready'?game.can.position:(worldView?.origin??{x:0,y:1.05,z:0});line(p,{x:p.x+Math.sin(heading)*.75,y:p.y,z:p.z+Math.cos(heading)*.75},'#bd8632',2);}
    const itemView={aim:view.aim??controls,worldVersion:worldView?.worldVersion};
    const shapes=[...(room&&view.extraRoom?roomMotionShapes(view.environmentTime||0,view.fanEnabled,view.reducedMotion,worldView):[]),...(school?schoolMotionShapes(view.environmentTime||0,worldView,view.reducedMotion):[]),...(advanced?(worldView.environment==='release'?((time,world)=>releaseChapterMotionShapes(world,time)):worldView.environment==='factory'?factoryMotionShapes:eccentricMotionShapes)(view.environmentTime??0,worldView,{...view,...(worldView.worldVersion>=48?{aim:view.aim??controls}:{}),...(worldView.worldVersion===39?{camera:{...camera}}:{}),session:view.factorySession,game,phase:game.phase,flightTime:game.time}):outdoor?outdoorMotionShapes(view.environmentTime??0,worldView,{...view,camera:{...camera},phase:game.phase,flightTime:game.time}):shapesForBin(game,room||school)),...((worldView?.worldVersion===36&&view.baseballPitch?.active||worldView?.worldVersion===47&&game.phase==='miss'&&view.factorySession?.plateLatched&&view.factorySession.setupShot===game.attempts)?[]:worldView?.worldVersion===46&&game.phase==='miss'&&view.effects?.some(e=>e.type==='factory-press')?shapesForCan(game,room||school||outdoor||advanced,itemView).map(mesh=>({...mesh,pressed:true,points:mesh.points.map(p=>({...p,x:game.can.position.x+(p.x-game.can.position.x)*1.16,y:game.can.position.y-game.can.radius+.025+(p.y-game.can.position.y)*.12,z:game.can.position.z+(p.z-game.can.position.z)*1.16}))})):shapesForCan(game,room||school||outdoor||advanced,itemView))];
    drawDepthShapes(shapes,backgroundDepth);
    drawCoinAccent(game,view);
    if(room&&view.extraRoom){
      // The wind vane marks a local area, not a predicted landing point.
      const origin={x:0,y:.035,z:3},end={x:.65,y:.035,z:3};line(origin,end,view.fanEnabled?'#80a6a0':'#b5b4a1',2);line(end,{x:.48,y:.035,z:2.87},'#80a6a0',2);line(end,{x:.48,y:.035,z:3.13},'#80a6a0',2);
      for(const z of [1.8,4.2])line({x:-1.5,y:.026,z},{x:1.5,y:.026,z},'rgba(104,153,145,.4)',1);
      if(view.fanEnabled){for(let i=0;i<3;i++){const drift=view.reducedMotion ? .3 : (view.environmentTime*.6+i*.29)%1,x=-1.45+drift*2.7,z=2.2+i*.72;line({x,y:1.45,z},{x:x+.19,y:1.45,z},'rgba(104,153,145,.3)',1.2);}}
    }
    if(view.angleCue&&!view.customCue&&['ready','success','miss'].includes(game.phase))drawAngleCue(game,view.aim||controls,view.numericLabels!==false);
    if(view.stageNumber)drawPixelText(ctx,view.stageNumber,16,16,{scale:3,color:'#286864',shadow:{color:'#f4ead5',dx:1,dy:1}});
    const c=view.capture?.position??game.bin.center,h=view.capture?.position?.y??game.bin.height;
    if(game.phase==='success'){
      const p=project({x:c.x,y:h+.4,z:c.z});if(!p.visible)return;ctx.fillStyle='#946c23';ctx.textAlign='center';ctx.font='600 13px system-ui,sans-serif';ctx.fillText('NICE SHOT!',p.x,p.y);
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2,p2={x:p.x+Math.cos(a)*33,y:p.y-5+Math.sin(a)*23};ctx.beginPath();ctx.arc(p2.x,p2.y,1.6,0,Math.PI*2);ctx.fill();}
    }
  }
  resize();
  return {resize,render,project,orbit,zoom,resetCamera,cameraSnapshot,setProjection,setWorldView,setCameraViewOverride,restoreCamera,monitorQuad};
}
