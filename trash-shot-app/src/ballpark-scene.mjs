// World 36 ballpark art. Earlier outdoor renderings stay on their frozen path.
// Catching uses the spectator-area rule; the glove is a normal hand-held object,
// not a picture of that deliberately forgiving gameplay capture rectangle.
const p=(x,y,z)=>({x,y,z});
const shade=(c,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(c.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const face=(points,fill,meta={})=>({points,fill,stroke:null,decoration:true,...meta});
const line=(s,a,b,color,meta={})=>s.push({points:[a,b],line:true,stroke:color,decoration:true,...meta});
const flat=(s,x,y,z,w,d,color,meta={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],color,meta));
function box(s,x,y,z,w,h,d,color,meta={}){
  const a=[p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],b=a.map(q=>({...q,y:y+h}));
  for(let i=0;i<4;i++)s.push(face([a[i],a[(i+1)%4],b[(i+1)%4],b[i]],shade(color,[0,-12,-6,7][i]),meta));
  s.push(face(b,shade(color,13),meta),face([...a].reverse(),shade(color,-16),meta));
}
function beam(s,a,b,r,color,meta={}){
  const d=p(b.x-a.x,b.y-a.y,b.z-a.z),len=Math.hypot(d.x,d.y,d.z)||1,n=p(d.x/len,d.y/len,d.z/len),h=Math.hypot(n.x,n.z),u=h>.00001?p(n.z/h,0,-n.x/h):p(1,0,0),v=p(n.y*u.z-n.z*u.y,n.z*u.x-n.x*u.z,n.x*u.y-n.y*u.x);
  const ring=q=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>p(q.x+r*(u.x*x+v.x*y),q.y+r*(u.y*x+v.y*y),q.z+r*(u.z*x+v.z*y))),lo=ring(a),hi=ring(b);
  for(let i=0;i<4;i++)s.push(face([lo[i],lo[(i+1)%4],hi[(i+1)%4],hi[i]],shade(color,[2,-7,-3,9][i]),meta));
}
function ellipsoid(s,c,rx,ry,rz,color,n=8,rows=3,meta={}){
  const at=(a,b)=>p(c.x+Math.cos(a)*Math.cos(b)*rx,c.y+Math.sin(b)*ry,c.z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,lo=-Math.PI/2+j/rows*Math.PI,hi=-Math.PI/2+(j+1)/rows*Math.PI;s.push(face([at(a,lo),at(b,lo),at(b,hi),at(a,hi)],shade(color,Math.round(Math.sin((lo+hi)/2)*10+Math.cos(a)*5)),meta));}
}
const group=(id,shapes,extra={})=>({id,object:id,shapes,physical:false,...extra});
const bounds=shapes=>Object.fromEntries(['x','y','z'].flatMap(k=>{const a=shapes.flatMap(s=>s.points.map(q=>q[k]));return [['min'+k.toUpperCase(),Math.min(...a)],['max'+k.toUpperCase(),Math.max(...a)]];}));
const palette={concrete:'#ded5bd',step:'#e9dec2',seat:'#3f8079',seatBack:'#508e82',steel:'#799887',leather:'#a77b48',stitch:'#dbc08e',skin:'#d8b18e',white:'#f0e9d6',teal:'#316b67'};

