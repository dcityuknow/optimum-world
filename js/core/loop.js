/* ------------------------------ LOOP ------------------------------ */
function blocked(nx,nz){
  const R=0.55;
  for(let i=0;i<colliders.length;i++){
    const c=colliders[i];
    if(nx+R>c.x1&&nx-R<c.x2&&nz+R>c.z1&&nz-R<c.z2) return true;
  }
  return false;
}
function updateZone(){
  let k='cross';
  if(player.z<-20&&Math.abs(player.x)<60) k='city';
  else if(player.x<-20&&Math.abs(player.z)<60) k='team';
  else if(player.x>20&&Math.abs(player.z)<60) k='comm';
  zoneName=zn(k);
  /* This runs every frame. Writing innerHTML sixty times a second reparses
     the node and relayouts the banner for a string that changes maybe once
     a minute, so the DOM is only touched when the zone actually turns over
     or the language does. */
  if(k===curZoneKey && LANG===zoneLang) return;
  if(k!==curZoneKey && curZoneKey && SFX.ctx) blip(k==='cross'?392:523,0.16,'sine',0.06);
  curZoneKey=k; zoneLang=LANG;
  $('zone').innerHTML=tr('location')+'<b>'+zoneName+'</b>';
  if(!isTouch) $('compass').textContent=(ZS[k][LANG]||ZS[k].en);
}
let curZoneKey='', zoneLang='', stepAcc=0;
const SPK_V=new THREE.Vector3();
let XMAX=280, CEND=286, RESERVE=18;
/* the community row, in one place so scenery and houses cannot drift apart */
/* x0 is the plot the old fixed house stood on. Removing that house left a
   full plot of dead ground between the plaza and the first neighbour, so
   the whole row moved up into it instead of starting one plot late. */
const ROW={x0:38, step:20, z:30, front:19.5};
const rowX=i=>ROW.x0+i*ROW.step;
/* the plots on one side of the street: south takes the even ones, north the
   odd. A tree or a lamp on this verge only ever sits in a gap. */
