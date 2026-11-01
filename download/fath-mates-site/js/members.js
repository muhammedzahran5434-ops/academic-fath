/* ─────────── members admin ─────────── */
let mSearch='';
function renderMembers(){
  const m=me();
  const list=DB.users.filter(u=>!mSearch||displayName(u).toLowerCase().includes(mSearch.toLowerCase())||u.username.toLowerCase().includes(mSearch.toLowerCase()))
    .sort((a,b)=>(a.role==='admin'?-1:0)-(b.role==='admin'?-1:0)||a.username.localeCompare(b.username,undefined,{numeric:true}));
  return `<div class="phead"><div class="row"><div><div class="kick">Control panel</div><h1>Members</h1>
    <p>${isAdmin(m)?'Full control — VIP, disable, reset, delete and admissions.':'VIP powers — disable accounts, reset passwords and approve awards.'}</p></div>
    ${isAdmin(m)?`<button class="btn btn-primary" data-act="add-admission">${icon('plus',16)} Add Admission</button>`:''}</div></div>
  <div class="card" style="margin-bottom:14px;padding:12px 14px;display:flex;gap:10px;align-items:center">
    <span class="muted">${icon('search',16)}</span>
    <input class="input" id="m-search" placeholder="Search by name or admission number…" value="${esc(mSearch)}" style="border:0;background:transparent;padding:6px 2px;box-shadow:none">
    <span class="chip">${list.length} / ${DB.users.length}</span></div>
  <div class="card pad">
    ${list.map(u=>`<div class="mrow">
      ${avHtml(u,42,isOnline(u))}
      <div class="info"><span class="n">${esc(displayName(u))}
        ${u.role==='admin'?'<span class="badge b-admin">Admin</span>':u.role==='vip'?'<span class="badge b-vip">VIP</span>':''}
        ${u.disabled?'<span class="badge b-off">Disabled</span>':''}
        ${!u.fullName&&u.role==='member'?'<span class="badge b-muted">Not activated</span>':''}</span>
        <span class="s">#${esc(u.username)} · ${pointsOf(u.id)} pts · ${u.onlineAt?'last seen '+fmtAgo(u.onlineAt):'never online'}</span></div>
      <div class="mactions">
        <button class="btn" data-act="open-profile" data-user="${esc(u.username)}" style="width:auto">${icon('eye',13)} View</button>
        ${u.id!==m.id&&u.role!=='admin'?`
          ${isAdmin(m)?(u.role==='vip'
            ?`<button class="btn" data-act="un-vip" data-id="${u.id}" style="width:auto">${icon('gem',13)} Remove VIP</button>`
            :`<button class="btn" data-act="make-vip" data-id="${u.id}" style="width:auto">${icon('gem',13)} Make VIP</button>`):''}
          <button class="btn ${u.disabled?'':'btn-danger'}" data-act="${u.disabled?'enable-user':'disable-user'}" data-id="${u.id}" style="width:auto">${icon(u.disabled?'check':'ban',13)} ${u.disabled?'Enable':'Disable'}</button>
          <button class="btn" data-act="reset-pass" data-id="${u.id}" style="width:auto">${icon('key',13)} Reset</button>
          ${isAdmin(m)?`<button class="btn btn-danger" data-act="del-user" data-id="${u.id}" style="width:auto">${icon('trash',13)} Delete</button>`:''}`:''}
      </div></div>`).join('')}
  </div>`;
}
function openAdmissionModal(){
  openModal(`<div class="sh"><h3>Add Admission Number</h3><button class="btn-ghost btn-icon" data-act="close-modal">${icon('x')}</button></div>
    <label class="lbl">Admission number</label><input class="input" id="ad-no" placeholder="e.g. 850">
    <p class="small muted" style="margin-top:10px">The member can then sign in with password <b>adno@fath</b> (e.g. 850@fath) and change it in Settings.</p>
    <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:18px"><button class="btn btn-primary" data-act="save-admission">Create account</button></div>`);
}
async function saveAdmission(){
  const no=$('#ad-no').value.trim();
  if(!no)return toast('Enter an admission number','warning');
  if(userByUn(no))return toast('That admission number already exists','error');
  DB.users.push({id:uid(),username:no,password:await hashPassword(no+'@fath'),role:'member',disabled:false,fullName:'',dob:'',klass:'',guardian:'',phone:'',address:'',bio:'',photoId:'',avatarColor:avatarColorFor(no),onlineAt:'',vipSince:'',createdAt:nowISO()});
  saveDB();closeModal();renderApp();toast('Admission '+no+' added — default password '+no+'@fath','success');
}

