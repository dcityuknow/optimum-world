/* ------------------------------ PEOPLE ------------------------------ */
function crowdTag(nick,col,roleTxt){
  const c=cvs(512,164), g=c.getContext('2d');
  g.font='800 46px ui-sans-serif, Helvetica, Arial';
  const w=Math.min(500,g.measureText(nick).width+70), x=(512-w)/2;
  g.fillStyle='rgba(26,29,35,0.92)';
  if(g.roundRect){ g.beginPath(); g.roundRect(x,8,w,64,32); g.fill(); } else g.fillRect(x,8,w,64);
  g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle=col; g.fillText(nick,256,40);
  g.font='800 30px ui-sans-serif, Helvetica, Arial';
  g.lineWidth=6; g.strokeStyle='rgba(26,29,35,0.85)';
  g.strokeText(roleTxt.toUpperCase(),256,112);
  g.fillStyle=col; g.fillText(roleTxt.toUpperCase(),256,112);
  return tex(c);
}
/* A soft radial decal under an object. The sun shadow disappears at night, in
   rain and on the lite tier, and without it everything looks like it is hovering. */
let CONTACT_TEX=null;
function contactTex(){
  if(CONTACT_TEX) return CONTACT_TEX;
  const S=128, c=cvs(S,S), g=c.getContext('2d');
  const grd=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  grd.addColorStop(0,'rgba(40,44,52,0.46)');
  grd.addColorStop(0.55,'rgba(40,44,52,0.20)');
  grd.addColorStop(1,'rgba(40,44,52,0)');
  g.fillStyle=grd; g.fillRect(0,0,S,S);
  const t=new THREE.CanvasTexture(c); t.anisotropy=MAXANISO;
  return (CONTACT_TEX=t);
}
function contact(parent,x,z,r,y){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),
    new THREE.MeshBasicMaterial({map:contactTex(),transparent:true,depthWrite:false,
      toneMapped:false, opacity:0.9}));
  m.rotation.x=-Math.PI/2;
  m.position.set(x, (y===undefined?0.035:y), z);
  m.renderOrder=-1;
  parent.add(m);
  return m;
}
function makePerson(parent, opt){
  const L=opt.look||null;
  const cSkin=L?L.skin:(opt.skin||0xE0BA92);
  const cShirt=L?L.shirt:(opt.body||opt.shirt||0x51B1FE);
  const cSleeve=L?(L.sleeve||L.shirt):cShirt;
  const cPants=L?(L.pants||0x3C4148):(opt.pants||0x4A535D);
  const shirt=new THREE.MeshLambertMaterial({color:cShirt});
  const sleeve=new THREE.MeshLambertMaterial({color:cSleeve});
  const skin=new THREE.MeshLambertMaterial({color:cSkin});
  const pants=new THREE.MeshLambertMaterial({color:cPants});
  const hairM=new THREE.MeshLambertMaterial({color:L?hairTop(L):0x33363C});

  const p=new THREE.Group(); p.scale.setScalar(0.78); parent.add(p);
  contact(p,0,0,0.95,0.045);
  /* The soft patch above holds them to the floor, but nothing on a person
     was in the shadow pass, so nobody threw a shadow towards the sun. The
     torso and the head are worth casting; the limbs are too thin for a
     depth draw each to pay for itself. */
  const castBig=(m)=>{ if(m) m.castShadow=true; return m; };

  if(L){
    const tm=new THREE.MeshLambertMaterial({map:torsoTex(L)});
    const torso=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.92,0.34),[shirt,shirt,shirt,shirt,tm,shirt]);
    torso.position.set(0,1.42,0); castBig(torso); p.add(torso); outline(p,torso);
    const sm=new THREE.MeshLambertMaterial({map:sideTex(L)});
    const head=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.56,0.52),
      [sm,sm,hairM,skin,new THREE.MeshLambertMaterial({map:faceTex(L)}),new THREE.MeshLambertMaterial({map:backTex(L)})]);
    head.position.set(0,2.17,0); castBig(head); p.add(head); outline(p,head);
    if(L.longHair){
      const hm=new THREE.MeshLambertMaterial({color:L.hair});
      const hl = L.style==='bob' ? 0.27 : 0.46;
      B(p,0.60,hl,0.10,hm,0,1.88-hl/2,-0.21,false,false);
      B(p,0.09,hl*0.9,0.32,hm,-0.335,1.88-hl*0.45,-0.03,false,false);
      B(p,0.09,hl*0.9,0.32,hm, 0.335,1.88-hl*0.45,-0.03,false,false);
    }
    if(L.style==='cap') B(p,0.58,0.07,0.24,new THREE.MeshLambertMaterial({color:L.cap||0x161616}),0,2.34,0.35,false,false);
    if(L.phones){
      const ph=new THREE.MeshLambertMaterial({color:L.phones});
      B(p,0.10,0.22,0.24,ph,-0.32,2.15,0,false,true);
      B(p,0.10,0.22,0.24,ph, 0.32,2.15,0,false,true);
      B(p,0.66,0.09,0.13,ph,0,2.46,0,false,false);
    }
  } else if(opt.avatar){
    B(p,0.62,0.92,0.34,shirt,0,1.42,0,false,true);
    const dk=new THREE.MeshLambertMaterial({color:0x2E3238});
    const fm=new THREE.MeshLambertMaterial({map:photoTex(opt.avatar)});
    const hd=new THREE.Mesh(new THREE.BoxGeometry(0.56,0.56,0.52),[dk,dk,dk,dk,fm,dk]);
    hd.position.set(0,2.17,0); p.add(hd); outline(p,hd);
  } else {
    B(p,0.62,0.92,0.34,shirt,0,1.42,0,false,true);
    B(p,0.54,0.54,0.5,skin,0,2.16,0,false,true);
    B(p,0.58,0.14,0.54,hairM,0,2.42,0,false,false);
    B(p,0.58,0.2,0.1,hairM,0,2.3,-0.24,false,false);
  }

  if(L && L.hood){
    const hm=new THREE.MeshLambertMaterial({color:L.hood});
    B(p,0.70,0.11,0.66,hm,0,2.51,-0.02,false,true);
    B(p,0.70,0.72,0.11,hm,0,2.16,-0.32,false,true);
    B(p,0.11,0.68,0.62,hm,-0.34,2.16,-0.02,false,true);
    B(p,0.11,0.68,0.62,hm, 0.34,2.16,-0.02,false,true);
    B(p,0.62,0.11,0.15,hm,0,2.43,0.28,false,false);
    B(p,0.80,0.34,0.52,hm,0,1.76,-0.06,false,true);
  }
  if(L && L.wings){
    const wm=new THREE.MeshLambertMaterial({color:L.wings});
    const big=L.bigWings?1:0;
    const wh=big?1.05:0.66, wd=big?0.68:0.46;
    const w1=B(p,0.08,wh,wd,wm,-(big?0.26:0.21),big?1.62:1.74,-(big?0.3:0.26),false,true);
    const w2=B(p,0.08,wh,wd,wm, (big?0.26:0.21),big?1.62:1.74,-(big?0.3:0.26),false,true);
    w1.rotation.z=big?0.34:0.26; w1.rotation.y=big?0.5:0.38;
    w2.rotation.z=big?-0.34:-0.26; w2.rotation.y=big?-0.5:-0.38;
    if(big){
      const f1=B(p,0.06,0.6,0.4,wm,-0.44,1.98,-0.42,false,true);
      const f2=B(p,0.06,0.6,0.4,wm, 0.44,1.98,-0.42,false,true);
      f1.rotation.z=0.6; f1.rotation.y=0.6; f2.rotation.z=-0.6; f2.rotation.y=-0.6;
    }
  }
  if(L && L.mane){
    const mm=new THREE.MeshLambertMaterial({color:L.mane});
    B(p,0.16,0.22,0.5,mm,0,2.55,-0.06,false,true);
    B(p,0.14,0.42,0.12,mm,0,2.06,-0.3,false,true);
  }
  if(L && L.scarf){
    const sm2=new THREE.MeshLambertMaterial({color:L.scarf});
    B(p,0.68,0.17,0.44,sm2,0,1.85,0,false,true);
    B(p,0.17,0.38,0.13,sm2,0.19,1.62,0.21,false,true);
  }
  if(L && L.ears){
    const em=new THREE.MeshLambertMaterial({color:L.ears});
    const e1=B(p,0.14,0.21,0.12,em,-0.17,2.53,-0.04,false,true);
    const e2=B(p,0.14,0.21,0.12,em, 0.17,2.53,-0.04,false,true);
    e1.rotation.z=0.22; e2.rotation.z=-0.22;
  }

  let bolts=null;
  if(opt.katana||(L&&L.katana)){
    const steel=new THREE.MeshLambertMaterial({color:0xDCE2E9});
    const wrap=new THREE.MeshLambertMaterial({color:0x24272C});
    const gold=new THREE.MeshLambertMaterial({color:0xC9A44E});
    const kg=new THREE.Group();
    kg.position.set(0.02,1.52,-0.27); kg.rotation.z=-0.62; kg.rotation.x=0.18; p.add(kg);
    kg.userData.isKatana=1; p.userData.katanaMesh=kg;
    B(kg,0.065,1.35,0.03,steel,0,0.5,0,false,true);
    B(kg,0.05,0.16,0.03,steel,0.005,1.2,0,false,false);
    B(kg,0.22,0.055,0.11,gold,0,-0.2,0,false,false);
    B(kg,0.075,0.42,0.09,wrap,0,-0.44,0,false,true);
    B(kg,0.09,0.05,0.10,gold,0,-0.66,0,false,false);
  }
  if(opt.storm||(L&&L.storm)){
    const bm=new THREE.MeshBasicMaterial({color:0xAFDFFF});
    bolts=[];
    for(let i=0;i<6;i++){
      const q=new THREE.Group();
      const ang=i/6*Math.PI*2;
      q.position.set(Math.cos(ang)*0.8, 1.35+((i*37)%9)*0.11, Math.sin(ang)*0.8);
      q.rotation.y=-ang; p.add(q);
      const s1=B(q,0.055,0.34,0.055,bm,0,0.16,0,false,false); s1.rotation.z=0.55;
      const s2=B(q,0.055,0.34,0.055,bm,0.12,-0.16,0,false,false); s2.rotation.z=-0.55;
      bolts.push(q);
    }
  }

  const mk=(px,py)=>{ const q=new THREE.Group(); q.position.set(px,py,0); p.add(q); return q; };
  const armL=mk(-0.42,1.86), armR=mk(0.42,1.86), legL=mk(-0.17,0.98), legR=mk(0.17,0.98);
  p.userData.limbs={armL:armL,armR:armR,legL:legL,legR:legR};
  B(armL,0.2,0.82,0.24,sleeve,0,-0.41,0,false,true);
  B(armR,0.2,0.82,0.24,sleeve,0,-0.41,0,false,true);
  B(legL,0.24,0.98,0.28,pants,0,-0.49,0,false,true);
  B(legR,0.24,0.98,0.28,pants,0,-0.49,0,false,true);

  const isStand=!!opt.stand, baseYaw=opt.baseYaw||0, baseY=opt.baseY||0;
  const route=opt.route||null;
  const a=route?[route[0][0],route[0][1]]:opt.a;
  const b=route?[route[0][0],route[0][1]]:opt.b;
  const sp=opt.speed||1.0;
  let segL=[], total=0;
  if(route){
    for(let i=0;i<route.length-1;i++){
      const L=Math.hypot(route[i+1][0]-route[i][0],route[i+1][1]-route[i][1]);
      segL.push(L); total+=L;
    }
  }
  let ru=0, rdir=1, rpause=14+Math.random()*5;
  const len=Math.max(0.2,Math.hypot(b[0]-a[0],b[1]-a[1]));
  const pyaw=parent.rotation?parent.rotation.y:0;
  const ppx=parent.position?parent.position.x:0, ppz=parent.position?parent.position.z:0;
  let wt=(opt.phase||Math.random()*6)*len/Math.max(sp,0.2);
  let mode='walk', tNext=5+Math.random()*9, wave=0;
  p.position.set(a[0],baseY,a[1]);
  p.rotation.y=baseYaw;
  let forcedPrev=false;
  const step=(t,dt)=>{
    if(opt.perform || p.userData.hold) return;
    if(bolts){ for(let i=0;i<bolts.length;i++){ bolts[i].visible=Math.sin(t*9+i*2.1)>0.3; bolts[i].rotation.y-=dt*1.1; } }

    const gx=ppx+p.position.x*Math.cos(pyaw)+p.position.z*Math.sin(pyaw);
    const gz=ppz-p.position.x*Math.sin(pyaw)+p.position.z*Math.cos(pyaw);
    const forced = photoMode && Math.hypot(gx-player.x,gz-player.z)<10;
    if(forced && !forcedPrev) wave = ((t*7)|0)%2;
    if(!forced && forcedPrev){ mode='walk'; tNext=t+6+Math.random()*8; }
    forcedPrev=forced;

    /* Talking range is 3.6, so from a little further out he stops walking and
       turns around. Pressing E behind someone used to talk to their back. */
    const greet = !photoMode && Math.hypot(gx-player.x,gz-player.z)<4.6;

    if(!forced && t>tNext){
      mode = mode==='walk' ? 'pose' : 'walk';
      tNext = t + (mode==='pose' ? 4+Math.random()*4 : 9+Math.random()*10);
      if(mode==='pose') wave = Math.random()<0.45?1:0;
    }

    if(route){
      let moving=false, px=route[0][0], pz=route[0][1], py=route[0][2];
      if(greet){ /* stand still while you are being spoken to */ }
      else if(rpause>0){ rpause-=dt; }
      else {
        ru += rdir*dt*sp*1.35;
        if(ru>=total){ ru=total; rdir=-1; rpause=9+Math.random()*4; }
        else if(ru<=0){ ru=0; rdir=1; rpause=14+Math.random()*6; }
        else moving=true;
      }
      let d0=ru, si=0;
      while(si<segL.length-1 && d0>segL[si]){ d0-=segL[si]; si++; }
      const f=segL[si]?Math.max(0,Math.min(1,d0/segL[si])):0;
      px=route[si][0]+(route[si+1][0]-route[si][0])*f;
      pz=route[si][1]+(route[si+1][1]-route[si][1])*f;
      py=route[si][2]+(route[si+1][2]-route[si][2])*f;
      p.position.set(px,py+(moving?Math.abs(Math.sin(t*sp*4.6))*0.04:Math.sin(t*1.6)*0.012),pz);

      const tx2=(photoMode&&camera)?camera.position.x:player.x;
      const tz2=(photoMode&&camera)?camera.position.z:player.z;
      let want2;
      if(moving){
        const dx2=(route[si+1][0]-route[si][0])*rdir, dz2=(route[si+1][1]-route[si][1])*rdir;
        want2=Math.atan2(dx2,dz2);
      } else if(forced || Math.hypot(gx-player.x,gz-player.z)<7.5){
        want2=Math.atan2(tx2-gx,tz2-gz)-pyaw;
      } else want2=baseYaw;
      let dd2=want2-p.rotation.y;
      while(dd2>Math.PI) dd2-=Math.PI*2;
      while(dd2<-Math.PI) dd2+=Math.PI*2;
      p.rotation.y+=dd2*Math.min(1,dt*4.5);

      if(moving){
        const sw2=Math.sin(t*sp*4.6)*0.6;
        legL.rotation.x=sw2; legR.rotation.x=-sw2;
        armL.rotation.x=-sw2*0.8; armR.rotation.x=sw2*0.8; armR.rotation.z=0;
      } else {
        legL.rotation.x=0; legR.rotation.x=0;
        armR.rotation.x=-0.55+Math.sin(t*1.9)*0.38; armR.rotation.z=0.34;
        armL.rotation.x=-0.3+Math.sin(t*1.5+1.1)*0.2; armL.rotation.z=-0.2;
      }
      return;
    }

    if(!forced && !isStand && mode==='walk' && greet){
      /* he keeps his place on the route: wt is not advanced, so he carries on
         from the same step once you walk away */
      const want=Math.atan2(player.x-gx,player.z-gz)-pyaw;
      let d=want-p.rotation.y;
      while(d>Math.PI) d-=Math.PI*2;
      while(d<-Math.PI) d+=Math.PI*2;
      p.rotation.y+=d*Math.min(1,dt*6);
      const ease=Math.min(1,dt*8);
      legL.rotation.x-=legL.rotation.x*ease; legR.rotation.x-=legR.rotation.x*ease;
      armR.rotation.x=-0.5+Math.sin(t*1.9)*0.3; armR.rotation.z=0.3;
      armL.rotation.x=-0.28+Math.sin(t*1.5+1.1)*0.18; armL.rotation.z=-0.18;
      p.position.y=baseY+Math.sin(t*1.6)*0.012;
    }
    else if(!forced && !isStand && mode==='walk'){
      wt+=dt;
      const cyc=((wt*sp/len)%2), k=cyc<1?cyc:2-cyc, dir=cyc<1?1:-1;
      p.position.set(a[0]+(b[0]-a[0])*k,0,a[1]+(b[1]-a[1])*k);
      p.rotation.y=Math.atan2((b[0]-a[0])*dir,(b[1]-a[1])*dir);
      const sw=Math.sin(wt*sp*3.2)*0.62;
      legL.rotation.x=sw; legR.rotation.x=-sw;
      armL.rotation.x=-sw*0.8; armR.rotation.x=sw*0.8; armR.rotation.z=0;
      p.position.y=baseY+Math.abs(Math.sin(wt*sp*3.2))*0.045;
    } else {
      const tx = (photoMode&&camera) ? camera.position.x : player.x;
      const tz = (photoMode&&camera) ? camera.position.z : player.z;
      const far = isStand && !forced && Math.hypot(gx-player.x,gz-player.z)>7.5;
      const want = far ? baseYaw : (Math.atan2(tx-gx,tz-gz)-pyaw);
      let d=want-p.rotation.y;
      while(d>Math.PI) d-=Math.PI*2;
      while(d<-Math.PI) d+=Math.PI*2;
      p.rotation.y+=d*Math.min(1,dt*(forced?6:4));
      legL.rotation.x=0; legR.rotation.x=0;
      p.position.y=baseY+Math.sin(t*1.6)*0.012;
      if(wave){ armR.rotation.x=-2.0+Math.sin(t*6)*0.32; armR.rotation.z=0.5; armL.rotation.x=0; }
      else if(isStand){
        armR.rotation.x=-0.55+Math.sin(t*1.9)*0.38; armR.rotation.z=0.34;
        armL.rotation.x=-0.3+Math.sin(t*1.5+1.1)*0.2; armL.rotation.z=-0.2;
      }
      else { armR.rotation.x=Math.sin(t*1.1)*0.06; armR.rotation.z=0; armL.rotation.x=-Math.sin(t*1.1)*0.06; }
    }
  };
  /* A shove is an impulse, not a fixed step: he is thrown, lifts off the ground
     a little and springs back to his line. Hitting him again while he is still
     out adds to what is already there instead of pulling him home first. The
     offset comes off before the walk cycle runs and goes back on after, or the
     poses that never touch position would stack it up and he would judder. */
  anims.push((t,dt)=>{
    const k=p.userData.kick;
    if(k){ p.position.x-=k.ax; p.position.z-=k.az; p.position.y-=k.ay; }
    step(t,dt);
    if(!k) return;
    const h=Math.min(dt,0.05);
    k.vx += (-6*k.vx - 3.0*k.ax)*h;
    k.vz += (-6*k.vz - 3.0*k.az)*h;
    k.ax += k.vx*h; k.az += k.vz*h;
    k.vy -= 13*h;   k.ay += k.vy*h;
    if(k.ay<=0){ k.ay=0; k.vy = k.vy<-1.3 ? -k.vy*0.26 : 0; }   // one small bounce
    const off=Math.hypot(k.ax,k.az);
    if(off>4){ k.ax*=4/off; k.az*=4/off; }                      // never launched off the map
    if(off<0.02 && Math.hypot(k.vx,k.vz)<0.05 && k.ay<0.01){
      p.userData.kick=null; p.rotation.z=0; return;
    }
    p.position.x+=k.ax; p.position.z+=k.az; p.position.y+=k.ay;
    p.rotation.z=-Math.min(0.34, off*0.14 + k.ay*0.34);
  });

  return p;
}
