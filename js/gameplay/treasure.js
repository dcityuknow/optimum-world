/* ------------------------------ TREASURE ------------------------------ */
let treasure=null, treasureFound=false;
function foundTreasure(){
  if(treasureFound) return;
  treasureFound=true;
  try{ store.set('optimum-world:treasure','1'); }catch(e){}
  if(treasure) treasure.beam.visible=false;
  $('doneT').textContent=tr('trT');
  $('doneB').textContent=tr('trB');
  $('done').style.display='flex'; freeCursor(); questCue();
  blip(659,0.16,'sine',0.13);
  setTimeout(()=>blip(880,0.16,'sine',0.13),150);
  setTimeout(()=>blip(1175,0.38,'sine',0.13),310);
}
function makeTreasure(){
  if(true) return;                 // replaced by the buried fragment quest
  const TX0=-240, TZ0=0;
  const g=new THREE.Group(); g.position.set(TX0,0,TZ0); scene.add(g);
  const gold=new THREE.MeshPhongMaterial({color:0xE8B23A,emissive:0x5E410C,shininess:90});
  B(g,3.2,0.45,3.2,M.trim,0,0.22,0,false,true);
  B(g,2.2,0.18,2.2,new THREE.MeshLambertMaterial({color:0xE8B23A}),0,0.5,0,false,false);
  const blob=new THREE.Mesh(new THREE.SphereGeometry(0.85,18,14),gold);
  blob.position.set(0,1.95,0); g.add(blob);
  const b2=new THREE.Mesh(new THREE.SphereGeometry(0.55,16,12),gold);
  b2.position.set(0.62,1.55,0.1); g.add(b2);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,16,10,1,true),
    new THREE.MeshBasicMaterial({color:0xF2C75B,transparent:true,opacity:0.13,side:THREE.DoubleSide,depthWrite:false}));
  beam.position.set(0,9,0); g.add(beam);
  treasure={g:g,blob:blob,b2:b2,beam:beam};
  anims.push((t,dt)=>{
    blob.rotation.y+=dt*0.7; b2.rotation.y-=dt*0.9;
    blob.position.y=1.95+Math.sin(t*1.3)*0.16;
    b2.position.y=1.55+Math.sin(t*1.3+1.2)*0.13;
    beam.rotation.y+=dt*0.25;
    if(!treasureFound && Math.hypot(player.x-TX0,player.z-TZ0)<4.2) foundTreasure();
  });
}

