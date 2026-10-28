/* ------------------------------ INVENTORY ------------------------------
   Items you are given by residents. A slot only appears once you own the item,
   and the held item is drawn in the avatar's hand and as a first person view
   model, so it reads in both camera modes. */
let INV=[], HELD=null, handItem=null, viewItem=null, mapOpen=false;

function mkBeer(g){
  Cyl(g,.16,.14,0.4,12,new THREE.MeshLambertMaterial({color:0xE8B44A}),0,0,0,false);
  Cyl(g,.17,.17,0.07,12,new THREE.MeshLambertMaterial({color:0xFFF6E2}),0,0.22,0,false);
  B(g,0.05,0.2,0.05,new THREE.MeshLambertMaterial({color:0xE8B44A}),0.19,0,0,false,false);
}
let FRAGTEX=null;
function fragTexture(){
  if(FRAGTEX) return FRAGTEX;
  const S=512, c=cvs(S,S/2), g2=c.getContext('2d');
  const grd=g2.createLinearGradient(0,0,0,S/2);
  grd.addColorStop(0,'#F2D45A'); grd.addColorStop(0.5,'#E8B93A'); grd.addColorStop(1,'#C8912A');
  g2.fillStyle=grd; g2.fillRect(0,0,S,S/2);
  FRAGTEX=tex(c); FRAGTEX.encoding=THREE.sRGBEncoding;
  stampOpt(g2,S,FRAGTEX,0.20);
  return FRAGTEX;
}
function mkFragment(g){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.3,26,18),
    new THREE.MeshPhongMaterial({map:fragTexture(), shininess:44, specular:0x8A6E24,
                                 emissive:0x2A1E04, emissiveIntensity:0.55}));
  g.add(m);
}
/* A rod is a taper, a handle, a reel and a line. The taper is the part that
   reads: a straight stick of one diameter looks like a broom. */
/* The golden fish: a flattened body, a tail, fins and an eye. Flattening a
   sphere on one axis is what turns it from a ball into a fish. */
