/* ------------------------------ PING ------------------------------ */
function mkDog(){
  const d=new THREE.Group();
  const fur=new THREE.MeshLambertMaterial({color:0xC98E52});
  const pale=new THREE.MeshLambertMaterial({color:0xF1E9DC});
  const dark=new THREE.MeshLambertMaterial({color:0x6A4A30});
  const black=new THREE.MeshLambertMaterial({color:0x1A1614});
  const col=new THREE.MeshLambertMaterial({color:0xB87CFF});
  const body=B(d,0.42,0.38,0.9,fur,0,0.62,0,false,true); body.castShadow=true;
  B(d,0.34,0.2,0.42,pale,0,0.44,0.2,false,false);
  const head=new THREE.Group(); head.position.set(0,0.92,0.5); d.add(head);
  const hb=B(head,0.36,0.34,0.34,fur,0,0,0,false,true); hb.castShadow=true;
  B(head,0.22,0.16,0.22,pale,0,-0.07,0.24,false,false);
  B(head,0.09,0.07,0.06,black,0,-0.01,0.36,false,false);
  for(const s of [-1,1]){
    B(head,0.055,0.06,0.02,black,s*0.09,0.06,0.172,false,false);
    const e=B(head,0.1,0.22,0.07,dark,s*0.19,0.02,-0.02,false,false); e.rotation.z=s*0.25;
  }
  B(d,0.46,0.08,0.14,col,0,0.8,0.37,false,false);
  const tag=Cyl(d,0.045,0.045,0.02,10,new THREE.MeshLambertMaterial({color:0xE0B040}),0,0.7,0.45,false);
  tag.rotation.x=Math.PI/2;
  const legs=[];
  [[-0.13,0.3],[0.13,0.3],[-0.13,-0.3],[0.13,-0.3]].forEach(q=>{
    const l=new THREE.Group(); l.position.set(q[0],0.46,q[1]); d.add(l);
    B(l,0.1,0.44,0.11,fur,0,-0.22,0,false,false);
    B(l,0.11,0.06,0.14,pale,0,-0.43,0.02,false,false);
    legs.push(l);
  });
  const tail=new THREE.Group(); tail.position.set(0,0.74,-0.45); d.add(tail);
  const tc=Cyl(tail,0.028,0.045,0.38,6,fur,0,0.17,0,false); tail.rotation.x=-0.7;
  d.userData={head:head, legs:legs, tail:tail};
  return d;
}
function bark(v){
  if(!SFX.ctx||!SFX.on) return;
  const ctx=SFX.ctx, n=ctx.currentTime, vol=(v==null?0.16:v);
  if(vol<0.01) return;
  for(let k=0;k<2;k++){
    const t0=n+k*0.21;
    const o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    o.type='sawtooth';
    o.frequency.setValueAtTime(560,t0); o.frequency.exponentialRampToValueAtTime(240,t0+0.12);
    f.type='bandpass'; f.frequency.value=950; f.Q.value=1.3;
    g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(vol,t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.15);
    o.connect(f); f.connect(g); g.connect(SFX.master); o.start(t0); o.stop(t0+0.17);
  }
}
const DOGAREA={x1:-24,x2:42,z1:154,z2:193};
function buildDog(){
  const g=mkDog(); g.position.set(6,0,178); scene.add(g);
  dog={g:g, state:'roam', tgt:{x:6,z:178}, next:0, pause:false, barkAt:0, wag:0, digT:0, dust:[]};
  if(Q.leg===4){ dog.state='wait'; g.position.set(LEG_AT.x-1.2,0,LEG_AT.z+0.9); }
  if(Q.leg>=6) dog.state='follow';
  addMarker(g,1.75,()=> Q.leg===3 ? 0 : 2);
  dog.spot={x:6, z:178, r:2.9, prio:1, accent:C.peach, data:{name:'Ping'},
    when:()=> Q.leg!==4,     // while he guards the spot, the spot is what you want
    label:()=> (Q.leg===3 && hasItem('rib')) ? tr('dogRib') : tr('dogPet'),
    act:()=> (Q.leg===3 && hasItem('rib')) ? dogGiveRib() : dogPet()};
  spots.push(dog.spot);
  const sand=new THREE.MeshLambertMaterial({color:0xD9CCB0});
  for(let i=0;i<10;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.06+Math.random()*0.05,5,4),sand);
    m.visible=false; scene.add(m); dog.dust.push({m:m,v:[0,0,0]});
  }
  anims.push(dogTick);
}
function dogPet(){
  dog.wag=2.2; bark(0.14);
  dog.hop=performance.now();
}
function dogGiveRib(){
  takeItem('rib');
  bark(0.18); dog.wag=3;
  dog.state='toSpot';
  Q.leg=4; saveQuests(); updateTracker();
}
function dogTick(t,dt){
  const d=dog; if(!d) return;
  const P=d.g.position, U=d.g.userData;
  const pd=Math.hypot(player.x-P.x, player.z-P.z);
  let tgt=null, speed=0, face=null;
  if(d.state==='roam'){
    if(pd<4.0 && !photoMode){
      face=Math.atan2(player.x-P.x, player.z-P.z);
      d.wag=Math.max(d.wag,0.6);
      if(t>d.barkAt){ bark(0.14*distGain(pd,3,40)); d.barkAt=t+16+Math.random()*12; }
    } else {
      if(t>d.next){
        d.next=t+3.5+Math.random()*5; d.pause=Math.random()<0.35;
        for(let k=0;k<8;k++){
          const x=DOGAREA.x1+Math.random()*(DOGAREA.x2-DOGAREA.x1), z=DOGAREA.z1+Math.random()*(DOGAREA.z2-DOGAREA.z1);
          if(Math.hypot(x-BEACH.x,z-BEACH.z)>3.5){ d.tgt={x:x,z:z}; break; }
        }
      }
      if(!d.pause){ tgt=d.tgt; speed=2.3; }
    }
  } else if(d.state==='toSpot'){
    tgt={x:LEG_AT.x-1.2, z:LEG_AT.z+0.9}; speed=6.5;
    if(Math.hypot(tgt.x-P.x,tgt.z-P.z)<0.35){ d.state='dig'; d.digT=t; bark(0.16*distGain(pd,3,40)); }
  } else if(d.state==='dig'){
    face=Math.atan2(LEG_AT.x-P.x, LEG_AT.z-P.z);
    const e=t-d.digT;
    U.legs[0].rotation.x=-0.9+Math.sin(t*22)*0.7; U.legs[1].rotation.x=-0.9-Math.sin(t*22)*0.7;
    /* sand kicked back between the hind legs */
    for(let i=0;i<d.dust.length;i++){
      const q=d.dust[i];
      if(!q.m.visible || q.m.position.y<=0.05){
        q.m.visible=true; q.m.position.set(P.x+(Math.random()-0.5)*0.2,0.2,P.z);
        const bx=-Math.sin(d.g.rotation.y), bz=-Math.cos(d.g.rotation.y);
        q.v=[bx*(1.5+Math.random()*2)+(Math.random()-0.5), 1.5+Math.random()*1.5, bz*(1.5+Math.random()*2)+(Math.random()-0.5)];
      }
      q.v[1]-=9*dt; q.m.position.x+=q.v[0]*dt; q.m.position.y+=q.v[1]*dt; q.m.position.z+=q.v[2]*dt;
    }
    if(legPatch) legPatch.visible=true;
    if(e>2.8){ d.state='wait'; d.dust.forEach(q=>q.m.visible=false); U.legs[0].rotation.x=U.legs[1].rotation.x=0; bark(0.16*distGain(pd,3,40)); }
  } else if(d.state==='wait'){
    face=pd<6 ? Math.atan2(player.x-P.x, player.z-P.z) : Math.atan2(LEG_AT.x-P.x, LEG_AT.z-P.z);
    d.wag=Math.max(d.wag,0.5);
    if(Q.leg>=6) d.state='follow';
  } else if(d.state==='follow' && miretu){
    const wp=miretu.sk.getWorldPosition(MI_V);
    const bx=wp.x-1.4*(miretu.dir||1), bz=wp.z+0.9;
    if(Math.hypot(bx-P.x,bz-P.z)>0.8){ tgt={x:bx,z:bz}; speed=Math.min(4.2,1.2+Math.hypot(bx-P.x,bz-P.z)); }
    else face=Math.atan2(wp.x-P.x, wp.z-P.z);
  }
  let moving=false;
  if(tgt){
    const dx=tgt.x-P.x, dz=tgt.z-P.z, L=Math.hypot(dx,dz);
    if(L>0.25){
      const st=Math.min(L,speed*dt); P.x+=dx/L*st; P.z+=dz/L*st; moving=true;
      face=Math.atan2(dx,dz);
    }
  }
  if(face!==null) d.g.rotation.y+=wrapA(face-d.g.rotation.y)*Math.min(1,dt*7);
  if(d.state!=='dig'){
    const sw=moving?Math.sin(t*speed*4.2)*0.6:0;
    U.legs[0].rotation.x=sw; U.legs[3].rotation.x=sw; U.legs[1].rotation.x=-sw; U.legs[2].rotation.x=-sw;
  }
  d.wag=Math.max(0,d.wag-dt);
  U.tail.rotation.z=Math.sin(t*(d.wag>0.1?20:6))*(d.wag>0.1?0.7:0.25);
  const hop=d.hop?(performance.now()-d.hop)/1000:9;
  P.y = hop<0.45 ? Math.sin(hop/0.45*Math.PI)*0.35 : (moving?Math.abs(Math.sin(t*speed*4.2))*0.04:0);
  U.head.rotation.x = d.state==='dig' ? 0.35 : Math.sin(t*1.7)*0.05;
  d.spot.x=P.x; d.spot.z=P.z;
}
