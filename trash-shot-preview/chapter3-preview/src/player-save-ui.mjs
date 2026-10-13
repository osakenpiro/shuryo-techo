// Save-code presentation only. The existing codecs validate data; the app owns
// all player/storage writes and replay playback.
import {encodePlayerCode,decodePlayerCode} from './player-save.mjs?v=20261013-outdoor-polish-1';
import {CHAPTER_IDS,CHAPTERS,migrateProgress,chapterForStage,outdoorSnapshot} from './progress-save.mjs?v=20261013-outdoor-polish-1';
import {STAGES} from './stages.mjs?v=20261013-outdoor-polish-1';
import {getThrowable} from './throwables.mjs?v=20261013-outdoor-polish-1';

const MAX_INPUT=40000,MAX_CODE=24500,MAX_REPLAY=8000;
const PUBLIC_PAGE='https://osakenpiro.github.io/shuryo-techo/trash-shot-preview/';
const invalid=message=>({kind:'invalid',message});
const replayMessage='一投のリプレイリンクで、続き用の保存コードではありません。リプレイを見ることはできます。';
const pagePath=path=>path.endsWith('/index.html')?path.slice(0,-10):path;
function sameGamePage(url,pageURL){
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return false;
  const candidates=[PUBLIC_PAGE];
  if(typeof pageURL==='string')candidates.push(pageURL);
  return candidates.some(value=>{
    try{const page=new URL(value);return !page.username&&!page.password&&url.origin===page.origin&&pagePath(url.pathname)===pagePath(page.pathname);}
    catch{return false;}
  });
}
export function classifyPlayerSaveInput(input,{pageURL}={}){
  if(typeof input!=='string')return invalid('保存コードを貼ってください。');
  if(input.length>MAX_INPUT||input.length>16000&&!/^TS[45]-/.test(input.replace(/[ \t\r\n]/g,'')))return invalid('入力が長すぎます。保存コードだけをすべてコピーして貼ってください。');
  // Wrapped copies are accepted, but arbitrary prose and hidden Unicode bytes
  // are not removed or interpreted as part of a code.
  const normalized=input.replace(/[ \t\r\n]/g,'');
  if(!normalized)return {kind:'empty',message:'TS1-・TS2-・TS3-・TS4-・TS5- で始まる、続き用の保存コードを貼ってください。'};
  if(/^TS[12345]-/.test(normalized)){
    if(normalized.length>MAX_CODE)return invalid('保存コードが長すぎます。元のコードを確認してください。');
    try{return {kind:'save',normalized,data:decodePlayerCode(normalized),message:'コードを確認できました。内容を見てから復元できます。'};}
    catch{return invalid('コードが欠けているか、途中の文字が変わっています。元のコードをすべてコピーして貼り直してください。今の記録は変わりません。');}
  }
  let fragment=normalized.startsWith('#')?normalized.slice(1):normalized;
  if(/^[a-z][a-z0-9+.-]*:/i.test(normalized)){
    let url;try{url=new URL(normalized);}catch{return invalid('リンクを読み取れません。続き用の保存コードを貼ってください。');}
    if(!sameGamePage(url,pageURL))return invalid('このゲームの保存コードではありません。TS1-・TS2-・TS3-・TS4-・TS5- で始まるコードを貼ってください。');
    fragment=url.hash.slice(1);
  }
  if(/^(?:tsc[1-7]|tsr1)\.[A-Za-z0-9_-]+$/.test(fragment)){
    if(fragment.length+1>MAX_REPLAY)return invalid('リプレイリンクが長すぎます。元のリンクを確認してください。');
    return {kind:'replay',fragment:`#${fragment}`,message:replayMessage};
  }
  return invalid('続き用の保存コードを読み取れません。TS1-・TS2-・TS3-・TS4-・TS5- で始まるコードを、そのまま貼ってください。今の記録は変わりません。');
}

