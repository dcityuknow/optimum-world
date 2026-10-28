/* ------------------------------ THE PIER ------------------------------
   Runs out from the beach at x = 52 to a wider head over deep water. Built
   from one plank geometry repeated rather than a long box, because the gaps
   between planks are what makes it read as a pier at all. */
const PIER={x:52, z0:0, len:62, w:7.4, deck:2.1, ramp:14};
/* The height of the boards at a given z. floorAt uses the same curve, so
   what you see and what you stand on can never disagree again: before,
   the walking height had a ramp and the planks did not, which is why the
   near end hung in the air over the sand. */
/* HALF the deck width at a given z. The planks are built from the full width
   and everything else (rails, stringers, colliders, where you can stand) had
   been using that same full figure as if it were a half, so all of it stood
   out over the water at twice the real width. Everything asks this now. */
function halfW(z){
  return (z > PIER.z0+PIER.len-11 ? PIER.w*1.9 : PIER.w)/2;
}
function deckY(z){
  return PIER.deck*Math.max(0,Math.min(1,(z-(PIER.z0-1))/PIER.ramp));
}
/* how high the ground is under a given spot. Zero everywhere except the
   pier, which is the only thing in the world you can stand on top of. */
function floorAt(x,z){
  if(!pierEnd) return 0;
  const zEnd=PIER.z0+PIER.len;
  if(z<PIER.z0-1 || z>zEnd) return 0;
  if(Math.abs(x-PIER.x) > halfW(z)-0.3) return 0;
  return deckY(z);
}
/* eased, so a step onto the ramp is a step and not a jolt */
let floorY=0;
function floorTick(dt){
  const want=floorAt(player.x,player.z);
  floorY += (want-floorY)*Math.min(1, dt*9);
  if(Math.abs(want-floorY)<0.004) floorY=want;
}
let pierEnd=null, baisedNPC=null, baisedRod=null, baisedCap=null;

