/* ------------------------------ CINEMATICS ------------------------------
   A scripted camera path. Movement is locked, the HUD hides, and the camera is
   restored exactly where the player left it. */
let CINE=null;
function playCine(keys, dur, onDone){
  if(CINE) return;
  const save={x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch,fov:camera.fov};
  document.body.classList.add('cine');
  const P=keys.map(k=>new THREE.Vector3(k.p[0],k.p[1],k.p[2]));
  const L=keys.map(k=>new THREE.Vector3(k.l[0],k.l[1],k.l[2]));
  /* t0 null: the first drawn frame starts the clock, not this call */
  CINE={dur:dur, t0:null, last:0, save:save, done:onDone||null,
        pcurve:new THREE.CatmullRomCurve3(P,false,'catmullrom',0.5),
        lcurve:new THREE.CatmullRomCurve3(L,false,'catmullrom',0.5),
        fovs:keys.map(k=>k.f||60)};
}
const CINE_STALL=0.25;      // a gap longer than this is a hitch, not playback
function cineStep(){
  if(!CINE) return false;
  const now=performance.now();
  if(CINE.t0===null){ CINE.t0=now; CINE.last=now; }
  else {
    /* a frame that took too long is not time the shot should have spent:
       push the start forward so the camera resumes where it left off */
    const gap=(now-CINE.last)/1000;
    if(gap>CINE_STALL) CINE.t0+=(gap-CINE_STALL)*1000;
  }
  CINE.last=now;
  const e=(now-CINE.t0)/1000/CINE.dur;
  if(e>=1){
    const sv=CINE.save, dn=CINE.done; CINE=null;
    document.body.classList.remove('cine');
    player.x=sv.x; player.z=sv.z; player.yaw=sv.yaw; player.pitch=sv.pitch;
    if(camera.fov!==sv.fov){ camera.fov=sv.fov; camera.updateProjectionMatrix(); }
    if(dn) setTimeout(dn,120);
    return false;
  }
  /* One continuous curve through every key, with a single global ease. Easing
     between each pair made the camera stall at every waypoint, which is what
     made the shot read as static. */
  const u=e<0.5 ? 2*e*e : 1-Math.pow(-2*e+2,2)/2;
  const pos=CINE.pcurve.getPoint(u);
  const look=CINE.lcurve.getPoint(u);
  camera.position.copy(pos);
  camera.lookAt(look);
  const fs=CINE.fovs, n=fs.length-1, f=Math.min(0.9999,u*n), i=Math.floor(f), t=f-i;
  const fv=fs[i]+(fs[i+1]-fs[i])*t;
  if(Math.abs(camera.fov-fv)>0.01){ camera.fov=fv; camera.updateProjectionMatrix(); }
  if(e>0.985 && CINE.done){ const d=CINE.done; CINE.done=null; setTimeout(d,120); }
  return true;
}
/* a slow orbit of the venue that settles on the sign */
function cineAfterparty(after){
  const X=PARTY_AT.x, Z=PARTY_AT.z;
  playCine([
    {p:[X+54,30,Z+44], l:[X+6,4,Z+4],  f:62},
    {p:[X+16,26,Z+52], l:[X,4.5,Z-2],  f:58},
    {p:[X-30,18,Z+38], l:[X-4,5,Z-8],  f:54},
    {p:[X-24,10,Z+16], l:[X,5.5,Z-14], f:48},
    {p:[X-6,7.6,Z+4],  l:[X,5.6,Z-14.8], f:42},
    {p:[X,6.6,Z-2],    l:[X,5.6,Z-14.9], f:36}
  ], 10.0, after);
}
/* rise off the hole, orbit the fragment, settle */
function cineFragment(x,z,after){
  playCine([
    {p:[x+1.2,0.9,z+2.8], l:[x,0.6,z], f:54},
    {p:[x+4.2,2.6,z+3.4], l:[x,1.8,z], f:56},
    {p:[x+2.0,5.0,z-3.0], l:[x,2.6,z], f:52},
    {p:[x-4.0,4.2,z-2.4], l:[x,2.8,z], f:50},
    {p:[x-3.0,2.6,z+2.6], l:[x,2.4,z], f:44},
    {p:[x-0.8,2.2,z+3.2], l:[x,2.3,z], f:38}
  ], 8.0, after);
}

/* The warm patch a lit window throws onto the pavement. Shared material,
   additive so it brightens the paving rather than staining it. */
let SPILL_MAT=null;
function spillMat(){
  if(SPILL_MAT) return SPILL_MAT;
  const c=cvs(64,64), g=c.getContext('2d');
  const rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,'rgba(255,214,150,0.40)');
  rg.addColorStop(0.55,'rgba(255,205,135,0.16)');
  rg.addColorStop(1,'rgba(255,200,130,0)');
  g.fillStyle=rg; g.fillRect(0,0,64,64);
  SPILL_MAT=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    fog:true, toneMapped:false});
  return SPILL_MAT;
}
let BLOB_MAT=null;
function blobShadowMat(){
  if(BLOB_MAT) return BLOB_MAT;
  const c=cvs(64,64), g=c.getContext('2d');
  const rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,'rgba(24,28,34,0.42)');
  rg.addColorStop(0.6,'rgba(24,28,34,0.18)');
  rg.addColorStop(1,'rgba(24,28,34,0)');
  g.fillStyle=rg; g.fillRect(0,0,64,64);
  BLOB_MAT=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),
    transparent:true, depthWrite:false, fog:true, toneMapped:false});
  return BLOB_MAT;
}
function blobShadow(parent, size){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size||2.0, size||2.0), blobShadowMat());
  m.rotation.x=-Math.PI/2; m.position.y=0.03;
  parent.add(m);
  return m;
}
/* A texture reaches the GPU the first time a mesh using it is drawn, and a
   mesh outside the frustum is never drawn. Revealing the afterparty in one
   go therefore uploads its whole crowd on a single frame, which is the
   freeze. Two throwaway renders from a camera aimed at the venue pay that
   bill up front, behind the intro screen. */
let partyWarm=false;
function warmParty(){
  if(partyWarm || !PARTY || !renderer || !scene || !camera) return;
  partyWarm=true;
  const pv=PARTY.visible, sp=camera.position.clone(),
        sq=camera.quaternion.clone(), sf=camera.fov;
  PARTY.visible=true;
  const shots=[[46,30,46, 70],[6,6,22, 60]];   // the whole deck, then the stage
  try{
    for(const s of shots){
      camera.position.set(PARTY_AT.x+s[0], s[1], PARTY_AT.z+s[2]);
      camera.lookAt(PARTY_AT.x, 4.5, PARTY_AT.z-8);
      camera.fov=s[3]; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
  }catch(e){}
  PARTY.visible=pv;
  camera.position.copy(sp); camera.quaternion.copy(sq);
  camera.fov=sf; camera.updateProjectionMatrix();
}
