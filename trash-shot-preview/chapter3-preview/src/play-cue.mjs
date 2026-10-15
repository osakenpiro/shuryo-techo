import {cueDirectionPoint,projectCueSegments,projectCuePolygon} from './pull-cue.mjs?v=20261015-factory-machines-2';

const point=p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`;
const path=segments=>segments.map(s=>`M ${point(s.from)} L ${point(s.to)}`).join(' ');
// Follow the live launch pose, including a moving platform. Once a shot ends,
// arc controls still describe the next launch rather than the resting ball.
export function launchCueOrigin(game,origin={x:0,y:1.05,z:0}){
  if(game?.phase==='ready')return {...game.can.position};
  return {...origin,y:origin.y+(game?.can?.radius??.14)-.14};
}
/** A launch vector, never a predicted flight. The same speed scales the arrow
 * and the accepted 13-point golden sector in either projection. */
export function createPlayCue(origin,aim,project,width,height){
  const direction=cueDirectionPoint(origin,aim),projectPath=points=>projectCueSegments(points,project,width,height);
  const projectedOrigin=project(origin),originVisible=projectedOrigin&&Number.isFinite(projectedOrigin.x)&&Number.isFinite(projectedOrigin.y)&&(projectedOrigin.depth??1)>=.11&&projectedOrigin.x>=0&&projectedOrigin.x<=width&&projectedOrigin.y>=0&&projectedOrigin.y<=height;
  const initial=projectPath([origin,direction]);
  const anglePoints=Array.from({length:13},(_,i)=>cueDirectionPoint(origin,{...aim,elevation:aim.elevation*i/12}));
  const angleArc=projectPath(anglePoints),sector=projectCuePolygon([origin,...anglePoints],project,width,height);
  const flat=projectPath([origin,anglePoints[0]]);
  return {origin:{...origin},projectedOrigin,originVisible,parameters:{...aim},direction,arrowWorldLength:aim.power*.1,
    initial,angleArc,sector,flat,visible:initial.segments.length>0||angleArc.segments.length>0};
}
export function playCueMarkup(cue,{risk=false}={}){
  const color=risk?'#d77e39':'#b56b2e';
  let html=cue.sector.length>=3?`<path data-cue="angle-fan" d="M ${cue.sector.map(point).join(' L ')} Z" fill="#daad4b2e"/>`:'';
  html+=`<path data-cue="angle-arc" d="${path(cue.angleArc.segments)}" fill="none" stroke="#c49942" stroke-width="1.4"/><path data-cue="angle-flat" d="${path(cue.flat.segments)}" fill="none" stroke="#8f997ba6" stroke-width="1"/><path data-cue="initial" d="${path(cue.initial.segments)}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  if(cue.originVisible){const p=cue.projectedOrigin;html+=`<g data-cue="launch-origin"><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="6" fill="none" stroke="#fffaf0" stroke-width="3"/><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="6" fill="none" stroke="${color}" stroke-width="1.3"/></g>`;}
  const last=cue.initial.segments.at(-1),tip=last?.to;
  if(tip&&cue.initial.length>=8){const angle=Math.atan2(tip.y-last.from.y,tip.x-last.from.x),wing=7;
    const left={x:tip.x-Math.cos(angle)*wing+Math.sin(angle)*4,y:tip.y-Math.sin(angle)*wing-Math.cos(angle)*4};
    const right={x:tip.x-Math.cos(angle)*wing-Math.sin(angle)*4,y:tip.y-Math.sin(angle)*wing+Math.cos(angle)*4};
    html+=`<path data-cue="arrowhead" d="M ${point(tip)} L ${point(left)} L ${point(right)} Z" fill="${color}"/>`;
  }
  return html;
}
/** Compressed elastic handle follows the very angular delta released by C. */
export function pullHandleMarkup(gesture,aim,side=false,sign=-1,anchor=null){
  const anchored=anchor&&Number.isFinite(anchor.x)&&Number.isFinite(anchor.y);
  const size=gesture.scale?.ready?gesture.scale.size:1,ox=anchored?anchor.x:gesture.startX-gesture.rect.left,oy=anchored?anchor.y:gesture.startY-gesture.rect.top;
  const right=(gesture.lastX-gesture.startX)*sign,up=(gesture.startY-gesture.lastY)*sign;
  const angle=side?aim.actual.elevation*Math.PI/180:Math.atan2(up,right),length=side?aim.effectiveDistance*size:Math.hypot(right,aim.effectiveDistance*size);
  const tx=side?ox+sign*Math.cos(angle)*length:ox+sign*(right+(aim.delta?.yaw??0)/60*(gesture.scale?.yawSize??size));
  const ty=side?oy-sign*Math.sin(angle)*length:oy-sign*aim.effectiveDistance*size;
  const color=aim.risk?'#d77e39':'#438f88';
  return `<g data-cue="pull-handle" data-anchor="${anchored?'ball':'pointer'}"><line x1="${ox}" y1="${oy}" x2="${tx}" y2="${ty}" stroke="${color}" stroke-width="3" stroke-linecap="round"/><circle data-cue="pull-origin" cx="${ox}" cy="${oy}" r="4" fill="${anchored?'none':'#fffaf0'}" stroke="#438f88" stroke-width="2"/><circle cx="${tx}" cy="${ty}" r="5" fill="${color}"/></g>`;
}
