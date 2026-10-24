import {createFriendMatch} from './friend-match.mjs';
export function createAppEntry({stages,start,onHome,isBusy,onResult}){
 const $=id=>document.getElementById(id),entry=$('app-entry'),dialog=$('friend-result');let match=null;
 const qs=new URLSearchParams(location.search);let scheme=qs.get('input')==='pull'?'pull':'swipe';
 for(const [id,stage] of Object.entries(stages)){if(!stage.environment)continue;const o=document.createElement('option');o.value=id;o.textContent=stage.label;$('app-stage').append(o);}
 if(stages[qs.get('stage')])$('app-stage').value=qs.get('stage');
 function selection(){const selected=$('app-selected-stage');if(selected)selected.textContent=stages[$('app-stage').value]?.label??'';}
 $('app-stage').addEventListener('change',selection);selection();
 function mode(next){scheme=next;for(const button of document.querySelectorAll('[data-app-input]'))button.setAttribute('aria-pressed',String(button.dataset.appInput===scheme));$('app-operation').textContent=scheme==='swipe'?'押してつかむ → 上へ動かす → 離して投げる。速さが強さ。':'下へ引っぱる → 離して投げる。長さが強さ。';}
 mode(scheme);
 for(const b of document.querySelectorAll('[data-app-input]'))b.addEventListener('click',()=>mode(b.dataset.appInput));
 function launch(party){match=party?createFriendMatch():null;entry.hidden=true;document.body.classList.remove('app-lobby-open');document.body.classList.toggle('friend-active',party);start($('app-stage').value,{scheme,party});render();}
 function render(){const s=match?.snapshot();$('friend-hud').hidden=!s;if(s)$('friend-status').textContent=`${s.players[s.player]} · ${s.round}/${s.rounds}回 · ${s.scores[0]} : ${s.scores[1]}`;}
 $('app-solo').addEventListener('click',()=>launch(false));$('app-friends').addEventListener('click',()=>launch(true));
 for(const button of entry.querySelectorAll('[data-app-stage]'))button.addEventListener('click',()=>{const id=button.dataset.appStage;if(!stages[id])return;$('app-stage').value=id;selection();launch(false);});
 $('app-home').addEventListener('click',()=>{if(isBusy())return;onHome();match=null;dialog.close();entry.hidden=false;document.body.classList.add('app-lobby-open');document.body.classList.remove('friend-active');render();});
 $('friend-next').addEventListener('click',()=>{const s=match?.snapshot();if(!s)return;dialog.close();if(s.finished){match=null;entry.hidden=false;document.body.classList.add('app-lobby-open');document.body.classList.remove('friend-active');render();return;}match.next();onResult();render();});
 dialog.addEventListener('cancel',e=>e.preventDefault());
 $('app-copy').addEventListener('click',async()=>{const url=new URL(location.href);url.hash='';url.search='';url.searchParams.set('stage',$('app-stage').value);url.searchParams.set('input',scheme);$('app-share-url').value=url.href;$('app-share-box').hidden=false;try{await navigator.clipboard.writeText(url.href);$('app-share-status').textContent='リンクをコピーしました。友達に送れます。';}catch{$('app-share-status').textContent='下のリンクを選択してコピーできます。';}});
 if(location.hash.startsWith('#replay')||location.hash.startsWith('#shot')){entry.hidden=true;document.body.classList.remove('app-lobby-open');}
 return {active:()=>!!match,result(event){if(!match||event.type!=='result'||!match.result(event.success))return;const s=match.snapshot();$('friend-result-title').textContent=s.finished?(s.scores[0]===s.scores[1]?'引き分け！':`${s.players[s.scores[0]>s.scores[1]?0:1]} の勝ち！`):(event.success?'ナイスシュート！':'惜しい！ 次の人へ');$('friend-result-score').textContent=`PLAYER 1 ${s.scores[0]} : ${s.scores[1]} PLAYER 2`;$('friend-next').textContent=s.finished?'ホームへ':'交代して、次の一投';dialog.showModal();render();},snapshot:()=>match?.snapshot()??null};
}
