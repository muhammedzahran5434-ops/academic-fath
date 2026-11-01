/* ═══════════ firebase live sync (Firestore) ═══════════ */
function softRender(){
  const app=$('#app'),a=document.activeElement;
  let sel='',val='';
  if(a&&app.contains(a)&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')){
    val=a.value;
    if(a.id)sel='#'+CSS.escape(a.id);
    else{const parts=[];let el=a;
      while(el&&el!==app){let s=el.tagName.toLowerCase();
        if(el.classList&&el.classList.length)s+='.'+[...el.classList].slice(0,2).join('.');
        const sibs=el.parentElement?[...el.parentElement.children].filter(x=>x.tagName===el.tagName):[];
        if(sibs.length>1)s+=':nth-of-type('+(sibs.indexOf(el)+1)+')';
        parts.unshift(s);el=el.parentElement}
      sel=parts.join('>')}
  }
  renderApp(true);
  if(sel){try{const n=app.querySelector(sel);if(n){n.value=val;n.focus();try{n.setSelectionRange(val.length,val.length)}catch(e){}}}catch(e){}}
}
var FMS=(function(){
  const COLS=['users','posts','stories','messages','achievements','announcements','notifications','skills','subjects','marks','files'];
  const CN=c=>'fm_'+c;
  const J=o=>JSON.stringify(o);
  const clone=o=>{try{return JSON.parse(JSON.stringify(o))}catch(e){return null}};
  let last={},timer=0,live=false;
  const ready=()=>!!(window.FBS&&window.FBS.db);
  const waitReady=ms=>new Promise(res=>{const t0=Date.now();(function chk(){if(ready())return res(true);if(Date.now()-t0>ms)return res(false);setTimeout(chk,100)})()});
  function dot(){const d=$('#sync-dot');if(d)d.className='sync-dot '+(live?'on':'off')}
  function keepable(c,d){return !!d&&d.id!==undefined&&(c!=='files'||(typeof d.data==='string'&&d.data.length>0&&d.data.length<14e5))}
  function curMaps(){const out={};for(const c of COLS){const m={};for(const it of (DB[c]||[])){const cl=clone(it);if(cl&&keepable(c,cl))m[cl.id]=cl}out[c]=m}return out}
  function schedule(){if(!ready()||!DB)return;clearTimeout(timer);timer=setTimeout(push,900)}
  async function commit(sets,dels){
    const {db,doc,writeBatch}=window.FBS;
    for(const[c,pairs]of sets){for(let i=0;i<pairs.length;i+=400){const b=writeBatch(db);pairs.slice(i,i+400).forEach(([k,v])=>b.set(doc(db,CN(c),k),v));await b.commit()}}
    for(const[c,ids]of dels){for(let i=0;i<ids.length;i+=400){const b=writeBatch(db);ids.slice(i,i+400).forEach(k=>b.delete(doc(db,CN(c),k)));await b.commit()}}
  }
  async function push(){
    if(!ready()||!DB)return;
    try{
      const cur=curMaps();const sets=[],dels=[];
      for(const c of COLS){
        const prev=last[c]||{};const s=[],d=[];
        for(const k of Object.keys(cur[c]))if(J(prev[k])!==J(cur[c][k]))s.push([k,cur[c][k]]);
        for(const k of Object.keys(prev))if(!cur[c][k])d.push(k);
        last[c]=cur[c];
        if(s.length)sets.push([c,s]);if(d.length)dels.push([c,d]);
      }
      await commit(sets,dels);
      live=true;dot();
    }catch(e){live=false;dot();schedule()}
  }
  async function pushAll(){last={};await push()}
  function subscribe(){
    const {db,collection,onSnapshot}=window.FBS;let pt=0;
    const paint=()=>{if(pt)return;pt=setTimeout(()=>{pt=0;try{if(me()&&DB)softRender()}catch(e){}},280)};
    COLS.forEach(c=>{
      onSnapshot(collection(db,CN(c)),snap=>{
        if(!DB)return;live=true;dot();
        const arr=DB[c];
        for(const ch of snap.docChanges()){
          const id=ch.doc.id;
          if(ch.type==='removed'){
            const i=arr.findIndex(x=>x.id===id);
            if(i>-1)arr.splice(i,1);
            if(last[c])delete last[c][id];
          }else{
            const d=ch.doc.data();
            if(last[c])last[c][id]=d;
            if(!keepable(c,d))continue;
            const i=arr.findIndex(x=>x.id===id);
            if(i>-1)arr[i]=d;else arr.unshift(d);
          }
        }
        try{LS.set(DBK,JSON.stringify(DB))}catch(e){}
        if(c!=='users')paint();
      },()=>{live=false;dot()});
    });
  }
  async function bootSync(){
    const {db,doc,getDocs,collection,runTransaction}=window.FBS;
    const remote={};
    await Promise.all(COLS.map(async c=>{
      const snap=await getDocs(collection(db,CN(c)));const m={};
      snap.forEach(d=>{const v=d.data();if(keepable(c,v))m[d.id]=v});
      remote[c]=m;
    }));
    let seededByMe=false;
    if(!remote.users||!Object.keys(remote.users).length){
      try{
        await runTransaction(db,async tx=>{
          const ref=doc(db,'fm_meta','seeded');const s=await tx.get(ref);
          if(!s.exists()){tx.set(ref,{at:new Date().toISOString()});seededByMe=true}
        });
      }catch(e){seededByMe=false}
      if(seededByMe){if(!DB)await ensureSeed();await pushAll()}
    }
    if(!DB)DB={v:1,users:[],posts:[],stories:[],messages:[],achievements:[],announcements:[],notifications:[],skills:[],subjects:[],marks:[],files:[],sessions:{}};
    for(const c of COLS){
      const r=remote[c]||{};const loc=new Map((DB[c]||[]).map(x=>[x.id,x]));
      let merged=[];
      for(const k of Object.keys(r)){merged.push(r[k]);loc.delete(k)}
      for(const [id,x] of loc){const cl=clone(x);if(keepable(c,cl))merged.push(cl)}
      if(c==='users'){
        const byUn=new Map();
        for(const u of (DB[c]||[]))if(u&&u.username)byUn.set(u.username,u);
        for(const u of merged)if(u&&u.username&&!byUn.has(u.username))byUn.set(u.username,u);
        merged=[...byUn.values()];
      }
      DB[c]=merged;
    }
    if(seededByMe)last=curMaps();
    else{last={};for(const c of COLS){last[c]={};const r=remote[c]||{};for(const k of Object.keys(r))if(keepable(c,r[k]))last[c][k]=r[k]}}
    try{LS.set(DBK,JSON.stringify(DB))}catch(e){}
    subscribe();
    live=true;dot();
  }
  return{waitReady,bootSync,schedule,push,dot,offline(){live=false;dot()}};
})();
