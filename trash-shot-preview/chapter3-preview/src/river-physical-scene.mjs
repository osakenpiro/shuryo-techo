// The river is a cutaway miniature of a real waterfront. Boat/cup dimensions
// stay in metres; emissive lanterns are scenery, never a flight prediction.
const p=(x,y,z)=>({x,y,z});
const shade=(c,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(c.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const face=(points,fill,meta={})=>({points,fill,stroke:null,...meta});
const line=(s,a,b,c,m={})=>s.push({points:[a,b],line:true,stroke:c,...m});
const flat=(s,x,y,z,w,d,c,m={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],c,m));
function box(s,x,y,z,w,h,d,c,m={}){
  const a=p(x,y,z),b=p(x+w,y,z),e=p(x+w,y,z+d),f=p(x,y,z+d),A=p(x,y+h,z),B=p(x+w,y+h,z),E=p(x+w,y+h,z+d),F=p(x,y+h,z+d);
  for(const [q,n] of [[[a,b,B,A],0],[[b,e,E,B],-11],[[e,f,F,E],-4],[[f,a,A,F],6],[[A,B,E,F],14],[[f,e,b,a],-16]])s.push(face(q,shade(c,n),m));
}
function loft(s,x,y,z,r0,r1,h,c,m={},n=12,cap=true){
  const ring=(yy,r)=>Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,yy,z+Math.sin(i/n*Math.PI*2)*r)),a=ring(y,r0),b=ring(y+h,r1);
  for(let i=0;i<n;i++)s.push(face([a[i],a[(i+1)%n],b[(i+1)%n],b[i]],shade(c,Math.round(Math.cos(i/n*Math.PI*2)*9)),m));
  if(cap)s.push(face(b,shade(c,12),m));
}
function ellipsoid(s,x,y,z,rx,ry,rz,c,m={},n=8,rows=3){
  const at=(a,b)=>p(x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,c0=-Math.PI/2+j/rows*Math.PI,d=-Math.PI/2+(j+1)/rows*Math.PI;s.push(face([at(a,c0),at(b,c0),at(b,d),at(a,d)],shade(c,Math.round(Math.sin((c0+d)/2)*10+Math.cos(a)*4)),m));}
}
function beam(s,a,b,r,c,m={}){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz)||1,n=p(dx/l,dy/l,dz/l),h=Math.hypot(n.x,n.z),u=h>1e-8?p(n.z/h,0,-n.x/h):p(1,0,0),v=p(n.y*u.z-n.z*u.y,n.z*u.x-n.x*u.z,n.x*u.y-n.y*u.x),ring=q=>Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2;return p(q.x+r*(u.x*Math.cos(a)+v.x*Math.sin(a)),q.y+r*(u.y*Math.cos(a)+v.y*Math.sin(a)),q.z+r*(u.z*Math.cos(a)+v.z*Math.sin(a)));}),A=ring(a),B=ring(b);
  for(let i=0;i<6;i++)s.push(face([A[i],A[(i+1)%6],B[(i+1)%6],B[i]],shade(c,i%2?-5:5),m));
}
const group=(id,shapes,extra={})=>({id,object:id,shapes,physical:false,...extra});
const bounds=s=>{const b={};for(const k of ['x','y','z']){const a=s.flatMap(q=>q.points.map(v=>v[k])),K=k.toUpperCase();b['min'+K]=Math.min(...a);b['max'+K]=Math.max(...a);}return b;};
function lantern(s,x,y,z,r=.08,actorId=null){
  const m={riverPart:'paper-lantern',emissive:true,...(actorId?{boatDetailId:actorId}:{})};
  ellipsoid(s,x,y,z,r,r*1.48,r,'#f0b96f',m,8,4);
  for(const yy of [-.10,-.04,.04,.10]){const rr=r*Math.sqrt(Math.max(.05,1-(yy/(r*1.48))**2));for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=(i+1)/8*Math.PI*2;line(s,p(x+Math.cos(a)*rr,y+yy,z+Math.sin(a)*rr),p(x+Math.cos(b)*rr,y+yy,z+Math.sin(b)*rr),'#cf9359',m);}}
  loft(s,x,y-r*1.52,z,r*.4,r*.4,.024,'#8e7955',{riverPart:'lantern-cap'},8);beam(s,p(x,y+r*1.50,z),p(x,y+r*2.05,z),.008,'#6e7860',{riverPart:'lantern-hanger'});
}
function tree(s,x,z,scale=1){
  const m={riverPart:'bank-tree',outsidePlayArea:true};beam(s,p(x,.08,z),p(x,1.25*scale,z),.08*scale,'#718878',m);
  for(const [dx,dz,y] of [[-.35,-.10,1.8],[.32,.09,2.0],[.08,.35,1.65]]){beam(s,p(x,.85*scale,z),p(x+dx*scale,y*scale,z+dz*scale),.035*scale,'#718878',m);ellipsoid(s,x+dx*scale,y*scale,z+dz*scale,.58*scale,.57*scale,.54*scale,'#718f76',m,8,3);}
}
function waterfront(world){
  const s=[],w=world.water;
  // Irregular long reflections and small ripples share the actual water plane.
  for(let col=0;col<32;col++)for(let row=0;row<12;row++)flat(s,w.minX+(w.maxX-w.minX)*col/32,w.y+.006,w.minZ+(w.maxZ-w.minZ)*row/12,(w.maxX-w.minX)/32,(w.maxZ-w.minZ)/12,(col+row)%3?'#376775':'#315d6d',{water:true,riverPart:'water'});
  for(let row=0;row<18;row++)for(let col=0;col<7;col++){const x=-15+col*4.8+.3*Math.sin(row),z=1.4+row*.49;line(s,p(x,.012,z),p(x+.58+((col+row)%3)*.12,.012,z+.025),'#5a8a8d',{riverPart:'water-ripple'});}
  for(const [edge,dz,sign] of [[1.12,-.025,-1],[10.61,.025,1]]){
    box(s,-20,-.045,edge+dz,40,.145,.11,'#8b9683',{riverPart:'bank-stone-edge',outsidePlayArea:true});
    for(let x=-19.8;x<20;x+=.68)line(s,p(x,.087,edge+dz-.002),p(x,.087,edge+dz+.10),'#bdbaa0',{riverPart:'edge-stone-joint'});
    flat(s,-20,.071,sign>0?10.72:-2.8,40,sign>0?5.6:3.85,'#8c917a',{riverPart:'outside-bank-path',outsidePlayArea:true});
  }
  // The throwing mat, working crates and safety boundary remain ordinary
  // objects of the same scale as the operator and the 34 cm mortar mouth.
  const o=world.origin;
  flat(s,o.x-.52,.075,o.z-.36,1.04,.58,'#b4a382',{riverPart:'throwing-mat'});
  for(const x of [-1.52,-1.04]){box(s,x,.075,-.28,.38,.30,.35,'#b49a71',{riverPart:'wood-crate'});for(const yy of [.15,.29])line(s,p(x+.015,yy,-.284),p(x+.36,yy,-.284),'#786f55',{riverPart:'crate-slats'});}
  for(const x of [-2.2,2.2]){loft(s,x,.08,.72,.11,.026,.36,'#cd9770',{riverPart:'safety-cone'},8);loft(s,x,.245,.72,.067,.055,.065,'#ece0bd',{riverPart:'cone-stripe'},8);}
  // A bridge at the distant side of this miniature is decoration outside the
  // throwing volume, with an arch, piers, rails and a real walking deck.
  const bx=-11.5;
  for(const z of [2.2,5.5,8.8]){box(s,bx-.22,-.10,z,.44,1.25,.46,'#819789',{riverPart:'bridge-pier',outsidePlayArea:true});}
  box(s,bx-.90,1.14,1.16,1.8,.16,9.50,'#b3b19a',{riverPart:'bridge-deck',outsidePlayArea:true});
  for(const side of [-1,1]){
    const x=bx+side*.83;for(let z=1.22;z<10.6;z+=.62)beam(s,p(x,1.30,z),p(x,2.03,z),.021,'#93aa9b',{riverPart:'bridge-balustrade',outsidePlayArea:true});
    beam(s,p(x,2.04,1.17),p(x,2.04,10.65),.036,'#bbc1a8',{riverPart:'bridge-handrail',outsidePlayArea:true});
  }
  for(const [x,z,scale] of [[-5.0,14.1,1.2],[5.2,14.6,1.1],[-8.1,15.2,1.3],[8.7,14.9,1.0]])tree(s,x,z,scale);
  return group('river35-waterfront-and-stone-embankments',s);
}
function festival(world){
  const s=[],m={riverPart:'festival-far-bank',outsidePlayArea:true};
  // Two stalls, a house, potted shrubs and stringed paper lanterns replace the
  // former anonymous cubes. They stay behind the landing/operator area.
  for(const [x,c] of [[-4.1,'#b8876c'],[3.3,'#7da593']]){
    box(s,x,.075,14.2,1.85,.88,.78,'#ad9169',m);
    for(const side of [0,1.77])beam(s,p(x+side,.075,14.24),p(x+side,2.10,14.24),.035,'#bd9c70',m);
    s.push(face([p(x-.1,2.11,14.12),p(x+1.96,2.11,14.12),p(x+1.96,2.31,14.66),p(x-.1,2.31,14.66)],c,m));
    s.push(face([p(x-.1,2.31,14.66),p(x+1.96,2.31,14.66),p(x+1.96,2.13,15.18),p(x-.1,2.13,15.18)],shade(c,-16),m));
    box(s,x-.05,1.89,14.08,1.95,.20,.035,c,m);
    for(let k=0;k<5;k++)line(s,p(x+.15+k*.35,1.90,14.052),p(x+.15+k*.35,2.07,14.052),'#e9cf9b',m);
    for(let k=0;k<4;k++)ellipsoid(s,x+.22+k*.43,1.03,14.50,.13,.055,.13,['#e7c192','#a1b886','#c49b70','#dcb47e'][k],m,6,2);
    lantern(s,x+.2,1.70,14.04,.08);lantern(s,x+1.56,1.70,14.04,.08);
  }
  // Timber house eaves, roof tiles, shoji panes and warm windows.
  box(s,-1.65,.075,16.5,3.30,2.45,1.7,'#c2b48d',m);
  for(const x of [-1.50,-.46,.60]){
    box(s,x,.80,16.477,.83,1.04,.026,'#9e8f69',m);
    box(s,x+.025,.825,16.463,.78,.99,.014,'#dab878',{...m,emissive:true});
    for(const yy of [1.15,1.49])box(s,x+.02,yy,16.446,.79,.026,.017,'#8b8161',m);
    for(const xx of [x+.25,x+.52])box(s,xx,.82,16.443,.026,1.0,.02,'#8b8161',m);
  }
  s.push(face([p(-1.84,2.51,16.29),p(1.84,2.51,16.29),p(1.84,3.05,17.35),p(-1.84,3.05,17.35)],'#6c8d7d',m));
  s.push(face([p(-1.84,3.05,17.35),p(1.84,3.05,17.35),p(1.84,2.51,18.42),p(-1.84,2.51,18.42)],'#537969',m));
  for(let z=16.36;z<18.4;z+=.27){const y=2.51+.54*(1-Math.abs(z-17.35)/1.06);line(s,p(-1.83,y+.006,z),p(1.83,y+.006,z),'#9ba995',m);}
  const wire=Array.from({length:13},(_,i)=>p(-5.8+i*.97,2.55-.28*Math.sin(i/12*Math.PI),13.55));
  for(let i=1;i<wire.length;i++)line(s,wire[i-1],wire[i],'#a09a79',m);
  for(const i of [0,2,4,6,8,10,12])lantern(s,wire[i].x,wire[i].y-.19,wire[i].z,.065);
  // A quiet moon and its broken reflection are static night scenery.
  ellipsoid(s,4.8,7.5,18.7,.42,.42,.08,'#e2d4ac',{riverPart:'moon',emissive:true},16,6);
  for(let i=0;i<9;i++){const z=3.2+i*.68,x=3.9+.075*Math.sin(i*2.4),w=.16+.045*i;flat(s,x-w/2,.016,z,w,.045,'rgba(208,192,139,.16)',{riverPart:'moon-water-reflection',emissive:true,depthWrite:false});}
  return group('river35-festival-stalls-roofed-house-and-lanterns',s);
}
function tube(s,goal,outerRadius=.205,bottom=.07,part='firework-mortar'){
  const q=goal.center,r=goal.radius,n=20,m={goalId:goal.id,goalRole:goal.role,goalKind:goal.kind,riverPart:part};
  const ring=(rr,y)=>Array.from({length:n},(_,i)=>p(q.x+Math.cos(i/n*Math.PI*2)*rr,y,q.z+Math.sin(i/n*Math.PI*2)*rr)),outer=ring(outerRadius,q.y),inside=ring(r,q.y),low=ring(outerRadius,bottom),innerLow=ring(r,q.y-.14);
  for(let i=0;i<n;i++){const j=(i+1)%n;s.push(face([outer[i],outer[j],inside[j],inside[i]],'#bbac80',{...m,opening:true}));s.push(face([low[i],low[j],outer[j],outer[i]],shade('#758e7e',Math.round(Math.cos(i/n*Math.PI*2)*12)),m));s.push(face([inside[i],inside[j],innerLow[j],innerLow[i]],'#3b5751',m));}
  s.push(face(innerLow,'#304842',m));
  for(const y of [bottom+.12,q.y-.19]){
    const a=ring(outerRadius+.006,y),b=ring(outerRadius+.006,y+.033);for(let i=0;i<n;i++)s.push(face([a[i],a[(i+1)%n],b[(i+1)%n],b[i]],'#afab89',m));
  }
  if(part==='firework-mortar'){
    const centerY=bottom+.11,base={riverPart:'mortar-base',sourceSolidId:'river-tube-body'};
    box(s,q.x-.27,bottom,q.z-.24,.54,.06,.48,'#ad9570',base);
    for(const side of [-1,1])beam(s,p(q.x+side*.26,bottom+.03,q.z-.20),p(q.x+side*.19,q.y-.18,q.z-.08),.028,'#baa779',base);
    box(s,q.x-.065,centerY+.30,q.z-outerRadius-.01,.13,.12,.012,'#ddcba0',{riverPart:'mortar-label'});
    line(s,p(q.x-.041,centerY+.37,q.z-outerRadius-.023),p(q.x+.043,centerY+.37,q.z-outerRadius-.023),'#8b8060',{riverPart:'mortar-label'});
  }
}
function worker(s,actor){
  const q=actor.position,h=actor.height,k=h/1.7,c=actor.color??'#788dad',m={actorId:actor.id,riverPart:'launch-operator'},model=[];
  for(const side of [-1,1]){
    beam(model,p(side*.095,.09,0),p(side*.095,.74,0),.064,'#698274',m);
    ellipsoid(model,side*.095,.07,-.02,.077,.055,.12,'#637967',m,8,3);
  }
  box(model,-.19,.74,-.115,.38,.49,.23,c,m);
  box(model,-.20,.82,-.126,.40,.095,.019,'#d4ba77',{...m,riverPart:'reflective-vest-band',emissive:true});
  for(const x of [-.13,.10])box(model,x,.91,-.127,.033,.28,.019,'#e1cf95',{...m,emissive:true});
  loft(model,0,1.23,0,.060,.055,.12,'#dbba95',m,8);
  ellipsoid(model,0,1.49,0,.145,.165,.12,'#e5c49e',m,10,4);
  ellipsoid(model,0,1.61,.006,.16,.09,.14,'#d0b373',{...m,riverPart:'safety-helmet'},10,3);
  loft(model,0,1.565,-.01,.176,.176,.032,'#c2a265',{...m,riverPart:'helmet-brim'},12);
  for(const side of [-1,1]){
    beam(model,p(side*.205,1.19,0),p(side*.24,1.0,-.035),.053,c,m);
    beam(model,p(side*.24,1.0,-.035),p(side*.18,.83,-.075),.041,'#d6b38c',m);
    ellipsoid(model,side*.18,.80,-.075,.032,.046,.032,'#e1c19c',m,6,3);
    ellipsoid(model,side*.049,1.5,-.123,.008,.011,.005,'#515c50',m,6,2);
  }
  for(const shape of model)s.push({...shape,points:shape.points.map(a=>p(q.x+a.x*k,q.y+a.y*k,q.z+a.z*k))});
}
export function riverPhysicalGroups(world){
  if(world?.worldVersion!==35||world.stageId!=='outdoor-river')return [];
  const landing=[];for(const goal of world.goals.filter(g=>g.role==='normal'))tube(landing,goal,world.props?.tube?.outerRadius??.205,.07);
  for(const actor of world.actors)worker(landing,actor);
  return [waterfront(world),festival(world),group('river35-paper-shell-mortar-and-launch-operator',landing)];
}