// Five-column lettering is deliberate scoreboard typography, not random LEDs.
const font={
  ' ':['00000','00000','00000','00000','00000','00000','00000'],
  A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],
  D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],
  K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],W:['10001','10001','10001','10101','10101','10101','01010'],Y:['10001','10001','01010','00100','00100','00100','00100'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],
  '6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
};
function lettering(s,text,x,y,z,size,color,meta={}){
  for(let ch=0;ch<text.length;ch++){
    const glyph=font[text[ch]]??font[' '];
    // Merge adjacent lit cells in each row into a crisp horizontal stroke.
    for(let row=0;row<7;row++)for(let column=0;column<5;column++)if(glyph[row][column]==='1'){
      let end=column+1;while(end<5&&glyph[row][end]==='1')end++;
      const xx=x+(ch*6+column)*size,yy=y+(6-row)*size;
      s.push(face([p(xx,yy,z),p(xx+(end-column)*size,yy,z),p(xx+(end-column)*size,yy+size*.88,z),p(xx,yy+size*.88,z)],color,{...meta,scoreboardText:text}));column=end-1;
    }
  }
}
export {lettering as scoreboardLettering};
function scoreboard(world){
  const c=world.solids.find(q=>q.id==='stadium-scoreboard');if(!c)return [];
  const s=[],z=c.min.z-.009,x=c.min.x,w=c.max.x-x,y=c.min.y,h=c.max.y-y,tag={architecturePart:'scoreboard-paint',sourceSolidId:c.id,planeOnly:true};
  const paint=(xx,yy,ww,hh,color,detail='near')=>{
    // The depth cache stores Float32 values and compares strictly. Colored
    // paint must sit in front of the background, rather than compete on one
    // coplanar surface and become a random pattern of surviving pixels.
    const plane=z-(detail?.003:0);
    s.push(face([p(xx,yy,plane),p(xx+ww,yy,plane),p(xx+ww,yy+hh,plane),p(xx,yy+hh,plane)],color,{...tag,scoreboardLayer:detail?'overlay':'background',...(detail?{scoreboardDetail:detail}:{})}));
  };
  paint(x+.10,y+.10,w-.20,h-.20,'#254f4c',null);paint(x+.14,y+h-.70,w-.28,.54,'#d9cdb0');
  const titleSize=Math.min(w/90,.061);lettering(s,'TRASHOOT PARK',x+(w-13*6*titleSize)/2,y+h-.64,z-.004,titleSize,'#315e57',tag);
  const headerY=y+1.23,rowY=[y+.74,y+.28],startX=x+1.82,gap=(w-2.02)/12,size=Math.min(.053,gap/7);
  lettering(s,'AWAY',x+.23,rowY[0],z-.004,size*1.13,'#d8d4b6',tag);lettering(s,'HOME',x+.23,rowY[1],z-.004,size*1.13,'#d8d4b6',tag);
  const heads=['1','2','3','4','5','6','7','8','9','R','H','E'],scores=[['0','1','0','0','0','0','0','0','0','1','3','0'],['0','0','0','2','0','0','0','0','0','2','4','0']];
  for(let i=0;i<heads.length;i++){
    const xx=startX+i*gap;lettering(s,heads[i],xx,headerY,z-.004,size,'#b6c6ac',tag);
    for(let team=0;team<2;team++)lettering(s,scores[team][i],xx,rowY[team],z-.005,size,i>=9?'#ead08c':'#e3dec3',tag);
  }
  for(const yy of [headerY-.12,rowY[0]-.12,rowY[1]-.12])paint(x+.2,yy,w-.4,.018,'#6a8c7e');
  // A conventional amber home-run indicator doubles as the optional target.
  const goal=world.goals.find(g=>g.kind==='scoreboard-light');
  if(goal){
    const a=goal.center,hw=goal.halfWidth??.55,hh=goal.halfHeight??.28;
    paint(a.x-hw,a.y-hh,hw*2,hh*2,'#d6b55e');
    lettering(s,'HR',a.x-.21,a.y-.12,z-.007,.036,'#fff0ba',{...tag,goalId:goal.id,goalRole:goal.role,goalKind:goal.kind,scoreboardIndicator:true});
  }
  // Sub-pixel lettering becomes a shimmering LED pattern at the wide field
  // view. A quiet score summary is used there; zooming close reveals all nine
  // innings. Both are ordinary scoreboard information on the same plane.
  for(const shape of s)if(shape.scoreboardText)shape.scoreboardDetail='near';
  const far={...tag,scoreboardDetail:'far'};
  // Wide-view glyph cells occupy about two screen pixels instead of a
  // fraction of a pixel. Away/home totals use opposite sides of the display;
  // the amber receiver indicator has its own empty centre, never a glyph row.
  for(let team=0;team<2;team++){
    const xx=x+(team===0?1.10:w-1.95);
    lettering(s,team===0?'A':'H',xx,y+h-1.43,z-.007,.17,'#d9dec5',far);
    lettering(s,scores[team][9],xx,y+.22,z-.007,.18,'#ead7a7',far);
  }
  if(goal){const a=goal.center,hw=goal.halfWidth,hh=goal.halfHeight;paint(a.x-hw,a.y-hh,hw*2,hh*2,'#d6b55e','far');}
  const panel=group('stadium36-readable-scoreboard',s,{architectureRole:'plane-trim',architecturalShell:true,bounds:{minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z}});
  return [panel];
}

