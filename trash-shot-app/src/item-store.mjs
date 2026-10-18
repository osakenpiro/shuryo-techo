// Read-only presentation of the app-owned wallet, inventory and equipment.
export function createStoreUI({ document: doc, getState, onBuy, onEquip, catalog }) {
  if (!doc || typeof getState !== 'function' || typeof onBuy !== 'function' || typeof onEquip !== 'function' || !Array.isArray(catalog)) {
    throw new TypeError('The item store needs an app-owned catalog and callbacks');
  }
  const $ = id => doc.getElementById(id);
  const dialog = $('store-dialog'), entries = new Map();
  const listeners = [];
  let pending = false, lastFingerprint = '', returnFocus = null;
  const on = (node, type, callback) => {
    node?.addEventListener(type, callback);
    listeners.push(() => node?.removeEventListener(type, callback));
  };
  const normalized = catalog.filter(item => item && typeof item.id === 'string');
  const pretty = value => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('ja-JP') : '—';
  const shapeFor = item => item.shape || ({ can: 'can', paper: 'paper', 'rubber-ball': 'ball', 'heavy-ball': 'heavy', carton: 'carton' }[item.id] || 'can');
  const stageClearItem = item => item.acquisition === 'stage-clear';
  const faceNumber = item => ({'outdoor-shrine':'3-1','outdoor-baseball':'3-2','outdoor-mall':'3-3','outdoor-river':'3-4','eccentric-boar':'5-3','eccentric-basket':'5-4','eccentric-dandelion':'5-5','eccentric-card':'5-6','eccentric-cannon':'5-7'}[item.stageId] || 'その面');
  for (const item of normalized) {
    const card = doc.createElement('article');
    card.className = 'store-item';
    card.dataset.itemId = item.id;
    card.dataset.acquisition = stageClearItem(item) ? 'stage-clear' : 'purchase';
    const icon = doc.createElement('span');
    icon.className = `store-object store-object-${shapeFor(item)}`;
    icon.setAttribute('aria-hidden', 'true');
    if (typeof item.color === 'string' && /^#[a-f\d]{3,8}$/i.test(item.color)) icon.style.setProperty('--object-color', item.color);
    const information = doc.createElement('div');
    information.className = 'store-item-info';
    const heading = doc.createElement('div');
    heading.className = 'store-item-heading';
    const title = doc.createElement('h3');
    title.textContent = item.label;
    const owned = doc.createElement('span');
    owned.className = 'store-owned';
    heading.append(title, owned);
    const traits = doc.createElement('ul');
    traits.className = 'store-traits';
    for (const trait of Array.isArray(item.traits) ? item.traits : []) {
      const row = doc.createElement('li');
      row.textContent = String(trait);
      traits.append(row);
    }
    const action = doc.createElement('button');
    action.type = 'button';
    action.className = 'store-item-action';
    const price = doc.createElement('p');
    price.className = 'store-item-price';
    information.append(heading, traits, price, action);
    card.append(icon, information);
    $('store-items')?.append(card);
    entries.set(item.id, { item, card, owned, action, price });
    on(action, 'click', async () => {
      const state = getState();
      if (pending || state.busy || state.canOpen === false) return;
      const isOwned = (state.ownedIds || []).includes(item.id);
      if (stageClearItem(item) && !isOwned) return;
      if (state.equippedId === item.id || (!isOwned && state.coins < item.price)) return;
      pending = true;
      update();
      try {
        const result = await (isOwned ? onEquip(item.id) : onBuy(item.id));
        const ok = result === true || result?.ok === true;
        $('store-status').textContent = result?.message || (ok ? isOwned ? `${item.label}に持ち替えました。` : `${item.label}が道具箱に増えました。` : '今はこの操作ができません。');
      } catch {
        $('store-status').textContent = 'この操作を完了できませんでした。記録を確認して、もう一度試せます。';
      } finally {
        pending = false;
        update();
      }
    });
  }
  const preview = doc.createElement('article');
  preview.className = 'store-coming-soon';
  const previewMark = doc.createElement('span');
  previewMark.className = 'store-coming-mark';
  previewMark.setAttribute('aria-hidden', 'true');
  previewMark.textContent = '＋';
  const previewInformation = doc.createElement('div');
  const previewTitle = doc.createElement('h3');
  previewTitle.textContent = 'AND MORE…';
  const previewCopy = doc.createElement('p');
  previewCopy.textContent = '投げるものは、これからも増えていく。';
  previewInformation.append(previewTitle, previewCopy);
  preview.append(previewMark, previewInformation);
  $('store-items')?.append(preview);
  on($('store-close'), 'click', close);
  on(dialog, 'cancel', event => { event.preventDefault(); close(); });
  on(dialog, 'close', () => {
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  });

  function update() {
    const state = getState();
    if (!state) return;
    const ownedIds = Array.isArray(state.ownedIds) ? state.ownedIds : [];
    const achievements = Array.isArray(state.achievements) ? state.achievements : [];
    const fingerprint = JSON.stringify([state.coins, ownedIds, state.equippedId,
      state.busy, state.canOpen, pending, achievements]);
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    $('store-wallet').textContent = pretty(state.coins);
    const equipped = entries.get(state.equippedId)?.item;
    if ($('home-equipped-item')) $('home-equipped-item').textContent = equipped ? `いまの投げるもの：${equipped.label}` : '';
    const blocked = pending || Boolean(state.busy) || state.canOpen === false;
    for (const { item, card, owned, action, price } of entries.values()) {
      const isOwned = ownedIds.includes(item.id), current = state.equippedId === item.id;
      const stageReward = stageClearItem(item);
      const affordable = Number.isSafeInteger(state.coins) && state.coins >= item.price;
      card.dataset.owned = String(isOwned);
      card.dataset.equipped = String(current);
      owned.textContent = current ? '使用中' : isOwned ? '持っている' : '';
      owned.hidden = !isOwned && !current;
      price.textContent = isOwned ? stageReward ? 'ステージで手に入れた道具' : '道具箱に入っています' : stageReward ? `${faceNumber(item)}をクリアすると手に入る` : item.price === 0 ? '最初の道具' : `${pretty(item.price)} コイン`;
      action.textContent = current ? '使用中' : isOwned ? stageReward ? '持ち替える' : 'これで投げる' : stageReward ? 'ステージで見つけよう' : affordable ? item.price === 0 ? '受け取る' : 'コインで交換' : `あと ${pretty(item.price - state.coins)} コイン`;
      action.disabled = blocked || current || (!isOwned && (stageReward || !affordable));
      action.setAttribute('aria-label', `${item.label}、${action.textContent}`);
    }
    const earned = $('store-achievements');
    if (earned) {
      const labels = achievements.filter(item => item && typeof item.label === 'string');
      earned.replaceChildren(...labels.map(item => {
        const chip = doc.createElement('li');
        chip.className = 'earned-achievement';
        chip.textContent = item.label;
        if (typeof item.id === 'string') chip.dataset.achievementId = item.id;
        return chip;
      }));
      $('store-achievements-empty').hidden = labels.length > 0;
    }
  }
  function open() {
    const state = getState();
    if (!dialog || dialog.open || pending || state?.busy || state?.canOpen === false) return false;
    returnFocus = doc.activeElement;
    $('store-status').textContent = '';
    update();
    dialog.showModal();
    $('store-close')?.focus({ preventScroll: true });
    return true;
  }
  function close() { if (dialog?.open) dialog.close(); }
  update();
  return Object.freeze({
    open, close, update,
    destroy() { close(); for (const remove of listeners) remove(); },
  });
}
