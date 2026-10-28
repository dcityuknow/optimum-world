/* ------------------------------ NIGHT & AIR ------------------------------
   Windows that light up after dark, smoke off the rooftops, puddles when it
   has rained and a few birds. All of it shares one material per kind, so
   the draw call count barely moves. */
/* One switch for the decorative layer. Everything under it is something the
   world reads fine without, so a weak device simply does not build it. A
   function, not a constant: the saved quality setting arrives from storage
   asynchronously and a constant would be read before it lands. */
function FX(){ return quality>=2; }
const winRnd=seedRnd(20260913);
/* A flat block of one colour does not read as a window: it reads as a
   sticker. What says window is the frame, the cross bars and something behind
   the glass. One canvas per state, shared by every window in the world, so
   the detail costs nothing per window. */
function winTexture(kind){
  const W=256, H=128, c=cvs(W,H), g=c.getContext('2d');
  const F=12, M=8;                                 // frame and mullion widths
  const day=kind==='day';
  /* the glass */
  if(kind==='lit' || kind==='warm'){
    const warm=kind==='warm';
    const rg=g.createRadialGradient(W*0.5,H*0.62,6,W*0.5,H*0.62,W*0.62);
    rg.addColorStop(0, warm?'#FFE2B0':'#FFF4D6');
    rg.addColorStop(0.55, warm?'#F4B067':'#FBD58C');
    rg.addColorStop(1, warm?'#C9762F':'#D9A054');
    g.fillStyle=rg; g.fillRect(0,0,W,H);
    /* curtains drawn to the sides, so the room has an inside */
    g.fillStyle=warm?'rgba(150,72,28,0.55)':'rgba(170,110,50,0.45)';
    g.fillRect(F,F,34,H-F*2); g.fillRect(W-F-34,F,34,H-F*2);
    g.fillStyle='rgba(0,0,0,0.12)';
    for(let x=F+6;x<F+34;x+=9){ g.fillRect(x,F,2,H-F*2); g.fillRect(W-x-2,F,2,H-F*2); }
  } else {
    /* day: a slice of sky, darker toward the bottom, with a glint across it;
       night and unlit: nearly black glass with the same glint much fainter */
    const lg=g.createLinearGradient(0,0,0,H);
    lg.addColorStop(0, day?'#CFE1EF':'#2A3646');
    lg.addColorStop(1, day?'#6D8DA8':'#141B25');
    g.fillStyle=lg; g.fillRect(0,0,W,H);
    g.save(); g.globalAlpha=day?0.55:0.18; g.fillStyle='#FFFFFF';
    g.beginPath(); g.moveTo(W*0.18,0); g.lineTo(W*0.34,0); g.lineTo(W*0.14,H); g.lineTo(-W*0.02,H); g.fill();
    g.beginPath(); g.moveTo(W*0.42,0); g.lineTo(W*0.47,0); g.lineTo(W*0.27,H); g.lineTo(W*0.22,H); g.fill();
    g.restore();
  }
  /* frame and cross bars: pale by day, dark against a lit room at night */
  const frame = day ? '#F2EFE8' : '#34302C';
  g.fillStyle=frame;
  g.fillRect(0,0,W,F); g.fillRect(0,H-F,W,F); g.fillRect(0,0,F,H); g.fillRect(W-F,0,F,H);
  g.fillRect(W/2-M/2,0,M,H);                      // centre mullion
  g.fillRect(0,Math.round(H*0.40)-M/2,W,M);       // transom
  /* an inner shadow line on each pane, which is what gives the frame depth */
  g.strokeStyle= day ? 'rgba(40,55,70,0.35)' : 'rgba(0,0,0,0.35)'; g.lineWidth=2;
  const tY=Math.round(H*0.40);
  for(const [x0,x1] of [[F,W/2-M/2],[W/2+M/2,W-F]])
    for(const [y0,y1] of [[F,tY-M/2],[tY+M/2,H-F]]) g.strokeRect(x0+1,y0+1,x1-x0-2,y1-y0-2);
  return tex(c);
}
const WIN_LIT=new THREE.MeshBasicMaterial({map:winTexture('lit'), toneMapped:false});
const WIN_WARM=new THREE.MeshBasicMaterial({map:winTexture('warm'), toneMapped:false});
const WIN_OUT=new THREE.MeshLambertMaterial({map:winTexture('out')});
const WIN_DAY=new THREE.MeshLambertMaterial({map:winTexture('day')});
const SILL_MAT=new THREE.MeshLambertMaterial({color:0xE2DED6});
const litWindows=[];
/* a handful of them turn over every few seconds: somebody goes to bed,
   somebody else gets up. Enough to keep the skyline from looking painted. */
