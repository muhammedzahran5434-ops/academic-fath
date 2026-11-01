(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const errs = [];
  const report = [];
  const note = (view, act, st, msg) => report.push({ view, act, st, msg: String(msg || '').slice(0, 140) });
  window.addEventListener('error', e => errs.push('win:' + String(e.message || e)));
  window.addEventListener('unhandledrejection', e => errs.push('rej:' + String((e.reason && e.reason.message) || e.reason)));
  const SKIP = new Set(['signout', 'st-attach', 'chat-attach', 'aw-attach', 'attach-post', 'change-photo', 'st-bg', 'noop']);
  const cleanupUI = () => {
    try { if (document.querySelector('#modal-root').innerHTML) closeModal(); } catch (e) {}
    try { if (document.querySelector('#viewer-root').innerHTML) closeViewer(); } catch (e) {}
  };
  const reset = async v => { cleanupUI(); try { go(v); } catch (e) {} await sleep(40); };
  const sweep = async (v) => {
    try { go(v); } catch (e) { note(v, 'NAV', 'FAIL', e); return; }
    await sleep(55);
    const acts = [...new Set([...document.querySelectorAll('[data-act]')].map(b => b.dataset.act))];
    for (const act of acts) {
      if (SKIP.has(act)) continue;
      const before = errs.length;
      try {
        const btn = document.querySelector(`[data-act="${act}"]`);
        if (!btn) continue;
        btn.click(); await sleep(40);
        const mActs = [...new Set([...document.querySelectorAll('#modal-root [data-act]')].map(b => b.dataset.act))];
        for (const ma of mActs) {
          if (SKIP.has(ma) || ma.startsWith('submit-')) continue;
          const b2 = errs.length;
          try { const mb = document.querySelector(`#modal-root [data-act="${ma}"]`); if (mb) { mb.click(); await sleep(30); } } catch (e) { errs.push(ma + ':' + String(e)); }
          if (errs.length > b2) note(v + '(modal)', ma, 'ERR', errs[errs.length - 1]);
          cleanupUI(); await sleep(20);
        }
      } catch (e) { errs.push(act + ':' + String(e)); }
      if (errs.length > before) note(v, act, 'ERR', errs[errs.length - 1]);
      await reset(v);
    }
    note(v, 'acts', 'OK', acts.join(','));
  };

  /* login as member 816 */
  authTab = 'member'; state.screen = 'auth'; renderApp(); await sleep(70);
  const un = document.querySelector('#lg-user'), pw = document.querySelector('#lg-pass');
  un.value = '816'; pw.value = '816@fath';
  document.querySelector('form[data-form=login]').requestSubmit(); await sleep(150);
  if (!me()) return { fatal: 'member login failed', authErr: (document.querySelector('#auth-err') || {}).innerHTML, report };

  /* seed story + post as member */
  go('feed'); await sleep(50);
  const pt = document.querySelector('#post-text');
  if (pt) { pt.value = 'Member post'; submitPost(); await sleep(70); }
  go('status'); await sleep(50);
  const st = document.querySelector('#st-text');
  if (st) { st.value = 'Member story'; submitStatus(); await sleep(70); }

  /* member sweep */
  for (const v of ['dashboard', 'feed', 'status', 'chats', 'awards', 'board', 'members', 'settings', 'profile']) await sweep(v);

  /* story viewer flow as member */
  go('status'); await sleep(50);
  try {
    const vb = document.querySelector('[data-act=view-story]');
    if (vb) { vb.click(); await sleep(90); note('story', 'view-story', 'OK', 'viewer ' + document.querySelector('#viewer-root').innerHTML.length + ' chars'); }
    const nb = document.querySelector('[data-act=story-nav]');
    let before = errs.length;
    if (nb) { nb.click(); await sleep(60); }
    if (errs.length > before) note('story', 'story-nav', 'ERR', errs[errs.length - 1]);
    const inp = document.querySelector('#story-reply');
    before = errs.length;
    if (inp) { inp.value = 'story reply test'; const f = inp.closest('form'); if (f) { f.requestSubmit(); await sleep(70); } }
    if (errs.length > before) note('story', 'send-story-reply', 'ERR', errs[errs.length - 1]); else if (inp) note('story', 'send-story-reply', 'OK', '');
    cleanupUI();
  } catch (e) { note('story', 'flow', 'FAIL', e); }

  /* signout via menu popover */
  try {
    go('dashboard'); await sleep(40);
    const mb = document.querySelector('[data-act=menu]');
    if (mb) { mb.click(); await sleep(50); }
    const so = document.querySelector('[data-act=signout]');
    if (so) { so.click(); await sleep(90); note('signout', 'signout', me() ? 'FAIL still-logged-in' : 'OK', 'screen=' + state.screen); }
    else note('signout', 'signout', 'FAIL', 'button not found even with menu open');
  } catch (e) { note('signout', 'signout', 'ERR', e); }

  /* auth screen buttons: tabs + eye toggle */
  await sleep(50);
  try {
    const tabs = [...document.querySelectorAll('[data-act=auth-tab]')];
    for (const t of tabs) { t.click(); await sleep(40); }
    note('auth', 'auth-tab', 'OK', tabs.length + ' tabs cycled, authTab=' + authTab);
    const eye = document.querySelector('[data-act=toggle-pass]');
    if (eye) { eye.click(); await sleep(30); note('auth', 'toggle-pass', 'OK', document.querySelector('#lg-pass').type); eye.click(); }
    else note('auth', 'toggle-pass', 'FAIL', 'no eye button');
  } catch (e) { note('auth', 'buttons', 'ERR', e); }

  return { errs: errs.slice(0, 30), who: me() ? me().username : 'signed-out', report };
})()
