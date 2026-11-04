// Presentation only. All cues derive from an already public, resolved reveal.
export const FEEL=Object.freeze({secondBeatMs:650,completeMs:1350,hitHoldMs:55,counterHoldMs:90,volume:.18});
export function beatCue(b={}) {
 const counter=Number(b.counterSpent)>0&&Number(b.dealt)>0;
 const foeCounter=Number(b.foeCounterSpent)>0&&Number(b.taken)>0;
 const guard=!!b.guarded,foeGuard=!!b.foeGuarded;
 return {kind:counter||foeCounter?'counter':guard||foeGuard?'guard':b.dealt>0||b.taken>0?'hit':'quiet',counter,foeCounter,guard,foeGuard,damage:b.dealt>0||b.taken>0};
}
export function finalCue(reveal) {
 const a=reveal?.resources?.after;if(!a||!Number.isFinite(a.hp)||!Number.isFinite(a.foeHp))return null;
 return a.hp<=0&&a.foeHp<=0?'double':a.foeHp<=0?'win':a.hp<=0?'loss':null;
}
const PREF='hero-battle-feedback-v1',SEEN='hero-battle-cues-v1';
let prefs={sound:true,motion:true},audio,master,installed=false,hiddenSince=0;
let played=new Set();
try{const p=JSON.parse(globalThis.localStorage?.getItem(PREF)||'null');if(p&&typeof p.sound==='boolean')prefs.sound=p.sound;if(p&&typeof p.motion==='boolean')prefs.motion=p.motion;}catch{}
try{const s=JSON.parse(globalThis.sessionStorage?.getItem(SEEN)||'[]');if(Array.isArray(s))played=new Set(s.filter(x=>typeof x==='string').slice(-128));}catch{}
export function reducedMotion(){return !prefs.motion||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;}
function remember(key){if(played.has(key))return false;played.add(key);if(played.size>128)played.delete(played.values().next().value);try{sessionStorage.setItem(SEEN,JSON.stringify([...played]));}catch{}return true;}
function storage(){try{localStorage.setItem(PREF,JSON.stringify(prefs));}catch{}if(master&&audio)master.gain.setValueAtTime(prefs.sound?FEEL.volume:0,audio.currentTime);}
function unlock(e){if(!e?.isTrusted||!prefs.sound||document.hidden)return;try{const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;if(!audio){audio=new AC();master=audio.createGain();master.gain.value=FEEL.volume;master.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function tone(at,freq,length,type='triangle',gain=.25,to=freq){
 if(!audio||audio.state!=='running'||!master)return;
 const osc=audio.createOscillator(),env=audio.createGain(),t=audio.currentTime+at;
 osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+length);
 env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(gain,t+.004);env.gain.exponentialRampToValueAtTime(.0001,t+length);
 osc.connect(env);env.connect(master);osc.start(t);osc.stop(t+length+.01);osc.onended=()=>{osc.disconnect();env.disconnect();};
}
function sound(kind){if(!prefs.sound||document.hidden||!audio||audio.state!=='running')return;
 if(kind==='hit'){tone(0,155,.11,'triangle',.7,48);tone(.012,1050,.055,'triangle',.2,190);}
 else if(kind==='guard'){tone(0,680,.12,'sine',.43,440);tone(.008,1020,.09,'sine',.18,660);}
 else if(kind==='counter'){tone(0,160,.09,'triangle',.5,70);tone(.025,520,.13,'triangle',.36,1040);tone(.065,1040,.15,'sine',.23);}
 else if(kind==='win'){[440,554.37,659.25].forEach((f,i)=>tone(i*.055,f,.34,'triangle',.25));}
 else if(kind==='loss'){tone(0,220,.25,'triangle',.28,110);}
 else if(kind==='double'){tone(0,220,.23,'triangle',.25,155);tone(.04,311,.24,'sine',.2,220);}
}
function syncControls(){for(const b of document.querySelectorAll('[data-feedback-setting]')){const k=b.dataset.feedbackSetting;b.setAttribute('aria-pressed',String(prefs[k]));b.textContent=k==='sound'?'効果音 '+(prefs.sound?'ON':'OFF'):'演出 '+(prefs.motion?'標準':'控えめ');}document.documentElement.classList.toggle('battle-motion-reduced',reducedMotion());}
export function mountFeedback(){if(typeof document==='undefined')return;
 if(!installed){installed=true;const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./battle-feedback.css',import.meta.url).href;document.head.append(link);
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,true);
 document.addEventListener('visibilitychange',()=>{hiddenSince=performance.now();if(document.hidden&&master&&audio)master.gain.setValueAtTime(0,audio.currentTime);else if(master&&audio)master.gain.setValueAtTime(prefs.sound?FEEL.volume:0,audio.currentTime);});
 globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',syncControls);
 }
 let box=document.querySelector('.battle-feedback-settings');
 if(!box){const host=document.querySelector('.room-top')||document.querySelector('#native-frame');if(host){box=document.createElement('div');box.className='battle-feedback-settings';box.setAttribute('role','group');box.setAttribute('aria-label','戦闘の音と演出');for(const k of ['sound','motion']){const b=document.createElement('button');b.type='button';b.dataset.feedbackSetting=k;b.addEventListener('click',e=>{prefs[k]=!prefs[k];storage();syncControls();if(k==='sound')unlock(e);});box.append(b);}host.append(box);}}
 syncControls();
}
function label(panel,side,cue){if(!panel||panel.querySelector('.battle-cue-label'))return;const text=side==='own'?(cue.counter?'反撃！':cue.guard?'防御':null):(cue.foeCounter?'反撃！':cue.foeGuard?'防御':null);if(text){const tag=document.createElement('span');tag.className='battle-cue-label';tag.textContent=text;panel.append(tag);}}
export function presentBeat(answer,reveal,n,{silent=false,startedAt=0}={}){
 if(!answer||!reveal?.beats?.[n-1])return;mountFeedback();const cue=beatCue(reveal.beats[n-1]);const row=answer.querySelector('[data-beat="'+n+'"]');if(!row)return;
 row.classList.add('battle-cue-'+cue.kind);const sides=row.querySelectorAll('.answer-side');label(sides[0],'own',cue);label(sides[1],'foe',cue);
 if(!remember(answer.dataset.answerKey+':beat:'+n)||silent||document.hidden||startedAt<hiddenSince)return;
 if(!reducedMotion()){
 row.classList.add('battle-impact','battle-'+cue.kind);row.style.setProperty('--battle-hold',(cue.kind==='counter'?FEEL.counterHoldMs:FEEL.hitHoldMs)+'ms');
 // Each attack visibly holds at impact, then recoils; game resolution never pauses.
 const target=cue.counter?sides[1]:cue.foeCounter?sides[0]:row;
 if(cue.damage&&target?.animate){const duration=cue.kind==='counter'?360:340,hold=(cue.kind==='counter'?FEEL.counterHoldMs:FEEL.hitHoldMs)/duration;target.animate([{transform:'scale(1.018)',offset:0},{transform:'scale(1.018)',offset:hold},{transform:'translateX(-3px)',offset:.5},{transform:'translateX(2px)',offset:.72},{transform:'none',offset:1}],{duration,easing:'ease-out'});}
 }
 sound(cue.kind);answer.dispatchEvent(new CustomEvent('battle-feedback',{detail:{kind:cue.kind,beat:n}}));return true;
}
export function presentFinish(answer,reveal,{silent=false,startedAt=0}={}){
 if(!answer||!reveal)return;mountFeedback();const kind=finalCue(reveal);if(!kind)return;let tag=answer.querySelector('.battle-finish');if(!tag){tag=document.createElement('strong');tag.className='battle-finish battle-finish-'+kind;tag.textContent=kind==='double'?'相打ち':kind==='win'?'決着 — 撃破': '決着 — 力尽きた';(answer.querySelector(':scope > header')||answer).append(tag);}
 if(!remember(answer.dataset.answerKey+':finish')||silent||document.hidden||startedAt<hiddenSince)return;
 if(!reducedMotion())tag.classList.add('battle-finish-enter');sound(kind);answer.dispatchEvent(new CustomEvent('battle-feedback',{detail:{kind,beat:0}}));
}
