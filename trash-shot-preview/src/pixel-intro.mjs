import {createGame,throwCan,stepGame,resetShot,getSnapshot} from './physics.mjs?v=20261011-first-chapter-1';
import {sideAim} from './side-aim.mjs?v=20261011-first-chapter-1';
import {drawPixelText} from './pixel-type.mjs?v=20261011-first-chapter-1';
import {paintScreenQuad} from './room-scene.mjs?v=20261011-first-chapter-1';

export const INTRO_SETUP=Object.freeze({distance:4,height:.8});
export function createIntroGame(){return createGame(INTRO_SETUP);}
export function launchIntroVector(game,dx,up,size){
  const aim=sideAim(dx,up,size);
  return aim.valid&&throwCan(game,{power:aim.power,elevation:aim.elevation,yaw:0});
}
const activePhase=game=>game.phase==='flying'||game.phase==='settling';
export function createPixelIntro(canvas,{onReveal=()=>{},onDone=()=>{},reducedMotion=false,inputScheme=()=> 'pull'}={}){
  const image=document.createElement('canvas');image.width=256;image.height=144;
  const ink=image.getContext('2d'),ctx=canvas.getContext('2d');
  let game=createIntroGame(),mode='off',gesture=null,elapsed=0,trustedLaunch=false,cleared=false;
  const point=p=>({x:Math.round(40+p.z*35),y:Math.round(116-p.y*35)});
  function cancel(){const old=gesture;gesture=null;if(old&&canvas.hasPointerCapture(old.id))canvas.releasePointerCapture(old.id);}
  function start(){cancel();game=createIntroGame();mode='playing';elapsed=0;trustedLaunch=false;cleared=false;paint();}
  function reveal(skip=false,trusted=false){cancel();cleared=!skip;mode='pullback';elapsed=0;onReveal({cleared,shouldPersist:skip?trusted:trustedLaunch});}
  function down(event){
    if(mode!=='playing'||event.button!==0||activePhase(game))return;
    if(gesture){cancel();return;}
    if(['miss','success'].includes(game.phase))resetShot(game);
    const rect=canvas.getBoundingClientRect();gesture={id:event.pointerId,x:event.clientX,y:event.clientY,rect,aim:sideAim(0,0,Math.min(rect.width,rect.height))};
    canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  }
  function move(event){if(!gesture||gesture.id!==event.pointerId)return;const r=canvas.getBoundingClientRect();if(r.width!==gesture.rect.width||r.height!==gesture.rect.height||r.top!==gesture.rect.top||r.left!==gesture.rect.left){cancel();return;}const sign=inputScheme()==='pull'?-1:1;gesture.aim=sideAim((event.clientX-gesture.x)*sign,(gesture.y-event.clientY)*sign,Math.min(r.width,r.height));}
  function up(event){
    if(!gesture||event.pointerId!==gesture.id)return;move(event);if(!gesture)return;
    const aim=gesture.aim;cancel();if(aim.valid&&throwCan(game,{...aim,yaw:0})){trustedLaunch=event.isTrusted;elapsed=0;}
  }
  function line(a,b,color){let x=Math.round(a.x),y=Math.round(a.y),tx=Math.round(b.x),ty=Math.round(b.y),dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,error=dx+dy;ink.fillStyle=color;for(let i=0;i<512;i++){ink.fillRect(x,y,1,1);if(x===tx&&y===ty)break;const e=error*2;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;}}}
  function paint(){
    ink.fillStyle='#f4ead5';ink.fillRect(0,0,256,144);
    drawPixelText(ink,'TRASH SHOT',128,13,{scale:2,color:'#286864',align:'center'});
    line({x:25,y:117},{x:228,y:117},'#aaa087');
    const b=game.bin,r=Math.round(b.radius*35),h=Math.round(b.height*35),x=40+b.center.z*35;
    ink.fillStyle='#438f88';ink.fillRect(x-r-3,116-h,3,h+3);ink.fillRect(x+r,116-h,3,h+3);ink.fillRect(x-r,116,2*r,3);
    ink.fillStyle='#e8b54e';ink.fillRect(x-r-4,115-h,5,2);ink.fillRect(x+r-1,115-h,5,2);
    const c=point(game.can.position);ink.fillStyle='#e98238';ink.fillRect(c.x-3,c.y-4,6,8);ink.fillStyle='#d9dfd7';ink.fillRect(c.x-3,c.y-5,6,2);
    if(gesture?.aim.valid){const angle=gesture.aim.elevation*Math.PI/180,n=14+gesture.aim.power*2;line(c,{x:c.x+Math.cos(angle)*n,y:c.y-Math.sin(angle)*n},'#c17b3d');}
    if(game.phase==='success')drawPixelText(ink,'CLEAR',128,49,{scale:2,color:'#438f88',align:'center'});
    if(game.phase==='miss')drawPixelText(ink,'TRY AGAIN',128,49,{scale:1,color:'#a47b4c',align:'center'});
  }
  function advance(dt){
    if(mode==='playing'){
      stepGame(game,dt);
      if(game.phase==='success'){elapsed+=dt;if(elapsed>=.3)reveal(false);}
      paint();
    }else if(mode==='pullback'){
      elapsed+=dt;if(elapsed>=(reducedMotion ? .18 : 1.8)){mode='off';onDone({cleared});}
    }
  }
  function render(quad){
    if(mode==='off')return;
    const rect=canvas.getBoundingClientRect(),ratio=canvas.width/rect.width;ctx.setTransform(ratio,0,0,ratio,0,0);
    const scale=Math.max(1,Math.floor(Math.min(rect.width/256,rect.height/144))),w=image.width*scale,h=image.height*scale,left=(rect.width-w)/2,top=(rect.height-h)/2;
    const full=[{x:left,y:top},{x:left+w,y:top},{x:left+w,y:top+h},{x:left,y:top+h}];
    if(mode==='playing'){ctx.fillStyle='#f4ead5';ctx.fillRect(0,0,rect.width,rect.height);paintScreenQuad(ctx,image,full);return;}
    const t=Math.min(1,elapsed/(reducedMotion ? .18 : 1.8));
    if(reducedMotion){ctx.save();ctx.globalAlpha=1-t;ctx.fillStyle='#f4ead5';ctx.fillRect(0,0,rect.width,rect.height);paintScreenQuad(ctx,image,full);ctx.restore();return;}
    const eased=t*t*(3-2*t),destination=quad?.length===4&&quad.every(p=>p.visible!==false)?quad:full;
    paintScreenQuad(ctx,image,full.map((p,i)=>({x:p.x+(destination[i].x-p.x)*eased,y:p.y+(destination[i].y-p.y)*eased})));
  }
  paint();
  return {start,cancel,down,move,up,advance,render,skip:trusted=>{if(mode==='playing')reveal(true,trusted);},retry:()=>{if(mode==='playing'&&!activePhase(game)){resetShot(game);paint();}},get active(){return mode!=='off';},get image(){return image;},get cameraProgress(){if(mode!=='pullback'||reducedMotion)return null;const t=Math.min(1,elapsed/1.8);return t*t*(3-2*t);},snapshot:()=>({active:mode!=='off',mode,elapsed,cleared,gesture:gesture?{...gesture.aim}:null,world:getSnapshot(game)})};
}
