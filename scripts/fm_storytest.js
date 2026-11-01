(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { before: DB.messages.length };
  go('status'); await sleep(70);
  const rings = [...document.querySelectorAll('[data-act=view-story]')];
  out.rings = rings.length;
  for (const r of rings) {
    r.click(); await sleep(130);
    const b = document.querySelector('#viewer-root .vtop b');
    if (b && b.textContent !== '816') break;
    closeViewer(); await sleep(60);
  }
  out.listLen = state.storyList.length;
  out.idx = state.storyIdx;
  out.owner = state.storyList[state.storyIdx] ? userById(state.storyList[state.storyIdx].userId).username : '?';
  const inp = document.querySelector('#story-reply');
  out.inp = !!inp;
  if (inp) {
    inp.value = 'hello!';
    out.val = inp.value;
    const btn = document.querySelector('#viewer-root [data-act=send-story-reply]');
    out.btn = !!btn;
    if (btn) {
      btn.click(); await sleep(130);
      out.after = DB.messages.length;
      out.viewerAfter = document.querySelector('#viewer-root').innerHTML.length;
      out.lastMsg = DB.messages.length ? { pair: DB.messages[DB.messages.length - 1].pair, text: DB.messages[DB.messages.length - 1].text } : null;
    }
  }
  return out;
})()
