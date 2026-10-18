// World 34 uses metre-sized receivers: the close goal camera, rather than a
// giant cup, makes them readable. These meshes do not add contact surfaces.
const p=(x,y,z)=>({x,y,z});
const shade=(c,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(c.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const face=(points,fill,meta={})=>({points,fill,stroke:null,...meta});
const line=(s,a,b,c,meta={})=>s.push({points:[a,b],line:true,stroke:c,...meta});
const flat=(s,x,y,z,w,d,c,m={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],c,m));
function box(s,x,y,z,w,h,d,c,m={}){
  const a=p(x,y,z),b=p(x+w,y,z),e=p(x+w,y,z+d),f=p(x,y,z+d),A=p(x,y+h,z),B=p(x+w,y+h,z),E=p(x+w,y+h,z+d),F=p(x,y+h,z+d);
  for(const [q,n] of [[[a,b,B,A],0],[[b,e,E,B],-11],[[e,f,F,E],-4],[[f,a,A,F],6],[[A,B,E,F],14],[[f,e,b,a],-16]])s.push(face(q,shade(c,n),m));
}
function loft(s,x,y,z,rx0,rz0,rx1,rz1,h,c,m={},n=10,cap=true){
  const ring=(yy,rx,rz)=>Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*rx,yy,z+Math.sin(i/n*Math.PI*2)*rz)),a=ring(y,rx0,rz0),b=ring(y+h,rx1,rz1);
  for(let i=0;i<n;i++)s.push(face([a[i],a[(i+1)%n],b[(i+1)%n],b[i]],shade(c,Math.round(Math.cos(i/n*Math.PI*2)*9)),m));
  if(cap)s.push(face(b,shade(c,12),m));
}
function ellipsoid(s,x,y,z,rx,ry,rz,c,m={},n=8,rows=4){
  const at=(a,b)=>p(x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,c0=-Math.PI/2+j/rows*Math.PI,d=-Math.PI/2+(j+1)/rows*Math.PI;s.push(face([at(a,c0),at(b,c0),at(b,d),at(a,d)],shade(c,Math.round(Math.sin((c0+d)/2)*10+Math.cos(a)*4)),m));}
}
function beam(s,a,b,r,c,m={}){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz)||1,n=p(dx/l,dy/l,dz/l),h=Math.hypot(n.x,n.z),u=h>1e-8?p(n.z/h,0,-n.x/h):p(1,0,0),v=p(n.y*u.z-n.z*u.y,n.z*u.x-n.x*u.z,n.x*u.y-n.y*u.x),ring=q=>Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2;return p(q.x+r*(u.x*Math.cos(a)+v.x*Math.sin(a)),q.y+r*(u.y*Math.cos(a)+v.y*Math.sin(a)),q.z+r*(u.z*Math.cos(a)+v.z*Math.sin(a)));}),A=ring(a),B=ring(b);
  for(let i=0;i<6;i++)s.push(face([A[i],A[(i+1)%6],B[(i+1)%6],B[i]],shade(c,i%2?-5:5),m));
}
const bounds=s=>{const b={};for(const k of ['x','y','z']){const a=s.flatMap(q=>q.points.map(v=>v[k])),K=k.toUpperCase();b['min'+K]=Math.min(...a);b['max'+K]=Math.max(...a);}return b;};
const group=(id,shapes,extra={})=>({id,object:id,shapes,physical:false,...extra});
const P={cream:'#f4ead5',wall:'#eee2c6',wood:'#c89b61',teal:'#4a948b',dark:'#286864',gold:'#e8b54e',green:'#8caf7d',skin:'#e5c4a0'};

