// Short presentation effects only: scoring and eligibility belong to the app.
export function createRewardEffects({ document: doc, reducedMotion }) {
  if (!doc) throw new TypeError('Reward effects need a document');
  const $ = id => doc.getElementById(id);
  const result = $('chapter-result'), inner = result?.querySelector('.result-inner');
  const layer = doc.createElement('div');
  layer.className = 'reward-particles';
  layer.setAttribute('aria-hidden', 'true');
  inner?.append(layer);
  const view = doc.defaultView;
  const prefersReduced = typeof reducedMotion === 'function' ? reducedMotion : () => Boolean(view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  let cleanupTimer = null;

  function clearParticles() {
    if (cleanupTimer !== null) view?.clearTimeout(cleanupTimer);
    cleanupTimer = null;
    layer.replaceChildren();
  }
  function clear() {
    clearParticles();
    const host = $('chapter-reward-bonuses');
    host?.replaceChildren();
    if (host) host.hidden = true;
    result?.classList.remove('reward-hole', 'reward-tricky');
  }
  function celebrate({ holeInOne = false, tricky = false, points = 0 } = {}) {
    clear();
    const firstShot = holeInOne === true;
    const hasTrick = Array.isArray(tricky) ? tricky.length > 0 : tricky === true;
    const host = $('chapter-reward-bonuses');
    if (!host) return;
    if (firstShot) {
      const badge = doc.createElement('span');
      badge.className = 'reward-hole-badge';
      const title = doc.createElement('strong');
      title.textContent = 'HOLE IN ONE';
      const caption = doc.createElement('span');
      caption.textContent = '一投で成功！';
      badge.append(title, caption);
      host.append(badge);
      result?.classList.add('reward-hole');
    }
    if (hasTrick) {
      const badge = doc.createElement('span');
      badge.className = 'reward-tricky-badge';
      badge.textContent = 'TRICKY SHOT';
      badge.setAttribute('aria-label', 'トリッキーショット');
      host.append(badge);
      result?.classList.add('reward-tricky');
    }
    host.hidden = !host.childElementCount;
    if ((!firstShot && !hasTrick) || prefersReduced()) return;
    // Bounded, deterministic decorative particles never affect shot randomness.
    const count = firstShot && hasTrick ? 28 : 20;
    for (let i = 0; i < count; i++) {
      const particle = doc.createElement('span');
      particle.className = `reward-particle ${i % 3 === 0 ? 'reward-spark' : ''}`;
      const angle = Math.PI * 2 * i / count, distance = 75 + i % 5 * 19;
      particle.style.setProperty('--reward-x', `${Math.round(Math.cos(angle) * distance)}px`);
      particle.style.setProperty('--reward-y', `${Math.round(Math.sin(angle) * distance - 35)}px`);
      particle.style.setProperty('--reward-rotation', `${(i * 71 + Math.max(0, Math.min(10000, Number(points) || 0))) % 360}deg`);
      particle.style.setProperty('--reward-delay', `${i % 4 * 45}ms`);
      particle.style.setProperty('--reward-color', i % 2 ? '#8bc8b8' : '#f6c253');
      layer.append(particle);
    }
    cleanupTimer = view?.setTimeout(() => { layer.replaceChildren(); cleanupTimer = null; }, 1600) ?? null;
  }
  // Preserve the actual badges across replay → result, while stopping animation.
  const close = () => clearParticles();
  result?.addEventListener('close', close);
  return Object.freeze({
    celebrate, clear,
    destroy() { clear(); result?.removeEventListener('close', close); layer.remove(); },
  });
}
