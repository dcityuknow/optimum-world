/* Sound effects: one mp3 per clip under assets/audio/sfx/, decoded once when audio unlocks.
   (CC0 clips from freesound.org, mono) */
const SNDB=Object.fromEntries(['step1','step2','step3','step4','step_wood1','step_wood2','ui','pickup','type','quest','dig1','dig2','found','shutter','door','gulp','strum','gull1','gull2','gull3'].map(k=>[k,'assets/audio/sfx/'+k+'.mp3']));
const SBUF={};
function decodeOne(k){
  if(SBUF[k]!==undefined || !SNDB[k]) return;
  SBUF[k]=null;
  fetch(SNDB[k])
    .then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(a=>new Promise((ok,no)=>SFX.ctx.decodeAudioData(a,ok,no)))
    .then(b=>{ SBUF[k]=b; })
    .catch(()=>{});              // not ready: callers fall back to the synth line
}
function loadBank(){
  if(!SFX.ctx) return;
  /* the click is the one you hear on the very next press, so it is decoded
     ahead of the footsteps and the guitar rather than behind them */
  decodeOne('ui');
  for(const k in SNDB) decodeOne(k);
}
/* returns false when the clip is not ready, so every caller can fall back
   to the old synth line and nothing ever goes silent */
function playSfx(id,vol,rate,delay){
  if(!SFX.ctx||!SFX.on) return false;
  const b=SBUF[id]; if(!b) return false;
  const s=SFX.ctx.createBufferSource(), g=SFX.ctx.createGain();
  s.buffer=b; s.playbackRate.value=rate||1;
  g.gain.value=(vol==null?0.8:vol);
  s.connect(g); g.connect(SFX.master);
  s.start(SFX.ctx.currentTime+(delay||0));
  return true;
}
/* one positive cue at a time: a find and a quest chime never stack */
let lastCue=0;
function cueOK(){ const n=performance.now(); if(n-lastCue<1400) return false; lastCue=n; return true; }
function questCue(){ if(cueOK() && !playSfx('quest',0.62)) blip(660,0.16,'sine',0.09); }

/* the two hit clips, decoded once so repeated swings can overlap */
const SND_HIT='assets/audio/sfx/hit.mp3';
const SND_DEATH='assets/audio/sfx/death.mp3';
const SHOTBUF={};
function loadShots(){
  if(!SFX.ctx) return;
  [['hit',SND_HIT],['death',SND_DEATH]].forEach(pair=>{
    if(SHOTBUF[pair[0]]!==undefined) return;
    SHOTBUF[pair[0]]=null;
    fetch(pair[1])
      .then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(a=>new Promise((ok,no)=>SFX.ctx.decodeAudioData(a,ok,no)))
      .then(buf=>{ SHOTBUF[pair[0]]=buf; })
      .catch(()=>{});
  });
}
function playShot(id,vol,delay){
  if(!SFX.ctx || !SFX.on) return;
  const buf=SHOTBUF[id]; if(!buf) return;
  const s=SFX.ctx.createBufferSource(), g=SFX.ctx.createGain();
  s.buffer=buf; g.gain.value=vol||0.8;
  s.connect(g); g.connect(SFX.master);
  s.start(SFX.ctx.currentTime+(delay||0));
}