/* ─────────── media vault ─────────── */
function renderMedia(){
  const m=me(),files=DB.files;
  const imgs=files.filter(f=>f.kind==='image'),vids=files.filter(f=>f.kind==='video'),docs=files.filter(f=>f.kind==='file');
  return `<div class="phead"><div class="row"><div><div class="kick">Moderation</div><h1>Media Vault</h1><p>Every photo, video and file shared across campus.</p></div></div></div>
  <div class="tiles" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px">
    <div class="tile"><span class="tv">Photos</span><div class="tn mono">${imgs.length}</div></div>
    <div class="tile"><span class="tv">Videos</span><div class="tn mono">${vids.length}</div></div>
    <div class="tile"><span class="tv">Files</span><div class="tn mono">${docs.length}</div></div></div>
  ${files.length?`<div class="mgrid">${files.map(f=>{const up=userById(f.uploader);return `<div class="card mcard">
    <div class="prev">${f.kind==='image'?`<img data-media="${f.id}">`:f.kind==='video'?`<span style="color:var(--primary)">${icon('play',34)}</span>`:`<span>${icon('file',34)}</span>`}</div>
    <div class="meta"><b title="${esc(f.name)}">${esc(f.name)}</b>
      <span class="small muted">${f.kind} · ${fmtSize(f.size)}${up?' · '+esc(displayName(up)):''}</span>
      <div style="display:flex;gap:6px;margin-top:9px">
        <a class="btn" style="width:auto;padding:6px 10px;font-size:12px" data-dl="${f.id}" href="#" onclick="return false">${icon('down',13)} Save</a>
        <button class="btn btn-danger" style="width:auto;padding:6px 10px;font-size:12px" data-act="vault-del" data-id="${f.id}">${icon('trash',13)}</button></div>
    </div></div>`}).join('')}</div>`
  :`<div class="card empty">${icon('film',26)}<b>Vault is empty</b><p>Shared media will collect here.</p></div>`}`;
}

