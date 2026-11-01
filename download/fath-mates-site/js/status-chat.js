/* ─────────── status / stories ─────────── */
const STORY_BGS=['linear-gradient(135deg,#7c3aed,#db2777)','linear-gradient(135deg,#0d9488,#059669)','linear-gradient(135deg,#f59e0b,#ef4444)','linear-gradient(135deg,#0891b2,#7c3aed)','linear-gradient(135deg,#ec4899,#f97316)','linear-gradient(135deg,#1e1b3a,#4f46e5)'];
let stBg=0,stMedia=null;
function activeStories(){
  const cut=Date.now()-864e5;
  DB.stories=DB.stories.filter(s=>new Date(s.at).getTime()>cut);
  return[...DB.stories].sort((a,b)=>b.at.localeCompare(a.at));
}
function renderStatus(){
  const m=me(),stories=activeStories();
  const mine=stories.filter(s=>s.userId===m.id);
  return `<div class="phead"><div class="row"><div><div class="kick">24 hours</div><h1>Status</h1><p>Stories vanish after 24 hours.</p></div>
    <button class="btn btn-primary" data-act="add-status">${icon('plus',16)} Add Status</button></div></div>
  <div class="stories">
    <div class="stcard add" data-act="add-status"><span class="plus">${icon('plus',20)}</span>Add Status</div>
    ${stories.map((s,i)=>{const u=userById(s.userId);if(!u)return'';
      const seen=s.seenBy.includes(m.id);
      return `<div class="${seen?'':'ring'}" style="${seen?'':'flex:none;width:125px;height:195px'}" data-act="view-story" data-idx="${i}">
      <div class="${seen?'stcard':'inner'}" style="width:100%;height:100%">
        ${s.type==='text'?`<div class="bg" style="background:${s.bg}">${esc(s.content)}</div>`:`${s.type==='image'?`<img data-media="${s.mediaId}">`:`<video data-media="${s.mediaId}" muted></video>`}
          ${s.content?`<div class="bg" style="background:linear-gradient(transparent 40%,rgba(0,0,0,.6))"><span style="align-self:flex-end">${esc(s.content)}</span></div>`:''}`}
        <div class="who">${icon(u.id===m.id?'eye':'play',12)} ${esc(u.id===m.id?'Your story':u.username)}</div>
      </div></div>`}).join('')}
  </div>
  ${stories.length===0?`<div class="card empty" style="margin-top:8px">${icon('camera',26)}<b>No active stories</b><p>Add the first status of the day!</p></div>`:''}
  <div class="grid2" style="margin-top:22px">
    <div><div class="sect-h"><h3>Your story activity</h3></div><div class="card pad">
      ${mine.length?mine.map(s=>`<div class="rowline"><span class="av" style="width:32px;height:32px;background:var(--grad);color:#fff">${icon(s.type==='text'?'edit':s.type==='image'?'image':'play',14)}</span>
        <span style="flex:1;min-width:0"><span class="n">${s.type==='text'?esc(s.content.slice(0,44)):s.type==='image'?'Photo story':'Video story'}</span>
        <span class="s" style="display:block">${s.seenBy.length} view${s.seenBy.length===1?'':'s'} · ${fmtAgo(s.at)}</span></span>
        <button class="btn-ghost btn-icon" data-act="del-story" data-id="${s.id}">${icon('trash',15)}</button></div>`).join('')
      :'<p class="small muted" style="padding:6px 2px">You have no active story. Tap Add Status to share one.</p>'}</div></div>
    <div><div class="sect-h"><h3>How it works</h3></div><div class="card pad small muted" style="display:flex;flex-direction:column;gap:9px">
      <span style="display:flex;gap:9px;align-items:center">${icon('camera',15)} Text, photo or video stories.</span>
      <span style="display:flex;gap:9px;align-items:center">${icon('eye',15)} Mates can view and reply privately.</span>
      <span style="display:flex;gap:9px;align-items:center">${icon('cal',15)} Auto-deletes after 24 hours.</span>
    </div></div>
  </div>`;
}
function openStatusModal(){
  stBg=0;stMedia=null;
  openModal(`<div class="sh"><h3>Add Status</h3><button class="btn-ghost btn-icon" data-act="close-modal">${icon('x')}</button></div>
    <label class="lbl">Text (optional)</label>
    <textarea class="input" id="st-text" placeholder="What's happening?" style="min-height:70px"></textarea>
    <div id="st-prev" style="margin-top:10px"></div>
    <label class="lbl" style="margin-top:14px">Background</label>
    <div class="bgpick">${STORY_BGS.map((b,i)=>`<button data-act="st-bg" data-i="${i}" class="${i===stBg?'on':''}" style="background:${b}"></button>`).join('')}</div>
    <div style="display:flex;gap:9px;margin-top:18px">
      <button class="btn" data-act="st-attach">${icon('image',15)} Photo / Video</button>
      <span style="flex:1"></span>
      <button class="btn btn-primary" data-act="submit-status">${icon('send',15)} Share</button></div>`);
}
async function submitStatus(){
  const m=me(),text=$('#st-text').value.trim();
  if(!text&&!stMedia)return toast('Add text or attach media','warning');
  const s={id:uid(),userId:m.id,type:stMedia?(stMedia.kind==='video'?'video':'image'):'text',content:text,mediaId:stMedia?stMedia.id:'',bg:STORY_BGS[stBg],seenBy:[],replies:[],at:nowISO()};
  DB.stories.unshift(s);saveDB();closeModal();stMedia=null;state.view='status';renderApp();
  toast('Status shared — it lasts 24 hours','success');
}
let viewing=null;
async function openViewer(idx){
  const stories=activeStories();if(!stories.length)return;
  state.storyList=stories;state.storyIdx=Math.max(0,Math.min(idx,stories.length-1));
  const s=stories[state.storyIdx],u=userById(s.userId),m=me();
  if(!s.seenBy.includes(m.id)){s.seenBy.push(m.id);saveDB()}
  const mediaUrl=s.mediaId?await Media.get(s.mediaId):null;
  const replies=DB.messages.filter(x=>x.pair==='story:'+s.id&&x.from!==s.userId||x.pair==='story:'+s.id);
  $('#viewer-root').innerHTML=`<div class="viewer" data-act="close-viewer">
    <div class="stage" style="background:${s.type==='text'?s.bg:'#000'}">
      ${s.type==='image'&&mediaUrl?`<img src="${mediaUrl}">`:s.type==='video'&&mediaUrl?`<video src="${mediaUrl}" controls autoplay></video>`:''}
      <div class="vtop">
        <button class="btn-ghost btn-icon" style="color:#fff" data-act="close-viewer">${icon('x')}</button>
        ${avHtml(u,36,isOnline(u))}
        <div style="flex:1"><b style="font-size:14px">${esc(u?displayName(u):'—')}</b>
          <div class="small" style="opacity:.8">${fmtAgo(s.at)} · ${s.seenBy.length} view${s.seenBy.length===1?'':'s'}</div></div>
        ${u.id===m.id||canMod(m)?`<button class="btn-ghost btn-icon" style="color:#fff" data-act="del-story-view">${icon('trash')}</button>`:''}
      </div>
      ${s.type==='text'?`<div class="vbody">${esc(s.content)}</div>`:s.content?`<div class="vbody" style="position:relative;z-index:2;align-items:flex-end;padding-bottom:90px;text-shadow:0 2px 12px rgba(0,0,0,.6)">${esc(s.content)}</div>`:''}
      ${u.id!==m.id?`<div class="vfoot"><input id="story-reply" placeholder="Reply privately…">
        <button class="icon-btn" style="background:rgba(255,255,255,.14);border:0;color:#fff" data-act="send-story-reply">${icon('send',17)}</button></div>`:''}
      ${stories.length>1?`<button class="vnav prev" data-act="story-nav" data-d="-1">${icon('left')}</button>
        <button class="vnav next" data-act="story-nav" data-d="1">${icon('right')}</button>`:''}
    </div></div>`;
}
function closeViewer(){$('#viewer-root').innerHTML='';renderApp()}

