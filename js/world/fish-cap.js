/* ------------------------------ THE FISH CAP ------------------------------
   A trucker cap with a bass rammed through it: head out of the front left,
   tail out of the back right. Built with its origin at the top centre of a
   0.64 head, so it drops onto the player as is and onto baised scaled down.
   The crown is two half domes, a white foam front and an olive mesh back,
   because that split is what makes it read as a trucker cap at a distance. */
function mkFishCap(){
  const c=new THREE.Group();
  const white=new THREE.MeshLambertMaterial({color:0xF3F1EA});
  const olive=new THREE.MeshLambertMaterial({color:0x6A6B3C});
  const oliveD=new THREE.MeshLambertMaterial({color:0x585A31});
  /* front panel and mesh back, each half a dome */
  /* The heads are boxes, and a box's top corners sit 0.44 from its centre.
     At 0.37 all four corners poked out under the crown and made the cap look
     like it was sitting crooked. 0.48 swallows them, checked vertex by vertex;
     the flatter dome keeps it from turning into a helmet. */
  const R=0.48, SY=0.64;
  const front=new THREE.Mesh(new THREE.SphereGeometry(R,24,10,0,Math.PI,0,Math.PI/2),white);
  const back =new THREE.Mesh(new THREE.SphereGeometry(R,24,10,Math.PI,Math.PI,0,Math.PI/2),oliveD);
  for(const m of [front,back]){ m.scale.set(1,SY,1); m.position.set(0,-0.08,-0.02); c.add(m); }
  /* the band where crown meets head */
  const band=new THREE.Mesh(new THREE.TorusGeometry(R*0.99,0.022,6,28),olive);
  band.rotation.x=Math.PI/2; band.position.set(0,-0.08,-0.02); c.add(band);
  /* the button on top */
  const btn=new THREE.Mesh(new THREE.SphereGeometry(0.032,8,6),olive);
  btn.position.set(0,-0.08+R*SY,-0.02); c.add(btn);
  /* brim: a half disc out the front, tipped down a touch, with stitch lines */
  /* the brim starts inside the crown and reaches well past its front */
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.46,0.035,28,1,false,-Math.PI/2,Math.PI),olive);
  brim.scale.z=1.02; brim.position.set(0,-0.08,0.30); brim.rotation.x=0.14; c.add(brim);
  for(let i=1;i<=3;i++){
    const st=new THREE.Mesh(new THREE.TorusGeometry(0.46-i*0.08,0.006,4,24,Math.PI),oliveD);
    st.rotation.x=-Math.PI/2+0.14; st.rotation.z=Math.PI; st.position.set(0,-0.058,0.30);
    st.scale.y=1.02; c.add(st);
  }

  /* ---- the bass ---- */
  const back_=new THREE.MeshLambertMaterial({color:0x5C6B3A});
  const belly=new THREE.MeshLambertMaterial({color:0xD8C05A});
  const fin  =new THREE.MeshLambertMaterial({color:0xC7AA46});
  const dark =new THREE.MeshLambertMaterial({color:0x1B1A16});
  const eyeW =new THREE.MeshLambertMaterial({color:0xE9E4CF});
  const f=new THREE.Group();
  /* its own +X is the way it faces: out of the front left of the cap */
  /* a little bigger than before, so as much of it clears the wider crown */
  f.position.set(0,0.02,-0.02); f.scale.setScalar(1.18);
  f.rotation.y=Math.atan2(-0.8,-0.6);
  c.add(f);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.2,14,10),back_);
  head.scale.set(1.55,0.95,0.82); head.position.set(0.36,0,0); f.add(head);
  const jaw=new THREE.Mesh(new THREE.SphereGeometry(0.16,12,8),belly);
  jaw.scale.set(1.45,0.62,0.8); jaw.position.set(0.40,-0.10,0); f.add(jaw);
  /* the mouth, wide open, which is the whole joke */
  const mouth=new THREE.Mesh(new THREE.SphereGeometry(0.10,10,8),dark);
  mouth.scale.set(0.5,0.95,1.05); mouth.position.set(0.63,-0.03,0); f.add(mouth);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(0.095,0.022,6,16),belly);
  lip.rotation.y=Math.PI/2; lip.scale.set(1,1.05,1); lip.position.set(0.645,-0.03,0); f.add(lip);
  for(const s of [-1,1]){
    const ew=new THREE.Mesh(new THREE.SphereGeometry(0.052,10,8),eyeW);
    ew.position.set(0.47,0.07,s*0.145); f.add(ew);
    const ep=new THREE.Mesh(new THREE.SphereGeometry(0.028,8,6),dark);
    ep.position.set(0.49,0.075,s*0.18); f.add(ep);
    const pf=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.2,4),fin);
    pf.scale.set(1,1,0.25); pf.position.set(0.22,-0.14,s*0.17);
    pf.rotation.set(s*0.4,0,-1.9); f.add(pf);
  }
  /* dorsal fin: a spiny comb along the top, poking up out of the crown */
  for(let i=0;i<5;i++){
    const sp=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.2-i*0.02,4),fin);
    sp.scale.set(1,1,0.22); sp.position.set(0.14-i*0.075,0.30-i*0.01,0);
    sp.rotation.z=0.25; f.add(sp);
  }
  const web=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.12,0.02),fin);
  web.position.set(-0.01,0.25,0); web.rotation.z=0.05; f.add(web);
  /* the back half: a tapering body out the back right, curving up to the tail */
  /* negative about Z: the tail group points down -X, and a positive turn
     would have bent it DOWN the back of the head instead of up */
  const tailG=new THREE.Group(); tailG.position.set(-0.18,0.02,0); tailG.rotation.z=-0.5; f.add(tailG);
  const tb=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.15,0.46,12),back_);
  tb.rotation.z=Math.PI/2; tb.scale.set(1,1,0.8); tb.position.set(-0.22,0,0); tailG.add(tb);
  for(const s of [-1,1]){
    const tf=new THREE.Mesh(new THREE.ConeGeometry(0.13,0.30,4),fin);
    tf.scale.set(1,1,0.18); tf.position.set(-0.55,s*0.09,0);
    tf.rotation.z=Math.PI/2 + s*0.55; tailG.add(tf);
  }
  c.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return c;
}
/* put it on whoever is wearing it now, once */
function wearCap(){
  if(!avatar || avatar.userData.cap) return;
  const c=mkFishCap(); c.position.set(0,2.52,0); avatar.add(c);
  avatar.userData.cap=c;
}
function capOffBaised(){ if(baisedCap) baisedCap.visible = !(Q.fish>=3); }