function floorAndGalleries(world){
  const s=[],source=[],r=world.room;
  // A 60 cm tile grid and human-height rails give an immediate scale cue.
  for(let x=r.minX;x<r.maxX;x+=.6)for(let z=r.minZ;z<r.maxZ;z+=.6)flat(s,x,.005,z,Math.min(.6,r.maxX-x),Math.min(.6,r.maxZ-z),Math.round((x+z)/.6)%2?'#eee3cb':'#e4d7bc',{mallPart:'tile'});
  for(let x=r.minX;x<=r.maxX;x+=.6)line(s,p(x,.006,r.minZ),p(x,.006,r.maxZ),'#d4c7a8');
  for(let z=r.minZ;z<=r.maxZ;z+=.6)line(s,p(r.minX,.006,z),p(r.maxX,.006,z),'#d4c7a8');
  for(const c of world.solids.filter(c=>c.kind==='balcony')){
    const into=c.id==='mall-source-balcony'?source:s,y=c.max.y+.002,m={mallPart:'gallery-trim',sourceSolidId:c.id};
    flat(into,c.min.x,y,c.min.z,c.max.x-c.min.x,c.max.z-c.min.z,'#eee1c3',m);
    for(let z=c.min.z+.4;z<c.max.z;z+=.6)line(into,p(c.min.x+.025,y+.001,z),p(c.max.x-.025,y+.001,z),'#d0c4a4',m);
    // The contrasting edge follows the actual floor, not a painted landing hint.
    box(into,c.min.x,c.min.y+.03,c.min.z,c.max.x-c.min.x,.065,.025,P.wood,m);
  }
  // Store galleries outside the actual atrium are a deliberate cutaway: their
  // unplayable back halves remain outside x=±6, with a continuous vertical grid.
  for(const side of [-1,1]){
    const x=side<0?-8:-.0+6;
    for(const y of [0,2.3,4.5,7.3]){
      box(s,x,y-.18,-2.5,2,.18,9,P.wall,{mallPart:'outer-gallery',outsidePlayArea:true});
      for(const z of [-2.45,.65,3.8,6.25])box(s,side<0?-6.12:6.04,y+.005,z,.08,Math.min(2.1,10.45-y),.10,'#d5c7a9',{mallPart:'gallery-post',outsidePlayArea:true});
      for(const zz of [-2.3,5.92])box(s,x,y+.15,zz,2,.70,.48,'#d9c39a',{mallPart:'gallery-bench',outsidePlayArea:true});
      // Transparent panels and solid handrails, roughly one metre high.
      const gx=side<0?-6.035:6.035;
      s.push(face([p(gx,y+.12,-2.42),p(gx,y+.12,6.20),p(gx,y+1.02,6.20),p(gx,y+1.02,-2.42)],'rgba(160,196,185,.15)',{mallPart:'outer-glass',depthWrite:false,outsidePlayArea:true}));
      beam(s,p(gx,y+1.04,-2.42),p(gx,y+1.04,6.20),.025,P.wood,{mallPart:'outer-handrail',outsidePlayArea:true});
    }
    for(const z of [-2.5,.62,3.75,6.30]){
      box(s,side<0?-8.10:8.0,0,z,.15,10.6,.20,'#d2c5a7',{mallPart:'colonnade',outsidePlayArea:true});
      box(s,side<0?-8.17:7.93,10.40,z-.06,.29,.18,.32,'#b9bca2',{mallPart:'column-cap',outsidePlayArea:true});
    }
  }
  for(const c of world.solids.filter(c=>/^mall-source-(left|right)-rail$/.test(c.id))){
    const m={mallPart:'source-real-glass-rail',sourceSolidId:c.id},w=c.max.x-c.min.x;
    box(source,c.min.x,c.max.y-.038,c.min.z,w,.038,c.max.z-c.min.z,P.wood,m);
    box(source,c.min.x,c.min.y,c.min.z,w,.025,c.max.z-c.min.z,'#afbdac',m);
    for(let x=c.min.x;x<c.max.x-.03;x+=.72)box(source,x,c.min.y,c.min.z,.03,c.max.y-c.min.y,c.max.z-c.min.z,'#8eaaa0',m);
  }
  return [group('mall34-metre-tile-and-continuous-galleries',s),group('mall34-source-floor-and-rail-trim',source,{sourceBalcony:true,architecturalShell:true,bounds:bounds(source)})];
}
function storefronts(world){
  const s=[],wall=world.solids.find(c=>c.id==='mall-back-wall'),z=wall.min.z-.016,m={mallPart:'shop-front',sourceSolidId:wall.id};
  const panel=(x,y,w,h,c)=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],c,m));
  for(const [level,y] of [[0,0],[1,2.3],[2,4.5],[3,7.3]])for(const [bay,x] of [[0,-5.74],[1,-2.88],[2,.10],[3,3.18]]){
    const w=2.44,h=level===3?2.22:1.86,theme=(level+bay)%4,colors=[P.teal,'#b1906d','#a5b18c','#ae8790'];
    panel(x,y+.12,w,h,'#a9c3b4');
    box(s,x-.065,y+h+.12,z-.01,w+.13,.23,.11,colors[theme],m);
    // Shop logotypes remain small, applied to their fascia. Geometric marks
    // avoid claiming an actual retailer while giving each shop an identity.
    const letters=[3,4,5,4][theme];for(let k=0;k<letters;k++){const lx=x+.34+k*.36;panel(lx,y+h+.21,.20,.045,P.cream);panel(lx,y+h+.16,.038,.13,P.cream);if(k%2)panel(lx+.16,y+h+.16,.038,.13,P.cream);}
    for(const dx of [0,.82,1.65,2.40])box(s,x+dx,y+.12,z-.021,.04,h,.035,'#ddd6ba',m);
    box(s,x,y+.12,z-.021,w,.04,.035,P.cream,m);
    box(s,x+.97,y+.72,z-.043,.055,.19,.02,P.wood,m);
    // Recognizable stock at human scale: books, shoe displays, dresses, cakes.
    for(let k=0;k<3;k++){
      const qx=x+.23+k*.76,qz=z-.044;
      if(theme===0){
        for(let row=0;row<2;row++){box(s,qx,y+.43+row*.40,qz,.52,.035,.035,P.wood,m);for(let b=0;b<4;b++)box(s,qx+.032+b*.105,y+.465+row*.40,qz-.011,.08,.25-.025*(b%2),.018,['#8da993','#dab675','#b78874','#94b5b2'][b],{...m,mallPart:'book-spines'});}
      }else if(theme===1){
        box(s,qx,y+.37,qz,.52,.38,.025,'#ddc9a4',m);
        for(const dx of [.08,.29]){ellipsoid(s,qx+dx,y+.81,qz-.028,.055,.065,.016,'#e9c394',{...m,mallPart:'cake'});box(s,qx+dx-.06,y+.76,qz-.022,.12,.025,.025,'#f0dfbf',m);}
        panel(qx+.12,y+1.12,.31,.19,'#efe1bc');
      }else if(theme===2){
        for(const yy of [.48,1.04]){box(s,qx,y+yy-.02,qz,.5,.035,.03,P.wood,m);for(const dx of [.12,.35]){ellipsoid(s,qx+dx,y+yy+.08,qz-.012,.08,.055,.029,dx<.2?'#d6b378':'#869f94',{...m,mallPart:'shoe'});}}
      }else{
        beam(s,p(qx+.26,y+.30,qz),p(qx+.26,y+1.44,qz),.014,'#b7b7a0',m);
        s.push(face([p(qx+.26,y+1.32,qz-.026),p(qx+.10,y+1.16,qz-.026),p(qx+.05,y+.68,qz-.026),p(qx+.47,y+.68,qz-.026),p(qx+.42,y+1.16,qz-.026)],k%2?'#b57d70':'#94ae90',{...m,mallPart:'dress-display'}));
      }
    }
  }
  // Thin architectural bands align all galleries, preventing floating floors.
  for(const y of [2.27,4.47,7.27,10.2])box(s,-6,y,z-.032,12,.11,.05,'#c4b799',m);
  for(const x of [-3.15,-.11,2.93])box(s,x,0,z-.02,.15,10.35,.06,'#d8caae',m);
  // Clerestory glass, ceiling pendants and hanging textile banners give the
  // upper storey a recognizable mall roof line, all within the real back wall.
  for(let x=-5.6;x<5.7;x+=1.28){panel(x,9.95,1.13,.36,'#bfd4c6');box(s,x,9.95,z-.025,.028,.36,.028,'#97b2a4',m);}
  for(const [x,c] of [[-4.30,'#b8a06c'],[1.30,'#8eab96']]){
    box(s,x,8.65,z-.056,.42,1.08,.02,c,{...m,mallPart:'textile-banner'});
    for(const yy of [8.85,9.0,9.15])line(s,p(x+.07,yy,z-.080),p(x+.34,yy,z-.080),'#eae1c0',{...m,mallPart:'banner-symbol'});
  }
  for(const x of [-4.70,-1.40,1.75,4.80]){
    beam(s,p(x,10.35,z-.11),p(x,10.04,z-.11),.008,'#96a597',{...m,mallPart:'pendant-cord'});
    loft(s,x,9.98,z-.11,.085,.085,.038,.038,.065,'#e4bf75',{...m,mallPart:'ceiling-pendant'},10);
  }
  return group('mall34-shops-with-human-scale-stock',s,{architecturalShell:true,bounds:bounds(s)});
}
function escalatorsAndFurnishings(){
  const s=[],m={mallPart:'escalator',outsidePlayArea:true};
  for(const side of [-1,1]){
    const x=side<0?-7.64:6.55,fromY=.15,fromZ=-1.92,rise=2.13,run=3.8,n=16,w=.90;
    // Actual treads, return base, a curved handrail end and glass balustrades
    // distinguish an escalator from a loose stack of floating stairs.
    for(let i=0;i<n;i++){const y=fromY+rise*i/n,z=fromZ+run*i/n;box(s,x,y,z,w,.06,run/n+.009,i%2?'#b1bdad':'#94a99e',m);line(s,p(x+.025,y+.061,z+.04),p(x+w-.025,y+.061,z+.04),'#d0d6bd',m);}
    for(const dx of [0,w]){
      const a=p(x+dx,fromY+.70,fromZ-.18),b=p(x+dx,fromY+rise+.70,fromZ+run+.18);
      s.push(face([p(a.x,a.y-.57,a.z),p(b.x,b.y-.57,b.z),b,a],'rgba(156,188,174,.24)',{...m,depthWrite:false}));
      beam(s,a,b,.035,P.dark,m);
      ellipsoid(s,a.x,a.y-.08,a.z,.038,.10,.105,P.dark,m,6,3);ellipsoid(s,b.x,b.y-.08,b.z,.038,.10,.105,P.dark,m,6,3);
    }
    box(s,x,fromY-.05,fromZ-.45,w,.11,.53,'#8ea496',m);box(s,x,fromY+rise-.03,fromZ+run-.02,w,.09,.46,'#8ea496',m);
  }
  for(const x of [-4.9,4.9])for(const z of [-1.9,5.5]){
    const q={mallPart:'planter'};loft(s,x,0,z,.25,.25,.31,.31,.46,'#c2a775',q,8);loft(s,x,.46,z,.29,.29,.26,.26,.035,'#7b7952',q,8);
    for(const [dx,dz,h] of [[-.16,-.06,.63],[.10,.08,.92],[.03,-.17,.75]]){beam(s,p(x,.49,z),p(x+dx,.49+h,z+dz),.017,'#8fa478',q);ellipsoid(s,x+dx,.58+h,z+dz,.22,.25,.18,'#91b381',q,6,3);}
  }
  // A curved directory kiosk and a normal 45 cm bench anchor the ground floor.
  loft(s,-4.4,0,.1,.46,.18,.46,.18,.65,P.teal,{mallPart:'directory-kiosk'},12);
  box(s,-4.64,.65,-.015,.48,.38,.035,P.wood,{mallPart:'directory-kiosk'});
  for(const yy of [.73,.85,.97])line(s,p(-4.59,yy,-.054),p(-4.23,yy,-.054),'#e8dfbf',{mallPart:'directory-map'});
  for(const z of [1.7,2.2]){box(s,4.35,.39,z,1.1,.075,.30,P.wood,{mallPart:'bench'});for(const x of [4.42,5.23])box(s,x,0,z+.02,.045,.39,.22,'#749384',{mallPart:'bench-leg'});}
  // Café tables and ordinary chairs occupy the gallery outside the throwing
  // volume; their 72 cm table tops give another familiar size reference.
  for(const side of [-1,1])for(const z of [.9,3.3]){
    const x=side*7.05,m={mallPart:'gallery-cafe',outsidePlayArea:true};
    loft(s,x,0,z,.04,.04,.04,.04,.69,'#91a596',m,8);loft(s,x,.69,z,.31,.31,.31,.31,.035,P.wood,m,14);
    for(const dz of [-.57,.57]){box(s,x-.19,.42,z+dz-.15,.38,.04,.30,'#9bb399',m);box(s,x-.19,.46,z+dz+(dz>0?.12:-.15),.38,.33,.035,'#9bb399',m);for(const dx of [-.14,.14])for(const zz of [-.11,.11])box(s,x+dx-.015,0,z+dz+zz,.03,.42,.03,'#7e9786',m);}
  }
  const roof=[];
  for(const z of [-2.60,-.3,2,4.3,6.60])beam(roof,p(-8.10,10.66,z),p(8.10,10.66,z),.047,'#8ca69b',{mallPart:'skylight',outsidePlayArea:true,depthWrite:false});
  for(const x of [-8.10,8.10])beam(roof,p(x,10.66,-2.6),p(x,10.66,6.60),.05,'#8ca69b',{mallPart:'skylight',outsidePlayArea:true,depthWrite:false});
  return [group('mall34-real-escalators-planters-and-seats',s),group('mall34-open-skylight',roof,{architecturalShell:true,bounds:bounds(roof)})];
}
function customer(s,actor,goal){
  const q=actor.position,h=actor.height,child=actor.kind==='child',sx=actor.width/.44,sy=h/1.68,sz=actor.depth/.34,c=actor.color??P.teal,model=[],meta=part=>({actorId:actor.id,mallActorPart:part});
  loft(model,0,.64,0,.147,.09,.202,.11,.47,c,meta('clothing'),8);
  loft(model,0,.60,0,.16,.095,.15,.095,.09,shade(c,-9),meta('hem'),8);
  // Collar, zipper, backpack strap and pockets distinguish separate garments.
  line(model,p(0,.69,-.096),p(0,1.07,-.11),shade(c,-17),meta('garment-seam'));
  for(const side of [-1,1]){
    beam(model,p(side*.078,.095,0),p(side*.078,.59,0),.052,child?'#718b77':'#6c8278',meta('trousers'));
    ellipsoid(model,side*.078,.065,-.025,.067,.047,.105,'#657360',meta('shoes'),8,3);
    line(model,p(side*.078-.034,.10,-.092),p(side*.078+.034,.10,-.092),'#d0cfb2',meta('shoelace'));
  }
  loft(model,0,1.10,0,.05,.045,.05,.045,.13,P.skin,meta('neck'),8);
  ellipsoid(model,0,1.43,-.007,.143,.178,.123,P.skin,meta('face'),10,4);
  const hair=child?'#765a44':actor.id.includes('soda')?'#776052':'#655a48';
  ellipsoid(model,0,1.536,.006,.148,.079,.128,hair,meta('hair-crown'),10,3);
  ellipsoid(model,0,1.421,.077,.145,.141,.068,hair,meta('hair-back'),8,3);
  for(const side of [-1,1]){
    ellipsoid(model,side*.139,1.43,.004,.019,.034,.027,P.skin,meta('ear'),6,2);
    ellipsoid(model,side*.048,1.445,-.126,.008,.010,.004,'#50584a',meta('eye'),6,2);
  }
  ellipsoid(model,0,1.406,-.137,.019,.017,.015,'#d2aa83',meta('nose'),6,2);
  line(model,p(-.023,1.370,-.127),p(.023,1.368,-.127),'#ac7f69',meta('smile'));
  // A small hair clip and tied ponytail make the child read from above, too.
  if(child){ellipsoid(model,.09,1.505,.09,.067,.06,.065,hair,meta('ponytail'),6,3);box(model,.075,1.56,-.09,.050,.025,.02,'#dfba6c',meta('hairclip'));}
  if(actor.id.includes('soda')){beam(model,p(-.15,1.06,.06),p(.14,.66,-.10),.018,'#a98061',meta('bag-strap'));ellipsoid(model,.20,.63,-.065,.09,.115,.045,'#d2b37d',meta('bag'),8,3);}
  for(const shape of model)s.push({...shape,points:shape.points.map(v=>p(q.x+v.x*sx,q.y+v.y*sy,q.z+v.z*sz))});
  for(const side of [-1,1]){
    const shoulder=p(q.x+side*actor.width*.41,q.y+h*.65,q.z-.015),active=child||goal&&(goal.center.x-q.x)*side>0;
    const wrist=active&&goal?p(goal.center.x+side*(child?.026:.010),goal.center.y-(goal.kind==='cone'?.065:.06),goal.center.z+(child?.009:.013)):p(q.x+side*actor.width*.48,q.y+h*.43,q.z-.03);
    const elbow=p(shoulder.x+side*.027,(shoulder.y+wrist.y)/2-.07,(shoulder.z+wrist.z)/2+.025);
    beam(s,shoulder,elbow,child?.026:.047,c,meta('sleeve'));beam(s,elbow,wrist,child?.019:.035,P.skin,meta('forearm'));
    ellipsoid(s,wrist.x,wrist.y,wrist.z,child?.018:.027,child?.025:.037,child?.019:.027,P.skin,meta('holding-hand'),8,3);
    if(active&&goal)for(const offset of [-.009,0,.009])line(s,p(wrist.x+offset,wrist.y+.012,wrist.z-.02),p(wrist.x+offset,wrist.y-.009,wrist.z-.02),'#cba482',meta('fingers'));
  }
  s.push(face(Array.from({length:14},(_,i)=>p(q.x+Math.cos(i/14*Math.PI*2)*actor.width*.64,q.y+.004,q.z+Math.sin(i/14*Math.PI*2)*actor.depth*.72)),'rgba(65,85,57,.12)',{actorShadow:actor.id,depthWrite:false}));
}
function receiver(s,goal,world){
  const q=goal.center,r=goal.radius,n=16,cone=goal.kind==='cone',coffee=goal.kind==='coffee',prop=world.props?.[cone?'cone':coffee?'coffee':'soda'],height=q.y-(prop?.tipY??prop?.bottomY??(q.y-(cone?.15:coffee?.11:.17))),outerRadius=prop?.outerRadius??r+.005,m={goalId:goal.id,goalRole:goal.role,goalKind:goal.kind,mallReceiver:true};
  const ring=(radius,y)=>Array.from({length:n},(_,i)=>p(q.x+Math.cos(i/n*Math.PI*2)*radius,y,q.z+Math.sin(i/n*Math.PI*2)*radius)),outer=ring(outerRadius,q.y),inner=ring(r,q.y),bottom=ring(cone?.005:r*.78,q.y-height);
  for(let i=0;i<n;i++){const j=(i+1)%n;s.push(face([outer[i],outer[j],inner[j],inner[i]],cone?'#d4ab6b':coffee?'#eee1c7':'#b2d6c5',{...m,opening:true}));s.push(face([outer[i],outer[j],bottom[j],bottom[i]],shade(cone?'#d5ad72':coffee?'#f1e4ca':'#add0bf',Math.round(Math.cos(i/n*Math.PI*2)*10)),m));}
  const liquidY=q.y-(cone?.026:.015),liquid=ring(cone?r*.65:r*.92,liquidY);
  s.push(face(liquid,cone?'#b99560':coffee?'#6f4b31':'#91bb9f',m));
  if(cone){
    // Two crossing courses create a waffle lattice at actual cone scale.
    for(let i=0;i<n;i+=2){const j=(i+5)%n,k=(i+11)%n;line(s,outer[i],p((outer[j].x+bottom[j].x)/2,q.y-height*.50,(outer[j].z+bottom[j].z)/2),'#b38b55',{...m,mallReceiverPart:'waffle'});line(s,outer[i],p((outer[k].x+bottom[k].x)/2,q.y-height*.50,(outer[k].z+bottom[k].z)/2),'#b38b55',{...m,mallReceiverPart:'waffle'});}
  }else if(coffee){
    // A normal ceramic handle, not a second target ring.
    const hx=q.x+r+.014,hy=q.y-.046,hz=q.z,pts=Array.from({length:13},(_,i)=>p(hx+Math.sin(i/12*Math.PI)*.025,hy+Math.cos(i/12*Math.PI)*.031,hz));
    for(let i=1;i<pts.length;i++)beam(s,pts[i-1],pts[i],.005,'#e5d5b6',{...m,mallReceiverPart:'handle'});
    line(s,p(q.x-r*.5,q.y-.048,q.z-r*.85),p(q.x+r*.5,q.y-.048,q.z-r*.85),'#bb9d74',m);
  }else{
    beam(s,p(q.x+.017,q.y-.07,q.z+.013),p(q.x+.017,q.y+.040,q.z+.013),.0025,'#f3ead2',{...m,mallReceiverPart:'straw'});
    beam(s,p(q.x+.017,q.y+.040,q.z+.013),p(q.x+.031,q.y+.047,q.z+.013),.0025,'#f3ead2',m);
    for(const [dx,dz] of [[-.014,.01],[.008,-.014]])ellipsoid(s,q.x+dx,q.y-.012,q.z+dz,.008,.005,.009,'#cfe1c9',{...m,mallReceiverPart:'ice'},6,2);
  }
}
export function mallPhysicalGroups(world){
  if(world?.worldVersion!==34||world.stageId!=='outdoor-mall')return [];
  const figures=[];
  for(const actor of world.actors){const goal=world.goals.find(g=>actor.kind==='child'?g.kind==='cone':actor.id.includes('coffee')?g.kind==='coffee':g.kind==='soda');customer(figures,actor,goal);}
  for(const goal of world.goals)receiver(figures,goal,world);
  return [...floorAndGalleries(world),storefronts(world),...escalatorsAndFurnishings(),group('mall34-visitors-and-actual-size-drinks',figures)];
}