let winClock=0;
function windowTick(t,dt){
  if(!DARK || !litWindows.length) return;
  winClock+=dt;
  if(winClock<5.5) return;
  winClock=0;
  const m=litWindows[(Math.random()*litWindows.length)|0];
  m.material = (m.material===WIN_OUT) ? (Math.random()<0.35?WIN_WARM:WIN_LIT) : WIN_OUT;
}
/* The cone of light under a lamp head: bright at the bulb, gone before it
   reaches the pavement. Additive, so it brightens whatever is behind it
   instead of greying it out, and never writes depth. */
let SHAFT_MAT=null;
function shaftMat(){
  if(SHAFT_MAT) return SHAFT_MAT;
  const c=cvs(8,128), g=c.getContext('2d');
  const lg=g.createLinearGradient(0,0,0,128);
  lg.addColorStop(0,'rgba(255,221,164,0.34)');
  lg.addColorStop(0.45,'rgba(255,214,150,0.13)');
  lg.addColorStop(1,'rgba(255,208,140,0)');
  g.fillStyle=lg; g.fillRect(0,0,8,128);
  SHAFT_MAT=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide, toneMapped:false});
  return SHAFT_MAT;
}
/* A PointsMaterial without a map is a square, which is what every particle
   in the world used to be. These are drawn once and cached by name. */
