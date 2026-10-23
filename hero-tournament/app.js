(() => {
 'use strict';
 const views = new Set(['home','first','play']);
 const roles = new Set(['join','host']);
 let role = 'join';
 function showRole(value) {
  role = roles.has(value) ? value : 'join';
  document.getElementById('join-steps').hidden = role !== 'join';
  document.getElementById('host-steps').hidden = role !== 'host';
  document.querySelectorAll('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
  document.getElementById('play-title').textContent = role === 'host' ? '部屋をつくろう。' : '友だちの部屋へ。';
 }
 function render(focus = false) {
  const requested = location.hash.slice(1), view = views.has(requested) ? requested : 'home';
  document.body.dataset.view = view;
  for (const id of ['first','play']) document.getElementById(id).hidden = view !== id;
  document.querySelectorAll('.entry').forEach(link => { if (link.dataset.view === view) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
  showRole(role);
  if (focus && view !== 'home') document.getElementById(view === 'first' ? 'first-title' : 'play-title').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 }
 document.addEventListener('click', event => {
  if(event.target.closest('.skip')){event.preventDefault();document.getElementById('content').focus();return;}
  const button = event.target.closest('[data-role]');
  if (button) showRole(button.dataset.role);
 });
 window.addEventListener('hashchange', () => render(true));
 render();
})();
