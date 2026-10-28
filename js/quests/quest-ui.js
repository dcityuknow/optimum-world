/* ------------------------------ THE TITLE CARD ------------------------------
   A short full screen beat when a quest is handed out: who gives it, what it
   is called, and for the letters the code as blank tiles. Tap to skip. */
function questIntro(o){
  const el=$('qi'); if(!el) return;
  let h='<div class="qiIn">';
  if(o.pic) h+='<div class="qiPic"><img alt="" src="'+o.pic+'"></div>';
  h+='<div class="qiK"></div><div class="qiT"></div>';
  if(o.tiles) h+='<div class="qiTiles">'+o.tiles.split('').map((c,i)=>
    '<span class="pt" style="animation-delay:'+(0.95+i*0.11).toFixed(2)+'s;--r:'+((i%2?1:-1)*(1+(i*37)%4))+'deg">'+c+'</span>').join('')+'</div>';
  h+='<div class="qiS"></div></div>';
  el.innerHTML=h;
  el.querySelector('.qiK').textContent=o.k;
  el.querySelector('.qiT').textContent=o.t;
  el.querySelector('.qiS').textContent=o.s;
  el.classList.remove('out'); el.style.display='flex';
  QI_OPEN=true; keys={}; running=false; freeCursor();
  questCue();
  clearTimeout(el._t); el._t=setTimeout(closeQI, o.tiles?6200:4800);
  el._after=o.after||null;
  el.onclick=closeQI;
}
function closeQI(){
  const el=$('qi'); if(!QI_OPEN) return;
  clearTimeout(el._t);
  el.classList.add('out');
  const after=el._after; el._after=null;
  setTimeout(()=>{ el.style.display='none'; el.classList.remove('out'); QI_OPEN=false; updateTracker(); if(after) after(); },420);
}

/* ------------------------------ THE TRACKER ------------------------------ */
function updateTracker(){
  const el=$('qt'); if(!el) return;
  let h='';
  if(obDone){
    if(Q.fish>=3 && Q.leg===0) h+='<div class="qtl">'+tr('tLeg0')+'</div>';
    if(Q.leg>=6 && Q.cq===0) h+='<div class="qtl">'+tr('tCq0')+'</div>';
    if(Q.cq>=1 && Q.cq<6){
      const line = Q.cq===1 ? tr('tCq1').replace('{n}',cqCount()) :
                   Q.cq===2 ? tr('tCq2') : Q.cq===3 ? tr('tCq3') :
                   Q.cq===4 ? ((Q.cqL&64)? tr('tCq4b') : tr('tCq4')) : tr('tCq5');
      h+='<div class="qtl"><div class="qtt">'+CQ_WORD.split('').map((c,i)=>
        ((Q.cqL>>i)&1) ? '<i class="on">'+c+'</i>' : '<i>?</i>').join('')+'</div>'+line+'</div>';
    }
    if(Q.leg>=1 && Q.leg<6)
      h+='<div class="qtl">'+tr('tLeg'+Q.leg).replace('{n}',bits(Q.legM&7))+'</div>';
  }
  if(h!==qtLast){ qtLast=h; el.innerHTML=h; }
  el.style.display = (h && !photoMode && !CINE) ? 'flex' : 'none';
}

