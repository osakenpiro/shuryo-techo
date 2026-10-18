// A carriage interior and a neighbouring commuter train share the physical
// metre-space world. Window frames are the actual collision panels; scenery
// scrolls in the player's train frame rather than making the launcher rock.
import {eccentricWorld,eccentricSolids,eccentricDynamicSolids,eccentricMotion,TRAIN_WINDOW_PROPS} from './eccentric-world.mjs?v=20261015-boar-distance-1';
import {scenePrimitives} from './factory-scene.mjs?v=20261015-boar-distance-1';
const {p,face,box,physicalBox,line,flat,opening}=scenePrimitives;
const MATERIAL=Object.freeze({body:'#d7dfd5',edge:'#748d86',trim:'#4d8f89',floor:'#adb4a1',wall:'#e9e2ca',seat:'#679c90',seatEdge:'#396f69',dark:'#3d605b',rail:'#72857d',ballast:'#aaa895',sleeper:'#827d68',warm:'#d8b974',ownWall:'#f1e3c7',ownFloor:'#c6b493',innerFrame:'#a18c68'});
const axes=['x','y','z'];
export const TRAIN_WINDOW_DRAW_HALF_SPAN=35;
const mod=(n,d)=>((n%d)+d)%d;
const colour=solid=>/bin.*rim|rim/.test(solid.kind)?MATERIAL.warm:/bin/.test(solid.kind)?MATERIAL.trim:/seat/.test(solid.kind)?MATERIAL.seat:solid.object==='own-carriage'?/floor/.test(solid.kind)?MATERIAL.ownFloor:MATERIAL.ownWall:/floor/.test(solid.kind)?MATERIAL.floor:/roof/.test(solid.kind)?MATERIAL.wall:MATERIAL.body;
function validate(world){
  const saved=eccentricWorld(world?.stageId,world?.worldVersion);
  if(!saved||saved.worldVersion!==39||saved.eccentricType!=='train')throw new RangeError('Window train world 39 is required');
  return saved;
}
function bounds(shapes){
  const points=shapes.flatMap(s=>s.points),result={};
  for(const k of axes){const K=k.toUpperCase();result['min'+K]=Math.min(...points.map(q=>q[k]));result['max'+K]=Math.max(...points.map(q=>q[k]));}
  return result;
}
function paintedFace(s,x,y,z,w,h,color,meta={}){s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],color,null,meta));}
function wheel(s,x,z,meta){
  // Wheels use a narrow side-facing disc, with a smaller axle boss. Their
  // radius is ordinary rolling stock size, never the size of the window.
  const ring=r=>Array.from({length:12},(_,i)=>p(x+Math.cos(i*Math.PI/6)*r,.46+Math.sin(i*Math.PI/6)*r,z));
  s.push(face(ring(.34),MATERIAL.dark,null,{...meta,trainPart:'wheel'}));
  s.push(face(ring(.12).map(q=>({...q,z:z-.006})),MATERIAL.rail,null,{...meta,trainPart:'wheel-hub'}));
}
function door(s,x,z,floor,side,meta){
  const height=2.16,w=1.26,y=floor+.08,front=z+side*.014;
  // A double-leaf sliding door, recessed glazing, centre seam and threshold.
  paintedFace(s,x-w/2,y,front,w,height,'#c0cec5',{...meta,trainPart:'door'});
  for(const dx of [-.49,.07]){
    paintedFace(s,x+dx,y+.86,front+side*.006,.42,.82,'#95b5ad',{...meta,trainPart:'door-glass'});
    paintedFace(s,x+dx+.025,y+.89,front+side*.009,.37,.76,'#c5d4c5',{...meta,trainPart:'door-reflection'});
  }
  line(s,p(x,y,front+side*.016),p(x,y+height,front+side*.016),MATERIAL.edge,{...meta,trainPart:'door-seam'});
  for(const dx of [-.15,.12])paintedFace(s,x+dx,y+.81,front+side*.020,.029,.19,MATERIAL.edge,{...meta,trainPart:'door-handle'});
  line(s,p(x-w/2,y+.008,front+side*.015),p(x+w/2,y+.008,front+side*.015),'#858d7b',{...meta,trainPart:'door-threshold'});
}
function strap(s,x,z,roof,meta){
  const top=roof-.10,bottom=roof-.83,r=.082,cy=bottom+r;
  line(s,p(x,top,z),p(x,cy+r,z),'#998f75',{...meta,trainPart:'strap-cord'});
  for(let i=0;i<8;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;line(s,p(x+Math.cos(a)*r,cy+Math.sin(a)*r,z),p(x+Math.cos(b)*r,cy+Math.sin(b)*r,z),'#f6eed8',{...meta,trainPart:'hand-strap'});}
}
function seat(s,x,z,width,floor,side,meta){
  const back=z+side*.32,m={...meta,trainPart:'seat-upholstery'};
  box(s,x,floor+.29,z-.30,width,.16,.60,MATERIAL.seat,m);
  box(s,x,floor+.44,back-.04,width,.60,.08,MATERIAL.seat,m);
  line(s,p(x,floor+.456,z-side*.294),p(x+width,floor+.456,z-side*.294),MATERIAL.seatEdge,{...meta,trainPart:'seat-piping'});
  for(let dx=.43;dx<width-.15;dx+=.48)line(s,p(x+dx,floor+.48,back-side*.045),p(x+dx,floor+.97,back-side*.045),MATERIAL.seatEdge,{...meta,trainPart:'seat-stitch'});
  for(const dx of [.08,width-.09])line(s,p(x+dx,floor+.30,z-side*.26),p(x+dx,floor+.78,z-side*.26),MATERIAL.edge,{...meta,trainPart:'seat-grab-rail'});
}
function carDetails(s,car,geometry,{own=false}={}){
  const q=car.position,half=geometry.carLength/2,zHalf=geometry.carWidth/2,floor=geometry.floorY,roof=geometry.bodyTop;
  const m={actorId:car.id,trainFrame:own?'own':'adjacent',trainPart:'carriage-detail'};
  const x=q.x-half,z0=q.z-zHalf,z1=q.z+zHalf;
  for(const side of [-1,1])for(const opening of geometry.window.centers){
    const cx=q.x+opening,lo=geometry.window.bottomY,hi=geometry.window.topY,w=geometry.window.halfWidth,t=.038;
    const z=q.z+side*(zHalf+.008),tag={...m,trainPart:'open-window-frame',openWindow:true,windowCenterX:cx,windowSide:side,windowBounds:{minX:cx-w,maxX:cx+w,minY:lo,maxY:hi,z}};
    // Four trim strips grow away from the opening. The visual hole exactly
    // equals the canonical collision hole, including its inner four corners.
    paintedFace(s,cx-w-t,lo-t,z,2*(w+t),t,MATERIAL.edge,tag);
    paintedFace(s,cx-w-t,hi,z,2*(w+t),t,MATERIAL.edge,tag);
    paintedFace(s,cx-w-t,lo,z,t,hi-lo,MATERIAL.edge,tag);
    paintedFace(s,cx+w,lo,z,t,hi-lo,MATERIAL.edge,tag);
    if(own){
      const inside=q.z+side*(zHalf-geometry.wallThickness-.004),insideTag={...tag,windowBounds:{...tag.windowBounds,z:inside},innerSkin:true,planeOnly:true};
      paintedFace(s,cx-w-t,lo-t,inside,2*(w+t),t,MATERIAL.innerFrame,insideTag);
      paintedFace(s,cx-w-t,hi,inside,2*(w+t),t,MATERIAL.innerFrame,insideTag);
      paintedFace(s,cx-w-t,lo,inside,t,hi-lo,MATERIAL.innerFrame,insideTag);
      paintedFace(s,cx+w,lo,inside,t,hi-lo,MATERIAL.innerFrame,insideTag);
      // The small sliding-window latch is paint on the wall-side frame. It
      // grows away from the opening and does not occupy the throw corridor.
      const hx=cx+w+.05;
      paintedFace(s,hx,lo+.33,inside,.038,.19,'#716a54',{...m,trainPart:'window-latch',ownWallSide:side,planeOnly:true});
      line(s,p(hx+.019,lo+.355,inside-side*.003),p(hx+.019,lo+.49,inside-side*.003),'#e2c89b',{...m,trainPart:'window-latch',ownWallSide:side,planeOnly:true});
    }
  }
  // Two restrained railway stripes and a panel seam establish a recognisable
  // domestic commuter train without drawing a giant toy-shaped goal.
  if(!own)for(const side of [-1,1]){
    const z=q.z+side*(zHalf+.012);
    paintedFace(s,x+.10,floor+.22,z,geometry.carLength-.20,.21,MATERIAL.trim,{...m,trainPart:'exterior-stripe'});
    paintedFace(s,x+.10,floor+.12,z,geometry.carLength-.20,.065,'#ba9e68',{...m,trainPart:'exterior-stripe'});
    line(s,p(x+.10,roof-.37,z),p(x+geometry.carLength-.10,roof-.37,z),MATERIAL.edge,{...m,trainPart:'roof-seam'});
    for(const doorX of geometry.doorCenters)door(s,q.x+doorX,z,floor,side,m);
    for(const wheelX of [-half+3.0,-half+4.8,half-4.8,half-3.0])wheel(s,q.x+wheelX,q.z+side*(zHalf-.08),m);
  }
  if(own)for(const side of [-1,1])for(const doorX of geometry.doorCenters)door(s,q.x+doorX,q.z+side*(zHalf-geometry.wallThickness-.014),floor,-side,{...m,ownWallSide:side});
  // Interior furnishings deliberately leave the centre throwing window and
  // receiving bin corridor clear. They cannot silently cover an open hole.
  for(const side of [-1,1]){
    const seatZ=q.z+side*(zHalf-.38);
    for(const sx of [-5.0,2.5])seat(s,q.x+sx,seatZ,2.3,floor,side,m);
    const barZ=q.z+side*.54;
    line(s,p(q.x-5.7,roof-.09,barZ),p(q.x+5.7,roof-.09,barZ),MATERIAL.edge,{...m,trainPart:'overhead-grab-rail'});
    for(const sx of [-4.9,-3.9,3.0,4.0])strap(s,q.x+sx,barZ,roof,m);
  }
  // A small line map, rivets and carriage number are flat paint, not blockers.
  if(!own){
    const z=z0-.016;
    paintedFace(s,q.x-1.1,roof-.63,z,2.2,.19,'#647e74',{...m,trainPart:'route-display'});
    for(let i=0;i<6;i++)paintedFace(s,q.x-.87+i*.30,roof-.565,z-.003,.18,.037,'#e3d4aa',{...m,trainPart:'route-display-glyph'});
    for(const sx of [-half+.4,half-.6])paintedFace(s,q.x+sx,floor+.02,z,.20,.10,'#708879',{...m,trainPart:'car-number'});
  }else{
    // Own carriage has a route strip and ceiling lights visible at the edges
    // of an interior camera while the real window remains a hole.
    const z=z1-.06;
    paintedFace(s,q.x-1.30,roof-.36,z,2.6,.13,'#d1d5b9',{...m,trainPart:'interior-line-map',ownWallSide:1});
    line(s,p(q.x-1.11,roof-.29,z-.012),p(q.x+1.10,roof-.29,z-.012),MATERIAL.trim,{...m,trainPart:'interior-line-map',ownWallSide:1});
    for(let i=0;i<7;i++){const cx=q.x-1.0+i*.33;s.push(face(Array.from({length:6},(_,j)=>p(cx+Math.cos(j*Math.PI/3)*.021,roof-.29+Math.sin(j*Math.PI/3)*.021,z-.021)),MATERIAL.warm,null,{...m,trainPart:'route-station-dot',ownWallSide:1}));}
    // This route map sits immediately above the window rather than at the
    // ceiling: the player's interior camera can read it during normal play.
    const mapY=geometry.window.topY+.16,mapZ=z1-geometry.wallThickness-.008,tag={...m,trainPart:'window-route-map',ownWallSide:1,planeOnly:true};
    paintedFace(s,q.x-1.10,mapY,mapZ,2.20,.28,'#fcf2d9',tag);
    paintedFace(s,q.x-1.10,mapY+.215,mapZ-.002,2.20,.065,'#448b80',tag);
    line(s,p(q.x-.93,mapY+.105,mapZ-.004),p(q.x+.77,mapY+.105,mapZ-.004),'#478e80',tag);
    for(let i=0;i<6;i++){
      const cx=q.x-.89+i*.33;
      s.push(face(Array.from({length:8},(_,j)=>p(cx+Math.cos(j*Math.PI/4)*.026,mapY+.105+Math.sin(j*Math.PI/4)*.026,mapZ-.006)),i===2?'#d4a14e':'#478e80',null,tag));
      line(s,p(cx-.05,mapY+.046,mapZ-.006),p(cx+.07,mapY+.046,mapZ-.006),'#9b947b',tag);
    }
    // Wall joints, a warm dado and a few screw heads are flat finishes on
    // existing panels. The window is still the exact physical opening.
    for(const side of [-1,1]){
      const inside=q.z+side*(zHalf-geometry.wallThickness-.005),paint={...m,trainPart:'interior-panel-finish',ownWallSide:side,planeOnly:true};
      line(s,p(q.x-5.5,floor+.22,inside),p(q.x+5.5,floor+.22,inside),'#b89f77',paint);
      for(const sx of [-1.75,1.75]){
        line(s,p(q.x+sx,floor+.24,inside),p(q.x+sx,roof-.15,inside),'#d7c6a4',paint);
        for(const y of [floor+.30,geometry.window.topY+.10])paintedFace(s,q.x+sx-.012,y,inside,.024,.024,'#aa9471',{...paint,trainPart:'panel-screw'});
      }
    }
    for(let xx=-6;xx<6;xx+=.7)line(s,p(q.x+xx,floor+.003,z0+.15),p(q.x+xx,floor+.003,z1-.15),'#bba788',{...m,trainPart:'carriage-floor-seam',planeOnly:true});
  }
  for(const sx of [-3.8,2.5])flat(s,q.x+sx,roof-.012,q.z-.20,1.3,.40,'#f8edd1',{...m,trainPart:'ceiling-light',ownCeiling:own});
}
function railbed(s,geometry,offset){
  const span=120,gauge=geometry.trackGauge,spacing=geometry.tieSpacing;
  for(const trackZ of [geometry.nearTrackZ,geometry.farTrackZ]){
    const meta={trainPart:'continuous-track',trackCenter:trackZ,trackGauge:gauge,infiniteTrack:true};
    flat(s,-span,.035,trackZ-1.58,span*2,3.16,MATERIAL.ballast,meta);
    for(const side of [-1,1]){
      const z=trackZ+side*gauge/2;
      // Both rails extend far past the visible region. Ties recycle after
      // leaving the region, at one sleeper spacing, with no finite end cap.
      box(s,-span,.125,z-.035,span*2,.105,.07,MATERIAL.rail,{...meta,trainPart:'rail'});
      line(s,p(-span,.232,z),p(span,.232,z),'#b4bdae',{...meta,trainPart:'rail-head'});
    }
    const phase=mod(offset,spacing);
    for(let i=-28;i<=28;i++){
      const x=i*spacing-phase;
      const tag={...meta,trainPart:'sleeper',sleeperPhase:phase};
      flat(s,x-.12,.155,trackZ-1.06,.24,2.12,MATERIAL.sleeper,tag);
      paintedFace(s,x-.12,.055,trackZ-1.06,.24,.10,'#6f6b58',tag);
    }
  }
}
function landscape(s,geometry,offset,{reducedMotion=false}={}){
  const spacing=geometry.poleSpacing,phase=mod(reducedMotion?0:offset,spacing),m={trainPart:'passing-landscape',outsidePlayArea:true};
  // Catenary posts and quiet low buildings run well behind both carriages.
  // Their spacing is repeated, so the player never reaches a track endpoint.
  for(let i=-2;i<=2;i++){
    const x=i*spacing-phase,z=geometry.farTrackZ+5.5;
    box(s,x-.06,.10,z,.12,5.4,.12,'#8ea392',{...m,trainPart:'catenary-post'});
    line(s,p(x,5.25,z),p(x,5.25,geometry.nearTrackZ-2.4),'#7f9587',{...m,trainPart:'catenary-crossbeam'});
    if(i>-2)line(s,p(x,5.36,z),p(x-spacing,5.36,z),'#96aa94',{...m,trainPart:'catenary-wire'});
    const bx=x+8,bz=z+7,h=2.9+(i%2+2)%2*.8;
    box(s,bx,.08,bz,7.0,h,3.6,'#c3cbb3',{...m,trainPart:'distant-building'});
    for(let xx=bx+.55;xx<bx+6.5;xx+=1.35)paintedFace(s,xx,1.1,bz-.013,.62,.78,'#8da99d',{...m,trainPart:'distant-window'});
    box(s,bx-.15,h+.08,bz-.15,7.3,.14,3.9,'#a5b39c',{...m,trainPart:'distant-roof'});
  }
}
export function trainWindowStaticMeshes(world){
  world=validate(world);const shapes=[];
  flat(shapes,-180,.010,-15,360,60,'#bdc9a8',{trainPart:'railway-verge',outsidePlayArea:true,infiniteTrack:true});
  for(const solid of eccentricSolids(world))physicalBox(shapes,solid,colour(solid));
  return shapes;
}
export function trainWindowCutaway(world,camera){
  world=validate(world);
  if(!camera||!axes.every(k=>Number.isFinite(camera[k])))return [];
  const train=eccentricMotion(world,0).trainWindow,car=train.ownTrain,props=train.props;
  const side=camera.z<car.position.z-props.carWidth/2?'near':camera.z>car.position.z+props.carWidth/2?'far':null;
  const above=camera.y>props.bodyTop,left=camera.x<car.position.x-props.carLength/2,right=camera.x>car.position.x+props.carLength/2;
  // Only an exterior camera removes camera-facing own-carriage surfaces.
  // The collision world and the neighbouring train remain complete.
  return eccentricDynamicSolids(world,0).filter(solid=>solid.object===car.id&&(
    side&&solid.id.startsWith(`${car.id}-${side}-`)||
    above&&solid.id===`${car.id}-roof`||
    left&&solid.id===`${car.id}-end-left`||
    right&&solid.id===`${car.id}-end-right`
  )).map(solid=>solid.id);
}
export function trainWindowDynamicMeshes(world,time=0,options={}){
  world=validate(world);if(!Number.isFinite(time))throw new TypeError('Train time must be finite');
  const motion=eccentricMotion(world,time),train=motion.trainWindow,shapes=[],cutaway=new Set(trainWindowCutaway(world,options.camera));
  const inRange=solid=>solid.max.x>=-TRAIN_WINDOW_DRAW_HALF_SPAN&&solid.min.x<=TRAIN_WINDOW_DRAW_HALF_SPAN;
  for(const solid of eccentricDynamicSolids(world,time).filter(solid=>inRange(solid)&&!cutaway.has(solid.id))){
    const start=shapes.length;physicalBox(shapes,solid,colour(solid));
    if(solid.object==='own-carriage'&&solid.kind==='train-body'&&Math.abs(solid.max.y-train.props.window.bottomY)<1e-8){
      // Recolour the actual wall's upper face as its metal/wood sill. No
      // cosmetic ledge is added over the physical window opening.
      for(const shape of shapes.slice(start))if(shape.points.every(q=>q.y===solid.max.y))shape.fill='#c2a574';
    }
  }
  carDetails(shapes,train.ownTrain,train.props,{own:true});
  for(const car of train.adjacentTrains)if(Math.abs(car.position.x)<=TRAIN_WINDOW_DRAW_HALF_SPAN+train.props.carLength/2)carDetails(shapes,car,train.props);
  railbed(shapes,train.props,train.trackOffset);
  landscape(shapes,train.props,train.sceneryOffset,options);
  for(const goal of motion.goals)if(Math.abs(goal.center.x)<=TRAIN_WINDOW_DRAW_HALF_SPAN+goal.radius)opening(shapes,goal,{colour:MATERIAL.warm,depth:.10,pocket:true});
  const hiddenSide=cutaway.has(`${train.ownTrain.id}-near-lower`)?-1:cutaway.has(`${train.ownTrain.id}-far-lower`)?1:null;
  const hiddenRoof=cutaway.has(`${train.ownTrain.id}-roof`);
  return shapes.filter(shape=>shape.actorId!==train.ownTrain.id||!(
    hiddenSide!==null&&(shape.ownWallSide===hiddenSide||shape.openWindow&&shape.windowSide===hiddenSide)||
    hiddenRoof&&shape.ownCeiling
  ));
}
export function trainWindowScene(camera,world){
  world=validate(world);const shapes=trainWindowStaticMeshes(world);
  return {shapes,cutaway:trainWindowCutaway(world,camera),groups:[{id:'train39-infinite-railway-verge',physical:false,outsidePlayArea:true,bounds:bounds(shapes)}],stageId:world.stageId,worldVersion:world.worldVersion};
}
export function trainWindowSceneMetadata(world,time=0){
  world=validate(world);const {trainWindow,goals,launchFrame}=eccentricMotion(world,time);
  return {worldVersion:world.worldVersion,ownTrain:trainWindow.ownTrain,adjacentTrain:trainWindow.adjacentTrain,adjacentTrains:trainWindow.adjacentTrains,windowOpenings:trainWindow.windowOpenings,trackGauge:TRAIN_WINDOW_PROPS.trackGauge,trackOffset:trainWindow.trackOffset,sceneryOffset:trainWindow.sceneryOffset,groundVelocity:TRAIN_WINDOW_PROPS.ownSpeed,railDrawSpan:240,drawHalfSpan:TRAIN_WINDOW_DRAW_HALF_SPAN,origin:launchFrame.origin,goals};
}
