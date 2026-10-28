/* ------------------------------ WORLD ------------------------------ */
/* The brand blob is an elongated droplet with a pinched waist, not a sphere.
   A lathe profile gets that shape exactly: tapered tips, an off centre bulge
   and a gaussian pinch partway up. */
function blobGeometry(seed,seg,rings){
  const rnd=seedRnd(seed), pts=[], N=rings||30;
  const botSharp=0.40+rnd()*0.34, topSharp=0.40+rnd()*0.34;
  const waistPos=0.32+rnd()*0.34;
  const waistDepth=0.16+rnd()*0.36;
  const waistW=0.07+rnd()*0.10;
  const bulge=0.86+rnd()*0.28;
  for(let i=0;i<=N;i++){
    const t=i/N, sn=Math.sin(Math.PI*t);
    const e=t<waistPos? botSharp : topSharp;
    let r=Math.pow(sn,e)*bulge;
    r*=1-waistDepth*Math.exp(-Math.pow((t-waistPos)/waistW,2));
    pts.push(new THREE.Vector2(Math.max(0.008,r), t*2-1));
  }
  const g=new THREE.LatheGeometry(pts,seg||22);
  g.computeVertexNormals();
  return g;
}
/* BufferGeometryUtils lives in the examples bundle, not the core build, so the
   merge is done by hand. One merged geometry per plant keeps the draw calls flat. */
function mergeGeos(geos,mats){
  const pos=[],nor=[],uv=[];
  geos.forEach((g,i)=>{
    const gg=(g.index? g.toNonIndexed() : g.clone());
    if(mats&&mats[i]) gg.applyMatrix4(mats[i]);
    const p=gg.attributes.position.array, n=gg.attributes.normal.array;
    for(let k=0;k<p.length;k++) pos.push(p[k]);
    for(let k=0;k<n.length;k++) nor.push(n[k]);
    if(gg.attributes.uv){ const u=gg.attributes.uv.array; for(let k=0;k<u.length;k++) uv.push(u[k]); }
    else { for(let k=0;k<p.length/3*2;k++) uv.push(0); }
  });
  const m=new THREE.BufferGeometry();
  m.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  m.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  m.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  return m;
}
/* is this patch of ground clear of buildings, roads and the plaza? */
const DIG_AT={x:-168,z:118};   // moved inland with the dig site
function spotFree(x,z,r){
  for(let i=0;i<QZONES.length;i++){ const q=QZONES[i];
    if(x>q.x1-r && x<q.x2+r && z>q.z1-r && z<q.z2+r) return false; }
  if(Math.hypot(x-DIG_AT.x, z-DIG_AT.z) < 34) return false;   // keep the field clear
  if(Math.abs(x)<15 && z<44 && z>-135) return false;   // city street
  /* The community street grows with the number of houses, so the strip that
     has to stay clear follows XMAX instead of an old fixed number. */
  if(Math.abs(z)<15 && x>-320 && x<0) return false;                   // team street
  /* The community verge stays clear all the way to the front walls, or the
     scatter drops a bush against somebody's nameboard. Ankle-high grass is
     exempt: it cannot hide a sign that hangs at head height, and without it
     the verge reads as bare dirt beside a green field. */
  if(x>0 && x<Math.max(250,XMAX) && Math.abs(z)<(r<0.8 ? 15 : ROW.front+1.5)) return false;
  if(Math.sqrt(x*x+z*z)<34) return false;              // plaza
  if(z>SEA.shore-56) return false;                     // the beach and the water
  // Building footprints. Wall colliders alone leave the interior open, which is
  // how trees ended up growing inside the rooms.
  for(let i=0;i<mapItems.length;i++){
    const m=mapItems[i];
    if(Math.abs(x-m.x) < m.w/2+r+2 && Math.abs(z-m.z) < m.d/2+r+2) return false;
  }
  for(let i=0;i<colliders.length;i++){
    const c=colliders[i];
    if(x>c.x1-r && x<c.x2+r && z>c.z1-r && z<c.z2+r) return false;
  }
  return true;
}

/* seeded, like the trees: the same sculptures in the same places every load,
   instead of a new set dropped somewhere on each refresh */