const SPRITES={};
function spriteTex(kind){
  if(SPRITES[kind]) return SPRITES[kind];
  const S=48, c=cvs(S,S), g=c.getContext('2d');
  g.clearRect(0,0,S,S);
  if(kind==='leaf'){
    /* a pointed oval on a tilt, with a midrib: at this size the silhouette
       and the tilt are the only things that read */
    g.translate(S/2,S/2); g.rotate(-0.5);
    g.fillStyle='#fff';
    g.beginPath();
    g.moveTo(0,-19);
    g.bezierCurveTo(13,-9, 13,9, 0,19);
    g.bezierCurveTo(-13,9, -13,-9, 0,-19);
    g.fill();
    g.strokeStyle='rgba(0,0,0,0.30)'; g.lineWidth=1.6;
    g.beginPath(); g.moveTo(0,-17); g.lineTo(0,17); g.stroke();
  } else if(kind==='petal'){
    g.translate(S/2,S/2); g.rotate(0.4);
    g.fillStyle='#fff';
    g.beginPath(); g.ellipse(0,0,10,17,0,0,6.283); g.fill();
    g.fillStyle='rgba(255,255,255,0.45)';
    g.beginPath(); g.ellipse(-3,-4,4,8,0,0,6.283); g.fill();
  } else if(kind==='flake'){
    g.translate(S/2,S/2);
    g.strokeStyle='#fff'; g.lineWidth=2.6; g.lineCap='round';
    for(let i=0;i<6;i++){
      const a=i/6*6.283;
      g.beginPath(); g.moveTo(0,0);
      g.lineTo(Math.cos(a)*18, Math.sin(a)*18); g.stroke();
      g.beginPath();
      g.moveTo(Math.cos(a)*11, Math.sin(a)*11);
      g.lineTo(Math.cos(a+0.6)*16, Math.sin(a+0.6)*16); g.stroke();
    }
  } else if(kind==='drop'){
    /* rain is a streak, not a dot: it is the length that sells the speed */
    const lg=g.createLinearGradient(0,4,0,44);
    lg.addColorStop(0,'rgba(255,255,255,0)');
    lg.addColorStop(0.45,'rgba(255,255,255,0.9)');
    lg.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=lg; g.fillRect(S/2-2,4,4,40);
  } else {                       // 'dot': dust, pollen, fountain spray
    const rg=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
    rg.addColorStop(0,'rgba(255,255,255,1)');
    rg.addColorStop(0.45,'rgba(255,255,255,0.7)');
    rg.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=rg; g.beginPath(); g.arc(S/2,S/2,S/2,0,6.283); g.fill();
  }
  SPRITES[kind]=new THREE.CanvasTexture(c);
  return SPRITES[kind];
}
/* one soft round blob, reused by every puff of smoke */
let PUFF_TEX=null;
function puffTexture(){
  if(PUFF_TEX) return PUFF_TEX;
  const c=cvs(64,64), g=c.getContext('2d');
  const rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,'rgba(255,255,255,0.55)');
  rg.addColorStop(0.55,'rgba(255,255,255,0.22)');
  rg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=rg; g.fillRect(0,0,64,64);
  PUFF_TEX=new THREE.CanvasTexture(c);
  return PUFF_TEX;
}
function makePlume(x,y,z,scale,parent){
  if(!FX()) return null;
  const mat=new THREE.MeshBasicMaterial({map:puffTexture(), transparent:true,
    depthWrite:false, opacity:0.9, toneMapped:false});
  const grp=new THREE.Group(); grp.position.set(x,y,z); (parent||scene).add(grp);
  const puffs=[];
  for(let i=0;i<6;i++){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6), mat);
    m.position.y=i*1.9; grp.add(m);
    puffs.push({m:m, off:i/6});
  }
  const rise=11*(scale||1), drift=1.5*(scale||1);
  anims.push((t)=>{
    if(!camera || !grp.visible) return;
    for(let i=0;i<puffs.length;i++){
      const p=puffs[i], k=((t*0.085)+p.off)%1;
      p.m.position.y=k*rise;
      p.m.position.x=Math.sin(k*2.6+p.off*7)*drift*k;
      p.m.scale.setScalar((0.45+k*1.5)*(scale||1));
      p.m.material.opacity=Math.min(1,k*4)*(1-k)*0.75;
      p.m.quaternion.copy(camera.quaternion);   // always face the viewer
    }
  });
  return grp;
}
/* a rained-on street holds water in the low spots for a while afterwards */
function wetGround(){ return WEATHER==='rain'||WEATHER==='fog'; }
let PUDDLE_MAT=null;
function puddleMat(){
  if(PUDDLE_MAT) return PUDDLE_MAT;
  /* Three things were wrong with the first attempt. The disc had twelve
     segments, so it read as a polygon. It had no alpha falloff, so it had a
     hard cut-out edge. And it was LIGHTER than the tarmac, when wet ground is
     darker than dry: that alone is what made them look like grey patches
     rather than water. This is a dark centre fading out to nothing. */
  const c=cvs(96,96), g=c.getContext('2d');
  const rg=g.createRadialGradient(48,48,0,48,48,48);
  rg.addColorStop(0.00,'rgba(255,255,255,0.95)');
  rg.addColorStop(0.62,'rgba(255,255,255,0.72)');
  rg.addColorStop(0.86,'rgba(255,255,255,0.24)');
  rg.addColorStop(1.00,'rgba(255,255,255,0)');
  g.fillStyle=rg; g.beginPath(); g.arc(48,48,48,0,6.283); g.fill();
  const t=new THREE.CanvasTexture(c);
  PUDDLE_MAT = PBR
    ? SM({color:0x35404E, roughness:0.08, metalness:0.5, map:t,
          transparent:true, opacity:0.5})
    : new THREE.MeshLambertMaterial({color:0x3E4A59, map:t,
          transparent:true, opacity:0.38});
  PUDDLE_MAT.depthWrite=false;
  return PUDDLE_MAT;
}
/* All the puddles on one street become a single mesh. Eleven separate ones
   were eleven draw calls for eleven flat discs. */
function puddles(cx,cz,w,d,n){
  return;          /* taken out: they rendered as flat dark discs */
  if(!wetGround() || !FX()) return;
  const r=seedRnd(Math.round(cx*31+cz*17+w));
  const geos=[], mats=[];
  for(let i=0;i<n;i++){
    /* 22 segments, because the alpha now fades out before the rim and a
       twelve sided outline was plainly visible through it */
    const g=new THREE.CircleGeometry(1,22);
    geos.push(g);
    mats.push(new THREE.Matrix4().compose(
      /* the tarmac's top face is at 0.24, so a hair above it and no z-fight */
      new THREE.Vector3(cx+(r()-0.5)*w*0.86, 0.246, cz+(r()-0.5)*d*0.86),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,r()*6.283)),
      /* half the old size: they were wide enough to span a whole lane */
      new THREE.Vector3(0.9+r()*1.7, 0.6+r()*1.1, 1)));
  }
  scene.add(new THREE.Mesh(mergeGeos(geos,mats), puddleMat()));
}
/* The world stops at 280 units and then there is nothing. A ring of plain
   slabs out past that, unlit and shadowless, reads through the fog as a city
   that carries on without you. One instanced mesh for the lot. */
