/* ------------------------------ AFTERPARTY ------------------------------
   Unlocked once every Optimum City and Team door has been read. The people here
   are the real residents: the same team looks and the same community characters
   who live on the streets, not stand ins. */
let PARTY=null, PARTY_ON=false, PARTY_AT={x:-286,z:0};
let partyFolk=[], partyBand=[], partySpeakers=[], barman=null;
let holdingBeer=false, beerHand=null, beerHUD=null, danceWith=null, danceT=0;

function buildAfterparty(){
  const PX=PARTY_AT.x, PZ=PARTY_AT.z;
  const g=new THREE.Group(); g.position.set(PX,0,PZ); scene.add(g);
  PARTY=g; g.visible=false;

  const plank=new THREE.MeshLambertMaterial({color:0x8A6E4E});
  const beam =new THREE.MeshLambertMaterial({color:0x6B5540});
  const warm =new THREE.MeshBasicMaterial({color:0xFFE0A8,toneMapped:false});

  // deck. no collider on the floor itself, only on the things you can bump into
  B(g,44,0.14,32,plank,0,0.07,0,false,true);
  for(let i=0;i<21;i++) B(g,44,0.04,0.09,beam,0,0.15,-15.4+i*1.5,false,false);

  /* A painted board on two posts at the entrance, lit by a hanging lantern,
     and a fire pit off the corner of the deck. Neon would belong to another
     kind of party; this one has a fiddle on it. */
  const entBoard=new THREE.Group(); entBoard.position.set(0,0,19.5); g.add(entBoard);
  [-4.6,4.6].forEach(bx=>Cyl(entBoard,.18,.22,5.6,8,beam,bx,2.8,0,false));
  B(entBoard,10.6,2.5,0.34,new THREE.MeshLambertMaterial({color:0x7C6247}),0,4.5,0,false,true);
  Plane(entBoard,9.8,1.9,new THREE.MeshBasicMaterial({
    map:signTexture('AFTERPARTY','live from the deck','#FFC46B'), toneMapped:false}),0,4.5,0.19,0,0);
  Plane(entBoard,9.8,1.9,new THREE.MeshBasicMaterial({
    map:signTexture('AFTERPARTY','live from the deck','#FFC46B'), toneMapped:false}),0,4.5,-0.19,0,Math.PI);
  Cyl(entBoard,.06,.06,1.1,6,beam,0,5.9,0.5,false);
  const entLant=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.0,0.8),warm);
  entLant.position.set(0,4.9,0.5); entBoard.add(entLant);
  const entLantLight=new THREE.PointLight(0xFFD9A0,1.2,26); entLantLight.position.set(0,4.9,20.0); g.add(entLantLight);

  /* ------------------------------ THE FIRE ------------------------------
     A cone of flat orange is a traffic cone, not a fire. What actually reads
     as one is layering: a white-hot core you can barely see, a body that
     moves, licks that break away from it, a bed of coals underneath, and
     sparks going up. The ring of stones is merged into a single mesh and
     every flame shares one material, so the whole thing is a handful of
     draw calls. */
  const fPit=new THREE.Group(); fPit.position.set(26,0,12); g.add(fPit);
  const fRnd=seedRnd(8823);

  // the stone ring, uneven and merged: nine identical boxes read as a fence
  {
    const sg=[], sm=[];
    for(let i=0;i<14;i++){
      const a=i/14*6.283 + (fRnd()-0.5)*0.22;
      const rr=2.25+(fRnd()-0.5)*0.34, sc=0.55+fRnd()*0.55;
      sg.push(new THREE.BoxGeometry(1,1,1));
      sm.push(new THREE.Matrix4().compose(
        new THREE.Vector3(Math.cos(a)*rr, 0.16+sc*0.22, Math.sin(a)*rr),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(
          (fRnd()-0.5)*0.4, a+(fRnd()-0.5)*0.6, (fRnd()-0.5)*0.35)),
        new THREE.Vector3(0.75*sc, 0.62*sc, 0.62*sc)));
    }
    const stones=new THREE.Mesh(mergeGeos(sg,sm), SM({color:0x8A9099, roughness:0.95}));
    stones.castShadow=true; stones.receiveShadow=true; fPit.add(stones);
  }

  // scorched ground inside the ring
  {
    const ash=new THREE.Mesh(new THREE.CircleGeometry(2.05,18),
      new THREE.MeshLambertMaterial({color:0x2C2724}));
    ash.rotation.x=-Math.PI/2; ash.position.y=0.05; fPit.add(ash);
  }

  /* logs leaning into the middle, charred at the top where the fire has them */
  const charM=new THREE.MeshLambertMaterial({color:0x3A2E26});
  for(let i=0;i<5;i++){
    const a=i/5*6.283+0.3;
    const log=new THREE.Group();
    log.position.set(Math.cos(a)*0.95, 0.1, Math.sin(a)*0.95);
    log.rotation.set(0, -a, 0);
    log.rotation.z=-0.62;                      // tipped in towards the centre
    const L=2.5;
    Cyl(log,.15,.19,L,7,beam,0,L/2,0,false);
    Cyl(log,.15,.15,0.55,7,charM,0,L-0.25,0,false);
    fPit.add(log);
  }

  /* a bed of coals: dim, and it is what keeps the base of the fire from
     looking hollow between flame licks */
  const fCoalM=new THREE.MeshBasicMaterial({color:0xFF5A18,toneMapped:false,
    transparent:true,opacity:0.85,depthWrite:false});
  const fCoals=[];
  for(let i=0;i<9;i++){
    const a=fRnd()*6.283, rr=fRnd()*1.15;
    const c=new THREE.Mesh(new THREE.SphereGeometry(0.15+fRnd()*0.12,6,5), fCoalM.clone());
    c.position.set(Math.cos(a)*rr, 0.14+fRnd()*0.1, Math.sin(a)*rr);
    c.scale.y=0.55; fPit.add(c);
    fCoals.push({m:c, ph:fRnd()*6.283, sp:0.9+fRnd()*1.8});
  }

  /* The flame body. One vertical gradient, white at the bottom through yellow
     and orange to nothing at the tip, on additive blending so overlapping
     tongues build up brightness the way real ones do. */
  const fFlameM=(()=>{
    const c=cvs(16,128), x2=c.getContext('2d');
    const lg=x2.createLinearGradient(0,128,0,0);
    lg.addColorStop(0.00,'rgba(255,248,214,1)');
    lg.addColorStop(0.18,'rgba(255,214,110,0.95)');
    lg.addColorStop(0.46,'rgba(255,140,40,0.72)');
    lg.addColorStop(0.76,'rgba(214,66,18,0.34)');
    lg.addColorStop(1.00,'rgba(140,30,10,0)');
    x2.fillStyle=lg; x2.fillRect(0,0,16,128);
    return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      side:THREE.DoubleSide, toneMapped:false});
  })();
  const fFlames=[];
  for(let i=0;i<9;i++){
    const tall=i<3;                            // three big tongues, six small
    const f=new THREE.Mesh(new THREE.ConeGeometry(
      tall?0.62:0.34, tall?2.9:1.5, 7, 1, true), fFlameM);
    const a=fRnd()*6.283, rr=tall? fRnd()*0.3 : 0.35+fRnd()*0.75;
    f.position.set(Math.cos(a)*rr, (tall?1.55:0.85), Math.sin(a)*rr);
    fPit.add(f);
    fFlames.push({m:f, ph:fRnd()*6.283, sp:4.2+fRnd()*4.4, base:f.position.y,
                  tall:tall, x:f.position.x, z:f.position.z});
  }
  /* the white core, small and almost hidden: it is what makes the middle look
     hotter than the edges rather than the same orange all through */
  const fCore=new THREE.Mesh(new THREE.SphereGeometry(0.5,8,7),
    new THREE.MeshBasicMaterial({color:0xFFE9B0, toneMapped:false,
      transparent:true, opacity:0.6, depthWrite:false,
      blending:THREE.AdditiveBlending}));
  fCore.position.y=0.6; fCore.scale.y=1.5; fPit.add(fCore);

  /* sparks, on the same recycling trick as the rain */
  const SPN=46, fsPos=new Float32Array(SPN*3), fsSeed=[];
  for(let i=0;i<SPN;i++){
    fsSeed.push({a:fRnd()*6.283, r:fRnd()*0.9, t:fRnd(),
                 sp:0.32+fRnd()*0.45, dr:(fRnd()-0.5)*1.1});
    fsPos[i*3]=0; fsPos[i*3+1]=0.4; fsPos[i*3+2]=0;
  }
  const fsGeo=new THREE.BufferGeometry();
  fsGeo.setAttribute('position', new THREE.BufferAttribute(fsPos,3));
  const fSparks=new THREE.Points(fsGeo, new THREE.PointsMaterial({
    color:0xFFB765, size:0.24, map:spriteTex('dot'), alphaTest:0.08,
    depthWrite:false, transparent:true, opacity:0.95, fog:true,
    blending:THREE.AdditiveBlending}));
  fPit.add(fSparks);
  const fsArr=fsGeo.attributes.position.array;

  const fFireLight=new THREE.PointLight(0xFF9540,1.6,34);
  fFireLight.position.set(26,2.0,12); g.add(fFireLight);
  makePlume(26, 3.2, 12, 0.7, g);      // inside PARTY, so it hides with it

  anims.push((t,dt)=>{
    if(!PARTY_ON) return;
    /* one shared gust drives everything, so the flames, the light and the
       sparks all lean the same way at the same moment */
    const gust=Math.sin(t*0.9)*0.5+Math.sin(t*2.3)*0.3;
    for(let i=0;i<fFlames.length;i++){
      const f=fFlames[i];
      const beat=Math.sin(t*f.sp+f.ph);
      const s=0.66+Math.abs(beat)*0.5;
      f.m.scale.set(0.82+beat*0.16, s, 0.82+beat*0.16);
      f.m.position.y=f.base+beat*0.14;
      // a tongue bends away from vertical instead of spinning like a top
      f.m.rotation.z=gust*0.2+Math.sin(t*f.sp*0.6+f.ph)*0.14;
      f.m.rotation.x=Math.cos(t*f.sp*0.5+f.ph)*0.12;
      f.m.rotation.y=t*0.5+f.ph;
    }
    fCore.scale.set(0.9+Math.sin(t*7.1)*0.12, 1.4+Math.sin(t*5.3)*0.2, 0.9);
    for(let i=0;i<fCoals.length;i++){
      const c=fCoals[i];
      c.m.material.opacity=0.45+Math.abs(Math.sin(t*c.sp+c.ph))*0.5;
    }
    for(let i=0;i<SPN;i++){
      const s=fsSeed[i];
      s.t+=dt*s.sp;
      if(s.t>1){ s.t-=1; s.a=Math.random()*6.283; s.r=Math.random()*0.9; }
      const k=s.t;
      // rises fast, slows, and drifts further out the higher it gets
      fsArr[i*3]  =Math.cos(s.a)*s.r + (gust*0.6+s.dr)*k*k*2.4;
      fsArr[i*3+1]=0.4 + k*(3.6-k*1.1);
      fsArr[i*3+2]=Math.sin(s.a)*s.r + s.dr*k*k*1.6;
    }
    fsGeo.attributes.position.needsUpdate=true;
    fSparks.material.opacity=0.95;
    fFireLight.intensity=1.5+Math.sin(t*7.3)*0.34+Math.sin(t*3.1)*0.18+gust*0.12;
  });

  const posts=[[-21,-15],[21,-15],[-21,15],[21,15],[0,15]];
  posts.forEach(p=>{
    Cyl(g,.22,.26,7.0,8,beam,p[0],3.5,p[1],false);
    colliders.push({x1:PX+p[0]-0.4,x2:PX+p[0]+0.4,z1:PZ+p[1]-0.4,z2:PZ+p[1]+0.4});
  });
  const bulbs=[];
  [[[-21,-15],[21,15]],[[21,-15],[-21,15]],[[-21,-15],[-21,15]],[[21,-15],[21,15]]].forEach(r=>{
    for(let i=0;i<=16;i++){
      const t=i/16;
      const x=r[0][0]+(r[1][0]-r[0][0])*t, z=r[0][1]+(r[1][1]-r[0][1])*t;
      const b=new THREE.Mesh(new THREE.SphereGeometry(0.14,8,6),warm);
      b.position.set(x,6.6-Math.sin(Math.PI*t)*1.1,z); g.add(b); bulbs.push(b);
    }
  });

  // stage
  B(g,20,1.4,8,plank,0,1.2,-11,false,true);
  colliders.push({x1:PX-10,x2:PX+10,z1:PZ-15,z2:PZ-7});
  B(g,22,7.4,0.4,new THREE.MeshLambertMaterial({color:0x4E3D2E}),0,5.6,-15.2,false,true);
  // one wide screen. Two stacked panels overlapped each other and walled off the view.
  const bez=new THREE.MeshLambertMaterial({color:0x1A1D22});
  B(g,17.0,6.8,0.3,bez,0,5.5,-14.92,false,true);
  Plane(g,16.2,6.0,new THREE.MeshBasicMaterial({
    map:boardTexture(['OPTIMUM AFTERPARTY','SPEED IS MONEY'],'#FFC46B'),
    transparent:true,toneMapped:false}),0,5.5,-14.74,0,0);
  /* The stacks are angled in toward the floor, the way they are aimed at a real
     gig, and they move with the track instead of standing there like boxes. */
  partySpeakers=[];
  [-8.8,8.8].forEach(sx=>{
    const st=new THREE.Group();
    st.position.set(sx,1.90,-13.4);
    st.rotation.y = sx<0 ? 0.30 : -0.30;
    g.add(st);
    B(st,1.5,3.4,1.2,M.dark,0,1.7,0,false,true);
    const coneM=new THREE.MeshLambertMaterial({color:0x0E1116});
    const c1=B(st,1.2,0.9,0.1,coneM,0,2.4,0.62,false,false);
    const c2=B(st,1.2,0.9,0.1,coneM,0,1.2,0.62,false,false);
    partySpeakers.push({g:st, cones:[c1,c2], side:(sx<0?-1:1), yaw:st.rotation.y});
  });

  const hay=new THREE.MeshLambertMaterial({color:0xC9A961});
  [[-17,8],[-15.4,9.6],[17,8],[15.6,10],[-18,-5],[18,-6]].forEach(h=>{
    const m=B(g,1.5,0.85,0.95,hay,h[0],0.57,h[1],false,true); m.rotation.y=(h[0]*h[1])%1.4;
    colliders.push({x1:PX+h[0]-0.85,x2:PX+h[0]+0.85,z1:PZ+h[1]-0.6,z2:PZ+h[1]+0.6});
  });

  /* ---- the band: the three co-founders, with their real looks ---- */
  const perform=(id,x,z,ry)=>{
    const p=makePerson(g,{look:SKINS[id],perform:1,a:[x,z],b:[x,z],stand:1,baseYaw:ry});
    p.position.set(x,1.90,z); p.rotation.y=ry;
    return {p:p,l:p.userData.limbs};
  };
  const singer=perform('muriel',0,-11,0);
  Cyl(g,.09,.12,2.3,8,M.dark,0,3.05,-9.7,false);
  const mic=Cyl(g,.14,.14,0.34,10,M.dark,0,4.35,-9.7,false); mic.rotation.x=1.1;

  const guitarist=perform('kishori',-4.8,-11.4,0.3);
  // acoustic guitar: waisted body, rosette, bridge, fretted neck, headstock, strings
  const gtr=new THREE.Group(); gtr.position.set(0.12,1.3,0.5); gtr.rotation.z=-0.62; gtr.rotation.x=-0.18;
  guitarist.p.add(gtr);
  const spruce=new THREE.MeshLambertMaterial({color:0xE0BC84});
  const rose=new THREE.MeshLambertMaterial({color:0x7A5433});
  const lower=Cyl(gtr,.46,.46,0.17,20,spruce,0,-0.22,0,false); lower.rotation.x=Math.PI/2;
  const upper=Cyl(gtr,.34,.34,0.17,20,spruce,0,0.32,0,false); upper.rotation.x=Math.PI/2;
  const waist=B(gtr,0.52,0.42,0.17,spruce,0,0.06,0,false,false);
  const hole=Cyl(gtr,.13,.13,0.02,16,new THREE.MeshLambertMaterial({color:0x1A1208}),0,0.12,0.09,false);
  hole.rotation.x=Math.PI/2;
  const ring=Cyl(gtr,.17,.17,0.012,16,rose,0,0.12,0.088,false); ring.rotation.x=Math.PI/2;
  B(gtr,0.34,0.05,0.03,rose,0,-0.28,0.09,false,false);          // bridge
  B(gtr,0.15,1.15,0.08,rose,0,1.06,0.02,false,true);             // neck
  B(gtr,0.16,0.02,0.02,new THREE.MeshLambertMaterial({color:0xE8DCC0}),0,0.52,0.06,false,false); // nut
  for(let f=1;f<=6;f++) B(gtr,0.15,0.012,0.012,M.metal,0,0.62+f*0.13,0.062,false,false);        // frets
  const gHead=B(gtr,0.19,0.3,0.07,rose,0,1.72,0.01,false,true); gHead.rotation.z=0.08;
  for(let k=0;k<3;k++){
    B(gtr,0.12,0.02,0.02,M.metal,-0.13,1.64+k*0.09,0.01,false,false);
    B(gtr,0.12,0.02,0.02,M.metal, 0.13,1.64+k*0.09,0.01,false,false);
  }
  const strM=new THREE.MeshLambertMaterial({color:0xF0E6CC});
  for(let k=0;k<6;k++) B(gtr,0.008,2.02,0.008,strM,-0.055+k*0.022,0.72,0.075,false,false);

  const fiddler=perform('kent',4.8,-11.4,-0.3);
  // fiddle tucked under the chin, with a scroll, f holes, four strings and a bow
  const fid=new THREE.Group(); fid.position.set(-0.3,1.72,0.42);
  fid.rotation.z=0.42; fid.rotation.x=-0.30; fid.rotation.y=-0.5; fiddler.p.add(fid);
  const maple=new THREE.MeshLambertMaterial({color:0x8B4A2B});
  const ebony=new THREE.MeshLambertMaterial({color:0x241A14});
  const fl=Cyl(fid,.21,.21,0.1,18,maple,0,-0.12,0,false); fl.rotation.x=Math.PI/2;
  const fu=Cyl(fid,.17,.17,0.1,18,maple,0,0.2,0,false); fu.rotation.x=Math.PI/2;
  B(fid,0.26,0.26,0.1,maple,0,0.04,0,false,false);
  B(fid,0.03,0.12,0.01,ebony,-0.1,0.04,0.055,false,false);   // f holes
  B(fid,0.03,0.12,0.01,ebony, 0.1,0.04,0.055,false,false);
  B(fid,0.11,0.05,0.02,ebony,0,-0.1,0.06,false,false);       // bridge
  B(fid,0.075,0.5,0.05,ebony,0,0.55,0.015,false,true);       // fingerboard
  const scroll=Cyl(fid,.06,.06,0.07,10,maple,0,0.84,0.01,false); scroll.rotation.z=Math.PI/2;
  for(let k=0;k<4;k++) B(fid,0.006,0.92,0.006,new THREE.MeshLambertMaterial({color:0xF0E6CC}),
    -0.026+k*0.017,0.34,0.045,false,false);
  const bowG=new THREE.Group(); bowG.position.set(0.02,-0.05,0.2); fiddler.p.add(bowG);
  bowG.position.set(0.34,1.62,0.5);
  B(bowG,0.028,0.94,0.028,new THREE.MeshLambertMaterial({color:0x4A3225}),0,0,0,false,false);
  B(bowG,0.012,0.9,0.012,new THREE.MeshLambertMaterial({color:0xF5EEDC}),0,0,0.035,false,false);
  B(bowG,0.05,0.09,0.06,ebony,0,-0.46,0.015,false,false);
  bowG.rotation.z=1.42; bowG.rotation.y=-0.45;
  fiddler.bow=bowG;
  partyBand=[singer,guitarist,fiddler];

  /* ---- a spare guitar on a stand at the foot of the stage ---- */
  const GX=-7.4, GZ=-6.2;
  B(g,1.5,0.14,0.7,beam,GX,0.2,GZ,false,false);
  Cyl(g,.06,.06,1.1,8,M.dark,GX-0.3,0.7,GZ,false);
  Cyl(g,.06,.06,1.1,8,M.dark,GX+0.3,0.7,GZ,false);
  const spare=new THREE.Group(); spare.position.set(GX,1.05,GZ);
  spare.rotation.x=-0.22; spare.scale.setScalar(1.15); g.add(spare);
  mkGuitarItem(spare);
  spots.push({x:PX+GX,z:PZ+GZ+1.6,r:2.6,guitarPick:1,accent:C.peach,
              data:{name:'guitar'},hide:spare,prio:1});
  spots.push({x:PX,z:PZ-6.4,r:5.0,jam:1,accent:C.lavender,data:{name:'stage'}});

  /* ---- the bar, with Jeffrey pouring ---- */
  const BX=-15, BZ=2;
  B(g,7.0,1.0,1.5,M.wood,BX,0.64,BZ,false,true);
  B(g,7.2,0.12,1.8,new THREE.MeshLambertMaterial({color:0xA88A63}),BX,1.2,BZ,false,false);
  B(g,7.0,2.4,0.4,new THREE.MeshLambertMaterial({color:0x4E3D2E}),BX,2.5,BZ-2.4,false,true);
  Plane(g,6.0,1.5,new THREE.MeshBasicMaterial({map:tagTexture('THE BAR','#FFC46B'),transparent:true,toneMapped:false}),BX,3.0,BZ-2.18,0,0);
  for(let i=0;i<3;i++){
    Cyl(g,.06,.06,0.42,8,M.metal,BX-1.2+i*1.2,1.45,BZ-0.45,false);
    const tap=B(g,0.09,0.09,0.26,M.dark,BX-1.2+i*1.2,1.63,BZ-0.3,false,false); tap.rotation.x=0.5;
  }
  colliders.push({x1:PX+BX-3.6,x2:PX+BX+3.6,z1:PZ+BZ-1.1,z2:PZ+BZ+1.1});
  barman=makePerson(g,{look:SKINS.jeffrey,perform:1,a:[BX,BZ-1.5],b:[BX,BZ-1.5],stand:1,baseYaw:0});
  barman.position.set(BX,0.14,BZ-1.5);
  addMarker(barman,3.1,()=> Q.dig>=3 ? 2
                          : (Q.dig===0 ? 0 : (Q.dig===2 && hasItem('fragment') ? 0 : 1)) );
  spots.push({x:PX+BX,z:PZ+BZ+1.6,r:2.6,bar:1,accent:C.peach,data:{name:'Jeffrey Elliott'}});

  /* ---- the dance floor: the actual residents ---- */
  const roster=[];
  for(let i=0;i<CROWD.length;i++) roster.push({look:CROWD[i],nick:CROWD[i].nick,res:CROWD[i]});
  for(let i=0;i<TEAM.length;i++){
    const d=TEAM[i];
    if(d.id==='muriel'||d.id==='kishori'||d.id==='kent'||d.id==='jeffrey') continue;
    roster.push({look:SKINS[d.id],nick:d.name});
  }
  const rnd=seedRnd(4242);
  partyFolk=[];
  roster.forEach((r,i)=>{
    const col=i%6, row=(i/6)|0;
    const x=-9+col*3.4+(row%2)*1.1, z=-3.0+row*3.4;
    const p=makePerson(g,{look:r.look,perform:1,a:[x,z],b:[x,z],stand:1,baseYaw:Math.PI});
    p.position.set(x,0.14,z); p.rotation.y=Math.PI;
    const o={p:p,l:p.userData.limbs,off:i*0.47,x:x,z:z,nick:r.nick,res:r.res,dancing:false};
    partyFolk.push(o);
    spots.push({x:PX+x,z:PZ+z,r:2.2,dance:1,folk:o,accent:C.lavender,data:{name:r.nick}});
  });

  /* ---- the plinth the fragment goes on once it is handed in ---- */
  const PDX=-15, PDZ=6.5;
  /* the column stands empty until the fragment is handed in, so it only goes
     up with the piece on top instead of blocking the bar for no reason */
  const col=new THREE.Group(); col.visible=false; g.add(col);
  B(col,1.9,0.25,1.9,M.trim,PDX,0.20,PDZ,false,true);
  B(col,1.35,1.35,1.35,new THREE.MeshLambertMaterial({color:0x4E3D2E}),PDX,1.00,PDZ,false,true);
  B(col,1.7,0.16,1.7,M.trim,PDX,1.76,PDZ,false,true);
  const plaqueMat=new THREE.MeshBasicMaterial({map:tagTexture('5TH FRAGMENT','#FFC46B'),
    transparent:true,toneMapped:false});
  [[0,0.69,0],[0,-0.69,Math.PI],[0.69,0,Math.PI/2],[-0.69,0,-Math.PI/2]].forEach(q=>{
    Plane(col,1.5,0.42,plaqueMat,PDX+q[0],1.12,PDZ+q[1],0,q[2]);
  });
  const shown=new THREE.Group(); shown.position.set(PDX,2.55,PDZ); shown.visible=false; g.add(shown);
  mkFragment(shown);
  shown.userData.col=col;
  PARTY.userData.plinth=shown;
  anims.push(t=>{ if(!shown.visible) return;
    shown.rotation.y+=0.012; shown.position.y=2.55+Math.sin(t*1.1)*0.07; });

  /* ---- the mechanical bull ---- */
  const BUX=15, BUZ=5;
  const pit=new THREE.Group(); pit.position.set(BUX,0,BUZ); pit.rotation.y=Math.PI; g.add(pit);
  Cyl(pit,5.4,5.4,0.55,22,new THREE.MeshLambertMaterial({color:0xB4453A}),0,0.42,0,false);
  Cyl(pit,5.7,5.7,0.3,22,new THREE.MeshLambertMaterial({color:0x8A6E4E}),0,0.85,0,false);
  colliders.push({x1:PX+BUX-5.7,x2:PX+BUX+5.7,z1:PZ+BUZ-5.7,z2:PZ+BUZ+5.7});
  Cyl(pit,.5,.7,1.5,12,M.dark,0,1.3,0,false);              // the machine post

  const bull=new THREE.Group(); bull.position.set(0,2.3,0); bull.scale.setScalar(0.8); pit.add(bull);
  const hide=new THREE.MeshLambertMaterial({color:0x4A3B32});
  const hide2=new THREE.MeshLambertMaterial({color:0x352923});
  const horn=new THREE.MeshLambertMaterial({color:0xEDE3C8});
  /* A tapered cylinder read as a log. A bull is a rounded mass with a shoulder
     hump, so this is built from squashed spheres instead. */
  const lump=(rx,ry,rz,x,y,z,mat)=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,18,14),mat||hide);
    m.scale.set(rx,ry,rz); m.position.set(x,y,z); bull.add(m); return m;
  };
  lump(1.05,0.82,0.86,-0.15,0,0);          // barrel
  lump(0.92,0.86,0.82, 0.85,0.06,0);       // chest
  lump(0.62,0.60,0.62,-1.20,-0.06,0);      // rump
  lump(0.52,0.42,0.66, 0.55,0.62,0);       // shoulder hump
  // neck angles down into the head
  const bNeck=lump(0.5,0.44,0.5, 1.62,0.20,0);
  bNeck.rotation.z=-0.3;
  const bHead=lump(0.56,0.46,0.44, 2.20,0.06,0);
  const muzzle=lump(0.34,0.30,0.32, 2.72,-0.12,0, hide2);
  const nostril=new THREE.MeshLambertMaterial({color:0x1A1410});
  B(bull,0.06,0.09,0.09,nostril,2.98,-0.10,-0.13,false,false);
  B(bull,0.06,0.09,0.09,nostril,2.98,-0.10, 0.13,false,false);
  [-1,1].forEach(sd=>{
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),nostril);
    eye.position.set(2.34,0.20,0.36*sd); bull.add(eye);
    // ear
    const ear=lump(0.1,0.17,0.26, 2.06,0.30,0.5*sd, hide2);
    ear.rotation.x=sd*0.55;
    // horn: four short segments sweeping out then up, so it reads at a distance
    const seg=[[2.30,0.44,0.44,0.12,0.30],[2.32,0.68,0.66,0.10,0.28],
               [2.34,0.94,0.78,0.08,0.26],[2.34,1.18,0.80,0.05,0.22]];
    seg.forEach((q,k)=>{
      const h=Cyl(bull,q[3],q[3]+0.02,q[4],8,horn,q[0],q[1],q[2]*sd,false);
      h.rotation.x=sd*(0.85-k*0.28);
    });
  });
  // tail
  const tail=new THREE.Group(); tail.position.set(-1.72,0.28,0); bull.add(tail);
  Cyl(tail,.055,.075,0.95,8,hide,0,-0.45,0,false);
  const tuft=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),hide2);
  tuft.scale.set(0.8,1.5,0.8); tuft.position.set(0,-1.02,0); tail.add(tuft);
  // rigging where the rider actually sits
  const pad=B(bull,1.30,0.13,1.05,new THREE.MeshLambertMaterial({color:0xC96A3A}),0.05,0.76,0,false,true);
  const rope=Cyl(bull,.075,.075,1.7,8,new THREE.MeshLambertMaterial({color:0xD8C08A}),0.05,0.52,0,false);
  rope.rotation.x=Math.PI/2;
  B(bull,0.3,0.13,0.32,new THREE.MeshLambertMaterial({color:0x8A6E4E}),0.42,0.84,0,false,true);

  /* the rider, styled after the reference: brown hair, cream shirt, denim */
  const riderLook={skin:0xF0CFAE,hair:0x4A3527,brow:0x40301F,style:'fringe',
                   eye:0x5A4030,shirt:0xF4F1E8,sleeve:0xF4F1E8,inner:0xF4F1E8,
                   pants:0x3C5A80,lip:'#BE8074'};
  const rider=makePerson(bull,{look:riderLook,perform:1,a:[0,0],b:[0,0],stand:1,baseYaw:0});
  rider.position.set(0.05,0.66,0); rider.rotation.y=Math.PI/2; rider.scale.setScalar(0.95);
  // a name tag so it is obvious who is up there
  const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:nickTexture('bobyhamster'),
    transparent:true, depthTest:false, toneMapped:false}));
  tag.scale.set(2.2,0.55,1); tag.position.set(0,3.2,0); rider.add(tag);
  const rl=rider.userData.limbs;
  rl.legL.rotation.x=-0.30; rl.legL.rotation.z=-0.80;
  rl.legR.rotation.x=-0.30; rl.legR.rotation.z= 0.80;

  /* the hat is off his head and spinning through the air */
  const hat=new THREE.Group(); hat.scale.setScalar(0.55); pit.add(hat);
  const felt=new THREE.MeshLambertMaterial({color:0x8A6E4E});
  const felt2=new THREE.MeshLambertMaterial({color:0x6E5540});
  const band=new THREE.MeshLambertMaterial({color:0x3A2A1E});
  /* a flat disc read as a flying saucer from below, so give it a real crown */
  const brim=new THREE.Mesh(new THREE.SphereGeometry(1,20,10,0,Math.PI*2,Math.PI*0.42,Math.PI*0.16),felt);
  brim.scale.set(0.62,0.5,0.62); brim.position.y=0.02; hat.add(brim);
  Cyl(hat,.6,.6,0.05,20,felt,0,0,0,false);
  const crown=Cyl(hat,.3,.36,0.5,18,felt,0,0.28,0,false);
  const top=new THREE.Mesh(new THREE.SphereGeometry(0.3,16,10,0,Math.PI*2,0,Math.PI/2),felt);
  top.scale.set(1,0.55,1); top.position.y=0.53; hat.add(top);
  Cyl(hat,.375,.375,0.1,18,band,0,0.09,0,false);
  B(hat,0.11,0.15,0.05,new THREE.MeshLambertMaterial({color:0xC9A44E}),0.34,0.11,0,false,false);
  B(hat,0.4,0.1,0.13,felt2,0,0.55,0,false,false);   // crease along the crown
  /* the rodeo hangs off the pit, after the bull exists */
  setTimeout(()=>{ try{ buildRodeo(g,PX,PZ,BUX,BUZ); }catch(e){ console.warn('rodeo build',e); } },0);

  /* handed to the rodeo: it turns the bucking up and takes Bobby off */
  BULLRIG={pit:pit, bull:bull, rider:rider, rl:rl, amp:1, spd:1, ph:0, bobbyOn:true};
  anims.push((t,dt)=>{
    if(!PARTY_ON) return;
    const R=BULLRIG; R.ph+=(dt||0.016)*2.3*R.spd;
    const bt=R.ph, k=R.amp;
    bull.rotation.z=Math.sin(bt)*0.30*k;
    bull.rotation.x=Math.sin(bt*1.7+1)*0.22*k;
    bull.rotation.y=Math.sin(bt*0.4)*0.45*Math.min(1.5,k);
    bull.position.y=2.25+Math.sin(bt*2)*0.16*k;
    tail.rotation.z=Math.sin(bt*2.4)*0.7;
    tail.rotation.x=Math.sin(bt*1.3)*0.5;
    if(R.bobbyOn){
    rider.rotation.z=-Math.sin(bt)*0.22;
    rl.armL.rotation.x=-0.75; rl.armL.rotation.z=0.55;              // gripping the rope
    rl.armR.rotation.x=-2.3-Math.sin(bt*1.7)*0.35;                  // free arm up for balance
    rl.armR.rotation.z=-0.7;
    }
    // the hat tumbles above the pit on its own arc
    const ht=t*1.5;
    hat.position.set(Math.sin(ht)*2.2, 4.4+Math.sin(ht*2)*0.9, Math.cos(ht*0.8)*1.8);
    hat.rotation.set(0.7+Math.sin(ht*1.6)*0.5, ht*2.6, Math.sin(ht*1.2)*0.6);
  });

  anims.push(t=>{
    if(!PARTY_ON) return;
    const beat=t*3.1;
    partyFolk.forEach(o=>{
      const b=beat+o.off, s=Math.sin(b), s2=Math.sin(b*2);
      o.p.position.y=0.14+Math.abs(s)*0.16;
      o.p.rotation.y = o.dancing ? o.faceYaw : Math.PI+Math.sin(b*0.5)*0.5;
      o.l.legL.rotation.x=s*0.6; o.l.legR.rotation.x=-s*0.6;
      // hands up and swinging, the way people actually dance
      o.l.armL.rotation.x=-2.1+s2*0.35; o.l.armR.rotation.x=-2.1-s2*0.35;
      o.l.armL.rotation.z= 0.42+s*0.22; o.l.armR.rotation.z=-0.42-s*0.22;
    });
    // Muriel sings, the other two play. No lines are put in anyone's mouth.
    const S=partyBand[0], G=partyBand[1], F=partyBand[2];
    const pump=Math.abs(Math.sin(beat));
    /* hands in toward the mic, not out in a T pose */
    S.l.armR.rotation.x=-1.55+Math.sin(beat)*0.22; S.l.armR.rotation.z=-0.34;
    S.l.armL.rotation.x=-1.30+Math.sin(beat*0.5)*0.55; S.l.armL.rotation.z=0.30+Math.sin(beat)*0.18;
    S.p.rotation.y=Math.sin(beat*0.5)*0.42;
    S.p.rotation.z=Math.sin(beat)*0.07;
    S.p.position.y=1.90+pump*0.14;
    S.l.legL.rotation.x=Math.sin(beat)*0.28; S.l.legR.rotation.x=-Math.sin(beat)*0.28;
    G.l.armR.rotation.x=Math.sin(beat*2)*0.75-0.75; G.l.armR.rotation.z=-0.35;
    G.l.armL.rotation.x=-1.15; G.l.armL.rotation.z=0.55;
    G.p.position.y=1.90+pump*0.20;
    G.p.rotation.z=Math.sin(beat*2)*0.09;
    G.l.legL.rotation.x=Math.sin(beat*2)*0.22; G.l.legR.rotation.x=-Math.sin(beat*2)*0.22;
    F.l.armR.rotation.x=-0.85+Math.sin(beat*2)*0.12; F.l.armR.rotation.z=-0.5;
    F.l.armL.rotation.x=-1.35; F.l.armL.rotation.z=0.62;
    if(F.bow) F.bow.position.x=0.34+Math.sin(beat*2+1)*0.26;
    F.p.position.y=1.90+Math.abs(Math.sin(beat+0.6))*0.20;
    F.p.rotation.z=-Math.sin(beat*2+0.6)*0.08;
    F.l.legL.rotation.x=Math.sin(beat*2+0.6)*0.2; F.l.legR.rotation.x=-Math.sin(beat*2+0.6)*0.2;
    /* the stacks work: cabinets rock on the beat and the cones breathe */
    partySpeakers.forEach((sp,i)=>{
      const b2=beat+i*0.5, hit=Math.abs(Math.sin(b2));
      sp.g.position.y=1.90+hit*0.10;
      sp.g.scale.set(1+hit*0.035, 1-hit*0.05, 1+hit*0.035);
      sp.g.rotation.y=sp.yaw+Math.sin(b2*0.5)*0.06;
      sp.g.rotation.z=-sp.side*Math.sin(b2)*0.035;
      sp.cones.forEach((c,k)=> c.position.z=0.62+Math.abs(Math.sin(b2*2+k))*0.07);
    });
    if(barman){
      const bl=barman.userData.limbs;
      bl.armR.rotation.x=-0.9+Math.sin(t*1.6)*0.35; bl.armR.rotation.z=0.3;
      bl.armL.rotation.x=-0.4; bl.armL.rotation.z=-0.2;
      barman.rotation.y=Math.sin(t*0.4)*0.25;
    }
    bulbs.forEach((b,i)=> b.scale.setScalar(0.9+Math.sin(t*2+i*0.4)*0.12));
    if(danceWith){
      danceT+=0.016;
      danceWith.faceYaw=Math.atan2(PX+danceWith.x-player.x, PZ+danceWith.z-player.z)+Math.PI;
    }
  });

  const lamp=new THREE.PointLight(0xFFD79A,0.0,50); lamp.position.set(0,7,0); g.add(lamp);
  const stageLamp=new THREE.PointLight(0xFFC46B,0.0,32); stageLamp.position.set(0,6,-10); g.add(stageLamp);
  const barLamp=new THREE.PointLight(0xFFD79A,0.0,20); barLamp.position.set(BX,4,BZ); g.add(barLamp);
  PARTY.userData.lights=[lamp,stageLamp,barLamp];
}