function buildPier(){
  const g=new THREE.Group(); scene.add(g);
  PIER.z0=SEA.shore-16;                       // starts on the dry sand
  const zEnd=PIER.z0+PIER.len;
  pierEnd={x:PIER.x, z:zEnd-5};

  const plank =new THREE.MeshLambertMaterial({color:0x9B7C58});
  const plank2=new THREE.MeshLambertMaterial({color:0x8A6C4B});
  const post  =new THREE.MeshLambertMaterial({color:0x6E563C});
  const rail  =new THREE.MeshLambertMaterial({color:0x7E6344});
  const DECK=PIER.deck;

  /* deck: one plank every 0.62 with a 4cm gap. Planks on the ramp are tipped
     to its slope, so it is a slope and not a staircase. */
  const slope=Math.atan2(PIER.deck, PIER.ramp);
  const plankAt=(z,h2,lift)=>{
    const onRamp = z < PIER.z0-1+PIER.ramp;
    return new THREE.Matrix4().compose(
      new THREE.Vector3(PIER.x, deckY(z)+lift, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(onRamp?-slope:0,0,0)),
      new THREE.Vector3(1,1,1));
  };
  const pg=[], pm=[];
  for(let i=0; i*0.62 < PIER.len; i++){
    const z=PIER.z0+i*0.62+0.31;
    const wide = z > zEnd-11 ? PIER.w*1.9 : PIER.w;   // the head flares out
    pg.push(new THREE.BoxGeometry(wide,0.16,0.58));
    pm.push(plankAt(z,0.16,0.02));
  }
  const deck=new THREE.Mesh(mergeGeos(pg,pm), plank);
  deck.castShadow=true; deck.receiveShadow=true; g.add(deck);
  /* every fifth plank in the darker tone, laid just proud of the rest */
  const dg=[], dm=[];
  for(let i=2; i*0.62 < PIER.len; i+=5){
    const z=PIER.z0+i*0.62+0.31;
    const wide = z > zEnd-11 ? PIER.w*1.9 : PIER.w;
    dg.push(new THREE.BoxGeometry(wide,0.17,0.58));
    dm.push(plankAt(z,0.17,0.027));
  }
  g.add(new THREE.Mesh(mergeGeos(dg,dm), plank2));

  /* stringers under the boards, so from the beach the deck has a visible
     thickness instead of being one plank thin */
  {
    const sg=[], sm=[];
    for(let z=PIER.z0-1; z<zEnd; z+=2.0){
      const wide = z > zEnd-11 ? PIER.w*1.9 : PIER.w;
      const y0=deckY(z), y1=deckY(z+2.0);
      for(const s of [-1,1]){
        sg.push(new THREE.BoxGeometry(0.26,0.34,2.02));
        sm.push(new THREE.Matrix4().compose(
          new THREE.Vector3(PIER.x+s*(halfW(z+1)-0.4),(y0+y1)/2-0.2,z+1.0),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.atan2(y1-y0,2.0),0,0)),
          new THREE.Vector3(1,1,1)));
      }
    }
    g.add(new THREE.Mesh(mergeGeos(sg,sm), post));
  }

  /* piles only where the deck is actually up in the air; on the ramp the
     boards rest on the sand and need nothing under them */
  const gg=[], gm=[];
  for(let z=PIER.z0+PIER.ramp+1; z<zEnd; z+=6.2){
    const wide = z > zEnd-11 ? PIER.w*0.92 : PIER.w*0.42;
    const top=deckY(z)-0.08;
    for(const s of [-1,1]){
      gg.push(new THREE.CylinderGeometry(0.19,0.23,top+4.0,8));
      gm.push(new THREE.Matrix4().makeTranslation(PIER.x+s*wide, (top-4.0)/2, z));
    }
    gg.push(new THREE.BoxGeometry(wide*2+0.3,0.16,0.16));
    gm.push(new THREE.Matrix4().makeTranslation(PIER.x, top-0.55, z));
  }
  const piles=new THREE.Mesh(mergeGeos(gg,gm), post);
  piles.castShadow=true; g.add(piles);

  /* the railing follows the ramp: posts stand on the local board height and
     each run of rail is its own short tilted piece between two posts */
  const rg=[], rm=[];
  const STEP=2.2;
  const headZ=zEnd-11;
  for(let z=PIER.z0+1; z<zEnd-1; z+=STEP){
    const wide = z > headZ ? PIER.w*1.9 : PIER.w;
    /* the narrow rail stops where the head starts, instead of running on
       across the middle of the wider deck */
    if(z<headZ && z+STEP>headZ){ continue; }
    const z2=Math.min(z+STEP, zEnd-1);
    const y0=deckY(z), y1=deckY(z2), L=z2-z;
    for(const s of [-1,1]){
      const x=PIER.x+s*(halfW(z)-0.25);
      rg.push(new THREE.BoxGeometry(0.13,1.0,0.13));
      rm.push(new THREE.Matrix4().makeTranslation(x, y0+0.5, z));
      if(L>0.2) for(const yy of [0.98,0.62]){
        rg.push(new THREE.BoxGeometry(0.1,0.1,L));
        rm.push(new THREE.Matrix4().compose(
          new THREE.Vector3(x,(y0+y1)/2+yy, z+L/2),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.atan2(y1-y0,L),0,0)),
          new THREE.Vector3(1,1,1)));
      }
    }
  }
  g.add(new THREE.Mesh(mergeGeos(rg,rm), rail));

  /* you can walk the deck and not walk off the sides: a thin wall just
     outside each edge of the boards */
  for(let z=PIER.z0; z<zEnd; z+=2.5){
    const hw=halfW(z+1.25);
    colliders.push({x1:PIER.x-hw-0.9, x2:PIER.x-hw+0.1, z1:z, z2:z+2.5, x:PIER.x, z:z});
    colliders.push({x1:PIER.x+hw-0.1, x2:PIER.x+hw+0.9, z1:z, z2:z+2.5, x:PIER.x, z:z});
  }

  /* the back edge of the head, either side of the walkway: the side walls
     stop where the head widens, and the step from the head back into the
     water beside the walk was left open */
  { const hz=zEnd-11, n=PIER.w/2, w=PIER.w*1.9/2;
    for(const s of [-1,1]){
      const a=PIER.x+s*n, b=PIER.x+s*(w+0.9);
      colliders.push({x1:Math.min(a,b), x2:Math.max(a,b), z1:hz-1.0, z2:hz, x:(a+b)/2, z:hz-0.5});
    }
  }
  /* ---- the tackle, on the head of the pier ---- */
  const HX=PIER.x, HZ=zEnd-6;
  const steel=new THREE.MeshLambertMaterial({color:0xAEB8C4});
  const green=new THREE.MeshLambertMaterial({color:0x3E6B4E});
  const red  =new THREE.MeshLambertMaterial({color:0xB0503F});

  /* tackle box, lid open, trays showing */
  const box=new THREE.Group(); box.position.set(HX-3.4,DECK+0.08,HZ-1.2);
  box.rotation.y=-0.4; g.add(box);
  B(box,1.25,0.52,0.72,green,0,0.26,0,false,true);
  B(box,1.28,0.09,0.75,new THREE.MeshLambertMaterial({color:0x2F5540}),0,0.56,0,false,false);
  const lid=new THREE.Group(); lid.position.set(0,0.56,-0.36); box.add(lid);
  lid.rotation.x=-1.15;
  B(lid,1.25,0.06,0.70,green,0,0,0.35,false,true);
  for(let i=0;i<4;i++)
    B(box,0.22,0.10,0.5,new THREE.MeshLambertMaterial({color:i%2?0xD8A94B:0xC9552F}),
      -0.45+i*0.30,0.60,0.06,false,false);

  /* a bucket with a fish in it, and a second one for bait */
  const bkt=(bx,bz,col)=>{
    const b=new THREE.Group(); b.position.set(bx,DECK+0.08,bz); g.add(b);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.32,0.66,12,1,true),col);
    body.position.y=0.33; b.add(body);
    const water=new THREE.Mesh(new THREE.CircleGeometry(0.38,12),
      new THREE.MeshLambertMaterial({color:0x4E8FA8}));
    water.rotation.x=-Math.PI/2; water.position.y=0.55; b.add(water);
    const hoop=new THREE.Mesh(new THREE.TorusGeometry(0.40,0.028,5,14),steel);
    hoop.rotation.x=Math.PI/2; hoop.position.y=0.66; b.add(hoop);
    const hand=new THREE.Mesh(new THREE.TorusGeometry(0.40,0.022,5,14,Math.PI),steel);
    hand.position.y=0.70; hand.rotation.y=Math.PI/2; b.add(hand);
    return b;
  };
  bkt(HX+3.2,HZ-0.6,steel); bkt(HX+3.9,HZ+0.7,red);

  /* two spare rods leaning on the rail, and a landing net */
  for(let i=0;i<2;i++){
    const r=new THREE.Group();
    r.position.set(HX-(PIER.w*0.95)+0.9+i*0.5, DECK+0.08, HZ+2.2);
    r.rotation.set(-0.5,0.2*i,0.2+0.12*i); g.add(r);
    mkRod(r);
  }
  const net=new THREE.Group(); net.position.set(HX+(PIER.w*0.95)-1.0,DECK+0.1,HZ+1.6);
  net.rotation.set(-0.45,0.5,0.25); g.add(net);
  Cyl(net,0.045,0.05,2.1,7,post,0,1.05,0,false);
  const hoop=new THREE.Mesh(new THREE.TorusGeometry(0.46,0.035,6,16),steel);
  hoop.position.set(0,2.2,0); net.add(hoop);
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(0.44,10,7,0,6.283,0,1.4),
    new THREE.MeshLambertMaterial({color:0x5E6A74,transparent:true,opacity:0.45,
      side:THREE.DoubleSide,wireframe:true}));
  mesh.position.set(0,2.2,0); mesh.rotation.x=Math.PI; net.add(mesh);

  /* a lantern on a post, so the head of the pier reads at night */
  Cyl(g,0.07,0.09,3.0,8,post,HX-(PIER.w*0.95)+0.5,DECK+1.5,HZ-2.6,false);
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.56,0.42),
    new THREE.MeshBasicMaterial({color:DARK?0xFFD9A0:0xE8E2D4, toneMapped:false}));
  lamp.position.set(HX-(PIER.w*0.95)+0.5,DECK+3.1,HZ-2.6); g.add(lamp);
  /* a real light here cost as much as the whole pier; a warm pool on the
     boards reads the same at night */
  if(DARK){
    const pp=new THREE.Mesh(new THREE.CircleGeometry(3.6,18),
      new THREE.MeshBasicMaterial({color:0xFFD79A,transparent:true,opacity:0.16,depthWrite:false}));
    pp.rotation.x=-Math.PI/2; pp.position.set(lamp.position.x,DECK+0.1,lamp.position.z); g.add(pp);
  }

  /* ---- baised, at the rail, mid cast ---- */
  baisedNPC=makePerson(g,{look:SKINS.baised, perform:1, stand:1,
    a:[HX+1.1,HZ+2.6], b:[HX+1.1,HZ+2.6], baseY:DECK+0.08, baseYaw:0.12});
  baisedNPC.position.set(HX+1.1, DECK+0.08, HZ+2.6);
  /* the same marker as the samurai: ! to start and to hand in, gone once done */
  /* hidden until Jeffrey has sent you here; after the fish, one more quest */
  addMarker(baisedNPC, 3.7, ()=> (Q.dig<3 && Q.fish===0) ? 2 :
    (Q.fish>=3 ? (Q.leg===0 ? 0 : 2) : (Q.fish===1 ? 1 : 0)));
  baisedNPC.rotation.y=0.12;                   // facing out to sea
  /* his head top sits at 2.45 and is 0.56 wide against the player's 0.64 */
  baisedCap=mkFishCap(); baisedCap.position.set(0,2.45,0); baisedCap.scale.setScalar(0.875);
  baisedNPC.add(baisedCap); capOffBaised();
  baisedRod=new THREE.Group();
  /* the face is on the +Z side of the head, so +Z is forward. Tipping the
     rod by a NEGATIVE angle about X sent it over his shoulder. */
  baisedRod.position.set(0.5,1.5,0.28); baisedRod.rotation.set(0.95,0,-0.1);
  mkRod(baisedRod); baisedNPC.add(baisedRod);
  /* the line, from the tip out to where the float sits */
  const lineMat=new THREE.LineBasicMaterial({color:0xE4EAF0, transparent:true, opacity:0.55});
  const lineGeo=new THREE.BufferGeometry().setFromPoints(
    /* from the tip: measured with the full transform chain, it sits 2.49 up
       and 2.19 out in front of his feet */
    [new THREE.Vector3(HX+1.1+0.90,DECK+0.08+2.49,HZ+2.6+2.19), new THREE.Vector3(HX+2.4,SEA.y+0.3,HZ+12)]);
  g.add(new THREE.Line(lineGeo,lineMat));
  const float=new THREE.Group(); float.position.set(HX+2.4,SEA.y+0.1,HZ+12); g.add(float);
  const fb=new THREE.Mesh(new THREE.SphereGeometry(0.16,8,7),red); fb.position.y=0.1; float.add(fb);
  Cyl(float,0.02,0.02,0.4,5,new THREE.MeshLambertMaterial({color:0xF0F0F0}),0,0.38,0,false);

  anims.push((t,dt)=>{
    /* he breathes and works the rod tip; the float rides the swell */
    const p=baisedNPC;
    p.position.y=DECK+0.08+Math.sin(t*1.5)*0.012;
    if(baisedRod) baisedRod.rotation.x=0.95+Math.sin(t*0.8)*0.07;
    const lim=p.userData.limbs;
    if(lim){
      lim.armR.rotation.x=-1.15+Math.sin(t*0.8)*0.07; lim.armR.rotation.z=0.3;
      lim.armL.rotation.x=-0.85+Math.sin(t*0.8+0.4)*0.05; lim.armL.rotation.z=-0.22;
    }
    float.position.y=SEA.y+0.1+Math.sin(t*1.9)*0.16+Math.sin(t*0.7)*0.1;
    float.rotation.z=Math.sin(t*1.6)*0.12;
  });

  /* the two things you can walk up to */
  spots.push({x:baisedNPC.position.x+1.6, z:baisedNPC.position.z, r:3.2, baised:1,
    accent:C.lavender, data:{name:'baised'}, prio:1});
  /* The cast marker: a ring you step into, like a mission start. It pulses
     and turns gold while you are standing in it. */
  const FX_=HX+4.6, FZ_=zEnd-3.4;
  /* Red means red here. The first version sat an additive column over a light
     deck, and adding red light to something pale gives pink. Everything is
     normal blending now, one solid red, and the glow is a knee-high fade
     instead of a five metre tower. */
  const RED=0xE0140C, GOLD=0xFFB020;
  const ringM=new THREE.MeshBasicMaterial({color:RED, transparent:true,
    opacity:0.95, depthWrite:false, toneMapped:false, side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.98,1.22,48), ringM);
  ring.rotation.x=-Math.PI/2; ring.position.set(FX_, DECK+0.12, FZ_); g.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(0.98,48),
    new THREE.MeshBasicMaterial({color:RED, transparent:true, opacity:0.30,
      depthWrite:false, toneMapped:false}));
  disc.rotation.x=-Math.PI/2; disc.position.set(FX_, DECK+0.115, FZ_); g.add(disc);
  /* a short wall of light that fades out by knee height */
  const glowTex=(()=>{
    const c=cvs(4,64), x2=c.getContext('2d');
    const lg=x2.createLinearGradient(0,64,0,0);
    lg.addColorStop(0,'rgba(255,255,255,0.60)');
    lg.addColorStop(1,'rgba(255,255,255,0)');
    x2.fillStyle=lg; x2.fillRect(0,0,4,64);
    return new THREE.CanvasTexture(c);
  })();
  const glowM=new THREE.MeshBasicMaterial({color:RED, map:glowTex, transparent:true,
    depthWrite:false, side:THREE.DoubleSide, toneMapped:false});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,0.9,40,1,true), glowM);
  beam.position.set(FX_, DECK+0.12+0.45, FZ_); g.add(beam);
  anims.push((t)=>{
    const inIt = Math.hypot(player.x-FX_, player.z-FZ_) < 1.5;
    const s=1+Math.sin(t*3.2)*0.06;
    ring.scale.set(s,s,1);
    const col=inIt?GOLD:RED;
    ringM.color.setHex(col); disc.material.color.setHex(col); glowM.color.setHex(col);
    beam.scale.y=0.85+Math.sin(t*2.4)*0.15;
    beam.position.y=DECK+0.12+0.45*beam.scale.y;
    const show = !FG && Q.fish<2;
    ring.visible=disc.visible=beam.visible=show;
  });
  spots.push({x:FX_, z:FZ_, r:1.5, fishSpot:1,
    accent:0xFF4A3D, data:{name:tr('fishSpot')}, prio:2});
}
