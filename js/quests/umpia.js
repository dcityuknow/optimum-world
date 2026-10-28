/* ------------------------------ UMPIA ------------------------------ */
function umCapDraw(){
  const c=umpiaCapCvs, g=c.getContext('2d'), W=c.width, H=c.height;
  g.fillStyle='#E4D1AB'; g.fillRect(0,0,W,H);
  const sh=g.createLinearGradient(0,0,W,0);
  sh.addColorStop(0,'rgba(90,70,40,.30)'); sh.addColorStop(.28,'rgba(90,70,40,0)');
  sh.addColorStop(.72,'rgba(90,70,40,0)'); sh.addColorStop(1,'rgba(90,70,40,.30)');
  g.fillStyle=sh; g.fillRect(0,0,W,H);
  g.textBaseline='alphabetic'; g.textAlign='left';
  g.font='700 132px Georgia, "Times New Roman", serif';
  const full=g.measureText('gmum').width, x0=W/2-full/2, y=H*0.60;
  g.fillStyle='#17130E';
  if(Q.cqL&64){
    g.fillText('gmu',x0,y);
    /* where the M was sewn on, the cloth is a shade paler */
    g.fillStyle='rgba(255,250,235,.35)'; g.fillText('m', x0+g.measureText('gmu').width, y);
  } else g.fillText('gmum',x0,y);
  if(umpiaCapTex) umpiaCapTex.needsUpdate=true;
}
function mkUmpiaCap(){
  const c=new THREE.Group();
  umpiaCapCvs=cvs(512,256); umCapDraw();
  umpiaCapTex=tex(umpiaCapCvs); umpiaCapTex.encoding=THREE.sRGBEncoding;
  const beige=new THREE.MeshLambertMaterial({color:0xE4D1AB});
  const R=0.43, SY=0.76;
  /* the front half carries the print. Its u runs from one side through the
     front to the other, so the middle of the canvas lands dead centre */
  const front=new THREE.Mesh(new THREE.SphereGeometry(R,28,12,0,Math.PI,0,Math.PI/2),
    new THREE.MeshLambertMaterial({map:umpiaCapTex}));
  const back=new THREE.Mesh(new THREE.SphereGeometry(R,28,12,Math.PI,Math.PI,0,Math.PI/2),beige);
  for(const m of [front,back]){ m.scale.set(1,SY,1); c.add(m); }
  const btn=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,6),beige); btn.position.y=R*SY; c.add(btn);
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.035,24,1,false,-Math.PI/2,Math.PI),beige);
  brim.scale.z=1.4; brim.position.set(0,-0.01,0.3); brim.rotation.x=0.10; c.add(brim);
  /* aviator goggles pushed up onto the cap, sitting just above the brim */
  const leather=new THREE.MeshLambertMaterial({color:0x5B4631});
  const lens=new THREE.MeshPhongMaterial({color:0x62747B, shininess:90, specular:0xDDE8EE});
  const strap=new THREE.Mesh(new THREE.TorusGeometry(R*1.01,0.028,6,32),leather);
  strap.rotation.x=Math.PI/2; strap.position.y=0.02; c.add(strap);
  for(const s of [-1,1]){
    const gg=new THREE.Group(); gg.position.set(s*0.13,0.085,0.405); gg.rotation.set(-0.38,s*0.3,0); c.add(gg);
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.07,16),leather);
    cup.rotation.x=Math.PI/2; cup.position.z=-0.02; gg.add(cup);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.093,0.024,8,18),leather); ring.position.z=0.018; gg.add(ring);
    const ln=new THREE.Mesh(new THREE.CircleGeometry(0.078,18),lens); ln.position.z=0.02; gg.add(ln);
  }
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.035,0.04),leather);
  bridge.position.set(0,0.09,0.43); c.add(bridge);
  c.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return c;
}
function armbandTex(){
  const c=cvs(256,128), g=c.getContext('2d');
  g.fillStyle='#D9C39A'; g.fillRect(0,0,256,128);
  g.fillStyle='rgba(90,60,30,.18)'; for(let i=0;i<40;i++) g.fillRect(Math.random()*256,Math.random()*128,3,2);
  g.fillStyle='#4A3420'; g.textAlign='center'; g.textBaseline='middle';
  g.font='800 58px ui-sans-serif, Helvetica, Arial'; g.fillText('UMPIA',128,68);
  const t=tex(c); t.encoding=THREE.sRGBEncoding; return t;
}
function buildUmpia(){
  const x=VAULT.x+3.4, z=VAULT.z+VAULT.d/2+1.9;
  const p=makePerson(scene,{look:SKINS.umpia, stand:1, a:[x,z], b:[x,z], baseYaw:0});
  umpiaNPC=p;
  umpiaCap=mkUmpiaCap(); umpiaCap.position.set(0,2.40,0); p.add(umpiaCap);
  /* the hoodie: a hood lying on his back, and the drawstring side of it */
  const hood=new THREE.MeshLambertMaterial({color:0x17191C});
  B(p,0.56,0.34,0.14,hood,0,1.9,-0.23,false,true);
  /* messy hair poking out under the cap */
  const hm=new THREE.MeshLambertMaterial({color:0x2B2320});
  [[-0.3,2.22,0.02,0.07,0.2,0.34],[0.3,2.22,0.02,0.07,0.2,0.34],[0,2.24,-0.27,0.5,0.22,0.06]]
    .forEach(q=>B(p,q[3],q[4],q[5],hm,q[0],q[1],q[2],false,false));
  const lim=p.userData.limbs;
  if(lim){
    const band=new THREE.MeshLambertMaterial({color:0xD9C39A});
    const face=new THREE.MeshLambertMaterial({map:armbandTex()});
    /* his left arm, the outside of it faces -X */
    const ab=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.2,0.28),[band,face,band,band,band,band]);
    ab.position.set(0,-0.26,0); lim.armL.add(ab);
  }
  /* ! once MiReTu has sent you, and again whenever there is something to hand over */
  addMarker(p,3.55,()=> Q.cq===0 ? (Q.leg>=6 ? 0 : 2) : (Q.cq===2||Q.cq===4) ? 0 : (Q.cq===3 ? 1 : 2));
  spots.push({x:x, z:z+1.1, r:3.5, prio:1, accent:C.peach, data:{name:'umpia'},
    label:()=> tr('talkTo')+' umpia', act:talkUmpia});
}
function talkUmpia(){
  openDialog(
    Q.cq===0 ? (Q.leg>=6 ? 'um_give' : 'um_zero') :
    Q.cq===1 ? 'um_coll' :
    Q.cq===2 ? 'um_hello' :
    Q.cq===3 ? 'um_waitph' :
    Q.cq===4 ? ((Q.cqL&64) ? 'um_code' : 'um_saw') :
    Q.cq===5 ? 'um_in' : 'um_done');
}
/* the M comes off his cap, the cap reads gmu, and the tile flies to you */
function umGiveM(){
  if(Q.cqL&64) return;
  Q.cqL|=64; saveQuests();
  umCapDraw();
  const g=mkLetter('M'); scene.add(g);
  const hp=umpiaNPC.getWorldPosition(new THREE.Vector3()); g.position.set(hp.x,hp.y+2.2,hp.z+0.4);
  setTimeout(()=>flyToCam(g),150);
  if(!playSfx('pickup',0.7,1.0)) blip(784,0.14,'sine',0.1);
  updateTracker();
}
/* a photo counts when umpia is in the frame and close enough to be him */
function cqPhotoCheck(c){
  if(Q.cq!==3 || !umpiaNPC) return;
  const hp=umpiaNPC.getWorldPosition(new THREE.Vector3()); hp.y+=1.55;
  if(hp.distanceTo(camera.position)>17) return;
  const v=hp.clone().project(camera);
  if(v.z>1 || Math.abs(v.x)>0.96 || Math.abs(v.y)>0.96) return;
  Q.cq=4; saveQuests();
  try{
    const w=480, h=Math.round(480*c.height/c.width), s=cvs(w,h);
    s.getContext('2d').drawImage(c,0,0,w,h);
    CQPHOTO=s.toDataURL('image/jpeg',0.82);
    store.set('optimum-world:cqphoto',CQPHOTO);
    setVaultPhoto();
  }catch(e){}
  setTimeout(()=>toast(tr('ptOkT'),tr('ptOkB')),500);
  updateTracker();
}
