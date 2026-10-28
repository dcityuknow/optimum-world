/* =========================================================================
   COMMUNITY QUEST (baised hands it out, umpia keeps the door) and
   LEG DAY (MiReTu on the beach, and Ping, who took the leg).
   Everything the two quests put in the world hangs off this block, and all
   of their progress lives in Q so a reset clears it with the rest.
     Q.cq   0 not offered, 1 collecting, 2 six found, 3 photo asked,
            4 photo taken, 5 door open, 6 card taken
     Q.cqL  letters found, one bit each: O P T I M U and the M off the cap
     Q.leg  0 not offered, 1 digging mounds, 2 mounds done, 3 has the rib,
            4 Ping has dug, 5 has the leg, 6 walking again
     Q.legM mounds dug, one bit each
   ========================================================================= */
const CQ_WORD='OPTIMUM';
/* behind the north row, in the gap between plots 1 and 3 */
const VAULT={x:78, z:-66, w:10, d:9, h:4.0};
const BEACH={x:16, z:170, yaw:0.094};           // the lounger, turned to face the plaza
const LEG_AT={x:14.35, z:170.2};                 // right under his lounger
const MOUNDS=[{x:-7,z:183,k:'boot'},{x:34,z:159,k:'chick'},{x:-20,z:163,k:'wallet'}];
const QZONES=[];                                 // clearings the woodland keeps out of
let umpiaNPC=null, umpiaCapCvs=null, umpiaCapTex=null, umpiaCap=null;
let vaultG=null, vaultDoor=null, vaultDoorCol=null, vaultNeon=null, vaultPhoto=null, vaultCardM=null;
let cqLetters=[], moundObjs=[], legPatch=null, legHole=null, legRise=null, legSpotG=null;
let miretu=null, dog=null, CODE_OPEN=false, QI_OPEN=false, CQPHOTO=null, qtLast='', toastT=null, digBusy=false;
let CQCARD=null, VAULT_IN=null;                                 // the finished card, as a data url

function bits(n){ let c=0; while(n){ c+=n&1; n>>=1; } return c; }
function cqCount(){ return bits(Q.cqL&127); }
function doneModal(t,b){
  $('doneT').textContent=t; $('doneB').textContent=b;
  $('done').style.display='flex'; freeCursor(); questCue();
}
function toast(a,b){
  const el=$('qtoast'); if(!el) return;
  el.innerHTML='<b></b>'+(b?'<span></span>':'');
  el.querySelector('b').textContent=a;
  if(b) el.querySelector('span').textContent=b;
  el.classList.add('on');
  clearTimeout(toastT);
  toastT=setTimeout(()=>el.classList.remove('on'), (b&&b.length>40)?4600:2600);
}
let GLOWTEX=null;
function glowTex(){
  if(GLOWTEX) return GLOWTEX;
  const S=128, c=cvs(S,S), g=c.getContext('2d');
  const r=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  r.addColorStop(0,'rgba(255,255,255,0.9)'); r.addColorStop(0.35,'rgba(255,255,255,0.28)');
  r.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=r; g.fillRect(0,0,S,S);
  return (GLOWTEX=new THREE.CanvasTexture(c));
}

/* ------------------------------ THE LETTERS ------------------------------
   Torn paper tiles, the same look as umpia's card. A soft glow behind each
   one so it can be spotted at night, nothing louder than that. */
