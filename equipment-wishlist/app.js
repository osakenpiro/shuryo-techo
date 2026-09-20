'use strict';
(() => {
  const D=window.HUNT_DATA, KEY='mhwi-equipment-requests-v1';
  const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>globalThis.crypto?.randomUUID?.()||('id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const num=v=>v===null||v===undefined||v===''?null:(Number.isSafeInteger(Number(v))&&Number(v)>=0&&Number(v)<=1e9?Number(v):null);
  const fmt=v=>v===null||v===undefined?'未確認':Number(v).toLocaleString('ja-JP');
  const safeURL=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const item=r=>r.custom||D.items.find(i=>i.id===r.itemId);
  const clone=o=>JSON.parse(JSON.stringify(o));
  const active=h=>h.requests.filter(r=>!r.done);
  let filter='すべて', query='', showDone=false, expanded=new Set(), groups=[], toastTimer, lastRaw=null, memoryOnly=false;
  function seed(){return {version:1,selected:'osakenpiro',hunters:[{id:'osakenpiro',name:'おさだ',stamp:'2026/09/20 スクショ転記',stock:{'砕竜の撃滅拳':2,'砕竜の弾頭殻':3,'不壊の黒曜甲':4,'不滅の炉心殻':0,'ゼニー':20218},requests:D.items.map((i,n)=>({id:'osada-'+i.id,itemId:i.id,memo:i.note,priority:2,done:false,baseReady:null}))},...['keuita','serket','zushi'].map(id=>({id,name:id,stamp:'まだ記録なし',stock:{},requests:[]}))],plan:[]};}
  function normalizeHunter(h){
    if(!h||typeof h!=='object'||typeof h.name!=='string'||!Array.isArray(h.requests)||h.requests.length>150)throw Error('帳面の形式が正しくありません。');
    const str=(s,n=500)=>typeof s==='string'?s.slice(0,n):'';
    const stock=Object.create(null); for(const [k,v] of Object.entries(h.stock||{}).slice(0,1000)){if(!['__proto__','constructor','prototype'].includes(k))stock[str(k,100)]=num(v);}
    const seen=new Set();
    const requests=h.requests.map(r=>{
      if(!r||typeof r!=='object')throw Error('依頼を読み取れません。');
      let custom=null;
      if(r.custom){const c=r.custom;if(typeof c.name!=='string'||!c.name.trim())throw Error('装備名がありません。');
        custom={name:str(c.name,100),cat:['武器','防具','装衣','珠・護石','素材','その他'].includes(c.cat)?c.cat:'その他',type:str(c.type,40)||'自由メモ',tag:'手書き',note:str(c.note),detail:str(c.detail,1500),target:str(c.target,100)||'行き先を相談する',price:num(c.price),source:safeURL(c.source),mats:[]};
        if(!Array.isArray(c.mats)||c.mats.length>30)throw Error('素材欄を確認してください。');
        custom.mats=c.mats.map(m=>{if(!Array.isArray(m)||typeof m[0]!=='string'||!m[0].trim()||num(m[1])===null||num(m[1])<1)throw Error('素材の名前と必要数を確認してください。');return [str(m[0],100),num(m[1]),str(m[2],100)||custom.target,str(m[3],10)];});
      }else if(!D.items.some(i=>i.id===r.itemId))throw Error('この版には未対応の装備が含まれています。');
      let id=str(r.id,100)||uid();if(seen.has(id))id=uid();seen.add(id);
      return {id,itemId:custom?null:r.itemId,custom,memo:str(r.memo,2000),priority:[1,2,3].includes(r.priority)?r.priority:2,done:r.done===true,baseReady:r.baseReady===true?true:null};
    });
    return {id:str(h.id,100)||uid(),name:str(h.name,40),stamp:str(h.stamp,100),stock,requests};
  }
  function normalizePlan(p){return Array.isArray(p)?p.slice(0,100).filter(x=>x&&typeof x.title==='string').map(x=>({id:String(x.id||uid()).slice(0,150),title:x.title.slice(0,120),note:String(x.note||'').slice(0,2000),done:x.done===true,refs:Array.isArray(x.refs)?x.refs.slice(0,150).filter(r=>r&&typeof r.hunterId==='string'&&typeof r.requestId==='string').map(r=>({hunterId:r.hunterId.slice(0,100),requestId:r.requestId.slice(0,100)})):[]})):[];}
  let state=seed();
  try{lastRaw=localStorage.getItem(KEY);if(lastRaw){const s=JSON.parse(lastRaw);if(s.version!==1||!Array.isArray(s.hunters)||s.hunters.length>60)throw Error('形式');state={version:1,selected:s.selected,hunters:s.hunters.map(normalizeHunter),plan:normalizePlan(s.plan)};}}
  catch{memoryOnly=true;setTimeout(()=>toast('保存データを読めませんでした。元のデータを上書きせず、仮の帳面を開いています。'),400);}
  const param=new URLSearchParams(location.search).get('hunter');
  if(param==='osada')state.selected='osakenpiro';else if(param==='all'||state.hunters.some(h=>h.id===param))state.selected=param;
  if(state.selected!=='all'&&!state.hunters.some(h=>h.id===state.selected))state.selected=state.hunters[0]?.id||'all';
  expanded.add('osakenpiro|osada-lightbreak-axe');
  const scope=()=>state.selected==='all'?state.hunters:state.hunters.filter(h=>h.id===state.selected);
  const getH=id=>state.hunters.find(h=>h.id===id);
  const getR=(h,id)=>h.requests.find(r=>r.id===id);
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
  function save(){
    try{if(memoryOnly)throw Error('memory');const current=localStorage.getItem(KEY);if(current!==lastRaw)throw Error('conflict');const raw=JSON.stringify(state);localStorage.setItem(KEY,raw);lastRaw=raw;$('#save-state').textContent='この端末に保存済み';return true;}
    catch{$('#save-state').textContent='未保存・バックアップ推奨';toast('保存できませんでした。全員分をバックアップしてから再読込してください。');return false;}
  }
  function changed(){render();save();}
  function status(h,r){const i=item(r);if(r.done)return ['できた',''];if(!i.mats.length)return ['相談メモ',''];const unknown=i.mats.filter(m=>num(h.stock[m[0]])===null).length;const missing=i.mats.filter(m=>num(h.stock[m[0]])!==null&&h.stock[m[0]]<m[1]).length;return missing?[`あと${missing}種${unknown?'・未確認あり':''}`,'missing']:unknown?['素材を確認','']:['素材確認済み',''];}
  function entryHTML(h,r){
    const i=item(r),[label,cl]=status(h,r),key=h.id+'|'+r.id,isOpen=expanded.has(key),money=num(h.stock['ゼニー']);
    return `<article class="request ${r.done?'is-complete':''}" data-h="${esc(h.id)}" data-r="${esc(r.id)}"><div class="request-summary"><button class="request-check" data-action="done" aria-label="${esc(i.name)}を${r.done?'未完成に戻す':'できたにする'}" aria-pressed="${r.done}">${r.done?'✓':''}</button><button class="request-open" data-action="open" aria-expanded="${isOpen}"><span class="item-meta">${state.selected==='all'?esc(h.name)+' ／ ':''}${esc(i.type)} · ${esc(i.tag||i.cat)}</span><h3>${esc(i.name)}</h3><p class="item-note">${esc((r.memo||i.note||'').slice(0,58))}</p></button><span class="req-status ${cl}">${label}</span></div>${isOpen?`<div class="request-body"><div class="request-controls"><label>作る順番 <select data-edit="priority" aria-label="${esc(i.name)}の優先度">${[[1,'先に'],[2,'ふつう'],[3,'あとで']].map(([v,t])=>`<option value="${v}" ${r.priority===v?'selected':''}>${t}</option>`).join('')}</select></label><span class="tiny">${esc(h.stamp||'所持数は未確認')}</span></div>${i.base?`<div class="base-note"><label><input type="checkbox" data-edit="base" ${r.baseReady?'checked':''}>強化元「${esc(i.base)}」を用意済み</label><span>下の素材は最終強化1段ぶん。未チェックなら強化元を確認。</span></div>`:''}${i.mats.length?`<table class="material-table"><thead><tr><th>必要なもの</th><th>持っている</th><th>必要</th><th>あと</th></tr></thead><tbody>${i.mats.map(m=>{const have=num(h.stock[m[0]]),lack=have===null?null:Math.max(0,m[1]-have);return `<tr><td>${esc(m[0])}${m[3]?`<small> (${esc(m[3])})</small>`:''}</td><td><input type="number" inputmode="numeric" min="0" max="1000000000" step="1" value="${have??''}" placeholder="未確認" data-stock="${esc(m[0])}" aria-label="${esc(m[0])}の所持数"></td><td>${fmt(m[1])}</td><td class="${lack>0?'lack':lack===0?'enough':''}">${lack===null?'—':lack===0?'✓':fmt(lack)}</td></tr>`;}).join('')}</tbody></table>`:`<p class="dialog-note">まだ装備名や条件が決まっていなくても、このまま依頼として残せます。</p>`}${i.price!=null?`<div class="money-line"><span>費用 <b>${fmt(i.price)} z</b></span><span>／ 所持</span><input type="number" min="0" max="1000000000" step="1" inputmode="numeric" data-stock="ゼニー" value="${money??''}" placeholder="未確認" aria-label="所持ゼニー"><span>z</span><span class="${money!==null&&money<i.price?'lack':''}">${money===null?'残額は未確認':money<i.price?'あと '+fmt(i.price-money)+' z':'費用は足りています'}</span></div>`:''}<label class="tiny">ひとことメモ<textarea class="request-memo" data-edit="memo" maxlength="2000" aria-label="${esc(i.name)}のメモ">${esc(r.memo)}</textarea></label><details class="item-details"><summary>装備の詳細・参考元</summary><p>${esc(i.detail||'手書きの依頼です。素材・条件はゲーム内で確認してください。')}</p>${i.evidence?`<p>${esc(i.evidence)}</p>`:''}${safeURL(i.source)?`<a href="${esc(safeURL(i.source))}" target="_blank" rel="noopener noreferrer">装備データを見る ↗</a>`:''}${i.video?`<a href="${esc(D.sources.find(s=>s.id===i.video).url)}" target="_blank" rel="noopener noreferrer">参考動画 ↗</a>`:''}<p>未入力は「0個」ではなく未確認。所持数を変えると同じ人の他の依頼にも反映します。</p></details><div class="request-end"><button data-action="choose" class="text-button">行き先を選んで今日に入れる →</button><button data-action="remove" class="text-button delete-button">取り下げる</button></div></div>`:''}</article>`;
  }
  // Demand is summed per hunter/material BEFORE subtracting inventory.
  function deriveGroups(){
    const demands=new Map(),byTarget=new Map();
    function group(title,refs,priority,line,known=false){if(!byTarget.has(title))byTarget.set(title,{title,refs:[],priority,lines:[],known:false});const g=byTarget.get(title);g.priority=Math.min(g.priority,priority);g.known ||=known;if(line&&!g.lines.includes(line))g.lines.push(line);for(const ref of refs)if(!g.refs.some(x=>x.hunterId===ref.hunterId&&x.requestId===ref.requestId))g.refs.push(ref);return g;}
    for(const h of scope())for(const r of active(h)){
      const i=item(r),ref={hunterId:h.id,requestId:r.id};
      if(!i.mats.length)group(i.target||'行き先を相談する',[ref],r.priority,`${h.name}：${i.name}を具体化`);
      for(const m of i.mats){const k=h.id+'\u0000'+m[0];if(!demands.has(k))demands.set(k,{h,name:m[0],need:0,target:m[2]||'素材の入手先を確認',unit:m[3]||'',refs:[],priority:r.priority});const d=demands.get(k);d.need+=m[1];d.priority=Math.min(d.priority,r.priority);if(d.target!==(m[2]||'素材の入手先を確認'))d.target='素材の入手先を相談する';d.refs.push(ref);}
      if(i.base&&!r.baseReady)group('強化元の武器を確認',[ref],r.priority,`${h.name}：${i.base}`);
    }
    const summaries=[];
    for(const d of demands.values()){const have=num(d.h.stock[d.name]),lack=have===null?null:Math.max(0,d.need-have);summaries.push({...d,have,lack});if(lack===0)continue;group(d.target,d.refs,d.priority,`${d.h.name}：${d.name} ${lack===null?'所持を確認':'あと'+fmt(lack)+(d.unit?' '+d.unit:'個')}`,lack!==null);}
    groups=[...byTarget.values()].sort((a,b)=>a.priority-b.priority||Number(b.known)-Number(a.known)||b.refs.length-a.refs.length);
    $('#stock-summary').innerHTML=summaries.length?summaries.map(d=>`<div class="stock-line"><strong>${esc(d.name)} <small>／ ${esc(d.h.name)}</small></strong>必要計 ${fmt(d.need)} ／ 所持 ${fmt(d.have)} ／ <span class="${d.lack>0?'lack':''}">${d.lack===null?'不足は未確認':d.lack===0?'揃っています':'あと '+fmt(d.lack)}</span></div>`).join(''):'<p class="dialog-note">素材が決まった依頼を追加すると、ここに集まります。</p>';
  }
  function related(g){return g.refs.map(ref=>{const h=getH(ref.hunterId),r=h&&getR(h,ref.requestId);return r?item(r).name:'';}).filter((x,n,a)=>x&&a.indexOf(x)===n).join(' ／ ');}
  function inPlan(g){return state.plan.some(p=>p.title===g.title&&!p.done);}
  function render(){
    const focused=document.activeElement, parent=focused?.closest?.('.request');let restore=null;
    if(parent){const a=['action','stock','edit'].find(k=>focused.dataset[k]!==undefined);if(a)restore={h:parent.dataset.h,r:parent.dataset.r,a,v:focused.dataset[a]};}
    $('#hunters').innerHTML=[{id:'all',name:'みんな'},...state.hunters].map(h=>`<button data-hunter="${esc(h.id)}" aria-pressed="${state.selected===h.id}"><span class="dot"></span>${esc(h.name)}</button>`).join('');
    $('#filters').innerHTML=['すべて','武器','防具','装衣・珠','素材'].map(x=>`<button data-filter="${x}" aria-pressed="${filter===x}">${x}</button>`).join('');
    const all=scope().flatMap(h=>h.requests.map(r=>({h,r}))),rows=all.filter(({r})=>{const i=item(r);return (showDone?r.done:!r.done)&&(filter==='すべて'||(filter==='装衣・珠'?['装衣','珠・護石'].includes(i.cat):i.cat===filter))&&(!query||[i.name,i.type,i.note,r.memo,...i.mats.flat()].join(' ').toLowerCase().includes(query.toLowerCase()));}).sort((a,b)=>a.r.priority-b.r.priority);
    $('#request-count').textContent=String(all.filter(x=>!x.r.done).length).padStart(2,'0');
    $('#ledger-title').textContent=state.selected==='all'?'みんなの依頼':(getH(state.selected)?.name||'自分')+'の依頼';
    $('#request-list').innerHTML=rows.length?rows.map(({h,r})=>entryHTML(h,r)).join(''):`<div class="empty-state"><strong>${showDone?'完成のしるしは、ここに。':'まだ、白紙。'}</strong><p>${query||filter!=='すべて'?'絞り込みを変えると、ほかの依頼が見つかります。':showDone?'装備ができたら、名前の左にしるしを付けよう。':'「これが欲しい」から、次の狩りを始めよう。'}</p>${!showDone?'<button class="ink-button" data-new>＋ 最初の依頼を書く</button>':''}</div>`;
    deriveGroups();
    const g=groups.find(g=>!inPlan(g));
    $('#next-hunt').innerHTML=g?`<h3 class="next-title">${esc(g.title)}</h3><p class="next-reason">${esc(g.lines.slice(0,3).join('\n'))}${g.lines.length>3?'\nほか '+(g.lines.length-3)+'件':''}</p><p class="next-links">${esc(related(g))}</p><button class="ink-button" data-group="${groups.indexOf(g)}">今日の段取りに入れる →</button>`:`<h3 class="next-title">${groups.length?'段取りは、下の紙に。':'次の狩りを、書こう。'}</h3><p class="next-reason">${groups.length?'入れた順番を並べ替えて、今日の予定を決めよう。':'依頼と素材を記録すると、行き先がここに集まります。'}</p>`;
    $('#hunt-count').textContent='('+groups.length+')';
    $('#other-hunts').innerHTML=groups.map((g,n)=>`<div class="hunt"><strong>${esc(g.title)}</strong><p>${esc(g.lines.join('\n'))}</p><button class="text-button" data-group="${n}">${inPlan(g)?'段取りのメモを更新':'今日に入れる'} →</button></div>`).join('');
    renderPlan();
    if(memoryOnly)$('#save-state').textContent='仮の帳面・元データは保持';
    if(restore){const article=[...document.querySelectorAll('.request')].find(x=>x.dataset.h===restore.h&&x.dataset.r===restore.r);const dest=article&&[...article.querySelectorAll('[data-'+restore.a+']')].find(x=>x.dataset[restore.a]===restore.v);dest?.focus({preventScroll:true});}
  }
  function visiblePlan(){return state.plan.filter(p=>state.selected==='all'||!p.refs.length||p.refs.some(r=>r.hunterId===state.selected));}
  function renderPlan(){const p=visiblePlan();$('#route-list').innerHTML=p.length?p.map((s,n)=>`<div class="route-stop ${s.done?'is-done':''}"><button class="route-num" data-stop="${esc(s.id)}" data-plan="done" aria-label="${esc(s.title)}を${s.done?'未実施に戻す':'済みにする'}">${s.done?'✓':String(n+1).padStart(2,'0')}</button><div><p class="route-title">${esc(s.title)}</p><p class="route-detail">${esc(s.note)}</p><div class="route-tools"><button data-stop="${esc(s.id)}" data-plan="up" aria-label="${esc(s.title)}を上へ" ${n===0?'disabled':''}>↑</button><button data-stop="${esc(s.id)}" data-plan="down" aria-label="${esc(s.title)}を下へ" ${n===p.length-1?'disabled':''}>↓</button><button data-stop="${esc(s.id)}" data-plan="remove" aria-label="${esc(s.title)}を予定から外す">外す</button></div></div></div>`).join(''):'<p class="route-empty">まず一狩り。<br>上の候補を入れて、順番を決めよう。</p>';
    $('#mobile-count').textContent=p.filter(x=>!x.done).length;}
  function addGroup(g){if(!g)return;const old=state.plan.find(p=>p.title===g.title&&!p.done);if(old){old.note=g.lines.join('\n');old.refs=clone(g.refs);}else state.plan.push({id:uid(),title:g.title,note:g.lines.join('\n'),refs:clone(g.refs),done:false});changed();toast(old?'段取りの素材メモを更新しました。':'今日の段取りに入れました。');}
  function openModal(title,html){$('#modal-title').textContent=title;$('#modal-body').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();}
  function closeModal(){$('#modal').close();}
  $('#close-modal').onclick=closeModal;
  $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const b=$('#modal').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeModal();}});
  function newHunter(){openModal('仲間の帳面を開く',`<form id="hunter-form"><label class="form-field">ハンターの名前<input name="name" maxlength="40" required placeholder="ゲーム内の名前"></label><p class="dialog-note">白紙から始まります。ほかの人の装備や所持数はコピーしません。</p><button class="ink-button">帳面を開く</button></form>`);$('#hunter-form').onsubmit=e=>{e.preventDefault();const name=new FormData(e.target).get('name').trim();if(!name)return;const h={id:'hunter-'+uid(),name,stamp:'まだ記録なし',stock:{},requests:[]};state.hunters.push(h);state.selected=h.id;closeModal();changed();};}
  function newRequest(){
    if(!state.hunters.length){newHunter();return;}
    openModal('依頼を一枚、書き足す',`<form id="request-form"><div class="form-row"><label class="form-field">誰の依頼？<select name="hunter">${state.hunters.map(h=>`<option value="${esc(h.id)}" ${state.selected===h.id?'selected':''}>${esc(h.name)}</option>`).join('')}</select></label><label class="form-field">ひな形<select name="preset" id="preset"><option value="">自由に書く</option>${D.items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select></label></div><div id="free-fields"><label class="form-field">作りたいもの・やりたいこと<input name="title" maxlength="100" placeholder="例：不動の装衣を改にしたい"></label><div class="form-row"><label class="form-field">種類<select name="cat">${['武器','防具','装衣','珠・護石','素材','その他'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="form-field">狩る相手・次にやること<input name="target" maxlength="100" placeholder="未定でも大丈夫"></label></div><details><summary>素材も書く</summary><p class="tiny">名前 ／ 必要数 ／ 所持数。空欄の所持数は未確認。素材名は共通在庫の名前に合わせてください。</p><div class="modal-materials" id="mat-editors">${Array.from({length:4},()=>'<div class="mat-editor"><input class="mat-name" maxlength="100" placeholder="素材名" aria-label="素材名"><input class="mat-need" type="number" min="1" max="1000000" placeholder="必要" aria-label="必要数"><input class="mat-have" type="number" min="0" max="1000000000" placeholder="所持" aria-label="所持数"></div>').join('')}</div><label class="form-field">作成費用（ゼニー・任意）<input name="price" type="number" min="0" max="1000000000" placeholder="未確認"></label></details><label class="form-field">参考URL（任意）<input name="url" type="url" placeholder="https://..."></label></div><label class="form-field">ひとこと<textarea name="memo" maxlength="2000" placeholder="みんなに手伝ってほしいこと、候補の装備など。"></textarea></label><button class="ink-button">依頼帳に貼る</button></form>`);
    $('#preset').onchange=e=>$('#free-fields').classList.toggle('hidden',!!e.target.value);
    $('#request-form').onsubmit=e=>{
      e.preventDefault();const f=new FormData(e.target),h=getH(f.get('hunter')),preset=f.get('preset');let r;
      if(preset){if(h.requests.some(r=>r.itemId===preset&&!r.done)){toast('その装備は、すでに依頼帳にあります。');return;}const i=D.items.find(x=>x.id===preset);r={id:uid(),itemId:i.id,priority:2,done:false,baseReady:null,memo:f.get('memo').trim()||i.note};}
      else{const title=f.get('title').trim();if(!title){toast('作りたいものを一言、書いてください。');return;}const target=f.get('target').trim()||'行き先を相談する',mats=[],stockAdds=[];
        for(const row of document.querySelectorAll('.mat-editor')){const name=row.querySelector('.mat-name').value.trim(),need=num(row.querySelector('.mat-need').value),raw=row.querySelector('.mat-have').value,have=num(raw);if(!name)continue;if(!need){toast('素材の必要数は1以上で入力してください。');return;}if(['__proto__','constructor','prototype'].includes(name)){toast('別の素材名を入力してください。');return;}mats.push([name,need,target]);if(raw!=='')stockAdds.push([name,have]);}
        if(f.get('url')&&!safeURL(f.get('url'))){toast('参考URLは https:// または http:// で入力してください。');return;}
        const conflicting=stockAdds.some(([n,v])=>num(h.stock[n])!==null&&h.stock[n]!==v);if(conflicting&&!confirm('入力した所持数で、この人の共通素材在庫も更新します。よろしいですか？'))return;
        for(const [n,v] of stockAdds)h.stock[n]=v;
        r={id:uid(),custom:{name:title,cat:f.get('cat'),type:'自由メモ',tag:'手書き',note:f.get('memo').trim(),target,mats,price:num(f.get('price')),source:safeURL(f.get('url'))},itemId:null,priority:2,done:false,baseReady:null,memo:f.get('memo').trim()};
      }
      h.requests.push(r);state.selected=h.id;expanded.add(h.id+'|'+r.id);closeModal();changed();toast('依頼を一枚、貼りました。');
    };
  }
  function chooseRequest(h,r){const related=groups.filter(g=>g.refs.some(x=>x.hunterId===h.id&&x.requestId===r.id));openModal('どこから取りかかる？',`<p class="dialog-note">${esc(item(r).name)}につながる行き先です。複数選んで、あとで順番を並べ替えられます。</p>${related.length?related.map(g=>`<div class="reference"><b>${esc(g.title)}</b><p>${esc(g.lines.join(' ／ '))}</p><button class="text-button" data-modal-group="${groups.indexOf(g)}">${inPlan(g)?'メモを更新':'今日に入れる'} →</button></div>`).join(''):'<p>記録した素材は揃っています。強化元・費用・解放条件をゲーム内で確認して、加工屋へ。</p>'}`);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.mobile){setMobileView(b.dataset.mobile);return;}
    if(b.dataset.hunter){state.selected=b.dataset.hunter;filter='すべて';query='';$('#search').value='';showDone=false;$('#show-done').checked=false;render();save();return;}
    if(b.dataset.filter){filter=b.dataset.filter;render();return;}
    if(b.hasAttribute('data-new')){newRequest();return;}
    if(b.dataset.group!==undefined){addGroup(groups[Number(b.dataset.group)]);return;}
    if(b.dataset.modalGroup!==undefined){const g=groups[Number(b.dataset.modalGroup)];addGroup(g);closeModal();return;}
    if(b.dataset.plan){const p=state.plan.find(p=>p.id===b.dataset.stop);if(!p)return;const action=b.dataset.plan;if(action==='done')p.done=!p.done;else if(action==='remove')state.plan=state.plan.filter(x=>x!==p);else{const vis=visiblePlan(),n=vis.indexOf(p),other=vis[n+(action==='up'?-1:1)];if(other){const a=state.plan.indexOf(p),c=state.plan.indexOf(other);[state.plan[a],state.plan[c]]=[state.plan[c],state.plan[a]];}}changed();return;}
    if(b.dataset.action){const el=b.closest('.request'),h=getH(el.dataset.h),r=getR(h,el.dataset.r),key=h.id+'|'+r.id;switch(b.dataset.action){case 'open':expanded.has(key)?expanded.delete(key):expanded.add(key);render();break;case 'done':r.done=!r.done;changed();toast(r.done?'できた、を記録しました。素材とゼニーの在庫は自動では減りません。':'未完成の依頼に戻しました。');break;case 'choose':chooseRequest(h,r);break;case 'remove':if(confirm('「'+item(r).name+'」を依頼帳から取り下げますか？ 素材在庫は残ります。')){h.requests=h.requests.filter(x=>x!==r);changed();}break;}}
  });
  document.addEventListener('change',e=>{const el=e.target.closest('.request');if(!el)return;const h=getH(el.dataset.h),r=getR(h,el.dataset.r),t=e.target;if(t.dataset.stock!==undefined){if(t.value!==''&&(!t.validity.valid||num(t.value)===null)){toast('所持数は0以上の整数で入力してください。');render();return;}h.stock[t.dataset.stock]=num(t.value);h.stamp='所持数を更新：'+new Date().toLocaleDateString('ja-JP');changed();}else if(t.dataset.edit==='priority'){r.priority=Number(t.value);changed();}else if(t.dataset.edit==='base'){r.baseReady=t.checked?true:null;changed();}else if(t.dataset.edit==='memo'){r.memo=t.value;save();}});
  $('#search').oninput=e=>{query=e.target.value;render();};$('#show-done').onchange=e=>{showDone=e.target.checked;render();};
  function setMobileView(view){document.body.dataset.mobileView=view;document.querySelectorAll('[data-mobile]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mobile===view)));document.querySelector('.mobile-switch').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  $('.mobile-route').onclick=e=>{e.preventDefault();setMobileView('plan');};
  $('#new-request').onclick=newRequest;$('#add-hunter').onclick=newHunter;
  $('#add-stop').onclick=()=>{openModal('寄り道を一行',`<form id="stop-form"><label class="form-field">次にやること<input name="title" required maxlength="120" placeholder="例：先に植生研究所に寄る"></label><label class="form-field">メモ<input name="note" maxlength="500" placeholder="誰と・何のために"></label><button class="ink-button">段取りに入れる</button></form>`);$('#stop-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),title=f.get('title').trim();if(!title)return;state.plan.push({id:uid(),title,note:f.get('note'),done:false,refs:[]});closeModal();changed();};};
  $('#clear-done').onclick=()=>{const ids=new Set(visiblePlan().filter(p=>p.done).map(p=>p.id));if(!ids.size){toast('済んだ予定はまだありません。');return;}if(confirm('表示中の、済んだ予定だけを片づけますか？')){state.plan=state.plan.filter(p=>!ids.has(p.id));changed();}};
  async function copy(text){try{await navigator.clipboard.writeText(text);toast('コピーしました。');}catch{openModal('コピーする文章',`<p class="dialog-note">この環境では自動コピーできません。下の文章を選択してコピーしてください。</p><textarea id="copy-fallback" class="share-output" readonly>${esc(text)}</textarea>`);$('#copy-fallback').select();}}
  function planText(){const p=visiblePlan();return '【MHW:I 今日の段取り】\n'+(p.length?p.map((s,n)=>`${s.done?'✓':n+1+'.'} ${s.title}\n${s.note}`).join('\n\n'):'まだ予定はありません。');}
  $('#copy-route').onclick=()=>copy(planText());
  function download(obj,name){const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const packHunter=h=>({format:'mhwi-request-v1',version:1,hunter:clone(h),plan:state.plan.filter(p=>p.refs.length&&p.refs.every(r=>r.hunterId===h.id))});
  function bytes64(str){let b='';for(const n of new TextEncoder().encode(str))b+=String.fromCharCode(n);return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function decode64(b){if(b.length>300000)throw Error('共有データが大きすぎます。');const s=atob(b.replace(/-/g,'+').replace(/_/g,'/'));return new TextDecoder().decode(Uint8Array.from(s,c=>c.charCodeAt(0)));}
  $('#share').onclick=()=>{
    if(state.selected==='all'){toast('渡したい人の帳面を選んでください。');return;}const h=getH(state.selected),packet=packHunter(h);
    openModal(h.name+'の帳面を渡す',`<p class="dialog-note">${esc(h.name)}の依頼 ${h.requests.length}件と素材在庫・メモを渡します。この人だけの予定も含みます。ほかの人の在庫や混合の予定は含めません。</p><p class="dialog-note">リンクを知る人は内容を読めます。渡したあとの変更は自動同期されません。</p><div class="form-actions"><button id="make-link" class="ink-button">共有リンクを作る</button><button id="download-one" class="text-button">JSONで渡す</button></div><div id="share-result"></div>`);
    $('#download-one').onclick=()=>download(packet,'mhwi-request-'+h.id+'.json');
    $('#make-link').onclick=()=>{const u=new URL(location.href);u.search='';u.hash='request='+bytes64(JSON.stringify(packet));const link=u.href;if(link.length>16000){toast('リンクが長くなりすぎるため、JSONで渡してください。');return;}$('#share-result').innerHTML='<p class="dialog-note">共有する内容を確認して、このリンクを仲間へ。</p><textarea class="share-output" id="share-url" readonly></textarea><button class="text-button" id="copy-share">リンクをコピー</button>';$('#share-url').value=link;$('#copy-share').onclick=()=>copy(link);};
  };
  $('#export-all').onclick=()=>{if(confirm('このブラウザの全員の依頼・素材在庫・予定をJSONに保存します。自分のバックアップ用として扱ってください。'))download({format:'mhwi-book-backup-v1',version:1,hunters:state.hunters,plan:state.plan},'mhwi-request-book-backup.json');};
  function receive(packet){
    if(!packet||packet.version!==1||!['mhwi-request-v1','mhwi-book-backup-v1'].includes(packet.format))throw Error('対応している依頼帳JSONではありません。');
    const raw=packet.format==='mhwi-request-v1'?[packet.hunter]:packet.hunters;if(!Array.isArray(raw)||!raw.length||raw.length>40||state.hunters.length+raw.length>60)throw Error('帳面の数が上限を超えています。');
    const hs=raw.map(normalizeHunter),plan=normalizePlan(packet.plan);
    openModal('帳面の写しを受け取りました',`<p class="dialog-note">${hs.map(h=>`${esc(h.name)}：依頼${h.requests.length}件`).join('<br>')}</p><p class="dialog-note">今ある帳面は上書きせず、別の写しとして追加します。内容は受け取った時点の記録です。</p><button id="accept-import" class="ink-button">確認して写しを追加</button>`);
    $('#accept-import').onclick=()=>{const ids=new Map();for(const h of hs){const old=h.id;h.id='received-'+uid();ids.set(old,h.id);if(state.hunters.some(x=>x.name===h.name))h.name=(h.name+'（写し）').slice(0,40);state.hunters.push(h);}for(const p of plan){p.id=uid();p.refs=p.refs.filter(r=>ids.has(r.hunterId)).map(r=>({...r,hunterId:ids.get(r.hunterId)}));state.plan.push(p);}state.selected=hs[0].id;expanded.clear();closeModal();try{history.replaceState(null,'',location.pathname+'?hunter='+encodeURIComponent(state.selected));}catch{}changed();toast('元の帳面を残して、写しを追加しました。');};
  }
  $('#import-button').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{if(f.size>500000)throw Error('JSONは500KB以下で読み込んでください。');receive(JSON.parse(await f.text()));}catch(err){toast(err.message||'ファイルを読み込めませんでした。');}};
  $('#references').onclick=()=>openModal('参考動画と、帳面の根拠',`${D.sources.map(s=>`<div class="reference"><a target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">${esc(s.name)} ↗</a><p>${esc(s.note)}</p></div>`).join('')}<div class="reference"><b>砕光の剣斧の所持数</b><p>2026/09/20の添付ゲーム画面から転記。撃滅拳2、弾頭殻3、黒曜甲4、炉心殻0。所持金20,218z、作成費用80,000z。現在の所持を保証するものではありません。</p></div><div class="reference"><b>装備データ</b><p>4属性弓・強弓珠・強化持続の候補はMonster Hunter World Chroniclesで照合。出典は各依頼の詳細にあります。非公式DBです。弓の素材は強化ルートの最終1段のみ。クエスト解放条件や動画内の全ビルドは未確認です。</p></div><div class="reference"><b>計算と共有</b><p>優先度→確認済みの不足→関連する依頼数で並べる、相談用の候補です。最短攻略の保証はありません。完成チェックでは素材・お金を減らしません。使った分は手動で在庫を更新してください。</p><p>同名素材を個人内で合算し、所持を1度だけ差し引きます。各依頼の「あと」はその1件分、まとめ帳は未完成の全依頼分です。</p></div>`);
  $('#date-stamp').textContent=(new Date().getMonth()+1)+'.'+String(new Date().getDate()).padStart(2,'0');
  window.addEventListener('storage',e=>{if(e.key===KEY)toast('別のタブで帳面が更新されました。作業中の内容をバックアップしてから再読込してください。');});
  render();
  if(location.hash.startsWith('#request=')){try{receive(JSON.parse(decode64(location.hash.slice(9))));}catch(err){toast(err.message||'共有リンクを読み込めませんでした。');}}
  // Small, read-only test surface for acceptance checks; no network or external writes.
  window.REQUEST_BOOK_TEST={getState:()=>clone(state),getGroups:()=>clone(groups)};
})();
