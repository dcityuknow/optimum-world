/* ------------------------------ QUESTS ------------------------------ */
let Q={katana:0, dig:0, explore:0, doors:0, fish:0, cq:0, cqL:0, leg:0, legM:0, wo:0, bm:0, bb:0};   // 0 not offered, 1 active, 2 done
let markers=[], digSite=null, digging=0, samuraiWalker=null, samuraiBlade=null, vsWalker=null;
/* #grade is already in the page as one fixed radial. It is the same wash at
   noon and at midnight, which is the one thing a real grade never is: a
   night frame wants a deeper, warmer falloff, a bright day only the
   faintest cooling at the corners. Same element, no second layer. */
function gradeForPhase(){
  const el=document.getElementById('grade'); if(!el) return;
  const night=DARK, dusk=(PHASE==='dusk'||PHASE==='dawn');
  const mid  = night ? 'rgba(12,10,18,.22)' : dusk ? 'rgba(30,18,10,.17)' : 'rgba(10,14,22,.12)';
  const edge = night ? 'rgba(6,5,12,.52)'   : dusk ? 'rgba(22,12,6,.40)'  : 'rgba(8,11,16,.26)';
  el.style.background='radial-gradient(ellipse 126% 106% at 50% 46%,'+
    'rgba(0,0,0,0) 48%,'+mid+' 80%,'+edge+' 100%)';
}
/* Gulls: a single call every five to fourteen seconds while you are near the
   water, sometimes answered by a second one a moment later. Random pitch so
   three recordings never sound like the same bird on repeat. */
let gullAt=0;
const GULLS=['gull1','gull2','gull3'];
function gullTick(t){
  if(!SFX.ctx || INDOORS || t<gullAt) return;
  gullAt=t+5+Math.random()*9;
  const d=Math.max(0, SEA.shore-player.z);
  const v=distGain(d, 10, 150)*0.55;
  if(v<0.04) return;
  playSfx(GULLS[(Math.random()*3)|0], v, 0.9+Math.random()*0.22);
  if(Math.random()<0.35)
    playSfx(GULLS[(Math.random()*3)|0], v*0.6, 0.85+Math.random()*0.3, 0.35+Math.random()*0.5);
}
/* the first quest cannot start until he is in front of you */
/* He waits by the spawn until the blade is back in his hands, then goes
   back to walking the streets like everybody else. He does not move a step
   in the meantime: him and his patrol both writing his position was the
   twitch, and standing still is also easier to find. */
const GREET={x:0, z:14};
function greetTick(t,dt){
  if(!samuraiWalker) return;
  const p=samuraiWalker, hold=(Q.katana<2);
  if(p.userData.hold!==hold){
    p.userData.hold=hold;                  // one owner at a time, never both
    if(hold){ p.position.set(GREET.x,0,GREET.z); }
  }
  if(!hold) return;
  const lim=p.userData.limbs;
  p.position.y=Math.sin(t*1.6)*0.012;
  if(lim){
    lim.legL.rotation.x=0; lim.legR.rotation.x=0;
    lim.armR.rotation.x=-0.55+Math.sin(t*1.9)*0.38; lim.armR.rotation.z=0.34;
    lim.armL.rotation.x=-0.3+Math.sin(t*1.5+1.1)*0.2; lim.armL.rotation.z=-0.2;
  }
  const dx=player.x-p.position.x, dz=player.z-p.position.z;
  const want=(Math.hypot(dx,dz)<26) ? Math.atan2(dx,dz) : Math.PI;
  let dd=want-p.rotation.y;
  while(dd>Math.PI) dd-=Math.PI*2;
  while(dd<-Math.PI) dd+=Math.PI*2;
  p.rotation.y+=dd*Math.min(1,dt*4);
}

