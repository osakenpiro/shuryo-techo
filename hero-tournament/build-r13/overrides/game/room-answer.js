// Presentation only: authoritative two-beat result is already resolved.
import {FEEL,mountFeedback,reducedMotion,presentBeat,presentFinish} from './battle-feedback.js';
let timer,currentReveal;
const started=new Map(),finished=new Set();
const nextButtons=()=>document.querySelectorAll('[data-action="ORDER_NEXT"],[data-action="RESULT_REVIEW_NEXT"]');
function show(answer,beat,complete,{silent=false}={}){
 answer.querySelectorAll('[data-beat]').forEach(e=>{e.classList.toggle('is-visible',Number(e.dataset.beat)<=beat);e.classList.toggle('is-current',!complete&&Number(e.dataset.beat)===beat);});
 answer.classList.toggle('is-complete',complete);answer.dataset.ready=String(complete);
 nextButtons().forEach(e=>e.disabled=!complete);const skip=answer.querySelector('[data-answer-finish]');if(skip)skip.hidden=complete;
 for(let n=1;n<=beat;n++)presentBeat(answer,currentReveal,n,{silent:silent||complete||n!==beat,startedAt:started.get(answer.dataset.answerKey)});
 if(complete){finished.add(answer.dataset.answerKey);presentFinish(answer,currentReveal,{silent,startedAt:started.get(answer.dataset.answerKey)});}
}
export function finishRoomAnswer(){clearTimeout(timer);const answer=document.querySelector('#combat-answer');if(answer)show(answer,2,true,{silent:true});}
export function paintRoomAnswer(duel){
 mountFeedback();clearTimeout(timer);currentReveal=duel?.reveal;const answer=document.querySelector('#combat-answer');if(!answer)return;
 const key=answer.dataset.answerKey;if(!started.has(key)){started.set(key,performance.now());if(started.size>128){const old=started.keys().next().value;started.delete(old);finished.delete(old);}}
 const paint=()=>{if(!answer.isConnected)return;const elapsed=performance.now()-started.get(key),quiet=finished.has(key)||reducedMotion()||document.hidden||elapsed>FEEL.completeMs+250,complete=quiet||elapsed>=FEEL.completeMs;
  show(answer,elapsed>=FEEL.secondBeatMs||complete?2:1,complete,{silent:quiet});if(!complete)timer=setTimeout(paint,Math.max(10,(elapsed<FEEL.secondBeatMs?FEEL.secondBeatMs:FEEL.completeMs)-elapsed));
 };paint();
}
