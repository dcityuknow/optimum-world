/* ------------------------------ THE WARDROBE ------------------------------
   Whatever you are given to wear can be put on and taken off. Owning it comes
   from the quest; wearing it is a switch kept in Q.wo, one bit per item. */
const WEAR=[
  {bit:1, icon:'\uD83E\uDDE2', name:'wCap',  from:'baised', own:()=>Q.fish>=3},
  {bit:2, icon:'\uD83E\uDD7D', name:'wMask', from:'MiReTu', own:()=>Q.leg>=6}
];
function wearing(it){ return it.own() && !(Q.wo&it.bit); }
function applyWear(){
  if(!avatar) return;
  const U=avatar.userData;
  if(wearing(WEAR[0])) wearCap();
  else if(U.cap){ avatar.remove(U.cap); U.cap=null; }
  if(wearing(WEAR[1])){ wearMask(); if(U.mask) U.mask.position.y = U.cap ? 2.33 : 2.41; }
  else if(U.mask){ avatar.remove(U.mask); U.mask=null; }
}
let WARD_OPEN=false;
function openWardrobe(){
  WARD_OPEN=true; keys={}; running=false; freeCursor();
  $('wardT').textContent=tr('wTitle'); $('wardX').textContent=tr('close');
  drawWardrobe();
  $('wardP').style.display='flex';
}
function closeWardrobe(){
  WARD_OPEN=false; $('wardP').style.display='none';
  if(!isTouch && !photoMode && renderer && !uiOpen()) renderer.domElement.requestPointerLock();
}
function drawWardrobe(){
  const box=$('wardL'); box.innerHTML='';
  const own=WEAR.filter(it=>it.own());
  if(!own.length){ const p=document.createElement('p'); p.className='wEmpty'; p.textContent=tr('wEmpty'); box.appendChild(p); return; }
  own.forEach(it=>{
    const on=wearing(it);
    const row=document.createElement('div'); row.className='wRow'+(on?' on':'');
    row.innerHTML='<span class="wIco"></span><span class="wTx"><b></b><small></small></span><button></button>';
    row.querySelector('.wIco').textContent=it.icon;
    row.querySelector('b').textContent=tr(it.name);
    row.querySelector('small').textContent=tr('wFrom')+' '+it.from;
    const b=row.querySelector('button');
    b.textContent=on? tr('wOff') : tr('wOn');
    b.addEventListener('click',()=>{
      Q.wo^=it.bit; saveQuests(); applyWear();
      if(!playSfx('ui',0.5,1.05)) blip(620,0.05,'sine',0.05);
      drawWardrobe();
    });
    box.appendChild(row);
  });
  if(!photoMode){ const p=document.createElement('p'); p.className='wHint'; p.textContent=tr('wHint'); box.appendChild(p); }
}
function buildMiretu(){
  const root=new THREE.Group(); root.position.set(BEACH.x,0,BEACH.z); root.rotation.y=BEACH.yaw; scene.add(root);
  /* ---- the lounger, full size; its foot end points at the plaza ---- */
  const frame=new THREE.MeshLambertMaterial({color:0xF2EFEA});
  const cloth=new THREE.MeshLambertMaterial({color:0x51B1FE});
  B(root,0.08,0.06,2.1,frame,-0.4,0.4,0,false,false);
  B(root,0.08,0.06,2.1,frame, 0.4,0.4,0,false,false);
  [[-0.4,-0.95],[0.4,-0.95],[-0.4,0.95],[0.4,0.95]].forEach(q=>Cyl(root,0.04,0.04,0.4,6,frame,q[0],0.2,q[1],false));
  B(root,0.76,0.05,1.35,cloth,0,0.44,-0.33,false,true);
  const back=new THREE.Group(); back.position.set(0,0.44,0.34); back.rotation.x=-0.95; root.add(back);
  B(back,0.76,0.05,0.9,cloth,0,0,0.45,false,true);
  colliders.push(worldAABB(root,1.0,2.3,0,0));
  /* the umbrella */
  const pole=new THREE.MeshLambertMaterial({color:0xEDE7DC});
  Cyl(root,0.035,0.035,2.7,8,pole,-1.0,1.35,0.7,false);
  const can=new THREE.Mesh(new THREE.ConeGeometry(1.7,0.6,12,1,true),
    new THREE.MeshLambertMaterial({color:0xB87CFF, side:THREE.DoubleSide}));
  can.position.set(-1.0,2.6,0.7); root.add(can);
  const fin=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6),pole); fin.position.set(-1.0,2.93,0.7); root.add(fin);
  /* a cold drink in the sand, because it is a holiday */
  Cyl(root,0.07,0.07,0.24,10,new THREE.MeshLambertMaterial({color:0x64E27F}),0.72,0.12,-0.7,false);

  /* ---- the skeleton, at person scale ---- */
  const bone=new THREE.MeshLambertMaterial({color:0xEDEFF2});
  const jacket=new THREE.MeshLambertMaterial({color:0x29314C});
  const shorts=new THREE.MeshLambertMaterial({color:0x1F2438});
  const neonG=new THREE.MeshBasicMaterial({color:0xA8FF52, toneMapped:false});
  const neonB=new THREE.MeshBasicMaterial({color:0x54C6FF, toneMapped:false});
  const sk=new THREE.Group(); sk.scale.setScalar(0.78); root.add(sk);
  contact(sk,0,0,0.95,0.045);
  const hips=new THREE.Group(); sk.add(hips);
  B(hips,0.62,0.3,0.36,shorts,0,0.04,0,false,true);
  const upper=new THREE.Group(); hips.add(upper);
  const torso=B(upper,0.62,0.84,0.36,jacket,0,0.46,0,false,true); torso.castShadow=true;
  B(upper,0.54,0.12,0.4,neonG,0,0.9,0,false,false);                        // the lit collar
  B(upper,0.03,0.8,0.02,new THREE.MeshLambertMaterial({color:0x14171F}),0,0.46,0.19,false,false);
  for(const s of [-1,1]) B(upper,0.03,0.76,0.02,neonG,s*0.06,0.46,0.19,false,false);
  Cyl(upper,0.07,0.08,0.2,8,bone,0,0.98,0,false);                          // neck
  const head=new THREE.Group(); head.position.set(0,1.19,0); upper.add(head);
  const hb=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.56,0.52),
    [bone,bone,bone,bone,new THREE.MeshLambertMaterial({map:faceTex(SKINS.miretu)}),bone]);
  /* the face carries the mark on its mask too; redraw it once the icon is in */
  whenIcon('#1E2025',()=>{ const fm=hb.material[4]; fm.map=faceTex(SKINS.miretu); fm.needsUpdate=true; delete PORTRAIT['miretu']; });
  hb.castShadow=true; head.add(hb); outline(head,hb);
  const mask=mkMask(0.56,0.52); mask.position.y=0.21; head.add(mask);
  /* the cigarette, out of the corner of the grin */
  const cig=new THREE.Group(); cig.position.set(0.15,-0.15,0.27); cig.rotation.set(0.15,0.55,0); head.add(cig);
  const cp=Cyl(cig,0.018,0.018,0.2,6,new THREE.MeshLambertMaterial({color:0xF4F1EA}),0,0,0.1,false); cp.rotation.x=Math.PI/2;
  const ctip=Cyl(cig,0.02,0.02,0.03,6,new THREE.MeshBasicMaterial({color:0xFF7A2A,toneMapped:false}),0,0,0.21,false);
  ctip.rotation.x=Math.PI/2;
  const tip=new THREE.Object3D(); tip.position.set(0,0.02,0.23); cig.add(tip);
  const smoke=[];
  for(let i=0;i<5;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTexture(),color:0xC9CDD2,transparent:true,depthWrite:false,opacity:0}));
    scene.add(s); smoke.push({s:s, off:i/5});
  }
  /* arms: the jacket sleeves with the blue light down the outside, bone hands */
  const mkArm=(side)=>{
    const a=new THREE.Group(); a.position.set(side*0.42,0.88,0); upper.add(a);
    B(a,0.2,0.62,0.24,jacket,0,-0.31,0,false,true);
    B(a,0.025,0.58,0.09,neonB,side*0.105,-0.31,0,false,false);
    B(a,0.12,0.22,0.13,bone,0,-0.74,0,false,false);
    return a;
  };
  const armL=mkArm(-1), armR=mkArm(1);
  /* legs: femur, knee, shin, foot. The left one is the one Ping took. */
  const mkLeg=(side)=>{
    const l=new THREE.Group(); l.position.set(side*0.17,-0.06,0); hips.add(l);
    Cyl(l,0.075,0.08,0.42,8,bone,0,-0.23,0,false);
    const kn=new THREE.Mesh(new THREE.SphereGeometry(0.095,10,8),bone); kn.position.y=-0.46; l.add(kn);
    const sh=new THREE.Group(); sh.position.y=-0.46; l.add(sh);
    Cyl(sh,0.065,0.07,0.42,8,bone,0,-0.22,0,false);
    B(sh,0.19,0.1,0.34,bone,0,-0.47,0.1,false,false);                     // the foot
    for(let k=-1;k<=1;k++) B(sh,0.045,0.06,0.09,bone,k*0.06,-0.49,0.3,false,false);  // toes
    return {l:l, sh:sh};
  };
  const LL=mkLeg(-1), LR=mkLeg(1);
  miretu={root, sk, hips, upper, head, armL, armR, legL:LL.l, shinL:LL.sh, legR:LR.l, shinR:LR.sh,
          tip, smoke, state:'lie', t0:0, u:0, dir:1, pause:0};
  poseLie(1);
  LL.l.visible = Q.leg>=6;
  addMarker(sk,3.35,()=> Q.leg===0 ? (Q.fish>=3 ? 0 : 2) : [0,1,0,1,1,0,2][Math.min(6,Q.leg)]);
  miretu.spot={x:BEACH.x, z:BEACH.z-1.8, r:3.4, prio:1, accent:C.mint, data:{name:'MiReTu'},
    label:()=> tr('talkTo')+' MiReTu', act:talkMiretu};
  spots.push(miretu.spot);
  QZONES.push({x1:BEACH.x-4,x2:BEACH.x+4,z1:BEACH.z-4,z2:BEACH.z+4});
  anims.push(miretuTick);
}
/* lying back on the lounger: hips on the seat, legs out along it, one hand
   behind the head. He faces local +Z and the lounger foot is at -Z, so the
   skeleton is turned round. */