const blobRnd=seedRnd(424242);
function blobCluster(x,z,s){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const n=2+((blobRnd()*3)|0);
  for(let i=0;i<n;i++){
    const r=s*(0.6+blobRnd()*0.7);
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),M.blob);
    m.position.set((blobRnd()-.5)*s*1.3, r*0.85, (blobRnd()-.5)*s*1.3);
    m.scale.y=0.78+blobRnd()*0.3; g.add(m);
    colliders.push({x1:x+m.position.x-r*0.8,x2:x+m.position.x+r*0.8,z1:z+m.position.z-r*0.8,z2:z+m.position.z+r*0.8});
  }
}
function lamp(x,z,acc){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  Cyl(g,.16,.22,5.4,8,M.dark,0,2.7,0,true);
  B(g,1.5,0.3,0.5,M.dark,0,5.4,0,false,true);
  const dark = SKIES[PHASE].star>0.2;
  B(g,1.2,0.16,0.36,new THREE.MeshLambertMaterial({color:dark?0xFFE9BF:acc,
    emissive:dark?0xFFD79A:0x000000}),0,5.2,0,false,false);
  if(dark){
    const halo=new THREE.Mesh(new THREE.SphereGeometry(1.5,10,8),
      new THREE.MeshBasicMaterial({color:0xFFE0A8,transparent:true,opacity:0.13,depthWrite:false}));
    halo.position.set(0,5.1,0); g.add(halo);
    /* no PointLight here: fifty of these were the whole night-time slowdown.
       The halo, this pool and the shaft do the work of one for free. */
    const pool=new THREE.Mesh(new THREE.CircleGeometry(4.6,18),
      new THREE.MeshBasicMaterial({color:0xFFD79A,transparent:true,opacity:0.16,depthWrite:false}));
    pool.rotation.x=-Math.PI/2; pool.position.set(0,0.24,0); g.add(pool);
    /* open-ended so there is no lid over the bulb or disc on the ground */
    if(FX()){
    const shaft=new THREE.Mesh(
      new THREE.CylinderGeometry(0.55,3.9,5.0,9,1,true), shaftMat());
    shaft.position.set(0,2.6,0); g.add(shaft);
    }
  }
}
function road(x,z,w,d,acc){
  const g=new THREE.Group(); scene.add(g);
  const line=new THREE.MeshLambertMaterial({color:0xF6F2E4});
  const curb=new THREE.MeshLambertMaterial({color:acc});
  B(g,w,0.24,d,M.asphalt,x,0.12,z,false,false);
  if(w>d){
    B(g,w,0.3,5.0,M.walk,x,0.17,z-d/2-2.5,false,false);
    B(g,w,0.3,5.0,M.walk,x,0.17,z+d/2+2.5,false,false);
    B(g,w,0.26,2.6,M.grass,x,0.15,z-d/2-6.3,false,false);
    B(g,w,0.26,2.6,M.grass,x,0.15,z+d/2+6.3,false,false);
    B(g,w,0.34,0.4,curb,x,0.19,z-d/2+0.2,false,false);
    B(g,w,0.34,0.4,curb,x,0.19,z+d/2-0.2,false,false);
    for(let i=-w/2+6;i<w/2;i+=12) B(g,5,0.24,0.34,line,x+i,0.14,z,false,false);
  } else {
    B(g,5.0,0.3,d,M.walk,x-w/2-2.5,0.17,z,false,false);
    B(g,5.0,0.3,d,M.walk,x+w/2+2.5,0.17,z,false,false);
    B(g,2.6,0.26,d,M.grass,x-w/2-6.3,0.15,z,false,false);
    B(g,2.6,0.26,d,M.grass,x+w/2+6.3,0.15,z,false,false);
    B(g,0.4,0.34,d,curb,x-w/2+0.2,0.19,z,false,false);
    B(g,0.4,0.34,d,curb,x+w/2-0.2,0.19,z,false,false);
    for(let i=-d/2+6;i<d/2;i+=12) B(g,0.34,0.24,5,line,x,0.14,z+i,false,false);
  }
}
function gate(x,z,rotY,label,acc){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rotY; scene.add(g);
  B(g,1.5,8.2,1.5,M.wall,-11.5,4.1,0,true,true);
  B(g,1.5,8.2,1.5,M.wall, 11.5,4.1,0,true,true);
  B(g,1.9,0.5,1.9,M.trim,-11.5,0.3,0,false,true);
  B(g,1.9,0.5,1.9,M.trim, 11.5,0.3,0,false,true);
  B(g,25.6,2.4,1.7,M.dark,0,9.4,0,false,true);
  B(g,25.6,0.4,1.8,new THREE.MeshLambertMaterial({color:acc}),0,7.95,0,false,false);
  const t=signTexture(label,'',hx(acc));
  const f=new THREE.Mesh(new THREE.PlaneGeometry(22,5.5),new THREE.MeshBasicMaterial({map:t}));
  f.position.set(0,9.5,0.88); g.add(f);
  const b=f.clone(); b.position.z=-0.88; b.rotation.y=Math.PI; g.add(b);
}