function mkGolden(g){
  const gold =new THREE.MeshLambertMaterial({color:0xE9B23C});
  const gold2=new THREE.MeshLambertMaterial({color:0xF6D278});
  const dark =new THREE.MeshLambertMaterial({color:0x8A5F1C});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.30,12,9),gold);
  body.scale.set(1.35,0.85,0.5); g.add(body);
  const tail=new THREE.Mesh(new THREE.ConeGeometry(0.19,0.30,4),gold2);
  tail.position.set(-0.44,0,0); tail.rotation.z=Math.PI/2; tail.scale.set(1,1,0.35); g.add(tail);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(0.11,0.20,3),gold2);
  fin.position.set(0.02,0.24,0); fin.scale.set(1,1,0.3); g.add(fin);
  for(const s of [-1,1]){
    const pf=new THREE.Mesh(new THREE.ConeGeometry(0.07,0.15,3),gold2);
    pf.position.set(0.10,-0.06,s*0.13); pf.rotation.z=-0.9; pf.rotation.x=s*0.5; g.add(pf);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.045,7,6),dark);
    eye.position.set(0.30,0.07,s*0.10); g.add(eye);
  }
  return g;
}
function mkRod(g){
  const cork=new THREE.MeshLambertMaterial({color:0xC9A16A});
  const blank=new THREE.MeshLambertMaterial({color:0x2E3A45});
  const steel=new THREE.MeshLambertMaterial({color:0xB6C0CB});
  const gold=new THREE.MeshLambertMaterial({color:0xD8A94B});
  Cyl(g,0.048,0.055,0.46,10,cork,0,0.23,0,false);      // grip
  Cyl(g,0.042,0.048,0.10,10,gold,0,0.51,0,false);      // winding check
  /* five sections, each thinner than the last, so the blank tapers */
  let y=0.56, r0=0.040;
  for(let i=0;i<5;i++){
    const r1=r0*0.72, L=0.52;
    Cyl(g,r1,r0,L,8,blank,0,y+L/2,0,false);
    /* a line guide on a tiny stem, alternating sides */
    const gx=(i%2?1:-1)*0.055;
    Cyl(g,0.006,0.006,0.05,5,steel,gx*0.5,y+L*0.8,0,false);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.030,0.006,5,10),steel);
    ring.position.set(gx,y+L*0.86,0); ring.rotation.y=Math.PI/2; g.add(ring);
    y+=L; r0=r1;
  }
  /* the reel: foot, stem, spool and handle */
  B(g,0.05,0.09,0.05,steel,0,0.50,-0.055,false,false);
  const spool=new THREE.Mesh(new THREE.CylinderGeometry(0.105,0.105,0.075,14),steel);
  spool.position.set(0,0.45,-0.12); spool.rotation.x=Math.PI/2; g.add(spool);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(0.105,0.012,6,14),gold);
  lip.position.set(0,0.45,-0.085); g.add(lip);
  Cyl(g,0.008,0.008,0.10,5,steel,0.10,0.45,-0.16,false);
  B(g,0.03,0.05,0.03,cork,0.10,0.45,-0.215,false,false);
  return g;
}
function mkShovel(g){
  const wood=new THREE.MeshLambertMaterial({color:0x9A7A57});
  const wood2=new THREE.MeshLambertMaterial({color:0x836444});
  const steel=new THREE.MeshLambertMaterial({color:0xA9B4C1});
  const steel2=new THREE.MeshLambertMaterial({color:0x7F8B99});

  /* The blade is one extruded outline. Stacked slabs made a staircase and a
     four sided cone made spikes, so the silhouette is drawn properly instead. */
  const sh=new THREE.Shape();
  sh.moveTo(-0.235, 0.20);
  sh.lineTo( 0.235, 0.20);
  sh.lineTo( 0.245,-0.08);
  /* a digging spade has a broad rounded edge, not a spearhead */
  sh.bezierCurveTo( 0.238,-0.30, 0.185,-0.41, 0.085,-0.435);
  sh.lineTo(-0.085,-0.435);
  sh.bezierCurveTo(-0.185,-0.41,-0.238,-0.30,-0.245,-0.08);
  sh.closePath();
  const bGeo=new THREE.ExtrudeGeometry(sh,{depth:0.045, bevelEnabled:true,
    bevelThickness:0.014, bevelSize:0.014, bevelSegments:2, curveSegments:14});
  bGeo.translate(0,0,-0.0225);
  const blade=new THREE.Mesh(bGeo,steel);
  blade.position.set(0,-0.56,0);
  blade.rotation.x=-0.10;                 // a little scoop toward the handle
  g.add(blade);
  // rolled shoulders, where a boot presses
  B(g,0.50,0.055,0.10,steel2,0,-0.355,0.02,false,false);
  // socket joining shaft and blade
  Cyl(g,.052,.085,0.26,10,steel2,0,-0.29,0.01,false);
  B(g,0.11,0.16,0.10,steel2,0,-0.16,0.015,false,false);

  // shaft
  Cyl(g,.038,.048,1.24,10,wood,0,0.36,0,false);
  // D grip: a ring you can actually see through
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.115,0.03,8,18),wood2);
  ring.position.set(0,1.06,0); g.add(ring);
  B(g,0.055,0.16,0.055,wood2,-0.10,0.94,0,false,false);
  B(g,0.055,0.16,0.055,wood2, 0.10,0.94,0,false,false);
}
function mkMapItem(g){
  const p=new THREE.MeshLambertMaterial({color:0xF0E4C4});
  B(g,0.62,0.02,0.46,p,0,0,0,false,false);
  B(g,0.62,0.02,0.46,p,0.02,0.03,0.02,false,false);
  B(g,0.6,0.006,0.44,new THREE.MeshBasicMaterial({map:mapTexture(),toneMapped:false}),0,0.045,0,false,false);
}
function mkKatana(g){
  const steel=new THREE.MeshLambertMaterial({color:0xD8E0E8});
  const wrap=new THREE.MeshLambertMaterial({color:0x23262C});
  B(g,0.05,1.5,0.018,steel,0,0.62,0,false,false);          // blade
  B(g,0.016,1.5,0.02,new THREE.MeshLambertMaterial({color:0xF4F8FC}),0.016,0.62,0,false,false);
  Cyl(g,.13,.13,0.03,14,new THREE.MeshLambertMaterial({color:0x5A4A2E}),0,-0.16,0,false); // tsuba
  B(g,0.05,0.42,0.045,wrap,0,-0.4,0,false,false);
  for(let i=0;i<5;i++) B(g,0.06,0.03,0.055,new THREE.MeshLambertMaterial({color:0xC96A3A}),0,-0.24-i*0.08,0,false,false);
}
function mkGuitarItem(g){
  const sp=new THREE.MeshLambertMaterial({color:0xE0BC84});
  const rose=new THREE.MeshLambertMaterial({color:0x7A5433});
  const lo=Cyl(g,.3,.3,0.11,16,sp,0,-0.14,0,false); lo.rotation.x=Math.PI/2;
  const up=Cyl(g,.22,.22,0.11,16,sp,0,0.2,0,false); up.rotation.x=Math.PI/2;
  B(g,0.34,0.28,0.11,sp,0,0.04,0,false,false);
  const hole=Cyl(g,.085,.085,0.02,14,new THREE.MeshLambertMaterial({color:0x1A1208}),0,0.08,0.06,false);
  hole.rotation.x=Math.PI/2;
  B(g,0.1,0.75,0.05,rose,0,0.68,0.01,false,false);
  B(g,0.13,0.2,0.05,rose,0,1.12,0.01,false,false);
  const str=new THREE.MeshLambertMaterial({color:0xF0E6CC});
  for(let k=0;k<6;k++) B(g,0.006,1.3,0.006,str,-0.036+k*0.014,0.46,0.05,false,false);
}
/* a hand drawn treasure map, drawn on a canvas so it reads as ink on paper */
const OPT_ICON='assets/images/brand/optimum-icon.png';
let OPTIMG=null, OPTMARK=null;
function optIcon(){
  if(!OPTIMG){ OPTIMG=new Image(); OPTIMG.src=OPT_ICON; }
  if(!OPTIMG.complete || !OPTIMG.naturalWidth) return null;
  if(OPTMARK) return OPTMARK;
  /* the file is white, so tint a copy dark: white on gold disappears on a phone */
  const c=cvs(616,336), g=c.getContext('2d');
  g.drawImage(OPTIMG,0,0,616,336);
  g.globalCompositeOperation='source-in';
  g.fillStyle='#3B2A05'; g.fillRect(0,0,616,336);
  return (OPTMARK=c);
}
function stampOpt(g2,S,texture,scale){
  const put=()=>{
    const ic=optIcon();
    if(!ic){ setTimeout(put,200); return; }     // keep trying until the icon decodes
    const w=S*(scale||0.2), h=w*(336/616);
    g2.globalAlpha=0.95;
    [0.16,0.49,0.82].forEach(u=> g2.drawImage(ic, u*S-w/2, S/4-h/2, w, h));
    g2.globalAlpha=1; texture.needsUpdate=true;
  };
  put();
}
let MAPTEX=null;
function mapTexture(){
  if(MAPTEX) return MAPTEX;
  const W=1100, H=800, c=cvs(W,H), g=c.getContext('2d');
  const ink='#3E2C18', ink2='#6B5333', red='#A8382C';
  // aged paper with a torn, uneven edge
  g.fillStyle='#EFE0BC'; g.fillRect(0,0,W,H);
  const grd=g.createRadialGradient(W/2,H/2,120,W/2,H/2,W*0.72);
  grd.addColorStop(0,'rgba(255,248,225,0.55)'); grd.addColorStop(1,'rgba(120,92,48,0.30)');
  g.fillStyle=grd; g.fillRect(0,0,W,H);
  for(let i=0;i<3000;i++){
    g.fillStyle='rgba(126,98,54,'+(Math.random()*0.06)+')';
    g.beginPath(); g.arc(Math.random()*W,Math.random()*H,Math.random()*11,0,6.283); g.fill();
  }
  for(let i=0;i<9;i++){                       // coffee rings and stains
    const x=Math.random()*W, y=Math.random()*H, r=25+Math.random()*70;
    g.strokeStyle='rgba(140,104,52,0.14)'; g.lineWidth=3+Math.random()*4;
    g.beginPath(); g.arc(x,y,r,0,6.283); g.stroke();
  }
  // hand ruled border, deliberately wobbly
  const wob=(pts,col,lw,dash)=>{
    g.strokeStyle=col; g.lineWidth=lw; if(dash) g.setLineDash(dash);
    g.beginPath();
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1];
      if(i===0) g.moveTo(a[0],a[1]);
      const n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/26));
      for(let t=1;t<=n;t++){
        const u=t/n;
        g.lineTo(a[0]+(b[0]-a[0])*u+(Math.random()-0.5)*6,
                 a[1]+(b[1]-a[1])*u+(Math.random()-0.5)*6);
      }
    }
    g.stroke(); g.setLineDash([]);
  };
  wob([[34,34],[W-34,34],[W-34,H-34],[34,H-34],[34,34]], ink2, 3);
  // title, written by hand
  g.fillStyle=ink; g.textAlign='center';
  g.font='700 52px Georgia, ui-serif, serif';
  g.fillText(tr('mapTitle'), W/2, 92);
  wob([[W/2-190,110],[W/2+190,110]], red, 3);

  // the streets, as the crossroads actually are
  const CX=470, CY=372;
  wob([[CX,150],[CX,CY]], ink, 7);                    // city street, north
  wob([[130,CY],[CX,CY]], ink, 7);                    // team street, west
  wob([[CX,CY],[980,CY]], ink, 7);                    // community street, east
  g.fillStyle=ink2; g.font='600 27px Georgia, ui-serif, serif';
  g.textAlign='left';
  g.fillText('OPTIMUM CITY', CX+22, 158);
  g.textAlign='right'; g.fillText('TEAM', 210, CY-20);
  g.textAlign='left';  g.fillText('COMMUNITY', 800, CY-20);
  // little hand drawn houses along the streets
  const hut=(x,y,fl)=>{
    g.strokeStyle=ink2; g.lineWidth=2.4;
    g.beginPath(); g.moveTo(x-11,y+11); g.lineTo(x-11,y-3); g.lineTo(x,y-13);
    g.lineTo(x+11,y-3); g.lineTo(x+11,y+11); g.closePath(); g.stroke();
    if(fl){ g.beginPath(); g.moveTo(x,y-13); g.lineTo(x,y-24); g.lineTo(x+12,y-20);
            g.lineTo(x,y-16); g.stroke(); }
  };
  for(let i=0;i<5;i++){ hut(200+i*62, CY-46); hut(200+i*62, CY+46); }
  for(let i=0;i<4;i++){ hut(600+i*62, CY-46); hut(600+i*62, CY+46); }
  for(let i=0;i<3;i++){ hut(CX-46, 196+i*54); hut(CX+46, 196+i*54); }
  // the crossroads marker
  g.strokeStyle=red; g.lineWidth=3;
  g.beginPath(); g.arc(CX,CY,17,0,6.283); g.stroke();
  g.fillStyle=red; g.font='600 20px Georgia, ui-serif, serif';
  g.textAlign='left'; g.fillText(tr('mapCross'), CX+26, CY-24);

  // the trail: down the Team street, then deep south into the field
  const TX=250, TY=596;
  wob([[CX,CY],[TX+70,CY],[TX+30,486],[TX,TY]], red, 4, [13,10]);
  // footprints along the way
  g.fillStyle='rgba(168,56,44,0.55)';
  for(let i=0;i<7;i++){
    const u=i/7, x=CX+(TX-CX)*u+ (i%2?9:-9), y=CY+(TY-CY)*(u*u*0.85+u*0.15);
    g.beginPath(); g.ellipse(x,y,5,9,0.2,0,6.283); g.fill();
  }
  // open field around the X: no houses out here, just scrub and grass tufts
  g.strokeStyle='rgba(107,83,51,0.30)'; g.lineWidth=1.6;
  for(let i=0;i<34;i++){
    const a=Math.random()*6.283, rr=70+Math.random()*130;
    const x=TX+Math.cos(a)*rr*0.9, y=TY+Math.sin(a)*rr*0.45;
    if(y<CY+50) continue;
    g.beginPath();
    g.moveTo(x,y); g.lineTo(x-4,y-9); g.moveTo(x,y); g.lineTo(x+4,y-8);
    g.moveTo(x,y); g.lineTo(x,y-11);
    g.stroke();
  }
  g.fillStyle='rgba(107,83,51,0.42)';
  g.font='italic 21px Georgia, ui-serif, serif'; g.textAlign='center';
  g.fillText(tr('mapField'), TX+150, TY-58);
  // a dashed boundary showing where the street grid ends
  g.strokeStyle='rgba(107,83,51,0.25)'; g.lineWidth=2; g.setLineDash([7,9]);
  g.beginPath(); g.moveTo(90,CY+92); g.lineTo(W-90,CY+92); g.stroke(); g.setLineDash([]);

  // the landmark: three stones and one tree
  g.strokeStyle=ink; g.lineWidth=3;
  [[-24,6,15],[2,0,20],[26,8,13]].forEach(p=>{
    g.beginPath(); g.ellipse(TX+p[0],TY+p[1],p[2],p[2]*0.72,0.2,0,6.283); g.stroke();
  });
  g.beginPath(); g.moveTo(TX+56,TY+12); g.lineTo(TX+64,TY-52); g.stroke();
  g.beginPath(); g.moveTo(TX+48,TY-34); g.lineTo(TX+78,TY-30); g.stroke();
  g.fillStyle=red;
  g.beginPath(); g.moveTo(TX+64,TY-46); g.lineTo(TX+84,TY-42);
  g.lineTo(TX+80,TY-26); g.lineTo(TX+62,TY-30); g.closePath(); g.fill();
  g.strokeStyle=ink;
  // the X
  g.strokeStyle=red; g.lineWidth=9;
  g.beginPath(); g.moveTo(TX-16,TY+36); g.lineTo(TX+18,TY+70);
  g.moveTo(TX+18,TY+36); g.lineTo(TX-16,TY+70); g.stroke();
  g.fillStyle=red; g.font='700 23px Georgia, ui-serif, serif'; g.textAlign='center';
  g.fillText(tr('mapDig'), TX+2, TY+100);

  // compass rose
  const NX=930, NY=598;
  g.strokeStyle=ink; g.lineWidth=2.6;
  g.beginPath(); g.arc(NX,NY,52,0,6.283); g.stroke();
  g.beginPath(); g.arc(NX,NY,42,0,6.283); g.stroke();
  g.fillStyle=ink;
  g.beginPath(); g.moveTo(NX,NY-46); g.lineTo(NX+13,NY); g.lineTo(NX,NY+46);
  g.lineTo(NX-13,NY); g.closePath(); g.fill();
  g.font='700 24px Georgia, ui-serif, serif';
  g.fillText('N',NX,NY-62); g.fillText('S',NX,NY+76);
  g.fillText('W',NX-72,NY+8); g.fillText('E',NX+72,NY+8);

  // legend at the foot
  g.fillStyle=ink2; g.font='italic 23px Georgia, ui-serif, serif'; g.textAlign='center';
  (function(){
    const words=tr('mapHint').split(' '), max=W-190, lines=[]; let cur='';
    words.forEach(w=>{
      const t2=cur? cur+' '+w : w;
      if(g.measureText(t2).width>max){ lines.push(cur); cur=w; } else cur=t2;
    });
    if(cur) lines.push(cur);
    lines.slice(0,2).forEach((ln,i)=> g.fillText(ln, W/2, H-72+i*30));
  })();
  MAPTEX=tex(c); MAPTEX.encoding=THREE.sRGBEncoding;
  return MAPTEX;
}

