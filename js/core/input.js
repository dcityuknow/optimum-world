/* ------------------------------ INPUT ------------------------------ */
const isTouch=matchMedia('(pointer:coarse)').matches;
let stickVec={x:0,y:0}, stickId=null, lookId=null, lastLook={x:0,y:0};
const worldTouch={};
function worldCount(){ let n=0; for(const k in worldTouch) n++; return n; }

addEventListener('keydown',e=>{
  const tg=e.target&&e.target.tagName;
  if(tg==='INPUT'||tg==='TEXTAREA'||(e.target&&e.target.isContentEditable)) return;
  if(RIDE){ rideKey(e); e.preventDefault(); return; }
  if(LB_OPEN){ if(e.code==='Escape') closeBoard(); return; }
  if(CODE_OPEN){ if(e.code==='Escape') closeCode(); return; }
  if(WARD_OPEN){ if(e.code==='Escape') closeWardrobe(); return; }
  if(JRN_OPEN){ if(e.code==='Escape'||e.code==='KeyJ') closeJournal(); return; }
  if(QI_OPEN){ if(e.code==='Escape'||e.code==='KeyE'||e.code==='Space'||e.code==='Enter') closeQI(); return; }
  keys[e.code]=true;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') running=true;
  if(e.code==='Escape'){
    if(DLG){ e.preventDefault(); closeDialog(); return; }
    if(mapOpen){ e.preventDefault(); closeMap(); return; }
  }
  if(FG){
    if(e.code==='KeyE'||e.code==='Space'){ fishStrike(); e.preventDefault(); return; }
    if(e.code==='Escape'){ fishClose(); return; }
  }
  if(e.code==='KeyE') interact();
  if(e.code==='KeyF') swingHeld();
  if(e.code.indexOf('Digit')===0){
    const n=parseInt(e.code.slice(5),10);
    if(n>=1&&n<=7&&INV[n-1]) equip(INV[n-1]);
  }
  if(e.code==='KeyJ' && obDone && !uiOpen()){ openJournal(); return; }
  if(e.code==='KeyM' && hasItem('map')){ mapOpen? closeMap() : openMap(); }
  if((e.code==='KeyP'||e.code==='KeyR')&&!uiOpen()) setPhoto(!photoMode);
  if(e.code==='Space'&&photoMode&&!panelOpen){ pendingShot=true; sfxShutter(); e.preventDefault(); }
  if(e.code==='Escape'){
    if(!obDone) return;
    if(panelOpen) closePanel();
    else if($('shot').style.display==='flex') $('shot').style.display='none';
    else if($('done').style.display==='flex') $('done').style.display='none';
    else if(photoMode) setPhoto(false);
    else if(menuOpen()) closeMenu();
    else openMenu();
  }
});
addEventListener('keyup',e=>{
  const tg2=e.target&&e.target.tagName;
  if(tg2==='INPUT'||tg2==='TEXTAREA'||(e.target&&e.target.isContentEditable)) return;
  keys[e.code]=false;
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') running=false;
});
document.addEventListener('pointerlockchange',()=>{ locked=document.pointerLockElement===renderer.domElement; });
let mDrag=false, mLast={x:0,y:0};
addEventListener('mousedown',e=>{
  if(locked||panelOpen||isTouch) return;
  if(!renderer||e.target!==renderer.domElement) return;
  mDrag=true; mLast={x:e.clientX,y:e.clientY};
});
addEventListener('mouseup',()=>{ mDrag=false; });
addEventListener('mousedown',e=>{ if(e.button===0 && locked && !uiOpen()) swingHeld(); });
addEventListener('mousemove',e=>{
  if(DLG||mapOpen){ return; }
  if(locked){
    player.yaw-=e.movementX*0.0022;
    player.pitch=Math.max(-1.2,Math.min(1.2,player.pitch-e.movementY*0.0022));
  } else if(mDrag){
    player.yaw-=(e.clientX-mLast.x)*0.004;
    player.pitch=Math.max(-1.2,Math.min(1.2,player.pitch-(e.clientY-mLast.y)*0.004));
    mLast={x:e.clientX,y:e.clientY};
  }
});
addEventListener('click',()=>{ if(!uiOpen()&&!photoMode&&!isTouch&&renderer) renderer.domElement.requestPointerLock(); });
addEventListener('wheel',e=>{
  if(panelOpen) return;
  if(photoMode && photoPov){ povZoom=Math.max(1,Math.min(5,povZoom-e.deltaY*0.0016)); updateVF(); }
  else if(photoMode) photoDist=Math.max(1.1,Math.min(7.5,photoDist+e.deltaY*0.0035));
  else camBack=Math.max(0,Math.min(6.5,camBack+e.deltaY*0.0035));
  e.preventDefault();
},{passive:false});
let pinch0=null;
addEventListener('touchmove',e=>{
  if(panelOpen||worldCount()<2){ pinch0=null; return; }
  const ks=Object.keys(worldTouch);
  const a=worldTouch[ks[0]], b=worldTouch[ks[1]];
  const d=Math.hypot(a.x-b.x,a.y-b.y);
  if(pinch0!==null){
    if(photoMode && photoPov){ povZoom=Math.max(1,Math.min(5,povZoom+(d-pinch0)*0.012)); updateVF(); }
    else if(photoMode) photoDist=Math.max(1.1,Math.min(7.5,photoDist+(pinch0-d)*0.013));
  }
  pinch0=d;
},{passive:true});
addEventListener('touchend',()=>{ pinch0=null; },{passive:true});
document.addEventListener('touchmove',e=>{
  if(e.target && e.target.closest && e.target.closest('#card,#menu .mc,#shot,#obWrap')) return;
  e.preventDefault();
},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());

