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
  const reset = async v => { cleanupUI(); try { go(v); } catch (e) {} await sleep(45); };
  const sweep = async (v, pass) => {
    try { go(v); } catch (e) { note(v, 'NAV', 'FAIL', e); return; }
    await sleep(60);
    const acts = [...new Set([...document.querySelectorAll('[data-act]')].map(b => b.dataset.act))];
    for (const act of acts) {
      if (SKIP.has(act)) continue;
      const before = errs.length;
      try {
        const btn = document.querySelector(`[data-act="${act}"]`);
        if (!btn) continue;
        btn.click(); await sleep(45);
        // sweep modal-root buttons too (submit/openers chain), skipping inputs we did not fill
        const mActs = [...new Set([...document.querySelectorAll('#modal-root [data-act]')].map(b => b.dataset.act))];
        for (const ma of mActs) {
          if (SKIP.has(ma) || ma.startsWith('submit-')) continue;
          const mb = document.querySelector(`#modal-root [data-act="${ma}"]`);
          const b2 = errs.length;
          try { if (mb) { mb.click(); await sleep(30); } } catch (e) { errs.push(ma + ':' + String(e)); }
          if (errs.length > b2) note(v + '(modal)', ma, 'ERR', errs[errs.length - 1]);
          cleanupUI(); await sleep(20);
        }
      } catch (e) { errs.push(act + ':' + String(e)); }
      if (errs.length > before) note(v, act, 'ERR', errs[errs.length - 1]);
      await reset(v);
    }
    note(v, 'pass' + pass, 'OK', acts.join(',') || 'no buttons');
  };

  /* ── login as admin ── */
  authTab = 'staff'; state.screen = 'auth'; renderApp(); await sleep(80);
  const un = document.querySelector('#lg-user'), pw = document.querySelector('#lg-pass');
  if (un && pw) { un.value = 'ADMINISTRATOR'; pw.value = 'Anshif@29'; }
  document.querySelector('form[data-form=login]').requestSubmit(); await sleep(120);
  if (!me()) return { fatal: 'login failed', report };

  /* ── seed real content through handlers ── */
  go('feed'); await sleep(60);
  const pt = document.querySelector('#post-text');
  if (pt) { pt.value = 'Test post from click-sweep'; submitPost(); await sleep(80); }
  go('status'); await sleep(60);
  const st = document.querySelector('#st-text');
  if (st) { st.value = 'Test story'; submitStatus(); await sleep(80); }
  openAwardModal(); await sleep(40);
  document.querySelector('#aw-title').value = 'Sweep award';
  document.querySelector('#aw-desc').value = 'testing';
  submitAward(); await sleep(80);
  openNoticeModal(); await sleep(40);
  document.querySelector('#nt-title').value = 'Sweep notice';
  document.querySelector('#nt-body').value = 'testing notices';
  submitNotice(); await sleep(80);

  /* comment + chat flows */
  go('feed'); await sleep(60);
  const cf = document.querySelector('form[data-form=comment]');
  if (cf) { cf.querySelector('[data-role=c-input]').value = 'nice!'; cf.requestSubmit(); await sleep(60); }
  go('chats'); await sleep(60);
  state.chatWith = me().id; renderApp(); await sleep(70);
  const chatForm = document.querySelector('form[data-form=chat-send]');
  if (chatForm) { document.querySelector('#chat-text').value = 'hello me'; chatForm.requestSubmit(); await sleep(60); }

  /* settings: change-pass with wrong current (must NOT crash / must NOT change) */
  go('settings'); await sleep(60);
  const c1 = document.querySelector('#cp-1'), c2 = document.querySelector('#cp-2');
  if (c1 && c2) { c1.value = 'wrongpass'; c2.value = 'newpass99'; document.querySelector('form[data-form=change-pass]').requestSubmit(); await sleep(80); }

  /* ── main sweep, 2 passes ── */
  const views = ['dashboard', 'feed', 'status', 'chats', 'awards', 'board', 'members', 'vault', 'academic', 'notices', 'settings', 'profile'];
  for (let p = 1; p <= 2; p++) for (const v of views) await sweep(v, p);

  /* profile edit flow: edit-own then save-profile */
  go('profile'); await sleep(60);
  try { const eb = document.querySelector('[data-act=edit-own]'); if (eb) { eb.click(); await sleep(50); } } catch (e) { note('profile', 'edit-own', 'ERR', e); }
  try { const sp = document.querySelector('[data-act=save-profile]'); if (sp) { const n = document.querySelector('#ep-name'); if (n) n.value = 'Administrator'; sp.click(); await sleep(60); } } catch (e) { note('profile', 'save-profile', 'ERR', e); }

  /* story viewer flow */
  go('status'); await sleep(60);
  try {
    const vb = document.querySelector('[data-act=view-story]');
    if (vb) { vb.click(); await sleep(80); note('story', 'view-story', 'OK', document.querySelector('#viewer-root').innerHTML.length + ' chars'); }
    for (const act of ['story-nav', 'send-story-reply', 'del-story-view']) {
      const before = errs.length;
      try {
        const inp = document.querySelector('#story-reply');
        if (act === 'send-story-reply' && inp) { inp.value = 'reply!'; const f = inp.closest('form'); if (f) { f.requestSubmit(); await sleep(60); continue; } }
        const b = document.querySelector(`[data-act="${act}"]`);
        if (b) { b.click(); await sleep(60); }
      } catch (e) { errs.push(act + ':' + String(e)); }
      if (errs.length > before) note('story', act, 'ERR', errs[errs.length - 1]);
    }
    cleanupUI();
  } catch (e) { note('story', 'flow', 'FAIL', e); }

  /* destructive confirm path on seeded post (DB is test-only) */
  go('feed'); await sleep(60);
  try {
    const db = document.querySelector('[data-act=del-post]');
    if (db) { db.click(); await sleep(50); const y = document.querySelector('#modal-root [data-yes]'); if (y) { y.click(); await sleep(60); } }
  } catch (e) { note('feed', 'del-post', 'ERR', e); }

  /* award moderation */
  go('awards'); await sleep(60);
  try {
    const ap = document.querySelector('[data-act=approve-award]');
    if (ap) { ap.click(); await sleep(60); }
  } catch (e) { note('awards', 'approve-award', 'ERR', e); }

  /* landing buttons */
  state.screen = 'landing'; renderApp(); await sleep(60);
  for (const act of ['scroll-feats', 'theme', 'go-auth']) {
    const before = errs.length;
    try { const b = document.querySelector(`[data-act="${act}"]`); if (b) { b.click(); await sleep(50); } } catch (e) { errs.push(act + ':' + String(e)); }
    if (errs.length > before) note('landing', act, 'ERR', errs[errs.length - 1]);
  }

  /* signout */
  state.screen = 'app'; renderApp(); await sleep(50);
  try {
    const so = document.querySelector('[data-act=signout]');
    if (so) { so.click(); await sleep(80); note('signout', 'signout', me() ? 'FAIL still-logged-in' : 'OK', ''); }
  } catch (e) { note('signout', 'signout', 'ERR', e); }

  return { errs: errs.slice(0, 30), report };
})()
