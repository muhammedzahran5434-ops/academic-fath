/* ═══════════ event delegation ═══════════ */
const ACTIONS={
  'theme':()=>{const d=document.documentElement.classList.toggle('dark');LS.set('fm_theme',d?'dark':'light');renderApp()},
  'go-auth':()=>{state.screen='auth';renderApp()},
  'go-landing':()=>{state.screen='landing';renderApp()},
  'scroll-feats':()=>$('#feats').scrollIntoView({behavior:'smooth'}),
  'auth-tab':d=>{authTab=d.tab;renderApp()},
  'toggle-pass':()=>{authShow=!authShow;renderApp();const p=$('#lg-pass');if(p){p.focus();p.setSelectionRange(p.value.length,p.value.length)}},
  'toggle-cp':d=>{if(d.t==='1')setN1=!setN1;else setN2=!setN2;renderApp()},
  'nav':d=>{go(d.view)},
  'open-profile':d=>{state.view='profile';state.profileOf=d.user;state.editMode=false;state.menuOpen=false;renderApp()},
  'open-profile-id':d=>{const u=userById(d.id);if(u){state.view='profile';state.profileOf=u.username;state.editMode=false;renderApp()}},
  'edit-own':()=>{state.editMode=!state.editMode;renderApp()},
  'menu':()=>{state.menuOpen=!state.menuOpen;state.bellOpen=false;renderApp()},
  'bell':()=>{state.bellOpen=!state.bellOpen;state.menuOpen=false;renderApp()},
  'read-all':()=>{const m=me();for(const n of DB.notifications)if(n.userId===m.id)n.read=true;saveDB();renderApp()},
  'notif':()=>{state.bellOpen=false;go('dashboard')},
  'signout':async()=>{const m=me();delete DB.sessions[state.token];if(m)m.onlineAt='';setToken('');saveDB();state.view='dashboard';state.screen='landing';renderApp();toast('Signed out — see you soon!','info')},
  'chat-with':d=>{state.view='chat';state.chatWith=d.id;renderApp()},
  'open-chat':d=>{state.chatWith=d.id;renderApp()},
  'back-chat':()=>{state.chatWith='';renderApp()},
  'close-modal':()=>closeModal(),
  /* feed */
  'attach-post':()=>attachMedia('any'),
  'submit-post':()=>submitPost(),
  'like':d=>{const p=DB.posts.find(x=>x.id===d.id);if(!p)return;const m=me();
    if(p.likes.includes(m.id)){p.likes=p.likes.filter(x=>x!==m.id)}
    else{p.likes.push(m.id);if(p.userId!==m.id)notify(p.userId,displayName(m)+' liked your post','success')}
    saveDB();renderApp()},
  'comments':d=>{state['copen_'+d.id]=!state['copen_'+d.id];renderApp()},
  'del-post':async d=>{const p=DB.posts.find(x=>x.id===d.id);if(!p)return;
    for(const md of p.media)await delMedia(md.id);
    DB.posts=DB.posts.filter(x=>x.id!==d.id);saveDB();renderApp();toast('Post deleted','info')},
  'del-comment':d=>{const p=DB.posts.find(x=>x.id===d.id);if(!p)return;p.comments=p.comments.filter(c=>c.id!==d.cid);saveDB();renderApp()},
  /* status */
  'add-status':()=>{stMedia=null;openStatusModal()},
  'st-bg':d=>{stBg=Number(d.i);$$('.bgpick button').forEach((b,i)=>b.classList.toggle('on',i===stBg))},
  'st-attach':async()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*,video/*';
    inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{toast('Processing media…','info');stMedia=await storeMedia(f);
      $('#st-prev').innerHTML=renderMediaPreview(stMedia);hydrateMedia()}catch(e){toast(e.message,'error')}};inp.click()},
  'submit-status':()=>submitStatus(),
  'view-story':d=>openViewer(Number(d.idx)),
  'story-nav':d=>{const n=state.storyIdx+Number(d.d);if(n<0||n>=state.storyList.length)return;openViewer(n)},
  'close-viewer':()=>closeViewer(),
  'del-story':async d=>{if(!await confirmDestructive('Delete this story?'))return;const s=DB.stories.find(x=>x.id===d.id);if(s&&s.mediaId)await delMedia(s.mediaId);DB.stories=DB.stories.filter(x=>x.id!==d.id);saveDB();renderApp();toast('Story deleted','info')},
  'del-story-view':async()=>{const s=state.storyList[state.storyIdx];if(!s)return;
    if(!await confirmDestructive('Delete this story?'))return;
    if(s.mediaId)await delMedia(s.mediaId);DB.stories=DB.stories.filter(x=>x.id!==s.id);saveDB();closeViewer();toast('Story deleted','info')},
  'send-story-reply':()=>{const inp=$('#story-reply');if(!inp)return;const t=inp.value.trim();if(!t)return;
    const s=state.storyList[state.storyIdx];if(!s)return;const m=me();
    DB.messages.push({id:uid(),pair:'story:'+s.id,from:m.id,to:s.userId,text:t,mediaId:'',mediaType:'',replyTo:s.id,deleted:false,at:nowISO()});
    notify(s.userId,displayName(m)+' replied to your story','info');saveDB();closeViewer();toast('Reply sent to '+displayName(userById(s.userId)),'success')},
  /* chat */
  'chat-attach':async()=>{if(!state.chatWith)return;const inp=document.createElement('input');inp.type='file';inp.accept='image/*,video/*';
    inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{toast('Sending media…','info');const md=await storeMedia(f);sendChat(state.chatWith,'',md)}catch(e){toast(e.message,'error')}};inp.click()},
  'del-msg':async d=>{const x=DB.messages.find(y=>y.id===d.id);if(!x)return;
    if(!await confirmDestructive('Delete this message for both?'))return;
    if(x.mediaId)await delMedia(x.mediaId);
    x.deleted=true;x.text='';x.mediaId='';saveDB();renderApp();toast('Message deleted','info')},
  /* awards */
  'add-award':()=>openAwardModal(),
  'aw-cat':d=>{awCat=d.c;$$('.cato').forEach(el=>el.classList.toggle('on',el.dataset.c===d.c))},
  'aw-attach':async()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
    inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{toast('Attaching proof…','info');awMedia=await storeMedia(f);
      $('#aw-prev').innerHTML=renderMediaPreview(awMedia);hydrateMedia()}catch(e){toast(e.message,'error')}};inp.click()},
  'submit-award':()=>submitAward(),
  'aw-filter':d=>{state.awardFilter=d.f;renderApp()},
  'approve-award':d=>approveAward(d.id),
  'reject-award':d=>rejectAward(d.id),
  'del-award':async d=>{if(!await confirmDestructive('Remove this achievement?'))return;
    const a=DB.achievements.find(x=>x.id===d.id);if(a&&a.mediaId)await delMedia(a.mediaId);
    DB.achievements=DB.achievements.filter(x=>x.id!==d.id);saveDB();renderApp();toast('Achievement removed','info')},
  /* notices */
  'add-notice':()=>openNoticeModal(),
  'submit-notice':()=>submitNotice(),
  'del-notice':async d=>{if(!await confirmDestructive('Delete this notice?'))return;DB.announcements=DB.announcements.filter(x=>x.id!==d.id);saveDB();renderApp();toast('Notice deleted','info')},
  /* members */
  'add-admission':()=>openAdmissionModal(),
  'save-admission':()=>saveAdmission(),
  'make-vip':d=>{const u=userById(d.id);if(!u)return;u.role='vip';u.vipSince=nowISO();
    notify(u.id,'You are now a VIP moderator — enjoy the powers!','success');saveDB();renderApp();toast(displayName(u)+' is now VIP','success')},
  'un-vip':d=>{const u=userById(d.id);if(!u)return;u.role='member';u.vipSince='';
    notify(u.id,'Your VIP status was removed','info');saveDB();renderApp();toast('VIP removed from '+displayName(u),'info')},
  'disable-user':d=>{const u=userById(d.id);if(!u)return;u.disabled=true;
    for(const t in DB.sessions)if(DB.sessions[t]===u.id)delete DB.sessions[t];
    notify(u.id,'Your account was disabled by a moderator','error');saveDB();renderApp();toast(displayName(u)+' disabled','info')},
  'enable-user':d=>{const u=userById(d.id);if(!u)return;u.disabled=false;
    notify(u.id,'Your account was re-enabled','success');saveDB();renderApp();toast(displayName(u)+' enabled again','success')},
  'reset-pass':async d=>{const u=userById(d.id);if(!u)return;
    const np=await promptText('Reset password for '+displayName(u),'','New password (min 6)');
    if(np===null)return;if(np.length<6)return toast('Password must be at least 6 characters','warning');
    u.password=await hashPassword(np);
    for(const t in DB.sessions)if(DB.sessions[t]===u.id)delete DB.sessions[t];
    notify(u.id,'Your password was reset by a moderator','info');saveDB();renderApp();toast('Password reset for '+displayName(u),'success')},
  'del-user':async d=>{const u=userById(d.id);if(!u)return;
    if(!await confirmDestructive('Permanently delete '+displayName(u)+' and all their data?'))return;
    for(const p of DB.posts.filter(p=>p.userId===u.id))for(const md of p.media)await delMedia(md.id);
    DB.posts=DB.posts.filter(p=>p.userId!==u.id);
    for(const s of DB.stories.filter(s=>s.userId===u.id))if(s.mediaId)await delMedia(s.mediaId);
    DB.stories=DB.stories.filter(s=>s.userId!==u.id);
    DB.messages=DB.messages.filter(x=>x.from!==u.id&&x.to!==u.id);
    DB.achievements=DB.achievements.filter(a=>a.userId!==u.id);
    DB.skills=DB.skills.filter(s=>s.userId!==u.id);
    DB.notifications=DB.notifications.filter(n=>n.userId!==u.id);
    for(const t in DB.sessions)if(DB.sessions[t]===u.id)delete DB.sessions[t];
    DB.users=DB.users.filter(x=>x.id!==u.id);saveDB();renderApp();toast(displayName(u)+' deleted','info')},
  /* vault */
  'vault-del':async d=>{if(!await confirmDestructive('Delete this media from campus?'))return;
    const f=DB.files.find(x=>x.id===d.id);await delMedia(d.id);
    if(f){DB.posts.forEach(p=>{if(p.media)p.media=p.media.filter(m=>m.id!==d.id)});
      DB.stories.forEach(s=>{if(s.mediaId===d.id){s.type='text';s.mediaId=''}});
      DB.achievements.forEach(a=>{if(a.mediaId===d.id)a.mediaId=''});
      DB.messages.forEach(x=>{if(x.mediaId===d.id){x.mediaId='';x.deleted=true;x.text=''}});}
    saveDB();renderApp();toast('Media deleted','info')},
  /* academic */
  'ac-subject':d=>{state.acSubject=d.id;renderApp()},
  'save-marks':()=>saveMarks(),
  /* profile */
  'add-skill':async()=>{const name=await promptText('Add a skill','','e.g. Calligraphy');if(name===null||!name)return;
    const lvl=Number(await new Promise(res=>{openModal(`<div class="sh"><h3>Skill level</h3></div>
      <p class="small muted" style="margin-bottom:12px">How good are you at <b>${esc(name)}</b>?</p>
      <div class="catgrid">${[1,2,3,4,5].map(l=>`<button class="btn" data-l="${l}" style="width:auto">${l} — ${['Beginner','Basic','Good','Advanced','Expert'][l-1]}</button>`).join('')}</div>`);
      $$('#modal-root [data-l]').forEach(b=>b.onclick=()=>{const v=Number(b.dataset.l);closeModal();res(v)})}));
    DB.skills.push({id:uid(),userId:me().id,name,level:lvl});saveDB();renderApp();toast('Skill added','success')},
  'del-skill':async d=>{DB.skills=DB.skills.filter(s=>s.id!==d.id);saveDB();renderApp();toast('Skill removed','info')},
  'change-photo':()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
    inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{toast('Updating photo…','info');
      const m=me();if(m.photoId)await delMedia(m.photoId);
      const md=await storeMedia(f);m.photoId=md.id;saveDB();renderApp();toast('Profile photo updated','success')}catch(e){toast(e.message,'error')}};inp.click()},
  'save-profile':()=>{const m=me();
    m.fullName=$('#ep-name').value.trim();m.dob=$('#ep-dob').value;m.klass=$('#ep-klass').value.trim();
    m.guardian=$('#ep-guardian').value.trim();m.phone=$('#ep-phone').value.trim();m.address=$('#ep-address').value.trim();m.bio=$('#ep-bio').value.trim();
    if(!m.fullName)return toast('Full name is required','warning');
    saveDB();state.editMode=false;renderApp();toast('Profile saved','success')},
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  if(el.classList.contains('viewer')&&e.target.closest('.stage'))return; // clicks inside the story stage never close the viewer (buttons inside still work)
  const fn=ACTIONS[el.dataset.act];
  if(fn){e.preventDefault();fn(el.dataset,el,e)}
  else if(el.dataset.act==='noop')e.preventDefault();
});
document.addEventListener('submit',e=>{
  const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();
  const kind=f.dataset.form;
  if(kind==='login')doLogin();
  else if(kind==='comment'){const inp=f.querySelector('[data-role=c-input]'),t=inp.value.trim();if(!t)return;
    const p=DB.posts.find(x=>x.id===f.dataset.id);if(!p)return;const m=me();
    p.comments.push({id:uid(),userId:m.id,text:t,at:nowISO()});
    if(p.userId!==m.id)notify(p.userId,displayName(m)+' commented on your post','info');
    saveDB();renderApp()}
  else if(kind==='chat-send'){const inp=$('#chat-text'),t=inp.value.trim();if(!t)return;sendChat(f.dataset.id,t);inp.value=''}
  else if(kind==='change-pass'){(async()=>{
    const m=me(),c1=$('#cp-1').value,n1=$('#cp-2').value;
    if(!(await verifyPassword(c1,m.password)))return toast('Current password is incorrect','error');
    if(n1.length<6)return toast('New password must be at least 6 characters','warning');
    if(n1===c1)return toast('New password must be different','warning');
    m.password=await hashPassword(n1);saveDB();renderApp();toast('Password updated — use it next time you sign in','success');
  })()}
});
document.addEventListener('input',e=>{
  if(e.target.id==='g-search'){state.search=e.target.value;state.searchOpen=true;
    const app=$('#app');renderApp();const inp=$('#g-search');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}}
  if(e.target.id==='m-search'){mSearch=e.target.value;
    const rows=$('.card.pad');renderApp();const inp=$('#m-search');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)}}
});
document.addEventListener('keydown',e=>{
  if(e.key==='/'&&state.screen==='app'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();const g=$('#g-search');if(g)g.focus()}
  if(e.key==='Escape'){if($('#viewer-root').innerHTML)closeViewer();else closeModal()}
});
document.addEventListener('mousedown',e=>{
  if(state.bellOpen||state.menuOpen||state.searchOpen){
    if(!e.target.closest('.bell-wrap')&&!e.target.closest('.pop')&&!e.target.closest('.me-chip')&&!e.target.closest('.searchbox'))
      {state.bellOpen=false;state.menuOpen=false;if(state.searchOpen){state.searchOpen=false;renderApp()}}
  }
});