function grabBeer(){
  if(hasItem('beer')){ takeItem('beer'); blip(392,0.12,'sine',0.1); }
  else { giveItem('beer'); equip('beer'); }
}
function toggleDance(o){
  if(danceWith===o){ danceWith.dancing=false; danceWith=null; return; }
  if(danceWith) danceWith.dancing=false;
  danceWith=o; o.dancing=true; danceT=0;
  blip(523,0.14,'sine',0.1);
}


function openAfterparty(silent){
  if(!PARTY || PARTY_ON) return;
  PARTY_ON=true; PARTY.visible=true;
  PARTY.userData.lights.forEach((l,i)=> l.intensity = i===0?1.1 : (i===1?1.5:1.0));
  warmParty();                    // no-op if the intro already paid for it
  if(!silent){
    /* one drawn frame with the venue up before the camera starts moving:
       whatever is left to upload lands there and not inside the shot */
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
    cineAfterparty(()=>{
      $('doneT').textContent=tr('partyT');
      $('doneB').textContent=tr('partyB');
      $('done').style.display='flex'; freeCursor(); questCue();
    });
    }));
    blip(392,0.18,'sine',0.12);
    setTimeout(()=>blip(523,0.18,'sine',0.12),160);
    setTimeout(()=>blip(659,0.4,'sine',0.12),330);
    return;
  }
  if(false){
    $('doneT').textContent=tr('partyT');
    $('doneB').textContent=tr('partyB');
    $('done').style.display='flex'; freeCursor(); questCue();
    blip(392,0.18,'sine',0.12);
    setTimeout(()=>blip(523,0.18,'sine',0.12),160);
    setTimeout(()=>blip(659,0.4,'sine',0.12),330);
  }
}
/* the quest must be running: old progress alone never unlocks anything */
function coreDone(){
  if(Q.explore!==1 && Q.explore!==2) return false;
  if(window.PARTY_TEST) return Q.doors>=1;        // TEST BUILD: one fresh door
  const need=CITY.map(d=>d.id+':').concat(TEAM.map(d=>d.id+':'));
  return need.every(k=>visited.has(k));
}
/* called on every plaque read, whether or not that house was seen before */
function questDoor(){
  if(Q.explore!==1) return;
  Q.doors++; saveQuests();
  if(coreDone()){ Q.explore=2; saveQuests(); openAfterparty(false); }
}

