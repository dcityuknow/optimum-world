/* ------------------------------ FISHING ------------------------------
   Cast, wait, and strike on time. The marker sweeps the track and turns
   around at each end; the green zone sits in the middle. Press while the
   marker is inside it and the fish is landed.

   The golden one is a roll on every LANDED fish, not on every cast, so bad
   timing costs you attempts rather than luck. The chance climbs a little each
   time so a long cold streak cannot drag forever. Simulated over 200k runs:
   0.09 rising by 0.028 lands the golden one on the 5.5th fish on average,
   which at a realistic strike rate is about seven BITES, inside the five
   to eight that was asked for. */
const FISH={
  base:0.09, step:0.028, cap:0.62,
  /* the ordinary catch, for flavour on the way */
  kinds:['\u{1F41F}','\u{1F420}','\u{1F41F}','\u{1F988}','\u{1F421}','\u{1FAB8}','\u{1F45F}'],
};
let FG=null;                     // the running game, or null
function fishOpen(){
  if(FG) return;                  // already fishing: never start a second loop
  if(!hasItem('rod')){
    $('doneT').textContent=tr('fishNoRod'); $('doneB').textContent='';
    $('done').style.display='flex'; freeCursor(); return;
  }
  keys={}; running=false;
  FG={ state:'wait', bites:0, landed:0, pos:0.5, dir:1, speed:1.0,
       zone:0.17, t0:performance.now(), waitFor:900+Math.random()*2200,
       gold:false, raf:0 };
  $('fish').classList.add('on');
  freeCursor();
  fishFrame();
}
function fishClose(keepFree){
  if(FG && FG.raf) cancelAnimationFrame(FG.raf);
  FG=null;
  $('fish').classList.remove('on');
  /* keepFree: a card is about to go up and needs the mouse */
  if(!keepFree && !isTouch && !uiOpen() && renderer) renderer.domElement.requestPointerLock();
}
function fishTally(){
  $('fishTally').textContent=tr('fishTally')
    .replace('%b', FG?FG.bites:0).replace('%l', FG?FG.landed:0);
}
function fishBar(on){
  $('fishBar').style.visibility = on?'visible':'hidden';
  $('fishHit').textContent = on? 'STRIKE' : '\u2026';
  $('fishHit').style.opacity = on? '1':'0.45';
}
/* one cast: a quiet wait, then the window opens */
function fishCast(){
  FG.state='wait';
  FG.t0=performance.now();
  FG.waitFor=900+Math.random()*2400;
  $('fishHead').textContent=tr('fishCast');
  $('fishFoot').textContent=tr('fishWait');
  fishBar(false);
}
function fishBite(){
  FG.state='bite';
  FG.bites++;
  /* each bite has its own tempo and its own window, and the window narrows as
     you get better at it, so the fifth is not as easy as the first */
  FG.speed = 0.85 + Math.random()*1.15 + FG.landed*0.10;
  FG.zone  = Math.max(0.085, 0.185 - FG.landed*0.012);
  FG.pos   = Math.random()<0.5 ? 0.03 : 0.97;
  FG.dir   = FG.pos<0.5 ? 1 : -1;
  FG.t0=performance.now();
  $('fishHead').textContent=tr('fishBite');
  $('fishFoot').textContent='';
  const z=$('fishZone');
  z.style.left=((0.5-FG.zone/2)*100).toFixed(2)+'%';
  z.style.width=(FG.zone*100).toFixed(2)+'%';
  fishBar(true);
  fishTally();
  if(!playSfx('quest',0.5,1.3)) blip(880,0.07,'square',0.09);
}
function fishFrame(){
  if(!FG) return;
  FG.raf=requestAnimationFrame(fishFrame);
  const now=performance.now();
  if(FG.state==='wait'){
    if(now-FG.t0>FG.waitFor) fishBite();
    return;
  }
  if(FG.state!=='bite') return;
  const dt=Math.min(0.05,(now-FG.t0)/1000); FG.t0=now;
  FG.pos += FG.dir*FG.speed*dt;
  if(FG.pos>1){ FG.pos=1; FG.dir=-1; }
  if(FG.pos<0){ FG.pos=0; FG.dir=1; }
  $('fishMark').style.left='calc('+(FG.pos*100).toFixed(2)+'% - 3px)';
}
function fishStrike(){
  if(!FG) return;
  if(FG.state==='wait'){                       // struck at nothing
    if(!playSfx('ui',0.4,0.7)) blip(200,0.1,'sine',0.07);
    $('fishHead').textContent=tr('fishMiss');
    fishCast(); return;
  }
  if(FG.state!=='bite') return;
  const hit = Math.abs(FG.pos-0.5) <= FG.zone/2;
  if(!hit){
    FG.state='result';
    $('fishHead').textContent=tr('fishMiss');
    $('fishFoot').textContent='';
    fishBar(false);
    if(!playSfx('ui',0.5,0.62)) blip(150,0.18,'sine',0.08);
    setTimeout(()=>{ if(FG) fishCast(); }, 1100);
    return;
  }
  FG.landed++;
  const p=Math.min(FISH.cap, FISH.base + (FG.landed-1)*FISH.step);
  const gold = Math.random()<p;
  FG.state='result';
  fishBar(false);
  fishTally();
  if(gold){
    $('fishHead').textContent='\u2728 '+tr('fishGold');
    $('fishFoot').textContent='';
    if(!playSfx('found',0.9)) blip(1320,0.22,'sine',0.12);
    giveItem('golden');
    if(Q.fish===1){ Q.fish=2; saveQuests(); }
    setTimeout(()=>{
      fishClose(true);
      $('doneT').textContent=tr('fishDoneT');
      $('doneB').textContent=tr('fishDoneB');
      $('done').style.display='flex'; freeCursor(); questCue();
    }, 1200);
    return;
  }
  const k=FISH.kinds[(Math.random()*FISH.kinds.length)|0];
  $('fishHead').textContent=k+' '+tr('fishGot');
  $('fishFoot').textContent='';
  if(!playSfx('pickup',0.7)) blip(760,0.12,'sine',0.1);
  setTimeout(()=>{ if(FG) fishCast(); }, 1100);
}