function chair(s,x,y,z,index,solidId,row){
  const w=.48,d=.43,tag={architecturePart:'seat',supportSolidId:solidId,chairWidth:w,tier:row};
  // Seat pan, low curved back, and one central support retain the real chair
  // scale. Dense rows replace one lonely chair every several metres.
  flat(s,x-w/2,y+.43,z-d/2,w,d,index%7===0?'#769b8b':palette.seat,tag);
  s.push(face([p(x-w/2,y+.43,z+d/2),p(x+w/2,y+.43,z+d/2),p(x+w/2-.025,y+.82,z+d/2+.04),p(x-w/2+.025,y+.82,z+d/2+.04)],palette.seatBack,tag));
}
function spectator(s,x,y,z,index,tag,detail=false){
  const skin=['#dab592','#c79c7b','#e2bd99'][index%3],shirt=['#d8d1b5','#92b0a0','#a3b1b2','#c3a075','#e4dfc6'][index%5],trousers=['#657d70','#819589','#899390'][index%3];
  const m={...tag,architecturePart:'seated-spectator'};
  // Visible bent knees and the head above the backrest make the posture read
  // as seated, even at the thrower's small projected spectator scale.
  box(s,x-.15,y+.45,z-.07,.30,.43,.23,shirt,m);
  ellipsoid(s,p(x,y+1.01,z+.035),.115,.145,.105,skin,6,2,m);
  if(index%3===0){flat(s,x-.14,y+1.12,z-.07,.28,.23,'#446f6a',m);flat(s,x-.10,y+1.10,z-.19,.20,.12,'#446f6a',m);}
  else s.push(face([p(x-.1,y+1.085,z-.065),p(x+.1,y+1.085,z-.065),p(x+.11,y+1.14,z+.035),p(x-.11,y+1.14,z+.035)],'#746c58',m));
  for(const side of [-1,1]){
    const hip=p(x+side*.07,y+.49,z),knee=p(x+side*.09,y+.39,z-.25),foot=p(x+side*.09,y+.08,z-.27);
    for(const [a,b] of [[hip,knee],[knee,foot]])s.push(face([p(a.x-.035,a.y,a.z),p(a.x+.035,a.y,a.z),p(b.x+.035,b.y,b.z),p(b.x-.035,b.y,b.z)],trousers,m));
    if(detail)line(s,p(x+side*.16,y+.79,z),p(x+side*.16,y+.53,z-.17),shade(shirt,-18),m);
  }
}
function standSeating(world){
  const s=[],terraces=world.stands?.solids?.filter(q=>q.kind==='stand-terrace')??world.solids.filter(q=>q.kind==='stand-terrace'),actors=world.actors??[],tag={architecturePart:'terrace-trim',planeOnly:true};
  for(const c of world.solids.filter(q=>['outfield-fence','fence-return'].includes(q.kind))){
    const zz=c.min.z-.004;
    for(let x=c.min.x+.03;x<c.max.x-.02;x+=1){const w=Math.min(.96,c.max.x-x-.02);if(w>0)s.push(face([p(x,.14,zz),p(x+w,.14,zz),p(x+w,c.max.y-.12,zz),p(x,c.max.y-.12,zz)],'#3f857b',{architecturePart:'outfield-padding',sourceSolidId:c.id,planeOnly:true}));}
    flat(s,c.min.x,c.max.y+.003,c.min.z,c.max.x-c.min.x,c.max.z-c.min.z,'#dcd0ad',{architecturePart:'fence-top',sourceSolidId:c.id,planeOnly:true});
  }
  let count=0;
  for(const [row,c] of terraces.entries()){
    const y=c.max.y,z=c.seatZ??(c.min.z+c.max.z)/2,meta={...tag,sourceSolidId:c.id};
    flat(s,c.min.x,y+.003,c.min.z,c.max.x-c.min.x,Math.min(.08,c.max.z-c.min.z),palette.step,meta);
    const width=c.max.x-c.min.x,countInRow=Math.floor((width-.16)/.58);
    for(let i=0;i<countInRow;i++){
      const x=c.min.x+.10+(i+.5)*(width-.20)/countInRow;
      // Two radial access aisles use each row's actual tread. The opening
      // gives an uninterrupted visible stair run rather than a random gap.
      if(Math.abs(Math.abs(x)-7)<.6||Math.abs(Math.abs(x)-17.2)<.6)continue;
      if((world.stands.targetSeats??[]).some(t=>Math.abs(t.x-x)<.35&&Math.abs(t.z-z)<.6&&Math.abs(t.y-y)<.2))continue;
      chair(s,x,y,z,count,c.id,row);
      const occupied=actors.some(a=>Math.abs(a.position.x-x)<.36&&Math.abs(a.position.z-z)<.66&&Math.abs(a.position.y-y)<.3);
      if(!occupied&&(count+row)%6===1)spectator(s,x,y,z,count,{supportSolidId:c.id,tier:row},row<3);
      count++;
    }
  }
  for(const c of world.solids.filter(c=>c.kind==='chair-pan'||c.kind==='chair-back')){
    const a=c.min,b=c.max,actor=world.actors.find(q=>q.id===c.receiverActorId);
    box(s,a.x,a.y,a.z,b.x-a.x,b.y-a.y,b.z-a.z,c.kind==='chair-pan'?palette.seat:palette.seatBack,{solidId:c.id,receiverActorId:c.receiverActorId,architecturePart:'target-chair',supportSolidId:actor?.supportSolidId,chairWidth:.48});
  }
  for(const seat of world.stands.targetSeats??[])beam(s,p(seat.x,seat.y+.025,seat.z),p(seat.x,seat.y+.40,seat.z),.028,palette.steel,{architecturePart:'target-chair-base'});
  // Concrete aisle stairs split every physical riser into modest steps.
  // They are ornamental only within the already solid grandstand envelope.
  for(const x of [-17.2,-7,7,17.2]){
    const rows=terraces.filter(c=>x>c.min.x+.48&&x<c.max.x-.48).toSorted((a,b)=>a.min.z-b.min.z);
    let prior=rows[0]?.max.y??0;
    for(const c of rows){
      const rise=c.max.y-prior,n=Math.max(1,Math.ceil(Math.max(.01,rise)/.18)),stepDepth=(c.max.z-c.min.z)/n;
      for(let i=0;i<n;i++)flat(s,x-.47,prior+rise*(i+1)/n+.005,c.min.z+i*stepDepth,.94,stepDepth,palette.step,{architecturePart:'aisle-stair',supportSolidId:c.id});
      const a=p(x,c.max.y+.80,c.min.z),b=p(x,c.max.y+.80,c.max.z);line(s,a,b,palette.steel,{architecturePart:'aisle-handrail'});
      prior=c.max.y;
    }
  }
  return group('stadium36-raked-chair-rows-and-aisles',s,{architectureRole:'seating'});
}
function surroundings(world){
  const s=[],terraces=world.solids.filter(c=>c.kind==='stand-terrace'),back=Math.max(...terraces.map(c=>c.max.z)),height=Math.max(...terraces.map(c=>c.max.y)),m={architecturePart:'concourse',outsidePlayArea:true};
  box(s,-28,0,back+.08,56,height+1.25,.65,'#d6cfb6',m);box(s,-28,height+.4,back+.065,56,.26,.69,'#729a8b',m);
  for(let x=-25;x<=25;x+=5){box(s,x-.54,height-.65,back-.02,1.08,1.58,.18,'#628177',{...m,architecturePart:'concourse-entry'});line(s,p(x-.52,height+.93,back-.04),p(x+.52,height+.93,back-.04),'#e3d7b8',m);}
  return group('stadium36-outfield-concourse',s,{architectureRole:'background',bounds:bounds(s)});
}
export function ballparkArchitectureGroups(world){
  if(world?.worldVersion!==36||world.stageId!=='outdoor-baseball')return [];
  return [standSeating(world),surroundings(world),...scoreboard(world)];
}

