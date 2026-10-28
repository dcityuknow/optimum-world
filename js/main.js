/* ------------------------------ BOOT ------------------------------ */
$('avatarFile').addEventListener('change', async e=>{
  const f=e.target.files && e.target.files[0];
  if(!f) return;
  try{
    profile.photo = await fileToSquare(f,1024);
    showPrev(profile.photo); saveProfile(); pushMe();   // otherwise only you see it
    noteHouseRule();
    if(scene) buildAvatar(); refreshHouse();
  }catch(err){ console.warn('avatar failed',err); }
});
$('enter').addEventListener('click',()=>{
  sfxWake();
  if(startMode==='edit'){
    startMode='enter';
    profile.nick=($('nickInput').value||'').trim().slice(0,18);
    profile.bio=($('bioInput').value||'').trim().slice(0,90);
    profile.x=cleanHandle($('xInput').value);
    saveProfile(); pushMe(); if(scene) buildAvatar(); refreshHouse();
    $('start').style.display='none';
    if(!isTouch && !photoMode && renderer) renderer.domElement.requestPointerLock();
    return;
  }
  if(obStep===4 && !profileComplete()){
    profile.nick=($('nickInput').value||'').trim().slice(0,18);
    profile.bio=($('bioInput').value||'').trim().slice(0,90);
    profile.x=cleanHandle($('xInput').value);
    if(!profileComplete()){
      /* point at whatever is still empty instead of explaining it again */
      const miss=[['nickInput',!profile.nick],['bioInput',!profile.bio],
                  ['xInput',!profile.x],['avatarPick',!profile.photo]];
      miss.forEach(([id,bad])=>{ const e=$(id); if(!e) return;
        e.classList.toggle('need',!!bad); });
      blip(220,0.12,'sine',0.08);
      return;
    }
    saveProfile();
  }
  document.querySelectorAll('.need').forEach(e=>e.classList.remove('need'));
  obShow(Math.min(5,obStep+1));
});
$('xInput').addEventListener('blur',()=>{
  const h=cleanHandle($('xInput').value);
  $('xInput').value = h ? '@'+h : '';
});
function openProfileEditor(){
  closePanel();
  if(typeof closeMenu==='function' && menuOpen()) closeMenu();
  startMode='edit';
  noteHouseRule();
  obShow(4);
  $('obSkip').style.display='none'; $('obDots').style.display='none'; $('obBack').style.display='none';
  $('enter').textContent=tr('save'); $('enter').style.display='block';
  $('start').className='final';
  $('start').style.display='flex';
  freeCursor();
}
$('obBack').addEventListener('click',()=>{ if(obStep>1) obShow(obStep-1); });
$('enterBig').addEventListener('click',()=>{ sfxWake(); obFinish(); });
$('obSkip').addEventListener('click',()=>{ sfxWake(); obShow(5); });
$('photoBtn').addEventListener('click',()=> setPhoto(true));
$('pbExit').addEventListener('click',()=> setPhoto(false));
$('pbPov').addEventListener('click',()=>{
  photoPov=!photoPov;
  $('pbPov').textContent = photoPov? tr('selfieMode') : tr('povMode');
  $('pbPov').className = photoPov? 'pbMain' : 'pbGhost';
  setPhotoHint(); updateVF();
});
$('pbShot').addEventListener('click',()=>{ pendingShot=true; sfxShutter(); });
$('pbEdit').addEventListener('click',openProfileEditor);
$('shotSave').addEventListener('click', saveShot);
$('shotClose').addEventListener('click',()=>{ $('shot').style.display='none'; });
$('shotX').addEventListener('click', postCqOnX);
$('mWard').addEventListener('click', openWardrobe);
$('pbWard').addEventListener('click', openWardrobe);
$('wardX').addEventListener('click', closeWardrobe);
$('wardP').addEventListener('click', e=>{ if(e.target.id==='wardP') closeWardrobe(); });
$('mJrn').addEventListener('click', openJournal);
$('jrnBtn').addEventListener('click', ()=>{ JRN_OPEN? closeJournal() : (!uiOpen() && openJournal()); });
$('jrnX').addEventListener('click', closeJournal);
$('jrnP').addEventListener('click', e=>{ if(e.target.id==='jrnP') closeJournal(); });
$('codeClr').addEventListener('click',()=>{ $('codeMsg').textContent=''; codeFill(); });
$('codeX').addEventListener('click', closeCode);

