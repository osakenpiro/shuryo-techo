// City decoration stays outside the flight corridor; the two main buildings
// and the open window are drawn from their actual contact boxes by the caller.
import {releaseChapterWind} from './release-chapters-world.mjs?v=20261018-chapters67-1';
const p=(x,y,z)=>({x,y,z}),face=(points,fill,extra={})=>({points,fill,stroke:null,decoration:true,...extra});
const flat=(s,x,z,w,d,y,fill,extra={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y,z+d),p(x,y,z+d)],fill,extra));
const panel=(s,x,y,z,w,h,fill,extra={})=>s.push(face([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],fill,extra));
export function rooftopVisibleShapes(shapes,camera){
 if(!camera||!['x','y','z'].every(k=>Number.isFinite(camera[k])))return shapes;
 return shapes.filter(s=>{
  if(!s.physical||s.points.length<3)return true;
  const [a,b,c]=s.points,u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
  // The shared contact-box meshes have inward winding. Keep only the outward
  // side facing the eye; the physical collider and aperture stay untouched.
  const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
  return n.x*(camera.x-a.x)+n.y*(camera.y-a.y)+n.z*(camera.z-a.z)<-1e-8;
 });
}
function skyline(s,x,z,w,d,h){
 s.push(face([p(x,0,z),p(x+w,0,z),p(x+w,h,z),p(x,h,z)],'#9fb5b0',{skyline:true}));
 s.push(face([p(x+w,0,z),p(x+w,0,z+d),p(x+w,h,z+d),p(x+w,h,z)],'#8da8a3',{skyline:true}));
 s.push(face([p(x,h,z),p(x+w,h,z),p(x+w,h,z+d),p(x,h,z+d)],'#bdcbbd',{skyline:true}));
 for(let y=2;y<h-1;y+=3)for(let a=.6;a<w-.4;a+=1.8)panel(s,x+a,y,z-.008,.75,1.05,'#c6d9d0',{skyline:true});
}
export function rooftopDetails(world){
 const s=[],roof=world.roofHeight,g=world.goals[0],c=g.center,left=c.x-g.halfWidth,right=c.x+g.halfWidth,bottom=c.y-g.halfHeight,top=c.y+g.halfHeight;
 flat(s,-3.5,2.6,7,25,.012,'#7c8d87',{street:true});
 for(const x of [-4.5,3.5])flat(s,x,2.6,1,25,.025,'#c1c5af',{sidewalk:true});
 for(let z=4;z<27;z+=3)flat(s,-.045,z,.09,1.1,.018,'#e1c276',{street:true});
 flat(s,-4.92,-8,9.84,10.18,roof+.012,'#c5d0ba',{roof:true});
 for(let z=-7;z<2;z+=1.5)s.push({points:[p(-4.9,roof+.018,z),p(4.9,roof+.018,z)],line:true,stroke:'#b7c3ad',decoration:true,roof:true});
 for(const x of [-4.7,3.1])for(let z=-5;z<-.5;z+=1.3)flat(s,x,z,1.2,.75,roof+.025,'#7d9990',{roof:true});
 // Warm open room behind the real facade aperture. The goal plane is inside.
 panel(s,left+.04,bottom+.04,31.79,g.halfWidth*2-.08,g.halfHeight*2-.08,'#dfd1aa',{windowInterior:true});
 panel(s,left+.35,bottom+.4,31.775,.75,1.1,'#b7c5a2',{windowInterior:true});
 panel(s,left+1.4,bottom+.55,31.77,.8,.7,'#c5a572',{windowInterior:true});
 flat(s,left+.06,28.1,g.halfWidth*2-.12,3.64,bottom+.012,'#c5bd99',{windowInterior:true});
 // Frame paint lies outside the contact opening and does not shrink it.
 panel(s,left-.11,bottom-.11,27.986,.11,g.halfHeight*2+.22,'#527e72',{windowFrame:true});
 panel(s,right,bottom-.11,27.986,.11,g.halfHeight*2+.22,'#527e72',{windowFrame:true});
 panel(s,left,bottom-.11,27.984,g.halfWidth*2,.11,'#527e72',{windowFrame:true});
 panel(s,left,top,27.984,g.halfWidth*2,.11,'#527e72',{windowFrame:true});
 for(const x of [-4.8,-2.9,3.0,4.8])for(const y of [2.2,5.2,8.2,15.2,17.2])panel(s,x-.45,y,27.98,.9,1.35,'#769a94',{closedWindow:true});
 for(const x of [-3.5,0,3.5])for(const y of [2.2,5.1,8,10.3])panel(s,x-.5,y,2.406,1,1.25,'#799f95',{sourceWindow:true});
 s.push({points:[p(-2.5,roof+.02,1.2),p(-2.5,roof+2.45,1.2)],line:true,stroke:'#718d80',decoration:true,windMast:true});
 for(const [x,z,w,d,h]of [[-15,6,5,5,9],[-17,22,6,6,15],[10,9,5,6,10],[12,24,6,5,16],[-12,38,5,6,11],[10,42,5,5,14]])skyline(s,x,z,w,d,h);
 return s;
}
export function rooftopMotionShapes(world,time){
 const s=[],roof=world.roofHeight;
 for(const [x,y,z]of [[-2.5,roof+2.4,1.2],[-1.3,13.7,27.97]]){
  const wind=releaseChapterWind(world,time,p(x,y,z)),gain=Math.abs(wind.x)/world.wind.x,sign=Math.sign(wind.x)||1,length=.38+.65*gain,wave=Math.sin(time*3.1+z)*.07;
  s.push(face([p(x,y,z),p(x+sign*length,y-.07,z+wave),p(x+sign*length*.86,y-.31,z+wave*.6),p(x,y-.24,z)],'#d4a853',{windFlag:true,windX:wind.x}));
 }
 for(let i=0;i<6;i++){
  const z=6+i*3.5,y=12.6+(i%3)*.35,wind=releaseChapterWind(world,time,p(0,y,z)),phase=((time*.18+i*.17)%1),x=-2.6+phase*5.2,length=.18+Math.abs(wind.x)*.35;
  s.push({points:[p(x,y,z),p(x+length,y+.02,z+.03)],line:true,stroke:'#d6bd82',decoration:true,windStreak:true,windX:wind.x});
 }
 return s;
}
