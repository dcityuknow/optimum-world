/* ---------------------- PROCEDURAL SURFACE LIBRARY ----------------------
   Everything used to be flat Lambert colour, which is why the world read as an
   untextured blockout. Each surface now gets a colour map plus a normal map
   derived from the same heightfield, so the sun actually catches the material. */
let PBR=true;                 // standard materials + env light, dropped on weak GPUs
let USE_NM=true;              // normal maps: the pricey half of the standard shader
function nm(t){ return USE_NM ? t : null; }
const TXC={};                 // texture cache, built once

function noiseFill(g,W,H,n,rMax,a,b){
  for(let i=0;i<n;i++){
    const x=Math.random()*W, y=Math.random()*H, r=Math.random()*rMax;
    g.fillStyle = Math.random()<0.5 ? a : b;
    g.beginPath(); g.arc(x,y,r,0,6.283); g.fill();
  }
}
/* sobel the luminance of a canvas into a tangent space normal map */
function heightToNormal(src,strength){
  const W=src.width,H=src.height;
  const sg=src.getContext('2d'), d=sg.getImageData(0,0,W,H).data;
  const out=cvs(W,H), og=out.getContext('2d'), od=og.createImageData(W,H);
  const lum=new Float32Array(W*H);
  for(let i=0;i<W*H;i++) lum[i]=(d[i*4]*0.299+d[i*4+1]*0.587+d[i*4+2]*0.114)/255;
  const k=strength||1.6;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const xl=(x-1+W)%W, xr=(x+1)%W, yu=(y-1+H)%H, yd=(y+1)%H;
    const dx=(lum[y*W+xr]-lum[y*W+xl])*k;
    const dy=(lum[yd*W+x]-lum[yu*W+x])*k;
    let nx=-dx, ny=-dy, nz=1;
    const l=Math.sqrt(nx*nx+ny*ny+nz*nz); nx/=l; ny/=l; nz/=l;
    const i=(y*W+x)*4;
    od.data[i]=(nx*0.5+0.5)*255; od.data[i+1]=(ny*0.5+0.5)*255;
    od.data[i+2]=(nz*0.5+0.5)*255; od.data[i+3]=255;
  }
  og.putImageData(od,0,0);
  const t=new THREE.CanvasTexture(out);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=MAXANISO;
  return t;
}
function srgb(c,rx,ry){
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=MAXANISO;
  t.encoding=THREE.sRGBEncoding;
  if(rx) t.repeat.set(rx,ry||rx);
  return t;
}
/* Returns {map, normalMap, uvScale}. uvScale is texture tiles per world unit:
   B/Plane rewrite their UVs with it, so a 200m road and a 2m table end up with
   the same grain size instead of one looking smeared and the other like sandpaper. */
function surf(name,build,uvScale,nStrength){
  if(TXC[name]) return TXC[name];
  const c=build();
  const map=srgb(c);
  const nrm=heightToNormal(c,nStrength);
  return (TXC[name]={map:map, normalMap:nrm, uvScale:uvScale});
}
/* BoxGeometry face order is +X -X +Y -Y +Z -Z, four verts each */
function uvScaleBox(geo,w,h,d,s){
  const uv=geo.attributes.uv;
  const dim=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++){
    const su=dim[f][0]*s, sv=dim[f][1]*s;
    for(let i=0;i<4;i++){ const k=f*4+i; uv.setXY(k, uv.getX(k)*su, uv.getY(k)*sv); }
  }
  uv.needsUpdate=true;
}
function uvScalePlane(geo,w,h,s){
  const uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*w*s, uv.getY(i)*h*s);
  uv.needsUpdate=true;
}

