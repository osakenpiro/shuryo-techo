/* Dependency-free UI. Never infers a winning hand from a score or yaku fragment. */
'use strict';
(() => {
  const $=id=>document.getElementById(id);
  if (!window.MJ || !window.YAKU) { $('boot-warning').textContent='読み込めませんでした。ページを再読み込みしてください。'; return; }
  const GLOSSARY=window.MJ_GLOSSARY||[];
  const initial=()=>({dealer:false,win:'ron',han:null,fu:null,hasYaku:false,yakuman:0,honba:0,sticks:0});
  let s=initial(), filter='common', fuResult=null, scoreMode='paper';
  const rule={kiriage:false,kazoe:true,doubleWind:4};
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>n.toLocaleString('ja-JP');
  const choices=(id,key,items,current)=>{
    const active=document.activeElement, previous=active&&active.closest('#'+id)?active.dataset.value:null;
    $(id).innerHTML=items.map(([v,label])=>`<button type="button" data-key="${key}" data-value="${v}" aria-pressed="${String(v)===String(current)}">${label}</button>`).join('');
    if(previous!==null) Array.from($(id).children).find(b=>b.dataset.value===previous)?.focus({preventScroll:true});
  };
  const kana=t=>t.normalize('NFKC').toLowerCase().replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  function tiles(text) {
    return text.split(' ').filter(Boolean).map(group=>{
      const type=group.slice(-1), suit={m:'萬',p:'筒',s:'索',z:''}[type];
      const digits=group.slice(0,-1).split('');
      return `<span class="tile-group" role="img" aria-label="${digits.map(d=>type==='z'?'東南西北白發中'[Number(d)-1]:d+suit).join(' ')}">${digits.map(d=>`<span class="tile ${type}" aria-hidden="true">${type==='z'?'東南西北白發中'[Number(d)-1]:`${d}<b>${suit}</b>`}</span>`).join('')}</span>`;
    }).join('');
  }
  function renderGlossary() {
    const list=$('term-badges'), note=$('term-note'); if(!list||!note)return;
    list.innerHTML=GLOSSARY.map(t=>`<button type="button" class="term-chip" data-term="${t.id}" aria-pressed="false">${esc(t.name)}</button>`).join('');
  }
  function yakuTrait(y) {
    if(y.han<0)return '<span class="trait rule"><span aria-hidden="true">⚠</span>卓ルール確認</span>';
    if(y.open<0)return '<span class="trait closed"><span aria-hidden="true">🔒</span>門前のみ</span>';
    if(y.open!==y.han)return `<span class="trait down"><span aria-hidden="true">↓</span>鳴くと ${y.open}翻</span>`;
    return '<span class="trait open"><span aria-hidden="true">○</span>鳴きOK</span>';
  }
  function renderYaku() {
    const filters=[['common','よく使う'],['all','全部'],['open','鳴いてもOK'],['one','1翻'],['two','2翻'],['high','3翻〜役満']];
    choices('filters','filter',filters,filter);
    const query=kana($('search').value.trim());
    const found=YAKU.filter(y=>{
      const ok=query || filter==='all' || (filter==='common'&&y.common) || (filter==='open'&&y.open>=0&&y.han>=0) || (filter==='one'&&y.han===1) || (filter==='two'&&y.han===2) || (filter==='high'&&(y.han>=3||y.han===0));
      return ok && (!query || kana(y.name+' '+y.reading).includes(query));
    });
    $('yaku-count').textContent=`${query?'全ての役から検索 · ':''}${found.length}件 · 翻数は門前時／鳴いた時を併記`;
    $('yaku-cards').innerHTML=found.length?found.map(y=>{
      const val=y.han===0?'役満':y.han<0?'特殊':`${y.han}翻`;
      return `<article class="yaku" data-yaku="${y.id}"><div class="yaku-top"><h2>${y.name}</h2><span class="badge">${val}</span></div><div class="trait-row">${yakuTrait(y)}</div><p>${y.summary}</p>${y.tiles?`<div class="tiles">${tiles(y.tiles)}</div><span class="tile-label">形の例（手の一部）</span>`:''}<details><summary>読み方・気をつけること</summary><p>${y.reading}</p><p>${y.note}</p></details></article>`;
    }).join(''):'<p class="note">見つかりませんでした。名前を短くするか、検索欄を空にしてください。</p>';
  }
  const baseScoreInput=(dealer,win,han,fu)=>({dealer,win,han,fu,hasYaku:true,yakuman:0,honba:0,sticks:0,...rule});
  function paperScore(win,han,fu) {
    try {
      const child=MJ.score(baseScoreInput(false,win,han,fu));
      const dealer=MJ.score(baseScoreInput(true,win,han,fu));
      if(win==='ron') return `<div class="score-cell"><b>${fmt(child.payments[0].points)}</b><span>${fmt(dealer.payments[0].points)}</span></div>`;
      const parentPay=child.payments.find(p=>p.payer==='親')?.points;
      const childPay=child.payments.find(p=>p.payer.startsWith('子'))?.points;
      const allPay=dealer.payments[0].points;
      return `<div class="score-cell"><b>${fmt(childPay)}/${fmt(parentPay)}</b><span>${fmt(allPay)}オール</span></div>`;
    } catch(e) { return '<span class="muted">—</span>'; }
  }
  function limitScore(win,han,yakuman=0) {
    const make=dealer=>MJ.score({dealer,win,han:han||1,fu:30,hasYaku:true,yakuman,honba:0,sticks:0,...rule});
    const child=make(false), dealer=make(true);
    if(win==='ron') return `<div class="score-cell"><b>${fmt(child.payments[0].points)}</b><span>${fmt(dealer.payments[0].points)}</span></div>`;
    const parentPay=child.payments.find(p=>p.payer==='親')?.points;
    const childPay=child.payments.find(p=>p.payer.startsWith('子'))?.points;
    return `<div class="score-cell"><b>${fmt(childPay)}/${fmt(parentPay)}</b><span>${fmt(dealer.payments[0].points)}オール</span></div>`;
  }
  function paperTable(title,win,fus) {
    const hans=[1,2,3,4];
    return `<h2>${title}</h2><div class="score-table-wrap"><table class="score-table"><thead><tr><th>符</th>${hans.map(h=>`<th>${h}翻</th>`).join('')}</tr></thead><tbody>${fus.map(f=>`<tr><th class="fu-head">${f}符</th>${hans.map(h=>`<td>${paperScore(win,h,f)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function limitTable(title,win) {
    const limits=[['満貫','5翻',5,0],['跳満','6〜7翻',6,0],['倍満','8〜10翻',8,0],['三倍満','11〜12翻',11,0],['役満','',1,1]];
    return `<h2>${title}・満貫以上</h2><div class="score-table-wrap"><table class="score-table"><thead><tr>${limits.map(x=>`<th>${x[0]}<br><span class="small">${x[1]}</span></th>`).join('')}</tr></thead><tbody><tr>${limits.map(x=>`<td>${limitScore(win,x[2],x[3])}</td>`).join('')}</tr></tbody></table></div>`;
  }
  function renderPaper() {
    const el=$('paper-tables'); if(!el)return;
    el.innerHTML=paperTable('ツモ','tsumo',[20,25,30,40,50,60,70])+limitTable('ツモ','tsumo')+paperTable('ロン','ron',[25,30,40,50,60,70])+limitTable('ロン','ron');
  }
  function renderScoreMode() {
    const paper=scoreMode==='paper';
    $('paper-score').hidden=!paper;$('detail-score').hidden=paper;$('reset').hidden=paper;
    document.querySelectorAll('[data-score-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scoreMode===scoreMode)));
    $('score-mode-note').textContent=paper?'いま配られている早見表に合わせた見方です。':'親・子、ロン・ツモ、翻・符、本場・供託まで細かく計算します。';
    if(paper)renderPaper();
  }
  function result() {
    const el=$('result'); el.className='result'; $('jump-result').hidden=true;
    if (!s.han&&!s.yakuman) {el.classList.add('empty');el.innerHTML='<p>翻と符を選ぶと、支払点が出ます。</p>';return;}
    if (!s.yakuman&&s.han<5&&!s.fu) {el.classList.add('empty');el.innerHTML='<p>次は「符」を選んでください。</p>';return;}
    try {
      const r=MJ.score({...s,...rule}); $('jump-result').hidden=false;
      const context=`${s.dealer?'親':'子'}の${s.win==='ron'?'ロン':'ツモ'} · ${s.yakuman?r.limit:(s.han>=5?`${s.han===6?'6〜7':s.han===8?'8〜10':s.han===11?'11〜12':s.han===13?'13以上':s.han}翻`:`${s.han}翻 ${s.fu}符`)}${!s.yakuman&&r.limit?' · '+r.limit:''}`;
      el.innerHTML=`<p class="overline">${context}</p><h2>この人が支払います</h2>${r.payments.map(p=>`<div class="pay"><label>${p.payer}${p.count>1?'<br><small>1人あたり</small>':''}</label><strong>${fmt(p.points)}<em>点</em></strong></div>`).join('')}<div class="total"><span>あがった人の受取合計</span><b>${fmt(r.total)}点</b></div><p class="foot">本場 ${s.honba}本（＋${fmt(r.honbaBonus)}）を支払いに含む<br>供託 ${s.sticks}本（＋${fmt(r.deposit)}）は卓から別取り</p>`;
    } catch(e) {el.classList.add('error');el.innerHTML=`<p><b>入力を確認</b><br>${esc(e.message)}</p>`;}
  }
  function renderScore() {
    choices('dealer','dealer',[[false,'子'],[true,'親']],s.dealer);
    choices('win','win',[['ron','ロン'],['tsumo','ツモ']],s.win);
    choices('han','han',[[1,'1翻'],[2,'2翻'],[3,'3翻'],[4,'4翻'],[5,'5翻']],s.yakuman?null:s.han);
    choices('fu-choices','fu',[[20,'20符'],[25,'25符'],[30,'30符'],[40,'40符'],[50,'50符']],s.fu);
    $('big-han').value=s.yakuman?'y'+s.yakuman:s.han>=6?String(s.han):'';
    $('more-fu').value=s.fu>=60?String(s.fu):'';
    $('has-yaku').checked=s.hasYaku;
    $('yaku-check').hidden=!!s.yakuman;
    $('fu-field').hidden=!!s.yakuman||s.han>=5;
    $('no-fu').hidden=!$('fu-field').hidden;
    $('profile').textContent=`四麻 · 切り上げ${rule.kiriage?'あり':'なし'} · 数え役満${rule.kazoe?'あり':'なし'}`;
    $('big-han').querySelector('[value="13"]').textContent=rule.kazoe?'13翻以上 · 数え役満':'13翻以上 · 三倍満（数えなし）';
    result();
  }
  function route() {
    const page=['home','yaku','score','fu','rules'].includes(location.hash.slice(1))?location.hash.slice(1):'home';
    document.querySelectorAll('.page').forEach(el=>{el.hidden=el.id!==page;});
    document.querySelectorAll('.bottom a').forEach(a=>{if(a.hash==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(page==='score'){renderScore();renderScoreMode();}
    if(page==='fu') { $('f-win').value=s.win; renderFu(); }
    window.scrollTo(0,0);
    const h=$(`${page}-title`); h.tabIndex=-1; h.focus({preventScroll:true});
  }
  const groupOptions=[['seq','順子 · 123（チーもここ）'],['pon2','ポン · 2〜8'],['pon19','ポン · 1・9・字牌'],['anko2','自分でそろえた3枚 · 2〜8'],['anko19','自分でそろえた3枚 · 1・9・字牌'],['ron2','ロンで完成した3枚 · 2〜8'],['ron19','ロンで完成した3枚 · 1・9・字牌'],['kan2','明カン · 2〜8'],['kan19','明カン · 1・9・字牌'],['ankan2','暗カン · 2〜8'],['ankan19','暗カン · 1・9・字牌']];
  $('fu-groups').innerHTML=[0,1,2,3].map(i=>`<label class="row-label" for="f-g${i}">${i+1}組目（ペア以外）</label><select id="f-g${i}"><option value="">選んでください</option>${groupOptions.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select>`).join('');
  function renderFu() {
    fuResult=null;
    const shape=$('f-shape').value,standard=shape==='standard';
    $('fu-standard').hidden=!standard;$('pinfu-note').hidden=shape!=='pinfu';
    const out=$('fu-result');out.className='fu-result';$('apply-fu').disabled=true;
    if(!shape){out.textContent='形を選ぶと、符が出ます。';return;}
    try {
      if(standard&&(!$('f-pair').value||!$('f-wait').value||[0,1,2,3].some(i=>!$(`f-g${i}`).value))) {out.textContent='ペア・待ち・4組を選んでください。';return;}
      const pair=$('f-pair').value==='double'?rule.doubleWind:Number($('f-pair').value);
      const r=MJ.countFu({shape,closed:$('f-closed').value==='yes',win:$('f-win').value,pair,wait:$('f-wait').value,groups:[0,1,2,3].map(i=>$(`f-g${i}`).value)});
      if(!MJ.FU.includes(r.fu)) throw new Error('110符を超えました。役・役満を確認し、満貫以上は翻から計算してください。');
      fuResult=r;out.innerHTML=`<strong>${r.fu}符</strong><p>${esc(r.reason)}</p><p>翻は別に確認してください。${r.minHan>1?`この形の最低は${r.minHan}翻です。`:''}</p>`;
      $('apply-fu').disabled=false;
    } catch(e) {out.classList.add('error');out.textContent=e.message;}
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.scoreMode){scoreMode=b.dataset.scoreMode;renderScoreMode();return;}
    if(b.dataset.term){
      const t=GLOSSARY.find(x=>x.id===b.dataset.term), note=$('term-note'); if(!t||!note)return;
      const closing=!note.hidden&&note.dataset.term===t.id;
      document.querySelectorAll('[data-term]').forEach(x=>x.setAttribute('aria-pressed','false'));
      if(closing){note.hidden=true;note.dataset.term='';return;}
      b.setAttribute('aria-pressed','true');note.dataset.term=t.id;note.hidden=false;
      note.innerHTML=`<strong>${esc(t.name)} <span class="small">${esc(t.reading)}</span></strong><span>${esc(t.summary)} ${esc(t.note)}</span>`;
      return;
    }
    if(b.dataset.key){
      const {key,value}=b.dataset;
      if(key==='filter'){filter=value;renderYaku();return;}
      if(key==='dealer')s.dealer=value==='true';
      if(key==='win')s.win=value;
      if(key==='han'){s.han=Number(value);s.yakuman=0;}
      if(key==='fu')s.fu=Number(value);
      renderScore();
    }
    if(b.dataset.preset){
      const p=b.dataset.preset==='pinfu';Object.assign(s,{han:2,fu:p?20:25,win:p?'tsumo':'ron',hasYaku:true,yakuman:0});
      $('score-context').textContent='役とドラが増えるときは、合計の翻を直してください。';renderScore();$('result').scrollIntoView({block:'start'});
    }
  });
  $('jump-result').addEventListener('click',()=>{$('result').scrollIntoView({block:'start'});});
  document.querySelectorAll('.bottom a').forEach(a=>a.addEventListener('click',()=>{if(a.hash===location.hash)route();}));
  $('search').addEventListener('input',renderYaku);
  $('big-han').addEventListener('change',e=>{const v=e.target.value;s.yakuman=v.startsWith('y')?Number(v.slice(1)):0;s.han=v&&!s.yakuman?Number(v):null;renderScore();});
  $('more-fu').addEventListener('change',e=>{s.fu=e.target.value?Number(e.target.value):null;renderScore();});
  $('has-yaku').addEventListener('change',e=>{s.hasYaku=e.target.checked;result();});
  ['honba','sticks'].forEach(id=>$(id).addEventListener('input',e=>{s[id]=e.target.value===''?NaN:Number(e.target.value);result();}));
  ['kiriage','kazoe'].forEach(id=>$(id).addEventListener('change',e=>{rule[id]=e.target.checked;renderScore();renderPaper();}));
  $('double-wind').addEventListener('change',e=>{rule.doubleWind=Number(e.target.value);renderFu();});
  $('reset').addEventListener('click',()=>{s=initial();$('honba').value='0';$('sticks').value='0';$('score-context').textContent='親・子は「あがった人」で選びます。';renderScore();});
  $('fu-form').addEventListener('change',renderFu);
  $('fu-form').addEventListener('submit',e=>{e.preventDefault();renderFu();if(!fuResult)return;s.fu=fuResult.fu;s.win=$('f-win').value;s.yakuman=0;$('score-context').textContent=`符補助から${fuResult.fu}符を反映。役＋ドラの合計翻も確認してください。`;location.hash='score';});
  window.addEventListener('hashchange',route);
  renderGlossary();renderYaku();renderScore();renderPaper();renderScoreMode();route();$('boot-warning').hidden=true;
})();