function rowGaps(south, from, to){
  const out=[];
  for(let i=(south?1:0); rowX(i)<=to; i+=2){    // the other side's plots
    const x=rowX(i);
    if(x>=from) out.push(x);
  }
  return out;
}
function animate(){
  requestAnimationFrame(animate);
  try{ frame(); }catch(e){ if(!window.__loggedErr){ window.__loggedErr=1; showFatal('frame',e); } }
}
function frame(){
  const dt=Math.min(clock.getDelta(),0.05), t=clock.elapsedTime;
  drunkTick(dt);
  if(!obDone){
    obCamera(dt);
    for(let i=0;i<anims.length;i++) anims[i](t,dt);
    shadowTick++; if(shadowTick%12===0) renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);
    return;
  }

  let f=0,s=0;
  if(keys['KeyW']||keys['ArrowUp']) f+=1;
  if(keys['KeyS']||keys['ArrowDown']) f-=1;
  if(keys['KeyA']||keys['ArrowLeft']) s-=1;
  if(keys['KeyD']||keys['ArrowRight']) s+=1;
  if(isTouch){ f+=-stickVec.y; s+=stickVec.x; }
  const mag=Math.hypot(f,s); if(mag>1){ f/=mag; s/=mag; }
  /* you no longer walk where you are looking */
  if(DRUNK>0.02) s+=Math.sin(t*1.35+DRUNKPH)*DRUNK*0.52;

  const sp=(running?17.5:13)*((panelOpen||CODE_OPEN||QI_OPEN||WARD_OPEN||RIDE||LB_OPEN||JRN_OPEN)?0:1);
  const sy=Math.sin(player.yaw), cy=Math.cos(player.yaw);
  const dx=(-sy*f+cy*s)*sp*dt, dz=(-cy*f-sy*s)*sp*dt;
  stepAcc+=dt*Math.min(mag,1);
  if(stepAcc>(running?0.36:0.46)){ stepAcc=0; stepSound(); }
  if(swingT>0){
    swingT=Math.max(0,swingT-dt);
    const k=1-swingT/0.42, a=Math.sin(k*Math.PI);
    const vr=(HELD&&ITEMS[HELD]&&ITEMS[HELD].vrot)||[0.2,-0.4,0.15];
    if(viewItem){ viewItem.rotation.x=vr[0]-a*1.45; viewItem.rotation.z=(vr[2]||0)+a*0.85; }
    if(handItem) handItem.rotation.x=-a*1.7;
    if(swingT===0){
      if(viewItem){ viewItem.rotation.x=vr[0]; viewItem.rotation.z=vr[2]||0; }
      if(handItem) handItem.rotation.x=0;
    }
  }
  const inBox=blocked(player.x,player.z);
  if(inBox || !blocked(player.x+dx,player.z)) player.x+=dx;
  if(inBox || !blocked(player.x,player.z+dz)) player.z+=dz;
  player.x=Math.max(-320,Math.min(XMAX,player.x));
  /* the south bound is the waterline now, not an invisible wall in a field:
     you stop on the sand a few steps short of the foam */
  /* the waterline is the southern edge of the world, except along the pier:
     standing on the boards lets you walk out to its end */
  const onPier = pierEnd && Math.abs(player.x-PIER.x) < halfW(player.z);
  const southEdge = onPier ? PIER.z0+PIER.len-1.2 : SEA.shore-6;
  player.z=Math.max(-280,Math.min(southEdge,player.z));

  if(DLG){
    /* a quarter rate redraw while talking keeps the main thread free for the UI */
    dlgFrame=(dlgFrame+1)%4;
    if(dlgFrame===0) renderer.render(scene,camera);
    return;
  }
  if(RIDE){ rideFrame(t,dt); return; }      // on the bull the camera is the rodeo's
  if(cineStep()){
    updateMarkers(clock.elapsedTime);
    renderer.render(scene,camera);
    return;
  }
  camera.rotation.order='YXZ';
  camera.rotation.y=player.yaw; camera.rotation.x=player.pitch; camera.rotation.z=0;
  /* the head rolls and swims, but the photo mode stays sober so shots are usable */
  if(DRUNK>0.02 && !photoMode){
    const p=t+DRUNKPH;
    camera.rotation.z = (Math.sin(p*1.15)*0.055 + Math.sin(p*0.47)*0.032)*DRUNK;
    camera.rotation.y += Math.sin(p*0.83)*0.030*DRUNK;
    camera.rotation.x += Math.sin(p*1.41+1.7)*0.022*DRUNK;
  }
  if(photoMode && photoPov){
    if(avatar) avatar.visible=false;
    camera.position.set(player.x,1.7+floorY,player.z);   // on the pier you are 2.1 up
    const want=66/povZoom;
    if(Math.abs(camera.fov-want)>0.01){ camera.fov=want; camera.updateProjectionMatrix(); }
  } else if(photoMode && avatar){
    if(Math.abs(camera.fov-66)>0.01){ camera.fov=66; camera.updateProjectionMatrix(); }
    avatar.visible=true;
    avatar.position.set(player.x,floorY,player.z);
    avatar.rotation.y=player.yaw;
    const cp=Math.cos(player.pitch);
    const fx=-Math.sin(player.yaw)*cp, fy=Math.sin(player.pitch), fz=-Math.cos(player.yaw)*cp;
    const sf = photoDist<2.4;
    const eye = sf ? 1.86 : 1.5;
    let dd = photoDist;
    for(let i=0;i<7;i++){
      if(!blocked(player.x-fx*dd, player.z-fz*dd)) break;
      dd-=0.4;
    }
    dd=Math.max(1.0, dd);
    /* the avatar stands on the deck height, so the camera has to as well, or
       on the pier it ends up under the boards looking up at your legs */
    camera.position.set(player.x-fx*dd, eye+floorY-fy*dd+(sf?0.04:0.2), player.z-fz*dd);
    const sw=Math.sin(performance.now()*0.007)*Math.min(mag,1)*0.62;
    aParts.legL.rotation.x=sw; aParts.legR.rotation.x=-sw;
    aParts.armL.rotation.x=-sw*0.8;
    if(sf){ aParts.armR.rotation.x=-1.72; aParts.armR.rotation.z=0.62; }
    else { aParts.armR.rotation.x=sw*0.8; aParts.armR.rotation.z=0; }
    const wantSide = sf ? 'L' : 'R';
    if(handSide!==wantSide) mountHand(wantSide);
    // the tag keeps the same share of the screen at any distance
    const tw=Math.max(0.55, 0.40*dd), th=tw/4;
    aParts.spr.scale.set(tw,th,1);
    aParts.spr.position.y=2.56+(avatar&&avatar.userData.cap?0.46:0)+th/2;
  } else if(camBack>0.6 && avatar){
    if(Math.abs(camera.fov-66)>0.01){ camera.fov=66; camera.updateProjectionMatrix(); }
    avatar.visible=true;
    avatar.position.set(player.x,floorY,player.z);
    avatar.rotation.y=player.yaw+Math.PI;
    const cp=Math.cos(player.pitch);
    const fx=-Math.sin(player.yaw)*cp, fy=Math.sin(player.pitch), fz=-Math.cos(player.yaw)*cp;
    let dd=camBack;
    for(let i=0;i<7;i++){
      if(!blocked(player.x-fx*dd,player.z-fz*dd)) break;
      dd-=0.4;
    }
    dd=Math.max(1.0,dd);
    camera.position.set(player.x-fx*dd, 1.55+floorY-fy*dd+0.2, player.z-fz*dd);
    const sw=Math.sin(performance.now()*0.007)*Math.min(mag,1)*0.62;
    aParts.legL.rotation.x=sw; aParts.legR.rotation.x=-sw;
    aParts.armL.rotation.x=-sw*0.8; aParts.armR.rotation.x=sw*0.8; aParts.armR.rotation.z=0;
    if(handSide!=='R') mountHand('R');
    const tw=Math.max(0.55,0.40*dd), th=tw/4;
    aParts.spr.scale.set(tw,th,1); aParts.spr.position.y=2.56+(avatar&&avatar.userData.cap?0.46:0)+th/2;
  } else {
    if(avatar) avatar.visible=false;
    if(Math.abs(camera.fov-66)>0.01){ camera.fov=66; camera.updateProjectionMatrix(); }
    const bob=Math.sin(performance.now()*0.009)*Math.min(mag,1)*0.05;
    camera.position.set(player.x,1.7+floorY+bob,player.z);
  }
  /* every branch above pins the fov, so the beer breathing lands here */
  if(DRUNK>0.02 && !photoMode){
    const fv=camera.fov+Math.sin((t+DRUNKPH)*0.62)*5.5*DRUNK;
    camera.fov=fv; camera.updateProjectionMatrix();
  }

  updateMarkers(clock.elapsedTime);
  if(handItem) handItem.visible = !!(avatar && avatar.visible);
  if(viewItem) viewItem.visible = !(avatar && avatar.visible) && !photoMode;

  near=null; let best=1e9;
  for(const s2 of spots){
    if(s2.when && !s2.when()) continue;
    if((s2.bar||s2.dance) && !PARTY_ON) continue;
    if(s2.katanaPick && (hasItem('katana')||Q.katana===2)) continue;
    if(s2.fragPick && (hasItem('fragment')||Q.dig>=3)) continue;
    if((s2.guitarPick||s2.jam) && !PARTY_ON) continue;
    if(s2.guitarPick && hasItem('guitar')) continue;
    if(s2.dig && Q.dig===2) continue;
    const dd=Math.hypot(s2.x-player.x,s2.z-player.z);
    const w=s2.prio? dd-2.5 : dd;
    if(dd<s2.r && w<best){ best=w; near=s2; }
  }
  if(samuraiWalker){
    const dd=Math.hypot(samuraiWalker.position.x-player.x, samuraiWalker.position.z-player.z);
    if(dd<3.6 && dd-2.5<best){
      best=dd-2.5; near={samurai:1,accent:C.mint,data:{name:'samurai.itan'}};
    }
  }
  if(vsWalker && Q.katana===2){
    const dd=Math.hypot(vsWalker.position.x-player.x, vsWalker.position.z-player.z);
    if(dd<3.6 && dd-2.5<best){
      best=dd-2.5; near={vssema:1,accent:C.mint,data:{name:'vssema'}};
    }
  }
  for(let i=0;i<crowdList.length;i++){
    const c=crowdList[i], dd=Math.hypot(c.p.position.x-player.x,c.p.position.z-player.z);
    if(dd<3.6&&dd<best){ best=dd; near={person:c.d,data:{name:c.d.nick},zone:'comm',accent:C.mint}; }
  }
  const pr=$('prompt');
  if(near&&!panelOpen&&!photoMode){
    pr.style.display='block';
    $('promptText').textContent =
      near.label ? near.label() :
      near.bar   ? (tr('talkTo')+' Jeffrey') :
      near.dig   ? (Q.dig===2? '' : (HELD==='shovel'||hasItem('shovel')? tr('digNow') : tr('digNeed'))) :
      near.guitarPick ? tr('guitarGet') :
      near.jam ? (HELD==='guitar'? tr('jamPlay') : (hasItem('guitar')? tr('jamHold') : '')) :
      near.fragPick ? tr('fragGet') :
      near.katanaPick ? tr('katanaGet') :
      near.fishSpot ? tr('fishStart') :
      near.baised ? (tr('talkTo')+' baised') :
      near.samurai ? (tr('talkTo')+' samurai.itan') :
      near.vssema ? (tr('talkTo')+' vssema') :
      near.dance ? ((danceWith===near.folk)? tr('danceStop') : (tr('danceWith')+' '+near.data.name)) :
      near.person? (tr('meet')+' '+(near.data&&near.data.name||'')) : (tr('read')+' '+near.data.name);
  }
  else if((HELD==='beer'||HELD==='guitar') && !CINE){
    pr.style.display='flex';
    $('promptText').textContent = HELD==='beer' ? tr('drink') : tr('play');
    pr.style.setProperty('--pa', hx(HELD==='beer'? C.peach : C.lavender));
  }
  else pr.style.display='none';

  sun.position.set(player.x+55,110,player.z+45);
  sun.target.position.set(player.x,0,player.z);
  sun.target.updateMatrixWorld();
  /* The shadow pass redraws the whole city. Standing still needs no redraw at
     all, and while moving every second frame is indistinguishable. */
  shadowTick++;
  const moved=Math.abs(player.x-shadowAt.x)+Math.abs(player.z-shadowAt.z);
  /* Every fourth frame while walking is still smooth, and it is the single
     most expensive thing in the loop: the pass redraws every mesh in the
     city from the sun's point of view. */
  if(moved>0.9 || shadowTick%45===0){
    if(shadowTick%4===0 || moved>6){
      renderer.shadowMap.needsUpdate=true;
      shadowAt.x=player.x; shadowAt.z=player.z;
    }
  }

  let inRoom=null;
  for(const r of rooms){
    if(player.x>r.x1&&player.x<r.x2&&player.z>r.z1&&player.z<r.z2){ inRoom=r; break; }
  }
  INDOORS=!!inRoom;
  if(INDOORS!==WASIN){ WASIN=INDOORS; playSfx('door',0.42,0.95+Math.random()*0.1); }
  if(inRoom){ roomLight.position.set(inRoom.lx,inRoom.ly,inRoom.lz); roomLight.intensity=DARK?0.72:0.14; }
  else roomLight.intensity=0.0;
  /* Interiors are white walls under a full outdoor sky, so the same exposure
     that reads as daylight outside blows them out completely. It eases down
     on the way in and back up on the way out, the way an eye does. */
  const wantExp=(SKIES[PHASE].exp||1.0)*(inRoom?0.72:1);
  if(Math.abs(renderer.toneMappingExposure-wantExp)>0.004)
    renderer.toneMappingExposure+=(wantExp-renderer.toneMappingExposure)*Math.min(1,dt*3.2);

  if(SFX.ctx){
    /* Muriel's room: fades up as you step inside her building */
    const mt=makeTrack('muriel',['assets/audio/music/Muriel.mp3','assets/audio/music/muriel.mp3'],0.55);
    if(mt) trackVolume(mt, (inRoom && MURIEL_ROOM && inRoom===MURIEL_ROOM) ? 1 : 0);
    /* the afterparty: audible about a house away, loud at the stage */
    const pt=makeTrack('party',['assets/audio/music/Music.mp3','assets/audio/music/music.mp3'],0.92);
    if(pt){
      let v=0;
      if(PARTY_ON){
        const sx=PARTY_AT.x, sz=PARTY_AT.z-11;      // the stage, not the deck centre
        const d=Math.hypot(player.x-sx, player.z-sz);
        /* it is an outdoor rig on open ground: it should reach you long
           before the deck does, and fade out slowly rather than cut */
        v=distGain(d, 30, 150);
        /* stand in front of a stack and it hits you, the way it should */
        for(let i=0;i<partySpeakers.length;i++){
          const s2=partySpeakers[i], gp=s2.g.getWorldPosition(SPK_V);
          const dd=Math.hypot(player.x-gp.x, player.z-gp.z);
          if(dd<9) v=Math.min(1, v + (1-dd/9)*0.34);
        }
      }
      trackVolume(pt, v);
    }
    /* the crowd sits under the music as its own layer, from the repo */
    const ct=makeTrack('crowd',['assets/audio/ambient/crowd.mp3','assets/audio/ambient/Crowd.mp3'],0.52);
    if(ct){
      let cv=0;
      if(PARTY_ON){
        const cd=Math.hypot(player.x-PARTY_AT.x, player.z-PARTY_AT.z);
        cv=distGain(cd, 26, 118);
      }
      trackVolume(ct, cv);
    }
    /* The sea, from the repo like the crowd: full on the sand and out on the
       pier, a murmur by the plaza, gone in the streets. Indoors it stops. */
    const st=makeTrack('sea',['assets/audio/ambient/sea.mp3','assets/audio/ambient/Sea.mp3'],0.62);
    if(st){
      const d = floorY>0.3 ? 0 : Math.max(0, SEA.shore-player.z);
      trackVolume(st, INDOORS ? 0 : distGain(d, 18, 175));
    }
    /* the fountain carries only a few steps: it is a basin, not a weir */
    const ft=makeTrack('fountain',['assets/audio/ambient/fountain.mp3','assets/audio/ambient/Fountain.mp3'],0.09);
    if(ft){
      const d=Math.hypot(player.x, player.z);
      /* a trickle by the basin, nothing by the time you reach the kerb */
      trackVolume(ft, INDOORS ? 0 : distGain(d, 5, 30));
    }
    gullTick(t);
  }

  updateZone();
  for(let i=0;i<anims.length;i++) anims[i](t,dt);
  greetTick(t,dt);            // after his patrol, so it wins while it is on
  windowTick(t,dt);
  windTick(t);
  skyFollow();
  floorTick(dt);
  renderer.render(scene,camera);
  if(pendingShot){ pendingShot=false; flash(); composeShot(); }

  miniN++; if(miniN%6===0) drawMini();   // a 208px canvas repaint is not free
  fpsT+=dt; fpsN++;
  if(fpsN>=45){
    const fps=fpsN/fpsT; fpsT=0; fpsN=0;
    if(fps<50&&quality===3) dropQuality();
    else if(fps<38&&quality===2) dropQuality();
    else if(fps<26&&quality===1) dropQuality();
  }
}
