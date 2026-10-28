/* ------------------------------ MIRETU ------------------------------ */
/* The Optimum mark itself, recoloured: the brand file is white, so it is
   copied onto a canvas and filled with the colour through its own alpha.
   It decodes asynchronously, so whoever draws it asks again until it is in. */
const ICONTINT={};
function iconTint(col){
  if(ICONTINT[col]) return ICONTINT[col];
  if(!OPTIMG){ OPTIMG=new Image(); OPTIMG.src=OPT_ICON; }
  if(!OPTIMG.complete || !OPTIMG.naturalWidth) return null;
  const c=cvs(616,336), g=c.getContext('2d');
  g.drawImage(OPTIMG,0,0,616,336);
  g.globalCompositeOperation='source-in'; g.fillStyle=col; g.fillRect(0,0,616,336);
  return (ICONTINT[col]=c);
}
function whenIcon(col,fn){ const go=()=>{ const ic=iconTint(col); if(ic) fn(ic); else setTimeout(go,150); }; go(); }
function maskTex(){
  const c=cvs(256,96), g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,96); gr.addColorStop(0,'#EEEBFF'); gr.addColorStop(1,'#C9C4F0');
  g.fillStyle=gr; g.fillRect(0,0,256,96);
  const t=tex(c); t.encoding=THREE.sRGBEncoding;
  whenIcon('#1E2025',ic=>{ const w=132, h=w*336/616; g.drawImage(ic,128-w/2,48-h/2,w,h); t.needsUpdate=true; });
  return t;
}
/* a mask for a head of width w: the goggle front and the strap round it */
function mkMask(w,d){
  const g=new THREE.Group();
  const face=new THREE.MeshLambertMaterial({map:maskTex()});
  const body=new THREE.MeshLambertMaterial({color:0xD8D4F6});
  const strap=new THREE.MeshLambertMaterial({color:0x353A70});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w*1.06,w*0.3,0.16),[body,body,body,body,face,body]));
  g.children[0].position.z=d/2+0.05;
  const sm=new THREE.Mesh(new THREE.BoxGeometry(w*1.04,w*0.12,d*1.04),strap); g.add(sm);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return g;
}
function wearMask(){
  if(!avatar || avatar.userData.mask) return;
  const m=mkMask(0.64,0.6);
  m.position.set(0, avatar.userData.cap ? 2.33 : 2.41, 0);
  avatar.add(m); avatar.userData.mask=m;
}
