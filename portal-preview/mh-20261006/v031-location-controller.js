
(() => {
  const model = window.MH_PORTAL_MODEL_V01;
  const shell = document.querySelector('.guild-route-shell');
  const links = [...document.querySelectorAll('[data-route-id]')];
  if (model && model.routes) {
    for (const link of links) {
      const route = model.routes[link.dataset.routeId];
      if (route && route.target) link.setAttribute('href', route.target);
    }
  }

  const locations = ['home','packages','current','future','memory']
    .map(id => ({ id, el: document.getElementById(id) }))
    .filter(x => x.el);

  let tick = false;
  const validLocations = new Set(locations.map(x => x.id));

  function paintLocation(current) {
    shell.dataset.location = current;
    for (const node of document.querySelectorAll('.route-node[data-location-id]')) {
      const active = node.dataset.locationId === current;
      node.classList.toggle('is-current', active);
      if (active) node.setAttribute('aria-current','location');
      else node.removeAttribute('aria-current');
    }
    if (innerWidth <= 900) {
      const rail = shell.querySelector('.route-rail');
      const active = rail?.querySelector('.route-node.is-current');
      if (rail && active) {
        const railBox = rail.getBoundingClientRect();
        const activeBox = active.getBoundingClientRect();
        rail.scrollTo({left: rail.scrollLeft + activeBox.left - railBox.left
          - (rail.clientWidth - activeBox.width) / 2, behavior:'auto'});
      }
    }
  }

  function renderLocation() {
    tick = false;
    if(innerWidth>=1100 && scrollY<24 && (!location.hash||location.hash==='#home')){paintLocation('home');return;}
    const probe = scrollY + Math.min(innerHeight * .34, 260);
    let current = locations[0]?.id || 'home';
    for (const loc of locations) {
      const top = loc.el.getBoundingClientRect().top + scrollY;
      if (top <= probe) current = loc.id;
    }
    paintLocation(current);
  }

  function renderHashLocation() {
    const id = decodeURIComponent(location.hash.replace(/^#/,''));
    if (validLocations.has(id)) paintLocation(id);
    else renderLocation();
  }

  function schedule() {
    if (!tick) {
      tick = true;
      requestAnimationFrame(renderLocation);
    }
  }

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('hashchange',() => {
    renderHashLocation();
    setTimeout(renderHashLocation,220);
  });
  addEventListener('load',() => {
    renderHashLocation();
    if (location.hash) setTimeout(renderHashLocation,260);
    else setTimeout(schedule,180);
  },{once:true});
  renderHashLocation();
})();
