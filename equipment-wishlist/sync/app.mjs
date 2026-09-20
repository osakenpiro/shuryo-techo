import {sharedConfig} from './config.mjs';
import {HUNTERS,LOCAL_KEY,clone,check,validateBook,validatePlan,migrationFromLocal,initialBook,blankBook,saveRevision} from './core.mjs';
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID();
const goal={id:'fatalis-sa-set',name:'対ミラ・スラアク装備',cat:'防具',type:'スラッシュアックス',tag:'最優先候補',note:'ミラボレアスに向けて、スラアク装備の更新を先に。',mats:[],price:null,target:'対ミラのスラアク装備を見直す'};
const items=[...window.HUNT_DATA.items.filter(i=>i.id!==goal.id),goal];
const item=r=>r.custom||items.find(i=>i.id===r.itemId)||{name:'未対応の装備：'+r.itemId,cat:'その他',type:'未確認',mats:[],price:null};
let sdk,auth,db,user=null,member=null,view='all',books=new Map(),plan={payload:[],revision:0,ready:false},busy=false,pending=null,epoch=0;
let unsubs=[],memberUnsub=null,dataStarted=false,review=null;
const cleanups=()=>{unsubs.forEach(f=>f());unsubs=[];dataStarted=false;};
const online=()=>navigator.onLine!==false;
function ref(kind,id){return sdk.doc(db,'mhRooms',sharedConfig.roomId,kind,id);}
function status(message){$('#sync-state').textContent=message;}
function locked(message){epoch++;cleanups();member=null;books.clear();plan={payload:[],revision:0,ready:false};pending=null;review=null;busy=false;$('#editor').close();$('#editor-body').replaceChildren();$('#private').hidden=true;$('#gate').hidden=false;$('#gate-message').textContent=message;$('#conflict').hidden=true;$('#registration').hidden=true;$('#registration-uid').textContent='';status(message);}
function showError(error){const m=error?.message||'同期できませんでした。';status(m);if($('#editor').open){let p=$('#form-error');if(!p){p=document.createElement('p');p.id='form-error';p.setAttribute('role','alert');$('#editor-body').prepend(p);}p.textContent=m;}}
function draw(){
  if(!member)return;
  $('#gate').hidden=true;$('#private').hidden=false;
  $('#identity').textContent=member.hunterId+' としてログイン中';
  $('#tabs').innerHTML=['all',...HUNTERS].map(h=>`<button data-view="${h}" aria-pressed="${view===h}">${h==='all'?'みんな':h}</button>`).join('');
  const own=books.get(member.hunterId);
  $('#migrate').hidden=!(own?.ready&&!own.exists);
  $('#add').disabled=busy||!!pending||!own?.ready||!own.exists||!online();
  $('#book-title').textContent=view==='all'?'みんなの依頼':view+'の依頼';
  const rows=[];
  for(const h of HUNTERS.filter(h=>view==='all'||view===h)){
    const doc=books.get(h);
    if(!doc?.exists){rows.push(`<p class="empty-line">${h}：${doc?.ready?'まだ共有していません':'受信を待っています'}</p>`);continue;}
    for(const r of [...doc.payload.requests].sort((a,b)=>a.priority-b.priority)){
      const i=item(r),mine=h===member.hunterId;
      const known=(i.mats||[]).filter(m=>doc.payload.stock[m[0]]!==null&&doc.payload.stock[m[0]]!==undefined);
      const lack=known.filter(m=>doc.payload.stock[m[0]]<m[1]).length;
      rows.push(`<article class="shared-request ${r.done?'completed':''}"><button class="request-open" data-open-h="${h}" data-open-r="${esc(r.id)}"><span class="item-meta">${h} ／ ${esc(i.type||i.cat)} ${mine?'':'・閲覧のみ'}</span><h3>${esc(i.name)}</h3><span class="item-note">${r.done?'完成':r.priority===1?'先に進める':r.priority===3?'あとで':'作りたいもの'}${lack?' ／ 不足 '+lack+'種類':''}</span></button></article>`);
    }
  }
  $('#requests').innerHTML=rows.join('')||'<p class="empty-line">まず自分の帳面を共有しましょう。</p>';
  $('#today').innerHTML=plan.payload.length?plan.payload.map((p,n)=>`<article class="stop ${p.done?'completed':''}"><strong>${n+1}. ${esc(p.title)}</strong><p>${esc(p.note)}</p><div><button data-plan="done" data-id="${esc(p.id)}">${p.done?'未完了へ':'済みにする'}</button><button data-plan="up" data-id="${esc(p.id)}" ${n===0?'disabled':''}>↑</button><button data-plan="down" data-id="${esc(p.id)}" ${n===plan.payload.length-1?'disabled':''}>↓</button><button data-plan="remove" data-id="${esc(p.id)}">外す</button></div></article>`).join(''):'<p class="empty-line">みんなで決める、今日の順番。</p>';
  $('#plan-add').disabled=busy||!!pending||!plan.ready||!online();
  $('#today').querySelectorAll('button').forEach(b=>{if(busy||pending||!plan.ready||!online())b.disabled=true;});
  if(!busy&&!pending)status(!online()?'オフライン：表示は最後の受信分。書き込みは停止中。':([...books.values()].every(b=>b.ready)&&plan.ready?'共有先から受信済み：変更は自動で届きます':'共有先を確認中'));
}
function docState(snap,kind,id){
  const exists=snap.exists(),data=exists?snap.data():null;
  if(exists)check(data.schema===1&&Number.isSafeInteger(data.revision)&&data.revision>0,'対応していない共有データです。');
  const payload=exists?JSON.parse(data.content):(kind==='hunters'?blankBook(id):[]);
  return {exists,revision:data?.revision??0,payload:kind==='hunters'?validateBook(payload,id):validatePlan(payload),ready:!snap.metadata.fromCache&&!snap.metadata.hasPendingWrites};
}
function listenData(){
  cleanups();dataStarted=true;const session=epoch;
  for(const h of HUNTERS)unsubs.push(sdk.onSnapshot(ref('hunters',h),{includeMetadataChanges:true},s=>{if(session!==epoch||!member)return;try{books.set(h,docState(s,'hunters',h));draw();}catch{locked('共有データを読み込めません。管理者に確認してください。');}},()=>locked('閲覧権限または接続を確認できません。共有表示を閉じました。')));
  unsubs.push(sdk.onSnapshot(ref('plans','today'),{includeMetadataChanges:true},s=>{if(session!==epoch||!member)return;try{plan=docState(s,'plans','today');draw();}catch{locked('共有の段取りを読み込めません。');}},()=>locked('段取りの閲覧権限を確認できません。')));
}
async function connect(){
  if(!sharedConfig){status('接続設定待ちです。現在の個人帳面はそのまま使えます。');return;}
  $('#login').disabled=true;
  try{
    check(sharedConfig.roomId && sharedConfig.firebase?.projectId && sharedConfig.firebase?.appId,'Firebaseの接続設定が未完了です。');
    if(!sdk){
      const base='https://www.gstatic.com/firebasejs/12.19.0/';
      const [a,b,c]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);sdk={...a,...b,...c};
      const app=sdk.initializeApp(sharedConfig.firebase,'mh-wishlist-private');auth=sdk.getAuth(app);db=sdk.getFirestore(app);
      // Shared data is memory-only; no Firestore disk cache. Google login is session-scoped.
      await sdk.setPersistence(auth,sdk.browserSessionPersistence);
      sdk.onAuthStateChanged(auth,u=>{
        memberUnsub?.();memberUnsub=null;user=u;locked(u?'参加メンバーを確認しています':'ログインしてください。');
        $('#logout').hidden=!u;
        if(!u)return;
        memberUnsub=sdk.onSnapshot(ref('members',u.uid),{includeMetadataChanges:true},s=>{
          if(user?.uid!==u.uid||auth.currentUser?.uid!==u.uid)return;
          if(s.metadata.fromCache)return;
          if(!s.exists()||s.data().active!==true||!HUNTERS.includes(s.data().hunterId)){
            locked('このアカウントは参加登録待ちです。データは表示していません。');
            $('#registration').hidden=false;$('#registration-uid').textContent=u.uid;return;
          }
          $('#registration').hidden=true;
          const next=s.data();
          if(!member||member.hunterId!==next.hunterId){cleanups();books.clear();plan={payload:[],revision:0,ready:false};member=next;view=next.hunterId;listenData();}
          else if(!dataStarted)listenData();
        },()=>locked('参加登録を確認できません。権限設定を確認してください。'));
      });
    }
    if(!auth.currentUser)await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());
    else {await auth.currentUser.getIdToken(true);if(member&&!dataStarted)listenData();}
  }catch(e){showError(e);}finally{$('#login').disabled=!sharedConfig;}
}
async function commit(kind,id,expectedRevision,payload){
  check(member&&user,'ログインしてください。');check(!busy&&!pending,'先の保存・下書きを確認してください。');check(online(),'オフラインです。共有への書き込みは停止しています。');
  if(kind==='hunters'){check(id===member.hunterId,'他の人の帳面は閲覧のみです。');payload=validateBook(payload,id);}else payload=validatePlan(payload);
  const attempt={kind,id,expectedRevision,payload:clone(payload)},session=epoch;
  busy=true;status('共有先へ保存しています…');draw();
  try{
    await saveRevision(sdk,db,ref(kind,id),expectedRevision,payload,user.uid);
    if(session!==epoch)return false;status('共有先へ保存しました。');return true;
  }catch(e){
    if(session!==epoch)return false;pending=attempt;$('#conflict').hidden=false;$('#conflict-message').textContent=e.message||'保存できませんでした。下書きはこの画面で保持しています。';status('未保存：下書きを保持しています。');return false;
  }finally{if(session===epoch){busy=false;draw();}}
}
function modal(title,html){$('#editor-title').textContent=title;$('#editor-body').innerHTML=html;if(!$('#editor').open)$('#editor').showModal();}
function exportFile(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function proposeMigration(payload){
  check(member,'ログインしてください。');const id=member.hunterId,doc=books.get(id);check(doc?.ready&&!doc.exists,'共有先にすでに帳面があります。移行で上書きはしません。');review=validateBook(payload,id);
  modal('自分の帳面だけ、共有へ移す',`<p>${id} の依頼 <b>${review.requests.length}件</b>、在庫 <b>${Object.keys(review.stock).length}項目</b>。メモも含めて4人に見えるようになります。</p><p>ほかの人の帳面と「今日の段取り」は移しません。元のブラウザ保存は残します。</p><details open><summary>送信する内容を確認</summary><pre>${esc(JSON.stringify(review,null,2))}</pre></details><button id="accept-migration" class="ink-button">確認した本人の帳面を共有する</button>`);
  $('#accept-migration').onclick=async()=>{try{if(await commit('hunters',id,0,review)){$('#editor').close();review=null;}else $('#editor').close();}catch(e){showError(e);}};
}
function migration(){
  modal('どの記録を引き継ぐ？','<p>既存の編集を残すため、使っていたブラウザの帳面を優先してください。共有済みの場合は移行せず受信します。</p><button id="from-local" class="ink-button">このブラウザの自分の記録</button><button id="from-seed" class="text-button">初期の依頼から始める</button><button id="from-json" class="text-button">JSONを選ぶ</button>');
  $('#from-local').onclick=()=>{try{proposeMigration(migrationFromLocal(localStorage.getItem(LOCAL_KEY),member.hunterId));}catch(e){showError(e);}};
  $('#from-seed').onclick=()=>{try{proposeMigration(initialBook(member.hunterId,items));}catch(e){showError(e);}};$('#from-json').onclick=()=>$('#import').click();
}
function openRequest(hid,rid){
  const record=books.get(hid),original=record?.payload.requests.find(r=>r.id===rid);if(!original)return;
  const i=item(original),mine=hid===member.hunterId,book=clone(record.payload),r=book.requests.find(r=>r.id===rid),revision=record.revision;
  modal(i.name,`<form id="request-form"><p>${hid} ／ ${mine?'本人の編集':'閲覧のみ'} ／ 版 ${revision}</p><fieldset ${mine?'':'disabled'}><label>作る順番<select name="priority">${[[1,'先に'],[2,'ふつう'],[3,'あとで']].map(([v,t])=>`<option value="${v}" ${r.priority===v?'selected':''}>${t}</option>`).join('')}</select></label><label><input type="checkbox" name="done" ${r.done?'checked':''}> 装備ができた</label><label>メモ・現在の装備・更新候補<textarea name="memo" maxlength="10000" rows="7">${esc(r.memo)}</textarea></label>${i.base?`<label><input type="checkbox" name="base" ${r.baseReady?'checked':''}> 強化元「${esc(i.base)}」を用意済み</label>`:''}<table class="material-table"><thead><tr><th>素材</th><th>必要</th><th>所持</th><th>不足</th></tr></thead><tbody>${(i.mats||[]).map((m,n)=>`<tr><td>${esc(m[0])}</td><td>${m[1]}</td><td><input name="m${n}" type="number" min="0" max="1000000000" step="1" placeholder="未確認" value="${book.stock[m[0]]??''}" aria-label="${esc(m[0])}の所持数"></td><td>${book.stock[m[0]]==null?'未確認':Math.max(0,m[1]-book.stock[m[0]])}</td></tr>`).join('')}</tbody></table>${i.price!=null?`<label>所持ゼニー ／ 費用 ${i.price.toLocaleString('ja-JP')} z<input name="money" type="number" min="0" max="1000000000" step="1" value="${book.stock['ゼニー']??''}" placeholder="未確認"></label>`:''}</fieldset><p class="tiny">空欄は未確認、0は0個。完成チェックで在庫・ゼニーは自動消費しません。素材はこの依頼の分です。</p>${mine?'<button class="ink-button" type="submit">変更を共有へ保存</button>':''}</form><button id="request-to-plan" class="text-button">この依頼の用事を、今日の段取りに書く</button>`);
  $('#request-to-plan').onclick=()=>newStop(i.target||i.mats?.[0]?.[2]||i.name,`${hid}：${i.name}`);
  $('#request-form').onsubmit=async e=>{
    e.preventDefault();if(!mine)return;const f=new FormData(e.target);r.priority=Number(f.get('priority'));r.done=f.has('done');r.memo=String(f.get('memo'));if(i.base)r.baseReady=f.has('base')?true:null;
    (i.mats||[]).forEach((m,n)=>{const v=f.get('m'+n);book.stock[m[0]]=v===''?null:Number(v);});if(i.price!=null){const v=f.get('money');book.stock['ゼニー']=v===''?null:Number(v);}
    try{await commit('hunters',hid,revision,book);$('#editor').close();}catch(e){showError(e);}
  };
}
function newRequest(){
  const hid=member.hunterId,record=books.get(hid);if(!record?.exists||!record.ready)return;const book=clone(record.payload),revision=record.revision;
  modal('依頼を一枚、追加する',`<form id="new-form"><label>ひな形<select name="preset"><option value="">自由に書く</option>${items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select></label><label>自由依頼の名前<input name="name" maxlength="100" placeholder="例：装衣を強化したい"></label><label>狩る相手・次にやること<input name="target" maxlength="150"></label><label>メモ<textarea name="memo" maxlength="2000"></textarea></label><p class="tiny">ひな形なら登録済みの素材を使います。自由依頼はまず要望を残す形式です。</p><button class="ink-button">依頼帳に貼る</button></form>`);
  $('#new-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),preset=f.get('preset'),i=items.find(i=>i.id===preset);try{
    check(i||String(f.get('name')).trim(),'名前またはひな形を指定してください。');check(!i||!book.requests.some(r=>r.itemId===i.id&&!r.done),'その装備は依頼済みです。');
    book.requests.push({id:uid(),itemId:i?.id??null,custom:i?null:{name:String(f.get('name')).trim(),cat:'その他',type:'自由メモ',target:String(f.get('target')).trim(),mats:[],price:null},memo:String(f.get('memo')).trim()||i?.note||'',priority:2,done:false,baseReady:null});
    await commit('hunters',hid,revision,book);$('#editor').close();
  }catch(e){showError(e);}};
}
function newStop(title='',note=''){
  const revision=plan.revision,list=clone(plan.payload);
  modal('今日の段取りを書く',`<form id="stop-form"><label>次にやること<input name="title" maxlength="150" required value="${esc(title)}"></label><label>誰と・何のために<textarea name="note" maxlength="2000">${esc(note)}</textarea></label><button class="ink-button">みんなの段取りに入れる</button></form>`);
  $('#stop-form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);list.push({id:uid(),title:String(f.get('title')).trim(),note:String(f.get('note')).trim(),done:false,refs:[]});try{await commit('plans','today',revision,list);$('#editor').close();}catch(e){showError(e);}};
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;if(b.dataset.view){view=b.dataset.view;draw();}if(b.dataset.openH)openRequest(b.dataset.openH,b.dataset.openR);
  if(b.dataset.plan){const list=clone(plan.payload),n=list.findIndex(p=>p.id===b.dataset.id);if(n<0)return;
    if(b.dataset.plan==='done')list[n].done=!list[n].done;else if(b.dataset.plan==='remove'){if(!confirm('この段取りを外しますか？'))return;list.splice(n,1);}else{const m=n+(b.dataset.plan==='up'?-1:1);if(m<0||m>=list.length)return;[list[n],list[m]]=[list[m],list[n]];}
    try{await commit('plans','today',plan.revision,list);}catch(e){showError(e);}
  }
});
$('#login').onclick=connect;
$('#logout').onclick=async()=>{locked('ログアウトしました。共有表示を閉じました。');memberUnsub?.();memberUnsub=null;$('#registration').hidden=true;$('#registration-uid').textContent='';if(auth)await sdk.signOut(auth);};
$('#close-editor').onclick=()=>$('#editor').close();$('#migrate').onclick=migration;$('#add').onclick=newRequest;$('#plan-add').onclick=()=>newStop();
$('#download-draft').onclick=()=>{if(pending)exportFile(pending,'mh-uncommitted-draft.json');};
$('#discard-draft').onclick=()=>{if(confirm('未保存の下書きを破棄し、共有先の最新記録を表示します。必要なら先に下書きを保存してください。')){pending=null;$('#conflict').hidden=true;draw();}};
$('#export-own').onclick=()=>{if(!member)return;const b=books.get(member.hunterId);if(b?.exists)exportFile({format:'mhwi-request-v1',version:1,hunter:b.payload,plan:[]},'mh-'+member.hunterId+'.json');};
$('#import').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{check(f.size<=500000,'JSONは500 KB以下にしてください。');const p=JSON.parse(await f.text());proposeMigration(p.format==='mhwi-request-v1'?validateBook(p.hunter,member.hunterId):migrationFromLocal(p,member.hunterId));}catch(e){showError(e);}};
window.addEventListener('offline',()=>{books.forEach(b=>b.ready=false);plan.ready=false;draw();});window.addEventListener('online',()=>{if(member)listenData();});
window.addEventListener('beforeunload',e=>{if(busy||pending){e.preventDefault();e.returnValue='';}});
if(!sharedConfig){$('#login').disabled=true;$('#gate-message').textContent='共有先と4人のログイン設定を準備中です。まだ自動同期は始まっていません。';status('接続設定待ち');}else{status('未ログイン：共有データは表示していません');$('#login').disabled=false;}
