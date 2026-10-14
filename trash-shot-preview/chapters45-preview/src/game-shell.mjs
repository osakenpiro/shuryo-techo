// Presentation only. Chapter progress and stage changes stay owned by app.mjs.
import { STAGES } from './stages.mjs?v=20261014-tower-train-2';
import { CHAPTER_IDS, CHAPTERS, chapterForStage, canChooseStage, outdoorSnapshot, OUTDOOR_CHAPTER_IDS, BRANCH_CHAPTER_IDS, FACTORY_CHAPTER_IDS, ECCENTRIC_CHAPTER_IDS } from './progress-save.mjs?v=20261014-tower-train-2';
import { drawPixelText, measurePixelText } from './pixel-type.mjs?v=20261014-tower-train-2';

const $ = id => document.getElementById(id);
const FACE_HELP = Object.freeze({
  first: '机から、奥のゴミ箱へ。',
  'desk-over': '机の上を越えるひと投げ。',
  'desk-side': '本棚を越すか、横の壁で跳ね返そう。',
  'room-extra': '扇風機の風と、気ままな猫。',
  'school-classroom': '教室の机列を、高い弧で越えよう。',
  'school-vending': '小さな入口へ、力を抑えて正確に。',
  'school-passage': '二つの窓の向こうへ。廊下を行き交う生徒の間を狙おう。',
  'school-rooftop': '屋上から、中庭の箱へ。風も読もう。',
  'outdoor-shrine': '参拝する人たちの動きを見て、向こうの賽銭箱へ。',
  'outdoor-baseball': 'ホームランの一球を、観客のミットへ。',
  'outdoor-mall': '吹き抜けから、子供のコーンへアイスを落とそう。',
  'outdoor-river': '船の灯りを読んで、向こう岸の花火筒へ。',
  'factory-shutter': '開閉するシャッターの、開いた瞬間を狙おう。',
  'factory-conveyor': 'ベルトに乗せて、流れの先の箱へ。',
  'factory-bank': '左右の壁を使って、二つのバウンドをつなごう。',
  'factory-relay': '最初の球で仕掛けを動かし、次の球を箱へ。',
  'eccentric-tower': '250mの展望台から、はるか下の街の箱へ。',
  'eccentric-train': '走る電車の窓から、隣を走る電車の窓へ。',
  'eccentric-boar': '森で狙いを定めて、矢を的へ。',
  'eccentric-basket': 'バスケットゴールに、気持ちよくシュート。',
  'eccentric-dandelion': '軽い綿毛を、風に乗せて届けよう。',
  'eccentric-card': 'トランプを狙って投げ、的に刺そう。',
  'eccentric-cannon': '大砲から、砦の扉を狙おう。',
});

function paintLabel(canvas, text, { scale = 3, color = '#286864', padding = 2 } = {}) {
  if (!canvas || canvas.dataset.paintedText === text) return;
  const bounds = measurePixelText(text, { scale });
  const width = bounds.width + padding * 2, height = bounds.height + padding * 2;
  // An integer backing ratio keeps every bitmap cell on a complete pixel.
  const ratio = Math.min(3, Math.max(1, Math.ceil(globalThis.devicePixelRatio || 1)));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(ratio, ratio);
  drawPixelText(context, text, padding, padding, { scale, color });
  canvas.dataset.paintedText = text;
}

function numberCanvas(number, className = 'face-number') {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  paintLabel(canvas, number);
  return canvas;
}

