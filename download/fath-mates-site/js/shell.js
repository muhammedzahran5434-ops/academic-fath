/* ─────────── landing ─────────── */
const FEATS=[['chat','Real-time Chat','Message any mate privately with photos and videos.'],['camera','Status & Stories','Share 24-hour stories with the whole campus.'],['image','Media Sharing','Post photos, videos and files to the feed.'],['trophy','Achievements','Earn points for awards and climb the leaderboard.'],['chart','Leaderboard','See who is leading with approved achievement points.'],['gem','VIP Powers','VIPs moderate awards, notices and members.']];
function renderLanding(){
  return `<div class="hero">
    <div class="blob b1"></div><div class="blob b2"></div>
    <div class="wrap hero-top">
      <div class="brand"><div class="fm">FM</div><div><div class="t1">FATH MATES</div><div class="t2">Darul Hasanath</div></div></div>
      <div style="display:flex;gap:9px">
        <button class="icon-btn" data-act="theme">${icon(document.documentElement.classList.contains('dark')?'sun':'moon')}</button>
        <button class="btn btn-primary" data-act="go-auth">Sign In</button>
      </div>
    </div>
    <div class="hero-mid"><div class="wrap"><div class="hero-grid">
      <div>
        <span class="chip on" style="animation:pop .5s .1s both">${icon('sparkles',13)} Made for our campus family</span>
        <h1 class="a-fadeup" style="animation-delay:.08s">Where our campus <em>connects</em>.</h1>
        <p class="lead a-fadeup" style="animation-delay:.16s">Chat with mates, share achievements, post statuses and celebrate every win together — privately, only for Darul Hasanath.</p>
        <div class="hero-cta a-fadeup" style="animation-delay:.24s">
          <button class="btn btn-primary" data-act="go-auth">${icon('user',17)} Sign In to your account</button>
          <button class="btn" data-act="scroll-feats">See what's inside</button>
        </div>
      </div>
      <div class="phone-mock"><div class="phone"><div class="pr">
        <div class="mock-row"><span class="av" style="width:34px;height:34px;background:#7c3aed">816</span><div style="flex:1"><div class="sk" style="width:70%;background:var(--primary-soft)"></div><div class="sk" style="width:45%;margin-top:6px"></div></div>${icon('heart',16)}</div>
        <div class="mock-row"><span class="av" style="width:34px;height:34px;background:#0d9488">79</span><div style="flex:1"><div class="sk" style="width:60%;background:var(--green-soft)"></div><div class="sk" style="width:40%;margin-top:6px"></div></div>${icon('chat',16)}</div>
        <div class="mock-row" style="background:var(--primary-soft);border-color:transparent"><span class="av" style="width:34px;height:34px;background:var(--grad)">${icon('trophy',15)}</span><div style="flex:1"><div class="sk" style="width:75%;background:rgba(124,58,237,.25)"></div><div class="sk" style="width:50%;margin-top:6px;background:rgba(124,58,237,.18)"></div></div></div>
        <div class="mock-row"><span class="av" style="width:34px;height:34px;background:#e11d48">81</span><div style="flex:1"><div class="sk" style="width:65%"></div><div class="sk" style="width:35%;margin-top:6px"></div></div>${icon('camera',16)}</div>
        <div class="mock-row"><span class="av" style="width:34px;height:34px;background:#d97706">83</span><div style="flex:1"><div class="sk" style="width:55%"></div><div class="sk" style="width:42%;margin-top:6px"></div></div>${icon('award',16)}</div>
      </div></div></div>
    </div></div></div>
    <div class="wrap" id="feats"><div class="feats">
      ${FEATS.map(([ic,t,d],i)=>`<div class="feat a-fadeup" style="animation-delay:${.06*i}s">
        <div class="fi" style="background:var(--primary-soft);color:var(--primary)">${icon(ic,21)}</div>
        <h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div></div>
    <div class="hero-foot">FATH MATES — Darul Hasanath Islamic College. Sign in with your admission number.</div>
  </div>`;
}

/* ─────────── auth ─────────── */
let authTab='member',authShow=false;
function renderAuth(){
  return `<div class="auth">
    <div class="auth-side">
      <div class="glow" style="width:420px;height:420px;background:rgba(255,255,255,.14);top:-140px;right:-120px"></div>
      <div class="glow" style="width:380px;height:380px;background:rgba(255,255,255,.10);bottom:-160px;left:-120px"></div>
      <div class="brand" style="position:relative"><div class="fm" style="background:rgba(255,255,255,.2)">FM</div>
        <div><div class="t1">FATH MATES</div><div class="t2" style="color:rgba(255,255,255,.75)">Darul Hasanath</div></div></div>
      <div style="position:relative">
        <h2>Your campus, <em style="font-style:normal;color:#fbbf24">united</em> in one place.</h2>
        <p style="margin-top:14px;opacity:.9;max-width:430px;font-size:14.5px">Chat with mates, share your achievements, post statuses and celebrate every win together — securely, privately, only for our college family.</p>
        <div class="stat-row" style="margin-top:30px">
          <div><b>33+</b><span>Members</span></div><div><b>6</b><span>Subjects</span></div><div><b>24h</b><span>Stories</span></div>
        </div>
      </div>
      <p style="position:relative;font-size:12px;opacity:.75">Darul Hasanath Islamic College — private campus network</p>
    </div>
    <div class="auth-form">
      <button class="btn btn-ghost" data-act="go-landing" style="position:absolute;top:18px;left:18px;width:auto">${icon('back',16)} Back to home</button>
      <div class="auth-card">
        <h1 style="font-size:30px">Sign In</h1>
        <p class="muted small" style="margin-top:4px">Welcome back — enter your details to continue.</p>
        <div class="auth-tabs">
          <button data-act="auth-tab" data-tab="member" class="${authTab==='member'?'on':''}">Member</button>
          <button data-act="auth-tab" data-tab="staff" class="${authTab==='staff'?'on':''}">Staff</button>
        </div>
        <div id="auth-err"></div>
        <form data-form="login">
          <div style="margin-bottom:13px"><label class="lbl">${authTab==='staff'?'Staff username':'Admission number'}</label>
            <div class="pass-wrap"><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted)">${icon('user',16)}</span>
            <input class="input" id="lg-user" autocomplete="username" placeholder="${authTab==='staff'?'e.g. ADMINISTRATOR':'e.g. 791'}" style="padding-left:37px"></div></div>
          <div style="margin-bottom:16px"><label class="lbl">Password</label>
            <div class="pass-wrap"><span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted)">${icon('lock',16)}</span>
            <input class="input" id="lg-pass" type="${authShow?'text':'password'}" autocomplete="current-password" placeholder="Your password" style="padding-left:37px;padding-right:42px">
            <button type="button" class="pe" data-act="toggle-pass">${icon(authShow?'eyeoff':'eye',16)}</button></div></div>
          <button class="btn btn-primary btn-block" style="padding:13px">${icon('out',16)} Sign In</button>
        </form>
        <div class="hint">${icon('info',14)}<span>${authTab==='member'?'Members sign in with their admission number — default password is <b>adno@fath</b> (e.g. 791@fath). Change it in Settings after signing in.':'Use the administrator account provided by the college office.'}</span></div>
        <div style="display:flex;justify-content:center;margin-top:16px">
          <button class="icon-btn" data-act="theme">${icon(document.documentElement.classList.contains('dark')?'sun':'moon')}</button>
        </div>
      </div>
    </div>
  </div>`;
}
async function doLogin(){
  const un=$('#lg-user').value.trim(),pw=$('#lg-pass').value;
  const errBox=$('#auth-err');
  const fail=m=>{errBox.innerHTML=`<div class="err">${icon('warn',16)}<span>${esc(m)}</span></div>`};
  errBox.innerHTML='';
  if(!un)return fail('Enter your '+(authTab==='staff'?'username':'admission number'));
  if(!pw)return fail('Enter your password');
  const u=userByUn(un);
  if(!u)return fail('No account found with that '+(authTab==='staff'?'username':'admission number')+'. Ask the office.');
  if(authTab==='staff'&&u.role==='member')return fail('This is a member account — use the Member tab.');
  if(authTab==='member'&&u.role==='admin')return fail('Staff accounts must sign in from the Staff tab.');
  if(!(await verifyPassword(pw,u.password)))return fail('Incorrect password. Try again.');
  if(u.disabled)return fail('Your account has been disabled by the administrator.');
  const token=uid();DB.sessions[token]=u.id;u.onlineAt=nowISO();saveDB();setToken(token);
  notify(u.id,'Welcome back! You signed in successfully.','success');
  state.view='dashboard';renderApp();
  toast('Welcome back, '+(displayName(u)||u.username)+'!','success');
}

/* ─────────── app shell (top bar + bottom nav) ─────────── */
const NAVS=[['dashboard','Home','home'],['feed','Feed','news'],['status','Status','camera'],['chat','Chats','chat'],['awards','Awards','trophy'],['board','Board','chart']];
function unreadCount(){const m=me();return DB.notifications.filter(n=>n.userId===m.id&&!n.read).length}
function chatUnread(){const m=me();const c={};for(const msg of DB.messages){if(msg.to===m.id&&!msg.deleted){const n=(c[msg.from]||0)+1;c[msg.from]=n}}return c}
function avHtml(u,size=40,online=false){
  const img=u.photoId?1:0;
  return `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.34)}px;background:${u.avatarColor||avatarColorFor(u.username)}">
    ${u.photoId?`<img data-media="${u.photoId}" alt="">`:''}${!u.photoId?esc(initialsOf(u)):''}${online?'<span class="dot"></span>':''}</span>`;
}
function renderShell(inner){
  const m=me(),un=unreadCount(),cu=chatUnread(),dark=document.documentElement.classList.contains('dark');
  const totalChatUnread=Object.values(cu).reduce((a,b)=>a+b,0);
  const members=DB.users.filter(u=>state.search&&u.role!=='admin'&&displayName(u).toLowerCase().includes(state.search.toLowerCase())).slice(0,6);
  return `<div class="top"><div class="wrap top-in">
    <div class="brand" data-act="nav" data-view="dashboard"><div class="fm">FM</div><div><div class="t1">FATH MATES<span id="sync-dot" class="sync-dot off" title="Live sync"></span></div><div class="t2">Darul Hasanath</div></div></div>
    <nav class="nav-links">
      ${NAVS.map(([v,t,i])=>`<button data-act="nav" data-view="${v}" class="${state.view===v?'on':''}">${icon(i,16)}${t}</button>`).join('')}
      ${canMod(m)?`<button data-act="nav" data-view="members" class="${state.view==='members'?'on':''}">${icon('shield',16)}Members</button>`:''}
    </nav>
    <div class="top-right">
      <div class="searchbox"><span>${icon('search',15)}</span>
        <input id="g-search" placeholder="Search mates…  ( / )" value="${esc(state.search)}" autocomplete="off">
        ${state.search&&state.searchOpen?`<div class="search-pop">${members.length?members.map(u=>`<button data-act="open-profile" data-user="${u.username}">${avHtml(u,30)}<span>${esc(displayName(u))}<span class="s" style="display:block;font-size:11px;color:var(--muted)">#${u.username}</span></span></button>`).join(''):'<p class="small muted" style="padding:10px">No mates found</p>'}</div>`:''}
      </div>
      <button class="icon-btn" data-act="theme" title="Theme">${icon(dark?'sun':'moon',17)}</button>
      <div class="bell-wrap"><button class="icon-btn" data-act="bell" style="position:relative">${icon('bell',17)}${un?`<span class="bell-badge">${un>9?'9+':un}</span>`:''}</button>
        ${state.bellOpen?renderBell():''}</div>
      <div class="me-chip" data-act="menu">${avHtml(m,30,isOnline(m))}<span class="n">${esc(m.username)}<span class="r" style="display:block">${m.role==='admin'?'Admin':m.role==='vip'?'VIP':'Member'}</span></span></div>
      ${state.menuOpen?`<div class="pop" style="top:52px">
        <div class="ph">Signed in as ${esc(displayName(m))}</div>
        <button data-act="nav" data-view="profile">${icon('user',15)}My Profile</button>
        <button data-act="nav" data-view="settings">${icon('gear',15)}Settings</button>
        ${canMod(m)?`<button data-act="nav" data-view="members">${icon('shield',15)}Member Control</button>`:''}
        <button class="danger" data-act="signout">${icon('out',15)}Sign Out</button></div>`:''}
    </div>
  </div></div>
  <main class="wrap main">${inner}</main>
  <nav class="bottom-nav">
    ${NAVS.slice(0,5).map(([v,t,i])=>`<button data-act="nav" data-view="${v}" class="${state.view===v?'on':''}">
      ${icon(i,20)}<span>${t}</span>${v==='chat'&&totalChatUnread?`<span class="bell-badge" style="position:absolute;top:0;right:6px">${totalChatUnread>9?'9+':totalChatUnread}</span>`:''}</button>`).join('')}
    <button data-act="nav" data-view="profile" class="${state.view==='profile'?'on':''}">${icon('user',20)}<span>Me</span></button>
  </nav>`;
}
function renderBell(){
  const m=me();const list=DB.notifications.filter(n=>n.userId===m.id).slice(0,12);
  return `<div class="pop" style="width:320px;max-height:400px;overflow:auto">
    <div class="ph" style="display:flex;justify-content:space-between;align-items:center">Notifications
      ${list.length?`<button class="link-btn" data-act="read-all">Mark all read</button>`:''}</div>
    ${list.length?list.map(n=>`<button data-act="notif" style="align-items:flex-start;${n.read?'opacity:.6':''}">
      <span class="ti" style="width:26px;height:26px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:${n.type==='success'?'var(--green-soft)':n.type==='error'?'var(--red-soft)':'var(--sky-soft)'};color:${n.type==='success'?'var(--green)':n.type==='error'?'var(--red)':'var(--sky)'}">${icon(n.type==='success'?'check':n.type==='error'?'x':'info',13)}</span>
      <span style="flex:1">${esc(n.text)}<span style="display:block;font-size:11px;color:var(--muted);margin-top:2px">${fmtAgo(n.at)}</span></span></button>`).join('')
    :'<p class="small muted" style="padding:14px;text-align:center">No notifications yet</p>'}</div>`;
}
