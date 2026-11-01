/* ═══════════ boot ═══════════ */
function fatalScreen(msg){
  const sp=$('#splash');if(sp)sp.remove();
  const app=$('#app');
  if(app&&!app.innerHTML.trim())app.innerHTML=`<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
    <div class="card pad" style="max-width:430px;width:100%;text-align:center">
      <div style="width:54px;height:54px;border-radius:16px;background:var(--red-soft);color:var(--red);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:24px;font-weight:800">!</div>
      <h3 style="margin-bottom:8px">The app could not start</h3>
      <p class="small muted" style="margin-bottom:14px">${esc(msg)}</p>
      <button class="btn btn-primary btn-block" onclick="location.reload()">Reload</button>
    </div></div>`;
}
window.addEventListener('error',e=>{if($('#splash'))fatalScreen((e&&e.message)||'Unexpected error')});
window.addEventListener('unhandledrejection',e=>{if($('#splash'))fatalScreen((e&&e.reason&&e.reason.message)||'Unexpected error')});
(async function boot(){
  try{
    loadDB();await Media.init();
    if(await FMS.waitReady(4500))await FMS.bootSync();
    else{await ensureSeed();FMS.offline()}
    const th=LS.get('fm_theme');
    if(th==='dark')document.documentElement.classList.add('dark');
    // restore session
    if(state.token&&!DB.sessions[state.token])setToken('');
    const m=me();if(m){m.onlineAt=nowISO();saveDB()}
    state.screen=m?'app':'landing';
    renderApp();
  }catch(err){fatalScreen((err&&err.message)||'Startup failed — please reload');return}
  const sp=$('#splash');
  if(sp){sp.style.transition='opacity .4s';sp.style.opacity='0';setTimeout(()=>{const s=$('#splash');if(s)s.remove()},450)}
  // presence + cleanup heartbeat
  setInterval(()=>{const u=me();if(u){u.onlineAt=nowISO();saveDB()}},30000);
  setInterval(()=>{ // story expiry + badge refresh
    const cut=Date.now()-864e5;const before=DB.stories.length;
    DB.stories=DB.stories.filter(s=>new Date(s.at).getTime()>cut);
    if(DB.stories.length!==before){for(const s of []){};saveDB()}
    if(state.screen==='app'&&me()&&state.view!=='chat'){/* keep badge fresh on next render */}
  },60000);
})();
/* watchdog — the splash must NEVER blink forever */
setTimeout(()=>{if($('#splash'))fatalScreen('Startup timed out. Your browser may be blocking storage or the internet is down — check the connection and press Reload.')},12000);
