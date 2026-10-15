// World 38 uses metre-space architecture: the observation decks are at
// 150 / 250 m, and the red-and-white mast ends at 333 m. The released world
// 19 drawing is intentionally kept in eccentric-scene's frozen branch.
// These meshes describe the landmark and its neighbourhood; canonical world
// solids still own the platform, guard rails, receiver and flight contacts.
import {scenePrimitives} from './factory-scene.mjs?v=20261015-eccentric-review-1';
const {p,face,shade,add,scale,cross,unit,box,cylinder,ellipsoid,line,flat}=scenePrimitives;
export const TOKYO_TOWER_PALETTE=Object.freeze({
  orange:'#dd512f',orangeLight:'#ef7046',orangeDark:'#a53c29',white:'#f1eee4',
  window:'#6eafb6',windowDark:'#377680',glassFrame:'#f0e6ce',steel:'#536a70',
  concrete:'#d3d5c8',paving:'#c8c8b8',road:'#738486',park:'#a6bc86',
});
const cache=new Map(),axes=['x','y','z'];
const defaultProfile=Object.freeze([[0,39],[80,18],[150,11.5],[225,5],[250,4],[285,2.2]]);
function model(world){
  if(world?.stageId!=='eccentric-tower'||world.worldVersion!==38)return null;
  const landmark=world.landmark??{},center=landmark.center??p(0,0,-10);
  return {center,height:landmark.height??333,profile:landmark.profile??defaultProfile,
    main:landmark.mainDeck??{height:150,width:28,depth:28},top:landmark.topDeck??{height:250,width:12,depth:12}};
}
function halfAt(profile,y){
  for(let i=1;i<profile.length;i++)if(y<=profile[i][0]){
    const [a,wa]=profile[i-1],[b,wb]=profile[i];return wa+(wb-wa)*(y-a)/(b-a);
  }
  return profile.at(-1)[1];
}
function bandAt(y){
  if(y<150)return TOKYO_TOWER_PALETTE.orange;
  return [TOKYO_TOWER_PALETTE.white,TOKYO_TOWER_PALETTE.orange][Math.floor((y-150)/25)%2];
}
// Four faced girders have a real thickness from every orbit. Fine bracing is
// deliberately less expensive than the eight-sided actor-limb primitive.
function girder(s,a,b,r,color,meta={}){
  const axis=unit(add(b,scale(a,-1))),right=unit(cross(axis,Math.abs(axis.y)>.8?p(0,0,1):p(0,1,0))),up=cross(axis,right);
  const ring=q=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>add(q,add(scale(right,x*r),scale(up,y*r)))),lo=ring(a),hi=ring(b);
  for(let i=0;i<4;i++)s.push(face([lo[i],lo[(i+1)%4],hi[(i+1)%4],hi[i]],shade(color,[2,-12,-4,10][i]),null,meta));
  s.push(face(hi,shade(color,14),null,meta));
}
function towerFrame(s,m){
  const at=(x,y,z)=>add(m.center,p(x,y,z)),meta={decoration:true,landmark:'tokyo-tower',landmarkHeight:m.height};
  // The four curved, splayed corner legs enclose a volume, not one flat X.
  const levels=[0,16,34,55,80,105,125,145,150,175,200,225,250,270,285];
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const leg={...meta,towerPart:'corner-leg',legId:`${sx}:${sz}`};
    const foot=halfAt(m.profile,0);
    box(s,m.center.x+sx*foot-4.7,m.center.y-.04,m.center.z+sz*foot-4.7,9.4,.55,9.4,TOKYO_TOWER_PALETTE.concrete,{...leg,towerPart:'foot-foundation'});
    for(let i=1;i<levels.length;i++){
      const a=levels[i-1],b=levels[i],wa=halfAt(m.profile,a),wb=halfAt(m.profile,b),r=a<80?.72:a<150?.42:.21;
      girder(s,at(sx*wa,a,sz*wa),at(sx*wb,b,sz*wb),r,bandAt((a+b)/2),leg);
      if(b<=80){
        // Each lower leg is a small braced box section, open between legs.
        const ia=Math.max(1.6,5.0-a*.043),ib=Math.max(1.6,5.0-b*.043),truss={...leg,towerPart:'leg-brace'};
        const outerA=at(sx*wa,a,sz*wa),outerB=at(sx*wb,b,sz*wb),innerA=at(sx*(wa-ia),a,sz*(wa-ia)),innerB=at(sx*(wb-ib),b,sz*(wb-ib));
        girder(s,innerA,innerB,.26,TOKYO_TOWER_PALETTE.orange,truss);
        girder(s,outerA,innerB,.17,TOKYO_TOWER_PALETTE.orangeLight,truss);
        girder(s,innerA,outerB,.17,TOKYO_TOWER_PALETTE.orange,truss);
      }
    }
  }
  // A low graceful arch on every side establishes Tokyo Tower's recognisable
  // open base. Side-plane bracing starts above the arches, not across a door.
  for(let side=0;side<4;side++){
    const coord=(u,y)=>{const w=halfAt(m.profile,y);return side===0?at(u,y,-w):side===1?at(w,y,u):side===2?at(u,y,w):at(-w,y,u);};
    const arch=[];
    for(let i=0;i<=8;i++){const u=-35.2+i*8.8,y=8+47*(1-(u/35.2)**2);arch.push(coord(u,y));}
    for(let i=1;i<arch.length;i++)girder(s,arch[i-1],arch[i],.48,TOKYO_TOWER_PALETTE.orange,{...meta,towerPart:'base-arch',towerSide:side});
    for(const [low,high] of [[55,80],[80,105],[105,125],[125,145],[150,175],[175,200],[200,225],[225,250],[250,270],[270,285]]){
      const a=halfAt(m.profile,low),b=halfAt(m.profile,high),color=bandAt((low+high)/2),tag={...meta,towerPart:'lattice-brace',towerSide:side,level:low};
      girder(s,coord(-a,low),coord(b,high),low<150?.22:.115,color,tag);
      girder(s,coord(a,low),coord(-b,high),low<150?.22:.115,color,tag);
      girder(s,coord(-a,low),coord(a,low),low<150?.29:.14,bandAt(low+.01),{...tag,towerPart:'horizontal-girder'});
      // Narrow secondary diagonal rods add an engineering rhythm without
      // filling the triangular openings with opaque orange polygons.
      const mid=(low+high)/2,w=halfAt(m.profile,mid);
      line(s,coord(-a,low),coord(0,mid),shade(color,-20),{...tag,towerPart:'fine-brace'});
      line(s,coord(0,mid),coord(b,high),shade(color,11),{...tag,towerPart:'fine-brace'});
      line(s,coord(-w,mid),coord(w,mid),shade(color,-12),{...tag,towerPart:'fine-brace'});
    }
  }
  // A slim lift core is visible through the open ironwork. It never becomes
  // a opaque block spanning the launch ledge or the outward throw corridor.
  box(s,m.center.x-1.15,m.center.y+16,m.center.z-1.15,2.3,268,2.3,'#9daeb0',{...meta,towerPart:'lift-core'});
  for(let y=30;y<280;y+=20)line(s,at(-1.18,y,-1.18),at(1.18,y,-1.18),'#d1d5c8',{...meta,towerPart:'lift-core-rib'});
  // The antenna has alternate orange / white bands, radial collars and an
  // actual tip at exactly 333 metres rather than a floating sky ornament.
  for(const [bottom,top,r] of [[285,295,1.22],[295,307,.91],[307,317,.68],[317,326,.43],[326,m.height,.19]]){
    cylinder(s,m.center.x,m.center.y+bottom,m.center.z,r,top-bottom,bandAt((bottom+top)/2),8,{...meta,towerPart:'antenna-mast',mastHeight:top});
    cylinder(s,m.center.x,m.center.y+bottom,m.center.z,r*1.24,.34,'#e8e6dd',8,{...meta,towerPart:'antenna-collar'});
  }
}
function observationDeck(s,m,deck,id){
  const isMain=id==='main-deck',width=deck.width??deck.span??(isMain?28:12),depth=deck.depth??width,y=deck.height??deck.y??(isMain?150:250),h=isMain?7.2:5.1;
  const tag={decoration:true,landmark:'tokyo-tower',towerPart:id,deckHeight:y},cut=2.1;
  const outline=isMain?[[-width/2+cut,-depth/2],[width/2-cut,-depth/2],[width/2,-depth/2+cut],[width/2,depth/2-cut],[width/2-cut,depth/2],[-width/2+cut,depth/2],[-width/2,depth/2-cut],[-width/2,-depth/2+cut]]:
    Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8)*width/2,Math.sin(i*Math.PI/8)*depth/2]);
  const ring=(yy,expand=0)=>outline.map(([xx,zz])=>p(m.center.x+xx*(1+expand/(width/2)),m.center.y+yy,m.center.z+zz*(1+expand/(depth/2))));
  const band=(bottom,top,color,part,expand=0)=>{
    const lo=ring(bottom,expand),hi=ring(top,expand);
    for(let i=0;i<lo.length;i++)s.push(face([lo[i],lo[(i+1)%lo.length],hi[(i+1)%lo.length],hi[i]],shade(color,Math.round(Math.sin(i/lo.length*Math.PI*2)*9)),null,{...tag,deckPart:part,deckOutline:isMain?'chamfered-square':'rounded'}));
    s.push(face(hi,shade(color,10),null,{...tag,deckPart:part,deckOutline:isMain?'chamfered-square':'rounded'}));
  };
  // The Main Deck is the familiar wide silver-rimmed two-storey glass box;
  // the Top Deck is a much slimmer rounded pod, not another square shelf.
  band(y-h*.58,y-h*.58+.95,TOKYO_TOWER_PALETTE.white,'lower-fascia',.55);
  band(y-h*.58+.95,y+h*.42-.70,TOKYO_TOWER_PALETTE.windowDark,'window-core');
  band(y+h*.42-.70,y+h*.42,isMain?TOKYO_TOWER_PALETTE.white:TOKYO_TOWER_PALETTE.orange,'upper-fascia',.45);
  band(y+h*.42,y+h*.42+.24,TOKYO_TOWER_PALETTE.white,'roof',-.20);
  const windowBottom=m.center.y+y-h*.58+1.13,windowTop=m.center.y+y+h*.42-.87,paneW=isMain?1.62:1.22;
  const lower=ring(0);
  for(let side=0;side<lower.length;side++){
    const a=lower[side],b=lower[(side+1)%lower.length],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),panes=Math.max(1,Math.floor(length/paneW));
    const outward=p((a.x+b.x)/2-m.center.x,0,(a.z+b.z)/2-m.center.z),normal=unit(outward);
    const at=(u,yy,off=.025)=>p(a.x+dx*u+normal.x*off,yy,a.z+dz*u+normal.z*off);
    for(let i=0;i<panes;i++){
      const u=(i+.05)/panes,v=(i+.95)/panes,color=i%4===0?'#aed0c5':TOKYO_TOWER_PALETTE.window;
      s.push(face([at(u,windowBottom),at(v,windowBottom),at(v,windowTop),at(u,windowTop)],shade(color,side%2?-9:3),null,{...tag,deckPart:'panoramic-pane',towerSide:side}));
      line(s,at(u,windowBottom,.045),at(u,windowTop,.045),TOKYO_TOWER_PALETTE.glassFrame,{...tag,deckPart:'window-mullion',towerSide:side});
      if(isMain)line(s,at(u,(windowBottom+windowTop)/2,.047),at(v,(windowBottom+windowTop)/2,.047),TOKYO_TOWER_PALETTE.white,{...tag,deckPart:'between-window-floors',towerSide:side});
      if(i%3===1)line(s,at(u+.1/panes,windowTop-.12,.047),at(Math.min(v-.04/panes,u+.75/panes),windowBottom+.3,.047),'#d3e0cc',{...tag,deckPart:'glass-highlight',towerSide:side});
    }
    line(s,at(0,windowBottom,.046),at(1,windowBottom,.046),TOKYO_TOWER_PALETTE.glassFrame,{...tag,deckPart:'window-sill',towerSide:side});
  }
  // Tiny ordinary visitors are readable against the glass at closer zooms;
  // their 1.7 m scale, not a giant face pasted on the deck, explains its size.
  for(const dx of [-width*.21,width*.19]){
    const xx=m.center.x+dx,zz=m.center.z-(isMain?depth/2:Math.sqrt((depth/2)**2-dx**2))-.051,bottom=windowBottom+.07;
    box(s,xx-.18,bottom+.60,zz,.36,.57,.013,'#cfb37d',{...tag,deckPart:'visitor-body',visitorHeight:1.7});
    ellipsoid(s,xx,bottom+1.37,zz-.01,.14,.18,.017,'#e7c7a2',6,2,{...tag,deckPart:'visitor-head',visitorHeight:1.7});
    for(const side of [-1,1])line(s,p(xx+side*.07,bottom+.62,zz-.004),p(xx+side*.08,bottom+.1,zz-.008),'#6b7e76',{...tag,deckPart:'visitor-leg',visitorHeight:1.7});
  }
}
function footTown(s,m){
  const tag={decoration:true,towerPart:'foot-town',landmark:'tokyo-tower'},x=m.center.x-26,z=m.center.z-26;
  box(s,x,m.center.y,z,52,15.2,52,'#d6d7c9',tag);
  for(const y of [3.8,7.6,11.4,15.2]){
    box(s,x-.45,m.center.y+y,z-.45,52.9,.38,52.9,'#b9c4bc',{...tag,footTownPart:'floor-cornice'});
    for(let i=0;i<10;i++){
      const xx=x+1.4+i*5,yy=m.center.y+y-2.85,zz=z-.032;
      s.push(face([p(xx,yy,zz),p(xx+3.3,yy,zz),p(xx+3.3,yy+1.75,zz),p(xx,yy+1.75,zz)],i%3?'#8db3b2':'#abcbc0',null,{...tag,footTownPart:'window'}));
    }
  }
  for(let i=0;i<5;i++)box(s,x+5+i*8,m.center.y+.12,z-.085,5.8,2.8,.045,'#789e9a',{...tag,footTownPart:'entrance'});
  // A few rooftop air handlers, parapets and the taller lift lobby establish
  // a service building underneath the immense open lattice.
  box(s,m.center.x-6,m.center.y+15.62,m.center.z-6,12,3.2,12,'#c4ccc3',{...tag,footTownPart:'lift-lobby'});
  for(const dx of [-17,14])box(s,m.center.x+dx,m.center.y+15.62,m.center.z+12,3.4,1.7,4.2,'#9eada9',{...tag,footTownPart:'air-handler'});
}
function cityBuilding(s,x,z,w,d,h,index){
  const tag={decoration:true,towerPart:'neighbourhood-building',cityBuildingId:`tower-city-${index}`,buildingHeight:h},colors=['#d9ded0','#cad5cd','#dddbc8','#b5c8c6','#e3e0d0'],color=colors[index%colors.length];
  box(s,x,0,z,w,h,d,color,tag);
  box(s,x+.50,h,z+.50,w-1,.42,d-1,shade(color,7),{...tag,cityPart:'roof'});
  box(s,x+w*.34,h+.42,z+d*.32,w*.26,1.3,d*.28,'#9baea9',{...tag,cityPart:'roof-plant'});
  const floors=Math.min(6,Math.floor((h-2)/3.6)),columns=Math.min(3,Math.floor(w/3.4)),windows={...tag,cityPart:'window'};
  for(let row=0;row<floors;row++)for(let col=0;col<columns;col++){
    const xx=x+(col+.5)*w/columns,yy=2+row*(h-3)/floors,ww=Math.min(1.6,w/columns*.56),zz=z-.025;
    s.push(face([p(xx-ww/2,yy,zz),p(xx+ww/2,yy,zz),p(xx+ww/2,yy+1.7,zz),p(xx-ww/2,yy+1.7,zz)],row%3===0?'#98b9b5':'#739d9d',null,windows));
    const sideZ=z+(col+.5)*d/columns,sideX=x+w+.025;
    s.push(face([p(sideX,yy,sideZ-ww/2),p(sideX,yy,sideZ+ww/2),p(sideX,yy+1.7,sideZ+ww/2),p(sideX,yy+1.7,sideZ-ww/2)],'#84aaa6',null,windows));
  }
}
function smallTree(s,x,z,index){
  const tag={decoration:true,towerPart:'street-tree',streetTreeId:index};
  cylinder(s,x,.02,z,.21,3.2,'#8c8a69',6,tag);
  ellipsoid(s,x,4.3,z,2.05,2.05,1.95,index%2?'#89a875':'#9db77f',6,2,tag);
}
function car(s,x,z,index,alongZ=false){
  const tag={decoration:true,towerPart:'street-car',carLength:4.3,carId:index},color=['#e2dbc6','#6d9fa5','#d68b66','#dce1d8'][index%4],w=alongZ?1.78:4.3,d=alongZ?4.3:1.78;
  box(s,x-w/2,.30,z-d/2,w,.70,d,color,tag);
  box(s,x-w*.32,1,z-d*.32,w*.64,.62,d*.64,'#80a4aa',{...tag,cityPart:'car-glass'});
  flat(s,x-w*.23,1.63,z-d*.22,w*.46,d*.44,color,{...tag,cityPart:'car-roof'});
  for(const dx of [-w*.30,w*.30])for(const dz of [-d*.43,d*.43]){
    const xx=x+dx,zz=z+dz;
    s.push(face([p(xx-.13,.11,zz),p(xx+.13,.11,zz),p(xx+.13,.38,zz),p(xx-.13,.38,zz)],'#506368',null,{...tag,cityPart:'car-wheel'}));
  }
}
function neighbourhood(s,m){
  const tag={decoration:true,towerPart:'city-ground',citySpan:400};
  flat(s,-200,.004,-200,400,400,'#bac7ae',tag);
  // A small plaza outside the tower's foot puts the real street bin amid
  // pavement, traffic and trees. Buildings stay outside the landing corridor.
  flat(s,-49,.009,-59,98,99,'#d7d1bd',{...tag,cityPart:'tower-plaza'});
  for(const x of [-52,42])flat(s,x,.018,-200,10,400,TOKYO_TOWER_PALETTE.road,{...tag,cityPart:'road'});
  for(const z of [40,-64,119,-137])flat(s,-200,.023,z,400,10,TOKYO_TOWER_PALETTE.road,{...tag,cityPart:'road'});
  for(let z=-193;z<195;z+=13)for(const x of [-47,47])flat(s,x-.16,.024,z,.32,4.8,'#eee5c9',{...tag,cityPart:'lane-mark'});
  for(let x=-190;x<195;x+=14)for(const z of [45,-59,124,-132])flat(s,x,.027,z-.16,5,.32,'#eee5c9',{...tag,cityPart:'lane-mark'});
  for(const x of [-53,41])for(let i=0;i<6;i++)flat(s,x+1+i*1.22,.032,34,.66,4.3,'#eee8d7',{...tag,cityPart:'crosswalk'});
  // City blocks use 15–55 m real building heights. None becomes a comically
  // giant furnishing next to the 150 m observation deck.
  let index=0;
  for(const [x,z,w,d,h] of [
    [-89,-105,24,28,32],[-130,-96,31,23,48],[-175,-112,27,32,39],[-91,-27,25,31,28],[-128,-30,30,26,42],[-177,-31,32,36,55],
    [-87,65,24,27,24],[-128,70,29,34,39],[-177,66,34,35,45],[-79,144,24,30,20],[-124,143,26,32,38],[-176,145,33,31,50],
    [65,-111,26,29,31],[107,-96,29,25,44],[157,-109,31,29,52],[68,-25,23,29,26],[111,-27,31,32,41],[161,-31,25,35,35],
    [64,67,27,26,22],[110,72,30,29,36],[159,70,29,35,47],[67,145,24,27,19],[108,140,30,35,40],[159,145,29,29,53],
    [-22,-111,28,28,18],[12,-99,25,23,29],[-22,68,21,24,17],[8,77,22,30,25],
  ])cityBuilding(s,x,z,w,d,h,index++);
  for(const [x,z,w,d] of [[-34,-177,65,30],[-38,152,65,38],[-191,8,33,35],[153,8,39,36]])flat(s,x,.012,z,w,d,TOKYO_TOWER_PALETTE.park,{...tag,cityPart:'park'});
  for(const [i,[x,z]] of [[-31,-171],[-7,-172],[19,-171],[-31,160],[-8,173],[16,169],[-181,14],[-166,34],[165,18],[182,33],[-37,27],[36,27]].entries())smallTree(s,x,z,i);
  for(const [i,[x,z,along]] of [[-46,-94,true],[-46,-20,true],[-46,96,true],[47,-169,true],[47,6,true],[47,151,true],[-151,44,false],[87,44,false],[-94,-59,false],[132,124,false]].entries())car(s,x,z,i,along);
  // A receiver-side paved apron is deliberately quiet: the can stays legible
  // against it without drawing a solution trail or enlarging the goal.
  const goal=worldNormalGoal(m.world),q=goal?.center??p(0,1,35);
  flat(s,q.x-2,.033,q.z-1.6,4,3.2,'#e1d8be',{...tag,cityPart:'receiver-apron'});
}
function worldNormalGoal(world){return world?.goals?.find(q=>q.role==='normal')??world?.goals?.[0];}
export function tokyoTowerStaticMeshes(world){
  const m=model(world);if(!m)return [];
  const key=JSON.stringify([world.worldVersion,m.center,m.height,m.profile,m.main,m.top,worldNormalGoal(world)?.center]);
  if(cache.has(key))return cache.get(key);
  const shapes=[];m.world=world;
  neighbourhood(shapes,m);footTown(shapes,m);towerFrame(shapes,m);
  observationDeck(shapes,m,m.main,'main-deck');observationDeck(shapes,m,m.top,'top-deck');
  cache.set(key,shapes);return shapes;
}
export function tokyoTowerGroups(world){
  const shapes=tokyoTowerStaticMeshes(world);if(!shapes.length)return [];
  const landmark=shapes.filter(s=>s.landmark==='tokyo-tower'),city=shapes.filter(s=>s.landmark!=='tokyo-tower');
  return [{id:'tower38-four-sided-lattice-and-observation-decks',object:'tokyo-tower',shapes:landmark,physical:false,landmarkHeight:333},
    {id:'tower38-street-scale-city-and-parks',object:'tower-neighbourhood',shapes:city,physical:false}];
}
export const tokyoTowerDynamicMeshes=()=>[];
