/* ------------------------------ PANEL ------------------------------ */
function interact(){
  if(CINE) return;
  if(mapOpen){ closeMap(); return; }
  if(panelOpen){ closePanel(); return; }
  if(CODE_OPEN || QI_OPEN || WARD_OPEN || RIDE || LB_OPEN) return;
  if(!near){
    if(HELD==='beer') drinkBeer();
    else if(HELD==='guitar') strum();
    return;
  }
  if(near.act){ near.act(); return; }
  if(near.bar){
    openDialog(
      Q.dig>=3 ? 'jeff_done' :
      (Q.dig===2 && hasItem('fragment')) ? 'jeff_turnin' :
      Q.dig===0 ? 'jeff_hello' : 'jeff_more');
    return;
  }
  if(near.dance){ toggleDance(near.folk); return; }
  if(near.dig){
    if(Q.dig===2) return;
    if(HELD!=='shovel'){ if(hasItem('shovel')) equip('shovel'); return; }
    startDig(); return;
  }
  if(near.guitarPick){
    if(giveItem('guitar')){ equip('guitar'); if(near.hide) near.hide.visible=false; }
    return;
  }
  if(near.jam){
    if(HELD!=='guitar'){ if(hasItem('guitar')) equip('guitar'); return; }
    strum(); return;
  }
  if(near.fragPick){
    if(giveItem('fragment')){
      equip('fragment');
      if(digSite) digSite.userData.frag.visible=false;
      if(digSite && digSite.userData.frag.userData.mark) digSite.userData.frag.userData.mark.visible=false;
      $('doneT').textContent=tr('fragHave'); $('doneB').textContent=tr('fragB');
      $('done').style.display='flex'; freeCursor(); questCue();
    }
    return;
  }
  if(near.katanaPick){
    if(INV.length>=7 && !hasItem('katana')){ blip(180,0.16,'sine',0.07); return; }
    giveItem('katana'); equip('katana');
    if(near.hide){ near.hide.visible=false; near.hide.traverse(o=>o.visible=false); }
    near.taken=1;
    return;
  }
  if(near.baised){
    /* he only takes you fishing once Jeffrey has sent you, so a straight
       walk to the pier on day one gets a polite not yet. A fishing trip
       that was already under way before this carries on as it was. */
    openDialog(
      /* after the fish he sends you to MiReTu, and MiReTu sends you to umpia */
      Q.fish>=3 ? (Q.leg===0 ? 'bai_mi' : (Q.leg<6 ? 'bai_miwait' : (Q.cq>=6 ? 'bai_cqdone' : 'bai_um'))) :
      Q.fish===2 ? 'bai_turnin' :
      Q.fish===1 ? 'bai_waiting' :
      (Q.dig<3 ? 'bai_later' : 'bai_hello'));
    return;
  }
  if(near.fishSpot){ fishOpen(); return; }
  if(near.samurai){
    openDialog(
      Q.katana===2 ? 'sam_done' :
      (Q.katana===1 ? (hasItem('katana')? 'sam_give' : 'sam_waiting') : 'sam_hello'));
    return;
  }
  if(near.vssema){
    openDialog(
      Q.explore===2 ? 'vs_done' :
      (Q.explore===1 ? (coreDone()? 'vs_done' : 'vs_progress') : 'vs_hello'));
    return;
  }
  if(HELD==='beer' && !near.person && !near.data){ drinkBeer(); return; }
  if(near.person){
    const pn=near.person, col=(ROLE[pn.role]||ROLE.mum).c;
    $('cPic').style.display='flex';
    $('cAvatarImg').src=PICS[pn.id]||'';
    $('cEyebrow').textContent=tr(pn.role==='mod'?'roleMod':'roleMum');
    $('cTitle').textContent=pn.nick;
    $('cRule').style.background=col;
    $('cBody').innerHTML='<p>'+tr(pn.role==='mod'?'bioMod':'bioMum')+'</p>';
    const hn=(pn.x||'').split('/').filter(Boolean).pop();
    $('cLinks').innerHTML='<a href="'+pn.x+'" target="_blank" rel="noopener">@'+hn+'</a>';
    $('cPlot').style.display='none'; curPlot=null;
    $('panel').style.display='flex'; panelOpen=true;
    if(document.pointerLockElement) document.exitPointerLock();
    sfxPanel();
    return;
  }
  if(near.data && near.data.guest){
    const v=near.data.guest, col=roleOf(v.role).c;
    $('cPic').style.display = v.photo? 'flex':'none';
    if(v.photo) $('cAvatarImg').src=v.photo;
    $('cEyebrow').textContent=tr('resHome');
    $('cTitle').textContent=v.nick;
    $('cRule').style.background=hx(col);
    const num=residentNo(v);
    $('cBody').innerHTML='<p>'+((v.bio||'').trim()||tr('believer'))+'</p><ul><li>'+
      roleLabel(v.role)+'</li><li>'+tr('resident')+' #'+num+'</li></ul>';
    $('cLinks').innerHTML = v.x
      ? '<a href="https://x.com/'+v.x+'" target="_blank" rel="noopener">@'+v.x+'</a>' : '';
    $('cPlot').style.display='none'; curPlot=null;
    markVisited('guest:'+v.nick);
    $('panel').style.display='flex'; panelOpen=true;
    freeCursor(); sfxPanel();
    return;
  }
  if(near.data && near.data.res){
    const c=near.data.res, col=(c.role==='mod')?0x4FA3F7:0xEE6C55;
    $('cPic').style.display='flex';
    $('cAvatarImg').src=PICS[c.id]||'';
    $('cEyebrow').textContent=tr('resHome');
    $('cTitle').textContent=c.nick;
    $('cRule').style.background=hx(col);
    let num=0; for(let i=0;i<COMMUNITY.length;i++) if(COMMUNITY[i].res===c){ num=i+2; break; }
    $('cBody').innerHTML='<p>'+tr(c.role==='mod'?'resMod':'resMum')+'</p><ul><li>'+
      (c.role==='mod'?'MOD':'Mumbassador')+'</li><li>'+tr('resident')+' #'+num+'</li></ul>';
    const hn=(c.x||'').split('/').filter(Boolean).pop();
    $('cLinks').innerHTML='<a href="'+c.x+'" target="_blank" rel="noopener">@'+hn+'</a>';
    $('cPlot').style.display='none'; curPlot=null;
    markVisited('res:'+c.id);
    $('panel').style.display='flex'; panelOpen=true;
    freeCursor(); sfxPanel();
    return;
  }
  if(near.data && near.data.id==='me'){
    const r=roleOf(profile.role);
    $('cPic').style.display = profile.photo? 'flex':'none';
    if(profile.photo) $('cAvatarImg').src=profile.photo;
    $('cEyebrow').textContent=tr('yourHouse');
    $('cTitle').textContent=(profile.nick||'').trim()||'Anonymous';
    $('cRule').style.background=hx(r.c);
    $('cBody').innerHTML='<p>'+((profile.bio||'').trim()||tr('believer'))+'</p><ul><li>'+
      roleLabel(profile.role)+'</li><li>'+tr('resident')+' #1</li></ul>';
    $('cLinks').innerHTML = (profile.x
      ? '<a href="https://x.com/'+profile.x+'" target="_blank" rel="noopener">@'+profile.x+'</a>'
      : '<a href="https://x.com/get_optimum" target="_blank" rel="noopener">Optimum on X</a>')
      + '<a href="#" id="editMe">'+tr('editMe')+'</a>';
    setTimeout(()=>{
      const em=$('editMe');
      if(em) em.addEventListener('click',ev=>{ ev.preventDefault(); openProfileEditor(); });
    },0);
    $('cPlot').style.display='none'; curPlot=null;
    markVisited('me');
    $('panel').style.display='flex'; panelOpen=true;
    freeCursor(); sfxPanel();
    return;
  }
  $('cPic').style.display='none';
  const d=near.data, cc=C_(d.id);
  $('cEyebrow').textContent=zn(near.zone);
  $('cTitle').textContent=d.name;
  $('cRule').style.display='none';        // no decorative rule under the title
  let html=cc.body.map(p=>`<p>${p}</p>`).join('');
  if(cc.bullets&&cc.bullets.length) html+='<ul>'+cc.bullets.map(b=>`<li>${b}</li>`).join('')+'</ul>';
  markVisited(d.id+':'+(d.plot!==undefined?d.plot:''));
  questDoor();
  sfxPanel();
  $('cBody').innerHTML=html;
  $('cLinks').innerHTML=(d.links||[]).map(l=>`<a href="${l[1]}" target="_blank" rel="noopener">${l[0]}</a>`).join('');
  if(d.plot!==undefined){
    curPlot=d.plot;
    const rec=plotData[curPlot]||{};
    $('plotTitle').value=rec.title||'';
    $('plotClear').style.display=rec.img?'block':'none';
    $('cPlot').style.display='block';
  } else { curPlot=null; $('cPlot').style.display='none'; }
  $('panel').style.display='flex'; panelOpen=true;
  if(document.pointerLockElement) document.exitPointerLock();
}
let curPlot=null;
function fitImage(file,max){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>{
      const im=new Image();
      im.onload=()=>{
        const k=Math.min(1,max/Math.max(im.width,im.height));
        const w=Math.round(im.width*k), h=Math.round(im.height*k);
        const c=cvs(w,h), g=c.getContext('2d');
        g.drawImage(im,0,0,w,h);
        res(c.toDataURL('image/jpeg',0.8));
      };
      im.onerror=rej; im.src=r.result;
    };
    r.onerror=rej; r.readAsDataURL(file);
  });
}
$('plotFile').addEventListener('change', async e=>{
  const f=e.target.files&&e.target.files[0];
  if(!f||curPlot===null) return;
  try{
    const img=await fitImage(f,900);
    const rec=plotData[curPlot]||(plotData[curPlot]={});
    rec.img=img;
    if(!rec.title) rec.title=($('plotTitle').value||'').trim()||'Untitled';
    rec.author=(profile.nick||rec.author||'anon');
    $('plotTitle').value=rec.title;
    $('plotClear').style.display='block';
    savePlot(curPlot);
  }catch(err){ console.warn('art upload failed',err); }
  e.target.value='';
});
$('plotTitle').addEventListener('change',()=>{
  if(curPlot===null) return;
  const rec=plotData[curPlot]||(plotData[curPlot]={});
  rec.title=($('plotTitle').value||'').trim();
  if(rec.img && !rec.author) rec.author=profile.nick||'anon';
  savePlot(curPlot);
});
$('plotClear').addEventListener('click',()=>{
  if(curPlot===null) return;
  const rec=plotData[curPlot]||(plotData[curPlot]={});
  rec.img=null; savePlot(curPlot);
  $('plotClear').style.display='none';
});
function gfxLabel(){
  const b=$('mGfx'); if(!b) return;
  b.textContent = tr('gfx')+': '+(quality>=3? tr('gfxHigh') : quality===2? tr('gfxBal') : tr('gfxLite'));
  b.className = quality>=3? 'on' : '';
}
function openMenu(){
  gfxLabel();
  resetArmed=0; $('mReset').textContent=tr('resetBtn'); $('mReset').classList.remove('on');
  $('mSound').textContent = SFX.on? tr('soundOn') : tr('soundOff');
  $('mSound').className = SFX.on? 'on' : '';
  $('menu').style.display='flex';
  freeCursor();
}
function closeMenu(){
  $('menu').style.display='none';
  if(!isTouch && !photoMode && renderer && !uiOpen()) renderer.domElement.requestPointerLock();
}
function menuOpen(){ return $('menu').style.display==='flex'; }
function uiOpen(){
  return menuOpen() || panelOpen || !!DLG || mapOpen || !!CINE || !!FG || CODE_OPEN || QI_OPEN || WARD_OPEN || !!RIDE || LB_OPEN || JRN_OPEN
    || $('shot').style.display==='flex'
    || $('done').style.display==='flex'
    || $('start').style.display!=='none';
}
function freeCursor(){ if(document.pointerLockElement) document.exitPointerLock(); }
function closePanel(){ $('panel').style.display='none'; panelOpen=false; }
$('close').addEventListener('click',closePanel);
$('panel').addEventListener('click',e=>{ if(e.target.id==='panel') closePanel(); });