function makeSkyline(){
  const r=seedRnd(31337), n=74;
  const mat=new THREE.MeshBasicMaterial({color:DARK?0x2A3038:0xC3CEDA, fog:true});
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), mat, n);
  const d=new THREE.Object3D();
  for(let i=0;i<n;i++){
    const a=(i/n)*6.283+r()*0.05, rad=330+r()*70;
    /* the south is open water now, so no skyline stands there */
    const sx=Math.cos(a)*rad, sz=Math.sin(a)*rad;
    /* and none on the community street either: it runs well past this ring
       now, and a slab dropped across it reads as the road hitting a wall */
    /* the whole district: houses, trees and the view down the street. A
       slab closer than this stood among the houses once the street grew. */
    const onStreet = sx>-20 && Math.abs(sz)<240 && sx<CEND+160;
    if(sz > SEA.shore-90 || onStreet){ d.scale.set(0,0,0); d.updateMatrix(); im.setMatrixAt(i,d.matrix); continue; }
    const hgt=18+r()*54, wid=16+r()*26;
    d.position.set(Math.cos(a)*rad, hgt/2, Math.sin(a)*rad);
    d.rotation.set(0,-a,0);
    d.scale.set(wid, hgt, wid*(0.7+r()*0.6));
    d.updateMatrix(); im.setMatrixAt(i,d.matrix);
  }
  im.instanceMatrix.needsUpdate=true;
  im.castShadow=false; im.receiveShadow=false;
  scene.add(im);
}
/* Flat blobs high overhead, drifting on one wind. They are what stops the
   sky gradient from reading as a painted backdrop, and they cost six
   planes sharing one texture. */
function makeClouds(){
  const mat=new THREE.MeshBasicMaterial({map:puffTexture(), transparent:true,
    depthWrite:false, opacity:DARK?0.16:0.42, fog:false, toneMapped:false});
  /* These are enormous on screen when you look up, and a transparent plane
     costs its whole area in fill rate. Five smaller ones read the same and
     the weakest tier gets none. */
  if(!FX()) return;
  const r=seedRnd(5150), cl=[];
  for(let i=0;i<5;i++){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1), mat);
    m.rotation.x=Math.PI/2;              // face down, at the ground
    m.position.set((r()-0.5)*700, 96+r()*34, (r()-0.5)*700);
    m.scale.setScalar(100+r()*120);
    scene.add(m); cl.push(m);
  }
  anims.push((t,dt)=>{
    for(let i=0;i<cl.length;i++){
      const m=cl[i];
      m.position.x+=2.4*dt; m.position.z+=0.9*dt;
      if(m.position.x>430) m.position.x=-430;    // wrap, never spawn a gap
      if(m.position.z>430) m.position.z=-430;
    }
  });
}
/* four of them, on slow circles, high enough to read as scale rather than
   as wildlife */
function makeBirds(){
  const mat=new THREE.MeshLambertMaterial({color:0x3C4652});
  const r=seedRnd(7761);
  for(let i=0;i<4;i++){
    const b=new THREE.Group();
    const wl=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.16,0.7), mat);
    const wr=wl.clone();
    wl.position.x=-1.3; wr.position.x=1.3;
    b.add(wl); b.add(wr);
    scene.add(b);
    const rad=110+r()*150, hgt=46+r()*26, sp=0.055+r()*0.05,
          ph=r()*6.283, cx=(r()-0.5)*160, cz=(r()-0.5)*160;
    anims.push((t)=>{
      const a=ph+t*sp;
      b.position.set(cx+Math.cos(a)*rad, hgt+Math.sin(t*0.35+ph)*3.2, cz+Math.sin(a)*rad);
      b.rotation.y=-a;
      const f=Math.sin(t*5.6+ph)*0.55;
      wl.rotation.z=f; wr.rotation.z=-f;
    });
  }
}