// A small asymmetric leather glove: folded finger crown, thumb-web and a
// shallow cup. Its complete silhouette is .24 m by .32 m, not a stretched hand.
function glove(s,center,meta={}){
  const at=(x,y,d=0)=>p(center.x+x*.52,center.y+y*.59,center.z-d*.65),outline=[[-.13,-.24],[-.21,-.14],[-.23,.03],[-.21,.20],[-.17,.28],[-.095,.30],[-.025,.285],[.035,.26],[.09,.20],[.12,.09],[.175,.125],[.23,.08],[.22,-.025],[.17,-.11],[.075,-.21],[.06,-.24]],tag={...meta,mittPart:'leather-shell',normalSizeGlove:true};
  const inner=outline.map(([x,y])=>[x*.59,y*.57]);
  for(let i=0;i<outline.length;i++){
    const j=(i+1)%outline.length,a=outline[i],b=outline[j],u=inner[i],v=inner[j];
    s.push(face([at(...a,.015),at(...b,.015),at(...v,.06),at(...u,.06)],shade(palette.leather,i<8?11:-7),tag));
    s.push(face([at(...a,.015),at(...b,.015),at(...b,-.055),at(...a,-.055)],'#8c653e',tag));
  }
  s.push(face(inner.map(([x,y])=>at(x,y,-.034)),'#7e5a37',{...meta,mittPart:'pocket',normalSizeGlove:true}));
  // Finger folds are seams on one compact crown, never separate rods.
  for(const x of [-.15,-.09,-.028,.03])line(s,at(x,.115,.060),at(x-.01,.252,.03),'#e0c399',{...meta,mittPart:'finger-seam',normalSizeGlove:true});
  for(let i=0;i<3;i++){line(s,at(.08+i*.025,.09,.064),at(.105+i*.026,.165,.025),'#d7b785',{...meta,mittPart:'web-lacing'});line(s,at(.08,.085+i*.025,.06),at(.18,.11+i*.014,.035),'#cba16c',{...meta,mittPart:'web-lacing'});}
  for(let i=0;i<outline.length;i+=2){const a=outline[i],b=outline[(i+1)%outline.length];line(s,at(a[0]*.93,a[1]*.93,.027),at(b[0]*.93,b[1]*.93,.027),palette.stitch,{...meta,mittPart:'edge-lace'});}
  s.push(face([at(-.13,-.24,.02),at(.06,-.24,.02),at(.055,-.19,.047),at(-.12,-.19,.047)],'#be9861',{...meta,mittPart:'wrist-cuff'}));
}
function catcher(s,actor,goal,capture){
  const caught=capture?.goalId===goal.id,base=actor.position,q=caught?p(base.x+(capture.position.x-base.x)*.48,base.y+Math.max(0,capture.position.y-base.y-1.35),base.z):base,skin=actor.appearance?.skin??palette.skin,index=Number(actor.id.match(/\d+/)?.[0]??0),meta={actorId:actor.id,stadiumFan:true,stadiumFacing:p(0,0,-1),supportSolidId:actor.supportSolidId,catchPose:caught?'reach-and-catch':'seated-ready'};
  const gloveCenter=caught?{...capture.position,z:capture.position.z+.025}:p(q.x+.14,q.y+1.23,q.z-.35),hip=p(q.x,q.y+.51,q.z+.025),head=p(q.x,q.y+1.03,q.z+.025),shirt=['#e8e0c6','#93aca0','#bd9b73','#94a9ab','#e4d8b6'][index%5];
  box(s,q.x-.185,q.y+.50,q.z-.105,.37,.39,.26,shirt,{...meta,visitorPart:'seated-jersey'});
  ellipsoid(s,head,.13,.16,.12,skin,8,3,{...meta,visitorPart:'head'});
  flat(s,q.x-.155,q.y+1.16,q.z-.12,.31,.27,'#416f69',{...meta,visitorPart:'cap'});flat(s,q.x-.12,q.y+1.15,q.z-.25,.24,.14,'#416f69',{...meta,visitorPart:'cap-brim'});
  for(const side of [-1,1]){
    const knee=p(q.x+side*.11,q.y+.40,q.z-.31),foot=p(q.x+side*.11,q.y+.07,q.z-.34),shoulder=p(q.x+side*.18,q.y+.81,q.z-.045),wrist=p(gloveCenter.x+side*.025,gloveCenter.y-.125,gloveCenter.z+.02),elbow=p((shoulder.x+wrist.x)/2+side*.06,(shoulder.y+wrist.y)/2-.08,(shoulder.z+wrist.z)/2);
    beam(s,p(hip.x+side*.09,hip.y,hip.z),knee,.065,'#657e72',{...meta,visitorPart:'bent-thigh'});beam(s,knee,foot,.049,'#657e72',{...meta,visitorPart:'shin'});box(s,foot.x-.055,foot.y-.035,foot.z-.13,.11,.065,.20,'#ded7be',{...meta,visitorPart:'shoe'});
    beam(s,shoulder,elbow,.055,shirt,{...meta,visitorPart:'sleeve'});beam(s,elbow,wrist,.036,skin,{...meta,visitorPart:'reaching-arm'});
  }
  glove(s,gloveCenter,{...meta,goalId:goal.id,goalRole:goal.role,goalKind:goal.kind,catchGesture:caught?'hold-actual-captured-ball':'wait-for-home-run'});
}
function pitcher(s,world,time,options){
  const actor=world.actors?.find(a=>a.kind==='pitcher'),q=actor?.position??world.pitcher?.position??p(0,.08,7),meta={actorId:actor?.id??'stadium-pitcher',ballparkPitcher:true},pitch=options.baseballPitch??{},progress=Math.max(0,Math.min(1,(pitch.elapsed??0)/(pitch.duration??.65))),active=!!pitch.active&&['windup','delivery','impact'].includes(pitch.phase);
  const shift=active?Math.sin(progress*Math.PI)*.10:0,head=p(q.x,q.y+1.56,q.z),hip=p(q.x,q.y+.78,q.z);
  box(s,q.x-.18,q.y+.85,q.z-.12,.36,.52,.27,palette.white,{...meta,pitcherPart:'uniform'});ellipsoid(s,head,.12,.15,.11,palette.skin,8,3,{...meta,pitcherPart:'head'});
  flat(s,q.x-.15,q.y+1.68,q.z-.12,.30,.25,palette.teal,{...meta,pitcherPart:'cap'});flat(s,q.x-.10,q.y+1.66,q.z-.23,.20,.12,palette.teal,{...meta,pitcherPart:'cap-brim'});
  for(const side of [-1,1]){
    const knee=p(q.x+side*.13,q.y+.40+(side===-1?shift:0),q.z+side*.12),foot=p(q.x+side*.17,q.y+.05,q.z+side*.16),shoulder=p(q.x+side*.18,q.y+1.23,q.z),wrist=side<0?p(q.x-.12,q.y+1.07,q.z-.24):active?p(q.x+.23+progress*.08,q.y+1.22+Math.sin(progress*Math.PI)*.42,q.z+.30-progress*.76):p(q.x+.15,q.y+1.04,q.z-.20),elbow=p((shoulder.x+wrist.x)/2+side*.08,(shoulder.y+wrist.y)/2-.07,(shoulder.z+wrist.z)/2);
    beam(s,p(hip.x+side*.09,hip.y,hip.z),knee,.07,palette.white,{...meta,pitcherPart:'trousers'});beam(s,knee,foot,.055,palette.white,{...meta,pitcherPart:'trousers'});box(s,foot.x-.06,foot.y-.03,foot.z-.10,.12,.065,.23,palette.teal,{...meta,pitcherPart:'cleat'});
    beam(s,shoulder,elbow,.065,palette.white,{...meta,pitcherPart:'sleeve'});beam(s,elbow,wrist,.034,palette.skin,{...meta,pitcherPart:'pitching-arm'});
    if(side<0)glove(s,p(wrist.x,wrist.y+.09,wrist.z-.025),{...meta,pitcherPart:'fielding-glove'});
  }
  line(s,p(q.x,q.y+.87,q.z-.127),p(q.x,q.y+1.33,q.z-.127),palette.teal,{...meta,pitcherPart:'jersey-seam'});
  if(pitch.ballPosition)ellipsoid(s,pitch.ballPosition,.0365,.0365,.0365,'#fff4db',8,3,{ballparkPitchedBall:true});
}
export function ballparkMotionShapes(world,time,options={}){
  if(world?.worldVersion!==36||world.stageId!=='outdoor-baseball')return [];
  const s=[];for(const actor of world.actors??[]){const goal=world.goals.find(g=>g.receiverActorId===actor.id||g.id===actor.mittGoalId);if(goal)catcher(s,actor,goal,options.capture);}
  pitcher(s,world,time,options);return s;
}