function poseLie(k){
  const m=miretu;
  m.sk.rotation.y=Math.PI; m.sk.position.set(0,0,0.1);
  m.hips.position.y=0.62;
  m.upper.rotation.x=-0.66*k;
  m.legL.rotation.x=m.legR.rotation.x=-Math.PI/2*k;
  m.shinL.rotation.x=m.shinR.rotation.x=0.12*k;
  m.armR.rotation.set(2.55*k,0,-0.25*k);
  m.armL.rotation.set(-0.35*k,0,0.35*k);
}
/* hip height that puts the soles on the sand, not in it */
const STAND_Y=1.07;
function poseStand(){
  const m=miretu;
  m.hips.position.y=STAND_Y; m.upper.rotation.x=0;
  m.legL.rotation.x=m.legR.rotation.x=0; m.shinL.rotation.x=m.shinR.rotation.x=0;
  m.armR.rotation.set(0,0,0); m.armL.rotation.set(0,0,0);
}
function miretuStand(instant){
  const m=miretu; if(!m) return;
  m.legL.visible=true;
  if(instant){ poseStand(); m.state='walk'; m.sk.position.set(-1.6,0,-2.4); return; }
  m.state='rise'; m.t0=performance.now();
}
function talkMiretu(){
  if(Q.leg===5 && !hasItem('leg')) giveItem('leg');
  /* he is baised's friend: until baised has sent you, he is just sunbathing */
  if(Q.leg===0 && Q.fish<3){ openDialog('mi_later'); return; }
  if(Q.leg>=6){ openDialog(Q.cq===0 ? 'mi_um' : 'mi_done'); return; }
  openDialog(['mi_hello','mi_wait','mi_rib','mi_waitrib','mi_waitdig','mi_leg'][Q.leg]);
}
const MI_V=new THREE.Vector3();
function wrapA(a){ while(a>Math.PI) a-=Math.PI*2; while(a<-Math.PI) a+=Math.PI*2; return a; }
function miretuTick(t,dt){
  const m=miretu; if(!m) return;
  const near=Math.hypot(player.x-BEACH.x, player.z-BEACH.z)<70;
  /* the smoke rides up off the tip and thins out */
  m.tip.getWorldPosition(MI_V);
  for(let i=0;i<m.smoke.length;i++){
    const p=m.smoke[i], k=((t*0.32)+p.off)%1;
    p.s.visible=near;
    if(!near) continue;
    p.s.position.set(MI_V.x+Math.sin(k*3+p.off*9)*0.12*k, MI_V.y+k*1.1, MI_V.z+Math.cos(k*2.3)*0.08*k);
    p.s.scale.setScalar(0.12+k*0.55);
    p.s.material.opacity=Math.min(1,k*6)*(1-k)*0.5;
  }
  if(m.state==='lie'){
    m.upper.rotation.x=-0.66+Math.sin(t*1.2)*0.012;
    /* he follows you with his head while you are close */
    const d=Math.hypot(player.x-BEACH.x, player.z-BEACH.z);
    const want = d<10 ? Math.max(-0.75,Math.min(0.75, wrapA(Math.atan2(player.x-BEACH.x, player.z-BEACH.z)-(BEACH.yaw+Math.PI)))) : 0;
    m.head.rotation.y+= (want-m.head.rotation.y)*Math.min(1,dt*3);
    m.armR.rotation.x=2.55+Math.sin(t*0.9)*0.03;
  } else if(m.state==='rise'){
    const k=Math.min(1,(performance.now()-m.t0)/1300);
    const e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    poseLie(1-e);
    m.hips.position.y=0.62+(STAND_Y-0.62)*e;
    m.sk.position.z=0.1-e*2.5; m.sk.position.x=-e*1.6;
    m.sk.rotation.y=Math.PI;
    if(k>=1){ poseStand(); m.state='dance'; m.t0=performance.now(); }
  } else if(m.state==='dance'){
    const e=(performance.now()-m.t0)/1000;
    m.sk.position.y=Math.abs(Math.sin(e*9))*0.18;
    m.armL.rotation.set(-2.6+Math.sin(e*9)*0.3,0,0.2); m.armR.rotation.set(-2.6-Math.sin(e*9)*0.3,0,-0.2);
    m.legL.rotation.x=Math.sin(e*9)*0.5; m.legR.rotation.x=-Math.sin(e*9)*0.5;
    m.sk.rotation.y=Math.PI+Math.sin(e*4.5)*0.6;
    if(e>2.6){ poseStand(); m.sk.position.y=0; m.state='walk'; m.u=0; m.dir=1; }
  } else if(m.state==='walk'){
    /* a proud walk along the sand in front of the lounger, and back */
    const A=-1.6, Bx=9.5, z=-2.4;
    const wx=BEACH.x+m.sk.position.x, wz=BEACH.z+m.sk.position.z;
    const greet=Math.hypot(player.x-wx, player.z-wz)<4.4 && !photoMode;
    let moving=false;
    if(greet){
      const want=wrapA(Math.atan2(player.x-wx, player.z-wz)-BEACH.yaw);
      m.sk.rotation.y+=wrapA(want-m.sk.rotation.y)*Math.min(1,dt*5);
    } else if(m.pause>0){ m.pause-=dt; }
    else {
      m.sk.position.x+=m.dir*dt*1.5; moving=true;
      if(m.sk.position.x>Bx){ m.sk.position.x=Bx; m.dir=-1; m.pause=3; }
      if(m.sk.position.x<A){ m.sk.position.x=A; m.dir=1; m.pause=5; }
      m.sk.position.z+=(z-m.sk.position.z)*Math.min(1,dt*2);
      const want=m.dir>0?Math.PI/2:-Math.PI/2;
      m.sk.rotation.y+=wrapA(want-m.sk.rotation.y)*Math.min(1,dt*6);
    }
    const sw=moving?Math.sin(t*6.5)*0.55:0;
    m.legL.rotation.x=sw; m.legR.rotation.x=-sw;
    m.armL.rotation.x=-sw*0.8; m.armR.rotation.x=sw*0.8;
    m.sk.position.y=moving?Math.abs(Math.sin(t*6.5))*0.05:0;
  }
  /* the talk spot follows him */
  const wp=m.sk.getWorldPosition(MI_V);
  m.spot.x=wp.x; m.spot.z=wp.z + (m.state==='lie' ? -1.6 : 0);
}
