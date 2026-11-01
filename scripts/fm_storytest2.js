(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { before: DB.messages.length, stories: DB.stories.length };
  go('status'); await sleep(70);

  /* 1. open someone else's story -> reply via send button */
  const rings = [...document.querySelectorAll('[data-act=view-story]')];
  out.rings = rings.length;
  for (const r of rings) {
    r.click(); await sleep(130);
    const b = document.querySelector('#viewer-root .vtop b');
    if (b && b.textContent !== '816') break;
    closeViewer(); await sleep(60);
  }
  const inp = document.querySelector('#story-reply');
  out.replyBox = !!inp;
  if (inp) {
    inp.value = 'hello from test!';
    document.querySelector('#viewer-root [data-act=send-story-reply]').click();
    await sleep(130);
    out.msgCreated = DB.messages.length > out.before;
    out.viewerClosedByReply = !document.querySelector('#viewer-root').innerHTML;
  }

  /* 2. reopen -> nav next/prev */
  go('status'); await sleep(70);
  const r2 = document.querySelector('[data-act=view-story]');
  r2.click(); await sleep(130);
  const next = document.querySelector('[data-act=story-nav][data-d="1"]');
  const prev = document.querySelector('[data-act=story-nav][data-d="-1"]');
  out.navButtons = { next: !!next, prev: !!prev };
  if (next) {
    const i0 = state.storyIdx;
    next.click(); await sleep(100);
    out.navNextWorks = state.storyIdx === i0 + 1;
    const p2 = document.querySelector('[data-act=story-nav][data-d="-1"]');
    if (p2) { p2.click(); await sleep(100); out.navPrevWorks = state.storyIdx === i0; }
  }

  /* 3. close via X button */
  const xb = document.querySelector('#viewer-root [data-act=close-viewer]');
  out.xFound = !!xb;
  if (xb) { xb.click(); await sleep(110); out.xCloses = !document.querySelector('#viewer-root').innerHTML; }

  /* 4. own story -> delete via trash + confirm */
  go('status'); await sleep(70);
  const rings3 = [...document.querySelectorAll('[data-act=view-story]')];
  for (const r of rings3) {
    r.click(); await sleep(130);
    const b = document.querySelector('#viewer-root .vtop b');
    if (b && b.textContent === '816') {
      const del = document.querySelector('#viewer-root [data-act=del-story-view]');
      out.delFound = !!del;
      if (del) {
        del.click(); await sleep(90);
        const y = document.querySelector('#modal-root [data-yes]');
        out.confirmShown = !!y;
        if (y) { y.click(); await sleep(120); out.storiesAfter = DB.stories.length; }
      }
      break;
    }
    closeViewer(); await sleep(60);
  }

  /* 5. click on stage background must NOT close, backdrop click MUST close */
  go('status'); await sleep(70);
  const r5 = document.querySelector('[data-act=view-story]');
  if (r5) {
    r5.click(); await sleep(130);
    const body = document.querySelector('#viewer-root .vbody');
    if (body) { body.click(); await sleep(90); out.stageClickKeepsOpen = !!document.querySelector('#viewer-root').innerHTML; }
    const backdrop = document.querySelector('#viewer-root .viewer');
    if (backdrop) { backdrop.click(); await sleep(90); out.backdropClickCloses = !document.querySelector('#viewer-root').innerHTML; }
  }
  return out;
})()