/* ------------------------------ SPEAKERS AND LINES ------------------------------ */
const spkUmpia=()=>({look:SKINS.umpia, name:'umpia', role:tr('umRole'), colour:'#B8925A'});
const spkMiretu=()=>({look:SKINS.miretu, name:'MiReTu', role:tr('miRole'), colour:'#4FA82A'});
function startCq(){
  Q.cq=1; saveQuests();
  setTimeout(()=>questIntro({pic:portraitURL(SKINS.umpia), k:tr('qiFrom'), t:tr('qiCqT'), s:tr('qiCqS'), tiles:'???????'}),260);
}
function startLeg(){
  Q.leg=1; saveQuests();
  if(giveItem('shovel')) equip('shovel');
  setTimeout(()=>questIntro({pic:portraitURL(SKINS.miretu), k:tr('qiLegFrom'), t:tr('qiLegT'), s:tr('qiLegS')}),260);
}
Object.assign(NODES,{
  /* baised, before Jeffrey has pointed you at the pier */
  bai_later:{ speaker:spkBaised, line:()=>D('baiLater'), replies:()=>[{t:D('rOk'), key:1}]},
  /* after the fish: MiReTu, then umpia */
  bai_mi:{ speaker:spkBaised, line:()=>D('baiMi'),
    replies:()=>[{t:D('rOk'), key:1},{t:D('rWho'), go:'bai_about'}]},
  bai_miwait:{ speaker:spkBaised, line:()=>D('baiMiWait'), replies:()=>[{t:D('rOk'), key:1}]},
  bai_um:{ speaker:spkBaised, line:()=>D('baiUm'), replies:()=>[{t:D('rOk'), key:1}]},
  bai_cqdone:{ speaker:spkBaised, line:()=>D('baiCqDone'),
    replies:()=>[{t:D('rWho'), go:'bai_about'},{t:D('rBye'), key:1}]},

  um_zero:{ speaker:spkUmpia, line:()=>D('um0'), replies:()=>[{t:D('rBye'), key:1}]},
  um_give:{ speaker:spkUmpia, line:()=>D('umGive1'),
    replies:()=>[{t:D('rUmThen'), go:'um_give2', key:1},{t:D('rBye')}]},
  um_give2:{ speaker:spkUmpia, line:()=>D('umGive2'),
    replies:()=>[{t:D('rCqGo'), key:1, act:startCq},{t:D('rNo')}]},
  um_coll:{ speaker:spkUmpia, line:()=>D('umColl').replace('{n}',cqCount()), replies:()=>[{t:D('rOk'), key:1}]},
  um_hello:{ speaker:spkUmpia, line:()=>D('um1'),
    replies:()=>[{t:D('rUmSeven'), go:'um_seven', key:1},{t:D('rBye')}]},
  um_seven:{ speaker:spkUmpia, line:()=>D('um2'),
    replies:()=>[{t:D('rUmCap'), go:'um_cap', key:1},{t:D('rUmLook')}]},
  um_cap:{ speaker:spkUmpia, line:()=>D('um3'),
    replies:()=>[{t:D('rUmPlease'), go:'um_deal', key:1}]},
  um_deal:{ speaker:spkUmpia, line:()=>D('um4'),
    enter:()=>{ if(Q.cq===2){ Q.cq=3; saveQuests(); updateTracker(); } },
    replies:()=>[{t:D('rUmDeal'), key:1}]},
  um_waitph:{ speaker:spkUmpia, line:()=>D('umWaitPh'), replies:()=>[{t:D('rOk'), key:1}]},
  um_saw:{ speaker:spkUmpia, line:()=>D('um5'),
    replies:()=>[{t:D('rUmTake'), go:'um_m', key:1, act:umGiveM}]},
  um_m:{ speaker:spkUmpia, line:()=>D('um6'),
    replies:()=>[{t:D('rUmCode'), key:1, act:()=>setTimeout(openCode,60)},{t:D('rBye')}]},
  um_code:{ speaker:spkUmpia, line:()=>D('umCode'),
    replies:()=>[{t:D('rUmCode'), key:1, act:()=>setTimeout(openCode,60)},{t:D('rBye')}]},
  um_open:{ speaker:spkUmpia, line:()=>D('umOpen'), replies:()=>[{t:D('rOk'), key:1}]},
  um_in:{ speaker:spkUmpia, line:()=>D('umIn'), replies:()=>[{t:D('rOk'), key:1}]},
  um_done:{ speaker:spkUmpia, line:()=>D('umDone'), replies:()=>[{t:D('rBye'), key:1}]},

  mi_later:{ speaker:spkMiretu, line:()=>D('miLater'), replies:()=>[{t:D('rOk'), key:1}]},
  mi_um:{ speaker:spkMiretu, line:()=>D('miUm'), replies:()=>[{t:D('rOk'), key:1}]},
  mi_hello:{ speaker:spkMiretu, line:()=>D('mi1'),
    replies:()=>[{t:D('rWhat'), go:'mi_ask', key:1},{t:D('rBye')}]},
  mi_ask:{ speaker:spkMiretu, line:()=>D('mi2'),
    replies:()=>[{t:D('rMiHelp'), go:'mi_go', key:1},{t:D('rNo')}]},
  mi_go:{ speaker:spkMiretu, line:()=>D('mi3'),
    replies:()=>[{t:D('rOk'), key:1, act:startLeg}]},
  mi_wait:{ speaker:spkMiretu, line:()=>D('miWait').replace('{n}',bits(Q.legM&7)),
    enter:()=>{ if(!hasItem('shovel')) giveItem('shovel'); },
    replies:()=>[{t:D('rOk'), key:1}]},
  mi_rib:{ speaker:spkMiretu, line:()=>D('mi4'),
    replies:()=>[{t:D('rMiRib'), go:'mi_rib2', key:1}]},
  mi_rib2:{ speaker:spkMiretu, line:()=>D('mi5'),
    enter:()=>{ if(giveItem('rib')) equip('rib'); if(Q.leg===2){ Q.leg=3; saveQuests(); updateTracker(); } },
    replies:()=>[{t:D('rOk'), key:1}]},
  mi_waitrib:{ speaker:spkMiretu, line:()=>D('miWaitRib'),
    enter:()=>{ if(!hasItem('rib')) giveItem('rib'); },
    replies:()=>[{t:D('rOk'), key:1}]},
  mi_waitdig:{ speaker:spkMiretu, line:()=>D('miWaitDig'),
    enter:()=>{ if(!hasItem('shovel')) giveItem('shovel'); },
    replies:()=>[{t:D('rOk'), key:1}]},
  mi_leg:{ speaker:spkMiretu, line:()=>D('mi6'),
    replies:()=>[{t:D('rGive'), go:'mi_thanks', key:1, act:()=>{
      takeItem('leg');
      /* his shovel goes back to him, unless Jeffrey's map still needs it */
      if(Q.dig!==1) takeItem('shovel');
      Q.leg=6; saveQuests(); updateTracker();
      miretuStand(false); applyWear();
      if(dog) dog.state='follow';
      if(cueOK() && !playSfx('found',0.8)) blip(659,0.2,'sine',0.12);
    }}]},
  mi_thanks:{ speaker:spkMiretu, line:()=>D('mi7'),
    replies:()=>[{t:D('rCheers'), key:1, act:()=>doneModal(tr('legFinT'),tr('legFinB'))}]},
  mi_done:{ speaker:spkMiretu, line:()=>D('miDone'), replies:()=>[{t:D('rBye'), key:1}]}
});
ITEMS.rib={icon:'🦴', build:mkRibItem,
  hand:[0.03,-0.88,0.20], hrot:[0,0,0.3], hs:0.9, view:[0.40,-0.40,-0.66], vs:1.1, vrot:[0.3,-0.3,0.4]};