function discTexture(night){
  const S=256, c=cvs(S,S), g=c.getContext('2d');
  const t=new THREE.CanvasTexture(c); t.anisotropy=4;
  const paint=img=>{
    g.clearRect(0,0,S,S);
    const R=S*0.40, cx=S/2, cy=S/2;
    const glow=g.createRadialGradient(cx,cy,R*0.85,cx,cy,S*0.5);
    glow.addColorStop(0, night?'rgba(214,226,255,0.55)':'rgba(255,236,190,0.85)');
    glow.addColorStop(1, night?'rgba(214,226,255,0)':'rgba(255,214,140,0)');
    g.fillStyle=glow; g.beginPath(); g.arc(cx,cy,S*0.5,0,6.283); g.fill();
    const body=g.createRadialGradient(cx-R*0.25,cy-R*0.25,R*0.1,cx,cy,R);
    if(night){ body.addColorStop(0,'#F4F7FF'); body.addColorStop(1,'#C9D4E8'); }
    else { body.addColorStop(0,'#FFFDF3'); body.addColorStop(1,'#FFD98C'); }
    g.fillStyle=body; g.beginPath(); g.arc(cx,cy,R,0,6.283); g.fill();
    if(img){
      const w=R*1.16, h=w*(img.height/img.width);
      g.globalCompositeOperation='destination-out';
      g.drawImage(img,cx-w/2,cy-h/2,w,h);
      g.globalCompositeOperation='source-over';
    }
    t.needsUpdate=true;
  };
  paint(null);
  const im=new Image(); im.onload=()=>paint(im); im.src=OPT_GLYPH;
  return t;
}
function makeCelestial(){
  const night = SKIES[PHASE].star>0.45;
  const size = night?46:58;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),
    new THREE.MeshBasicMaterial({map:discTexture(night),transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  m.name='sky';
  const ang = {dawn:0.30, day:0.95, golden:0.42, dusk:0.24, night:0.75}[PHASE] || 0.8;
  const dir = (PHASE==='dawn'||PHASE==='day') ? 1 : -1;
  const R=330;
  m.position.set(dir*Math.cos(ang)*R*0.75, Math.sin(ang)*R*0.62+18, -Math.cos(ang)*R*0.62);
  scene.add(m);
  anims.push(()=>{ m.lookAt(camera.position); });
  return m;
}
function makeStars(amount){
  if(amount<=0.05) return;
  const n=Math.floor(420*amount), pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, e=Math.random()*Math.PI*0.42, r=380;
    pos[i*3]=Math.cos(a)*Math.cos(e)*r;
    pos[i*3+1]=Math.sin(e)*r+40;
    pos[i*3+2]=Math.sin(a)*Math.cos(e)*r;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const st=new THREE.Points(geo,new THREE.PointsMaterial({color:0xFFFFFF,size:2.4,sizeAttenuation:false,transparent:true,opacity:amount,fog:false,toneMapped:false}));
  st.name='sky'; scene.add(st);
  anims.push(t=>{ st.material.opacity=amount*(0.72+0.28*Math.sin(t*0.7)); });
}
function makeWeather(){
  if(WEATHER!=='rain'&&WEATHER!=='snow') return;
  const snow=WEATHER==='snow', n=snow?900:1200;
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    pos[i*3]=(Math.random()-0.5)*220;
    pos[i*3+1]=Math.random()*70;
    pos[i*3+2]=(Math.random()-0.5)*220;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const p=new THREE.Points(geo,new THREE.PointsMaterial({
    color:snow?0xFFFFFF:0xBBD0E4, size:snow?1.1:0.9,
    map:spriteTex(snow?'flake':'drop'), alphaTest:0.10, depthWrite:false,
    transparent:true, opacity:snow?0.9:0.55, fog:true }));
  p.userData.stars=1; scene.add(p);
  const arr=geo.attributes.position.array;
  const fall=snow?5:34, drift=snow?1.6:0.3;
  anims.push((t,dt)=>{
    for(let i=0;i<n;i++){
      arr[i*3+1]-=fall*dt;
      if(snow) arr[i*3]+=Math.sin(t*0.8+i)*drift*dt;
      if(arr[i*3+1]<0){
        arr[i*3+1]=70;
        arr[i*3]=camera.position.x+(Math.random()-0.5)*220;
        arr[i*3+2]=camera.position.z+(Math.random()-0.5)*220;
      }
    }
    geo.attributes.position.needsUpdate=true;
    p.position.set(0,0,0);
  });
}

/* An IBL probe generated from the same gradient the sky dome uses. This is what
   makes chrome read as chrome instead of flat grey, and it costs one render. */
let ENVRT=null;
/* The sky dome gradient alone has no ground half and no sun, so a mirror
   surface reflects a flat wash and reads as matte white. This equirect adds a
   real horizon line, a ground half and a sun disc, which is what actually makes
   chrome look like chrome. */
function envTexture(){
  const W=512,H=256,c=cvs(W,H),g=c.getContext('2d');
  const K=SKIES[PHASE];
  const sky=g.createLinearGradient(0,0,0,H*0.5);
  sky.addColorStop(0,K.top); sky.addColorStop(0.62,K.mid); sky.addColorStop(1,K.low);
  g.fillStyle=sky; g.fillRect(0,0,W,H*0.5);
  const grd=g.createLinearGradient(0,H*0.5,0,H);
  grd.addColorStop(0,hx(SEASONS[SEASON].ground));
  grd.addColorStop(1,hx(C.carbon));
  g.fillStyle=grd; g.fillRect(0,H*0.5,W,H*0.5);
  // soften the seam a touch so the reflected horizon is not razor sharp
  const hz=g.createLinearGradient(0,H*0.5-6,0,H*0.5+6);
  hz.addColorStop(0,'rgba(0,0,0,0)');
  hz.addColorStop(0.5,'rgba(157,176,194,0.30)');
  hz.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=hz; g.fillRect(0,H*0.5-6,W,12);
  if(K.si>0.2){
    const sx=W*0.62, sy=H*0.5-H*0.30;
    const sg=g.createRadialGradient(sx,sy,0,sx,sy,44);
    sg.addColorStop(0,'rgba(255,255,255,0.95)');
    sg.addColorStop(0.35,'rgba(255,246,230,0.45)');
    sg.addColorStop(1,'rgba(255,246,230,0)');
    g.fillStyle=sg; g.beginPath(); g.arc(sx,sy,44,0,6.283); g.fill();
  }
  const t=new THREE.CanvasTexture(c);
  t.mapping=THREE.EquirectangularReflectionMapping;
  t.encoding=THREE.sRGBEncoding;
  return t;
}
function buildEnv(){
  try{
    const pmrem=new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    if(ENVRT) ENVRT.dispose();
    ENVRT=pmrem.fromEquirectangular(envTexture());
    scene.environment=ENVRT.texture;
    pmrem.dispose();
  }catch(e){ scene.environment=null; }
}
