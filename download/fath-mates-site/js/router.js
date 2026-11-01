/* ═══════════ router + boot ═══════════ */
function renderApp(soft){
  const m=me();
  if(!m){$('#app').innerHTML=state.screen==='auth'?renderAuth():renderLanding();state.screen=state.screen==='auth'?'auth':'landing'}
  else{
    state.screen='app';
    const views={dashboard:renderDashboard,feed:renderFeed,status:renderStatus,chat:renderChat,awards:renderAwards,board:renderBoard,notices:renderNotices,members:renderMembers,media:renderMedia,academic:renderAcademic,profile:renderProfile,settings:renderSettings};
    const fn=views[state.view]||renderDashboard;
    if(state.view==='members'&&!canMod(m))state.view='dashboard';
    if(state.view==='media'&&!canMod(m))state.view='dashboard';
    $('#app').innerHTML=renderShell(fn());
  }
  hydrateMedia();
  if(window.FMS&&FMS.dot)FMS.dot();
  if(!soft)window.scrollTo({top:0});
  if(state.view==='chat'){const el=$('#msgs');if(el)el.scrollTop=el.scrollHeight}
}
async function hydrateMedia(){
  for(const el of $$('[data-media]')){
    const id=el.dataset.media;if(!id)continue;
    const url=await Media.get(id);
    if(url){if(el.tagName==='IMG')el.src=url;else if(el.tagName==='VIDEO'){el.src=url;if(el.hasAttribute('muted'))el.play().catch(()=>{})}}
  }
  for(const el of $$('[data-dl]')){
    el.onclick=async e=>{e.preventDefault();e.stopPropagation();
      const url=await Media.get(el.dataset.dl);
      if(!url)return toast('Media not found','error');
      const f=DB.files.find(x=>x.id===el.dataset.dl);
      const a=document.createElement('a');a.href=url;a.download=(f&&f.name)||'fath-mates-media';a.click();
    };
  }
}
function go(v){state.view=v;state.profileOf='';state.editMode=false;state.menuOpen=false;state.bellOpen=false;state.searchOpen=false;renderApp()}
