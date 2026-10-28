/* ------------------------------ PROFILE + AVATAR ------------------------------ */
const store={
  async get(k){
    try{ if(window.storage&&window.storage.get){ const r=await window.storage.get(k); return r?r.value:null; } }catch(e){}
    try{ return localStorage.getItem(k); }catch(e){}
    return (window.__mem||{})[k]||null;
  },
  async set(k,v){
    try{ if(window.storage&&window.storage.set){ await window.storage.set(k,v); return; } }catch(e){}
    try{ localStorage.setItem(k,v); return; }catch(e){}
    window.__mem=window.__mem||{}; window.__mem[k]=v;
  }
};
let profile={nick:'',photo:null,role:'newbie',bio:'',x:''};
const PKEY='optimum-world:profile';
async function loadProfile(){
  const raw=await store.get(PKEY);
  if(raw){ try{ profile=JSON.parse(raw)||profile; }catch(e){} }
  if(profile.nick) $('nickInput').value=profile.nick;
  if(profile.photo) showPrev(profile.photo);
  if(profile.bio) $('bioInput').value=profile.bio;
  if(profile.x) $('xInput').value=profile.x;
  buildRoleRow();
}
function buildRoleRow(){
  const row=$('roleRow'); if(!row) return;
  row.innerHTML='';
  ROLES.forEach(r=>{
    const b=document.createElement('button');
    b.innerHTML='<i style="background:'+(r.g? 'linear-gradient(135deg,'+r.g[0]+','+r.g[1]+')' : hx(r.c))+'"></i>'+roleLabel(r.id);
    b.className = profile.role===r.id ? 'on' : '';
    b.addEventListener('click',()=>{
      profile.role=r.id; saveProfile(); pushMe(); buildRoleRow(); refreshHouse();
    });
    row.appendChild(b);
  });
}
function cleanHandle(v){
  let h=(v||'').trim();
  h=h.replace(/^https?:\/\//i,'').replace(/^www\./i,'');
  h=h.replace(/^(twitter\.com|x\.com|mobile\.twitter\.com)\//i,'');
  h=h.split(/[?#]/)[0].split('/')[0];
  h=h.replace(/^@+/,'').replace(/[^A-Za-z0-9_]/g,'');
  return h.slice(0,15);
}
function saveProfile(){ try{ store.set(PKEY, JSON.stringify(profile)); }catch(e){} }
function showPrev(d){ $('avatarPrev').innerHTML='<img src="'+d+'" alt="">'; }
function fileToSquare(file,size){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{
      const im=new Image();
      im.onload=()=>{
        const m=Math.min(im.width,im.height);
        // never upscale a small source, never waste bytes on a huge one
        const S=Math.max(320,Math.min(size,m));
        const c=cvs(S,S), g=c.getContext('2d');
        g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
        g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,S,S);
        res(c.toDataURL('image/jpeg',0.94));
      };
      im.onerror=rej; im.src=r.result;
    };
    r.onerror=rej; r.readAsDataURL(file);
  });
}
function nickTexture(nick){
  const c=cvs(512,128), g=c.getContext('2d');
  const txt=(nick||'anon');
  g.font='800 54px ui-sans-serif, Helvetica, Arial';
  const w=Math.min(496, g.measureText(txt).width+72), x=(512-w)/2;
  g.fillStyle='rgba(40,44,52,0.94)';
  if(g.roundRect){ g.beginPath(); g.roundRect(x,24,w,80,40); g.fill(); } else g.fillRect(x,24,w,80);
  g.fillStyle='#FFFBFB'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText(txt,256,64);
  return tex(c);
}
let avatar=null, aParts=null;
function buildAvatar(){
  if(avatar){ scene.remove(avatar); }
  const g=new THREE.Group(); g.scale.setScalar(0.82); g.visible=false; scene.add(g);
  const shirt=new THREE.MeshLambertMaterial({color:0x51B1FE});
  const pants=new THREE.MeshLambertMaterial({color:0x33363C});
  const skin =new THREE.MeshLambertMaterial({color:0xE0BA92});
  B(g,0.68,0.98,0.38,shirt,0,1.44,0,false,true);
  let faceMat=skin;
  if(profile.photo){
    const t=photoTex(profile.photo);
    faceMat=new THREE.MeshLambertMaterial({map:t});
  }
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.64,0.64,0.6),[skin,skin,skin,skin,faceMat,skin]);
  head.position.set(0,2.2,0); g.add(head); outline(g,head);
  if(!profile.photo) B(g,0.68,0.16,0.64,new THREE.MeshLambertMaterial({color:0x33363C}),0,2.48,0,false,false);
  const mk=(px,py)=>{ const q=new THREE.Group(); q.position.set(px,py,0); g.add(q); return q; };
  const armL=mk(-0.46,1.88), armR=mk(0.46,1.88), legL=mk(-0.18,1.0), legR=mk(0.18,1.0);
  B(armL,0.22,0.86,0.26,shirt,0,-0.43,0,false,true);
  B(armR,0.22,0.86,0.26,shirt,0,-0.43,0,false,true);
  B(legL,0.26,1.0,0.3,pants,0,-0.5,0,false,true);
  B(legR,0.26,1.0,0.3,pants,0,-0.5,0,false,true);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:nickTexture(profile.nick),transparent:true,depthTest:false}));
  spr.position.set(0,2.7,0); spr.scale.set(1.4,0.35,1); g.add(spr);
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  avatar=g; aParts={armL,armR,legL,legR,spr};
  applyWear();      // what you own and have chosen to wear
  if(HELD){ const k=HELD; HELD=null; equip(k); }   // re-attach whatever is in hand
}
let photoMode=false, photoPov=false, photoDist=1.55, povZoom=1, camBack=0, pendingShot=false, zoneName='Crossroads';
function setPhoto(on){
  if(!avatar) buildAvatar();
  /* on a phone the avatar fills half the frame, so open straight into camera */
  if(on && isTouch) photoPov=true;
  photoMode=on; avatar.visible=on&&!photoPov;
  const pb=$('pbPov');
  if(pb){ pb.textContent = photoPov? tr('selfieMode') : tr('povMode');
          pb.className = photoPov? 'pbMain' : 'pbGhost'; }
  $('photoBar').style.display=on?'flex':'none';
  if(on) freeCursor();
  $('stick').style.display=(on||!isTouch)?'none':'block';
  setPhotoHint(); updateVF();
  if(!on){ povZoom=1; camera.fov=66; camera.updateProjectionMatrix(); }
  if(on && document.pointerLockElement) document.exitPointerLock();
  if(!on && !isTouch && renderer && !uiOpen()) renderer.domElement.requestPointerLock();
  $('photoBtn').style.display=on?'none':'flex';
  if(isTouch) $('runBtn').style.display=on?'none':'flex';
  $('menuBtn').style.display=on?'none':'flex';
  jrnShow(!on);
  $('viewBtn').style.display=(on||!isTouch)?'none':'flex';
  $('mini').style.display=on?'none':'block';
  $('act').style.display=(!on&&isTouch)?'flex':'none';
  $('hud').style.opacity=on?'0':'1';
  $('sndBtn').style.display=on?'none':'flex';
  $('langBtn').style.display=on?'none':'flex';
  $('prog').style.display=on?'none':'block';
  $('prompt').style.display='none';
  updateHitBtn();
}
function updateVF(){
  const on = photoMode && photoPov;
  $('vf').className = on ? 'on' : '';
  if(!on) return;
  $('vfZoom').textContent = povZoom.toFixed(1)+'x';
  $('vfMode').textContent = 'POV';
  $('vfIso').textContent = (PHASE==='night'||PHASE==='dusk') ? 'ISO 1600' : 'ISO 200';
}
function flash(){
  const f=$('flash');
  f.style.transition='none'; f.style.opacity='0.85';
  requestAnimationFrame(()=>{ f.style.transition='opacity .3s'; f.style.opacity='0'; });
}
function setPhotoHint(){
  const base = photoPov ? tr('hintPov') : (isTouch? tr('hintTouch') : tr('hintDesk'));
  $('photoHint').textContent = base + '  \u00B7  ' + (isTouch? tr('hintBack') : tr('hintKeys'));
}
function composeShot(){
  const src=renderer.domElement;
  const c=document.createElement('canvas'); c.width=src.width; c.height=src.height;
  const g=c.getContext('2d');
  g.drawImage(src,0,0);
  const W=c.width, H=c.height, bar=Math.max(54,Math.round(H*0.082));
  const gr=g.createLinearGradient(0,H-bar*1.9,0,H);
  gr.addColorStop(0,'rgba(40,44,52,0)'); gr.addColorStop(1,'rgba(40,44,52,0.88)');
  g.fillStyle=gr; g.fillRect(0,H-bar*1.9,W,bar*1.9);
  g.textBaseline='middle';
  g.fillStyle='#FFFBFB'; g.textAlign='left';
  g.font='800 '+Math.round(bar*0.40)+'px ui-sans-serif, Helvetica, Arial';
  const ly=H-bar*0.62;
  let lx=bar*0.55;
  if(LOGOIMG && LOGOIMG.complete && LOGOIMG.naturalWidth){
    const lh=Math.round(bar*0.44), lw=Math.round(lh*(LOGOIMG.naturalWidth/LOGOIMG.naturalHeight));
    g.drawImage(LOGOIMG, lx, ly-lh/2, lw, lh);
    lx+=lw+bar*0.20;
  } else {
    g.fillText('OPTIMUM', lx, ly);
    lx+=g.measureText('OPTIMUM').width+bar*0.20;
  }
  g.fillText('WORLD', lx, ly);
  g.fillStyle='#B0BED1'; g.textAlign='right';
  g.font='600 '+Math.round(bar*0.32)+'px ui-sans-serif, Helvetica, Arial';
  g.fillText(zoneName+'   @'+(profile.nick||'anon')+(photoPov&&povZoom>1.05?('   '+povZoom.toFixed(1)+'x'):''), W-bar*0.55, H-bar*0.62);
  try{ cqPhotoCheck(c); }catch(e){}
  const url=c.toDataURL('image/png');
  $('shot').dataset.card=''; $('shotX').style.display='none';
  { const sh=document.querySelector('#shot .hint'); if(sh) sh.textContent=tr('shotHint'); }
  $('shotImg').src=url; $('shot').style.display='flex'; freeCursor();
}
function dataURLtoBlob(u){
  const parts=u.split(','), bin=atob(parts[1]), arr=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
  return new Blob([arr],{type:'image/png'});
}
async function saveShot(){
  const url=$('shotImg').src;
  if(!url) return;
  try{
    const blob=dataURLtoBlob(url);
    const fname=$('shot').dataset.card ? 'optimum-community-quest.png' : 'optimum-world.png';
    const file=new File([blob],fname,{type:'image/png'});
    /* the share sheet only on a phone: on a computer it opened the system
       share window instead of simply saving the picture */
    if(isTouch && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], title:'Optimum World'});
      return;
    }
  }catch(e){}
  const a=document.createElement('a');
  a.href=url; a.download=$('shot').dataset.card ? 'optimum-community-quest.png' : 'optimum-world.png';
  document.body.appendChild(a); a.click(); a.remove();
}