function setupTouch(){
  if(!isTouch) return;
  $('stick').style.display='block'; $('act').style.display='flex';
  $('compass').textContent='Drag to look';
  const st=$('stick'), kn=$('knob');
  const mv=t=>{
    const r=st.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=t.clientX-cx, dy=t.clientY-cy, m=Math.hypot(dx,dy), max=r.width/2-14;
    if(m>max){ dx*=max/m; dy*=max/m; }
    kn.style.transform=`translate(${dx}px,${dy}px)`;
    stickVec={x:dx/max,y:dy/max};
  };
  st.addEventListener('touchstart',e=>{ stickId=e.changedTouches[0].identifier; mv(e.changedTouches[0]); e.preventDefault(); });
  st.addEventListener('touchmove',e=>{ for(const t of e.changedTouches) if(t.identifier===stickId) mv(t); e.preventDefault(); });
  st.addEventListener('touchend',e=>{ for(const t of e.changedTouches) if(t.identifier===stickId){ stickId=null; stickVec={x:0,y:0}; kn.style.transform='translate(0,0)'; } });
  addEventListener('touchstart',e=>{
    for(const t of e.changedTouches){
      const el=t.target;
      /* #hitBtn and #runBtn were missing here, so pressing either of them
         also swung the camera round */
      if(el.closest&&(el.closest('#stick')||el.closest('#act')||el.closest('#panel')||el.closest('#photoBtn')||el.closest('#photoBar')||el.closest('#shot')||el.closest('#start')||el.closest('#hitBtn')||el.closest('#runBtn')||el.closest('.sqBtn'))) continue;
      worldTouch[t.identifier]={x:t.clientX,y:t.clientY};
      if(lookId===null){ lookId=t.identifier; lastLook={x:t.clientX,y:t.clientY}; }
    }
  },{passive:true});
  addEventListener('touchmove',e=>{
    for(const t of e.changedTouches) if(worldTouch[t.identifier]) worldTouch[t.identifier]={x:t.clientX,y:t.clientY};
    if(worldCount()>1) return;
    for(const t of e.changedTouches) if(t.identifier===lookId){
      player.yaw-=(t.clientX-lastLook.x)*0.005;
      player.pitch=Math.max(-1.2,Math.min(1.2,player.pitch-(t.clientY-lastLook.y)*0.005));
      lastLook={x:t.clientX,y:t.clientY};
    }
  },{passive:true});
  addEventListener('touchend',e=>{
    for(const t of e.changedTouches){
      delete worldTouch[t.identifier];
      if(t.identifier===lookId){
        lookId=null;
        for(const k in worldTouch){ lookId=+k; lastLook=worldTouch[k]; break; }
      }
    }
  },{passive:true});
  $('act').addEventListener('touchstart',e=>{ interact(); e.preventDefault(); });
}