/* A ring basin around the signpost: a low wall, a sheet of water that
   breathes, six jets and a mist of droplets. The droplets are one Points
   object, the jets share one material, and nothing here casts a shadow. */
function fountain(){
  const g=new THREE.Group(); scene.add(g);
  const R=6.4, wallM=SM({color:0xD6DEE6, roughness:0.86});
  /* open-ended, so there is no disc capping the basin from above */
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(R,R,1.15,40,1,true), wallM);
  wall.position.y=0.58; wall.receiveShadow=true; g.add(wall);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,0.22,8,44), SM({color:0xB6C2CE, roughness:0.7}));
  rim.rotation.x=Math.PI/2; rim.position.y=1.15; g.add(rim);
  /* the collider is square because that is all worldAABB understands; a
     little tight on the diagonals and nobody will ever notice */
  colliders.push(worldAABB(g, R*1.7, R*1.7, 0, 0));

  const waterM = PBR
    ? SM({color:0x6FA6C8, roughness:0.05, metalness:0.32})
    : new THREE.MeshLambertMaterial({color:0x8FBBD6});
  waterM.transparent=true; waterM.opacity=0.82;
  const water=new THREE.Mesh(new THREE.CircleGeometry(R-0.22,44), waterM);
  water.rotation.x=-Math.PI/2; water.position.y=0.92; g.add(water);

  /* An upper bowl on a stem with water spilling over its lip. One flat
     basin is a paddling pool; what makes a fountain read as one is water
     falling from one level to another. */
  const stoneM=SM({color:0xCBD5DE, roughness:0.82});
  Cyl(g,0.62,0.9,1.9,14,stoneM,0,2.0,0,false);
  const bowl=new THREE.Mesh(new THREE.CylinderGeometry(2.5,1.5,0.5,26), stoneM);
  bowl.position.y=3.05; bowl.castShadow=true; g.add(bowl);
  const bowlRim=new THREE.Mesh(new THREE.TorusGeometry(2.5,0.12,7,28), stoneM);
  bowlRim.rotation.x=Math.PI/2; bowlRim.position.y=3.28; g.add(bowlRim);
  const bowlTop=new THREE.Mesh(new THREE.CircleGeometry(2.36,26), waterM);
  bowlTop.rotation.x=-Math.PI/2; bowlTop.position.y=3.22; g.add(bowlTop);

  const jetM=new THREE.MeshBasicMaterial({color:0xE4F2FA, transparent:true,
    opacity:0.5, depthWrite:false, toneMapped:false});
  /* the curtain off the upper lip: open ended, so it is a falling sheet
     and not a bucket */
  const veil=new THREE.Mesh(new THREE.CylinderGeometry(2.48,2.62,2.1,26,1,true),
    new THREE.MeshBasicMaterial({color:0xDCEEF8, transparent:true, opacity:0.3,
      depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
  veil.position.y=2.1; g.add(veil);
  const jets=[];
  for(let i=0;i<6;i++){
    const a=i/6*6.283;
    const j=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.16,2.6,6,1,true), jetM);
    j.position.set(Math.cos(a)*3.5, 2.1, Math.sin(a)*3.5);
    g.add(j); jets.push(j);
  }

  const N=90, pos=new Float32Array(N*3), vel=new Float32Array(N*2), seed=[];
  for(let i=0;i<N;i++){
    const a=(i%6)/6*6.283;
    seed.push({a:a, t:Math.random()});
    pos[i*3]=Math.cos(a)*3.5; pos[i*3+1]=1.2; pos[i*3+2]=Math.sin(a)*3.5;
    vel[i*2]=0.55+Math.random()*0.5;   // how far out this drop is thrown
    vel[i*2+1]=2.5+Math.random()*1.4;  // and how high
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const spray=new THREE.Points(geo, new THREE.PointsMaterial({
    color:0xEAF6FF, size:0.4, map:spriteTex('dot'), alphaTest:0.1,
    depthWrite:false, transparent:true, opacity:0.75, fog:true}));
  g.add(spray);
  const arr=geo.attributes.position.array;

  anims.push((t,dt)=>{
    /* the sheet breathes rather than sits: a hair of vertical movement is
       enough, and it costs one position write */
    water.position.y=0.92+Math.sin(t*1.3)*0.012;
    bowlTop.position.y=3.22+Math.sin(t*1.7+0.6)*0.008;
    /* the curtain shivers rather than pulses, or it reads as a breathing
       cylinder instead of falling water */
    veil.scale.set(1+Math.sin(t*4.1)*0.006, 1+Math.sin(t*2.3)*0.02, 1+Math.cos(t*3.7)*0.006);
    for(let i=0;i<jets.length;i++)
      jets[i].scale.y=0.9+Math.sin(t*3.4+i*1.1)*0.1;
    for(let i=0;i<N;i++){
      const s=seed[i];
      s.t+=dt*0.75;
      if(s.t>1) s.t-=1;
      const k=s.t, out=3.5+vel[i*2]*k*2.2;
      arr[i*3]  =Math.cos(s.a)*out;
      arr[i*3+2]=Math.sin(s.a)*out;
      /* straight ballistic arc: up fast, then gravity takes it back down */
      arr[i*3+1]=1.2+vel[i*2+1]*k - 5.2*k*k;
      if(arr[i*3+1]<1.0) arr[i*3+1]=1.0;
    }
    geo.attributes.position.needsUpdate=true;
  });
}
function signpost(){
  const g=new THREE.Group(); g.position.set(0,0,0); scene.add(g);
  Cyl(g,.34,.44,11,10,M.dark,0,5.5,0,true);
  /* the plinth now stands inside the fountain basin, so it is tall enough to
     clear the water instead of being swallowed by it */
  Cyl(g,1.5,1.7,1.5,16,M.trim,0,0.75,0,false);
  Cyl(g,.6,.6,.35,12,M.dark,0,11.2,0,false);
  // the arm physically points down its own road, so it reads right from any side
  const arm=(txt,accHex,y,dirX,dirZ)=>{
    const grp=new THREE.Group();
    grp.position.set(0,y,0);
    grp.rotation.y=Math.atan2(-dirZ,dirX);
    g.add(grp);
    const c=cvs(1024,224), x2=c.getContext('2d');
    x2.fillStyle='#282C34'; x2.fillRect(0,0,1024,224);
    x2.fillStyle=accHex; x2.fillRect(0,192,1024,32);
    x2.fillStyle='#FFFBFB'; x2.font='800 84px ui-sans-serif, Helvetica, Arial';
    x2.textAlign='center'; x2.textBaseline='middle'; x2.fillText(txt,512,96);
    const L=8.4, H=1.9, tp=1.7, x0=0.85;
    const sh=new THREE.Shape();
    sh.moveTo(0,-H/2); sh.lineTo(L-tp,-H/2); sh.lineTo(L,0);
    sh.lineTo(L-tp,H/2); sh.lineTo(0,H/2); sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth:0.3,bevelEnabled:false});
    geo.translate(0,0,-0.15);
    const board=new THREE.Mesh(geo,M.dark);
    board.position.set(x0,0,0); grp.add(board); outline(grp,board);
    const fw=L-tp-0.35, fh=fw/4.571;
    const f=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),new THREE.MeshBasicMaterial({map:tex(c)}));
    f.position.set(x0+(L-tp)/2,0,0.17); grp.add(f);
    const f2=f.clone(); f2.position.z=-0.17; f2.rotation.y=Math.PI; grp.add(f2);
  };
  arm('OPTIMUM CITY','#51B1FE',9.3, 0,-1);
  arm('THE TEAM','#B87CFF',7.3,-1, 0);
  arm('COMMUNITY','#64E27F',5.3, 1, 0);
}
