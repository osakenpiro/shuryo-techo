// Presentation-only interpretation of actual physics telemetry. No simulation input.
export const SHOT_ROLES = Object.freeze({
  direct: 'ダイレクト',
  'floor-1': '床1バウンド',
  'floor-2': '床2バウンド',
  'floor-3plus': '床3+バウンド',
  'rim-bank': 'ふち当て',
  'side-bank': '側面バンク',
});

const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));

export function createShotAnalytics() {
  let state;
  function clear() {
    state = { status: 'ready', shotId: null, contacts: [], entries: [], exits: [], result: null };
  }
  clear();

  function observe(event) {
    if (!event || typeof event !== 'object') return;
    if (event.type === 'shot-reset') { clear(); return; }
    if (event.type === 'shot-start') {
      clear();
      state.status = 'flying';
      state.shotId = event.shotId;
      return;
    }
    if (state.shotId === null || event.shotId !== state.shotId || state.result) return;
    if (event.type === 'entered') {
      state.status = 'settling';
      state.entries.push({ time: event.time, contactIndex: state.contacts.length });
    } else if (event.type === 'exited') {
      state.status = 'flying';
      state.exits.push({ time: event.time });
    } else if (['floor-impact', 'floor-contact', 'wall-impact'].includes(event.type)) {
      state.contacts.push(copy(event));
    } else if (event.type === 'result') {
      state.status = event.success ? 'success' : 'miss';
      const finalEntry = state.entries.at(-1);
      // Index preserves substep order when entry and contact share a timestamp.
      const beforeEntry = finalEntry ? state.contacts.slice(0, finalEntry.contactIndex) : [];
      const floorBounces = beforeEntry.filter(contact => contact.type === 'floor-impact'
        && contact.region === 'outside').length;
      // A genuine rim/side deflection before the final re-entry contributes even
      // when it happened after an earlier entry. Keep its region in the raw trace.
      const rimHits = beforeEntry.filter(contact => contact.type === 'wall-impact'
        && contact.surface === 'rim').length;
      const sideHits = beforeEntry.filter(contact => contact.type === 'wall-impact'
        && contact.surface === 'side').length;
      const internalContacts = state.contacts.filter(contact => contact.route === 'inside'
        || contact.region === 'inside').length;
      const roles = [];
      if (event.success && finalEntry) {
        if (floorBounces + rimHits + sideHits === 0) roles.push('direct');
        if (floorBounces) roles.push(floorBounces === 1 ? 'floor-1'
          : floorBounces === 2 ? 'floor-2' : 'floor-3plus');
        if (rimHits) roles.push('rim-bank');
        if (sideHits) roles.push('side-bank');
      }
      state.result = {
        success: Boolean(event.success), roles: roles.map(id => ({ id, label: SHOT_ROLES[id] })),
        floorBounces, rimHits, sideHits, internalContacts,
        finalEntryTime: finalEntry?.time ?? null,
      };
    }
  }
  return { observe, snapshot: () => copy(state), clear };
}