function paperTex(ch){
  const W=128, H=160, c=cvs(W,H), g=c.getContext('2d');
  const r=seedRnd(ch.charCodeAt(0)*97+7);
  const j=()=>(r()-0.5)*7, pts=[];
  for(let x=6;x<=W-6;x+=11) pts.push([x+j()*0.3, 6+j()]);
  for(let y=6;y<=H-6;y+=11) pts.push([W-6+j(), y+j()*0.3]);
  for(let x=W-6;x>=6;x-=11) pts.push([x+j()*0.3, H-6+j()]);
  for(let y=H-6;y>=6;y-=11) pts.push([6+j(), y+j()*0.3]);
  g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); pts.forEach(p=>g.lineTo(p[0],p[1])); g.closePath();
  g.fillStyle='#F3F1EC'; g.fill();
  g.save(); g.clip();
  for(let i=0;i<320;i++){ g.fillStyle='rgba(0,0,0,'+(r()*0.05).toFixed(3)+')'; g.fillRect(r()*W,r()*H,1+r()*2,1+r()*2); }
  g.restore();
  g.fillStyle='#141518'; g.textAlign='center'; g.textBaseline='middle';
  g.font='900 116px Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif';
  g.fillText(ch, W/2, H/2+6);
  const t=tex(c); t.encoding=THREE.sRGBEncoding; return t;
}
function mkLetter(ch){
  const g=new THREE.Group();
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(), color:0xFFF1CF, transparent:true,
    depthWrite:false, opacity:0.5, toneMapped:false}));
  gl.scale.set(2.0,2.0,1); g.add(gl);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.72,0.9),
    new THREE.MeshBasicMaterial({map:paperTex(ch), transparent:true, side:THREE.DoubleSide, toneMapped:false}));
  g.add(pl);
  return g;
}
function cqLetterSpots(){
  /* a spot in a plot's own frame: north plots face the street with yaw 0,
     south plots are turned round, so their local axes are flipped */
  const at=(i,lx,lz)=>{ const n=i%2!==0, x=rowX(i), z=n?-ROW.z:ROW.z;
    return n ? {x:x+lx, z:z+lz} : {x:x-lx, z:z-lz}; };
  return [
    Object.assign({bit:0}, at(0, 5.9, 7.5)),       // inside the first house, behind the front wall
    Object.assign({bit:1}, at(1,-3.5,-12.8)),      // behind the second
    {bit:2, x:rowX(3), z:37},                      // in the gap between two south houses
    Object.assign({bit:3}, at(5,11.8,-3)),         // in a side yard
    Object.assign({bit:4}, at(6, 3.0,-12.8)),      // behind another
    Object.assign({bit:5}, at(9, 5.9, 7.5))        // inside, far down the street
  ];
}
function buildLetters(){
  cqLetterSpots().forEach((s,i)=>{
    const ch=CQ_WORD[s.bit], g=mkLetter(ch);
    g.position.set(s.x,1.05,s.z); g.visible=false; scene.add(g);
    const L={bit:s.bit, g:g, x:s.x, z:s.z, ph:i*1.7};
    cqLetters.push(L);
    QZONES.push({x1:s.x-3,x2:s.x+3,z1:s.z-3,z2:s.z+3});
    spots.push({x:s.x, z:s.z, r:2.7, prio:1, accent:C.peach, data:{name:ch},
      when:()=> Q.cq>=1 && !(Q.cqL&(1<<s.bit)),
      label:()=> tr('ltrGet')+' '+ch,
      act:()=> cqTake(s.bit)});
  });
}
/* whatever was picked up flies to the camera and is gone */
function flyToCam(obj){
  const p0=obj.getWorldPosition(new THREE.Vector3()), t0=performance.now();
  if(obj.parent!==scene){ obj.parent.remove(obj); scene.add(obj); obj.position.copy(p0); }
  const s0=obj.scale.x;
  const step=()=>{
    const k=Math.min(1,(performance.now()-t0)/520), e=k*k;
    const cp=camera.position;
    obj.position.set(p0.x+(cp.x-p0.x)*e, p0.y+(cp.y-0.3-p0.y)*e+Math.sin(k*Math.PI)*0.6, p0.z+(cp.z-p0.z)*e);
    obj.scale.setScalar(s0*(1-k*0.8));
    obj.rotation.y+=0.25;
    if(k<1) requestAnimationFrame(step); else obj.visible=false;
  };
  step();
}
function cqTake(bit){
  if(Q.cqL&(1<<bit)) return;
  Q.cqL|=(1<<bit); saveQuests();
  const L=cqLetters.find(l=>l.bit===bit); if(L){ L.flying=1; flyToCam(L.g); }
  if(!playSfx('pickup',0.7,1.12)) blip(784,0.14,'sine',0.1);
  toast(CQ_WORD[bit]+'   '+cqCount()+'/7', tr('ltrToast'));
  if((Q.cqL&63)===63 && Q.cq===1){
    Q.cq=2; saveQuests();
    setTimeout(()=>doneModal(tr('cqSixT'),tr('cqSixB')), 900);
  }
  updateTracker();
}
