/* ------------------------------ SOUNDS ------------------------------ */
function bulk(){
  if(!SFX.ctx||!SFX.on) return;
  const c=SFX.ctx, n=c.currentTime;
  const drop=(t0,f0,f1,v)=>{ const o=c.createOscillator(), g=c.createGain(); o.type='sine';
    o.frequency.setValueAtTime(f0,t0); o.frequency.exponentialRampToValueAtTime(f1,t0+0.22);
    g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(v,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.3);
    o.connect(g); g.connect(SFX.master); o.start(t0); o.stop(t0+0.34); };
  drop(n,380,70,0.36); drop(n+0.17,300,90,0.22); drop(n+0.31,240,110,0.12);
  const len=(c.sampleRate*0.45)|0, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);
  const s=c.createBufferSource(); s.buffer=buf; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=800;
  const g2=c.createGain(); g2.gain.value=0.55; s.connect(f); f.connect(g2); g2.connect(SFX.master); s.start(n+0.01);
}
function squelch(){ blip(150,0.25,'sine',0.12); setTimeout(()=>blip(110,0.3,'sine',0.1),120); }

/* ------------------------------ THE RIDE ------------------------------ */
const RIDE_LET='QWERTYUIOPASDFGHJKLZXCVBNM';
const ARROWS={U:'↑',D:'↓',L:'←',R:'→'};
const KEYSYM={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R'};
const SEAT=new THREE.Vector3(0.05,0.62,0);
const RV=new THREE.Vector3(), RV2=new THREE.Vector3();
function ease(k){ k=Math.max(0,Math.min(1,k)); return k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2; }
function pitWorld(x,y,z){ return BULLRIG.pit.localToWorld(new THREE.Vector3(x,y,z)); }
function rideCams(){
  const C=RODEO.C, dx=PARTY_AT.x-C.x, dz=PARTY_AT.z-C.z, L=Math.hypot(dx,dz), ux=dx/L, uz=dz/L;
  const a=0.9, ax=ux*Math.cos(a)-uz*Math.sin(a), az=ux*Math.sin(a)+uz*Math.cos(a);
  return { ride:new THREE.Vector3(C.x+ux*7.0, 4.3, C.z+uz*7.0),
           intro:new THREE.Vector3(C.x+ax*10.5, 6.8, C.z+az*10.5) };
}
function rideStart(again){
  if(RIDE || !RODEO || !BULLRIG || !avatar) return;
  closeBoard();
  keys={}; running=false; freeCursor();
  if(document.pointerLockElement) document.exitPointerLock();
  if(!again){ RIDE_HELD=HELD; }
  if(HELD) equip(HELD);                        // hands free for the rope
  document.body.classList.add('riding');
  const cams=rideCams();
  RIDE={phase:'intro', t0:performance.now(), again:!!again, cams:cams,
        el:0, bal:100, sym:null, due:0, win:1.6, letters:false, hits:0, score:0, lastSym:'',
        fallV:null, landed:0, camP:camera.position.clone(), look:new THREE.Vector3(RODEO.C.x,2.6,RODEO.C.z)};
  /* where you start the hop from: next to LarOs, or out of the mud */
  RIDE.from = again && avatar.parent===scene ? avatar.position.clone() : new THREE.Vector3(player.x,0,player.z);
  if(!again){ RIDE.camP.copy(cams.intro); }
  BULLRIG.spd=1;
  scene.attach(avatar);
  avatar.visible=true; avatar.scale.setScalar(0.82); avatar.rotation.set(0,0,0);
  avatar.position.copy(RIDE.from);
  for(const k of ['legL','legR','armL','armR']) aParts[k].rotation.set(0,0,0);
  $('rideHUD').style.display='block'; $('rideRes').style.display='none';
  $('rhPad').style.display=isTouch?'flex':'none'; $('rhPad').innerHTML='';
  rideHudPhase(); rideHud();
  $('rhKey').style.visibility='hidden';
  RODEO.mud.visible=true; RODEO.mudM.opacity=1;
  if(!again) RODEO.mud.scale.setScalar(0.01);
  Q.bm=1; saveQuests();
}
/* Bobby: off the bull with a hop, onto the rim, and back on afterwards */
function bobbyOff(k){
  const R=BULLRIG, b=R.rider;
  if(R.bobbyOn){
    R.bobbyOn=false; scene.attach(b);
    R.bobFrom=b.position.clone();
    R.bobTo=pitWorld(-1.6,1.0,4.5);
    R.bobYaw=Math.atan2(RODEO.C.x-R.bobTo.x, RODEO.C.z-R.bobTo.z);
  }
  const e=ease(k), f=R.bobFrom, to=R.bobTo;
  b.position.set(f.x+(to.x-f.x)*e, f.y+(to.y-f.y)*e+Math.sin(Math.min(1,k)*Math.PI)*1.6, f.z+(to.z-f.z)*e);
  b.rotation.set(0, R.bobYaw, -Math.sin(Math.min(1,k)*Math.PI)*0.5);
  R.rl.legL.rotation.set(0,0,0); R.rl.legR.rotation.set(0,0,0);
  R.rl.armL.rotation.set(-2.6,0,0.3); R.rl.armR.rotation.set(-2.6,0,-0.3);
}
function bobbyOn(){
  const R=BULLRIG, b=R.rider; if(R.bobbyOn) return;
  R.bull.attach(b);
  b.position.set(0.05,0.66,0); b.rotation.set(0,Math.PI/2,0); b.scale.setScalar(0.95);
  R.rl.legL.rotation.set(-0.30,0,-0.80); R.rl.legR.rotation.set(-0.30,0,0.80);
  R.bobbyOn=true;
}
function seatAvatar(){
  BULLRIG.bull.attach(avatar);
  avatar.position.copy(SEAT); avatar.rotation.set(0,Math.PI/2,0); avatar.scale.setScalar(0.95);
  aParts.legL.rotation.set(-0.3,0,-0.8); aParts.legR.rotation.set(-0.3,0,0.8);
}
function nextPrompt(){
  const R=RIDE;
  const pool = R.letters ? RIDE_LET : 'UDLR';
  let s; do{ s=pool[(Math.random()*pool.length)|0]; } while(s===R.lastSym);
  R.sym=s; R.lastSym=s;
  /* the window narrows as the ride goes on; letters get a little extra */
  R.win = R.letters ? Math.max(0.62, 1.9-R.el*0.04) : Math.max(0.6, 1.6-R.el*0.045);
  R.due=R.el+R.win;
  const cap=$('rhCap'); cap.textContent = R.letters ? s : ARROWS[s];
  cap.className='cap'; void cap.offsetWidth; cap.classList.add('in');
  if(isTouch) ridePad();
}
function ridePad(){
  const R=RIDE, pad=$('rhPad'); pad.innerHTML='';
  let opts;
  if(!R.letters) opts=['L','U','D','R'];
  else { opts=[R.sym]; while(opts.length<4){ const c=RIDE_LET[(Math.random()*26)|0]; if(opts.indexOf(c)<0) opts.push(c); }
         for(let i=opts.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; const t=opts[i]; opts[i]=opts[j]; opts[j]=t; } }
  opts.forEach(o=>{ const b=document.createElement('button'); b.textContent=R.letters?o:ARROWS[o];
    b.addEventListener('touchstart',e=>{ e.preventDefault(); rideInput(o); },{passive:false});
    b.addEventListener('click',()=>rideInput(o)); pad.appendChild(b); });
}
function rideKey(e){
  if(e.code==='Escape'){ if(RIDE && RIDE.phase==='ride') rideFall(); else if(RIDE && RIDE.phase==='result') rideEnd(); return; }
  if(!RIDE || RIDE.phase!=='ride') return;
  /* arrows by arrow keys or WASD; letters by letter keys only. The arrow down
     used to come through as 'D', which the WASD map then turned into right */
  let s=null;
  if(!RIDE.letters) s = KEYSYM[e.code] || {KeyW:'U',KeyS:'D',KeyA:'L',KeyD:'R'}[e.code] || null;
  else if(e.code.indexOf('Key')===0) s=e.code.slice(3);
  if(s) rideInput(s);
}
function rideInput(s){
  const R=RIDE; if(!R || R.phase!=='ride' || !R.sym) return;
  const cap=$('rhCap');
  if(s===R.sym){
    R.hits++; R.bal=Math.min(100,R.bal+8);
    if(!playSfx('ui',0.55,1.25)) blip(880,0.06,'sine',0.07);
    cap.className='cap ok';
    R.sym=null; setTimeout(()=>{ if(RIDE===R && R.phase==='ride') nextPrompt(); },110);
  } else {
    R.bal-=30; blip(160,0.14,'square',0.05);
    cap.className='cap bad';
    setTimeout(()=>{ if(cap.className==='cap bad') cap.className='cap'; },260);
  }
  rideHud();
  if(R.bal<=0) rideFall();
}
function rideHudPhase(){
  $('rhPhase').textContent = RIDE.letters ? tr('rdLetterTag') : tr('rdArrows');
  $('rhHint').textContent = isTouch ? '' : tr('rdKeyHint');
}
function rideHud(){
  const R=RIDE;
  $('rhTime').textContent=R.el.toFixed(1);
  $('rhBest').textContent= Q.bb>0 ? tr('rdBest')+' '+(Q.bb/10).toFixed(1)+' s' : '';
  const b=$('rhBalI'); b.style.width=Math.max(0,R.bal)+'%';
  b.style.background = R.bal>55 ? '#64E27F' : (R.bal>28 ? '#FEA158' : '#FF5A4A');
  $('rhSpeed').textContent='x'+BULLRIG.spd.toFixed(1);
}
function rideMsg(txt){ const m=$('rhMsg'); m.textContent=txt; m.className=''; void m.offsetWidth; m.className='on'; }
function rideFall(){
  const R=RIDE; if(!R || R.phase!=='ride') return;
  R.phase='fall'; R.t0=performance.now(); R.score=R.el;
  $('rhKey').style.visibility='hidden'; $('rhPad').innerHTML='';
  /* thrown off sideways, out over the mud */
  scene.attach(avatar);
  /* thrown towards the camera's side of the bull, so the bull never hides the landing */
  const cx=R.cams.ride.x-RODEO.C.x, cz=R.cams.ride.z-RODEO.C.z;
  const ang=Math.atan2(cz,cx)+(Math.random()-0.5)*2.0, sp=2.2+Math.random()*0.6;
  R.fallV=[Math.cos(ang)*sp, 5.2, Math.sin(ang)*sp];
  R.spin=(Math.random()<0.5?-1:1)*7;
  R.landed=0;
  blip(330,0.2,'sawtooth',0.05);
}
function splash(p){
  bulk();
  RODEO.drops.forEach(d=>{ d.m.visible=true; d.m.position.set(p.x+(Math.random()-0.5)*0.4,p.y+0.1,p.z+(Math.random()-0.5)*0.4);
    const a=Math.random()*6.283, s=1.5+Math.random()*3.2; d.v=[Math.cos(a)*s, 3+Math.random()*4.5, Math.sin(a)*s]; });
  const r=RODEO.ring; r.visible=true; r.position.set(p.x,p.y+0.03,p.z); r.scale.setScalar(1); r.material.opacity=0.85; RODEO.ringT=performance.now();
}
function rideResult(){
  const R=RIDE; R.phase='result';
  const s=Math.round(R.score*10)/10, prev=Q.bb/10;
  const rec = s>prev && s>0;
  if(rec){ Q.bb=Math.round(s*10); saveQuests(); lbSubmit(s); }
  $('rrT').textContent=tr('rdBulk');
  $('rrHeld').textContent=tr('rdHeld').replace('{s}',s.toFixed(1));
  $('rrBest').textContent= rec ? tr('rdRecord') : tr('rdBestIs').replace('{s}',prev.toFixed(1));
  $('rrBest').className = rec ? 'rec' : '';
  const q=trList('rdQuips'); $('rrQuip').textContent='LarOs: '+q[(Math.random()*q.length)|0];
  $('rrAgain').textContent=tr('rdAgain'); $('rrBoard').textContent=tr('rBoard'); $('rrExit').textContent=tr('rdExit');
  $('rideRes').style.display='flex';
  if(rec) questCue();
}
/* the nearest place you can actually stand: the spot itself if it is clear,
   otherwise the first free point on widening rings around it */
function freeSpot(x,z){
  if(!blocked(x,z)) return {x:x,z:z};
  for(let r=0.4;r<=8;r+=0.4){
    for(let k=0;k<24;k++){
      const a=k/24*Math.PI*2, nx=x+Math.cos(a)*r, nz=z+Math.sin(a)*r;
      if(!blocked(nx,nz)) return {x:nx,z:nz};
    }
  }
  return {x:x,z:z};
}
function rideEnd(){
  const R=RIDE; if(!R) return;
  $('rideRes').style.display='none'; $('rideHUD').style.display='none';
  document.body.classList.remove('riding');
  closeBoard();
  /* back on your feet beside LarOs, turned to the bull */
  scene.attach(avatar);
  avatar.visible=false; avatar.scale.setScalar(0.82); avatar.rotation.set(0,0,0);
  for(const k of ['legL','legR','armL','armR']) aParts[k].rotation.set(0,0,0);
  /* beside LarOs on the deck side, clear of the pit: the old spot sat 0.1 m
     from the pit's box and inside your own radius, so every step was blocked */
  const fs=freeSpot(RODEO.lx+1.0, RODEO.lz+1.3);
  player.x=fs.x; player.z=fs.z;
  player.yaw=Math.atan2(-(RODEO.C.x-player.x), -(RODEO.C.z-player.z)); player.pitch=-0.12;
  avatar.position.set(player.x,0,player.z);
  if(camera.fov!==66){ camera.fov=66; camera.updateProjectionMatrix(); }
  bobbyOn(); BULLRIG.amp=1; BULLRIG.spd=1;
  RODEO.drops.forEach(d=>d.m.visible=false); RODEO.ring.visible=false;
  /* the mud dries off over a couple of seconds */
  const t0=performance.now();
  const dry=()=>{ const k=(performance.now()-t0)/1800; RODEO.mudM.opacity=Math.max(0,1-k);
    if(k<1 && !RIDE) requestAnimationFrame(dry); else if(!RIDE){ RODEO.mud.visible=false; RODEO.mudM.opacity=1; } };
  if(RIDE_HELD && hasItem(RIDE_HELD)) equip(RIDE_HELD); RIDE_HELD=null;
  RIDE=null;
  dry();
  if(!isTouch && renderer) renderer.domElement.requestPointerLock();
}
/* one frame of the ride: the world keeps moving, the camera is ours */
function rideFrame(t,dt){
  const R=RIDE, BR=BULLRIG, now=performance.now();
  const e=(now-R.t0)/1000;
  const seatW=()=>BR.bull.localToWorld(RV.copy(SEAT));
  let camTo=R.cams.ride, lookTo=RV2.set(RODEO.C.x,3.0,RODEO.C.z), camK=Math.min(1,dt*3);
  if(R.phase==='intro'){
    const D = R.again ? 1.3 : 3.4;
    if(!R.again){
      BR.amp=Math.max(0.12, 1-e*2.2);
      if(e>0.35) bobbyOff(Math.min(1,(e-0.35)/0.95));
      RODEO.mud.scale.setScalar(0.01+0.99*ease((e-2.35)/0.7));
      if(e>2.35 && !R.sq){ R.sq=1; squelch(); }
      const k=ease(e/D); camTo=RV.copy(R.cams.intro).lerp(R.cams.ride,k).clone(); camK=1;
    } else { BR.amp=Math.max(0.15,BR.amp-dt*2); camTo=R.cams.ride; }
    /* the hop on */
    const h0 = R.again ? 0.1 : 1.35, h1 = h0+0.95;
    if(e>=h0 && e<h1){
      const k=ease((e-h0)/(h1-h0)), f=R.from, s=seatW();
      avatar.position.set(f.x+(s.x-f.x)*k, f.y+(s.y-f.y)*k+Math.sin(k*Math.PI)*1.5, f.z+(s.z-f.z)*k);
      avatar.rotation.set(Math.sin(k*Math.PI)*0.4, Math.atan2(s.x-f.x,s.z-f.z), 0);
      aParts.legL.rotation.x=-0.9*Math.sin(k*Math.PI); aParts.legR.rotation.x=-0.9*Math.sin(k*Math.PI);
    } else if(e>=h1 && avatar.parent!==BR.bull){ seatAvatar(); }
    else if(e<h0){ avatar.lookAt(RODEO.C.x,avatar.position.y,RODEO.C.z); }   // turned to the bull, about to jump
    if(e>=D){
      if(avatar.parent!==BR.bull) seatAvatar();
      R.phase='ride'; R.t0=now; R.el=0; BR.amp=1;
      rideMsg(tr('rdHold'));
      $('rhKey').style.visibility='visible';
      setTimeout(()=>{ if(RIDE===R && R.phase==='ride') nextPrompt(); },450);
    }
  } else if(R.phase==='ride'){
    R.el=e;
    if(!R.letters && R.el>=12){ R.letters=true; rideHudPhase(); rideMsg(tr('rdLetters')); R.sym=null; setTimeout(()=>{ if(RIDE===R && R.phase==='ride') nextPrompt(); },500); }
    if(R.el>0.5 && Math.floor(R.el/8)!==Math.floor((R.el-dt)/8) && Math.floor(R.el/8)!==1) rideMsg(tr('rdFaster'));
    BR.amp=1+Math.min(1.25,R.el*0.045);
    BR.spd=1+Math.min(1.8,R.el*0.055);
    if(R.sym && R.el>R.due){
      R.bal-=40; blip(140,0.18,'square',0.05);
      const cap=$('rhCap'); cap.className='cap bad';
      R.sym=null;
      if(R.bal<=0){ rideHud(); rideFall(); }
      else setTimeout(()=>{ if(RIDE===R && R.phase==='ride') nextPrompt(); },260);
    }
    /* the countdown ring round the key */
    if(R.sym){ const left=Math.max(0,(R.due-R.el)/R.win); $('rhRing').style.strokeDashoffset=(1-left)*301.6; }
    /* the rider leans the way the bull throws, more as the balance goes */
    const lean=(100-R.bal)/100;
    avatar.rotation.z=-Math.sin(BR.ph)*(0.2+lean*0.35);
    aParts.armL.rotation.set(-0.75,0,0.55);
    aParts.armR.rotation.set(-2.3-Math.sin(BR.ph*1.7)*0.35*(1+lean),0,-0.7);
    rideHud();
    const sh=0.03*BR.amp;
    camTo=RV.copy(R.cams.ride).add(new THREE.Vector3(Math.sin(t*13)*sh, Math.sin(t*17)*sh, 0)).clone();
    lookTo=seatW().clone(); lookTo.y+=0.7;
  } else if(R.phase==='fall' || R.phase==='result'){
    BR.amp=Math.max(0.15,BR.amp-dt*1.5); BR.spd=Math.max(0.6,BR.spd-dt);
    if(R.fallV && !R.landed){
      const v=R.fallV, d=Math.min(dt,0.04);
      v[1]-=14*d;
      avatar.position.x+=v[0]*d; avatar.position.y+=v[1]*d; avatar.position.z+=v[2]*d;
      avatar.rotation.x+=R.spin*d*0.6; avatar.rotation.z+=R.spin*d;
      aParts.armL.rotation.x=-2.8; aParts.armR.rotation.x=-2.8; aParts.legL.rotation.x=-1; aParts.legR.rotation.x=0.6;
      /* keep inside the mud: the pit is 5.7 across, the mud a bit over 3 */
      const dx=avatar.position.x-RODEO.C.x, dz=avatar.position.z-RODEO.C.z, rr=Math.hypot(dx,dz);
      if(rr>3.2){ avatar.position.x=RODEO.C.x+dx/rr*3.2; avatar.position.z=RODEO.C.z+dz/rr*3.2; v[0]*=0.3; v[2]*=0.3; }
      if(avatar.position.y<=0.9 && v[1]<0){
        avatar.position.y=1.12; R.landed=now;
        avatar.rotation.set(-1.45,avatar.rotation.y,0);          // flat on your back
        aParts.armL.rotation.set(-1.2,0,0.9); aParts.armR.rotation.set(-1.2,0,-0.9);
        aParts.legL.rotation.set(-0.2,0,-0.3); aParts.legR.rotation.set(-0.2,0,0.3);
        splash(avatar.position);
      }
    }
    if(R.landed && R.phase==='fall' && now-R.landed>1300) rideResult();
    const ap=avatar.position, C=RODEO.C;
    const ux=R.cams.ride.x-C.x, uz=R.cams.ride.z-C.z, L=Math.hypot(ux,uz);
    camTo=new THREE.Vector3(C.x+ux/L*7.2, 4.0, C.z+uz/L*7.2);
    lookTo=new THREE.Vector3(ap.x,ap.y+0.3,ap.z);
    camK=Math.min(1,dt*2.5);
  }
  /* the mud splash: drops fly and settle, the ring spreads and fades */
  if(RODEO.drops[0].m.visible){
    const d2=Math.min(dt,0.04);
    RODEO.drops.forEach(d=>{ const m=d.m; if(m.position.y<=1.02 && d.v[1]<=0){ m.position.y=1.02; return; }
      d.v[1]-=12*d2; m.position.x+=d.v[0]*d2; m.position.y+=d.v[1]*d2; m.position.z+=d.v[2]*d2; });
  }
  if(RODEO.ring.visible){ const k=(now-RODEO.ringT)/900; RODEO.ring.scale.setScalar(1+k*7); RODEO.ring.material.opacity=Math.max(0,0.85*(1-k)); if(k>1) RODEO.ring.visible=false; }
  /* Bobby cheers from the rim while you are up there */
  if(!BR.bobbyOn && R.phase!=='intro'){ BR.rl.armL.rotation.x=-2.6+Math.sin(t*7)*0.35; BR.rl.armR.rotation.x=-2.6-Math.sin(t*7)*0.35;
    BR.rider.position.y=BR.bobTo.y+Math.abs(Math.sin(t*7))*0.12; }
  for(let i=0;i<anims.length;i++) anims[i](t,dt);
  updateMarkers(t);
  R.camP.lerp(camTo,camK);
  R.look.lerp(lookTo,Math.min(1,dt*6));
  camera.position.copy(R.camP);
  camera.lookAt(R.look);
  if(camera.fov!==58){ camera.fov=58; camera.updateProjectionMatrix(); }
  skyFollow();
  renderer.render(scene,camera);
}
$('rrAgain').addEventListener('click',()=>{ const R=RIDE; if(!R) return; $('rideRes').style.display='none';
  RIDE=null; document.body.classList.remove('riding'); rideStart(true); });
$('rrBoard').addEventListener('click',openBoard);
$('rrExit').addEventListener('click',rideEnd);
$('lbX').addEventListener('click',closeBoard);
$('lbP').addEventListener('click',e=>{ if(e.target.id==='lbP') closeBoard(); });

Object.assign(NODES,{
  lar_1:{ speaker:()=>({look:SKINS.laros, name:'LarOs', role:tr('larRole'), colour:'#E0332A'}), line:()=>D('lar1'),
    enter:()=>{ if(!Q.bm){ Q.bm=1; saveQuests(); } },
    replies:()=>[{t:D('rHow'), go:'lar_2', key:1},{t:D('rWho'), go:'lar_about'},{t:D('rBye')}]},
  lar_2:{ speaker:()=>({look:SKINS.laros, name:'LarOs', role:tr('larRole'), colour:'#E0332A'}), line:()=>D('lar2'),
    replies:()=>[{t:D('rRide'), key:1, act:()=>setTimeout(()=>rideStart(false),80)},
                 {t:D('rBoard'), act:()=>setTimeout(openBoard,80)},{t:D('rBye')}]},
  lar_hi:{ speaker:()=>({look:SKINS.laros, name:'LarOs', role:tr('larRole'), colour:'#E0332A'}),
    line:()=> Q.bb>0 ? D('larBest').replace('{s}',(Q.bb/10).toFixed(1)) : D('larHi'),
    replies:()=>[{t:D('rRide'), key:1, act:()=>setTimeout(()=>rideStart(false),80)},
                 {t:D('rBoard'), act:()=>setTimeout(openBoard,80)},
                 {t:D('rHow'), go:'lar_2'},{t:D('rBye')}]},
  lar_about:{ speaker:()=>({look:SKINS.laros, name:'LarOs', role:tr('larRole'), colour:'#E0332A'}), line:()=>D('larAbout'),
    replies:()=>[{t:D('rBack'), go:Q.bb>0?'lar_hi':'lar_2', key:1}]}
});