function bakeStucco(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#F2F3F4'; g.fillRect(0,0,W,W);
  noiseFill(g,W,W,11000,3.1,'rgba(157,176,194,0.30)','rgba(255,251,251,0.60)');
  noiseFill(g,W,W,1800,7.0,'rgba(176,190,209,0.16)','rgba(255,251,251,0.24)');
  // panel seam on the tile edge: turns the repeat into cladding
  g.strokeStyle='rgba(157,176,194,0.34)'; g.lineWidth=2.5;
  g.beginPath(); g.moveTo(0,0.5); g.lineTo(W,0.5); g.moveTo(0.5,0); g.lineTo(0.5,W); g.stroke();
  g.strokeStyle='rgba(255,251,251,0.40)'; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(0,3); g.lineTo(W,3); g.moveTo(3,0); g.lineTo(3,W); g.stroke();
  return c;
}
function bakePaint(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#F6F8FB'; g.fillRect(0,0,W,W);
  noiseFill(g,W,W,5200,1.7,'rgba(206,214,224,0.16)','rgba(255,255,255,0.30)');
  return c;
}
function bakeAsphalt(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#7E8C9B'; g.fillRect(0,0,W,W);
  noiseFill(g,W,W,16000,2.6,'rgba(40,44,52,0.36)','rgba(176,190,209,0.34)');
  noiseFill(g,W,W,2600,4.6,'rgba(35,38,45,0.24)','rgba(211,219,226,0.14)');
  return c;
}
function bakeConcrete(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#D3DBE2'; g.fillRect(0,0,W,W);
  noiseFill(g,W,W,9000,2.2,'rgba(140,157,175,0.22)','rgba(255,251,251,0.40)');
  g.strokeStyle='rgba(122,138,156,0.40)'; g.lineWidth=4;
  g.beginPath(); g.moveTo(0,W/2); g.lineTo(W,W/2); g.moveTo(W/2,0); g.lineTo(W/2,W); g.stroke();
  g.strokeStyle='rgba(255,251,251,0.36)'; g.lineWidth=2;
  g.beginPath(); g.moveTo(0,W/2+4); g.lineTo(W,W/2+4); g.moveTo(W/2+4,0); g.lineTo(W/2+4,W); g.stroke();
  return c;
}
function bakeWood(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#907B60'; g.fillRect(0,0,W,W);
  for(let i=0;i<190;i++){
    const y=Math.random()*W, h=0.6+Math.random()*2.6;
    g.fillStyle = Math.random()<0.5 ? 'rgba(96,78,58,0.34)' : 'rgba(184,164,136,0.26)';
    g.beginPath();
    for(let x=0;x<=W;x+=8){
      const yy=y+Math.sin(x*0.017+i)*3.2;
      x===0? g.moveTo(x,yy) : g.lineTo(x,yy);
    }
    g.lineTo(W,y+h); g.lineTo(0,y+h); g.closePath(); g.fill();
  }
  for(let i=0;i<6;i++){
    const x=Math.random()*W, y=Math.random()*W;
    for(let r=3;r<20;r+=3){
      g.strokeStyle='rgba(104,78,52,0.20)'; g.lineWidth=1.4;
      g.beginPath(); g.ellipse(x,y,r,r*0.55,0.5,0,6.283); g.stroke();
    }
  }
  return c;
}
function bakeWeaveLight(){
  const W=256,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#EAEDF0'; g.fillRect(0,0,W,W);
  for(let y=0;y<W;y+=4){ g.fillStyle='rgba(196,206,216,0.32)'; g.fillRect(0,y,W,2); }
  for(let x=0;x<W;x+=4){ g.fillStyle='rgba(255,255,255,0.30)'; g.fillRect(x,0,2,W); }
  noiseFill(g,W,W,2400,1.3,'rgba(186,198,210,0.18)','rgba(255,255,255,0.20)');
  return c;
}
function bakeWeave(){
  const W=256,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#9DB0C2'; g.fillRect(0,0,W,W);
  for(let y=0;y<W;y+=4){ g.fillStyle='rgba(120,142,166,0.34)'; g.fillRect(0,y,W,2); }
  for(let x=0;x<W;x+=4){ g.fillStyle='rgba(178,196,214,0.26)'; g.fillRect(x,0,2,W); }
  noiseFill(g,W,W,2400,1.3,'rgba(96,116,140,0.20)','rgba(206,220,234,0.20)');
  return c;
}
function bakeBrushed(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#A9B7C6'; g.fillRect(0,0,W,W);
  // thicker, fainter strokes: one pixel lines turn into heavy moire bands as
  // soon as the surface is more than a few metres away
  for(let i=0;i<520;i++){
    const y=Math.random()*W;
    g.strokeStyle = Math.random()<0.5 ? 'rgba(140,153,168,0.10)' : 'rgba(226,236,246,0.10)';
    g.lineWidth=2.5+Math.random()*4.5;
    g.beginPath(); g.moveTo(0,y); g.lineTo(W,y+(Math.random()-0.5)*2); g.stroke();
  }
  return c;
}
function bakeTile(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle='#DCE2E8'; g.fillRect(0,0,W,W);
  noiseFill(g,W,W,7000,1.9,'rgba(150,166,184,0.20)','rgba(255,251,251,0.40)');
  const n=4, s=W/n;
  for(let i=0;i<=n;i++){
    g.strokeStyle='rgba(124,141,160,0.34)'; g.lineWidth=3;
    g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s,W); g.moveTo(0,i*s); g.lineTo(W,i*s); g.stroke();
    g.strokeStyle='rgba(255,251,251,0.32)'; g.lineWidth=1.6;
    g.beginPath(); g.moveTo(i*s+2,0); g.lineTo(i*s+2,W); g.moveTo(0,i*s+2); g.lineTo(W,i*s+2); g.stroke();
  }
  return c;
}
function bakeGround(){
  const W=512,c=cvs(W,W),g=c.getContext('2d');
  g.fillStyle=hx(SEASONS[SEASON].ground); g.fillRect(0,0,W,W);
  noiseFill(g,W,W,14000,2.3,'rgba(146,161,178,0.24)','rgba(255,251,251,0.44)');
  noiseFill(g,W,W,2200,6.0,'rgba(157,176,194,0.12)','rgba(255,251,251,0.16)');
  return c;
}
/* material factory: real PBR when the GPU can take it, Lambert when it cannot */
function SM(o){
  if(!PBR){
    const p={color:o.color, map:o.map};
    if(o.emissive) p.emissive=o.emissive;
    const lm=new THREE.MeshLambertMaterial(p);
    if(o.uvScale) lm.userData.uvScale=o.uvScale;
    return lm;
  }
  const p={
    color:o.color!==undefined?o.color:0xffffff,
    map:o.map||null, normalMap:nm(o.normalMap)||null,
    roughness:o.roughness!==undefined?o.roughness:0.88,
    metalness:o.metalness!==undefined?o.metalness:0.0
  };
  if(o.normalScale) p.normalScale=new THREE.Vector2(o.normalScale,o.normalScale);
  if(o.emissive) p.emissive=o.emissive;
  const sm=new THREE.MeshStandardMaterial(p);
  sm.envMapIntensity = o.envMapIntensity!==undefined ? o.envMapIntensity
                     : (p.metalness>0.5 ? 1.0 : 0.28);
  if(o.uvScale) sm.userData.uvScale=o.uvScale;
  return sm;
}