const ITEMS={
  map:    {icon:'\uD83D\uDDFA', build:mkMapItem,
           hand:[0.06,-0.90,0.22], hrot:[1.15,0,0.20], hs:0.72,
           view:[0.3,-0.34,-0.62], vs:1.5},
  shovel: {icon:'\u26CF',       build:mkShovel,
           hand:[0.04,-0.90,0.16], hrot:[0.30,0,0.50], hs:0.62,
           view:[0.50,-0.58,-1.30], vs:0.52, vrot:[0.10,0.55,2.25]},
  katana: {icon:'\u2694',       build:mkKatana,
           hand:[0.05,-0.92,0.18], hrot:[-0.55,0,0.45], hs:0.60,
           view:[0.40,-0.34,-1.05], vs:0.78, vrot:[0.18,-0.75,0.55]},
  golden: {icon:'\u2728',       build:mkGolden,
           hand:[0.03,-0.88,0.20], hrot:[0,0,0.15], hs:0.8,
           view:[0.40,-0.40,-0.62], vs:1.25},
  rod:    {icon:'\uD83C\uDFA3', build:mkRod,
           hand:[0.06,-0.92,0.16], hrot:[-0.9,0,0.06], hs:0.62,
           view:[0.30,-0.50,-0.52], vs:0.5, vrot:[-1.12,0,0.14]},
  beer:   {icon:'\uD83C\uDF7A', build:mkBeer,
           hand:[0.03,-0.88,0.18], hrot:[0,0,0.10], hs:0.70,
           view:[0.42,-0.44,-0.7], vs:1.1},
  fragment:{icon:'\uD83D\uDFE1', build:mkFragment,
           hand:[0.03,-0.90,0.18], hrot:[0,0,0], hs:0.8,
           view:[0.38,-0.40,-0.80], vs:1.0},
  guitar: {icon:'\uD83C\uDFB8', build:mkGuitarItem,
           hand:[0.09,-0.84,0.26], hrot:[0.10,0,-1.05], hs:0.60,
           view:[0.34,-0.52,-1.35],vs:0.62, vrot:[0.22,-0.9,0.55]}
};

