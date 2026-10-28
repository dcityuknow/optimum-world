/* ------------------------------ THE SAND ------------------------------ */
function mkBoot(g){
  const m=new THREE.MeshLambertMaterial({color:0x5A3D26});
  B(g,0.2,0.34,0.16,m,0,0.17,0,false,false); B(g,0.2,0.12,0.36,m,0,0.06,0.12,false,false);
  g.rotation.z=1.4;
}
function mkDrumstick(g){
  const meat=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8),new THREE.MeshLambertMaterial({color:0xB8672E}));
  meat.scale.set(1,1,1.45); g.add(meat);
  const b=new THREE.MeshLambertMaterial({color:0xF1ECE2});
  const sh=Cyl(g,0.028,0.028,0.22,6,b,0,0,0.26,false); sh.rotation.x=Math.PI/2;
  const k=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6),b); k.position.z=0.38; g.add(k);
}
function mkWallet(g){
  B(g,0.22,0.05,0.13,new THREE.MeshLambertMaterial({color:0x2B2F36}),0,0.03,0,false,false);
  B(g,0.1,0.01,0.07,new THREE.MeshBasicMaterial({color:0x2B6FC4,toneMapped:false}),-0.03,0.058,0,false,false);
  B(g,0.12,0.005,0.09,new THREE.MeshLambertMaterial({color:0xF4F1E6}),0.05,0.058,0.01,false,false);
}
function buildSand(){
  const sand=new THREE.MeshLambertMaterial({color:0xC3A979});
  const hole=new THREE.MeshLambertMaterial({color:0x8A7555});
  MOUNDS.forEach((q,i)=>{
    const g=new THREE.Group(); g.position.set(q.x,0,q.z); scene.add(g);
    const mound=new THREE.Mesh(new THREE.SphereGeometry(1,14,8),sand); mound.scale.set(1.0,0.46,0.85); g.add(mound);
    /* clods thrown about by the digging, so the mound reads from a distance */
    for(let k=0;k<7;k++){ const a=k*0.9+i, r=1.1+(k%3)*0.35;
      const cl=new THREE.Mesh(new THREE.SphereGeometry(0.12+(k%2)*0.06,6,5),sand);
      cl.scale.y=0.55; cl.position.set(Math.cos(a)*r,0.05,Math.sin(a)*r*0.9); g.add(cl); }
    const h=new THREE.Mesh(new THREE.CircleGeometry(0.75,16),hole); h.rotation.x=-Math.PI/2; h.position.y=0.04; h.visible=false; g.add(h);
    const pile=new THREE.Mesh(new THREE.SphereGeometry(0.6,10,6),sand); pile.scale.set(1,0.3,0.7); pile.position.set(1.1,0,0.3); pile.visible=false; g.add(pile);
    const obj=new THREE.Group(); obj.position.set(0.9,0.12,-0.7); obj.visible=false; g.add(obj);
    ({boot:mkBoot, chick:mkDrumstick, wallet:mkWallet})[q.k](obj);
    const M={g:g, mound:mound, hole:h, pile:pile, obj:obj, bit:i};
    moundObjs.push(M);
    moundShow(M);
    QZONES.push({x1:q.x-3,x2:q.x+3,z1:q.z-3,z2:q.z+3});
    spots.push({x:q.x, z:q.z, r:2.8, prio:1, accent:C.peach, data:{name:'mound'},
      when:()=> Q.leg>=1 && !(Q.legM&(1<<i)),
      label:()=> (HELD==='shovel'||hasItem('shovel')) ? tr('moundDig') : tr('digNeed'),
      act:()=> digMound(i)});
  });
  /* where the leg really is: a patch of turned sand once Ping has been at it */
  legSpotG=new THREE.Group(); legSpotG.position.set(LEG_AT.x,0,LEG_AT.z); scene.add(legSpotG);
  legPatch=new THREE.Mesh(new THREE.CircleGeometry(0.8,16),new THREE.MeshLambertMaterial({color:0xC2B08E}));
  legPatch.rotation.x=-Math.PI/2; legPatch.position.y=0.035; legPatch.visible=Q.leg>=4; legSpotG.add(legPatch);
  legHole=new THREE.Mesh(new THREE.CircleGeometry(0.62,16),hole);
  legHole.rotation.x=-Math.PI/2; legHole.position.y=0.045; legHole.visible=Q.leg>=5; legSpotG.add(legHole);
  addMarker(legSpotG,1.5,()=> Q.leg===4 ? 0 : 2);
  spots.push({x:LEG_AT.x, z:LEG_AT.z-0.4, r:2.9, prio:1, accent:C.peach, data:{name:'leg'},
    when:()=> Q.leg===4 && dog && dog.state==='wait',
    label:()=> (HELD==='shovel'||hasItem('shovel')) ? tr('legSpot') : tr('digNeed'),
    act:()=> digLeg()});
}
function moundShow(M){
  const dug=!!(Q.legM&(1<<M.bit));
  M.mound.visible=!dug; M.hole.visible=dug; M.pile.visible=dug; M.obj.visible=dug;
}
function needShovel(){
  if(HELD==='shovel') return true;
  if(hasItem('shovel')){ equip('shovel'); return true; }
  toast(tr('digNeed')); return false;
}
function sandDig(x,z,done){
  if(digBusy || digging || CINE) return;
  if(!needShovel()) return;
  digBusy=true;
  if(playSfx('dig1',0.85,0.98,0)){ playSfx('dig2',0.75,1.04,0.55); playSfx('dig1',0.8,0.92,1.1); }
  else blip(196,0.18,'sine',0.09);
  const mat=new THREE.MeshLambertMaterial({color:0xD9CCB0}), parts=[];
  for(let i=0;i<14;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.06+Math.random()*0.07,5,4),mat);
    m.position.set(x,0.2,z); m.visible=false; scene.add(m);
    m.userData.v=[(Math.random()-0.5)*3.2,2.4+Math.random()*2.2,(Math.random()-0.5)*3.2]; parts.push(m);
  }
  const t0=performance.now(); let thrown=false, last=t0;
  const V=ITEMS.shovel.view, R0=(ITEMS.shovel.vrot||[0.2])[0];
  const step=()=>{
    const now=performance.now(), e=(now-t0)/1000, dt=Math.min(0.05,(now-last)/1000); last=now;
    const strike=Math.sin(e*7.0);
    if(viewItem && HELD==='shovel'){ viewItem.rotation.x=R0+strike*0.85; viewItem.position.y=V[1]-strike*0.12; }
    if(handItem) handItem.rotation.x=strike*0.7;
    if(e>0.5 && !thrown){ thrown=true; parts.forEach(m=>m.visible=true); }
    if(thrown) parts.forEach(m=>{ const v=m.userData.v; v[1]-=9.5*dt;
      m.position.x+=v[0]*dt; m.position.y+=v[1]*dt; m.position.z+=v[2]*dt;
      if(m.position.y<0.05){ m.position.y=0.05; v[0]*=0.4; v[2]*=0.4; v[1]=0; } });
    if(e<1.7){ requestAnimationFrame(step); return; }
    if(viewItem && HELD==='shovel'){ viewItem.rotation.x=R0; viewItem.position.y=V[1]; }
    if(handItem) handItem.rotation.x=0;
    setTimeout(()=>parts.forEach(m=>{ scene.remove(m); m.geometry.dispose(); }),5000);
    digBusy=false; done();
  };
  step();
}
const MOUND_TXT=[['mdBootT','mdBootB'],['mdChickT','mdChickB'],['mdWalletT','mdWalletB']];
function digMound(i){
  if(Q.legM&(1<<i)) return;
  const q=MOUNDS[i];
  sandDig(q.x,q.z,()=>{
    Q.legM|=(1<<i); saveQuests();
    moundShow(moundObjs[i]);
    const tx=MOUND_TXT[i];
    if((Q.legM&7)===7 && Q.leg===1){
      Q.leg=2; saveQuests();
      toast(tr(tx[0]),tr(tx[1]));
      setTimeout(()=>doneModal(tr('moundsAllT'),tr('moundsAllB')),2600);
    } else toast(tr(tx[0]),tr(tx[1]));
    blip(330,0.12,'sine',0.06);
    updateTracker();
  });
}
function mkLegItem(g){
  const b=new THREE.MeshLambertMaterial({color:0xEDEFF2});
  Cyl(g,0.055,0.06,0.42,8,b,0,0.25,0,false);
  const k=new THREE.Mesh(new THREE.SphereGeometry(0.075,10,8),b); k.position.y=0.02; g.add(k);
  Cyl(g,0.045,0.05,0.42,8,b,0,-0.2,0,false);
  B(g,0.13,0.07,0.26,b,0,-0.44,0.07,false,false);
  const hp=new THREE.Mesh(new THREE.SphereGeometry(0.08,10,8),b); hp.position.y=0.48; g.add(hp);
  return g;
}
function mkRibItem(g){
  const b=new THREE.MeshLambertMaterial({color:0xEDEFF2});
  const r=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.035,6,18,Math.PI*0.75),b); r.rotation.z=0.4; g.add(r);
  return g;
}
function digLeg(){
  if(Q.leg!==4) return;
  sandDig(LEG_AT.x,LEG_AT.z,()=>{
    legHole.visible=true;
    const g=new THREE.Group(); mkLegItem(g); g.position.set(LEG_AT.x,-0.5,LEG_AT.z); scene.add(g);
    legRise=g;
    if(cueOK() && !playSfx('found',0.85)) blip(523,0.2,'sine',0.13);
    const t1=performance.now();
    const rise=()=>{
      const k=(performance.now()-t1)/1000;
      g.position.y=-0.5+Math.min(1,k/1.1)*2.0+Math.sin(k*1.5)*0.08;
      g.rotation.y+=0.03; g.rotation.z=Math.sin(k*0.9)*0.2;
      if(k<5.5 && g.parent) requestAnimationFrame(rise);
    };
    rise();
    const x=LEG_AT.x, z=LEG_AT.z, mx=BEACH.x, mz=BEACH.z;
    playCine([
      {p:[x-2.4,1.3,z-2.8], l:[x,0.9,z], f:54},
      {p:[x-1.2,1.7,z-3.6], l:[x+0.5,1.1,z+0.2], f:48},
      {p:[x+1.6,1.9,z-3.4], l:[mx,1.0,mz], f:42}
    ], 4.6, ()=>{
      if(legRise){ scene.remove(legRise); legRise=null; }
      Q.leg=5; saveQuests();
      if(giveItem('leg')) equip('leg');
      updateTracker();
      doneModal(tr('legFoundT'),tr('legFoundB'));
    });
  });
}
