/* ------------------------------ SEASON DRESSING ------------------------------
   A tint on the grass says very little on its own. Snow sits on the roofs in
   winter, leaves collect under the trees in autumn, the canopies carry
   blossom in spring, and in both autumn and spring something is always
   drifting down past you. One material per kind, world wide. */
const SNOW_MAT=new THREE.MeshLambertMaterial({color:0xF4F8FC});
let LITTER_MAT=null, BLOSSOM_MAT=null;
function litterMat(){
  if(!LITTER_MAT) LITTER_MAT=new THREE.MeshLambertMaterial({
    color:SEASONS[SEASON].leaf, transparent:true, opacity:0.72});
  return LITTER_MAT;
}
function blossomMat(){
  if(!BLOSSOM_MAT) BLOSSOM_MAT=new THREE.MeshLambertMaterial({
    color:0xF7C6D8, transparent:true, opacity:0.5, depthWrite:false});
  return BLOSSOM_MAT;
}
/* the ring of fallen leaves, or the cap of blossom, that goes with one tree */
/* Collected rather than added: every tree's dressing goes into one list and
   is merged into a single mesh once the whole street is planted. */
const LITTER=[], LITTER_M=[], BLOOM=[], BLOOM_M=[];
function dressTree(x,z,sc,rf){
  if(!FX()) return;
  if(SEASON==='autumn'){
    for(let i=0;i<3;i++){
      LITTER.push(new THREE.CircleGeometry(1,9));
      LITTER_M.push(new THREE.Matrix4().compose(
        new THREE.Vector3(x+(rf()-0.5)*4.6*sc, 0.035, z+(rf()-0.5)*4.6*sc),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,rf()*6.283)),
        new THREE.Vector3(1.4+rf()*2.0, 1.2+rf()*1.8, 1)));
    }
  } else if(SEASON==='spring'){
    BLOOM.push(new THREE.SphereGeometry(3.3,8,6));
    BLOOM_M.push(new THREE.Matrix4().compose(
      new THREE.Vector3(x, 5.4*sc, z), new THREE.Quaternion(),
      new THREE.Vector3(sc*1.06,sc*1.06,sc*1.06)));
  }
}
function flushDressing(){
  if(LITTER.length){ scene.add(new THREE.Mesh(mergeGeos(LITTER,LITTER_M), litterMat()));
    LITTER.length=0; LITTER_M.length=0; }
  if(BLOOM.length){ scene.add(new THREE.Mesh(mergeGeos(BLOOM,BLOOM_M), blossomMat()));
    BLOOM.length=0; BLOOM_M.length=0; }
}
/* petals in spring, leaves in autumn: one Points object that rides along
   with the camera, the same trick the rain already uses */
const DRIFTS={
  autumn:{n:170, size:0.62, col:null,     fall:2.3,  sway:1.5,  op:0.85, tex:'leaf'},
  spring:{n:130, size:0.50, col:0xF7C6D8, fall:1.5,  sway:1.5,  op:0.85, tex:'petal'},
  /* summer is pollen and dust caught in the light: it hangs rather than
     falls, which is why the fall rate is almost nothing */
  summer:{n:150, size:0.26, col:0xFFF0C8, fall:0.28, sway:1.1,  op:0.55, tex:'dot'},
  /* winter keeps a thin flurry going even on a clear day */
  winter:{n:120, size:0.34, col:0xFFFFFF, fall:1.1,  sway:1.9,  op:0.6,  tex:'flake'}
};
function makeDrift(){
  if(WEATHER==='rain'||WEATHER==='snow') return;   // one thing in the air at a time
  const D=DRIFTS[SEASON]; if(!D) return;
  const fall=SEASON==='autumn', n=D.n;
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    pos[i*3]=(Math.random()-0.5)*150;
    pos[i*3+1]=Math.random()*26;
    pos[i*3+2]=(Math.random()-0.5)*150;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const p=new THREE.Points(geo,new THREE.PointsMaterial({
    color: D.col===null ? SEASONS.autumn.leaf : D.col, size: D.size*2.4,
    map:spriteTex(D.tex), alphaTest:0.12, depthWrite:false,
    transparent:true, opacity:D.op, fog:true }));
  scene.add(p);
  const arr=geo.attributes.position.array;
  anims.push((t,dt)=>{
    if(!camera) return;
    for(let i=0;i<n;i++){
      arr[i*3+1]-=D.fall*dt;
      /* a leaf does not drop straight: it slides sideways as it turns over */
      arr[i*3]  +=Math.sin(t*1.5+i)*D.sway*dt;
      arr[i*3+2]+=Math.cos(t*1.2+i*0.7)*D.sway*dt;
      if(arr[i*3+1]<0){
        arr[i*3+1]=26;
        arr[i*3]=camera.position.x+(Math.random()-0.5)*150;
        arr[i*3+2]=camera.position.z+(Math.random()-0.5)*150;
      }
    }
    geo.attributes.position.needsUpdate=true;
  });
}
