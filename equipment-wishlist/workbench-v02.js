'use strict';
// Additive release: the v0.1 engine, inventory schema and Serket notes stay intact.
(() => {
  const KEY = 'mhwi-equipment-requests-v1';
  const MARK = KEY + ':upgrade-20260920-v02';
  const BACKUP = KEY + ':before-20260920-v02';
  const GOAL = 'fatalis-sa-set';
  const D = window.HUNT_DATA;
  const goal = {id:GOAL,name:'対ミラ・スラアク装備',cat:'防具',type:'スラッシュアックス',tag:'最優先候補',note:'ミラボレアスに向けて、スラアク装備の更新を先に。',detail:'初討伐前の準備として整理する依頼。砕光の剣斧は既存の武器候補であり、完成済み装備ではありません。今の武器・防具・珠・護石・装衣を記録し、必要な更新を決めてから素材集めへ。ミラ素材製の装備を準備の必須条件にはしません。',target:'対ミラのスラアク装備を見直す',price:null,mats:[]};
  if (!D.items.some(i => i.id === GOAL)) D.items.push(goal);
  let upgradeWarning = '';
  // Preserve IDs, old inventory, priorities and completion; add the new goal only once.
  try {
    const raw = localStorage.getItem(KEY);
    let s;
    if (raw !== null) {
      s = JSON.parse(raw);
      if (s.version !== 1 || !Array.isArray(s.hunters) || !Array.isArray(s.plan)) throw Error('既存の保存形式を確認できません。');
    } else {
      s = {version:1,selected:'osakenpiro',hunters:[{id:'osakenpiro',name:'osakenpiro',stamp:'2026/09/20 スクショ転記',stock:{'砕竜の撃滅拳':2,'砕竜の弾頭殻':3,'不壊の黒曜甲':4,'不滅の炉心殻':0,'ゼニー':20218},requests:D.items.filter(i=>i.id!==GOAL).map(i=>({id:'osada-'+i.id,itemId:i.id,memo:i.note,priority:2,done:false,baseReady:null}))},...['keuita','serket','zushi'].map(id=>({id,name:id,stamp:'まだ記録なし',stock:{},requests:[]}))],plan:[]};
    }
    const h = s.hunters.find(h=>h.id==='osakenpiro');
    let modified = raw === null;
    if (h) {
      if (!Array.isArray(h.requests)) throw Error('既存の依頼を確認できません。');
      if (h.name === 'おさだ' || h.name === '長田' || h.name === 'osada') { h.name = 'osakenpiro'; modified = true; }
      if (!localStorage.getItem(MARK) && !h.requests.some(r=>r.itemId===GOAL)) {
        h.requests.unshift({id:'osakenpiro-'+GOAL,itemId:GOAL,memo:goal.note,priority:1,done:false,baseReady:null}); modified = true;
      }
      // Only a label tied to this hunter; arbitrary notes and other hunters are untouched.
      s.plan.forEach(p=>{if(p.refs?.some(r=>r.hunterId==='osakenpiro') && typeof p.note==='string') {const n=p.note.replace(/^おさだ：/gm,'osakenpiro：');if(n!==p.note){p.note=n;modified=true;}}});
    }
    if (modified) {
      if (raw !== null && !localStorage.getItem(BACKUP)) localStorage.setItem(BACKUP,raw);
      if (localStorage.getItem(KEY) !== raw) throw Error('別のタブで更新されました。');
      localStorage.setItem(KEY,JSON.stringify(s));
    }
    localStorage.setItem(MARK,'applied');
  } catch (e) { upgradeWarning = '更新を保存できませんでした。元の帳面は初期化していません。保存設定を確認してください。'; }

  const esc = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const boxes = {art:'0 0 197 169',switchaxe:'200 0 41 43',bow:'245 0 31 35',armor:'280 0 25 26',mantle:'310 0 22 26',charm:'337 0 20 26',material:'360 0 33 38'};
  function image(kind,cls='') {return `<svg class="game-crop ${cls}" viewBox="${boxes[kind]||boxes.armor}" aria-hidden="true" focusable="false"><image width="400" height="172" href="game-crops.svg?v=020"/></svg>`;}
  const snap=()=>window.REQUEST_BOOK_TEST?.getState();
  const slotNames=['武器','頭','胴','腕','腰','脚','護石','装衣1','装衣2'];
  const steps=['構成を決める','不足素材を集める','加工・防具強化'];
  const start='【対ミラ装備表】', end='【装備表ここまで】';
  let focus, editor, scheduled=false;
  function readSheet(memo='') {
    const out={current:{},target:{},skills:'',checks:[false,false,false]};
    const block=memo.split(start)[1]?.split(end)[0]||'';
    for(const line of block.split('\n')) {
      const m=line.match(/^(現在|候補)\/(.+?)：(.+)$/);
      if(m && slotNames.includes(m[2])) out[m[1]==='現在'?'current':'target'][m[2]]=m[3]==='未記入'?'':m[3];
      if(line.startsWith('スキル・方針：'))out.skills=line.slice('スキル・方針：'.length);
      steps.forEach((s,n)=>{if(line===`段階${n+1}：済`)out.checks[n]=true;});
    }
    return out;
  }
  function writeSheet(memo,sheet) {
    const before=memo.includes(start)?memo.split(start)[0].trim():memo.trim();
    const tail=memo.includes(end)?memo.slice(memo.indexOf(end)+end.length).trim():'';
    const lines=[before,'',start];
    slotNames.forEach(s=>{lines.push(`現在/${s}：${sheet.current[s]||'未記入'}`,`候補/${s}：${sheet.target[s]||'未記入'}`);});
    lines.push('スキル・方針：'+sheet.skills,...steps.map((s,n)=>`段階${n+1}：${sheet.checks[n]?'済':'未'}`),end);
    if(tail)lines.push('',tail);
    return lines.join('\n');
  }
  function currentGoal() {
    const s=snap(); if(!s)return null;
    const h=s.hunters.find(h=>h.id===s.selected);
    // The shared view highlights the explicitly requested osakenpiro project only.
    const owner=h||(s.selected==='all'?s.hunters.find(h=>h.id==='osakenpiro'):null);
    const r=owner?.requests.find(r=>r.itemId===GOAL&&!r.done);
    return r?{h:owner,r}:null;
  }
  function article(hid,rid) {return [...document.querySelectorAll('.request')].find(a=>a.dataset.h===hid&&a.dataset.r===rid);}
  function reveal(hid,rid) {
    document.querySelector(`[data-hunter="${CSS.escape(hid)}"]`)?.click();
    const a=article(hid,rid);if(!a)return null;
    const b=a.querySelector('[data-action="open"]');if(b?.getAttribute('aria-expanded')!=='true') b.click();
    return article(hid,rid);
  }
  function storeSheet(hid,rid,sheet) {
    const a=reveal(hid,rid), memo=a?.querySelector('[data-edit="memo"]');
    if(!memo)return false;
    const next=writeSheet(memo.value,sheet);if(next.length>2000){alert('メモが長すぎます。短くして保存してください。');return false;}
    memo.value=next;memo.dispatchEvent(new Event('change',{bubbles:true}));
    decorate();
    try {const s=JSON.parse(localStorage.getItem(KEY)||'null');return s?.hunters.find(h=>h.id===hid)?.requests.find(r=>r.id===rid)?.memo===next;} catch{return false;}
  }
  function editSheet(hid,rid) {
    const s=snap(),h=s?.hunters.find(h=>h.id===hid),r=h?.requests.find(r=>r.id===rid);if(!r)return;
    const sheet=readSheet(r.memo);
    editor.innerHTML=`<form id="build-form"><div class="modal-top"><h2 id="build-title">対ミラ・スラアク装備表</h2><button type="button" data-close-sheet aria-label="閉じる">×</button></div><p class="sheet-intro">${esc(h.name)} ／ 現在と候補を並べて、変える場所を決めよう。</p><div class="loadout-head"><span>部位</span><span>今の装備</span><span>更新候補</span></div>${slotNames.map((n,i)=>`<div class="loadout-row"><label for="build-c-${i}">${n}</label><input id="build-c-${i}" name="c${i}" maxlength="45" aria-label="${n}の現在の装備" placeholder="未記入" value="${esc(sheet.current[n]||'')}"><input name="t${i}" maxlength="45" aria-label="${n}の更新候補" placeholder="${n==='武器'?'例：砕光の剣斧':'未定'}" value="${esc(sheet.target[n]||'')}"></div>`).join('')}<label class="form-field">欲しいスキル・戦い方<input name="skills" maxlength="180" value="${esc(sheet.skills)}" placeholder="例：強化持続を入れたい。珠・スロットも確認する。"></label><p class="tiny">候補は完成装備ではありません。スキル合計・スロット・素材・解放条件はゲーム内で確認。</p><div class="build-checks">${steps.map((n,i)=>`<label><input type="checkbox" name="done${i}" ${sheet.checks[i]?'checked':''}>${n}</label>`).join('')}</div><p id="build-result" role="status"></p><div class="form-actions"><button class="ink-button">装備表を保存</button><button type="button" class="text-button" data-close-sheet>やめる</button></div></form>`;
    editor.showModal();
    editor.querySelectorAll('[data-close-sheet]').forEach(b=>b.onclick=()=>editor.close());
    editor.querySelector('form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),out={current:{},target:{},skills:String(f.get('skills')).trim(),checks:steps.map((_,i)=>f.has('done'+i))};slotNames.forEach((n,i)=>{out.current[n]=String(f.get('c'+i)).trim();out.target[n]=String(f.get('t'+i)).trim();});if(storeSheet(hid,rid,out)){editor.close();}else{editor.querySelector('#build-result').textContent='保存を確認できません。帳面の保存状態を確認し、バックアップしてください。';}};
  }
  function decorate() {
    scheduled=false;const s=snap();if(!s)return;
    const g=currentGoal();
    focus.hidden=!g||document.querySelector('#show-done')?.checked===true;
    if(g) {
      const sheet=readSheet(g.r.memo),count=sheet.checks.filter(Boolean).length;
      const first=g.r.priority===1?'最優先候補':g.r.priority===3?'あとで進める':'準備中の依頼';
      focus.innerHTML=`<div class="focus-art">${image('art')}<span>武器候補：砕光の剣斧</span></div><div class="focus-copy"><p class="focus-kicker">${esc(g.h.name)} ／ ${first}</p><h3>ミラに向けて、<br>スラアクを整える。</h3><p class="focus-caption">今の一式と更新候補を、一枚の装備表に。</p><button class="ink-button" data-build-h="${esc(g.h.id)}" data-build-r="${esc(g.r.id)}">装備表を書く →</button></div><div class="focus-stages" aria-label="準備の段階">${steps.map((t,i)=>`<span class="${sheet.checks[i]?'stage-done':''}"><b>${sheet.checks[i]?'✓':String(i+1).padStart(2,'0')}</b>${t}</span>`).join('<em aria-hidden="true">→</em>')}</div><div class="focus-links"><span>${count}/3 記録済み</span><button class="text-button" data-related="lightbreak-axe">武器の素材</button><button class="text-button" data-related="power-prolonger">強化持続の防具</button><a href="../fatalis-roadmap/">黒龍への道 ↗</a></div>`;
    }
    document.querySelectorAll('.request').forEach(a=>{
      const h=s.hunters.find(h=>h.id===a.dataset.h),r=h?.requests.find(r=>r.id===a.dataset.r);if(!r)return;
      const i=r.custom||D.items.find(i=>i.id===r.itemId);if(!i)return;
      a.classList.toggle('focus-request',r.itemId===GOAL);
      const button=a.querySelector('.request-open');if(!button||button.querySelector('.request-picture'))return;
      let kind=i.cat==='装衣'?'mantle':i.cat==='珠・護石'?'charm':i.cat==='素材'?'material':i.cat==='防具'?'armor':i.type==='弓'?'bow':'switchaxe';
      if(r.itemId===GOAL||r.itemId==='lightbreak-axe')kind='art';
      // Unknown/custom weapon types are not assigned a counterfeit weapon glyph.
      if(i.cat==='武器'&&!['弓','スラッシュアックス'].includes(i.type))kind='armor';
      const p=document.createElement('span');p.className='request-picture '+(kind==='art'?'weapon-picture':'');p.innerHTML=image(kind);button.prepend(p);
      const head=button.querySelector('h3');if(r.priority===1){const b=document.createElement('span');b.className='first-mark';b.textContent='先に';head?.append(b);}
      if(i.type==='弓'&&['火','水','雷','氷'].includes(i.tag)){const b=document.createElement('span');b.className='element-mark element-'+({'火':'fire','水':'water','雷':'thunder','氷':'ice'}[i.tag]);b.textContent=i.tag;button.querySelector('.item-meta')?.append(b);}
      if(r.itemId===GOAL){const body=a.querySelector('.request-body');if(body){const b=document.createElement('button');b.type='button';b.className='ink-button';b.textContent='現在の装備・更新候補を書く';b.dataset.buildH=h.id;b.dataset.buildR=r.id;body.prepend(b);}}
    });
  }
  function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(decorate);}}
  document.addEventListener('DOMContentLoaded',()=>{
    const ledger=document.querySelector('.ledger-head'),list=document.querySelector('#request-list');if(!ledger||!list)return;
    if(upgradeWarning){const p=document.createElement('p');p.className='upgrade-warning';p.textContent=upgradeWarning;ledger.after(p);}
    focus=document.createElement('section');focus.id='priority-focus';focus.setAttribute('aria-label','対ミラの装備準備');ledger.after(focus);
    editor=document.createElement('dialog');editor.id='build-editor';editor.setAttribute('aria-labelledby','build-title');document.body.append(editor);
    document.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.buildH)editSheet(b.dataset.buildH,b.dataset.buildR);
      if(b.dataset.related){const g=currentGoal();if(!g)return;const r=g.h.requests.find(r=>r.itemId===b.dataset.related&&!r.done);if(r){reveal(g.h.id,r.id)?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}else{document.querySelector('#new-request')?.click();const f=document.querySelector('#request-form');if(f){f.elements.hunter.value=g.h.id;f.elements.preset.value=b.dataset.related;f.elements.preset.dispatchEvent(new Event('change',{bubbles:true}));}}}
    });
    new MutationObserver(queue).observe(list,{childList:true});
    new MutationObserver(queue).observe(document.querySelector('#hunters'),{childList:true});
    document.querySelector('#show-done').addEventListener('change',queue);
    // Keep the initial overview compact; this is a view change, not a saved edit.
    if(currentGoal()){const a=[...list.querySelectorAll('.request')].find(a=>a.dataset.h==='osakenpiro'&&a.dataset.r==='osada-lightbreak-axe');const b=a?.querySelector('[data-action="open"][aria-expanded="true"]');b?.click();}
    decorate();
  });
})();
