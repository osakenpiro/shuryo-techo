// Outdoor places continue the approved room/school paper, wood and teal visual
// language. Physical mesh endpoints come from the world descriptors; painted
// trim and floor markings are decoration, not additional collision surfaces.
import {outdoorSolids,outdoorMotion,outdoorDynamicSolids} from './outdoor-world.mjs?v=20261015-boar-distance-1';
import {outdoorEffectShapes,outdoorLightColor,outdoorLampShapes} from './outdoor-effects.mjs?v=20261015-boar-distance-1';
import {finishedChapter3Groups,finishedBatterShapes} from './chapter3-finish-scene.mjs?v=20261023-chapter3-1';
import {ballparkMotionShapes} from './ballpark-scene.mjs?v=20261015-boar-distance-1';
import {outdoorArchitectureGroups} from './outdoor-architecture.mjs?v=20261015-boar-distance-1';
import {mallPhysicalGroups} from './mall-physical-scene.mjs?v=20261015-boar-distance-1';
import {riverPhysicalGroups,riverPhysicalMotionShapes} from './river-physical-scene.mjs?v=20261015-boar-distance-1';
export const OUTDOOR_PALETTE=Object.freeze({cream:'#f4ead5',wall:'#eee2c6',wood:'#c89b61',teal:'#4a948b',darkTeal:'#286864',gold:'#e8b54e',orange:'#e98238',sky:'#bfdedb',green:'#8caf7d',night:'#172e3d',water:'#244c60'});
const p=(x,y,z)=>({x,y,z});
const face=(points,fill,stroke=null,metadata={})=>({points,fill,stroke,...metadata});
const shade=(color,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(color.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const cache=new Map();
function box(s,x,y,z,w,h,d,color,metadata={}){
  const a=p(x,y,z),b=p(x+w,y,z),c=p(x+w,y,z+d),e=p(x,y,z+d),f=p(x,y+h,z),g=p(x+w,y+h,z),i=p(x+w,y+h,z+d),j=p(x,y+h,z+d);
  s.push(...[[[a,b,g,f],color],[[b,c,i,g],shade(color,-13)],[[c,e,j,i],shade(color,-5)],[[e,a,f,j],shade(color,7)],[[f,g,i,j],shade(color,17)],[[e,c,b,a],shade(color,-18)]].map(([points,fill])=>face(points,fill,null,metadata)));
}
function physicalBox(s,c,color){
  const a=c.min,b=c.max,lo=[p(a.x,a.y,a.z),p(b.x,a.y,a.z),p(b.x,a.y,b.z),p(a.x,a.y,b.z)],hi=lo.map(q=>({...q,y:b.y}));
  s.push(...[[[lo[0],lo[1],hi[1],hi[0]],color],[[lo[1],lo[2],hi[2],hi[1]],shade(color,-13)],[[lo[2],lo[3],hi[3],hi[2]],shade(color,-5)],[[lo[3],lo[0],hi[0],hi[3]],shade(color,7)],[[hi[0],hi[1],hi[2],hi[3]],shade(color,17)],[[lo[3],lo[2],lo[1],lo[0]],shade(color,-18)]].map(([points,fill])=>face(points,fill,null,{solidId:c.id,actorId:c.actorId??c.object})));
}
function cylinder(s,x,y,z,r,h,color,n=10,metadata={}){
  const lo=Array.from({length:n},(_,i)=>p(x+Math.cos(i/n*Math.PI*2)*r,y,z+Math.sin(i/n*Math.PI*2)*r)),hi=lo.map(q=>({...q,y:y+h}));
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,Math.round(Math.cos(i/n*Math.PI*2)*9)),null,metadata));
  s.push(face(hi,shade(color,14),null,metadata));
}
function ellipsoid(s,x,y,z,rx,ry,rz,color,n=8,rows=3,metadata={}){
  const at=(a,b)=>p(x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz);
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,c=-Math.PI/2+j/rows*Math.PI,d=-Math.PI/2+(j+1)/rows*Math.PI;
    s.push(face([at(a,c),at(b,c),at(b,d),at(a,d)],shade(color,Math.round(Math.sin((c+d)/2)*10+Math.cos(a)*5)),null,metadata));}
}
const line=(s,a,b,color='#bdc4aa',metadata={})=>s.push({points:[a,b],line:true,stroke:color,...metadata});
const flat=(s,x,y,z,w,d,color,metadata={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],color,null,metadata));
const oval=(s,x,y,z,rx,rz,color,metadata={})=>s.push(face(Array.from({length:16},(_,i)=>p(x+Math.cos(i/16*Math.PI*2)*rx,y,z+Math.sin(i/16*Math.PI*2)*rz)),color,null,{depthWrite:false,...metadata}));
const typeOf=world=>world.outdoorType??world.scene??world.stageId?.replace('outdoor-','');
const boundsOf=c=>({minX:c.min.x,maxX:c.max.x,minY:c.min.y,maxY:c.max.y,minZ:c.min.z,maxZ:c.max.z});
const roomOf=world=>world.visualBounds??world.room??world.bounds??{minX:-6,maxX:6,minZ:-2,maxZ:12,height:8};
function surfaceColor(c,world){
  if(c.color)return c.color;
  if(world.worldVersion===36&&c.kind==='stand-stair')return '#ded5bd';
  if([33,36].includes(world.worldVersion)&&c.kind==='stand-terrace')return '#c5c8b0';
  if([33,36].includes(world.worldVersion)&&(c.kind==='outfield-fence'||c.kind==='fence-return'))return '#4a8b7f';
  if([33,36].includes(world.worldVersion)&&c.kind==='stand-rail')return '#b0bb9e';
  const id=`${c.kind??''} ${c.object??''} ${c.id}`;
  if(c.id==='shrine-back-wall')return '#b4875b';
  if(c.id==='shrine-left-post'||c.id==='shrine-right-post')return '#bc925f';
  if(c.kind==='offering-box'||c.object==='shrine-offering')return '#ad8557';
  if(world.worldVersion===30&&c.kind==='small-shrine-roof')return '#688c78';
  if(typeOf(world)==='river')return /bank|ground/.test(id)?'#6c796e':/boat|deck/.test(id)?'#9b805d':/chimney|tube/.test(id)?'#456966':'#657f7e';
  if(/grass/.test(id))return OUTDOOR_PALETTE.green;
  if(/floor|slab|step|ground|walkway|bank/.test(id))return /mall/.test(world.stageId)?'#e4d8bb':'#c4b28d';
  if(/rail|frame|post|fence/.test(id))return '#b8c2a8';
  if(/scoreboard/.test(id))return OUTDOOR_PALETTE.darkTeal;
  if(/wall|building/.test(id))return OUTDOOR_PALETTE.wall;
  return OUTDOOR_PALETTE.wood;
}
function tree(s,x,y,z,scale=1){
  cylinder(s,x,y,z,.11*scale,.95*scale,'#a38456',8);
  ellipsoid(s,x,y+1.45*scale,z,.70*scale,.82*scale,.70*scale,'#93b781');
  ellipsoid(s,x-.32*scale,y+1.62*scale,z+.11*scale,.48*scale,.56*scale,.5*scale,'#aac38b');
}
function shrineDetails(s,world){
  const r=roomOf(world),goal=world.goals.find(g=>g.kind==='offering-box'),c=goal.center,z=c.z,temple=world.solids.find(c=>c.id==='shrine-back-wall'),back=temple.min.z-.018,roofY=temple.max.y;
  const trim=part=>({shrinePart:part,decoration:true});
  flat(s,-1.45,.012,r.minZ,2.9,z-r.minZ-.6,'#e2d7b9',trim('stone-path'));
  for(let depth=r.minZ+.15;depth<z-.6;depth+=.72){line(s,p(-1.42,.016,depth),p(1.42,.016,depth),'#c9c0a4',trim('stone-path'));line(s,p(0,.016,depth),p(0,.016,Math.min(depth+.72,z-.6)),'#d2c7aa',trim('stone-path'));}
  // Low stone cladding sits behind the receiving box, outside the main route.
  // This is visual trim; the frozen contact world and its open goal stay exact.
  for(let i=0;i<3;i++)box(s,-2.70,.025+i*.065,7.45+i*.23,5.40,.065,.72-i*.17,['#b4b7a2','#c0c1aa','#cbcbb2'][i],trim('stone-steps'));
  box(s,-3.42,.22,back-.04,6.84,.17,.05,'#a87849',trim('sill'));
  box(s,-3.40,3.52,back-.11,6.80,.22,.11,'#a87c4c',trim('lintel'));
  // Panelled timber and actual inset lattice occupy the real facade plane.
  for(const side of [-1,1]){
    const x=side<0?-3.24:1.40;box(s,x,.51,back-.05,1.84,2.86,.055,'#8f714c',trim('wall-panel'));
    for(let xx=x+.12;xx<x+1.8;xx+=.32)box(s,xx,.55,back-.071,.043,2.76,.022,'#c59b66',trim('wall-join'));
    for(const yy of [1.19,2.03,2.86])box(s,x+.07,yy,back-.088,1.7,.045,.025,'#b38b58',trim('wall-join'));
  }
  box(s,-1.25,.47,back-.115,2.50,2.90,.055,'#665f44',trim('wood-lattice'));
  for(let x=-1.22;x<=1.22;x+=.155)box(s,x,.48,back-.15,.045,2.88,.048,'#c5a371',trim('wood-lattice'));
  for(let y=.57;y<3.34;y+=.34)box(s,-1.25,y,back-.161,2.50,.045,.06,'#b18d5c',trim('wood-lattice'));
  for(const x of [-3.38,-1.35,1.15,3.18]){box(s,x,.25,back-.24,.19,3.87,.24,'#c59b66',trim('facade-column'));box(s,x-.055,.25,back-.27,.30,.15,.30,'#d3b37c',trim('column-foot'));}
  // Front porch beams connect the two canonical physical pillars. Brackets,
  // end grain and the underside of the roof give the eaves real depth.
  const posts=world.solids.filter(q=>q.id==='shrine-left-post'||q.id==='shrine-right-post');
  for(const post of posts){
    const x=(post.min.x+post.max.x)/2,zz=(post.min.z+post.max.z)/2;
    box(s,post.min.x-.035,post.max.y-.15,post.min.z-.035,post.max.x-post.min.x+.07,.16,post.max.z-post.min.z+.07,'#d1ac73',trim('pillar-cap'));
    box(s,post.min.x-.035,.055,post.min.z-.035,post.max.x-post.min.x+.07,.11,post.max.z-post.min.z+.07,'#b9b9a1',trim('pillar-stone'));
    for(const yy of [3.68,3.92])box(s,x-.22,yy,zz-.17,.44,.10,.45,'#a77e4e',trim('eave-bracket'));
  }
  box(s,-2.62,3.94,6.77,5.24,.20,.32,'#b78a55',trim('porch-beam'));
  box(s,-3.62,roofY-.10,6.47,7.24,.19,2.28,'#826e4c',trim('eave-underside'));
  // A gently lifted edge, three sloping bands, thick fascia and a capped
  // ridge replace the flat triangular roof. Tile seams use lines, not dense
  // individual meshes, retaining the toy diorama scale and face budget.
  const xx=[-3.90,-3.18,-1.60,0,1.60,3.18,3.90],yy=[roofY+.09,roofY+.02,roofY+.39,roofY+.92,roofY+.39,roofY+.02,roofY+.09],front=6.46,far=9.30;
  for(let i=0;i<xx.length-1;i++){
    s.push(face([p(xx[i],yy[i],front),p(xx[i+1],yy[i+1],front),p(xx[i+1],yy[i+1],far),p(xx[i],yy[i],far)],i<3?'#68917c':'#537e6e',null,trim('roof-slope')));
    s.push(face([p(xx[i],yy[i]-.12,front-.025),p(xx[i+1],yy[i+1]-.12,front-.025),p(xx[i+1],yy[i+1],front),p(xx[i],yy[i],front)],'#416d61',null,trim('roof-fascia')));
    for(let zz=front+.16;zz<far;zz+=.27)line(s,p(xx[i],yy[i]+.005,zz),p(xx[i+1],yy[i+1]+.005,zz),'#4a7969',trim('roof-tiles'));
  }
  for(let x=-3.2;x<=3.2;x+=.54)box(s,x,roofY-.13,front+.08,.065,.09,1.74,'#b69665',trim('roof-rafter'));
  box(s,-.075,roofY+.905,front-.12,.15,.13,far-front+.24,'#87a38b',trim('roof-ridge'));
  s.push(face([p(-3.11,roofY+.025,front+.11),p(0,roofY+.815,front+.11),p(3.11,roofY+.025,front+.11)],'#b89a68',null,trim('roof-gable')));
  for(const side of [-1,1])line(s,p(side*2.86,roofY+.10,front+.102),p(0,roofY+.795,front+.102),'#d0b581',trim('gable-beam'));
  box(s,-.20,roofY+.18,front+.09,.40,.40,.027,'#6a846d',trim('gable-medallion'));
  // The braided shrine rope and folded paper are high decorative ornaments;
  // the playable bell rope below still uses the original physical descriptor.
  const swag=Array.from({length:13},(_,i)=>p(-1.82+i*3.64/12,3.71-.16*Math.sin(i*Math.PI/12),6.75));
  for(let i=1;i<swag.length;i++)limb(s,swag[i-1],swag[i],.045,i%2?'#d3bb83':'#e0cca0',trim('shimenawa'));
  for(const x of [-1.26,-.42,.42,1.26]){
    const top=3.56+Math.abs(x)*.06,zz=6.71,meta=trim('shide');
    s.push(face([p(x-.058,top,zz),p(x+.056,top,zz),p(x+.10,top-.13,zz-.02),p(x-.015,top-.13,zz-.02)],'#f1e7ce',null,meta));
    s.push(face([p(x-.015,top-.13,zz-.02),p(x+.10,top-.13,zz-.02),p(x+.035,top-.28,zz-.005),p(x-.075,top-.28,zz-.005)],'#dbd2b9',null,meta));
  }
  for(const side of [-1,1]){
    const x=side*3.12,zz=z-.50,meta=trim('stone-lantern');
    cylinder(s,x,.02,zz,.28,.14,'#a8b29f',8,meta);cylinder(s,x,.16,zz,.19,.13,'#bcc3ad',8,meta);cylinder(s,x,.29,zz,.115,.54,'#a7b39e',8,meta);
    box(s,x-.245,.83,zz-.245,.49,.43,.49,'#c3c8b0',meta);
    box(s,x-.15,.94,zz-.255,.30,.20,.015,'#ead297',meta);box(s,x-.04,.94,zz-.27,.032,.20,.016,'#99a58e',meta);
    box(s,x-.28,1.26,zz-.28,.56,.07,.56,'#a1af98',meta);
    s.push(face([p(x-.34,1.33,zz-.34),p(x+.34,1.33,zz-.34),p(x,1.49,zz)],'#b1bca3',null,meta));
    s.push(face([p(x+.34,1.33,zz-.34),p(x+.34,1.33,zz+.34),p(x,1.49,zz)],'#98a88f',null,meta));
    s.push(face([p(x+.34,1.33,zz+.34),p(x-.34,1.33,zz+.34),p(x,1.49,zz)],'#a9b69b',null,meta));
    s.push(face([p(x-.34,1.33,zz+.34),p(x-.34,1.33,zz-.34),p(x,1.49,zz)],'#bdc7ae',null,meta));
    ellipsoid(s,x,1.54,zz,.065,.07,.065,'#b9c2a7',6,2,meta);
    tree(s,side*Math.max(4,r.maxX-.7),0,back-.25,1.1);
  }
  const body=world.solids.find(q=>q.id==='shrine-offering-body'),meta=trim('offering-box-detail'),frontZ=body.min.z-.009;
  // Carved panels and gold corners decorate the real body/rim only. No slat,
  // plaque or cap enters the horizontal accepting aperture.
  for(const x of [-.98,.35])box(s,x,.15,frontZ,.63,.51,.018,'#906d48',meta);
  for(let x=-1.02;x<1.06;x+=.15)box(s,x,.12,frontZ-.021,.034,.59,.021,'#c09a68',meta);
  for(const y of [.12,.68])box(s,-1.05,y,frontZ-.028,2.10,.055,.028,'#cfad74',meta);
  box(s,-.20,.34,frontZ-.055,.40,.28,.022,'#d5b776',meta);
  for(const x of [-.135,-.065,.025,.095])box(s,x,.405,frontZ-.071,.028,.085,.007,'#8d7048',meta);
  for(const side of [-1,1])box(s,side<0?-1.165:1.10,.82,6.25,.065,.30,1.10,'#d1b477',trim('offering-corner'));
  const rope=world.solids.find(q=>q.kind==='bell-rope'),q=p((rope.min.x+rope.max.x)/2,rope.max.y,(rope.min.z+rope.max.z)/2);
  for(let y=rope.min.y+.045;y<rope.max.y;y+=.17){const side=Math.round(y/.17)%2?1:-1;line(s,p(q.x-side*.045,y,rope.min.z-.006),p(q.x+side*.045,Math.min(y+.115,rope.max.y),rope.min.z-.006),'#e1c88d',trim('bell-rope-braid'));}
  cylinder(s,q.x,q.y,q.z,.19,.18,'#caaa61',12,trim('bell'));cylinder(s,q.x,q.y+.18,q.z,.13,.09,'#dbbe79',10,trim('bell'));
  oval(s,q.x,q.y-.003,q.z,.20,.20,'#806c43',trim('bell'));
  cylinder(s,q.x,q.y+.27,q.z,.045,.10,'#a88a51',8,trim('bell-mount'));
}
function shrineInariDetails(s,world){
  const goal=world.goals.find(g=>g.id==='shrine-inari'),q=goal.center,house=world.solids.find(c=>c.id==='shrine-inari-house'),roof=world.solids.find(c=>c.id==='shrine-inari-roof'),meta=part=>({inariPart:part,decoration:true});
  const x=q.x,z=house.min.z-.012,y=house.max.y,vermillion='#b97558';
  // A small shrine is part of the place, without a gold alternative-target
  // billboard. Its roof begins behind the entire accepting box aperture.
  box(s,x-.46,.18,z-.009,.92,.95,.018,'#9c7953',meta('wood-door'));
  for(const xx of [-.34,-.17,0,.17,.34])box(s,x+xx,.22,z-.037,.024,.90,.028,'#c4a070',meta('wood-lattice'));
  for(const yy of [.40,.79,1.04])line(s,p(x-.41,yy,z-.048),p(x+.41,yy,z-.048),'#d1b47e',meta('wood-lattice'));
  const a=roof.min,b=roof.max,peak=y+.53;
  s.push(face([p(a.x,b.y,a.z),p(x,peak,a.z),p(x,peak,b.z),p(a.x,b.y,b.z)],'#688c78',null,meta('roof')));
  s.push(face([p(x,peak,a.z),p(b.x,b.y,a.z),p(b.x,b.y,b.z),p(x,peak,b.z)],'#557d6c',null,meta('roof')));
  s.push(face([p(a.x,b.y,a.z-.004),p(x,peak,a.z-.004),p(b.x,b.y,a.z-.004)],'#bd9b66',null,meta('gable')));
  box(s,a.x,b.y-.06,a.z-.02,b.x-a.x,.08,.055,'#8c7250',meta('eave'));
  const toriiZ=house.min.z-.050;for(const side of [-1,1]){
    box(s,x+side*.46-.045,.06,toriiZ,.09,1.38,.085,vermillion,meta('torii'));
    cylinder(s,x+side*.46,.015,toriiZ+.042,.075,.075,'#899883',6,meta('torii-foot'));
  }
  box(s,x-.59,1.40,toriiZ-.018,1.18,.115,.14,vermillion,meta('torii'));
  box(s,x-.67,1.54,toriiZ-.050,1.34,.09,.18,'#7c7d60',meta('torii-cap'));
  box(s,x-.10,1.19,toriiZ-.024,.20,.26,.024,'#b58a58',meta('torii-plaque'));
  // Sitting foxes stay small, beside the real box. Pointed ears, a curled
  // tail and quiet bib distinguish them from the human crowd.
  for(const side of [-1,1]){
    const fx=x+side*.62,fz=q.z+.055,fox=[],tag=meta('fox');
    box(fox,fx-.13,.012,fz-.12,.26,.075,.24,'#b6bca4',tag);
    ellipsoid(fox,fx,.25,fz,.105,.18,.105,'#e4d8b9',6,2,tag);
    ellipsoid(fox,fx,.41,fz-.025,.10,.093,.085,'#eee3c8',6,2,tag);
    for(const earSide of [-1,1])fox.push(face([p(fx+earSide*.08,.45,fz-.028),p(fx+earSide*.025,.45,fz-.028),p(fx+earSide*.072,.55,fz+.018)],'#d4c5a4',null,tag));
    fox.push(face([p(fx-.06,.40,fz-.105),p(fx+.06,.40,fz-.105),p(fx,.366,fz-.145)],'#eee3c8',null,tag));
    fox.push(face([p(fx-.074,.325,fz-.107),p(fx+.074,.325,fz-.107),p(fx+.048,.232,fz-.111),p(fx-.048,.232,fz-.111)],'#b7755d',null,meta('fox-bib')));
    for(const dx of [-.053,.053])line(fox,p(fx+dx,.422,fz-.098),p(fx+dx*.83,.420,fz-.110),'#77785d',tag);
    fox.push(face([p(fx-.08,.13,fz+.08),p(fx+side*.17,.12,fz+.08),p(fx+side*.14,.26,fz+.055),p(fx+.02,.20,fz+.065)],'#d4c6a5',null,tag));
    s.push(...fox);
  }
  const boxBody=world.solids.find(c=>c.id==='shrine-inari-box-body'),front=boxBody.min.z-.012;
  box(s,x-.35,.15,front,.70,.035,.015,'#c7a570',meta('box-trim'));box(s,x-.35,.52,front,.70,.035,.015,'#c7a570',meta('box-trim'));
  for(const dx of [-.26,-.13,0,.13,.26])line(s,p(x+dx,.20,front-.008),p(x+dx,.50,front-.008),'#8f6f4d',meta('box-panel'));
  for(let i=0;i<3;i++)flat(s,x-.17,.015,q.z-1.10+i*.25,.34,.17,'#c5c5ae',meta('side-stones'));
}
function baseballDetails(s,world){
  const r=roomOf(world),o=world.origin;
  flat(s,r.minX,.008,r.minZ,r.maxX-r.minX,r.maxZ-r.minZ,'#91b782');
  // An oversized sand diamond describes distance without marking an aim path.
  const z0=o.z-.75,z1=Math.min(r.maxZ*.53,o.z+7),span=Math.min(5,(r.maxX-r.minX)*.3);
  s.push(face([p(o.x,.012,z0),p(o.x-span,.012,z0+(z1-z0)*.5),p(o.x,.012,z1),p(o.x+span,.012,z0+(z1-z0)*.5)],'#d7bd8e'));
  for(const side of [-1,1])line(s,p(o.x,.019,z0),p(o.x+side*span*2,.019,z0+(z1-z0)),'#f4ead5');
  const bx=o.x-.22,bz=o.z-.17;
  s.push(face([p(bx,.021,bz),p(bx+.44,.021,bz),p(bx+.44,.021,bz+.22),p(bx+.22,.021,bz+.36),p(bx,.021,bz+.22)],'#f7edd7'));
  for(const side of [-1,1]){const x=o.x+side*.8;line(s,p(x-.25,.02,o.z-.43),p(x+.25,.02,o.z-.43),'#f3e8d0');line(s,p(x-.25,.02,o.z+.42),p(x+.25,.02,o.z+.42),'#f3e8d0');for(const sign of [-1,1])line(s,p(x+sign*.25,.02,o.z-.43),p(x+sign*.25,.02,o.z+.42),'#f3e8d0');}
  // Painted seat stripes lie on the descriptor's stand surfaces. The stand
  // itself is supplied as physical boxes, so no extra facade blocks a mitt.
  for(const c of world.solids??[]){if(!/stand|bleacher/.test(`${c.kind} ${c.id}`))continue;
    const y=c.max.y+.006,z=(c.min.z+c.max.z)/2;
    for(let x=c.min.x+.25;x<c.max.x-.15;x+=.66){flat(s,x,y,z-.18,.38,.28,'#bcd0ad');line(s,p(x,y+.003,z+.13),p(x+.38,y+.003,z+.13),'#789b86');}}
  const scoreboard=world.solids.find(c=>c.kind==='scoreboard');
  if(scoreboard){const z=scoreboard.min.z-.009,y=scoreboard.max.y-1.25;
    for(let x=scoreboard.min.x+.6;x<scoreboard.max.x-.5;x+=.7)box(s,x,y,z,.44,.15,.008,'#c3cbac');
    for(const x of [-4.3,3.0]){
      for(const yy of [12.6,15.5])box(s,x,yy,z,1.25,.10,.008,'#c9cba9');
      for(const xx of [x,x+1.15])box(s,xx,12.7,z,.10,2.8,.008,'#c9cba9');
    }
    for(const x of [scoreboard.min.x+.3,scoreboard.max.x-.3])line(s,p(x,scoreboard.min.y+.25,z),p(x,scoreboard.max.y-.25,z),'#50847c');
  }
  for(const x of [r.minX-1.4,r.maxX+1.4])tree(s,x,0,r.maxZ+1.3,1.4);
}
function mallDetails(s,world){
  const r=roomOf(world),o=world.origin,wall=world.solids.find(c=>c.id==='mall-back-wall'),far=wall?wall.min.z-.012:r.maxZ+.02;
  // Window lettering is deliberately geometric; no canvas text labels are
  // needed inside the 3D toy-like architecture.
  for(const y of [0,3,6])for(const x of [r.minX+.4,r.maxX-2.4]){
    box(s,x,y+.35,far,2,2.1,.025,'#afc8bd');box(s,x-.12,y+2.46,far-.02,2.24,.23,.03,y===3?'#d4b25d':'#86aa96');
    for(let k=0;k<3;k++)box(s,x+.3+k*.48,y+2.53,far-.036,.26,.07,.008,'#efe8cf');
    for(let k=0;k<3;k++)box(s,x+.18+k*.54,y+.46,far-.032,.34,.65+k*.08,.015,['#b1c798','#d5b273','#e3d5b2'][k]);
  }
  // Large tile joints ground the lowest child's level without creating an
  // invisible surface across the atrium opening at upper levels.
  for(let x=r.minX+.5;x<r.maxX;x+=.9)line(s,p(x,.014,r.minZ),p(x,.014,r.maxZ),'#d4c7a7');
  for(let z=r.minZ+.3;z<r.maxZ;z+=.9)line(s,p(r.minX,.014,z),p(r.maxX,.014,z),'#d4c7a7');
  for(const [x,z] of [[r.minX+.5,r.minZ+1.2],[r.maxX-.5,r.maxZ-1.2]]){box(s,x-.23,0,z-.23,.46,.42,.46,'#bba46f');ellipsoid(s,x,.88,z,.43,.48,.42,'#a0b986');}
  // A flat service counter mat identifies the launch point on its real floor.
  flat(s,o.x-.4,o.y-.11,o.z-.36,.8,.48,'#dfba78');
}
function riverDetails(s,world){
  const r=roomOf(world),water=world.water??world.river??{},minZ=water.minZ??3,maxZ=water.maxZ??r.maxZ-2,minX=water.minX??r.minX,maxX=water.maxX??r.maxX;
  // Water patches share a single physical surface but sample the real moving
  // lamps separately, so lit regions move rather than brightening all water.
  for(let column=0;column<64;column++)for(let row=0;row<20;row++)
    flat(s,minX+(maxX-minX)*column/64,(water.y??0)+.008,minZ+(maxZ-minZ)*row/20,(maxX-minX)/64,(maxZ-minZ)/20,OUTDOOR_PALETTE.water,{water:true});
  // Restrained far-bank silhouettes leave the firework and actual light pools
  // as the main nighttime contrast. FX owns light-driven visibility changes.
  for(const x of [r.minX+.6,r.maxX-1.4]){
    cylinder(s,x,0,r.maxZ+.8,.13,1.1,'#465f58',8);ellipsoid(s,x,1.75,r.maxZ+.8,.75,.88,.65,'#3e5c55');}
  for(let x=r.minX+.3;x<r.maxX;x+=1.9)box(s,x,0,r.maxZ+1.3,1.35,1.35+(Math.abs(Math.round(x))%3)*.4,.6,'#405b59');
  const q=world.origin;box(s,q.x-1.3,0,q.z-.7,.44,.3,.32,'#8a775c');box(s,q.x-1.22,.3,q.z-.62,.28,.22,.2,'#bd985c');
}
function buildGroups(world){
  if([60,61].includes(world.worldVersion)){const previous={...world,worldVersion:world.worldVersion===60?36:34};return finishedChapter3Groups(buildGroups(previous),world);}
  const groups=[],background=[],solids=outdoorSolids(world);
  const r=roomOf(world),type=typeOf(world);
  if(type!=='river')flat(background,r.minX,-.018,r.minZ,r.maxX-r.minX,r.maxZ-r.minZ,type==='baseball'?([33,36].includes(world.worldVersion)?'#d4cbb0':'#a1bc87'):type==='mall'?'#eee4cc':'#b8bd92');
  groups.push({id:'outdoor-background',shapes:background,physical:false});
  for(const c of solids){
    const shapes=[],receiverShell=world.worldVersion===36&&['chair-pan','chair-back'].includes(c.kind)||world.worldVersion===34&&['mall-cone-body','mall-coffee-body','mall-soda-body'].includes(c.id)||[35,37].includes(world.worldVersion)&&/^river-tube-(body|rim-)/.test(c.id);
    if(!receiverShell)physicalBox(shapes,c,surfaceColor(c,world));
    const glass=[32,34].includes(world.worldVersion)&&/^mall-source-(left|right)-rail$/.test(c.id);
    groups.push({id:c.id,object:c.object??c.kind,bounds:boundsOf(c),shapes:glass?shapes.map(m=>({...m,fill:'rgba(158,190,175,.10)',depthWrite:false,sourceGlassRail:true})):shapes,physical:true});
  }
  const detail=[];
  if(type==='shrine'){shrineDetails(detail,world);if(world.worldVersion===30)shrineInariDetails(detail,world);}else if(type==='baseball'&&![31,33,36].includes(world.worldVersion))baseballDetails(detail,world);else if(type==='mall'&&![32,34].includes(world.worldVersion))mallDetails(detail,world);else if(type==='river'&&![35,37].includes(world.worldVersion))riverDetails(detail,world);
  if(world.worldVersion===30){
    const buckets=new Map();
    for(const shape of detail){
      const part=shape.shrinePart??'',ip=shape.inariPart??'';
      const shell=/^roof|^eave-underside/.test(part)?'shrine30-roof':/wall|lattice|facade|sill|lintel/.test(part)?'shrine30-facade':/porch-beam|shimenawa|shide/.test(part)?'shrine30-porch':/roof|gable|eave/.test(ip)?'inari30-roof':/wood-door|wood-lattice/.test(ip)?'inari30-facade':/torii/.test(ip)?'inari30-torii':null;
      const key=shell??'outdoor-detail';if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(shape);
    }
    for(const [id,shapes] of buckets){
      const shell=id!=='outdoor-detail',points=shell?shapes.flatMap(m=>m.points):[],bounds=shell?Object.fromEntries(['x','y','z'].flatMap(k=>[['min'+k.toUpperCase(),Math.min(...points.map(q=>q[k]))],['max'+k.toUpperCase(),Math.max(...points.map(q=>q[k]))]])):undefined;
      groups.push({id,shapes,physical:false,...(shell?{bounds,architecturalShell:true}:{})});
    }
  }else groups.push({id:'outdoor-detail',shapes:detail,physical:false});
  for(const group of outdoorArchitectureGroups(world)){
    if([31,33].includes(world.worldVersion)&&group.id==='stadium-scoreboard-innings')groups.push({...group,architecturalShell:true,bounds:boundsOf(world.solids.find(c=>c.id==='stadium-scoreboard'))});else groups.push(group);
  }
  if(world.worldVersion===34)groups.push(...mallPhysicalGroups(world));
  if([35,37].includes(world.worldVersion))groups.push(...riverPhysicalGroups(world));
  // These spectators/customers and their mouths have no gameplay motion. Keep
  // them in the cached depth layer rather than rebuilding hundreds of faces.
  if(type==='baseball'&&world.worldVersion!==36||type==='mall'&&world.worldVersion!==34){
    const figures=[],motion=outdoorMotion(world,0);
    for(const actor of motion.actors){if(world.worldVersion===33)stadiumCatcherShapes(figures,actor,motion.goals);else if(world.worldVersion===31||world.worldVersion===32)styledFixedVisitorShapes(figures,actor,motion.goals,world);else actorShapes(figures,actor,0,true);}
    for(const goal of motion.goals){if(world.worldVersion===33&&goal.kind==='mitt')stadiumMittShapes(figures,goal);else aperture(figures,goal);}
    if(![31,32,33].includes(world.worldVersion))heldObjects(figures,motion.actors,motion.goals);
    if(type==='baseball')actorShapes(figures,batterActor(world),0,true);
    groups.push({id:'outdoor-fixed-actors',shapes:figures,physical:false});
  }
  if(world.worldVersion===36){const figures=[];actorShapes(figures,batterActor(world),0,true);groups.push({id:'outdoor-fixed-batter',shapes:figures,physical:false});}
  return groups;
}
function sightIntersects(bounds,camera,target){
  let lo=0,hi=1;for(const axis of ['x','y','z']){const cap=axis.toUpperCase(),delta=target[axis]-camera[axis],min=bounds['min'+cap],max=bounds['max'+cap];
    if(Math.abs(delta)<1e-8){if(camera[axis]<min||camera[axis]>max)return false;continue;}
    let a=(min-camera[axis])/delta,b=(max-camera[axis])/delta;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;}return hi>0&&lo<1;
}
const transparent=(color,alpha)=>color&&/^#[0-9a-f]{6}$/i.test(color)?`rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${alpha})`:color;
export function outdoorCameraConfig(world){return {azimuth:world?.view?.azimuth??.18,elevation:world?.view?.elevation??.43,zoom:1};}
export function outdoorScene(camera,world,time=0,options={}){
  if(world?.environment!=='outdoor')throw new RangeError('A frozen outdoor world is required');
  const key=`${world.stageId}/${world.worldVersion}`;if(!cache.has(key))cache.set(key,buildGroups(world));
  const groups=cache.get(key),shapes=[],cutaway=[],goals=world.goals??[],endpoints=[world.origin,...goals.map(g=>g.center??g.position).filter(Boolean),...([32,34,61].includes(world.worldVersion)?world.actors.map(a=>({...a.position,y:a.position.y+a.height*.5})):[])];
  const lamps=typeOf(world)==='river'?outdoorMotion(world,time).lamps:[];
  for(const group of groups){
    // Only building shells cut away. Real crowd, rope, stands and rails stay
    // opaque. No projected throw trajectory is used to reveal a hidden path.
    const sourceFloor=typeOf(world)==='mall'&&(group.id==='mall-source-balcony'||group.sourceBalcony===true),shell=group.architecturalShell===true||group.physical&&(/wall|ceiling|building-shell/.test(`${group.id} ${group.object}`)||sourceFloor||[31,33,36].includes(world.worldVersion)&&group.id==='stadium-scoreboard');
    const faded=shell&&(/ceiling/.test(group.id)||endpoints.some(q=>sightIntersects(group.bounds,camera,q)));
    const nearScoreboard=world.worldVersion===36&&Math.hypot(camera.x,camera.y-14,camera.z-55)<42;
    const visibleShapes=world.worldVersion===36?group.shapes.filter(s=>!s.scoreboardDetail||s.scoreboardDetail===(nearScoreboard?'near':'far')):group.shapes;
    if(faded){cutaway.push(group.id);shapes.push(...visibleShapes.map(s=>({...s,fill:transparent(s.fill,sourceFloor?.11:/ceiling/.test(group.id)?.045:.16),depthWrite:false})));}
    else shapes.push(...visibleShapes);
  }
  return {shapes:lamps.length?lightShapes(shapes,lamps,[35,37].includes(world.worldVersion),riverLightOptions(world)):shapes,cutaway,groups:groups.map(({id,object,bounds,physical})=>({id,object,bounds,physical})),worldVersion:world.worldVersion,stageId:world.stageId};
}