export function createPlayerSaveUI({document:doc,getPlayer,canRestore=()=>true,onRestore,onReplay,onContinue,initialStatus}={}){
  if(!doc||typeof getPlayer!=='function')return null;
  const $=id=>doc.getElementById(id);
  const nodes=Object.fromEntries(['progress-status','progress-current','progress-export-code','progress-code','progress-input-message','progress-preview','progress-export','progress-copy','progress-restore','progress-open-replay','progress-continue'].map(id=>[id,$(id)]));
  if(Object.values(nodes).some(node=>!node))return null;
  const input=nodes['progress-code'],output=nodes['progress-export-code'],status=nodes['progress-status'];
  const removers=[];
  let working=false,classified={kind:'empty'},lastInput=null;
  const on=(node,type,fn)=>{node.addEventListener(type,fn);removers.push(()=>node.removeEventListener(type,fn));};
  function permission(){
    try{const result=canRestore();return typeof result==='object'&&result?{ok:result.ok===true,message:result.message}:{ok:result===true};}
    catch{return {ok:false};}
  }
  function showStatus(message,state='info'){status.textContent=message;status.dataset.state=state;}
  function renderPreview(){
    const host=nodes['progress-preview'];host.replaceChildren();host.hidden=classified.kind!=='save';
    if(classified.kind!=='save')return;
    const {rewards,sourceVersion}=classified.data,progress=migrateProgress(classified.data.progress),chapter=chapterForStage(progress.resumeStage);
    const entries=[['再開する面',STAGES[progress.resumeStage]?.label??progress.resumeStage],['章',chapter?`${chapter.number} ${chapter.label}`:''],['クリア',`${progress.completedIDs.length} / ${CHAPTER_IDS.length} 面`]];
    for(const entry of CHAPTERS)entries.push([`${entry.number} ${entry.label}`,`${entry.ids.filter(id=>progress.completedIDs.includes(id)).length} / ${entry.ids.length} 面`]);
    if(progress.resumeStage!==classified.data.progress.resumeStage)entries.push([chapter?.number===3?'外へ':'学校へ',chapter?.number===3?'第2章のクリアを引き継いで、3-1から再開します。':'第1章のクリアを引き継いで、2-1から再開します。']);
    if(progress.version>=3){const outdoor=outdoorSnapshot(progress);entries.push(['外の別解',`${outdoor.altCount} / 4 面`],['最初の道',outdoor.firstRoute===null?'3章クリア後に決まります':`${outdoor.firstRoute} ${outdoor.firstRoute===4?'工場・動く系':'色物'}`],['開いた道',outdoor.unlockedRoutes.length?outdoor.unlockedRoutes.map(id=>`${id} ${id===4?'工場・動く系':'色物'}`).join(' / '):'まだ分岐前']);}
    if(sourceVersion===1)entries.push(['コイン・投げるもの','今のコイン・装備を保持します（TS1）']);
    else {entries.push(['コイン',`${rewards.wallet} コイン`],['投げるもの',getThrowable(rewards.equipped)?.label??rewards.equipped]);if(rewards.earned?.length)entries.push(['ステージで手に入れた物',rewards.earned.map(id=>getThrowable(id)?.label??id).join(' / ')]);}
    for(const [label,value] of entries){const row=doc.createElement('div'),dt=doc.createElement('dt'),dd=doc.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);host.append(row);}
  }
  function refreshInput(){
    if(lastInput!==input.value){classified=classifyPlayerSaveInput(input.value,{pageURL:doc.defaultView?.location?.href});lastInput=input.value;renderPreview();}
    nodes['progress-input-message'].textContent=classified.message;
    nodes['progress-input-message'].dataset.kind=classified.kind;
    const allowed=permission().ok&&!working;
    nodes['progress-restore'].disabled=classified.kind!=='save'||!allowed||typeof onRestore!=='function';
    nodes['progress-open-replay'].hidden=classified.kind!=='replay';
    nodes['progress-open-replay'].disabled=!allowed||typeof onReplay!=='function';
    nodes['progress-continue'].disabled=!allowed||typeof onContinue!=='function';
  }
  function update({status:message}={}){
    try{const current=getPlayer();nodes['progress-current'].textContent=`${STAGES[current.progress.resumeStage]?.label??current.progress.resumeStage}から · ${current.progress.completedIDs.length} / ${CHAPTER_IDS.length} 面クリア`;
      // An already displayed code must follow new progress too, so manual
      // selection/copy never quietly carries an older save. Keep input intact.
      if(output.value)output.value=encodePlayerCode(current);
      nodes['progress-export'].disabled=false;nodes['progress-copy'].disabled=false;
    }catch{nodes['progress-current'].textContent='現在の記録を読み取れません。';nodes['progress-export'].disabled=true;nodes['progress-copy'].disabled=true;}
    if(typeof message==='string')showStatus(message);
    refreshInput();
  }
  function exportCode(){
    try{const code=encodePlayerCode(getPlayer());output.value=code;showStatus(`今の続き用コードを出しました。復元するときは、この ${code.slice(0,4)} コードを使います。`,'success');return code;}
    catch{showStatus('今の記録から保存コードを作れませんでした。復元欄と記録は変更していません。','error');return null;}
  }
  on(nodes['progress-export'],'click',exportCode);
  on(nodes['progress-copy'],'click',async()=>{
    const code=exportCode();if(!code)return;
    try{const clipboard=doc.defaultView?.navigator?.clipboard;if(!clipboard?.writeText)throw Error('Unavailable');await clipboard.writeText(code);showStatus('今の続き用コードをコピーしました。別のブラウザの「復元する」に貼れます。','success');}
    catch{output.focus();output.select();showStatus('今の続き用コードを選択しました。手動でコピーできます。','warning');}
  });
  on(input,'input',()=>{lastInput=null;refreshInput();});
  on(nodes['progress-restore'],'click',async()=>{
    if(working)return;
    lastInput=null;refreshInput();
    if(classified.kind!=='save'){showStatus('保存コードを確認できないため、復元していません。今の記録は変わりません。','error');return;}
    const allowed=permission();if(!allowed.ok){showStatus(allowed.message??'投球と結果画面を終えてから復元できます。','warning');return;}
    if(typeof onRestore!=='function')return;
    working=true;refreshInput();
    try{
      const result=await onRestore(classified.data);
      const warning=result?.ok&&(/storage|unavailable|failed/i.test(result.status??'')||/保存でき|保存.*失敗/.test(result.message??''));
      showStatus(result?.message??(result?.ok?'保存コードから復元しました。':'復元できませんでした。'),result?.ok?warning?'warning':'success':'error');
    }catch{showStatus('復元処理を完了できませんでした。現在の保存状態を確認してください。','error');}
    finally{working=false;update();}
  });
  on(nodes['progress-open-replay'],'click',async()=>{
    if(working)return;
    lastInput=null;refreshInput();if(classified.kind!=='replay'||typeof onReplay!=='function')return;
    const allowed=permission();if(!allowed.ok){showStatus(allowed.message??'投球と結果画面を終えてからリプレイを開けます。','warning');return;}
    working=true;refreshInput();
    try{
      const result=await onReplay(classified.fragment);
      if(result&&typeof result==='object')showStatus(result.message??(result.ok?'一投のリプレイを開きました。続きの記録は変更していません。':'リプレイを読み込めません。続きの記録は変更していません。'),result.ok?'success':'error');
    }catch{showStatus('リプレイを開けませんでした。続きの記録は変更していません。','error');}
    finally{working=false;update();}
  });
  on(nodes['progress-continue'],'click',()=>{
    const allowed=permission();if(working||!allowed.ok||typeof onContinue!=='function')return;
    onContinue();
  });
  showStatus(typeof initialStatus==='string'?initialStatus:'続きは、このブラウザに自動保存します。');
  update();
  return {update,destroy(){for(const remove of removers)remove();}};
}