/* the inventory is part of the progress: a reload halfway through a quest
   used to empty your hands and leave the quest with nothing to hand in */
function saveInv(){ try{ store.set('optimum-world:inv', JSON.stringify(INV)); }catch(e){} }
function giveItem(id){
  /* refreshed at the end of this function too; picking something up is the
     one moment the button most needs to notice */
  if(INV.indexOf(id)>=0) return false;
  if(INV.length>=7) return false;
  INV.push(id); drawHotbar(); saveInv();
  if(!playSfx('pickup',0.62)) blip(659,0.16,'sine',0.11);
  return true;
}
function hasItem(id){ return INV.indexOf(id)>=0; }
function takeItem(id){
  const i=INV.indexOf(id); if(i<0) return;
  INV.splice(i,1); if(HELD===id) equip(null); drawHotbar(); saveInv();
}
let handSide='R';
/* The close selfie pose throws the right arm up to hold the camera, which used
   to drag the guitar or the mug across the shot. In that pose the prop moves to
   the other hand, mirrored. */
function mountHand(side){
  if(!handItem || !aParts || !HELD || !ITEMS[HELD]) return;
  const arm=(side==='L') ? aParts.armL : aParts.armR;
  if(handItem.parent!==arm) arm.add(handItem);
  const def=ITEMS[HELD], m=(side==='L') ? -1 : 1, hr=def.hrot||[0,0,0];
  handItem.position.set(def.hand[0]*m, def.hand[1], def.hand[2]);
  handItem.rotation.set(hr[0], hr[1]*m, hr[2]*m);
  handSide=side;
}
function equip(id){
  swingT=0;
  if(handItem){ handItem.parent&&handItem.parent.remove(handItem); handItem=null; }
  if(viewItem){ viewItem.parent&&viewItem.parent.remove(viewItem); viewItem=null; }
  HELD = (HELD===id) ? null : id;
  if(HELD && ITEMS[HELD]){
    const def=ITEMS[HELD];
    if(aParts&&aParts.armR){
      handItem=new THREE.Group();
      handItem.position.set(def.hand[0],def.hand[1],def.hand[2]);
      const hr=def.hrot||[0,0,0];
      handItem.rotation.set(hr[0],hr[1],hr[2]);
      handItem.scale.setScalar(def.hs||1);
      def.build(handItem); aParts.armR.add(handItem);
    }
    viewItem=new THREE.Group();
    viewItem.position.set(def.view[0],def.view[1],def.view[2]);
    viewItem.scale.setScalar(def.vs);
    const vr=def.vrot||[0.2,-0.4,0.15];
    viewItem.rotation.set(vr[0],vr[1],vr[2]);
    def.build(viewItem); camera.add(viewItem);
  }
  drawHotbar();
}
let drinking=0;
function drinkBeer(){
  if(drinking) return;
  drinking=1;
  const t0=performance.now();
  if(!playSfx('gulp',0.75,1.0,0.42)){
    blip(220,0.18,'sine',0.07);
    setTimeout(()=>blip(180,0.22,'sine',0.06),260);
  }
  const step=()=>{
    const e=(performance.now()-t0)/1000;
    const k=Math.min(1,e/0.45), back=Math.max(0,Math.min(1,(e-1.05)/0.45));
    const a=k-back;                       // 0 down, 1 at the lips
    const V=ITEMS.beer.view;
    if(viewItem){
      viewItem.rotation.x = 0.2 + a*1.25;              // tip it toward the face
      viewItem.rotation.z = -a*0.30;
      viewItem.position.set(V[0]-a*0.30, V[1]+a*0.34, V[2]+a*0.26);
    }
    if(handItem){ handItem.rotation.x = a*1.1; }
    if(aParts&&aParts.armR) aParts.armR.rotation.x = -a*1.5;
    if(e<1.55) requestAnimationFrame(step);
    else {
      if(viewItem){ const vr=ITEMS.beer.vrot||[0.2,-0.4,0.15];
        viewItem.rotation.set(vr[0],vr[1],vr[2]); viewItem.position.set(V[0],V[1],V[2]); }
      if(handItem) handItem.rotation.x=0;
      drinking=0;
      drink();
    }
  };
  step();
}
let strumming=0;
function strum(){
  if(strumming) return;
  strumming=1;
  // a simple country progression rather than one run up the scale
  const chords=[[196,247,294],[262,330,392],[220,277,330],[294,370,440]];
  /* the recorded chord is a C, so the rate is just the root over 262 */
  if(SBUF.strum) chords.forEach((ch,i)=> playSfx('strum',0.55,ch[0]/262,i*0.42));
  else chords.forEach((ch,i)=>{
    ch.forEach((f,k)=> setTimeout(()=>blip(f,0.42,'triangle',0.075), i*420+k*26));
    setTimeout(()=>blip(ch[0]*2,0.3,'triangle',0.05), i*420+210);
  });
  const t0=performance.now();
  const step=()=>{
    const e=(performance.now()-t0)/1000, sw=Math.sin(e*11.0);
    const V=ITEMS.guitar.view;
    if(viewItem){
      viewItem.rotation.z=0.15+sw*0.16;
      viewItem.rotation.x=0.2+Math.sin(e*3.2)*0.06;
      viewItem.position.set(V[0]+sw*0.03, V[1]+Math.abs(sw)*0.04, V[2]);
    }
    if(handItem) handItem.rotation.z=sw*0.3;
    if(aParts&&aParts.armR) aParts.armR.rotation.x=-0.7+sw*0.45;
    if(e<1.75) requestAnimationFrame(step);
    else {
      const V2=ITEMS.guitar.view;
      if(viewItem){ const vr=ITEMS.guitar.vrot||[0.2,-0.4,0.15];
        viewItem.rotation.set(vr[0],vr[1],vr[2]); viewItem.position.set(V2[0],V2[1],V2[2]); }
      if(handItem) handItem.rotation.z=0;
      strumming=0;
    }
  };
  step();
}
function drawHotbar(){
  const bar=$('hotbar'); if(!bar) return;
  bar.innerHTML='';
  bar.style.display = INV.length? 'flex' : 'none';
  INV.forEach((id,i)=>{
    const d=document.createElement('div');
    d.className='slot'+(HELD===id?' on':'');
    d.innerHTML='<b>'+(i+1)+'</b><span>'+ITEMS[id].icon+'</span>';
    d.addEventListener('click',e=>{
      e.stopPropagation();
      if(id==='map' && HELD==='map'){ mapOpen? closeMap() : openMap(); return; }
      equip(id);
      if(id==='map') openMap();          // picking up the map shows it straight away
    });
    bar.appendChild(d);
  });
  updateHitBtn();
}
function openMap(){
  const im=$('mapImg');
  if(!im.src) im.src=mapTexture().image.toDataURL('image/png');   // once, not per frame
  mapOpen=true; $('mapView').style.display='flex'; freeCursor();
}
function closeMap(){ mapOpen=false; $('mapView').style.display='none'; }