function groundTexture(){
  const c=cvs(256,256), g=c.getContext('2d');
  g.fillStyle=hx(SEASONS[SEASON].ground); g.fillRect(0,0,256,256);
  for(let i=0;i<3600;i++){
    const x=Math.random()*256, y=Math.random()*256, r=Math.random()*2.1;
    g.fillStyle = Math.random()<0.5 ? 'rgba(150,134,106,0.26)' : 'rgba(255,250,236,0.42)';
    g.beginPath(); g.arc(x,y,r,0,6.283); g.fill();
  }
  g.strokeStyle='rgba(146,132,108,0.16)'; g.lineWidth=2;
  for(let i=0;i<=256;i+=128){ g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.stroke();
                              g.beginPath();g.moveTo(0,i);g.lineTo(256,i);g.stroke(); }
  const t=tex(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(160,160); return t;
}
function floorTexture(){
  const c=cvs(256,256), g=c.getContext('2d');
  g.fillStyle='#C6B79C'; g.fillRect(0,0,256,256);
  for(let i=0;i<2200;i++){
    const x=Math.random()*256, y=Math.random()*256, r=Math.random()*1.7;
    g.fillStyle = Math.random()<0.5 ? 'rgba(138,124,101,0.26)' : 'rgba(255,248,232,0.42)';
    g.beginPath(); g.arc(x,y,r,0,6.283); g.fill();
  }
  g.strokeStyle='rgba(110,98,78,0.42)'; g.lineWidth=3;
  for(let i=0;i<=256;i+=64){ g.beginPath();g.moveTo(i,0);g.lineTo(i,256);g.stroke();
                             g.beginPath();g.moveTo(0,i);g.lineTo(256,i);g.stroke(); }
  g.strokeStyle='rgba(255,250,240,0.30)'; g.lineWidth=1;
  for(let i=0;i<=256;i+=64){ g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,256);g.stroke();
                             g.beginPath();g.moveTo(0,i+2);g.lineTo(256,i+2);g.stroke(); }
  const t=tex(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(4,4); return t;
}
function skyTexture(){
  const c=cvs(4,256), g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#9BBEDF'); gr.addColorStop(0.5,'#C8D9E9'); gr.addColorStop(1,'#EDEFF0');
  g.fillStyle=gr; g.fillRect(0,0,4,256);
  return tex(c);
}

const OPT_GLYPH='assets/images/brand/optimum-glyph.png';