ITEMS.leg={icon:'🦵', build:mkLegItem,
  hand:[0.05,-0.92,0.18], hrot:[-0.4,0,0.4], hs:0.8, view:[0.42,-0.42,-0.9], vs:0.85, vrot:[0.25,-0.6,0.5]};

/* ------------------------------ BUILD AND RESTORE ------------------------------ */
function buildQuests2(){
  [['letters',buildLetters],['umpia',buildUmpia],['vault',buildVault],
   ['miretu',buildMiretu],['dog',buildDog],['sand',buildSand]].forEach(d=>{
    try{ d[1](); }catch(e){ console.warn('quest build failed:',d[0],e); }
  });
  anims.push((t)=>{
    for(let i=0;i<cqLetters.length;i++){
      const L=cqLetters[i];
      if(L.flying) continue;
      const show=Q.cq>=1 && !(Q.cqL&(1<<L.bit));
      L.g.visible=show;
      if(!show) continue;
      L.g.position.y=1.05+Math.sin(t*1.8+L.ph)*0.08;
      L.g.rotation.y=Math.sin(t*0.6+L.ph)*0.7;
    }
    if(((t*4)|0)!==updateTracker.k){ updateTracker.k=(t*4)|0; updateTracker(); }
    if(Q.cq===5 && VAULT_IN && !QI_OPEN && !DLG && player.x>VAULT_IN.x1 && player.x<VAULT_IN.x2 &&
       player.z>VAULT_IN.z1 && player.z<VAULT_IN.z2) cqSuccess();
  });
}
/* after the saved progress is read back in */
async function questsRestore(){
  try{ CQPHOTO=await store.get('optimum-world:cqphoto'); }catch(e){}
  if(CQPHOTO) setVaultPhoto();
  if(umpiaCapCvs) umCapDraw();
  if(Q.cq>=5) openVault(true);
  moundObjs.forEach(moundShow);
  if(legPatch) legPatch.visible=Q.leg>=4;
  if(legHole) legHole.visible=Q.leg>=5;
  if(dog){
    if(Q.leg===4){ dog.state='wait'; dog.g.position.set(LEG_AT.x-1.2,0,LEG_AT.z+0.9); }
    else if(Q.leg>=6) dog.state='follow';
  }
  if(miretu){
    miretu.legL.visible=Q.leg>=6;
    if(Q.leg>=6 && miretu.state==='lie') miretuStand(true);
  }
  if(Q.leg===5 && !hasItem('leg')) giveItem('leg');
  applyWear();
  updateTracker();
}
