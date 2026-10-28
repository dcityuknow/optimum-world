/* ------------------------------ THE QUEST JOURNAL ------------------------------
   Every quest in the world in the order they unlock: what it is, who gives it,
   where they stand, what to do next, and what it pays. Locked ones only say
   what opens them, so the list never spoils a step you have not reached. */
let JRN_OPEN=false;
const JRN_SEEN='optimum-world:jrnSeen';
function jrnStep(k){ return tr(k).replace(/^[^:]*:\s*/,''); }      // "Leg Day: dig..." -> "dig..."
function jrnList(){
  const party = Q.explore===2;
  const L=[];
  L.push({t:'jKatT', w:'jKatW',
    st: Q.katana===2?'done':(Q.katana===1?'active':'new'),
    step: Q.katana===1 ? tr(hasItem('katana')?'jKat1b':'jKat1') : tr('jKat0')});
  L.push({t:'jExpT', w:'jExpW', r:'jExpR',
    st: Q.explore===2?'done':(Q.explore===1?'active':'new'),
    step: Q.explore===1 ? tr('jExp1').replace('{n}',coreCount()) : tr('jExp0')});
  L.push({t:'jDigT', w:'jDigW', lock:!party, after:'jExpT',
    st: Q.dig>=3?'done':(Q.dig>=1?'active':'new'),
    step: Q.dig===1 ? tr('jDig1') : Q.dig===2 ? tr('jDig2') : tr('jDig0')});
  L.push({t:'jFishT', w:'jFishW', r:'jFishR', lock:Q.dig<3, after:'jDigT',
    st: Q.fish>=3?'done':(Q.fish>=1?'active':'new'),
    step: Q.fish===1 ? tr('jFish1') : Q.fish===2 ? tr('jFish2') : tr('jFish0')});
  L.push({t:'jLegT', w:'jLegW', r:'jLegR', lock:Q.fish<3, after:'jFishT',
    st: Q.leg>=6?'done':(Q.leg>=1?'active':'new'),
    step: (Q.leg>=1 && Q.leg<=5) ? jrnStep('tLeg'+Q.leg).replace('{n}',bits(Q.legM&7)) : tr('jLeg0')});
  L.push({t:'jCqT', w:'jCqW', r:'jCqR', lock:Q.leg<6, after:'jLegT',
    st: Q.cq>=6?'done':(Q.cq>=1?'active':'new'),
    step: Q.cq===1 ? jrnStep('tCq1').replace('{n}',cqCount()) :
          Q.cq===2 ? tr('tCq2') : Q.cq===3 ? tr('tCq3') :
          Q.cq===4 ? ((Q.cqL&64)? tr('tCq4b') : tr('tCq4')) : Q.cq===5 ? tr('tCq5') : tr('jCq0')});
  L.push({t:'jRodT', w:'jRodW', mini:true, lock:!party, after:'jExpT',
    st: 'mini',
    step: Q.bb>0 ? tr('jRod1').replace('{s}',(Q.bb/10).toFixed(1)) : tr('jRod0')});
  L.forEach(q=>{ if(q.lock && q.st!=='done') q.st='locked'; });
  return L;
}
function drawJournal(){
  const L=jrnList(), box=$('jrnL'); box.innerHTML='';
  const quests=L.filter(q=>!q.mini), done=quests.filter(q=>q.st==='done').length;
  $('jrnN').textContent=tr('jCount').replace('{n}',done).replace('{t}',quests.length);
  const tag={done:'jDone', active:'jActive', 'new':'jNew', locked:'jLocked', mini:'jMini'};
  L.forEach(q=>{
    const row=document.createElement('div'); row.className='jq '+q.st;
    const top=document.createElement('div'); top.className='jtop';
    const b=document.createElement('b'); b.textContent=tr(q.t);
    const s=document.createElement('span'); s.className='jtag'; s.textContent=tr(tag[q.st]);
    top.appendChild(b); top.appendChild(s); row.appendChild(top);
    const line=(cls,txt)=>{ const p=document.createElement('div'); p.className=cls; p.textContent=txt; row.appendChild(p); };
    if(q.st==='locked'){ line('jw', tr('jAfter').replace('{q}',tr(q.after))); }
    else {
      line('jw', tr(q.w));
      if(q.st!=='done') line('js', q.step);
      if(q.r) line('jr', tr('jReward')+': '+tr(q.r));
    }
    box.appendChild(row);
  });
  $('jrnK').textContent = isTouch ? '' : tr('jKey');
}
function openJournal(){
  if(menuOpen()) closeMenu();
  JRN_OPEN=true; keys={}; running=false; freeCursor();
  $('jrnT').textContent=tr('jTitle'); $('jrnX').textContent=tr('close');
  drawJournal();
  $('jrnP').style.display='flex';
  try{ localStorage.setItem(JRN_SEEN,'1'); }catch(e){}
  jrnDot();
  if(!playSfx('ui',0.5,1.0)) blip(560,0.05,'sine',0.05);
}
function closeJournal(){
  JRN_OPEN=false; $('jrnP').style.display='none';
  if(!isTouch && !photoMode && renderer && !uiOpen()) renderer.domElement.requestPointerLock();
}
function jrnSeen(){ try{ return localStorage.getItem(JRN_SEEN)==='1'; }catch(e){ return true; } }
function jrnDot(){ const d=$('jrnDot'); if(d) d.style.display = jrnSeen() ? 'none' : 'block'; }
/* shown with the rest of the HUD; the first time, a short note says it is there */
function jrnShow(on){
  const b=$('jrnBtn'); if(!b) return;
  b.style.top = isTouch ? '246px' : '200px';
  b.style.display = on ? 'flex' : 'none';
  b.title = tr('jTitle');
  jrnDot();
  if(on && !jrnSeen() && !jrnShow.told){ jrnShow.told=1; setTimeout(()=>{ if(!uiOpen()) toast(tr('jToast')+(isTouch?'':'  (J)'), tr('jToastB')); }, 4200); }
}
