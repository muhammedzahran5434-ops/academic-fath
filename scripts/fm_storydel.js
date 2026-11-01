(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { storiesBefore: DB.stories.length, tried: [] };
  const seenOwners = new Set();
  for (let guard = 0; guard < 8; guard++) {
    const rings = [...document.querySelectorAll('[data-act=view-story]')];
    if (!rings.length) break;
    let clickedFresh = false;
    for (const r of rings) {
      r.click(); await sleep(140);
      const b = document.querySelector('#viewer-root .vtop b');
      const name = b ? b.textContent : '?';
      if (!seenOwners.has(name)) { seenOwners.add(name); clickedFresh = true; }
      if (name === '816') {
        out.foundOwn = true;
        const del = document.querySelector('#viewer-root [data-act=del-story-view]');
        out.delFound = !!del;
        if (del) {
          del.click(); await sleep(100);
          const y = document.querySelector('#modal-root [data-yes]');
          out.confirmShown = !!y;
          if (y) { y.click(); await sleep(140); out.storiesAfter = DB.stories.length; out.viewerClosed = !document.querySelector('#viewer-root').innerHTML; }
        }
        break;
      }
      closeViewer(); await sleep(80);
      if (clickedFresh) break; /* re-collect fresh rings next guard pass */
    }
    if (out.foundOwn || !clickedFresh) break;
  }
  out.seenOwners = [...seenOwners];
  return out;
})()