/* ─────────── academic / CCE ─────────── */
function renderAcademic(){
  const m=me();
  if(!canMod(m)){
    const rows=DB.subjects.map(s=>{
      const mk=DB.marks.find(x=>x.userId===m.id&&x.subjectId===s.id);
      const val=mk&&mk.marks!=null?mk.marks:null;
      const pct=val!=null?Math.round(val/s.max*100):null;
      const g=pct!=null?gradeOf(pct):null;
      return{s,val,pct,g}});
    return `<div class="phead"><div class="kick">CCE progress</div><h1>Academic</h1><p>Your continuous evaluation marks.</p></div>
    <div class="card pad"><table class="tbl"><tr><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th></tr>
      ${rows.map(({s,val,pct,g})=>`<tr><td><b>${esc(s.name)}</b></td><td class="mono">${val??'—'}</td><td class="mono muted">${s.max}</td>
      <td class="mono">${pct!=null?pct+'%':'—'}</td><td class="${g?g[1]:''}">${g?g[0]:'—'}</td></tr>`).join('')}</table></div>
    <p class="small muted" style="margin-top:10px">Marks are entered by moderators and approved by the office.</p>`;
  }
  const s=DB.subjects.find(x=>x.id===state.acSubject)||DB.subjects[0];
  const members=DB.users.filter(u=>u.role!=='admin').sort((a,b)=>a.username.localeCompare(b.username,undefined,{numeric:true}));
  return `<div class="phead"><div class="kick">CCE marks</div><h1>Academic</h1><p>Enter continuous evaluation marks per subject.</p></div>
  <div class="filters" style="margin-bottom:14px">${DB.subjects.map(x=>`<button class="chip ${s.id===x.id?'on':''}" data-act="ac-subject" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>
  <div class="card pad"><table class="tbl"><tr><th>Member</th><th>Marks (max ${s.max})</th><th>%</th><th>Grade</th></tr>
    ${members.map(u=>{const mk=DB.marks.find(x=>x.userId===u.id&&x.subjectId===s.id);
      const pending=mk&&mk.pending!=null?mk.pending:null;const val=mk&&mk.marks!=null?mk.marks:null;
      const shown=val!=null?val:pending;const pct=shown!=null?Math.round(shown/s.max*100):null;const g=pct!=null?gradeOf(pct):null;
      return `<tr><td><b>${esc(displayName(u))}</b> <span class="muted small">#${esc(u.username)}${pending!=null&&val==null?' <span class="badge b-pending">pending</span>':''}</span></td>
      <td><input type="number" min="0" max="${s.max}" value="${shown!=null?shown:''}" data-mark="${u.id}" data-sub="${s.id}"></td>
      <td class="mono">${pct!=null?pct+'%':'—'}</td><td class="${g?g[1]:''}">${g?g[0]:'—'}</td></tr>`}).join('')}
  </table>
  <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" data-act="save-marks">${icon('check',15)} Save marks</button></div></div>`;
}
function saveMarks(){
  const inputs=$$('[data-mark]');
  for(const inp of inputs){
    const uidn=inp.dataset.mark,sid=inp.dataset.sub,v=inp.value.trim();
    let mk=DB.marks.find(x=>x.userId===uidn&&x.subjectId===sid);
    if(v===''){continue}
    let mkObj=mk;
    if(!mk){mkObj={id:uid(),userId:uidn,subjectId:sid,marks:null,pending:null};DB.marks.push(mkObj)}
    mkObj.pending=Number(v);
    notify(uidn,'Your CCE marks were updated','info');
  }
  saveDB();renderApp();toast('Marks saved — visible to members once finalised by the office','success');
}