export function createGameShell({ getState, selectStage, onRouteVisit }) {
  if (typeof getState !== 'function' || typeof selectStage !== 'function') {
    throw new TypeError('The game shell needs app-owned state and stage selection');
  }
  const cards = new Map(), marks = new Map();
  const cardHost = $('chapter-stage-cards'), progressHost = $('home-face-progress');
  const menu = $('game-menu'), home = $('chapter-top');
  let lastFingerprint = '';
  const listeners = [];
  const on = (node, type, callback) => {
    if (!node) return;
    node.addEventListener(type, callback);
    listeners.push(() => node.removeEventListener(type, callback));
  };
  for (const [index, id] of CHAPTER_IDS.entries()) {
    const chapter = chapterForStage(id), number = STAGES[id].number ?? `${chapter.number}-${chapter.ids.indexOf(id)+1}`;
    const name = STAGES[id].label.replace(/^\d+-\d+[：:]\s*/, '');
    if (chapter.ids[0] === id) {
      const heading = document.createElement('h3');
      heading.className = 'chapter-stage-heading';
      heading.dataset.chapter = String(chapter.number);
      heading.textContent = `${chapter.number} ${chapter.label}`;
      cardHost?.append(heading);
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `chapter-stage-card stage-art-${index + 1}${chapter.number===2?' chapter-school-card stage-'+id:chapter.number===3?' chapter-outdoor-card stage-'+id:chapter.number===4?' chapter-factory-card stage-'+id:chapter.number===5?' chapter-eccentric-card stage-'+id:''}`;
    card.dataset.chapter = String(chapter.number);
    card.dataset.stageId = id;
    const thumbnail = document.createElement('span');
    thumbnail.className = 'stage-thumbnail';
    thumbnail.setAttribute('aria-hidden', 'true');
    if (index === 3) {
      const fan = document.createElement('span');
      fan.className = 'stage-fan-symbol';
      fan.textContent = '✣';
      const cat = document.createElement('span');
      cat.className = 'stage-cat-symbol';
      cat.textContent = '／ᐠ · ᴥ · ᐟ＼';
      thumbnail.append(fan, cat);
    }
    const content = document.createElement('span');
    content.className = 'stage-card-content';
    const heading = document.createElement('span');
    heading.className = 'stage-card-heading';
    heading.append(numberCanvas(number));
    const status = document.createElement('span');
    status.className = 'stage-card-status';
    heading.append(status);
    const title = document.createElement('strong');
    title.className = 'stage-card-title';
    title.textContent = name;
    const description = document.createElement('span');
    description.className = 'stage-card-description';
    description.textContent = FACE_HELP[id];
    const record = document.createElement('span');
    record.className = 'stage-card-record';
    content.append(heading, title, description, record);
    card.append(thumbnail, content);
    cardHost?.append(card);
    cards.set(id, { card, status, record, number, name });
    on(card, 'click', () => visitFace(id));
    const mark = document.createElement('span');
    mark.className = 'home-face-mark';
    const stateText = document.createElement('span');
    stateText.className = 'home-face-state';
    mark.append(numberCanvas(number, 'home-face-number'), stateText);
    progressHost?.append(mark);
    marks.set(id, { mark, stateText, number });
  }
  const routeMap=createRouteMap();
  function previewFace(state,id){return ((state?.previewChapter3===true&&OUTDOOR_CHAPTER_IDS.includes(id))||(state?.previewChapters45===true&&BRANCH_CHAPTER_IDS.includes(id)))&&!canChooseStage(state.progress,id);}
  function accessibleFace(state,id){return canChooseStage(state.progress,id)||previewFace(state,id);}
  function visitFace(id){
    const state=getState(),selected=previewFace(state,id)?selectStage(id,{allowPractice:true}):selectStage(id);
    if(selected!==true)return false;
    update();$('scene')?.scrollIntoView({block:'center',behavior:'instant'});$('scene')?.focus({preventScroll:true});return true;
  }
  function createRouteMap(){
    const section=document.createElement('section');section.id='outdoor-route-map';section.className='outdoor-route-map';section.setAttribute('aria-label','外の別解と分岐のマップ');
    const title=document.createElement('h3');title.textContent='3 外から、ふたつの道へ';
    const count=document.createElement('p');count.id='outdoor-alt-count';count.className='outdoor-alt-count';count.setAttribute('aria-live','polite');
    const decision=document.createElement('p');decision.className='outdoor-route-decision';
    const faces=document.createElement('ol');faces.className='outdoor-map-faces';
    const rows=new Map(),hints=['鳥居の脇にも、小さなやしろ。','バックスクリーンの、得点板の光る場所。','別の階のお客さんのコーヒーかサイダー。','川を横切る蒸気船の煙突。'];
    OUTDOOR_CHAPTER_IDS.forEach((id,index)=>{
      const row=document.createElement('li');row.dataset.stageId=id;
      const label=document.createElement('strong');label.textContent=STAGES[id]?.label??`3-${index+1}`;
      const flags=document.createElement('p');flags.className='outdoor-map-flags';
      const hint=document.createElement('details'),summary=document.createElement('summary'),copy=document.createElement('p');summary.textContent='別解のヒント';copy.textContent=hints[index];hint.append(summary,copy);
      const revisit=document.createElement('button');revisit.type='button';revisit.textContent='この面を探し直す';on(revisit,'click',()=>visitFace(id));
      row.append(label,flags,hint,revisit);faces.append(row);rows.set(id,{row,flags,revisit});
    });
    const routes=document.createElement('div');routes.className='outdoor-map-routes';const routeCards=new Map();
    for(const number of [4,5]){
      const card=document.createElement('article');card.className='outdoor-route-card';card.dataset.route=String(number);
      const heading=document.createElement('h4');heading.textContent=number===4?'4 工場・動く系':'5 色物';
      const condition=document.createElement('p');condition.textContent=number===4?'別解を2面以上で、最初の道はこちら。':'別解0〜1面なら、最初の道はこちら。';
      const status=document.createElement('p');status.className='outdoor-route-status';
      const revisit=document.createElement('button');revisit.type='button';revisit.textContent='3章の別解を探し直す';on(revisit,'click',()=>{const progress=getState()?.progress,outdoor=outdoorSnapshot(progress);const id=OUTDOOR_CHAPTER_IDS.find(stage=>!outdoor.altIDs.includes(stage)&&accessibleFace(getState(),stage))??OUTDOOR_CHAPTER_IDS[0];visitFace(id);});
      const detour=document.createElement('button');detour.type='button';detour.textContent='色物への寄り道を開く';detour.className='outdoor-route-detour';on(detour,'click',()=>{if(typeof onRouteVisit==='function'&&onRouteVisit(5)===true)update();});
      const play=document.createElement('button');play.type='button';play.className='outdoor-route-play';play.textContent=number===4?'工場を遊ぶ':'色物を遊ぶ';on(play,'click',()=>visitFace(number===4?FACTORY_CHAPTER_IDS[0]:ECCENTRIC_CHAPTER_IDS[0]));
      card.append(heading,condition,status,play,revisit,detour);routes.append(card);routeCards.set(number,{card,status,play,revisit,detour});
    }
    section.append(title,count,decision,faces,routes);cardHost?.append(section);return {section,count,decision,rows,routeCards};
  }
  on($('game-menu-close'), 'click', () => {
    if (menu) menu.open = false;
    $('game-menu-open')?.setAttribute('aria-expanded', 'false');
    const target = home && !home.hidden ? home : $('scene');
    target?.scrollIntoView({ block: 'start', behavior: 'instant' });
    (home && !home.hidden ? $('chapter-continue') : $('game-menu-open'))?.focus({ preventScroll: true });
  });
  // Painting after the real result opens also covers replay → result returns.
  const resultObserver = new MutationObserver(() => paintResult());
  if ($('chapter-result')) resultObserver.observe($('chapter-result'), { attributes: true, attributeFilter: ['open'] });

  function paintResult() {
    paintLabel($('result-clear-pixel'), 'CLEAR', { scale: 4, color: '#fff8e9' });
    const resultStage = getState()?.result?.stageId, chapter = chapterForStage(resultStage);
    const number = chapter ? STAGES[resultStage].number ?? `${chapter.number}-${chapter.ids.indexOf(resultStage)+1}` : $('chapter-result-title')?.textContent.match(/^\d+-[1-4]/)?.[0];
    if (number) paintLabel($('result-face-pixel'), number, { scale: 4 });
  }

  function update() {
    const state = getState();
    if (!state?.progress) return;
    const fingerprint = JSON.stringify([state.progress, state.stageId, state.busy,
      state.introActive, state.trainingMode, state.result?.stageId, home?.hidden,state.homeChapterNumber,state.previewChapter3,state.previewChapters45]);
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    const { progress } = state;
    const completed = new Set(progress.completedIDs);
    const blocked = Boolean(state.busy || state.introActive);
    const activeChapter = (!home?.hidden&&CHAPTERS.find(chapter=>chapter.number===state.homeChapterNumber)) || chapterForStage(progress.resumeStage) || CHAPTERS[0];
    const menuChapter = chapterForStage(state.stageId) || activeChapter;
    const menuKicker = menu?.querySelector('.menu-heading .chapter-kicker');
    const menuTitle = menu?.querySelector('.menu-heading h2');
    if (menuKicker) menuKicker.textContent = `CHAPTER ${menuChapter.number}`;
    if (menuTitle) menuTitle.textContent = menuChapter.label;
    for (const [index, id] of CHAPTER_IDS.entries()) {
      const unlocked = canChooseStage(progress,id), preview=previewFace(state,id), accessible=unlocked||preview;
      const clear = completed.has(id);
      const current = state.stageId === id;
      const entry = cards.get(id), marker = marks.get(id);
      const status = clear ? 'クリア' : preview ? 'プレビュー練習' : unlocked ? current ? state.trainingMode ? '練習中' : 'プレイ中' : '遊べる' : '未開放';
      const best = progress.stageBestAttempts[id];
      entry.card.disabled = !accessible || blocked;
      entry.card.dataset.state = clear ? 'clear' : preview ? 'preview' : unlocked ? 'available' : 'locked';
      entry.card.classList.toggle('is-current', current);
      if (current) entry.card.setAttribute('aria-current', 'step');
      else entry.card.removeAttribute('aria-current');
      entry.status.textContent = status;
      const outdoor=outdoorSnapshot(progress),isOutdoor=OUTDOOR_CHAPTER_IDS.includes(id);
      entry.record.textContent = clear && Number.isInteger(best) && best > 0 ? `ベスト ${best} 投${isOutdoor?outdoor.altIDs.includes(id)?' · ◆ 別解発見':' · ◇ 別解未発見':''}` : preview ? '本編の記録には入りません' : unlocked ? 'この面を遊ぶ →' : '前の面をクリアして開放';
      entry.card.setAttribute('aria-label', `${entry.number} ${entry.name}、${status}${clear ? `、ベスト ${best} 投` : ''}`);
      marker.mark.hidden = !activeChapter.ids.includes(id);
      marker.mark.dataset.state = clear ? 'clear' : preview ? 'preview' : unlocked ? 'available' : 'locked';
      marker.stateText.textContent = clear ? 'クリア' : preview ? 'プレビュー' : progress.resumeStage === id ? '続き' : unlocked ? '遊べる' : '未開放';
      marker.mark.setAttribute('aria-label', `${marker.number} ${marker.stateText.textContent}`);
    }
    if ($('chapter-top-record')) $('chapter-top-record').textContent = `${activeChapter.number} ${activeChapter.label} ${activeChapter.ids.filter(id=>completed.has(id)).length} / ${activeChapter.ids.length} 面クリア · 全体 ${completed.size} / ${CHAPTER_IDS.length} 面 · 合計 ${progress.cumulativeAttempts} 投、${progress.cumulativeSuccesses} 成功`;
    if ($('chapter-continue')) $('chapter-continue').disabled = blocked;
    const outdoor=outdoorSnapshot(progress);
    routeMap.section.hidden=!accessibleFace(state,OUTDOOR_CHAPTER_IDS[0])&&state.previewChapters45!==true;
    routeMap.count.textContent=`別解 ${outdoor.altCount} / 4 面 · 2面以上で工場の道`;
    routeMap.decision.textContent=outdoor.firstRoute===null?'3-4をクリアしたときの別解数で、最初の道が決まります。':`最初の道：${outdoor.firstRoute===4?'4 工場・動く系':'5 色物'}（別解${outdoor.forkAltCount}面）。見つけた別解と開いた道は、戻っても残ります。`;
    for(const [id,{row,flags,revisit}]of routeMap.rows){const played=outdoor.playedIDs.includes(id),normal=outdoor.normalIDs.includes(id),alt=outdoor.altIDs.includes(id);row.dataset.played=String(played);row.dataset.normal=String(normal);row.dataset.alternative=String(alt);flags.textContent=`${played?'プレイ済み':'未プレイ'} · ${normal?'○ 通常達成':'○ 通常未達'} · ${alt?'◆ 別解発見':'◇ 別解未発見'}`;revisit.disabled=blocked||!accessibleFace(state,id);}
    for(const [number,{card,status,play,revisit,detour}]of routeMap.routeCards){const unlocked=outdoor.unlockedRoutes.includes(number),first=outdoor.firstRoute===number;card.dataset.unlocked=String(unlocked);card.dataset.firstRoute=String(first);status.textContent=`${first?'最初に進む道':unlocked?'開いた寄り道':'まだ開いていない道'}${state.previewChapters45===true&&!unlocked?' · プレビュー練習':''}`;play.disabled=blocked||!accessibleFace(state,number===4?FACTORY_CHAPTER_IDS[0]:ECCENTRIC_CHAPTER_IDS[0]);revisit.disabled=blocked||!accessibleFace(state,OUTDOOR_CHAPTER_IDS[0]);detour.hidden=number!==5||!outdoor.complete||outdoor.firstRoute!==4||unlocked||typeof onRouteVisit!=='function';detour.disabled=blocked;}
    paintResult();
  }
  update();
  return Object.freeze({
    update,
    destroy() { for (const remove of listeners) remove(); resultObserver.disconnect(); },
  });
}
