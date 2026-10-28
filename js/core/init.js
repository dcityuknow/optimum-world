/* ------------------------------ INIT ------------------------------ */
/* Errors go to the console, not onto the screen. */
function showFatal(where,e){ console.error(where,e); }
function init(){
  try{ initWorld(); }catch(e){ showFatal("init",e); }
}
function initWorld(){
  scene=new THREE.Scene();
  scene.fog=new THREE.Fog(SKIES[PHASE].fog, WEATHER==='fog'?38:180, WEATHER==='fog'?150:420);

  camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,0.4,1400);
  /* logarithmicDepthBuffer writes gl_FragDepth in every fragment shader, which
     kills early-Z rejection. A city street has heavy overdraw, so that was the
     single most expensive setting here. near 0.4 / far 900 fits a 24 bit buffer
     with room to spare, so the log buffer is not needed at all. */
  renderer=new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch?1.8:2));
  renderer.setSize(innerWidth,innerHeight);
  MAXANISO=renderer.capabilities.getMaxAnisotropy();
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=SKIES[PHASE].exp||1.0;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;   // driven manually, see shadowTick
  document.body.appendChild(renderer.domElement);

  // weak GPUs get the old cheap path; everyone else gets standard materials
  PBR = !(isTouch && Math.min(devicePixelRatio,2)<2) && renderer.capabilities.isWebGL2!==false;
  try{
    const dbg=renderer.getContext().getExtension('WEBGL_debug_renderer_info');
    if(dbg){
      const gpu=(renderer.getContext().getParameter(dbg.UNMASKED_RENDERER_WEBGL)||'').toLowerCase();
      if(/swiftshader|software|llvmpipe|mali-4|adreno \(tm\) 3/.test(gpu)) PBR=false;
    }
  }catch(e){}
  USE_NM = PBR && !isTouch;
  if(isTouch) document.body.classList.add('lite');
  initMaterials();

  WEATHER=weatherNow();
  DARK = SKIES[PHASE].star>0.2;
  const K=SKIES[PHASE];
  const sky=new THREE.Mesh(new THREE.SphereGeometry(430,20,14),
    new THREE.MeshBasicMaterial({map:skyTexturePhase(),side:THREE.BackSide,fog:false,depthWrite:false,toneMapped:false}));
  sky.name='sky'; scene.add(sky);
  /* anything that makes up the sky rides along with the camera, so no
     street is ever long enough to walk out of it */
  renderer.setClearColor(new THREE.Color(K.low||'#EDF1F5'));
  if(PBR) buildEnv();
  makeStars(K.star);
  makeCelestial();
  makeWeather();

  scene.add(new THREE.HemisphereLight(0xEAF2FF,0xC9B79A, SKIES[PHASE].hemi*(WEATHER==='clear'?1:0.82)*(PBR?0.62:1)));
  sun=new THREE.DirectionalLight(SKIES[PHASE].sun, SKIES[PHASE].si*(WEATHER==='clear'?1:(WEATHER==='cloudy'?0.55:0.42)));
  sun.position.set(60,110,50); sun.castShadow=(SKIES[PHASE].si>0.3 && WEATHER==='clear');
  sun.shadow.mapSize.set(isTouch?1024:2048, isTouch?1024:2048);
  const SH=46;                       // tight frustum, moved with the player each frame
  sun.shadow.camera.left=-SH; sun.shadow.camera.right=SH;
  sun.shadow.camera.top=SH; sun.shadow.camera.bottom=-SH;
  sun.shadow.camera.near=10; sun.shadow.camera.far=340;
  sun.shadow.bias=-0.00022; sun.shadow.normalBias=0.34;
  scene.add(sun); scene.add(sun.target);
  const bounce=new THREE.DirectionalLight(0xD3DBE2, SKIES[PHASE].si*0.13+0.04);
  bounce.position.set(-70,34,-58); scene.add(bounce);
  roomLight=new THREE.PointLight(0xFFF3E2,0.0,42); scene.add(roomLight);
  scene.add(camera);   // required, or camera children are never drawn
  renderer.shadowMap.needsUpdate=true;

  const gsurf=surf('ground', bakeGround, 0.22, 1.4);
  /* 806 deep instead of 1200, pushed north, so its far edge lands at the
     waterline: the sea has no land underneath it to peek through. */
  const gGeo=new THREE.PlaneGeometry(1200,806); uvScalePlane(gGeo,1200,806,gsurf.uvScale);
  /* far edge at z = SEA.shore + 6 */
  const ground=new THREE.Mesh(gGeo,
    SM({color:0xEAEEF2, map:gsurf.map, normalMap:nm(gsurf.normalMap), normalScale:0.6, roughness:0.97}));
  ground.rotation.x=-Math.PI/2; ground.position.y=-0.03;
  /* pushed north so the far edge sits just past the waterline: 806 deep,
     so the centre goes to (SEA.shore+6) - 403 */
  ground.position.z=SEA.shore+6-403;
  ground.receiveShadow=true; ground.userData.isGround=1; scene.add(ground);

  const plaza=new THREE.Group(); scene.add(plaza);
  const csurf=surf('concrete', bakeConcrete, 0.30, 1.7);
  B(plaza,54,0.2,54,SM({color:0xDDE4EB, map:csurf.map, normalMap:nm(csurf.normalMap), normalScale:0.7, roughness:0.94, uvScale:csurf.uvScale}),0,0.1,0,false,false);
  B(plaza,26,0.24,26,SM({color:0xC2CDD8, map:csurf.map, normalMap:nm(csurf.normalMap), normalScale:0.7, roughness:0.92, uvScale:csurf.uvScale}),0,0.12,0,false,false);

  buildCommunityList();
  /* every new resident pushes the street further out, so the tarmac, the
     pavement and the world edge all have to follow the last house */
  const lastSlot=COMMUNITY.reduce((m,d)=>Math.max(m, d.slot!==undefined?d.slot:0), 0);
  /* +1: a new player joins the front of the row after the street is built */
  RESERVE = Math.min(MAXHOUSES, Math.max(12,lastSlot+2)+6);
  CEND = rowX(RESERVE) + 26;
  /* the ground was a fixed 1200 across, ending at x=600; the street can now
     run well past that, so the plane is widened to the street's far end */
  { const g=scene.children.find(o=>o.userData&&o.userData.isGround);
    const extW=CEND+360-600;
    if(g && extW>0){
      /* its own plane with its own UVs, on the same material: scaling the
         original would have stretched a texture other surfaces share */
      const geo=new THREE.PlaneGeometry(extW, g.geometry.parameters.height);
      const us=g.material.userData&&g.material.userData.uvScale;
      if(us) uvScalePlane(geo, extW, g.geometry.parameters.height, us);
      const ext=new THREE.Mesh(geo, g.material);
      ext.rotation.x=-Math.PI/2; ext.position.set(600+extW/2, g.position.y, g.position.z);
      ext.receiveShadow=true; scene.add(ext);
    } }
  XMAX = Math.max(280, CEND+16);

  road(0,-119,16,190,C.azure);
  road(-139,0,230,16,C.lavender);
  road((24+CEND)/2,0,CEND-24,16,C.mint);
  /* only after rain or fog, and seeded off the road's own coordinates so
     the same street puddles in the same places every time */
  puddles(0,-119,16,190,9);
  puddles(-139,0,230,16,11);
  puddles((24+CEND)/2,0,CEND-24,16,11);
  puddles(0,0,50,50,6);                    // the plaza

  gate(0,-27,0,'Optimum City',C.azure);
  gate(-27,0,Math.PI/2,'The Team',C.lavender);
  gate(27,0,Math.PI/2,'Community',C.mint);

  signpost();
  fountain();
  dressWorld();

  const PZ=[-58,-98,-138,-78,-118,-158];
  CITY.forEach((d,i)=>{
    const left=i<3;
    makeBuilding({x:left?-30:30,z:PZ[i],yaw:left?Math.PI/2:-Math.PI/2,
      w:18,d:20,h:10+(i%3)*2,accent:C.azure,data:d,zone:'city',style:d.style});
  });
  const TX=[]; for(let i=0;i<TEAM.length;i++) TX.push(-58-i*20);
  TEAM.forEach((d,i)=>{
    const north=i%2===0;
    makeBuilding({x:TX[i],z:north?-30:30,yaw:north?0:Math.PI,
      w:18,d:20,h:9+(i%2)*2,accent:C.lavender,data:d,zone:'team',style:d.style,room:d.key,
      person:{look:SKINS[d.id]}});
  });
  TOTAL=12+COMMUNITY.length;
  COMMUNITY.forEach((d,i)=>addCommunityHouse(d,i));

  /* smoke off the city rooftops: three is enough for depth, and every puff
     in a plume shares one material */
  makePlume(-36, 12.4, -62, 1.0);
  makePlume( 37, 14.6, -102, 0.85);
  makePlume(-35, 16.2, -142, 1.15);

  buildAfterparty();
  buildDigSite();
  buildQuests2();  // before the trees, so they keep off the new ground
  plantWorld();   // after the buildings, so their colliders keep trees out of walls
  flushDressing();  // the trees are planted now, so their dressing can be merged
  /* Scenery last, and each piece on its own. None of this is load bearing:
     if one of them fails the world is still a world, and the name of the
     one that failed ends up in the console instead of a blank field. */
  [['sea',makeSea],['pier',buildPier],['skyline',makeSkyline],['birds',makeBirds],
   ['drift',makeDrift],['clouds',makeClouds],['grade',gradeForPhase]
  ].forEach(d=>{ try{ d[1](); }catch(e){ console.warn('scenery failed:',d[0],e); } });

  // people walking the streets
  const paths=[
    [[-5,22],[-5,-150]], [[5,-140],[5,20]],
    [[-24,-6],[-235,-6]], [[-225,6],[-26,6]],
    [[26,-6],[292,-6]], [[284,6],[28,6]],
    [[-19,21],[19,21]], [[19,-15],[-19,-15]],
    [[-21,-17],[-21,19]], [[21,18],[21,-17]],
    [[-14,29],[-14,-19]], [[14,-19],[14,29]]
  ];
  CROWD.forEach((ck,i)=>{
    const pa=ck.path || paths[i%paths.length];
    const g2=makePerson(scene,{a:pa[0],b:pa[1],speed:1.2+((i*53)%7)*0.12,look:ck,phase:(i*0.83)%6});
    crowdList.push({p:g2,d:ck});
    if(ck.id==='fox'){
      addMarker(g2,3.1,()=> Q.explore===2 ? 2
                          : (Q.katana===2 && Q.explore===0 ? 0
                          : (Q.explore===1 ? 1 : 2)) );
      vsWalker=g2;
    }
    if(ck.id==='katana'){
      addMarker(g2,3.1,()=> Q.katana===2 ? 2 : (Q.katana===0 ? 0 : (hasItem('katana')?0:1)) );
      samuraiWalker=g2;
      // he left it at home, so he is unarmed until the quest is finished
      g2.traverse(o=>{ if(o.userData && o.userData.isKatana) samuraiBlade=o; });
      if(samuraiBlade) samuraiBlade.visible=false;
    }
  });

  scene.traverse(o=>{
    if(!o.isMesh || o.name==='sky') return;
    o.geometry.computeBoundingSphere();
    const r=o.geometry.boundingSphere ? o.geometry.boundingSphere.radius : 0;
    o.castShadow = r>0.85;
    o.receiveShadow = true;
  });

  makeTreasure();
  warmParty();                    // while the intro overlay still covers it
  buildAvatar();

  clock=new THREE.Clock();
  addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
  $('loading').style.display='none';
  animate();
}