function dressWorld(){
  /* How far a point is from the line of sight between the plaza and the
     pier. Nothing big may stand on that line, or you cannot find the pier. */
  const offSight=(x,z)=>{
    const ax=0, az=20, bx=PIER.x, bz=SEA.shore-10;
    const vx=bx-ax, vz=bz-az, t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));
    return Math.hypot(x-(ax+vx*t), z-(az+vz*t));
  };
  const sr=seedRnd(98765);
  for(let i=0;i<30;i++){
    const a=sr()*Math.PI*2, r=95+sr()*150;
    const x=Math.cos(a)*r, z=Math.sin(a)*r, s=5+sr()*9;
    if(Math.abs(x)<58 && z<58) continue;
    if(Math.abs(z)<58 && Math.abs(x)<300) continue;
    if(Math.hypot(x-DIG_AT.x, z-DIG_AT.z) < 58) continue;   // room to dig
    if(z > SEA.shore-70) continue;                          // not on the beach, not in the sea
    if(offSight(x,z) < 40+s*1.3) continue;                  // not in front of the pier
    blobCluster(x,z,s);
  }
  /* the hand placed ones: the one that stood at 66,78 was right beside the
     way down to the pier and has moved west, out of the sight line */
  blobCluster(-62,72,8); blobCluster(-96,64,9); blobCluster(-30,112,7);
  for(let i=0;i<6;i++){ lamp(-11,-36-i*26,C.azure); lamp(11,-36-i*26,C.azure); }
  for(let i=0;i<8;i++){ lamp(-36-i*26,-11,C.lavender); lamp(-36-i*26,11,C.lavender); }
  /* lamps follow the same rule as the trees: each one stands opposite a
     house on the far side, never in front of one on its own */
  /* the plaza approach, pulled back clear of the first plot: at x=36 this
     pair sat two units from a gap lamp on one side and square in front of
     the first house's board on the other */
  lamp(22,-11,C.mint); lamp(22,11,C.mint);
  rowGaps(true, ROW.x0-4, CEND).forEach(x=>lamp(x, 11,C.mint));
  rowGaps(false,ROW.x0-4, CEND).forEach(x=>lamp(x,-11,C.mint));
}
