/* ------------------------------ ONLINE ROSTER ------------------------------ */
/* Paste your Firebase web config here to turn the city online.
   Leave it as is and everything still works, just locally on this device. */
const FB_CONFIG = {
  apiKey: "AIzaSyDhqbpAqKSAGAcV8bqqFhhDjiD2A2rExDI",
  authDomain: "optimum-world.firebaseapp.com",
  projectId: "optimum-world",
  storageBucket: "optimum-world.firebasestorage.app",
  messagingSenderId: "439821580967",
  appId: "1:439821580967:web:ea46bb2cccaf3f9075f982"
};
let DB=null, ROSTER=[];
function fbInit(){
  if(!FB_CONFIG.projectId || !window.firebase) return false;
  try{
    if(!firebase.apps.length) firebase.initializeApp(FB_CONFIG);
    DB=firebase.firestore();
    return true;
  }catch(e){ console.warn('firebase off',e); return false; }
}
function docId(nick){
  return encodeURIComponent((nick||'anon').toLowerCase()).replace(/%/g,'_').slice(0,120);
}
/* The local avatar is 1024px. Everyone pulls everyone's portrait, so the copy
   that goes to the database is half that and roughly a quarter of the bytes. */
let PHOTO_NET='', PHOTO_NET_SRC='';
function shrinkPhoto(d,size){
  return new Promise(res=>{
    if(!d) return res('');
    const im=new Image();
    im.onload=()=>{
      const S=Math.min(size, Math.max(im.width,im.height)||size);
      try{
        const c=cvs(S,S), g=c.getContext('2d');
        g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
        g.drawImage(im,0,0,S,S);
        const out=c.toDataURL('image/jpeg',0.84);
        res(out.length<d.length ? out : d);
      }catch(e){ res(d); }
    };
    im.onerror=()=>res(d);
    im.src=d;
  });
}
async function pushMe(){
  if(!DB) return;
  const nick=(profile.nick||'').trim();
  if(!nick) return;
  let photo=profile.photo||'';
  if(photo){
    /* fifty people means fifty portraits over the wire for everyone, so the
       copy that leaves this browser is small. The local one stays 1024. */
    if(PHOTO_NET_SRC!==photo){ PHOTO_NET=await shrinkPhoto(photo,320); PHOTO_NET_SRC=photo; }
    photo=PHOTO_NET||photo;
  }
  try{
    await DB.collection('residents').doc(docId(nick)).set({
      nick: nick.slice(0,18),
      role: profile.role||'newbie',
      bio: (profile.bio||'').slice(0,90),
      x: (profile.x||'').slice(0,15),
      photo: photo.slice(0,700000),
      joined: myJoined(),
      updated: Date.now()
    },{merge:true});
  }catch(e){ console.warn('push failed',e); }
}
/* The day you moved in. Houses are handed out in this order, so a new arrival
   always takes the next empty plot and nobody's address ever changes. */
/* The join date is stored against WHO it was set for. Changing the nick and
   the handle in the same browser is a different person, and they used to
   inherit the first account's date, so a brand new player was written to
   the database as the oldest one on the street and landed at the back. */
function meKey(){ return idKey(profile.nick)+'|'+handleKey(profile.x); }
function sameMe(stored){
  if(!stored) return false;
  const p=stored.split('|'), cn=idKey(profile.nick), cx=handleKey(profile.x);
  return (!!p[0] && p[0]===cn) || (!!p[1] && p[1]===cx);
}
function myJoined(){
  if(profile.joined && profile.joinedFor===undefined){
    profile.joinedFor=meKey(); saveProfile();        // older browsers: adopt as is
  }
  if(profile.joined && sameMe(profile.joinedFor)) return profile.joined;
  /* someone new on this browser: their own record, or today */
  profile.joined=0; profile.joinedFor=meKey();
  /* a fresh browser has no local date, so the one already in the database
     is recovered by nick or by handle — otherwise you would be filed as a
     newcomer and rebuild at the end of a street you have stood on for weeks */
  for(let i=0;i<ROSTER.length;i++)
    if(isMe(ROSTER[i]) && ROSTER[i].joined){ profile.joined=ROSTER[i].joined; break; }
  if(!profile.joined) profile.joined=Date.now();
  profile.joinedFor=meKey();
  saveProfile();
  return profile.joined;
}
let LAST_SEEN=0;
function keepRoster(list){
  for(let i=0;i<list.length;i++) LAST_SEEN=Math.max(LAST_SEEN, list[i].updated||0);
  return list;
}
async function pullRoster(){
  if(!DB) return [];
  try{
    const snap=await DB.collection('residents').orderBy('updated','desc').limit(MAXHOUSES+14).get();
    const out=[];
    snap.forEach(d=>{ const v=d.data(); if(v&&v.nick) out.push(v); });
    return keepRoster(out);
  }catch(e){ console.warn('pull failed',e); return []; }
}
/* Only what changed since the last look, so the minute by minute check costs
   nothing once the world is loaded. */
async function pullSince(){
  if(!DB || !LAST_SEEN) return [];
  try{
    const snap=await DB.collection('residents').where('updated','>',LAST_SEEN).limit(40).get();
    const out=[];
    snap.forEach(d=>{ const v=d.data(); if(v&&v.nick) out.push(v); });
    return keepRoster(out);
  }catch(e){ return []; }
}

/* One plot on the Community street. Called while the world is being built and
   again later if somebody registers while you are walking around. */
/* Lay the whole street out again. Needed exactly once for a new player: the
   street is built the moment the page opens, and a new player's card is
   filled in after that, so without this their house could only be added
   at the far end. Now they take the front plot the moment they register. */
