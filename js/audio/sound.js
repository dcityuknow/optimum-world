/* ------------------------------ SOUND ------------------------------ */
const SFX={ctx:null,on:true,master:null,noise:null,amb:null};
/* start it, and unstick it: Chrome hands back a suspended context if the
   page has been idle, and a suspended context plays nothing at all */
let sfxUnlocked=false;
function sfxWake(){
  sfxInit();
  if(!SFX.ctx) return;
  if(SFX.ctx.state==='suspended'){ try{ SFX.ctx.resume(); }catch(e){} }
  if(sfxUnlocked) return;
  sfxUnlocked=true;
  /* iOS will not let a context out of silence until a buffer has actually
     been started inside a user gesture, however awake the context says it
     is. An empty one-sample buffer is enough to satisfy it. */
  try{
    const b=SFX.ctx.createBuffer(1,1,22050), s=SFX.ctx.createBufferSource();
    s.buffer=b; s.connect(SFX.ctx.destination); s.start(0);
  }catch(e){}
  primeTracks();
}
/* The music runs off <audio> elements, and iOS blocks the first play() of
   each element unless it comes from a gesture. They are built and started
   lazily from the render loop, which is never a gesture, so on a phone the
   music could never begin. Creating them here, inside the tap, and giving
   each a silent play/pause marks them as user-approved for later. */
const TRACKDEF=[['muriel',['assets/audio/music/Muriel.mp3','assets/audio/music/muriel.mp3'],0.55],
                ['party', ['assets/audio/music/Music.mp3','assets/audio/music/music.mp3'],  0.92],
                ['crowd', ['assets/audio/ambient/crowd.mp3','assets/audio/ambient/Crowd.mp3'],  0.52],
                ['sea',   ['assets/audio/ambient/sea.mp3','assets/audio/ambient/Sea.mp3'],      0.62],
                ['fountain',['assets/audio/ambient/fountain.mp3','assets/audio/ambient/Fountain.mp3'],0.09]];
function primeTracks(){
  TRACKDEF.forEach(d=>{
    const t=makeTrack(d[0],d[1],d[2]);
    if(!t || t.missing) return;
    try{
      const p=t.el.play();
      if(p && p.then) p.then(()=>{ if(!t.started) t.el.pause(); }).catch(()=>{});
      else if(!t.started) t.el.pause();
    }catch(e){}
  });
}
function sfxInit(){
  if(SFX.ctx) return;
  /* By default iOS files a web page's audio under the ambient category, and
     the ambient category is exactly what the ring/silent switch on the side
     of the phone mutes. Asking for playback instead is why a video plays
     with the switch flipped and this did not. */
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  try{ SFX.ctx=new AC(); }catch(e){ return; }
  SFX.master=SFX.ctx.createGain(); SFX.master.gain.value=0.55; SFX.master.connect(SFX.ctx.destination);
  const sr=SFX.ctx.sampleRate, b=SFX.ctx.createBuffer(1,Math.floor(sr*0.3),sr), d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  SFX.noise=b;
  loadShots();
  loadBank();
}