buildLangRows();
$('menuBtn').addEventListener('click',()=>{ menuOpen()? closeMenu() : openMenu(); });
/* equips on the first tap and swings on that same tap, so it never takes two */
function hitTap(){
  const s=swingable(); if(!s) return;
  if(HELD!==s) equip(s);
  swingHeld();
}
$('hitBtn').addEventListener('touchstart',e=>{ hitTap(); e.preventDefault(); });
$('hitBtn').addEventListener('click',e=>{ hitTap(); e.preventDefault(); });
$('runBtn').addEventListener('touchstart',e=>{
  running=!running;
  $('runBtn').className = running? 'on' : '';
  e.preventDefault();
});
$('viewBtn').addEventListener('click',()=>{
  camBack = camBack>0.6 ? 0 : 3.6;
  $('viewBtn').className = camBack>0.6 ? 'sqBtn on' : 'sqBtn';
});
$('mResume').addEventListener('click',closeMenu);
$('mSound').addEventListener('click',()=>{
  sfxInit(); toggleSound();
  $('mSound').textContent=SFX.on? tr('soundOn') : tr('soundOff');
  $('mSound').className=SFX.on? 'on' : '';
});
$('mAvatar').addEventListener('click',openProfileEditor);
$('mHow').addEventListener('click',()=>{
  closeMenu(); startMode='enter';
  $('obSkip').style.display='block'; $('obDots').style.display='flex';
  obShow(2);
  $('start').style.display='flex'; freeCursor();
});
$('langBtn').addEventListener('click',()=>{
  setLang(LANGS[(LANGS.indexOf(LANG)+1)%LANGS.length]);
});
$('sndBtn').addEventListener('click',()=>{ sfxWake(); toggleSound(); });
$('fishHit').addEventListener('click',()=>{ sfxWake(); fishStrike(); });
$('fishOut').addEventListener('click',()=>{ sfxWake(); fishClose(); });
$('doneX').addEventListener('click',()=>{ $('done').style.display='none'; });
document.addEventListener('click',e=>{
  const el=e.target;
  if(el.closest && el.closest('button, .pUp, #avatarPick')){ sfxWake(); sfxClick(); }
},true);
/* the first touch anywhere unlocks, whatever that touch was for */
['touchstart','touchend','pointerdown'].forEach(ev=>
  document.addEventListener(ev, ()=>sfxWake(), {capture:true, passive:true}));
/* iOS suspends the context whenever the app goes to the background and does
   not resume it on the way back */
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && SFX.ctx && SFX.ctx.state==='suspended')
    try{ SFX.ctx.resume(); }catch(e){}
});

const nav=(navigator.language||'en').toLowerCase().slice(0,2);
LANG = LANGS.indexOf(nav)>=0 ? nav : 'en';

addEventListener('error',e=>showFatal('window', e.error||e.message));
fbInit();
setupTouch();
loadProfile().then(()=>{ if(scene) buildAvatar(); refreshHouse(); });
(async ()=>{
  if(DB){
    const to=new Promise(r=>setTimeout(()=>r([]),7000));
    ROSTER=await Promise.race([pullRoster(),to]);
  }
  init();
  setTimeout(()=>{ loadPlots(); loadVisited(); },0);
  /* Avatars picked before the save-on-pick fix never reached the database, so
     if this browser holds something the roster is missing, send it up now. */
  setTimeout(syncMe,1500);
  setTimeout(()=>{ if(!LAST_SEEN || !ROSTER.length) refreshRoster(); },9000);
  setInterval(refreshRoster, 60000);
})();
store.get('optimum-world:lang').then(l=>{ if(l&&LANGS.indexOf(l)>=0) LANG=l; applyLang(); });
store.get('optimum-world:snd').then(v=>{ if(v==='0'){ SFX.on=false; $('sndBtn').style.opacity='.45'; } });
store.get('optimum-world:treasure').then(v=>{ if(v==='1'){ treasureFound=true; if(treasure) treasure.beam.visible=false; } });
$('photoBtn').style.display='none';
if(isTouch) $('photoKey').style.display='none';
obShow(1);