let rebuilding=false, streetFor='';
function rebuildStreet(){
  if(rebuilding || !scene) return;
  rebuilding=true;
  const drop=(arr,items)=>{ if(!items||!items.length) return;
    const s=new Set(items); for(let k=arr.length-1;k>=0;k--) if(s.has(arr[k])) arr.splice(k,1); };
  for(const d of COMMUNITY){
    const o=d._own; if(!o) continue;
    scene.remove(o.g);
    drop(colliders,o.c); drop(spots,o.s); drop(mapItems,o.m);
    drop(plaques,o.p); drop(litWindows,o.w); drop(anims,o.a);
  }
  houseRefs=null;
  buildCommunityList();
  COMMUNITY.forEach((d,i)=>addCommunityHouse(d,i));
  if(renderer) renderer.shadowMap.needsUpdate=true;
  rebuilding=false;
}
function addCommunityHouse(d,i){
  if(d && d.slot!==undefined) i=d.slot;      // the plot it owns, not its array index
  if(i<0 || i>=RESERVE) return false;
  const north=i%2!==0;
  /* the same ROW the scenery is planted against, so a change to the street
     spacing can never leave the trees standing where a house now is */
  /* everything this house registers in the world, so the street can be torn
     down and laid out again without leaving walls or signs behind */
  const mark={c:colliders.length, s:spots.length, m:mapItems.length,
              p:plaques.length, w:litWindows.length, a:anims.length};
  const g=makeBuilding({x:rowX(i), z:north?-ROW.z:ROW.z, yaw:north?0:Math.PI,
    w:17, d:19, h:8+(i%3)*1.5,
    accent: d.guest? roleOf(d.guest.role).c : ((d.res&&d.res.role==='mod')?0x4FA3F7:0xEE6C55),
    data:d, zone:'comm', style:d.style, mine:d.mine?1:0});
  d._own={g:g, c:colliders.slice(mark.c), s:spots.slice(mark.s), m:mapItems.slice(mark.m),
          p:plaques.slice(mark.p), w:litWindows.slice(mark.w), a:anims.slice(mark.a)};
  if(scene && clock){                       // built late: match the shadow pass
    g.traverse(o=>{
      if(!o.isMesh) return;
      o.geometry.computeBoundingSphere();
      const r=o.geometry.boundingSphere ? o.geometry.boundingSphere.radius : 0;
      o.castShadow = r>0.85; o.receiveShadow = true;
    });
    renderer.shadowMap.needsUpdate=true;
  }
  TOTAL=12+COMMUNITY.length;
  return true;
}

/* Whatever this browser holds is the truth about you. If the roster copy is
   missing a photo or is otherwise behind, send it up once on load. */
function syncMe(){
  if(!DB) return;
  const nick=(profile.nick||'').trim();
  if(!nick) return;
  let me=null;
  for(let i=0;i<ROSTER.length;i++) if(idKey(ROSTER[i].nick)===idKey(nick)){ me=ROSTER[i]; break; }
  const behind = !me
    || (!!profile.photo && !me.photo)
    || (me.bio||'')!==((profile.bio||'').slice(0,90))
    || (me.x||'')!==((profile.x||'').slice(0,15))
    || (me.role||'newbie')!==(profile.role||'newbie');
  if(behind) pushMe();
}

/* People edit their avatar after the world was built, so pull the roster again
   now and then and swap the portrait on the wall in place. */
async function refreshRoster(){
  if(!DB || !COMMUNITY.length) return;
  /* If the first pull timed out there is no watermark to ask from, so take the
     whole roster again instead of waiting forever on an empty delta. */
  const full = !LAST_SEEN || !ROSTER.length;
  let list=null;
  try{ list = full ? await pullRoster() : await pullSince(); }catch(e){ return; }
  if(!list || !list.length) return;
  list.forEach(v=>{
    let known=false;
    for(let i=0;i<ROSTER.length;i++)
      if(idKey(ROSTER[i].nick)===idKey(v.nick)){ ROSTER[i]=v; known=true; break; }
    if(!known) ROSTER.push(v);
    if(alreadyHoused(v) || !fullRecord(v)) return;
    if(isMe(v)) return;                          // never a second house for you
    /* he may have filled his card in, or changed his nick since the build:
       match on the handle as well so one person never gets two plots */
    for(let i=0;i<COMMUNITY.length;i++){
      const g=COMMUNITY[i].guest; if(!g) continue;
      if(idKey(g.nick)===idKey(v.nick)) return;
      const gx=handleKey(g.x), vx=handleKey(v.x);
      if(gx && gx===vx) return;
    }
    /* Nothing is built mid-walk. Every house already standing is on its
       plot, and the newcomer's plot is the front one, which is taken until
       the row is laid out again. They appear there on the next load. */
    return;
  });
  for(let i=0;i<COMMUNITY.length;i++){
    const d=COMMUNITY[i];
    if(d.mine) continue;              // your own card is local and newer
    let v=null;
    if(d.guest){
      const k=idKey(d.guest.nick);
      for(let j=0;j<list.length;j++) if(idKey(list[j].nick)===k){ v=list[j]; break; }
      if(v) d.guest=v;
    } else if(d.res){
      v=liveFor(d.res);
      d.live=v;
    }
    const img=(v&&v.photo)||'';
    if(d.face && img && img!==d.shownImg){
      d.shownImg=img;
      d.face.material.map=sharpTex(img,640);
      d.face.material.needsUpdate=true;
    }
  }
}