/* ─────────── profile ─────────── */
let pfSkills={n:'',l:3};
function renderProfile(){
  const m=me();
  const target=state.profileOf?userByUn(state.profileOf):null;
  const u=target||m;const own=u.id===m.id;
  const skills=DB.skills.filter(s=>s.userId===u.id);
  const awards=DB.achievements.filter(a=>a.userId===u.id&&a.status==='approved');
  const posts=DB.posts.filter(p=>p.userId===u.id);
  return `<div class="phead"><div class="row"><div><div class="kick">${own?'Your profile':displaySafe(u.username)+' profile'}</div><h1>${esc(displayName(u))||('#'+esc(u.username))}</h1>
    <p>${own?'How mates see you on campus.':'Member profile'}</p></div>
    ${own?`<button class="btn ${state.editMode?'':'btn-primary'}" data-act="edit-own">${icon('edit',15)} ${state.editMode?'Close editor':'Edit profile'}</button>`:''}</div></div>
  <div class="card pad" style="margin-bottom:16px"><div class="pf-head">
    <span data-act="${own?'change-photo':'noop'}" style="cursor:${own?'pointer':'default'};position:relative">
      ${avHtml(u,92,isOnline(u))}
      ${own?`<span style="position:absolute;right:-4px;bottom:-4px;width:30px;height:30px;border-radius:50%;background:var(--grad2);color:#fff;display:flex;align-items:center;justify-content:center;border:2.5px solid var(--card)">${icon('camera',14)}</span>`:''}</span>
    <div style="flex:1;min-width:220px">
      <div class="nm">${esc(displayName(u))||'<span class="muted">Unnamed member</span>'}
        ${u.role==='admin'?'<span class="badge b-admin">Admin</span>':u.role==='vip'?'<span class="badge b-vip">VIP</span>':''}
        ${u.disabled?'<span class="badge b-off">Disabled</span>':''}</div>
      <div class="sub">Admission #${esc(u.username)} · joined ${fmtDate(u.createdAt)}</div>
      ${u.bio?`<p style="margin-top:8px;font-size:14px">${esc(u.bio)}</p>`:''}
      <div class="pf-meta">
        ${u.klass?`<span class="chip">${icon('users',13)} ${esc(u.klass)}</span>`:''}
        ${u.dob?`<span class="chip">${icon('cal',13)} ${esc(u.dob)}</span>`:''}
        ${u.phone?`<span class="chip">${icon('phone',13)} ${esc(u.phone)}</span>`:''}
        ${u.address?`<span class="chip">${icon('pin',13)} ${esc(u.address)}</span>`:''}
        ${u.guardian?`<span class="chip">${icon('shield',13)} Guardian: ${esc(u.guardian)}</span>`:''}
      </div></div>
    <div style="display:flex;gap:10px">
      <div class="kv"><b class="mono">${pointsOf(u.id)}</b><span>Points</span></div>
      <div class="kv"><b class="mono">#${rankOf(u.id)}</b><span>Rank</span></div>
      <div class="kv"><b class="mono">${posts.length}</b><span>Posts</span></div></div>
  </div></div>
  ${state.editMode&&own?renderEditProfile(u):''}
  <div class="grid2">
    <div><div class="sect-h"><h3>Skills</h3>${own?`<button class="link-btn" data-act="add-skill">${icon('plus',13)} Add skill</button>`:''}</div>
      <div class="card pad">${skills.length?skills.map(s=>`<div class="skillrow">
        <span class="av" style="width:34px;height:34px;background:var(--primary-soft);color:var(--primary)">${icon('target',15)}</span>
        <span style="flex:1"><b style="font-size:13.5px">${esc(s.name)}</b>
          <span class="bars" style="display:flex;margin-top:5px">${[1,2,3,4,5].map(i=>`<i class="${i<=s.level?'on':''}"></i>`).join('')}</span></span>
        ${own?`<button class="btn-ghost btn-icon" data-act="del-skill" data-id="${s.id}">${icon('trash',14)}</button>`:''}</div>`).join('')
      :`<div class="empty" style="padding:26px">${icon('target',22)}<b>No skills yet</b><p>${own?'Add talents like calligraphy, football, recitation…':'This member has not added skills.'}</p></div>`}</div></div>
    <div><div class="sect-h"><h3>Approved achievements</h3></div>
      <div class="card pad">${awards.length?awards.map(a=>`<div class="rowline">
        <span class="av" style="width:32px;height:32px;background:${catColor(a.category)};color:#fff">${icon(catIcon(a.category),14)}</span>
        <span style="flex:1;min-width:0"><span class="n">${esc(a.title)}</span><span class="s" style="display:block">${esc(a.category)} · ${fmtDate(a.at)}</span></span>
        <b class="mono" style="color:var(--primary)">+${a.points}</b></div>`).join('')
      :`<p class="small muted" style="padding:6px 2px">No approved achievements yet.</p>`}</div></div>
  </div>`;
}
function displaySafe(s){return esc(s)}
function renderEditProfile(u){
  return `<div class="card pad" style="margin-bottom:16px" id="edit-card">
    <div class="sect-h"><h3>Edit profile</h3></div>
    <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
      <div><label class="lbl">Full name</label><input class="input" id="ep-name" value="${esc(u.fullName||'')}" placeholder="Your full name"></div>
      <div><label class="lbl">Date of birth</label><input class="input" id="ep-dob" type="date" value="${esc(u.dob||'')}"></div>
      <div><label class="lbl">Class</label><input class="input" id="ep-klass" value="${esc(u.klass||'')}" placeholder="e.g. 10-A"></div>
      <div><label class="lbl">Guardian</label><input class="input" id="ep-guardian" value="${esc(u.guardian||'')}" placeholder="Guardian name"></div>
      <div><label class="lbl">Phone</label><input class="input" id="ep-phone" value="${esc(u.phone||'')}" placeholder="Phone number"></div>
      <div><label class="lbl">Address</label><input class="input" id="ep-address" value="${esc(u.address||'')}" placeholder="Home address"></div>
    </div>
    <div style="margin-top:12px"><label class="lbl">Bio</label><textarea class="input" id="ep-bio" style="min-height:64px" placeholder="A line about you…">${esc(u.bio||'')}</textarea></div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" data-act="save-profile">${icon('check',15)} Save profile</button></div></div>`;
}