function hull(s,boat,top,fill){
  const q=boat.position,w=boat.width,d=boat.depth,m={boatDetailId:boat.id,riverPart:'curved-hull'},sections=boat.hullSections??[[-w/2,-w*.3,d*.25],[-w*.3,w*.3,d*.5],[w*.3,w/2,d*.25]],profile=sections.flatMap(([a,b,half],i)=>[[a/w,(i===0?Math.min(.11,half):Math.min(sections[i-1][2],half))/d],[(a+b)/(2*w),half/d],...(i===sections.length-1?[[b/w,Math.min(.11,half)/d]]:[])]);
  // A pointed stem, sloped sides and a narrower submerged chine are required
  // boat silhouettes; no floating rectangular cabin is used as the hull.
  const upper=profile.map(([x,z])=>p(q.x+x*w,top,q.z+z*d)),lower=profile.map(([x,z])=>p(q.x+x*w*.94,q.y-.045,q.z+z*d*.73)),A=[...upper,...upper.map(a=>p(a.x,a.y,q.z-(a.z-q.z))).reverse()],B=[...lower,...lower.map(a=>p(a.x,a.y,q.z-(a.z-q.z))).reverse()];
  for(let i=0;i<A.length;i++){const j=(i+1)%A.length;s.push(face([B[i],B[j],A[j],A[i]],shade(fill,Math.round((A[i].z-q.z)/d*20)),m));}
  s.push(face(A,'#b7a988',{...m,riverPart:'deck'}));
  for(let i=0;i<A.length;i++){const j=(i+1)%A.length;beam(s,A[i],A[j],.034,'#cfbf9d',{...m,riverPart:'gunwale'});}
  for(const side of [-1,1])for(let i=0;i<profile.length-1;i++){
    const [x0,z0]=profile[i],[x1,z1]=profile[i+1];line(s,p(q.x+x0*w,top-.13,q.z+side*z0*d+.006*side),p(q.x+x1*w,top-.13,q.z+side*z1*d+.006*side),'#bcc4a9',{...m,riverPart:'rubbing-strake'});
  }
  return {m,top};
}
function houseboat(s,boat){
  const q=boat.position,w=boat.width,d=boat.depth,deck=boat.cabin?.floorY??.60,eave=boat.cabin?.eaveY??2.35,ridge=boat.cabin?.ridgeY??2.60,front=q.z-(boat.cabin?.halfDepth??d*.405),back=q.z+(boat.cabin?.halfDepth??d*.405),a=q.x-(boat.cabin?.halfLength??w*.395),b=q.x+(boat.cabin?.halfLength??w*.395);
  const {m}=hull(s,boat,deck,'#9f895f');
  // Shoji window rhythm, glazed doors, timber sills, visible floor and roof
  // overhangs describe a passenger cabin with adult standing headroom.
  box(s,a,deck,front,b-a,.11,back-front,'#c2ab7b',{...m,riverPart:'cabin-floor'});
  for(const zz of [front,back]){
    box(s,a,deck+.11,zz,b-a,.28,.047,'#b39260',{...m,riverPart:'cabin-side'});
    box(s,a,eave-.16,zz,b-a,.14,.047,'#be9f6c',{...m,riverPart:'cabin-lintel'});
    const count=7,gap=(b-a)/count;
    for(let i=0;i<=count;i++)box(s,a+i*gap-.020,deck+.30,zz-.009,.04,eave-deck-.44,.065,'#c8ab77',{...m,riverPart:'window-mullion'});
    for(let i=0;i<count;i++){
      const x=a+i*gap+.040,width=gap-.08;
      s.push(face([p(x,deck+.39,zz-.016),p(x+width,deck+.39,zz-.016),p(x+width,eave-.22,zz-.016),p(x,eave-.22,zz-.016)],i%3?'#d5b175':'#bd9a6f',{...m,riverPart:'warm-cabin-window',emissive:true}));
      for(const yy of [deck+.70,deck+1.04,deck+1.38])line(s,p(x,yy,zz-.028),p(x+width,yy,zz-.028),'#9a865e',{...m,riverPart:'shoji-crossbar'});
      for(const dx of [width/3,width*2/3])line(s,p(x+dx,deck+.39,zz-.029),p(x+dx,eave-.22,zz-.029),'#ad9768',{...m,riverPart:'shoji-lattice'});
      if(i%3===1){ellipsoid(s,x+width*.54,deck+1.0,zz-.031,.10,.13,.018,'#8a7960',{...m,riverPart:'seated-passenger'},6,3);s.push(face([p(x+width*.3,deck+.46,zz-.032),p(x+width*.77,deck+.46,zz-.032),p(x+width*.74,deck+.86,zz-.032),p(x+width*.36,deck+.86,zz-.032)],'#8e8f70',{...m,riverPart:'seated-passenger'}));}
    }
  }
  for(const xx of [a,b])box(s,xx-.02,deck+.11,front,.04,eave-deck-.11,back-front,'#bea16e',{...m,riverPart:'cabin-end'});
  const roofA=q.x-w*.43,roofB=q.x+w*.43,near=q.z-d*.50,far=q.z+d*.50;
  s.push(face([p(roofA,eave,near),p(roofB,eave,near),p(roofB,ridge,q.z),p(roofA,ridge,q.z)],'#779078',{...m,riverPart:'pitched-roof'}));
  s.push(face([p(roofA,ridge,q.z),p(roofB,ridge,q.z),p(roofB,eave,far),p(roofA,eave,far)],'#52766a',{...m,riverPart:'pitched-roof'}));
  for(let xx=roofA+.18;xx<roofB;xx+=.36){line(s,p(xx,eave+.005,near),p(xx,ridge+.005,q.z),'#9aab88',{...m,riverPart:'roof-rib'});line(s,p(xx,ridge+.005,q.z),p(xx,eave+.005,far),'#8ba17e',{...m,riverPart:'roof-rib'});}
  beam(s,p(roofA,ridge,q.z),p(roofB,ridge,q.z),.036,'#9ab28e',{...m,riverPart:'roof-ridge'});
  for(const side of [-1,1])for(const dx of [-.29,0,.29])lantern(s,q.x+w*dx,eave-.25,q.z+side*d*.49,.07,boat.id);
  // A tie-off cleat, coiled rope and fender make the open bow a real deck.
  beam(s,p(q.x+w*.43,deck+.035,q.z-.08),p(q.x+w*.43,deck+.035,q.z+.08),.014,'#afbaa0',m);
  for(let i=0;i<16;i++){const a0=i/16*Math.PI*2,a1=(i+1)/16*Math.PI*2;line(s,p(q.x+w*.44+Math.cos(a0)*.09,deck+.012,q.z+Math.sin(a0)*.065),p(q.x+w*.44+Math.cos(a1)*.09,deck+.012,q.z+Math.sin(a1)*.065),'#ccb88c',{...m,riverPart:'deck-rope'});}
  for(const side of [-1,1])for(const dx of [-.31,.31]){ellipsoid(s,q.x+w*dx,.44,q.z+side*d*.48,.075,.17,.066,'#a7b79d',{...m,riverPart:'fender'},8,3);}
}
function steamship(s,boat,goal,time,reducedMotion){
  const q=boat.position,w=boat.width,d=boat.depth,deck=q.y+boat.height,{m}=hull(s,boat,deck,'#597f7b');
  // Passenger deck/forecastle, the forward wheelhouse and a correctly sized
  // funnel are separate volumes rather than one box with a giant tube on it.
  box(s,q.x-w*.34,deck,q.z-d*.30,w*.53,.18,d*.60,'#d6cbae',{...m,riverPart:'raised-passenger-deck'});
  const cabX=q.x+w*.18,cabZ=q.z-d*.30,cabW=w*.15,cabD=d*.60,cabY=deck+.05;
  box(s,cabX,cabY,cabZ,cabW,.40,cabD,'#d9d0b0',{...m,riverPart:'wheelhouse-knee-wall'});
  for(const xx of [cabX,cabX+cabW-.035])for(const zz of [cabZ,cabZ+cabD-.035])box(s,xx,cabY+.40,zz,.035,1.25,.035,'#d0c9ab',{...m,riverPart:'wheelhouse-pillar'});
  for(const side of [-1,1]){
    const zz=q.z+side*d*.305;
    for(let i=0;i<3;i++){
      const x=q.x+w*.19+i*w*.04;
      s.push(face([p(x,deck+.48,zz),p(x+w*.03,deck+.48,zz),p(x+w*.03,deck+1.56,zz),p(x,deck+1.56,zz)],'rgba(211,224,199,.34)',{...m,riverPart:'wheelhouse-window',depthWrite:false}));
    }
  }
  // The pilot cabin has 1.65 m clear height and a scale-correct adult, not a
  // miniature doll standing in a half-metre box. Front glazing shows the helm.
  s.push(face([p(cabX+cabW+.002,cabY+.43,cabZ+.04),p(cabX+cabW+.002,cabY+.43,cabZ+cabD-.04),p(cabX+cabW+.002,cabY+1.61,cabZ+cabD-.04),p(cabX+cabW+.002,cabY+1.61,cabZ+.04)],'rgba(211,224,199,.25)',{...m,riverPart:'wheelhouse-front-glazing',depthWrite:false}));
  box(s,q.x+w*.16,deck+1.72,q.z-d*.33,w*.20,.09,d*.66,'#88a596',{...m,riverPart:'wheelhouse-roof'});
  const pilotX=cabX+cabW*.5,pilotZ=q.z;
  ellipsoid(s,pilotX,deck+1.42,pilotZ,.12,.15,.115,'#ccb48b',{...m,riverPart:'pilot-head'},8,4);
  ellipsoid(s,pilotX,deck+1.55,pilotZ,.129,.050,.123,'#879b86',{...m,riverPart:'pilot-cap'},8,3);
  box(s,pilotX-.13,deck+.78,pilotZ-.1,.26,.46,.20,'#78948b',{...m,riverPart:'pilot-coat'});
  for(const side of [-1,1])beam(s,p(pilotX+side*.07,deck+.10,pilotZ),p(pilotX+side*.07,deck+.77,pilotZ),.045,'#627b70',{...m,riverPart:'pilot-trousers'});
  for(const side of [-1,1])beam(s,p(pilotX,deck+1.17,pilotZ+side*.13),p(pilotX+.33,deck+.98,pilotZ+side*.10),.037,'#bfa77e',{...m,riverPart:'pilot-arm'});
  const helmX=pilotX+.37;for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2;beam(s,p(helmX,deck+1.00+Math.cos(a)*.13,pilotZ+Math.sin(a)*.13),p(helmX,deck+1.00+Math.cos(b)*.13,pilotZ+Math.sin(b)*.13),.012,'#b9a173',{...m,riverPart:'helm-wheel'});}
  // Guard rails follow the real deck edge. Stanchions are thin at metre scale.
  for(const side of [-1,1]){
    const z=q.z+side*d*.39;
    for(let x=-w*.39;x<w*.40;x+=.47)beam(s,p(q.x+x,deck+.015,z),p(q.x+x,deck+.66,z),.012,'#c8d0b4',{...m,riverPart:'deck-stanchion'});
    for(const yy of [.31,.64])beam(s,p(q.x-w*.40,deck+yy,z),p(q.x+w*.41,deck+yy,z),.015,'#cbd2b9',{...m,riverPart:'deck-railing'});
  }
  if(goal){
    tube(s,goal,boat.chimney?.outerRadius??.27,deck,'steam-funnel');
    const y=goal.center.y;
    for(const yy of [y-.90,y-.45])loft(s,goal.center.x,yy,goal.center.z,.278,.278,.082,'#bdbd9e',{...m,riverPart:'funnel-band'},16,false);
    const t=reducedMotion?0:time;
    for(let i=0;i<4;i++){
      const age=((t*.24+i*.24)%1+1)%1,r=.10+age*.19,smoke=[];
      ellipsoid(smoke,goal.center.x-.1-age*.65,y+.18+age*1.15,goal.center.z+.06,r,r*.8,r*.75,'#a7bab2',{...m,riverPart:'smoke'},8,3);
      s.push(...smoke.map(a=>({...a,fill:`rgba(167,186,178,${.24*(1-age)})`,depthWrite:false,emissive:true})));
    }
  }
  // Portholes on the hull, anchor line and rescue ring read at the fixed view.
  for(const side of [-1,1])for(const dx of [-.23,-.11,.11,.23]){
    const x=q.x+w*dx,z=q.z+side*d*.465,y=deck-.21;
    s.push(face(Array.from({length:12},(_,i)=>p(x+Math.cos(i/12*Math.PI*2)*.07,y+Math.sin(i/12*Math.PI*2)*.07,z)),'#e4c887',{...m,riverPart:'porthole',emissive:true}));
  }
  for(const dx of [-.28,.29])lantern(s,q.x+w*dx,deck+.75,q.z-d*.41,.085,boat.id);
  const ringCenter=p(q.x-w*.15,deck+.35,q.z-d*.415),radius=.16;
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,b=(i+1)/16*Math.PI*2;beam(s,p(ringCenter.x+Math.cos(a)*radius,ringCenter.y+Math.sin(a)*radius,ringCenter.z),p(ringCenter.x+Math.cos(b)*radius,ringCenter.y+Math.sin(b)*radius,ringCenter.z),.025,i%4<2?'#d3a06f':'#e4d3a9',{...m,riverPart:'life-ring'});}
  beam(s,p(q.x+w*.45,deck+.02,q.z),p(q.x+w*.44,deck+.40,q.z),.027,'#8ea48e',{...m,riverPart:'bow-cleat'});
}
export function riverPhysicalMotionShapes(world,motion,time=0,options={}){
  if(world?.worldVersion!==35||world.stageId!=='outdoor-river')return [];
  const s=[];
  for(const boat of motion.boats){
    const goal=motion.goals.find(g=>g.motionId===boat.id);
    if(boat.kind==='steamship')steamship(s,boat,goal,time,options.reducedMotion);else houseboat(s,boat);
    // Moving broken reflections use the actual current lamp/boat pose. They
    // convey darkness and motion without revealing the future landing point.
    for(let i=0;i<9;i++){
      const z=boat.position.z-boat.depth*.53-.12-i*.14,x=boat.position.x+.08*Math.sin(i*1.7+time*.8),w=(boat.kind==='steamship'?.30:.24)*(1-i*.075);
      if(z>world.water.minZ)flat(s,x-w/2,.014,z,w,.028,'rgba(235,190,112,.23)',{riverPart:'boat-light-reflection',boatDetailId:boat.id,depthWrite:false,emissive:true});
    }
  }
  return s;
}
