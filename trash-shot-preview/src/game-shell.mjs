// Presentation only. Chapter progress and stage changes stay owned by app.mjs.
import { STAGES } from './stages.mjs?v=20261015-screen-pull-1';
import { CHAPTER_IDS, CHAPTERS, chapterForStage } from './progress-save.mjs?v=20261015-screen-pull-1';
import { drawPixelText, measurePixelText } from './pixel-type.mjs?v=20261015-screen-pull-1';

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

export function createGameShell({ getState, selectStage }) {
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
    card.className = `chapter-stage-card stage-art-${index + 1}${chapter.number===2?' chapter-school-card stage-'+id:''}`;
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
    on(card, 'click', () => {
      // The same app guard decides eligibility and cancels an existing gesture.
      if (selectStage(id) === true) {
        update();
        $('scene')?.scrollIntoView({ block: 'center', behavior: 'instant' });
        $('scene')?.focus({ preventScroll: true });
      }
    });
    const mark = document.createElement('span');
    mark.className = 'home-face-mark';
    const stateText = document.createElement('span');
    stateText.className = 'home-face-state';
    mark.append(numberCanvas(number, 'home-face-number'), stateText);
    progressHost?.append(mark);
    marks.set(id, { mark, stateText, number });
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
      state.introActive, state.trainingMode, state.result?.stageId, home?.hidden,state.homeChapterNumber]);
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
      const unlocked = index === 0 || completed.has(CHAPTER_IDS[index - 1]);
      const clear = completed.has(id);
      const current = state.stageId === id;
      const entry = cards.get(id), marker = marks.get(id);
      const status = clear ? 'クリア' : unlocked ? current ? state.trainingMode ? '練習中' : 'プレイ中' : '遊べる' : '未開放';
      const best = progress.stageBestAttempts[id];
      entry.card.disabled = !unlocked || blocked;
      entry.card.dataset.state = clear ? 'clear' : unlocked ? 'available' : 'locked';
      entry.card.classList.toggle('is-current', current);
      if (current) entry.card.setAttribute('aria-current', 'step');
      else entry.card.removeAttribute('aria-current');
      entry.status.textContent = status;
      entry.record.textContent = clear && Number.isInteger(best) && best > 0 ? `ベスト ${best} 投` : unlocked ? 'この面を遊ぶ →' : '前の面をクリアして開放';
      entry.card.setAttribute('aria-label', `${entry.number} ${entry.name}、${status}${clear ? `、ベスト ${best} 投` : ''}`);
      marker.mark.hidden = !activeChapter.ids.includes(id);
      marker.mark.dataset.state = clear ? 'clear' : unlocked ? 'available' : 'locked';
      marker.stateText.textContent = clear ? 'クリア' : progress.resumeStage === id ? '続き' : unlocked ? '遊べる' : '未開放';
      marker.mark.setAttribute('aria-label', `${marker.number} ${marker.stateText.textContent}`);
    }
    if ($('chapter-top-record')) $('chapter-top-record').textContent = `${activeChapter.number} ${activeChapter.label} ${activeChapter.ids.filter(id=>completed.has(id)).length} / ${activeChapter.ids.length} 面クリア · 全体 ${completed.size} / ${CHAPTER_IDS.length} 面 · 合計 ${progress.cumulativeAttempts} 投、${progress.cumulativeSuccesses} 成功`;
    if ($('chapter-continue')) $('chapter-continue').disabled = blocked;
    paintResult();
  }
  update();
  return Object.freeze({
    update,
    destroy() { for (const remove of listeners) remove(); resultObserver.disconnect(); },
  });
}
