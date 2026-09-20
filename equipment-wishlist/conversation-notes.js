'use strict';
// Conversation evidence is not an accepted equipment order. No storage writes here.
(() => {
  const hunterId = 'serket';
  const video = 'https://www.youtube.com/shorts/JjTsumDkb00';
  const notes = [
    { id: 'serket-cluster-20260920', title: '拡散ヘビィを火力特化に', cat: '武器',
      quote: '拡散ヘビィ火力特化にしようかな', time: '16:12',
      detail: 'ヘビィの火力特化案。武器名・主力弾・装備一式はまだ未確定。原文の「拡散」を、別の弾種に置き換えない。',
      next: 'ヘビィの主力弾と武器を相談する', url: '' },
    { id: 'serket-support-20260920', title: '広域化・満足感でみんなを支える', cat: '防具',
      quote: '広域化･満足感でみんなを笑顔にする', time: '18:12',
      detail: '支援寄りの構成にも関心あり。ヘビィと同じセットに入れるか、別装備で使うかは未確認。装備済み・支援担当の確定ではない。',
      next: '広域化と火力装備の両立・使い分けを相談する', url: video }
  ];
  const list = document.getElementById('request-list');
  const tabs = document.getElementById('hunters');
  if (!list || !tabs) return;
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mount = document.createElement('section');
  mount.id = 'conversation-notes';
  mount.setAttribute('aria-labelledby', 'conversation-notes-title');
  list.before(mount);
  const style = document.createElement('style');
  style.textContent = `#conversation-notes{margin:12px 0 18px;padding:16px 18px;border:1px dashed #92775188;background:#9973400a}#conversation-notes[hidden]{display:none}#conversation-notes h3{font-size:19px;margin:5px 0 9px}#conversation-notes .fieldnote{padding:12px 0;border-top:1px dotted var(--line)}#conversation-notes .fieldnote strong{font:700 16px/1.7 var(--serif);display:block}#conversation-notes blockquote{margin:7px 0;padding-left:10px;border-left:2px solid #92564266;font:13px/1.9 var(--serif)}#conversation-notes p{font-size:11px;color:var(--muted);line-height:1.8}#conversation-notes .fieldnote-actions{display:flex;align-items:center;gap:18px;flex-wrap:wrap}#conversation-notes details{font-size:11px;color:var(--muted);margin-top:7px}#conversation-notes summary{cursor:pointer;min-height:30px}#conversation-notes a{font-size:11px}@media(max-width:760px){#conversation-notes{padding:13px}#conversation-notes .text-button{min-height:40px}#conversation-notes .fieldnote strong{font-size:15px}}`;
  document.head.append(style);
  mount.innerHTML = `<p class="folio">SERKET <span>まだ相談中</span></p><h3 id="conversation-notes-title">余白の検討メモ</h3><p>「作る」と決まる前の、気になっている二つの方向。</p>${notes.map(n => `<article class="fieldnote"><strong>${esc(n.title)}</strong><blockquote>「${esc(n.quote)}」</blockquote><details><summary>発言と未確認のこと</summary><p>${esc(n.detail)}</p><p>共有スクショ内の本人発言より抜粋。画面の時刻 ${esc(n.time)}。記録日 2026/09/20（発言日自体は未確認）。</p>${n.url?'<p>動画全編・字幕は取得できていません。動画内の全スキルや装備を確認した扱いにはしていません。</p>':''}</details><div class="fieldnote-actions"><button class="text-button" type="button" data-note-draft="${n.id}">この案で依頼を書く →</button>${n.url?`<a href="${video}" target="_blank" rel="noopener noreferrer">共有された動画 ↗</a>`:''}</div></article>`).join('')}<p>二つは別の候補。下の作成依頼や今日の段取りには、自動で追加しません。</p>`;
  function refresh() {
    const selected = tabs.querySelector('[aria-pressed="true"]')?.dataset.hunter;
    const exists = [...tabs.querySelectorAll('[data-hunter]')].some(b => b.dataset.hunter === hunterId);
    mount.hidden = !exists || (selected !== hunterId && selected !== 'all') || document.getElementById('show-done')?.checked === true;
    if (!mount.hidden && selected === hunterId && !list.querySelector('.request')) {
      const empty = list.querySelector('.empty-state');
      if (empty && !document.getElementById('search')?.value) {
        empty.querySelector('strong').textContent = '依頼は、これから。';
        empty.querySelector('p').textContent = '気になる案が決まったら、上のメモから書き起こそう。';
      }
    }
  }
  mount.addEventListener('click', event => {
    const button = event.target.closest('[data-note-draft]');
    const note = button && notes.find(n => n.id === button.dataset.noteDraft);
    if (!note) return;
    // Use the existing editable form: canceling leaves requests/stock/plan unchanged.
    document.getElementById('new-request')?.click();
    const form = document.getElementById('request-form');
    if (!form) return;
    const fields = form.elements;
    if (![...fields.namedItem('hunter').options].some(o => o.value === hunterId)) return;
    fields.namedItem('hunter').value = hunterId;
    fields.namedItem('preset').value = '';
    fields.namedItem('preset').dispatchEvent(new Event('change', {bubbles: true}));
    fields.namedItem('title').value = note.title;
    fields.namedItem('cat').value = note.cat;
    fields.namedItem('target').value = note.next;
    fields.namedItem('url').value = note.url;
    fields.namedItem('memo').value = '【検討中】' + note.detail + '\n本人の発言（スクショ抜粋）：「' + note.quote + '」／2026/09/20記録。';
    fields.namedItem('title').focus();
  });
  new MutationObserver(refresh).observe(tabs, {childList: true});
  refresh();
})();
