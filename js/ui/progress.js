/* ------------------------------ PROGRESS ------------------------------ */
let TOTAL=24;
function updateSkyChip(){
  const P={dawn:'pDawn',day:'pDay',golden:'pGolden',dusk:'pDusk',night:'pNight'};
  const W={clear:'wClear',cloudy:'wCloudy',rain:'wRain',snow:'wSnow',fog:'wFog'};
  const el=$('sky'); if(el) el.style.display='none';
}
function updateProg(){
  /* the quest is the 15 doors of Optimum City and The Team, so show that */
  const txt=tr('explored')+' '+coreCount()+'/15';
  $('prog').textContent=txt;
  const mp=$('mProg'); if(mp) mp.textContent=txt;
}
function saveVisited(){
  try{
    store.set('optimum-world:visited', JSON.stringify(Array.from(visited)));
    store.set('optimum-world:quests', JSON.stringify(Q));   // quest state was never persisted
  }catch(e){}
}
function saveQuests(){ try{ store.set('optimum-world:quests', JSON.stringify(Q)); }catch(e){} }
function markVisited(k){
  if(visited.has(k)) return;
  visited.add(k); saveVisited(); updateProg();
  if(Q.explore===1 && coreDone()){ Q.explore=2; saveQuests(); openAfterparty(false); }
  if(visited.size>=TOTAL){
    $('doneT').textContent=tr('doneT'); $('doneB').textContent=tr('doneB');
    $('done').style.display='flex'; freeCursor(); questCue();
    blip(523,0.16,'sine',0.12); setTimeout(()=>blip(659,0.16,'sine',0.12),140); setTimeout(()=>blip(784,0.3,'sine',0.12),290);
  }
}
async function loadVisited(){
  const raw=await store.get('optimum-world:visited');
  if(raw){ try{ JSON.parse(raw).forEach(x=>visited.add(x)); }catch(e){} }
  try{
    const qr=await store.get('optimum-world:quests');
    if(qr){ const q=JSON.parse(qr); for(const k in q) if(k in Q) Q[k]=q[k]; }
  }catch(e){}
  /* TEST BUILD: always start the quest chain from scratch, whatever is saved */
  if(window.PARTY_TEST){
    Q.katana=0; Q.dig=0; Q.explore=0; Q.doors=0; Q.fish=0; Q.cq=0; Q.cqL=0; Q.leg=0; Q.legM=0;
    INV.length=0; HELD=null;
    PARTY_ON=false; if(PARTY) PARTY.visible=false;
    saveQuests();
  }
  try{
    const ir=await store.get('optimum-world:inv');
    if(ir) JSON.parse(ir).forEach(id=>{ if(ITEMS[id] && INV.indexOf(id)<0 && INV.length<7) INV.push(id); });
    drawHotbar();
  }catch(e){}
  /* dug but the fragment never picked up: the pick-up spot only ever existed
     for that one session, so it is put back, or the quest could not go on */
  if(Q.dig===2 && !hasItem('fragment') && digSite){
    const fr=digSite.userData.frag, wx=digSite.position.x, wz=digSite.position.z+2.4;
    fr.visible=true; fr.position.y=2.3;
    if(digSite.userData.hole) digSite.userData.hole.visible=true;
    spots.push({x:wx,z:wz+1.6,r:3.2,fragPick:1,accent:C.peach,data:{name:tr('fragName')},prio:1});
  }
  updateProg();
  if(Q.katana===2 && samuraiBlade) samuraiBlade.visible=true;
  applyWear();
  capOffBaised();
  if(Q.explore===2) openAfterparty(true);   // only if it was actually earned
  if(Q.dig>=3 && PARTY && PARTY.userData.plinth) showPlinth(true);
  try{ questsRestore(); }catch(e){ console.warn('quest restore',e); }
}