let MARKTEX={};
function markerTex(ch,col){
  const k=ch+col; if(MARKTEX[k]) return MARKTEX[k];
  const S=128,c=cvs(S,S),g=c.getContext('2d');
  g.fillStyle=col; g.beginPath(); g.arc(S/2,S/2,52,0,6.283); g.fill();
  g.fillStyle='#FFFBFB'; g.textAlign='center'; g.textBaseline='middle';
  g.font='800 78px ui-sans-serif, Helvetica, Arial'; g.fillText(ch,S/2,S/2+4);
  const t=tex(c); t.encoding=THREE.sRGBEncoding;
  return (MARKTEX[k]=t);
}
function addMarker(parent,y,get){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:markerTex('!','#FEA158'),
    transparent:true,depthTest:false,toneMapped:false}));
  sp.scale.set(0.7,0.7,1); sp.position.y=y; parent.add(sp);
  const m={sp:sp,get:get,state:-1}; markers.push(m); return m;
}
function updateMarkers(t){
  markers.forEach(m=>{
    const st=m.get();
    if(st!==m.state){
      m.state=st;
      if(st<0){ m.sp.visible=false; }
      else if(st===0){ m.sp.visible=true; m.sp.material.map=markerTex('!','#FEA158'); }
      else if(st===1){ m.sp.visible=true; m.sp.material.map=markerTex('?','#B87CFF'); }
      else m.sp.visible=false;
      m.sp.material.needsUpdate=true;
    }
    if(m.sp.visible) m.sp.position.y = m.sp.position.y + Math.sin(t*2)*0.0016;
  });
}
/* the buried fragment, hidden well off the beaten path */
function buildDigSite(){
  /* 118, not 170: at 170 the hole sat in the surf, thirty units from the
     waterline. Everything in the dig site hangs off this group, so this is
     the whole move. */
  const g=new THREE.Group(); g.position.set(-168,0,118); scene.add(g);
  digSite=g;
  // a lone rock cairn, the only thing that marks the spot
  const rk=new THREE.MeshLambertMaterial({color:0x8B93A0});
  [[0,0.5,0,1.1],[0.8,0.34,0.4,0.7],[-0.7,0.3,-0.3,0.6],[0.1,1.05,0.1,0.55]].forEach(p=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(p[3],8,6),rk);
    m.position.set(p[0],p[1],p[2]); m.scale.y=0.7; g.add(m);
  });
  /* A leaning post with a cross plank, plus a stacked cairn. Ordinary trees and
     rocks are everywhere, so the marker has to be something that clearly is not. */
  const post=new THREE.MeshLambertMaterial({color:0x6B5540});
  const mast=Cyl(g,.16,.2,5.4,8,post,2.6,2.6,-0.6,false);
  mast.rotation.z=0.16;
  const plank=B(g,2.0,0.3,0.16,post,2.2,4.5,-0.6,false,true);
  plank.rotation.z=-0.22;
  const plank2=B(g,1.2,0.26,0.16,post,2.35,3.7,-0.6,false,true);
  plank2.rotation.z=0.30;
  // a red rag knotted on the post, visible from far off
  const rag=B(g,0.5,0.7,0.06,new THREE.MeshLambertMaterial({color:0xB4453A}),3.1,3.1,-0.6,false,false);
  rag.rotation.z=-0.25;
  anims.push(t=>{ rag.rotation.y=Math.sin(t*1.6)*0.5; });
  // the cairn: three stones stacked, nothing else in the world looks like it
  const rk2=new THREE.MeshLambertMaterial({color:0x8B93A0});
  [[0,0.45,0,1.0,0.55],[0,1.15,0,0.72,0.42],[0,1.68,0,0.44,0.30]].forEach(q=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),rk2);
    m.scale.set(q[3],q[4],q[3]); m.position.set(q[0],q[1],q[2]); g.add(m);
  });
  const hole=new THREE.Mesh(new THREE.CircleGeometry(1.5,18),
    new THREE.MeshLambertMaterial({color:0x4A3B2C}));
  hole.rotation.x=-Math.PI/2; hole.position.set(0,0.03,2.4); hole.visible=false;
  g.add(hole); g.userData.hole=hole;
  const gold=new THREE.MeshPhongMaterial({color:0xE0A828,shininess:140,specular:0xFFF2C0,
                                          emissive:0x3E2A05});
  /* A single sculpted droplet with a pinched waist, the way the brand blob is
     drawn. Four stacked balls read like a molecule, not a treasure. */
  const frag=new THREE.Group(); frag.position.set(0,-0.6,2.4); frag.visible=false; g.add(frag);
  /* a clean sphere with the brand mark, nothing else. It gets screenshotted. */
  const S=1024, fc=cvs(S,S/2), fg=fc.getContext('2d');
  const grd=fg.createLinearGradient(0,0,0,S/2);
  grd.addColorStop(0,'#F2D45A'); grd.addColorStop(0.5,'#E8B93A'); grd.addColorStop(1,'#C8912A');
  fg.fillStyle=grd; fg.fillRect(0,0,S,S/2);
  const ftex=tex(fc); ftex.encoding=THREE.sRGBEncoding;
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.66,48,32),
    new THREE.MeshPhongMaterial({map:ftex, shininess:44, specular:0x8A6E24,
                                 emissive:0x2A1E04, emissiveIntensity:0.55}));
  frag.add(ball);
  stampOpt(fg,S,ftex,0.19);
  g.userData.frag=frag;
  // clods of earth thrown out of the hole
  const dirtM=new THREE.MeshLambertMaterial({color:0x5A4634});
  const dirt=[];
  for(let i=0;i<16;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.09+Math.random()*0.09,6,5),dirtM);
    m.visible=false; g.add(m); dirt.push(m);
  }
  g.userData.dirt=dirt;
  spots.push({x:-168,z:120.4,r:3.4,dig:1,accent:C.peach,data:{name:tr('digSpot')},prio:1});
}
function startDig(){
  if(digging || CINE) return;
  digging=1;
  const g=digSite, hole=g.userData.hole, frag=g.userData.frag, dirt=g.userData.dirt;
  const wx=g.position.x, wz=g.position.z+2.4;
  const t0=performance.now();
  g.userData.threw=0;
  /* four swings spread over the 2.4s animation */
  if(playSfx('dig1',0.85,0.98,0)){
    playSfx('dig2',0.75,1.04,0.62); playSfx('dig1',0.8,0.92,1.28); playSfx('dig2',0.7,1.0,1.86);
  } else blip(196,0.18,'sine',0.09);
  const shovelPhase=()=>{
    const e=(performance.now()-t0)/1000;
    const strike=Math.sin(e*7.0);
    if(viewItem){ viewItem.rotation.x = (ITEMS.shovel.vrot||[0.2])[0] + strike*0.85;
                  viewItem.position.y = ITEMS.shovel.view[1] - strike*0.12; }
    if(handItem) handItem.rotation.x = strike*0.7;
    camera.position.y += Math.abs(strike)*0.012;
    if(e>0.55 && !hole.visible) hole.visible=true;
    if(e>1.0 && !g.userData.threw){
      g.userData.threw=1;
      dirt.forEach((m,i)=>{
        m.visible=true;
        m.userData.v=[(Math.random()-0.5)*3.2, 2.6+Math.random()*2.2, (Math.random()-0.5)*3.2];
        m.position.set(0,0.2,2.4);
      });
      if(!playSfx('dig2',0.55,0.86)) blip(147,0.22,'sine',0.08);
    }
    if(e>1.0){
      const dt=0.016;
      dirt.forEach(m=>{
        if(!m.visible) return;
        const v=m.userData.v; v[1]-=9.5*dt;
        m.position.x+=v[0]*dt; m.position.y+=v[1]*dt; m.position.z+=v[2]*dt;
        if(m.position.y<0.06){ m.position.y=0.06; v[0]*=0.4; v[2]*=0.4; v[1]=0; }
      });
    }
    if(e<2.4) requestAnimationFrame(shovelPhase);
    else {
      if(viewItem){ viewItem.rotation.x=(ITEMS.shovel.vrot||[0.2])[0]; viewItem.position.y=ITEMS.shovel.view[1]; }
      if(handItem) handItem.rotation.x=0;
      frag.visible=true;
      cineFragment(wx,wz,()=>{
        Q.dig=2; saveQuests(); digging=0;
        spots.push({x:wx,z:wz+1.6,r:3.2,fragPick:1,accent:C.peach,
                    data:{name:tr('fragName')},prio:1});
        const fm=new THREE.Sprite(new THREE.SpriteMaterial({map:markerTex('!','#FEA158'),
          transparent:true,depthTest:false,toneMapped:false}));
        fm.scale.set(0.9,0.9,1); fm.position.set(0,1.15,0);
        frag.add(fm); frag.userData.mark=fm;
        $('doneT').textContent=tr('fragT'); $('doneB').textContent=tr('digPick');
        $('done').style.display='flex'; freeCursor(); questCue();
      });
      const t1=performance.now();
      const rise=()=>{
        /* the fragment is a single sphere now: the old bits/halo refs threw on
           the first frame, which is why it never left the hole */
        const k=(performance.now()-t1)/1000;
        frag.position.y = -0.6 + Math.min(1,k/1.2)*2.9 + Math.sin(k*1.4)*0.16;
        frag.rotation.y += 0.02;
        frag.rotation.z = Math.sin(k*0.8)*0.09;
        if(k<600) requestAnimationFrame(rise);   // keeps turning as a trophy
      };
      if(cueOK() && !playSfx('found',0.85)) blip(523,0.2,'sine',0.13);
      setTimeout(()=>blip(784,0.2,'sine',0.13),170);
      setTimeout(()=>blip(1047,0.45,'sine',0.13),340);
      rise();
    }
  };
  shovelPhase();
}