/* ─────────── settings ─────────── */
let setN1=false,setN2=false;
function renderSettings(){
  const m=me(),dark=document.documentElement.classList.contains('dark');
  return `<div class="phead"><div class="kick">Preferences</div><h1>Settings</h1><p>Make FATH MATES yours.</p></div>
  <div class="grid2">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card pad">
        <div class="sect-h"><h3>Appearance</h3></div>
        <div class="rowline"><span class="av" style="width:36px;height:36px;background:${dark?'var(--amber-soft)':'var(--primary-soft)'};color:${dark?'var(--amber)':'var(--primary)'}">${icon(dark?'moon':'sun',16)}</span>
          <span style="flex:1"><b class="n" style="font-size:14px">Dark mode</b><span class="s" style="display:block">Easier on the eyes at night</span></span>
          <button class="btn ${dark?'btn-primary':''}" data-act="theme" style="width:auto">${dark?'On':'Off'}</button></div>
      </div>
      <div class="card pad">
        <div class="sect-h"><h3>Change password</h3></div>
        <form data-form="change-pass">
          <label class="lbl">Current password</label>
          <div class="pass-wrap"><input class="input" id="cp-1" type="${setN1?'text':'password'}" style="padding-right:42px" autocomplete="current-password">
            <button type="button" class="pe" data-act="toggle-cp" data-t="1">${icon(setN1?'eyeoff':'eye',16)}</button></div>
          <label class="lbl" style="margin-top:12px">New password (min 6 characters)</label>
          <div class="pass-wrap"><input class="input" id="cp-2" type="${setN2?'text':'password'}" style="padding-right:42px" autocomplete="new-password">
            <button type="button" class="pe" data-act="toggle-cp" data-t="2">${icon(setN2?'eyeoff':'eye',16)}</button></div>
          <button class="btn btn-primary" style="margin-top:14px">${icon('key',15)} Update password</button>
        </form>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card pad">
        <div class="sect-h"><h3>Your account</h3></div>
        <div class="rowline">${avHtml(m,40,isOnline(m))}<span style="flex:1"><b class="n">${esc(displayName(m))}</b><span class="s" style="display:block">Admission #${esc(m.username)}</span></span></div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn" data-act="nav" data-view="profile" style="width:auto">${icon('user',14)} Profile</button>
          <button class="btn btn-danger" data-act="signout" style="width:auto">${icon('out',14)} Sign Out</button></div>
      </div>
      <div class="card pad small muted" style="display:flex;flex-direction:column;gap:9px">
        <b style="color:var(--text);font-size:14px">About this file</b>
        <span style="display:flex;gap:9px">${icon('info',14)} Single HTML file — HTML, CSS and JS all inside.</span>
        <span style="display:flex;gap:9px">${icon('shield',14)} All data stays in THIS browser on THIS device.</span>
        <span style="display:flex;gap:9px">${icon('users',14)} 33 seeded accounts — admin and 32 admission numbers.</span>
      </div>
    </div>
  </div>`;
}
