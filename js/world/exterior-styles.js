/* ------------------------------ EXTERIOR STYLES ------------------------------ */
const STYLE = {
  drum(g,w,d,h,acc){
    Cyl(g,w*0.40,w*0.40,2.6,20,M.trim,0,h+1.7,-1);
    Cyl(g,w*0.27,w*0.27,3.6,20,new THREE.MeshLambertMaterial({color:acc}),0,h+4.6,-1);
    Cyl(g,w*0.46,w*0.46,0.5,20,M.dark,0,h+6.7,-1);
  },
  tower(g,w,d,h,acc){
    B(g,w*0.6,9,d*0.6,M.wall,0,h+5,-1,false,true);
    B(g,w*0.38,6,d*0.38,M.wall,0,h+12.5,-1,false,true);
    B(g,w*0.42,0.6,d*0.42,new THREE.MeshLambertMaterial({color:acc}),0,h+15.8,-1,false,true);
    Cyl(g,.1,.1,4,8,M.dark,0,h+17.8,-1,false);
  },
  blade(g,w,d,h,acc){
    const f=B(g,1.4,22,d*0.72,M.wall,-w*0.3,h+9,-1,false,true); f.rotation.z=0.12;
    const s=B(g,0.5,22,d*0.2,new THREE.MeshLambertMaterial({color:acc}),-w*0.3+1.0,h+9,-1,false,false); s.rotation.z=0.12;
    B(g,w*0.5,5,d*0.5,M.wall,w*0.18,h+3.0,-1,false,true);
  },
  arch(g,w,d,h,acc){
    const lg=w/2+2.6;
    B(g,1.6,h+7,1.6,M.wall,-lg,(h+7)/2,d/2+3.4,true,true);
    B(g,1.6,h+7,1.6,M.wall, lg,(h+7)/2,d/2+3.4,true,true);
    B(g,lg*2+1.6,1.6,1.6,M.wall,0,h+7,d/2+3.4,false,true);
    B(g,lg*2,0.5,0.5,new THREE.MeshLambertMaterial({color:acc}),0,h+6.0,d/2+3.4,false,false);
  },
  stack(g,w,d,h,acc){
    B(g,w*0.78,3.4,d*0.78,M.wall,-2.0,h+2.0,-1.5,false,true);
    B(g,w*0.6,3.2,d*0.6,M.wall,2.1,h+5.2,0.7,false,true);
    B(g,w*0.42,2.8,d*0.42,M.wall,-1.1,h+8.1,-2.0,false,true);
    B(g,w*0.44,0.5,d*0.44,new THREE.MeshLambertMaterial({color:acc}),-1.1,h+9.7,-2.0,false,false);
  },
  zig(g,w,d,h,acc){
    for(let i=0;i<4;i++){
      const k=1-i*0.18;
      B(g,w*k,1.8,d*k,M.wall,0,h+1.0+i*1.9,-1,false,true);
      B(g,w*k+0.25,0.18,d*k+0.25,new THREE.MeshLambertMaterial({color:acc}),0,h+1.95+i*1.9,-1,false,false);
    }
  },
  villa(g,w,d,h,acc){
    B(g,w+2.4,0.9,d+2.4,M.trim,0,h+0.45,0,false,true);
    B(g,w*0.5,3.6,d*0.5,M.wall,-w*0.14,h+2.8,-1.8,false,true);
    B(g,w*0.54,0.4,d*0.54,new THREE.MeshLambertMaterial({color:acc}),-w*0.14,h+4.8,-1.8,false,false);
  },
  pod(g,w,d,h,acc){
    Cyl(g,w*0.44,w*0.44,1.8,18,M.trim,0,h+1.0,-0.6);
    const dm=new THREE.Mesh(new THREE.SphereGeometry(w*0.33,20,12,0,Math.PI*2,0,Math.PI/2),M.metal);
    dm.position.set(0,h+1.9,-0.6); g.add(dm);
    B(g,w*0.12,0.4,d+3.4,new THREE.MeshLambertMaterial({color:acc}),0,h+0.25,0,false,false);
  },
  cube(g,w,d,h,acc){
    B(g,w+1.8,0.8,d+1.8,M.trim,0,h+0.4,0,false,true);
    B(g,w*0.46,2.2,d*0.46,M.wall,0,h+1.9,-1,false,true);
    B(g,w*0.5,0.35,d*0.5,new THREE.MeshLambertMaterial({color:acc}),0,h+3.1,-1,false,false);
  }
};