const add=(a,b)=>p(a.x+b.x,a.y+b.y,a.z+b.z);
const scale=(a,n)=>p(a.x*n,a.y*n,a.z*n);
const cross=(a,b)=>p(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const unit=a=>scale(a,1/(Math.hypot(a.x,a.y,a.z)||1));
const centroid=shape=>scale(shape.points.reduce(add,p(0,0,0)),1/shape.points.length);
const riverLightOptions=world=>world.worldVersion===37?{ambient:world.lighting?.ambient??.035,night:true}:{ambient:.24};
const lightShapes=(shapes,lamps,preserveEmissive=false,options={ambient:.24})=>shapes.map(shape=>preserveEmissive&&shape.emissive?shape:({...shape,fill:outdoorLightColor(shape.fill,centroid(shape),lamps,options),stroke:outdoorLightColor(shape.stroke,centroid(shape),lamps,options)}));
function basis(goal){
  const normal=unit(goal.normal??p(0,1,0)),vertical=goal.up??(Math.abs(normal.y)>.8?p(0,0,1):p(0,1,0)),right=unit(cross(vertical,normal)),up=unit(cross(normal,right));
  return {normal,right,up,at:(x,y,d=0)=>add(goal.center,add(scale(right,x),add(scale(up,y),scale(normal,d))))};
}
function aperture(s,goal){
  const {at,normal}=basis(goal),meta={goalId:goal.id,goalRole:goal.role,goalKind:goal.kind},n=16,thickness=.045;
  const outline=goal.shape==='rectangle'?
    [[-goal.halfWidth,-goal.halfHeight],[goal.halfWidth,-goal.halfHeight],[goal.halfWidth,goal.halfHeight],[-goal.halfWidth,goal.halfHeight]].map(([x,y])=>at(x,y)):
    Array.from({length:n},(_,i)=>at(Math.cos(i/n*Math.PI*2)*goal.radius,Math.sin(i/n*Math.PI*2)*goal.radius));
  const outer=goal.shape==='rectangle'?
    [[-goal.halfWidth-thickness,-goal.halfHeight-thickness],[goal.halfWidth+thickness,-goal.halfHeight-thickness],[goal.halfWidth+thickness,goal.halfHeight+thickness],[-goal.halfWidth-thickness,goal.halfHeight+thickness]].map(([x,y])=>at(x,y)):
    Array.from({length:n},(_,i)=>at(Math.cos(i/n*Math.PI*2)*(goal.radius+thickness),Math.sin(i/n*Math.PI*2)*(goal.radius+thickness)));
  const color=goal.kind==='hand'?'#e9c9a0':goal.kind==='mitt'?'#c49760':goal.kind==='scoreboard-light'?'#ffe19a':goal.role==='alternative'?'#deb45e':'#e9c375';
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;s.push(face([outer[i],outer[j],outline[j],outline[i]],color,null,{...meta,opening:true}));}
  const depth=goal.kind==='mitt'?.22:goal.kind==='hand'?.018:goal.kind==='scoreboard-light'?.002:.16;
  const back=outline.map(q=>add(q,scale(normal,-depth)));
  if(['mitt','hand','scoreboard-light'].includes(goal.kind)){
    s.push(face(back,goal.kind==='mitt'?'#8d6541':goal.kind==='hand'?'#e2bd93':'#efc65c',null,meta));
    if(goal.kind==='mitt')for(let i=0;i<outline.length;i+=2)line(s,outline[i],back[(i+2)%back.length],'#d8b379',meta);
    if(goal.kind==='scoreboard-light'){
      const w=goal.halfWidth??goal.radius*.7,h=goal.halfHeight??goal.radius*.7;
      for(const x of [-.55,0,.55])for(const y of [-.5,0,.5]){const c=at(x*w,y*h,.005);ellipsoid(s,c.x,c.y,c.z,.035,.035,.018,'#fff2b6',6,2,meta);}
    }
    return;
  }
  // Open mouths show their actual descriptor aperture. The dark pocket sits
  // below the mouth and cannot look like a cap across a valid entry plane.
  s.push(face(back,goal.kind==='cone'?'#d6ac6c':goal.kind==='coffee'?'#755d42':goal.kind==='soda'?'#82b7a0':'#365f58',null,meta));
  if(goal.shape==='rectangle'){
    for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;s.push(face([outline[i],outline[j],back[j],back[i]],shade('#b29163',i%2?-16:2),null,meta));}
    return;
  }
  const height=goal.kind==='cone'?.5:goal.kind==='chimney'?.68:goal.kind==='firework-tube'?.62:.33;
  const bottom=goal.kind==='cone'?outer.map(()=>add(goal.center,scale(normal,-height))):outer.map(q=>add(q,scale(normal,-height)));
  const bodyColor=goal.kind==='cone'?'#d5aa69':goal.kind==='coffee'?'#e9dac0':goal.kind==='soda'?'#a5cbb8':goal.kind==='chimney'?'#496f6d':'#60938b';
  for(let i=0;i<outer.length;i++){const j=(i+1)%outer.length;s.push(face([outer[i],outer[j],bottom[j],bottom[i]],shade(bodyColor,Math.round(Math.cos(i/outer.length*Math.PI*2)*12)),null,meta));}
  if(goal.kind==='cone')for(let i=0;i<outer.length;i+=2){const mid=add(goal.center,scale(normal,-height*.48));line(s,outer[i],add(mid,scale(basis(goal).right,.08*Math.cos(i))), '#bf935b',meta);}
}
function shrineRaisedHandShapes(s,goal){
  // The original circular receiving proxy stays at its original radius and
  // plane. A solid skin-coloured palm fully covers that proxy, so its outline
  // reads as a hand with fingers, rather than a plate or a round slot.
  aperture(s,goal);
  const q=goal.center,meta={goalId:goal.id,goalRole:goal.role,goalKind:goal.kind,shrineHand:true},r=goal.radius,top=q.y,bottom=top-.045;
  const outline=[[-r-.024,-r+.028],[-r+.036,-r-.024],[r-.036,-r-.024],[r+.024,-r+.028],[r+.024,r-.036],[r-.036,r+.024],[-r+.036,r+.024],[-r-.024,r-.036]].map(([x,z])=>p(q.x+x,top,q.z+z)),lower=outline.map(a=>({...a,y:bottom}));
  s.push(face(outline,'#e9c9a0',null,{...meta,shrineHandPart:'palm'}));
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;s.push(face([outline[i],outline[j],lower[j],lower[i]],i%2?'#d9b58d':'#e5c29b',null,{...meta,shrineHandPart:'palm-edge'}));}
  s.push(face(lower,'#d9b58d',null,{...meta,shrineHandPart:'palm-back'}));
  const xs=[-.211,-.071,.071,.211],lengths=[.17,.26,.285,.205];
  for(let i=0;i<4;i++){
    const x=q.x+xs[i],start=p(x,top-.023,q.z+r-.016),end=p(x,top-.023,q.z+r+lengths[i]),part={...meta,shrineHandPart:'finger',fingerIndex:i};
    limb(s,start,end,.047,i%2?'#e8c79e':'#e6c49b',part);ellipsoid(s,end.x,end.y,end.z,.048,.023,.055,'#e9c9a0',8,2,part);
    line(s,p(x-.027,top+.001,q.z+r+.046),p(x+.027,top+.001,q.z+r+.046),'#c9a880',{...meta,shrineHandPart:'finger-joint',fingerIndex:i});
  }
  const thumbBase=p(q.x-r-.012,top-.025,q.z-.040),thumbJoint=p(q.x-r-.132,top-.025,q.z+.022),thumbTip=p(q.x-r-.155,top-.025,q.z+.132),thumb={...meta,shrineHandPart:'thumb'};
  limb(s,thumbBase,thumbJoint,.050,'#e4c098',thumb);limb(s,thumbJoint,thumbTip,.048,'#e9c9a0',thumb);ellipsoid(s,thumbTip.x,thumbTip.y,thumbTip.z,.052,.025,.057,'#e9c9a0',6,2,thumb);
  limb(s,p(q.x,top-.055,q.z-r-.093),p(q.x,top-.025,q.z-r+.010),.067,'#deba92',{...meta,shrineHandPart:'wrist'});
  // Short palm creases are anatomy on the receiving surface, never a guide
  // for the flight direction or a numerical landing indicator.
  line(s,p(q.x-r*.60,top+.001,q.z-r*.23),p(q.x+r*.50,top+.001,q.z-r*.31),'#cca77f',{...meta,shrineHandPart:'palm-crease'});
}
function actorShapes(s,actor,time,reducedMotion=false){
  const q=actor.position??actor,model=[],height=actor.height??1.68,width=actor.width??.46,depth=actor.depth??.34,young=actor.kind==='child';
  const t=reducedMotion?0:time,gait=actor.velocity&&Math.hypot(actor.velocity.x??0,actor.velocity.z??0)>.01?Math.sin(t*5.5)*.045:0,color=actor.color??(young?'#d5ac65':'#698f81');
  box(model,-.17,.67,-.115,.34,.46,.23,color);box(model,-.16,.56,-.11,.32,.13,.22,shade(color,-8));
  cylinder(model,0,1.13,0,.06,.08,'#d8b896',8);ellipsoid(model,0,1.4,0,.14,.18,.13,'#ead0aa');ellipsoid(model,0,1.51,.012,.147,.104,.137,actor.hairColor??'#746950');
  for(const side of [-1,1]){
    box(model,side*.075-.05,.07,side*gait-.052,.10,.50,.105,'#617e70');box(model,side*.075-.06,.02,side*gait-.092,.12,.065,.16,'#747a62');
    box(model,side<0?-.23:.17,.76,-.065,.06,.30,.13,color);ellipsoid(model,side*.201,.72,0,.037,.055,.047,'#e4c49c',6,2);
    box(model,side*.05-.006,1.408,-.132,.012,.012,.005,'#58614b');
  }
  const points=model.flatMap(shape=>shape.points),lo=Object.fromEntries(['x','y','z'].map(k=>[k,Math.min(...points.map(a=>a[k]))])),hi=Object.fromEntries(['x','y','z'].map(k=>[k,Math.max(...points.map(a=>a[k]))]));
  const min=actor.colliders?.[0]?.min??p(q.x-width/2,q.y??0,q.z-depth/2),max=actor.colliders?.[0]?.max??p(q.x+width/2,(q.y??0)+height,q.z+depth/2);
  // A silhouette fills the descriptor's physical body envelope. Gait changes
  // the interior geometry, never the collision body's position or dimensions.
  for(const shape of model)s.push({...shape,actorId:actor.id,points:shape.points.map(a=>Object.fromEntries(['x','y','z'].map(k=>[k,min[k]+(a[k]-lo[k])/(hi[k]-lo[k])*(max[k]-min[k])])))});
  oval(s,q.x,(q.y??0)+.008,q.z,width*.65,depth*.8,'rgba(57,77,52,.14)',{actorShadow:actor.id});
}
function shrineWorshipperShapes(s,actor,time,reducedMotion=false){
  const q=actor.position,model=[],color=actor.color??'#819b82',t=reducedMotion?0:time,raised=actor.kind==='raised-hand';
  const variant=actor.id.includes('right')?1:actor.id.includes('back')?2:0,hair=['#655846','#555d48','#786449'][variant],bow=.075+(reducedMotion?0:Math.max(0,Math.sin(t*.65+variant))*.055);
  const meta=part=>({shrineActorPart:part,shrineFacing:p(0,0,1),worshipGesture:raised?'raised-hand':'prayer'});
  const lo=[p(-.15,.68,-.08),p(.15,.68,-.08),p(.15,.68,.085),p(-.15,.68,.085)],hi=[p(-.205,1.13,-.088),p(.205,1.13,-.088),p(.205,1.13,.105),p(-.205,1.13,.105)];
  for(const [points,fill,part] of [[[lo[0],lo[1],hi[1],hi[0]],shade(color,-5),'coat-back'],[[lo[1],lo[2],hi[2],hi[1]],shade(color,-11),'coat-side'],[[lo[2],lo[3],hi[3],hi[2]],color,'coat-front'],[[lo[3],lo[0],hi[0],hi[3]],shade(color,5),'coat-side'],[[hi[0],hi[1],hi[2],hi[3]],shade(color,12),'coat-shoulder']])model.push(face(points,fill,null,meta(part)));
  box(model,-.155,.60,-.082,.31,.09,.174,shade(color,-12),meta('coat-hem'));
  // A back seam, soft collar and separate sleeves keep the rear silhouette
  // legible. The visible front remains +z, toward the offering box.
  line(model,p(0,.69,-.086),p(0,1.08,-.093),shade(color,-18),meta('coat-back-seam'));
  line(model,p(-.15,.70,-.085),p(.15,.70,-.085),shade(color,14),meta('coat-hem-seam'));
  cylinder(model,0,1.12,.015,.051,.115,'#daba94',8,meta('neck'));
  for(const side of [-1,1]){
    box(model,side*.074-.050,.085,-.057,.10,.50,.115,'#677b68',meta('trousers'));
    box(model,side*.074-.059,.018,-.077,.118,.073,.175,'#666e58',meta('shoes'));
    line(model,p(side*.074-.046,.10,.069),p(side*.074+.046,.10,.069),'#89937a',meta('shoe-edge'));
  }
  const head=[];ellipsoid(head,0,1.385,.012,.139,.172,.123,'#e5c7a0',8,4,meta('head-skin'));
  ellipsoid(head,0,1.490,-.019,.145,.100,.129,hair,8,3,meta('hair-crown'));
  ellipsoid(head,0,1.365,-.070,.143,.146,.074,hair,8,3,{...meta('hair-back'),shrineHairBack:true});
  // Nape hair is clipped above the collar; a small sideburn and ear hint at
  // a face on the far side instead of painting eyes onto the back of a head.
  for(const side of [-1,1]){
    ellipsoid(head,side*.133,1.369,.018,.024,.041,.027,'#dbb78f',6,2,meta('ear'));
    box(head,side<0?-.125:.105,1.397,.089,.021,.057,.018,hair,meta('sideburn'));
    box(head,side*.044-.007,1.396,.129,.014,.015,.005,'#5e6047',{...meta('face'),shrineFace:true});
  }
  ellipsoid(head,0,1.355,.136,.027,.022,.018,'#d9b38b',6,2,{...meta('face'),shrineFace:true});
  const neck=p(0,1.19,.016),cb=Math.cos(bow),sb=Math.sin(bow);
  for(const shape of head)model.push({...shape,points:shape.points.map(a=>{const dy=a.y-neck.y,dz=a.z-neck.z;return p(a.x,neck.y+dy*cb-dz*sb,neck.z+dy*sb+dz*cb);})});
  if(!raised){
    for(const side of [-1,1]){
      const shoulder=p(side*.174,1.075,.008),elbow=p(side*.214,.89,.075),wrist=p(side*.035,1.018,.177);
      limb(model,shoulder,elbow,.061,color,meta('sleeve'));limb(model,elbow,wrist,.050,shade(color,4),meta('sleeve'));
      ellipsoid(model,side*.025,1.037,.190,.026,.053,.032,'#e2bf95',6,3,meta('praying-hands'));
      line(model,p(side*.008,1.083,.192),p(side*.008,1.02,.203),'#c9a57e',meta('praying-fingers'));
    }
  }else{
    // The raised right hand still follows the unchanged alternative-goal
    // linkage in heldObjects. A relaxed left sleeve balances that gesture.
    limb(model,p(-.177,1.075,.009),p(-.214,.91,.043),.060,color,meta('sleeve'));
    limb(model,p(-.214,.91,.043),p(-.182,.78,.099),.043,shade(color,5),meta('sleeve'));
    ellipsoid(model,-.182,.742,.099,.038,.053,.041,'#e2bf95',6,2,meta('relaxed-hand'));
    limb(model,p(.177,1.075,.009),p(.19,1.18,.03),.055,color,meta('raised-sleeve'));
  }
  const low=p(Infinity,Infinity,Infinity),high=p(-Infinity,-Infinity,-Infinity);
  for(const shape of model)for(const a of shape.points){low.x=Math.min(low.x,a.x);low.y=Math.min(low.y,a.y);low.z=Math.min(low.z,a.z);high.x=Math.max(high.x,a.x);high.y=Math.max(high.y,a.y);high.z=Math.max(high.z,a.z);}
  const min=p(q.x-actor.width/2,q.y,q.z-actor.depth/2),max=p(q.x+actor.width/2,q.y+actor.height,q.z+actor.depth/2);
  // The visual body remains inside, and spans, the exact frozen person box.
  // Prayer and bowing refine its interior; collision poses never change.
  const sx=(max.x-min.x)/(high.x-low.x),sy=(max.y-min.y)/(high.y-low.y),sz=(max.z-min.z)/(high.z-low.z);
  for(const shape of model)s.push({...shape,actorId:actor.id,points:shape.points.map(a=>p(min.x+(a.x-low.x)*sx,min.y+(a.y-low.y)*sy,min.z+(a.z-low.z)*sz))});
  oval(s,q.x,q.y+.008,q.z,actor.width*.65,actor.depth*.8,'rgba(57,77,52,.14)',{actorShadow:actor.id});
}
const visitorModels=new Map();
function visitorLoft(s,y0,y1,rx0,rx1,rz0,rz1,color,n,meta){
  const ring=(y,rx,rz)=>Array.from({length:n},(_,i)=>p(Math.cos(i/n*Math.PI*2)*rx,y,Math.sin(i/n*Math.PI*2)*rz)),lo=ring(y0,rx0,rz0),hi=ring(y1,rx1,rz1);
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,Math.round(Math.cos(i/n*Math.PI*2)*8)),null,meta));
  s.push(face(hi,shade(color,12),null,meta));
}
function visitorLocalModel(actor){
  const a=actor.appearance,h=actor.height,w=actor.width,d=actor.depth,detail=actor.position.z<2.6?'near':actor.position.z<4.2?'middle':'far',n=detail==='near'?8:6,key=`${actor.id}/${h}/${w}/${d}/${JSON.stringify(a)}/${detail}`;
  if(visitorModels.has(key))return visitorModels.get(key);
  const body=[],head=[],skin=a.skin??'#ddba94',hair=a.hair==='silver'?'#b7b6a0':a.hair==='bob'?'#615745':a.hair==='ponytail'?'#70614a':'#555a45',color=actor.color,meta=part=>({visitorPart:part,appearance:{...a},visitorDetail:detail,shrineFacing:p(0,0,1)});
  const hem=a.clothing==='coat'?.28:a.clothing==='skirt'?.48:.44,shoulder=a.build==='broad'?.50:a.build==='slim'?.42:.46;
  visitorLoft(body,h*hem,h*.77,w*(a.clothing==='coat'?.46:.39),w*shoulder,d*.39,d*.34,color,n,meta(a.clothing));
  if(a.clothing==='skirt')visitorLoft(body,h*.285,h*.48,w*.49,w*.35,d*.47,d*.36,shade(color,-13),n,meta('skirt-hem'));
  if(a.clothing==='hoodie'){
    visitorLoft(body,h*.735,h*.82,w*.30,w*.25,d*.42,d*.38,shade(color,11),n,meta('hood'));
    line(body,p(-w*.30,h*.755,-d*.30),p(w*.30,h*.755,-d*.30),shade(color,-15),meta('hood-seam'));
  }
  if(detail!=='far'){
    line(body,p(0,h*(hem+.035),-d*.398),p(0,h*.74,-d*.348),shade(color,-18),meta('back-seam'));
    line(body,p(-w*.35,h*(hem+.012),-d*.35),p(w*.35,h*(hem+.012),-d*.35),shade(color,16),meta('hem-seam'));
    if(a.clothing==='coat')for(const yy of [.46,.56,.65])line(body,p(-.006,h*yy,d*.383),p(.008,h*yy,d*.383),'#d9c094',meta('coat-buttons'));
  }
  // Accessories change the rear silhouette inside the real body collider,
  // rather than duplicating a uniform body with another paint colour.
  if(a.bag==='backpack'){
    const y=h*.49;visitorLoft(body,y,h*.73,w*.27,w*.26,d*.30,d*.28,'#b3945c',n,meta('backpack-core'));
    for(const side of [-1,1])line(body,p(side*w*.20,h*.72,-d*.445),p(side*w*.20,h*.50,-d*.445),'#786e4d',meta('backpack-strap'));
    const pack=[];box(pack,-w*.29,y,-d*.5,w*.58,h*.23,d*.19,'#b89b65',meta('backpack'));body.push(...pack.filter((_,i)=>i!==5));
  }else if(a.bag==='shoulder'){
    box(body,-w*.45,h*.31,-d*.45,w*.31,h*.17,d*.24,'#8f8870',meta('shoulder-bag'));
    line(body,p(w*.28,h*.75,-d*.36),p(-w*.35,h*.38,-d*.465),'#746e53',meta('bag-strap'));
  }
  const ry=h*.09,rx=a.age==='child'?.096:.10,rz=.091;
  ellipsoid(head,0,0,0,rx,ry,rz,skin,n,3,meta('head-skin'));
  // Faceted scalp plus a rear hair panel gives bob/short/silver styles distinct
  // silhouettes using fewer faces than the old layered full ellipsoids.
  const at=(angle,height)=>p(Math.cos(angle)*rx,height,Math.sin(angle)*rz),crown=Array.from({length:n},(_,i)=>at(i/n*Math.PI*2,ry*.48));
  for(let i=0;i<n;i++)head.push(face([crown[i],crown[(i+1)%n],p(0,ry,0)],hair,null,meta('hair-crown')));
  const backLength=a.hair==='bob'?ry*.91:ry*.60;
  for(let i=0;i<n;i++){
    const angle=i/n*Math.PI*2,next=(i+1)/n*Math.PI*2;if(Math.sin((angle+next)/2)>0)continue;
    head.push(face([at(angle,-backLength),at(next,-backLength),at(next,ry*.49),at(angle,ry*.49)],hair,null,{...meta('hair-back'),shrineHairBack:true}));
  }
  if(a.hair==='ponytail'){
    head.push(face([p(-.038,0,-.088),p(.038,0,-.088),p(.031,-ry*.90,-.094),p(-.026,-ry*.90,-.094)],hair,null,meta('ponytail')));
    head.push(face([p(.038,0,-.088),p(.038,-ry*.70,-.067),p(.031,-ry*.90,-.094)],shade(hair,-8),null,meta('ponytail')));
  }
  if(a.hat==='cap'||a.hat==='knit'){
    const cap=a.hat==='cap'?'#687f6b':'#9a9b7b';for(let i=0;i<n;i++)head.push(face([crown[i],crown[(i+1)%n],p(0,ry,0)],cap,null,meta('hat')));
    head.push(face([p(-.092,ry*.44,-.019),p(.092,ry*.44,-.019),p(.10,ry*.40,.095),p(-.10,ry*.40,.095)],cap,null,meta('hat-brim')));
  }
  for(const side of [-1,1])head.push(face([p(side*.038-.005,-ry*.06,.092),p(side*.038+.005,-ry*.06,.092),p(side*.038+.005,ry*.04,.092),p(side*.038-.005,ry*.04,.092)],'#565d46',null,{...meta('face'),shrineFace:true}));
  const model={body,head,detail,n,skin};visitorModels.set(key,model);return model;
}
function visitorLimb(s,a,b,r0,r1,color,n,meta){
  const axis=unit(p(b.x-a.x,b.y-a.y,b.z-a.z)),right=unit(cross(axis,Math.abs(axis.y)>.8?p(0,0,1):p(0,1,0))),up=cross(axis,right),ring=(q,r)=>Array.from({length:n},(_,i)=>add(q,add(scale(right,Math.cos(i/n*Math.PI*2)*r),scale(up,Math.sin(i/n*Math.PI*2)*r)))),lo=ring(a,r0),hi=ring(b,r1);
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,i%2?-7:5),null,meta));
}
function shrineCrowdVisitorShapes(s,actor){
  const model=visitorLocalModel(actor),q=actor.position,h=actor.height,w=actor.width,j=actor.joints,facing=actor.facing??1,n=model.detail==='far'?3:4,meta=part=>({actorId:actor.id,visitorPart:part,visitorDetail:model.detail,appearance:{...actor.appearance},shrineFacing:p(0,0,facing)});
  for(const mesh of model.body)s.push({...mesh,actorId:actor.id,shrineFacing:p(0,0,facing),points:mesh.points.map(a=>p(q.x+a.x,q.y+a.y,q.z+a.z*facing))});
  for(const mesh of model.head)s.push({...mesh,actorId:actor.id,shrineFacing:p(0,0,facing),contactPartId:`${actor.id}-head`,points:mesh.points.map(a=>p(j.head.x+a.x,j.head.y+a.y,j.head.z+a.z*facing))});
  visitorLimb(s,p(j.head.x,j.head.y-h*.09,j.head.z),p(q.x,q.y+h*.76,q.z),.033,.046,model.skin,model.detail==='far'?3:4,meta('neck'));
  for(const [name,side] of [['left',-1],['right',1]]){
    const knee=j[`${name}Knee`],foot=j[`${name}Foot`],hip=p(knee.x,j.hip.y,q.z);
    visitorLimb(s,hip,p(foot.x,q.y+.057,q.z),.050,.043,'#667967',model.detail==='far'?3:4,{...meta('trousers'),contactPartId:`${actor.id}-${name}-leg`});
    s.push(face([p(foot.x-.052,q.y+.027,q.z-.07*facing),p(foot.x+.052,q.y+.027,q.z-.07*facing),p(foot.x+.052,q.y+.071,q.z+.07*facing),p(foot.x-.052,q.y+.071,q.z+.07*facing)],'#74765e',null,meta('shoe')));
    if(model.detail!=='far')s.push(face([p(foot.x-.052,q.y+.005,q.z-.07*facing),p(foot.x+.052,q.y+.005,q.z-.07*facing),p(foot.x+.052,q.y+.027,q.z-.07*facing),p(foot.x-.052,q.y+.027,q.z-.07*facing)],'#566b59',null,meta('shoe-heel')));
    const shoulder=j[`${name}Shoulder`],elbow=j[`${name}Elbow`],wrist=j[`${name}Wrist`],arm={...meta('sleeve'),sharedJointChain:name};
    visitorLimb(s,shoulder,elbow,.064,.055,actor.color,n,{...arm,sharedSegment:0});visitorLimb(s,elbow,wrist,.051,.034,shade(actor.color,7),n,{...arm,sharedSegment:1});
    // Two small solid palm faces and two thin edges replace the giant target
    // hand. The real hand box and its shared wrist remain the contact source.
    const r=.052,z=wrist.z,top=wrist.y+.034,bottom=wrist.y-.043,tag={...meta('hand'),sharedWrist:name,contactPartId:`${actor.id}-${name}-hand`};
    s.push(face([p(wrist.x-r,bottom,z-.034),p(wrist.x+r,bottom,z-.034),p(wrist.x+r,top,z-.034),p(wrist.x-r,top,z-.034)],model.skin,null,tag));
    s.push(face([p(wrist.x-r,top,z+.034),p(wrist.x+r,top,z+.034),p(wrist.x+r,bottom,z+.034),p(wrist.x-r,bottom,z+.034)],shade(model.skin,-8),null,tag));
    if(model.detail!=='far'){
      s.push(face([p(wrist.x-r,top,z-.034),p(wrist.x+r,top,z-.034),p(wrist.x+r,top,z+.034),p(wrist.x-r,top,z+.034)],shade(model.skin,9),null,tag));
      line(s,p(wrist.x-side*.012,bottom+.008,z-.035),p(wrist.x-side*.012,top-.012,z-.035),'#b99b78',meta('hand-fingers'));
    }
  }
  oval(s,q.x,q.y+.008,q.z,w*.59,actor.depth*.65,'rgba(57,77,52,.13)',{actorShadow:actor.id});
}
function styledFixedVisitorShapes(s,actor,goals,world){
  const q=actor.position,h=actor.height,w=actor.width,child=actor.kind==='child',index=world.actors.findIndex(a=>a.id===actor.id),goal=goals.find(g=>g.kind==='cone'&&child||g.kind==='mitt'&&Math.abs(g.center.x-q.x)<.1||g.kind==='coffee'&&actor.id.includes('coffee')||g.kind==='soda'&&actor.id.includes('soda'));
  const appearance={age:child?'child':index%3===2?'elder':'adult',build:child?'slim':index%3===0?'broad':'regular',clothing:child?'hoodie':index%3===1?'coat':'sweater',hair:child?'bob':index%3===2?'silver':index%3===1?'ponytail':'short',hat:world.worldVersion===31&&index%2===0?'cap':'none',bag:world.worldVersion===32&&!child?'shoulder':'none',skin:child?'#e5bd98':'#d8b48f',gesture:child?'hold-cone':'hold-goal'};
  const joints={head:p(q.x,q.y+h*.91,q.z),hip:p(q.x,q.y+h*.48,q.z)};
  for(const [name,side] of [['left',-1],['right',1]]){
    joints[`${name}Shoulder`]=p(q.x+side*w*.38,q.y+h*.77,q.z);
    joints[`${name}Elbow`]=p(q.x+side*w*.44,q.y+h*.57,q.z-.035);
    joints[`${name}Wrist`]=p(q.x+side*w*.48,q.y+h*.44,q.z-.045);
    joints[`${name}Knee`]=p(q.x+side*w*.22,q.y+h*.24,q.z);joints[`${name}Foot`]=p(q.x+side*w*.22,q.y+.035,q.z-.035);
    if(goal&&(child||name==='right')){
      joints[`${name}Wrist`]=child?p(goal.center.x+side*.16,goal.center.y-.27,goal.center.z-.025):p(goal.center.x,goal.center.y-.18,goal.center.z+.035);
      joints[`${name}Elbow`]=p(joints[`${name}Shoulder`].x+side*.025,(joints[`${name}Shoulder`].y+joints[`${name}Wrist`].y)/2-.07,(q.z+joints[`${name}Wrist`].z)/2);
    }
  }
  shrineCrowdVisitorShapes(s,{...actor,appearance,joints,facing:-1});
}
function stadiumCatcherShapes(s,actor,goals){
  const q=actor.position,h=actor.height,w=actor.width,goal=goals.find(g=>g.id===actor.mittGoalId),a=actor.appearance??{};
  const appearance={age:'adult',build:a.shirt==='hoodie'?'broad':'regular',clothing:a.shirt==='jacket'?'coat':a.shirt==='hoodie'?'hoodie':'jersey',hair:a.hair??'short',hat:a.hat??'none',bag:'none',skin:a.skin??'#d8b48f',gesture:'await-catch'};
  const joints={head:p(q.x,q.y+h*.91,q.z),hip:p(q.x,q.y+h*.48,q.z)};
  for(const [name,side] of [['left',-1],['right',1]]){
    joints[`${name}Shoulder`]=p(q.x+side*w*.39,q.y+h*.77,q.z);
    joints[`${name}Elbow`]=p(q.x+side*.34,q.y+h*.65,q.z-.14);
    joints[`${name}Wrist`]=p(goal.center.x+side*.29,goal.center.y-.52,goal.center.z+.07);
    joints[`${name}Knee`]=p(q.x+side*w*.22,q.y+h*.24,q.z);joints[`${name}Foot`]=p(q.x+side*w*.22,q.y+.035,q.z-.035);
  }
  const figures=[];shrineCrowdVisitorShapes(figures,{...actor,appearance,joints,facing:-1});
  s.push(...figures.map(shape=>({...shape,stadiumFan:true,stadiumFacing:p(0,0,-1),catchGesture:'both-hands-lift-glove',supportSolidId:actor.supportSolidId})));
  if(a.shirt==='jersey'){
    const meta={actorId:actor.id,stadiumFan:true,stadiumFacing:p(0,0,-1),visitorPart:'jersey-trim'};
    line(s,p(q.x,q.y+h*.48,q.z-actor.depth*.395),p(q.x,q.y+h*.74,q.z-actor.depth*.35),'#eee7d0',meta);
    for(const side of [-1,1])line(s,p(q.x+side*w*.31,q.y+h*.71,q.z-actor.depth*.32),p(q.x+side*w*.16,q.y+h*.70,q.z-actor.depth*.41),'#e9dfc3',meta);
  }
}
function stadiumMittShapes(s,goal){
  // The gameplay aperture intentionally remains forgiving. Its surrounding
  // leather is an unmistakably oversized toy glove: separate finger lobes,
  // curved thumb, woven web, deep pocket, lacing and a wrist cuff, rather than
  // a uniformly scaled circle claiming to be a regulation-size mitt.
  aperture(s,goal);
  const {at}=basis(goal),r=goal.radius,meta=part=>({goalId:goal.id,goalRole:goal.role,goalKind:goal.kind,mittPart:part,intentionalScale:'oversized-toy-glove'});
  const colors=['#c39b63','#cda96f','#bf945e','#b68a57'];
  for(let i=0;i<4;i++){
    const x=[-.45,-.19,.075,.335][i],edge=Math.sqrt(Math.max(0,r*r-x*x)),length=[.34,.52,.62,.45][i],center=at(x,edge+length/2,-.015);
    ellipsoid(s,center.x,center.y,center.z,.115,length/2+.015,.12,colors[i],8,4,meta('finger-lobe'));
    for(const dy of [length*.30,length*.64]){const a=at(x-.083,edge+dy,.105),b=at(x+.083,edge+dy,.105);line(s,a,b,'#e5c38d',meta('finger-lacing'));}
  }
  const thumb=at(-r-.15,r*.02,-.02);ellipsoid(s,thumb.x,thumb.y,thumb.z,.20,.38,.14,'#c39b63',8,4,meta('curved-thumb'));
  const cuff=at(0,-r-.035,-.025);ellipsoid(s,cuff.x,cuff.y,cuff.z,.29,.105,.14,'#a87d4d',6,2,meta('wrist-cuff'));
  for(let angle=.35;angle<Math.PI*2+.35;angle+=Math.PI/8){
    const a=at(Math.cos(angle)*(r+.021),Math.sin(angle)*(r+.021),.005),b=at(Math.cos(angle+.10)*(r+.021),Math.sin(angle+.10)*(r+.021),.005);
    line(s,a,b,'#e7c995',meta('pocket-stitch'));
  }
  // The web stays outside the real opening; no decorative face caps a valid
  // arrival plane. Its diamonds give a glove-specific silhouette at a glance.
  for(let i=0;i<4;i++){
    line(s,at(-r-.18,r*.15+i*.10,.105),at(-r*.72,r*.62+i*.10,.105),'#a27648',meta('woven-web'));
    line(s,at(-r-.16+i*.075,r*.20,.105),at(-r*.76+i*.055,r*.93,.105),'#e2bd83',meta('woven-web'));
  }
}
function boatDetails(s,boat,time,reducedMotion=false){
  const q=boat.position,w=boat.width??2,d=boat.depth??1.1,h=boat.height??.55,steam=boat.kind==='steamship',color=steam?'#cfdbcd':'#d4b878',meta={boatDetailId:boat.id};
  // Thin cabin windows, a cream rubbing strake and a painted bow distinguish
  // boat silhouettes while retaining the shared rectangular contact hull.
  for(const side of [-1,1])for(let x=-w*.33;x<w*.32;x+=w*.19){const z=q.z+side*(d*.5+.012);
    box(s,q.x+x,q.y+h*.30,z-.004,w*.11,h*.32,.008,'#e7c88b',meta);
    box(s,q.x+x+w*.044,q.y+h*.30,z-.008,w*.018,h*.32,.009,'#6f887d',meta);}
  for(const side of [-1,1]){
    const z=q.z+side*(d*.5+.018);
    box(s,q.x-w*.47,q.y+h*.17,z-.003,w*.94,h*.09,.006,color,meta);
    line(s,p(q.x-w*.43,q.y+h*.75,z),p(q.x+w*.43,q.y+h*.75,z),color,meta);
  }
  flat(s,q.x-w*.46,q.y+h+.007,q.z-d*.45,w*.92,d*.90,steam?'#819e92':'#997952',meta);
  if(steam){
    // The scoop-like bow is a decorative plate within the real hull width.
    s.push(face([p(q.x+w*.43,q.y+h*.22,q.z-d*.5-.02),p(q.x+w*.49,q.y+h*.45,q.z-d*.5-.02),p(q.x+w*.38,q.y+h*.45,q.z-d*.5-.02)],'#b7c8b6',null,meta));
    const t=reducedMotion?0:time;
    for(let i=0;i<3;i++){
      const age=((t*.37+i*.34)%1+1)%1,x=q.x-.08-age*.32,y=2.8+age*.8,z=q.z+.03,r=.11+age*.12,smoke=[];
      ellipsoid(smoke,x,y,z,r,r*.85,r*.8,'#78918f',8,3,meta);
      s.push(...smoke.map(shape=>({...shape,fill:transparent(shape.fill,.23*(1-age)),depthWrite:false})));
    }
  }else{
    // The pitched canopy is quiet scenery above the contact hull; it never
    // covers the mouth of a goal or adds an unrecorded gameplay obstacle.
    const a=q.x-w*.49,b=q.x+w*.49,front=q.z-d*.51,back=q.z+d*.51,edge=q.y+h+.025,ridge=edge+.20;
    s.push(face([p(a,edge,front),p(b,edge,front),p(b,ridge,q.z),p(a,ridge,q.z)],'#8d9267',null,meta));
    s.push(face([p(a,ridge,q.z),p(b,ridge,q.z),p(b,edge,back),p(a,edge,back)],'#626f5f',null,meta));
    for(const x of [a+.1,b-.1])line(s,p(x,q.y+h*.3,front-.006),p(x,edge,front-.006),'#d0b67d',meta);
  }
}
function limb(s,a,b,r,color,metadata={}){
  const axis=unit(p(b.x-a.x,b.y-a.y,b.z-a.z)),right=unit(cross(axis,Math.abs(axis.y)>.8?p(0,0,1):p(0,1,0))),up=cross(axis,right),n=6;
  const ring=q=>Array.from({length:n},(_,i)=>add(q,add(scale(right,Math.cos(i/n*Math.PI*2)*r),scale(up,Math.sin(i/n*Math.PI*2)*r)))),lo=ring(a),hi=ring(b);
  for(let i=0;i<n;i++)s.push(face([lo[i],lo[(i+1)%n],hi[(i+1)%n],hi[i]],shade(color,i%2?-6:6),null,metadata));
}
function heldObjects(s,actors,goals){
  for(const goal of goals){
    const actor=goal.kind==='hand'?actors.find(a=>a.kind==='raised-hand'):goal.kind==='cone'?actors.find(a=>a.kind==='child'):goal.kind==='coffee'?actors.find(a=>a.id.includes('coffee')):goal.kind==='soda'?actors.find(a=>a.id.includes('soda')):goal.kind==='mitt'?actors.find(a=>Math.abs(a.position.x-goal.center.x)<.1):null;
    if(!actor)continue;
    if(goal.kind==='cone'){
      // Both raised hands make the cone read as a held object above the child,
      // rather than as a hat hiding the child's head in the default view.
      for(const side of [-1,1]){
        const q=actor.position,start=p(q.x+side*actor.width*.40,q.y+actor.height*.68,q.z-actor.depth*.12),end=p(goal.center.x+side*.16,goal.center.y-.27,goal.center.z-.025),elbow=p(start.x+side*.025,start.y+.16,(start.z+end.z)/2);
        limb(s,start,elbow,.045,actor.color??'#d2a456',{gestureActorId:actor.id});limb(s,elbow,end,.04,'#e7c79f',{gestureActorId:actor.id});
        ellipsoid(s,end.x,end.y,end.z,.053,.061,.052,'#edcfaa',6,2,{gestureActorId:actor.id});
      }
      continue;
    }
    const q=actor.position,h=actor.height,side=goal.center.x<q.x?-1:1,start=p(q.x+side*actor.width*.34,q.y+h*.7,q.z-actor.depth*.2),end=goal.kind==='hand'?p(goal.center.x,goal.center.y-.055,goal.center.z-goal.radius-.070):p(goal.center.x,goal.center.y-.18,goal.center.z+.035),middle=p((start.x+end.x)/2,(start.y+end.y)/2-.05,(start.z+end.z)/2);
    limb(s,start,middle,.045,actor.color??'#819b82',{gestureActorId:actor.id});limb(s,middle,end,.037,'#e4c49c',{gestureActorId:actor.id});
  }
}
const batterActor=world=>({id:'baseball-batter',kind:'batter',position:p(world.origin.x-.48,Math.max(0,world.origin.y-1.05),world.origin.z-.15),width:.46,depth:.34,height:1.72,color:'#eee6cf'});
function batSwing(s,world,time,options){
  if(typeOf(world)!=='baseball')return;
  const o=world.origin;
  // A cosmetic bat arc uses the existing flight elapsed time; it changes no
  // launch direction, speed or user input. Capture is not required to swing.
  const elapsed=options.flightTime??0,active=options.phase==='flying'&&elapsed<.55,angle=active?-.55+Math.min(1,elapsed/.34)*2.2:-.55;
  const hand=p(o.x-.29,o.y-.03,o.z-.08),tip=p(hand.x+Math.cos(angle)*.71,hand.y+.15+Math.sin(angle)*.12,hand.z+Math.sin(angle)*.58);
  line(s,hand,tip,'#ba9564',{batterBat:true});line(s,p(hand.x+.025,hand.y,hand.z),p(tip.x+.025,tip.y,tip.z),'#d1ac76',{batterBat:true});
}
export function outdoorMotionShapes(time,world,options={}){
  if(typeof options==='boolean')options={reducedMotion:options};
  if(world?.environment!=='outdoor')throw new RangeError('A frozen outdoor world is required');
  const motion=outdoorMotion(world,time),shapes=[],movingFigures=['shrine','river'].includes(typeOf(world));
  if(world.worldVersion===60){shapes.push(...ballparkMotionShapes({...world,worldVersion:36},time,options),...finishedBatterShapes(world,options),...outdoorEffectShapes(world,time,options));return shapes;}
  if(world.worldVersion===36){shapes.push(...ballparkMotionShapes(world,time,options));batSwing(shapes,world,time,options);shapes.push(...outdoorEffectShapes(world,time,options));return shapes;}
  if([35,37].includes(world.worldVersion)){
    const lit=lightShapes(riverPhysicalMotionShapes(world,motion,time,options),motion.lamps??[],true,riverLightOptions(world));
    lit.push(...outdoorLampShapes(motion.lamps??[],{waterY:world.water?.y??0,waterBounds:world.water}));
    lit.push(...outdoorEffectShapes(world,time,options));
    return lit;
  }
  if(movingFigures)for(const actor of motion.actors??[]){if(world.worldVersion===30)shrineCrowdVisitorShapes(shapes,actor);else if(typeOf(world)==='shrine')shrineWorshipperShapes(shapes,actor,time,!!options.reducedMotion);else actorShapes(shapes,actor,time,!!options.reducedMotion);}
  const dynamic=outdoorDynamicSolids(world,time),actorIds=new Set((motion.actors??[]).map(actor=>actor.id)),actorSolidIds=new Set((motion.actors??[]).flatMap(actor=>(actor.colliders??[]).map(c=>c.id)));
  for(const solid of dynamic){if(actorIds.has(solid.object)||actorIds.has(solid.actorId)||actorSolidIds.has(solid.id)||solid.kind==='actor'||solid.kind==='person'||solid.kind==='crowd'||solid.kind==='student')continue;
    const boat=motion.boats.find(b=>b.id===solid.object),color=boat&&solid.kind==='boat-hull'?(boat.kind==='steamship'?'#587f7b':'#b29462'):surfaceColor(solid,world);
    physicalBox(shapes,solid,color);}
  for(const boat of motion.boats??[])boatDetails(shapes,boat,time,!!options.reducedMotion);
  if(movingFigures){for(const goal of motion.goals??[]){if(typeOf(world)==='shrine'&&goal.kind==='hand')shrineRaisedHandShapes(shapes,goal);else if(world.worldVersion===30&&goal.id==='shrine-inari'){const mouth=[];aperture(mouth,goal);shapes.push(...mouth.map(m=>({...m,fill:m.opening?'#bb9864':m.fill,inariOpening:true})));}else aperture(shapes,goal);}heldObjects(shapes,motion.actors,motion.goals);}
  batSwing(shapes,world,time,options);
  const lit=typeOf(world)==='river'?lightShapes(shapes,motion.lamps??[]):shapes;
  lit.push(...outdoorLampShapes(motion.lamps??[],{waterY:world.water?.y??0,waterBounds:world.water}));
  lit.push(...outdoorEffectShapes(world,time,options));
  return lit;
}
