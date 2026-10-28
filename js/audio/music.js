/* ------------------------------ MUSIC ------------------------------
   Loops served from assets/audio/music and assets/audio/ambient. Both run through a gain
   node because Safari on iOS ignores element.volume outright. */
const TRACKS={};
function makeTrack(id,url,vol){
  if(TRACKS[id]) return TRACKS[id];
  if(!SFX.ctx) return null;
  /* GitHub Pages is case sensitive, so try every spelling of the file name */
  const alts = Array.isArray(url) ? url.slice() : [url];
  const el=new Audio(); el.loop=true; el.preload='auto'; el.src=alts.shift();
  const t={el:el, gain:SFX.ctx.createGain(), src:null, started:false, target:0, max:vol||0.7, missing:false};
  t.gain.gain.value=0;
  t.gain.connect(SFX.master);
  el.addEventListener('error',()=>{
    if(alts.length){
      el.src=alts.shift(); el.load();
      if(t.target>0.001){ const pl=el.play(); if(pl&&pl.catch) pl.catch(()=>{}); }
    } else t.missing=true;
  });
  try{ t.src=SFX.ctx.createMediaElementSource(el); t.src.connect(t.gain); }
  catch(e){ t.missing=true; }
  return (TRACKS[id]=t);
}
function trackVolume(t,v){
  if(!t||t.missing||!SFX.ctx) return;
  t.target=Math.max(0,Math.min(1,v))*t.max*(SFX.on?1:0);
  if(t.target>0.001 && t.el.paused){
    t.started=true;
    const p=t.el.play(); if(p&&p.catch) p.catch(()=>{});   // retried next frame if blocked
  }
  const now=SFX.ctx.currentTime;
  try{ t.gain.gain.setTargetAtTime(t.target, now, 0.25); }catch(e){}
  if(t.target<=0.001 && t.started && t.el.paused===false && t.gain.gain.value<0.002){
    /* keep it running: restarting mid track sounds worse than a silent stream */
  }
}
/* linear falloff: full volume close in, silent past far */
function distGain(d,near,far){
  if(d<=near) return 1;
  if(d>=far) return 0;
  return 1-(d-near)/(far-near);
}
function blip(f,dur,type,vol){
  if(!SFX.ctx||!SFX.on) return;
  const o=SFX.ctx.createOscillator(), g=SFX.ctx.createGain(), n=SFX.ctx.currentTime;
  o.type=type||'sine'; o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,n);
  g.gain.linearRampToValueAtTime(vol||0.14,n+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,n+(dur||0.12));
  o.connect(g); g.connect(SFX.master); o.start(n); o.stop(n+(dur||0.12)+0.03);
}
/* the afterparty deck is 44 by 32 planks, so steps on it are wood */
function onPlanks(){
  if(typeof floorY!=='undefined' && floorY>0.3) return true;    // the pier
  if(typeof PARTY_ON==='undefined' || !PARTY_ON) return false;
  return Math.abs(player.x-PARTY_AT.x)<21.5 && Math.abs(player.z-PARTY_AT.z)<15.5;
}
let stepIdx=0, woodIdx=0;
function stepSound(){
  if(!SFX.ctx||!SFX.on) return;
  let id;
  if(onPlanks()){ woodIdx^=1; id='step_wood'+(woodIdx+1); }
  else {
    /* skip 1 to 3 ahead so the same clip never lands twice in a row and the
       walk cycle stops sounding like a metronome */
    stepIdx=(stepIdx+1+Math.floor(Math.random()*3))%4;
    id='step'+(stepIdx+1);
  }
  const v=(INDOORS?0.44:0.36)*(0.82+Math.random()*0.34);
  if(playSfx(id, v, 0.93+Math.random()*0.14)) return;
  if(!SFX.noise) return;
  const n=SFX.ctx.currentTime;
  const s=SFX.ctx.createBufferSource(); s.buffer=SFX.noise;
  const f=SFX.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=480+Math.random()*300;
  const g=SFX.ctx.createGain();
  g.gain.setValueAtTime(0.075,n);
  g.gain.exponentialRampToValueAtTime(0.0001,n+0.15);
  s.connect(f); f.connect(g); g.connect(SFX.master); s.start(n); s.stop(n+0.2);
}
let swingT=0;
function swingHeld(){
  if(CINE||panelOpen||DLG||photoMode||mapOpen) return false;
  if(HELD!=='katana' && HELD!=='shovel') return false;
  if(swingT>0) return false;
  swingT=0.42;
  playShot('hit',0.9,0);
  const dx0=-Math.sin(player.yaw), dz0=-Math.cos(player.yaw);
  let hit=false;
  for(let i=0;i<crowdList.length;i++){
    const p=crowdList[i].p;
    const dx=p.position.x-player.x, dz=p.position.z-player.z, d=Math.hypot(dx,dz);
    if(d<0.05 || d>3.4) continue;
    if((dx*dx0+dz*dz0)/d < 0.3) continue;          // only what is in front of you
    const k=p.userData.kick || {ax:0,az:0,ay:0,vx:0,vz:0,vy:0};
    k.vx += (dx/d)*6.2; k.vz += (dz/d)*6.2;     // a second hit adds to the first
    k.vy = Math.max(k.vy, 3.3);                 // and lifts him off his feet
    p.userData.kick=k;
    hit=true;
  }
  if(hit) playShot('death',0.85,0.16);
  return true;
}
/* whatever you are carrying that can be swung, in preference order */
function swingable(){
  if(HELD==='katana'||HELD==='shovel') return HELD;
  if(hasItem('katana')) return 'katana';
  if(hasItem('shovel')) return 'shovel';
  return null;
}
function updateHitBtn(){
  const b=$('hitBtn'); if(!b) return;
  /* carrying is enough. Requiring it to be equipped first hid the button
     behind a hotbar step that is not obvious on a touch screen. */
  const s = swingable();
  b.style.display = (isTouch && !photoMode && obDone && s) ? 'flex':'none';
  b.textContent = s==='shovel' ? '\u26CF' : '\u2694';
}
function sfxClick(){ if(!playSfx('ui',0.45)) blip(680,0.05,'triangle',0.08); }
function sfxPanel(){ if(playSfx('ui',0.55,0.82)) return;
  blip(523,0.09,'sine',0.11); setTimeout(()=>blip(784,0.11,'sine',0.09),70); }
function sfxShutter(){ if(playSfx('shutter',0.8)) return;
  blip(1500,0.035,'square',0.09); setTimeout(()=>blip(940,0.06,'square',0.08),55); }
/* No ambience layer at all: no drone, no birds, no wind. The world is quiet
   apart from footsteps, the music tracks and whatever you set off yourself. */
let INDOORS=false, WASIN=false;
function ambient(){}
function showPlinth(on){
  const sh=PARTY && PARTY.userData.plinth; if(!sh) return;
  sh.visible=on;
  if(sh.userData.col) sh.userData.col.visible=on;
}
function toggleSound(){
  SFX.on=!SFX.on;
  for(const k in TRACKS){ const t=TRACKS[k]; if(t&&!t.missing){
    try{ t.gain.gain.setTargetAtTime(SFX.on? t.target : 0, SFX.ctx.currentTime, 0.15); }catch(e){}
  }}
  $('sndBtn').style.opacity=SFX.on?'1':'.45';
  try{ store.set('optimum-world:snd', SFX.on?'1':'0'); }catch(e){}
}
