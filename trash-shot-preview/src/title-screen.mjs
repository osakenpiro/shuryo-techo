// Presentation only. The app owns unlocks, saves, results and all stage changes.
export function createTitleScreen({ element, onContinue, onStageSelect, onInvite }) {
  if (!element?.ownerDocument || typeof onContinue !== 'function' ||
      typeof onStageSelect !== 'function' || typeof onInvite !== 'function') {
    throw new TypeError('The title screen needs its element and app-owned actions');
  }
  const doc = element.ownerDocument;
  const find = id => element.querySelector(`#${id}`);
  const continueButton = find('title-continue');
  const continueLabel = find('title-continue-label');
  const stageSelectButton = find('title-stage-select');
  const inviteButton = find('title-invite');
  const record = find('title-record');
  const stage = find('title-stage');
  if (![continueButton, continueLabel, stageSelectButton, inviteButton, record, stage].every(Boolean)) {
    throw new TypeError('The title screen markup is incomplete');
  }
  let open = false, returnFocus = null, siblingState = [], bodyWasOpen = false;
  const onContinueClick = () => { if (open) onContinue(); };
  const onStageSelectClick = () => { if (open) onStageSelect(); };
  const onInviteClick = () => { if (open) onInvite(); };
  continueButton.addEventListener('click', onContinueClick);
  stageSelectButton.addEventListener('click', onStageSelectClick);
  inviteButton.addEventListener('click', onInviteClick);

  const onKeyDown = event => {
    if (!open || event.key !== 'Tab' || !element.contains(event.target)) return;
    const choices = [continueButton, stageSelectButton, inviteButton].filter(node => !node.disabled && !node.hidden);
    if (!choices.length) { event.preventDefault(); element.focus({ preventScroll: true }); return; }
    const first = choices[0], last = choices.at(-1);
    if (event.shiftKey && (doc.activeElement === first || doc.activeElement === element)) {
      event.preventDefault(); last.focus({ preventScroll: true });
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault(); first.focus({ preventScroll: true });
    }
  };
  element.addEventListener('keydown', onKeyDown);

  function update({ continueLabel: label = '続きから', chapterComplete = false,
    recordText = '', stageLabel = '' } = {}) {
    continueLabel.textContent = String(label);
    record.textContent = String(recordText);
    record.hidden = !recordText;
    stage.textContent = String(stageLabel);
    stage.hidden = !stageLabel;
    element.dataset.chapterComplete = String(Boolean(chapterComplete));
  }

  function show(state = {}) {
    update(state);
    if (open) return;
    returnFocus = doc.activeElement;
    bodyWasOpen = doc.body.classList.contains('title-is-open');
    // Existing dialogs can be opened by the title's invite action. Making those
    // explicitly inert would also disable them after showModal().
    siblingState = [...(element.parentElement?.children || [])]
      .filter(node => node !== element && node.tagName !== 'DIALOG')
      .map(node => ({ node, inert: node.inert, ariaHidden: node.getAttribute('aria-hidden') }));
    for (const { node } of siblingState) { node.inert = true; node.setAttribute('aria-hidden', 'true'); }
    element.inert = false;
    element.hidden = false;
    element.setAttribute('aria-hidden', 'false');
    doc.body.classList.add('title-is-open');
    open = true;
    continueButton.focus({ preventScroll: true });
  }

  function hide() {
    if (!open) return;
    element.hidden = true;
    element.inert = true;
    element.setAttribute('aria-hidden', 'true');
    for (const { node, inert, ariaHidden } of siblingState) {
      node.inert = inert;
      if (ariaHidden === null) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden', ariaHidden);
    }
    siblingState = [];
    if (!bodyWasOpen) doc.body.classList.remove('title-is-open');
    open = false;
    if (returnFocus?.isConnected && !returnFocus.closest('[hidden], [inert]')) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  return Object.freeze({ show, update, hide, isOpen: () => open,
    destroy() {
      hide();
      continueButton.removeEventListener('click', onContinueClick);
      stageSelectButton.removeEventListener('click', onStageSelectClick);
      inviteButton.removeEventListener('click', onInviteClick);
      element.removeEventListener('keydown', onKeyDown);
    }
  });
}
