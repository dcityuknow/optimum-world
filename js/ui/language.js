/* ------------------------------ LANGUAGE ------------------------------ */
let startMode='enter';
function buildLangRows(){
  ['langRow','mLang'].forEach(id=>{
    const row=$(id); if(!row) return;
    row.innerHTML='';
    LANGS.forEach(l=>{
      const b=document.createElement('button');
      b.textContent=LANG_LABEL[l]; b.dataset.l=l;
      if(l===LANG) b.className='on';
      b.addEventListener('click',()=>setLang(l));
      row.appendChild(b);
    });
  });
}
function applyLang(){
  buildLangRows();
  $('langBtn').textContent=LANG_LABEL[LANG]||LANG.toUpperCase();
  $('mTitle').textContent=tr('menuT');
  $('mapX').addEventListener('click',()=>closeMap());
/* Start the quests over. Clearing the counters alone left the world as it
   was: the cap on your head, the blade back with the samurai, the fragment
   floating over the hole. The saved progress is wiped and the page reloads,
   so everything comes back exactly as it was on the first visit. Your house
   and your card stay. Two taps, so it cannot happen by accident. */
let resetArmed=0;
$('mReset').addEventListener('click',()=>{
  const b=$('mReset');
  if(!resetArmed){
    resetArmed=1; b.textContent=tr('resetSure'); b.classList.add('on');
    setTimeout(()=>{ resetArmed=0; b.textContent=tr('resetBtn'); b.classList.remove('on'); }, 4000);
    return;
  }
  try{
    ['optimum-world:visited','optimum-world:quests','optimum-world:inv','optimum-world:cqphoto'].forEach(k=>{
      try{ localStorage.removeItem(k); }catch(e){}
      try{ if(window.storage && window.storage.delete) window.storage.delete(k); }catch(e){}
    });
  }catch(e){}
  visited.clear(); INV.length=0;
  for(const k in Q) Q[k]=0;
  saveVisited(); saveQuests(); saveInv();
  setTimeout(()=>location.reload(), 150);
});
$('mGfx').addEventListener('click',()=>{
  // manual step down; there is no way back up without a reload, so say so
  if(quality>0) dropQuality();
  gfxLabel();
});
$('mResume').textContent=tr('resume');
  $('mAvatar').textContent=tr('avatarEdit');
  $('mHow').textContent=tr('howTo');
  $('mSound').textContent=SFX.on? tr('soundOn') : tr('soundOff');
  $('mKeys').innerHTML=tr('keysList');
  $('intro').textContent = isTouch? tr('introTouch') : tr('introDesk');
  ['s1t','s1s','s1n','s1p','s2t','s2s','s2a','s2b','s2c','s2d','s2e',
   's3t','s3s','s3a','s3b','s3c','s4t','s4s'].forEach(k=>{
    const el=$(k); if(el) el.innerHTML=tr(k);
  });
  $('obBack').textContent=tr('back');
  $('s4r')&&($('s4r').textContent=tr('s4r'));
  noteHouseRule();
  $('bioInput').placeholder=tr('s4b');
  $('xInput').placeholder=tr('s4x');
  buildRoleRow(); refreshHouse();
  $('enterBig').textContent=tr('enter');
  $('k2a').textContent = isTouch? 'Pad' : 'W A S D';
  $('k2b').textContent = isTouch? 'Swipe' : 'Mouse';
  $('obSkip').textContent=tr('skip');
  $('startSub').textContent=tr('tagline');
  $('startKeys').innerHTML=tr('keys');
  $('nickInput').placeholder=tr('nick');
  ['nickInput','bioInput','xInput'].forEach(id=>{
    const el=$(id); if(!el || el.dataset.note) return;
    el.dataset.note='1';
    el.addEventListener('input',()=>{                 // live check while typing
      const t=x=>(x||'').trim();
      const ok = !!t(el.value) && !!t($('nickInput').value) && !!t($('bioInput').value)
                 && !!t($('xInput').value) && !!profile.photo
                 && !placeholderNick($('nickInput').value);
      const n=$('s4note'); if(!n) return;
      n.textContent = ok ? tr('houseReady') : '';
      n.className = ok ? 'obnote ok' : 'obnote';
    });
  });
  if(startMode==='edit') $('enter').textContent=tr('save');
  else if(!obDone) $('enter').textContent=tr('next');
  $('loading').textContent=tr('loading');
  $('close').textContent=tr('close');
  $('pbExit').textContent=tr('back');
  $('pbPov').textContent = photoPov? tr('selfieMode') : tr('povMode');
  $('pbShot').textContent=tr('capture');
  if(photoMode) setPhotoHint();
  $('pbEdit').textContent=tr('avatarBtn');
  $('pbWard').textContent=tr('wTitle');
  { const mw=$('mWard'); if(mw) mw.textContent=tr('wTitle'); }
  { const mj=$('mJrn'); if(mj) mj.textContent=tr('jBtn'); const jb=$('jrnBtn'); if(jb) jb.title=tr('jTitle'); }
  $('shotSave').textContent=tr('savePhoto');
  $('shotClose').textContent=tr('close');
  $('shotX').textContent=tr('postX');
  const sh=document.querySelector('#shot .hint'); if(sh) sh.textContent=tr('shotHint');
  $('plotTitle').placeholder=tr('plotTitle');
  const up=document.querySelector('.pUp'); if(up&&up.firstChild) up.firstChild.nodeValue=tr('plotUp');
  $('plotClear').textContent=tr('plotDel');
  const ph=document.querySelector('#cPlot .phint'); if(ph) ph.textContent=tr('plotHint');
  if(isTouch) $('compass').textContent=tr('drag');
  updateProg(); updateSkyChip();
  for(let i=0;i<plaques.length;i++){
    const pl=plaques[i];
    pl.m.material.map=plaqueTexture(zn(pl.zone),pl.data.name,C_(pl.data.id).stand,hx(pl.acc));
    pl.m.material.needsUpdate=true;
  }
  refreshBoards();
  if(scene) updateZone();
  if(panelOpen) closePanel();
}
function setLang(l){ LANG=l; try{ store.set('optimum-world:lang',l); }catch(e){} applyLang(); }
