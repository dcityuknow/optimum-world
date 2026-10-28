/* ------------------------------ THE VAULT ------------------------------
   A plain dark block behind the houses. Nothing says what it is. */
function neonTex(txt){
  const c=cvs(1024,256), g=c.getContext('2d');
  g.textAlign='center'; g.textBaseline='middle';
  let fs=112; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial';
  while(g.measureText(txt).width>930 && fs>40){ fs-=6; g.font='800 '+fs+'px ui-sans-serif, Helvetica, Arial'; }
  g.shadowColor='#6BF0A0'; g.shadowBlur=36; g.fillStyle='#C9FFE0';
  g.fillText(txt,512,132); g.shadowBlur=14; g.fillText(txt,512,132);
  g.shadowBlur=0; g.fillStyle='#F4FFF8'; g.fillText(txt,512,132);
  const t=tex(c); t.encoding=THREE.sRGBEncoding; return t;
}
function buildVault(){
  const g=new THREE.Group(); g.position.set(VAULT.x,0,VAULT.z); scene.add(g); vaultG=g;
  const W=VAULT.w, Dp=VAULT.d, H=VAULT.h, t=0.5, DW=2.6, DH=3.0;
  /* a root cellar: stone walls, and a grassy mound heaped over all of it but the front */
  const wallM=new THREE.MeshLambertMaterial({color:0x8A847B});
  const inM=new THREE.MeshLambertMaterial({color:0x5C564F});
  const topM=new THREE.MeshLambertMaterial({color:0x6C665E});
  B(g,W,0.14,Dp,new THREE.MeshLambertMaterial({color:0x3A3530}),0,0.07,0,false,false);
  const hill=new THREE.Mesh(new THREE.SphereGeometry(8.5,30,12,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshLambertMaterial({color:(SEASONS[SEASON]&&SEASONS[SEASON].grass)||0x9DB07A}));
  hill.scale.set(1,0.9,0.88); hill.position.set(0,-0.05,-3); g.add(hill);
  colliders.push(worldAABB(g,16.4,12.6,0,-4.1));
  /* a stone lintel over the door */
  B(g,3.6,0.45,0.7,topM,0,DH+0.25,Dp/2+0.05,false,true);
  B(g,W+0.7,0.46,Dp+0.7,topM,0,H+0.23,0,false,true);
  B(g,W-0.2,0.12,Dp-0.2,inM,0,H-0.06,0,false,false);
  B(g,W,H,t,wallM,0,H/2,-(Dp/2-t/2),true,true);
  B(g,t,H,Dp,wallM,-(W/2-t/2),H/2,0,true,true);
  B(g,t,H,Dp,wallM,(W/2-t/2),H/2,0,true,true);
  const seg=(W-DW)/2;
  B(g,seg,H,t,wallM,-(DW/2+seg/2),H/2,Dp/2-t/2,true,true);
  B(g,seg,H,t,wallM,(DW/2+seg/2),H/2,Dp/2-t/2,true,true);
  B(g,DW,H-DH,t,wallM,0,DH+(H-DH)/2,Dp/2-t/2,false,true);
  /* the inside faces, a shade darker so the neon carries the room */
  B(g,W-1.0,H-0.2,0.05,inM,0,H/2,-(Dp/2-t)+0.03,false,false);
  /* the door: one heavy slab that slides into the wall on its right */
  const doorM=new THREE.MeshLambertMaterial({color:0x59606C});
  vaultDoor=new THREE.Group(); vaultDoor.position.set(0,0,Dp/2+0.05); g.add(vaultDoor);
  B(vaultDoor,DW+0.1,DH,0.2,doorM,0,DH/2,0,false,true);
  /* a small brass plate with the mark on it, the only hint */
  const plate=new THREE.Mesh(new THREE.CircleGeometry(0.26,24),
    new THREE.MeshLambertMaterial({color:0xC9A45C, emissive:0x2A1E08}));
  plate.position.set(0,1.85,0.11); vaultDoor.add(plate);
  const markM=new THREE.MeshBasicMaterial({transparent:true, depthWrite:false, color:0xFFFFFF});
  const mark=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.34*336/616),markM);
  mark.position.set(0,1.85,0.115); mark.visible=false; vaultDoor.add(mark);
  whenIcon('#3B2A10',ic=>{ const t=tex(ic); t.encoding=THREE.sRGBEncoding; markM.map=t; markM.needsUpdate=true; mark.visible=true; });
  vaultDoorCol=worldAABB(g,DW,0.7,0,Dp/2); colliders.push(vaultDoorCol);
  /* a lamp over the door so the doorkeeper is not standing in the dark */
  const lampM=new THREE.MeshBasicMaterial({color:DARK?0xFFE2B0:0xEDE6D8, toneMapped:false});
  B(g,0.9,0.12,0.3,lampM,0,DH+0.62,Dp/2+0.45,false,false);
  if(DARK){
    const pool=new THREE.Mesh(new THREE.CircleGeometry(3.4,20),
      new THREE.MeshBasicMaterial({color:0xFFD9A0, transparent:true, opacity:0.16, depthWrite:false}));
    pool.rotation.x=-Math.PI/2; pool.position.set(0,0.05,Dp/2+2.2); g.add(pool);
  }

  /* ---- inside ---- */
  /* your name in lights on the back wall */
  vaultNeon=new THREE.Mesh(new THREE.PlaneGeometry(6.4,1.6),
    new THREE.MeshBasicMaterial({map:neonTex(((profile.nick||'').trim()||'Anonymous')), transparent:true,
      depthWrite:false, toneMapped:false}));
  vaultNeon.position.set(0,2.75,-(Dp/2-t)+0.08); g.add(vaultNeon);
  /* the photo you took of umpia, framed, on the left wall */
  const fr=new THREE.Group(); fr.position.set(-(W/2-t)+0.08,2.1,0.2); fr.rotation.y=Math.PI/2; g.add(fr);
  B(fr,2.5,1.7,0.08,new THREE.MeshLambertMaterial({color:0xC9A45C}),0,0,0,false,false);
  vaultPhoto=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.3),new THREE.MeshBasicMaterial({color:0x333840}));
  vaultPhoto.position.z=0.05; fr.add(vaultPhoto);
  setVaultPhoto();
  /* the pedestal with your card floating over it */
  const ped=new THREE.MeshLambertMaterial({color:0x1D2025});
  B(g,0.7,1.0,0.7,ped,0,0.5,-0.6,true,true);
  B(g,0.86,0.07,0.86,new THREE.MeshLambertMaterial({color:0xC9A45C}),0,1.03,-0.6,false,false);
  const card=new THREE.Group(); card.position.set(0,1.75,-0.6); g.add(card);
  vaultCardM=new THREE.MeshBasicMaterial({color:0xFFFFFF, side:THREE.DoubleSide, toneMapped:false});
  card.add(new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.675),vaultCardM));
  /* the plant. He did say. */
  const pot=new THREE.MeshLambertMaterial({color:0xC9A45C}), leaf=new THREE.MeshLambertMaterial({color:0x4E9A5A});
  Cyl(g,0.34,0.26,0.6,12,pot,W/2-1.2,0.3,-Dp/2+1.2,true);
  [[0,1.0,0,0.42],[0.2,1.3,0.1,0.3],[-0.18,1.25,-0.1,0.28],[0.05,1.55,-0.05,0.22]].forEach(q=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(q[3],10,8),leaf);
    m.position.set(W/2-1.2+q[0],q[1],-Dp/2+1.2+q[2]); g.add(m);
  });
  anims.push((tt)=>{
    if(!vaultG || !card.visible) return;
    card.rotation.y=Math.sin(tt*0.7)*0.5; card.position.y=1.75+Math.sin(tt*1.4)*0.05;
  });
  const rm=worldAABB(g,W,Dp,0,0);
  rooms.push({x1:rm.x1,x2:rm.x2,z1:rm.z1,z2:rm.z2,lx:rm.x,lz:rm.z,ly:H*0.72});
  /* a step past the door frame counts as in */
  VAULT_IN={x1:rm.x1+0.6,x2:rm.x2-0.6,z1:rm.z1+0.6,z2:rm.z2-1.2};
  /* what you can walk up to inside */
  const cw=worldAABB(g,1,1,0,-0.6);
  spots.push({x:cw.x, z:cw.z+1.0, r:2.6, prio:1, accent:C.mint, data:{name:'card'},
    when:()=> Q.cq>=6,
    label:()=> tr('vaultCardAgain'),
    act:()=> cqFinish()});
  const pw=worldAABB(g,1,1,W/2-1.2,-Dp/2+1.2);
  spots.push({x:pw.x, z:pw.z, r:2.2, prio:1, accent:C.mint, data:{name:'plant'},
    when:()=> Q.cq>=5, label:()=> tr('plantTouch'),
    act:()=>{ toast(tr('plantNo')); blip(220,0.1,'square',0.04); }});
  /* keep the woodland off the vault and off the way to it through the gap */
  QZONES.push({x1:VAULT.x-W/2-7, x2:VAULT.x+W/2+7, z1:VAULT.z-Dp/2-7, z2:-38});
}
function setVaultPhoto(){
  if(!vaultPhoto) return;
  const src=CQPHOTO || portraitURL(SKINS.umpia);
  const t=photoTex(src);
  vaultPhoto.material.dispose();
  vaultPhoto.material=new THREE.MeshBasicMaterial({map:t, toneMapped:false});
}
function openVault(instant){
  if(!vaultDoor) return;
  const i=colliders.indexOf(vaultDoorCol); if(i>=0) colliders.splice(i,1);
  if(vaultNeon){ vaultNeon.material.map=neonTex(((profile.nick||'').trim()||'Anonymous')); vaultNeon.material.needsUpdate=true; }
  refreshCardPreview();
  if(instant){ vaultDoor.position.x=2.8; return; }
  playSfx('door',0.6,0.8);
  const t0=performance.now();
  const step=()=>{
    const k=Math.min(1,(performance.now()-t0)/1400), e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    vaultDoor.position.x=e*2.8;
    if(k<1) requestAnimationFrame(step);
  };
  step();
}