/* a stand in portrait for a resident who never uploaded a picture */
function initialTex(nick,accentHex){
  const S=512, c=cvs(S,S), g=c.getContext('2d');
  g.fillStyle='#EFEDE8'; g.fillRect(0,0,S,S);
  g.fillStyle=accentHex; g.beginPath(); g.arc(S/2,S/2,146,0,6.283); g.fill();
  g.fillStyle='#FFFBFB'; g.textAlign='center'; g.textBaseline='middle';
  g.font='800 168px ui-sans-serif, Helvetica, Arial';
  g.fillText(((nick||'?').trim().charAt(0)||'?').toUpperCase(), S/2, S/2+10);
  return tex(c);
}
/* every community house now shows whose house it is */
/* the katana on its stand, in samurai.itan's own house */
function katanaStand(g,acc,ez,worldX,worldZ,yaw){
  // in front of the rope, on the visitor side, or it cannot be reached at all
  const LX=5.4, LZ=4.4;
  const w=new THREE.MeshLambertMaterial({color:0x5A4A2E});
  B(g,1.9,0.16,0.5,w,LX,0.92,LZ,false,true);
  B(g,0.22,0.92,0.4,w,LX-0.8,0.5,LZ,false,true);
  B(g,0.22,0.92,0.4,w,LX+0.8,0.5,LZ,false,true);
  const kg=new THREE.Group(); kg.position.set(LX,1.2,LZ); kg.rotation.z=Math.PI/2; g.add(kg);
  mkKatana(kg);
  g.userData.katana=kg;
  const cy=Math.cos(yaw||0), sy=Math.sin(yaw||0);
  spots.push({x:worldX + LX*cy + LZ*sy,
              z:worldZ - LX*sy + LZ*cy,
              r:3.2, katanaPick:1, accent:C.mint,
              data:{name:'katana'}, hide:kg, prio:1});
}
function residentRoom(g,acc,ez,o){
  const accM=new THREE.MeshLambertMaterial({color:acc});
  const bz=ez-4.5;
  B(g,10.4,6.0,0.28,new THREE.MeshLambertMaterial({color:0xEFEDE8}),0,3.9,bz-0.26,false,true);
  B(g,10.4,0.18,0.36,accM,0,1.1,bz-0.24,false,false);
  B(g,4.3,4.3,0.32,M.dark,0,4.1,bz,false,true);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(3.82,3.82),
    new THREE.MeshBasicMaterial({map: o.img ? sharpTex(o.img,640) : initialTex(o.nick,hx(acc))}));
  face.position.set(0,4.1,bz+0.18); g.add(face);
  if(o.ref){ o.ref.face=face; o.ref.faceAcc=acc; o.ref.shownImg=o.img||''; }
  Cyl(g,.08,.08,0.85,8,M.dark,0,6.62,bz+0.85,false);
  B(g,0.48,0.13,0.48,new THREE.MeshLambertMaterial({color:0xFFF3E2}),0,6.22,bz+0.85,false,false);
  B(g,4.4,1.0,1.5,M.trim,0,0.5,bz+2.7,false,true);
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(3.9,1.22),
    new THREE.MeshBasicMaterial({map:plateTexture({title:o.nick,author:(o.role||'')+(o.handle?('   '+o.handle):'')},hx(acc)),transparent:true,toneMapped:false}));
  plate.position.set(0,1.09,bz+2.64); plate.rotation.x=-Math.PI/3.0; g.add(plate);
  // blobs, not flat glowing squares
  const blobM=new THREE.MeshPhongMaterial({color:acc,shininess:62,specular:0x93a2b3});
  const orbs=[];
  for(let i=0;i<4;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.3,16,12),blobM);
    m.scale.y=0.86; g.add(m); orbs.push(m);
  }
  anims.push(t=>{ orbs.forEach((m,i)=>{ const a=t*0.5+i/4*Math.PI*2;
    m.position.x=Math.cos(a)*3.4; m.position.z=ez+1.6+Math.sin(a)*1.4;
    m.position.y=1.7+Math.sin(t*1.3+i)*0.3; }); });
}
