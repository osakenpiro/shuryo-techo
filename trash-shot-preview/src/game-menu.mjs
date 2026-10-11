// Presentation only: the app still owns stage selection, input and records.
export function createGameMenu({ element }) {
  if (!element) return null;
  const tabs = [...element.querySelectorAll('[data-menu-tab]')];
  const panels = new Map([...element.querySelectorAll('[data-menu-panel]')]
    .map(panel => [panel.dataset.menuPanel, panel]));
  if (!tabs.length || tabs.some(tab => !panels.has(tab.dataset.menuTab))) return null;
  const doc = element.ownerDocument;
  let current = '';
  const removers = [];
  function select(id, { focus = false } = {}) {
    const chosen = tabs.find(tab => tab.dataset.menuTab === id);
    if (!chosen) return false;
    // Never strand focus in a panel that is about to become hidden.
    const previous = panels.get(current);
    const moveFocus = focus || (current !== id && previous?.contains(doc.activeElement));
    for (const tab of tabs) {
      const selected = tab === chosen;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = panels.get(tab.dataset.menuTab);
      panel.hidden = !selected;
      panel.inert = !selected;
      if (selected) panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden', 'true');
    }
    current = id;
    if (moveFocus) chosen.focus({ preventScroll: true });
    return true;
  }
  for (const tab of tabs) {
    const click = () => select(tab.dataset.menuTab);
    const keydown = event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[next].dataset.menuTab, { focus: true });
    };
    tab.addEventListener('click', click);
    tab.addEventListener('keydown', keydown);
    removers.push(() => {
      tab.removeEventListener('click', click);
      tab.removeEventListener('keydown', keydown);
    });
  }
  select('stages');
  return {
    select,
    selected: () => current,
    destroy() { for (const remove of removers) remove(); }
  };
}
