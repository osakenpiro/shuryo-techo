(() => {
 'use strict';
 const views = new Set(['home','first','play','tutorial','solo']);
 const roles = new Set(['join','host']);
 let role = 'join';
 function showRole(value) {
  role = roles.has(value) ? value : 'join';
  document.getElementById('join-steps').hidden = role !== 'join';
  document.getElementById('host-steps').hidden = role !== 'host';
  document.querySelectorAll('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
  document.getElementById('play-title').textContent = role === 'host' ? '部屋をつくって、一試合。' : '友だちの部屋から、一試合。';
 }
 function render(focus = false) {
  const requested = location.hash.slice(1), view = roles.has(requested) ? 'play' : views.has(requested) ? requested : 'home';
  if (roles.has(requested)) role = requested;
  else if (requested === 'play') role = 'join';
  document.body.dataset.view = view;
  for (const id of ['first','play','tutorial','solo']) document.getElementById(id).hidden = view !== id;
  document.querySelectorAll('.entry').forEach(link => { if (link.dataset.view === view) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
  showRole(role);
  if (focus && view !== 'home') document.getElementById(view + '-title').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 }
 document.addEventListener('click', event => {
  if(event.target.closest('.skip')){event.preventDefault();document.getElementById('content').focus();return;}
  const button = event.target.closest('[data-role]');
  if (button) {
   if (location.hash === '#' + button.dataset.role) showRole(button.dataset.role);
   else location.hash = button.dataset.role;
  }
 });
 window.addEventListener('hashchange', () => render(true));
 render();
})();