/* ─────────── chat ─────────── */
function pairOf(a,b){return[a,b].sort().join('|')}
function renderChat(){
  const m=me(),cu=chatUnread();
  const others=DB.users.filter(u=>u.id!==m.id&&!u.disabled)
    .map(u=>{const pair=pairOf(u.id,m.id);
      const last=DB.messages.filter(x=>x.pair===pair&&!x.deleted).sort((a,b)=>b.at.localeCompare(a.at))[0];
      return{u,last,un:cu[u.id]||0}})
    .sort((a,b)=>(b.last?b.last.at:'').localeCompare(a.last?a.last.at:'')||a.u.username.localeCompare(b.u.username));
  const withU=state.chatWith?userById(state.chatWith):null;
  return `<div class="phead"><div class="kick">Direct messages</div><h1>Chats</h1><p>Private conversations with your mates.</p></div>
  <div class="chat-wrap">
    <div class="chat-list ${withU?'hide-m':''}">
      <div class="cl-head">${icon('chat',16)} All mates <span class="muted" style="font-weight:600;font-size:12px">(${others.length})</span></div>
      <div class="rows">${others.map(({u,last,un})=>`<button class="citem ${state.chatWith===u.id?'on':''}" data-act="open-chat" data-id="${u.id}">
        ${avHtml(u,40,isOnline(u))}
        <span style="flex:1;min-width:0"><span class="n">${esc(displayName(u))}</span>
          <span class="p" style="display:block">${last?(last.from===m.id?'You: ':'')+esc(last.text||('Sent '+last.mediaType)):'Say hello!'}</span></span>
        ${un?`<span class="un">${un>9?'9+':un}</span>`:last?`<span class="s" style="font-size:10.5px">${fmtAgo(last.at).replace(' ago','')}</span>`:''}</button>`).join('')}</div>
    </div>
    <div class="chat-pane ${withU?'':'hide-m'}">
      ${withU?renderConversation(withU):`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:30px"><div class="empty">${icon('chat',26)}<b>Pick a mate</b><p>Choose someone from the list to start chatting.</p></div></div>`}
    </div>
  </div>`;
}
function renderConversation(u){
  const m=me(),pair=pairOf(u.id,m.id);
  const msgs=DB.messages.filter(x=>x.pair===pair).sort((a,b)=>a.at.localeCompare(b.at));
  const dm=pairOf(u.id,m.id);
  return `<div class="cp-head">
      <button class="btn-ghost btn-icon" data-act="back-chat" style="display:flex">${icon('back',17)}</button>
      ${avHtml(u,38,isOnline(u))}
      <div style="flex:1;cursor:pointer" data-act="open-profile-id" data-id="${u.id}"><b style="font-size:14px">${esc(displayName(u))}</b>
        <div class="small muted">${isOnline(u)?'Online now':'Last seen '+(u.onlineAt?fmtAgo(u.onlineAt):'a while ago')}</div></div>
    </div>
    <div class="msgs" id="msgs">${msgs.map(x=>{
      const isMe=x.from===m.id;
      let media='';if(x.mediaId&&!x.deleted){media=x.mediaType==='image'?`<img data-media="${x.mediaId}">`:x.mediaType==='video'?`<video data-media="${x.mediaId}" controls></video>`:''}
      return `<div class="msg ${isMe?'me':'them'}"><div class="bub ${x.deleted?'deleted':''}">
        ${x.deleted?esc('This message was deleted'):media+x.text?media+(x.text?`<div style="margin-top:${media?'6px':'0'}">${esc(x.text)}</div>`:''):esc('')}
      </div><span class="meta">${x.deleted?'':fmtTime(x.at)}</span>
      ${isMe&&!x.deleted?`<button class="btn-ghost" data-act="del-msg" data-id="${x.id}" style="font-size:10.5px;color:var(--red);padding:2px 4px">Delete</button>`:''}</div>`}).join('')
    ||'<p class="small muted" style="text-align:center;margin:auto">No messages yet — say hello!</p>'}</div>
    <form class="chat-input" data-form="chat-send" data-id="${u.id}">
      <button type="button" class="icon-btn" data-act="chat-attach">${icon('clip',17)}</button>
      <input class="input" id="chat-text" placeholder="Type a message…" autocomplete="off">
      <button class="btn btn-primary btn-icon">${icon('send',17)}</button></form>`;
}
function sendChat(toId,text,media){
  const m=me();
  if(!text&&!media)return;
  DB.messages.push({id:uid(),pair:pairOf(toId,m.id),from:m.id,to:toId,text:text||'',mediaId:media?media.id:'',mediaType:media?media.kind:'',replyTo:'',deleted:false,at:nowISO()});
  notify(toId,'New message from '+displayName(m),'info');
  saveDB();
  if(state.view==='chat')renderApp();
}
