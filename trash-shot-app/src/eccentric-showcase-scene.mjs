// Revised chapter-five scenes. All blocking architecture comes from the
// versioned world: paint, plants and trim never create another collision rule.
import {eccentricWorld,eccentricSolids,eccentricMotion} from './eccentric-world.mjs?v=20261015-boar-distance-1';
import {scenePrimitives} from './factory-scene.mjs?v=20261015-boar-distance-1';
import {getThrowable} from './throwables.mjs?v=20261015-boar-distance-1';

const {p,face,shade,add,scale,cross,unit,box,physicalBox,cylinder,ellipsoid,line,flat,limb,basis,opening}=scenePrimitives;
const SUPPORTED=new Set([50,51,52]),cache=new Map(),TAU=Math.PI*2;
const C=Object.freeze({cream:'#f4ead5',paper:'#eee2c6',teal:'#4a948b',deep:'#286864',gold:'#dfb25b',wood:'#b88b58',darkWood:'#785b40',leaf:'#6c9871',leafLight:'#a7bd88',lawn:'#b4c79a',stone:'#b9baa5',mortar:'#89978b',water:'#789f99'});
function checked(world){const saved=eccentricWorld(world?.stageId,world?.worldVersion);if(!saved||!SUPPORTED.has(saved.worldVersion))throw new RangeError('A revised showcase world is required');return saved;}
const meta=(feature,extra={})=>({decoration:true,showcaseFeature:feature,...extra});
const between=(a,b,t)=>add(scale(a,1-t),scale(b,t));
function loop(s,points,color,properties={}){for(let i=0;i<points.length;i++)line(s,points[i],points[(i+1)%points.length],color,properties);}
function polygon(s,points,color,properties={}){s.push(face(points,color,null,properties));}
function ring(s,center,radius,color,properties={},segments=24){loop(s,Array.from({length:segments},(_,i)=>p(center.x+Math.cos(i/segments*TAU)*radius,center.y,center.z+Math.sin(i/segments*TAU)*radius)),color,properties);}
function diskOnPlane(s,at,r,color,properties={},segments=16){polygon(s,Array.from({length:segments},(_,i)=>at(Math.cos(i/segments*TAU)*r,Math.sin(i/segments*TAU)*r)),color,properties);}
function physicalColor(world,solid){
  if(world.worldVersion===50){if(solid.kind==='soil')return '#8b7957';if(solid.kind==='planter')return '#b88e65';return '#5f8259';}
  if(world.worldVersion===51){if(solid.kind==='target-board')return '#b68e61';if(solid.kind==='table'||solid.kind==='cabinet'||solid.kind==='stand')return '#98754f';if(solid.kind==='room-ceiling')return '#eee2c6';return '#517c71';}
  if(solid.kind==='door')return '#84664a';if(solid.kind==='moat-water')return C.water;return solid.kind==='rampart'?'#a6ac98':'#b4b5a0';
}
function masonry(s,solid,{colour='#b8baa4',brickWidth=.66,brickHeight=.32,tag='masonry'}={}){
  const a=solid.min,b=solid.max,z=a.z-.006,m=meta(tag,{paintFor:solid.id}),width=b.x-a.x,height=b.y-a.y;
  for(let row=0,y=a.y+.018;y<b.y-.018;row++,y+=brickHeight){
    const y2=Math.min(b.y-.012,y+brickHeight-.025),start=a.x-(row%2)*brickWidth*.5;
    for(let i=0,x=start;x<b.x;i++,x+=brickWidth){const x1=Math.max(a.x+.012,x+.014),x2=Math.min(b.x-.012,x+brickWidth-.014);if(x2<=x1||y2<=y)continue;
      polygon(s,[p(x1,y,z),p(x2,y,z),p(x2,y2,z),p(x1,y2,z)],shade(colour,((row*5+i*7)%5-2)*4),m);
    }
  }
  // Coping and bevels are drawn on the exact surface, not above its collider.
  if(width>.25&&height>.15)line(s,p(a.x+.018,b.y-.035,z-.002),p(b.x-.018,b.y-.035,z-.002),shade(colour,20),m);
}
function woodGrain(s,solid,{colour='#8c6c48',step=.19,horizontal=false,tag='wood-grain'}={}){
  const a=solid.min,b=solid.max,z=a.z-.007,m=meta(tag,{paintFor:solid.id});
  if(horizontal){for(let y=a.y+.11;y<b.y-.03;y+=step)line(s,p(a.x+.02,y,z),p(b.x-.02,y,z),colour,m);}
  else for(let x=a.x+.10;x<b.x-.025;x+=step)line(s,p(x,a.y+.025,z),p(x,b.y-.025,z),colour,m);
}
function surfaceFrame(s,solid,color=C.gold,width=.035,tag='surface-frame'){
  const a=solid.min,b=solid.max,z=a.z-.009,m=meta(tag,{paintFor:solid.id}),w=Math.min(width,(b.x-a.x)*.2),h=Math.min(width,(b.y-a.y)*.2);
  polygon(s,[p(a.x,a.y,z),p(b.x,a.y,z),p(b.x,a.y+h,z),p(a.x,a.y+h,z)],color,m);
  polygon(s,[p(a.x,b.y-h,z),p(b.x,b.y-h,z),p(b.x,b.y,z),p(a.x,b.y,z)],color,m);
  polygon(s,[p(a.x,a.y,z),p(a.x+w,a.y,z),p(a.x+w,b.y,z),p(a.x,b.y,z)],color,m);
  polygon(s,[p(b.x-w,a.y,z),p(b.x,a.y,z),p(b.x,b.y,z),p(b.x-w,b.y,z)],color,m);
}
function leaf(s,center,length,width,angle,color,properties={}){
  const dx=Math.cos(angle)*length,dz=Math.sin(angle)*length,wx=-Math.sin(angle)*width,wz=Math.cos(angle)*width;
  polygon(s,[p(center.x-dx*.3,center.y,center.z-dz*.3),p(center.x+wx,center.y+.035,center.z+wz),p(center.x+dx,center.y+.012,center.z+dz),p(center.x-wx,center.y+.035,center.z-wz)],color,properties);
}
function smallFlower(s,x,y,z,height,color,properties={}){
  const m={...meta('garden-flower'),...properties},head=p(x+.035,y+height,z);
  line(s,p(x,y,z),head,'#638b64',m);leaf(s,p(x,y+height*.36,z),.13,.045,.4,'#7e9d70',m);
  for(let j=0;j<5;j++){const a=j/5*TAU;polygon(s,[head,p(head.x+Math.cos(a-.3)*.06,head.y+.012,head.z+Math.sin(a-.3)*.06),p(head.x+Math.cos(a)*.09,head.y+.015,head.z+Math.sin(a)*.09),p(head.x+Math.cos(a+.3)*.06,head.y+.012,head.z+Math.sin(a+.3)*.06)],color,m);}
  diskOnPlane(s,(dx,dz)=>p(head.x+dx,head.y+.019,head.z+dz),.022,'#d9ac4c',m,8);
}
function seedHead(s,x,y,z,r=.10,properties={}){
  const m={...meta('dandelion-head'),...properties};line(s,p(x,y-.45,z),p(x,y,z),'#709265',m);
  for(let j=0;j<12;j++){const a=j/12*TAU,b=(j%3-1)*.45,tip=p(x+Math.cos(a)*r,y+b*r,z+Math.sin(a)*r);line(s,p(x,y-.025,z),tip,'#e7e2c4',m);for(const side of [-1,1])line(s,tip,p(tip.x+Math.cos(a+side*.8)*r*.25,tip.y+r*.12,tip.z+Math.sin(a+side*.8)*r*.25),'#f8f0d7',m);}
}
function gardenScene(s,world){
  const ground=meta('garden-ground');flat(s,-10,.003,-4,20,18,C.lawn,ground);
  // A tended path and bare landing soil distinguish the goal from scenery.
  for(let i=0;i<8;i++){
    const x=.14+Math.sin(i*.78)*.18,z=-2+i*.87,w=1.08+(i%3)*.06,d=.59;
    polygon(s,[p(x-w/2,.009,z),p(x+w/2,.009,z+.04),p(x+w/2-.05,.009,z+d),p(x-w/2+.04,.009,z+d+.02)],i%2?'#d7c69f':'#e3d4ae',meta('garden-stepping-stone'));
  }
  const solids=eccentricSolids(world),aperture=world.garden.aperture;
  for(const solid of solids){
    if(solid.kind==='planter'){masonry(s,solid,{colour:'#bd946d',brickWidth:.31,brickHeight:.15,tag:'garden-planter-bricks'});continue;}
    if(solid.kind!=='aperture-frame')continue;
    const a=solid.min,b=solid.max,z=a.z-.012,m=meta('garden-rose-trellis',{paintFor:solid.id});
    // Dense clipped leaf panels are solid hedges. The single actual opening
    // stays empty; a transparent lattice would falsely suggest extra routes.
    for(let row=0,y=a.y+.13;y<b.y-.02;row++,y+=.23)for(let i=0,x=a.x+.1;x<b.x-.03;i++,x+=.28){const ww=Math.min(.23,b.x-x-.015),hh=Math.min(.19,b.y-y-.015);if(ww<=0||hh<=0)continue;
      const colour=['#7d9d67','#94ab77','#87a46e','#72945f'][(row*3+i*7)%4],cx=x+ww*(.48+Math.sin(row*1.71+i*2.37)*.12),cy=y+hh*(.5+Math.cos(row*2.73+i*1.47)*.12),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      for(let k=0;k<2;k++){
        const angle=row*.91+i*2.73+k*1.80,dx=Math.cos(angle)*ww*.65,dy=Math.sin(angle)*hh*.70,wx=-Math.sin(angle)*ww*.27,wy=Math.cos(angle)*hh*.27;
        const point=(px,py,d)=>p(clamp(px,x,x+ww),clamp(py,y,y+hh),z-d),base=point(cx-dx*.4,cy-dy*.4,.015),tip=point(cx+dx,cy+dy,.02),left=point(cx+wx,cy+wy,.024),right=point(cx-wx,cy-wy,.024),ridge=point(cx,cy,.070);
        polygon(s,[base,left,tip,ridge],shade(colour,k?5:10),m);polygon(s,[base,ridge,tip,right],shade(colour,k?-8:-4),m);
      }
      if((row*3+i)%11===2){
        const rx=x+ww*.5,ry=y+hh*.5,roseMeta=meta('garden-rose',{paintFor:solid.id}),colour=['#e7b795','#e6d4a6','#d19e86'][(row+i)%3];
        for(let j=0;j<5;j++){const a=j/5*TAU,at=(dx,dy)=>p(rx+Math.cos(a)*.037+dx,ry+Math.sin(a)*.037+dy,z-.103);diskOnPlane(s,at,.043,shade(colour,j%2?4:-6),roseMeta,6);}
        diskOnPlane(s,(dx,dy)=>p(rx+dx,ry+dy,z-.106),.018,'#c89e5c',roseMeta,6);
      }
    }
    for(let x=a.x+.055;x<b.x-.04;x+=.44)line(s,p(x,a.y+.02,z-.008),p(x,b.y-.02,z-.008),'#b49b68',meta('garden-trellis-wood',{paintFor:solid.id}));
    for(let y=a.y+.09;y<b.y-.03;y+=.62)line(s,p(a.x+.02,y,z-.008),p(b.x-.02,y,z-.008),'#c3aa77',meta('garden-trellis-wood',{paintFor:solid.id}));
    surfaceFrame(s,solid,'#cbb684',.055,'garden-trellis-edge');
  }
  // The wood reveal traces exactly the canonical aperture bounds.
  const lo=aperture.min,hi=aperture.max,z=lo.z-.019,m=meta('garden-aperture-reveal');
  for(const x of [lo.x,hi.x])line(s,p(x,lo.y,z),p(x,hi.y,z),'#e3cf99',m);
  for(const y of [lo.y,hi.y])line(s,p(lo.x,y,z),p(hi.x,y,z),'#e3cf99',m);
  const soil=solids.find(a=>a.kind==='soil');
  for(let i=0;i<25;i++){const x=soil.min.x+.07+(i%5)*.28,z=soil.min.z+.10+Math.floor(i/5)*.25;leaf(s,p(x,soil.max.y+.012,z),.09,.025,i*.7,['#8f8658','#a39564','#b0a276'][i%3],meta('garden-soil-texture'));}
  for(let i=0;i<10;i++){const x=i<5?soil.min.x+.09:soil.max.x-.09,z=soil.min.z+.08+(i%5)*.28;smallFlower(s,x,soil.max.y+.008,z,.12+(i%2)*.04,['#edc46f','#e9d7b7','#cda492'][i%3],{flowerbedPlant:true});}
  for(let i=0;i<33;i++){
    const side=i%2?-1:1,x=side*(2.55+(i%4)*.56),z=-1.8+Math.floor(i/2)*.75;
    leaf(s,p(x,.014,z),.32,.10,.5+i*.8,['#98b07d','#a5bc87','#8fa878'][i%3],meta('garden-ground-cover'));
    if(i%3===0)smallFlower(s,x,.018,z,.22+(i%4)*.045,['#e6bd6d','#e7cdb2','#c9a38c'][i%3]);
  }
  for(const [x,z,r]of [[-2.7,-.7,.12],[-3.3,.2,.10],[3.2,.1,.11],[3.8,7.8,.09],[-3.1,8.2,.11]])seedHead(s,x,.58,z,r);
  // A low distant field is ground paint rather than an unmodelled wall.
  for(let i=0;i<16;i++){const x=-9.5+i*1.2;polygon(s,[p(x,.006,10),p(x+1.2,.006,10),p(x+1.2,.006,14),p(x,.006,14)],i%2?'#a6ba89':'#a2b786',meta('garden-distant-field'));}
}
function cardSuit(s,at,size,suit,color,properties={}){
  const m={...meta('playing-card-suit'),...properties};
  if(suit==='diamond')polygon(s,[at(0,size),at(size*.65,0),at(0,-size),at(-size*.65,0)],color,m);
  else{
    const heart=Array.from({length:20},(_,i)=>{const a=i/20*TAU,x=16*Math.sin(a)**3/18,y=(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/18;return at(x*size,y*size);});
    polygon(s,heart,color,m);
  }
}
function laidCard(s,x,y,z,angle=0,red=true){
  const w=.063,h=.088,at=(dx,dz)=>p(x+Math.cos(angle)*dx-Math.sin(angle)*dz,y,z+Math.sin(angle)*dx+Math.cos(angle)*dz),m=meta('parlor-card-prop');
  polygon(s,[at(-w/2,-h/2),at(w/2,-h/2),at(w/2,h/2),at(-w/2,h/2)],'#f5e9cc',m);cardSuit(s,(dx,dz)=>({...at(dx,dz),y:y+.001}),.014,red?'diamond':'heart',red?'#bd735e':'#315e54',m);
}
function parlorFloor(s){
  flat(s,-4.5,.003,-3,9,11.2,'#b4966c',meta('parlor-floor'));
  for(let row=0;row<18;row++)for(let col=0;col<15;col++){
    const x=-4.5+col*.60,z=-3+row*.62,w=.60,d=.62,m=meta('parlor-parquet');
    polygon(s,[p(x+.006,.008,z+.006),p(x+w-.006,.008,z+.006),p(x+w-.006,.008,z+d-.006),p(x+.006,.008,z+d-.006)],['#bf9e70','#c7aa7d','#bda077','#d0b488'][(row*3+col)%4],m);
    if((row+col)%3===0)line(s,p(x+.06,.009,z+.24),p(x+w-.05,.009,z+.25),'#aa8b61',m);
  }
}
function parlorWallPaint(s,solid){
  const a=solid.min,b=solid.max,m=meta('parlor-wainscot',{paintFor:solid.id,cutawayId:solid.id});
  if(b.x-a.x>b.z-a.z){const z=a.z-.012,w=b.x-a.x;
    polygon(s,[p(a.x,.05,z),p(b.x,.05,z),p(b.x,1.04,z),p(a.x,1.04,z)],'#345f55',m);
    line(s,p(a.x,1.05,z-.001),p(b.x,1.05,z-.001),'#c5aa73',m);
    for(let x=a.x+.17;x<b.x-.28;x+=.81){const x2=Math.min(b.x-.08,x+.59);loop(s,[p(x,.15,z-.002),p(x2,.15,z-.002),p(x2,.88,z-.002),p(x,.88,z-.002)],'#759184',m);}
    for(let x=a.x+.20;x<b.x-.1;x+=.18)line(s,p(x,1.16,z),p(x,b.y-.1,z),'#729286',meta('parlor-wallpaper',{paintFor:solid.id,cutawayId:solid.id}));
  }else{
    const x=a.x<0?b.x+.012:a.x-.012;
    polygon(s,[p(x,.05,a.z),p(x,.05,b.z),p(x,1.04,b.z),p(x,1.04,a.z)],'#345f55',m);
    line(s,p(x,1.05,a.z),p(x,1.05,b.z),'#c5aa73',m);
    for(let z=a.z+.18;z<b.z-.1;z+=.23)line(s,p(x,1.16,z),p(x,b.y-.10,z),'#6b8c80',meta('parlor-wallpaper',{paintFor:solid.id,cutawayId:solid.id}));
  }
}
function targetCork(s,world,solid){
  const a=solid.min,b=solid.max,z=a.z-.012,goal=world.goals[0],m=meta('parlor-cork-grain',{paintFor:solid.id});
  surfaceFrame(s,solid,'#71543b',.085,'parlor-target-frame');
  for(let row=0,y=a.y+.13;y<b.y-.09;row++,y+=.115)for(let i=0,x=a.x+.13;x<b.x-.08;i++,x+=.12){const d=((row*11+i*7)%5)*.005;line(s,p(x,y,z),p(Math.min(b.x-.08,x+.027+d),y+.012,z),'#987249',m);}
  const at=basis(goal).at;
  for(const radius of [.18,.34])loop(s,Array.from({length:28},(_,i)=>at(Math.cos(i/28*TAU)*radius,Math.sin(i/28*TAU)*radius,.006)),radius<.2?'#7a5d41':'#c3a270',meta('parlor-cork-mark',{goalId:goal.id}));
  cardSuit(s,(dx,dy)=>at(dx,dy,.007),.09,'diamond','#8b6a49',meta('parlor-cork-mark',{goalId:goal.id}));
}
function parlorScene(s,world){
  parlorFloor(s);const solids=eccentricSolids(world);
  for(const solid of solids){
    const a=solid.min,b=solid.max;
    if(solid.kind==='room-wall'){parlorWallPaint(s,solid);continue;}
    if(solid.kind==='room-ceiling')continue;
    if(solid.kind==='aperture-frame'){
      const m=meta('parlor-display-panel',{paintFor:solid.id}),z=a.z-.011;
      if(b.x-a.x>.15&&b.y-a.y>.2){
        const margin=.09;loop(s,[p(a.x+margin,a.y+margin,z),p(b.x-margin,a.y+margin,z),p(b.x-margin,b.y-margin,z),p(a.x+margin,b.y-margin,z)],'#c6aa76',m);
        for(let x=a.x+.18;x<b.x-.06;x+=.21)line(s,p(x,a.y+.12,z),p(x,b.y-.12,z),'#648477',m);
      }
      surfaceFrame(s,solid,'#b9955f',.065,'parlor-aperture-frame');
      continue;
    }
    if(solid.kind==='target-board'){targetCork(s,world,solid);continue;}
    if(solid.kind==='stand'){woodGrain(s,solid);continue;}
    if(solid.kind==='table'){
      const m=meta('parlor-table-felt',{paintFor:solid.id});
      flat(s,a.x+.09,b.y+.004,a.z+.09,b.x-a.x-.18,b.z-a.z-.18,'#326c61',m);
      loop(s,[p(a.x+.16,b.y+.007,a.z+.16),p(b.x-.16,b.y+.007,a.z+.16),p(b.x-.16,b.y+.007,b.z-.16),p(a.x+.16,b.y+.007,b.z-.16)],'#bdad7b',m);
      // The table is a solid cabinet base, with panels that honestly describe
      // its collider rather than false empty space beneath four thin legs.
      woodGrain(s,solid,{step:.30});
      for(let x=a.x+.16;x<b.x-.25;x+=.61)loop(s,[p(x,.11,a.z-.009),p(Math.min(b.x-.12,x+.43),.11,a.z-.009),p(Math.min(b.x-.12,x+.43),.61,a.z-.009),p(x,.61,a.z-.009)],'#c3a171',meta('parlor-table-panel'));
      for(let i=0;i<9;i++)laidCard(s,-.48+i*.10,b.y+.012,1.86+(i%3)*.09,(i-4)*.12,i%2===0);
      // A real-sized deck is thin enough to remain surface dressing.
      box(s,.67,b.y+.006,2.03,.065,.016,.09,'#e9dfc4',meta('parlor-card-deck'));
      flat(s,.673,b.y+.023,2.033,.059,.084,'#386f66',meta('parlor-card-deck'));
      continue;
    }
    if(solid.kind==='cabinet'){
      woodGrain(s,solid,{step:.15});surfaceFrame(s,solid,'#c4a16c',.05,'parlor-cabinet-trim');
      const z=a.z-.014,cx=(a.x+b.x)/2;
      for(const y of [.18,.9,1.65,2.30])if(y<b.y)line(s,p(a.x+.06,y,z),p(b.x-.06,y,z),'#d0b480',meta('parlor-cabinet-shelf'));
      line(s,p(cx,a.y+.1,z),p(cx,b.y-.1,z),'#715238',meta('parlor-cabinet-door'));
      for(const x of [cx-.065,cx+.065])diskOnPlane(s,(dx,dy)=>p(x+dx,1.27+dy,z-.003),.025,'#dbbd78',meta('parlor-cabinet-handle'),8);
      for(let i=0;i<5;i++)box(s,a.x+.11+i*.12,b.y+.002,a.z+.12,.075,.035+(i%2)*.015,.11,['#c2aa83','#e2d1aa','#6a8b77'][i%3],meta('parlor-card-box'));
    }
  }
  const ap=world.parlor.aperture,m=meta('parlor-aperture-reveal');
  loop(s,[p(ap.min.x,ap.min.y,ap.min.z-.020),p(ap.max.x,ap.min.y,ap.min.z-.020),p(ap.max.x,ap.max.y,ap.min.z-.020),p(ap.min.x,ap.max.y,ap.min.z-.020)],'#ead4a0',m);
  // An inlaid diamond on the floor replaces a technical launch pad.
  polygon(s,[p(0,.016,-.36),p(.22,.016,-.10),p(0,.016,.16),p(-.22,.016,-.10)],'#d9bd83',meta('parlor-floor-inlay'));
  for(const x of [-2.2,2.2]){
    const z=7.97,frame=meta('parlor-wall-art',{cutawayId:'parlor-back-wall'});
    polygon(s,[p(x-.41,1.55,z),p(x+.41,1.55,z),p(x+.41,2.57,z),p(x-.41,2.57,z)],'#b79b67',frame);
    polygon(s,[p(x-.35,1.61,z-.003),p(x+.35,1.61,z-.003),p(x+.35,2.51,z-.003),p(x-.35,2.51,z-.003)],'#e6d7b3',frame);
    cardSuit(s,(dx,dy)=>p(x+dx,2.06+dy,z-.006),.22,x<0?'heart':'diamond',x<0?'#ba765b':'#386b5c',frame);
  }
}
function fortWallDetails(s,solid){
  masonry(s,solid,{colour:solid.kind==='rampart'?'#aaaf99':'#babba5',brickWidth:solid.kind==='rampart'?.76:.84,brickHeight:.39,tag:'fort-masonry'});
  const a=solid.min,b=solid.max,w=b.x-a.x,h=b.y-a.y,z=a.z-.012;
  // Embrasures are painted recesses. They never advertise a hole in a solid.
  if(h>3.5&&w>1.4){for(let x=a.x+.72;x<b.x-.4;x+=1.65){const y=Math.min(b.y-.65,4.75);polygon(s,[p(x-.075,y-.35,z),p(x+.075,y-.35,z),p(x+.075,y+.35,z),p(x-.075,y+.35,z)],'#65776d',meta('fort-arrow-slit',{paintFor:solid.id}));line(s,p(x-.20,y+.07,z-.001),p(x+.20,y+.07,z-.001),'#65776d',meta('fort-arrow-slit',{paintFor:solid.id}));}}
}
function fortDoorDetails(s,world,solid){
  const a=solid.min,b=solid.max,z=a.z-.014,m=meta('fort-gate-joinery',{paintFor:solid.id}),cx=(a.x+b.x)/2;
  woodGrain(s,solid,{colour:'#66513d',step:.22,tag:'fort-gate-planks'});
  for(const y of [.64,2.10,3.53]){
    polygon(s,[p(a.x+.07,y,z),p(b.x-.07,y,z),p(b.x-.07,y+.14,z),p(a.x+.07,y+.14,z)],'#526a5d',m);
    for(let x=a.x+.18;x<b.x-.11;x+=.35)diskOnPlane(s,(dx,dy)=>p(x+dx,y+.07+dy,z-.003),.025,'#aab29a',m,7);
  }
  line(s,p(cx,a.y+.03,z-.003),p(cx,b.y-.03,z-.003),'#544a36',m);
  for(const side of [-1,1]){
    const x=cx+side*.24,at=(dx,dy)=>p(x+dx,1.61+dy,z-.009);
    loop(s,Array.from({length:14},(_,i)=>at(Math.cos(i/14*TAU)*.095,Math.sin(i/14*TAU)*.12)),'#d4b77b',meta('fort-gate-ring-handle'));
    diskOnPlane(s,(dx,dy)=>p(x+dx,1.77+dy,z-.006),.047,'#80917c',m,8);
  }
  const goal=world.goals[0];
  // Small heraldry reads as a door, with no oversized floating target board.
  polygon(s,[p(cx-.24,2.7,z-.004),p(cx+.24,2.7,z-.004),p(cx+.20,2.33,z-.004),p(cx,2.17,z-.004),p(cx-.20,2.33,z-.004)],'#b69c63',meta('fort-gate-crest',{goalId:goal.id}));
}
function fortressScene(s,world){
  const water=world.fortress.moat,ground=meta('fort-landscape');
  flat(s,-13,.003,-4,26,10,'#b5bf94',ground);flat(s,-13,.003,11,26,13,'#a9b88c',ground);
  flat(s,water.min.x,water.max.y+.004,water.min.z,water.max.x-water.min.x,water.max.z-water.min.z,C.water,meta('fort-moat-water'));
  // Ground planes flank the water; no drawn bridge crosses the physical
  // rampart or suggests an unsupported rolling shortcut.
  for(const side of [-1,1])flat(s,side<0?-13:water.max.x,.004,6,13-water.max.x,5,'#9dac83',ground);
  for(let i=0;i<12;i++){
    const z=-2+i*.52,x=-1.05+(i%2)*.06;
    polygon(s,[p(x,.009,z),p(x+2.0,.009,z+.03),p(x+2.02,.009,z+.42),p(x-.03,.009,z+.43)],['#d1c39e','#c6bb96','#d9cda9'][i%3],meta('fort-gun-approach'));
  }
  const solids=eccentricSolids(world);
  for(const solid of solids){if(solid.kind==='door')fortDoorDetails(s,world,solid);else if(solid.kind!=='moat-water')fortWallDetails(s,solid);}
  // The full silhouette is owned by canonical blocks, including merlons and
  // octagonal tower strips when supplied by the world definition.
  for(const solid of solids.filter(a=>/tower/.test(a.id))){
    const a=solid.min,b=solid.max,z=a.z-.014;
    if(b.x-a.x>.35&&b.y-a.y>4){for(const y of [1.25,3.25,5.3])if(y<b.y-.25)line(s,p(a.x+.02,y,z),p(b.x-.02,y,z),'#d1d0b6',meta('fort-tower-stringcourse',{paintFor:solid.id}));}
  }
  // An inset gate outline follows real door boundaries, not the smaller hit
  // tolerance. It frames the destination without revealing a launch angle.
  const door=solids.find(a=>a.kind==='door');
  loop(s,[p(door.min.x-.005,0,door.min.z-.019),p(door.min.x-.005,door.max.y,door.min.z-.019),p(door.max.x+.005,door.max.y,door.min.z-.019),p(door.max.x+.005,0,door.min.z-.019)],'#d4c59e',meta('fort-gate-surround'));
  for(let i=0;i<34;i++){
    const side=i%2?-1:1,x=side*(3+(i%6)*1.35),z=-2+Math.floor(i/2)*1.34;
    if(z>5.8&&z<11.1)continue;
    leaf(s,p(x,.014,z),.22,.07,.5+i*.9,['#9bad7b','#a2b182','#8da47a'][i%3],meta('fort-ground-grass'));
  }
}
export function showcaseStaticMeshes(world){
  world=checked(world);const key=`${world.stageId}:${world.worldVersion}`;if(cache.has(key))return cache.get(key);
  const shapes=[];for(const solid of eccentricSolids(world)){
    const start=shapes.length;physicalBox(shapes,solid,physicalColor(world,solid));
    if(world.worldVersion===51&&['room-wall','room-ceiling'].includes(solid.kind))for(let i=start;i<shapes.length;i++)shapes[i].cutawayId=solid.id;
  }
  ({50:gardenScene,51:parlorScene,52:fortressScene})[world.worldVersion](shapes,world);
  // This is the authoritative goal plane, including the unobstructed flower
  // bed opening. The broad decorative door does not enlarge the hit target.
  for(const goal of world.goals)opening(shapes,goal,{colour:world.worldVersion===50?'#dac49b':world.worldVersion===51?'#b9945e':'#b8a16e',pocket:false});
  cache.set(key,shapes);return shapes;
}
export function showcaseCutaway(world,camera){
  world=checked(world);if(world.worldVersion!==51)return [];
  const c=camera?.position??camera;if(!c||!['x','y','z'].every(k=>Number.isFinite(c[k])))return [];
  return eccentricSolids(world).filter(s=>s.kind==='room-ceiling'?c.y>s.min.y:s.kind==='room-wall'&&(s.id==='parlor-left-wall'?c.x<s.max.x:s.id==='parlor-right-wall'?c.x>s.min.x:s.id==='parlor-back-wall'?c.z>s.min.z:false)).map(s=>s.id);
}
function gardenWind(s,world,time,options){
  const t=options.reducedMotion?0:time,wind=eccentricMotion(world,time).wind,heading=Math.atan2(wind.x,wind.z),dx=Math.sin(heading),dz=Math.cos(heading);
  for(let i=0;i<12;i++){
    const phase=(t*.16+i*.133)%1,x=-2.8+(i%4)*1.38+dx*phase*.72,z=.8+Math.floor(i/4)*1.65+dz*phase*.72,y=.82+(i%3)*.36;
    const m=meta('garden-wind-seed',{ambientWind:true,depthWrite:false});
    const head=p(x,y,z),tail=p(x-dx*.10,y-.055,z-dz*.10);line(s,tail,head,'#c6bd93',m);
    for(let j=-2;j<=2;j++)line(s,head,p(x+Math.cos(heading+j*.49)*.064,y+.04,z+Math.sin(heading+j*.49)*.064),'#f1ead0',m);
  }
  // Short field ribbons indicate present wind, never a shot prediction.
  for(let i=0;i<5;i++){
    const x=-2.3+i*1.17,z=1.1+(i%2)*3.15,y=.75+(i%3)*.29,m=meta('garden-wind-ribbon',{ambientWind:true,depthWrite:false}),shift=Math.sin(t*1.8+i)*.035;
    line(s,p(x,y,z),p(x+dx*.32,y+shift,z+dz*.32),'rgba(238,237,207,.7)',m);
    line(s,p(x+dx*.32,y+shift,z+dz*.32),p(x+dx*.52,y+.022,z+dz*.52),'rgba(238,237,207,.7)',m);
  }
  if((options.phase??options.game?.phase)==='success'){
    // This bloom follows the captured seed position. It is a result flourish,
    // with no growth timer, extra target or change to the seed's trajectory.
    const seed=options.game?.can?.position??world.goals[0].center,soil=eccentricSolids(world).find(a=>a.kind==='soil'),x=Math.max(soil.min.x+.08,Math.min(soil.max.x-.08,seed.x)),z=Math.max(soil.min.z+.08,Math.min(soil.max.z-.08,seed.z));
    smallFlower(s,x,soil.max.y+.008,z,.21,'#efd17d',{gardenSuccessBloom:true});
    for(let i=0;i<5;i++){const a=i/5*TAU;line(s,p(x+Math.cos(a)*.18,soil.max.y+.20,z+Math.sin(a)*.18),p(x+Math.cos(a)*.24,soil.max.y+.27,z+Math.sin(a)*.24),'#ead6a1',meta('garden-seed-arrival',{gardenSuccessBloom:true,depthWrite:false}));}
  }
}
function cannonWheel(s,center,radius=.40){
  const n=14,m=meta('cannon-carriage-wheel',{cannonWheel:true}),width=.115;
  const at=(a,side)=>p(center.x+side*width/2,center.y+Math.cos(a)*radius,center.z+Math.sin(a)*radius);
  for(let i=0;i<n;i++){const a=i/n*TAU,b=(i+1)/n*TAU;
    polygon(s,[at(a,-1),at(b,-1),at(b,1),at(a,1)],'#536b5c',m);
    for(const side of [-1,1]){
      const outerA=at(a,side),outerB=at(b,side),innerA=between(p(center.x+side*width/2,center.y,center.z),outerA,.82),innerB=between(p(center.x+side*width/2,center.y,center.z),outerB,.82);
      polygon(s,[outerA,outerB,innerB,innerA],'#97764f',m);
      if(i%2===0)line(s,p(center.x+side*(width/2+.002),center.y,center.z),at(a,side),'#c2a472',m);
    }
  }
  limb(s,p(center.x-.08,center.y,center.z),p(center.x+.08,center.y,center.z),.075,'#6b7d67',m);
}
function cannonModel(s,world,time,options){
  const phase=options.phase??options.game?.phase,flight=options.flightTime??options.game?.time??0,active=phase==='flying'&&flight>=0&&flight<.65;
  const elevation=(options.aim?.elevation??world.launch.elevation)*Math.PI/180,yaw=(options.aim?.yaw??world.launch.yaw)*Math.PI/180,axis=p(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation));
  const right=unit(cross(p(0,1,0),axis)),up=unit(cross(axis,right)),recoil=active?Math.sin(Math.min(1,flight/.45)*Math.PI)*.19:0;
  const ballRadius=options.game?.can?.radius??getThrowable(world.itemId)?.physics.radius??.18,launchAnchor=add(world.origin,p(0,ballRadius-.14,0)),origin=add(launchAnchor,scale(axis,-recoil)),bore=ballRadius*1.08,muzzleRadius=Math.max(.285,bore+.07);
  const at=(along,r,a)=>add(origin,add(scale(axis,along),add(scale(right,Math.cos(a)*r),scale(up,Math.sin(a)*r)))),barrelMeta=meta('cannon-bronze-barrel',{cannonBarrel:true,recoil});
  const carriage=world.cannon.position,axle=p(carriage.x,.47,carriage.z);
  box(s,axle.x-.40,.22,axle.z-.53,.80,.22,.99,'#9c794b',meta('cannon-wood-carriage',{cannonCarriage:true}));
  for(const side of [-1,1]){
    box(s,axle.x+side*.28-.045,.30,axle.z-.45,.09,.40,.78,'#b18a53',meta('cannon-carriage-cheek'));
    cannonWheel(s,p(axle.x+side*.52,.43,axle.z));
    limb(s,p(axle.x+side*.29,.5,axle.z-.2),add(launchAnchor,add(scale(axis,-.91),scale(right,side*.23))),.045,'#d0af73',meta('cannon-elevation-brace'));
  }
  limb(s,p(axle.x-.66,.43,axle.z),p(axle.x+.66,.43,axle.z),.065,'#6c7c63',meta('cannon-axle'));
  const profile=[[-1.40,.115],[-1.28,.245],[-1.11,.262],[-.94,.244],[-.24,.235],[-.14,muzzleRadius-.01],[0,muzzleRadius]],segments=16;
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<segments;i++){
    const a=i/segments*TAU,b=(i+1)/segments*TAU,[z0,r0]=profile[j],[z1,r1]=profile[j+1];
    polygon(s,[at(z0,r0,a),at(z0,r0,b),at(z1,r1,b),at(z1,r1,a)],shade('#49766a',Math.round(Math.cos(a)*12)),barrelMeta);
  }
  polygon(s,Array.from({length:segments},(_,i)=>at(-1.40,.115,i/segments*TAU)),'#3c6155',barrelMeta);
  // Open bore has a deep inner wall and dark recessed end, so the muzzle
  // reads as an opening from changing camera angles.
  for(let i=0;i<segments;i++){
    const a=i/segments*TAU,b=(i+1)/segments*TAU;
    polygon(s,[at(0,muzzleRadius,a),at(0,muzzleRadius,b),at(0,bore,b),at(0,bore,a)],'#b3b390',meta('cannon-muzzle-rim',{cannonMouth:true,muzzleCenter:{...origin},launchAnchor:{...launchAnchor}}));
    polygon(s,[at(0,bore,a),at(0,bore,b),at(-.28,bore,b),at(-.28,bore,a)],'#284c42',meta('cannon-inner-bore',{cannonMouth:true}));
  }
  polygon(s,Array.from({length:segments},(_,i)=>at(-.28,bore,i/segments*TAU)),'#183e37',meta('cannon-inner-bore',{cannonMouth:true}));
  for(const side of [-1,1]){
    const center=add(origin,add(scale(axis,-.91),scale(right,side*.23)));
    limb(s,add(center,scale(right,-.08)),add(center,scale(right,.08)),.082,'#71927a',meta('cannon-trunnion'));
  }
  for(const z of [-1.17,-.36])loop(s,Array.from({length:segments},(_,i)=>at(z,z<-1?.259:.238,i/segments*TAU)),'#b6b082',meta('cannon-cast-band'));
  if(active&&!options.reducedMotion){
    const age=Math.min(1,flight/.65);
    for(let i=0;i<5;i++){
      const a=add(origin,scale(axis,.18+i*.18+age*.65)),r=.075+age*.20+i*.014;
      ellipsoid(s,a.x+Math.sin(i*1.7)*age*.09,a.y+age*.19,a.z,r,r*.79,r*.92,['#e7dfc7','#d4d3ba','#c6ccb5'][i%3],7,3,meta('cannon-shot-smoke',{cannonSmoke:true,depthWrite:false}));
    }
    if(flight<.09){const tip=add(origin,scale(axis,.35)),m=meta('cannon-muzzle-flash',{depthWrite:false});for(let j=0;j<4;j++){const a=j/4*TAU;polygon(s,[at(.01,.08,a),at(.01,.08,a+Math.PI),add(tip,scale(up,.03))],'#e9c978',m);}}
  }
}
function fortDynamic(s,world,time,options){
  cannonModel(s,world,time,options);
  const t=options.reducedMotion?0:time,moat=world.fortress.moat;
  for(let i=0;i<16;i++){
    const x=moat.min.x+.3+(i%8)*2.20,z=moat.min.z+.48+Math.floor(i/8)*3.2+Math.sin(t*.65+i)*.08;
    line(s,p(x,.012,z),p(x+.48,.012,z),'#abc1ac',meta('fort-moat-ripple',{depthWrite:false}));
    if(i%3===0)line(s,p(x+.10,.013,z+.10),p(x+.30,.013,z+.10),'#95b4a4',meta('fort-moat-ripple',{depthWrite:false}));
  }
  if((options.phase??options.game?.phase)!=='success')return;
  const door=eccentricSolids(world).find(a=>a.kind==='door'),goal=world.goals[0],z=door.min.z-.024,impact=options.game?.impactPose?.position??options.game?.can?.position??goal.center;
  const cx=Math.max(door.min.x+.25,Math.min(door.max.x-.25,impact.x)),cy=Math.max(.35,Math.min(door.max.y-.25,impact.y));
  for(let i=0;i<10;i++){
    const a=i/10*TAU,r=.26+(i%4)*.10,m=meta('fort-door-impact',{fortImpact:true,goalId:goal.id});
    line(s,p(cx+Math.cos(a)*.08,cy+Math.sin(a)*.08,z),p(cx+Math.cos(a)*r,cy+Math.sin(a)*r,z),'#e8cc91',m);
    line(s,p(cx+Math.cos(a)*r,cy+Math.sin(a)*r,z),p(cx+Math.cos(a+.16)*(r+.17),cy+Math.sin(a+.16)*(r+.17),z),'#4c4c38',m);
  }
}
export function showcaseDynamicMeshes(world,time=0,options={}){
  world=checked(world);if(!Number.isFinite(time))throw new TypeError('Showcase time must be finite');const shapes=[];
  if(world.worldVersion===50)gardenWind(shapes,world,time,options);
  if(world.worldVersion===52)fortDynamic(shapes,world,time,options);
  return shapes;
}
