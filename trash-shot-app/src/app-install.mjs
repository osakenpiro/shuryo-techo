/** Optional install/update controls. No registration outside this module's directory. */
export function createInstallUI({
  isBusy = () => false,
  onBeforeReload = () => {},
  window: view = globalThis.window,
  document: doc = view?.document,
  navigator: nav = view?.navigator,
} = {}) {
  if (!view || !doc || !nav) return {ready: Promise.resolve(null), destroy() {}, get updating() { return false; }};
  const installButton = doc.getElementById('app-install');
  const updateButton = doc.getElementById('app-update');
  const status = doc.getElementById('app-install-status');
  const base = new URL('../', import.meta.url);
  const cleanups = [];
  let registration = null, prompt = null, updating = false, reloading = false, destroyed = false;
  const setStatus = text => { if (status && !destroyed) status.textContent = text; };
  const listen = (target, type, handler) => {
    target?.addEventListener(type, handler);
    cleanups.push(() => target?.removeEventListener(type, handler));
  };
  const standalone = () => !!view.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
  const refresh = () => {
    if (installButton) { installButton.hidden = standalone(); installButton.disabled = updating; }
    if (updateButton) { updateButton.hidden = !registration?.waiting; updateButton.disabled = updating; }
  };
  const install = async () => {
    if (standalone()) return;
    if (!prompt) {
      const apple = /iPhone|iPad|iPod/.test(nav.userAgent ?? '') || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
      setStatus(apple ? 'Safariの共有メニューから「ホーム画面に追加」を選べます。' : 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選べます。');
      return;
    }
    const currentPrompt = prompt;
    prompt = null;
    try {
      await currentPrompt.prompt();
      const choice = await currentPrompt.userChoice;
      setStatus(choice?.outcome === 'accepted' ? 'インストールを受け付けました。' : 'ブラウザのまま遊べます。');
    } catch { setStatus('今回はインストールできませんでした。ブラウザのまま遊べます。'); }
    refresh();
  };
  const update = async () => {
    if (updating || !registration?.waiting) return;
    if (isBusy()) { setStatus('投げ終わってから更新できます。'); return; }
    updating = true;
    refresh();
    try {
      await onBeforeReload();
      if (isBusy()) { updating = false; setStatus('投げ終わってから更新できます。'); refresh(); return; }
      setStatus('更新しています…');
      registration.waiting.postMessage({type: 'TRASHOOT_ACTIVATE_UPDATE', idle: true});
    } catch { updating = false; setStatus('更新できませんでした。もう一度お試しください。'); refresh(); }
  };
  listen(view, 'beforeinstallprompt', event => { event.preventDefault(); prompt = event; refresh(); });
  listen(view, 'appinstalled', () => { prompt = null; setStatus('ホーム画面から遊べます。'); refresh(); });
  listen(installButton, 'click', install);
  listen(updateButton, 'click', update);
  listen(nav.serviceWorker, 'message', event => {
    if (event.data?.type === 'TRASHOOT_UPDATE_BLOCKED') {
      updating = false;
      setStatus('ほかのTRASHOOTタブを閉じてから更新してください。');
      refresh();
    }
  });
  listen(nav.serviceWorker, 'controllerchange', () => {
    if (!updating || reloading) return;
    reloading = true;
    view.location.reload();
  });
  refresh();
  const ready = (async () => {
    if (!view.isSecureContext || !nav.serviceWorker) {
      setStatus('オフライン準備はHTTPSまたはlocalhostで利用できます。');
      return null;
    }
    try {
      registration = await nav.serviceWorker.register(new URL('sw.js', base).href, {scope: base.href, updateViaCache: 'none'});
      if (destroyed) return registration;
      const watch = worker => {
        if (!worker) return;
        listen(worker, 'statechange', () => {
          if (worker.state === 'installed') {
            setStatus(registration.waiting ? '新しい版があります。投げ終わってから更新できます。' : 'オフラインで遊ぶ準備ができました。');
            refresh();
          }
          if (worker.state === 'redundant') setStatus('オフラインの準備が完了しませんでした。接続中はそのまま遊べます。');
        });
      };
      listen(registration, 'updatefound', () => watch(registration.installing));
      watch(registration.installing);
      setStatus(registration.waiting ? '新しい版があります。投げ終わってから更新できます。' : registration.active ? 'オフラインで遊べます。' : 'オフラインで遊ぶ準備をしています…');
      refresh();
      return registration;
    } catch { setStatus('オフラインの準備ができませんでした。接続中はそのまま遊べます。'); return null; }
  })();
  return {ready, get updating() { return updating; }, destroy() { destroyed = true; cleanups.splice(0).forEach(cleanup => cleanup()); }};
}
